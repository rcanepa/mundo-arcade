// ===== Utilidades: números, azar con semilla y colores =====
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

// Azar con semilla: la misma planta se dibuja siempre igual
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash2(x, y, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// Ruido suave (para repartir tipos de suelo de forma natural)
function noise2(x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = smooth(x - xi), fy = smooth(y - yi);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
}

// Colores como [r, g, b]; css() los convierte en texto para el canvas
const _rgbCache = new Map();
function rgbOf(c) {
  if (typeof c !== 'string') return c;
  let v = _rgbCache.get(c);
  if (!v) { const n = parseInt(c.slice(1), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; _rgbCache.set(c, v); }
  return v;
}
function mix(a, b, t) {
  a = rgbOf(a); b = rgbOf(b);
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
// k > 0 aclara, k < 0 oscurece
const shade = (c, k) => (k >= 0 ? mix(c, [255, 255, 255], k) : mix(c, [0, 0, 0], -k));
function css(c, a = 1) {
  c = rgbOf(c);
  const r = Math.round(c[0]), g = Math.round(c[1]), b = Math.round(c[2]);
  return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a.toFixed(3)})`;
}

// Un rango [a, b] de días del año que puede dar la vuelta (por ejemplo, de invierno a primavera)
function inWindow(d, w) {
  if (!w) return false;
  return w[0] <= w[1] ? d >= w[0] && d <= w[1] : d >= w[0] || d <= w[1];
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = n => '$' + Math.round(n).toLocaleString(LANG === 'es' ? 'es-CL' : 'en-US');
