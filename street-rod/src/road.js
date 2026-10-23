// ===== La calle de noche: trazado de la pista, adornos y dibujo en perspectiva (3D falso) =====
// Todo se mide en metros. La pista es una lista de tramos de SEG metros con su curva (1/radio) y su altura.
const SEG = 5, ROAD_W = 3.6, LANE = 1.8, DRAW_SEGS = 240;
const CAM_H = 1.15;   // altura de los ojos del piloto

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
  const ads = [['BOB\'S', 'DRIVE-IN', '#e8452c', '#fff3d6'], ['GUS\' GAS', '31¢ REGULAR', '#1f5fa8', '#ffe46b'], ['DRINK', 'COLA ICE COLD', '#b3202a', '#ffffff'], ['VISIT', 'PALM SPRINGS', '#3fb7a8', '#fff6dc']];
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
    g.fillStyle = '#2a4a7a'; g.font = 'bold 1.1px ' + FONT_DISPLAY; g.textAlign = 'center'; g.fillText('VALLEY', 0, -13);
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

// La recta de picadas: un camino derecho a las afueras del pueblo, con el semáforo en la partida
function buildDragStrip(seed) {
  buildSprites();
  const R = rng(seed), T = { kind: 'drag', segs: [], start: 60, finish: 60 + DRAG_DIST };
  const n = Math.ceil((60 + DRAG_DIST + 420) / SEG) + DRAW_SEGS;
  for (let i = 0; i < n; i++) addSeg(T, 0, Math.sin(i / 37) * 0.6, 'strip');
  const si = Math.floor(T.start / SEG), fi = Math.floor(T.finish / SEG);
  T.segs[si].mark = 1; T.segs[fi].mark = 2;
  for (let i = 0; i < n; i += 8) {
    placeSprite(T, i, 'pole', -1, 6 + R() * 2);
    if (i % 24 === 0) placeSprite(T, i + 3, 'lamp', 1, 1.2);
  }
  // como en el original: postes blancos, árboles, palmeras y algún letrero; sin público
  for (let i = si; i < n; i += 6) placeSprite(T, i, 'post', i % 12 ? 1 : -1, 0.8);
  placeSprite(T, si + 30, 'board0', 1, 9); placeSprite(T, si + 90, 'board1', -1, 10); placeSprite(T, fi + 8, 'tower', 1, 26);
  for (let i = si + 4; i < n; i += 3 + Math.floor(R() * 5)) placeSprite(T, i, rpick(R, ['tree', 'tree', 'palm', 'orange', 'rock0']), R() < 0.5 ? -1 : 1, 5 + R() * 18);
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
  placeSprite(T, fi + 14, 'tower', 1, 18);
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
