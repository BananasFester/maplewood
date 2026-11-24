"""Touch input: press-and-hold tooltips, tap menus, and that a long press never starts placing furniture."""
import asyncio, sys, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error',) else None)
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
        x,y = await rect('[data-tip="need:energy"]'); await touch(x,y,700); await pg.wait_for_timeout(200)
        await pg.screenshot(path=S+'b1_need.png')
        print('sheet open after longpress?', await pg.evaluate("()=>__ML.UI.open"))
        # tap elsewhere closes tip, then tap need to open sheet
        await touch(200,420,60); await pg.wait_for_timeout(300)
        print('tip hidden', await pg.evaluate("()=>document.getElementById('tip').classList.contains('hidden')"))
        x,y = await rect('#sexp'); await touch(x,y,60); await pg.wait_for_timeout(500)
        x,y = await rect('#sbody .row[data-tip^="mood:"]'); await touch(x,y,700); await pg.wait_for_timeout(200)
        await pg.screenshot(path=S+'b2_moodlet.png')
        await touch(200,300,60); await pg.wait_for_timeout(300)
        x,y = await rect('[data-tip="trait:'+(await pg.evaluate("()=>__ML.household()[0].traits[0]"))+'"]'); await touch(x,y,700); await pg.wait_for_timeout(200)
        await pg.screenshot(path=S+'b3_trait.png')
        await touch(200,300,60); await pg.wait_for_timeout(300)
        x,y = await rect('#sexp'); await touch(x,y,60); await pg.wait_for_timeout(400)
        # world long-press on fridge
        pos = await pg.evaluate("()=>{const M=__ML,o=M.G.objects.find(o=>o.type==='fridge');const T=16;const x=(o.x*T+8-M.R.camX)*M.R.Z+M.R.W/2,y=(o.y*T+2-M.R.camY)*M.R.Z+M.R.H/2;return [x/M.R.dpr,y/M.R.dpr]}")
        print('fridge at', pos)
        await touch(pos[0],pos[1],750); await pg.wait_for_timeout(200)
        await pg.screenshot(path=S+'b4_fridge.png')
        print('ctx menu hidden', await pg.evaluate("()=>document.getElementById('ctx').classList.contains('hidden')"))
        await touch(200,300,60); await pg.wait_for_timeout(300)
        pos = await pg.evaluate("()=>{const M=__ML,s=M.household()[1];const x=(s.x-M.R.camX)*M.R.Z+M.R.W/2,y=(s.y-14-M.R.camY)*M.R.Z+M.R.H/2;return [x/M.R.dpr,y/M.R.dpr]}")
        await touch(pos[0],pos[1],750); await pg.wait_for_timeout(200)
        await pg.screenshot(path=S+'b5_person.png')
        await touch(200,300,60); await pg.wait_for_timeout(300)
        # normal tap on fridge still opens the menu
        pos = await pg.evaluate("()=>{const M=__ML,o=M.G.objects.find(o=>o.type==='fridge');const T=16;const x=(o.x*T+8-M.R.camX)*M.R.Z+M.R.W/2,y=(o.y*T+2-M.R.camY)*M.R.Z+M.R.H/2;return [x/M.R.dpr,y/M.R.dpr]}")
        await touch(pos[0],pos[1],80); await pg.wait_for_timeout(300)
        await pg.screenshot(path=S+'b6_fridge_tap.png')
        print('ctx menu shown on tap', await pg.evaluate("()=>!document.getElementById('ctx').classList.contains('hidden')"))
        await touch(200,700,60); await pg.wait_for_timeout(300)
        # long press on speed button should not change speed
        sp0 = await pg.evaluate("()=>__ML.G.speed")
        x,y = await rect('[data-tip="speed:3"]'); await touch(x,y,700); await pg.wait_for_timeout(300)
        print('speed unchanged after long press', sp0, await pg.evaluate("()=>__ML.G.speed"))
        await pg.screenshot(path=S+'b7_speed.png')
        # buy mode item tooltip
        await touch(200,300,60); await pg.wait_for_timeout(300)
        x,y = await rect('[data-m="buy"]'); await touch(x,y,60); await pg.wait_for_timeout(600)
        x,y = await rect('#bitems .item'); await touch(x,y,700); await pg.wait_for_timeout(200)
        await pg.screenshot(path=S+'b8_buy.png')
        print('placing after long press?', await pg.evaluate("()=>!!__ML.BB.placing"))
        print('\n'.join(errs[:30]) or 'no errors')
        await b.close()
asyncio.run(main())
