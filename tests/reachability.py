"""Home checklist reachability: items behind a blocked door count as missing until the way is clear."""
import asyncio, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type=='error' and 'TUNNEL' not in m.text and '404' not in m.text else None)
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        cdp = await ctx.new_cdp_session(pg)
        async def touch(x,y,ms=60):
            await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]}); await pg.wait_for_timeout(ms)
            await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
        async def rect(sel): return await pg.evaluate("(s)=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}", sel)
        tq="()=>{const t=__ML.G.tut;const el=document.getElementById('tut');return {s:t.s,i:t.i,title:el.querySelector('b')&&el.querySelector('b').textContent,ring:!document.getElementById('tutRing').classList.contains('hidden')}}"
        x,y = await rect('#wp'); await touch(x,y); await pg.wait_for_timeout(900)
        print(1, await pg.evaluate(tq)); await pg.screenshot(path=S+'h1.png')
        x,y = await rect('#tut [data-tut="next"]'); await touch(x,y); await pg.wait_for_timeout(600)
        print(2, await pg.evaluate(tq)); await pg.screenshot(path=S+'h2.png')
        x,y = await rect('[data-tip="need:energy"]'); await touch(x,y,700); await pg.wait_for_timeout(900)
        print(3, await pg.evaluate(tq)); await pg.screenshot(path=S+'h3.png')
        # tap the TV, then the first option
        pos = await pg.evaluate("()=>{const M=__ML,o=M.G.objects.find(o=>o.type==='tv');const T=16;return [((o.x*T+8-M.R.camX)*M.R.Z+M.R.W/2)/M.R.dpr,((o.y*T+4-M.R.camY)*M.R.Z+M.R.H/2)/M.R.dpr]}")
        await touch(pos[0],pos[1]); await pg.wait_for_timeout(500)
        x,y = await rect('#ctx .opt'); await touch(x,y); await pg.wait_for_timeout(900)
        print(4, await pg.evaluate(tq)); await pg.screenshot(path=S+'h4.png')
        x,y = await rect('#tut [data-tut="next"]'); await touch(x,y); await pg.wait_for_timeout(600)
        print(5, await pg.evaluate(tq)); await pg.screenshot(path=S+'h5.png')
        x,y = await rect('#portraits .pbtn:not(.sel)'); await touch(x,y); await pg.wait_for_timeout(900)
        print(6, await pg.evaluate(tq)); await pg.screenshot(path=S+'h6.png')
        x,y = await rect('#tut [data-tut="next"]'); await touch(x,y); await pg.wait_for_timeout(600)
        print(7, await pg.evaluate(tq))
        x,y = await rect('#sexp'); await touch(x,y); await pg.wait_for_timeout(900)
        print(8, await pg.evaluate(tq)); await pg.screenshot(path=S+'h8.png')
        for k in range(6):
            q = await pg.evaluate(tq)
            if q['s'] is None or (await pg.evaluate("()=>document.getElementById('tut').classList.contains('hidden')")): break
            if k==0: await pg.screenshot(path=S+'h9.png')
            r = await rect('#tut [data-tut="next"]')
            if not r: r = await rect('#tut [data-tut="act"]')
            await touch(*r); await pg.wait_for_timeout(700)
            print('step', await pg.evaluate(tq))
        print('end', await pg.evaluate("()=>JSON.stringify(__ML.G.tut)"), await pg.evaluate("()=>document.getElementById('tut').classList.contains('hidden')"))
        # reachability check: shell lot, toilet behind no door
        await pg.evaluate("()=>{const M=__ML;M.startHousehold([{first:'A',last:'B',app:M.household()[0].app,traits:['neat','foodie','genius'],skills:{}}],10000,480,{lot:'empty'});}")
        r = await pg.evaluate("""()=>{const M=__ML;M.BB_.tool='room';M.BB_.down(8,8);M.BB_.move(14,13);M.BB_.up();M.BB_.down(14,8);M.BB_.move(18,13);M.BB_.up();
           M.BB_.tool='door';M.BB_.down(11,13);M.BB_.up();M.ev("addObject('toilet',16,9,{});refreshWorld()");return M.homeChecks().map(c=>c.k+':'+c.ok+':'+c.l).join(' | ')}""")
        print('reach', r)
        r = await pg.evaluate("""()=>{const M=__ML;M.BB_.tool='door';M.BB_.down(14,11);M.BB_.up();return M.homeChecks().filter(c=>c.k==='toilet').map(c=>c.k+':'+c.ok+':'+c.l).join(' | ')}""")
        print('reach after inner door', r)
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
