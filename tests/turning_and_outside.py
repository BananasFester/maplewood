"""Turning furniture, never using things through a wall, the shower blur, walls up with a roof and the
Outside tool, wall lights at night, and Male / Female in create-a-sim. Desktop (1366x768) and phone (390x844)."""
import asyncio, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        errs = []
        def watch(pg):
            pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type == 'error' else None)
            pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        ctx = await b.new_context(viewport={'width':1366,'height':768})
        pg = await ctx.new_page(); watch(pg)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        ev = lambda code: pg.evaluate("(c)=>__ML.ev(c)", code)
        await pg.click('#wp'); await pg.wait_for_timeout(600)
        await ev("TUT.finish();G.speed=0;startSample();centerHome();UI.hideWelcome&&0;true")
        await pg.wait_for_timeout(300)

        # 1. a TV against the inside of the front wall: facing the wall is refused, turned around it is fine
        spot = await ev("""(()=>{for(let x=8;x<20;x++){const y=13;if(canPlace('tv',x,y,1)===true&&freeTile(x,y-1)&&freeTile(x,y-2))return [x,y];}return null})()""")
        print('tv spot by the front wall', spot)
        print('  facing the wall:', await ev(f"canPlace('tv',{spot[0]},{spot[1]},0)"))
        print('  turned to face the room:', await ev(f"canPlace('tv',{spot[0]},{spot[1]},1)"))
        # an old save can still have one facing the wall: nobody watches it from outside
        r = await ev(f"""(()=>{{const o=addObject('tv',{spot[0]},{spot[1]},{{rot:0}});refreshWorld();const s=household()[0];
            const a=pickSlot(s,o,'tvstand');o.rot=1;OBJ_SPR.clear();const b2=pickSlot(s,o,'tvstand');const out=[a?[a.ax,a.ay,roomAt(a.ax,a.ay)]:null,b2?[b2.ax,b2.ay,roomAt(b2.ax,b2.ay)]:null,roomAt(o.x,o.y)];removeObject(o);refreshWorld();return out;}})()""")
        print('  slot when facing the wall', r[0], '| slot when turned', r[1], '| tv room', r[2])

        # 2. turned chairs: someone sits facing left and right
        r = await ev("""(()=>{const s=household()[0];G.people.forEach(p=>{p.queue=[];p.act=null;});let xy=null;
            for(let y=10;y<13&&!xy;y++)for(let x=8;x<19;x++)if(canPlace('chair_dining',x,y,2)===true&&canPlace('chair_dining',x+1,y,3)===true&&freeTile(x-1,y)){xy=[x,y];break;}
            const a=addObject('chair_dining',xy[0],xy[1],{rot:2}),c=addObject('chair_dining',xy[0]+1,xy[1],{rot:3});refreshWorld();
            enqueue(s,ACTS.sit.build(s,a));for(let i=0;i<300&&!s.inObj;i++)gameStep(.2);return {at:xy,sitting:!!s.inObj,dir:s.dir,slot:s.inObj&&s.inObj.sl.key};})()""")
        print('sit in a chair facing left', json.dumps(r))
        # a loveseat turned sideways takes one tile across and two down, and seats two facing left
        r2 = await ev("""(()=>{const s=household()[1];s.queue=[];s.act=null;s.inObj=null;let xy=null;
            for(let y=10;y<12&&!xy;y++)for(let x=8;x<20;x++)if(canPlace('sofa',x,y,2)===true&&freeTile(x-1,y)&&freeTile(x-1,y+1)){xy=[x,y];break;}
            const o=addObject('sofa',xy[0],xy[1],{rot:2});refreshWorld();enqueue(s,ACTS.sit.build(s,o));for(let i=0;i<300&&!s.inObj;i++)gameStep(.2);
            return {at:xy,size:[o.def.w,o.def.h],covers:[objAt(xy[0],xy[1])===o,objAt(xy[0],xy[1]+1)===o,objAt(xy[0]+1,xy[1])===o],sitting:!!s.inObj,dir:s.dir};})()""")
        print('sideways loveseat', json.dumps(r2))
        await ev(f"centerOn({r['at'][0]}*T+16,{r['at'][1]}*T);setZoom(5);true"); await pg.wait_for_timeout(400)
        await pg.screenshot(path=S+'t1_turned_chairs.png')

        # 3. shower: no clothes, a soft blur
        r = await ev("""(()=>{const s=household()[0];s.queue=[];s.act=null;s.inObj=null;const o=G.objects.find(o=>o.type==='shower');enqueue(s,ACTS.shower.build(s,o));
            for(let i=0;i<400&&s.anim.pose!=='shower';i++)gameStep(.2);centerOn(o.x*T+8,o.y*T);setZoom(8);return {pose:s.anim.pose,at:[o.x,o.y]};})()""")
        print('shower', json.dumps(r)); await pg.wait_for_timeout(400)
        await pg.screenshot(path=S+'t2_shower.png')

        # 4. walls up, then the Outside tool
        await ev("G.people.forEach(p=>{p.queue=[];p.act=null;});centerHome();setZoom(4);true")
        await pg.click('#zoom [data-z="walls"]'); await pg.wait_for_timeout(400)
        print('walls up', await ev("R.wallsUp"), '| roofs', await ev("JSON.stringify(roofList())"))
        await pg.screenshot(path=S+'t3_walls_up.png')
        await pg.click('#zoom [data-z="walls"]'); await pg.wait_for_timeout(200)
        await pg.click('#modes [data-m="build"]'); await pg.wait_for_timeout(300)
        await pg.click('#build [data-t="ext"]'); await pg.wait_for_timeout(300)
        m0 = await ev("G.money")
        print('Outside tool raises the walls', await ev("R.wallsUp"))
        for sel in ['[data-ex="siding"][data-v="brick"]', '[data-ex="roof"][data-v="#3f4650"]', '[data-ex="shutter"][data-v="#3e7a4f"]', '[data-ex="door"][data-v="#c4453a"]']:
            await pg.click('#build '+sel); await pg.wait_for_timeout(150)
        print('exterior', json.dumps(await ev("G.ext")), '| paid', m0 - await ev("G.money"))
        await pg.screenshot(path=S+'t4_outside_tool.png')
        await pg.click('#build [data-t="room"]'); await pg.wait_for_timeout(200)
        print('walls back down after leaving the tool', not await ev("R.wallsUp"))
        saved = await ev("JSON.stringify(serialize().ext)"); print('saved exterior', saved)

        # 5. lights at night: a wall sconce, a globe light, string lights and a lamp post
        r = await ev("""(()=>{UI.setMode('live');const L=[];const wall=(t)=>{for(let y=0;y<LOTH;y++)for(let x=0;x<MW;x++)if(x>8&&canPlace(t,x,y,0)===true){addObject(t,x,y);refreshWorld();return [x,y];}};
            L.push(wall('sconce'),wall('sconce_globe'));const yard=(t)=>{for(let y=15;y<19;y++)for(let x=2;x<26;x++)if(canPlace(t,x,y,0)===true){addObject(t,x,y);refreshWorld();return [x,y];}};L.push(yard('string_lights'),yard('lamp_post'));
            refreshWorld();G.time=Math.floor(G.time/1440)*1440+21*60+30;return L;})()""")
        print('lights placed', r)
        await ev("centerHome();setZoom(4);true"); await pg.wait_for_timeout(600)
        await pg.screenshot(path=S+'t5_lights_night.png')
        await pg.keyboard.press('h'); await pg.wait_for_timeout(400)
        await pg.screenshot(path=S+'t6_walls_up_night.png')
        await pg.keyboard.press('h')

        # 6. create-a-sim: Male / Female
        await ev("UI.cas('new');true"); await pg.wait_for_timeout(300)
        await pg.click('#cas [data-k="body"][data-v="f"]'); await pg.wait_for_timeout(150)
        print('female: facial hair row shown', await pg.evaluate("()=>!!document.querySelector('#cas [data-k=\"beard\"]')"))
        await pg.screenshot(path=S+'t7_cas_female.png')
        await pg.click('#cas [data-k="body"][data-v="m"]'); await pg.wait_for_timeout(150)
        print('male: facial hair row shown', await pg.evaluate("()=>!!document.querySelector('#cas [data-k=\"beard\"]')"))
        for i in range(3):
            await pg.click('#cas [data-x="rand"]'); await pg.wait_for_timeout(80)
        print('randomize keeps the gender', await ev("bodyOf(UI.casSt.members[0].app)"))
        print('Harts', await ev("JSON.stringify(household().map(p=>p.first+':'+bodyOf(p.app)))"))
        await ctx.close()

        # 7. phone: walls up with the new exterior, and the zoom buttons still fit
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); watch(pg)
        await pg.goto(URL); await pg.wait_for_timeout(1500)
        await pg.tap('#wp'); await pg.wait_for_timeout(500)
        await pg.evaluate("()=>{__ML.TUT.finish();__ML.G.speed=0}")
        await pg.tap('#zoom [data-z="walls"]'); await pg.wait_for_timeout(500)
        print('phone zoom group', await pg.evaluate("()=>{const r=document.getElementById('zoom').getBoundingClientRect();return [Math.round(r.left),Math.round(r.right),innerWidth]}"))
        await pg.screenshot(path=S+'t8_phone_walls_up.png')
        await pg.tap('#zoom [data-z="walls"]'); await pg.wait_for_timeout(200)
        await pg.tap('#modes [data-m="buy"]'); await pg.wait_for_timeout(300)
        await pg.tap('#buy [data-c="electronics"]'); await pg.wait_for_timeout(200)
        await pg.tap('#bitems .item'); await pg.wait_for_timeout(200)
        await pg.tap('#place [data-p="rot"]'); await pg.wait_for_timeout(100)
        await pg.tap('#place [data-p="rot"]'); await pg.wait_for_timeout(100)
        print('phone Turn button cycles', await pg.evaluate("()=>__ML.BB.placing.rot"))
        await pg.screenshot(path=S+'t9_phone_turn.png')
        print('errors', errs)
        await b.close()
asyncio.run(main())
