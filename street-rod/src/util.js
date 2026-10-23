// ===== Utilidades sin dibujo (las usa también la lógica del juego, que se prueba sin navegador) =====
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const rnd = (a, b) => a + Math.random() * (b - a);
// Números al azar repetibles a partir de una semilla (el diario de cada día, los rivales de cada noche)
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const pick = (R, a) => a[Math.floor(R() * a.length)];
export const money = n => '$' + Math.round(n).toLocaleString('en-US');
