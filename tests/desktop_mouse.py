"""Mouse and keyboard on a PC: right-drag camera, hover tips and cursor, the buy ghost following the mouse,
click to place, wheel and drag on the catalog strips, held-key panning, Esc on the town map, and the words
switching between "click" and "tap" when the player moves between mouse and touch."""
import asyncio, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        # a touch laptop: starts out unsure, so the first mouse move is what switches it to mouse mode
        ctx = await b.new_context(viewport={'width':1366,'height':768}, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        ev = lambda code: pg.evaluate("(c)=>__ML.ev(c)", code)
        async def center(sel):
            return await pg.evaluate("(s)=>{const r=document.querySelector(s).getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}", sel)
        async def tile_xy(tx, ty):
            return await ev(f"(()=>{{const x=({tx}*T+8-R.camX)*R.Z+R.W/2,y=({ty}*T+8-R.camY)*R.Z+R.H/2;return [x/R.dpr,y/R.dpr]}})()")

        await pg.mouse.move(600, 400); await pg.mouse.move(610, 410)
        x, y = await center('#wp'); await pg.mouse.click(x, y); await pg.wait_for_timeout(900)
        await pg.evaluate("()=>{__ML.TUT.finish&&__ML.TUT.finish();__ML.G.speed=0}")
        print('mouse mode', await ev("DESK.mouse"), 'body.mouse', await pg.evaluate("()=>document.body.classList.contains('mouse')"))

        # hovering furniture: pointer cursor, then a tooltip without pressing anything
        fx, fy = await ev("(()=>{const o=G.objects.find(o=>o.type==='fridge');const x=(o.x*T+8-R.camX)*R.Z+R.W/2,y=(o.y*T+2-R.camY)*R.Z+R.H/2;return [x/R.dpr,y/R.dpr]})()")
        await pg.mouse.move(fx, fy); await pg.mouse.move(fx+1, fy+1); await pg.wait_for_timeout(800)
        print('hover cursor', await ev("R.cv.style.cursor"), '| tip', await ev("TIP.mode"), await pg.evaluate("()=>document.querySelector('#tip .tt span').textContent"))
        await pg.screenshot(path=S+'d1_hover_tip.png')
        await pg.mouse.move(fx+60, fy+80); await pg.wait_for_timeout(100)
        print('tip hidden after moving away', await pg.evaluate("()=>document.getElementById('tip').classList.contains('hidden')"))

        # buy mode: wide panel shows every category; ghost follows the mouse; R turns; click buys; right-click stops
        x, y = await center('#modes [data-m="buy"]'); await pg.mouse.click(x, y); await pg.wait_for_timeout(500)
        print('buy hint:', await pg.evaluate("()=>document.querySelector('#buy .hint').textContent"))
        print('category strip [scrollWidth, clientWidth]', await pg.evaluate("()=>{const t=document.querySelector('#buy .tabsx');return [t.scrollWidth,t.clientWidth]}"))
        money0 = await ev("G.money")
        x, y = await center('#bitems .item'); await pg.mouse.click(x, y); await pg.wait_for_timeout(200)
        # a free tile near the middle of the screen, clear of the panels
        spot = await ev("(()=>{const t=BB.placing.type,c=screenToWorld(innerWidth/2,innerHeight*.4),cx=c.x/T,cy=c.y/T;let best=null,bd=1e9;for(let y=1;y<LOTH-1;y++)for(let x=1;x<MW-1;x++)if(canPlace(t,x,y,0)===true&&canPlace(t,x,y,1)===true){const d=Math.hypot(x-cx,y-cy);if(d<bd){bd=d;best=[x,y];}}return best})()")
        gx, gy = await tile_xy(*spot)
        await pg.mouse.move(gx-20, gy-20); await pg.mouse.move(gx, gy); await pg.wait_for_timeout(100)
        print('ghost at', await ev("[BB.placing.x,BB.placing.y]"), 'wanted', spot)
        await pg.keyboard.press('r'); print('turned', await ev("BB.placing.rot"))
        await pg.mouse.click(gx, gy); await pg.wait_for_timeout(200)
        print('money', money0, '->', await ev("G.money"), '| still placing (repeatable item)', await ev("!!BB.placing"))
        await pg.screenshot(path=S+'d2_buy_placed.png')
        await pg.mouse.click(gx, gy, button='right'); await pg.wait_for_timeout(100)
        print('placing after right-click', await ev("!!BB.placing"))

        # build mode: every tool fits, the hint talks about right-drag, wheel and drag scroll the swatches
        x, y = await center('#modes [data-m="build"]'); await pg.mouse.click(x, y); await pg.wait_for_timeout(500)
        print('build tools [scrollWidth, clientWidth]', await pg.evaluate("()=>{const t=document.querySelector('#build .tabsx');return [t.scrollWidth,t.clientWidth]}"))
        print('build hint:', await pg.evaluate("()=>document.querySelector('#build .hint').textContent"))
        x, y = await center('#sws'); await pg.mouse.move(x, y); await pg.mouse.wheel(0, 300); await pg.wait_for_timeout(100)
        print('swatches after wheel', await pg.evaluate("()=>document.querySelector('#sws').scrollLeft"))
        await pg.evaluate("()=>{document.querySelector('#sws').scrollLeft=0}")
        fl0 = await ev("BB.floor")
        await pg.mouse.move(x+150, y); await pg.mouse.down(); await pg.mouse.move(x, y, steps=6); await pg.mouse.move(x-150, y, steps=6); await pg.mouse.up()
        print('swatches after drag', await pg.evaluate("()=>document.querySelector('#sws').scrollLeft"), '| floor unchanged', fl0 == await ev("BB.floor"))
        walls0 = await ev("W.wt.filter(x=>x).length"); cam0 = await ev("[R.camX,R.camY]")
        await pg.mouse.move(700, 400); await pg.mouse.down(button='right'); await pg.mouse.move(600, 350, steps=8); await pg.mouse.up(button='right')
        print('right-drag moved camera', cam0, '->', await ev("[R.camX,R.camY]"), '| walls unchanged', walls0 == await ev("W.wt.filter(x=>x).length"))
        await pg.mouse.move(900, 300); await pg.mouse.move(905, 305); await pg.wait_for_timeout(100)
        print('build hover tile', await ev("BB.hov"), 'cursor', await ev("R.cv.style.cursor"))
        await pg.screenshot(path=S+'d3_build.png')
        x, y = await center('#modes [data-m="live"]'); await pg.mouse.click(x, y); await pg.wait_for_timeout(400)

        # keyboard: held A moves the camera; Space pauses even right after clicking a button; Esc leaves the town map
        cam0 = await ev("R.camX"); await pg.keyboard.down('a'); await pg.wait_for_timeout(400); await pg.keyboard.up('a')
        print('held A moved camera by', round(cam0 - await ev("R.camX"), 1))
        x, y = await center('#speed [data-s="1"]') if await pg.evaluate("()=>!!document.querySelector('#speed [data-s=\"1\"]')") else (None, None)
        if x: await pg.mouse.click(x, y)
        s0 = await ev("G.speed"); await pg.keyboard.press(' '); s1 = await ev("G.speed")
        print('space toggles speed', s0, '->', s1, '| focused', await pg.evaluate("()=>document.activeElement.tagName"))
        x, y = await center('#zoom [data-z="town"]'); await pg.mouse.click(x, y); await pg.wait_for_timeout(1200)
        print('town card:', await pg.evaluate("()=>document.querySelector('#tcard .tp').textContent"))
        await pg.screenshot(path=S+'d4_town.png')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        print('town open after Esc', await ev("TV.on"), '| mode', await ev("G.mode"))

        # switching to touch puts the touch words back
        x, y = await center('#modes [data-m="buy"]'); await pg.mouse.click(x, y); await pg.wait_for_timeout(400)
        await pg.touchscreen.tap(700, 300); await pg.wait_for_timeout(200)
        print('after a touch: mouse mode', await ev("DESK.mouse"), '| hint:', await pg.evaluate("()=>document.querySelector('#buy .hint').textContent"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
