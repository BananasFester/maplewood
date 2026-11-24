"""Every way to start must fit the starting budget: checks every empty lot and every starter home
(furnished and unfurnished) across a few hundred generated towns, and exits non-zero if any
option costs more than START_FUNDS or leaves less than MIN_LEFT for the first bills."""
import asyncio, json, sys
from playwright.async_api import async_playwright
from common import URL, launch_opts

TOWNS = 300
MIN_LEFT = 2000

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(**launch_opts())
        pg = await (await b.new_context()).new_page()
        errs = []
        pg.on('pageerror', lambda e: errs.append('PAGEERROR: ' + str(e)))
        await pg.goto(URL); await pg.wait_for_timeout(800)
        r = await pg.evaluate("""([towns]) => __ML.ev(`(() => {
            const hi = {}, lo = {}; let n = 0, worst = null;
            for (let s = 1; s <= ${towns}; s++) {
              const T = genTown(s * 7919 + 13);
              for (const l of T.lots) {
                const opts = l.kind === 'empty' ? [['empty lot', lotPrice(l)]]
                  : (l.kind === 'starter' || l.kind === 'hart') ? [['furnished', lotPrice(l, true)], ['unfurnished', lotPrice(l, false)]] : [];
                for (const [k, p] of opts) {
                  const key = (l.kind === 'empty' ? '' : (l.kind === 'hart' ? 'Maple Cottage' : HOUSE_TPL[l.tpl].n) + ' ') + k;
                  n++; hi[key] = Math.max(hi[key] || 0, p); lo[key] = Math.min(lo[key] || 1e9, p);
                  if (!worst || p > worst.p) worst = {p, key, town: T.name, seed: T.seed};
                }
              }
            }
            return JSON.stringify({n, budget: START_FUNDS, hi, lo, worst});
          })()`)""", [TOWNS])
        r = json.loads(r)
        print(f"checked {r['n']} options in {TOWNS} towns, budget {r['budget']}")
        for k in sorted(r['hi']):
            print(f"  {k:32} {r['lo'][k]:>6} to {r['hi'][k]:>6}")
        bad = r['worst']['p'] > r['budget'] - MIN_LEFT
        print('most expensive:', r['worst'], '->', 'TOO EXPENSIVE' if bad else 'fits')
        print('\n'.join(errs) or 'no errors')
        await b.close()
        sys.exit(1 if bad or errs else 0)

asyncio.run(main())
