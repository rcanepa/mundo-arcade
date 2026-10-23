// ===== La carrera: camino, semáforo y la cabina con los relojes dentro del volante =====
const PX_HORIZON = 118, PX_CAM_D = 1.25;

// Franja de cerros rojizos en el horizonte (como en el original), del doble del ancho para moverla con las curvas
const pxHills = (() => {
  let c = null;
  return () => {
    if (c) return c;
    c = makeCanvas(PW * 2 * RES, 40 * RES); c.lw = PW * 2; c.lh = 40;
    const g = c.getContext('2d');
    g.scale(RES, RES);
    const R = rng(11);
    for (let layer = 0; layer < 3; layer++) {
      g.fillStyle = [PAL.r1, PAL.b2, PAL.o1][layer];
      g.beginPath(); g.moveTo(0, 40);
      for (let x = 0; x <= PW * 2; x += 6) g.lineTo(x, 40 - (8 + layer * 4) - Math.abs(Math.sin(x * 0.013 + layer * 2) * 10) - R() * 6 * (layer + 1) / 2);
      g.lineTo(PW * 2, 40); g.fill();
    }
    // puntitos de matorrales verdes y rojos
    for (let i = 0; i < 260; i++) { g.fillStyle = R() < 0.5 ? PAL.e2 : PAL.r2; g.fillRect(Math.floor(R() * PW * 2), 22 + Math.floor(R() * 18), 2, 1); }
    return c;
  };
})();

// El camino visto desde el asiento: cielo negro con estrellas, cerros, pasto verde, asfalto negro con la línea al centro
function pxRenderRoad(g, T, cam, objs, t) {
  const baseI = Math.floor(cam.z / SEG), baseF = cam.z / SEG - baseI;
  const camY = heightAt(T, cam.z) + CAM_H;
  const base = T.segs[clamp(baseI, 0, T.segs.length - 1)];
  const sky = g.createLinearGradient(0, 0, 0, PX_HORIZON + 4);
  sky.addColorStop(0, '#04050d'); sky.addColorStop(0.6, '#121634'); sky.addColorStop(1, '#3a2848');
  g.fillStyle = sky; g.fillRect(0, 0, PW, PX_HORIZON + 4);
  stars(g, 0, 0, PW, PX_HORIZON - 30, 80, 5);
  g.fillStyle = '#f4ecd0'; g.beginPath(); g.arc(520 - (cam.scroll || 0) * 0.02 % PW, 34, 9, 0, TAU); g.fill();
  lampLight(g, 520 - (cam.scroll || 0) * 0.02 % PW, 34, 40, '255,244,210', 0.18);
  const hx = -((cam.scroll || 0) * 0.15 % PW + PW) % PW;
  blit(g, pxHills(), hx, PX_HORIZON - 36);
  g.fillStyle = '#1d4426'; g.fillRect(0, PX_HORIZON + 4, PW, PH - PX_HORIZON);
  const P = [];
  let x = 0, dx = -base.curve * SEG * SEG * baseF, maxy = PH;
  const K = PW / 2 * PX_CAM_D;
  for (let n = 0; n < DRAW_SEGS; n++) {
    const s = T.segs[baseI + n];
    if (!s) break;
    const z1 = (baseI + n) * SEG - cam.z, z2 = z1 + SEG;
    const pr = (zz, xx, yy) => { const sc = K / Math.max(0.1, zz); return [PW / 2 + (xx - cam.x) * sc, PX_HORIZON - (yy - camY) * sc, sc]; };
    const p1 = pr(z1, -x, s.y), p2 = pr(z2, -x - dx, (T.segs[baseI + n + 1] || s).y);
    P[n] = { s, p1, p2, z: z1, clip: maxy };
    x += dx; dx += s.curve * SEG * SEG;
    if (z1 < 0.6 || p2[1] >= p1[1] || p2[1] >= maxy) { P[n].hidden = true; continue; }
    const [x1, y1, k1] = p1, [x2, y2, k2] = p2;
    const alt = Math.floor(s.i / 3) % 2;
    g.fillStyle = alt ? '#24502c' : '#1d4426'; g.fillRect(0, y2, PW, y1 - y2 + 1);
    // cada tramo se estira un píxel hacia abajo para que no queden rayas entre tramos
    const quad = (xa, wa, xb, wb, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(xa - wa, y1 + 1); g.lineTo(xa + wa, y1 + 1); g.lineTo(xb + wb, y2); g.lineTo(xb - wb, y2); g.closePath(); g.fill(); };
    quad(x1, (ROAD_W + 0.6) * k1, x2, (ROAD_W + 0.6) * k2, alt ? '#6d6e73' : '#56575c');
    quad(x1, ROAD_W * k1, x2, ROAD_W * k2, alt ? '#2a2b31' : '#26272c');
    quad(x1 - (ROAD_W - 0.12) * k1, 0.07 * k1, x2 - (ROAD_W - 0.12) * k2, 0.07 * k2, '#cfcfc8');
    quad(x1 + (ROAD_W - 0.12) * k1, 0.07 * k1, x2 + (ROAD_W - 0.12) * k2, 0.07 * k2, '#cfcfc8');
    if (alt && T.kind !== 'drag') quad(x1, 0.14 * k1, x2, 0.14 * k2, '#f2e2a0');
    if (T.kind === 'drag') quad(x1, 0.12 * k1, x2, 0.12 * k2, alt ? '#f4f4ee' : '#26272c');
    if (s.mark === 2) { for (let c = 0; c < 8; c++) quad(x1 + (-ROAD_W + (c + 0.5) * ROAD_W / 4) * k1, ROAD_W / 8 * k1, x2 + (-ROAD_W + (c + 0.5) * ROAD_W / 4) * k2, ROAD_W / 8 * k2, c % 2 ? PAL.k : PAL.w); }
    maxy = p2[1];
  }
  // la luz de los focos sobre el camino (cerca del auto)
  g.save(); g.beginPath(); g.rect(0, PX_HORIZON + 4, PW, PH); g.clip();
  g.globalCompositeOperation = 'lighter';
  const hl = g.createRadialGradient(PW / 2, PH + 40, 20, PW / 2, PH + 40, 330);
  hl.addColorStop(0, 'rgba(255,240,200,0.22)'); hl.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = hl; g.fillRect(0, PX_HORIZON, PW, PH);
  g.restore();
  // adornos del costado y autos, de lejos hacia cerca
  const pool = objs.map(o => ({ o, n: Math.floor((o.z - baseI * SEG) / SEG) })).filter(it => it.n >= 0 && it.n < DRAW_SEGS && P[it.n]);
  for (let n = DRAW_SEGS - 1; n >= 1; n--) {
    const q = P[n];
    if (!q) continue;
    for (const sp of q.s.sprites) {
      const S = SPRITES[sp.key];
      if (!S || S.lamp) continue;
      const sc = q.p1[2], sx = q.p1[0] + sp.x * sc, sy = q.p1[1], w = S.w * sc, h = S.h * sc;
      if (sx + w < 0 || sx - w > PW || h < 1) continue;
      const clipH = Math.min(h, q.clip - (sy - h));
      if (clipH <= 0) continue;
      const mirror = S.flip && sp.x < 0;
      if (mirror) { g.save(); g.translate(sx * 2, 0); g.scale(-1, 1); }
      g.drawImage(S.lit, 0, 0, S.lit.width, S.lit.height * clipH / h, sx - w / 2, sy - h, w, clipH);
      if (mirror) g.restore();
    }
    for (const it of pool) if (it.n === n) {
      const o = it.o, f = (o.z - (baseI + n) * SEG) / SEG;
      const sc = lerp(q.p1[2], q.p2[2], f), sx = lerp(q.p1[0], q.p2[0], f) + o.x * sc, sy = lerp(q.p1[1], q.p2[1], f);
      if (sy > q.clip + 30) continue;
      o.draw(g, sx, sy, sc);
    }
  }
  return P;
}

// Semáforo colgado sobre la calle en la partida (rojo: prepárate; verde: ¡ya!)
function pxTrafficLight(g, sx, sy, sc, state) {
  const poleX = sx + (ROAD_W + 1.2) * sc, top = sy - 5.6 * sc;
  g.fillStyle = PAL.g2; g.fillRect(poleX - 0.12 * sc, top, 0.24 * sc, 5.6 * sc);
  g.fillRect(sx - 0.2 * sc, top, poleX - sx + 0.2 * sc, 0.18 * sc);
  const bw = 0.7 * sc, bh = 1.5 * sc, bx = sx - bw / 2, by = top + 0.2 * sc;
  g.fillStyle = PAL.g1; g.fillRect(bx, by, bw, bh);
  g.fillStyle = PAL.g4; g.fillRect(bx, by, bw, Math.max(1, sc * 0.06));
  const lamp = (cy, on, colOn, colOff) => { g.fillStyle = on ? colOn : colOff; g.beginPath(); g.arc(sx, cy, bw * 0.32, 0, TAU); g.fill(); if (on) { g.fillStyle = PAL.w; g.fillRect(sx - bw * 0.12, cy - bw * 0.15, Math.max(1, bw * 0.12), Math.max(1, bw * 0.12)); } };
  lamp(by + bh * 0.28, state === 'red', PAL.r3, PAL.r1);
  lamp(by + bh * 0.72, state === 'green', PAL.e4, PAL.e1);
}

// ----- La cabina (igual para todos los autos, como en el original; solo cambia el color del capó) -----
const COCKPIT = { wheelX: 290, wheelY: 362, wheelR: 138, gaugeY: 296, gaugeR: 44, speedX: 240, tachX: 340, gearX: 548, gearY: 292 };
function chromeTube(g, pts, width) {
  const cols = [PAL.g2, PAL.g4, PAL.g6, PAL.w, PAL.g5, PAL.g3];
  cols.forEach((c, i) => {
    g.strokeStyle = c; g.lineWidth = width * (1 - i / cols.length); g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0][0] - i * 0.6, pts[0][1]);
    for (let k = 1; k < pts.length; k++) g.lineTo(pts[k][0] - i * 0.6, pts[k][1]);
    g.stroke();
  });
}
function pxCockpit(hoodColor) {
  const key = 'cockpit:' + hoodColor + '@' + RES;
  let c = PXCACHE.get(key);
  if (c) return c;
  c = makeCanvas(PW * RES, PH * RES); c.lw = PW; c.lh = PH;
  const g = c.getContext('2d'), C = COCKPIT, ramp = paintRamp(hoodColor);
  g.scale(RES, RES);
  // techo
  g.fillStyle = PAL.g3; g.fillRect(0, 0, PW, 18);
  g.fillStyle = PAL.g2; for (let x = 6; x < PW; x += 14) g.fillRect(x, 4, 1, 10);
  // marco del parabrisas: tubo cromado redondeado y pilares
  chromeTube(g, [[40, 130], [56, 40], [90, 22], [550, 22], [590, 40], [606, 130]], 16);
  chromeTube(g, [[56, 40], [34, 140], [26, 214]], 18);
  chromeTube(g, [[590, 40], [612, 140], [622, 214]], 14);
  chromeTube(g, [[16, 70], [12, 214]], 8);
  // espejo retrovisor
  g.fillStyle = PAL.g4; g.fillRect(512, 18, 6, 14);
  g.fillStyle = PAL.g5; g.fillRect(440, 30, 156, 44); g.fillStyle = PAL.w; g.fillRect(440, 30, 156, 2);
  g.fillStyle = PAL.g2; g.fillRect(444, 34, 148, 36);
  // capó del color del auto, con su pliegue al centro y el adorno cromado
  // capó abombado: tono medio, reflejo claro arriba, brillo, y sombra hacia los lados
  g.fillStyle = ramp.dk;
  g.beginPath(); g.moveTo(30, 236); g.quadraticCurveTo(300, 132, 616, 236); g.lineTo(616, 240); g.lineTo(30, 240); g.fill();
  g.fillStyle = ramp.md;
  g.beginPath(); g.moveTo(90, 228); g.quadraticCurveTo(300, 142, 560, 228); g.lineTo(560, 236); g.lineTo(90, 236); g.fill();
  g.fillStyle = ramp.lt; g.beginPath(); g.moveTo(150, 204); g.quadraticCurveTo(300, 160, 470, 204); g.lineTo(470, 210); g.quadraticCurveTo(300, 168, 150, 210); g.fill();
  g.fillStyle = ramp.hi; g.fillRect(250, 186, 90, 3); g.fillRect(280, 182, 30, 2);
  g.fillStyle = ramp.dk; g.fillRect(298, 184, 4, 52);
  g.fillStyle = PAL.g6; g.fillRect(292, 178, 16, 8); g.fillStyle = PAL.w; g.fillRect(294, 178, 8, 3); g.fillStyle = PAL.r3; g.fillRect(297, 182, 6, 3);
  // tablero cromado
  g.fillStyle = PAL.g1; g.fillRect(0, 226, PW, 10);
  const dg = g.createLinearGradient(0, 236, 0, PH);
  dg.addColorStop(0, PAL.g6); dg.addColorStop(0.35, PAL.g5); dg.addColorStop(1, PAL.g3);
  g.fillStyle = dg; g.fillRect(0, 236, PW, PH - 236);
  g.fillStyle = PAL.w; g.fillRect(0, 238, PW, 2);
  // rejillas y botones del tablero
  for (let i = 0; i < 6; i++) { g.fillStyle = PAL.g2; g.fillRect(20 + i * 12, 258, 8, 50); g.fillStyle = PAL.w; g.fillRect(20 + i * 12, 258, 2, 50); }
  for (let i = 0; i < 6; i++) { g.fillStyle = PAL.g2; g.fillRect(470 + i * 12, 352, 8, 22); g.fillStyle = PAL.w; g.fillRect(470 + i * 12, 352, 2, 22); }
  // caja del cambio
  g.fillStyle = PAL.g6; g.fillRect(C.gearX - 40, C.gearY - 36, 80, 72);
  g.fillStyle = PAL.g2; g.fillRect(C.gearX - 34, C.gearY - 30, 68, 60);
  g.fillStyle = PAL.g1; g.fillRect(C.gearX - 30, C.gearY - 26, 60, 52);
  // relojes: caras negras con marcas blancas
  const face = (cx, labels, red) => {
    g.fillStyle = PAL.g6; g.beginPath(); g.arc(cx, C.gaugeY, C.gaugeR + 5, 0, TAU); g.fill();
    g.fillStyle = PAL.g3; g.beginPath(); g.arc(cx, C.gaugeY, C.gaugeR + 2, 0, TAU); g.fill();
    g.fillStyle = PAL.k; g.beginPath(); g.arc(cx, C.gaugeY, C.gaugeR, 0, TAU); g.fill();
    const a0 = Math.PI * 0.8, a1 = Math.PI * 2.2;
    if (red) { g.strokeStyle = PAL.r3; g.lineWidth = 6; g.beginPath(); g.arc(cx, C.gaugeY, C.gaugeR - 6, a0 + (a1 - a0) * red, a1); g.stroke(); }
    labels.forEach((lab, i) => {
      const a = a0 + (a1 - a0) * i / (labels.length - 1);
      g.fillStyle = PAL.w; g.fillRect(Math.round(cx + Math.cos(a) * (C.gaugeR - 4)) - 1, Math.round(C.gaugeY + Math.sin(a) * (C.gaugeR - 4)) - 1, 3, 3);
      if (lab) ptext(g, lab, cx + Math.cos(a) * (C.gaugeR - 15), C.gaugeY + Math.sin(a) * (C.gaugeR - 15) - 6, PAL.w, 1, { align: 'center' });
    });
  };
  face(C.speedX, ['0', '20', '40', '60', '80', '100', '120', '140'], 0);
  face(C.tachX, ['0', '1', '2', '3', '4', '5', '6', '7', '8'], 0.72);
  ptext(g, 'MPH', C.speedX, C.gaugeY + 14, PAL.g5, 1, { align: 'center' });
  ptext(g, 'RPM', C.tachX, C.gaugeY + 14, PAL.g5, 1, { align: 'center' });
  // volante cromado con sus rayos y la bocina
  const W0 = C.wheelX, H0 = C.wheelY, R0 = C.wheelR;
  for (const [r, col] of [[R0 + 6, PAL.g2], [R0 + 3, PAL.g5], [R0, PAL.w], [R0 - 3, PAL.g6], [R0 - 6, PAL.g4], [R0 - 9, PAL.g2]]) { g.strokeStyle = col; g.lineWidth = 3.4; g.beginPath(); g.arc(W0, H0, r, Math.PI, TAU); g.stroke(); }
  for (const dir of [-1, 1]) {
    g.fillStyle = PAL.g5; g.beginPath(); g.moveTo(W0 + dir * 26, H0 - 14); g.lineTo(W0 + dir * (R0 - 4), H0 - 22); g.lineTo(W0 + dir * (R0 - 4), H0 - 8); g.lineTo(W0 + dir * 26, H0 + 2); g.fill();
    g.fillStyle = PAL.w; g.fillRect(Math.min(W0 + dir * 30, W0 + dir * (R0 - 8)), H0 - 18, Math.abs(R0 - 38), 3);
  }
  g.fillStyle = PAL.g4; g.beginPath(); g.arc(W0, H0 - 6, 30, 0, TAU); g.fill();
  g.fillStyle = PAL.g6; g.beginPath(); g.arc(W0, H0 - 8, 26, 0, TAU); g.fill();
  g.fillStyle = PAL.r3; g.beginPath(); g.arc(W0, H0 - 8, 12, 0, TAU); g.fill();
  g.fillStyle = PAL.w; g.beginPath(); g.arc(W0, H0 - 8, 6, 0, TAU); g.fill();
  // recorta el parabrisas (queda transparente: ahí se ve el camino)
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.moveTo(48, 214); g.lineTo(56, 70); g.quadraticCurveTo(64, 34, 100, 30); g.lineTo(540, 30); g.quadraticCurveTo(580, 34, 588, 70); g.lineTo(606, 214); g.lineTo(606, 232); g.quadraticCurveTo(300, 126, 40, 232); g.closePath();
  g.fill();
  // la ventanita del costado izquierdo también deja ver afuera
  g.beginPath(); g.moveTo(20, 90); g.lineTo(28, 214); g.lineTo(18, 214); g.lineTo(18, 90); g.fill();
  g.globalCompositeOperation = 'source-over';
  // espejo: se vuelve a pintar arriba del recorte
  g.fillStyle = PAL.g5; g.fillRect(440, 30, 156, 44); g.fillStyle = PAL.w; g.fillRect(440, 30, 156, 2);
  g.fillStyle = PAL.g2; g.fillRect(444, 34, 148, 36);
  g.fillStyle = PAL.g4; g.fillRect(512, 18, 6, 14);
  PXCACHE.set(key, c);
  return c;
}

// Agujas, cambio y espejo (lo que se mueve en la cabina)
function pxCockpitDynamic(g, race) {
  const C = COCKPIT, me = race.me, v = me.veh, s = me.s;
  const needle = (cx, frac, col) => {
    const a = Math.PI * 0.8 + Math.PI * 1.4 * clamp(frac, 0, 1.03);
    g.strokeStyle = col; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(cx, C.gaugeY); g.lineTo(cx + Math.cos(a) * (C.gaugeR - 8), C.gaugeY + Math.sin(a) * (C.gaugeR - 8)); g.stroke();
    g.fillStyle = PAL.g6; g.fillRect(cx - 3, C.gaugeY - 3, 6, 6);
  };
  needle(C.speedX, v.v * 2.237 / 140, PAL.r4);
  needle(C.tachX, v.rpm / 8000, PAL.r4);
  // caja de cambios: patrón en H o P R N D L
  const gx = C.gearX, gy = C.gearY;
  if (s.auto) {
    'PRNDL'.split('').forEach((ch, i) => ptext(g, ch, gx + 14, gy - 24 + i * 10, (v.gear === 0 ? 'N' : 'D') === ch ? PAL.y3 : PAL.g4, 1));
    g.fillStyle = PAL.g5; g.fillRect(gx - 12, gy - 24 + (v.gear === 0 ? 2 : 3) * 10, 18, 6);
  } else {
    g.fillStyle = PAL.g4;
    const cols = Math.ceil(v.nGears / 2), cw = 34 / Math.max(1, cols - 1 || 1);
    g.fillRect(gx - 18, gy - 1, 36, 3);
    for (let i = 0; i < cols; i++) g.fillRect(gx - 18 + i * (cols > 1 ? 36 / (cols - 1) : 0) - 1, gy - 18, 3, 36);
    const gr = v.gear, col = gr ? Math.ceil(gr / 2) - 1 : (cols - 1) / 2, up = gr % 2 === 1;
    const kx = gx - 18 + col * (cols > 1 ? 36 / (cols - 1) : 0), ky = gr ? (up ? gy - 18 : gy + 18) : gy;
    g.fillStyle = PAL.w; g.beginPath(); g.arc(kx, ky, 6, 0, TAU); g.fill();
    g.fillStyle = PAL.k; ptext(g, gr ? String(gr) : 'N', kx, ky - 6, PAL.k, 1, { align: 'center' });
    void cw;
  }
  // espejo: lo que viene detrás
  g.save(); g.beginPath(); g.rect(444, 34, 148, 36); g.clip();
  g.fillStyle = PAL.k; g.fillRect(444, 34, 148, 18);
  g.fillStyle = PAL.e2; g.fillRect(444, 52, 148, 18);
  g.fillStyle = PAL.g1; g.beginPath(); g.moveTo(510, 52); g.lineTo(526, 52); g.lineTo(590, 70); g.lineTo(446, 70); g.fill();
  const behind = [];
  if (race.rv.z < me.z) behind.push([race.rv.z, race.rv.x, race.rv.car.color]);
  if (race.cop && race.cop.z < me.z) behind.push([race.cop.z, race.cop.x, '#000000', 1]);
  for (const [z, x, col, cop] of behind) {
    const d = Math.max(4, me.z - z), k = 26 / d;
    const mx = 518 + (x - me.x) * 10 * k, w = Math.max(3, 40 * k), my = 52 + Math.min(14, 120 / d);
    g.fillStyle = col; g.fillRect(mx - w / 2, my - w * 0.6, w, w * 0.5);
    g.fillStyle = PAL.y3; g.fillRect(mx - w / 2, my - w * 0.25, Math.max(1, w * 0.2), Math.max(1, w * 0.12)); g.fillRect(mx + w * 0.3, my - w * 0.25, Math.max(1, w * 0.2), Math.max(1, w * 0.12));
    if (cop && Math.sin(race.t * 14) > 0) { g.fillStyle = PAL.r4; g.fillRect(mx - 2, my - w * 0.8, 4, 3); }
  }
  g.restore();
}

// Un cuadro completo de la carrera: camino → paleta → cabina → agujas → barra de estado
function pxDrawRace(g, race, lo) {
  const me = race.me, T = race.T;
  const objs = [];
  objs.push({ z: T.start + 34, x: 0, draw: (gg, sx, sy, sc) => pxTrafficLight(gg, sx, sy, sc, race.flag === 2 ? 'green' : 'red') });
  if (race.rv.z > me.z + 1) objs.push({ z: race.rv.z, x: race.rv.x, draw: (gg, sx, sy, sc) => drawCarRear(gg, race.rv.car, sx, sy + 1, Math.min(260, 2.05 * sc), race.rv.veh.brake > 0.1) });
  for (const o of race.traffic) if (o.z > me.z + 1 && !o.oncoming) objs.push({ z: o.z, x: o.x, draw: (gg, sx, sy, sc) => drawCarRear(gg, o.car, sx, sy + 1, Math.min(260, 2 * sc), false) });
  for (const o of race.traffic) if (o.z > me.z + 1 && o.oncoming) objs.push({ z: o.z, x: o.x, draw: (gg, sx, sy, sc) => drawCarFrontView(gg, o.car, sx, sy + 1, Math.min(260, 2 * sc), 1) });
  const shake = (me.veh.offroad ? 2 : 0) + (race.flash > 0 ? 4 : 0);
  g.save(); g.translate(Math.round((Math.random() - 0.5) * shake), Math.round((Math.random() - 0.5) * shake));
  pxRenderRoad(g, T, { z: me.z, x: me.x, scroll: race.scroll }, objs, race.t);
  g.restore();
  blit(g, pxCockpit(me.car.color), 0, 0);
  pxCockpitDynamic(g, race);
  void lo;
}
