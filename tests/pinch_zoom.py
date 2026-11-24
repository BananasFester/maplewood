"""Two-finger pinch zoom on the lot view."""
import asyncio, sys, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        cdp = await ctx.new_cdp_session(pg)
        async def touch(x,y,ms):
            await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
            await pg.wait_for_timeout(ms)
            await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        async def rect(sel):
            return await pg.evaluate("(s)=>{const r=document.querySelector(s).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}", sel)
        x,y = await rect('#wp'); await touch(x,y,60); await pg.wait_for_timeout(900)
        await pg.evaluate("()=>{__ML.G.speed=0}")
        objpos = "(t)=>{const M=__ML,o=M.G.objects.find(o=>o.type===t);const T=16;const x=(o.x*T+8-M.R.camX)*M.R.Z+M.R.W/2,y=(o.y*T+2-M.R.camY)*M.R.Z+M.R.H/2;return [x/M.R.dpr,y/M.R.dpr]}"
        pos = await pg.evaluate(objpos, 'bookshelf'); print('bookshelf', pos)
        await touch(pos[0],pos[1],750); await pg.wait_for_timeout(200)
        await pg.screenshot(path=S+'c1_shelf_tip.png')
        print('tip text:', await pg.evaluate("()=>document.getElementById('tip').innerText.replace(/\\n/g,' | ')"))
        print('ctx hidden after long press', await pg.evaluate("()=>document.getElementById('ctx').classList.contains('hidden')"))
        print('queue len', await pg.evaluate("()=>__ML.household()[0].queue.length"))
        await pg.wait_for_timeout(300)
        await touch(pos[0],pos[1],80); await pg.wait_for_timeout(300)
        print('tip hidden after tap', await pg.evaluate("()=>document.getElementById('tip').classList.contains('hidden')"))
        print('ctx shown on tap', await pg.evaluate("()=>!document.getElementById('ctx').classList.contains('hidden')"))
        await pg.screenshot(path=S+'c2_shelf_menu.png')
        print('ctx text:', (await pg.evaluate("()=>document.getElementById('ctx').innerText.replace(/\\n/g,' | ')"))[:200])
        # pinch zoom via CDP two-finger
        z0 = await pg.evaluate("()=>__ML.R.Z")
        await touch(200,700,60)
        await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':150,'y':400,'id':1},{'x':250,'y':400,'id':2}]})
        for i in range(1,11):
            await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':150-i*6,'y':400,'id':1},{'x':250+i*6,'y':400,'id':2}]})
            await pg.wait_for_timeout(16)
        await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        await pg.wait_for_timeout(300)
        print('pinch zoom', z0, '->', await pg.evaluate("()=>__ML.R.Z"))
        await pg.screenshot(path=S+'c3_pinch.png')
        print('\n'.join(errs[:30]) or 'no errors')
        await b.close()
asyncio.run(main())
