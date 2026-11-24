"""Release build (no debug hook): pick a home with real taps, move in, open the map, follow an event chip."""
import asyncio
from playwright.async_api import async_playwright
from common import RELEASE_URL as URL, SHOTS as S, launch_opts, pick_traits
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type=='error' and 'TUNNEL' not in m.text and '404' not in m.text else None)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        print('debug hook present:', await pg.evaluate("()=>typeof window.__ML"))
        await pg.tap('#wn'); await pg.wait_for_timeout(500)
        await pick_traits(pg)
        await pg.tap('#cas [data-x="done"]'); await pg.wait_for_timeout(1000)
        # zoom in twice with the + button, then tap around until a For Sale card appears
        await pg.tap('#zoom [data-z="1"]'); await pg.wait_for_timeout(400)
        await pg.tap('#zoom [data-z="1"]'); await pg.wait_for_timeout(500)
        found=None
        for y in range(200, 600, 22):
            for x in range(30, 380, 26):
                await pg.touchscreen.tap(x, y); await pg.wait_for_timeout(60)
                t = await pg.evaluate("()=>document.getElementById('tcard').innerText")
                if 'Move here' in t and 'left' in t:
                    found=t.split('\n')[0]; break
            if found: break
        print('found:', found)
        await pg.screenshot(path=S+'tr1.png')
        await pg.tap('#tcard [data-x="buy"]'); await pg.wait_for_timeout(1200)
        if await pg.evaluate("()=>!document.getElementById('tut').classList.contains('hidden')"):
            await pg.evaluate("()=>{const b=[...document.querySelectorAll('#tut button, #tut a')].find(b=>/Skip/.test(b.innerText));b&&b.click()}")
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=S+'tr2.png')
        await pg.tap('#zoom [data-z="town"]'); await pg.wait_for_timeout(1300)
        chips = await pg.evaluate("()=>[...document.querySelectorAll('#tcard [data-ev]')].map(b=>b.innerText)")
        print('chips', chips)
        if chips:
            await pg.tap('#tcard [data-ev]'); await pg.wait_for_timeout(900)
            print('poi card:', (await pg.evaluate("()=>document.getElementById('tcard').innerText")).split('\n')[0])
        await pg.screenshot(path=S+'tr3.png')
        await pg.tap('#tbar'); await pg.wait_for_timeout(600)
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
