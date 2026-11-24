# Scenario tests

These are Playwright (Python) scripts that play the game in headless Chromium on a phone-sized
screen (390x844, touch). Most of them drive the dev build through `window.__ML`, the debug hook
that `build.sh` keeps in `dist/index.html` and strips from the release build. They print what
they see (state, card text, toasts) and save screenshots to `shots/` (git-ignored), so reading
the output and looking at the screenshots is part of checking a change.

## Run

```sh
pip install playwright && python3 -m playwright install chromium
sh tests/run_all.sh                 # build, serve, run everything
sh tests/run_all.sh lot_choice      # just one or a few
```

`run_all.sh` serves `dist/` on port 8765 and `dist/release/` on port 8766. To run one script by
hand, serve those yourself and call `python3 tests/<name>.py`. Set `CHROME_PATH` to use an
installed Chrome instead of Playwright's Chromium.

A scenario counts as failed when it exits with an error or the page throws (`PAGEERROR`).
Most checks are printed values rather than asserts, so skim the output for anything odd.

## Scripts

| Script | What it covers |
|---|---|
| `lot_choice.py` | Empty lot vs starter home, furnished vs unfurnished, clean empty lots, walkway from a front door |
| `town_pick_and_fishing.py` | Picking a starter home on the town map, then a fishing outing |
| `town_outings_and_moving.py` | Park picnic, farmers market, neighbor visit, moving house, landscape cards |
| `fresh_household_build.py` | Building and furnishing on an empty lot, a week of outings, save and reload |
| `events_selling_building.py` | Event reminders you can tap, fishing derby, selling furniture, building over trees |
| `town_layouts.py` | Town picking in landscape and on a tablet |
| `release_smoke.py` | The release build with real taps only |
| `soak_week.py` | A week with the Harts: tooltips, zoom, smoothing, music |
| `saves_and_doorways.py` | Save and continue, old saves, the doorway rule |
| `reachability.py` | Home checklist only counts items the family can reach |
| `music_daynight.py` | Music player and day/night changes |
| `touch_longpress.py` | Press-and-hold tooltips and tap menus |
| `pinch_zoom.py` | Pinch zoom on the lot |
| `desktop_mouse.py` | Mouse and keyboard at 1366x768: hover tips, right-drag camera, click to place, strip scrolling, keys |
| `zoom_smoothing.py` | Zoom buttons and the WebGL smoothing pass |

Touch gestures that Playwright's `tap()` can't express (drags, pinches) are sent with
CDP `Input.dispatchTouchEvent`; see `pinch_zoom.py` and `touch_longpress.py` for helpers.
