"""Harts town: park picnic, farmers market, neighbor visit, moving to an empty lot, save and reload, landscape cards."""
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
        await pg.tap('#wp'); await pg.wait_for_timeout(600)
        await pg.evaluate("()=>__ML.TUT.skip()")
        print('harts home', await pg.evaluate("()=>{const T=__ML.getTown();const l=T.lots.find(l=>l.id===__ML.G.home);return {seed:T.seed,name:T.name,kind:l.kind,addr:l.num+' '+l.street}}"))
        await pg.tap('#zoom [data-z="town"]'); await pg.wait_for_timeout(1300)
        await pg.screenshot(path=S+'tx1_harts_town.png')
        # Sunday picnic at the park
        r = await pg.evaluate("""()=>{const M=__ML,G=M.G;const d=Math.floor(G.time/1440);let day=d;while(((day%7)+7)%7!==6)day++;G.time=day*1440+12*60;const s=M.household()[0];s.act=null;s.queue.length=0;
           const before=M.G.people.filter(p=>p.role==='neighbor').map(p=>{const r=M.ev(`relPeek(personById('${s.id}'),personById('${p.id}'))`);return r&&r.met?1:0}).reduce((a,b)=>a+b,0);
           const why=M.outingBlock(s,'park');M.goOut(s,'park');M.TV.close();for(let i=0;i<400;i++)M.gameStep(.5);
           const after=M.G.people.filter(p=>p.role==='neighbor').map(p=>{const r=M.ev(`relPeek(personById('${s.id}'),personById('${p.id}'))`);return r&&r.met?1:0}).reduce((a,b)=>a+b,0);
           return {why,before,after,moods:s.moodlets.map(m=>m.id),away:!!s.away}}""")
        print('picnic', r)
        # Saturday market with produce and fish
        r = await pg.evaluate("""()=>{const M=__ML,G=M.G;let day=Math.floor(G.time/1440);while(((day%7)+7)%7!==5)day++;G.time=day*1440+9*60;G.produce={tomato:4};G.fish={bass:2};const s=M.household()[1];s.act=null;s.queue.length=0;
           const m0=G.money,why=M.outingBlock(s,'market');M.goOut(s,'market');for(let i=0;i<300;i++)M.gameStep(.5);return {why,earned:G.money-m0,produce:G.produce,fish:G.fish,moods:s.moodlets.map(m=>m.id)}}""")
        print('market', r)
        # market closed on Monday
        r = await pg.evaluate("""()=>{const M=__ML,G=M.G;let day=Math.floor(G.time/1440);while(((day%7)+7)%7!==0)day++;G.time=day*1440+10*60;return M.outingBlock(M.household()[0],'market')}""")
        print('market monday', r)
        # visit a neighbor
        r = await pg.evaluate("""()=>{const M=__ML,G=M.G,T=M.getTown();const l=T.lots.find(l=>l.kind==='neighbor');const s=M.household()[0];s.act=null;s.queue.length=0;const n=M.G.people.filter(p=>p.role==='neighbor')[l.owner];
           const f0=(M.ev(`relPeek(personById('${s.id}'),personById('${n.id}'))`)||{f:0}).f;const why=M.outingBlock(s,'nb:'+l.owner);M.goOut(s,'nb:'+l.owner);for(let i=0;i<320;i++)M.gameStep(.5);
           const r2=M.ev(`relPeek(personById('${s.id}'),personById('${n.id}'))`);return {who:n.first+' '+n.last,why,f0,f1:r2&&r2.f,met:r2&&r2.met,moods:s.moodlets.map(m=>m.id)}}""")
        print('visit', r)
        # move to an empty lot from browse mode
        await pg.tap('#zoom [data-z="town"]'); await pg.wait_for_timeout(1100)
        r = await pg.evaluate("""()=>{const M=__ML,T=M.getTown(),TV=M.TV;const l=T.lots.find(l=>l.kind==='empty');TV.select({t:'lot',l});return {id:l.id,price:l.price,money:M.G.money}}""")
        print('select empty', r)
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=S+'tx2_move_card.png')
        await pg.tap('#tcard [data-x="buy"]'); await pg.wait_for_timeout(400)
        print('confirm:', (await pg.evaluate("()=>document.getElementById('mcard').innerText.replace(/\\n/g,' | ')"))[:260])
        await pg.tap('#myes'); await pg.wait_for_timeout(1200)
        st = await pg.evaluate("()=>{const M=__ML;return {home:M.G.home,fresh:M.G.fresh,mode:M.G.mode,money:M.G.money,objs:M.G.objects.length,sold:M.G.town.sold,hh:M.household().map(s=>s.first+':'+s.onLot+':'+s.tx()+','+s.ty())}}")
        print('moved', json.dumps(st))
        await pg.screenshot(path=S+'tx3_moved.png')
        # save/load roundtrip
        r = await pg.evaluate("""()=>{const M=__ML;const d=JSON.parse(JSON.stringify(M.serialize()));M.loadGame(d);const T=M.getTown();const old=T.lots.find(l=>l.id===d.town.sold[0]);return {home:M.G.home,seed:T.seed,oldKind:old&&old.kind,fresh:M.G.fresh,fish:M.G.fish}}""")
        print('reload', r)
        print('\n'.join(errs) or 'no errors')
        # landscape town view
        ctx2 = await b.new_context(viewport={'width':844,'height':390}, device_scale_factor=3, is_mobile=True, has_touch=True)
        p2 = await ctx2.new_page(); p2.on('pageerror', lambda e: errs.append('L PAGEERROR: '+str(e)))
        await p2.goto(URL); await p2.wait_for_timeout(1000); await p2.tap('#wp'); await p2.wait_for_timeout(500); await p2.evaluate("()=>__ML.TUT.skip()")
        await p2.tap('#zoom [data-z="town"]'); await p2.wait_for_timeout(1300)
        await p2.screenshot(path=S+'tx4_land.png')
        await p2.evaluate("()=>{const T=__ML.getTown();__ML.TV.select({t:'poi',p:T.pois.find(p=>p.kind==='park')})}"); await p2.wait_for_timeout(700)
        await p2.screenshot(path=S+'tx5_land_park.png')
        print('\n'.join(errs) or 'no errors (all)')
        await b.close()
asyncio.run(main())
