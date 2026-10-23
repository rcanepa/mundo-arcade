// ===== El pueblo: la bencinera de Gus y Bob's Drive-In, donde llegan los rivales =====
const cents = n => '$' + Math.max(0, n).toFixed(2);

// ----- Gus' Gas -----
function gasBackground() {
  return pxBackground('gas', g => {
    const sky = g.createLinearGradient(0, 0, 0, 200);
    sky.addColorStop(0, PAL.u3); sky.addColorStop(1, PAL.u4);
    g.fillStyle = sky; g.fillRect(0, 0, PW, 220);
    g.fillStyle = PAL.p3; g.beginPath(); g.moveTo(0, 170); g.lineTo(120, 120); g.lineTo(220, 160); g.lineTo(330, 110); g.lineTo(470, 166); g.lineTo(PW, 130); g.lineTo(PW, 220); g.lineTo(0, 220); g.fill();
    g.fillStyle = PAL.y3; g.beginPath(); g.arc(300, 44, 22, 0, TAU); g.fill();
    // el local de Gus
    g.fillStyle = PAL.w; g.fillRect(400, 120, 240, 160);
    g.fillStyle = PAL.g6; g.fillRect(400, 250, 240, 30);
    g.fillStyle = PAL.r3; g.fillRect(392, 110, 248, 14); g.fillStyle = PAL.r2; g.fillRect(392, 122, 248, 3);
    g.fillStyle = PAL.u2; g.fillRect(420, 150, 90, 70); g.fillStyle = PAL.u4; g.fillRect(424, 154, 30, 62); g.fillStyle = PAL.g5; g.fillRect(420, 184, 90, 3);
    g.fillStyle = PAL.b2; g.fillRect(540, 150, 50, 100); g.fillStyle = PAL.u3; g.fillRect(548, 160, 34, 30); g.fillStyle = PAL.y2; g.fillRect(578, 200, 5, 5);
    // letrero del techo
    g.fillStyle = PAL.k; g.fillRect(420, 60, 200, 50); g.fillStyle = PAL.r3; g.fillRect(424, 64, 192, 42);
    ptext(g, "GUS' GAS", 520, 70, PAL.y2, 4, { align: 'center', shadow: PAL.r1 });
    g.fillStyle = PAL.g3; g.fillRect(450, 110, 4, 10); g.fillRect(586, 110, 4, 10);
    // latas de aceite y neumáticos en la vereda
    for (let i = 0; i < 4; i++) { g.fillStyle = [PAL.r3, PAL.y2, PAL.u3, PAL.e3][i]; g.fillRect(520 + i * 10, 232, 8, 14); g.fillStyle = PAL.w; g.fillRect(520 + i * 10, 236, 8, 2); }
    for (let i = 0; i < 3; i++) { g.fillStyle = PAL.g1; g.beginPath(); g.ellipse(616, 270 - i * 12, 18, 7, 0, 0, TAU); g.fill(); }
    // la isla con la bomba (el contador se dibuja aparte)
    g.fillStyle = PAL.g5; g.fillRect(352, 290, 70, 12);
    g.fillStyle = PAL.r3; g.fillRect(362, 170, 50, 120); g.fillStyle = PAL.r4; g.fillRect(362, 170, 50, 4); g.fillStyle = PAL.r1; g.fillRect(408, 170, 4, 120);
    g.fillStyle = PAL.w; g.beginPath(); g.arc(387, 152, 20, 0, TAU); g.fill(); g.fillStyle = PAL.r3; g.fillRect(372, 146, 30, 10); ptext(g, 'GAS', 387, 145, PAL.w, 1, { align: 'center' });
    g.fillStyle = PAL.g6; g.fillRect(368, 182, 38, 34); g.fillStyle = PAL.k; g.fillRect(370, 184, 34, 30);
    g.fillStyle = PAL.k; g.fillRect(352, 230, 10, 6); g.strokeStyle = PAL.k; g.lineWidth = 3; g.beginPath(); g.moveTo(362, 240); g.quadraticCurveTo(330, 300, 300, 270); g.stroke();
    // cartel de precio
    g.fillStyle = PAL.g3; g.fillRect(20, 120, 6, 170);
    g.fillStyle = PAL.w; g.fillRect(4, 90, 90, 40); g.fillStyle = PAL.k; g.fillRect(4, 90, 90, 2); g.fillRect(4, 128, 90, 2);
    ptext(g, '31¢', 49, 98, PAL.r3, 3, { align: 'center' });
    // el piso de concreto y la calle
    g.fillStyle = PAL.g5; g.fillRect(0, 280, PW, 100);
    g.fillStyle = PAL.g4; for (let x = 0; x < PW; x += 80) g.fillRect(x, 280, 1, 100);
    g.fillStyle = PAL.g3; g.beginPath(); g.ellipse(250, 340, 40, 7, 0, 0, TAU); g.fill();
  });
}
// Gus: gorra, overol azul y un trapo rojo en el bolsillo
function pxGus() {
  let c = PXCACHE.get('gus');
  if (c) return c;
  const K = 1.4;
  c = pixelSprite(Math.ceil(34 * K), Math.ceil(92 * K), g => {
    g.scale(K, K);
    g.fillStyle = PAL.u2; g.fillRect(8, 48, 8, 38); g.fillRect(18, 48, 8, 38);
    g.fillStyle = PAL.k; g.fillRect(6, 86, 10, 5); g.fillRect(18, 86, 10, 5);
    g.fillStyle = PAL.u2; g.beginPath(); g.moveTo(6, 24); g.lineTo(28, 24); g.lineTo(27, 52); g.lineTo(7, 52); g.fill();
    g.fillStyle = PAL.u3; g.fillRect(10, 26, 3, 24); g.fillStyle = PAL.w; g.fillRect(14, 30, 8, 5);
    g.fillStyle = PAL.r3; g.fillRect(22, 40, 4, 8);
    g.fillStyle = PAL.b5; g.fillRect(2, 26, 5, 22); g.fillRect(27, 26, 5, 22); g.fillRect(13, 18, 8, 7);
    g.beginPath(); g.ellipse(17, 12, 6.5, 7.5, 0, 0, TAU); g.fill();
    g.fillStyle = PAL.g4; g.fillRect(12, 15, 10, 3);
    g.fillStyle = PAL.r3; g.beginPath(); g.ellipse(17, 6, 7.5, 4, 0, Math.PI, 0); g.fill(); g.fillRect(17, 5, 10, 3);
    g.fillStyle = PAL.k; g.fillRect(19, 10, 2, 2);
  });
  PXCACHE.set('gus', c);
  return c;
}
SCENES.gas = {
  music: 'garage',
  enter() { this.car = activeCar(); this.gal = 0; this.cost = 0; this.tick = 0; this.pumping = false; Bubbles.say(L().gas.hello, 470, 126, 474, 214, 3); },
  key(code) { if (code === 'Escape') this.leave(); },
  leave() { saveGame(); Game.go('cruise', { car: this.car, night: false, text: L().cruising, then: () => Game.go('garage') }); },
  update(dt) {
    if (!this.pumping) return;
    const got = buyGas(this.car, dt * 1.6, false);
    if (got <= 0) {
      this.pumping = false;
      if (this.car.fuel >= TANK - 0.02) Bubbles.say(L().gas.full, 470, 126, 474, 214, 3);
      else Bubbles.say(L().gas.broke, 470, 126, 474, 214, 3);
      return;
    }
    this.gal += got; this.cost += got * GAS_PRICE;
    if (Math.floor(this.gal) > this.tick) { this.tick = Math.floor(this.gal); Sound.sfx.pumpTick(); }
  },
  draw(g) {
    const T = L(), car = this.car;
    g.drawImage(gasBackground(), 0, 0);
    const spr = pxCarSide(car, 320);
    g.drawImage(spr, 20, 362 - spr.height);
    g.drawImage(pxGus(), 450, 300 - pxGus().height + 4);
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
      if (S.money < full) { Sound.sfx.nope(); Bubbles.say(T.gas.noMoney, 470, 126, 474, 214, 3.5); }
      else { const got = buyGas(car, need, true); this.gal += got; this.cost += got * GAS_PRICE * 2; Sound.sfx.buy(); Bubbles.say(T.gas.thanks(cents(got * GAS_PRICE * 2)), 470, 126, 474, 214, 3); saveGame(); }
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
const DINER_BG = [['chevy49', '#1a8a8a', false, 230], ['ford57', '#d02c2c', true, 250]];
SCENES.diner = {
  music: 'diner',
  enter(o = {}) {
    this.bg = DINER_BG.map(([m, col, flip, size]) => pxCarSide(makeCar(m, { color: col }), size, { flip }));
    this.spr = null; this.state = 'wait'; this.waitT = 1; this.callId = null;
    const cur = S.night && S.night.cur;
    if (o.resume && cur) { this.park(cur); this.carX = this.parkX; this.state = 'parked'; }
    else if (o.after) this.waitT = 1.6;
  },
  key(code) { if (code === 'Escape') this.goHome(); },
  park(cur) {
    this.rival = rivalById(cur.id);
    this.spr = pxCarSide(cur.car, 440, { flip: true, driver: this.rival.look });
    this.parkX = Math.round((PW - this.spr.width) / 2) - 30;
  },
  arrive() {
    const cur = nextRival(this.callId);
    this.callId = null;
    if (!cur) { this.state = 'closed'; this.spr = null; Bubbles.say(L().diner.closing, 337, 60, 337, 150, 5); saveGame(); return; }
    this.park(cur);
    this.carX = PW + 20; this.state = 'arrive';
  },
  leave() { this.state = 'leave'; Bubbles.clear(); },
  // dónde habla el rival (sobre su auto)
  rivalSay(text, t = 3) { Bubbles.say(text, this.carX + this.spr.width * 0.5, 90, this.carX + this.spr.width * 0.45, this.carX ? 220 : 220, t); },
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
      if (this.carX < -this.spr.width - 20) { this.spr = null; this.state = 'wait'; this.waitT = 0.8; }
    } else if (this.state === 'start') {
      if ((this.startT -= dt) <= 0) Game.go('race', this.opts);
    }
  },
  draw(g) {
    const T = L();
    drawDriveIn(g, Game.t, { car: this.spr, carX: this.carX, bgCars: this.bg });
    // el reloj de Bob's (abre a las 8 y cierra a la 1)
    drawDinerClock(g, S.night ? S.night.min : 0);
    if (Game.dialogs.length) return;
    if (UI.button(g, PW - 112, 358, 104, 18, T.diner.goHome, { scale: 1 })) this.goHome();
    // el tipo del poste: a quién quieres llamar
    if (UI.hot(314, 148, 48, this.spr ? 36 : 120, T.diner.postGuy)) this.callList();
    if (this.state === 'parked' && this.spr) {
      const y = 366 - this.spr.height;
      if (UI.hot(this.carX, y + 20, this.spr.width, this.spr.height - 20, T.diner.challenge(rivalName(this.rival)))) this.challenge();
    }
  },
  status() {
    const cur = S.night && S.night.cur;
    const mid = this.state === 'parked' && cur ? `${rivalName(this.rival)} · ${carTitle(cur.car.model)}` : '';
    return [L().bankroll(money(S.money)), mid, L().clock(S.night ? S.night.min : 0)];
  },
  sounds() {
    if (this.state === 'arrive' || this.state === 'leave') Sound.engine('rival', { rpm: this.state === 'leave' ? 2400 : 1300, throttle: 0.4, cyl: 8, vol: 0.5, pan: clamp((this.carX + 200 - PW / 2) / PW, -0.8, 0.8) });
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
        if (this.spr && this.state === 'parked') this.leave(); else if (this.state === 'closed') this.state = 'wait';
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
