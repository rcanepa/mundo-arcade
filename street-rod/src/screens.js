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
    g.setTransform(RES, 0, 0, RES, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
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
    if (typeof canvas !== 'undefined' && canvas.style) { const cur = UI.cssCursor(); if (canvas.style.cursor !== cur) canvas.style.cursor = cur; }
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
  enter(o) { this.o = o; this.x = -150; Sound.sfx.door(); },
  update(dt) { this.x += dt * 330; if (this.x > PW + 160 || (Game.sceneT > 0.4 && UI.clicks.length)) { UI.clicks.length = 0; this.o.then(); } },
  draw(g) {
    const night = this.o.night;
    blit(g, cruiseBackground(night), 0, 0);
    if (this.o.car) {
      const box = drawCarSide(g, this.o.car, this.x, 331 + Math.sin(Game.t * 22) * 0.3, 1.25, { night });
      // de noche, los focos alumbran la calle por delante
      if (night) {
        const hx = box.x + box.w - 2, hy = box.y + box.h * 0.55;
        g.save(); g.globalCompositeOperation = 'lighter';
        const beam = g.createLinearGradient(hx, 0, hx + 170, 0);
        beam.addColorStop(0, 'rgba(255,240,200,0.32)'); beam.addColorStop(1, 'rgba(255,240,200,0)');
        g.fillStyle = beam; g.beginPath(); g.moveTo(hx, hy - 3); g.lineTo(hx + 170, hy + 4); g.lineTo(hx + 170, 336); g.lineTo(hx, hy + 4); g.closePath(); g.fill();
        glow(g, hx, hy, 10, '#fff4d0', 0.8);
        g.restore();
      }
    }
    ptext(g, this.o.text, PW / 2, 40, night ? PAL.y3 : PAL.k, 3, { align: 'center', shadow: night ? PAL.r2 : PAL.w });
  }
};
// La calle del pueblo de lado (de día o de noche)
const TOWN_SHOPS = [
  { t: 'DRUGS', c: '#1c6aa8', awn: '#d02c2c' }, { t: 'BARBER', c: '#a83030', door: 1 }, { t: 'CAFE', c: '#2c8a5a', awn: '#2c8a5a' },
  { t: 'RADIO · TV', c: '#6a3ca0', door: 1 }, { t: 'HARDWARE', c: '#b06a18', awn: '#e0a020' }, { t: 'RECORDS', c: '#c02c78', door: 1 },
  { t: 'BAKERY', c: '#a0602c', awn: '#3c6cf0' }, { t: 'SHOES', c: '#2c4a8a', door: 1 }
];
const TOWN_COLORS = ['#f2d7a6', '#e9b8a0', '#a8d0c8', '#f4ece0', '#c8d4e8', '#e8c86a', '#d8b0c8'];
function cruiseBackground(night) {
  return pxBackground('cruise' + (night ? 'n' : 'd'), g => {
    const R = rng(4);
    const sky = g.createLinearGradient(0, 0, 0, 270);
    if (night) { sky.addColorStop(0, '#04050c'); sky.addColorStop(1, '#1e1a3c'); }
    else { sky.addColorStop(0, '#3f86d8'); sky.addColorStop(1, '#cbe6f6'); }
    g.fillStyle = sky; g.fillRect(0, 0, PW, 272);
    if (night) { stars(g, 0, 0, PW, 180, 140); glow(g, 560, 46, 40, '#fff3cc', 0.25); oval(g, 560, 46, 11, 11, '#fff6dc'); }
    else { softCloud(g, 120, 50, 150); softCloud(g, 470, 34, 120, 0.7); softCloud(g, 610, 80, 90, 0.6); }
    // cerros lejanos
    g.fillStyle = night ? '#141228' : '#a8bfd6';
    g.beginPath(); g.moveTo(0, 230); g.quadraticCurveTo(110, 170, 230, 205); g.quadraticCurveTo(360, 150, 470, 200); g.quadraticCurveTo(570, 175, PW, 195); g.lineTo(PW, 272); g.lineTo(0, 272); g.fill();
    // tiendas
    let x = -14, i = Math.floor(R() * TOWN_SHOPS.length);
    while (x < PW) {
      const w = 92 + Math.floor(R() * 70), h = 104 + Math.floor(R() * 86);
      storefront(g, x, w, h, 270, rpick(R, TOWN_COLORS), night, R, TOWN_SHOPS[i++ % TOWN_SHOPS.length]);
      x += w + 6 + Math.floor(R() * 26);
    }
    // vereda con su solera
    const sw = g.createLinearGradient(0, 270, 0, 290);
    sw.addColorStop(0, night ? '#34343c' : '#d6d1c6'); sw.addColorStop(1, night ? '#26262c' : '#b9b3a7');
    g.fillStyle = sw; g.fillRect(0, 270, PW, 20);
    g.fillStyle = 'rgba(0,0,0,0.1)'; for (let lx = 20; lx < PW; lx += 46) g.fillRect(lx, 270, 1, 20);
    g.fillStyle = night ? '#4a4a52' : '#ece8e0'; g.fillRect(0, 288, PW, 3);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 291, PW, 2);
    // palmeras y faroles
    for (let k = 0; k < 4; k++) palmTree(g, 70 + k * 165 + Math.floor(R() * 30), 280, 150 + R() * 30, (R() - 0.3) * 0.25, night);
    for (let lx = 140; lx < PW; lx += 220) {
      g.fillStyle = night ? '#2a2a30' : '#4a4e56'; g.fillRect(lx, 176, 3, 104); g.fillRect(lx, 176, 16, 3);
      g.fillStyle = night ? '#fff2c0' : '#d8dce2'; g.fillRect(lx + 10, 178, 9, 3);
      if (night) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lx + 14, 180, 46, '#ffd890', 0.4); g.restore(); }
    }
    // la calle
    const st = g.createLinearGradient(0, 293, 0, PH);
    st.addColorStop(0, night ? '#1c1d22' : '#585a60'); st.addColorStop(1, night ? '#111216' : '#3c3e44');
    g.fillStyle = st; g.fillRect(0, 293, PW, PH - 293);
    for (let n = 0; n < 500; n++) { g.fillStyle = `rgba(255,255,255,${0.03 + R() * 0.05})`; g.fillRect(R() * PW, 293 + R() * 107, 1, 1); }
    g.fillStyle = night ? '#6a6a60' : '#f2f0e6'; for (let lx = 0; lx < PW; lx += 60) g.fillRect(lx, 348, 30, 3);
    // la luz de los faroles en la vereda y la calle
    if (night) for (let lx = 140; lx < PW; lx += 220) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(lx + 14, 292); g.scale(1, 0.22);
      const pool = g.createRadialGradient(0, 0, 0, 0, 0, 90);
      pool.addColorStop(0, 'rgba(255,214,140,0.22)'); pool.addColorStop(1, 'rgba(255,214,140,0)');
      g.fillStyle = pool; g.fillRect(-90, -90, 180, 180); g.restore();
    }
  });
}
