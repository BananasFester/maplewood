"""Shared settings for the Playwright scenario scripts.

Every script drives the dev build (dist/index.html), which exposes the game's internals on
window.__ML. release_smoke.py drives the release build, where that hook is stripped.

Environment overrides:
  MAPLE_URL          dev build URL      (default http://localhost:8765/index.html)
  MAPLE_RELEASE_URL  release build URL  (default http://localhost:8766/index.html)
  CHROME_PATH        use this Chrome/Chromium binary instead of Playwright's bundled Chromium
"""
import os
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
URL = os.environ.get('MAPLE_URL', 'http://localhost:8765/index.html')
RELEASE_URL = os.environ.get('MAPLE_RELEASE_URL', 'http://localhost:8766/index.html')
SHOTS = str(ROOT / 'shots') + os.sep
os.makedirs(SHOTS, exist_ok=True)


def launch_opts(*extra_args):
    """Options for chromium.launch(); WebGL runs on the software renderer when headless."""
    opts = {'args': ['--no-sandbox', *extra_args]}
    if os.environ.get('CHROME_PATH'):
        opts['executable_path'] = os.environ['CHROME_PATH']
    return opts


async def pick_traits(pg):
    """Create-a-sim needs three traits per person before choosing a lot: tap the first three free ones."""
    for _ in range(3):
        await pg.locator('#cas .trait:not(.on):not([disabled])').first.tap()
        await pg.wait_for_timeout(80)
