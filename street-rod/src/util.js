// ===== Utilidades: números, azar con semilla, colores y dibujo =====
// ?cover = solo la portada, quieta y sin botones (para sacar la imagen del catálogo)
const COVER = typeof location !== 'undefined' && /[?&]cover/.test(location.search || '');
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const approach = (v, target, step) => (v < target ? Math.min(target, v + step) : Math.max(target, v - step));

// Azar con semilla: la ruta y los avisos del diario salen siempre iguales para la misma partida
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rpick = (r, arr) => arr[Math.floor(r() * arr.length)];
function hash1(x, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
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
// Brillo aproximado (0 = negro, 1 = blanco), para elegir texto claro u oscuro
const luma = c => { c = rgbOf(c); return (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255; };

const money = n => (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');

// ----- Dibujo -----
function roundRect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
// Traza una curva suave que pasa por los puntos (Catmull-Rom). Un punto [x, y, 1] es una esquina.
function splinePath(g, pts, closed = true, tension = 0.5) {
  const n = pts.length;
  if (n < 2) return;
  const P = i => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  g.moveTo(pts[0][0], pts[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    if (p1[2] && p2[2]) { g.lineTo(p2[0], p2[1]); continue; }
    const t1 = p1[2] ? 0 : tension / 3, t2 = p2[2] ? 0 : tension / 3;
    g.bezierCurveTo(
      p1[0] + (p2[0] - p0[0]) * t1, p1[1] + (p2[1] - p0[1]) * t1,
      p2[0] - (p3[0] - p1[0]) * t2, p2[1] - (p3[1] - p1[1]) * t2,
      p2[0], p2[1]);
  }
  if (closed) g.closePath();
}
// Un resplandor redondo (luces, neón, faros), se suma a lo que ya está dibujado
function glow(g, x, y, r, color, a = 1) {
  if (r <= 0.5 || a <= 0.01) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, css(color, a)); gr.addColorStop(0.25, css(color, a * 0.45)); gr.addColorStop(1, css(color, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
const FONT_SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';
const FONT_SERIF = 'Georgia, "Times New Roman", serif';
const FONT_SCRIPT = '"Brush Script MT", "Snell Roundhand", "Segoe Script", cursive';
const FONT_DISPLAY = '"Arial Black", "Helvetica Neue", Impact, sans-serif';
const font = (size, weight = 'bold', family = FONT_SANS) => `${weight} ${size}px ${family}`;
