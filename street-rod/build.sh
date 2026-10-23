#!/bin/bash
# Une los archivos de src/ y las imágenes de los autos (assets/cars) en un solo HTML que funciona sin internet.
cd "$(dirname "$0")"
OUT="index.html"
{
  cat src/shell.html
  echo "<script>"
  echo "'use strict';"
  # las imágenes de los autos van adentro del HTML (como data: URL)
  echo "const CAR_IMG = {"
  for f in assets/cars/*.webp; do
    printf "'%s': 'data:image/webp;base64,%s',\n" "$(basename "$f" .webp)" "$(base64 < "$f" | tr -d '\n')"
  done
  echo "};"
  for f in util pixel data carmeta i18n car physics road race audio cars pxscenes pxrace pxui game screens garage mechanic town raceui title main; do cat "src/$f.js"; echo; done
  echo "</script>"
  echo "</body>"
  echo "</html>"
} > "$OUT"
echo "Listo: $OUT"

# Pruebas automáticas (si hay Node instalado): revisan que el juego siga funcionando
if command -v node >/dev/null 2>&1 && [ -f tests/smoke.js ]; then
  node tests/smoke.js || { echo "Las pruebas fallaron: revisa los mensajes de arriba"; exit 1; }
fi
