"""Every landing-page element that animates in must end up visible.
Usage: python3 qa/landing_visibility.py http://localhost:4190
Checks: normal scroll-through, header anchor jump to #pricing, reduced motion, slow and failing plans API."""
import asyncio, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:4190'
HIDDEN = "[...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1').length"

async def run(b, name, reduced='no-preference', api='ok', action='scroll'):
    ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, reduced_motion=reduced)
    async def handler(route):
        if 'plans' in route.request.url:
            if api == 'down': return await route.abort()
            if api == 'slow': await asyncio.sleep(0.8)
            return await route.fulfill(json={'plans': []}) if api == 'empty' else await route.continue_()
        return await route.fulfill(json={})
    await ctx.route('**/api/**', handler)
    pg = await ctx.new_page()
    await pg.goto(BASE + '/', wait_until='networkidle'); await pg.wait_for_timeout(600)
    if action == 'anchor':
        await pg.get_by_role('link', name='Pricing').first.click(); await pg.wait_for_timeout(1500)
        hidden = await pg.evaluate("[...document.querySelectorAll('#pricing [data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1').length")
    else:
        for y in range(0, 6000, 450):
            await pg.evaluate(f'window.scrollTo(0,{y})'); await pg.wait_for_timeout(150)
        await pg.wait_for_timeout(1200)
        hidden = await pg.evaluate(HIDDEN)
    cards = await pg.evaluate("document.querySelectorAll('#pricing .lift').length")
    ok = hidden == 0 and cards == 4
    print(f"{'PASS' if ok else 'FAIL'} {name}: hidden={hidden} pricing cards={cards}")
    await ctx.close()
    return ok

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        results = [
            await run(b, 'scroll through page'),
            await run(b, 'header link to Pricing', action='anchor'),
            await run(b, 'reduced motion', reduced='reduce'),
            await run(b, 'slow plans API', api='slow'),
            await run(b, 'plans API down', api='down'),
            await run(b, 'plans API empty', api='empty'),
        ]
        print(f'{sum(results)}/{len(results)} passed')
        await b.close()
asyncio.run(main())
