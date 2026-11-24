"""The start menu: first visit, coming back to a saved game, starting a new game over a save (with a warning),
backing out of create-a-sim, and Main menu from the game. Phone (390x844) and desktop (1366x768)."""
import asyncio
from playwright.async_api import async_playwright
from common import URL, SHOTS as S, launch_opts, pick_traits

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        errs = []
        for name, opts in [('phone', dict(viewport={'width':390,'height':844}, device_scale_factor=3, is_mobile=True, has_touch=True)),
                           ('desk', dict(viewport={'width':1366,'height':768}))]:
            ctx = await b.new_context(**opts)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append('PAGEERROR: '+str(e)))
            press = pg.tap if name == 'phone' else pg.click
            text = lambda sel: pg.evaluate("(s)=>{const e=document.querySelector(s);return e?e.innerText.replace(/\\s+/g,' ').trim():null}", sel)
            await pg.goto(URL); await pg.wait_for_timeout(1300)
            print(name, '| first visit:', await text('#welcome .wcard'))
            await pg.screenshot(path=S+f'sm1_first_{name}.png')
            await press('#wp'); await pg.wait_for_timeout(500)
            await pg.evaluate("()=>{__ML.TUT.finish();__ML.G.money=4321;__ML.ev('autosave(true)')}")
            # come back: the saved game is offered
            await pg.reload(); await pg.wait_for_timeout(1300)
            print(name, '| with a save:', await text('#welcome .wcard'))
            await pg.screenshot(path=S+f'sm2_continue_{name}.png')
            await press('#wn'); await pg.wait_for_timeout(300)
            print(name, '| new game step:', await text('#welcome .wcard'))
            await pg.screenshot(path=S+f'sm3_newgame_{name}.png')
            await press('#wb'); await pg.wait_for_timeout(200)
            print(name, '| back shows the save again:', await pg.evaluate("()=>!!document.querySelector('#welcome .wsave')"))
            # a new household asks first, and backing out of create-a-sim returns to the menu with the save intact
            await press('#wn'); await pg.wait_for_timeout(200); await press('#wn'); await pg.wait_for_timeout(300)
            print(name, '| warning:', await text('#mcard'))
            await press('#myes'); await pg.wait_for_timeout(400)
            print(name, '| create-a-sim open', await pg.evaluate("()=>!document.getElementById('cas').classList.contains('hidden')"))
            await press('#cas [data-x="cancel"]'); await pg.wait_for_timeout(300)
            print(name, '| back at the menu', await pg.evaluate("()=>!!document.querySelector('#welcome .wsave')"), '| money kept', await pg.evaluate("()=>__ML.G.money"))
            await press('#wp'); await pg.wait_for_timeout(400)
            print(name, '| continue -> playing', await pg.evaluate("()=>!__ML.UI.welcomeOn&&!__ML.G.paused"))
            # Main menu from the game
            await pg.evaluate("()=>__ML.UI.menu()"); await pg.wait_for_timeout(200)
            await press('#mcard [data-x="title"]'); await pg.wait_for_timeout(300)
            print(name, '| main menu:', await text('#welcome .wsave'))
            # three traits are required for everyone before choosing a lot
            await press('#wn'); await pg.wait_for_timeout(200); await press('#wn'); await pg.wait_for_timeout(200); await press('#myes'); await pg.wait_for_timeout(300)
            await press('#cas [data-x="done"]'); await pg.wait_for_timeout(300)
            print(name, '| no traits: still creating', await pg.evaluate("()=>!document.getElementById('cas').classList.contains('hidden')"), '|', await text('#ctl'))
            await pick_traits(pg) if name == 'phone' else [await pg.locator('#cas .trait:not(.on):not([disabled])').first.click() for _ in range(3)]
            await press('#cas [data-mem="add"]'); await pg.wait_for_timeout(200)
            await press('#cas [data-x="done"]'); await pg.wait_for_timeout(300)
            print(name, '| second person missing traits: shown', await pg.evaluate("()=>__ML.UI.casSt.cur"), '|', await text('#ctl'), '| tabs:', await text('#cas .members'))
            await pg.screenshot(path=S+f'sm4_traits_needed_{name}.png')
            await press('#cas [data-x="cancel"]'); await pg.wait_for_timeout(200)
            await ctx.close()
        print('errors', errs)
        await b.close()
asyncio.run(main())
