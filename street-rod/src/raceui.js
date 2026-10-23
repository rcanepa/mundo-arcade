// ===== La pantalla de la carrera: cabina, mensajes, resultado y la multa de la policía =====
SCENES.race = {
  music: null,
  enter(o) { this.o = o; this.race = new Race(o); this.shown = false; this.paused = false; },
  onExit() { Sound.siren(false, 0); Sound.stopEngines(); },
  update(dt) {
    if (this.paused || Game.dialogs.length) return;
    this.race.update(dt);
    if (this.race.over && !this.shown) { this.shown = true; this.result(); }
  },
  key(code) {
    if ((code === 'Escape' || code === 'KeyP' || code === 'blur') && !this.race.result && !Game.dialogs.length) this.pause();
  },
  pause() {
    const T = L();
    Sound.stopEngines(); Sound.siren(false, 0);
    msgBox([T.race.paused, '', T.race.keys1, T.race.keys2], [T.race.resume, T.race.giveUp], i => {
      if (i === 1) { this.race.finish('lose', 'giveUp'); this.race.endT = 9; }
    }, { w: 560, title: true });
  },
  draw(g) {
    const r = this.race;
    pxDrawRace(g, r);
    // mensajes grandes sobre el parabrisas (¡YA!, la policía...)
    if (r.msg && !r.result) {
      const big = r.msg.text.length < 12;
      wrapText(r.msg.text, 520, big ? 4 : 2).forEach((l, i) => ptext(g, l, PW / 2, 60 + i * (big ? 40 : 22), r.msg.color === '#fff' ? PAL.w : PAL.y2, big ? 4 : 2, { align: 'center', shadow: PAL.k }));
    }
    if (r.phase === 'intro' || r.phase === 'stage') {
      const help = this.o.car.p.trans && TRANS[this.o.car.p.trans.k].auto ? L().race.helpAuto : L().race.help;
      const lines = wrapText(help, 480, 1);
      g.fillStyle = PAL.k; g.fillRect(PW / 2 - 250, 128, 500, lines.length * 11 + 6);
      lines.forEach((l, i) => ptext(g, l, PW / 2, 130 + i * 11, PAL.y3, 1, { align: 'center' }));
    }
  },
  status() {
    const T = L(), r = this.race, v = r.me.veh;
    const gear = v.gear === 0 ? 'N' : r.me.s.auto ? 'D' : String(v.gear);
    let mid = '';
    if (r.phase === 'intro' || r.phase === 'stage') mid = T.race.ready;
    else if (r.phase === 'run') mid = `${Math.round(v.v * 2.237)} mph`;
    return [T.race.gear(gear), mid, r.type === 'drag' ? T.race.dragName : T.race.roadName];
  },
  sounds() {
    const r = this.race;
    if (this.paused || Game.dialogs.length && !r.result) return Sound.stopEngines();
    const me = r.me.veh, rv = r.rv.veh;
    Sound.engine('me', { rpm: me.dead() && me.blown ? 0 : me.rpm, throttle: me.throttle, cyl: r.me.s.cyl, vol: 1, pan: 0 });
    const gap = r.rv.z - r.me.z;
    Sound.engine('rival', { rpm: rv.rpm, throttle: rv.throttle, cyl: r.rv.s.cyl, vol: clamp(1 - Math.abs(gap) / 160, 0, 0.8), pan: clamp(r.rv.x / 4, -0.8, 0.8) });
    Sound.skid(clamp(Math.max(me.spin, r.me.slide || 0) * 0.8, 0, 1));
    Sound.wind(clamp(me.v / 60, 0, 1));
  },
  // El cuadro del resultado: tiempo, velocidad promedio y lo que se ganó o perdió
  result() {
    const T = L(), r = this.race, res = r.result, o = this.o, name = o.rival.name;
    const dist = r.T.finish - r.T.start;
    const lines = [];
    const betText = o.bet === 'pinks' ? null : o.bet ? money(o.bet) : null;
    if (res.outcome === 'win') {
      if (res.reason === 'finish' && res.time) lines.push(T.race.winTime(res.time.toFixed(1), Math.round(dist / res.time * 2.237)));
      else lines.push(T.race.reasons[res.reason] ? T.race.reasons[res.reason](name) : T.race.won);
      lines.push(o.bet === 'pinks' ? T.race.wonPinks(carTitle(o.rival.car.model)) : betText ? T.race.wonMoney(betText) : T.race.congrats);
    } else if (res.outcome === 'lose') {
      if (res.reason === 'finish' && res.rivalTime) lines.push(T.race.loseTime(name, res.rivalTime.toFixed(1), res.time ? res.time.toFixed(1) : '—'));
      else lines.push(T.race.reasons[res.reason] ? T.race.reasons[res.reason](name) : T.race.lost);
      lines.push(o.bet === 'pinks' ? T.race.lostPinks : betText ? T.race.lostMoney(betText) : T.race.better);
    } else {
      lines.push(T.race.reasons[res.reason](name), T.race.fine(money(res.fine)));
    }
    if (res.outcome !== 'void') {
      const line = res.outcome === 'win' ? T.race.rivalLoses : T.race.rivalWins;
      Bubbles.say(o.rival.king ? (res.outcome === 'win' ? T.race.kingLoses : T.race.kingWins) : line[Math.floor(Math.random() * line.length)], PW / 2, 26, PW / 2 + 40, 110, 99);
    }
    msgBox(lines, [T.ok], () => this.done(), { w: 560, y: 150, cancel: false });
  },
  done() {
    Bubbles.clear();
    const res = this.race.result;
    const sum = applyResult(this.o, res);
    if (res.fine) Game.go('ticket', { fine: res.fine, jail: sum.jail, car: this.o.car });
    else if (S.over) Game.go('ending');
    else Game.go('diner', { after: sum });
  }
};

// La multa: el formulario de la Policía de Caminos, hay que firmar
SCENES.ticket = {
  music: null,
  enter(o) { this.o = o; this.signed = 0; Sound.siren(false, 0); },
  update(dt) { if (this.signed > 0 && this.signed < 1) this.signed = Math.min(1, this.signed + dt * 1.2); },
  draw(g) {
    const T = L(), o = this.o;
    g.fillStyle = PAL.k; g.fillRect(0, 0, PW, PH);
    // las luces del patrullero de fondo
    if (Math.floor(Game.t * 3) % 2) { g.fillStyle = PAL.r2; g.fillRect(0, 0, 60, PH); } else { g.fillStyle = PAL.u1; g.fillRect(PW - 60, 0, 60, PH); }
    const x = 120, y = 14, w = 400, h = 350;
    g.fillStyle = PAL.k; g.fillRect(x + 5, y + 5, w, h);
    g.fillStyle = PAL.c1; g.fillRect(x, y, w, h);
    g.fillStyle = PAL.u1; g.fillRect(x, y, w, 40);
    ptext(g, T.ticket.state, x + w / 2, y + 6, PAL.y2, 2, { align: 'center' });
    ptext(g, T.ticket.title, x + w / 2, y + 26, PAL.w, 1, { align: 'center' });
    const rows = [[T.ticket.name, S.name], [T.ticket.vehicle, carTitle(o.car.model)], [T.ticket.date, T.date(dateOf(S.day))], [T.ticket.violation, T.ticket.speeding], [T.ticket.fine, money(o.fine)]];
    rows.forEach(([k, v], i) => {
      ptext(g, k, x + 16, y + 56 + i * 34, PAL.u1, 1);
      ptext(g, v, x + 16, y + 68 + i * 34, PAL.k, 2);
      g.fillStyle = PAL.g4; g.fillRect(x + 16, y + 86 + i * 34, w - 32, 1);
    });
    ptext(g, T.ticket.signHere, x + 16, y + 236, PAL.u1, 1);
    const sx = x + 16, sy = y + 280;
    g.fillStyle = PAL.k; g.fillRect(sx, sy, 250, 2);
    // la firma se dibuja de a poco
    if (this.signed > 0) {
      g.strokeStyle = PAL.u2; g.lineWidth = 2; g.beginPath();
      const n = Math.floor(this.signed * 60);
      for (let k = 0; k <= n; k++) { const t = k / 60, px = sx + 10 + t * 200 + Math.cos(t * 44) * 7, py = sy - 12 + Math.sin(t * 44) * 10 * (1 - t * 0.6) + Math.sin(t * 5) * 3; if (k) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
    } else if (UI.hot(sx, sy - 34, 250, 40, T.ticket.clickSign)) { this.signed = 0.01; Sound.sfx.select(); }
    if (this.signed >= 1) {
      ptext(g, o.jail ? T.ticket.cantPay : T.ticket.paid, x + w / 2, y + 292, o.jail ? PAL.r3 : PAL.e2, 2, { align: 'center' });
      if (UI.button(g, x + w / 2 - 50, y + 316, 100, 26, T.ok)) Game.go(S.over ? 'ending' : 'diner', { after: true });
    }
  },
  status() { return [L().bankroll(money(S.money)), '', '']; }
};
