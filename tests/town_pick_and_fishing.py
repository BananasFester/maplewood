"""New household picks a furnished starter home on the town map, then goes fishing at the lake."""
import asyncio, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts, pick_traits
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type=='error' and 'TUNNEL' not in m.text and '404' not in m.text else None)
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        info = await pg.evaluate("""()=>{const T=__ML.genTown(12345);const k={};for(const l of T.lots)k[l.kind]=(k[l.kind]||0)+1;return {name:T.name,W:T.W,H:T.H,lots:T.lots.length,kinds:k,pois:T.pois.map(p=>p.kind+':'+p.name),roads:T.roads.length,trees:T.trees.length}}""")
        print(json.dumps(info))
        # new household -> town pick mode
        await pg.tap('#wn'); await pg.wait_for_timeout(500)
        await pick_traits(pg)
        await pg.tap('#cas [data-x="done"]'); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=S+'tw1_pick.png')
        # select a starter home and an empty lot by tapping their centers
        pos = await pg.evaluate("""()=>{const T=__ML.getTown(),TV=__ML.TV;const l=T.lots.find(l=>l.kind==='starter'&&l.furn);TV.cam.x=l.x+14;TV.cam.y=l.y+10;TV.cam.z=TV.fitZ()*2.6;TV.clampCam();TV.dirty=true;const [sx,sy]=TV.w2s(l.x+14,l.y+10);return [sx/TV.dpr,sy/TV.dpr,l.id]}""")
        await pg.wait_for_timeout(300)
        await pg.tap('#town', position={'x':pos[0],'y':pos[1]}); await pg.wait_for_timeout(600)
        await pg.screenshot(path=S+'tw2_starter.png')
        print('card:', (await pg.evaluate("()=>document.getElementById('tcard').innerText.replace(/\\n/g,' | ')"))[:300])
        # POI: lake
        pos = await pg.evaluate("""()=>{const T=__ML.getTown(),TV=__ML.TV;const p=T.pois.find(p=>p.kind==='lake');TV.cam.x=p.bx;TV.cam.y=p.by;TV.cam.z=TV.fitZ()*2;TV.clampCam();TV.dirty=true;const [sx,sy]=TV.w2s(p.bx,p.by);return [sx/TV.dpr,sy/TV.dpr]}""")
        await pg.wait_for_timeout(300)
        await pg.tap('#town', position={'x':pos[0],'y':pos[1]}); await pg.wait_for_timeout(600)
        await pg.screenshot(path=S+'tw3_lake.png')
        # zoomed out overview
        await pg.evaluate("()=>{const TV=__ML.TV;TV.select(null);TV.cam.x=__ML.getTown().W/2;TV.cam.y=__ML.getTown().H/2;TV.cam.z=TV.fitZ();TV.clampCam();TV.dirty=true;}")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=S+'tw4_overview.png')
        # buy the starter home
        await pg.evaluate("""(id)=>{const TV=__ML.TV,l=__ML.getTown().lots.find(l=>l.id===id);TV.select({t:'lot',l});}""", pos and (await pg.evaluate("()=>__ML.getTown().lots.find(l=>l.kind==='starter'&&l.furn).id")))
        await pg.wait_for_timeout(300)
        await pg.tap('#tcard [data-x="buy"]'); await pg.wait_for_timeout(1500)
        st = await pg.evaluate("()=>({mode:__ML.G.mode,fresh:__ML.G.fresh,money:__ML.G.money,home:__ML.G.home,town:__ML.G.town,objs:__ML.G.objects.length,rooms:__ML.W.rooms.length,tut:__ML.G.tut.s,checks:__ML.homeChecks().map(c=>c.k+':'+c.ok).join(' ')})")
        print('bought', json.dumps(st))
        await pg.screenshot(path=S+'tw5_home.png')
        # open town in browse mode via the button, check home and events
        await pg.evaluate("()=>{__ML.TUT.skip()}")
        await pg.tap('#zoom [data-z="town"]'); await pg.wait_for_timeout(1400)
        await pg.screenshot(path=S+'tw6_browse.png')
        # go fishing
        r = await pg.evaluate("""()=>{const M=__ML,s=M.household()[0];M.G.time=Math.floor(M.G.time/1440)*1440+10*60;return M.outingBlock(s,'lake')}""")
        print('block?', r)
        pos = await pg.evaluate("""()=>{const T=__ML.getTown(),TV=__ML.TV;const p=T.pois.find(p=>p.kind==='lake');TV.flyTo(p.bx,p.by,TV.fitZ()*2.2,.01);return 1}""")
        await pg.wait_for_timeout(400)
        await pg.evaluate("""()=>{const T=__ML.getTown(),TV=__ML.TV;TV.select({t:'poi',p:T.pois.find(p=>p.kind==='lake')});}""")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=S+'tw7_lakecard.png')
        await pg.tap('#tcard [data-x="go"]'); await pg.wait_for_timeout(800)
        print('after go', await pg.evaluate("()=>({mode:__ML.G.mode,town:__ML.TV.on,act:__ML.household()[0].act&&__ML.household()[0].act.label,q:__ML.household()[0].queue.length})"))
        for i in range(8):
            await pg.evaluate("()=>{for(let i=0;i<60;i++)__ML.gameStep(.5)}")
        print('away', await pg.evaluate("()=>{const s=__ML.household()[0];return {away:s.away,onLot:s.onLot}}"))
        await pg.tap('#zoom [data-z="town"]'); await pg.wait_for_timeout(900)
        await pg.screenshot(path=S+'tw8_atlake.png')
        await pg.tap('#tbar'); await pg.wait_for_timeout(500)
        for i in range(10):
            await pg.evaluate("()=>{for(let i=0;i<60;i++)__ML.gameStep(.5)}")
        print('back', await pg.evaluate("()=>{const s=__ML.household()[0];return {away:s.away,onLot:s.onLot,fish:__ML.G.fish,moods:s.moodlets.map(m=>m.id)}}"))
        print('toasts', await pg.evaluate("()=>[...document.querySelectorAll('.toast')].map(t=>t.innerText)"))
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
