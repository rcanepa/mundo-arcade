// ===== Pantallas: cuál se ve, los diálogos que se abren encima y la barra de estado de abajo =====
// Cada pantalla (SCENES.algo) tiene: enter(arg), onExit(), update(dt), draw(g), status(), key(code) y sounds().
const SCENES = {};
const Game = {
  t: 0, name: '', scene: null, sceneT: 0, dialogs: [], note: null, fade: 0,

  go(name, arg) {
    const sc = SCENES[name];
    if (this.scene && this.scene.onExit) this.scene.onExit();
    this.name = name; this.scene = sc; this.sceneT = 0; this.dialogs = []; this.note = null;
    Bubbles.clear(); UI.clicks.length = 0; UI.keys.length = 0;
    this.fade = COVER ? 0 : 0.3;
    if (sc.music !== undefined) Sound.setMusic(sc.music);
    if (sc.enter) sc.enter(arg);
  },
  open(d) { this.dialogs.push(d); UI.clicks.length = 0; return d; },
  close(d) { const i = d ? this.dialogs.indexOf(d) : this.dialogs.length - 1; if (i >= 0) this.dialogs.splice(i, 1); },
  // Aviso corto en la barra de estado (lo que pasó al hacer clic)
  tell(text, t = 3) { this.note = { text, t }; },

  key(code) {
    const d = this.dialogs[this.dialogs.length - 1];
    if (code === 'Escape' || code === 'blur') {
      if (d) { if (code === 'Escape' && d.cancel !== false) { this.close(d); if (d.onCancel) d.onCancel(); } return; }
    }
    if (this.scene && this.scene.key) this.scene.key(code);
  },

  update(dt) {
    this.t += dt; this.sceneT += dt;
    this.fade = Math.max(0, this.fade - dt);
    if (this.note && (this.note.t -= dt) <= 0) this.note = null;
    Bubbles.update(dt);
    if (this.scene.update) this.scene.update(dt);
  },

  draw(g) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    UI.beginFrame();
    const top = this.dialogs.length;
    UI.enabled = !top;
    this.scene.draw(g);
    this.dialogs.slice().forEach((d, i) => { UI.enabled = i === top - 1; d.draw(g); });
    UI.enabled = true;
    Bubbles.draw(g);
    if (this.scene.status !== false) {
      const st = this.scene.status ? this.scene.status() : defaultStatus();
      statusBar(g, st[0] || '', st[2] || '', this.note ? this.note.text : UI.hover || st[1] || '');
    }
    if (touchControls() && !top) drawTouchControls(g);
    if (this.fade > 0) { g.fillStyle = PAL.k; g.globalAlpha = clamp(this.fade / 0.3, 0, 1); g.fillRect(0, 0, PW, PH); g.globalAlpha = 1; }
    if (UI.mouse) UI.drawCursor(g);
    UI.endFrame();
  },

  // Sonido de motores: solo la carrera y el drive-in los usan
  sounds() {
    if (this.scene && this.scene.sounds) this.scene.sounds(); else Sound.stopEngines();
  }
};
const defaultStatus = () => [S ? L().bankroll(money(S.money)) : '', '', S ? L().shortDate(dateOf(S.day)) : ''];

// ----- Diálogos -----
// Cuadro gris con texto y una fila de botones (como "It's yours!" o "Will you take $345?")
function msgBox(lines, buttons, onPick, o = {}) {
  lines = [].concat(lines);
  const d = {
    cancel: o.cancel, onCancel: () => onPick && onPick(-1),
    draw(g) {
      const wrapped = lines.flatMap(l => (l === '' ? [''] : wrapText(l, (o.w || 420) - 40, 2)));
      const bw = Math.max(90, ...buttons.map(b => textWidth(b, 2) + 24));
      const w = Math.max(o.w || 300, buttons.length * (bw + 12) + 28, ...wrapped.map(l => textWidth(l, 2) + 40));
      const h = wrapped.length * 22 + 74 + (o.extraH || 0);
      const x = Math.round(o.x ?? (PW - w) / 2), y = Math.round(o.y ?? (PH - STATUS_H - h) / 2);
      UI.greyBox(g, x, y, w, h);
      wrapped.forEach((l, i) => ptext(g, l, x + w / 2, y + 14 + i * 22, i === 0 && o.title ? PAL.r2 : PAL.k, 2, { align: 'center' }));
      if (o.extra) o.extra(g, x, y + 14 + wrapped.length * 22, w);
      const total = buttons.length * bw + (buttons.length - 1) * 12;
      buttons.forEach((b, i) => {
        if (UI.button(g, x + (w - total) / 2 + i * (bw + 12), y + h - 44, bw, 30, b)) { Game.close(d); if (onPick) onPick(i); }
      });
      if (UI.enabled && UI.takeKey('Enter')) { Game.close(d); if (onPick) onPick(0); }
    }
  };
  return Game.open(d);
}
const say = (text, cb) => msgBox(text, [L().ok], cb);
// Menú de botones grises en un lugar de la pantalla. El último suele ser "Olvídalo".
function menuBox(x, y, w, items, onPick, o = {}) {
  const d = {
    onCancel: () => onPick(-1),
    draw(g) {
      if (o.title) { const tw = Math.max(w, textWidth(o.title, 2) + 16); g.fillStyle = PAL.k; g.fillRect(x - 4, y - 28, tw + 8, 26); ptext(g, o.title, x + 4, y - 24, PAL.y3, 2); }
      const i = UI.menu(g, x, y, w, items, { h: o.h || 26 });
      if (i >= 0) { Game.close(d); onPick(i); }
    }
  };
  return Game.open(d);
}
// Lista verde con botones abajo (repuestos, autos, llamadas...). items(): lista viva; buttons: [{label, fn(i), need}]
function listBox(title, items, buttons, o = {}) {
  const st = { sel: o.sel ?? 0, top: 0 };
  const w = o.w || 520, h = o.h || 300, x = (PW - w) / 2, y = o.y ?? (PH - STATUS_H - h) / 2;
  const d = {
    draw(g) {
      const list = items();
      if (st.sel >= list.length) st.sel = list.length - 1;
      UI.greenBox(g, x, y, w, h, title);
      UI.list(g, x + 8, y + 34, w - 16, h - 84, list, st, { empty: o.empty });
      if (o.info && list[st.sel]) o.info(g, list[st.sel], x + 12, y + h - 66, st.sel);
      const bw = Math.min(150, (w - 24) / buttons.length - 8);
      buttons.forEach((b, i) => {
        const bx = x + w - 12 - (buttons.length - i) * (bw + 8) + 8;
        const dis = b.need !== false && !list[st.sel];
        if (UI.button(g, bx, y + h - 40, bw, 28, typeof b.label === 'function' ? b.label(list[st.sel]) : b.label, { disabled: dis || (b.disabled && b.disabled(list[st.sel])) })) {
          if (b.close !== false) Game.close(d);
          b.fn(st.sel, list[st.sel]);
        }
      });
    }
  };
  return Game.open(d);
}
// Pregunta sí/no con precio (comprar, pintar, vender)
const confirmBox = (text, yes, no, cb) => msgBox(text, [yes, no], i => { if (i === 0) cb(); });

// Ofertas de compradores: hasta tres, cada una un poco mejor. onSold(monto)
function offerLoop(value, onSold, round = 0) {
  if (round >= 3) { say(L().noMoreBuyers); return; }
  const offer = buyerOffer(value, round);
  msgBox([L().buyerOffer(money(offer))], [L().ok, L().noThanks], i => {
    if (i === 0) { Sound.sfx.buy(); onSold(offer); } else if (i === 1) offerLoop(value, onSold, round + 1);
  });
}

// Pantalla de transición: "Paseando por el pueblo..." con el auto cruzando de lado
SCENES.cruise = {
  music: null, status: false,
  enter(o) { this.o = o; this.x = -240; this.spr = o.car ? pxCarSide(o.car, 230) : null; Sound.sfx.door(); },
  update(dt) { this.x += dt * 330; if (this.x > PW + 40 || (Game.sceneT > 0.4 && UI.clicks.length)) { UI.clicks.length = 0; this.o.then(); } },
  draw(g) {
    const night = this.o.night;
    g.drawImage(cruiseBackground(night), 0, 0);
    if (this.spr) {
      const bob = Math.round(Math.sin(Game.t * 22) * 0.6);
      g.drawImage(this.spr, Math.round(this.x), 330 - this.spr.height + bob);
    }
    ptext(g, this.o.text, PW / 2, 40, night ? PAL.y3 : PAL.k, 3, { align: 'center', shadow: night ? PAL.r2 : PAL.w });
  }
};
// La calle del pueblo de lado (de día o de noche)
function cruiseBackground(night) {
  return pxBackground('cruise' + (night ? 'n' : 'd'), g => {
    const R = rng(4);
    if (night) { g.fillStyle = PAL.k; g.fillRect(0, 0, PW, PH); stars(g, 0, 0, PW, 200, 120); }
    else { const sky = g.createLinearGradient(0, 0, 0, 260); sky.addColorStop(0, PAL.u3); sky.addColorStop(1, PAL.u4); g.fillStyle = sky; g.fillRect(0, 0, PW, 260); }
    // casas y tiendas
    let x = -10;
    while (x < PW) {
      const w = 70 + Math.floor(R() * 90), h = 80 + Math.floor(R() * 110);
      const col = night ? rpick(R, [PAL.g1, PAL.p1, PAL.u1, PAL.b1]) : rpick(R, [PAL.c2, PAL.b4, PAL.t3, PAL.m4, PAL.y3, PAL.g5]);
      g.fillStyle = col; g.fillRect(x, 270 - h, w, h);
      g.fillStyle = night ? PAL.k : PAL.g4; g.fillRect(x, 270 - h, w, 4);
      for (let wy = 270 - h + 14; wy < 240; wy += 30) for (let wx = x + 10; wx < x + w - 16; wx += 24) {
        g.fillStyle = night ? (R() < 0.6 ? PAL.y2 : PAL.g2) : PAL.u2; g.fillRect(wx, wy, 12, 14);
      }
      if (R() < 0.4) { g.fillStyle = night ? PAL.m3 : PAL.r3; g.fillRect(x + 8, 270 - h + 8, w - 16, 10); }
      x += w + 4 + Math.floor(R() * 30);
    }
    // palmeras
    for (let i = 0; i < 4; i++) {
      const px = 60 + i * 160 + Math.floor(R() * 40);
      g.fillStyle = night ? PAL.b1 : PAL.b3; g.fillRect(px, 130, 6, 140);
      g.fillStyle = night ? PAL.e1 : PAL.e2;
      for (let a = 0; a < 7; a++) { g.beginPath(); g.ellipse(px + 3 + Math.cos(a) * 18, 130 + Math.sin(a) * 6, 22, 5, a, 0, TAU); g.fill(); }
    }
    // vereda y calle
    g.fillStyle = night ? PAL.g2 : PAL.g5; g.fillRect(0, 270, PW, 20);
    g.fillStyle = night ? PAL.g1 : PAL.g3; g.fillRect(0, 290, PW, 90);
    g.fillStyle = night ? PAL.g3 : PAL.w; for (let lx = 0; lx < PW; lx += 60) g.fillRect(lx, 348, 30, 4);
    if (night) for (let lx = 40; lx < PW; lx += 200) { g.fillStyle = PAL.g3; g.fillRect(lx, 180, 4, 90); g.fillStyle = PAL.y3; g.fillRect(lx - 6, 176, 16, 6); }
  });
}
