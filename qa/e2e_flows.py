import asyncio, json, os, re, sys
from playwright.async_api import async_playwright

BASE = os.environ.get('BASE', 'http://localhost:5178')
PROPOSAL = "Hi Sarah,\n\nThanks for the details of your dashboard project.\n\nBest regards,\nAnn"
calls = []
state = {'verified': False, 'authed': False, 'items': [], 'status': {}}

async def api(route):
    r = route.request
    path = r.url.split('/api', 1)[-1].split('?')[0]
    body = r.post_data
    calls.append((r.method, path, body))
    J = lambda d, s=200: route.fulfill(status=s, json=d)
    if path == '/auth/register':
        state['authed'] = True
        return await J({'token': 'tok', 'user': {'id': 'u1', 'name': 'Ann Lee', 'email': 'ann@example.com', 'emailVerified': False, 'hasPassword': True}, 'verificationSent': True}, 201)
    if path == '/auth/me':
        return await J({'id': 'u1', 'name': 'Ann Lee', 'email': 'ann@example.com', 'profile': {}, 'emailVerified': state['verified'], 'hasPassword': True})
    if path == '/auth/providers': return await J({'google': False, 'github': False})
    if path == '/auth/resend-verification': return await J({'message': 'sent'})
    if path == '/auth/verify-email': state['verified'] = True; return await J({'emailVerified': True})
    if path == '/subscription/plans': return await J({'plans': json.load(open('/tmp/plans.json'))})
    if path == '/subscription':
        return await J({'subscription': {'plan': 'free', 'status': 'active', 'hasBillingAccount': False}, 'usage': {'proposalsToday': len(state['items'])},
                        'limits': {'dailyProposals': 5, 'dailyAnalyses': 10}, 'features': {}})
    if path == '/subscription/checkout': return await J({'message': 'This plan is not available yet.', 'comingSoon': True}, 400)
    if path == '/profile' and r.method == 'GET': return await J({'role': '', 'skills': '', 'preferredTone': 'Persuasive'})
    if path == '/profile' and r.method == 'PUT': return await J({'id': 'u1', 'profile': json.loads(body)})
    if path == '/proposals/generate':
        item = {'_id': f'{len(state["items"])+1:024x}', 'jobTitle': json.loads(body)['jobTitle'], 'clientName': json.loads(body).get('clientName', ''),
                'generatedProposal': PROPOSAL, 'status': 'draft', 'createdAt': '2026-09-26T09:00:00Z'}
        state['items'].insert(0, item)
        return await J({'id': item['_id'], 'proposal': PROPOSAL, 'isTemplate': False, 'createdAt': item['createdAt']})
    if path.startswith('/proposals/history'): return await J({'items': state['items'], 'nextCursor': None})
    if path.endswith('/share'): return await J({'shareToken': 'abc123', 'isPublic': True})
    if path.endswith('/status'): return await J({'proposal': {}})
    if path.startswith('/proposals/') and r.method == 'PUT': return await J({'proposal': {}})
    if path.startswith('/proposals/') and path.endswith('/send'): return await J({'message': 'Email sending is not set up yet.', 'notConfigured': True}, 503)
    return await J({})

def check(label, ok):
    print(('PASS ' if ok else 'FAIL ') + label)
    return ok

async def main():
    results = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        ctx = await b.new_context(viewport={'width': 1280, 'height': 900}, permissions=['clipboard-read', 'clipboard-write'])
        await ctx.route('**/api/**', api)
        pg = await ctx.new_page()
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append(m.text[:150]) if m.type == 'error' and 'Failed to load resource' not in m.text else None)

        # 1. Register
        await pg.goto(BASE + '/register', wait_until='networkidle')
        await pg.get_by_label('Full name').fill('Ann Lee')
        await pg.get_by_label('Email').fill('ann@example.com')
        await pg.get_by_label(re.compile(r'^Password')).fill('password123')
        await pg.get_by_label('Confirm password').fill('password123')
        await pg.get_by_role('button', name='Create account').click()
        await pg.wait_for_url('**/dashboard**', timeout=10000)
        results.append(check('1 register -> dashboard', '/dashboard' in pg.url))

        # 3. Dashboard + verification banner + resend
        await pg.wait_for_timeout(1500)
        body = await pg.inner_text('body')
        if 'Get set up' not in body or 'Welcome back, Ann' not in body: print('DEBUG url', pg.url, '| body:', body[:400].replace(chr(10), ' / '))
        results.append(check('3 dashboard shows greeting and setup checklist', 'Welcome back, Ann' in body and 'Get set up' in body))
        await pg.get_by_role('button', name='Resend link').click()
        await pg.wait_for_timeout(300)
        results.append(check('3 resend confirmation request sent', any(c[1] == '/auth/resend-verification' for c in calls)))
        await pg.goto(BASE + '/verify-email?token=' + 'a' * 64, wait_until='networkidle'); await pg.wait_for_timeout(400)
        results.append(check('2 email confirmation page confirms', 'confirmed' in (await pg.inner_text('body')).lower()))

        # 4-5. Create + generate (default tone comes from profile: Persuasive)
        await pg.goto(BASE + '/dashboard?tab=generate', wait_until='networkidle'); await pg.wait_for_timeout(600)
        tone = await pg.get_by_role('radio', name='Persuasive').get_attribute('aria-checked')
        results.append(check('4 default tone from profile (Persuasive)', tone == 'true'))
        await pg.locator('[data-action="generate"]').click()
        await pg.wait_for_timeout(300)
        results.append(check('4 validation blocks empty form', 'Add the job title.' in await pg.inner_text('body')))
        await pg.get_by_label('Job title').fill('React analytics dashboard')
        await pg.get_by_label('Job post').fill('We need a React developer to build an analytics dashboard with charts.')
        await pg.get_by_label('Client name').fill('Sarah Chen')
        await pg.locator('[data-action="generate"]').click()
        await pg.wait_for_timeout(800)
        gen = [c for c in calls if c[1] == '/proposals/generate']
        results.append(check('5 generate request carries form + tone', bool(gen) and json.loads(gen[-1][2])['tone'] == 'persuasive'))

        # 6. View result as a document
        doc_title = await pg.locator('#doc-title').inner_text()
        results.append(check('6 generated proposal shown as document', doc_title == 'React analytics dashboard'))

        # 7-8. Edit + save
        await pg.get_by_role('button', name='Edit', exact=True).click()
        editor = pg.get_by_label('Proposal text')
        await editor.fill(PROPOSAL + '\n\nP.S. Happy to share references.')
        results.append(check('7 edit shows unsaved state', 'Unsaved changes' in await pg.inner_text('body')))
        await pg.get_by_role('button', name='Done').click()
        await pg.wait_for_timeout(500)
        put = [c for c in calls if c[0] == 'PUT' and c[1].startswith('/proposals/')]
        results.append(check('8 save sends edited text', bool(put) and 'P.S.' in put[-1][2]))

        # 10. Share link + send dialog (email not configured)
        await pg.get_by_role('button', name='Copy share link').click()
        await pg.wait_for_timeout(400)
        clip = await pg.evaluate('navigator.clipboard.readText()')
        results.append(check('10 share link copied', clip.endswith('/p/abc123')))
        await pg.get_by_role('button', name='Send by email').click()
        await pg.get_by_label("Client's email").fill('client@example.com')
        await pg.get_by_role('button', name='Send', exact=True).click()
        await pg.wait_for_timeout(500)
        results.append(check('10 send shows honest not-configured message', 'Email sending is not set up yet' in await pg.inner_text('body')))
        await pg.keyboard.press('Escape')
        await pg.wait_for_timeout(200)
        results.append(check('   dialog closes with Escape', await pg.locator('[role="dialog"]').count() == 0))

        # 9. History + status change
        await pg.goto(BASE + '/dashboard?tab=history', wait_until='networkidle'); await pg.wait_for_timeout(500)
        await pg.get_by_role('button', name='React analytics dashboard').first.click()
        await pg.get_by_label('Status', exact=True).select_option('accepted')
        await pg.wait_for_timeout(400)
        results.append(check('9 history lists proposal and status update sent', any(c[1].endswith('/status') and 'accepted' in (c[2] or '') for c in calls)))

        # 11. Pricing: honest unavailable state
        await pg.goto(BASE + '/dashboard?tab=subscription', wait_until='networkidle'); await pg.wait_for_timeout(500)
        await pg.get_by_role('button', name='Upgrade to Starter').click()
        await pg.wait_for_timeout(500)
        results.append(check('11 checkout unavailable is explained', "Online payments aren't available yet" in await pg.inner_text('body')))

        # 12. Settings save
        await pg.goto(BASE + '/dashboard?tab=profile', wait_until='networkidle'); await pg.wait_for_timeout(500)
        await pg.get_by_label('Role').fill('Full-stack developer')
        await pg.get_by_role('button', name='Save profile').click()
        await pg.wait_for_timeout(400)
        prof = [c for c in calls if c[0] == 'PUT' and c[1] == '/profile']
        results.append(check('12 settings save sends profile', bool(prof) and 'Full-stack developer' in prof[-1][2]))

        # Keyboard: skip link, mobile drawer
        await pg.set_viewport_size({'width': 390, 'height': 844})
        await pg.goto(BASE + '/dashboard?tab=home', wait_until='networkidle'); await pg.wait_for_timeout(400)
        await pg.keyboard.press('Tab')
        results.append(check('   first Tab reaches skip link', (await pg.evaluate('document.activeElement.textContent')) == 'Skip to content'))
        await pg.keyboard.press('Tab')   # next stop: the menu button
        results.append(check('   second Tab reaches menu button', (await pg.evaluate("document.activeElement.getAttribute('aria-label')")) == 'Open menu'))
        await pg.keyboard.press('Enter')
        await pg.wait_for_timeout(300)
        results.append(check('   mobile drawer opens', await pg.get_by_role('dialog', name='Main navigation').count() == 1))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(200)
        results.append(check('   drawer closes with Escape', await pg.get_by_role('dialog').count() == 0))

        # 13. Logout
        await pg.get_by_role('button', name='Account menu').click()
        await pg.get_by_role('menuitem', name='Sign out').click()
        await pg.wait_for_url('**/login**', timeout=8000)
        results.append(check('13 sign out -> login, session cleared', (await pg.evaluate("localStorage.getItem('token')")) is None))

        # Public share view
        await pg.goto(BASE + '/p/abc123', wait_until='networkidle'); await pg.wait_for_timeout(400)
        results.append(check('10 public share page loads', await pg.locator('#public-title').count() == 1 or 'available' in await pg.inner_text('body')))

        # 404
        await pg.goto(BASE + '/this-does-not-exist', wait_until='networkidle'); await pg.wait_for_timeout(400)
        results.append(check('   unknown URL shows 404 page', 'Page not found' in await pg.inner_text('body')))

        print(f'\n{sum(results)}/{len(results)} checks passed | console/page errors: {errors[:3]}')
        await b.close()

asyncio.run(main())
