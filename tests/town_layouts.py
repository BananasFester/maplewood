"""Town picking in landscape and tablet sizes; the selected home stays visible beside the card."""
import asyncio
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts, pick_traits
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        errs=[]
        for name,vw,vh in [('land',844,390),('tab',820,1180)]:
            ctx = await b.new_context(viewport={'width':vw,'height':vh}, device_scale_factor=2, is_mobile=True, has_touch=True)
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(1200)
            await pg.tap('#wn'); await pg.wait_for_timeout(500)
            await pick_traits(pg)
            await pg.tap('#cas [data-x="done"]'); await pg.wait_for_timeout(1000)
            await pg.screenshot(path=S+f'tp_{name}1.png')
            await pg.tap('#tcard [data-cat="starter"]')
            await pg.wait_for_timeout(800)
            await pg.screenshot(path=S+f'tp_{name}2.png')
            print(name, await pg.evaluate("()=>{const TV=__ML.TV,T=__ML.getTown(),l=TV.sel.l,[sx,sy]=TV.w2s(l.x+14,l.y+10),r=document.getElementById('tcard').getBoundingClientRect();return {lotCss:[Math.round(sx/TV.dpr),Math.round(sy/TV.dpr)],card:[Math.round(r.left),Math.round(r.top),Math.round(r.right),Math.round(r.bottom)],hidden:sx/TV.dpr>r.left&&sx/TV.dpr<r.right&&sy/TV.dpr>r.top}}"))
            await ctx.close()
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
