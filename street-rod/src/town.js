// ===== El pueblo: la bencinera de Gus y Bob's Drive-In, donde llegan los rivales =====
const cents = n => '$' + Math.max(0, n).toFixed(2);

// ----- Gus' Gas -----
function gasBackground() {
  return pxBackground('gas', g => {
    const sky = g.createLinearGradient(0, 0, 0, 232);
    sky.addColorStop(0, '#3f86d8'); sky.addColorStop(1, '#cfe7f5');
    g.fillStyle = sky; g.fillRect(0, 0, PW, 232);
    glow(g, 300, 44, 70, '#fff6c8', 0.45); oval(g, 300, 44, 20, 20, '#fffbe6');
    softCloud(g, 150, 70, 130, 0.75); softCloud(g, 560, 40, 110, 0.6);
    // cerros del desierto: uno lejano y uno cerca
    const far = g.createLinearGradient(0, 110, 0, 232);
    far.addColorStop(0, '#9c8fc4'); far.addColorStop(1, '#c3b8dc');
    g.fillStyle = far; g.beginPath(); g.moveTo(0, 172); g.quadraticCurveTo(70, 120, 130, 128); g.quadraticCurveTo(200, 150, 240, 158); g.quadraticCurveTo(300, 104, 350, 112); g.quadraticCurveTo(420, 150, 480, 160); g.quadraticCurveTo(560, 124, PW, 136); g.lineTo(PW, 232); g.lineTo(0, 232); g.fill();
    const near = g.createLinearGradient(0, 180, 0, 232);
    near.addColorStop(0, '#c99b6c'); near.addColorStop(1, '#b38457');
    g.fillStyle = near; g.beginPath(); g.moveTo(0, 214); g.quadraticCurveTo(90, 188, 190, 206); g.quadraticCurveTo(300, 182, 400, 210); g.lineTo(400, 232); g.lineTo(0, 232); g.fill();
    // campo seco detrás, con postes de teléfono
    const field = g.createLinearGradient(0, 228, 0, 284);
    field.addColorStop(0, '#e2cb98'); field.addColorStop(1, '#c9ac76');
    g.fillStyle = field; g.fillRect(0, 228, PW, 56);
    const R = rng(9);
    for (let i = 0; i < 14; i++) { const sx = R() * 400, sy = 236 + R() * 40, r = 3 + R() * 5; oval(g, sx, sy, r * 1.4, r * 0.8, i % 2 ? '#8d9450' : '#76803e'); }
    for (const px of [70, 270]) {
      g.fillStyle = '#6a4a2c'; g.fillRect(px, 160, 3, 92); g.fillRect(px - 10, 166, 23, 2.5);
    }
    g.strokeStyle = 'rgba(30,30,30,0.55)'; g.lineWidth = 0.6;
    for (const dy of [0, 4]) { g.beginPath(); g.moveTo(0, 170 + dy); g.quadraticCurveTo(35, 176 + dy, 71, 167 + dy); g.quadraticCurveTo(170, 182 + dy, 271, 167 + dy); g.quadraticCurveTo(340, 178 + dy, 400, 172 + dy); g.stroke(); }
    // el local de Gus: estuco blanco, techo rojo y vitrinas
    const wall = g.createLinearGradient(0, 120, 0, 282);
    wall.addColorStop(0, '#fdfcf8'); wall.addColorStop(1, '#d9d4c8');
    g.fillStyle = wall; g.fillRect(400, 120, 240, 162);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(400, 120, 3, 162);
    const roof = g.createLinearGradient(0, 108, 0, 128);
    roof.addColorStop(0, '#f05a4a'); roof.addColorStop(1, '#a81e1c');
    g.fillStyle = roof; g.fillRect(392, 108, 248, 18);
    g.fillStyle = '#ffffff'; g.fillRect(392, 118, 248, 1.5);
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(400, 126, 240, 3);
    g.fillStyle = '#3a4250'; g.fillRect(418, 148, 94, 76);
    glassPane(g, 421, 151, 88, 70, false);
    g.fillStyle = '#3a4250'; g.fillRect(464, 151, 2, 70);
    g.fillStyle = '#ffffff'; g.fillRect(426, 196, 26, 12); ptext(g, 'OPEN', 439, 197, PAL.r3, 1, { align: 'center', weight: 900 });
    g.fillStyle = '#c8c2b4'; g.fillRect(414, 224, 102, 4);
    g.fillStyle = '#3a4250'; g.fillRect(538, 146, 54, 108);
    glassPane(g, 542, 150, 46, 56, false);
    const door = g.createLinearGradient(542, 0, 588, 0); door.addColorStop(0, '#2c6aa8'); door.addColorStop(1, '#1c3c70');
    g.fillStyle = door; g.fillRect(542, 206, 46, 48);
    g.fillStyle = '#d8dce2'; g.fillRect(548, 214, 34, 2.5); oval(g, 580, 232, 2, 2, '#e8e0b0');
    g.fillStyle = '#5a5c62'; g.fillRect(400, 266, 240, 16);
    // latas de aceite y una pila de neumáticos
    g.fillStyle = '#7a6a50'; g.fillRect(512, 240, 52, 3); g.fillRect(514, 243, 2, 23); g.fillRect(560, 243, 2, 23); g.fillRect(512, 254, 52, 2);
    for (let i = 0; i < 5; i++) {
      const cx = 515 + i * 9.5, c = [PAL.r3, PAL.y2, PAL.u3, PAL.e3, PAL.r3][i];
      g.fillStyle = sideLit(g, c, cx, cx + 8); g.fillRect(cx, 228, 8, 12); g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(cx, 232, 8, 3);
      g.fillStyle = sideLit(g, [PAL.e3, PAL.u3, PAL.r3, PAL.y2, PAL.u3][i], cx, cx + 8); g.fillRect(cx, 243, 8, 11);
    }
    for (let i = 0; i < 4; i++) {
      const ty = 262 - i * 11;
      oval(g, 618, ty + 2, 20, 6.5, '#121214'); oval(g, 618, ty, 20, 6.5, '#26262a'); oval(g, 618, ty - 1, 9, 2.6, '#0c0c0e');
      g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1; g.beginPath(); g.ellipse(618, ty, 16, 5, 0, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
    }
    // letrero del techo, con dos postes
    g.fillStyle = '#8a8e96'; g.fillRect(452, 104, 4, 8); g.fillRect(584, 104, 4, 8);
    const sg = g.createLinearGradient(0, 58, 0, 106);
    sg.addColorStop(0, '#ff5a46'); sg.addColorStop(1, '#b01c1a');
    g.fillStyle = 'rgba(0,0,0,0.25)'; roundRect(g, 423, 63, 200, 46, 8); g.fill();
    g.fillStyle = '#ffffff'; roundRect(g, 418, 58, 204, 48, 9); g.fill();
    g.fillStyle = sg; roundRect(g, 421, 61, 198, 42, 7); g.fill();
    ptext(g, "GUS' GAS", 520, 68, '#ffd84a', 4, { align: 'center', shadow: '#6a0c0c', weight: 900 });
    // la bomba antigua (el contador se dibuja aparte), sobre su isla
    g.fillStyle = '#c9c4b8'; g.fillRect(350, 286, 74, 12); g.fillStyle = '#e8e2d4'; g.fillRect(350, 284, 74, 3);
    for (let sx = 350; sx < 424; sx += 10) { g.fillStyle = (sx / 10) % 2 ? '#1c1c1c' : '#f0c830'; g.fillRect(sx, 294, 10, 4); }
    const pump = g.createLinearGradient(362, 0, 412, 0);
    pump.addColorStop(0, '#f2584c'); pump.addColorStop(0.45, '#d6302a'); pump.addColorStop(1, '#8c1614');
    g.fillStyle = pump; roundRect(g, 362, 170, 50, 116, 12); g.fill(); g.fillRect(362, 270, 50, 16);
    g.fillStyle = '#e8eaee'; g.fillRect(362, 222, 50, 3); g.fillRect(362, 276, 50, 3);
    g.fillStyle = '#ffffff'; roundRect(g, 370, 232, 34, 24, 3); g.fill();
    ptext(g, 'REGULAR', 387, 236, PAL.r3, 0.8, { align: 'center', weight: 900 });
    ptext(g, '31¢', 387, 244, '#1c1c1c', 1, { align: 'center', weight: 900 });
    g.fillStyle = '#d8dce2'; roundRect(g, 366, 180, 42, 38, 4); g.fill();
    g.fillStyle = '#0b0c0e'; g.fillRect(369, 183, 36, 32);
    glow(g, 387, 150, 34, '#ffffff', 0.35);
    const globe = g.createRadialGradient(381, 144, 2, 387, 152, 20);
    globe.addColorStop(0, '#ffffff'); globe.addColorStop(1, '#d8dce4');
    g.fillStyle = globe; g.beginPath(); g.arc(387, 152, 19, 0, TAU); g.fill();
    g.fillStyle = '#d6302a'; roundRect(g, 371, 145, 32, 13, 3); g.fill();
    ptext(g, 'GAS', 387, 146, '#ffffff', 1.1, { align: 'center', weight: 900 });
    g.fillStyle = '#9aa0aa'; g.fillRect(380, 168, 14, 4);
    g.strokeStyle = '#141414'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(362, 250); g.quadraticCurveTo(326, 300, 304, 268); g.stroke();
    g.fillStyle = '#9aa0aa'; g.fillRect(352, 226, 10, 6); g.fillStyle = '#d8dce2'; g.fillRect(346, 230, 8, 12);
    // cartel de precio
    g.fillStyle = '#6a6e76'; g.fillRect(20, 128, 5, 160);
    g.fillStyle = 'rgba(0,0,0,0.25)'; roundRect(g, 7, 93, 90, 46, 5); g.fill();
    g.fillStyle = '#d6302a'; roundRect(g, 4, 88, 90, 48, 5); g.fill();
    g.fillStyle = '#ffffff'; roundRect(g, 7, 91, 84, 42, 3); g.fill();
    ptext(g, 'REGULAR', 49, 93, '#1c1c1c', 0.8, { align: 'center', weight: 900 });
    ptext(g, '31¢', 49, 101, PAL.r3, 3, { align: 'center', weight: 900 });
    // el piso de concreto, con juntas y manchas de aceite
    const apron = g.createLinearGradient(0, 282, 0, PH);
    apron.addColorStop(0, '#dcd8d0'); apron.addColorStop(1, '#a7a399');
    g.fillStyle = apron; g.fillRect(0, 282, PW, PH - 282);
    g.fillStyle = 'rgba(0,0,0,0.1)';
    for (let x = 0; x <= PW; x += 80) { g.beginPath(); g.moveTo(x, 282); g.lineTo(x + 0.6, 282); g.lineTo((x - PW / 2) * 1.5 + PW / 2 + 0.9, PH); g.lineTo((x - PW / 2) * 1.5 + PW / 2, PH); g.fill(); }
    g.fillRect(0, 330, PW, 1);
    oval(g, 250, 342, 42, 7, 'rgba(40,36,30,0.18)'); oval(g, 90, 376, 30, 5, 'rgba(40,36,30,0.14)');
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 282, PW, 2);
  });
}
// Gus: gorra, overol azul y un trapo rojo en el bolsillo
const pxGus = () => pxPerson('gus', { k: 1.4 });
SCENES.gas = {
  music: 'garage',
  enter() { this.car = activeCar(); this.gal = 0; this.cost = 0; this.tick = 0; this.pumping = false; Bubbles.say(L().gas.hello, 470, 126, 476, 170, 3); },
  key(code) { if (code === 'Escape') this.leave(); },
  leave() { saveGame(); Game.go('cruise', { car: this.car, night: false, text: L().cruising, then: () => Game.go('garage') }); },
  update(dt) {
    if (!this.pumping) return;
    const got = buyGas(this.car, dt * 1.6, false);
    if (got <= 0) {
      this.pumping = false;
      if (this.car.fuel >= TANK - 0.02) Bubbles.say(L().gas.full, 470, 126, 476, 170, 3);
      else Bubbles.say(L().gas.broke, 470, 126, 476, 170, 3);
      return;
    }
    this.gal += got; this.cost += got * GAS_PRICE;
    if (Math.floor(this.gal) > this.tick) { this.tick = Math.floor(this.gal); Sound.sfx.pumpTick(); }
  },
  draw(g) {
    const T = L(), car = this.car;
    blit(g, gasBackground(), 0, 0);
    drawCarSide(g, car, 185, 362, 1.6);
    const gus = pxGus();
    blit(g, gus, 450, 304 - gus.lh);
    // contador de la bomba
    ptext(g, this.gal.toFixed(1), 404, 188, PAL.y2, 1, { align: 'right' });
    ptext(g, cents(this.cost), 404, 200, PAL.e3, 1, { align: 'right' });
    // aguja de bencina del auto
    UI.greyBox(g, 12, 12, 220, 52);
    ptext(g, T.gas.tank(car.fuel.toFixed(1), TANK), 22, 18, PAL.k, 2);
    g.fillStyle = PAL.k; g.fillRect(22, 42, 200, 12); g.fillStyle = car.fuel < 2 ? PAL.r3 : PAL.e3; g.fillRect(24, 44, 196 * car.fuel / TANK, 8);
    const need = TANK - car.fuel, full = need * GAS_PRICE * 2;
    const x = 440, y = 306;
    if (UI.button(g, x, y, 196, 22, T.gas.fill(cents(full)), { scale: 1, disabled: need < 0.05 })) {
      if (S.money < full) { Sound.sfx.nope(); Bubbles.say(T.gas.noMoney, 470, 126, 476, 170, 3.5); }
      else { const got = buyGas(car, need, true); this.gal += got; this.cost += got * GAS_PRICE * 2; Sound.sfx.buy(); Bubbles.say(T.gas.thanks(cents(got * GAS_PRICE * 2)), 470, 126, 476, 170, 3); saveGame(); }
    }
    // la bomba sola: hay que mantener apretado
    const hov = UI.over(x, y + 26, 196, 22);
    this.pumping = hov && UI.held && need > 0.02 && S.money > 0.01;
    UI.button(g, x, y + 26, 196, 22, this.pumping ? T.gas.pumping : T.gas.self, { scale: 1, disabled: need < 0.05 });
    if (UI.button(g, x, y + 52, 196, 18, T.gas.leave, { scale: 1 })) this.leave();
  },
  status() { return [L().bankroll(cents(S.money)), '', L().shortDate(dateOf(S.day))]; }
};

// ----- Bob's Drive-In -----
function drawDinerClock(g, min) {
  const cx = 534, cy = 132;
  g.fillStyle = PAL.k; g.beginPath(); g.arc(cx, cy, 15, 0, TAU); g.fill();
  g.fillStyle = PAL.w; g.beginPath(); g.arc(cx, cy, 13, 0, TAU); g.fill();
  g.fillStyle = PAL.k; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; g.fillRect(Math.round(cx + Math.cos(a) * 11), Math.round(cy + Math.sin(a) * 11), 1, 1); }
  const h = (20 + min / 60) % 12, m = min % 60;
  g.strokeStyle = PAL.k; g.lineWidth = 2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(h / 12 * TAU - Math.PI / 2) * 6, cy + Math.sin(h / 12 * TAU - Math.PI / 2) * 6); g.stroke();
  g.strokeStyle = PAL.r3; g.lineWidth = 1;
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(m / 60 * TAU - Math.PI / 2) * 10, cy + Math.sin(m / 60 * TAU - Math.PI / 2) * 10); g.stroke();
}
const DINER_BG = [['chevy49', '#1a8a8a'], ['chevy57', '#d02c2c']];   // los autos estacionados al fondo
SCENES.diner = {
  music: 'diner',
  enter(o = {}) {
    this.bg = DINER_BG.map(([m, col]) => makeCar(m, { color: col }));
    this.car = null; this.state = 'wait'; this.waitT = 1; this.callId = null;
    const cur = S.night && S.night.cur;
    if (o.resume && cur) { this.park(cur); this.carX = this.parkX; this.state = 'parked'; }
    else if (o.after) this.waitT = 1.6;
  },
  key(code) { if (code === 'Escape') this.goHome(); },
  park(cur) {
    this.rival = rivalById(cur.id);
    this.car = cur.car;
    this.w = carSideBox(cur.car, 0, DINER_GROUND, DINER_K).w;
    this.parkX = 300;
  },
  arrive() {
    const cur = nextRival(this.callId);
    this.callId = null;
    if (!cur) { this.state = 'closed'; this.car = null; Bubbles.say(L().diner.closing, 337, 60, 337, 150, 5); saveGame(); return; }
    this.park(cur);
    this.carX = PW + this.w / 2 + 20; this.state = 'arrive';
  },
  leave() { this.state = 'leave'; Bubbles.clear(); },
  // dónde habla el rival (sobre su auto)
  rivalSay(text, t = 3) { Bubbles.say(text, this.carX + 20, 92, this.carX - 10, 232, t); },
  update(dt) {
    if (this.state === 'wait') { if ((this.waitT -= dt) <= 0) this.arrive(); }
    else if (this.state === 'arrive') {
      this.carX = Math.max(this.parkX, this.carX - dt * Math.max(120, (this.carX - this.parkX) * 2.2));
      if (this.carX <= this.parkX + 1) {
        this.carX = this.parkX; this.state = 'parked';
        const T = L();
        this.rivalSay(this.rival.id === 'king' ? T.diner.kingHello : T.diner.hello[Math.floor(Math.random() * T.diner.hello.length)]);
      }
    } else if (this.state === 'leave') {
      this.carX -= dt * 520;
      if (this.carX < -this.w / 2 - 20) { this.car = null; this.state = 'wait'; this.waitT = 0.8; }
    } else if (this.state === 'start') {
      if ((this.startT -= dt) <= 0) Game.go('race', this.opts);
    }
  },
  draw(g) {
    const T = L();
    drawDriveIn(g, Game.t, { car: this.car, carX: this.carX, flip: true, bgCars: this.bg });
    // el reloj de Bob's (abre a las 8 y cierra a la 1)
    drawDinerClock(g, S.night ? S.night.min : 0);
    if (Game.dialogs.length) return;
    if (UI.button(g, PW - 112, 358, 104, 18, T.diner.goHome, { scale: 1 })) this.goHome();
    // el tipo del poste: a quién quieres llamar
    if (UI.hot(314, 148, 48, this.car ? 36 : 120, T.diner.postGuy)) this.callList();
    if (this.state === 'parked' && this.car) {
      const b = carSideBox(this.car, this.carX, DINER_GROUND, DINER_K);
      if (UI.hot(b.x, b.y + 12, b.w, b.h - 12, T.diner.challenge(rivalName(this.rival)))) this.challenge();
    }
  },
  status() {
    const cur = S.night && S.night.cur;
    const mid = this.state === 'parked' && cur ? `${rivalName(this.rival)} · ${carTitle(cur.car.model)}` : '';
    return [L().bankroll(money(S.money)), mid, L().clock(S.night ? S.night.min : 0)];
  },
  sounds() {
    if (this.state === 'arrive' || this.state === 'leave') Sound.engine('rival', { rpm: this.state === 'leave' ? 2400 : 1300, throttle: 0.4, cyl: 8, vol: 0.5, pan: clamp((this.carX - PW / 2) / PW, -0.8, 0.8) });
    else Sound.stopEngines();
  },
  challenge() {
    const T = L(), id = this.rival.id, king = id === 'king';
    menuBox(420, 150, 200, [T.diner.drag, T.diner.road, T.diner.hood, T.forget], i => {
      if (i === 0) {
        if (king) return this.rivalSay(T.diner.kingOnlyPinks);
        menuBox(420, 150, 200, [T.diner.kicks, '$10', '$50', T.forget], k => { if (k >= 0 && k < 3) this.propose('drag', [0, 10, 50][k]); else if (k === 3) this.dismiss(); }, { title: T.diner.drag });
      } else if (i === 1) {
        const bets = king ? ['pinks'] : [25, 50, 100, 'pinks'];
        const labels = bets.map(b => (b === 'pinks' ? T.diner.pinks : '$' + b));
        menuBox(420, 150, 200, [...labels, T.forget], k => { if (k >= 0 && k < bets.length) this.propose('road', bets[k]); else if (k === bets.length) this.dismiss(); }, { title: T.diner.road });
      } else if (i === 2) {
        Game.go('engine', { car: S.night.cur.car, readOnly: true, back: () => Game.go('diner', { resume: true }) });
      } else if (i === 3) this.dismiss();
    }, { title: rivalName(this.rival) });
  },
  // "Olvídalo": el rival se va y llega otro
  dismiss() { this.rivalSay(L().diner.bye, 1.5); this.leave(); },
  propose(type, bet) {
    const T = L(), id = this.rival.id;
    if (bet !== 'pinks' && bet > S.money) return Bubbles.say(T.diner.youBroke, 337, 60, 337, 150, 3);
    const ans = rivalAnswer(id, type, bet);
    if (ans) { Sound.sfx.nope(); return this.rivalSay(T.diner.refuse[ans]); }
    this.rivalSay(id === 'king' ? T.diner.kingYes : T.diner.yes[Math.floor(Math.random() * T.diner.yes.length)], 2);
    this.opts = raceOptions(id, type, bet);
    this.state = 'start'; this.startT = 1.8;
  },
  callList() {
    const T = L();
    listBox(T.diner.lookingFor, () => callable().map(id => { const r = rivalById(id); return { label: rivalName(r), right: carTitle(r.model).slice(0, 18), id }; }), [
      { label: T.diner.call, fn: (i, it) => {
        if (S.night.cur && S.night.cur.id === it.id) return;
        this.callId = it.id;
        if (this.car && this.state === 'parked') this.leave(); else if (this.state === 'closed') this.state = 'wait';
        Bubbles.say(T.diner.calling(rivalName(rivalById(it.id))), 337, 60, 337, 150, 2.5);
      } },
      { label: T.forget, need: false, fn: () => {} }
    ], { empty: T.diner.nobody, w: 560 });
  },
  goHome() {
    const T = L();
    confirmBox(T.diner.homeAsk, T.yes, T.forget, () => {
      Game.go('cruise', { car: activeCar(), night: true, text: T.goingHome, then: () => { endNight(); if (S.over) Game.go('ending'); else { Game.go('garage'); Game.tell(T.g.newDay); } } });
    });
  }
};
