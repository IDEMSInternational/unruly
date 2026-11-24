#!/bin/sh
# Builds the original C Unruly generator and records reference puzzles,
# with the original solver's answers, for the TypeScript port's tests.
#
# Usage: tools/c-reference/generate-fixtures.sh [path-to-original-puzzles-repo]
# Needs: gcc, node. Default puzzles path: ../puzzles (sibling folder).

set -e

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PUZZLES="${1:-$ROOT/../puzzles}"
BUILD="$HERE/build"
OUT="$ROOT/src/games/unruly/testing/reference-puzzles.json"

mkdir -p "$BUILD" "$(dirname "$OUT")"
gcc -O2 -std=c99 -I"$PUZZLES" -o "$BUILD/unruly-reference" \
    "$HERE/unruly-reference.c" \
    "$PUZZLES/unruly.c" "$PUZZLES/random.c" \
    "$PUZZLES/malloc.c" "$PUZZLES/misc.c" "$PUZZLES/nullfe.c"

# Parameter sets: every size and difficulty the app offers (the original's
# difficulty letters: t = Trivial, e = Easy, n = Normal, the app's Easy,
# Medium and Hard), the original's presets, a larger size, non-square
# grids, and short game IDs (which start from the original's defaults).
PARAMS=""
for n in 6 8 10 12 14; do
    for d in t e n; do PARAMS="$PARAMS ${n}x${n}d$d"; done
done
PARAMS="$PARAMS 16x16dn 6x10dt 8x12dn 12x6de 8x8 10x10"

# Seeds: a fixed mix of short seeds and 15-digit seeds like the app makes.
SEEDS=""
i=1
while [ $i -le 20 ]; do
    SEEDS="$SEEDS $i $((i * 7919))$((i * 104729))31337"
    i=$((i + 1))
done

TSV="$BUILD/reference.tsv"
: > "$TSV"
for p in $PARAMS; do
    "$BUILD/unruly-reference" "$p" $SEEDS >> "$TSV"
done

node -e '
const fs = require("fs");
const rows = fs.readFileSync(process.argv[1], "utf8").trim().split(/\r?\n/)
  .map(l => { const [params, seed, description, solution] = l.split("\t");
              return { params, seed, description, solution }; });
fs.writeFileSync(process.argv[2], JSON.stringify(rows, null, 2) + "\n");
console.log(rows.length + " reference puzzles written to " + process.argv[2]);
' "$TSV" "$OUT"
