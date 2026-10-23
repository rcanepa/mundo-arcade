// ===== Escenarios: portada, garaje, drive-in, bencinera y final =====

// Letrero de neón: texto con resplandor que a veces parpadea
function neonText(g, text, x, y, size, color, t, o = {}) {
  const flick = o.flicker && !COVER && Math.sin(t * 23 + o.flicker) > 0.96 ? 0.35 : 1;
  g.save();
  g.font = o.font || font(size, 'bold', FONT_SCRIPT);
  g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
  g.globalAlpha = flick;
  g.shadowColor = color; g.shadowBlur = size * 0.5;
  g.fillStyle = color; g.fillText(text, x, y);
  g.shadowBlur = size * 0.2; g.fillStyle = css(shade(color, 0.6)); g.fillText(text, x, y);
  g.restore();
}
// Letras cromadas grandes
function chromeText(g, text, x, y, size, o = {}) {
  g.save();
  g.font = o.font || font(size, 'italic 900', FONT_DISPLAY);
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.lineJoin = 'round';
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillText(text, x + size * 0.05, y + size * 0.07);
  g.lineWidth = size * 0.12; g.strokeStyle = '#2a1030'; g.strokeText(text, x, y);
  const gr = g.createLinearGradient(0, y - size * 0.8, 0, y + size * 0.05);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.42, '#b9c6d6'); gr.addColorStop(0.5, '#3a4a66'); gr.addColorStop(0.56, '#f2c27a'); gr.addColorStop(1, '#fff5dc');
  g.fillStyle = gr; g.fillText(text, x, y);
  g.lineWidth = size * 0.025; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.strokeText(text, x, y);
  g.restore();
}

function palmSilhouette(g, x, y, h, color, lean = 0.1) {
  g.save(); g.strokeStyle = color; g.fillStyle = color; g.lineCap = 'round';
  g.lineWidth = h * 0.035;
  const tx = x + h * lean, ty = y - h;
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + h * lean * 0.2, y - h * 0.6, tx, ty); g.stroke();
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i / 8 - 0.5) * 3.6, l = h * (0.28 + (i % 3) * 0.04);
    g.lineWidth = h * 0.022;
    g.beginPath(); g.moveTo(tx, ty);
    g.quadraticCurveTo(tx + Math.cos(a) * l * 0.6, ty + Math.sin(a) * l * 0.4 - h * 0.05, tx + Math.cos(a) * l, ty + Math.sin(a) * l * 0.25 + h * 0.12);
    g.stroke();
  }
  g.restore();
}

// ----- Portada: atardecer en el bulevar, frente al Lucky's -----
const TITLE_CAR = (() => { let c = null; return () => c || (c = Object.assign(makeCar('ford32', { color: '#111214' }), { mods: { flames: 1, wheels: 'mags', pinstripe: 1 } })); })();
function drawTitle(g, t) {
  const hz = 455;
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#140b2e'); sky.addColorStop(0.35, '#4a1f5e'); sky.addColorStop(0.65, '#c2456a'); sky.addColorStop(0.85, '#f08a4b'); sky.addColorStop(1, '#ffd27a');
  g.fillStyle = sky; g.fillRect(0, 0, W, hz);
  // primeras estrellas
  for (let i = 0; i < 70; i++) { const a = 0.3 + 0.5 * Math.sin(t * 1.5 + i); g.fillStyle = `rgba(255,240,230,${(a * (1 - hash1(i, 2))).toFixed(2)})`; g.fillRect(hash1(i, 1) * W, hash1(i, 3) * 170, 1.5, 1.5); }
  // sol
  const sx = 860, sy = hz - 40;
  glow(g, sx, sy, 380, '#ffb35c', 0.55);
  const sg = g.createLinearGradient(0, sy - 130, 0, sy + 130);
  sg.addColorStop(0, '#fff3b0'); sg.addColorStop(0.6, '#ff9a4a'); sg.addColorStop(1, '#ff4f6a');
  g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, 125, 0, TAU); g.fill();
  // nubes largas
  g.fillStyle = 'rgba(120,40,90,0.45)';
  for (const [cx, cy, w] of [[300, 300, 380], [980, 250, 300], [700, 340, 520]]) { roundRect(g, cx - w / 2 + Math.sin(t * 0.1) * 20, cy, w, 9, 5); g.fill(); }
  // cerros
  g.fillStyle = '#5a2a5a';
  g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 40 - 30 * Math.sin(x * 0.006) - 18 * Math.sin(x * 0.017)); g.lineTo(W, hz); g.fill();
  g.fillStyle = '#2e1838';
  g.beginPath(); g.moveTo(0, hz); for (let x = 0; x <= W; x += 20) g.lineTo(x, hz - 14 - 12 * Math.sin(x * 0.011 + 2)); g.lineTo(W, hz); g.fill();
  // calle
  const road = g.createLinearGradient(0, hz, 0, H);
  road.addColorStop(0, '#2a1a30'); road.addColorStop(1, '#0d0a12');
  g.fillStyle = road; g.fillRect(0, hz, W, H - hz);
  g.fillStyle = 'rgba(255,170,110,0.18)'; g.fillRect(0, hz, W, 3);
  g.fillStyle = '#3c2a3a'; g.fillRect(0, 612, W, 14);
  // reflejo del sol en el asfalto
  const rg = g.createRadialGradient(sx, 640, 10, sx, 640, 420);
  rg.addColorStop(0, 'rgba(255,170,100,0.35)'); rg.addColorStop(1, 'rgba(255,170,100,0)');
  g.save(); g.scale(1, 0.4); g.fillStyle = rg; g.fillRect(0, hz / 0.4, W, (H - hz) / 0.4); g.restore();
  for (let x = -80 + (t * 0 % 160); x < W; x += 160) { g.fillStyle = 'rgba(255,220,150,0.35)'; g.fillRect(x, 680, 80, 5); }
  // palmeras y postes
  for (const [px, ph, l] of [[70, 330, -0.1], [190, 260, 0.12], [1130, 300, -0.12], [1230, 380, 0.08]]) palmSilhouette(g, px, 612, ph, '#140a1a', l);
  g.strokeStyle = 'rgba(20,10,26,0.8)'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, 330); g.quadraticCurveTo(640, 380, W, 320); g.stroke();
  // letrero del drive-in con estrella atómica y flecha de ampolletas
  g.fillStyle = '#1a1020'; g.fillRect(600, 300, 16, 320);
  g.fillStyle = '#251530'; roundRect(g, 510, 210, 200, 110, 18); g.fill();
  neonText(g, "Lucky's", 610, 248, 54, '#ff4f9a', t, { flicker: 1 });
  neonText(g, 'DRIVE-IN', 610, 295, 26, '#5fe8ff', t, { font: font(26, 'bold', FONT_SANS) });
  g.save(); g.translate(610, 175); g.rotate(t * 0.4);
  g.strokeStyle = '#ffd23a'; g.lineWidth = 3; g.shadowColor = '#ffd23a'; g.shadowBlur = 14;
  for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.beginPath(); g.moveTo(0, 6); g.lineTo(0, i % 2 ? 22 : 34); g.stroke(); }
  g.restore();
  for (let i = 0; i < 12; i++) {
    const on = (Math.floor(t * 8) - i) % 4 === 0;
    const bx = 620 + i * 16, by = 340 + i * 3;
    g.fillStyle = on ? '#fff2a0' : '#6a5020'; g.beginPath(); g.arc(bx, by, 4, 0, TAU); g.fill();
    if (on) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, bx, by, 16, '#ffd060', 0.6); g.restore(); }
  }
  // el hot rod
  drawCarSide(g, TITLE_CAR(), 860, 612, 560, { lights: true, night: false });
  // título
  chromeText(g, 'STREET ROD', W / 2 - 200, 150, 112);
  neonText(g, L().subtitle, W / 2 - 160, 205, 54, '#ff6ab0', t, { flicker: 3 });
}

// ----- Garaje de día -----
function drawGarage(g, t, car, o = {}) {
  // pared de tablas
  const wall = g.createLinearGradient(0, 0, 0, 520);
  wall.addColorStop(0, '#5a4636'); wall.addColorStop(1, '#7a6048');
  g.fillStyle = wall; g.fillRect(0, 0, W, 520);
  for (let x = 0; x < W; x += 46) { g.fillStyle = `rgba(0,0,0,${0.08 + hash1(x, 4) * 0.08})`; g.fillRect(x, 0, 2, 520); g.fillStyle = `rgba(255,220,180,${hash1(x, 7) * 0.05})`; g.fillRect(x + 2, 0, 44, 520); }
  // portón abierto a la derecha con la calle soleada
  const dx = 900, dw = 330;
  const out = g.createLinearGradient(0, 70, 0, 520);
  out.addColorStop(0, '#7ec8ee'); out.addColorStop(0.7, '#cfe8f0'); out.addColorStop(1, '#e8dcc0');
  g.fillStyle = out; g.fillRect(dx, 70, dw, 450);
  g.fillStyle = '#d9cdb0'; g.fillRect(dx, 440, dw, 80);
  g.fillStyle = '#e8e2d0'; g.fillRect(dx + 40, 330, 210, 110);
  g.fillStyle = '#b3533a'; g.beginPath(); g.moveTo(dx + 25, 335); g.lineTo(dx + 145, 285); g.lineTo(dx + 265, 335); g.fill();
  g.fillStyle = '#7ab0d8'; g.fillRect(dx + 70, 360, 50, 40); g.fillRect(dx + 170, 360, 50, 40);
  palmSilhouette(g, dx + 285, 450, 330, '#3a5a3a', -0.08);
  g.fillStyle = '#5a6a4a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(dx + 30 + i * 55, 440, 22, Math.PI, 0); g.fill(); }
  // marco del portón y la puerta levantada
  g.fillStyle = '#3a2c22'; g.fillRect(dx - 14, 60, 14, 470); g.fillRect(dx + dw, 60, 14, 470); g.fillRect(dx - 14, 56, dw + 28, 16);
  g.fillStyle = '#8a7a64'; g.fillRect(dx, 72, dw, 26);
  // luz que entra por el portón
  g.save(); g.globalCompositeOperation = 'lighter';
  const beam = g.createLinearGradient(dx, 0, dx - 420, 0);
  beam.addColorStop(0, 'rgba(255,230,180,0.22)'); beam.addColorStop(1, 'rgba(255,230,180,0)');
  g.fillStyle = beam; g.beginPath(); g.moveTo(dx, 100); g.lineTo(dx, 520); g.lineTo(dx - 520, 720); g.lineTo(dx - 300, 720); g.closePath(); g.fill();
  g.restore();
  // tablero de herramientas
  g.fillStyle = '#c9a878'; roundRect(g, 60, 90, 360, 210, 6); g.fill();
  g.fillStyle = 'rgba(80,50,20,0.45)';
  for (let x = 74; x < 410; x += 14) for (let y = 104; y < 290; y += 14) g.fillRect(x, y, 3, 3);
  const tools = [[100, 120, 'wrench', 90], [140, 120, 'wrench', 76], [176, 120, 'wrench', 62], [210, 120, 'hammer', 80], [260, 124, 'saw', 120], [330, 120, 'pliers', 70], [370, 120, 'screw', 64]];
  for (const [tx, ty, kind, len] of tools) {
    g.fillStyle = kind === 'saw' ? '#c8ccd2' : kind === 'hammer' ? '#5a3a24' : '#9aa2ac';
    g.strokeStyle = '#7a828c';
    if (kind === 'wrench') { roundRect(g, tx - 4, ty, 8, len, 4); g.fill(); g.beginPath(); g.arc(tx, ty, 10, 0, TAU); g.fill(); g.fillStyle = '#c9a878'; g.fillRect(tx - 4, ty - 12, 8, 12); }
    else if (kind === 'hammer') { g.fillRect(tx - 3, ty, 6, len); g.fillStyle = '#5d646c'; g.fillRect(tx - 16, ty - 6, 32, 14); }
    else if (kind === 'saw') { g.beginPath(); g.moveTo(tx, ty); g.lineTo(tx + 50, ty + 20); g.lineTo(tx + 50, ty + len); g.lineTo(tx, ty + len - 20); g.fill(); g.fillStyle = '#8a5a30'; g.fillRect(tx - 6, ty + len - 30, 20, 40); }
    else if (kind === 'pliers') { g.strokeStyle = '#b3202a'; g.lineWidth = 6; g.beginPath(); g.moveTo(tx - 8, ty + len); g.lineTo(tx, ty + 20); g.lineTo(tx + 8, ty + len); g.stroke(); g.fillStyle = '#7a828c'; g.fillRect(tx - 4, ty, 8, 24); }
    else { g.fillRect(tx - 2, ty, 4, len * 0.6); g.fillStyle = '#e8b030'; roundRect(g, tx - 6, ty + len * 0.6, 12, len * 0.4, 5); g.fill(); }
  }
  // calendario con el día marcado
  const d = dateOf(S ? S.day : 0);
  g.fillStyle = '#f2ede0'; g.fillRect(470, 100, 150, 180);
  g.fillStyle = '#c22a2a'; g.fillRect(470, 100, 150, 34);
  g.fillStyle = '#fff'; g.font = font(17, 'bold', FONT_SANS); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(L().months[d.getMonth()].toUpperCase() + ' 1963', 545, 117);
  const first = new Date(1963, d.getMonth(), 1).getDay(), dim = new Date(1963, d.getMonth() + 1, 0).getDate();
  g.font = font(10, 'bold', FONT_SANS);
  for (let i = 1; i <= dim; i++) {
    const c = (first + i - 1) % 7, r = Math.floor((first + i - 1) / 7);
    const cx = 482 + c * 21, cy = 150 + r * 22;
    g.fillStyle = c === 6 ? '#c22a2a' : '#333'; g.fillText(String(i), cx, cy);
    if (i === d.getDate()) { g.strokeStyle = '#c22a2a'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, 9, 0, TAU); g.stroke(); }
  }
  // repisa con tarros de aceite y una radio
  g.fillStyle = '#4a3626'; g.fillRect(650, 220, 220, 10);
  const cans = ['#c22a2a', '#2a6ab3', '#e8b030', '#2a8a4a', '#c22a2a'];
  cans.forEach((c, i) => { g.fillStyle = c; roundRect(g, 660 + i * 26, 180, 22, 40, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(663 + i * 26, 195, 16, 8); });
  g.fillStyle = '#7a3a2a'; roundRect(g, 800, 186, 62, 34, 8); g.fill(); g.fillStyle = '#e8d8b0'; g.beginPath(); g.arc(818, 203, 10, 0, TAU); g.fill();
  g.fillStyle = '#d9c9a0'; for (let i = 0; i < 4; i++) g.fillRect(835 + i * 6, 194, 3, 18);
  // banco de trabajo
  g.fillStyle = '#6a4a30'; g.fillRect(40, 330, 400, 22);
  g.fillStyle = '#4a3422'; g.fillRect(56, 352, 18, 170); g.fillRect(400, 352, 18, 170);
  g.fillStyle = '#5a4030'; g.fillRect(90, 360, 140, 90);
  g.fillStyle = '#9aa2ac'; g.fillRect(150, 300, 50, 30); g.fillRect(140, 318, 70, 12);
  // neumáticos apilados
  for (let i = 0; i < 3; i++) { g.fillStyle = '#1a1a1c'; g.beginPath(); g.ellipse(560, 500 - i * 26, 60, 18, 0, 0, TAU); g.fill(); g.fillStyle = '#2a2a2e'; g.beginPath(); g.ellipse(560, 494 - i * 26, 30, 8, 0, 0, TAU); g.fill(); }
  // piso de cemento
  const fl = g.createLinearGradient(0, 520, 0, H);
  fl.addColorStop(0, '#8a8478'); fl.addColorStop(1, '#5a554c');
  g.fillStyle = fl; g.fillRect(0, 520, W, H - 520);
  g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 520, W, 4);
  for (const [ox, oy, r] of [[420, 640, 40], [700, 600, 28], [980, 680, 50]]) { g.fillStyle = 'rgba(30,25,20,0.25)'; g.beginPath(); g.ellipse(ox, oy, r * 1.6, r * 0.4, 0, 0, TAU); g.fill(); }
  // ampolleta colgando
  g.strokeStyle = '#222'; g.lineWidth = 2; g.beginPath(); g.moveTo(640, 0); g.lineTo(640, 70); g.stroke();
  g.fillStyle = '#3a3a3a'; g.beginPath(); g.moveTo(610, 92); g.lineTo(670, 92); g.lineTo(652, 70); g.lineTo(628, 70); g.fill();
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 640, 96, 260, '#ffe4a8', 0.28); g.restore();
  // polvo en la luz
  g.fillStyle = 'rgba(255,240,210,0.5)';
  for (let i = 0; i < 26; i++) { const px = 520 + ((hash1(i, 1) * 380 + t * 8 * (hash1(i, 2) - 0.5) * 2) % 380), py = 140 + ((hash1(i, 3) * 400 + t * 5) % 400); g.fillRect(px, py, 2, 2); }
  // el auto
  if (car) {
    const size = (o.size || 610) * ART[car.model].len / 5, cx = o.x || 520, cy = o.y || 572;
    // reflejo en el piso
    g.save(); g.globalAlpha = 0.18; g.translate(0, cy * 2); g.scale(1, -1); drawCarSide(g, car, cx, cy, size); g.restore();
    drawCarSide(g, car, cx, cy, size, { spin: o.spin });
    if (car.body < 0.7) drawDamage(g, car, cx, cy, size);
  }
}
// Abolladuras y rayas cuando el auto está chocado
function drawDamage(g, car, x, y, size) {
  const k = 1 - car.body, R = rng(car.id.length * 7 + 3);
  g.save(); g.strokeStyle = `rgba(30,25,20,${0.4 + k * 0.4})`; g.lineWidth = 2;
  for (let i = 0; i < 4 + k * 10; i++) {
    const px = x + (R() - 0.3) * size * 0.8, py = y - size * (0.08 + R() * 0.12);
    g.beginPath(); g.moveTo(px, py); g.lineTo(px + (R() - 0.5) * 40, py + (R() - 0.5) * 12); g.stroke();
  }
  g.fillStyle = `rgba(90,60,40,${0.3 + k * 0.4})`;
  for (let i = 0; i < 3 + k * 6; i++) { g.beginPath(); g.ellipse(x + (R() - 0.5) * size * 0.8, y - size * (0.06 + R() * 0.1), 14 + R() * 18, 6 + R() * 6, 0, 0, TAU); g.fill(); }
  g.restore();
}

// ----- El drive-in de noche -----
function drawDiner(g, t, o = {}) {
  const hz = 430;
  const sky = g.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#05060f'); sky.addColorStop(0.6, '#141a3a'); sky.addColorStop(1, '#2c2347');
  g.fillStyle = sky; g.fillRect(0, 0, W, hz);
  for (let i = 0; i < 120; i++) { const a = 0.4 + 0.5 * Math.sin(t * 2 + i * 1.7); g.fillStyle = `rgba(255,255,240,${(a * hash1(i, 5)).toFixed(2)})`; g.fillRect(hash1(i, 1) * W, hash1(i, 3) * 260, 1.6, 1.6); }
  glow(g, 1120, 90, 140, '#a8b8e8', 0.2); g.fillStyle = '#f2f0e0'; g.beginPath(); g.arc(1120, 90, 24, 0, TAU); g.fill();
  palmSilhouette(g, 70, hz + 20, 300, '#05060c', 0.1); palmSilhouette(g, 1210, hz + 20, 340, '#05060c', -0.12);
  // el edificio: techo en ángulo, ventanales iluminados
  g.fillStyle = '#1c1a2a'; g.fillRect(240, 250, 760, 190);
  g.fillStyle = '#2a2440'; g.beginPath(); g.moveTo(200, 262); g.lineTo(620, 205); g.lineTo(1040, 262); g.lineTo(1040, 276); g.lineTo(620, 222); g.lineTo(200, 276); g.closePath(); g.fill();
  g.strokeStyle = '#ff4f9a'; g.lineWidth = 3; g.shadowColor = '#ff4f9a'; g.shadowBlur = 12;
  g.beginPath(); g.moveTo(200, 270); g.lineTo(620, 214); g.lineTo(1040, 270); g.stroke(); g.shadowBlur = 0;
  for (let i = 0; i < 8; i++) {
    const wx = 270 + i * 90;
    const wg = g.createLinearGradient(0, 290, 0, 410);
    wg.addColorStop(0, '#ffdca0'); wg.addColorStop(1, '#ff9e5a');
    g.fillStyle = wg; g.fillRect(wx, 292, 76, 116);
    // gente adentro
    g.fillStyle = 'rgba(60,30,30,0.55)';
    if (hash1(i, 9) > 0.35) { const px = wx + 20 + hash1(i, 2) * 30 + Math.sin(t * 0.6 + i) * 4; g.beginPath(); g.arc(px, 345, 9, 0, TAU); g.fill(); g.fillRect(px - 12, 354, 24, 40); }
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(wx + 6, 296, 8, 108);
  }
  g.save(); g.globalCompositeOperation = 'lighter'; glow(g, 620, 350, 420, '#ffb070', 0.18); g.restore();
  // letrero gigante
  g.fillStyle = '#14121e'; g.fillRect(612, 60, 16, 160);
  g.fillStyle = '#1e1a2c'; roundRect(g, 470, 50, 300, 120, 22); g.fill();
  g.strokeStyle = '#5fe8ff'; g.lineWidth = 3; g.shadowColor = '#5fe8ff'; g.shadowBlur = 14; roundRect(g, 476, 56, 288, 108, 18); g.stroke(); g.shadowBlur = 0;
  neonText(g, "Lucky's", 620, 98, 64, '#ff4f9a', t, { flicker: 2 });
  neonText(g, 'DRIVE-IN · BURGERS · SHAKES', 620, 145, 18, '#ffd23a', t, { font: font(18, 'bold', FONT_SANS) });
  g.save(); g.translate(620, 30); g.rotate(t * 0.5); g.strokeStyle = '#ffd23a'; g.lineWidth = 3; g.shadowColor = '#ffd23a'; g.shadowBlur = 12;
  for (let i = 0; i < 8; i++) { g.rotate(TAU / 8); g.beginPath(); g.moveTo(0, 4); g.lineTo(0, i % 2 ? 16 : 26); g.stroke(); }
  g.restore();
  // guirnalda de ampolletas
  for (let i = 0; i < 26; i++) {
    const bx = 30 + i * 48, by = 236 + Math.sin(i * 0.5) * 6 + (i % 2) * 4;
    const c = ['#ff5a5a', '#ffd23a', '#5fe8ff', '#7dff7a'][i % 4];
    g.fillStyle = c; g.beginPath(); g.arc(bx, by, 3.5, 0, TAU); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, bx, by, 14, c, 0.45 + 0.2 * Math.sin(t * 3 + i)); g.restore();
  }
  // estacionamiento
  const lot = g.createLinearGradient(0, hz, 0, H);
  lot.addColorStop(0, '#1d1a26'); lot.addColorStop(1, '#0a090e');
  g.fillStyle = lot; g.fillRect(0, hz, W, H - hz);
  // reflejos de neón en el asfalto
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [rx, c] of [[620, '#ff4f9a'], [400, '#ffb070'], [840, '#ffb070']]) {
    const rr = g.createLinearGradient(0, hz, 0, H); rr.addColorStop(0, css(c, 0.25)); rr.addColorStop(1, css(c, 0));
    g.fillStyle = rr; g.fillRect(rx - 60, hz, 120, H - hz);
  }
  g.restore();
  g.strokeStyle = 'rgba(240,230,200,0.18)'; g.lineWidth = 3;
  for (let x = -40; x < W; x += 180) { g.beginPath(); g.moveTo(x, 470); g.lineTo(x - 70, 700); g.stroke(); }
  // autos estacionados al fondo
  for (const [px, c] of [[300, '#3a2a40'], [470, '#203040'], [800, '#402a2a'], [960, '#2a3a30']]) {
    g.fillStyle = c; roundRect(g, px - 70, 418, 140, 30, 10); g.fill(); g.beginPath(); g.moveTo(px - 40, 418); g.lineTo(px - 25, 400); g.lineTo(px + 30, 400); g.lineTo(px + 45, 418); g.fill();
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, px - 64, 434, 14, '#ff2a1a', 0.6); glow(g, px + 64, 434, 14, '#ff2a1a', 0.6); g.restore();
  }
  // la mesera en patines
  const hx = 640 + Math.sin(t * 0.5) * 380, dir = Math.cos(t * 0.5) > 0 ? 1 : -1;
  drawCarhop(g, hx, 470, t, dir);
  // tu auto y el del rival
  if (o.me) drawCarSide(g, o.me, 330, 640, 520 * ART[o.me.model].len / 5, { night: true, lights: true });
  if (o.rival) {
    const x = o.rivalX ?? 950;
    drawCarSide(g, o.rival, x, 650, 540 * ART[o.rival.model].len / 5, { night: true, lights: true, flip: true, spin: o.spin || 0 });
  }
  // un velo nocturno sobre los autos
  g.fillStyle = 'rgba(20,16,50,0.18)'; g.fillRect(0, hz, W, H - hz);
}
function drawCarhop(g, x, y, t, dir) {
  g.save(); g.translate(x, y); g.scale(dir, 1);
  g.fillStyle = '#ff6a9a'; g.beginPath(); g.moveTo(-9, -36); g.lineTo(9, -36); g.lineTo(15, -10); g.lineTo(-15, -10); g.fill();
  g.fillStyle = '#f2f0ea'; g.fillRect(-7, -48, 14, 14);
  g.fillStyle = '#e0b090'; g.beginPath(); g.arc(0, -56, 7, 0, TAU); g.fill();
  g.fillStyle = '#5a3020'; g.beginPath(); g.arc(-1, -59, 7, Math.PI, 0); g.fill(); g.beginPath(); g.ellipse(-8, -56, 4, 8, 0.4, 0, TAU); g.fill();
  const k = Math.sin(t * 6) * 6;
  g.strokeStyle = '#e0b090'; g.lineWidth = 4; g.beginPath(); g.moveTo(-5, -10); g.lineTo(-5 - k, 0); g.moveTo(5, -10); g.lineTo(5 + k, 0); g.stroke();
  g.fillStyle = '#f2f0ea'; g.fillRect(-10 - k, 0, 10, 4); g.fillRect(k, 0, 10, 4);
  g.strokeStyle = '#e0b090'; g.beginPath(); g.moveTo(6, -44); g.lineTo(20, -50); g.stroke();
  g.fillStyle = '#c9ccd2'; g.fillRect(14, -54, 18, 3);
  g.fillStyle = '#ff5a5a'; g.fillRect(16, -60, 6, 6); g.fillStyle = '#f2e8c0'; g.fillRect(24, -62, 6, 8);
  g.restore();
}

// ----- La bencinera -----
function drawGasStation(g, t, car, pump = { gal: 0, cost: 0 }) {
  const sky = g.createLinearGradient(0, 0, 0, 480);
  sky.addColorStop(0, '#5fb0e8'); sky.addColorStop(1, '#d8ecf2');
  g.fillStyle = sky; g.fillRect(0, 0, W, 480);
  g.fillStyle = '#a8b89a'; g.beginPath(); g.moveTo(0, 470); for (let x = 0; x <= W; x += 30) g.lineTo(x, 420 - 30 * Math.sin(x * 0.004)); g.lineTo(W, 470); g.fill();
  palmSilhouette(g, 120, 480, 280, '#4a6a3a', 0.1);
  // edificio y techo
  g.fillStyle = '#f2ede0'; g.fillRect(60, 260, 460, 220);
  g.fillStyle = '#c22a2a'; g.fillRect(60, 250, 460, 26);
  g.fillStyle = '#fff'; g.font = font(22, 'bold', FONT_DISPLAY); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SERVICE', 290, 264);
  g.fillStyle = '#7ab0d8'; g.fillRect(90, 300, 160, 110); g.fillStyle = '#5a5a60'; g.fillRect(300, 300, 190, 180);
  g.fillStyle = 'rgba(255,255,255,0.4)'; for (let i = 0; i < 5; i++) g.fillRect(300, 310 + i * 34, 190, 3);
  g.fillStyle = '#e8e2d0'; g.fillRect(480, 160, 760, 26);
  g.fillStyle = '#c22a2a'; g.fillRect(480, 186, 760, 12);
  g.fillStyle = '#d9d2c0'; g.fillRect(560, 196, 18, 290); g.fillRect(1140, 196, 18, 290);
  // letrero de precios
  g.fillStyle = '#1e2a4a'; g.fillRect(1180, 40, 16, 150);
  g.fillStyle = '#f2ede0'; roundRect(g, 1110, 20, 160, 110, 12); g.fill();
  g.fillStyle = '#c22a2a'; g.beginPath(); g.arc(1190, 60, 34, 0, TAU); g.fill();
  g.fillStyle = '#fff'; g.font = font(20, 'bold', FONT_DISPLAY); g.fillText('GAS', 1190, 60);
  g.fillStyle = '#1e2a4a'; g.font = font(22, 'bold', FONT_SANS); g.fillText('31.9¢', 1190, 110);
  // piso
  const fl = g.createLinearGradient(0, 480, 0, H); fl.addColorStop(0, '#b8b0a0'); fl.addColorStop(1, '#8a8478');
  g.fillStyle = fl; g.fillRect(0, 480, W, H - 480);
  g.fillStyle = '#d0c8b4'; g.fillRect(560, 470, 600, 16);
  // auto
  // el auto mira a la izquierda: la tapa del estanque queda al lado del surtidor
  const csize = 600 * ART[car ? car.model : 'chevy57'].len / 5, cx = 520;
  if (car) drawCarSide(g, car, cx, 640, csize, { flip: true });
  // surtidor grande con contadores de rodillos
  const px = 900, py = 230;
  g.fillStyle = 'rgba(0,0,0,0.2)'; g.beginPath(); g.ellipse(px + 90, 650, 120, 18, 0, 0, TAU); g.fill();
  g.fillStyle = '#c22a2a'; roundRect(g, px, py + 40, 180, 380, 24); g.fill();
  const pg = g.createLinearGradient(px, 0, px + 180, 0); pg.addColorStop(0, 'rgba(255,255,255,0.25)'); pg.addColorStop(0.3, 'rgba(255,255,255,0)'); pg.addColorStop(1, 'rgba(0,0,0,0.25)');
  g.fillStyle = pg; roundRect(g, px, py + 40, 180, 380, 24); g.fill();
  // globo arriba
  g.fillStyle = '#f2ede0'; g.beginPath(); g.arc(px + 90, py + 10, 46, 0, TAU); g.fill();
  g.fillStyle = '#c22a2a'; g.font = font(18, 'bold', FONT_DISPLAY); g.fillText('ETHYL', px + 90, py + 10);
  // ventana de contadores
  g.fillStyle = '#f2ede0'; roundRect(g, px + 18, py + 80, 144, 150, 12); g.fill();
  g.fillStyle = '#333'; g.font = font(11, 'bold', FONT_SANS);
  g.fillText(LANG === 'es' ? 'DÓLARES' : 'DOLLARS', px + 90, py + 96); g.fillText(LANG === 'es' ? 'GALONES' : 'GALLONS', px + 90, py + 162);
  rollCounter(g, px + 30, py + 106, pump.cost, 2, 4);
  rollCounter(g, px + 30, py + 172, pump.gal, 1, 4);
  // manguera hacia el auto
  g.strokeStyle = '#1a1a1a'; g.lineWidth = 9; g.lineCap = 'round';
  const capX = cx + csize * 0.38, capY = 640 - csize * 0.17;
  g.beginPath(); g.moveTo(px + 10, py + 300); g.bezierCurveTo(px - 60, py + 430, capX + 60, capY + 60, capX, capY); g.stroke();
  g.fillStyle = '#9aa2ac'; roundRect(g, capX - 14, capY - 8, 26, 14, 5); g.fill();
  g.fillStyle = '#9aa2ac'; g.fillRect(px + 150, py + 250, 26, 70);
}
// Contador de rodillos de un surtidor: los números ruedan
function rollCounter(g, x, y, value, decimals, digits) {
  const n = value * Math.pow(10, decimals), cw = 30, ch = 40;
  g.save();
  for (let i = 0; i < digits; i++) {
    const place = Math.pow(10, digits - 1 - i);
    const dv = (n / place) % 10;
    const frac = i === digits - 1 ? dv % 1 : Math.max(0, (n % place) / place * 10 - 9);
    const d0 = Math.floor(dv) % 10;
    const cx = x + i * (cw + 2);
    g.fillStyle = '#111'; g.fillRect(cx, y, cw, ch);
    g.save(); g.beginPath(); g.rect(cx, y, cw, ch); g.clip();
    g.fillStyle = '#f2f0e0'; g.font = font(28, 'bold', FONT_SANS); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(d0), cx + cw / 2, y + ch / 2 - frac * ch);
    g.fillText(String((d0 + 1) % 10), cx + cw / 2, y + ch / 2 + ch - frac * ch);
    g.restore();
    if (decimals && i === digits - decimals - 1) { g.fillStyle = '#c22a2a'; g.fillRect(cx + cw - 1, y + ch - 6, 4, 4); }
  }
  const sh = g.createLinearGradient(0, y, 0, y + ch); sh.addColorStop(0, 'rgba(0,0,0,0.6)'); sh.addColorStop(0.3, 'rgba(0,0,0,0)'); sh.addColorStop(0.7, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.6)');
  g.fillStyle = sh; g.fillRect(x, y, digits * (cw + 2), ch);
  g.restore();
}

// ----- Final: fuegos artificiales sobre el drive-in -----
function drawEnding(g, t, car, win) {
  drawDiner(g, t, { me: null, rival: null });
  if (win) {
    for (let k = 0; k < 6; k++) {
      const period = 2.6, ph = (t + k * 0.43) % period, cx = 160 + hash1(k + Math.floor((t + k * 0.43) / period) * 7, 1) * 960, cy = 80 + hash1(k, 2) * 160;
      if (ph < 0.5) { g.fillStyle = '#ffe9b0'; g.fillRect(cx, 430 - (430 - cy) * ph / 0.5, 3, 10); continue; }
      const p = (ph - 0.5) / (period - 0.5), col = ['#ff4f9a', '#ffd23a', '#5fe8ff', '#7dff7a', '#ff7a3a'][k % 5];
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 28; i++) {
        const a = i / 28 * TAU, r = 120 * Math.sqrt(p);
        g.fillStyle = css(col, (1 - p) * 0.9);
        g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r + p * p * 40, 2.6, 0, TAU); g.fill();
      }
      glow(g, cx, cy, 160 * (1 - p), col, 0.25 * (1 - p));
      g.restore();
    }
  }
  if (car) drawCarSide(g, car, 640, 650, 620 * ART[car.model].len / 5, { night: true, lights: true });
}
