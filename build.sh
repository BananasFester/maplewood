#!/bin/sh
# Builds Maple Lane into self-contained pages.
#   dist/index.html          dev build, keeps the window.__ML debug hook the tests drive
#   dist/release/index.html  release build, debug hook removed (this is what gets published)
# Both get a copy of music/ next to them, because the game streams music/<song>.mp3.
set -e
cd "$(dirname "$0")"

PARTS="src/00_head.html src/01_core.js src/02_art.js src/03_world.js src/03b_town.js src/04_sim.js src/05_game.js
src/06_render.js src/06b_gl.js src/07_ui.js src/07b_tips.js src/07c_tut.js src/07d_town.js src/08_modes.js
src/08b_desktop.js src/09_main.js src/99_tail.html"

mkdir -p dist/release
cat $PARTS > dist/index.html
grep -v '^ *window.__ML=' dist/index.html > dist/release/index.html

# syntax check the script in both builds
for f in dist/index.html dist/release/index.html; do
  python3 - "$f" <<'EOF'
import re, sys
s = open(sys.argv[1]).read()
open('/tmp/maple_check.js', 'w').write('\n'.join(re.findall(r'<script>(.*?)</script>', s, re.S)))
EOF
  node --check /tmp/maple_check.js
done
if grep -q '__ML' dist/release/index.html; then echo "release build still has the debug hook" >&2; exit 1; fi

rm -rf dist/music dist/release/music
cp -r music dist/music
cp -r music dist/release/music
echo "syntax ok: dist/index.html $(wc -c < dist/index.html) bytes, dist/release/index.html $(wc -c < dist/release/index.html) bytes"
