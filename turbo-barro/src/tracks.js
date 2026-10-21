// ===== Utilidades =====
const W = 1024, H = 640, HUD_H = 46;
let RENDER_K = 1;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const angDiff = (a, b) => {
  let d = (a - b) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return d;
};
const font = (size, weight = 900) => `${weight} ${size}px "Arial Black", "Arial Rounded MT Bold", Impact, system-ui, sans-serif`;
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function tri(g, x1, y1, x2, y2, x3, y3) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.closePath();
}
function ellipse(g, x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
function bigText(g, text, x, y, size, color, stroke = '#2a1405') {
  g.font = font(size); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.lineWidth = size * 0.18; g.strokeStyle = stroke; g.strokeText(text, x, y);
  g.fillStyle = color; g.fillText(text, x, y);
}
function mulberry32(a) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ===== Pistas =====
const THEMES = {
  pasto:    { ground: '#4f8a34', g2: '#5d9a3f', g3: '#447a2c', dirt: '#b9834b', d2: '#a87240', d3: '#c9955c', wall: '#d8342b', wall2: '#f4f4f4', deco: 'tree' },
  desierto: { ground: '#dcb46c', g2: '#e6c37f', g3: '#cfa45c', dirt: '#a96d3d', d2: '#965f33', d3: '#b97c4a', wall: '#6b4426', wall2: '#e9d3a2', deco: 'cactus' },
  canon:    { ground: '#a9502d', g2: '#b95e37', g3: '#954425', dirt: '#d9a066', d2: '#c58a52', d3: '#e6b37c', wall: '#2c2c2c', wall2: '#ffc61a', deco: 'rock' },
  pantano:  { ground: '#3d6a39', g2: '#477842', g3: '#335c30', dirt: '#7d5b37', d2: '#6b4b2b', d3: '#8c6a44', wall: '#2a5fc9', wall2: '#ececec', deco: 'reed' },
  nieve:    { ground: '#e9eff6', g2: '#dbe5f0', g3: '#f6f9fc', dirt: '#8d6c4d', d2: '#7a5a3e', d3: '#9e7d5d', wall: '#c8262b', wall2: '#ffffff', deco: 'pine' }
};

// pts: puntos de control (la pista pasa por ellos en orden). feats: [tipo, posición, ...]
// La posición es "segmento.fracción": 1.5 = a mitad de camino entre el punto 1 y el 2.
const TRACK_DEFS = [
  { name: 'Valle Polvoriento', theme: 'pasto', width: 78, start: 0.5, seed: 11,
    pts: [[170,130],[512,115],[850,130],[935,240],[910,480],[790,570],[610,570],[545,430],[400,430],[335,570],[170,570],[85,460],[90,240]],
    feats: [['jump',1.5],['jump',3.5],['mud',7.5,0,30],['water',10.4,-0.3,26],['bumps',11.6,12.4]] },
  { name: 'Desierto Dorado', theme: 'desierto', width: 80, start: 0.5, seed: 23,
    pts: [[200,110],[500,170],[800,110],[940,230],[850,340],[940,460],[820,580],[520,500],[220,580],[85,460],[180,340],[85,220]],
    feats: [['jump',1.5],['water',4.0,0.2,28],['bumps',6.3,6.8],['jump',7.5],['mud',9.5,0.2,28],['jump',11.4]] },
  { name: 'Cañón Rojo', theme: 'canon', width: 74, start: 0.5, seed: 37,
    pts: [[150,120],[340,110],[420,170],[425,320],[585,325],[600,180],[690,110],[880,120],[945,250],[860,380],[935,500],[840,580],[520,575],[300,580],[120,565],[75,430],[165,335],[85,225]],
    feats: [['jump',2.5],['jump',4.6],['mud',7.4,0.2,28],['bumps',11.6,12.5],['water',13.5,0.3,26],['jump',15.5]] },
  { name: 'Pantano Loco', theme: 'pantano', width: 74, start: 19.8, seed: 41,
    pts: [[110,140],[200,105],[265,170],[270,320],[405,325],[410,170],[480,110],[580,110],[650,170],[655,320],[790,325],[800,170],[880,110],[950,200],[945,520],[860,572],[610,572],[600,450],[460,450],[450,572],[305,574],[160,572],[80,500],[75,260]],
    feats: [['mud',2.5,0,28],['water',6.5,0,30],['mud',9.5,0.2,28],['jump',13.6],['bumps',15.3,15.9],['mud',17.5,0,26],['jump',22.5]] },
  { name: 'Montaña Nevada', theme: 'nieve', width: 74, start: 0.6, seed: 53,
    pts: [[120,120],[500,117],[880,115],[945,190],[880,265],[590,268],[300,270],[230,340],[300,410],[590,413],[880,415],[945,490],[880,570],[505,573],[130,575],[75,500],[75,350],[75,200]],
    feats: [['bumps',0.9,1.2],['jump',1.5],['mud',4.5,0.35,26],['jump',5.2],['bumps',8.4,8.9],['jump',9.2],['water',12.6,-0.3,26],['jump',13.2],['jump',15.8]] }
];

// Catmull-Rom centrípeta: curva suave que pasa por los puntos sin hacer rulos
function crPoint(p0, p1, p2, p3, t) {
  const d = (a, b) => Math.max(1e-3, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  const t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
  const u = t1 + (t2 - t1) * t;
  const L = (A, B, ta, tb) => { const w = (u - ta) / (tb - ta); return [A[0] + (B[0] - A[0]) * w, A[1] + (B[1] - A[1]) * w]; };
  const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
  const B1 = L(A1, A2, 0, t2), B2 = L(A2, A3, t1, t3);
  return L(B1, B2, t1, t2);
}

function buildTrack(def) {
  const P = def.pts, n = P.length, SUB = 40, dense = [];
  for (let i = 0; i < n; i++) {
    const p0 = P[(i + n - 1) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    for (let j = 0; j < SUB; j++) dense.push(crPoint(p0, p1, p2, p3, j / SUB));
  }
  const M = dense.length, cum = [0];
  for (let i = 1; i <= M; i++) {
    const a = dense[i - 1], b = dense[i % M];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  // Re-muestreo cada ~8 px para que todas las muestras queden a igual distancia
  const len = cum[M], N = Math.round(len / 8), step = len / N;
  const sToD = s => {
    const f = (((s % n) + n) % n) * SUB, i = Math.floor(f);
    return cum[i] + (cum[i + 1] - cum[i]) * (f - i);
  };
  const raw = [];
  for (let i = 0, k = 0; i < N; i++) {
    const d = i * step;
    while (cum[k + 1] < d) k++;
    const a = dense[k], b = dense[(k + 1) % M], f = (d - cum[k]) / ((cum[k + 1] - cum[k]) || 1);
    raw.push({ x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f });
  }
  const s0 = Math.round(sToD(def.start) / step) % N;
  const pts = raw.slice(s0).concat(raw.slice(0, s0));
  pts.forEach((p, i) => {
    const a = pts[(i + N - 1) % N], b = pts[(i + 1) % N];
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    p.tx = (b.x - a.x) / l; p.ty = (b.y - a.y) / l; p.nx = -p.ty; p.ny = p.tx;
  });
  const idxOf = s => (Math.round(sToD(s) / step) - s0 + N * 2) % N;
  const t = { def, name: def.name, theme: THEMES[def.theme], pts, N, hw: def.width / 2, len,
              jumps: [], bumps: [], puddles: [], canvas: null, k: 0 };
  for (const f of def.feats) {
    if (f[0] === 'jump') t.jumps.push(idxOf(f[1]));
    else if (f[0] === 'bumps') t.bumps.push({ i0: idxOf(f[1]), i1: idxOf(f[2]) });
    else {
      const p = pts[idxOf(f[1])];
      t.puddles.push({ type: f[0], x: p.x + p.nx * f[2] * t.hw, y: p.y + p.ny * f[2] * t.hw, r: f[3] });
    }
  }
  return t;
}

const wrap = (t, i) => ((i % t.N) + t.N) % t.N;
const inRange = (t, i, a, b) => wrap(t, i - a) <= wrap(t, b - a);

// Busca la muestra de pista más cercana solo cerca de la anterior (así no "salta" a otro tramo)
function nearestIdx(t, x, y, guess, win = 14) {
  let best = guess, bd = Infinity;
  for (let k = -win; k <= win; k++) {
    const i = wrap(t, guess + k), p = t.pts[i];
    const d = (p.x - x) ** 2 + (p.y - y) ** 2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
}

const trackCache = [];
function getTrack(i) {
  i = wrap({ N: TRACK_DEFS.length }, i);
  if (!trackCache[i]) trackCache[i] = buildTrack(TRACK_DEFS[i]);
  const t = trackCache[i];
  if (t.k !== RENDER_K) { t.canvas = renderTrack(t, RENDER_K); t.k = RENDER_K; }
  return t;
}

// ===== Dibujo de la pista (se dibuja una vez en un canvas aparte) =====
function trackPath(t, off = 0) {
  const p2 = new Path2D();
  t.pts.forEach((p, i) => {
    const x = p.x + p.nx * off, y = p.y + p.ny * off;
    i ? p2.lineTo(x, y) : p2.moveTo(x, y);
  });
  p2.closePath();
  return p2;
}

function renderTrack(t, k) {
  const th = t.theme, rnd = mulberry32(t.def.seed), w = t.def.width, hw = t.hw;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = Math.ceil(W * k); c.height = Math.ceil(H * k);
    const g = c.getContext('2d'); g.scale(k, k); g.lineJoin = 'round'; g.lineCap = 'round';
    return [c, g];
  };
  const [c, g] = mk();
  g.fillStyle = th.ground; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 1400; i++) {
    g.fillStyle = rnd() < 0.5 ? th.g2 : th.g3;
    const s = 2 + rnd() * 6;
    g.fillRect(rnd() * W, rnd() * H, s, s * 0.6);
  }
  drawDecos(g, t, rnd);
  const path = trackPath(t);
  // muro de neumáticos con su sombra
  g.save(); g.translate(4, 5); g.strokeStyle = 'rgba(0,0,0,0.28)'; g.lineWidth = w + 20; g.stroke(path); g.restore();
  g.strokeStyle = th.wall; g.lineWidth = w + 16; g.stroke(path);
  g.setLineDash([9, 9]); g.strokeStyle = th.wall2; g.stroke(path); g.setLineDash([]);
  // capa de tierra: lo que se dibuja después queda recortado a la pista
  const [dc, dg] = mk();
  dg.strokeStyle = th.dirt; dg.lineWidth = w; dg.stroke(path);
  dg.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < t.N * 5; i++) {
    const p = t.pts[Math.floor(rnd() * t.N)], o = (rnd() * 2 - 1) * hw, s = 1.5 + rnd() * 3;
    dg.fillStyle = rnd() < 0.5 ? th.d2 : th.d3;
    dg.fillRect(p.x + p.nx * o + (rnd() - 0.5) * 8, p.y + p.ny * o + (rnd() - 0.5) * 8, s, s);
  }
  dg.strokeStyle = 'rgba(50,30,10,0.13)'; dg.lineWidth = 4;
  for (const o of [-0.5, -0.2, 0.2, 0.5]) dg.stroke(trackPath(t, o * hw));
  dg.strokeStyle = 'rgba(0,0,0,0.18)'; dg.lineWidth = 8;
  dg.stroke(trackPath(t, hw - 2)); dg.stroke(trackPath(t, -hw + 2));
  for (const pd of t.puddles) drawPuddle(dg, pd, rnd);
  for (const b of t.bumps) {
    const cnt = wrap(t, b.i1 - b.i0);
    for (let s = 0; s <= cnt; s += 3) drawBumpRow(dg, t, wrap(t, b.i0 + s), s / 3);
  }
  for (const j of t.jumps) drawJump(dg, t, j);
  drawStartLine(dg, t);
  g.drawImage(dc, 0, 0, W, H);
  return c;
}

function drawPuddle(g, pd, rnd) {
  const blobs = [[0, 0, 1]];
  for (let i = 0; i < 4; i++) {
    const a = rnd() * 6.28;
    blobs.push([Math.cos(a) * pd.r * 0.45, Math.sin(a) * pd.r * 0.45, 0.6]);
  }
  const fill = (col, scale, dx = 0, dy = 0) => {
    g.fillStyle = col; g.beginPath();
    for (const [x, y, s] of blobs) {
      g.moveTo(pd.x + x + dx + pd.r * s * scale, pd.y + y + dy);
      g.arc(pd.x + x + dx, pd.y + y + dy, pd.r * s * scale, 0, Math.PI * 2);
    }
    g.fill();
  };
  if (pd.type === 'mud') {
    fill('#4a2f17', 1); fill('#5e3d1f', 0.82); fill('rgba(255,255,255,0.08)', 0.4, -pd.r * 0.2, -pd.r * 0.2);
  } else {
    fill('#6b5233', 1); fill('#2f6fb0', 0.86); fill('#4a90d0', 0.6, -3, -3);
    fill('rgba(255,255,255,0.35)', 0.18, -pd.r * 0.3, -pd.r * 0.3);
  }
}

function drawJump(g, t, i) {
  const p = t.pts[i], hw = t.hw + 2;
  g.save(); g.translate(p.x, p.y); g.rotate(Math.atan2(p.ty, p.tx));
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(2, -hw, 9, hw * 2);
  const grd = g.createLinearGradient(-18, 0, 2, 0);
  grd.addColorStop(0, t.theme.dirt); grd.addColorStop(1, '#f3d8a4');
  g.fillStyle = grd; g.fillRect(-18, -hw, 20, hw * 2);
  g.fillStyle = 'rgba(110,60,20,0.35)';
  for (let y = -hw; y < hw; y += 9) g.fillRect(-16, y, 16, 2);
  g.fillStyle = '#fff6dc'; g.fillRect(0, -hw, 2.5, hw * 2);
  g.restore();
}

function drawBumpRow(g, t, i, row) {
  const p = t.pts[i], ang = Math.atan2(p.ty, p.tx), shift = row % 2 ? 0.2 : 0;
  for (const o0 of [-0.7, -0.3, 0.1, 0.5]) {
    const o = o0 + shift, x = p.x + p.nx * o * t.hw, y = p.y + p.ny * o * t.hw;
    g.save(); g.translate(x, y); g.rotate(ang);
    g.fillStyle = 'rgba(0,0,0,0.22)'; ellipse(g, 2, 0, 5, 8);
    g.fillStyle = t.theme.d3; ellipse(g, -1, 0, 4.5, 7.5);
    g.fillStyle = 'rgba(255,255,255,0.25)'; ellipse(g, -2, -1, 2, 4);
    g.restore();
  }
}

function drawStartLine(g, t) {
  const p = t.pts[0], s = 6, n = Math.ceil(t.hw * 2 / s) + 1;
  g.save(); g.translate(p.x, p.y); g.rotate(Math.atan2(p.ty, p.tx));
  for (let r = 0; r < 2; r++) for (let j = 0; j < n; j++) {
    g.fillStyle = (r + j) % 2 ? '#111' : '#fff';
    g.fillRect(-s + r * s, -t.hw - 2 + j * s, s, s);
  }
  g.restore();
}

// ===== Decoración fuera de la pista =====
function farFromTrack(t, x, y, m) {
  const lim = (t.hw + m) ** 2;
  for (let i = 0; i < t.N; i += 2) {
    const p = t.pts[i];
    if ((p.x - x) ** 2 + (p.y - y) ** 2 < lim) return false;
  }
  return true;
}

function drawDecos(g, t, rnd) {
  const items = [];
  for (let tries = 0; tries < 500 && items.length < 55; tries++) {
    const x = 15 + rnd() * (W - 30), y = HUD_H + 14 + rnd() * (H - HUD_H - 28), s = 0.7 + rnd() * 0.6;
    if (farFromTrack(t, x, y, 18 + 16 * s) && items.every(o => (o.x - x) ** 2 + (o.y - y) ** 2 > 900)) items.push({ x, y, s });
  }
  items.sort((a, b) => a.y - b.y);
  for (const o of items) DECOS[t.theme.deco](g, o.x, o.y, o.s, rnd);
}

const DECOS = {
  tree(g, x, y, s) {
    g.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(g, x + 5 * s, y + 6 * s, 15 * s, 9 * s);
    g.fillStyle = '#2d5a1e'; ellipse(g, x, y, 15 * s, 15 * s);
    g.fillStyle = '#3f7a2a'; ellipse(g, x - 3 * s, y - 3 * s, 11 * s, 11 * s);
    g.fillStyle = '#5a9a3a'; ellipse(g, x - 6 * s, y - 6 * s, 5 * s, 5 * s);
  },
  pine(g, x, y, s) {
    g.fillStyle = 'rgba(0,0,0,0.18)'; ellipse(g, x + 6 * s, y + 8 * s, 13 * s, 7 * s);
    g.fillStyle = '#5b3a1e'; g.fillRect(x - 2 * s, y + 4 * s, 4 * s, 6 * s);
    for (let i = 0; i < 3; i++) {
      const yy = y + 6 * s - i * 8 * s, w = (14 - i * 3.5) * s;
      g.fillStyle = '#1f5a3a'; tri(g, x - w, yy, x + w, yy, x, yy - 13 * s); g.fill();
      g.fillStyle = '#ffffff'; tri(g, x - w * 0.4, yy - 8 * s, x + w * 0.4, yy - 8 * s, x, yy - 13 * s); g.fill();
    }
  },
  cactus(g, x, y, s) {
    g.fillStyle = 'rgba(0,0,0,0.2)'; ellipse(g, x + 6 * s, y + 12 * s, 11 * s, 4 * s);
    g.fillStyle = '#2f7d3a';
    roundRect(g, x - 4 * s, y - 16 * s, 8 * s, 28 * s, 4 * s); g.fill();
    roundRect(g, x - 13 * s, y - 8 * s, 6 * s, 12 * s, 3 * s); g.fill(); g.fillRect(x - 10 * s, y + 1 * s, 8 * s, 4 * s);
    roundRect(g, x + 7 * s, y - 12 * s, 6 * s, 12 * s, 3 * s); g.fill(); g.fillRect(x + 2 * s, y - 3 * s, 8 * s, 4 * s);
    g.fillStyle = '#4aa055'; g.fillRect(x - 2 * s, y - 14 * s, 2 * s, 24 * s);
  },
  rock(g, x, y, s, rnd) {
    g.fillStyle = 'rgba(0,0,0,0.25)'; ellipse(g, x + 5 * s, y + 6 * s, 14 * s, 8 * s);
    const poly = (r, col, dx, dy) => {
      g.fillStyle = col; g.beginPath();
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2, rr = r * (0.75 + rnd() * 0.35);
        g.lineTo(x + dx + Math.cos(a) * rr, y + dy + Math.sin(a) * rr * 0.8);
      }
      g.closePath(); g.fill();
    };
    poly(13 * s, '#6e4a3a', 0, 0); poly(8 * s, '#8c6452', -3 * s, -3 * s);
  },
  reed(g, x, y, s, rnd) {
    if (rnd() < 0.4) {
      g.fillStyle = '#2c5f8a'; ellipse(g, x, y, 18 * s, 10 * s);
      g.fillStyle = 'rgba(255,255,255,0.25)'; ellipse(g, x - 5 * s, y - 3 * s, 6 * s, 2 * s);
      return;
    }
    g.strokeStyle = '#7a9a3a'; g.lineWidth = 2 * s; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const bx = x + (i - 3) * 3 * s, tx = x + (i - 3) * 4.5 * s + (rnd() - 0.5) * 4 * s, ty = y - (12 + rnd() * 8) * s;
      g.beginPath(); g.moveTo(bx, y); g.lineTo(tx, ty); g.stroke();
      if (i % 2) { g.fillStyle = '#5a3a1c'; ellipse(g, tx, ty + 2 * s, 2 * s, 4 * s); }
    }
  }
};
