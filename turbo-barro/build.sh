#!/bin/bash
# Une los archivos de src/ en un solo HTML que funciona sin internet.
cd "$(dirname "$0")"
OUT="index.html"
{
  cat src/shell.html
  echo "<script>"
  echo "'use strict';"
  for f in i18n audio tracks truck race ui main; do cat "src/$f.js"; echo; done
  echo "</script>"
  echo "</body>"
  echo "</html>"
} > "$OUT"
echo "Listo: $OUT"
