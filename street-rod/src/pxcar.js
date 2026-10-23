// ===== Autos en pixel art: de lado (garaje, drive-in, diario) y de atrás (carreras) =====
// Usa las siluetas de ART (carart.js) pero las pinta como sprite de los 80: bandas de color, brillos duros,
// cromados de tres tonos, vidrio con reflejos, contorno negro y tramado.

// Rampa de 4 tonos para la pintura de un auto: los tonos de su misma familia en la paleta (así no queda tramada entera)
const PAL_FAMILIES = [
  ['k', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'w'], ['r1', 'r2', 'r3', 'r4', 'm4'], ['m1', 'm2', 'm3', 'm4', 'w'], ['r1', 'o1', 'o2', 'o3', 'y3'],
  ['b2', 'y1', 'y2', 'y3', 'w'], ['b1', 'b2', 'b3', 'b4', 'b5', 'c1'], ['e1', 'e2', 'e3', 'e4', 'c1'], ['t1', 't2', 't3', 't4', 'w'],
  ['u1', 'u2', 'u3', 'u4', 'w'], ['u1', 'p1', 'p2', 'p3', 'm4'], ['g4', 'g5', 'c2', 'c1', 'w']
];
function paintRamp(color) {
  const c = rgbOf(color);
  const idx = QLUT[((c[0] >> 3) << 10) | ((c[1] >> 3) << 5) | (c[2] >> 3)];
  const key = Object.keys(PAL)[idx];
  // la familia donde ese tono está en el medio de la rampa (no como extremo prestado)
  const fam = PAL_FAMILIES.find(f => f.indexOf(key) > 0 && f.indexOf(key) < f.length - 1) || PAL_FAMILIES.find(f => f.includes(key));
  const i = fam.indexOf(key), at = j => PAL[fam[clamp(j, 0, fam.length - 1)]];
  return { dk: at(i - 1), md: at(i), lt: at(i + 1), hi: at(i + 2) };
}
const CHROME = ['#ffffff', '#d8d8dc', '#8a8a96', '#3a3a46'];

function chromeBand(g, y0, y1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#d8d8dc'); gr.addColorStop(0.5, '#5c5c6a'); gr.addColorStop(0.62, '#b4b4bc'); gr.addColorStop(1, '#8a8a96');
  return gr;
}

// Llanta en pixel art: neumático, banda blanca, tapa cromada con detalles
function pxWheel(g, cx, cy, r, style, ww, body) {
  g.fillStyle = PAL.g1; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.strokeStyle = PAL.g2; g.lineWidth = Math.max(1, r * 0.08); g.beginPath(); g.arc(cx, cy, r * 0.9, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
  if (ww) {
    g.fillStyle = PAL.w; g.beginPath(); g.arc(cx, cy, r * 0.8, 0, TAU); g.fill();
    g.fillStyle = PAL.g6; g.beginPath(); g.arc(cx, cy, r * 0.8, 0.2, Math.PI - 0.2); g.fill();
    g.fillStyle = PAL.g1; g.beginPath(); g.arc(cx, cy, r * 0.62, 0, TAU); g.fill();
  }
  const rr = r * (ww ? 0.6 : 0.66);
  if (style === 'mags') {
    g.fillStyle = PAL.g6; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill();
    g.fillStyle = PAL.g2; g.beginPath(); g.arc(cx, cy, rr * 0.82, 0, TAU); g.fill();
    g.fillStyle = PAL.g5;
    for (let i = 0; i < 5; i++) {
      g.save(); g.translate(cx, cy); g.rotate(i * TAU / 5 + 0.3);
      g.beginPath(); g.moveTo(-rr * 0.14, 0); g.lineTo(-rr * 0.22, rr * 0.8); g.lineTo(rr * 0.22, rr * 0.8); g.lineTo(rr * 0.14, 0); g.fill();
      g.restore();
    }
    g.fillStyle = PAL.w; g.beginPath(); g.arc(cx, cy, rr * 0.22, 0, TAU); g.fill();
  } else if (style === 'moons') {
    g.fillStyle = PAL.g5; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill();
    g.fillStyle = PAL.g6; g.beginPath(); g.arc(cx - rr * 0.1, cy - rr * 0.1, rr * 0.78, 0, TAU); g.fill();
    g.fillStyle = PAL.w; g.beginPath(); g.arc(cx - rr * 0.3, cy - rr * 0.32, rr * 0.28, 0, TAU); g.fill();
  } else {
    // llanta pintada con tapa cromada de radios
    g.fillStyle = body.dk; g.beginPath(); g.arc(cx, cy, rr, 0, TAU); g.fill();
    g.fillStyle = PAL.g5; g.beginPath(); g.arc(cx, cy, rr * 0.8, 0, TAU); g.fill();
    g.fillStyle = PAL.g6; g.beginPath(); g.arc(cx - rr * 0.08, cy - rr * 0.08, rr * 0.62, 0, TAU); g.fill();
    g.strokeStyle = PAL.g4; g.lineWidth = Math.max(1, rr * 0.07);
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.beginPath(); g.moveTo(cx + Math.cos(a) * rr * 0.25, cy + Math.sin(a) * rr * 0.25); g.lineTo(cx + Math.cos(a) * rr * 0.7, cy + Math.sin(a) * rr * 0.7); g.stroke(); }
    g.fillStyle = PAL.w; g.beginPath(); g.arc(cx - rr * 0.18, cy - rr * 0.2, rr * 0.2, 0, TAU); g.fill();
    g.fillStyle = PAL.r3; g.beginPath(); g.arc(cx, cy, rr * 0.1, 0, TAU); g.fill();
  }
}

// El conductor visto de lado a través de la ventana
function pxDriver(g, x, y, s, look, flip) {
  const L = look || { skin: '#f4c8a0', hc: '#3a2010', top: '#1c3ca8' };
  g.save(); g.translate(x, y); g.scale(flip ? -s : s, s);
  g.fillStyle = L.top; g.beginPath(); g.ellipse(0, 7, 6, 5, 0, Math.PI, 0); g.fill();
  g.fillStyle = L.skin; g.fillRect(-1.5, 0, 3, 4);
  g.beginPath(); g.ellipse(0.5, -3, 3.4, 4, 0, 0, TAU); g.fill();
  g.fillStyle = L.hc; g.beginPath(); g.ellipse(-0.5, -5.2, 4, 2.6, 0, 0, TAU); g.fill();
  g.fillRect(-3.6, -5, 2, 4);
  if (L.shades) { g.fillStyle = PAL.k; g.fillRect(1.2, -3.8, 2.6, 1.4); }
  else { g.fillStyle = PAL.k; g.fillRect(2.2, -3.6, 1, 1); }
  // manos al volante
  g.strokeStyle = PAL.k; g.lineWidth = 1.2; g.beginPath(); g.ellipse(7, 2, 1.2, 4.2, 0.35, 0, TAU); g.stroke();
  g.fillStyle = L.skin; g.fillRect(5.5, 1, 2.4, 2);
  g.restore();
}

// Auto de lado en pixel art. size = largo en píxeles. o: { flip, driver: look }
function pxCarSide(car, size, o = {}) {
  const key = JSON.stringify(['side', car.model, car.color, car.mods, car.p && car.p.tires && car.p.tires.k, size, o.flip, o.driver || 0]);
  const hit = PXCACHE.get(key);
  if (hit) return hit;
  const A = ART[car.model], M = MODELS[car.model], mods = car.mods || {}, stickers = mods.stickers || {};
  const s = size / 100;
  const h = Math.ceil(42 * s), w = Math.ceil(104 * s);
  const ramp = paintRamp(car.color), roofRamp = M.roof && !mods.noroof ? paintRamp(M.roof) : ramp;
  const tiresK = car.p && car.p.tires ? car.p.tires.k : M.stock.tires;
  const ww = tiresK === 'ww', slick = tiresK === 'slick';
  const crisp = M.year >= 1957 ? 0.28 : 0.5, belt = A.belt;
  // sin techo: se corta todo lo que está sobre la cintura y quedan el parabrisas y los asientos
  const open = A.open || mods.noroof;
  const sprite = pixelSprite(w, h, g => {
    g.save();
    g.translate(o.flip ? w : 0, h);
    g.scale(o.flip ? -s : s, -s);
    g.translate(2, 1.5);
    const wr = A.wr * 1.08, wrR = (A.wrRear || A.wr) * 1.08 * (slick ? 1.06 : 1);
    const [fx, rx] = A.wheels;
    const cut = () => { if (mods.noroof && !A.open) { g.beginPath(); g.rect(-10, -10, 120, belt + 10.6); g.clip(); } };
    // techo y ventanas: interior oscuro, conductor y vidrio con reflejos
    if (!open && A.cabin) { polyPath(g, A.cabin, true, crisp); g.fillStyle = roofRamp.md; g.fill(); g.save(); g.clip(); g.fillStyle = roofRamp.hi; g.fillRect(0, belt + 9.6, 100, 0.8); g.restore(); }
    const drawGlass = () => {
      g.fillStyle = PAL.u1;
      for (const gl of A.glass) { polyPath(g, gl, true, crisp); g.fill(); }
      g.save(); g.beginPath(); for (const gl of A.glass) splinePath(g, gl, true, crisp); g.clip();
      g.fillStyle = PAL.g1; g.fillRect(30, belt - 1, 40, 6);
      if (o.driver) { g.save(); g.scale(1, -1); pxDriver(g, 55, -(belt + 5.5), 0.62, o.driver, false); g.restore(); }
      g.fillStyle = 'rgba(140,180,255,0.55)'; g.fillRect(0, belt + 6, 100, 6);
      g.fillStyle = 'rgba(168,255,244,0.9)';
      for (const gx of [A.glass[0][0][0] - 4, A.glass[0][0][0] - 13]) { g.beginPath(); g.moveTo(gx, belt); g.lineTo(gx + 3, belt); g.lineTo(gx - 4, belt + 12); g.lineTo(gx - 7, belt + 12); g.fill(); }
      g.restore();
      g.strokeStyle = PAL.g5; g.lineWidth = 0.55;
      for (const gl of A.glass) { polyPath(g, gl, true, crisp); g.stroke(); }
    };
    if (!open && A.glass && A.cabin) drawGlass();
    if (open) {
      // asientos, capota plegada, conductor y parabrisas
      const seat = A.seat || [[38, belt, 1], [38.8, belt + 4.6], [42, belt + 5.6], [48, belt + 5], [49, belt, 1]];
      if (A.top) { polyPath(g, A.top, true); g.fillStyle = PAL.b4; g.fill(); }
      polyPath(g, seat, true); g.fillStyle = PAL.b2; g.fill();
      if (o.driver) { g.save(); g.scale(1, -1); pxDriver(g, 52, -(belt + 4.4), 0.62, o.driver, false); g.restore(); }
      let sh = A.shield;
      if (!sh && A.cabin) { const [b, t] = [A.cabin[0], A.cabin[1]]; sh = [[b[0], b[1]], [b[0] - (b[0] - t[0]) * 0.6, belt + 6], [b[0] - (b[0] - t[0]) * 0.6 - 1.8, belt + 6], [b[0] - 1.8, b[1]]]; }
      if (!sh) sh = [[63, belt + 0.4], [60, belt + 7], [58.2, belt + 7], [61.2, belt + 0.4]];
      polyPath(g, sh); g.fillStyle = PAL.g6; g.fill();
    }
    // carrocería: tono medio, mitad de abajo oscura (refleja el suelo), banda clara y brillo arriba
    g.save(); cut();
    if (A.frame) { g.strokeStyle = PAL.g1; g.lineWidth = 1.6; g.beginPath(); g.moveTo(...A.frame[0]); g.lineTo(...A.frame[1]); g.stroke(); }
    polyPath(g, A.body, true);
    g.fillStyle = ramp.md; g.fill();
    g.save(); g.clip();
    g.fillStyle = ramp.dk; g.fillRect(-5, -5, 110, belt - 8.5 + 5);
    const sg = g.createLinearGradient(0, belt - 6.5, 0, belt - 9);
    sg.addColorStop(0, ramp.md); sg.addColorStop(1, ramp.dk);
    g.fillStyle = sg; g.fillRect(-5, belt - 9, 110, 2.5);
    g.fillStyle = ramp.lt; g.fillRect(-5, belt - 3.2, 110, 2.6);
    g.fillStyle = ramp.hi; g.fillRect(-5, belt - 0.8, 110, 1.2);
    if (!A.cabin && !open) { g.fillStyle = roofRamp.hi; g.fillRect(-5, belt + 8, 110, 1); }
    g.restore();
    // en los autos con el techo en la misma pieza, el vidrio va encima de la carrocería
    if (!open && A.glass && !A.cabin) drawGlass();
    g.save(); polyPath(g, A.body, true); g.clip();
    if (stickers.flames) drawFlames(g, A, car.color);
    if (stickers.checker) { for (let x = -4; x < 104; x += 2) for (let r = 0; r < 2; r++) { g.fillStyle = ((x / 2) + r) % 2 ? PAL.k : PAL.w; g.fillRect(x, 6.4 + r * 1.2, 2, 1.2); } }
    if (stickers.lightning) { g.fillStyle = PAL.y2; g.beginPath(); g.moveTo(92, belt - 6); g.lineTo(60, belt - 5); g.lineTo(64, belt - 8.5); g.lineTo(20, belt - 8); g.lineTo(58, belt - 10.4); g.lineTo(54, belt - 7.6); g.closePath(); g.fill(); }
    g.restore();
    // paneles especiales del modelo
    if (A.cove) { polyPath(g, A.cove, true); g.fillStyle = luma(car.color) > 0.7 ? PAL.r3 : PAL.c1; g.fill(); }
    if (A.wedge) { polyPath(g, A.wedge); g.fillStyle = PAL.g6; g.fill(); g.strokeStyle = PAL.g4; g.lineWidth = 0.3; for (let xx = 5; xx < 52; xx += 2) { g.beginPath(); g.moveTo(xx, 10); g.lineTo(xx, 19); g.stroke(); } }
    if (A.gold) { polyPath(g, A.gold); g.fillStyle = PAL.y2; g.fill(); }
    if (A.hood) { g.fillStyle = PAL.k; for (let row = 0; row < 3; row++) for (let lx = A.hood[0] + 3; lx < A.hood[1] - 2; lx += 1.8) g.fillRect(lx, 15.5 + row * 2.6, 0.7, 1.8); }
    if (A.scoop) { polyPath(g, A.scoop, true); g.fillStyle = ramp.lt; g.fill(); }
    // salpicaderas sueltas de los autos antiguos
    if (A.fenders) {
      for (const f of A.fenders) { polyPath(g, f, true); g.fillStyle = ramp.md; g.fill(); g.save(); g.clip(); g.fillStyle = ramp.dk; g.fillRect(0, 0, 100, 12.5); g.fillStyle = ramp.hi; g.fillRect(0, 19, 100, 1); g.restore(); }
      g.fillStyle = PAL.g1; polyPath(g, A.board); g.fill();
      g.fillStyle = PAL.g5; g.fillRect(A.board[0][0], 9.4, A.board[1][0] - A.board[0][0], 0.7);
    }
    if (A.grille) { polyPath(g, A.grille); g.fillStyle = PAL.g6; g.fill(); }
    if (A.pipes) { g.fillStyle = PAL.g6; g.fillRect(30, 9.6, 46, 1.8); g.fillStyle = PAL.w; g.fillRect(30, 10.8, 46, 0.6); }
    g.strokeStyle = 'rgba(0,0,0,0.85)'; g.lineWidth = 0.45;
    for (const d of A.doors) { g.beginPath(); g.moveTo(...d[0]); g.lineTo(...d[1]); g.stroke(); }
    if (A.handle) { g.fillStyle = PAL.w; g.fillRect(A.handle[0], A.handle[1] - 0.4, 2.6, 0.8); }
    for (const t of A.trims) {
      g.strokeStyle = PAL.g4; g.lineWidth = 0.9; g.beginPath(); g.moveTo(t[0][0], t[0][1] - 0.35); for (let i = 1; i < t.length; i++) g.lineTo(t[i][0], t[i][1] - 0.35); g.stroke();
      g.strokeStyle = PAL.w; g.lineWidth = 0.55; g.beginPath(); g.moveTo(...t[0]); for (let i = 1; i < t.length; i++) g.lineTo(...t[i]); g.stroke();
    }
    if (A.vents) for (const [vx, vy] of A.vents) { g.strokeStyle = PAL.g6; g.lineWidth = 0.7; g.beginPath(); g.moveTo(vx, vy); g.lineTo(vx + 1.6, vy + 3.2); g.stroke(); }
    if (A.ornaments) for (const [ox, oy] of A.ornaments) { g.fillStyle = PAL.w; g.fillRect(ox - 1.4, oy, 2.8, 0.8); }
    if (A.badge) { g.fillStyle = PAL.r3; g.fillRect(A.badge[0], A.badge[1], 2, 0.9); }
    // huecos de las ruedas
    if (!A.highboy) {
      g.save(); polyPath(g, A.body, true); if (A.fenders) for (const f of A.fenders) splinePath(g, f, true); g.clip();
      g.fillStyle = PAL.k;
      for (const [wx, wrr] of [[fx, wr], [rx, wrR]]) { g.beginPath(); g.arc(wx, wrr, wrr * 1.14, 0, TAU); g.fill(); }
      g.restore();
    }
    g.restore();
    // ruedas (con slicks, llantas de carrera)
    pxWheel(g, fx, wr, wr, slick ? 'mags' : 'caps', ww, ramp);
    pxWheel(g, rx, wrR, wrR, slick ? 'mags' : 'caps', ww, ramp);
    if (A.skirts) {
      g.save(); polyPath(g, A.body, true); g.clip();
      g.fillStyle = ramp.md; g.fillRect(rx - wr * 1.2, 4, wr * 2.4, 24);
      g.fillStyle = ramp.dk; g.fillRect(rx - wr * 1.2, 4, wr * 2.4, belt - 14.5);
      g.restore();
      g.fillStyle = PAL.g6; g.fillRect(rx - wr * 1.15, 6, wr * 2.3, 0.8);
    }
    // faros y focos traseros
    if (A.head) { const [hx, hy, hr] = A.head; g.fillStyle = PAL.g5; g.beginPath(); g.ellipse(hx, hy, hr * 0.6, hr * 1.05, 0, 0, TAU); g.fill(); g.fillStyle = PAL.y3; g.beginPath(); g.ellipse(hx + hr * 0.2, hy, hr * 0.32, hr * 0.78, 0, 0, TAU); g.fill(); }
    if (A.lamp) { const [lx, ly, lr] = A.lamp; g.strokeStyle = PAL.g1; g.lineWidth = 0.8; g.beginPath(); g.moveTo(lx - 1, ly - lr); g.lineTo(lx - 2.6, 13); g.stroke(); g.fillStyle = PAL.g6; g.beginPath(); g.ellipse(lx, ly, lr * 0.8, lr, 0, 0, TAU); g.fill(); g.fillStyle = PAL.y3; g.beginPath(); g.ellipse(lx + lr * 0.45, ly, lr * 0.3, lr * 0.75, 0, 0, TAU); g.fill(); }
    if (A.tail) { polyPath(g, A.tail); g.fillStyle = PAL.r3; g.fill(); }
    // parachoques cromados
    if (!mods.nobump) for (const b of [A.bumpF, A.bumpR]) {
      polyPath(g, b, true);
      const ys = b.map(p => p[1]);
      g.fillStyle = chromeBand(g, Math.max(...ys), Math.min(...ys)); g.fill();
    }
    g.restore();
  }, { dither: 30 });
  // calcomanías sobre la puerta, en píxeles (después de pasar a la paleta)
  const sg = sprite.getContext('2d');
  if (sg && (stickers.hotrod || stickers.star || stickers.number)) {
    const door = A.doors.length > 1 ? (A.doors[0][0][0] + A.doors[1][0][0]) / 2 : 50;
    const px = mx => Math.round(o.flip ? w + 1 - (mx + 2) * s : (mx + 2) * s + 1), py = my => Math.round(h + 1 - (my + 1.5) * s);
    const cx = px(door), cy = py(belt - 7);
    const sc = Math.max(1, Math.round(size / 220));
    if (stickers.hotrod) { ptext(sg, 'HOT ROD', cx, cy - 4 * sc, PAL.y2, sc, { align: 'center', shadow: PAL.r3 }); }
    else if (stickers.number) { sg.fillStyle = PAL.w; sg.beginPath(); sg.arc(cx, cy, 7 * sc, 0, TAU); sg.fill(); ptext(sg, '7', cx, cy - 6 * sc, PAL.k, sc, { align: 'center' }); }
    if (stickers.star) {
      const sx = cx + (stickers.hotrod || stickers.number ? 30 * sc : 0) * (o.flip ? -1 : 1);
      sg.fillStyle = PAL.y2; sg.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? 3.5 : 8) * sc; sg.lineTo(sx + Math.cos(a) * r, cy + Math.sin(a) * r); }
      sg.fill(); sg.fillStyle = PAL.y3; sg.fillRect(sx - sc, cy - sc, 2 * sc, 2 * sc);
    }
  }
  PXCACHE.set(key, sprite);
  if (PXCACHE.size > 160) PXCACHE.delete(PXCACHE.keys().next().value);
  return sprite;
}
const PXCACHE = new Map();

// Auto de atrás (carreras): lo mismo que drawCarRear pero pasado a pixel art y cacheado por tamaño
function pxCarRear(car, w, brake) {
  const key = JSON.stringify(['rear', car.model, car.color, car.mods, car.p && car.p.tires && car.p.tires.k, w, !!brake]);
  let hit = PXCACHE.get(key);
  if (hit) return hit;
  const h = Math.ceil(w * 0.82);
  hit = pixelSprite(w, h, g => drawCarRear(g, car, w / 2, h - 2, w * 0.96, { light: 0.95, brake, plate: 'HOT 63', flat: 1 }), { dither: 26 });
  PXCACHE.set(key, hit);
  return hit;
}
