"""Lot choice: empty lot vs starter home, furnished vs unfurnished prices, buying each, clean empty lots, walkway from a new front door."""
import asyncio, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts
CARD="()=>document.getElementById('tcard').innerText.split(String.fromCharCode(10)).filter(x=>x.trim()).join(' | ')"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        errs=[]
        async def newpage():
            ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
            pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type=='error' and 'TUNNEL' not in m.text and '404' not in m.text else None)
            await pg.goto(URL); await pg.wait_for_timeout(1200)
            await pg.tap('#wn'); await pg.wait_for_timeout(500)
            await pg.tap('#cas [data-x="done"]'); await pg.wait_for_timeout(1000)
            return pg
        pg = await newpage()
        print('pick card:', (await pg.evaluate(CARD))[:260])
        await pg.screenshot(path=S+'z1_pick.png')
        await pg.tap('#tcard [data-cat="starter"]'); await pg.wait_for_timeout(900)
        print('starter card:', (await pg.evaluate(CARD))[:300])
        await pg.screenshot(path=S+'z2_starter_f.png')
        await pg.tap('#tcard [data-furn="0"]'); await pg.wait_for_timeout(500)
        print('unfurnished:', (await pg.evaluate(CARD))[:300])
        await pg.screenshot(path=S+'z3_starter_u.png')
        await pg.tap('#tcard [data-nav="1"]'); await pg.wait_for_timeout(800)
        print('next:', (await pg.evaluate(CARD))[:200])
        await pg.tap('#tcard [data-x="close"]'); await pg.wait_for_timeout(400)
        await pg.tap('#tcard [data-cat="empty"]'); await pg.wait_for_timeout(900)
        print('empty card:', (await pg.evaluate(CARD))[:300])
        await pg.screenshot(path=S+'z4_empty.png')
        # buy the cheapest starter unfurnished
        await pg.tap('#tcard [data-x="close"]'); await pg.wait_for_timeout(300)
        await pg.tap('#tcard [data-cat="starter"]'); await pg.wait_for_timeout(700)
        await pg.tap('#tcard [data-furn="0"]'); await pg.wait_for_timeout(300)
        exp = await pg.evaluate("()=>{const l=__ML.TV.sel.l;return {id:l.id,u:__ML.ev(`lotPrice(townLot('${l.id}'),false)`)}}")
        await pg.tap('#tcard [data-x="buy"]'); await pg.wait_for_timeout(1200)
        st = await pg.evaluate("()=>({money:__ML.G.money,fresh:__ML.G.fresh,lot:__ML.G.lot,mode:__ML.G.mode,rooms:__ML.W.rooms.length,objs:__ML.G.objects.map(o=>o.type).join(','),tut:__ML.G.tut.s,title:document.querySelector('#tut b')&&document.querySelector('#tut b').textContent,body:document.querySelector('#tut p')&&document.querySelector('#tut p').textContent})")
        print('bought unfurnished', exp, json.dumps(st))
        await pg.screenshot(path=S+'z5_unfurn_in.png')
        await pg.context.close()
        # furnished purchase
        pg = await newpage()
        await pg.tap('#tcard [data-cat="starter"]'); await pg.wait_for_timeout(700)
        await pg.tap('#tcard [data-nav="-1"]'); await pg.wait_for_timeout(700)
        exp = await pg.evaluate("()=>{const l=__ML.TV.sel.l;return {id:l.id,f:__ML.ev(`lotPrice(townLot('${l.id}'),true)`)}}")
        await pg.tap('#tcard [data-x="buy"]'); await pg.wait_for_timeout(1200)
        st = await pg.evaluate("()=>({money:__ML.G.money,fresh:__ML.G.fresh,lot:__ML.G.lot,mode:__ML.G.mode,checks:__ML.homeChecks().map(c=>c.k+':'+c.ok).join(' ')})")
        print('bought furnished', exp, json.dumps(st))
        await pg.context.close()
        # empty lot: clean lawn, then a room and a front door make a walkway
        pg = await newpage()
        await pg.tap('#tcard [data-cat="empty"]'); await pg.wait_for_timeout(700)
        await pg.tap('#tcard [data-x="buy"]'); await pg.wait_for_timeout(1200)
        st = await pg.evaluate("()=>{const M=__ML,W=M.W;let path=0;for(let i=0;i<W.floor.length;i++)if(W.floor[i]==='path')path++;return {money:M.G.money,fresh:M.G.fresh,mode:M.G.mode,path,objs:M.G.objects.map(o=>o.type+'@'+o.x+','+o.y).join(' ')}}")
        print('empty lot', json.dumps(st))
        await pg.screenshot(path=S+'z6_empty_in.png')
        r = await pg.evaluate("""()=>{const M=__ML,B=M.BB,W=M.W;B.tool='room';B.floor='wood';B.down(8,6);B.move(18,13);B.up();B.tool='door';B.down(12,13);B.up();
            let path=[];for(let y=0;y<24;y++)if(W.floor[13*0+12+y*28]==='path')path.push(y);return {rooms:W.rooms.length,door:W.wt[12+13*28],path,front:M.ev('hasFrontDoor()')}}""")
        print('room+door', r)
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=S+'z7_walkway.png')
        await pg.context.close()
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
