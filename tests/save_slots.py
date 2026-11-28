"""Save slots: each household keeps its own save. First game, a second household from the start menu, switching
between them, an old single save still loading, deleting a save (with a warning), the in-game New household, and the
limit. Also the smaller tour card in Buy mode (out of the way, and gone while an item is being placed).
Phone (390x844) with touch, then the start menu on a desktop (1366x768)."""
import asyncio, json
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts, pick_traits

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        errs = []
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        pg.on('console', lambda m: errs.append(m.type+': '+m.text) if m.type == 'error' else None)
        text = lambda sel: pg.evaluate("(s)=>{const e=document.querySelector(s);return e?e.innerText.replace(/\\s+/g,' ').trim():null}", sel)
        slots = lambda: pg.evaluate("()=>JSON.stringify({cur:__ML.SLOT.cur,list:__ML.SLOT.list(),hold:__ML.SLOT.hold})")

        # an older game saved before slots existed loads as slot 1
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        await pg.evaluate("()=>{const d=__ML.serialize();d.money=777;localStorage.clear();localStorage.setItem('mapleLane.save.v1',JSON.stringify(d));}")
        await pg.reload(); await pg.wait_for_timeout(1200)
        print('old save:', await text('#welcome .wslots'), '| slots', await slots())
        await pg.evaluate("()=>{__ML.SLOT.hold=true;localStorage.clear()}")

        # first visit: nothing saved until someone plays
        await pg.reload(); await pg.wait_for_timeout(1200)
        await pg.evaluate("()=>__ML.ev('autosave(true)')")
        print('first visit, nothing saved yet:', await slots())
        await pg.tap('#wp'); await pg.wait_for_timeout(400)
        await pg.evaluate("()=>{__ML.TUT.finish();__ML.G.money=4321;__ML.ev('autosave(true)')}")
        print('played the Harts:', await slots())

        # a second player makes their own household from the start menu
        await pg.evaluate("()=>__ML.UI.menu()"); await pg.wait_for_timeout(200)
        await pg.tap('#mcard [data-x="title"]'); await pg.wait_for_timeout(300)
        await pg.tap('#wn'); await pg.wait_for_timeout(200)
        print('new game step:', await text('#welcome .wcard'))
        await pg.tap('#wn'); await pg.wait_for_timeout(300)
        await pg.fill('#fn', 'Robin'); await pg.fill('#ln', 'Oak')
        await pick_traits(pg)
        await pg.tap('#cas [data-x="done"]'); await pg.wait_for_timeout(900)
        await pg.evaluate("()=>{const M=__ML,T=M.getTown();M.TV.buy(T.lots.filter(l=>l.kind==='starter').sort((a,b)=>a.price-b.price)[0]);}")
        await pg.wait_for_timeout(600)
        print('Oaks moved in:', await slots(), '| money', await pg.evaluate("()=>__ML.G.money"), '| tour', await pg.evaluate("()=>__ML.G.tut.s"))

        # tour card in Buy mode: at the top, and out of the way while placing
        await pg.evaluate("()=>{__ML.UI.setMode('buy')}"); await pg.wait_for_timeout(400)
        r = await pg.evaluate("()=>{const t=document.getElementById('tut'),b=document.getElementById('buy');const a=t.getBoundingClientRect(),c=b.getBoundingClientRect();return{shown:!t.classList.contains('hidden'),top:Math.round(a.top),bottom:Math.round(a.bottom),panelTop:Math.round(c.top)}}")
        print('tour card in buy mode', json.dumps(r))
        await pg.screenshot(path=S+'ss1_tour_buy.png')
        await pg.tap('#bitems .item'); await pg.wait_for_timeout(300)
        print('while placing, card out of the way', await pg.evaluate("()=>document.getElementById('tut').classList.contains('aside')"))
        await pg.evaluate("()=>__ML.BB_.cancel()"); await pg.wait_for_timeout(300)
        print('after placing, card back', await pg.evaluate("()=>!document.getElementById('tut').classList.contains('aside')"))
        await pg.evaluate("()=>{__ML.TUT.finish();__ML.G.fresh=false;__ML.UI.setMode('live');__ML.ev('autosave(true)')}")

        # both saves are listed; switching loads the right one
        await pg.reload(); await pg.wait_for_timeout(1300)
        print('menu after reload:', await text('#welcome .wslots'))
        await pg.screenshot(path=S+'ss2_two_saves.png')
        hart = await pg.evaluate("()=>[...document.querySelectorAll('#welcome [data-slot]')].find(b=>b.innerText.includes('Hart')).dataset.slot")
        await pg.tap(f'#welcome [data-slot="{hart}"]'); await pg.wait_for_timeout(500)
        print('picked the Harts:', await pg.evaluate("()=>({last:__ML.household()[0].last,money:__ML.G.money,playing:!__ML.UI.welcomeOn})"), await slots())
        await pg.evaluate("()=>{__ML.G.money=5555;__ML.ev('autosave(true)')}")
        await pg.evaluate("()=>__ML.UI.menu()"); await pg.wait_for_timeout(200)
        await pg.tap('#mcard [data-x="title"]'); await pg.wait_for_timeout(300)
        oak = await pg.evaluate("()=>[...document.querySelectorAll('#welcome [data-slot]')].find(b=>b.innerText.includes('Oak')).dataset.slot")
        await pg.tap(f'#welcome [data-slot="{oak}"]'); await pg.wait_for_timeout(500)
        print('picked the Oaks:', await pg.evaluate("()=>({last:__ML.household()[0].last,first:__ML.household()[0].first,playing:!__ML.UI.welcomeOn})"), await slots())
        print('Harts kept their money', await pg.evaluate(f"()=>__ML.SLOT.read({hart}).money"))

        # in-game New household opens a third save; cancelling it keeps playing the Oaks
        await pg.evaluate("()=>__ML.UI.menu()"); await pg.wait_for_timeout(200)
        await pg.tap('#mcard [data-x="cas"]'); await pg.wait_for_timeout(300)
        await pg.tap('#cas [data-x="cancel"]'); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>__ML.ev('autosave(true)')")
        print('cancelled New household:', await slots(), await pg.evaluate("()=>__ML.household()[0].last"))

        # delete asks first, and cancelling keeps the save
        await pg.evaluate("()=>__ML.UI.menu()"); await pg.wait_for_timeout(200)
        await pg.tap('#mcard [data-x="title"]'); await pg.wait_for_timeout(300)
        await pg.tap(f'#welcome [data-del="{hart}"]'); await pg.wait_for_timeout(300)
        print('delete warning:', await text('#mcard'))
        await pg.screenshot(path=S+'ss3_delete_warning.png')
        await pg.tap('#mno'); await pg.wait_for_timeout(300)
        print('kept after No:', await slots())
        await pg.tap(f'#welcome [data-del="{hart}"]'); await pg.wait_for_timeout(300)
        await pg.tap('#myes'); await pg.wait_for_timeout(400)
        print('after delete:', await slots(), '|', await text('#welcome .wslots'))
        # deleting the save being played falls back to another one, or to a fresh start menu
        await pg.tap(f'#welcome [data-del="{oak}"]'); await pg.wait_for_timeout(300)
        await pg.tap('#myes'); await pg.wait_for_timeout(400)
        print('all deleted:', await slots(), '| first-visit menu', await pg.evaluate("()=>!!document.querySelector('#welcome .wopts')&&!document.querySelector('#welcome #wb')"))

        # the limit: a full device asks to delete one first
        await pg.evaluate("()=>{const d=__ML.serialize();d.savedAt=Date.now();for(let n=1;n<=__ML.ev('MAX_SLOTS');n++)localStorage.setItem(__ML.SLOT.key(n),JSON.stringify(d));__ML.UI.welcome('continue');}")
        await pg.wait_for_timeout(300)
        await pg.tap('#wn'); await pg.wait_for_timeout(300)
        print('full: still on the list', await pg.evaluate("()=>!!document.querySelector('#welcome .wslots')"), '| toast', await pg.evaluate("()=>document.getElementById('toasts').innerText.trim().split('\\n').pop()"))
        await pg.screenshot(path=S+'ss4_full.png')
        await ctx.close()

        # desktop: the list with a mouse
        ctx = await b.new_context(viewport={'width':1366,'height':768})
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        await pg.click('#wp'); await pg.wait_for_timeout(300)
        await pg.evaluate("()=>{__ML.TUT.finish();__ML.ev('autosave(true)');const d=__ML.serialize();d.people.filter(p=>p.role==='household').forEach(p=>p.last='Birch');d.savedAt=Date.now()-86400000*2;localStorage.setItem(__ML.SLOT.key(2),JSON.stringify(d));__ML.UI.welcome('continue');}")
        await pg.wait_for_timeout(300)
        await pg.hover('#welcome [data-del]'); await pg.wait_for_timeout(700)
        print('desktop list:', await pg.evaluate("()=>document.querySelector('#welcome .wslots').innerText.replace(/\\s+/g,' ')"))
        await pg.screenshot(path=S+'ss5_desktop.png')
        await ctx.close()
        print('errors', errs)
        await b.close()
asyncio.run(main())
