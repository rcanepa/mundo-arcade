// ===== La calle de noche: trazado de la pista, adornos y dibujo en perspectiva (3D falso) =====
// Todo se mide en metros. La pista es una lista de tramos de SEG metros con su curva (1/radio) y su altura.
const SEG = 5, ROAD_W = 3.6, LANE = 1.8, DRAW_SEGS = 240;
const HORIZON = 286, CAM_D = 1.3, CAM_H = 1.15;   // línea del horizonte, profundidad de la cámara y altura de los ojos

// ----- Adornos del costado (se dibujan una vez en un canvas aparte) -----
// Cada adorno tiene: ancho y alto en metros, imagen iluminada, silueta oscura y lo que brilla solo (neón, ventanas, focos)
const SPRITES = {};
function spriteCanvas(wm, hm, ppm = 40) { const c = makeCanvas(wm * ppm, hm * ppm); return { c, g: c.getContext('2d'), ppm }; }
function defSprite(key, wm, hm, draw, o = {}) {
  const lit = spriteCanvas(wm, hm), emit = spriteCanvas(wm, hm), dark = spriteCanvas(wm, hm);
  const P = lit.ppm;
  for (const L of [lit, emit, dark]) { L.g.translate(L.c.width / 2, L.c.height); L.g.scale(P, P); }
  draw(lit.g, emit.g);
  // silueta: la misma forma, casi negra, con un borde de luz de luna
  dark.g.setTransform(1, 0, 0, 1, 0, 0);
  dark.g.drawImage(lit.c, 0, 0);
  dark.g.globalCompositeOperation = 'source-atop';
  const dg = dark.g.createLinearGradient(0, 0, 0, dark.c.height);
  dg.addColorStop(0, 'rgba(32,38,58,0.94)'); dg.addColorStop(1, 'rgba(6,7,12,0.98)');
  dark.g.fillStyle = dg; dark.g.fillRect(0, 0, dark.c.width, dark.c.height);
  SPRITES[key] = { w: wm, h: hm, lit: lit.c, emit: o.emit ? emit.c : null, dark: dark.c, hit: o.hit ?? 0, refl: o.refl || 0, lamp: o.lamp || 0, pole: o.pole || 0, flip: o.flip || 0 };
}
function buildSprites() {
  if (SPRITES.palm) return;
  const R = rng(7);
  // farol de la calle (luz de sodio anaranjada)
  defSprite('lamp', 5, 10, (g, e) => {
    g.fillStyle = '#5d6168'; g.fillRect(1.6, -9.2, 0.22, 9.2);
    g.strokeStyle = '#5d6168'; g.lineWidth = 0.16; g.beginPath(); g.moveTo(1.7, -9); g.quadraticCurveTo(1.6, -9.8, 0, -9.7); g.lineTo(-1.2, -9.6); g.stroke();
    g.fillStyle = '#7b8088'; g.beginPath(); g.ellipse(-1.4, -9.55, 0.9, 0.28, 0, 0, TAU); g.fill();
    e.fillStyle = '#ffd08a'; e.beginPath(); e.ellipse(-1.4, -9.4, 0.7, 0.16, 0, 0, TAU); e.fill();
  }, { emit: 1, hit: 0.4, lamp: 1, flip: 1 });
  // poste de teléfono
  defSprite('pole', 3, 10, g => {
    g.fillStyle = '#4a3a2a'; g.fillRect(-0.15, -9.6, 0.3, 9.6);
    g.fillRect(-1.3, -8.8, 2.6, 0.22); g.fillRect(-0.9, -8, 1.8, 0.18);
    g.fillStyle = '#b8d2d8'; for (const x of [-1.2, -0.6, 0.6, 1.2]) g.fillRect(x - 0.06, -9.05, 0.12, 0.25);
  }, { hit: 0.4, pole: 1 });
  // palmera alta
  defSprite('palm', 8, 15, g => {
    g.strokeStyle = '#5a4630'; g.lineWidth = 0.45; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(0.2, -5, -0.5, -10, 0.3, -13.5); g.stroke();
    for (let i = 0; i < 11; i++) {
      const a = -Math.PI / 2 + (i / 10 - 0.5) * 3.4, l = 3.2 + R() * 1.2;
      g.strokeStyle = i % 2 ? '#2f5a2c' : '#3d6e34'; g.lineWidth = 0.32;
      g.beginPath(); g.moveTo(0.3, -13.5);
      g.quadraticCurveTo(0.3 + Math.cos(a) * l * 0.6, -13.5 + Math.sin(a) * l * 0.5 - 0.8, 0.3 + Math.cos(a) * l, -13.5 + Math.sin(a) * l * 0.3 + 1.6);
      g.stroke();
    }
    g.fillStyle = '#4a3a22'; g.beginPath(); g.arc(0.3, -13.4, 0.45, 0, TAU); g.fill();
  }, { hit: 0.5 });
  // naranjo de los huertos
  defSprite('orange', 5, 5, g => {
    g.fillStyle = '#4a3624'; g.fillRect(-0.18, -1.6, 0.36, 1.6);
    g.fillStyle = '#2c5a2a'; g.beginPath(); g.ellipse(0, -2.6, 2.2, 1.9, 0, 0, TAU); g.fill();
    g.fillStyle = '#3c7434'; g.beginPath(); g.ellipse(-0.4, -3, 1.5, 1.2, 0, 0, TAU); g.fill();
    g.fillStyle = '#f08a1c'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc((R() - 0.5) * 3.4, -2.6 + (R() - 0.5) * 2.6, 0.13, 0, TAU); g.fill(); }
  }, { hit: 0.8 });
  // eucalipto
  defSprite('tree', 7, 11, g => {
    g.fillStyle = '#6d6a5e'; g.fillRect(-0.25, -5, 0.5, 5);
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#3d5a3a' : '#486a42'; g.beginPath(); g.ellipse((R() - 0.5) * 4, -6 - R() * 4, 1.6 + R(), 1.3 + R() * 0.8, 0, 0, TAU); g.fill(); }
  }, { hit: 0.7 });
  // casa de un piso con ventanas encendidas
  defSprite('house', 13, 6, (g, e) => {
    g.fillStyle = '#d8cbb0'; g.fillRect(-5.5, -3.2, 11, 3.2);
    g.fillStyle = '#7a4a36'; g.beginPath(); g.moveTo(-6.4, -3.1); g.lineTo(-3, -5.2); g.lineTo(3, -5.2); g.lineTo(6.4, -3.1); g.fill();
    g.fillStyle = '#4c4a48'; g.fillRect(3.4, -2.4, 1, 2.4);
    for (const x of [-4.4, -1.8, 0.8]) { g.fillStyle = '#2b3140'; g.fillRect(x, -2.3, 1.6, 1.1); e.fillStyle = R() < 0.7 ? '#ffd890' : '#a8c4ff'; if (R() < 0.75) e.fillRect(x + 0.1, -2.2, 1.4, 0.9); }
    e.fillStyle = '#ffe2a0'; e.beginPath(); e.arc(3.1, -2.6, 0.12, 0, TAU); e.fill();
  }, { emit: 1, hit: 1 });
  // negocios con letrero de neón
  const neon = [['MOTEL', '#ff4f7b'], ['BAR', '#57d7ff'], ['DINER', '#ffde59'], ['BOWL', '#7dff7a'], ['TV', '#ff9a3c']];
  neon.forEach(([word, col], i) => defSprite('store' + i, 12, 8, (g, e) => {
    g.fillStyle = ['#c9b79a', '#9fb3b8', '#c8a49a', '#b7b19a', '#a8a2b8'][i]; g.fillRect(-5.5, -4.6, 11, 4.6);
    g.fillStyle = '#5a554e'; g.fillRect(-5.8, -4.9, 11.6, 0.35);
    g.fillStyle = '#2b3140'; g.fillRect(-4.8, -3.4, 6, 2.2); g.fillRect(2.2, -3.2, 1.4, 3.2);
    e.fillStyle = 'rgba(255,220,150,0.85)'; e.fillRect(-4.6, -3.2, 5.6, 1.8);
    // letrero en un poste
    g.fillStyle = '#3a3a3e'; g.fillRect(4.4, -7.4, 0.2, 7.4);
    g.fillStyle = '#1a1a1e'; roundRect(g, 1.6, -7.8, 5.6, 1.9, 0.3); g.fill();
    e.font = 'bold 1.2px ' + FONT_SANS; e.textAlign = 'center'; e.textBaseline = 'middle';
    e.shadowColor = col; e.shadowBlur = 0.6; e.fillStyle = col; e.fillText(word, 4.4, -6.82);
    e.strokeStyle = col; e.lineWidth = 0.08; roundRect(e, 1.75, -7.65, 5.3, 1.6, 0.25); e.stroke();
  }, { emit: 1, hit: 1 }));
  // cartel publicitario iluminado por focos
  const ads = [['LUCKY\'S', 'DRIVE-IN', '#e8452c', '#fff3d6'], ['GAS 31¢', 'REGULAR', '#1f5fa8', '#ffe46b'], ['DRINK', 'COLA ICE COLD', '#b3202a', '#ffffff'], ['VISIT', 'PALM SPRINGS', '#3fb7a8', '#fff6dc']];
  ads.forEach(([a, b, bg, fg], i) => defSprite('board' + i, 10, 8, (g, e) => {
    g.fillStyle = '#4a3a2a'; g.fillRect(-3.6, -4, 0.25, 4); g.fillRect(3.35, -4, 0.25, 4);
    g.fillStyle = bg; g.fillRect(-4.6, -7.6, 9.2, 3.8);
    g.fillStyle = fg; g.font = 'bold 1.5px ' + FONT_DISPLAY; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(a, 0, -6.6); g.font = 'bold 0.85px ' + FONT_SANS; g.fillText(b, 0, -5);
    e.fillStyle = 'rgba(255,240,200,0.22)'; e.fillRect(-4.6, -7.6, 9.2, 3.8);
    e.fillStyle = '#fff2c8'; for (const x of [-2.4, 2.4]) { e.beginPath(); e.arc(x, -3.7, 0.16, 0, TAU); e.fill(); }
  }, { emit: 1, hit: 0.6 }));
  // rocas del cañón
  for (let i = 0; i < 3; i++) defSprite('rock' + i, 14, 12, g => {
    const pts = []; const n = 9;
    for (let k = 0; k <= n; k++) { const x = -6.5 + 13 * k / n; pts.push([x, -(3 + R() * 7) * Math.sin(Math.PI * k / n) - 0.3]); }
    g.fillStyle = ['#8a6a4e', '#7a5c44', '#94735a'][i];
    g.beginPath(); g.moveTo(-6.6, 0); for (const p of pts) g.lineTo(p[0], p[1]); g.lineTo(6.6, 0); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.2)';
    for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-5 + R() * 10, 0); g.lineTo(-4 + R() * 8, -2 - R() * 5); g.lineTo(-3 + R() * 8, 0); g.fill(); }
  }, { hit: 1 });
  // árbol de Josué y cactus del desierto
  defSprite('joshua', 5, 6, g => {
    g.strokeStyle = '#5a5040'; g.lineCap = 'round'; g.lineWidth = 0.3;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -3); g.lineTo(-1.4, -4.4); g.moveTo(0, -3); g.lineTo(1.2, -4.8); g.moveTo(0, -2.2); g.lineTo(1.6, -3.2); g.stroke();
    g.fillStyle = '#5d7a3a'; for (const [x, y] of [[-1.4, -4.6], [1.2, -5], [1.6, -3.4]]) { g.beginPath(); g.arc(x, y, 0.5, 0, TAU); g.fill(); }
  }, { hit: 0.5 });
  // balancín de petróleo con una luz roja arriba
  defSprite('pump', 9, 7, (g, e) => {
    g.fillStyle = '#2d2d30'; g.fillRect(-3.5, -0.4, 7, 0.4);
    g.strokeStyle = '#3c3c42'; g.lineWidth = 0.25; g.beginPath(); g.moveTo(-1, 0); g.lineTo(0, -3.6); g.lineTo(1, 0); g.stroke();
    g.fillStyle = '#4a4a50'; g.save(); g.translate(0, -3.6); g.rotate(-0.15); g.fillRect(-3.6, -0.25, 6.2, 0.5);
    g.beginPath(); g.moveTo(-3.6, -0.6); g.quadraticCurveTo(-4.6, 0, -3.6, 1.2); g.lineTo(-3.3, 0.6); g.fill(); g.restore();
    g.fillStyle = '#8a2a1a'; g.fillRect(2.2, -1.8, 1, 1.4);
  }, { hit: 1 });
  defSprite('derrick', 6, 16, (g, e) => {
    g.strokeStyle = '#3a3a3e'; g.lineWidth = 0.15;
    g.beginPath(); g.moveTo(-2.4, 0); g.lineTo(-0.3, -15); g.lineTo(0.3, -15); g.lineTo(2.4, 0); g.stroke();
    for (let y = -1.5; y > -15; y -= 1.5) { const w = 2.4 * (1 + y / 15.5); g.beginPath(); g.moveTo(-w, y); g.lineTo(w, y - 1.5 * 0.9); g.moveTo(w, y); g.lineTo(-w, y - 1.5 * 0.9); g.stroke(); }
    e.fillStyle = '#ff3020'; e.beginPath(); e.arc(0, -15.3, 0.25, 0, TAU); e.fill();
  }, { emit: 1, hit: 1 });
  // señal amarilla de curva (brilla con los faros)
  for (const d of [-1, 1]) defSprite(d < 0 ? 'chevL' : 'chevR', 1.6, 2.4, g => {
    g.fillStyle = '#4a4a4a'; g.fillRect(-0.06, -1.4, 0.12, 1.4);
    g.fillStyle = '#ffcc1a'; g.fillRect(-0.7, -2.3, 1.4, 1.1);
    g.fillStyle = '#111'; g.beginPath(); g.moveTo(-0.3 * d, -2.15); g.lineTo(0.3 * d, -1.75); g.lineTo(-0.3 * d, -1.35); g.lineTo(-0.1 * d, -1.75); g.fill();
  }, { refl: 1, hit: 0.3 });
  // poste blanco con reflectante
  defSprite('post', 0.4, 1.2, g => {
    g.fillStyle = '#e8e6e0'; g.fillRect(-0.08, -1.1, 0.16, 1.1);
    g.fillStyle = '#ff9a2a'; g.fillRect(-0.07, -1.0, 0.14, 0.22);
  }, { refl: 1 });
  // cerco de madera
  defSprite('fence', 6, 1.6, g => {
    g.fillStyle = '#7a6448'; for (let x = -2.8; x <= 2.8; x += 1.4) g.fillRect(x - 0.06, -1.3, 0.12, 1.3);
    g.fillRect(-3, -1.1, 6, 0.1); g.fillRect(-3, -0.6, 6, 0.1);
  });
  // estanque de agua del pueblo
  defSprite('tower', 9, 18, (g, e) => {
    g.strokeStyle = '#5a5a60'; g.lineWidth = 0.2;
    g.beginPath(); for (const x of [-2.6, -0.9, 0.9, 2.6]) { g.moveTo(x * 0.8, -11); g.lineTo(x, 0); } g.stroke();
    g.fillStyle = '#b9bec4'; roundRect(g, -3.4, -16, 6.8, 5, 1.2); g.fill();
    g.fillStyle = '#9aa0a8'; g.beginPath(); g.moveTo(-3.6, -16); g.lineTo(0, -17.8); g.lineTo(3.6, -16); g.fill();
    g.fillStyle = '#2a4a7a'; g.font = 'bold 1.1px ' + FONT_DISPLAY; g.textAlign = 'center'; g.fillText('SAN LUCAS', 0, -13);
    e.fillStyle = '#ff3020'; e.beginPath(); e.arc(0, -17.9, 0.18, 0, TAU); e.fill();
  }, { emit: 1, hit: 1 });
  // público: siluetas con linternas y cigarrillos encendidos
  for (let i = 0; i < 3; i++) defSprite('crowd' + i, 8, 2.4, (g, e) => {
    for (let k = 0; k < 7; k++) {
      const x = -3.4 + k * 1.1 + (R() - 0.5) * 0.4, hgt = 1.55 + R() * 0.3;
      g.fillStyle = ['#3a4c6a', '#6a2f2f', '#2f2f36', '#d8d2c0', '#5b2a86', '#3fb7a8'][Math.floor(R() * 6)];
      roundRect(g, x - 0.24, -hgt + 0.3, 0.48, hgt - 0.3, 0.12); g.fill();
      g.fillStyle = '#d9a47e'; g.beginPath(); g.arc(x, -hgt + 0.12, 0.14, 0, TAU); g.fill();
      g.fillStyle = '#1a1411'; g.beginPath(); g.arc(x, -hgt + 0.06, 0.14, Math.PI, 0); g.fill();
      if (R() < 0.3) { e.fillStyle = '#fff6d0'; e.beginPath(); e.arc(x + 0.25, -hgt * 0.62, 0.07, 0, TAU); e.fill(); }
      if (R() < 0.25) { e.fillStyle = '#ff7a2a'; e.beginPath(); e.arc(x + 0.1, -hgt + 0.08, 0.035, 0, TAU); e.fill(); }
    }
  }, { emit: 1, hit: 1 });
  // auto estacionado mirando a la calle con los faros prendidos
  defSprite('parked', 2.4, 1.8, (g, e) => {
    g.fillStyle = '#3a3a40'; roundRect(g, -1.05, -1.0, 2.1, 0.7, 0.2); g.fill();
    g.beginPath(); g.moveTo(-0.85, -1); g.lineTo(-0.65, -1.5); g.lineTo(0.65, -1.5); g.lineTo(0.85, -1); g.fill();
    g.fillStyle = '#111'; g.fillRect(-0.95, -0.35, 0.3, 0.35); g.fillRect(0.65, -0.35, 0.3, 0.35);
    e.fillStyle = '#fff6d8'; for (const x of [-0.72, 0.72]) { e.beginPath(); e.arc(x, -0.75, 0.13, 0, TAU); e.fill(); }
  }, { emit: 1, hit: 1 });
  // galpones del aeródromo
  defSprite('hangar', 22, 9, (g, e) => {
    g.fillStyle = '#8a8f96'; g.beginPath(); g.moveTo(-10, 0); g.lineTo(-10, -5); g.quadraticCurveTo(0, -11, 10, -5); g.lineTo(10, 0); g.fill();
    g.fillStyle = '#5a5f66'; g.fillRect(-6, -4.5, 12, 4.5);
    e.fillStyle = 'rgba(255,230,170,0.7)'; e.fillRect(-0.4, -6.6, 0.8, 0.5);
    e.fillStyle = '#ffe6a0'; e.beginPath(); e.arc(-8, -5.4, 0.15, 0, TAU); e.arc(8, -5.4, 0.15, 0, TAU); e.fill();
  }, { emit: 1, hit: 1 });
}

// ----- Pistas -----
function addSeg(T, curve, y, zone) {
  T.segs.push({ i: T.segs.length, curve, y, zone, sprites: [], light: 0, mark: 0 });
}
// Tramos con entrada y salida suaves para curvas y lomas
function addRun(T, n, curve, dy, zone) {
  const y0 = T.segs.length ? T.segs[T.segs.length - 1].y : 0;
  const ein = Math.max(1, Math.floor(n * 0.25)), eout = ein;
  for (let k = 0; k < n; k++) {
    const t = k / n, c = k < ein ? curve * smooth(k / ein) : k > n - eout ? curve * smooth((n - k) / eout) : curve;
    addSeg(T, c, y0 + dy * (1 - Math.cos(Math.PI * t)) / 2, zone);
  }
}
function placeSprite(T, i, key, side, off) {
  if (i < 0 || i >= T.segs.length) return;
  T.segs[i].sprites.push({ key, x: side * (ROAD_W + off), side });
}
// Luz de los faroles en el asfalto (se suma a la de los focos del auto)
function bakeLights(T) {
  T.segs.forEach((s, i) => {
    for (const sp of s.sprites) if (SPRITES[sp.key] && SPRITES[sp.key].lamp) {
      for (let k = -4; k <= 4; k++) {
        const j = i + k; if (j < 0 || j >= T.segs.length) continue;
        T.segs[j].light = Math.min(1, T.segs[j].light + Math.max(0, 1 - Math.abs(k) / 4.2) * 0.9);
      }
    }
  });
}

// La recta de picadas: el viejo aeródromo de San Lucas, con público en la partida y en la meta
function buildDragStrip(seed) {
  buildSprites();
  const R = rng(seed), T = { kind: 'drag', segs: [], start: 60, finish: 60 + QUARTER };
  const n = Math.ceil((60 + QUARTER + 420) / SEG) + DRAW_SEGS;
  for (let i = 0; i < n; i++) addSeg(T, 0, Math.sin(i / 37) * 0.6, 'strip');
  const si = Math.floor(T.start / SEG), fi = Math.floor(T.finish / SEG);
  T.segs[si].mark = 1; T.segs[fi].mark = 2;
  for (let i = 0; i < n; i += 8) {
    placeSprite(T, i, 'pole', -1, 6 + R() * 2);
    if (i % 24 === 0) placeSprite(T, i + 3, 'lamp', 1, 1.2);
  }
  for (let k = 1; k <= 7; k++) { placeSprite(T, si + k, 'crowd' + ((k + 9) % 3), k % 2 ? 1 : -1, 4.5 + R() * 3); }
  placeSprite(T, si + 3, 'parked', -1, 2.2); placeSprite(T, si + 5, 'parked', 1, 2.4); placeSprite(T, si + 8, 'parked', 1, 3);
  for (let k = -2; k <= 4; k++) placeSprite(T, fi + k, 'crowd' + (k + 6) % 3, k % 2 ? -1 : 1, 2 + R() * 2);
  placeSprite(T, fi - 1, 'parked', 1, 1.5); placeSprite(T, fi + 2, 'parked', -1, 1.5);
  placeSprite(T, si + 30, 'hangar', -1, 22); placeSprite(T, si + 52, 'hangar', -1, 24); placeSprite(T, fi + 20, 'tower', 1, 26);
  placeSprite(T, si + 12, 'board0', 1, 9); placeSprite(T, si + 44, 'board1', 1, 10); placeSprite(T, fi + 8, 'board2', -1, 9);
  for (let i = si + 8; i < n; i += 5 + Math.floor(R() * 6)) placeSprite(T, i, R() < 0.5 ? 'tree' : 'palm', R() < 0.5 ? -1 : 1, 14 + R() * 20);
  bakeLights(T);
  T.length = T.segs.length * SEG;
  return T;
}

// La ruta del cerro: sale del pueblo, cruza los naranjos, sube por el cañón, pasa los pozos de petróleo y vuelve
const ZONES = [['town', 0], ['grove', 0.14], ['canyon', 0.38], ['oil', 0.68], ['desert', 0.82], ['town', 0.93]];
function buildRoadCourse(seed) {
  buildSprites();
  const R = rng(seed), T = { kind: 'road', segs: [], start: 60 };
  const zoneAt = f => { let z = 'town'; for (const [k, a] of ZONES) if (f >= a) z = k; return z; };
  const target = 3400;
  addRun(T, Math.round(260 / SEG), 0, 0, 'town');
  let side = R() < 0.5 ? -1 : 1;
  while (T.segs.length * SEG < target) {
    const f = T.segs.length * SEG / target, zone = zoneAt(f);
    const hilly = zone === 'canyon' ? 1.6 : zone === 'grove' ? 0.6 : 1;
    const kind = R();
    if (kind < 0.3) addRun(T, 14 + Math.floor(R() * 26), 0, (R() - 0.5) * 18 * hilly, zone);
    else {
      side = R() < 0.7 ? -side : side;
      const radius = zone === 'canyon' ? 70 + R() * 110 : 110 + R() * 250;
      addRun(T, 10 + Math.floor(R() * 22), side / radius, (R() - 0.5) * 14 * hilly, zone);
    }
  }
  T.finish = T.segs.length * SEG - 40;
  addRun(T, 70, 0, 0, 'town');
  for (let i = 0; i < DRAW_SEGS; i++) addSeg(T, 0, T.segs[T.segs.length - 1].y, 'town');
  // adornos según la zona
  const fi = Math.floor(T.finish / SEG), si = Math.floor(T.start / SEG);
  T.segs[si].mark = 1; T.segs[fi].mark = 2;
  T.segs.forEach((s, i) => {
    const r = R();
    if (Math.abs(s.curve) > 1 / 160 && i % 4 === 0) placeSprite(T, i, s.curve > 0 ? 'chevR' : 'chevL', s.curve > 0 ? -1 : 1, 0.9);
    if (i % 6 === 0) placeSprite(T, i, 'post', i % 12 ? 1 : -1, 0.5);
    switch (s.zone) {
      case 'town':
        if (i % 9 === 0) placeSprite(T, i, 'lamp', i % 18 ? 1 : -1, 1.2);
        if (i % 7 === 3) placeSprite(T, i, r < 0.3 ? 'store' + Math.floor(R() * 5) : 'house', R() < 0.5 ? -1 : 1, 7 + R() * 4);
        if (i % 5 === 1 && r > 0.5) placeSprite(T, i, 'palm', R() < 0.5 ? -1 : 1, 3 + R() * 2);
        if (i % 40 === 20) placeSprite(T, i, 'board' + Math.floor(R() * 4), R() < 0.5 ? -1 : 1, 8);
        break;
      case 'grove':
        if (i % 2 === 0) placeSprite(T, i, 'orange', 1, 4 + (i % 4) * 1.5);
        if (i % 2 === 1) placeSprite(T, i, 'orange', -1, 4 + (i % 4) * 1.5);
        if (i % 8 === 0) placeSprite(T, i, 'pole', 1, 2.2);
        if (i % 30 === 5) placeSprite(T, i, 'house', -1, 16);
        break;
      case 'canyon':
        if (i % 3 === 0) placeSprite(T, i, 'rock' + Math.floor(R() * 3), s.curve >= 0 ? -1 : 1, 3 + R() * 3);
        if (i % 5 === 0) placeSprite(T, i, 'rock' + Math.floor(R() * 3), s.curve >= 0 ? 1 : -1, 10 + R() * 10);
        if (i % 11 === 0) placeSprite(T, i, 'tree', R() < 0.5 ? -1 : 1, 6 + R() * 6);
        break;
      case 'oil':
        if (i % 6 === 0) placeSprite(T, i, R() < 0.5 ? 'pump' : 'derrick', R() < 0.5 ? -1 : 1, 7 + R() * 14);
        if (i % 8 === 0) placeSprite(T, i, 'pole', -1, 2.4);
        if (i % 4 === 2) placeSprite(T, i, 'fence', 1, 2.5);
        break;
      case 'desert':
        if (i % 3 === 0) placeSprite(T, i, 'joshua', R() < 0.5 ? -1 : 1, 3 + R() * 12);
        if (i % 8 === 0) placeSprite(T, i, 'pole', 1, 2.4);
        break;
    }
  });
  for (let k = 1; k <= 5; k++) placeSprite(T, si + k, 'crowd' + ((k + 9) % 3), k % 2 ? 1 : -1, 4.5);
  for (let k = -3; k <= 3; k++) placeSprite(T, fi + k, 'crowd' + ((k + 7) % 3), k % 2 ? -1 : 1, 3.5);
  placeSprite(T, si + 4, 'parked', 1, 2.4); placeSprite(T, fi + 2, 'parked', -1, 1.6); placeSprite(T, fi + 14, 'tower', 1, 18);
  bakeLights(T);
  T.length = T.segs.length * SEG;
  // mapa del recorrido (para el mapita de la carrera)
  let a = 0, x = 0, z = 0;
  T.map = [];
  for (const s of T.segs) { a += s.curve * SEG; x += Math.sin(a) * SEG; z += Math.cos(a) * SEG; T.map.push([x, z]); }
  return T;
}
const segAt = (T, z) => T.segs[clamp(Math.floor(z / SEG), 0, T.segs.length - 1)];
function heightAt(T, z) {
  const i = clamp(Math.floor(z / SEG), 0, T.segs.length - 2), f = z / SEG - i;
  return lerp(T.segs[i].y, T.segs[i + 1].y, f);
}

// ----- Cielo -----
const STARS = (() => { const r = rng(42), a = []; for (let i = 0; i < 260; i++) a.push([r(), r() * r(), 0.3 + r() * 0.9, r() * TAU]); return a; })();
function drawNightSky(g, horizon, scroll, t, opts = {}) {
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#04050c'); sky.addColorStop(0.55, '#0c1330'); sky.addColorStop(0.9, '#262245'); sky.addColorStop(1, '#3a2c48');
  g.fillStyle = sky; g.fillRect(0, 0, W, horizon + 2);
  for (const [sx, sy, b, ph] of STARS) {
    const x = ((sx * W * 1.5 - scroll * 0.05) % (W * 1.5) + W * 1.5) % (W * 1.5) - W * 0.25;
    const tw = 0.6 + 0.4 * Math.sin(t * 2 + ph);
    g.fillStyle = `rgba(255,255,240,${(b * tw * (1 - sy * 0.8)).toFixed(3)})`;
    g.fillRect(x, sy * horizon * 0.95, b > 1 ? 2 : 1.3, b > 1 ? 2 : 1.3);
  }
  // luna
  const mx = ((W * 0.78 - scroll * 0.08) % (W * 1.6) + W * 1.6) % (W * 1.6) - W * 0.3, my = horizon * 0.28;
  glow(g, mx, my, 120, '#a8b8e8', 0.25);
  g.fillStyle = '#f2f0e0'; g.beginPath(); g.arc(mx, my, 22, 0, TAU); g.fill();
  g.fillStyle = 'rgba(180,180,170,0.4)'; g.beginPath(); g.arc(mx - 6, my - 4, 5, 0, TAU); g.arc(mx + 7, my + 6, 3.5, 0, TAU); g.fill();
  // cerros lejanos con luces de la ciudad
  for (let layer = 0; layer < 2; layer++) {
    const par = layer ? 0.32 : 0.18, base = horizon + 2;
    g.fillStyle = layer ? '#0d0f1c' : '#151a30';
    g.beginPath(); g.moveTo(0, base);
    for (let x = 0; x <= W; x += 16) {
      const wx = x + scroll * par;
      const hh = (layer ? 26 : 52) * (0.5 + 0.5 * Math.sin(wx * 0.004 + layer * 2) * Math.sin(wx * 0.0017 + 1.3)) + (layer ? 8 : 14);
      g.lineTo(x, base - hh);
    }
    g.lineTo(W, base); g.closePath(); g.fill();
    if (layer === 1) {
      for (let k = 0; k < 70; k++) {
        const wx = ((k * 97.3 - scroll * par) % (W + 200) + W + 200) % (W + 200) - 100;
        const on = (k * 7) % 5 !== 0 || Math.sin(t * 3 + k) > 0;
        if (on) { g.fillStyle = k % 6 ? 'rgba(255,214,140,0.8)' : 'rgba(170,200,255,0.8)'; g.fillRect(wx, base - 3 - (k % 4) * 2.5, 1.6, 1.6); }
      }
    }
  }
  if (opts.beacon) {
    // faro del aeródromo que gira
    const bx = ((W * 0.25 - scroll * 0.3) % (W + 400) + W + 400) % (W + 400) - 200;
    const a = t * 2.2;
    g.save(); g.globalCompositeOperation = 'lighter';
    const bg = g.createLinearGradient(bx, horizon - 30, bx + Math.cos(a) * 500, horizon - 30 - Math.abs(Math.sin(a)) * 200);
    bg.addColorStop(0, 'rgba(180,255,190,0.18)'); bg.addColorStop(1, 'rgba(180,255,190,0)');
    g.fillStyle = bg; g.beginPath(); g.moveTo(bx, horizon - 30); g.lineTo(bx + Math.cos(a) * 520, horizon - 30 - Math.abs(Math.sin(a)) * 220 - 30); g.lineTo(bx + Math.cos(a) * 520, horizon - 30 - Math.abs(Math.sin(a)) * 220 + 30); g.fill();
    g.restore();
  }
}

// ----- Colores del suelo según la zona -----
const GROUND = {
  strip: ['#2c2c2a', '#232321'], town: ['#3c3d3a', '#2f302d'], grove: ['#2b3a22', '#25331d'],
  canyon: ['#5a4634', '#4e3c2c'], oil: ['#463a2c', '#3c3226'], desert: ['#6a5a40', '#5d4f38']
};
// Cuánto alumbran los focos a una distancia (m) y a un costado (m)
function headlight(d, lat = 0, high = 1) {
  if (d < 0) return 0;
  const reach = 38 + high * 30;
  const f = clamp(1.1 - d / reach, 0, 1);
  const side = clamp(1 - Math.max(0, Math.abs(lat) - 3 - d * 0.18) / (6 + d * 0.15), 0, 1);
  return f * f * side;
}
function litColor(base, light, warm, dist) {
  const b = rgbOf(base);
  const k = 0.16 + light * 1.1;
  let r = b[0] * k + warm * 95, gg = b[1] * k + warm * 58, bb = b[2] * k + warm * 14;
  const fog = clamp(dist / 1100, 0, 1) * 0.85;
  r = lerp(r, 22, fog); gg = lerp(gg, 20, fog); bb = lerp(bb, 40, fog);
  return `rgb(${Math.min(255, r | 0)},${Math.min(255, gg | 0)},${Math.min(255, bb | 0)})`;
}

// ----- Dibujo de la calle en perspectiva -----
// cam = { z, x, shake }. objs = autos y otras cosas sobre la pista: { z, x, draw(g, sx, sy, scale, light) }
function renderRoad(g, T, cam, objs, t) {
  const baseI = Math.floor(cam.z / SEG), baseF = cam.z / SEG - baseI;
  const camY = heightAt(T, cam.z) + CAM_H;
  const base = T.segs[clamp(baseI, 0, T.segs.length - 1)];
  // el horizonte se mueve un poco con las curvas para que se sienta el giro
  const scroll = (cam.scroll || 0);
  drawNightSky(g, HORIZON + (cam.pitch || 0), scroll, t, { beacon: T.kind === 'drag' });
  const P = [];   // puntos proyectados de cada tramo
  let x = 0, dx = -base.curve * SEG * SEG * baseF;
  let maxy = H;
  const scaleK = W / 2 * CAM_D;
  for (let n = 0; n < DRAW_SEGS; n++) {
    const s = T.segs[baseI + n];
    if (!s) break;
    const z1 = (baseI + n) * SEG - cam.z, z2 = z1 + SEG;
    const pr = (zz, xx, yy) => {
      const zc = Math.max(0.1, zz);
      const sc = scaleK / zc;
      return [W / 2 + (xx - cam.x) * sc, HORIZON - (yy - camY) * sc, sc];
    };
    const p1 = pr(z1, -x, s.y), p2 = pr(z2, -x - dx, (T.segs[baseI + n + 1] || s).y);
    P[n] = { s, p1, p2, x, z: z1, clip: maxy };
    x += dx; dx += s.curve * SEG * SEG;
    if (z1 < 0.6 || p2[1] >= p1[1] || p2[1] >= maxy) { P[n].hidden = true; continue; }
    drawSegment(g, s, p1, p2, z1, cam, T);
    maxy = p2[1];
  }
  // adornos y autos: de lejos hacia cerca
  const pool = [];
  for (const o of objs) {
    const n = Math.floor((o.z - baseI * SEG) / SEG);
    if (n < 0 || n >= DRAW_SEGS || !P[n]) continue;
    pool.push({ n, o });
  }
  const poles = { '-1': [], '1': [] };
  for (let n = DRAW_SEGS - 1; n >= 1; n--) {
    const q = P[n];
    if (!q) continue;
    for (const sp of q.s.sprites) drawRoadSprite(g, q, sp, cam, t, poles);
    for (const it of pool) if (it.n === n) {
      const o = it.o, f = (o.z - (baseI + n) * SEG) / SEG;
      const sx = lerp(q.p1[0], q.p2[0], f) + o.x * lerp(q.p1[2], q.p2[2], f);
      const sy = lerp(q.p1[1], q.p2[1], f), sc = lerp(q.p1[2], q.p2[2], f);
      if (sy > q.clip + 40) continue;
      const d = o.z - cam.z;
      o.draw(g, sx, sy, sc, headlight(d, o.x - cam.x), d);
    }
  }
  // cables de teléfono entre postes
  g.strokeStyle = 'rgba(10,12,20,0.85)'; g.lineWidth = 1;
  for (const k of ['-1', '1']) {
    const a = poles[k];
    for (let i = 0; i + 1 < a.length; i++) {
      const [x1, y1, s1] = a[i], [x2, y2] = a[i + 1];
      if (Math.abs(x2 - x1) > W) continue;
      for (const off of [-1.1, 1.1]) {
        g.beginPath(); g.moveTo(x1 + off * s1, y1); g.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + 6, x2 + off * a[i + 1][2], y2); g.stroke();
      }
    }
  }
  return P;
}

function drawSegment(g, s, p1, p2, z, cam, T) {
  const [x1, y1, k1] = p1, [x2, y2, k2] = p2;
  const alt = Math.floor(s.i / 2) % 2;
  const hl = headlight(z, 0, 1), warm = s.light * 0.75;
  const gr = GROUND[s.zone] || GROUND.town;
  // terreno de los costados
  g.fillStyle = litColor(gr[alt], hl * 0.55 + warm * 0.4, warm * 0.5, z);
  g.fillRect(0, y2, W, y1 - y2 + 1);
  const quad = (xa, wa, xb, wb, col) => {
    g.fillStyle = col; g.beginPath();
    g.moveTo(xa - wa, y1); g.lineTo(xa + wa, y1); g.lineTo(xb + wb, y2); g.lineTo(xb - wb, y2); g.closePath(); g.fill();
  };
  // berma y vereda
  const shoulder = s.zone === 'town' ? '#6a6862' : s.zone === 'strip' ? '#3a3a36' : '#4a4236';
  quad(x1, (ROAD_W + 1.4) * k1, x2, (ROAD_W + 1.4) * k2, litColor(shoulder, hl * 0.8 + warm, warm, z));
  // asfalto
  const asphalt = alt ? '#323236' : '#2e2e32';
  quad(x1, ROAD_W * k1, x2, ROAD_W * k2, litColor(asphalt, hl + warm, warm, z));
  // líneas: bordes blancos y centro segmentado (más brillantes, reflejan los faros)
  const lineL = hl * 1.8 + warm * 0.9;
  const white = litColor('#bfbfb8', lineL, warm * 0.6, z);
  const lw1 = 0.12 * k1, lw2 = 0.12 * k2;
  quad(x1 - (ROAD_W - 0.25) * k1, lw1, x2 - (ROAD_W - 0.25) * k2, lw2, white);
  quad(x1 + (ROAD_W - 0.25) * k1, lw1, x2 + (ROAD_W - 0.25) * k2, lw2, white);
  if (T.kind === 'drag') quad(x1, lw1, x2, lw2, white);
  else if (alt) quad(x1, lw1 * 0.9, x2, lw2 * 0.9, litColor('#c9a032', lineL, warm * 0.6, z));
  // líneas de partida y meta
  if (s.mark) {
    if (s.mark === 1) {
      // línea de partida pintada con tiza: delgada
      const yb = lerp(y1, y2, 0.1), kb = lerp(k1, k2, 0.1), xb = lerp(x1, x2, 0.1);
      g.fillStyle = litColor('#e8e8e0', lineL * 0.6, warm, z);
      g.beginPath(); g.moveTo(x1 - ROAD_W * k1, y1); g.lineTo(x1 + ROAD_W * k1, y1); g.lineTo(xb + ROAD_W * kb, yb); g.lineTo(xb - ROAD_W * kb, yb); g.fill();
    } else {
      const n = 12;
      for (let c = 0; c < n; c++) {
        const fa = -1 + 2 * c / n, fb = -1 + 2 * (c + 1) / n;
        for (let r = 0; r < 2; r++) {
          if ((c + r) % 2) continue;
          const ya = lerp(y1, y2, r / 2), yb = lerp(y1, y2, (r + 1) / 2), ka = lerp(k1, k2, r / 2), kb = lerp(k1, k2, (r + 1) / 2);
          const xa = lerp(x1, x2, r / 2), xb = lerp(x1, x2, (r + 1) / 2);
          g.fillStyle = litColor('#f0f0e8', lineL * 0.7, warm, z);
          g.beginPath(); g.moveTo(xa + fa * ROAD_W * ka, ya); g.lineTo(xa + fb * ROAD_W * ka, ya); g.lineTo(xb + fb * ROAD_W * kb, yb); g.lineTo(xb + fa * ROAD_W * kb, yb); g.fill();
        }
      }
    }
  }
}

function drawRoadSprite(g, q, sp, cam, t, poles) {
  const S = SPRITES[sp.key];
  if (!S) return;
  const sc = q.p1[2], sx = q.p1[0] + sp.x * sc, sy = q.p1[1];
  const w = S.w * sc, h = S.h * sc;
  if (sx + w < -50 || sx - w > W + 50 || h < 1.2) return;
  const d = q.z;
  const left = sx - w / 2, top = sy - h;
  const clipH = Math.min(h, q.clip - top);
  if (clipH <= 0) return;
  const srcH = S.dark.height * clipH / h;
  // los adornos asimétricos (faroles) se dan vuelta en el lado izquierdo para mirar a la calle
  const mirror = S.flip && sp.x < 0;
  if (mirror) { g.save(); g.translate(sx * 2, 0); g.scale(-1, 1); }
  g.drawImage(S.dark, 0, 0, S.dark.width, srcH, left, top, w, clipH);
  let light = headlight(d, sp.x - cam.x, 1) + q.s.light * 0.6;
  if (S.refl) light = Math.min(1, light * 2.6);
  if (light > 0.02) { g.globalAlpha = Math.min(1, light); g.drawImage(S.lit, 0, 0, S.lit.width, srcH, left, top, w, clipH); g.globalAlpha = 1; }
  const fog = 1 - clamp(d / 1400, 0, 0.7);
  if (S.emit) { g.globalAlpha = fog; g.drawImage(S.emit, 0, 0, S.emit.width, srcH, left, top, w, clipH); g.globalAlpha = 1; }
  if (mirror) g.restore();
  if (S.lamp) {
    g.save(); g.globalCompositeOperation = 'lighter';
    glow(g, sx + 1.4 * sc * (sp.x > 0 ? -1 : 1), sy - 9.4 * sc, 3.4 * sc, '#ffb860', 0.55 * fog);
    g.restore();
  }
  if (S.pole && poles) poles[sp.x < 0 ? '-1' : '1'].push([sx, sy - 9 * sc, sc]);
}
