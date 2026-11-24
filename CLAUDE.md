# Working on Maple Lane

Read README.md first for what the game is and how to run it. This file covers how the code fits
together and the rules that keep it working.

## How the code is put together

- Plain JavaScript, no framework, no dependencies. `build.sh` concatenates the files in `src/`
  (in the order listed in `PARTS`) into one `<script>` in one HTML page. A new source file has
  to be added to `PARTS`.
- Everything shares one global scope. Function declarations are hoisted, but top-level `const`
  tables run in file order, so a part can only use another part's constants at load time if
  that part comes earlier in `PARTS`.
- Main globals:
  - `G`: the saved game state (time in game minutes, money, people, objects, mode, town, home
    lot, tours, fish...). Anything new that should persist goes into `serialize()` and
    `loadGame()` in `05_game.js`, with a default so older saves still load.
  - `W`: the current lot. `wt` is 0 for nothing, 1 wall, 2 door, 3 window; plus `floor`, `wp`
    (wallpaper), `objAt` (object on each tile), `room` and `rooms`. Call `refreshWorld()` after
    changing walls or objects.
  - `R` lot camera and renderer, `UI` interface, `BB` buy and build tools, `TV` town map view,
    `TUT` tours, `TIP` tooltips, `MUS` music, `GLS` WebGL smoothing.
- Lot geometry (`01_core.js`): 16 px tiles, a lot is 28x20 tiles (`MW`, `LOTH`), the sidewalk is
  row 20 (`SIDEY`) with the street below. Time moves with `gameStep(minutes)`, which runs
  `minuteTick` and `hourTick`; a day is 1440 minutes.
- Object types are in `CATALOG` (`01_core.js`) and drawn in `02_art.js`. Placement rules live in
  `canPlace` (`03_world.js`), building rules in `BB` (`08_modes.js`).

## The town

- `genTown(seed)` in `03b_town.js` builds the whole town from one seed with a seeded RNG. Saves
  only keep the seed, the home lot id and the ids of lots the player sold, and rebuild the town
  on load. **Don't change the order or number of RNG calls in `genTown`**, or every existing
  town changes under its saves. Add new random choices after the existing ones, or give them
  their own RNG seeded from the town or lot seed, the way `lotPlanFor` and `lotPrice` do.
- The sample family, the Harts, always live in town seed 2611 on the `hart` lot (12 Maple Lane).
- `lotPlanFor(l, furnished)` builds a lot's floors, walls and objects from `l.seed` and caches
  them in `TOWN.plans` under `id:f` and `id:u`.
- Prices come from `lotPrice(l, furnished)`. A starter home costs its design's `base` plus
  extras for the lake, park and corner, and furnished adds `premium` (80% of the furniture's
  catalog price). Every option has to stay within `START_FUNDS` ($20,000) with money left for
  bills: run `tests/price_audit.py` after touching prices or designs.
- Places (`POI_KINDS`), weekly events (`TOWN_EVENTS`) and fish (`FISH`) are data tables.
  Outings reuse the sims' "away" system (`outingSpec`, `goOut`, `finishOuting` in
  `07d_town.js`). A place without an `out` entry shows as "Coming soon".

## Conventions

- Phone first. Check changes at 390x844 portrait with touch, then landscape (844x390) and a
  tablet (820x1180).
- Every control and object gets a press-and-hold tooltip: `data-tip` keys, with the text in
  `07b_tips.js`.
- Player-facing text is short, warm and plain. Don't use em dashes in it.
- Keep `window.__ML=...` on one line in `09_main.js`: the release build removes that line with
  grep. The tests reach the game's internals through it, and `__ML.ev(code)` runs code in the
  game's scope.

## Checking a change

- `sh build.sh` has to print "syntax ok".
- `sh tests/run_all.sh` runs every scenario (or pass names to run some). Most scenarios print
  state rather than assert, so read the output and look at the screenshots in `shots/`.
- For anything visual, take screenshots at all three sizes and look at them.

## Publishing

- `dist/release/index.html` plus `music/` is the whole game, so any static host works.
- It started in the Claude app and is published there as a claude.ai artifact. The artifact
  runtime adds `window.claude` (cloud saves, hot reload). The game checks for it and runs fine
  without it.
