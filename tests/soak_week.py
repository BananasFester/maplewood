"""A week of play with the Harts: tooltips everywhere, zoom and smoothing toggles, music, needs stay healthy."""
import asyncio, json, random
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type=='error' and 'TUNNEL' not in m.text and 'favicon' not in m.text and '404' not in m.text else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        await pg.tap('#wp'); await pg.wait_for_timeout(600)
        # exercise every tooltip key + world tips at random points
        r = await pg.evaluate("""()=>{const M=__ML;const keys=[...document.querySelectorAll('[data-tip]')].map(e=>e.dataset.tip);
          const extra=['need:hunger','need:energy','need:bladder','need:hygiene','need:fun','need:social','moodsum','job','wish','rewards','money','clock','sim:sel','q:-1','q:0'];
          for(const k of Object.keys(M.CATALOG))extra.push('obj:'+k);for(const k of Object.keys(window.__ML.G?{}:{}))0;
          let n=0,bad=[];for(const k of keys.concat(extra)){try{M.tipData(k);n++;}catch(e){bad.push(k+': '+e.message);}}
          let w=0;for(let i=0;i<400;i++){try{M.worldTip(Math.random()*28*16,Math.random()*24*16);w++;}catch(e){bad.push('world: '+e.message);}}
          return {n,w,bad:bad.slice(0,8)};}""")
        print('tips', r)
        days=8
        for d in range(days):
            for h in range(24):
                await pg.evaluate("()=>{const M=__ML;for(let i=0;i<120;i++)M.gameStep(.5);}")
                if h%6==0: await pg.wait_for_timeout(30)
            act = random.choice(['zoomin','zoomout','buy','live','smoothoff','smoothon','pinch'])
            await pg.evaluate("""(a)=>{const M=__ML;if(a==='zoomin')M.zoomStep(1);if(a==='zoomout')M.zoomStep(-1);
               if(a==='buy')M.UI.setMode('buy');if(a==='live')M.UI.setMode('live');if(a==='smoothoff'){M.G.settings.smooth=false;M.applySmooth(false);}
               if(a==='smoothon'){M.G.settings.smooth=true;M.applySmooth(true);}if(a==='pinch')M.setZoom(M.R.Z*1.7,500,900);}""", act)
            await pg.wait_for_timeout(120)
            st = await pg.evaluate("()=>{const M=__ML;return {day:Math.floor(M.G.time/1440),money:M.G.money,mode:M.G.mode,Z:+M.R.Z.toFixed(2),smooth:M.R.smooth,mus:M.MUS.track,ppl:M.household().map(p=>p.first+':'+(p.act?p.act.id:'-')+':'+Math.round(Math.min(...Object.values(p.needs))))}}")
            print('day', d, act, json.dumps(st))
        await pg.evaluate("()=>{const M=__ML;M.UI.setMode('live');M.G.settings.smooth=true;M.applySmooth(true);M.G.time=Math.floor(M.G.time/1440)*1440+20*60+30;M.G.speed=0;}")
        await pg.wait_for_timeout(600)
        await pg.screenshot(path=S+'d1_night_smooth.png')
        await pg.evaluate("()=>{const M=__ML;M.G.settings.smooth=false;M.applySmooth(false);}")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=S+'d2_night_pixel.png')
        await pg.evaluate("()=>{const M=__ML;M.G.settings.smooth=true;M.applySmooth(true);M.G.time=Math.floor(M.G.time/1440)*1440+13*60;M.UI.setMode('buy');}")
        await pg.wait_for_timeout(600)
        await pg.screenshot(path=S+'d3_buy.png')
        await pg.evaluate("()=>{__ML.UI.setMode('build');}")
        await pg.wait_for_timeout(500)
        await pg.screenshot(path=S+'d4_build.png')
        await pg.evaluate("()=>{__ML.UI.setMode('live');}")
        print('\n'.join(errs[:20]) or 'no errors')
        # landscape
        ctx2 = await b.new_context(viewport={'width':844,'height':390}, device_scale_factor=3, is_mobile=True, has_touch=True)
        p2 = await ctx2.new_page(); p2.on('pageerror', lambda e: errs.append('L PAGEERROR: '+str(e)))
        await p2.goto(URL); await p2.wait_for_timeout(1200); await p2.tap('#wp'); await p2.wait_for_timeout(800)
        await p2.screenshot(path=S+'d5_land.png')
        # desktop with hover tip
        ctx3 = await b.new_context(viewport={'width':1280,'height':800}, device_scale_factor=1)
        p3 = await ctx3.new_page(); p3.on('pageerror', lambda e: errs.append('D PAGEERROR: '+str(e)))
        await p3.goto(URL); await p3.wait_for_timeout(1200); await p3.click('#wp'); await p3.wait_for_timeout(800)
        await p3.hover('[data-tip="need:fun"]'); await p3.wait_for_timeout(900)
        await p3.screenshot(path=S+'d6_desk.png')
        print('\n'.join(errs[:20]) or 'no errors (all)')
        await b.close()
asyncio.run(main())
