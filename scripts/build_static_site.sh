#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${1:-$ROOT_DIR/dist/site}"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

cp "$ROOT_DIR/index.html" "$OUT_DIR/"
cp "$ROOT_DIR/seed-audit.html" "$OUT_DIR/"
cp "$ROOT_DIR/seed-audit.css" "$OUT_DIR/"
cp "$ROOT_DIR/seed-audit.js" "$OUT_DIR/"
cp "$ROOT_DIR/style.css" "$OUT_DIR/"
cp "$ROOT_DIR/game.js" "$OUT_DIR/"
cp "$ROOT_DIR/_headers" "$OUT_DIR/"
cp -R "$ROOT_DIR/generated" "$OUT_DIR/generated"
touch "$OUT_DIR/.nojekyll"

printf 'Built static site at %s\n' "$OUT_DIR"
