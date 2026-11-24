#!/bin/sh
# Builds the game, serves both builds, and runs every scenario script.
# A scenario fails when it exits non-zero or the page throws an error (PAGEERROR in its output).
# Usage: sh tests/run_all.sh [name ...]      e.g. sh tests/run_all.sh lot_choice town_layouts
cd "$(dirname "$0")/.." || exit 1
sh build.sh || exit 1
python3 -m http.server 8765 -d dist >/tmp/maple-dev.log 2>&1 & DEV=$!
python3 -m http.server 8766 -d dist/release >/tmp/maple-release.log 2>&1 & REL=$!
trap 'kill $DEV $REL 2>/dev/null' EXIT INT TERM
sleep 1

if [ $# -gt 0 ]; then LIST=""; for n in "$@"; do LIST="$LIST tests/${n%.py}.py"; done; else LIST=$(ls tests/*.py | grep -v '/common.py$'); fi
fail=0
for t in $LIST; do
  name=$(basename "$t" .py)
  out=$(python3 "$t" 2>&1); code=$?
  if [ $code -ne 0 ] || echo "$out" | grep -q "PAGEERROR"; then
    fail=1; echo "FAIL  $name"; echo "$out" | grep -v "GL Driver Message" | tail -15 | sed 's/^/      /'
  else
    echo "ok    $name"
  fi
done
[ $fail -eq 0 ] && echo "all scenarios passed" || echo "some scenarios failed"
exit $fail
