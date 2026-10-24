// ===== Autos inventados al estilo de los años 50, armados a partir de unos pocos números =====
// Secciones de chapa con hombros, aristas y pasos de rueda. Cristales y pilares separados.
// Se dibuja con x hacia adelante, y hacia arriba, z a lo ancho, y después se gira para que el auto mire a +z.
import * as THREE from 'three';
import { radialTex, canvasTex } from './fx.js';
import { mergeGeometries } from '../vendor/jsm/utils/BufferGeometryUtils.js';

import { MODELS, UPGRADES } from './data.js';

const S = {};
function shared() {
  if (S.chrome) return S;
  S.chrome = new THREE.MeshStandardMaterial({ color: 0xdce5ee, metalness: 1, roughness: 0.16, envMapIntensity: 1.15, side: THREE.DoubleSide });
  S.glass = new THREE.MeshPhysicalMaterial({ color: 0x101b23, metalness: 0.18, roughness: 0.075, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.15, transparent: true, opacity: 0.975, depthWrite: false, side: THREE.FrontSide });
  S.seat = new THREE.MeshStandardMaterial({ color: 0x35251e, roughness: 0.88 });
  S.lens = new THREE.MeshStandardMaterial({ color: 0xddd7b5, roughness: 0.28, metalness: 0.15 });
  S.rubber = new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.94, side: THREE.DoubleSide });
  S.white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.45 });
  S.dark = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.7, side: THREE.DoubleSide });
  S.steel = new THREE.MeshStandardMaterial({ color: 0x3a3c42, metalness: 0.6, roughness: 0.45 });
  S.red = new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.45 });
  S.bay = new THREE.MeshStandardMaterial({ color: 0x24252a, roughness: 0.85, side: THREE.BackSide });
  S.under = new THREE.MeshStandardMaterial({ color: 0x2a2b30, roughness: 0.8, side: THREE.BackSide });
  S.alu = new THREE.MeshStandardMaterial({ color: 0xa8acb4, metalness: 0.8, roughness: 0.35 });
  S.chromeSoft = new THREE.MeshStandardMaterial({ color: 0xd8dce2, metalness: 1, roughness: 0.32, envMapIntensity: 0.9 });
  S.iron = new THREE.MeshStandardMaterial({ color: 0x4a3a30, metalness: 0.4, roughness: 0.7 });
  S.nitro = new THREE.MeshStandardMaterial({ color: 0x2c6ad8, metalness: 0.5, roughness: 0.3 });
  S.shadow = new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(0,0,0,0.9)'], [0.5, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false });
  S.contact = new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(0,0,0,0.9)'], [0.4, 'rgba(0,0,0,0.65)'], [1, 'rgba(0,0,0,0)']]), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  S.glow = radialTex([[0, 'rgba(255,255,255,0.55)'], [0.3, 'rgba(255,255,255,0.2)'], [1, 'rgba(255,255,255,0)']]);
  S.tread = new THREE.MeshStandardMaterial({ color: 0x28292a, roughness: 1 });
  return S;
}
export function paintMat(color) {
  return new THREE.MeshPhysicalMaterial({ color, metalness: 0.22, roughness: 0.21, clearcoat: 1, clearcoatRoughness: 0.055, envMapIntensity: 0.85 });
}
const ease = t => 1 - (1 - t) * (1 - t);
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

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
  // Superelipse truncada: cada modelo conserva su planta y el frente admite ópticas.
  const half = x => {
    const p = x > 0 ? P.pF : P.pR, u = Math.abs(x) / (L2 + 0.42);
    return W2 * Math.pow(1 - Math.pow(u, p), 1 / p);
  };
  const fin = x => P.fin * smooth(-L2 + 1.9, -L2 + 0.15, x);
  const brow = x => P.brows * smooth(L2 - 0.8, L2 - 0.10, x);
  const point = (x, th, out) => {
    const T = top(x), B = Math.min(T - 0.035, bot(x)), mid = (T + B) / 2, hh = (T - B) / 2;
    const sn = Math.sin(th), cs = Math.cos(th), n = sn > 0 ? P.nTop : 7;
    const ln = Math.pow(Math.abs(cs), 2 / n);
    const fender = Math.max(0, 2.5 - P.nTop) * 0.18 * Math.max(Math.exp(-(((x - fx) / 0.65) ** 2)), Math.exp(-(((x - rx) / 0.65) ** 2)));
    const y = mid + hh * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n)
      + (sn > 0 ? ((brow(x) + fender) * smooth(0.45, 0.88, ln) + fin(x) * 2 * Math.exp(-(((ln - 0.91) / 0.10) ** 2))) * Math.pow(sn, 0.20) : 0);
    return out.set(x, y, Math.sign(cs) * ln * half(x) * (1 - P.tumble * Math.pow(Math.max(0, sn), 1.5)));
  };
  const vSide = new THREE.Vector3();
  const sideZ = (x, y) => {
    let lastY = 0, lastZ = 0, z = 0;
    for (let i = 0; i <= 16; i++) {
      point(x, -Math.PI / 2 + i / 16 * Math.PI, vSide);
      if (i && y >= Math.min(lastY, vSide.y) && y <= Math.max(lastY, vSide.y) && Math.abs(vSide.y - lastY) > 0.00001) z = Math.max(z, lastZ + (vSide.z - lastZ) * (y - lastY) / (vSide.y - lastY));
      lastY = vSide.y; lastZ = vSide.z;
    }
    return z;
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
    const m = classify((xs[i] + xs[i + 1]) / 2, (pos[k + 1] + pos[b * 3 + 1] + pos[c * 3 + 1] + pos[d * 3 + 1]) / 4, (pos[k + 2] + pos[b * 3 + 2] + pos[c * 3 + 2] + pos[d * 3 + 2]) / 4, th);
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
  const NY = 2, pos = [], idx = [], active = [];
  for (let i = 0; i <= NX; i++) {
    const x = x0 + (x1 - x0) * i / NX;
    const bottom = Math.min(F.top(x) - 0.01, F.bot(x) + 0.02), low = Math.max(lo(x), bottom), high = hi(x);
    active.push(high > bottom);
    for (let j = 0; j <= NY; j++) { const y = low + (Math.max(low, high) - low) * j / NY; pos.push(x, y, side * (F.sideZ(x, y) + off)); }
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
    if (!active[i] || !active[i + 1]) continue;
    const a = i * (NY + 1) + j, b = a + 1, c = a + NY + 1, d = c + 1;
    if ((side > 0) === (x1 > x0)) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
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
  for (let k = 0; k <= 4; k++) { const a = -Math.PI / 2 + k / 4 * Math.PI / 2; pts.push(new THREE.Vector2(r - c + Math.cos(a) * c, -w / 2 + c + Math.sin(a) * c)); }
  for (let k = 0; k <= 4; k++) { const a = k / 4 * Math.PI / 2; pts.push(new THREE.Vector2(r - c + Math.cos(a) * c, w / 2 - c + Math.sin(a) * c)); }
  pts.push(new THREE.Vector2(ri, w / 2 - 0.02));
  const tg = new THREE.LatheGeometry(pts, 24); tg.rotateX(Math.PI / 2);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(tg, M.rubber));
  const face = w / 2 - 0.015;
  if (W.ww) { const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.72, r * 0.86, 36), M.white); ring.position.z = face + 0.012; g.add(ring); }
  if (W.redline) { const ring = new THREE.Mesh(new THREE.RingGeometry(r * 0.8, r * 0.835, 36), M.red); ring.position.z = face + 0.012; g.add(ring); }
  // Anillos moldeados y bloques de hombro: detalle sin texturas externas.
  for (const rr of [r * 0.71, r * 0.91]) {
    const bead = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.004, 4, 24), M.tread); bead.position.z = face + 0.008; g.add(bead);
  }
  if (!W.mag) for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2, tread = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.005, w * 0.7), M.tread);
    tread.position.set(Math.sin(a) * (r - 0.002), Math.cos(a) * (r - 0.002), 0); tread.rotation.z = -a + 0.12; g.add(tread);
  }
  if (W.mag) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(ri, 28), M.dark); disc.position.z = face - 0.025; g.add(disc);
    for (const rr of [ri, ri * 0.88]) { const lip = new THREE.Mesh(new THREE.TorusGeometry(rr, 0.012, 6, 28), M.chrome); lip.position.z = face + 0.005; g.add(lip); }
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2, spoke = new THREE.Mesh(new THREE.BoxGeometry(ri * 0.25, ri * 0.83, 0.05), M.chromeSoft);
      spoke.position.set(-Math.sin(a) * ri * 0.42, Math.cos(a) * ri * 0.42, face); spoke.rotation.z = a; g.add(spoke);
      const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 4), M.chrome); bolt.position.set(Math.sin(a) * 0.065, Math.cos(a) * 0.065, face + 0.042); g.add(bolt);
    }
    const hub = new THREE.Mesh(new THREE.CircleGeometry(ri * 0.28, 20), M.chrome); hub.position.z = face + 0.035; g.add(hub);
    batch(g); return g;
  }
  const disc = new THREE.Mesh(new THREE.CircleGeometry(ri + 0.005, 30), W.rim || M.steel); disc.position.z = face - 0.01; g.add(disc);
  const capR = W.cover ? ri * 0.98 : 0.11;
  const prof = [[0, 0.06], [capR * 0.25, 0.058], [capR * 0.55, 0.045], [capR * 0.8, 0.025], [capR, 0]];
  const cg = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(x, face + y)), 30); cg.rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(cg, M.chrome));
  if (W.cover) { const hub = new THREE.Mesh(new THREE.CircleGeometry(0.05, 18), W.rim || M.dark); hub.position.z = face + 0.062; g.add(hub); }
  else { const trim = new THREE.Mesh(new THREE.TorusGeometry(ri - 0.012, 0.014, 6, 28), M.chrome); trim.position.z = face; g.add(trim); }
  batch(g); return g;
}

// Junta piezas rígidas por material; el capó y cada rueda conservan su pivote.
function batch(group) {
  const bins = new Map();
  for (const o of [...group.children]) {
    if (!o.isMesh || Array.isArray(o.material) || o.material.transparent) continue;
    o.updateMatrix();
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    g.applyMatrix4(o.matrix);
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
    if (!bins.has(o.material)) bins.set(o.material, []);
    bins.get(o.material).push(g); group.remove(o); o.geometry.dispose();
  }
  for (const [mat, list] of bins) {
    const g = mergeGeometries(list), m = new THREE.Mesh(g, mat);
    list.forEach(g => g.dispose()); group.add(m);
  }
}
function tube(points, r, mat, segments = 20) {
  return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal'), segments, r, 5, false), mat);
}
function panel(points, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(points.flat(), 3));
  const idx = []; for (let i = 1; i < points.length - 1; i++) idx.push(0, i, i + 1);
  g.setIndex(idx); g.computeVertexNormals(); return new THREE.Mesh(g, mat);
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

// ----- el motor que se ve con el capó abierto: cambia con las mejoras -----
const ENGINE_COLOR = { sprite: '#2c7a3c', bantam: '#3a5aa8', marquis: '#3a5aa8', vandal: '#d06018', starliner: '#c8202a', monarch: '#26282e', hornet: '#2c4a9a', viper: '#d06018' };
function engineBay(key, P, F, up, M) {
  const g = new THREE.Group(), { L2, W2, wsX } = F, v8 = MODELS[key].cyl === 8;
  const x0 = wsX + 0.07, x1 = L2 - 0.18, len = x1 - x0, xc = (x0 + x1) / 2;
  const yTop = Math.min(F.top(x0), F.top(x1)) - 0.035, yBot = P.clr + 0.12;
  // el hueco del motor: una caja oscura vista por dentro
  g.add(at(new THREE.Mesh(new THREE.BoxGeometry(len, yTop - yBot + 0.02, (W2 - 0.17) * 2), M.bay), xc, (yTop + yBot) / 2, 0));
  const paintE = new THREE.MeshStandardMaterial({ color: ENGINE_COLOR[key] || '#c8202a', roughness: 0.4, metalness: 0.35 });
  const ex = xc - 0.04, eb = yBot + 0.04, yTopE = F.top(ex) - 0.04, eh = Math.max(0.12, Math.min(0.36, yTopE - eb - 0.2)), et = eb + eh;
  const box = (w, h, d, m, x, y, z) => at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z);
  g.add(box(Math.min(0.8, len - 0.45), eh, v8 ? 0.48 : 0.34, paintE, ex, eb + eh / 2, 0));
  // tapas de válvulas: pintadas; cromadas desde el motor "Carrera"
  const cover = up.engine >= 2 ? M.chromeSoft : paintE;
  if (v8) for (const s of [-1, 1]) {
    g.add(box(Math.min(0.76, len - 0.5), 0.07, 0.2, M.dark, ex, et - 0.01, s * 0.2));
    const c = box(Math.min(0.72, len - 0.52), 0.08, 0.17, cover, ex, et + 0.05, s * 0.21); c.rotation.x = s * 0.22; g.add(c);
    for (let k = 0; k < 3; k++) g.add(box(0.03, 0.02, 0.15, M.dark, ex - 0.2 + k * 0.2, et + 0.1, s * 0.21));
  }
  else g.add(box(Math.min(0.82, len - 0.45), 0.09, 0.2, cover, ex, et + 0.04, 0));
  g.add(box(0.5, 0.06, 0.2, M.alu, ex, et + 0.07, 0));
  // carburadores con su filtro de aire (el compresor va aparte, asomado por el capó)
  const cy = et + 0.13;
  const dome = (r, x) => { const d = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.chromeSoft); d.scale.y = 0.55; d.position.set(x, cy, 0); g.add(d); g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, 0.06, 12), M.alu), x, cy - 0.03, 0)); };
  if (up.engine < 3) {
    if (up.intake === 0) dome(0.12, ex);
    else if (up.intake === 1) { dome(0.1, ex - 0.15); dome(0.1, ex + 0.15); }
    else {
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 28), M.chromeSoft), ex, cy + 0.01, 0));
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 28), M.red), ex, cy + 0.055, 0));
    }
  }
  // múltiples de escape: de fierro, o colectores cromados con el escape preparado
  for (const s of [-1, 1]) {
    if (up.exhaust >= 1) for (let k = 0; k < (v8 ? 4 : 3); k++) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.34, 10), M.chromeSoft); t.position.set(ex - 0.27 + k * (v8 ? 0.18 : 0.26), eb + eh * 0.45, s * (v8 ? 0.31 : 0.24)); t.rotation.x = s * 0.9; g.add(t); }
    else g.add(box(Math.min(0.7, len - 0.5), 0.08, 0.06, M.iron, ex, eb + eh * 0.55, s * (v8 ? 0.29 : 0.22)));
  }
  // radiador, ventilador, batería y las botellas de nitro
  const rh = Math.min(0.46, yTop - yBot - 0.06);
  g.add(box(0.05, rh, (W2 - 0.32) * 2, M.dark, x1 - 0.05, yBot + rh / 2 + 0.02, 0));
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 12), M.chromeSoft), x1 - 0.05, yBot + rh + 0.04, 0.25));
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(Math.min(0.17, eh * 0.8), Math.min(0.17, eh * 0.8), 0.02, 16), M.dark); fan.rotation.z = Math.PI / 2; fan.position.set(x1 - 0.14, eb + eh * 0.6, 0); g.add(fan);
  g.add(box(0.24, 0.18, 0.17, M.dark, x1 - 0.36, yBot + 0.1, W2 - 0.36));
  g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.04, 10), M.red), x1 - 0.3, yBot + 0.21, W2 - 0.36));
  for (let i = 0; i < up.nitro; i++) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, Math.min(0.5, len - 0.6), 14), M.nitro); b.rotation.z = Math.PI / 2;
    b.position.set(xc, yBot + 0.09 + i * 0.12, -(W2 - 0.3)); g.add(b);
  }
  return { group: g, center: new THREE.Vector3(ex, et, 0) };
}

// car: { model, color, decal, num, up } — el auto tal como está (con sus mejoras a la vista)
export function buildCar(car) {
  const M = shared(), key = car.model, up = car.up || {};
  const P = Object.assign({}, MODELS[key].shape);
  P.nose += (P.belt - P.nose) * 0.30; P.tail += (P.deck - P.tail) * 0.25;
  P.scoop = P.scoop || up.intake >= 1; P.blower = up.engine >= 3; P.sidePipes = up.exhaust >= 2;
  const F = shapeOf(P);
  const { L2, W2, tr, fx, rx, wsX, rfX, rrX, rwX } = F;
  const paint = paintMat(car.color || '#c8202a');
  const trimMat = paintMat(P.sweep || '#f2efe6');
  const head = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff0cc, emissiveIntensity: 3 });
  const tail = new THREE.MeshStandardMaterial({ color: 0x400000, emissive: 0xff1608, emissiveIntensity: 0.9 });
  const spillMat = new THREE.MeshBasicMaterial({ color: 0xff3218, map: M.glow, transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending });
  const root = new THREE.Group(), body = new THREE.Group(), prof = new THREE.Group(), wheelsG = new THREE.Group();
  prof.rotation.y = -Math.PI / 2; wheelsG.rotation.y = -Math.PI / 2;
  root.add(body); body.add(prof); root.add(wheelsG);
  body.position.y = -UPGRADES.susp.drop[up.susp || 0];

  // ----- carrocería -----
  const ar = F.ar, hx0 = wsX + 0.04, hx1 = L2 - 0.12, blowerX = wsX + Math.min(0.75, P.hood * 0.45);
  const xs = stations(-L2, L2, 64, [fx - ar, fx + ar, rx - ar, rx + ar, L2 - 0.004, -L2 + 0.004, hx0, hx1, blowerX - 0.3, blowerX + 0.3]);
  const bodyG = loft(xs, 32, F.point, (x, y, z, th) => {
    if (x > rwX + 0.08 && x < wsX - 0.04 && Math.sin(th) > 0.72) return 3;
    if (x > hx0 && x < hx1 && Math.sin(th) > 0.72) return P.blower && Math.abs(x - blowerX) < 0.3 && Math.abs(z) < 0.24 ? 2 : 1;
    return 0;
  }, 4);
  const part = gi => { const gr = bodyG.groups[gi], g2 = new THREE.BufferGeometry(); for (const k in bodyG.attributes) g2.setAttribute(k, bodyG.attributes[k]); g2.setIndex(new THREE.BufferAttribute(bodyG.index.array.slice(gr.start, gr.start + gr.count), 1)); return g2; };
  prof.add(new THREE.Mesh(part(0), paint), new THREE.Mesh(part(3), M.dark));
  // Cierres del frente y la cola; normales propias para conservar la arista.
  for (const end of [-1, 1]) {
    const pts = [], v = new THREE.Vector3();
    for (let i = 0; i < 32; i++) { F.point(end * L2, -Math.PI / 2 - end * i / 32 * Math.PI * 2, v); pts.push(v.toArray()); }
    prof.add(panel(pts, paint));
  }
  // el capó cuelga de una bisagra junto al parabrisas
  const hinge = new THREE.Group(), hy0 = F.top(hx0);
  hinge.position.set(hx0, hy0, 0); prof.add(hinge);
  const hoodG = part(1);
  hinge.add(at(new THREE.Mesh(hoodG, paint), -hx0, -hy0, 0), at(new THREE.Mesh(hoodG, M.under), -hx0, -hy0, 0));
  const bay = engineBay(key, P, F, up, M); prof.add(bay.group);
  if (P.sweep && car.decal !== 'flames') {
    const x0 = -L2 + 0.42, x1 = 0.75;
    const mid = x => P.belt - 0.2 + 0.03 * (x - x0) / (x1 - x0), hh = x => 0.085 * (1 - Math.pow((x - x0) / (x1 - x0), 2.2)) + 0.004;
    for (const side of [-1, 1]) prof.add(new THREE.Mesh(sideStrip(F, x0, x1, x => mid(x) - hh(x), x => mid(x) + hh(x), side, 0.003), trimMat));
  }
  for (const wx of [fx, rx]) { const well = new THREE.Mesh(new THREE.CylinderGeometry(ar - 0.01, ar - 0.01, P.wid - 0.5, 20, 1, true, Math.PI / 2, Math.PI), M.dark); well.rotation.x = Math.PI / 2; well.position.set(wx, tr, 0); prof.add(well); }

  // ----- cabina: techo, pilares, cristales e interior -----
  const baseY = P.belt - 0.025, roofY = P.roof - 0.065;
  const baseW = x => F.half(x) * (1 - P.tumble) - 0.06;
  const roofW = x => F.half(x) - 0.18 - P.tumble * 0.6;
  const crown = (x, u) => roofY + 0.065 * Math.sin(Math.PI * (x - rrX) / (rfX - rrX)) + 0.065 * (1 - u * u);
  const cabPoint = (x, th, out) => out.set(x, crown(x, Math.cos(th)), Math.cos(th) * roofW(x));
  // Superficies con normales hacia afuera. El techo siempre es chapa opaca.
  const surface = (fn, nx, ny, mat, flip = false) => {
    const pos = [], idx = [];
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
      pos.push(...fn(i / nx, j / ny));
      if (i && j) { const a = (i - 1) * (ny + 1) + j - 1, b = a + 1, c = a + ny + 1, d = c + 1;
        idx.push(...(flip ? [a, c, b, b, c, d] : [a, b, c, b, d, c])); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); prof.add(m); return m;
  };
  const roofMesh = surface((t, v) => { const x = rrX + (rfX - rrX) * t, u = v * 2 - 1; return [x, crown(x, u), u * roofW(x)]; }, 10, 8, paint);
  prof.add(new THREE.Mesh(roofMesh.geometry.clone(), M.under));
  const box = (w, h, d, mat, x, y, z) => at(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z);
  // Bancos acanalados, tablero y volante visibles a través del vidrio.
  for (const x of [rfX - 0.35, rrX + 0.2]) {
    prof.add(box(0.42, 0.12, P.wid - 0.55, M.seat, x, baseY + 0.02, 0));
    const back = box(0.12, Math.max(0.18, P.roof - P.belt - 0.2), P.wid - 0.55, M.seat, x - 0.23, (baseY + roofY) / 2 - 0.08, 0); back.rotation.z = -0.13; prof.add(back);
    for (let i = -4; i <= 4; i++) prof.add(box(0.016, Math.max(0.16, P.roof - P.belt - 0.23), 0.006, M.dark, x - 0.16, (baseY + roofY) / 2 - 0.08, i * 0.12));
  }
  prof.add(box(0.16, 0.09, P.wid - 0.4, M.dark, wsX - 0.18, baseY - 0.04, 0));
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.012, 6, 24), M.white); sw.rotation.y = Math.PI / 2 - 0.35; sw.position.set(wsX - 0.37, baseY + 0.18, 0.39); prof.add(sw);
  prof.add(tube([[wsX - 0.37, baseY + 0.18, 0.26], [wsX - 0.37, baseY + 0.18, 0.52]], 0.008, M.chrome, 2));
  const wrap = P.fin > 0.1 ? 0.22 : 0.10, fastback = P.rrake > 0.95;
  const windPoint = (front, t, v) => {
    const u = v * 2 - 1, xb = front ? wsX : rwX, xt = front ? rfX : rrX;
    const curve = front ? t : Math.sin(t * Math.PI / 2);
    const x = xb + (xt - xb) * t + (front ? -1 : 1) * wrap * u * u * (1 - t * 0.4);
    const y = baseY + (roofY - baseY) * curve + 0.065 * (1 - u * u) * t;
    const w = baseW(xb) * (1 - t) + roofW(xt) * t;
    return [x, y, u * w];
  };
  const wind = front => {
    const lo = front || !fastback ? 0 : 0.32, hi = front || !fastback ? 1 : 0.87;
    // La luneta del fastback ocupa sólo una parte de la caída de chapa.
    if (lo) surface((t, v) => windPoint(front, t * lo, v), 6, 8, paint);
    if (hi < 1) surface((t, v) => windPoint(front, hi + (1 - hi) * t, v), 4, 8, paint);
    surface((t, v) => windPoint(front, lo + (hi - lo) * t, 0.06 + 0.88 * v), 8, 12, M.glass, front);
    for (const edge of [0, 1]) {
      surface((t, v) => windPoint(front, lo + (hi - lo) * t, edge ? 0.94 + v * 0.06 : v * 0.06), 8, 1, paint, front);
      const pts = []; for (let i = 0; i <= 16; i++) pts.push(windPoint(front, edge ? hi : lo, i / 16));
      prof.add(tube(pts, 0.013, M.chrome, 14));
    }
    for (const v of [0, 1]) {
      const pts = []; for (let i = 0; i <= 12; i++) pts.push(windPoint(front, i / 12, v));
      prof.add(tube(pts, front ? 0.027 : 0.034, paint, 16));
    }
  };
  wind(true); wind(false);
  for (const side of [-1, 1]) {
    const sidePoint = (u, v) => {
      const a = windPoint(false, v, side > 0 ? 1 : 0), b = windPoint(true, v, side > 0 ? 1 : 0);
      const x = a[0] + (b[0] - a[0]) * u;
      const y = a[1] + (b[1] - a[1]) * u + 0.065 * Math.sin(Math.PI * u) * v;
      const w = baseW(x) * (1 - v) + roofW(x) * v;
      return [x, y, side * w];
    };
    const cut = fastback ? 0.36 : 0.13;
    surface((u, v) => sidePoint(u * cut, v), 6, 6, paint, side > 0);
    surface((u, v) => sidePoint(cut + (1 - cut) * u, v), 12, 8, M.glass, side > 0);
    for (const v of [0, 1]) {
      const pts = []; for (let i = 0; i <= 24; i++) pts.push(sidePoint(i / 24, v));
      prof.add(tube(pts, v ? 0.018 : 0.014, M.chrome, 20));
    }
    for (const u of [cut, 0.56, 0.88]) {
      const pts = []; for (let i = 0; i <= 10; i++) pts.push(sidePoint(u, i / 10));
      prof.add(tube(pts, u === cut ? 0.022 : 0.013, u === cut ? paint : M.chrome, 8));
    }
    // Puertas, estribos y línea de cintura siguen la chapa.
    const doorX = rrX + 0.12, frontX = wsX - 0.02, low = P.clr + 0.1;
    const coords = [[frontX, baseY - 0.035], [frontX + 0.03, low + 0.14], [frontX - 0.12, low], [doorX + 0.12, low], [doorX, low + 0.16], [doorX, baseY - 0.035]];
    const seam = coords.map(([x, y]) => [x, y, side * (F.sideZ(x, y) + 0.008)]);
    prof.add(tube(seam, 0.007, M.dark, 28));
    const handleY = P.belt - 0.08, handleX = doorX + 0.18;
    prof.add(box(0.16, 0.026, 0.035, M.chrome, handleX, handleY, side * (F.sideZ(handleX, handleY) + 0.022)));
    const crease = [];
    for (let i = 0; i <= 28; i++) { const x = -L2 + 0.22 + (P.len - 0.44) * i / 28, y = F.top(x) - 0.11; crease.push([x, y, side * (F.sideZ(x, y) + 0.005)]); }
    prof.add(tube(crease, P.spear ? 0.014 : 0.007, P.spear || P.ww ? M.chrome : paint, 32));
    if (P.fin > 0.1) {
      const crest = [], v = new THREE.Vector3();
      for (let i = 0; i <= 18; i++) { const x = -L2 + 0.06 + 1.5 * i / 18; F.point(x, 0.50, v); crest.push([x, v.y + 0.006, side * v.z]); }
      prof.add(tube(crest, 0.009, M.chrome, 16));
    }
    // Labio del guardabarros con la misma curva del hueco de rueda.
    for (const wx of [fx, rx]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI, x = wx + Math.cos(a) * (ar + 0.008), y = tr + Math.sin(a) * (ar + 0.008); pts.push([x, y, side * (F.half(x) * 0.94 + 0.006)]); }
      prof.add(tube(pts, 0.018, P.ww ? M.chrome : paint, 24));
    }
    const mx = wsX - 0.1, mz = side * (W2 + 0.035);
    prof.add(tube([[mx, P.belt - 0.04, side * F.half(mx)], [mx + 0.04, P.belt + 0.13, mz]], 0.014, M.chrome, 3));
    const mirror = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 8), M.chrome); mirror.scale.set(0.28, 0.75, 1); mirror.position.set(mx + 0.04, P.belt + 0.16, mz); prof.add(mirror);
  }
  // Junta del capó, en la pieza que se abre; la maleta queda fija.
  const gap = (x0, x1, w, parent, ox = 0, oy = 0) => {
    const pts = [], v = new THREE.Vector3();
    for (const side of [-1, 1]) {
      const row = [];
      for (let i = 0; i <= 18; i++) { const x = x0 + (x1 - x0) * i / 18, z = side * F.half(x) * w; row.push([x - ox, surfaceY(F.point, x, z, v) + 0.006 - oy, z]); }
      parent.add(tube(row, 0.006, M.dark, 20));
    }
    for (const x of [x0, x1]) { const z = F.half(x) * w; for (let i = 0; i <= 12; i++) { const zz = -z + 2 * z * i / 12; pts.push([x - ox, surfaceY(F.point, x, zz, v) + 0.006 - oy, zz]); } parent.add(tube(pts.splice(0), 0.006, M.dark, 14)); }
  };
  gap(hx0 + 0.01, hx1 - 0.01, 0.85, hinge, hx0, hy0);
  if (rwX > -L2 + 0.4) gap(-L2 + 0.2, rwX - 0.05, 0.72, prof);

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
      const sections = P.blower ? [[wsX + 0.05, blowerX - 0.3], [blowerX + 0.3, L2 - 0.4]] : [[wsX + 0.05, L2 - 0.4]];
      for (const [a, b] of sections) if (b > a) hinge.add(at(new THREE.Mesh(topStrip(F.point, a, b, z0, z0 + 0.15), sMat), -hx0, -hy0, 0));
      if (rwX > -L2 + 0.35) prof.add(new THREE.Mesh(topStrip(F.point, -L2 + 0.2, rwX - 0.04, z0, z0 + 0.15), sMat));
      prof.add(new THREE.Mesh(topStrip(cabPoint, rrX + 0.04, rfX - 0.04, z0, z0 + 0.15, 0.005), sMat));
    }
  }
  if (car.decal === 'number') {
    const n = car.num || 7, x = (fx + rx) / 2 + 0.15, y = P.belt - 0.27;
    for (const side of [-1, 1]) {
      const g = new THREE.RingGeometry(0, 0.19, 32, 4), pos = g.attributes.position;
      for (let i = 0; i < pos.count; i++) { const xx = x + side * pos.getX(i), yy = y + pos.getY(i); pos.setXYZ(i, xx, yy, side * (F.sideZ(xx, yy) + 0.012)); }
      g.computeVertexNormals(); prof.add(new THREE.Mesh(g, numberMat(n)));
    }
  }

  // ----- parachoques estampados, parrilla hundida y ópticas -----
  const frontX = z => L2 + 0.012 - 0.06 * (Math.abs(z) / W2) ** 4;
  const rearX = z => -L2 - 0.012 + 0.06 * (Math.abs(z) / W2) ** 4;
  const faceW = F.half(L2) * 0.98, backW = F.half(-L2) * 0.98;
  for (const front of [true, false]) {
    const w = front ? faceW : backW, y = P.clr + 0.16, pts = [];
    for (let i = 0; i <= 16; i++) { const z = (i / 8 - 1) * w; pts.push([(front ? 1 : -1) * (L2 + 0.075 - 0.20 * (Math.abs(z) / w) ** 6), y, z]); }
    const b = tube(pts, 0.065, M.chrome, 24); b.scale.y = 0.75; b.position.y = y * 0.25; prof.add(b);
    const inset = pts.map(([x, y, z]) => [x + (front ? 0.045 : -0.045), y, z]);
    prof.add(tube(inset, 0.012, M.dark, 24));
    for (const z of [-w * 0.66, w * 0.66]) prof.add(box(0.10, 0.19, 0.07, M.chrome, (front ? 1 : -1) * (L2 + 0.06), y + 0.015, z));
    prof.add(box(0.018, 0.12, 0.26, M.dark, (front ? 1 : -1) * (L2 + 0.09), y + 0.08, 0));
  }
  const gy = P.clr + 0.34, gh = Math.max(0.13, P.nose - gy - 0.06), gw = faceW * (key === 'bantam' ? 0.78 : 1.34);
  prof.add(box(0.035, gh + 0.045, gw + 0.05, M.chrome, L2 + 0.018, gy, 0));
  prof.add(box(0.04, gh, gw, M.dark, L2 + 0.04, gy, 0));
  const vertical = key === 'bantam' || key === 'marquis' || key === 'monarch';
  const bars = vertical ? (key === 'monarch' ? 19 : 11) : 4;
  for (let i = 0; i < bars; i++) {
    const t = (i + 0.5) / bars - 0.5;
    prof.add(box(0.025, vertical ? gh - 0.012 : 0.012, vertical ? 0.012 : gw - 0.025, M.chromeSoft, L2 + 0.067, gy + (vertical ? 0 : t * gh), vertical ? t * gw : 0));
  }
  if (key === 'hornet' || key === 'starliner') prof.add(box(0.035, gh, 0.045, paint, L2 + 0.08, gy, 0));
  const twin = key === 'monarch' || key === 'hornet' || key === 'viper', lr = twin ? 0.078 : key === 'bantam' ? 0.12 : 0.102;
  const lensG = new THREE.CircleGeometry(lr, 24); lensG.rotateY(Math.PI / 2);
  const bezelG = new THREE.TorusGeometry(lr + 0.012, 0.015, 6, 24); bezelG.rotateY(Math.PI / 2);
  const lampY = P.nose - 0.035;
  for (const side of [-1, 1]) {
    for (let i = 0; i < (twin ? 2 : 1); i++) {
      const z = side * (faceW - lr - 0.035 - i * (lr * 2 + 0.035)), x = frontX(z) + 0.028;
      const socket = new THREE.CylinderGeometry(lr + 0.033, lr + 0.027, 0.065, 24); socket.rotateZ(Math.PI / 2);
      prof.add(at(new THREE.Mesh(socket, M.dark), x, lampY, z));
      prof.add(at(new THREE.Mesh(lensG, head), x + 0.038, lampY, z));
      prof.add(at(new THREE.Mesh(bezelG, M.chrome), x + 0.04, lampY, z));
      // Nervaduras del vidrio prensado.
      for (let j = -2; j <= 2; j++) {
        const zz = j * lr * 0.3, hh = Math.sqrt(lr * lr - zz * zz) * 1.8;
        prof.add(box(0.003, hh, 0.003, M.lens, x + 0.041, lampY, z + zz));
      }
    }
    const tz = side * (backW - (P.fin > 0.1 ? 0.12 : 0.23)), ty = P.tail - 0.09;
    const housing = box(0.08, P.fin > 0.1 ? 0.19 : 0.105, P.fin > 0.1 ? 0.12 : 0.32, M.chrome, -L2 - 0.024, ty, tz);
    prof.add(housing);
    prof.add(box(0.012, P.fin > 0.1 ? 0.155 : 0.075, P.fin > 0.1 ? 0.085 : 0.28, tail, -L2 - 0.07, ty, tz));
    for (let i = -1; i <= 1; i++) prof.add(box(0.014, 0.004, P.fin > 0.1 ? 0.08 : 0.27, M.red, -L2 - 0.078, ty + i * 0.025, tz));
    prof.add(box(0.025, 0.036, 0.105, M.lens, L2 + 0.04, P.clr + 0.22, side * (faceW - 0.14)));
  }
  // ----- lo que se ve de las mejoras: toma de aire, compresor y escapes laterales -----
  const hx = wsX + Math.min(0.75, P.hood * 0.45), hy = F.top(hx);
  if (P.blower) {
    const rotor = new THREE.CylinderGeometry(0.21, 0.21, 0.5, 12); rotor.rotateZ(Math.PI / 2);
    prof.add(at(new THREE.Mesh(rotor, M.chromeSoft), hx, hy + 0.015, 0));
    for (let i = -2; i <= 2; i++) prof.add(box(0.47, 0.014, 0.018, M.chrome, hx, hy + 0.12 + i * 0.022, 0.18));
    for (const y of [hy + 0.10, hy - 0.12]) { const pulley = new THREE.CylinderGeometry(0.06, 0.06, 0.045, 16); pulley.rotateZ(Math.PI / 2); prof.add(at(new THREE.Mesh(pulley, M.chrome), hx + 0.28, y, 0.12)); }
    prof.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.36), M.dark), hx, hy + 0.25, 0));
    for (const z of [-0.09, 0.09]) prof.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.16, 14), M.chrome), hx + 0.05, hy + 0.36, z));
    const belt = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.08), M.dark); belt.position.set(hx + 0.27, hy + 0.04, 0.12); prof.add(belt);
  } else if (P.scoop) {
    const sc = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.62, 4, 10), paint); sc.rotation.z = Math.PI / 2; sc.scale.set(1, 1, 3.6); sc.position.set(hx - hx0, hy + 0.025 - hy0, 0); hinge.add(sc);
    hinge.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.32), M.dark), hx + 0.37 - hx0, hy + 0.04 - hy0, 0));
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
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.055; sh.renderOrder = 3; root.add(sh);
  for (const wx of [fx, rx]) for (const side of [-1, 1]) {
    const c = new THREE.Mesh(new THREE.PlaneGeometry(P.tireW + 0.23, 0.7), M.contact);
    c.rotation.x = -Math.PI / 2; c.position.set(-side * (W2 - 0.19), 0.058, wx); c.renderOrder = 4; root.add(c);
  }
  const spills = [];
  for (const side of [-1, 1]) spills.push(new THREE.PlaneGeometry(1.2, 2.4).rotateX(-Math.PI / 2).translate(side * (W2 - 0.25), 0.062, -L2 - 0.6));
  root.add(new THREE.Mesh(mergeGeometries(spills), spillMat)); spills.forEach(g => g.dispose());
  batch(bay.group); batch(hinge); batch(prof);
  bodyG.dispose();
  // Una sola sombra dinámica sobre el piso; los demás autos usan contacto dibujado.
  root.traverse(o => { if (o.isMesh && !o.material.transparent) { o.castShadow = true; o.receiveShadow = false; } });

  // puntos de vista del taller (en las medidas del auto: z hacia adelante, x a la izquierda)
  const ec = bay.center, views = {
    engine: { eye: [2.4, P.roof + 2.0, ec.x + 3.0], look: [0, ec.y - 0.1, ec.x - 0.05], frame: [3.8, 3.0] },
    rear: { eye: [-2.2, 1.15, -L2 - 3.2], look: [0, P.clr + 0.15, -L2 + 0.4], frame: [3.4, 2.1] },
    wheel: { eye: [W2 + 2.4, 0.85, fx + 1.7], look: [W2 - 0.1, P.tire, fx], frame: [2.3, 1.8] },
    side: { eye: [W2 + 6.0, 1.3, 0.2], look: [0, 0.7, 0], frame: [P.len + 0.5, 2.1] }
  };
  let hoodT = 0;
  return {
    root, body, shape: P, key, paint, head, tail, wheels, len: P.len, wid: P.wid, views,
    // abre (1) o cierra (0) el capó; devuelve si sigue moviéndose
    hoodNow: () => hoodT,
    hood(target, dt) { hoodT += Math.sign(target - hoodT) * Math.min(Math.abs(target - hoodT), dt * 1.8); hinge.rotation.z = (1 - Math.cos(hoodT * Math.PI)) / 2 * 1.0; return hoodT !== target; },
    setBrake(b) { tail.emissiveIntensity = b ? 4 : 0.9; spillMat.opacity = b ? 0.42 : 0.14; },
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
    dispose() { const sharedM = new Set([...Object.values(M), ..._numTex.values()]), mats = new Set(); root.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) for (const m of [].concat(o.material)) if (!sharedM.has(m)) mats.add(m); }); mats.forEach(m => m.dispose()); }
  };
}
// La firma de lo que se ve de un auto (si cambia, hay que armarlo de nuevo)
export const lookKey = car => [car.model, car.color, car.decal, car.num, car.up.engine, car.up.intake, car.up.exhaust, car.up.tires, car.up.susp, car.up.nitro].join('|');
