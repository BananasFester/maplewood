"""Draws the app icons (the game's maple leaf) into web/icons/ using the dev build's own pixel art.
Run after `sh build.sh`:  python3 tools/icons/make_icons.py"""
import asyncio, base64, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path(__file__).resolve().parents[2]
JS = """([size,mask])=>__ML.ev(`(()=>{const size=${size},mask=${mask};const c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
 const r=mask?0:size*.22;g.fillStyle='#fbf3e4';g.beginPath();g.moveTo(r,0);g.arcTo(size,0,size,size,r);g.arcTo(size,size,0,size,r);g.arcTo(0,size,0,0,r);g.arcTo(0,0,size,0,r);g.fill();
 g.fillStyle='#f3e2c4';g.beginPath();g.arc(size/2,size/2,size*(mask?.3:.36),0,7);g.fill();
 const leaf=iconCanvas('leaf',{o:'#e8662e',k:shade('#e8662e',-.55)}),k=Math.floor(size*(mask?.46:.56)/leaf.width),w=leaf.width*k,h=leaf.height*k;
 g.drawImage(leaf,Math.round((size-w)/2),Math.round((size-h)/2),w,h);return c.toDataURL('image/png');})()`)"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--no-sandbox'])
        pg = await b.new_page()
        await pg.goto((ROOT / 'dist' / 'index.html').as_uri()); await pg.wait_for_timeout(800)
        for name, size, mask in [('icon-192.png', 192, 0), ('icon-512.png', 512, 0), ('icon-maskable-512.png', 512, 1)]:
            url = await pg.evaluate(JS, [size, mask])
            (ROOT / 'web' / 'icons' / name).write_bytes(base64.b64decode(url.split(',', 1)[1]))
            print('wrote', name)
        await b.close()
asyncio.run(main())
