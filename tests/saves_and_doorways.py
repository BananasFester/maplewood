"""Save and continue for a fresh household, old saves without a tour, and the keep-the-doorway-clear rule."""
import asyncio, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1000)
        r = await pg.evaluate("()=>{const M=__ML;M.startFresh([{first:'Q',last:'Z',app:M.household()[0].app,traits:['neat','foodie','genius'],skills:{}}],'empty');const d=JSON.parse(JSON.stringify(M.serialize()));M.loadGame(d);M.G.mode='live';M.UI.welcome('continue');return {fresh:M.G.fresh,mode:M.G.mode}}")
        print('fresh saved', r)
        await pg.tap('#wp'); await pg.wait_for_timeout(700)
        print('after continue', await pg.evaluate("()=>({fresh:__ML.G.fresh,mode:__ML.G.mode,tut:__ML.G.tut.s,i:__ML.G.tut.i,card:!document.getElementById('tut').classList.contains('hidden'),title:document.querySelector('#tut b')&&document.querySelector('#tut b').textContent})"))
        r = await pg.evaluate("()=>{const M=__ML;const d=JSON.parse(JSON.stringify(M.serialize()));delete d.tut;delete d.fresh;delete d.lot;M.loadGame(d);return JSON.stringify(M.G.tut)+' '+M.G.fresh+' '+M.G.lot}")
        print('old save', r)
        # doorway rule
        r = await pg.evaluate("()=>{const M=__ML;M.startHousehold(M.household(),9000,480,{lot:'shell'});return [M.ev(\"canPlace('counter',13,13,0,null)\"),M.ev(\"canPlace('counter',12,13,0,null)\"),M.ev(\"canPlace('rug',13,12,0,null)\"),M.ev(\"canPlace('counter',10,10,0,null)\")]}")
        print('doorway rule', r)
        print(errs or 'no errors')
        await b.close()
asyncio.run(main())
