"""Same town after going back, tappable event reminders, fishing derby, selling furniture, building a room over a tree."""
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
        # same town after going back to household setup
        await pg.tap('#wn'); await pg.wait_for_timeout(500)
        await pick_traits(pg)
        await pg.tap('#cas [data-x="done"]'); await pg.wait_for_timeout(800)
        a = await pg.evaluate("()=>__ML.getTown().seed")
        await pg.tap('#tbar'); await pg.wait_for_timeout(400)
        await pg.tap('#cas [data-x="done"]'); await pg.wait_for_timeout(800)
        b2 = await pg.evaluate("()=>__ML.getTown().seed")
        await pg.tap('#tcard [data-x="reroll"]'); await pg.wait_for_timeout(600)
        c = await pg.evaluate("()=>__ML.getTown().seed")
        print('same town after back:', a==b2, '| reroll changes:', c!=b2)
        # buy a furnished starter and go live
        await pg.evaluate("()=>{const M=__ML,T=M.getTown();const l=T.lots.filter(l=>l.kind==='starter'&&l.furn).sort((a,b)=>a.price-b.price)[0];M.TV.select({t:'lot',l});}")
        await pg.wait_for_timeout(300); await pg.tap('#tcard [data-x="buy"]'); await pg.wait_for_timeout(900)
        await pg.evaluate("()=>__ML.TUT.skip()")
        print('live', await pg.evaluate("()=>({mode:__ML.G.mode,fresh:__ML.G.fresh,town:__ML.getTown().name})"))
        # jump to just before 8 AM on the derby day (Friday)
        await pg.evaluate("""()=>{const M=__ML,G=M.G;let d=Math.floor(G.time/1440)+1;while(((d%7)+7)%7!==4)d++;G.time=d*1440+7*60+58;for(const s of M.household()){s.act=null;s.queue.length=0;}for(let i=0;i<8;i++)M.gameStep(.5);}""")
        await pg.wait_for_timeout(300)
        t = await pg.evaluate("()=>[...document.querySelectorAll('#toasts .toast')].map(t=>(t.classList.contains('tap')?'[tap] ':'')+t.innerText)")
        print('8am toasts', t)
        await pg.screenshot(path=S+'tq1_toast.png')
        await pg.tap('#toasts .toast.tap'); await pg.wait_for_timeout(1300)
        print('after tap', await pg.evaluate("()=>({on:__ML.TV.on,mode:__ML.TV.mode,sel:__ML.TV.sel&&__ML.TV.sel.t+':'+(__ML.TV.sel.p&&__ML.TV.sel.p.kind),card:document.getElementById('tcard').innerText.split(String.fromCharCode(10)).slice(0,3).join(' | ')})"))
        await pg.screenshot(path=S+'tq2_lake.png')
        await pg.tap('#tbar'); await pg.wait_for_timeout(400)
        # event start toast at 5 PM
        await pg.evaluate("""()=>{const M=__ML,G=M.G;G.time=Math.floor(G.time/1440)*1440+16*60+58;for(const s of M.household()){s.act=null;s.queue.length=0;}for(let i=0;i<8;i++)M.gameStep(.5);}""")
        await pg.wait_for_timeout(200)
        print('5pm toasts', await pg.evaluate("()=>[...document.querySelectorAll('#toasts .toast')].map(t=>(t.classList.contains('tap')?'[tap] ':'')+t.innerText)"))
        # derby catch doubles
        r = await pg.evaluate("""()=>{const M=__ML,G=M.G;G.fish={};const s=M.household()[0];s.act=null;s.queue.length=0;const lake=M.getTown().pois.find(p=>p.kind==='lake');const why=M.outingBlock(s,lake.id);M.goOut(s,lake.id);for(let i=0;i<500;i++)M.gameStep(.5);return {why,fish:G.fish,moods:s.moodlets.map(m=>m.id)}}""")
        print('derby', r)
        # selling a piece of furniture works and refreshes the world
        r = await pg.evaluate("""()=>{const M=__ML,G=M.G;M.UI.setMode('buy');const o=G.objects.find(o=>o.type==='bookshelf'||o.type==='lamp_floor'||o.type==='plant'||o.def.c==='decor');if(!o)return 'none';const m0=G.money,n0=G.objects.length;M.BB.objTap(o,100,100);
            const btn=[...document.querySelectorAll('#ctx button, .ctx button, #menu button')].find(b=>/Sell/.test(b.innerText));if(btn)btn.click();return {type:o.type,sold:G.objects.length===n0-1,gain:G.money-m0,btn:!!btn,objAtClear:!M.W.objAt.includes(o)}}""")
        print('sell', r)
        # a room drawn over trees clears them
        r = await pg.evaluate("""()=>{const M=__ML,G=M.G,B=M.BB;M.UI.setMode('build');const tr=G.objects.find(o=>o.type==='tree'&&o.y<8&&o.x>2&&o.x<25);if(!tr)return 'no tree';const m0=G.money;
            B.tool='room';B.floor='wood';B.down(tr.x-1,tr.y-1);B.move(tr.x+2,tr.y+2);B.up();return {treeGone:!G.objects.includes(tr),spent:m0-G.money,rooms:M.W.rooms.length,toast:[...document.querySelectorAll('#toasts .toast')].map(t=>t.innerText).pop()}}""")
        print('room over tree', r)
        await pg.screenshot(path=S+'tq3_room.png')
        print('\n'.join(errs) or 'no errors')
        await b.close()
asyncio.run(main())
