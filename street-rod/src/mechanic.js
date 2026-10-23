// ===== El taller: el motor visto desde arriba (capó abierto) y el auto levantado visto desde abajo =====
// Haz clic en una pieza: se sueltan sus pernos uno por uno y sale al banco. Una pieza recién puesta se aprieta igual.
const BOLT_TIME = 0.14;
const Mech = { view: 'bay', queue: [], busy: 0, hover: null, rects: [], lift: null, msg: null, t: 0, turning: null };

const ENGINE_COLOR = { gm216: '#4a6a8a', gm235: '#4a6a8a', olds303: '#3a7a4a', gm265: '#d2552a', gm283: '#d2552a', gm348: '#d2552a', gm327: '#d2552a', gm409: '#d2552a',
  fd144: '#3a5fa8', fd223: '#3a5fa8', flat221: '#6a7a6a', flat255: '#6a7a6a', flat296: '#6a7a6a', fd292: '#3a5fa8', fd312: '#3a5fa8', fd390: '#3a5fa8', fd406: '#3a5fa8', fd427: '#3a5fa8',
  mp170: '#3a8a8a', mp225: '#3a8a8a', mp318: '#c84a2a', mp361: '#c84a2a', mp383: '#c84a2a', mp413: '#e86a1a', mp426: '#e86a1a' };

// Dónde va cada pieza en la vista, según el tipo de motor. Devuelve { slot: {x, y, w, h, bolts: [[x, y]...]} }
function bayLayout(car) {
  const eng = car.p.engine, kind = eng ? ENGINES[eng.k].kind : '8';
  const L = {};
  const boltsAround = (x, y, w, h, n) => {
    const out = [];
    if (n === 4) return [[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]];
    if (n === 2) return [[x + 10, y + h / 2], [x + w - 10, y + h / 2]];
    for (let i = 0; i < n / 2; i++) { const yy = y + 12 + (h - 24) * i / (n / 2 - 1); out.push([x + 8, yy], [x + w - 8, yy]); }
    return out;
  };
  if (kind === '6') {
    L.engine = { x: 330, y: 170, w: 210, h: 420 };
    L.cam = { x: 385, y: 128, w: 100, h: 40 };
    L.intake = { x: 245, y: 250, w: 90, h: 260 };
    L.exhaust = { x: 545, y: 210, w: 70, h: 340 };
    const n = car.p.intake ? INTAKES[car.p.intake.k].n : 1;
    const ys = n === 3 ? [290, 380, 470] : [380];
    for (let i = 0; i < 3; i++) L['carb' + i] = i < ys.length ? { x: 170, y: ys[i] - 42, w: 84, h: 84 } : null;
  } else {
    L.engine = { x: 300, y: 170, w: 260, h: 420 };
    L.cam = { x: 380, y: 128, w: 100, h: 40 };
    L.intake = { x: 340, y: 210, w: 180, h: 330 };
    L.exhaust = { x: 196, y: 210, w: 468, h: 340, split: 1 };
    const n = car.p.intake ? INTAKES[car.p.intake.k].n : 1;
    const ys = n === 3 ? [270, 375, 480] : n === 2 ? [315, 435] : [375];
    for (let i = 0; i < 3; i++) L['carb' + i] = i < ys.length ? { x: 384, y: ys[i] - 46, w: 92, h: 92 } : null;
  }
  for (const sl of BAY_SLOTS) if (L[sl]) {
    const r = L[sl];
    r.bolts = sl === 'exhaust' && r.split ? [[r.x + 20, 250], [r.x + 20, 380], [r.x + 20, 510], [r.x + r.w - 20, 250], [r.x + r.w - 20, 380], [r.x + r.w - 20, 510]]
      : sl === 'engine' ? [[r.x - 24, r.y + 60], [r.x + r.w + 24, r.y + 60], [r.x - 24, r.y + r.h - 60], [r.x + r.w + 24, r.y + r.h - 60]]
      : boltsAround(r.x, r.y, r.w, r.h, SLOT_INFO[sl].bolts);
  }
  return L;
}
function underLayout() {
  return {
    trans: { x: 380, y: 300, w: 100, h: 170, bolts: [[392, 312], [468, 312], [392, 458], [468, 458]] },
    axle: { x: 170, y: 560, w: 520, h: 70, bolts: [[400, 572], [460, 572], [400, 618], [460, 618]] },
    tires: { x: 110, y: 130, w: 640, h: 540, bolts: [[150, 200], [710, 200], [150, 600], [710, 600]], wheels: [[150, 200], [710, 200], [150, 600], [710, 600]] }
  };
}

function mechLayout(car) { return Mech.view === 'bay' ? bayLayout(car) : underLayout(); }

// ----- Dibujo -----
function drawMechanic(g, car, t) {
  Mech.t = t;
  // fondo: piso del taller
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#3a3530'); bg.addColorStop(1, '#1e1b18');
  g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 430, 360, 520, '#ffe0a8', 0.16); g.restore();
  if (!car) return;
  Mech.rects = [];
  if (Mech.view === 'bay') drawBay(g, car, t); else drawUnder(g, car, t);
  // pieza que va saliendo hacia el banco
  if (Mech.lift) {
    const L = Mech.lift, k = clamp((t - L.t) / 0.6, 0, 1);
    g.save(); g.globalAlpha = 1 - k; g.translate(L.x + (1000 - L.x) * k * k, L.y - 120 * k);
    g.fillStyle = '#9aa2ac'; roundRect(g, -30, -20, 60, 40, 8); g.fill(); g.restore();
    if (k >= 1) Mech.lift = null;
  }
  // nombre de la pieza bajo el mouse
  if (Mech.hover && car.p[Mech.hover.sl] && !Mech.queue.length) {
    const p = car.p[Mech.hover.sl], text = partName(p);
    g.font = font(15, 'bold', FONT_SANS);
    const w = g.measureText(text).width + 24, x = clamp(Mech.hover.x + 16, 8, 860 - w), y = Mech.hover.y - 40;
    g.fillStyle = 'rgba(10,10,14,0.85)'; roundRect(g, x, y, w, 30, 15); g.fill();
    g.fillStyle = '#ffd23a'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, x + 12, y + 15);
  }
}

function boltsOf(car, sl, r) {
  const tight = car.tight[sl] || 0;
  r.bolts.forEach(([bx, by], i) => {
    const turning = Mech.turning && Mech.turning.sl === sl && Mech.turning.i === i;
    drawBolt(Mech.g, bx, by, i < tight, turning ? Mech.t : null);
  });
}
function drawBolt(g, x, y, tight, spinT) {
  g.save(); g.translate(x, y);
  if (!tight) { g.fillStyle = 'rgba(255,80,60,0.35)'; g.beginPath(); g.arc(0, 0, 13, 0, TAU); g.fill(); }
  g.rotate(spinT !== null ? spinT * 18 : 0.3);
  g.fillStyle = tight ? '#b9c0c8' : '#e8e0c8';
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.lineTo(Math.cos(a) * 8, Math.sin(a) * 8); } g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1.2; g.stroke();
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
  if (spinT !== null) {
    g.fillStyle = '#7a828c'; roundRect(g, -6, -56, 12, 50, 5); g.fill();
    g.fillStyle = '#c22a2a'; roundRect(g, -7, -90, 14, 40, 6); g.fill();
  }
  g.restore();
}
function region(sl, r) { Mech.rects.push({ sl, x: r.x, y: r.y, w: r.w, h: r.h }); }
function selGlow(g, sl, r) {
  if (Mech.hover && Mech.hover.sl === sl) {
    g.save(); g.strokeStyle = '#ffd23a'; g.lineWidth = 3; g.setLineDash([8, 6]); roundRect(g, r.x - 6, r.y - 6, r.w + 12, r.h + 12, 12); g.stroke(); g.restore();
  }
}
function emptySlot(g, r, label) {
  g.save(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.setLineDash([6, 6]); g.lineWidth = 2; roundRect(g, r.x, r.y, r.w, r.h, 10); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.4)'; g.font = font(13, 'bold', FONT_SANS); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(label, r.x + r.w / 2, r.y + r.h / 2); g.restore();
}

function drawBay(g, car, t) {
  Mech.g = g;
  const P = L().parts, Lay = bayLayout(car);
  // vano del motor
  g.fillStyle = '#16140f'; roundRect(g, 120, 60, 620, 640, 40); g.fill();
  // tapabarros a los lados, del color del auto
  for (const x of [40, 740]) {
    const fg = g.createLinearGradient(x, 0, x + 80, 0);
    fg.addColorStop(0, css(shade(car.color, x < 400 ? -0.4 : 0.15))); fg.addColorStop(1, css(shade(car.color, x < 400 ? 0.15 : -0.4)));
    g.fillStyle = fg; roundRect(g, x, 40, 80, 680, 30); g.fill();
  }
  // radiador y ventilador
  g.fillStyle = '#2a2a2a'; g.fillRect(170, 66, 520, 52);
  g.strokeStyle = '#444'; g.lineWidth = 1; for (let x = 176; x < 686; x += 6) { g.beginPath(); g.moveTo(x, 70); g.lineTo(x, 114); g.stroke(); }
  g.fillStyle = '#9aa2ac'; g.fillRect(410, 60, 40, 10);
  // batería y cilindro de freno
  g.fillStyle = '#1a1a1a'; roundRect(g, 620, 600, 90, 70, 6); g.fill(); g.fillStyle = '#c22a2a'; g.fillRect(630, 606, 14, 10); g.fillStyle = '#333'; g.fillRect(686, 606, 14, 10);
  g.fillStyle = '#5a5a60'; roundRect(g, 160, 610, 70, 50, 10); g.fill();
  // pared de fuego
  g.fillStyle = css(shade(car.color, -0.5)); g.fillRect(120, 640, 620, 60);
  const eng = car.p.engine;
  // motor
  const E = Lay.engine;
  if (eng) {
    const col = ENGINE_COLOR[eng.k] || '#666', kind = ENGINES[eng.k].kind;
    g.fillStyle = css(shade(col, -0.35)); roundRect(g, E.x, E.y, E.w, E.h, 18); g.fill();
    g.fillStyle = '#1a1a1a'; roundRect(g, E.x - 30, E.y + 40, 30, 40, 6); g.fill(); roundRect(g, E.x + E.w, E.y + 40, 30, 40, 6); g.fill();
    g.fillStyle = '#222'; g.beginPath(); g.arc(E.x + E.w / 2, E.y - 10, 44, 0, TAU); g.fill();
    g.strokeStyle = '#555'; g.lineWidth = 6; for (let i = 0; i < 4; i++) { const a = t * 0 + i * TAU / 4; g.beginPath(); g.moveTo(E.x + E.w / 2, E.y - 10); g.lineTo(E.x + E.w / 2 + Math.cos(a) * 40, E.y - 10 + Math.sin(a) * 40); g.stroke(); }
    // tapas de válvulas
    const vc = (x, y, w, h) => {
      const vg = g.createLinearGradient(x, 0, x + w, 0); vg.addColorStop(0, css(shade(col, -0.2))); vg.addColorStop(0.4, css(shade(col, 0.25))); vg.addColorStop(1, css(shade(col, -0.3)));
      g.fillStyle = vg; roundRect(g, x, y, w, h, 14); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.18)'; for (let yy = y + 30; yy < y + h - 20; yy += 26) g.fillRect(x + 10, yy, w - 20, 3);
    };
    if (kind === '6') vc(E.x + 25, E.y + 10, E.w - 50, E.h - 20);
    else if (kind === 'F') { for (const x of [E.x - 6, E.x + E.w - 62]) { g.fillStyle = '#7a8a7a'; roundRect(g, x, E.y + 20, 68, E.h - 40, 10); g.fill(); g.fillStyle = '#c9ccd2'; for (let yy = E.y + 40; yy < E.y + E.h - 30; yy += 34) { g.beginPath(); g.arc(x + 20, yy, 5, 0, TAU); g.arc(x + 48, yy, 5, 0, TAU); g.fill(); } } }
    else { vc(E.x - 6, E.y + 20, 64, E.h - 40); vc(E.x + E.w - 58, E.y + 20, 64, E.h - 40); }
    g.fillStyle = '#ddd'; g.font = font(15, 'bold', FONT_SANS); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.save(); g.translate(E.x + E.w / 2, E.y + E.h - 20); g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillText(String(ENGINES[eng.k].ci), 0, 0); g.restore();
    // levas: se ven cuando no hay múltiple
    if (!car.p.intake) {
      g.fillStyle = '#2a2622'; roundRect(g, E.x + 50, E.y + 30, E.w - 100, E.h - 60, 10); g.fill();
      g.fillStyle = '#8a8478'; for (let yy = E.y + 50; yy < E.y + E.h - 40; yy += 30) { g.beginPath(); g.arc(E.x + E.w / 2 - 22, yy, 7, 0, TAU); g.arc(E.x + E.w / 2 + 22, yy, 7, 0, TAU); g.fill(); }
    }
  } else emptySlot(g, E, P.engine);
  region('engine', E); selGlow(g, 'engine', E);
  if (eng) boltsOf(car, 'engine', E);
  // tapa de distribución / árbol de levas
  const C = Lay.cam;
  if (car.p.cam) { g.fillStyle = car.p.cam.k === 'full' ? '#c22a2a' : '#e8b030'; roundRect(g, C.x, C.y, C.w, C.h, 10); g.fill(); g.fillStyle = '#fff'; g.font = font(11, 'bold', FONT_SANS); g.fillText(car.p.cam.k === 'full' ? 'RACE' : '3/4', C.x + C.w / 2, C.y + C.h / 2); }
  else if (eng) { g.fillStyle = '#5a5a60'; roundRect(g, C.x, C.y, C.w, C.h, 10); g.fill(); g.fillStyle = '#aaa'; g.font = font(10, 'bold', FONT_SANS); g.fillText('STOCK', C.x + C.w / 2, C.y + C.h / 2); }
  if (eng) { region('cam', C); selGlow(g, 'cam', C); if (car.p.cam) boltsOf(car, 'cam', C); }
  // escape
  const X = Lay.exhaust;
  if (car.p.exhaust) {
    const hdr = car.p.exhaust.k === 'hdr';
    const tubes = (x0, dir) => {
      for (let i = 0; i < (ENGINES[(eng || { k: 'gm283' }).k].kind === '6' ? 6 : 4); i++) {
        const y = 230 + i * (ENGINES[(eng || { k: 'gm283' }).k].kind === '6' ? 52 : 80);
        g.strokeStyle = hdr ? chromeGrad(g, y - 10, y + 10) : '#4a3a30'; g.lineWidth = hdr ? 14 : 22; g.lineCap = 'round';
        g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + dir * 40, y + 10, x0 + dir * 40, 580); g.stroke();
      }
    };
    if (X.split) { tubes(X.x + 60, -1); tubes(X.x + X.w - 60, 1); } else tubes(X.x + 10, 1);
    boltsOf(car, 'exhaust', X);
  } else if (eng) emptySlot(g, X.split ? { x: X.x, y: X.y, w: 60, h: X.h } : X, '');
  if (eng) { region('exhaust', X.split ? { x: X.x, y: X.y, w: 90, h: X.h } : X); Mech.rects.push({ sl: 'exhaust', x: X.x + X.w - 90, y: X.y, w: 90, h: X.h }); selGlow(g, 'exhaust', X.split ? { x: X.x, y: X.y, w: X.w, h: X.h } : X); }
  // múltiple de admisión
  const I = Lay.intake;
  if (car.p.intake) {
    const ig = g.createLinearGradient(I.x, 0, I.x + I.w, 0);
    const race = car.p.intake.k === 'race';
    ig.addColorStop(0, race ? '#8a8f96' : '#6a6e74'); ig.addColorStop(0.5, race ? '#d8dde2' : '#9aa0a8'); ig.addColorStop(1, race ? '#7a7f86' : '#5a5e64');
    g.fillStyle = ig; roundRect(g, I.x, I.y, I.w, I.h, 16); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2; for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(I.x + 10, I.y + I.h * i / 4); g.lineTo(I.x + I.w - 10, I.y + I.h * i / 4); g.stroke(); }
    boltsOf(car, 'intake', I);
  } else if (eng) emptySlot(g, I, P.intake);
  if (eng) { region('intake', I); selGlow(g, 'intake', I); }
  // carburadores con sus filtros de aire
  for (let i = 0; i < 3; i++) {
    const sl = 'carb' + i, R = Lay[sl];
    if (!R || !car.p.intake || i >= carbCount(car)) continue;
    const c = car.p[sl];
    if (c) {
      const four = c.k !== '2', r = four ? 44 : 34, cx = R.x + R.w / 2, cy = R.y + R.h / 2;
      g.fillStyle = '#7a6a50'; roundRect(g, cx - r * 0.7, cy - r * 0.7, r * 1.4, r * 1.4, 6); g.fill();
      const ag = g.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
      ag.addColorStop(0, '#ffffff'); ag.addColorStop(0.5, '#c4ccd4'); ag.addColorStop(0.85, '#6c757d'); ag.addColorStop(1, '#e6ebef');
      g.fillStyle = ag; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
      if (c.k === '4R') { g.strokeStyle = '#c22a2a'; g.lineWidth = 5; g.beginPath(); g.arc(cx, cy, r - 6, 0, TAU); g.stroke(); }
      g.fillStyle = '#d0d6dc'; g.beginPath(); g.arc(cx, cy, 8, 0, TAU); g.fill();
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.font = font(11, 'bold', FONT_SANS); g.fillText(c.k === '2' ? '2' : '4', cx, cy + r * 0.55);
      boltsOf(car, sl, R);
    } else emptySlot(g, R, '');
    region(sl, R); selGlow(g, sl, R);
  }
}

function drawUnder(g, car, t) {
  Mech.g = g;
  const Lay = underLayout(), P = L().parts;
  // el auto visto desde abajo
  g.fillStyle = css(shade(car.color, -0.6)); roundRect(g, 120, 60, 620, 640, 80); g.fill();
  g.fillStyle = '#1a1816'; roundRect(g, 150, 90, 560, 580, 60); g.fill();
  g.fillStyle = '#2c2a26'; g.fillRect(300, 80, 26, 600); g.fillRect(534, 80, 26, 600);
  // cárter del motor
  g.fillStyle = car.p.engine ? '#3a3a3e' : 'rgba(255,255,255,0.05)'; roundRect(g, 360, 110, 140, 170, 20); g.fill();
  // tubos de escape
  g.strokeStyle = '#4a4a4e'; g.lineWidth = 12;
  for (const x of [330, 530]) { g.beginPath(); g.moveTo(x, 260); g.lineTo(x, 520); g.quadraticCurveTo(x, 560, x + (x < 430 ? -40 : 40), 690); g.stroke(); }
  g.fillStyle = '#5a5a5e'; roundRect(g, 314, 380, 32, 90, 12); g.fill(); roundRect(g, 514, 380, 32, 90, 12); g.fill();
  // caja de cambios
  const T = Lay.trans;
  if (car.p.trans) {
    const auto = TRANS[car.p.trans.k].auto;
    g.fillStyle = auto ? '#8a8f96' : '#9aa0a8'; roundRect(g, T.x, T.y, T.w, T.h, 18); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = T.y + 30; y < T.y + T.h - 20; y += 22) g.fillRect(T.x + 14, y, T.w - 28, 4);
    g.fillStyle = '#333'; g.font = font(12, 'bold', FONT_SANS); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(TRANS_NAME[car.p.trans.f][car.p.trans.k].split(' ')[0], T.x + T.w / 2, T.y + T.h / 2);
    boltsOf(car, 'trans', T);
  } else emptySlot(g, T, P.trans);
  region('trans', T); selGlow(g, 'trans', T);
  // cardán
  g.fillStyle = '#5a5a5e'; g.fillRect(418, 470, 24, 100);
  // diferencial y eje trasero
  const A = Lay.axle;
  if (car.p.axle) {
    g.fillStyle = '#4a4a50'; roundRect(g, A.x, A.y + 22, A.w, 26, 13); g.fill();
    g.fillStyle = '#5a5a60'; g.beginPath(); g.arc(430, A.y + 35, 52, 0, TAU); g.fill();
    g.fillStyle = '#ddd'; g.font = font(16, 'bold', FONT_SANS); g.fillText(car.p.axle.k, 430, A.y + 35);
    boltsOf(car, 'axle', A);
  } else emptySlot(g, A, P.axle);
  region('axle', { x: 370, y: A.y - 20, w: 120, h: 110 }); selGlow(g, 'axle', { x: 370, y: A.y - 20, w: 120, h: 110 });
  // ruedas
  const tire = car.p.tires;
  for (const [i, [wx, wy]] of Lay.tires.wheels.entries()) {
    const r = { x: wx - 44, y: wy - 80, w: 88, h: 160 };
    if (tire) {
      const wide = tire.k === 'slick' || tire.k === 'wide';
      g.fillStyle = '#121214'; roundRect(g, r.x - (wide && wy > 400 ? 8 : 0), r.y, r.w + (wide && wy > 400 ? 16 : 0), r.h, 24); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 2;
      if (tire.k !== 'slick') for (let y = r.y + 12; y < r.y + r.h - 8; y += 14) { g.beginPath(); g.moveTo(r.x + 8, y); g.lineTo(r.x + r.w - 8, y); g.stroke(); }
      if (tire.k === 'ww') { g.fillStyle = '#efece2'; g.fillRect(wx < 430 ? r.x + r.w - 10 : r.x + 2, r.y + 20, 8, r.h - 40); }
      drawBolt(g, wx, wy, i < (car.tight.tires || 0), Mech.turning && Mech.turning.sl === 'tires' && Mech.turning.i === i ? t : null);
    } else emptySlot(g, r, '');
    region('tires', r);
    if (Mech.hover && Mech.hover.sl === 'tires') selGlow(g, 'tires', r);
  }
}

// ----- Interacción -----
function mechHit(x, y) { for (let i = Mech.rects.length - 1; i >= 0; i--) { const r = Mech.rects[i]; if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return r.sl; } return null; }
// Clic en una pieza: si está apretada se desarma y sale; si está suelta se aprieta.
function mechClick(car, sl) {
  if (!sl || Mech.queue.length) return null;
  const p = car.p[sl];
  if (!p) return null;
  const n = SLOT_INFO[sl].bolts, tight = car.tight[sl] || 0;
  if (tight >= n) {
    const b = blockers(car, sl);
    if (b.length) return { blocked: b };
    for (let i = n - 1; i >= 0; i--) Mech.queue.push({ sl, op: 'loosen', i });
    Mech.queue.push({ sl, op: 'remove' });
  } else {
    for (let i = tight; i < n; i++) Mech.queue.push({ sl, op: 'tighten', i });
  }
  Mech.busy = 0;
  return { ok: true };
}
// Avanza la animación de los pernos. Devuelve true si algo cambió (para refrescar la pantalla).
function mechUpdate(car, dt) {
  if (!Mech.queue.length) { Mech.turning = null; return false; }
  Mech.busy += dt;
  const job = Mech.queue[0];
  Mech.turning = job.op === 'remove' ? null : job;
  if (Mech.busy < (job.op === 'remove' ? 0.2 : BOLT_TIME)) return false;
  Mech.busy = 0;
  Mech.queue.shift();
  if (job.op === 'loosen') { loosenBolt(car, job.sl); Sound.sfx.ratchet(); }
  else if (job.op === 'tighten') { tightenBolt(car, job.sl); Sound.sfx.ratchet(); if (car.tight[job.sl] >= SLOT_INFO[job.sl].bolts) _etCache.clear(); }
  else if (job.op === 'remove') {
    const r = mechLayout(car)[job.sl] || { x: 430, y: 400, w: 0, h: 0 };
    if (removePart(car, job.sl)) { Mech.lift = { x: r.x + r.w / 2, y: r.y + r.h / 2, t: Mech.t }; Sound.sfx.clunk(); }
  }
  return !Mech.queue.length || job.op === 'remove';
}

// Gráfico del dinamómetro: potencia y torque según las rpm
function drawDyno(g, car, w, h) {
  g.clearRect(0, 0, w, h);
  g.fillStyle = '#10141a'; g.fillRect(0, 0, w, h);
  if (!car || !car.p.engine) return;
  const s = carStats(car), veh = new Vehicle(s), top = s.red + 800;
  g.strokeStyle = 'rgba(120,255,170,0.12)'; g.lineWidth = 1;
  for (let r = 1000; r < top; r += 1000) { const x = r / top * w; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  const maxHp = s.hp * 1.05;
  const curve = (fn, col) => {
    g.strokeStyle = col; g.lineWidth = 2.5; g.beginPath();
    for (let x = 0; x <= w; x += 3) { const rpm = Math.max(IDLE, x / w * top), y = h - 8 - fn(rpm) / maxHp * (h - 22); x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke();
  };
  curve(rpm => veh.torque(rpm) * rpm * TAU / 60 / 745.7 / NET, '#ffd23a');
  curve(rpm => veh.torque(rpm) * 0.7376 * 0.75, '#5fe8ff');
  g.fillStyle = 'rgba(212,42,30,0.25)'; g.fillRect(s.red / top * w, 0, w, h);
  g.fillStyle = '#ffd23a'; g.font = font(12, 'bold', FONT_SANS); g.textAlign = 'left'; g.fillText(`${Math.round(s.hp)} HP`, 8, 16);
  g.fillStyle = '#5fe8ff'; g.fillText(LANG === 'es' ? 'torque' : 'torque', 8, 32);
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.textAlign = 'right'; g.fillText(`${Math.round(s.red)} rpm`, w - 6, 16);
}
