#!/bin/bash
# Arma street-rod/index.html: un solo archivo con todo adentro (three.js incluido), que funciona sin internet.
# Para trabajar se usa dev.html (carga src/ directo); este script lo empaqueta con esbuild y corre las pruebas.
set -e
cd "$(dirname "$0")"
TMP=$(mktemp -d)
npx --yes esbuild@0.24.0 src/main.js --bundle --format=iife --minify --legal-comments=eof \
  --alias:three=./vendor/three.module.min.js --outfile="$TMP/game.js" --log-level=warning
python3 - "$TMP/game.js" <<'PY'
import sys, re
js = open(sys.argv[1]).read().replace('</script', '<\\/script')
html = open('dev.html').read()
html = re.sub(r'<script type="importmap">.*?</script>\n', '', html, flags=re.S)
tag = '<script type="module" src="src/main.js"></script>'
assert tag in html
html = html.replace(tag, '<script>' + js + '</script>')
open('index.html', 'w').write(html)
PY
rm -rf "$TMP"
echo "Listo: index.html ($(du -h index.html | cut -f1 | tr -d ' '))"
node tests/smoke.mjs
