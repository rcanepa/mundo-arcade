// ===== El garaje: el diario, el auto, los repuestos, la pintura, el reloj y la puerta a la calle =====
const GARAGE_CAR = { x: 132, bottom: 374, size: 400 };

function garageBackground() {
  return pxBackground('garage', g => {
    // pared de tablas
    for (let x = 0; x < PW; x += 16) {
      g.fillStyle = [PAL.b2, PAL.b3, PAL.b2, PAL.b3, PAL.b3][(x / 16) % 5]; g.fillRect(x, 0, 16, 240);
      g.fillStyle = PAL.b1; g.fillRect(x, 0, 1, 240);
      g.fillStyle = PAL.b4; g.fillRect(x + 1, 0, 1, 240);
      g.fillStyle = PAL.b1; g.fillRect(x + 7, 60 + (x * 7) % 90, 2, 2); g.fillRect(x + 7, 180 + (x * 3) % 40, 2, 2);
    }
    g.fillStyle = PAL.b1; g.fillRect(0, 0, PW, 14); g.fillStyle = PAL.b2; g.fillRect(0, 12, PW, 3);
    // piso de concreto con manchas de aceite
    const fl = g.createLinearGradient(0, 236, 0, 380);
    fl.addColorStop(0, PAL.g3); fl.addColorStop(1, PAL.g4);
    g.fillStyle = fl; g.fillRect(0, 236, PW, 150);
    g.fillStyle = PAL.g2; g.fillRect(0, 236, PW, 4);
    g.fillStyle = PAL.g3; g.fillRect(0, 300, PW, 1); g.fillRect(200, 240, 1, 140); g.fillRect(470, 240, 1, 140);
    g.fillStyle = 'rgba(28,28,36,0.6)';
    for (const [x, y, w, h] of [[330, 350, 70, 10], [250, 362, 40, 6], [520, 330, 30, 6], [120, 300, 24, 5]]) { g.beginPath(); g.ellipse(x, y, w / 2, h / 2, 0, 0, TAU); g.fill(); }
    // portón abierto: se ve la calle de día
    const dx = 312, dy = 26, dw = 318, dh = 212;
    const sky = g.createLinearGradient(0, dy, 0, dy + 150);
    sky.addColorStop(0, PAL.u3); sky.addColorStop(1, PAL.u4);
    g.fillStyle = sky; g.fillRect(dx, dy, dw, dh);
    g.fillStyle = PAL.w; for (const [cx, cy] of [[380, 70], [540, 56], [600, 90]]) { g.beginPath(); g.ellipse(cx, cy, 26, 8, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx + 12, cy - 5, 14, 7, 0, 0, TAU); g.fill(); }
    g.fillStyle = PAL.p3; g.beginPath(); g.moveTo(dx, 150); g.lineTo(380, 108); g.lineTo(450, 140); g.lineTo(530, 100); g.lineTo(dx + dw, 146); g.lineTo(dx + dw, 160); g.lineTo(dx, 160); g.fill();
    // casas del frente con techos y palmeras
    for (const [x, w, col, roof] of [[318, 110, PAL.c2, PAL.r2], [440, 90, PAL.t4, PAL.b2], [536, 100, PAL.m4, PAL.u1]]) {
      g.fillStyle = col; g.fillRect(x, 150, w, 50);
      g.fillStyle = roof; g.beginPath(); g.moveTo(x - 6, 152); g.lineTo(x + w / 2, 128); g.lineTo(x + w + 6, 152); g.fill();
      g.fillStyle = PAL.u2; g.fillRect(x + 12, 162, 18, 14); g.fillRect(x + w - 30, 162, 18, 14);
      g.fillStyle = PAL.w; g.fillRect(x + 12, 168, 18, 1); g.fillRect(x + w - 30, 168, 18, 1);
      g.fillStyle = PAL.b2; g.fillRect(x + w / 2 - 7, 174, 14, 26);
    }
    for (const px of [430, 600]) {
      g.fillStyle = PAL.b3; g.fillRect(px, 96, 5, 104);
      g.fillStyle = PAL.e2; for (let a = 0; a < 7; a++) { g.beginPath(); g.ellipse(px + 2 + Math.cos(a) * 16, 96 + Math.sin(a) * 6, 20, 5, a, 0, TAU); g.fill(); }
    }
    g.fillStyle = PAL.e3; g.fillRect(dx, 200, dw, 10);
    g.fillStyle = PAL.g5; g.fillRect(dx, 210, dw, 6);
    g.fillStyle = PAL.g3; g.fillRect(dx, 216, dw, 22);
    g.fillStyle = PAL.w; for (let x = dx + 10; x < dx + dw; x += 50) g.fillRect(x, 226, 24, 3);
    // la cortina del portón enrollada arriba y el marco
    for (let y = dy; y < dy + 26; y += 6) { g.fillStyle = PAL.g5; g.fillRect(dx, y, dw, 5); g.fillStyle = PAL.g3; g.fillRect(dx, y + 5, dw, 1); }
    g.fillStyle = PAL.g6; g.fillRect(dx - 8, dy - 6, 8, dh + 8); g.fillRect(dx + dw, dy - 6, 8, dh + 8); g.fillRect(dx - 8, dy - 8, dw + 16, 6);
    g.fillStyle = PAL.g4; g.fillRect(dx - 2, dy - 2, 2, dh + 4); g.fillRect(dx + dw, dy - 2, 2, dh + 4);
    // estante metálico con cajas de repuestos
    g.fillStyle = PAL.g3; g.fillRect(4, 26, 4, 214); g.fillRect(64, 26, 4, 214);
    for (const y of [70, 120, 170, 222]) { g.fillStyle = PAL.g4; g.fillRect(4, y, 64, 4); g.fillStyle = PAL.g2; g.fillRect(4, y + 4, 64, 1); }
    const boxes = [[10, 46, 24, 24, PAL.b4], [36, 52, 26, 18, PAL.o2], [10, 96, 30, 24, PAL.u2], [42, 100, 20, 20, PAL.b4], [12, 150, 22, 20, PAL.r3], [36, 144, 26, 26, PAL.b4]];
    for (const [x, y, w, h, c] of boxes) { g.fillStyle = c; g.fillRect(x, y, w, h); g.fillStyle = PAL.k; g.fillRect(x, y, w, 1); g.fillRect(x + w / 2 - 1, y, 2, h); }
    // neumáticos apilados abajo
    for (let i = 0; i < 2; i++) { g.fillStyle = PAL.g1; g.beginPath(); g.ellipse(36, 206 - i * 14, 26, 9, 0, 0, TAU); g.fill(); g.fillStyle = PAL.g2; g.beginPath(); g.ellipse(36, 204 - i * 14, 12, 4, 0, 0, TAU); g.fill(); }
    // tablero con herramientas colgadas
    g.fillStyle = PAL.b4; g.fillRect(78, 44, 172, 88);
    g.fillStyle = PAL.b3; for (let y = 50; y < 130; y += 8) for (let x = 84; x < 248; x += 8) g.fillRect(x, y, 1, 1);
    g.fillStyle = PAL.b2; g.fillRect(78, 44, 172, 2); g.fillRect(78, 130, 172, 2);
    for (let i = 0; i < 6; i++) { const x = 92 + i * 12, l = 40 - i * 4; g.fillStyle = PAL.g5; g.fillRect(x, 56, 4, l); g.fillStyle = PAL.g6; g.fillRect(x - 2, 54, 8, 6); g.fillRect(x - 2, 56 + l, 8, 5); }
    g.fillStyle = PAL.r3; g.fillRect(176, 56, 8, 30); g.fillStyle = PAL.g4; g.fillRect(166, 52, 28, 8);
    g.fillStyle = PAL.g5; g.beginPath(); g.moveTo(206, 54); g.lineTo(240, 54); g.lineTo(240, 74); g.lineTo(206, 64); g.fill(); g.fillStyle = PAL.b2; g.fillRect(200, 52, 10, 16);
    g.strokeStyle = PAL.g2; g.lineWidth = 2; g.beginPath(); g.arc(224, 104, 14, 0, TAU); g.stroke();
    // banco de trabajo con su tornillo
    g.fillStyle = PAL.b3; g.fillRect(70, 166, 186, 10); g.fillStyle = PAL.b5; g.fillRect(70, 166, 186, 2);
    g.fillStyle = PAL.b2; g.fillRect(74, 176, 178, 60);
    for (let i = 0; i < 3; i++) { g.fillStyle = PAL.b3; g.fillRect(80 + i * 58, 184, 50, 20); g.fillStyle = PAL.g5; g.fillRect(100 + i * 58, 192, 10, 3); }
    g.fillStyle = PAL.b1; g.fillRect(74, 210, 178, 26);
    g.fillStyle = PAL.g3; g.fillRect(236, 150, 22, 16); g.fillStyle = PAL.g4; g.fillRect(232, 156, 30, 4);
    // caja de herramientas roja
    g.fillStyle = PAL.r3; g.fillRect(186, 146, 44, 20); g.fillStyle = PAL.r4; g.fillRect(186, 146, 44, 3);
    g.fillStyle = PAL.r1; g.fillRect(186, 156, 44, 1); g.fillStyle = PAL.g5; g.fillRect(202, 140, 12, 3); g.fillRect(202, 140, 2, 6); g.fillRect(212, 140, 2, 6);
    // reloj, calendario y tablero de llaves (lo que cambia se dibuja después)
    g.fillStyle = PAL.g2; g.beginPath(); g.arc(282, 46, 20, 0, TAU); g.fill();
    g.fillStyle = PAL.w; g.beginPath(); g.arc(282, 46, 17, 0, TAU); g.fill();
    g.fillStyle = PAL.k; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.fillRect(Math.round(282 + Math.cos(a) * 14) - 1, Math.round(46 + Math.sin(a) * 14) - 1, 2, 2); }
    g.fillStyle = PAL.w; g.fillRect(262, 76, 40, 64); g.fillStyle = PAL.g5; g.fillRect(262, 138, 40, 2);
    g.fillStyle = PAL.b3; g.fillRect(262, 162, 40, 36); g.fillStyle = PAL.b1; g.fillRect(262, 196, 40, 2);
    // latas de pintura en el piso
    for (const [x, y, c] of [[10, 330, PAL.r3], [44, 334, PAL.u3], [26, 300, PAL.y2], [78, 340, PAL.e3]]) {
      g.fillStyle = PAL.g4; g.fillRect(x, y, 30, 36); g.fillStyle = c; g.fillRect(x, y + 8, 30, 20);
      g.fillStyle = PAL.w; g.fillRect(x + 4, y + 13, 22, 3); g.fillStyle = PAL.g6; g.fillRect(x, y, 30, 3); g.fillStyle = PAL.g2; g.fillRect(x, y + 34, 30, 2);
      g.fillStyle = c; g.fillRect(x + 6, y - 1, 10, 2);
    }
  });
}
// Lo que cambia: hora en el reloj, el mes en el calendario, las llaves, el diario del día
function drawGarageDetails(g) {
  const d = dateOf(S.day);
  // el reloj marca las 10 de la mañana
  g.strokeStyle = PAL.k; g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(282, 46); g.lineTo(282 + Math.cos(-Math.PI / 6 * 1.0 - Math.PI) * 8, 46 + Math.sin(-Math.PI / 6 - Math.PI) * 8); g.stroke();
  g.beginPath(); g.moveTo(282, 46); g.lineTo(282 + Math.cos(Game.t * 0.05 - Math.PI / 2) * 13, 46 + Math.sin(Game.t * 0.05 - Math.PI / 2) * 13); g.stroke();
  // calendario del mes
  g.fillStyle = PAL.r3; g.fillRect(262, 76, 40, 14);
  ptext(g, L().months[d.getMonth()].slice(0, 3).toUpperCase(), 282, 78, PAL.w, 1, { align: 'center' });
  ptext(g, String(d.getDate()), 282, 98, PAL.k, 3, { align: 'center' });
  ptext(g, '1963', 282, 128, PAL.g3, 1, { align: 'center' });
  // llaves: una por auto
  S.cars.forEach((c, i) => {
    const x = 268 + i * 9;
    g.fillStyle = PAL.g5; g.fillRect(x + 2, 166, 2, 4);
    g.fillStyle = c.id === S.active ? PAL.y3 : PAL.y1; g.beginPath(); g.arc(x + 3, 174, 3, 0, TAU); g.fill(); g.fillRect(x + 2, 176, 2, 12);
    g.fillStyle = paintRamp(c.color).md; g.fillRect(x, 186, 6, 4);
  });
  // el diario de hoy sobre el banco
  g.fillStyle = PAL.c1; g.fillRect(84, 150, 70, 16); g.fillStyle = PAL.c2; g.fillRect(84, 164, 70, 2);
  g.fillStyle = PAL.k; g.fillRect(90, 153, 40, 3);
  g.fillStyle = PAL.g4; for (let i = 0; i < 2; i++) g.fillRect(90, 159 + i * 3, 58, 1);
}

SCENES.garage = {
  music: 'garage',
  enter() { Bubbles.clear(); },
  back() {},
  draw(g) {
    g.drawImage(garageBackground(), 0, 0);
    drawGarageDetails(g);
    const car = activeCar();
    const C = GARAGE_CAR;
    let spr = null, sx = C.x, sy = 0;
    if (car) {
      spr = pxCarSide(car, C.size);
      sy = C.bottom - spr.height;
      // sombra bajo el auto
      g.fillStyle = PAL.g2; g.fillRect(sx + 20, C.bottom - 6, spr.width - 40, 6);
      g.drawImage(spr, sx, sy);
      if (car.mods.roofDays > 0) { g.fillStyle = PAL.y2; g.fillRect(sx + spr.width * 0.4, sy + 10, 120, 18); ptext(g, L().g.roofWork(car.mods.roofDays), sx + spr.width * 0.4 + 60, sy + 14, PAL.k, 1, { align: 'center' }); }
    } else {
      ptext(g, L().g.noCar, PW / 2, 290, PAL.w, 2, { align: 'center', shadow: PAL.k });
    }
    if (Game.dialogs.length) return;
    // ----- zonas que se pueden clickear -----
    if (car) {
      const w = spr.width, h = spr.height;
      if (UI.hot(sx + w * 0.7, sy + h * 0.25, w * 0.3, h * 0.55, L().g.hot.engine, 'wrench')) Game.go('engine', { car });
      else if (UI.hot(sx + w * 0.08, sy + h * 0.55, w * 0.26, h * 0.45, L().g.hot.tires, 'wrench')) Game.go('tires', { car });
      else if (UI.hot(sx + w * 0.34, sy + h * 0.62, w * 0.36, h * 0.38, L().g.hot.trans, 'wrench')) Game.go('trans', { car });
      else if (UI.hot(sx + w * 0.08, sy, w * 0.62, h * 0.62, L().g.hot.car)) carInfo(car);
    }
    if (UI.hot(84, 146, 72, 22, L().g.hot.paper)) Game.go('paper');
    else if (UI.hot(0, 26, 72, 214, L().g.hot.spares)) sparesBox();
    else if (UI.hot(0, 296, 112, 76, L().g.hot.paint)) { if (car) Game.go('paint', { car }); else Game.tell(L().g.noCar); }
    else if (UI.hot(260, 24, 44, 46, L().g.hot.clock)) clockMenu();
    else if (UI.hot(260, 74, 44, 68, L().g.hot.calendar)) calendarBox();
    else if (UI.hot(260, 156, 44, 44, L().g.hot.keys)) carsBox();
    else if (UI.hot(312, 26, 318, 180, L().g.hot.door)) goOut();
  },
  key(code) { if (code === 'KeyN') Game.go('paper'); }
};

// Una línea por pieza: "Caja: 4 cambios (bueno)"
function slotLine(car, sl) {
  const T = L(), p = car.p[sl];
  if (!p) return `${T.slot[sl]}: ${T.none}`;
  const name = sl === 'engine' ? partName(p) : sl === 'intake' ? T.parts.intakeShort[p.k] : sl === 'trans' ? T.parts.transShort[p.k] : T.parts.tiresShort[p.k];
  return `${T.slot[sl]}: ${name} (${T.cond(p.c)})`;
}
// Lo que dice el auto cuando le haces clic en la cabina
function carInfo(car) {
  const T = L(), st = carStats(car), p = car.p, probs = carProblems(car);
  const lines = [carName(car), ''];
  for (const sl of ['engine', 'intake', 'trans', 'tires']) lines.push(slotLine(car, sl));
  const n = carbCount(car);
  if (n) lines.push(`${T.slot.carb}: ${[0, 1, 2].slice(0, n).map(i => (p['carb' + i] ? T.parts.carbShort[p['carb' + i].k] : '—')).join(' + ')}`);
  lines.push(T.g.bodyFuel(T.cond(car.body), car.fuel.toFixed(1), TANK));
  lines.push(T.g.weight(Math.round(st.lb)));
  if (probs.length) lines.push('', T.g.problems + ' ' + probs.map(pr => T.problem(pr, car)).join(', '));
  msgBox(lines, [T.ok], null, { w: 560, title: true });
}
// Los repuestos del estante: venderlos (los compradores ofrecen)
function sparesBox() {
  const T = L();
  listBox(T.g.sparesTitle, () => S.spares.map(p => ({ label: partName(p), right: Math.round(p.c * 100) + '%', p })), [
    { label: T.g.sellIt, close: false, fn: (i, it) => offerLoop(partWorth(it.p), m => { sellPart(it.p.id, m); Game.tell(T.g.sold(money(m))); }) },
    { label: T.done, need: false, fn: () => {} }
  ], { empty: T.g.noSpares, info: (g, it, x, y) => ptext(g, T.g.fits(partFam(it.p)), x, y, PAL.e4, 1) });
}
// El tablero de llaves: elegir qué auto usar, venderlo o mandarlo a la chatarra
function carsBox() {
  const T = L();
  listBox(T.g.carsTitle, () => S.cars.map(c => ({ label: carName(c), right: c.id === S.active ? '★' : '', c })), [
    { label: T.g.drive, fn: (i, it) => { S.active = it.c.id; saveGame(); } },
    { label: T.g.sellIt, close: false, fn: (i, it) => offerLoop(carValue(it.c) * 0.85, m => { sellCar(it.c.id, m); Game.tell(T.g.sold(money(m))); afterLoss(); }) },
    { label: T.g.junk, close: false, fn: (i, it) => confirmBox(T.g.junkAsk(money(junkValue(it.c))), T.yes, T.forget, () => { const m = junkCar(it.c.id); Game.tell(T.g.sold(money(m))); afterLoss(); }) },
    { label: T.done, need: false, fn: () => {} }
  ], {
    w: 600, empty: T.g.noCars,
    info: (g, it, x, y) => { const pr = carProblems(it.c); ptext(g, pr.length ? pr.map(p => T.problem(p, it.c)).join(', ') : T.g.runs, x, y, PAL.e4, 1); }
  });
}
// Si te quedaste sin auto y sin plata, se acaba el juego
function afterLoss() { if (S.over) { Game.dialogs = []; Game.go('ending'); } }
function calendarBox() {
  const T = L(), left = SUMMER_DAYS - S.day;
  msgBox([T.date(dateOf(S.day)), '', T.g.daysLeft(left), T.g.record(S.wins.drag, KING_DRAGS, S.wins.road, KING_ROADS), T.g.record2(S.wins.kicks, S.losses), '', kingReady() ? T.g.kingReady : T.g.kingHint], [T.ok], null, { w: 560, title: true });
}
function clockMenu() {
  const T = L();
  const items = [T.g.save, T.g.load, T.g.sleep, T.musicLabel(Sound.musicOn), T.langSwitch, T.g.quit, T.forget];
  menuBox(300, 60, 300, items, i => {
    if (i === 0) chpBook('save');
    else if (i === 1) chpBook('load');
    else if (i === 2) confirmBox(T.g.sleepAsk, T.yes, T.forget, () => { endNight(); Game.go('garage'); Game.tell(T.g.newDay); afterLoss(); });
    else if (i === 3) { Sound.toggleMusic(); clockMenu(); }
    else if (i === 4) { setLang(LANG === 'es' ? 'en' : 'es'); clockMenu(); }
    else if (i === 5) { saveGame(); Game.go('title'); }
  }, { title: T.g.hot.clock });
}
// El libro de la Policía de Caminos: una partida guardada por conductor
function chpBook(mode) {
  const T = L();
  if (mode === 'save') { saveSlot(); msgBox([T.chp.title, '', T.chp.saved(S.name)], [T.ok], null, { title: true }); return; }
  listBox(T.chp.title, () => savedDrivers().map(n => ({ label: n })), [
    { label: T.chp.load, fn: (i, it) => { if (loadSlot(it.label)) { Game.go('garage'); Game.tell(T.chp.loaded(it.label)); } } },
    { label: T.forget, need: false, fn: () => {} }
  ], { empty: T.chp.empty });
}
// La puerta: salir a Bob's Drive-In o a la bencinera de Gus
function goOut() {
  const T = L(), car = activeCar();
  if (!car) return say(T.g.noCar);
  const probs = carProblems(car).filter(p => p !== 'fuel');
  if (probs.length) return say([T.g.wontStart, probs.map(p => T.problem(p, car)).join(', ')]);
  menuBox(380, 70, 230, [T.g.toBobs, T.g.toGus, T.forget], i => {
    if (i === 0) {
      const r = goDiner();
      if (r === 'fuel') return say(T.g.needGas);
      if (r) return;
      Game.go('cruise', { car, night: true, text: T.cruising, then: () => Game.go('diner') });
    } else if (i === 1) Game.go('cruise', { car, night: false, text: car.fuel < 0.1 ? T.g.pushing : T.cruising, then: () => Game.go('gas') });
  }, { title: T.g.whereTo });
}

// ----- El diario -----
const PAPER = { x: 16, y: 6, w: 608, h: 368 };
function paperSheet(g, section) {
  const P = PAPER, T = L();
  g.fillStyle = PAL.b2; g.fillRect(0, 0, PW, PH);
  g.fillStyle = PAL.b1; for (let y = 0; y < PH; y += 22) g.fillRect(0, y, PW, 1);
  g.fillStyle = PAL.k; g.fillRect(P.x + 4, P.y + 4, P.w, P.h);
  g.fillStyle = PAL.c1; g.fillRect(P.x, P.y, P.w, P.h);
  g.fillStyle = PAL.c2; for (let i = 0; i < 500; i++) g.fillRect(P.x + (i * 97) % P.w, P.y + (i * 61) % P.h, 1, 1);
  if (!section) {
    ptext(g, T.paper.name, PW / 2, P.y + 8, PAL.k, 5, { align: 'center' });
    g.fillStyle = PAL.k; g.fillRect(P.x + 10, P.y + 64, P.w - 20, 2); g.fillRect(P.x + 10, P.y + 82, P.w - 20, 1);
    ptext(g, T.date(dateOf(S.day)) + ', 1963', P.x + 14, P.y + 69, PAL.k, 1);
    ptext(g, T.paper.price, P.x + P.w - 14, P.y + 69, PAL.k, 1, { align: 'right' });
  } else {
    ptext(g, T.paper.name, P.x + 12, P.y + 8, PAL.k, 2);
    ptext(g, section, P.x + P.w - 12, P.y + 6, PAL.k, 3, { align: 'right' });
    g.fillStyle = PAL.k; g.fillRect(P.x + 10, P.y + 32, P.w - 20, 2);
  }
}
// Renglones grises que hacen de texto chico
function fakeText(g, x, y, w, rows, seed) {
  const R = rng(seed);
  g.fillStyle = PAL.g4;
  for (let i = 0; i < rows; i++) g.fillRect(x, y + i * 5, i === rows - 1 ? w * (0.3 + R() * 0.5) : w - Math.floor(R() * 8), 2);
}
// Foto en gris (como impresa en el diario)
function newsPhoto(car, w) {
  const key = 'photo:' + car.model + car.color + w;
  let c = PXCACHE.get(key);
  if (c) return c;
  const spr = pxCarSide(car, w - 20);
  c = makeCanvas(w, Math.round(w * 0.55));
  const g = c.getContext('2d');
  g.fillStyle = PAL.g5; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = PAL.g6; g.fillRect(0, 0, c.width, c.height * 0.55);
  g.drawImage(spr, 10, c.height - spr.height - 4);
  if (g.getImageData) {
    const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const l = d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; d[i] = d[i + 1] = d[i + 2] = l * 0.9 + 20; }
    pixelize(img, 60); g.putImageData(img, 0, 0);
  }
  PXCACHE.set(key, c);
  return c;
}

SCENES.paper = {
  music: 'garage',
  enter(sec) { this.sec = sec || ''; this.cat = 'engine'; this.list = { sel: 0, top: 0 }; },
  back() { if (this.sec) this.sec = ''; else Game.go('garage'); },
  key(code) { if (code === 'Escape') this.back(); },
  draw(g) {
    const T = L();
    if (this.sec === 'cars') this.drawCars(g);
    else if (this.sec === 'parts') this.drawParts(g);
    else this.drawFront(g);
    if (UI.button(g, 520, 346, 92, 24, this.sec ? T.paper.front : T.paper.close)) this.back();
    void T;
  },
  drawFront(g) {
    const T = L(), P = PAPER, R = rng(S.paper.news + 3);
    paperSheet(g);
    const head = T.paper.headlines[S.paper.news % T.paper.headlines.length];
    const lines = wrapText(head, 380, 3);
    lines.forEach((l, i) => ptext(g, l, P.x + 14, P.y + 92 + i * 30, PAL.k, 3));
    const hy = P.y + 96 + lines.length * 30;
    fakeText(g, P.x + 14, hy, 180, 12, S.paper.news);
    fakeText(g, P.x + 206, hy, 180, 12, S.paper.news + 1);
    // la foto del día: el auto más caro del diario
    const best = S.paper.ads.slice(1).sort((a, b) => b.price - a.price)[0];
    if (best) { const ph = newsPhoto(best.car, 200); g.drawImage(ph, P.x + 396, P.y + 92); g.fillStyle = PAL.k; g.strokeStyle = PAL.k; g.lineWidth = 1; g.strokeRect(P.x + 395.5, P.y + 91.5, 201, ph.height + 1); ptext(g, carTitle(best.car.model), P.x + 496, P.y + 98 + ph.height, PAL.k, 1, { align: 'center' }); }
    // las secciones: avisos de autos y de repuestos (se abren con un clic)
    const box = (x, y, w, h, title, sub, onClick) => {
      const hov = UI.over(x, y, w, h);
      g.fillStyle = PAL.k; g.fillRect(x, y, w, h);
      g.fillStyle = hov ? PAL.y3 : PAL.c2; g.fillRect(x + 3, y + 3, w - 6, h - 6);
      ptext(g, title, x + w / 2, y + 14, PAL.k, 2, { align: 'center' });
      ptext(g, sub, x + w / 2, y + 42, PAL.r2, 1, { align: 'center' });
      if (UI.hot(x, y, w, h, title)) onClick();
    };
    box(P.x + 14, 262, 180, 64, T.paper.usedCars, T.paper.ads(S.paper.ads.filter(a => !a.sold).length), () => { this.sec = 'cars'; });
    box(P.x + 206, 262, 180, 64, T.paper.autoParts, T.paper.partsSub, () => { this.sec = 'parts'; });
    // chismes de la calle (pistas)
    g.fillStyle = PAL.k; g.fillRect(P.x + 396, 236, 200, 2);
    ptext(g, T.paper.talk, P.x + 496, 242, PAL.k, 2, { align: 'center' });
    const tip = T.paper.tips[(S.paper.news + S.day) % T.paper.tips.length];
    wrapText(tip, 196, 1).slice(0, 9).forEach((l, i) => ptext(g, l, P.x + 398, 262 + i * 10, PAL.k, 1));
    void R;
  },
  drawCars(g) {
    const T = L(), P = PAPER;
    paperSheet(g, T.paper.usedCars);
    S.paper.ads.forEach((ad, i) => {
      const x = P.x + 12 + (i % 2) * 296, y = P.y + 42 + Math.floor(i / 2) * 74, w = 288, h = 68;
      const hov = !ad.sold && UI.over(x, y, w, h);
      g.fillStyle = PAL.k; g.fillRect(x, y, w, h);
      g.fillStyle = hov ? PAL.y3 : PAL.c1; g.fillRect(x + 2, y + 2, w - 4, h - 4);
      const M = MODELS[ad.car.model], E = ENGINES[ad.car.p.engine.k];
      ptext(g, `'${String(M.year).slice(2)} ${M.name.split(' ')[0].toUpperCase()}`, x + 8, y + 6, PAL.k, 2);
      ptext(g, money(ad.price), x + w - 8, y + 6, PAL.r2, 2, { align: 'right' });
      ptext(g, M.name.split(' ').slice(1).join(' '), x + 8, y + 26, PAL.k, 1);
      ptext(g, T.paper.adLine(E.kind === '8' ? 'V-8' : T.parts.six, E.ci, T.parts.transShort[ad.car.p.trans.k]), x + 8, y + 37, PAL.k, 1);
      ptext(g, T.paper.words[ad.words] + ' ' + T.paper.cond(ad.car), x + 8, y + 48, PAL.g2, 1);
      if (ad.sold) {
        g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(-0.12);
        g.fillStyle = PAL.r3; g.fillRect(-60, -14, 120, 28); g.fillStyle = PAL.c1; g.fillRect(-56, -10, 112, 20);
        ptext(g, T.paper.soldStamp, 0, -9, PAL.r3, 2, { align: 'center' });
        g.restore();
      } else if (UI.hot(x, y, w, h, carTitle(ad.car.model) + ' · ' + money(ad.price))) adMenu(i);
    });
  },
  drawParts(g) {
    const T = L(), P = PAPER;
    paperSheet(g, T.paper.autoParts);
    const cats = ['engine', 'intake', 'carb', 'trans', 'tires', 'used'];
    cats.forEach((c, i) => {
      if (UI.button(g, P.x + 12, P.y + 44 + i * 34, 150, 28, T.paper.cat[c], { style: this.cat === c ? 'green' : 'grey' })) { this.cat = c; this.list = { sel: 0, top: 0 }; }
    });
    const items = this.cat === 'used'
      ? S.paper.used.map((u, i) => ({ label: partName(u.part) + ' ' + Math.round(u.part.c * 100) + '%', right: u.sold ? T.paper.soldShort : money(u.price), part: u.part, price: u.price, used: i, sold: u.sold }))
      : catalog().filter(p => p.t === this.cat).map(p => ({ label: partName(p), right: money(partPrice(p)), part: p, price: partPrice(p) }));
    const x = P.x + 176, y = P.y + 44, w = 418, h = 250;
    UI.greenBox(g, x, y, w, h);
    UI.list(g, x + 6, y + 6, w - 12, h - 12, items, this.list);
    const it = items[this.list.sel];
    if (it) {
      ptext(g, T.g.fits(partFam(it.part)) + (it.part.t === 'intake' ? ' · ' + T.paper.forKind(INTAKES[it.part.k]) : ''), P.x + 176, y + h + 10, PAL.k, 1);
      if (UI.button(g, P.x + 176, y + h + 24, 150, 28, T.paper.buy(money(it.price)), { disabled: it.sold })) {
        confirmBox(T.paper.buyAsk(partName(it.part), money(it.price)), T.yes, T.forget, () => {
          const r = buyPart(it.part, it.price);
          if (r) return say(T.paper.noMoney);
          if (it.used !== undefined) S.paper.used[it.used].sold = true;
          Sound.sfx.buy(); Game.tell(T.paper.bought);
          saveGame();
        });
      }
    }
  }
};
// Clic en un aviso de auto: verlo, comprarlo al tiro u olvidarlo
function adMenu(i) {
  const T = L(), ad = S.paper.ads[i];
  msgBox([carTitle(ad.car.model), money(ad.price)], [T.paper.seeIt, T.paper.yeah, T.forget], k => {
    if (k === 0) Game.go('seller', i);
    else if (k === 1) tryBuyCar(i, ad.price);
  }, { title: true });
}
function tryBuyCar(i, price, after) {
  const T = L();
  const r = buyCar(i, price);
  if (r === 'noRoom') return say(T.paper.noRoom(MAX_CARS));
  if (r === 'noMoney') return say(T.paper.noMoney);
  if (r) return;
  Sound.sfx.buy();
  say(T.paper.yours, after);
}

// Ver el auto en la casa del vendedor; se puede ofrecer menos plata una vez
SCENES.seller = {
  music: 'garage',
  enter(i) {
    this.i = i; this.ad = S.paper.ads[i];
    const R = rng(i * 7 + S.day);
    this.look = { skin: rpick(R, [PAL.b5, PAL.b4, PAL.b3]), hair: rpick(R, [PAL.k, PAL.b1, PAL.y2, PAL.g4]), k: 1.3 };
    this.offer = Math.round(this.ad.price * 0.85 / 5) * 5;
    Bubbles.say(L().seller.hello, 470, 170, 520, 250, 3);
  },
  back() { Game.go('paper', 'cars'); },
  key(code) { if (code === 'Escape') this.back(); },
  draw(g) {
    const T = L(), ad = this.ad, car = ad.car;
    g.drawImage(cruiseBackground(false), 0, -10);
    g.fillStyle = PAL.e3; g.fillRect(0, 270, PW, 20); g.fillStyle = PAL.g4; g.fillRect(0, 290, PW, 90);
    const spr = pxCarSide(car, 380);
    g.drawImage(spr, 40, 372 - spr.height);
    g.drawImage(pxPerson('post', this.look), 500, 372 - pxPerson('post', this.look).height);
    // ficha del auto
    UI.greyBox(g, 10, 10, 360, 150);
    ptext(g, carTitle(car.model), 20, 18, PAL.r2, 2);
    const lines = ['engine', 'intake', 'trans', 'tires'].map(sl => slotLine(car, sl)).concat(`${T.g.body}: ${T.cond(car.body)}`);
    lines.forEach((l, i) => ptext(g, l, 20, 44 + i * 13, PAL.k, 1));
    ptext(g, T.seller.asking(money(ad.price)), 20, 120, PAL.k, 2);
    if (ad.sold) { if (UI.button(g, 384, 12, 200, 28, T.ok)) this.back(); return; }
    if (UI.button(g, 384, 12, 200, 28, T.paper.buy(money(ad.price)))) tryBuyCar(this.i, ad.price, () => Game.go('garage'));
    if (UI.button(g, 384, 48, 200, 28, T.seller.offer, { disabled: ad.haggled })) this.offerBox();
    if (UI.button(g, 384, 84, 200, 28, T.forget)) this.back();
  },
  offerBox() {
    const T = L(), ad = this.ad;
    msgBox([T.seller.offerTitle, ''], [T.seller.offerBtn, T.forget], i => {
      if (i !== 0) return;
      if (haggle(this.i, this.offer)) { Bubbles.say(T.seller.deal, 470, 170, 520, 250, 3); tryBuyCar(this.i, this.offer, () => Game.go('garage')); }
      else { Sound.sfx.nope(); Bubbles.say(T.seller.noWay(money(ad.price)), 470, 170, 520, 250, 3.5); }
      saveGame();
    }, {
      w: 420, extraH: 36, title: true,
      extra: (g, x, y, w) => {
        ptext(g, money(this.offer), x + w / 2, y + 4, PAL.r2, 3, { align: 'center' });
        for (const [bx, bw, label, dv] of [[x + 20, 54, '-25', -25], [x + 80, 44, '-5', -5], [x + w - 124, 44, '+5', 5], [x + w - 74, 54, '+25', 25]]) {
          if (UI.button(g, bx, y, bw, 24, label)) this.offer = clamp(this.offer + dv, 5, ad.price);
        }
      }
    });
  }
};

// ----- Pintura, calcomanías y carrocería -----
const STICKER_KEYS = Object.keys(STICKERS);
SCENES.paint = {
  music: 'garage',
  enter(o) { this.car = o.car; this.preview = null; },
  back() { Game.go('garage'); },
  key(code) { if (code === 'Escape') this.back(); },
  draw(g) {
    const T = L(), car = this.car;
    g.drawImage(paintBackground(), 0, 0);
    // vista previa: lo que está bajo el mouse se prueba en el auto
    const show = this.preview ? Object.assign({}, car, this.preview, { mods: Object.assign({}, car.mods, this.preview.mods || {}) }) : car;
    const spr = pxCarSide(show, 420);
    g.fillStyle = PAL.g2; g.fillRect(130, 342, spr.width - 60, 6);
    g.drawImage(spr, 100, 346 - spr.height);
    this.preview = null;
    if (Game.dialogs.length) return;
    // colores
    ptext(g, T.paint.colors(money(PAINT_PRICE)), 14, 0, PAL.w, 2, { shadow: PAL.k });
    PAINTS.forEach((p, i) => {
      const x = 14 + i * 44, y = 26, hov = UI.over(x, y, 38, 26);
      g.fillStyle = hov ? PAL.y3 : PAL.k; g.fillRect(x - 2, y - 2, 42, 30);
      g.fillStyle = p.c; g.fillRect(x, y, 38, 26);
      if (car.color === p.c) { g.fillStyle = PAL.w; g.fillRect(x + 15, y + 9, 8, 8); }
      if (hov) this.preview = { color: p.c };
      if (UI.hot(x, y, 38, 26, p[LANG]) && car.color !== p.c) confirmBox(T.paint.paintAsk(p[LANG].toLowerCase(), money(PAINT_PRICE)), T.yes, T.forget, () => { if (paintCar(car, p.c)) Sound.sfx.buy(); else say(T.paper.noMoney); });
    });
    // calcomanías
    ptext(g, T.paint.stickers, 14, 56, PAL.w, 2, { shadow: PAL.k });
    STICKER_KEYS.forEach((k, i) => {
      const x = 14 + i * 104, y = 80, has = car.mods.stickers[k];
      if (UI.over(x, y, 98, 24) && !has) this.preview = { mods: { stickers: Object.assign({}, car.mods.stickers, { [k]: 1 }) } };
      if (UI.button(g, x, y, 98, 24, T.paint.sticker[k] + ' ' + money(STICKERS[k]), { disabled: has, scale: 1 })) {
        confirmBox(T.paint.stickAsk(T.paint.sticker[k], money(STICKERS[k])), T.yes, T.forget, () => { if (addSticker(car, k)) Sound.sfx.buy(); else say(T.paper.noMoney); });
      }
    });
    // carrocería y arreglos
    const bx = 14, by = 352;
    const fix = car.body < 0.97 && canRepair(car);
    const btns = [
      [T.paint.nobump(money(BODYWORK.nobump.price)), !car.mods.nobump, () => confirmBox(T.paint.nobumpAsk, T.yes, T.forget, () => { if (bodywork(car, 'nobump')) Sound.sfx.clunk(); else say(T.paper.noMoney); }), { mods: { nobump: 1 } }],
      [T.paint.noroof(money(BODYWORK.noroof.price)), !car.mods.noroof && !car.mods.roofDays && !ART[car.model].open, () => confirmBox(T.paint.noroofAsk(BODYWORK.noroof.days), T.yes, T.forget, () => { if (bodywork(car, 'noroof')) Sound.sfx.clunk(); else say(T.paper.noMoney); }), { mods: { noroof: 1 } }],
      [fix ? T.paint.fix(money(repairCost(car))) : T.paint.strip, fix || Object.values(car.mods.stickers).some(Boolean), () => fix
        ? confirmBox(T.paint.fixAsk(money(repairCost(car))), T.yes, T.forget, () => { if (fixCrash(car)) Sound.sfx.buy(); else say(T.paper.noMoney); })
        : removeStickers(car), fix ? null : { mods: { stickers: {} } }]
    ];
    btns.forEach(([label, ok, fn, prev], i) => {
      const x = bx + i * 160;
      if (ok && prev && UI.over(x, by, 152, 24)) this.preview = prev;
      if (UI.button(g, x, by, 152, 24, label, { disabled: !ok, scale: 1 })) fn();
    });
    if (UI.button(g, 530, by, 96, 24, T.done)) this.back();
  }
};
function paintBackground() {
  return pxBackground('paintshop', g => {
    g.fillStyle = PAL.g5; g.fillRect(0, 0, PW, 250);
    g.fillStyle = PAL.g4; for (let x = 0; x < PW; x += 40) g.fillRect(x, 0, 2, 250);
    g.fillStyle = PAL.g6; g.fillRect(0, 118, PW, 2);
    // lámparas
    for (const x of [120, 320, 520]) { g.fillStyle = PAL.g2; g.fillRect(x - 1, 0, 2, 120); g.fillStyle = PAL.y3; g.fillRect(x - 24, 120, 48, 6); }
    // salpicaduras de pintura en la pared
    const R = rng(9);
    for (let i = 0; i < 40; i++) { g.fillStyle = rpick(R, [PAL.r3, PAL.u3, PAL.y2, PAL.e3, PAL.m3]); g.fillRect(Math.floor(R() * PW), 130 + Math.floor(R() * 110), 2 + Math.floor(R() * 3), 2); }
    g.fillStyle = PAL.g3; g.fillRect(0, 250, PW, 130);
    g.fillStyle = PAL.g2; g.fillRect(0, 250, PW, 4);
    g.fillStyle = PAL.g4; for (let x = 0; x < PW; x += 64) g.fillRect(x, 254, 1, 126);
  });
}
