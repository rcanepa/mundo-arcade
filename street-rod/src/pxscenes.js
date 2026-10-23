// ===== Escenarios en pixel art: Bob's Drive-In, garaje, bencinera de Gus, cabina de la carrera =====
const STATUS_H = 20;   // la barra de estado de abajo (Bankroll y lo que está bajo el mouse)

// Un fondo dibujado una sola vez y pasado a la paleta
const _bgCache = new Map();
function pxBackground(key, draw) {
  let c = _bgCache.get(key);
  if (!c) {
    c = makeCanvas(PW, PH);
    const g = c.getContext('2d');
    draw(g);
    if (g.getImageData) { const img = g.getImageData(0, 0, PW, PH); pixelize(img, 30); g.putImageData(img, 0, 0); }
    _bgCache.set(key, c);
  }
  return c;
}
function stars(g, x0, y0, w, h, n, seed = 3) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) { g.fillStyle = R() < 0.25 ? PAL.g5 : R() < 0.5 ? PAL.g3 : PAL.w; g.fillRect(x0 + Math.floor(R() * w), y0 + Math.floor(R() * h), 1, 1); }
}

// Letras gigantes hechas de ampolletas (BOB'S DRIVE-IN)
function bulbText(g, s, x, y, size, on, off, lit = 1) {
  const step = size;
  let cx = x;
  for (const ch of s) {
    const pts = FONT[ch] || [];
    for (const [px, py] of pts) {
      const bx = cx + px * step, by = y + py * step;
      g.fillStyle = off; g.fillRect(bx, by, step - 1, step - 1);
      g.fillStyle = on; g.fillRect(bx + 1, by + 1, step - 3, step - 3);
      if (lit) { g.fillStyle = PAL.w; g.fillRect(bx + 1, by + 1, Math.max(1, step / 3 | 0), Math.max(1, step / 3 | 0)); }
    }
    cx += (FONT_W + 1) * step;
  }
}

// ----- Personas (sprites de pixel art) -----
function pxPerson(kind, look = {}) {
  const key = 'person:' + kind + JSON.stringify(look);
  let c = PXCACHE.get(key);
  if (c) return c;
  const skin = look.skin || PAL.b5, hair = look.hair || PAL.k, K = look.k || 1.35;
  const spr = (w, h, draw) => pixelSprite(Math.ceil(w * K), Math.ceil(h * K), g => { g.scale(K, K); draw(g); });
  if (kind === 'post') {
    // el tipo apoyado en el poste: polera blanca, jeans, jopo negro, brazos cruzados
    c = spr(34, 92, g => {
      g.fillStyle = PAL.u2; g.fillRect(9, 50, 7, 38); g.fillRect(17, 50, 7, 38);
      g.fillStyle = PAL.u3; g.fillRect(10, 52, 2, 34); g.fillRect(18, 52, 2, 34);
      g.fillStyle = PAL.k; g.fillRect(7, 86, 9, 5); g.fillRect(17, 86, 10, 5);
      g.fillStyle = PAL.w; g.beginPath(); g.moveTo(5, 24); g.lineTo(28, 24); g.lineTo(26, 52); g.lineTo(8, 52); g.fill();
      g.fillStyle = PAL.g6; g.fillRect(8, 40, 18, 3);
      g.fillStyle = skin; g.fillRect(4, 34, 24, 6); g.fillRect(13, 18, 7, 7);
      g.beginPath(); g.ellipse(16.5, 12, 6.5, 8, 0, 0, TAU); g.fill();
      g.fillStyle = hair; g.beginPath(); g.ellipse(15, 5, 8, 4.5, -0.2, 0, TAU); g.fill(); g.fillRect(9, 4, 4, 9);
      g.fillStyle = PAL.k; g.fillRect(18, 11, 2, 2);
    });
  } else if (kind === 'waitress') {
    // la mesera en patines con su bandeja
    c = spr(36, 70, g => {
      g.fillStyle = skin; g.fillRect(13, 46, 4, 16); g.fillRect(19, 46, 4, 16);
      g.fillStyle = PAL.w; g.fillRect(10, 61, 9, 4); g.fillRect(18, 61, 9, 4);
      g.fillStyle = PAL.r3; g.fillRect(11, 65, 2, 3); g.fillRect(16, 65, 2, 3); g.fillRect(19, 65, 2, 3); g.fillRect(24, 65, 2, 3);
      g.fillStyle = PAL.m3; g.beginPath(); g.moveTo(12, 22); g.lineTo(24, 22); g.lineTo(29, 47); g.lineTo(7, 47); g.fill();
      g.fillStyle = PAL.w; g.fillRect(13, 30, 10, 14);
      g.fillStyle = skin; g.fillRect(16, 16, 4, 6); g.beginPath(); g.ellipse(18, 11, 5, 6, 0, 0, TAU); g.fill();
      g.fillStyle = PAL.y2; g.beginPath(); g.ellipse(17, 7, 6.5, 4, 0, 0, TAU); g.fill(); g.fillRect(11, 7, 3, 10);
      g.fillStyle = PAL.m4; g.fillRect(14, 2, 7, 2);
      g.fillStyle = skin; g.fillRect(24, 24, 9, 3);
      g.fillStyle = PAL.g6; g.fillRect(25, 21, 11, 2);
      g.fillStyle = PAL.r3; g.fillRect(27, 15, 3, 6); g.fillStyle = PAL.c1; g.fillRect(31, 17, 3, 4);
    });
  } else if (kind === 'cook') {
    c = spr(30, 34, g => {
      g.fillStyle = PAL.w; g.fillRect(4, 18, 22, 16); g.fillRect(9, 0, 12, 7);
      g.fillStyle = skin; g.beginPath(); g.ellipse(15, 12, 6, 6.5, 0, 0, TAU); g.fill();
      g.fillStyle = PAL.k; g.fillRect(11, 10, 2, 2); g.fillRect(17, 10, 2, 2); g.fillRect(11, 15, 8, 2);
    });
  } else {
    // cliente sentado en el mesón: cabeza y hombros
    c = spr(20, 24, g => {
      g.fillStyle = look.top || PAL.r3; g.beginPath(); g.ellipse(10, 24, 10, 8, 0, Math.PI, 0); g.fill();
      g.fillStyle = skin; g.beginPath(); g.ellipse(10, 10, 5.5, 6.5, 0, 0, TAU); g.fill();
      g.fillStyle = hair; g.beginPath(); g.ellipse(10, 5, 6.5, 4, 0, 0, TAU); g.fill();
      if (look.long) g.fillRect(3, 5, 3, 10);
    });
  }
  PXCACHE.set(key, c);
  return c;
}

// ----- Bob's Drive-In -----
function driveInBackground() {
  return pxBackground('drivein', g => {
    g.fillStyle = PAL.k; g.fillRect(0, 0, PW, PH);
    stars(g, 0, 0, PW, 250, 160);
    // letrero de ampolletas sobre una franja negra
    bulbText(g, "BOB'S DRIVE-IN", 34, -4, 7, PAL.m3, PAL.m1);
    // alero con franjas rosadas y blancas
    for (let x = 0; x < PW; x += 16) { g.fillStyle = (x / 16) % 2 ? PAL.m4 : PAL.r3; g.fillRect(x, 72, 16, 26); }
    g.fillStyle = PAL.m2; g.fillRect(0, 96, PW, 6);
    g.fillStyle = PAL.r2; g.fillRect(0, 70, PW, 3);
    for (let x = 6; x < PW; x += 12) { g.fillStyle = PAL.y3; g.fillRect(x, 103, 3, 3); g.fillStyle = PAL.w; g.fillRect(x, 103, 1, 1); }
    // fachada con ventanales iluminados
    g.fillStyle = PAL.g4; g.fillRect(0, 108, PW, 140);
    const winTop = 116, winBot = 214;
    for (let i = 0; i < 6; i++) {
      const x = 8 + i * 106;
      const wg = g.createLinearGradient(0, winTop, 0, winBot);
      wg.addColorStop(0, PAL.y3); wg.addColorStop(1, PAL.c2);
      g.fillStyle = wg; g.fillRect(x, winTop, 96, winBot - winTop);
      // lámparas del techo del local
      for (let k = 0; k < 3; k++) { g.fillStyle = PAL.y2; g.fillRect(x + 14 + k * 30, winTop + 4, 10, 4); }
      // mesón
      g.fillStyle = PAL.r2; g.fillRect(x, winBot - 26, 96, 8);
      g.fillStyle = PAL.g6; g.fillRect(x, winBot - 18, 96, 18);
    }
    // ventana de pedidos con el letrero ORDER
    g.fillStyle = PAL.y2; g.fillRect(262, 118, 70, 16); g.fillStyle = PAL.r3; g.fillRect(264, 120, 66, 12);
    ptext(g, 'ORDER', 297, 119, PAL.w, 1, { align: 'center' });
    // tablero a cuadros bajo las ventanas
    for (let x = 0; x < PW; x += 8) for (let r = 0; r < 2; r++) { g.fillStyle = ((x / 8) + r) % 2 ? PAL.k : PAL.w; g.fillRect(x, 214 + r * 8, 8, 8); }
    g.fillStyle = PAL.g2; g.fillRect(0, 230, PW, 22);
    // pilares turquesa
    for (let i = 0; i <= 6; i++) { const x = i * 106; g.fillStyle = PAL.t2; g.fillRect(x, 102, 8, 150); g.fillStyle = PAL.t4; g.fillRect(x + 1, 102, 2, 150); }
    // estacionamiento
    const lot = g.createLinearGradient(0, 252, 0, 360);
    lot.addColorStop(0, PAL.g1); lot.addColorStop(1, PAL.g2);
    g.fillStyle = lot; g.fillRect(0, 252, PW, 110);
    // vereda y solera
    g.fillStyle = PAL.g5; g.fillRect(0, 360, PW, 6);
    g.fillStyle = PAL.g6; g.fillRect(0, 360, PW, 2);
    g.fillStyle = PAL.g4; g.fillRect(0, 366, PW, 18);
    g.fillStyle = PAL.g3; for (let x = 0; x < PW; x += 40) g.fillRect(x, 366, 2, 18);
    // poste para amarrar (bolardo)
    g.fillStyle = PAL.g5; g.beginPath(); g.ellipse(36, 342, 16, 6, 0, 0, TAU); g.fill();
    g.fillStyle = PAL.g4; g.fillRect(28, 342, 16, 20);
    g.fillStyle = PAL.g6; g.fillRect(30, 344, 3, 16);
    g.fillStyle = PAL.g3; g.beginPath(); g.ellipse(36, 362, 14, 4, 0, 0, TAU); g.fill();
  });
}
const DINER_CROWD = [
  [30, '#d02c2c', '#3a2010'], [70, '#1c3ca8', '#000000', 1], [130, '#3cc03c', '#a0602c'], [176, '#e04ab0', '#f0c830', 1],
  [350, '#ffffff', '#000000'], [392, '#9a6ae0', '#6a3c1c', 1], [450, '#ff9a3c', '#000000'], [560, '#3cd0d0', '#d89a60', 1], [600, '#d02c2c', '#000000']
];
// o = { car (el del rival, ya estacionado o llegando), carX, waitressX, postGuy, hover }
function drawDriveIn(g, t, o = {}) {
  g.drawImage(driveInBackground(), 0, 0);
  // clientes en el mesón y el cocinero
  for (const [x, top, hair, long] of DINER_CROWD) g.drawImage(pxPerson('client', { top, hair, long, k: 1.15 }), x, 162 + Math.round(Math.sin(t * 1.3 + x) * 0.8));
  g.drawImage(pxPerson('cook', { k: 1.2 }), 280, 146);
  // autos estacionados al fondo
  if (o.bgCars) {
    g.drawImage(o.bgCars[0], -60, 206);
    g.drawImage(o.bgCars[1], 420, 210);
  }
  // el tipo del poste (sirve para llamar a un rival) y la mesera
  g.drawImage(pxPerson('post'), 314, 150);
  const wx = Math.round(o.waitressX ?? (320 + Math.sin(t * 0.45) * 240));
  const w = pxPerson('waitress');
  if (Math.cos(t * 0.45) < 0) { g.save(); g.translate(wx + w.width, 0); g.scale(-1, 1); g.drawImage(w, 0, 196); g.restore(); }
  else g.drawImage(w, wx, 196);
  // el auto del rival, grande en primer plano
  if (o.car) g.drawImage(o.car, Math.round(o.carX ?? 120), Math.round(366 - o.car.height + 2));
}

// ----- Barra de estado (abajo, como en el original) -----
function statusBar(g, left, right = '', mid = '') {
  g.fillStyle = PAL.g2; g.fillRect(0, PH - STATUS_H, PW, STATUS_H);
  g.fillStyle = PAL.g3; g.fillRect(0, PH - STATUS_H, PW, 1);
  ptext(g, left, 6, PH - STATUS_H, PAL.r4, 2);
  // lo del medio va centrado en el espacio libre; si no cabe, se esconde lo de la derecha
  const lw = left ? textWidth(left, 2) + 18 : 6, mw = mid ? textWidth(mid, 2) : 0;
  let rw = right ? textWidth(right, 2) + 18 : 6;
  if (mid && mw > PW - lw - rw) rw = 6;
  else if (right) ptext(g, right, PW - 6, PH - STATUS_H, PAL.r4, 2, { align: 'right' });
  if (mid) ptext(g, mid, lw + Math.max(0, (PW - lw - rw - mw) / 2), PH - STATUS_H, PAL.y3, 2);
}

// Globo de diálogo (como "It's yours!" del original)
function speechBubble(g, text, x, y, tailX, tailY, o = {}) {
  const lines = wrapText(text, o.maxW || 300, 2);
  const w = Math.max(...lines.map(l => textWidth(l, 2))) + 24, h = lines.length * 22 + 12;
  const bx = clamp(Math.round(x - w / 2), 4, PW - w - 4), by = Math.round(y);
  g.fillStyle = PAL.t3; g.fillRect(bx - 2, by - 2, w + 4, h + 4);
  g.fillStyle = PAL.w; g.fillRect(bx, by, w, h);
  g.beginPath(); g.moveTo(clamp(tailX, bx + 10, bx + w - 30), by + h); g.lineTo(clamp(tailX, bx + 10, bx + w - 30) + 18, by + h); g.lineTo(tailX, tailY); g.fill();
  lines.forEach((l, i) => ptext(g, l, bx + w / 2, by + 8 + i * 22, PAL.k, 2, { align: 'center' }));
}

// Foto de carnet: cara de frente con el peinado de los 60 (licencia de conducir y final)
function pxPortrait(look, w = 110, h = 130) {
  const key = 'portrait:' + JSON.stringify(look) + w;
  let c = PXCACHE.get(key);
  if (c) return c;
  const skin = look.skin || PAL.b5, hair = look.hc || PAL.b1, k = w / 110;
  c = pixelSprite(w, h, g => {
    g.scale(k, k);
    g.fillStyle = look.top || PAL.w; g.beginPath(); g.ellipse(55, 142, 58, 42, 0, 0, TAU); g.fill();
    g.fillStyle = css(shade(skin, -0.12)); g.fillRect(44, 82, 22, 22);
    g.fillStyle = skin; g.beginPath(); g.ellipse(30, 62, 6, 9, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(80, 62, 6, 9, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(55, 60, 25, 31, 0, 0, TAU); g.fill();
    // jopo y patillas
    g.fillStyle = hair; g.beginPath(); g.ellipse(55, 36, 28, 15, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(62, 26, 22, 11, -0.2, 0, TAU); g.fill();
    g.fillRect(28, 36, 7, 22); g.fillRect(75, 36, 7, 22);
    g.fillStyle = css(shade(hair, 0.35)); g.fillRect(50, 21, 22, 3);
    if (look.shades) { g.fillStyle = PAL.k; g.fillRect(36, 54, 38, 11); g.fillStyle = PAL.g4; g.fillRect(40, 56, 8, 2); g.fillRect(60, 56, 8, 2); }
    else {
      g.fillStyle = hair; g.fillRect(40, 51, 11, 3); g.fillRect(59, 51, 11, 3);
      g.fillStyle = PAL.w; g.fillRect(41, 57, 9, 5); g.fillRect(60, 57, 9, 5);
      g.fillStyle = PAL.k; g.fillRect(45, 57, 4, 5); g.fillRect(64, 57, 4, 5);
    }
    g.fillStyle = css(shade(skin, -0.2)); g.fillRect(53, 64, 4, 12);
    g.fillStyle = PAL.r2; g.fillRect(47, 80, 16, 3);
    // cuello de la camisa
    g.fillStyle = css(shade(look.top || PAL.w, -0.15)); g.beginPath(); g.moveTo(40, 102); g.lineTo(55, 112); g.lineTo(70, 102); g.lineTo(66, 98); g.lineTo(55, 106); g.lineTo(44, 98); g.fill();
  }, { outline: false });
  PXCACHE.set(key, c);
  return c;
}
