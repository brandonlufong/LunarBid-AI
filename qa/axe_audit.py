import asyncio, sys, os, json
THEME = os.environ.get('THEME', 'light'); WIDTH = int(os.environ.get('W', '1440')); ONLY = os.environ.get('ONLY')
sys.argv = ['x', 'http://localhost:4190', '/tmp/qa']
exec(open('/tmp/shots.py').read().split('async def run')[0])
AXE = open('/tmp/axe/node_modules/axe-core/axe.min.js').read()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
        total = 0
        for name, (path, st, authed, action) in SCREENS.items():
            if ONLY and name not in ONLY.split(','): continue
            ctx = await b.new_context(viewport={'width': WIDTH, 'height': 900})
            await ctx.route('**/api/**', make_api(st)); await ctx.route('**fonts.googleapis.com**', lambda r: r.abort())
            pg = await ctx.new_page()
            await pg.goto(BASE + '/'); await pg.evaluate(f"localStorage.setItem('theme','{THEME}')")
            if authed: await pg.evaluate("localStorage.setItem('token','t')")
            await pg.goto(BASE + path, wait_until='networkidle'); await pg.wait_for_timeout(500)
            if action == 'generate':
                await pg.get_by_label('Job title').fill('React analytics dashboard')
                await pg.get_by_label('Job post').fill('We need a React developer to build an analytics dashboard with filterable charts.')
                await pg.locator('[data-action="generate"]').click(); await pg.wait_for_timeout(1000)
            await pg.add_script_tag(content=AXE)
            r = await pg.evaluate("() => axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa'] }, resultTypes: ['violations'] })")
            v = [(x['id'], len(x['nodes']), x['nodes'][0]['target'][0], (x['nodes'][0].get('failureSummary') or '')[:140].replace('\n',' ')) for x in r['violations']]
            n = sum(c for _, c, _, _ in v); total += n
            print(f'{THEME} {WIDTH} {name}: {n}', v[:3] if v else '')
            await ctx.close()
        print('TOTAL', total)
        await b.close()
asyncio.run(main())
