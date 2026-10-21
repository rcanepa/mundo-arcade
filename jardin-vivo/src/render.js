// ===== Pantalla: vista isométrica del jardín, sombras del sol, luz del día y clima =====
const TW = 64, TH = 32, ZS = PX_M;
const STREET = 2.6;            // vereda y calle frente a la reja (en metros)
const SLAB = 1.1;              // grosor de la tierra del diorama
const ZMIN = 0.45, ZMAX = 2.2;

const cam = { x: 0, y: 0, z: 1 };
const R = { hover: null, lens: null, preview: null, t: 0, wind: 0.3, sel: null, area: 0, bubbles: [] };
let canvas, ctx, DPR = 1, VW = 0, VH = 0, shadowCv, shadowCtx;
let VIS_VER = 1;
const bumpVis = () => { VIS_VER++; };

function initRender() {
  canvas = document.getElementById('world');
  ctx = canvas.getContext('2d');
  shadowCv = document.createElement('canvas'); shadowCtx = shadowCv.getContext('2d');
  resizeView();
  addEventListener('resize', resizeView);
}
function resizeView() {
  DPR = Math.min(2, window.devicePixelRatio || 1); VW = innerWidth; VH = innerHeight;
  canvas.width = Math.floor(VW * DPR); canvas.height = Math.floor(VH * DPR);
  shadowCv.width = canvas.width; shadowCv.height = canvas.height;
  TEX.z = 0;
}

// Mundo → pantalla (en píxeles CSS)
const P = (x, y, z = 0) => [cam.x + (x - y) * TW / 2 * cam.z, cam.y + (x + y) * TH / 2 * cam.z - z * ZS * cam.z];
function screenToWorld(sx, sy) {
  const a = (sx - cam.x) / (TW / 2 * cam.z), b = (sy - cam.y) / (TH / 2 * cam.z);
  return [(a + b) / 2, (b - a) / 2];
}
function centerOn(wx, wy, z) {
  if (z) cam.z = z;
  cam.x = VW / 2 - (wx - wy) * TW / 2 * cam.z;
  cam.y = VH / 2 - (wx + wy) * TH / 2 * cam.z;
}
function zoomAt(f, sx, sy) {
  const nz = clamp(cam.z * f, ZMIN, ZMAX), k = nz / cam.z;
  cam.x = sx - (sx - cam.x) * k; cam.y = sy - (sy - cam.y) * k; cam.z = nz;
  clampCam();
}
function clampCam() {
  // que el jardín nunca se pierda de la pantalla
  const [l] = P(0, GH + STREET), [r] = P(GW, 0), [, t] = P(0, 0), [, b] = P(GW, GH + STREET);
  const mx = VW * 0.45, my = VH * 0.45;
  if (r < mx) cam.x += mx - r;
  if (l > VW - mx) cam.x -= l - (VW - mx);
  if (b < my) cam.y += my - b;
  if (t > VH - my) cam.y -= t - (VH - my);
}

// ---------- Sol y colores del cielo ----------
function sunNow() { return sunVector(G.day % DAYS_YEAR, G.hour); }
function sunStrength(s) { return clamp(s.z * 4, 0, 1) * (1 - G.w.cloud * 0.75); }
const SKY = [
  [-0.35, '#0b1230', '#1d2650'], [-0.12, '#16204a', '#3a3f74'], [-0.03, '#3b3f78', '#b07a98'], [0.03, '#6a7fb8', '#f4a47c'],
  [0.15, '#8db4dc', '#f6d6ae'], [0.35, '#86bde6', '#d9edf3'], [1, '#7fb8e6', '#dcf0f5']
];
function skyColors(sz) {
  for (let i = 1; i < SKY.length; i++) if (sz <= SKY[i][0]) {
    const [a0, t0, b0] = SKY[i - 1], [a1, t1, b1] = SKY[i], k = clamp((sz - a0) / (a1 - a0), 0, 1);
    return [mix(t0, t1, k), mix(b0, b1, k)];
  }
  return [rgbOf(SKY[6][1]), rgbOf(SKY[6][2])];
}
const GRADE = [[-0.3, '#4a5a96'], [-0.08, '#7a76b0'], [0.0, '#e0a0a0'], [0.06, '#ffc9a8'], [0.18, '#ffe8cf'], [0.4, '#ffffff']];
function gradeColor(sz) {
  if (sz <= GRADE[0][0]) return rgbOf(GRADE[0][1]);
  for (let i = 1; i < GRADE.length; i++) if (sz <= GRADE[i][0]) return mix(GRADE[i - 1][1], GRADE[i][1], (sz - GRADE[i - 1][0]) / (GRADE[i][0] - GRADE[i - 1][0]));
  return [255, 255, 255];
}
const nightness = sz => clamp((0.02 - sz) / 0.14, 0, 1);

// ---------- Texturas del suelo (se regeneran al cambiar el zoom) ----------
const TEX = { z: 0 };
function makeTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h);
  const g = c.getContext('2d');
  g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.lineTo(0, h / 2); g.closePath(); g.clip();
  draw(g, w, h); return c;
}
function buildTextures() {
  const z = cam.z * DPR, w = TW * z, h = TH * z;
  TEX.z = cam.z * DPR;
  TEX.grass = [0, 1, 2, 3].map(v => makeTex(w, h, g => {
    const r = rng(77 + v);
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, l = (2 + r() * 3) * z * 0.5;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,255,220,0.18)' : 'rgba(20,60,10,0.16)'; g.lineWidth = Math.max(0.6, z * 0.5);
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * l, y - l); g.stroke();
    }
    if (v === 3) for (let i = 0; i < 4; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.8)' : 'rgba(250,220,90,0.8)'; g.beginPath(); g.arc(r() * w, r() * h, z * 0.9, 0, TAU); g.fill(); }
  }));
  TEX.soil = [0, 1].map(v => makeTex(w, h, g => {
    const r = rng(99 + v);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,240,210,0.13)' : 'rgba(0,0,0,0.16)'; g.beginPath(); g.ellipse(r() * w, r() * h, z * (0.5 + r()), z * (0.35 + r() * 0.6), 0, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(0,0,0,0.08)'; g.lineWidth = z * 0.6;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(w * i / 4 - w * 0.25, h * i / 4 + h * 0.25); g.lineTo(w * i / 4 + w * 0.25, h * i / 4 - h * 0.25); g.stroke(); }
  }));
  TEX.mulch = makeTex(w, h, g => {
    const r = rng(5);
    for (let i = 0; i < 120; i++) { g.fillStyle = css(mix('#b07a45', '#6e4a2a', r())); g.save(); g.translate(r() * w, r() * h); g.rotate(r() * 3); g.fillRect(-z * 1.4, -z * 0.5, z * 2.8, z); g.restore(); }
  });
  TEX.path = [0, 1, 2, 3].map(v => makeTex(w, h, g => {
    const r = rng(300 + v);
    g.fillStyle = '#a99e8a'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'; g.fillRect(r() * w, r() * h, z, z); }
    for (let i = 0; i < 4; i++) {
      const cx = w * (0.25 + (i % 2) * 0.5) + (r() - 0.5) * w * 0.08, cy = h * (0.25 + Math.floor(i / 2) * 0.5) + (r() - 0.5) * h * 0.08;
      const rx = w * (0.17 + r() * 0.04), ry = h * (0.17 + r() * 0.04);
      g.fillStyle = 'rgba(70,60,50,0.35)'; g.beginPath(); g.ellipse(cx + z, cy + z, rx, ry, 0, 0, TAU); g.fill();
      g.fillStyle = css(mix('#d9cfbb', '#c2b49a', r())); g.beginPath();
      for (let k = 0; k < 8; k++) { const a = k / 8 * TAU, d = 0.85 + r() * 0.2; g.lineTo(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d); }
      g.fill();
    }
  }));
  TEX.meadow = [0, 1, 2].map(v => makeTex(w, h * 1, g => {
    const r = rng(500 + v);
    for (let i = 0; i < 90; i++) {
      const x = r() * w, y = r() * h, l = (3 + r() * 5) * z * 0.6;
      g.strokeStyle = r() < 0.4 ? 'rgba(230,230,150,0.35)' : 'rgba(40,80,20,0.25)'; g.lineWidth = Math.max(0.6, z * 0.6);
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * l, y - l * 0.6, x + (r() - 0.5) * l * 1.5, y - l); g.stroke();
    }
    for (let i = 0; i < 6; i++) { g.fillStyle = pick(['rgba(255,255,255,0.85)', 'rgba(250,210,60,0.85)', 'rgba(200,140,230,0.8)', 'rgba(240,120,120,0.8)']); g.beginPath(); g.arc(r() * w, r() * h, z * 1.1, 0, TAU); g.fill(); }
  }));
}

// ---------- Colores del suelo ----------
function grassColor(t, yd) {
  const s = seasonOf(yd);
  let c = rgbOf(['#79ad48', '#93ad4e', '#86a547', '#6c9a49'][s]);
  const next = rgbOf(['#93ad4e', '#86a547', '#6c9a49', '#79ad48'][s]);
  c = mix(c, next, (yd % DAYS_SEASON) / DAYS_SEASON * 0.5);
  if (t.moist < 0.28 && s === 1) c = mix(c, '#c4b46c', clamp((0.28 - t.moist) * 2.6, 0, 0.75));
  return shade(c, (t.v - 0.5) * 0.09);
}
function soilColor(t) {
  let c = rgbOf('#8b6845');
  if (t.drain > 0.55) c = mix(c, '#c9a572', clamp((t.drain - 0.55) / 0.35, 0, 1));
  else c = mix(c, '#9c6345', clamp((0.45 - t.drain) / 0.3, 0, 1));
  c = mix(c, '#4c372a', clamp((t.org - 0.45) / 0.4, 0, 0.8));
  return shade(c, -t.moist * 0.36 + (t.v - 0.5) * 0.05);
}

// ---------- Fondo: cielo, cordillera y nubes ----------
const MOUNTAINS = (() => {
  // perfil de la cordillera con varias escalas de ruido para que se vea escarpado
  const ridge = (n, seed, k) => Array.from({ length: n + 1 }, (_, i) => {
    const x = i / n;
    let y = 0, a = 1, f = k, tot = 0;
    for (let o = 0; o < 5; o++) { y += Math.abs(noise2(x * f, o * 7.3, seed) - 0.5) * 2 * a; tot += a; a *= 0.5; f *= 2.1; }
    return [x, Math.pow(y / tot, 1.6) * 1.25];
  });
  return { far: ridge(160, 11, 4), mid: ridge(120, 23, 6), hills: ridge(80, 37, 3) };
})();
const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ x: Math.random(), y: 0.05 + Math.random() * 0.22, s: 0.6 + Math.random() * 0.9, v: 0.004 + Math.random() * 0.006, k: i }));

function drawBackground(g, s) {
  const [top, bot] = skyColors(s.z);
  const cl = G.w.cloud, grey = [160, 168, 178], night = nightness(s.z);
  const hz = VH * 0.36 + (cam.y - VH * 0.3) * 0.05, px = (cam.x - VW / 2) * 0.05;
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, css(mix(top, grey, cl * 0.5)));
  sky.addColorStop(1, css(mix(bot, grey, cl * 0.35)));
  g.fillStyle = sky; g.fillRect(0, 0, VW, hz + 2);
  if (night > 0.2) {
    const r = rng(9);
    for (let i = 0; i < 140; i++) { const tw = 0.5 + 0.5 * Math.sin(R.t * 2 + i); g.fillStyle = `rgba(255,255,240,${(night - 0.2) * 0.9 * tw})`; g.fillRect(r() * VW, r() * hz, 1.4, 1.4); }
    g.fillStyle = `rgba(250,248,230,${night})`; g.beginPath(); g.arc(VW * 0.82, hz * 0.3, 15, 0, TAU); g.fill();
    g.fillStyle = css(mix(top, grey, cl * 0.5)); g.beginPath(); g.arc(VW * 0.82 + 6, hz * 0.3 - 4, 13, 0, TAU); g.fill();
  }
  // el sol, bajando hacia la cordillera
  if (s.z > -0.06) {
    const sx = VW * (0.5 - clamp((G.hour - 12) / 7, -1, 1) * 0.42), sy = hz - clamp(s.z, -0.05, 1) * hz * 1.3;
    const a = (1 - cl * 0.8) * clamp((s.z + 0.06) * 8, 0, 1), R0 = 26 + (1 - clamp(s.z * 3, 0, 1)) * 10;
    const sg = g.createRadialGradient(sx, sy, 2, sx, sy, R0 * 5);
    sg.addColorStop(0, `rgba(255,250,225,${0.95 * a})`); sg.addColorStop(0.18, `rgba(255,238,190,${0.5 * a})`); sg.addColorStop(1, 'rgba(255,225,170,0)');
    g.fillStyle = sg; g.fillRect(sx - R0 * 5, sy - R0 * 5, R0 * 10, R0 * 10);
  }
  // nubes altas
  const nCl = Math.round(3 + cl * 6);
  for (let i = 0; i < nCl; i++) {
    const c = CLOUDS[i];
    c.x += c.v * 0.016 * (0.5 + R.wind);
    if (c.x > 1.25) c.x = -0.25;
    const x = c.x * VW, y = c.y * hz, w = 100 * c.s;
    const lit = mix(mix([255, 252, 246], bot, 0.35), [175, 182, 192], cl);
    g.fillStyle = css(mix(lit, [60, 70, 110], night * 0.8), 0.85 - night * 0.35);
    for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(x + (k - 2.5) * w * 0.27, y - Math.sin(k * 1.3 + 1) * w * 0.1, w * 0.3, w * 0.17, 0, 0, TAU); g.fill(); }
    g.fillStyle = css(mix(lit, [120, 130, 150], 0.3), 0.35 - night * 0.2); g.fillRect(x - w * 0.8, y + w * 0.05, w * 1.6, 2);
  }
  // cordillera de los Andes: lejana, pálida y con nieve en invierno y primavera
  const yd = G.day % DAYS_YEAR, snow = [0.8, 0.35, 0.5, 1][seasonOf(yd)];
  const haze = mix(bot, grey, cl * 0.4);
  const layer = (pts, h, col, snowK, off) => {
    const X = x => -60 + x * (VW + 120) + px * off;
    g.fillStyle = css(col); g.beginPath(); g.moveTo(-60, hz + 4);
    for (const [x, y] of pts) g.lineTo(X(x), hz - y * h);
    g.lineTo(VW + 60, hz + 4); g.closePath(); g.fill();
    if (!snowK) return;
    g.save(); g.clip();
    g.fillStyle = css(mix([250, 252, 255], col, 0.15 + night * 0.5), 0.92);
    g.beginPath(); g.moveTo(-60, hz - h * (0.62 - snowK * 0.12));
    for (const [x, y] of pts) g.lineTo(X(x), Math.min(hz - y * h + 2, hz - h * (0.6 - snowK * 0.12) + Math.sin(x * 90) * h * 0.04));
    g.lineTo(VW + 60, hz - h * (0.62 - snowK * 0.12)); g.lineTo(VW + 60, -10); g.lineTo(-60, -10); g.closePath();
    g.globalCompositeOperation = 'source-atop'; g.fill(); g.globalCompositeOperation = 'source-over';
    g.restore();
  };
  layer(MOUNTAINS.far, VH * 0.34, mix(mix('#a9b8d4', haze, 0.5), '#1d2445', night * 0.75), snow, 0.4);
  layer(MOUNTAINS.mid, VH * 0.15, mix(mix('#8fa6b8', haze, 0.4), '#172038', night * 0.78), snow * 0.3, 0.7);
  layer(MOUNTAINS.hills, VH * 0.06, mix(mix('#8daa94', haze, 0.3), '#141c30', night * 0.8), 0, 1);
  // valle con bruma y una hilera de árboles lejanos
  const val = g.createLinearGradient(0, hz, 0, VH);
  val.addColorStop(0, css(mix(mix('#c7d8b8', haze, 0.45), [24, 32, 58], night * 0.8)));
  val.addColorStop(1, css(mix(mix('#b3c99a', haze, 0.2), [18, 26, 48], night * 0.85)));
  g.fillStyle = val; g.fillRect(0, hz, VW, VH - hz);
  const r = rng(77), treeC = mix(mix('#6f8f6a', haze, 0.35), [20, 28, 45], night * 0.8);
  g.fillStyle = css(treeC, 0.7);
  for (let i = 0; i < 70; i++) { const x = ((r() * (VW + 200) + px * 1.4) % (VW + 200)) - 100, y = hz + 6 + r() * 10, w = 10 + r() * 16; g.beginPath(); g.ellipse(x, y, w, w * 0.6, 0, Math.PI, TAU); g.fill(); }
}

// ---------- Base del diorama, calle y vereda ----------
function drawSlab(g) {
  const D = SLAB, E = GH + STREET;
  const a = P(0, E), b = P(GW, E), c = P(GW, 0), dA = P(0, E, -D), dB = P(GW, E, -D), dC = P(GW, 0, -D);
  // sombra suave bajo el diorama
  const [sx, sy] = P(GW / 2, E / 2, -D - 0.5);
  const sh = g.createRadialGradient(sx, sy + 40 * cam.z, 10, sx, sy + 40 * cam.z, (GW + E) * 22 * cam.z);
  sh.addColorStop(0, 'rgba(30,40,30,0.28)'); sh.addColorStop(1, 'rgba(30,40,30,0)');
  g.fillStyle = sh; g.fillRect(sx - 2000, sy - 600, 4000, 1600);
  const face = (p1, p2, p3, p4, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(...p1); g.lineTo(...p2); g.lineTo(...p3); g.lineTo(...p4); g.closePath(); g.fill(); };
  face(a, b, dB, dA, '#7a5639'); face(b, c, dC, dB, '#5f412b');
  // capas de tierra
  for (let k = 1; k < 4; k++) {
    const zz = -D * k / 4;
    g.strokeStyle = `rgba(40,25,15,${0.12 + k * 0.04})`; g.lineWidth = 1.2 * cam.z;
    g.beginPath(); g.moveTo(...P(0, E, zz)); g.lineTo(...P(GW, E, zz)); g.lineTo(...P(GW, 0, zz)); g.stroke();
  }
  g.fillStyle = 'rgba(200,180,150,0.35)';
  const r = rng(4);
  for (let i = 0; i < 60; i++) {
    const t = r(), zz = -D * (0.2 + r() * 0.75);
    const [x, y] = r() < 0.6 ? P(t * GW, E, zz) : P(GW, t * E, zz);
    g.beginPath(); g.ellipse(x, y, (2 + r() * 4) * cam.z, (1.4 + r() * 2) * cam.z, 0, 0, TAU); g.fill();
  }
  // borde de pasto
  g.strokeStyle = '#6d9a45'; g.lineWidth = 3 * cam.z;
  g.beginPath(); g.moveTo(...P(GW, 0, -0.04)); g.lineTo(...P(GW, GH, -0.04)); g.stroke();
}

function drawStreet(g) {
  const E = GH + STREET;
  const quad = (x0, y0, x1, y1, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(...P(x0, y0)); g.lineTo(...P(x1, y0)); g.lineTo(...P(x1, y1)); g.lineTo(...P(x0, y1)); g.closePath(); g.fill(); };
  quad(0, GH, GW, GH + 1.3, '#d8d0c0');            // vereda
  g.strokeStyle = 'rgba(120,110,95,0.35)'; g.lineWidth = 1 * cam.z;
  for (let x = 1; x < GW; x++) { g.beginPath(); g.moveTo(...P(x, GH)); g.lineTo(...P(x, GH + 1.3)); g.stroke(); }
  g.beginPath(); g.moveTo(...P(0, GH + 0.65)); g.lineTo(...P(GW, GH + 0.65)); g.stroke();
  quad(0, GH + 1.3, GW, GH + 1.45, '#b8b0a0');      // solera
  quad(0, GH + 1.45, GW, E, '#6b6b70');              // calle
  g.strokeStyle = 'rgba(245,240,220,0.7)'; g.lineWidth = 2 * cam.z;
  for (let x = 0.5; x < GW; x += 2) { g.beginPath(); g.moveTo(...P(x, GH + 2.15)); g.lineTo(...P(x + 1, GH + 2.15)); g.stroke(); }
}

// ---------- Suelo del jardín ----------
function diamond(g, x, y, e = 0.6) {
  const [ax, ay] = P(x, y), [bx, by] = P(x + 1, y), [cx, cy] = P(x + 1, y + 1), [dx, dy] = P(x, y + 1);
  g.beginPath(); g.moveTo(ax, ay - e); g.lineTo(bx + e, by); g.lineTo(cx, cy + e); g.lineTo(dx - e, dy); g.closePath();
}
function drawTex(g, tex, x, y) {
  const [ax, ay] = P(x, y);
  g.drawImage(tex, ax - TW / 2 * cam.z, ay, TW * cam.z, TH * cam.z);
}

function drawGround(g, s) {
  const yd = G.day % DAYS_YEAR, frosty = G.w.tmin < 0 && G.hour < 10.5 ? clamp((10.5 - G.hour) / 4, 0, 1) * 0.6 : 0;
  // base de todo el terreno
  g.fillStyle = css(grassColor({ moist: 0.5, v: 0.5 }, yd));
  g.beginPath(); g.moveTo(...P(0, 0)); g.lineTo(...P(GW, 0)); g.lineTo(...P(GW, GH)); g.lineTo(...P(0, GH)); g.closePath(); g.fill();
  const cs = [screenToWorld(0, 0), screenToWorld(VW, 0), screenToWorld(0, VH + 60), screenToWorld(VW, VH + 60)];
  const minX = Math.max(0, Math.floor(Math.min(...cs.map(c => c[0]))) - 1), maxX = Math.min(GW - 1, Math.ceil(Math.max(...cs.map(c => c[0]))) + 1);
  const minY = Math.max(0, Math.floor(Math.min(...cs.map(c => c[1]))) - 1), maxY = Math.min(GH - 1, Math.ceil(Math.max(...cs.map(c => c[1]))) + 1);
  const wt = R.t;
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const t = G.tiles[idx(x, y)], v = Math.floor(t.v * 4);
    const [cxs, cys] = P(x + 0.5, y + 0.5);
    if (cxs < -80 || cxs > VW + 80 || cys < -60 || cys > VH + 60) continue;
    if (!t.own && t.t !== 'water') {
      diamond(g, x, y); g.fillStyle = css(shade(mix(grassColor(t, yd), '#a8a860', 0.25), (t.v - 0.5) * 0.08)); g.fill();
      drawTex(g, TEX.meadow[v % 3], x, y);
      continue;
    }
    switch (t.t) {
      case 'grass':
        diamond(g, x, y); g.fillStyle = css(frosty ? mix(grassColor(t, yd), '#e6eef2', frosty) : grassColor(t, yd)); g.fill();
        drawTex(g, TEX.grass[v], x, y);
        break;
      case 'bed': {
        diamond(g, x, y); g.fillStyle = css(t.gh ? shade(soilColor(t), 0.05) : soilColor(t)); g.fill();
        drawTex(g, TEX.soil[v % 2], x, y);
        if (t.mulch) { g.globalAlpha = 0.85; drawTex(g, TEX.mulch, x, y); g.globalAlpha = 1; }
        if (frosty) { diamond(g, x, y); g.fillStyle = `rgba(235,242,246,${frosty * 0.5})`; g.fill(); }
        if (t.wet && G.hour > 5) { diamond(g, x, y, -2 * cam.z); g.fillStyle = 'rgba(40,70,110,0.12)'; g.fill(); }
        break;
      }
      case 'path':
        diamond(g, x, y); g.fillStyle = '#a99e8a'; g.fill(); drawTex(g, TEX.path[v], x, y);
        break;
      case 'water': drawWaterTile(g, t, x, y, wt, s); break;
      case 'house':
        diamond(g, x, y); g.fillStyle = '#8f8576'; g.fill(); break;
    }
  }
  // bordes de los canteros y del estanque
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const t = G.tiles[idx(x, y)];
    if (t.t === 'bed' && !t.gh && t.own) bedEdges(g, x, y);
    else if (t.t === 'water') pondEdges(g, x, y);
    if (t.t === 'bed' && t.weeds > 0.3 && t.own) drawWeeds(g, t, x, y);
  }
  // límites de las parcelas en venta
  g.setLineDash([6 * cam.z, 5 * cam.z]); g.lineWidth = 1.5 * cam.z; g.strokeStyle = 'rgba(255,250,230,0.55)';
  PARCELS.forEach((p, i) => {
    if (G.owned[i]) return;
    g.beginPath(); g.moveTo(...P(p.x0, p.y0)); g.lineTo(...P(p.x1, p.y0)); g.lineTo(...P(p.x1, p.y1)); g.lineTo(...P(p.x0, p.y1)); g.closePath(); g.stroke();
  });
  g.setLineDash([]);
}

function bedEdges(g, x, y) {
  const isBed = (i, j) => { const n = tileAt(i, j); return n && n.t === 'bed' && !n.gh; };
  const hz = 0.09, wood = '#8a6844', woodD = '#6c4f33';
  const face = (p1, p2, col) => {
    const a = P(...p1), b = P(...p2), c = P(p2[0], p2[1], hz), d = P(p1[0], p1[1], hz);
    g.fillStyle = col; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...d); g.closePath(); g.fill();
  };
  g.lineWidth = 2.2 * cam.z; g.strokeStyle = wood;
  if (!isBed(x, y - 1)) { g.beginPath(); g.moveTo(...P(x, y, hz)); g.lineTo(...P(x + 1, y, hz)); g.stroke(); }
  if (!isBed(x - 1, y)) { g.beginPath(); g.moveTo(...P(x, y, hz)); g.lineTo(...P(x, y + 1, hz)); g.stroke(); }
  if (!isBed(x, y + 1)) face([x, y + 1], [x + 1, y + 1], wood);
  if (!isBed(x + 1, y)) face([x + 1, y + 1], [x + 1, y], woodD);
}
function pondEdges(g, x, y) {
  const isW = (i, j) => { const n = tileAt(i, j); return n && n.t === 'water'; };
  const r = rng(x * 31 + y * 17);
  const edge = (ax, ay, bx, by) => {
    for (let k = 0; k < 4; k++) {
      const t = (k + 0.5) / 4, [px, py] = P(lerp(ax, bx, t), lerp(ay, by, t), 0.03);
      g.fillStyle = css(mix('#b9b2a2', '#8e877a', r())); g.beginPath(); g.ellipse(px, py, 5.5 * cam.z, 3.2 * cam.z, 0, 0, TAU); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.ellipse(px - 1.5 * cam.z, py - 1 * cam.z, 2.5 * cam.z, 1.3 * cam.z, 0, 0, TAU); g.fill();
    }
  };
  if (!isW(x, y - 1)) edge(x, y, x + 1, y);
  if (!isW(x - 1, y)) edge(x, y, x, y + 1);
  if (!isW(x, y + 1)) edge(x, y + 1, x + 1, y + 1);
  if (!isW(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
}
function drawWaterTile(g, t, x, y, wt, s) {
  const [bt, bb] = skyColors(s.z);
  diamond(g, x, y);
  const [cx, cy] = P(x + 0.5, y + 0.5);
  const grd = g.createLinearGradient(cx, cy - TH * cam.z / 2, cx, cy + TH * cam.z / 2);
  grd.addColorStop(0, css(mix('#2f6f7a', bb, 0.35))); grd.addColorStop(1, css(mix('#1f5560', bt, 0.25)));
  g.fillStyle = grd; g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1 * cam.z;
  for (let k = 0; k < 2; k++) {
    const ph = (wt * 0.6 + t.v * 7 + k * 0.5) % 1, rr = ph * 9 * cam.z;
    g.globalAlpha = 1 - ph;
    g.beginPath(); g.ellipse(cx + (k - 0.5) * 12 * cam.z, cy + (t.v - 0.5) * 6 * cam.z, rr, rr * 0.45, 0, 0, TAU); g.stroke();
  }
  g.globalAlpha = 1;
}
function drawWeeds(g, t, x, y) {
  const r = rng(x * 7 + y * 13), n = Math.round(t.weeds * 7);
  g.strokeStyle = '#5f8a35'; g.lineWidth = 1.1 * cam.z;
  for (let i = 0; i < n; i++) {
    const [px, py] = P(x + 0.15 + r() * 0.7, y + 0.15 + r() * 0.7);
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + k * 2.5 * cam.z, py - (4 + r() * 3) * cam.z); g.stroke(); }
  }
}

// ---------- Capas de información (luz, agua, suelo…) ----------
const LENS = {
  light: t => { const h = t.sun; return h < 2 ? mix('#3a3f8a', '#4a7ab0', h / 2) : h < 4 ? mix('#4a7ab0', '#7fbf9a', (h - 2) / 2) : h < 6 ? mix('#7fbf9a', '#f2d35a', (h - 4) / 2) : mix('#f2d35a', '#f08a2a', clamp((h - 6) / 6, 0, 1)); },
  water: t => mix('#e8dcc0', '#2a5fb0', t.moist),
  soil: t => t.drain > 0.75 ? rgbOf('#e8cf8e') : t.drain < 0.32 ? rgbOf('#c4664a') : t.org > 0.62 ? rgbOf('#4f3a2c') : rgbOf('#9c7650'),
  ph: t => t.ph < 5.5 ? mix('#e8453c', '#f5a03a', (t.ph - 4.5)) : t.ph < 6.5 ? mix('#f5a03a', '#9fd05a', t.ph - 5.5) : t.ph < 7.5 ? mix('#9fd05a', '#3aa7a0', t.ph - 6.5) : mix('#3aa7a0', '#5a4fc4', clamp(t.ph - 7.5, 0, 1)),
  feed: t => mix('#e9e2c4', '#2f7a3a', t.fert)
};
function lensLabel(t, k) {
  if (k === 'light') return t.sun.toFixed(1) + 'h';
  if (k === 'water') return Math.round(t.moist * 100) + '%';
  if (k === 'ph') return t.ph.toFixed(1);
  if (k === 'feed') return Math.round(t.fert * 100) + '%';
  return '';
}
function drawLens(g) {
  const k = R.lens;
  if (!k) return;
  g.font = `600 ${Math.round(9 * cam.z)}px ui-rounded, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const t of G.tiles) {
    if (!t.own || t.t === 'house') continue;
    if (k === 'water' && t.t === 'water') continue;
    diamond(g, t.x, t.y, 0); g.fillStyle = css(LENS[k](t), 0.62); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.stroke();
    if (cam.z > 0.8 && k !== 'soil') {
      const [cx, cy] = P(t.x + 0.5, t.y + 0.5);
      g.fillStyle = 'rgba(20,25,20,0.75)'; g.fillText(lensLabel(t, k), cx, cy);
    }
  }
}

// Vista previa al plantar: verde = feliz, amarillo = regular, rojo = mal
function drawPreview(g) {
  const pv = R.preview;
  if (!pv) return;
  if (pv.kind === 'plant') {
    const sp = SP[pv.sp];
    for (const t of G.tiles) {
      if (!canPlantHere(sp, t)) continue;
      const f = suitability(sp, t);
      diamond(g, t.x, t.y, -1.5 * cam.z);
      g.fillStyle = f > 0.8 ? 'rgba(120,220,110,0.42)' : f > 0.55 ? 'rgba(250,210,70,0.42)' : 'rgba(240,90,70,0.42)';
      g.fill();
    }
  }
  if (pv.kind === 'parcel') {
    PARCELS.forEach((p, i) => {
      if (G.owned[i]) return;
      g.fillStyle = i === pv.hover ? 'rgba(255,240,170,0.35)' : 'rgba(255,240,170,0.12)';
      g.beginPath(); g.moveTo(...P(p.x0, p.y0)); g.lineTo(...P(p.x1, p.y0)); g.lineTo(...P(p.x1, p.y1)); g.lineTo(...P(p.x0, p.y1)); g.closePath(); g.fill();
    });
  }
}
const SUIT_CACHE = new Map();
function suitability(sp, t) {
  const key = sp.id + ':' + t.x + ',' + t.y + ':' + VIS_VER;
  let v = SUIT_CACHE.get(key);
  if (v === undefined) {
    if (SUIT_CACHE.size > 6000) SUIT_CACHE.clear();
    v = evaluate(sp, t, null, G.w, true).cond;
    SUIT_CACHE.set(key, v);
  }
  return v;
}

function drawHover(g) {
  const h = R.hover;
  if (!h) return;
  const rad = R.area || 0;
  g.lineWidth = 2; g.strokeStyle = h.bad ? 'rgba(255,120,100,0.95)' : 'rgba(255,255,240,0.95)';
  g.fillStyle = h.bad ? 'rgba(255,100,80,0.18)' : 'rgba(255,255,240,0.16)';
  const w = h.w || 1, hh = h.h || 1;
  if (w > 1 || hh > 1) {
    g.beginPath(); g.moveTo(...P(h.x, h.y)); g.lineTo(...P(h.x + w, h.y)); g.lineTo(...P(h.x + w, h.y + hh)); g.lineTo(...P(h.x, h.y + hh)); g.closePath(); g.fill(); g.stroke();
    return;
  }
  for (let y = h.y - rad; y <= h.y + rad; y++) for (let x = h.x - rad; x <= h.x + rad; x++) {
    if (!inside(x, y) || Math.hypot(x - h.x, y - h.y) > rad + 0.3) continue;
    diamond(g, x, y, -1); g.fill(); g.stroke();
  }
}

// ---------- Sombras ----------
function shadowVec(s) {
  const k = 1 / Math.max(0.18, s.z), vx = -s.x * k, vy = -s.y * k, l = Math.hypot(vx, vy);
  const m = l > 2.6 ? 2.6 / l : 1;
  return [vx * m, vy * m];
}
function drawShadows(s) {
  const g = shadowCtx, str = sunStrength(s);
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, shadowCv.width, shadowCv.height);
  if (str < 0.03) return;
  const [vx, vy] = shadowVec(s);
  g.setTransform(DPR, 0, 0, DPR, 0, 0); g.fillStyle = '#000';
  // la casa
  const H = HOUSE, pts = [];
  const add = (x, y, z) => pts.push([x + vx * z, y + vy * z]);
  for (const [x, y] of [[H.x0, H.y0], [H.x1, H.y0], [H.x1, H.y1], [H.x0, H.y1]]) { add(x, y, 0); add(x, y, H.wall); }
  const my = (H.y0 + H.y1) / 2;
  add(H.x0 - 0.3, my, H.ridge); add(H.x1 + 0.3, my, H.ridge); add(1.2, 1.4, 6.6); add(1.8, 1.4, 6.6);
  polyFill(g, hull(pts));
  // invernadero, pérgola, fuente…
  for (const st of G.structs) structShadow(g, st, vx, vy);
  // cerco del fondo
  g.beginPath(); g.moveTo(...P(0, 0)); g.lineTo(...P(GW, 0)); g.lineTo(...P(GW + vx * 1.2, vy * 1.2)); g.lineTo(...P(vx * 1.2, vy * 1.2)); g.fill();
  g.beginPath(); g.moveTo(...P(0, 0)); g.lineTo(...P(0, GH)); g.lineTo(...P(vx * 1.2, GH + vy * 1.2)); g.lineTo(...P(vx * 1.2, vy * 1.2)); g.fill();
  // plantas: su silueta proyectada sobre el suelo
  const sx = (vx - vy) * TW / 2 * cam.z * DPR, sy = (vx + vy) * TH / 2 * cam.z * DPR;
  for (const p of G.plants) {
    const spr = p._spr;
    if (!spr || !p._scr) continue;
    const [bx, by] = p._scr;
    if (bx < -400 || bx > VW + 400 || by < -200 || by > VH + 900) continue;
    if (!spr.sil) spr.sil = silhouette(spr.cv);
    const f = cam.z / spr.z, Ssp = PX_M * spr.z * DPR;
    g.setTransform(f, 0, -sx / Ssp, -sy / Ssp, bx * DPR - f * spr.ox + spr.oy * sx / Ssp, by * DPR + spr.oy * sy / Ssp);
    g.drawImage(spr.sil, 0, 0);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function hull(pts) {
  pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
function polyFill(g, pts) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(...P(x, y)) : g.moveTo(...P(x, y)))); g.closePath(); g.fill(); }
function boxShadow(g, x0, y0, x1, y1, h, vx, vy) {
  const pts = [];
  for (const [x, y] of [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]) { pts.push([x, y]); pts.push([x + vx * h, y + vy * h]); }
  polyFill(g, hull(pts));
}
function structShadow(g, st, vx, vy) {
  const { x, y, w, h } = st;
  switch (st.k) {
    case 'greenhouse': g.globalAlpha = 0.35; boxShadow(g, x, y, x + w, y + h, 2.6, vx, vy); g.globalAlpha = 1; break;
    case 'pergola': case 'arch':
      for (const [px, py] of [[x + 0.1, y + 0.1], [x + w - 0.1, y + 0.1], [x + 0.1, y + h - 0.1], [x + w - 0.1, y + h - 0.1]]) boxShadow(g, px - 0.06, py - 0.06, px + 0.06, py + 0.06, 2.4, vx, vy);
      if (st.k === 'pergola') for (let i = 0; i < 5; i++) { const yy = y + 0.1 + i * (h - 0.2) / 4; polyFill(g, [[x + vx * 2.4, yy - 0.05 + vy * 2.4], [x + w + vx * 2.4, yy - 0.05 + vy * 2.4], [x + w + vx * 2.4, yy + 0.05 + vy * 2.4], [x + vx * 2.4, yy + 0.05 + vy * 2.4]]); }
      break;
    case 'fountain': boxShadow(g, x + 0.3, y + 0.3, x + w - 0.3, y + h - 0.3, 1.2, vx, vy); break;
    case 'statue': boxShadow(g, x + 0.3, y + 0.3, x + 0.7, y + 0.7, 2.0, vx, vy); break;
    case 'lantern': boxShadow(g, x + 0.45, y + 0.45, x + 0.55, y + 0.55, 1.6, vx, vy); break;
    case 'bench': boxShadow(g, x + 0.15, y + 0.35, x + 0.85, y + 0.65, 0.5, vx, vy); break;
    case 'birdbath': case 'sundial': boxShadow(g, x + 0.35, y + 0.35, x + 0.65, y + 0.65, 0.9, vx, vy); break;
    case 'beehive': boxShadow(g, x + 0.25, y + 0.25, x + 0.75, y + 0.75, 0.6, vx, vy); break;
  }
}

// ---------- La casa ----------
function faceLight(nx, ny, nz, s) {
  const sl = Math.max(0, nx * s.x + ny * s.y + nz * s.z) * sunStrength(s);
  return 0.72 + 0.38 * sl;
}
function quadW(g, pts, col) { g.fillStyle = css(col); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(...P(...p)) : g.moveTo(...P(...p)))); g.closePath(); g.fill(); }

function drawHouse(g, s) {
  const H = HOUSE, x0 = H.x0, x1 = H.x1, y0 = H.y0, y1 = H.y1, w = H.wall, rd = H.ridge, my = (y0 + y1) / 2;
  const night = nightness(s.z);
  const wallC = rgbOf('#efe2c4'), roofC = rgbOf('#bf5f3a');
  const Lx = faceLight(1, 0, 0, s), Ly = faceLight(0, 1, 0, s);
  // muro izquierdo (frente hacia la calle) y derecho
  quadW(g, [[x0, y1, 0], [x1, y1, 0], [x1, y1, w], [x0, y1, w]], shade(wallC, Ly - 1));
  quadW(g, [[x1, y1, 0], [x1, y0, 0], [x1, y0, w], [x1, y1, w]], shade(wallC, Lx - 1.06));
  // frontón triangular
  quadW(g, [[x1, y1, w], [x1, y0, w], [x1, my, rd]], shade(wallC, Lx - 1.06));
  // zócalo de piedra
  quadW(g, [[x0, y1, 0], [x1, y1, 0], [x1, y1, 0.45], [x0, y1, 0.45]], shade('#a4998a', Ly - 1));
  quadW(g, [[x1, y1, 0], [x1, y0, 0], [x1, y0, 0.45], [x1, y1, 0.45]], shade('#a4998a', Lx - 1.06));
  // ventanas y puerta en el muro de la calle (plano y = y1)
  const winY = (xa, xb, za, zb) => window3(g, [xa, y1, za], [xb, y1, za], [xb, y1, zb], [xa, y1, zb], night, s, 'y');
  winY(0.8, 2.0, 1.1, 2.4); winY(4.1, 5.3, 1.1, 2.4);
  // puerta
  quadW(g, [[GATE_X - 0.5, y1, 0], [GATE_X + 0.5, y1, 0], [GATE_X + 0.5, y1, 2.25], [GATE_X - 0.5, y1, 2.25]], '#6f4630');
  quadW(g, [[GATE_X - 0.4, y1, 0.1], [GATE_X + 0.4, y1, 0.1], [GATE_X + 0.4, y1, 2.1], [GATE_X - 0.4, y1, 2.1]], '#8a5a3a');
  g.fillStyle = '#e8c36a'; const [kx, ky] = P(GATE_X + 0.28, y1, 1.05); g.beginPath(); g.arc(kx, ky, 1.6 * cam.z, 0, TAU); g.fill();
  // farol junto a la puerta
  const [lx, ly] = P(GATE_X + 0.75, y1, 2.0);
  g.fillStyle = '#3a3a3a'; g.fillRect(lx - 2.5 * cam.z, ly - 4 * cam.z, 5 * cam.z, 7 * cam.z);
  g.fillStyle = night > 0.2 ? '#ffe9a8' : '#d9d2b8'; g.fillRect(lx - 1.6 * cam.z, ly - 3 * cam.z, 3.2 * cam.z, 4.5 * cam.z);
  // ventanas del muro derecho (plano x = x1) y ventanita del frontón
  const winX = (ya, yb, za, zb) => window3(g, [x1, yb, za], [x1, ya, za], [x1, ya, zb], [x1, yb, zb], night, s, 'x');
  winX(0.8, 2.0, 1.1, 2.4); winX(3.0, 4.2, 1.1, 2.4);
  const [ox, oy] = P(x1, my, w + 1.1);
  g.fillStyle = '#e8dcc0'; g.beginPath(); g.ellipse(ox, oy, 9 * cam.z, 8 * cam.z, 0, 0, TAU); g.fill();
  g.fillStyle = night > 0.3 ? '#ffd98a' : css(mix('#6f8fa8', skyColors(s.z)[1], 0.4)); g.beginPath(); g.ellipse(ox, oy, 6.5 * cam.z, 6 * cam.z, 0, 0, TAU); g.fill();
  // jardineras con cardenales bajo las ventanas de la calle
  for (const xa of [0.8, 4.1]) {
    quadW(g, [[xa - 0.05, y1 + 0.18, 0.95], [xa + 1.25, y1 + 0.18, 0.95], [xa + 1.25, y1 + 0.18, 1.15], [xa - 0.05, y1 + 0.18, 1.15]], '#8a5a3a');
    const r = rng(xa * 10);
    for (let i = 0; i < 9; i++) {
      const [fx, fy] = P(xa + 0.05 + i * 0.14, y1 + 0.12, 1.2 + r() * 0.12);
      g.fillStyle = r() < 0.4 ? '#3f7a35' : '#4f8a3a'; g.beginPath(); g.arc(fx, fy + 2 * cam.z, 3.2 * cam.z, 0, TAU); g.fill();
      if (i % 2 === 0) { g.fillStyle = '#e8283c'; g.beginPath(); g.arc(fx, fy - 1 * cam.z, 2.6 * cam.z, 0, TAU); g.fill(); }
    }
  }
  // techo: faldón del fondo (apenas se ve), alero y faldón delantero
  const o = 0.35;
  quadW(g, [[x0 - o, my, rd], [x1 + o, my, rd], [x1 + o, y0 - o, w - 0.35], [x0 - o, y0 - o, w - 0.35]], shade(roofC, -0.25));
  // chimenea
  const cx = 1.2, cy = 1.0;
  quadW(g, [[cx, cy + 0.6, 4.2], [cx + 0.6, cy + 0.6, 4.2], [cx + 0.6, cy + 0.6, 6.6], [cx, cy + 0.6, 6.6]], shade('#a85a40', Ly - 1));
  quadW(g, [[cx + 0.6, cy + 0.6, 4.2], [cx + 0.6, cy, 4.2], [cx + 0.6, cy, 6.6], [cx + 0.6, cy + 0.6, 6.6]], shade('#a85a40', Lx - 1.1));
  quadW(g, [[cx, cy, 6.6], [cx + 0.6, cy, 6.6], [cx + 0.6, cy + 0.6, 6.6], [cx, cy + 0.6, 6.6]], '#5a3a2a');
  const roofF = shade(roofC, faceLight(0, 0.7, 0.7, s) - 1);
  quadW(g, [[x0 - o, my, rd], [x1 + o, my, rd], [x1 + o, y1 + o, w - 0.35], [x0 - o, y1 + o, w - 0.35]], roofF);
  // tejas
  g.strokeStyle = css(shade(roofF, -0.22)); g.lineWidth = 1 * cam.z;
  for (let i = 1; i < 8; i++) { const t = i / 8, yy = lerp(my, y1 + o, t), zz = lerp(rd, w - 0.35, t); g.beginPath(); g.moveTo(...P(x0 - o, yy, zz)); g.lineTo(...P(x1 + o, yy, zz)); g.stroke(); }
  g.strokeStyle = css(shade(roofF, -0.12)); g.lineWidth = 0.8 * cam.z;
  for (let i = 1; i < 18; i++) { const xx = lerp(x0 - o, x1 + o, i / 18); g.beginPath(); g.moveTo(...P(xx, my, rd)); g.lineTo(...P(xx, y1 + o, w - 0.35)); g.stroke(); }
  // canto del techo sobre el frontón
  g.strokeStyle = css(shade(roofC, -0.35)); g.lineWidth = 3 * cam.z;
  g.beginPath(); g.moveTo(...P(x1 + o, y0 - o, w - 0.35)); g.lineTo(...P(x1 + o, my, rd)); g.lineTo(...P(x1 + o, y1 + o, w - 0.35)); g.stroke();
  g.strokeStyle = css(shade(roofC, 0.1)); g.lineWidth = 3.5 * cam.z;
  g.beginPath(); g.moveTo(...P(x0 - o, my, rd)); g.lineTo(...P(x1 + o, my, rd)); g.stroke();
  // humo de la chimenea en días fríos
  if (G.w.tmin < 9) {
    for (let i = 0; i < 6; i++) {
      const ph = (R.t * 0.25 + i / 6) % 1, [hx, hy] = P(cx + 0.3 + ph * 0.8 * (0.5 + R.wind), cy + 0.3 - ph * 0.5, 6.8 + ph * 2.2);
      g.fillStyle = `rgba(230,230,235,${0.35 * (1 - ph)})`; g.beginPath(); g.arc(hx, hy, (4 + ph * 10) * cam.z, 0, TAU); g.fill();
    }
  }
}

// Ventana con marco, vidrio que refleja el cielo y luz cálida de noche
function window3(g, a, b, c, d, night, s, side) {
  quadW(g, [a, b, c, d], '#f7f1e2');
  const inset = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k), lerp(p[2], q[2], k)];
  const ia = inset(a, c, 0.1), ic = inset(c, a, 0.1), ib = inset(b, d, 0.1), id = inset(d, b, 0.1);
  const lit = night > 0.25;
  const glass = lit ? mix('#ffd98a', '#ffb860', 0.3) : mix('#5f7f98', skyColors(s.z)[1], 0.35);
  quadW(g, [ia, ib, ic, id], glass);
  if (!lit) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.moveTo(...P(...ia)); g.lineTo(...P(...inset(ia, ib, 0.4))); g.lineTo(...P(...inset(id, ic, 0.15))); g.lineTo(...P(...id)); g.fill(); }
  g.strokeStyle = '#f7f1e2'; g.lineWidth = 1.4 * cam.z;
  g.beginPath(); g.moveTo(...P(...inset(ia, ib, 0.5))); g.lineTo(...P(...inset(id, ic, 0.5))); g.moveTo(...P(...inset(ia, id, 0.5))); g.lineTo(...P(...inset(ib, ic, 0.5))); g.stroke();
  // postigos
  const sh = '#6f8f6a';
  const w = 0.32;
  if (side === 'y') {
    quadW(g, [[a[0] - w, a[1] + 0.02, a[2]], [a[0] - 0.02, a[1] + 0.02, a[2]], [d[0] - 0.02, d[1] + 0.02, d[2]], [d[0] - w, d[1] + 0.02, d[2]]], sh);
    quadW(g, [[b[0] + 0.02, b[1] + 0.02, b[2]], [b[0] + w, b[1] + 0.02, b[2]], [c[0] + w, c[1] + 0.02, c[2]], [c[0] + 0.02, c[1] + 0.02, c[2]]], sh);
  } else {
    quadW(g, [[a[0] + 0.02, a[1] + w, a[2]], [a[0] + 0.02, a[1] + 0.02, a[2]], [d[0] + 0.02, d[1] + 0.02, d[2]], [d[0] + 0.02, d[1] + w, d[2]]], shade(sh, -0.08));
    quadW(g, [[b[0] + 0.02, b[1] - 0.02, b[2]], [b[0] + 0.02, b[1] - w, b[2]], [c[0] + 0.02, c[1] - w, c[2]], [c[0] + 0.02, c[1] - 0.02, c[2]]], shade(sh, -0.08));
  }
}

// ---------- Cercos ----------
function drawBackFence(g) {
  const hz = 1.2, wood = '#b08b62', dark = '#8a6a48';
  g.lineCap = 'round';
  // cerco a lo largo de y = 0 (detrás, derecha) y x = 0 (detrás, izquierda)
  for (const side of [0, 1]) {
    const len = side ? GH : GW;
    for (let i = 0; i <= len * 3; i++) {
      const t = i / 3, [ax, ay] = side ? P(0, t) : P(t, 0), [bx, by] = side ? P(0, t, hz * (0.9 + 0.1 * (i % 2))) : P(t, 0, hz * (0.9 + 0.1 * (i % 2)));
      g.strokeStyle = i % 3 ? wood : dark; g.lineWidth = (i % 3 ? 3.4 : 4.2) * cam.z;
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    }
    g.strokeStyle = dark; g.lineWidth = 2 * cam.z;
    for (const zz of [0.35, 0.9]) { g.beginPath(); g.moveTo(...(side ? P(0, 0, zz) : P(0, 0, zz))); g.lineTo(...(side ? P(0, len, zz) : P(len, 0, zz))); g.stroke(); }
  }
}
// Reja de madera blanca hacia la calle: se dibuja por tramos para ordenarla con las plantas
function fenceSegment(g, x) {
  if (x === GATE_X) return gateDraw(g, x);
  const hz = 0.9;
  for (let k = 0; k < 4; k++) {
    const t = x + (k + 0.5) / 4, [px, py] = P(t, GH), [qx, qy] = P(t, GH, hz);
    g.fillStyle = '#f4efe2'; g.beginPath(); g.moveTo(px - 2.4 * cam.z, py); g.lineTo(qx - 2.4 * cam.z, qy + 2 * cam.z); g.lineTo(qx, qy - 1 * cam.z); g.lineTo(qx + 2.4 * cam.z, qy + 2 * cam.z); g.lineTo(px + 2.4 * cam.z, py); g.closePath(); g.fill();
    g.fillStyle = 'rgba(120,110,90,0.25)'; g.fillRect(px + 0.8 * cam.z, qy + 2 * cam.z, 1.6 * cam.z, py - qy - 2 * cam.z);
  }
  g.strokeStyle = '#e4ddcc'; g.lineWidth = 2 * cam.z;
  for (const zz of [0.25, 0.65]) { g.beginPath(); g.moveTo(...P(x, GH, zz)); g.lineTo(...P(x + 1, GH, zz)); g.stroke(); }
}
function gateDraw(g, x) {
  const hz = 1.05;
  for (const t of [x + 0.04, x + 0.96]) { const [px, py] = P(t, GH), [qx, qy] = P(t, GH, hz); g.strokeStyle = '#e8e2d2'; g.lineWidth = 4 * cam.z; g.beginPath(); g.moveTo(px, py); g.lineTo(qx, qy); g.stroke(); }
  // reja abierta
  const open = G.open && G.hour >= 9 && G.hour < 18;
  g.strokeStyle = '#f4efe2'; g.lineWidth = 1.6 * cam.z;
  const ang = open ? 1.1 : 0;
  for (let k = 0; k <= 4; k++) {
    const t = k / 4 * 0.9, gx = x + 0.05 + t * Math.cos(ang), gy = GH - t * Math.sin(ang);
    g.beginPath(); g.moveTo(...P(gx, gy, 0.1)); g.lineTo(...P(gx, gy, 0.85)); g.stroke();
  }
  // cartel del jardín sobre la reja
  const [cx, cy] = P(x + 0.5, GH, 1.35);
  g.fillStyle = '#6f4f35'; g.fillRect(cx - 18 * cam.z, cy - 6 * cam.z, 36 * cam.z, 12 * cam.z);
  g.fillStyle = open ? '#f7e7a8' : '#d8cdb8'; g.font = `700 ${7 * cam.z}px ui-rounded, system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(open ? L().gateOpen : L().gateClosed, cx, cy + 0.5);
}

// ---------- Objetos del jardín ----------
function drawStruct(g, st, part, s) {
  const { x, y, w, h } = st, night = nightness(s.z);
  const [cx, cy] = P(x + w / 2, y + h / 2);
  const z = cam.z;
  switch (st.k) {
    case 'bench': {
      const wood = '#9a6b42';
      quadW(g, [[x + 0.15, y + 0.4, 0.45], [x + 0.85, y + 0.4, 0.45], [x + 0.85, y + 0.65, 0.45], [x + 0.15, y + 0.65, 0.45]], wood);
      quadW(g, [[x + 0.15, y + 0.4, 0.45], [x + 0.85, y + 0.4, 0.45], [x + 0.85, y + 0.4, 0.95], [x + 0.15, y + 0.4, 0.95]], shade(wood, -0.1));
      g.strokeStyle = '#3f3a35'; g.lineWidth = 2.2 * z;
      for (const xx of [0.2, 0.8]) for (const yy of [0.42, 0.63]) { g.beginPath(); g.moveTo(...P(x + xx, y + yy)); g.lineTo(...P(x + xx, y + yy, 0.45)); g.stroke(); }
      break;
    }
    case 'lantern': {
      const [bx, by] = P(x + 0.5, y + 0.5), [tx, ty] = P(x + 0.5, y + 0.5, 1.5);
      g.strokeStyle = '#3a3a3a'; g.lineWidth = 2.5 * z; g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke();
      g.fillStyle = '#3a3a3a'; g.fillRect(tx - 4 * z, ty - 9 * z, 8 * z, 2 * z);
      g.fillStyle = night > 0.2 ? '#ffe7a0' : '#e8e2cc'; g.fillRect(tx - 3 * z, ty - 7 * z, 6 * z, 7 * z);
      break;
    }
    case 'gnome': {
      const [bx, by] = P(x + 0.5, y + 0.5);
      g.fillStyle = '#3f6fb0'; g.beginPath(); g.ellipse(bx, by - 5 * z, 4.5 * z, 5.5 * z, 0, 0, TAU); g.fill();
      g.fillStyle = '#f7f3ea'; g.beginPath(); g.moveTo(bx - 4 * z, by - 9 * z); g.lineTo(bx + 4 * z, by - 9 * z); g.lineTo(bx, by - 2 * z); g.fill();
      g.fillStyle = '#f2c9a0'; g.beginPath(); g.arc(bx, by - 11 * z, 3 * z, 0, TAU); g.fill();
      g.fillStyle = '#d63a2f'; g.beginPath(); g.moveTo(bx - 4 * z, by - 12 * z); g.lineTo(bx + 4 * z, by - 12 * z); g.lineTo(bx + 1 * z, by - 22 * z); g.fill();
      break;
    }
    case 'birdbath': case 'sundial': {
      const [bx, by] = P(x + 0.5, y + 0.5), [tx, ty] = P(x + 0.5, y + 0.5, 0.8);
      g.fillStyle = '#c9c2b4'; g.fillRect(bx - 3 * z, ty, 6 * z, by - ty);
      g.fillStyle = '#b3ab9c'; g.beginPath(); g.ellipse(bx, by, 8 * z, 4 * z, 0, 0, TAU); g.fill();
      g.fillStyle = '#d6cfc1'; g.beginPath(); g.ellipse(tx, ty, 13 * z, 6.5 * z, 0, 0, TAU); g.fill();
      if (st.k === 'birdbath') { g.fillStyle = css(mix('#6aa0b8', skyColors(s.z)[1], 0.3)); g.beginPath(); g.ellipse(tx, ty, 10 * z, 4.6 * z, 0, 0, TAU); g.fill(); }
      else { g.fillStyle = '#8a7a50'; g.beginPath(); g.moveTo(tx - 1 * z, ty); g.lineTo(tx + 6 * z, ty - 1 * z); g.lineTo(tx, ty - 6 * z); g.fill(); }
      break;
    }
    case 'sprinkler': {
      const [bx, by] = P(x + 0.5, y + 0.5);
      g.fillStyle = '#3f6f9f'; g.fillRect(bx - 1.5 * z, by - 7 * z, 3 * z, 7 * z);
      g.fillStyle = '#9fb3c3'; g.beginPath(); g.arc(bx, by - 8 * z, 2.5 * z, 0, TAU); g.fill();
      break;
    }
    case 'beehive': {
      quadBox(g, x + 0.25, y + 0.25, x + 0.75, y + 0.75, 0, 0.6, '#f2e6c4', s);
      quadW(g, [[x + 0.2, y + 0.2, 0.6], [x + 0.8, y + 0.2, 0.6], [x + 0.8, y + 0.8, 0.6], [x + 0.2, y + 0.8, 0.6]], '#9a7a52');
      g.strokeStyle = 'rgba(120,100,60,0.4)'; g.lineWidth = 1 * z;
      for (const zz of [0.2, 0.4]) { g.beginPath(); g.moveTo(...P(x + 0.25, y + 0.75, zz)); g.lineTo(...P(x + 0.75, y + 0.75, zz)); g.lineTo(...P(x + 0.75, y + 0.25, zz)); g.stroke(); }
      break;
    }
    case 'statue': {
      quadBox(g, x + 0.25, y + 0.25, x + 0.75, y + 0.75, 0, 0.7, '#cfc8b8', s);
      const [tx, ty] = P(x + 0.5, y + 0.5, 0.7), st2 = '#e2dccd';
      g.fillStyle = st2;
      g.beginPath(); g.moveTo(tx - 7 * z, ty); g.quadraticCurveTo(tx - 9 * z, ty - 30 * z, tx - 4 * z, ty - 42 * z); g.lineTo(tx + 4 * z, ty - 42 * z); g.quadraticCurveTo(tx + 9 * z, ty - 30 * z, tx + 7 * z, ty); g.closePath(); g.fill();
      g.beginPath(); g.arc(tx, ty - 48 * z, 5.5 * z, 0, TAU); g.fill();
      g.strokeStyle = st2; g.lineWidth = 3 * z; g.beginPath(); g.moveTo(tx + 4 * z, ty - 38 * z); g.quadraticCurveTo(tx + 13 * z, ty - 46 * z, tx + 9 * z, ty - 56 * z); g.stroke();
      g.fillStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); g.moveTo(tx + 1 * z, ty); g.quadraticCurveTo(tx + 9 * z, ty - 30 * z, tx + 4 * z, ty - 42 * z); g.lineTo(tx + 7 * z, ty); g.fill();
      break;
    }
    case 'fountain': {
      const rx = (w * TW / 2 - 6) * z * 0.72, ry = rx * 0.5, [fx, fy] = P(x + w / 2, y + h / 2);
      g.fillStyle = '#b9b2a2'; g.beginPath(); g.ellipse(fx, fy, rx, ry, 0, 0, TAU); g.fill();
      g.fillStyle = '#a39b8b'; g.fillRect(fx - rx, fy - 8 * z, rx * 2, 8 * z);
      g.fillStyle = '#cfc8b8'; g.beginPath(); g.ellipse(fx, fy - 8 * z, rx, ry, 0, 0, TAU); g.fill();
      g.fillStyle = css(mix('#4f8fa0', skyColors(s.z)[1], 0.3)); g.beginPath(); g.ellipse(fx, fy - 8 * z, rx * 0.85, ry * 0.8, 0, 0, TAU); g.fill();
      g.fillStyle = '#cfc8b8'; g.fillRect(fx - 4 * z, fy - 40 * z, 8 * z, 32 * z);
      g.beginPath(); g.ellipse(fx, fy - 40 * z, 16 * z, 6 * z, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(220,240,255,0.75)'; g.lineWidth = 1.4 * z;
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * TAU + R.t * 0.3, ex = fx + Math.cos(a) * 15 * z, ey = fy - 40 * z + Math.sin(a) * 6 * z;
        g.beginPath(); g.moveTo(ex, ey); g.quadraticCurveTo(ex + Math.cos(a) * 8 * z, ey - 2 * z, ex + Math.cos(a) * 12 * z, fy - 8 * z + Math.sin(a) * ry * 0.5); g.stroke();
      }
      g.beginPath(); g.moveTo(fx, fy - 46 * z); g.lineTo(fx, fy - 58 * z - Math.sin(R.t * 6) * 2 * z); g.stroke();
      break;
    }
    case 'arch': {
      const wood = '#f1ece0';
      for (const yy of [y + 0.1, y + 0.9]) { g.strokeStyle = wood; g.lineWidth = 3 * z; g.beginPath(); g.moveTo(...P(x + 0.5, yy)); g.lineTo(...P(x + 0.5, yy, 1.9)); g.stroke(); }
      g.lineWidth = 3 * z; g.beginPath();
      for (let i = 0; i <= 10; i++) { const t = i / 10, [ax, ay] = P(x + 0.5, y + 0.1 + 0.8 * t, 1.9 + Math.sin(t * Math.PI) * 0.45); i ? g.lineTo(ax, ay) : g.moveTo(ax, ay); }
      g.stroke();
      break;
    }
    case 'pergola': {
      const wood = '#8a6644';
      if (part === 'post') { const [px, py] = st._post; g.strokeStyle = wood; g.lineWidth = 5 * z; g.beginPath(); g.moveTo(...P(px, py)); g.lineTo(...P(px, py, 2.4)); g.stroke(); break; }
      g.strokeStyle = css(shade(wood, -0.1)); g.lineWidth = 4 * z;
      for (const yy of [y + 0.1, y + h - 0.1]) { g.beginPath(); g.moveTo(...P(x - 0.1, yy, 2.4)); g.lineTo(...P(x + w + 0.1, yy, 2.4)); g.stroke(); }
      g.strokeStyle = wood; g.lineWidth = 3 * z;
      for (let i = 0; i < 6; i++) { const xx = x + 0.05 + i * (w - 0.1) / 5; g.beginPath(); g.moveTo(...P(xx, y - 0.1, 2.5)); g.lineTo(...P(xx, y + h + 0.1, 2.5)); g.stroke(); }
      break;
    }
    case 'greenhouse': drawGreenhouse(g, st, part, s); break;
  }
}
function quadBox(g, x0, y0, x1, y1, z0, z1, col, s) {
  quadW(g, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], shade(col, faceLight(0, 1, 0, s) - 1));
  quadW(g, [[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]], shade(col, faceLight(1, 0, 0, s) - 1.08));
  quadW(g, [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], shade(col, 0.08));
}
function drawGreenhouse(g, st, part, s) {
  const { x, y, w, h } = st, wh = 2.5, rh = 3.4, my = y + h / 2, frame = '#f2efe6';
  const glass = 'rgba(200,230,240,0.22)', glassD = 'rgba(170,210,225,0.3)';
  const q = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(...P(...p)) : g.moveTo(...P(...p)))); g.closePath(); g.fill(); };
  const line = (a, b) => { g.beginPath(); g.moveTo(...P(...a)); g.lineTo(...P(...b)); g.stroke(); };
  g.strokeStyle = frame; g.lineWidth = 1.8 * cam.z;
  if (part === 'back') {
    q([[x, y, 0], [x + w, y, 0], [x + w, y, wh], [x, y, wh]], glassD);
    q([[x, y, 0], [x, y + h, 0], [x, y + h, wh], [x, y, wh]], glassD);
    q([[x, my, rh], [x + w, my, rh], [x + w, y, wh], [x, y, wh]], glassD);
    for (let i = 0; i <= w; i++) line([x + i, y, 0], [x + i, y, wh]);
    for (let j = 0; j <= h; j++) line([x, y + j, 0], [x, y + j, wh]);
    line([x, y, wh], [x + w, y, wh]); line([x, y, wh], [x, y + h, wh]);
    return;
  }
  q([[x, y + h, 0], [x + w, y + h, 0], [x + w, y + h, wh], [x, y + h, wh]], glass);
  q([[x + w, y + h, 0], [x + w, y, 0], [x + w, y, wh], [x + w, y + h, wh]], glass);
  q([[x + w, y, wh], [x + w, my, rh], [x + w, y + h, wh]], glass);
  q([[x, my, rh], [x + w, my, rh], [x + w, y + h, wh], [x, y + h, wh]], 'rgba(220,240,250,0.28)');
  // reflejo del cielo
  g.fillStyle = 'rgba(255,255,255,0.18)';
  g.beginPath(); g.moveTo(...P(x + 0.3, y + h, 0.4)); g.lineTo(...P(x + 1.0, y + h, 0.4)); g.lineTo(...P(x + 1.6, y + h, wh - 0.2)); g.lineTo(...P(x + 0.9, y + h, wh - 0.2)); g.fill();
  for (let i = 0; i <= w; i++) { line([x + i, y + h, 0], [x + i, y + h, wh]); line([x + i, my, rh], [x + i, y + h, wh]); }
  for (let j = 0; j <= h; j++) line([x + w, y + j, 0], [x + w, y + j, wh]);
  line([x, y + h, wh], [x + w, y + h, wh]); line([x + w, y, wh], [x + w, y + h, wh]); line([x, my, rh], [x + w, my, rh]);
  line([x + w, y, wh], [x + w, my, rh]); line([x + w, my, rh], [x + w, y + h, wh]);
  line([x, y + h, 1.0], [x + w, y + h, 1.0]); line([x + w, y + h, 1.0], [x + w, y, 1.0]);
  // puerta
  g.fillStyle = 'rgba(255,255,255,0.25)'; q([[x + w, y + h / 2 - 0.4, 0], [x + w, y + h / 2 + 0.4, 0], [x + w, y + h / 2 + 0.4, 2.0], [x + w, y + h / 2 - 0.4, 2.0]], 'rgba(240,250,250,0.25)');
}
function drawShadeCloth(g, t) {
  const hz = 2.1, x = t.x, y = t.y;
  g.globalAlpha = 0.42;
  quadW(g, [[x, y, hz], [x + 1, y, hz], [x + 1, y + 1, hz], [x, y + 1, hz]], [40, 70, 50]);
  g.globalAlpha = 1;
  for (const [px, py] of [[x + 1, y + 1]]) {
    const n = tileAt(x + 1, y), m = tileAt(x, y + 1);
    if ((n && n.shade) || (m && m.shade)) continue;
    g.strokeStyle = '#7a6a58'; g.lineWidth = 2 * cam.z; g.beginPath(); g.moveTo(...P(px, py)); g.lineTo(...P(px, py, hz)); g.stroke();
  }
}
function drawSaleSign(g, i) {
  const p = PARCELS[i], x = (p.x0 + p.x1) / 2, y = (p.y0 + p.y1) / 2;
  const [bx, by] = P(x, y), [tx, ty] = P(x, y, 1.1), z = cam.z;
  g.strokeStyle = '#7a5a3a'; g.lineWidth = 3 * z; g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke();
  g.fillStyle = '#f4ead2'; g.strokeStyle = '#7a5a3a'; g.lineWidth = 2 * z;
  g.beginPath(); g.roundRect(tx - 26 * z, ty - 22 * z, 52 * z, 26 * z, 4 * z); g.fill(); g.stroke();
  g.fillStyle = '#6a3a2a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${7.5 * z}px ui-rounded, system-ui`; g.fillText(L().forSale, tx, ty - 15 * z);
  g.font = `800 ${9 * z}px ui-rounded, system-ui`; g.fillStyle = '#2f5a2a'; g.fillText(money(p.price), tx, ty - 5 * z);
}
function drawMailbox(g) {
  const [bx, by] = P(GATE_X - 0.6, GH + 0.25), [tx, ty] = P(GATE_X - 0.6, GH + 0.25, 1.0), z = cam.z;
  g.strokeStyle = '#5a4a3a'; g.lineWidth = 2.5 * z; g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke();
  g.fillStyle = '#2f5a8a'; g.beginPath(); g.roundRect(tx - 7 * z, ty - 9 * z, 14 * z, 9 * z, [4 * z, 4 * z, 1, 1]); g.fill();
  if (G.orders.some(o => !o.seen)) { g.fillStyle = '#e8463c'; g.fillRect(tx + 6 * z, ty - 14 * z, 2 * z, 9 * z); g.fillRect(tx + 6 * z, ty - 14 * z, 6 * z, 4 * z); }
}
function drawStreetLamp(g, x, s) {
  const [bx, by] = P(x, GH + 1.15), [tx, ty] = P(x, GH + 1.15, 3.0), z = cam.z;
  g.strokeStyle = '#4a5a50'; g.lineWidth = 2.2 * z; g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.quadraticCurveTo(tx, ty - 8 * z, tx - 8 * z, ty - 6 * z); g.stroke();
  g.fillStyle = nightness(s.z) > 0.2 ? '#fff0b8' : '#d0d0c8'; g.beginPath(); g.ellipse(tx - 9 * z, ty - 4 * z, 4 * z, 2.2 * z, 0, 0, TAU); g.fill();
}

// ---------- Plantas en pantalla ----------
const SPR_ZOOMS = [0.5, 0.71, 1, 1.41, 2];
let sprZ = 1, sprBudget = 0;
function quantZ(z) { return SPR_ZOOMS.reduce((b, v) => (Math.abs(Math.log(v / z)) < Math.abs(Math.log(b / z)) ? v : b)); }
function plantVS(p) {
  if (p._vsv !== VIS_VER || !p._vs) { p._vs = visualState(p); p._vsv = VIS_VER; }
  return p._vs;
}
// Las plantas se dibujan más grandes que su tamaño real para que se lean bien en el jardín
const plantScale = sp => (isTree(sp) ? 1.12 : sp.art.f === 'bush' || sp.art.f === 'topiary' || sp.art.f === 'vine' ? 1.4 : 1.65);
function plantSprite(p) {
  const vs = plantVS(p), key = vs.key + '|' + sprZ + '|' + DPR;
  if (p._spr && p._spr.key === key) return p._spr;
  if (p._spr && sprBudget <= 0) return p._spr;
  sprBudget--;
  const { cv, ox, oy } = renderPlantCanvas(spOf(p), vs, p.seed, PX_M * sprZ * DPR * plantScale(spOf(p)));
  p._spr = { key, cv, ox, oy, sil: null, z: sprZ };
  return p._spr;
}
function dropSprite(p) { if (p) p._vsv = -1; }

function plantFlex(sp) {
  const f = sp.art.f;
  return f === 'tree' ? 0.012 : f === 'cactus' || f === 'topiary' ? 0 : f === 'rosette' || f === 'aquatic' || f === 'ground' ? 0.02 : f === 'grass' || f === 'corn' || f === 'papyrus' ? 0.09 : 0.055;
}
function drawPlant(g, p) {
  const spr = plantSprite(p), sp = spOf(p);
  const [bx, by] = P(p.x + 0.5, p.y + 0.5);
  p._scr = [bx, by];
  const f = cam.z / spr.z, w = spr.cv.width / DPR * f, h = spr.cv.height / DPR * f;
  if (bx + w < 0 || bx - w > VW || by - h > VH + 40 || by + h < -40) return;
  // sombra de contacto
  const sz = plantSize(p), k0 = plantScale(sp), cw = Math.max(0.25, Math.min(sz.w * k0, 1.2)) * TW * 0.42 * cam.z;
  g.fillStyle = sp.water === 'aquatic' ? 'rgba(0,30,40,0.12)' : 'rgba(30,25,10,0.18)';
  g.beginPath(); g.ellipse(bx, by, cw, cw * 0.5, 0, 0, TAU); g.fill();
  const k = Math.sin(R.t * 1.6 + p.seed % 100) * R.wind * plantFlex(sp) * (p.dead ? 0.3 : 1);
  // un árbol se vuelve transparente si tapa la casilla que señala el cursor
  let fade = 1;
  const hv = R.hover || UI.sel;
  if (isTree(sp) && hv && hv.x + hv.y < p.x + p.y) {
    const [hx, hy] = P(hv.x + 0.5, hv.y + 0.5);
    if (Math.abs(hx - bx) < w * 0.45 && hy < by && hy > by - h * 0.95) fade = 0.35;
  }
  if (fade < 1) g.globalAlpha = fade;
  g.transform(f / DPR, 0, k * f / DPR, f / DPR, bx, by);
  g.drawImage(spr.cv, -spr.ox, -spr.oy);
  g.globalAlpha = 1;
  // si su casilla está a la sombra en este momento, la planta se ve más oscura
  const t = tileAt(p.x, p.y), str = R.sunStr;
  if (t && str > 0.05) {
    const lit = t.prof[Math.floor(G.hour * 2) % 48];
    if (lit < 0.7 && fade === 1) {
      if (!spr.sil) spr.sil = silhouette(spr.cv);
      g.globalAlpha = 0.3 * (1 - lit) * str; g.drawImage(spr.sil, -spr.ox, -spr.oy); g.globalAlpha = 1;
    }
  }
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  // indicadores sobre la planta
  if (p === R.sel) {
    g.strokeStyle = 'rgba(255,255,240,0.9)'; g.lineWidth = 2; g.setLineDash([4, 3]);
    g.beginPath(); g.ellipse(bx, by, cw + 4, (cw + 4) * 0.5, 0, 0, TAU); g.stroke(); g.setLineDash([]);
  }
  if (!UI.title && !COVER && tileAt(p.x, p.y).own) plantBadge(g, p, sp, bx, by - Math.min(h * 0.9, sz.h * k0 * ZS * cam.z + 14));
}
function plantBadge(g, p, sp, x, y) {
  let icon = null;
  if (p.dead) icon = '🥀';
  else if (canHarvest(p) && (sp.harv[0] !== 'flower' || UI.tool === 'harvest')) icon = '🧺';
  else if (p.pests) icon = '🐛';
  else if (p.wilt > 0.35) icon = '💧';
  else if (p.frostHit) icon = '❄️';
  if (!icon || cam.z < 0.6) return;
  const bob = Math.sin(R.t * 3 + p.id) * 2;
  g.fillStyle = 'rgba(255,252,240,0.92)'; g.beginPath(); g.arc(x, y + bob, 10, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(60,70,50,0.25)'; g.lineWidth = 1; g.stroke();
  g.font = '12px system-ui, "Apple Color Emoji"'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(icon, x, y + bob + 1);
}

// Busca la planta bajo el puntero (los árboles altos se pueden tocar en su copa)
function pickPlant(sx, sy) {
  let best = null, bd = 1e9;
  for (const p of G.plants) {
    if (!p._scr) continue;
    const [bx, by] = p._scr, sz = plantSize(p), k = plantScale(spOf(p)), hw = Math.max(0.3, sz.w * k * 0.5) * 45 * cam.z, hh = Math.max(0.25, sz.h * k) * ZS * cam.z;
    if (sx > bx - hw && sx < bx + hw && sy < by + 10 * cam.z && sy > by - hh) {
      const d = p.x + p.y;
      if (best === null || d > bd) { best = p; bd = d; }
    }
  }
  return best;
}

// ---------- Cuadro completo ----------
function drawWorld(dt) {
  R.t += dt;
  const s = sunNow();
  R.wind = clamp(0.25 + G.w.cloud * 0.4 + (G.w.storm ? 0.9 : G.w.rain ? 0.4 : 0) + Math.sin(R.t * 0.3) * 0.12, 0.1, 1.4);
  sprZ = quantZ(cam.z); sprBudget = COVER ? 9999 : 14; R.sunStr = sunStrength(s);
  if (TEX.z !== cam.z * DPR) buildTextures();
  const g = ctx;
  R.bubbles.length = 0;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawBackground(g, s);
  drawSlab(g);
  drawStreet(g);
  drawGround(g, s);
  drawLens(g);
  drawPreview(g);
  // sombras del sol (sobre el suelo)
  drawShadows(s);
  // las sombras solo caen sobre el terreno, no sobre el fondo
  g.save();
  g.beginPath(); g.moveTo(...P(0, 0)); g.lineTo(...P(GW, 0)); g.lineTo(...P(GW, GH + STREET)); g.lineTo(...P(0, GH + STREET)); g.closePath(); g.clip();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 0.32 * sunStrength(s) + 0.04;
  g.drawImage(shadowCv, 0, 0);
  g.restore();
  g.globalAlpha = 1;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawHover(g);
  drawBackFence(g);
  // todo lo que tiene altura, ordenado de atrás hacia adelante
  const items = [];
  items.push({ k: -10, f: () => drawHouse(g, s) });
  // el vidrio delantero del invernadero va después de lo que hay adentro y antes de lo que está delante
  const ghFront = st => st.x + st.w + st.y + st.h - 1.1;
  for (const p of G.plants) {
    let k = p.x + p.y + 1 + (spOf(p).water === 'aquatic' ? -0.5 : 0);
    const gh = tileAt(p.x, p.y).gh;
    if (gh) { const st = G.structs.find(s => s.id === gh); if (st) k = Math.min(k, ghFront(st) - 0.05); }
    items.push({ k, f: () => drawPlant(g, p) });
  }
  for (const st of G.structs) {
    if (st.k === 'greenhouse') {
      items.push({ k: st.x + st.y + 0.5, f: () => drawStruct(g, st, 'back', s) });
      items.push({ k: ghFront(st), f: () => drawStruct(g, st, 'front', s) });
    } else if (st.k === 'pergola') {
      for (const [px, py] of [[st.x + 0.1, st.y + 0.1], [st.x + st.w - 0.1, st.y + 0.1], [st.x + 0.1, st.y + st.h - 0.1], [st.x + st.w - 0.1, st.y + st.h - 0.1]])
        items.push({ k: px + py + 0.2, f: () => { st._post = [px, py]; drawStruct(g, st, 'post', s); } });
      items.push({ k: st.x + st.w + st.y + st.h + 0.1, f: () => drawStruct(g, st, 'top', s) });
    } else items.push({ k: st.x + st.w + st.y + st.h - 0.5, f: () => drawStruct(g, st, '', s) });
  }
  for (const t of G.tiles) if (t.shade) items.push({ k: t.x + t.y + 1.95, f: () => drawShadeCloth(g, t) });
  for (let x = 0; x < GW; x++) items.push({ k: x + 0.5 + GH + 0.02, f: () => fenceSegment(g, x) });
  PARCELS.forEach((p, i) => { if (!G.owned[i]) items.push({ k: (p.x0 + p.x1) / 2 + (p.y0 + p.y1) / 2 + 0.6, f: () => drawSaleSign(g, i) }); });
  items.push({ k: GATE_X - 0.6 + GH + 0.3, f: () => drawMailbox(g) });
  for (const x of [0.6, 11.5, 22.5]) items.push({ k: x + GH + 1.2, f: () => drawStreetLamp(g, x, s) });
  if (typeof visitorItems === 'function') visitorItems(items, g);
  if (typeof fxItems === 'function') fxItems(items, g);
  items.sort((a, b) => a.k - b.k);
  for (const it of items) it.f();
  // nubes que pasan, luz del día y lluvia
  if (typeof drawWeatherFx === 'function') drawWeatherFx(g, s, dt);
  drawGrade(g, s);
  if (typeof drawOverlayFx === 'function') drawOverlayFx(g, s, dt);
  for (const [x, y, b] of R.bubbles) drawBubble(g, x, y, b);
}

function drawGrade(g, s) {
  const night = nightness(s.z);
  let c = gradeColor(s.z);
  if (G.w.rain) c = mix(c, [190, 200, 210], 0.35);
  else c = mix(c, [215, 220, 228], G.w.cloud * 0.3);
  if (c[0] < 254 || c[1] < 254 || c[2] < 254) {
    g.globalCompositeOperation = 'multiply'; g.fillStyle = css(c); g.fillRect(0, 0, VW, VH);
    g.globalCompositeOperation = 'source-over';
  }
  if (night > 0.05) {
    g.globalCompositeOperation = 'lighter';
    const glow = (wx, wy, wz, r, col, a) => {
      const [x, y] = P(wx, wy, wz), rr = r * cam.z, gr = g.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, `rgba(${col},${a * night})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    };
    for (const [x, y, z] of [[1.4, HOUSE.y1, 1.7], [4.7, HOUSE.y1, 1.7], [HOUSE.x1, 1.4, 1.7], [HOUSE.x1, 3.6, 1.7]]) glow(x, y + 0.3, z, 60, '255,190,110', 0.35);
    glow(GATE_X + 0.75, HOUSE.y1 + 0.2, 2.0, 50, '255,210,140', 0.45);
    for (const st of G.structs) if (st.k === 'lantern') glow(st.x + 0.5, st.y + 0.5, 1.45, 70, '255,200,120', 0.5);
    for (const x of [0.6, 11.5, 22.5]) glow(x - 0.15, GH + 1.3, 3.1, 90, '255,225,160', 0.4);
    g.globalCompositeOperation = 'source-over';
  }
}
