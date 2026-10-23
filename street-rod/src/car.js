// ===== Autos inventados al estilo de los años 50, armados a partir de unos pocos números =====
// La carrocería se arma por secciones a lo largo del auto (como las cuadernas de un barco): cada sección es un óvalo
// cuadrado cuyo alto sale del perfil de lado y cuyo ancho sale de la planta. Así salen hombros redondeados, aletas y pasos de rueda.
// Se dibuja con x hacia adelante, y hacia arriba, z a lo ancho, y después se gira para que el auto mire a +z.
import * as THREE from 'three';
import { radialTex, canvasTex } from './fx.js';

import { MODELS, UPGRADES } from './data.js';

const S = {};
function shared() {
  if (S.chrome) return S;
  S.chrome = new THREE.MeshStandardMaterial({ color: 0xeef1f4, metalness: 1, roughness: 0.12, envMapIntensity: 1.7, side: THREE.DoubleSide });
  S.glass = new THREE.MeshPhysicalMaterial({ color: 0x070a10, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2 });
  S.rubber = new THREE.MeshStandardMaterial({ color: 0x1a1a1d, roughness: 0.88, side: THREE.DoubleSide });
  S.white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.45 });
  S.dark = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.7, side: THREE.DoubleSide });
  S.steel = new THREE.MeshStandardMaterial({ color: 0x3a3c42, metalness: 0.6, roughness: 0.45 });
  S.red = new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.45 });
  S.shadow = new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(0,0,0,0.9)'], [0.5, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false });
  return S;
}
export function paintMat(color) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.4, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.3 });
}
const ease = t => 1 - (1 - t) * (1 - t);
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const spow = (v, e) => Math.sign(v) * Math.pow(Math.abs(v), e);

// ----- la forma: perfil de lado, planta y sección -----
function shapeOf(P) {
  const L2 = P.len / 2, W2 = P.wid / 2, tr = P.tire, ar = tr + 0.07;
  const fx = L2 - P.fo, rx = fx - P.wb;
  const wsX = L2 - P.hood, rfX = wsX - P.rake, rrX = rfX - P.roofLen, rwX = rrX - P.rrake;
  const top = x => {
    if (x > L2 - 0.42) return P.nose + (P.belt - P.nose) * ease((L2 - x) / 0.42);
    if (x > wsX) return P.belt + 0.035 * Math.sin(Math.PI * (L2 - 0.42 - x) / (L2 - 0.42 - wsX));
    if (x > rwX) return P.belt + 0.01;
    if (x > -L2 + 0.38) return P.belt + 0.01 + (P.deck - P.belt - 0.01) * smooth(rwX, -L2 + 0.38, x);
    return P.tail + (P.deck - P.tail) * ease((x + L2) / 0.38);
  };
  const bot = x => {
    let y = P.clr;
    if (x > L2 - 0.35) y += 0.2 * ((x - (L2 - 0.35)) / 0.35) ** 2;
    if (x < -L2 + 0.4) y += 0.24 * ((-L2 + 0.4 - x) / 0.4) ** 2;
    for (const wx of [fx, rx]) { const d = Math.abs(x - wx); if (d < ar) y = Math.max(y, tr + Math.sqrt(ar * ar - d * d)); }
    return y;
  };
  const pc = 0;
  const half = x => { const u = Math.min(1, Math.abs(x - pc) / L2), p = x > pc ? P.pF : P.pR; return W2 * Math.pow(Math.max(0, 1 - Math.pow(u, p)), 1 / p); };
  // aletas atrás y cejas sobre los focos: los costados de arriba suben
  const fin = x => P.fin * smooth(-L2 + 2.0, -L2 + 0.25, x);
  const brow = x => P.brows * smooth(L2 - 0.7, L2 - 0.15, x);
  const nTop = P.nTop ?? 2.4, nBot = 8, tumble = P.tumble ?? 0.1;
  // punto de la sección en el ángulo th (de -π/2 abajo, por la derecha hasta π/2 arriba, y vuelta por la izquierda)
  const point = (x, th, out) => {
    const T = top(x), B = bot(x), mid = (T + B) / 2, hh = (T - B) / 2, w = half(x);
    const s = Math.sin(th), c = Math.cos(th), n = s > 0 ? nTop : nBot;
    const ln = Math.pow(Math.abs(c), 2 / n);
    let y = mid + hh * spow(s, 2 / n);
    if (s > 0) y += (fin(x) + brow(x)) * smooth(0.55, 0.97, ln);
    const z = Math.sign(c) * ln * w * (1 - tumble * Math.pow(Math.max(0, s), 1.5));
    out.set(x, y, z);
    return out;
  };
  // ancho de la carrocería a cierta altura (para pegar cromos y la franja)
  const sideZ = (x, y) => {
    const T = top(x), B = bot(x), mid = (T + B) / 2, hh = (T - B) / 2, t = Math.max(-1, Math.min(1, (y - mid) / hh));
    const n = t > 0 ? nTop : nBot, s = spow(t, n / 2), c = Math.sqrt(Math.max(0, 1 - s * s));
    return Math.pow(c, 2 / n) * half(x) * (1 - tumble * Math.pow(Math.max(0, s), 1.5));
  };
  return { L2, W2, tr, ar, fx, rx, wsX, rfX, rrX, rwX, top, bot, half, point, sideZ };
}

// Malla de secciones: stations = valores de x, ring = puntos por vuelta. classify(x, y, z, th) → índice de material.
function loft(xs, ring, pointAt, classify, nMat) {
  const pos = [], tmp = new THREE.Vector3();
  for (const x of xs) for (let j = 0; j < ring; j++) { pointAt(x, -Math.PI / 2 + j / ring * Math.PI * 2, tmp); pos.push(tmp.x, tmp.y, tmp.z); }
  const lists = Array.from({ length: nMat }, () => []);
  for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ring; j++) {
    const a = i * ring + j, b = i * ring + (j + 1) % ring, c = a + ring, d = b + ring;
    const k = 3 * a, th = -Math.PI / 2 + (j + 0.5) / ring * Math.PI * 2;
    const m = classify((xs[i] + xs[i + 1]) / 2, pos[k + 1], pos[k + 2], th);
    lists[m].push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const idx = []; let start = 0;
  lists.forEach((l, m) => { idx.push(...l); g.addGroup(start, l.length, m); start += l.length; });
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
function stations(a, b, n, extra = []) {
  const xs = []; for (let i = 0; i <= n; i++) xs.push(a + (b - a) * i / n);
  return [...new Set(xs.concat(extra))].sort((p, q) => p - q);
}

// Cinta pegada al costado entre dos alturas lo(x) y hi(x)
function sideStrip(F, x0, x1, lo, hi, side, off, NX = 48) {
  const NY = 5, pos = [], idx = [];
  for (let i = 0; i <= NX; i++) {
    const x = x0 + (x1 - x0) * i / NX;
    for (let j = 0; j <= NY; j++) { const y = lo(x) + (hi(x) - lo(x)) * j / NY; pos.push(x, y, side * (F.sideZ(x, y) + off)); }
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
    const a = i * (NY + 1) + j, b = a + 1, c = a + NY + 1, d = c + 1;
    if (side > 0) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Punto de arriba de una superficie hecha por secciones: la altura en (x, z), buscando el ángulo de la sección
function surfaceY(pointFn, x, z, v = new THREE.Vector3()) {
  let a = 0, b = Math.PI / 2;
  for (let k = 0; k < 16; k++) { const m = (a + b) / 2; pointFn(x, m, v); if (v.z > Math.abs(z)) a = m; else b = m; }
  return pointFn(x, (a + b) / 2, v).y;
}
// Franja pegada arriba (capó, techo, maleta) entre x0..x1 y z0..z1
function topStrip(pointFn, x0, x1, z0, z1, off = 0.004) {
  const NX = 24, NZ = 3, pos = [], idx = [], v = new THREE.Vector3();
  for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) {
    const x = x0 + (x1 - x0) * i / NX, z = z0 + (z1 - z0) * j / NZ;
    pos.push(x, surfaceY(pointFn, x, z, v) + off, z);
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) { const a = i * (NZ + 1) + j, b = a + 1, c = a + NZ + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// Rueda: goma con costado redondeado y, según el auto y las mejoras: banda blanca, línea roja, tapa cromada,
// llanta pintada con tapa chica, o llanta de magnesio para las slicks. Mira hacia +z.
function wheel(W, M) {
  const r = W.r, w = W.w, ri = r * (W.mag ? 0.62 : 0.68), c = Math.min(0.07, w * 0.28);
  const pts = [new THREE.Vector2(ri, -w / 2 + 0.02)];
  for (let k = 0; k <= 6; k++) { const a = -Math.PI / 2 + k / 6 * Math.PI / 2; pts.push(new THREE.Vector2(r - c + Math.cos(a) * c, -w / 2 + c + Math.sin(a) * c)); }
  for (let k = 0; k <= 6; k++) { const a = k / 6 * Math.PI / 2; pts.push(new THREE.Vector2(r - c + Math.cos(a) * c, w / 2 - c + Math.sin(a) * c)); }
  pts.push(new THREE.Vector2(ri, w / 2 - 0.02));
  const tg = new THREE.LatheGeometry(pts, 36); tg.rotateX(Math.PI / 2);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(tg, M.rubber));
  const face = w / 2 - 0.015;
  if (W.ww) { const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.72, r * 0.86, 36), M.white); ring.position.z = face + 0.012; g.add(ring); }
  if (W.redline) { const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.8, r * 0.835, 36), M.red); ring.position.z = face + 0.012; g.add(ring); }
  if (W.mag) {
    // llanta de magnesio: plato cromado con cinco agujeros
    const dish = [[0, 0.03], [ri * 0.3, 0.025], [ri * 0.8, -0.01], [ri, -0.035]];
    const dg = new THREE.LatheGeometry(dish.map(([x, y]) => new THREE.Vector2(x, face + y)), 30); dg.rotateX(Math.PI / 2);
    g.add(new THREE.Mesh(dg, M.chrome));
    for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2, h = new THREE.Mesh(new THREE.CircleGeometry(ri * 0.2, 14), M.dark); h.position.set(Math.cos(a) * ri * 0.55, Math.sin(a) * ri * 0.55, face + 0.012); g.add(h); }
    return g;
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(ri + 0.005, 30), W.rim || M.steel); disc.position.z = face - 0.01; g.add(disc);
  const capR = W.cover ? ri * 0.98 : 0.11;
  const prof = [[0, 0.06], [capR * 0.25, 0.058], [capR * 0.55, 0.045], [capR * 0.8, 0.025], [capR, 0]];
  const cg = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, face + y)), 30); cg.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(cg, M.chrome));
  if (W.cover) { const hub = new THREE.Mesh(new THREE.CircleGeometry(0.05, 18), W.rim || M.dark); hub.position.z = face + 0.062; g.add(hub); }
  else { const trim = new THREE.Mesh(new THREE.TorusGeometry(ri - 0.012, 0.014, 8, 36), M.chrome); trim.position.z = face; g.add(trim); }
  return g;
}

// Número de carrera en un círculo blanco
const _numTex = new Map();
function numberMat(n) {
  if (!_numTex.has(n)) _numTex.set(n, new THREE.MeshStandardMaterial({ roughness: 0.4, map: canvasTex(128, 128, (g) => {
    g.fillStyle = '#f4f1ea'; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#111'; g.font = '900 78px "Avenir Next", "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), 64, 70);
  }), transparent: true }));
  return _numTex.get(n);
}

// car: { model, color, decal, num, up } — el auto tal como está (con sus mejoras a la vista)
export function buildCar(car) {
  const M = shared(), key = car.model, up = car.up || {};
  const P = Object.assign({}, MODELS[key].shape);
  P.scoop = P.scoop || up.intake >= 1; P.blower = up.engine >= 3; P.sidePipes = up.exhaust >= 2;
  const F = shapeOf(P);
  const { L2, W2, tr, fx, rx, wsX, rfX, rrX, rwX } = F;
  const paint = paintMat(car.color || '#c8202a');
  const trimMat = paintMat(P.sweep || '#f2efe6');
  const head = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0cc, emissiveIntensity: 3 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1608, emissiveIntensity: 0.9 });
  const root = new THREE.Group(), body = new THREE.Group(), prof = new THREE.Group(), wheelsG = new THREE.Group();
  prof.rotation.y = -Math.PI / 2; wheelsG.rotation.y = -Math.PI / 2;
  root.add(body); body.add(prof); root.add(wheelsG);
  body.position.y = -UPGRADES.susp.drop[up.susp || 0];

  // ----- carrocería -----
  const ar = F.ar, xs = stations(-L2, L2, 110, [fx - ar, fx + ar, rx - ar, rx + ar, L2 - 0.004, -L2 + 0.004]);
  prof.add(new THREE.Mesh(loft(xs, 64, F.point, () => 0, 1), paint));
  if (P.sweep && car.decal !== 'flames') {
    const x0 = -L2 + 0.42, x1 = 0.75;
    const mid = x => P.belt - 0.2 + 0.03 * (x - x0) / (x1 - x0), hh = x => 0.085 * (1 - Math.pow((x - x0) / (x1 - x0), 2.2)) + 0.004;
    for (const side of [-1, 1]) prof.add(new THREE.Mesh(sideStrip(F, x0, x1, x => mid(x) - hh(x), x => mid(x) + hh(x), side, 0.003), trimMat));
  }
  for (const wx of [fx, rx]) { const well = new THREE.Mesh(new THREE.CylinderGeometry(ar - 0.01, ar - 0.01, P.wid - 0.5, 20, 1, true, Math.PI / 2, Math.PI), M.dark); well.rotation.x = Math.PI / 2; well.position.set(wx, tr, 0); prof.add(well); }

  // ----- cabina -----
  const roofY = x => {
    if (x > rfX) { const t = (wsX - x) / (wsX - rfX); return P.belt + (P.roof - 0.04 - P.belt) * Math.sin(t * Math.PI / 2); }
    if (x > rrX) return P.roof - 0.04 + 0.05 * Math.sin(Math.PI * (rfX - x) / (rfX - rrX));
    const t = (x - rwX) / (rrX - rwX); return P.belt + (P.roof - 0.04 - P.belt) * Math.sin(t * Math.PI / 2) ** 0.8;
  };
  const cabPoint = (x, th, out) => {
    const T = roofY(x), B = P.belt - 0.06, mid = (T + B) / 2, hh = Math.max(0.01, (T - B) / 2);
    const sn = Math.sin(th), cs = Math.cos(th), n = sn > 0 ? 4 : 8, ln = Math.pow(Math.abs(cs), 2 / n);
    const w = F.half(x) - 0.12, y = mid + hh * spow(sn, 2 / n), narrow = 0.26 * ((T - B) > 0.05 ? smooth(B, T, y) : 0);
    out.set(x, y, Math.sign(cs) * ln * (w - narrow));
    return out;
  };
  const cabG = loft(stations(rwX, wsX, 50, [rrX + 0.06]), 48, cabPoint, (x, y, z, th) => {
    if (Math.sin(th) > 0.88 && x < rfX - 0.02 && x > rrX + 0.02) return 1;
    if (x < rrX + 0.06 && Math.abs(Math.cos(th)) > 0.35) return 1;
    return 0;
  }, 2);
  prof.add(new THREE.Mesh(cabG, [M.glass, paint]));
  for (const side of [-1, 1]) {
    const pts = []; for (let k = 0; k <= 20; k++) { const x = rwX + 0.05 + (wsX - rwX - 0.1) * k / 20; pts.push(new THREE.Vector3(x, P.belt - 0.03, side * (F.sideZ(x, P.belt - 0.03) + 0.004))); }
    prof.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.016, 6), M.chrome));
  }

  // ----- calcomanías: llamas, franjas de carrera o número -----
  if (car.decal === 'flames') {
    const x0 = L2 - 0.3, x1 = Math.max(rx + 0.6, L2 - 2.6);
    const u = x => (x0 - x) / (x0 - x1), lo = x => P.belt - 0.33 + 0.1 * u(x);
    const tongue = (x, k) => { const q = u(x); return lo(x) + 0.3 * k * Math.pow(Math.max(0, 1 - q), 0.55) * (0.3 + 0.7 * (1 - ((q * 4.5) % 1))) + 0.004; };
    const orange = new THREE.MeshStandardMaterial({ color: 0xff5a14, roughness: 0.35, emissive: 0x401000 }), yellow = new THREE.MeshStandardMaterial({ color: 0xffd02e, roughness: 0.35, emissive: 0x302000 });
    for (const side of [-1, 1]) {
      prof.add(new THREE.Mesh(sideStrip(F, x0, x1, lo, x => tongue(x, 1), side, 0.003, 120), orange));
      prof.add(new THREE.Mesh(sideStrip(F, x0 - 0.05, x1 + 0.3, x => lo(x) + 0.02, x => tongue(x, 0.6), side, 0.005, 120), yellow));
    }
  }
  const stripes = car.decal === 'stripes';
  if (stripes) {
    const sMat = paintMat(car.color === '#f2efe6' ? '#16161c' : '#f2efe6');
    for (const z0 of [0.07, -0.22]) {
      prof.add(new THREE.Mesh(topStrip(F.point, wsX + 0.05, L2 - 0.4, z0, z0 + 0.15), sMat));
      prof.add(new THREE.Mesh(topStrip(F.point, -L2 + 0.4, rwX - 0.04, z0, z0 + 0.15), sMat));
      prof.add(new THREE.Mesh(topStrip(cabPoint, rrX + 0.04, rfX - 0.04, z0, z0 + 0.15, 0.005), sMat));
    }
  }
  if (car.decal === 'number') {
    const n = car.num || 7, x = (fx + rx) / 2 + 0.15, y = P.belt - 0.27;
    for (const side of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.CircleGeometry(0.19, 32), numberMat(n));
      m.position.set(x, y, side * (F.sideZ(x, y) + 0.006)); if (side < 0) m.rotation.y = Math.PI;
      prof.add(m);
    }
  }

  // ----- parachoques, parrilla y luces -----
  const bumper = (front) => {
    const pts = [], y = P.clr + (front ? 0.16 : 0.18), p = front ? P.pF : P.pR;
    for (let k = 0; k <= 16; k++) {
      const z = (k / 16 * 2 - 1) * (W2 - 0.04), u = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(z) / W2, p)), 1 / p);
      pts.push(new THREE.Vector3((front ? 1 : -1) * (u * L2 + 0.05 - 0.12 * Math.pow(Math.abs(z) / W2, 6)), y, z));
    }
    prof.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.075, 10), M.chrome));
    for (const s of [0, 16]) prof.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), M.chrome), pts[s].x, pts[s].y, pts[s].z));
  };
  bumper(true); bumper(false);
  const frontX = z => Math.pow(Math.max(0, 1 - Math.pow(Math.abs(z) / W2, P.pF)), 1 / P.pF) * L2;
  const rearX = z => -Math.pow(Math.max(0, 1 - Math.pow(Math.abs(z) / W2, P.pR)), 1 / P.pR) * L2;
  const gw = P.wid * 0.5, gy0 = P.clr + 0.24, gy1 = P.nose - 0.1;
  prof.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.08, gy1 - gy0, gw), M.dark), frontX(gw / 2) - 0.02, (gy0 + gy1) / 2, 0));
  for (let k = 0; k <= 3; k++) prof.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, gw), M.chrome), frontX(gw / 2) + 0.025, gy0 + (gy1 - gy0) * k / 3, 0));
  if (P.dagmars) for (const s of [-1, 1]) { const d = new THREE.Mesh(new THREE.ConeGeometry(0.065, 0.18, 16), M.chrome); d.rotation.z = -Math.PI / 2; d.position.set(frontX(0.42) + 0.16, P.clr + 0.17, s * 0.42); prof.add(d); }
  const lamp = new THREE.CylinderGeometry(0.1, 0.1, 0.03, 22); lamp.rotateZ(Math.PI / 2);
  const bezel = new THREE.TorusGeometry(0.108, 0.02, 8, 24); bezel.rotateY(Math.PI / 2);
  for (const s of [-1, 1]) {
    const z = s * (W2 - 0.27), y = P.nose - 0.02, x = frontX(Math.abs(z)) - 0.01;
    prof.add(at(new THREE.Mesh(lamp, head), x, y, z)); prof.add(at(new THREE.Mesh(bezel, M.chrome), x + 0.01, y, z));
  }
  const tl = new THREE.CylinderGeometry(0.055, 0.055, 0.05, 16); tl.rotateZ(Math.PI / 2);
  const tails = P.fin > 0.05 ? [[W2 - 0.16, P.tail - 0.02], [W2 - 0.36, P.tail - 0.02]] : [[W2 - 0.25, P.tail - 0.04], [W2 - 0.46, P.tail - 0.04]];
  for (const s of [-1, 1]) for (const [zz, y] of tails) prof.add(at(new THREE.Mesh(tl, tail), rearX(zz) + 0.005, y, s * zz));
  if (P.spear) for (const s of [-1, 1]) {
    const pts = []; for (let k = 0; k <= 24; k++) { const x = -L2 + 0.45 + (L2 * 2 - 1.0) * k / 24, y = P.belt - 0.13; pts.push(new THREE.Vector3(x, y, s * (F.sideZ(x, y) + 0.006))); }
    prof.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.012, 6), M.chrome));
  }
  // ----- lo que se ve de las mejoras: toma de aire, compresor y escapes laterales -----
  const hx = wsX + Math.min(0.75, P.hood * 0.45), hy = F.top(hx);
  if (P.blower) {
    prof.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.26, 0.42), M.chrome), hx, hy + 0.1, 0));
    prof.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.36), M.dark), hx, hy + 0.25, 0));
    for (const z of [-0.09, 0.09]) prof.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 14), M.chrome), hx + 0.05, hy + 0.36, z));
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.08), M.dark); belt.position.set(hx + 0.27, hy + 0.04, 0.12); prof.add(belt);
  } else if (P.scoop) {
    const sc = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.62, 4, 10), paint); sc.rotation.z = Math.PI / 2; sc.scale.set(1, 1, 3.6); sc.position.set(hx, hy + 0.025, 0); prof.add(sc);
    prof.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.32), M.dark), hx + 0.37, hy + 0.04, 0));
  }
  const pipe = new THREE.CylinderGeometry(0.045, 0.045, 0.22, 12); pipe.rotateZ(Math.PI / 2);
  if (P.sidePipes) {
    for (const s of [-1, 1]) {
      const sp = new THREE.CylinderGeometry(0.055, 0.055, fx - rx - 0.9, 14); sp.rotateZ(Math.PI / 2);
      prof.add(at(new THREE.Mesh(sp, M.chrome), (fx + rx) / 2, P.clr + 0.02, s * (W2 + 0.02)));
    }
  } else for (const zz of key === 'vandal' || key === 'hornet' || key === 'viper' ? [-0.38, 0.38] : [-0.42]) prof.add(at(new THREE.Mesh(pipe, M.chrome), rearX(Math.abs(zz)) - 0.02, P.clr + 0.04, zz));
  prof.add(at(new THREE.Mesh(new THREE.BoxGeometry(P.len - 1.0, 0.3, P.wid - 0.7), M.dark), 0, P.clr + 0.15, 0));

  // ----- ruedas: pivote (dirección) → lado → giro. Con slicks, las de atrás son anchas -----
  const rim = P.rims ? new THREE.MeshStandardMaterial({ color: P.rims, metalness: 0.25, roughness: 0.35 }) : null;
  const slicks = up.tires >= 2, redline = up.tires === 1;
  const wheels = [];
  for (const [x, front] of [[fx, true], [rx, false]]) for (const side of [-1, 1]) {
    const W = { r: P.tire + (slicks && !front ? 0.025 : 0), w: P.tireW * (slicks && !front ? 1.55 : 1), ww: P.ww && !slicks && !redline, redline, mag: slicks, cover: P.cover, rim };
    const pivot = new THREE.Group(); pivot.position.set(x, P.tire, side * (W2 - 0.19 + (slicks && !front ? 0.04 : 0)));
    const sideG = new THREE.Group(); if (side < 0) sideG.rotation.y = Math.PI;
    const spin = wheel(W, M);
    sideG.add(spin); pivot.add(sideG); wheelsG.add(pivot);
    wheels.push({ pivot, spin, front, sgn: side, r: W.r });
  }
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(P.wid + 0.7, P.len + 0.9), M.shadow);
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.025; sh.renderOrder = 1; root.add(sh);

  return {
    root, body, shape: P, key, paint, head, tail, wheels, len: P.len, wid: P.wid,
    setBrake(b) { tail.emissiveIntensity = b ? 5 : 0.9; },
    // Sigue al vehículo de la física: posición, giro de ruedas, dirección e inclinación de la carrocería
    sync(v, dt) {
      root.position.set(v.x, v.y, v.z); root.rotation.y = v.h;
      for (const w of wheels) {
        const om = v.vf / w.r + (w.front ? 0 : v.spin * 40);
        w.spin.rotation.z -= w.sgn * om * dt;
        if (w.front) w.pivot.rotation.y = -v.steerAngle;
      }
      const k = Math.min(1, dt * 7);
      body.rotation.x += (THREE.MathUtils.clamp(-v.ax * 0.0065, -0.05, 0.05) - body.rotation.x) * k;
      body.rotation.z += (THREE.MathUtils.clamp(-v.alat * 0.007, -0.06, 0.06) - body.rotation.z) * k;
      this.setBrake(v.braking);
    },
    dispose() { root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); paint.dispose(); trimMat.dispose(); head.dispose(); tail.dispose(); }
  };
}
// La firma de lo que se ve de un auto (si cambia, hay que armarlo de nuevo)
export const lookKey = car => [car.model, car.color, car.decal, car.num, car.up.intake >= 1, car.up.engine >= 3, car.up.exhaust >= 2, car.up.tires, car.up.susp].join('|');
