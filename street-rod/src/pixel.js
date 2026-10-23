// ===== Pixel art: paleta, tramado, letras de píxeles y herramientas de dibujo =====
// Todo se dibuja en una pantalla chica de 640×400 (el doble del original de 320×200) y después se agranda sin suavizar.
// Las escenas se dibujan con el canvas normal y luego se pasan a la paleta con tramado (como los juegos VGA de 16 colores).
const PW = 640, PH = 400;

// Paleta: rampas de colores de los años 60 (de oscuro a claro)
const PAL = {
  k: '#000000', g1: '#1c1c24', g2: '#3a3a46', g3: '#5c5c6a', g4: '#8a8a96', g5: '#b4b4bc', g6: '#d8d8dc', w: '#ffffff',
  r1: '#4a0c10', r2: '#8c1820', r3: '#d02c2c', r4: '#ff6a5a',
  m1: '#5a1040', m2: '#a02078', m3: '#e04ab0', m4: '#ff9ad8',
  o1: '#7a3008', o2: '#d06018', o3: '#ff9a3c',
  y1: '#a07a10', y2: '#f0c830', y3: '#fff08a',
  b1: '#3a2010', b2: '#6a3c1c', b3: '#a0602c', b4: '#d89a60', b5: '#f4c8a0',
  e1: '#0c3a14', e2: '#1c7a2c', e3: '#3cc03c', e4: '#9cf07a',
  t1: '#0c4a4a', t2: '#1a8a8a', t3: '#3cd0d0', t4: '#a8fff4',
  u1: '#0c1a5a', u2: '#1c3ca8', u3: '#3c6cf0', u4: '#8cb4ff',
  p1: '#2c1458', p2: '#5a2ca0', p3: '#9a6ae0',
  c1: '#f4ecd0', c2: '#e0d0a0'
};
const PAL_LIST = Object.values(PAL).map(h => rgbOf(h));

// Tabla para pasar cualquier color al más parecido de la paleta (5 bits por canal)
const QLUT = (() => {
  const t = new Uint8Array(32768);
  for (let r = 0; r < 32; r++) for (let g = 0; g < 32; g++) for (let b = 0; b < 32; b++) {
    const R = r * 8 + 4, G = g * 8 + 4, B = b * 8 + 4;
    let best = 0, bd = Infinity;
    PAL_LIST.forEach((p, i) => {
      const dr = R - p[0], dg = G - p[1], db = B - p[2], rm = (R + p[0]) / 2;
      const d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bd) { bd = d; best = i; }
    });
    t[(r << 10) | (g << 5) | b] = best;
  }
  return t;
})();
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - 0.47);

// Pasa una imagen a la paleta, con tramado ordenado. Lo que ya es un color de la paleta queda igual.
function pixelize(img, strength = 34, keepAlpha = false) {
  const d = img.data, w = img.width;
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const a = d[i + 3];
    if (a < 110) { d[i + 3] = 0; continue; }
    let r = d[i], g = d[i + 1], b = d[i + 2];
    const exact = PAL_LIST[QLUT[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)]];
    if (!(exact[0] === r && exact[1] === g && exact[2] === b)) {
      const x = p % w, y = (p / w) | 0, o = BAYER[((y & 3) << 2) | (x & 3)] * strength;
      r = clamp(r + o, 0, 255); g = clamp(g + o, 0, 255); b = clamp(b + o, 0, 255);
      const c = PAL_LIST[QLUT[((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3)]];
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
    }
    if (!keepAlpha) d[i + 3] = 255;
  }
  return img;
}
// Contorno de un píxel alrededor de lo que no es transparente (como los sprites dibujados a mano)
function outlineImage(img, color = PAL.k) {
  const d = img.data, w = img.width, h = img.height, c = rgbOf(color);
  const solid = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) solid[p] = d[p * 4 + 3] > 0 ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x;
    if (solid[p]) continue;
    if ((x > 0 && solid[p - 1]) || (x < w - 1 && solid[p + 1]) || (y > 0 && solid[p - w]) || (y < h - 1 && solid[p + w])) {
      d[p * 4] = c[0]; d[p * 4 + 1] = c[1]; d[p * 4 + 2] = c[2]; d[p * 4 + 3] = 255;
    }
  }
  return img;
}
// Dibuja con el canvas normal en un lienzo chico y lo deja en pixel art (sprite con contorno)
function pixelSprite(w, h, draw, o = {}) {
  const c = makeCanvas(w + 2, h + 2), g = c.getContext('2d');
  g.translate(1, 1);
  draw(g);
  if (!g.getImageData) return c;
  const img = g.getImageData(0, 0, c.width, c.height);
  pixelize(img, o.dither ?? 34, true);
  if (o.outline !== false) outlineImage(img, o.outline || PAL.k);
  g.putImageData(img, 0, 0);
  return c;
}

// ----- Letras de píxeles (5 de ancho; filas: 2 para tildes, 7 de alto, 1 para colas) -----
const GLYPHS = {
  ' ': '.....|.....|.....|.....|.....|.....|.....',
  'A': '.###.|#...#|#...#|#####|#...#|#...#|#...#', 'B': '####.|#...#|#...#|####.|#...#|#...#|####.', 'C': '.###.|#...#|#....|#....|#....|#...#|.###.',
  'D': '####.|#...#|#...#|#...#|#...#|#...#|####.', 'E': '#####|#....|#....|####.|#....|#....|#####', 'F': '#####|#....|#....|####.|#....|#....|#....',
  'G': '.###.|#...#|#....|#.###|#...#|#...#|.####', 'H': '#...#|#...#|#...#|#####|#...#|#...#|#...#', 'I': '.###.|..#..|..#..|..#..|..#..|..#..|.###.',
  'J': '..###|...#.|...#.|...#.|...#.|#..#.|.##..', 'K': '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', 'L': '#....|#....|#....|#....|#....|#....|#####',
  'M': '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', 'N': '#...#|#...#|##..#|#.#.#|#..##|#...#|#...#', 'O': '.###.|#...#|#...#|#...#|#...#|#...#|.###.',
  'P': '####.|#...#|#...#|####.|#....|#....|#....', 'Q': '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', 'R': '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  'S': '.####|#....|#....|.###.|....#|....#|####.', 'T': '#####|..#..|..#..|..#..|..#..|..#..|..#..', 'U': '#...#|#...#|#...#|#...#|#...#|#...#|.###.',
  'V': '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..', 'W': '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', 'X': '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  'Y': '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', 'Z': '#####|....#|...#.|..#..|.#...|#....|#####',
  'a': '.....|.....|.###.|....#|.####|#...#|.####', 'b': '#....|#....|####.|#...#|#...#|#...#|####.', 'c': '.....|.....|.###.|#....|#....|#...#|.###.',
  'd': '....#|....#|.####|#...#|#...#|#...#|.####', 'e': '.....|.....|.###.|#...#|#####|#....|.###.', 'f': '..##.|.#..#|.#...|###..|.#...|.#...|.#...',
  'g': '.....|.....|.####|#...#|#...#|.####|....#|.###.', 'h': '#....|#....|#.##.|##..#|#...#|#...#|#...#', 'i': '..#..|.....|.##..|..#..|..#..|..#..|.###.',
  'j': '...#.|.....|..##.|...#.|...#.|...#.|#..#.|.##..', 'k': '#....|#....|#..#.|#.#..|##...|#.#..|#..#.', 'l': '.##..|..#..|..#..|..#..|..#..|..#..|.###.',
  'm': '.....|.....|##.#.|#.#.#|#.#.#|#...#|#...#', 'n': '.....|.....|#.##.|##..#|#...#|#...#|#...#', 'o': '.....|.....|.###.|#...#|#...#|#...#|.###.',
  'p': '.....|.....|####.|#...#|#...#|####.|#....|#....', 'q': '.....|.....|.####|#...#|#...#|.####|....#|....#', 'r': '.....|.....|#.##.|##..#|#....|#....|#....',
  's': '.....|.....|.###.|#....|.###.|....#|####.', 't': '.#...|.#...|###..|.#...|.#...|.#..#|..##.', 'u': '.....|.....|#...#|#...#|#...#|#..##|.##.#',
  'v': '.....|.....|#...#|#...#|#...#|.#.#.|..#..', 'w': '.....|.....|#...#|#...#|#.#.#|#.#.#|.#.#.', 'x': '.....|.....|#...#|.#.#.|..#..|.#.#.|#...#',
  'y': '.....|.....|#...#|#...#|#...#|.####|....#|.###.', 'z': '.....|.....|#####|...#.|..#..|.#...|#####', 'ı': '.....|.....|.##..|..#..|..#..|..#..|.###.',
  '0': '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', '1': '..#..|.##..|..#..|..#..|..#..|..#..|.###.', '2': '.###.|#...#|....#|...#.|..#..|.#...|#####',
  '3': '#####|...#.|..#..|...#.|....#|#...#|.###.', '4': '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', '5': '#####|#....|####.|....#|....#|#...#|.###.',
  '6': '..##.|.#...|#....|####.|#...#|#...#|.###.', '7': '#####|....#|...#.|..#..|.#...|.#...|.#...', '8': '.###.|#...#|#...#|.###.|#...#|#...#|.###.',
  '9': '.###.|#...#|#...#|.####|....#|...#.|.##..',
  '.': '.....|.....|.....|.....|.....|.##..|.##..', ',': '.....|.....|.....|.....|.##..|..#..|.#...', ':': '.....|.##..|.##..|.....|.##..|.##..|.....',
  ';': '.....|.##..|.##..|.....|.##..|..#..|.#...', '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..', '?': '.###.|#...#|....#|...#.|..#..|.....|..#..',
  '¡': '..#..|.....|..#..|..#..|..#..|..#..|..#..', '¿': '..#..|.....|..#..|.#...|#....|#...#|.###.', "'": '..#..|..#..|.#...|.....|.....|.....|.....',
  '"': '.#.#.|.#.#.|.#.#.|.....|.....|.....|.....', '-': '.....|.....|.....|.###.|.....|.....|.....', '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '/': '....#|...#.|...#.|..#..|.#...|.#...|#....', '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.', ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...',
  '$': '..#..|.####|#.#..|.###.|..#.#|####.|..#..', '%': '##...|##..#|...#.|..#..|.#...|#..##|...##', '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#',
  '*': '.....|..#..|#.#.#|.###.|#.#.#|..#..|.....', '=': '.....|.....|#####|.....|#####|.....|.....', '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
  '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.', '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...', '_': '.....|.....|.....|.....|.....|.....|#####',
  '¢': '..#..|.###.|#.#..|#.#..|#.#.#|.###.|..#..', '°': '.##..|#..#.|.##..|.....|.....|.....|.....', '×': '.....|#...#|.#.#.|..#..|.#.#.|#...#|.....',
  '«': '.....|..#.#|.#.#.|#.#..|.#.#.|..#.#|.....', '»': '.....|#.#..|.#.#.|..#.#|.#.#.|#.#..|.....', '¾': '##...|.#..#|##.#.|.##.#|#..##|...##|....#',
  '¼': '#....|#...#|#..#.|..#.#|.#.##|#..##|....#', '½': '#....|#...#|#..#.|..##.|.#..#|#..#.|..###', '→': '.....|..#..|...#.|#####|...#.|..#..|.....',
  '←': '.....|..#..|.#...|#####|.#...|..#..|.....', '↑': '..#..|.###.|#.#.#|..#..|..#..|..#..|..#..', '↓': '..#..|..#..|..#..|..#..|#.#.#|.###.|..#..',
  '◄': '....#|...##|..###|.####|..###|...##|....#', '►': '#....|##...|###..|####.|###..|##...|#....', '·': '.....|.....|.....|..#..|.....|.....|.....',
  '—': '.....|.....|.....|#####|.....|.....|.....', '³': '###..|..#..|.##..|..#..|###..|.....|.....', '♥': '.....|.#.#.|#####|#####|.###.|..#..|.....', '★': '..#..|..#..|#####|.###.|.#.#.|#...#|.....'
};
// Tildes y eñes se arman sobre la letra base
const ACCENTS = { '´': ['...#.', '..#..'], '~': ['.##.#', '#.##.'], '¨': ['.#.#.', '.....'] };
const COMPOSED = { 'á': 'a´', 'é': 'e´', 'í': 'ı´', 'ó': 'o´', 'ú': 'u´', 'ñ': 'n~', 'ü': 'u¨', 'Á': 'A´', 'É': 'E´', 'Í': 'I´', 'Ó': 'O´', 'Ú': 'U´', 'Ñ': 'N~', 'Ü': 'U¨' };
const FONT_W = 5, FONT_H = 10;
// Cada letra queda como una lista de píxeles [x, y] en una celda de 5×10
const FONT = (() => {
  const out = {};
  const rows = s => s.split('|');
  for (const ch in GLYPHS) {
    const pts = [];
    rows(GLYPHS[ch]).forEach((row, y) => { for (let x = 0; x < 5; x++) if (row[x] === '#') pts.push([x, y + 2]); });
    out[ch] = pts;
  }
  for (const ch in COMPOSED) {
    const [base, acc] = COMPOSED[ch];
    const pts = out[base].slice();
    if (base === base.toUpperCase() && base !== 'ı') {
      // las mayúsculas con tilde se achatan un poco para que la tilde quepa arriba
      ACCENTS[acc].forEach((row, y) => { for (let x = 0; x < 5; x++) if (row[x] === '#') pts.push([x, y]); });
    } else {
      // las minúsculas tienen libres las dos filas de arriba de la altura de la x
      ACCENTS[acc].forEach((row, y) => { for (let x = 0; x < 5; x++) if (row[x] === '#') pts.push([x, y + 1]); });
    }
    out[ch] = pts;
  }
  return out;
})();
const textWidth = (s, scale = 1) => String(s).length * (FONT_W + 1) * scale - scale;
// Escribe texto con letras de píxeles. align: 'left' | 'center' | 'right'. shadow: color de la sombra.
function ptext(g, s, x, y, color = PAL.w, scale = 1, o = {}) {
  s = String(s);
  const w = textWidth(s, scale);
  let x0 = Math.round(o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x);
  const y0 = Math.round(y);
  const draw = (dx, dy, col) => {
    g.fillStyle = col;
    let cx = x0 + dx;
    for (const ch of s) {
      const pts = FONT[ch] || FONT['?'];
      for (const [px, py] of pts) g.fillRect(cx + px * scale, y0 + dy + py * scale, scale, scale);
      cx += (FONT_W + 1) * scale;
    }
  };
  if (o.shadow) draw(scale, scale, o.shadow);
  draw(0, 0, color);
  return w;
}
// Corta un texto en líneas que quepan en un ancho
function wrapText(s, maxW, scale = 1) {
  const words = String(s).split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (textWidth(t, scale) > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

// ----- Herramientas para dibujar a mano -----
// Rectángulo con borde biselado (botones y cuadros como los del juego original)
function bevel(g, x, y, w, h, face, light, dark, inset = false) {
  g.fillStyle = face; g.fillRect(x, y, w, h);
  g.fillStyle = inset ? dark : light; g.fillRect(x, y, w, 2); g.fillRect(x, y, 2, h);
  g.fillStyle = inset ? light : dark; g.fillRect(x, y + h - 2, w, 2); g.fillRect(x + w - 2, y, 2, h);
}
// Tramado de dos colores en un rectángulo (para cielos, sombras y degradados a la antigua)
function ditherRect(g, x, y, w, h, c1, c2, level = 0.5) {
  g.fillStyle = c1; g.fillRect(x, y, w, h);
  g.fillStyle = c2;
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    if (BAYER[((yy + y) & 3) * 4 + ((xx + x) & 3)] + 0.47 < level) g.fillRect(x + xx, y + yy, 1, 1);
  }
}
// Degradado vertical hecho con bandas tramadas entre colores de la paleta
function ditherBands(g, x, y, w, h, colors) {
  const n = colors.length - 1;
  for (let yy = 0; yy < h; yy++) {
    const t = yy / Math.max(1, h - 1) * n, i = Math.min(n - 1, Math.floor(t)), f = t - i;
    for (let xx = 0; xx < w; xx++) {
      const on = BAYER[((y + yy) & 3) * 4 + ((x + xx) & 3)] + 0.47 < f;
      g.fillStyle = on ? colors[i + 1] : colors[i];
      g.fillRect(x + xx, y + yy, 1, 1);
    }
  }
}
