"""Music player and day/night: playlist, mute, next song, buy mode and night transitions."""
import asyncio, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        await pg.tap('#wp'); await pg.wait_for_timeout(2500)
        st = "()=>{const M=__ML.AU,m=window.__MUS||null;return null}"
        info = await pg.evaluate("()=>{const a=document.querySelectorAll('audio');return null}")
        q = """()=>{const M=__ML.MUS;const a=M.els[M.cur];return {track:M.track,kind:M.kind,cur:M.cur,t:a&&+a.currentTime.toFixed(2),paused:a&&a.paused,src:a&&a.src.split('/').pop(),gain:M.gs[M.cur]&&+M.gs[M.cur].gain.value.toFixed(2),ctx:__ML.AU.ctx&&__ML.AU.ctx.state,ready:a&&a.readyState}}"""
        print('start', await pg.evaluate(q))
        await pg.wait_for_timeout(2000)
        print('2s later', await pg.evaluate(q))
        # buy mode switch
        await pg.tap('[data-m="buy"]'); await pg.wait_for_timeout(2600)
        print('buy mode', await pg.evaluate(q))
        await pg.tap('[data-m="live"]'); await pg.wait_for_timeout(2600)
        print('live again', await pg.evaluate(q))
        # simulate track end at night
        await pg.evaluate("()=>{const G=__ML.G;G.time=Math.floor(G.time/1440)*1440+21*60;const M=__ML.MUS;M.onEnd();M.next=0;}")
        await pg.wait_for_timeout(1500)
        print('night next', await pg.evaluate(q))
        # menu: music off
        await pg.tap('#menuBtn'); await pg.wait_for_timeout(400)
        txt = await pg.evaluate("()=>document.getElementById('mcard').innerText.slice(0,200).replace(/\\n/g,' | ')")
        print('menu:', txt)
        await pg.tap('[data-x="music"]'); await pg.wait_for_timeout(1800)
        print('music off', await pg.evaluate(q))
        await pg.tap('[data-x="music"]'); await pg.wait_for_timeout(1500)
        print('music on', await pg.evaluate(q))
        await pg.tap('[data-x="nextsong"]'); await pg.wait_for_timeout(2200)
        print('next song', await pg.evaluate(q))
        print('\n'.join(e for e in errs if 'fonts' not in e and 'TUNNEL' not in e)[:2000] or 'no errors')
        await b.close()
asyncio.run(main())
