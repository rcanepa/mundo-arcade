#!/bin/bash
# Une los archivos de src/ en un solo HTML que funciona sin internet.
cd "$(dirname "$0")"
OUT="index.html"
{
  cat src/shell.html
  echo "<script>"
  echo "'use strict';"
  for f in util data i18n car physics carart road race audio game scenes mechanic ui main; do cat "src/$f.js"; echo; done
  echo "</script>"
  echo "</body>"
  echo "</html>"
} > "$OUT"
echo "Listo: $OUT"

# Pruebas automáticas (si hay Node instalado): revisan que el juego siga funcionando
if command -v node >/dev/null 2>&1 && [ -f tests/smoke.js ]; then
  node tests/smoke.js || { echo "Las pruebas fallaron: revisa los mensajes de arriba"; exit 1; }
fi
