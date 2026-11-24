"""New household on an empty lot: back to setup keeps the town, reroll, build rooms, furnish, a week of outings, save and reload."""
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
        await pg.tap('#wn'); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{const st=__ML.UI.casSt;st.members.push({first:'Ivy',last:st.members[0].last,app:st.members[0].app,traits:[]});}")
        await pg.tap('#cas [data-x="done"]'); await pg.wait_for_timeout(900)
        print('pick open', await pg.evaluate("()=>({on:__ML.TV.on,mode:__ML.TV.mode,town:__ML.getTown().name})"))
        # back returns to CAS, done reopens the town
        await pg.tap('#tbar'); await pg.wait_for_timeout(500)
        print('back ->', await pg.evaluate("()=>({on:__ML.TV.on,cas:!document.getElementById('cas').classList.contains('hidden')})"))
        await pg.tap('#cas [data-x="done"]'); await pg.wait_for_timeout(900)
        n1 = await pg.evaluate("()=>__ML.getTown().name")
        await pg.tap('#tcard [data-x="reroll"]'); await pg.wait_for_timeout(700)
        n2 = await pg.evaluate("()=>__ML.getTown().name")
        print('reroll', n1, '->', n2)
        # tap the biggest-value empty lot on screen with a real touch
        pos = await pg.evaluate("""()=>{const M=__ML,T=M.getTown(),TV=M.TV;const l=T.lots.filter(l=>l.kind==='empty').sort((a,b)=>b.price-a.price)[0];
            TV.flyTo(l.x+14,TV.focusY(l.y+10,TV.fitZ()*1.6),TV.fitZ()*1.6,.01);return l.id}""")
        await pg.wait_for_timeout(500)
        xy = await pg.evaluate(f"""()=>{{const M=__ML,T=M.getTown(),TV=M.TV;const l=T.lots.find(l=>l.id==='{pos}');const [sx,sy]=TV.w2s(l.x+5,l.y+4);return [sx/TV.dpr,sy/TV.dpr]}}""")
        await pg.touchscreen.tap(xy[0], xy[1]); await pg.wait_for_timeout(600)
        print('card:', (await pg.evaluate("()=>document.getElementById('tcard').innerText.replace(/\\n/g,' | ')"))[:200])
        await pg.screenshot(path=S+'tz1_empty_pick.png')
        await pg.tap('#tcard [data-x="buy"]'); await pg.wait_for_timeout(1000)
        print('start', await pg.evaluate("()=>({money:__ML.G.money,fresh:__ML.G.fresh,mode:__ML.G.mode,lot:__ML.G.lot,home:__ML.G.home,hh:__ML.household().length,tut:__ML.G.tut.s})"))
        await pg.screenshot(path=S+'tz2_fresh.png')
        r = await pg.evaluate("""()=>{const M=__ML,B=M.BB_;const room=(a,b,c,d,fl)=>{B.tool='room';B.floor=fl||'wood';B.down(a,b);B.move(c,d);B.up();};
          room(8,6,19,14,'wood');room(8,2,13,6,'white');room(13,2,19,6,'carpet');
          const door=(x,y)=>{B.tool='door';B.down(x,y);B.up();};door(13,14);door(10,6);door(16,6);
          B.tool='window';B.down(10,14);B.up();B.down(17,14);B.up();
          return {rooms:M.W.rooms.length,money:M.G.money,checks:M.homeChecks().map(c=>c.k+':'+c.ok).join(' ')};}""")
        print('built', r)
        r = await pg.evaluate("""()=>{const M=__ML,out=[];const put=(t,c)=>{for(const [x,y] of c){if(M.ev(`canPlace('${t}',${x},${y},0,null)`)===true){M.ev(`addObject('${t}',${x},${y},{});G.money-=CATALOG['${t}'].p;`);out.push(t);return;}}out.push(t+'!');};
          put('toilet',[[9,3],[10,3]]);put('shower',[[11,3],[12,3]]);put('sink_b',[[9,3],[10,3],[11,3]]);
          put('bed_double',[[14,3],[16,3]]);put('lamp_table',[[18,3],[14,3]]);
          put('fridge',[[9,7]]);put('counter',[[10,7],[14,7]]);put('stove',[[11,7]]);put('sink_k',[[12,7]]);put('table_dining',[[9,10]]);put('chair_dining',[[9,9]]);put('chair_dining',[[10,9]]);
          put('sofa',[[15,11]]);put('tv',[[15,8]]);put('bookshelf',[[18,7]]);put('trash',[[13,7]]);
          M.ev('refreshWorld()');return {out,money:M.G.money,checks:M.homeChecks().map(c=>c.k+':'+c.ok).join(' ')};}""")
        print('furnished', r)
        await pg.evaluate("()=>{__ML.UI.setMode('live')}"); await pg.wait_for_timeout(500)
        if await pg.evaluate("()=>!document.getElementById('modal').classList.contains('hidden')"):
            await pg.tap('#myes'); await pg.wait_for_timeout(400)
        print('moved in', await pg.evaluate("()=>({fresh:__ML.G.fresh,mode:__ML.G.mode,tut:__ML.G.tut.s})"))
        await pg.evaluate("()=>__ML.TUT.skip()")
        # a week of play: jobs + an outing each day
        await pg.evaluate("""()=>{const M=__ML;for(const s of M.household())if(!s.job)M.ev(`joinCareer(personById('${M.household()[0].id}'),'culinary')`);}""")
        dests=['lake','park','cafe','library','gym','museum','market','nb:0']
        for d in range(7):
            r = await pg.evaluate(f"""()=>{{const M=__ML,G=M.G;const out=[];for(const s of M.household()){{const why=M.outingBlock(s,'{dests[d]}'.replace('lake',M.getTown().pois.find(p=>p.kind==='lake').id).replace('park',M.getTown().pois.find(p=>p.kind==='park').id));out.push(s.first+':'+(why||'ok'));}}
                const s=M.household().find(s=>!M.outingBlock(s,M.getTown().pois.find(p=>p.kind==='{dests[d]}'.split(':')[0])?.id||'{dests[d]}'));
                const id=M.getTown().pois.find(p=>p.kind==='{dests[d]}')?.id||'{dests[d]}';if(s)M.goOut(s,id);
                for(let i=0;i<2880;i++)M.gameStep(.5);return {{out,went:s?s.first+'->'+id:'-',money:G.money,fish:G.fish,needs:M.household().map(s=>s.first+':'+Math.round(Math.min(...Object.values(s.needs)))+':'+(s.away?'away':'home'))}}}}""")
            print('day', d+1, json.dumps(r))
        await pg.screenshot(path=S+'tz3_week.png')
        for k in range(4):
            if await pg.evaluate("()=>!document.getElementById('modal').classList.contains('hidden')"):
                print('modal:', (await pg.evaluate("()=>document.getElementById('mcard').innerText.split(String.fromCharCode(10)).join(' | ')"))[:160])
                await pg.evaluate("()=>document.querySelector('#mcard button').click()"); await pg.wait_for_timeout(400)
        await pg.tap('#zoom [data-z="town"]'); await pg.wait_for_timeout(1300)
        await pg.screenshot(path=S+'tz4_town_after.png')
        await pg.tap('#tbar'); await pg.wait_for_timeout(500)
        r = await pg.evaluate("()=>{const M=__ML;const objs=M.G.objects.length,home=M.G.home,seed=M.G.town.seed;const d=JSON.parse(JSON.stringify(M.serialize()));M.loadGame(d);return {same:objs===M.G.objects.length&&home===M.G.home&&seed===M.getTown().seed,objs,home,seed,rooms:M.W.rooms.length,mode:M.G.mode}}")
        print('reload', r)
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
