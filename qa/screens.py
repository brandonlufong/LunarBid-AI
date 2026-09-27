"""Screenshot LunarBid screens against a stub API.
Usage: python3 shots.py <base_url> <out_dir> [widths] [screens]
"""
import asyncio, sys, os, json
from playwright.async_api import async_playwright

BASE = sys.argv[1]
OUT = sys.argv[2]
WIDTHS = [int(w) for w in (sys.argv[3] if len(sys.argv) > 3 else '1440,390').split(',')]
ONLY = sys.argv[4].split(',') if len(sys.argv) > 4 else None
os.makedirs(OUT, exist_ok=True)

PROPOSAL = """Hi Sarah,

Thanks for sharing the details of your analytics dashboard project. You need a React front end that turns your team's raw event data into clear, filterable charts, and you want it live before your Q4 planning cycle.

Here is how I would approach it:

1. Discovery (days 1-2): confirm the key metrics, data sources and who will use each view.
2. Build (days 3-10): React + TypeScript components, a chart layer with Recharts, and role-based access.
3. Review and launch (days 11-14): a staging link for your feedback, fixes, and a short handover session.

I have built React dashboards for SaaS teams and I am comfortable working with REST and GraphQL APIs.

Could we schedule a 20-minute call this week to go over the data you already have?

Best regards,
Ann Lee"""

HISTORY = [
    {'_id': f'{i:024x}', 'jobTitle': t, 'clientName': c, 'status': s, 'tone': 'friendly', 'length': 'medium',
     'generatedProposal': PROPOSAL, 'createdAt': d, 'updatedAt': d}
    for i, (t, c, s, d) in enumerate([
        ('React analytics dashboard', 'Sarah Chen', 'sent', '2026-09-24T10:00:00Z'),
        ('Shopify store redesign', 'Northwind', 'draft', '2026-09-22T09:00:00Z'),
        ('Brand identity for a bakery', '', 'accepted', '2026-09-18T15:00:00Z'),
        ('Mobile app MVP (Flutter)', 'Kofi A.', 'rejected', '2026-09-11T11:00:00Z'),
    ], start=1)
]

ANALYSIS = {'summary': 'The client needs a React analytics dashboard that turns raw event data into filterable charts before Q4 planning.',
            'keyRequirements': ['React + TypeScript', 'Filterable charts', 'Role-based access', 'Launch within 3 weeks'],
            'suggestedSkills': ['React', 'TypeScript', 'Recharts', 'REST APIs'],
            'clientPainPoints': ['Data is hard to read today', 'Tight deadline before Q4'],
            'suggestedTone': 'friendly', 'suggestedLength': 'medium', 'complexity': 'medium',
            'estimatedBudgetRange': '$2,000 - $4,000', 'redFlags': ['Scope of "role-based access" is vague'],
            'winningAngles': ['Offer a staging link within the first week', 'Propose a short discovery call'],
            'matchScore': 78, 'matchReason': 'Your React and dashboard experience fits most requirements.'}

def make_api(state):
    async def api(route):
        u, m = route.request.url, route.request.method
        path = u.split('/api', 1)[-1].split('?')[0]
        J = lambda data, status=200: route.fulfill(status=status, json=data)
        if path == '/auth/me':
            return await J({'id': 'u1', 'name': 'Ann Lee', 'email': 'ann@example.com', 'profile': state.get('profile', {}),
                            'hasPassword': True, 'emailVerified': state.get('verified', True), 'authProvider': 'local'})
        if path == '/auth/providers': return await J({'google': False, 'github': False, 'email': True})
        if path == '/subscription/plans': return await J({'plans': json.load(open('/tmp/plans.json'))})
        if path == '/subscription':
            plan = state.get('plan', 'free')
            return await J({'subscription': {'plan': plan, 'subscribedPlan': plan, 'status': 'active', 'paymentIssue': False,
                                             'cancelAtPeriodEnd': False, 'hasBillingAccount': plan != 'free', 'endDate': '2026-10-24T00:00:00Z'},
                            'usage': {'proposalsToday': 2, 'proposalsThisMonth': 14, 'totalProposals': 31, 'analysesToday': 1},
                            'limits': {'dailyProposals': 5 if plan == 'free' else None, 'monthlyProposals': 50 if plan == 'starter' else None, 'dailyAnalyses': 10, 'clientProfiles': 0 if plan == 'free' else 50},
                            'features': {'clientProfiles': plan != 'free', 'analytics': plan in ('pro',), 'customBranding': plan in ('pro',)}})
        if path.startswith('/proposals/') and len(path.split('/')) == 3 and path.split('/')[2] not in ('history','generate','analyze','public'):
            return await J(HISTORY[0])
        if path.startswith('/proposals/history'):
            items = HISTORY if state.get('has_history', True) else []
            return await J({'items': items, 'nextCursor': None})
        if path == '/proposals/analyze': return await J({'analysis': ANALYSIS})
        if path == '/proposals/generate': return await J({'id': 'p1', 'proposal': PROPOSAL, 'isTemplate': False, 'usage': {'today': 3, 'thisMonth': 15, 'plan': 'free'}})
        if path.startswith('/proposals/public/'):
            return await J({'jobTitle': 'React analytics dashboard', 'clientName': 'Sarah Chen', 'content': PROPOSAL, 'createdAt': '2026-09-24T10:00:00Z',
                            'author': {'name': 'Ann Lee', 'branding': None}})
        if path == '/profile' and state.get('profile_empty'): return await J({'role': '', 'skills': '', 'platformFocus': []})
        if path == '/profile': return await J({'role': 'Full-stack developer', 'experience': '6 years building SaaS products', 'skills': 'React, Node.js, TypeScript',
                                               'hourlyRate': '$60', 'portfolio': 'https://example.com', 'bio': '', 'preferredTone': 'Professional', 'platformFocus': ['Upwork']})
        if path.startswith('/client-profiles'): return await J([])
        if path.startswith('/branding'): return await J({'branding': {'primaryColor': '#4f46e5', 'secondaryColor': '#7c3aed', 'logoUrl': '', 'companyName': '', 'tagline': '', 'website': ''}, 'plan': 'pro'})
        if path.startswith('/analytics'): return await J({'overview': {'totalProposals': 31, 'winRate': 0}}, 403)
        if path == '/support/info': return await J({'plan': 'free', 'responseTime': '48 hours'})
        if path.startswith('/support'): return await J([{'_id': 't1', 'subject': 'Export to Word shows odd spacing', 'category': 'bug_report', 'status': 'open', 'createdAt': '2026-09-20T10:00:00Z'}])
        return await J({})
    return api

SCREENS = {
    'dash-home': ('/dashboard?tab=home', {}, True, None),
    'dash-home-new': ('/dashboard?tab=home', {'has_history': False, 'verified': False, 'profile_empty': True}, True, None),
    'landing': ('/', {}, False, None),
    'login': ('/login', {}, False, None),
    'register': ('/register', {}, False, None),
    'dash-generate': ('/dashboard?tab=generate', {}, True, None),
    'dash-generated': ('/dashboard?tab=generate', {}, True, 'generate'),
    'dash-history': ('/dashboard?tab=history', {}, True, None),
    'dash-history-selected': ('/dashboard?tab=history&id=' + f'{1:024x}', {}, True, None),
    'dash-history-empty': ('/dashboard?tab=history', {'has_history': False}, True, None),
    'dash-subscription': ('/dashboard?tab=subscription', {}, True, None),
    'dash-profile': ('/dashboard?tab=profile', {}, True, None),
    'public': ('/p/abc', {}, False, None),
    'dash-clients': ('/dashboard?tab=clients', {'plan': 'starter'}, True, None),
    'dash-calculator': ('/dashboard?tab=calculator', {}, True, None),
    'dash-branding': ('/dashboard?tab=branding', {}, True, None),
    'dash-analytics': ('/dashboard?tab=analytics', {}, True, None),
    'dash-support': ('/dashboard?tab=support', {}, True, None),
    'terms': ('/terms', {}, False, None),
}

async def run():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        for w in WIDTHS:
            for name, (path, st, authed, action) in SCREENS.items():
                if ONLY and name not in ONLY: continue
                ctx = await b.new_context(viewport={'width': w, 'height': 900 if w > 800 else 844}, color_scheme='dark' if 'dark' in name else 'light')
                await ctx.route('**/api/**', make_api(st))
                await ctx.route('**fonts.googleapis.com**', lambda r: r.abort())
                pg = await ctx.new_page()
                errs = []
                pg.on('pageerror', lambda e: errs.append(str(e)))
                await pg.goto(BASE + '/', wait_until='domcontentloaded')
                await pg.evaluate(f"localStorage.setItem('lunarbid-language','{os.environ.get('LANG_CODE','en')}')")
                await pg.evaluate(f"localStorage.setItem('theme','{os.environ.get('THEME','light')}')")
                if authed: await pg.evaluate("localStorage.setItem('token','t')")
                await pg.goto(BASE + path, wait_until='networkidle')
                await pg.wait_for_timeout(700)
                if action == 'generate':
                    try:
                        await pg.get_by_label('Job title').fill('React analytics dashboard')
                        await pg.get_by_label('Job post').fill('We need a React developer to build an analytics dashboard with filterable charts before Q4 planning.')
                        await pg.get_by_label('Client name').fill('Sarah Chen')
                        btn = pg.locator('[data-action="generate"]')
                        if not await btn.count(): btn = pg.get_by_role('button', name='Generate Proposal with AI')
                        await btn.first.click()
                        await pg.wait_for_timeout(1200)
                    except Exception as e:
                        errs.append('action: ' + str(e)[:120])
                if not os.environ.get('NOSHOT'): await pg.screenshot(path=f'{OUT}/{name}-{w}.png', full_page=True)
                overflow = await pg.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
                body = await pg.inner_text('body')
                crash = 'Something went wrong' in body
                import re as _re
                raw = sorted(set(_re.findall(r'\b(?:[a-z]+\.){1,4}[a-z][a-zA-Z]+\b', body)) - {'lunarbid.ai', 'example.com', 'support@lunarbid.ai'})
                raw = [r for r in raw if not r.endswith(('.ai', '.com', '.js'))]
                if os.environ.get('NOSHOT'): pass
                print(f'{name}-{w}: overflow={overflow} crash={crash} rawkeys={raw[:3]} errors={errs[:1]}')
                await ctx.close()
        await b.close()

asyncio.run(run())
