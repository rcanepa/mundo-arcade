#!/bin/bash
# Copia las imágenes del estudio al juego: webp de cada vista, máscaras en webp sin pérdida y los datos de las imágenes
SP=$(cd "$(dirname "$0")" && pwd); A="$1"; G="$2"
cd "$SP/out" || exit 1
KEYS="modelA ford32 ford40 merc48 chevy49 merc49 olds49 dodge50 olds54 nomad56 chevy57 plym57 tbird57 pont58 fair58 fury58 caddy59 valiant60 vette61 galaxie63 vette63"
for k in $KEYS; do for v in side rear front; do
  cp "${k}_${v}.webp" "$A/${k}_${v}.webp"
  magick "${k}_${v}_mask.png" -colorspace Gray -define webp:lossless=true "$A/${k}_${v}_mask.webp"
done; done
python3 - "$A" "$G" $KEYS <<'PY'
import json, sys
A, G, keys = sys.argv[1], sys.argv[2], sys.argv[3:]
meta = {k: json.load(open(f'{k}.json')) for k in keys}
json.dump(meta, open(f'{A}/meta.json', 'w'), separators=(',', ':'))
open(f'{G}/src/carmeta.js', 'w').write("// ===== Datos de las imágenes de los autos (los saca el estudio 3D junto con las imágenes de assets/cars) =====\n"
  "// ground = dónde queda el suelo en la vista de lado (0 arriba, 1 abajo); wheels = ruedas [x, y, radio] de lado; tail = focos traseros [x0, y0, x1, y1]\n"
  "const CAR_META = " + json.dumps(meta, separators=(',', ':')) + ";\n")
print('ok', len(keys))
PY
