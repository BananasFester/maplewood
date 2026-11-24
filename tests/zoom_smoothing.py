"""Zoom buttons and the WebGL smoothing pass: zoom range, smoothing on and off, screenshots at several zooms."""
import asyncio, sys, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts('--autoplay-policy=no-user-gesture-required'))
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        print(await pg.evaluate("()=>({gl:__ML.GLS.ok,smooth:__ML.R.smooth,Z:__ML.R.Z,Zmin:__ML.R.Zmin,Zmax:__ML.R.Zmax,k:__ML.GLS.k})"))
        await pg.click('#wp'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=S+'a1_day.png')
        # zoom in twice via buttons
        await pg.click('#zoom [data-z="1"]'); await pg.wait_for_timeout(500)
        await pg.click('#zoom [data-z="1"]'); await pg.wait_for_timeout(700)
        print('after zoom in', await pg.evaluate("()=>__ML.R.Z"))
        await pg.screenshot(path=S+'a2_zoomin.png')
        for i in range(4):
            await pg.click('#zoom [data-z="-1"]'); await pg.wait_for_timeout(350)
        await pg.wait_for_timeout(500)
        print('after zoom out', await pg.evaluate("()=>__ML.R.Z"))
        await pg.screenshot(path=S+'a3_zoomout.png')
        await pg.evaluate("()=>{__ML.setZoom(__ML.R.Zdef);__ML.G.time=Math.floor(__ML.G.time/1440)*1440+21*60;}")
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=S+'a4_night.png')
        await pg.evaluate("()=>{__ML.G.time=Math.floor(__ML.G.time/1440)*1440+15*60;}")
        await pg.wait_for_timeout(400)
        print('\n'.join(errs[:30]) or 'no errors')
        await b.close()
asyncio.run(main())
