// ===== Editor de pistas: el jugador dibuja su propia pista =====
Object.assign(STR.es, {
  myTrack: n => 'Mi pista ' + n,
  themes: { pasto: 'Pasto', desierto: 'Desierto', canon: 'Cañón', pantano: 'Pantano', nieve: 'Nieve' },
  editor: {
    menu: '🛠️ Crear pista',
    tools: ['Puntos', 'Salto', 'Barro', 'Agua', 'Baches', 'Salida', 'Puente', 'Túnel'],
    slot: n => 'Pista ' + n, undo: 'Deshacer', clear: 'Borrar', test: 'Probar', exit: 'Salir',
    hints: [
      'Clic en el pasto = nuevo punto  ·  arrastra los puntos para moverlos  ·  clic derecho = borrar punto',
      'Clic en la pista = poner un salto  ·  clic sobre uno = quitarlo',
      'Clic en la pista = poner barro  ·  clic sobre uno = quitarlo',
      'Clic en la pista = poner agua  ·  clic sobre una = quitarla',
      'Clic en la pista = poner baches  ·  clic sobre ellos = quitarlos',
      'Clic en la pista = mover la línea de salida',
      'Clic en la pista = poner un puente  ·  clic sobre uno = quitarlo  ·  donde la pista se cruza, el puente aparece solo',
      'Clic en la pista = poner un túnel  ·  clic sobre uno = quitarlo'
    ],
    needPoints: n => `Pon ${n} punto${n === 1 ? '' : 's'} más para cerrar la pista`,
    confirmClear: 'Clic otra vez en Borrar para empezar de cero', backToEditor: 'Volver al editor', autoBridge: '🌉 ¡Puente automático en el cruce!'
  }
});
Object.assign(STR.en, {
  myTrack: n => 'My track ' + n,
  themes: { pasto: 'Grass', desierto: 'Desert', canon: 'Canyon', pantano: 'Swamp', nieve: 'Snow' },
  editor: {
    menu: '🛠️ Build a track',
    tools: ['Points', 'Jump', 'Mud', 'Water', 'Bumps', 'Start', 'Bridge', 'Tunnel'],
    slot: n => 'Track ' + n, undo: 'Undo', clear: 'Clear', test: 'Test', exit: 'Exit',
    hints: [
      'Click the grass = new point  ·  drag points to move them  ·  right click = delete point',
      'Click the track = add a jump  ·  click one = remove it',
      'Click the track = add mud  ·  click it = remove it',
      'Click the track = add water  ·  click it = remove it',
      'Click the track = add bumps  ·  click them = remove them',
      'Click the track = move the start line',
      'Click the track = add a bridge  ·  click one = remove it  ·  crossings get a bridge automatically',
      'Click the track = add a tunnel  ·  click one = remove it'
    ],
    needPoints: n => `Add ${n} more point${n === 1 ? '' : 's'} to close the track`,
    confirmClear: 'Click Clear again to start from scratch', backToEditor: 'Back to editor', autoBridge: '🌉 Automatic bridge at the crossing!'
  }
});

const EDITOR_KEY = 'turbobarro4x4.tracks', TRACK_SLOTS = 3, MAX_FEATS = 14;
const THEME_KEYS = ['pasto', 'desierto', 'canon', 'pantano', 'nieve'];
const ED_ICONS = ['✏️', '🚀', '🟫', '💧', '〰️', '🏁', '🌉', '⛰️', '🎨', '📁', '↩️', '🗑️', '▶️', '🚪'];

customTracks = (() => {
  try { const a = JSON.parse(localStorage.getItem(EDITOR_KEY)); return Array.isArray(a) ? a.slice(0, TRACK_SLOTS) : []; }
  catch (e) { return []; }
})();

const isRange = f => f[0] === 'bumps' || f[0] === 'bridge' || f[0] === 'tunnel';

const Editor = {
  slot: 0, def: null, track: null, tool: 0, drag: -1, hover: -1, hoverBtn: -1, undoStack: [], clearArm: 0,

  // pista inicial: un óvalo para que haya algo con qué jugar
  newDef(slot) {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 - Math.PI;
      pts.push([Math.round(512 + Math.cos(a) * 330), Math.round(345 + Math.sin(a) * 200)]);
    }
    return { slot, theme: THEME_KEYS[slot % THEME_KEYS.length], width: 76, start: 0.5, seed: 101 + slot * 7, pts, feats: [['jump', 2.5], ['mud', 6.5, 0, 28]] };
  },

  open(slot) {
    this.slot = slot;
    const saved = customTracks[slot];
    this.def = saved ? JSON.parse(JSON.stringify(saved)) : this.newDef(slot);
    this.def.slot = slot;
    this.undoStack = []; this.tool = 0; this.drag = -1; this.hover = -1;
    this.ready = false;
    this.rebuild();
    this.ready = true;
    if (!saved) this.save();
    this.resume();
  },
  resume() { Game.scene = 'editor'; Game.menu = null; Sound.stopEngines(); Sound.play('menu'); },
  exit() { this.save(); Game.toTitle(); },

  rebuild() {
    const before = this.track ? this.track.autoBridges : 0;
    this.track = this.def.pts.length >= 4 ? buildTrack(this.def) : null;
    if (this.ready && this.track && this.track.autoBridges > before) { Game.showToast(L().editor.autoBridge); Sound.sfx.buy(); }
  },
  save() {
    const old = customTracks[this.slot];
    if (old) trackCache.delete(old);
    customTracks[this.slot] = JSON.parse(JSON.stringify(this.def));
    try { localStorage.setItem(EDITOR_KEY, JSON.stringify(customTracks)); } catch (e) { /* sin guardado */ }
  },
  snapshot() {
    this.undoStack.push(JSON.stringify(this.def));
    if (this.undoStack.length > 40) this.undoStack.shift();
  },
  change(fn) { this.snapshot(); fn(); this.rebuild(); this.save(); },
  undo() {
    if (!this.undoStack.length) { Sound.sfx.nope(); return; }
    this.def = JSON.parse(this.undoStack.pop());
    this.rebuild(); this.save(); Sound.sfx.select();
  },

  clampPt(x, y) { return [Math.round(clamp(x, 55, W - 55)), Math.round(clamp(y, HUD_H + 50, H - 50))]; },
  pointAt(x, y) { return this.def.pts.findIndex(p => Math.hypot(p[0] - x, p[1] - y) < 14); },

  // Insertar un punto parte un tramo en dos: las cosas puestas en la pista se corren para quedar en su lugar
  insertPoint(x, y) {
    const P = this.def.pts, n = P.length, np = this.clampPt(x, y);
    if (n < 3) { P.push(np); return; }
    let best = 0, bd = Infinity;
    for (let i = 0; i < n; i++) {
      const [ax, ay] = P[i], [bx, by] = P[(i + 1) % n], dx = bx - ax, dy = by - ay;
      const u = clamp(((np[0] - ax) * dx + (np[1] - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      const d = Math.hypot(ax + dx * u - np[0], ay + dy * u - np[1]);
      if (d < bd) { bd = d; best = i; }
    }
    const remap = a => (a >= best + 1 ? a + 1 : a >= best ? best + 2 * (a - best) : a);
    P.splice(best + 1, 0, np);
    this.def.start = remap(this.def.start);
    this.def.feats.forEach(f => { f[1] = remap(f[1]); if (isRange(f)) f[2] = remap(f[2]); });
  },

  // Borrar un punto junta dos tramos: lo que estaba en ellos se quita
  removePoint(k) {
    const P = this.def.pts, n = P.length, prev = (k - 1 + n) % n;
    const remap = a => { const s = Math.floor(a); return s === k || s === prev ? null : (s > k ? a - 1 : a); };
    P.splice(k, 1);
    const st = remap(this.def.start);
    this.def.start = st === null ? (k === 0 ? Math.max(0, n - 2) : prev) + 0.5 : st;
    this.def.feats = this.def.feats.filter(f => {
      const a = remap(f[1]), b = isRange(f) ? remap(f[2]) : 0;
      if (a === null || b === null) return false;
      f[1] = a; if (isRange(f)) f[2] = b;
      return true;
    });
  },

  nearestOnTrack(x, y) {
    const t = this.track;
    let best = 0, bd = Infinity;
    t.pts.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } });
    const p = t.pts[best];
    return { i: best, d: Math.sqrt(bd), off: (x - p.x) * p.nx + (y - p.y) * p.ny, s: Math.round(p.s * 1000) / 1000 };
  },

  featureAt(x, y) {
    const t = this.track, hit = this.nearestOnTrack(x, y), onTrack = hit.d < t.hw + 6;
    const dist = (a, b) => Math.min(wrap(t, a - b), wrap(t, b - a));
    return this.def.feats.findIndex(f => {
      if (f[0] === 'jump') return onTrack && dist(t.idxOf(f[1]), hit.i) <= 3;
      if (isRange(f)) return onTrack && inRange(t, hit.i, t.idxOf(f[1]), t.idxOf(f[2]));
      const p = t.pts[t.idxOf(f[1])];
      return Math.hypot(p.x + p.nx * f[2] * t.hw - x, p.y + p.ny * f[2] * t.hw - y) < f[3] + 4;
    });
  },

  button(i) {
    const now = performance.now() / 1000;
    if (i <= 7) { this.tool = i; Sound.sfx.select(); return; }
    if (i === 8) { this.change(() => { this.def.theme = THEME_KEYS[cycle(THEME_KEYS.indexOf(this.def.theme), 1, THEME_KEYS.length)]; }); Sound.sfx.select(); }
    else if (i === 9) { this.save(); this.open((this.slot + 1) % TRACK_SLOTS); Sound.sfx.select(); }
    else if (i === 10) this.undo();
    else if (i === 11) {
      if (now < this.clearArm) { this.change(() => { this.def.pts = []; this.def.feats = []; this.def.start = 0.5; }); this.clearArm = 0; this.tool = 0; }
      else { this.clearArm = now + 2.5; Game.showToast(L().editor.confirmClear); }
    } else if (i === 12) {
      if (!this.track) { Sound.sfx.nope(); Game.showToast(L().editor.needPoints(4 - this.def.pts.length)); return; }
      this.save(); Game.testTrack(customTracks[this.slot]);
    } else if (i === 13) this.exit();
  },

  pointer(type, x, y, button) {
    if (type === 'move') {
      this.hoverBtn = y < HUD_H ? Math.floor(x / (W / 14)) : -1;
      if (this.drag >= 0) { this.def.pts[this.drag] = this.clampPt(x, y); this.rebuild(); }
      else this.hover = this.tool === 0 ? this.pointAt(x, y) : -1;
      return;
    }
    if (type === 'up') { if (this.drag >= 0) { this.drag = -1; this.save(); } return; }
    if (y < HUD_H) { if (button === 0) this.button(Math.floor(x / (W / 14))); return; }
    if (this.tool === 0) {
      const hit = this.pointAt(x, y);
      if (button === 2) { if (hit >= 0) { this.change(() => this.removePoint(hit)); this.hover = -1; Sound.sfx.select(); } return; }
      if (hit >= 0) { this.snapshot(); this.drag = hit; return; }
      if (button !== 0 || this.def.pts.some(p => Math.hypot(p[0] - x, p[1] - y) < 30)) return;
      this.change(() => this.insertPoint(x, y)); Sound.sfx.select();
      return;
    }
    if (!this.track) return;
    const t = this.track, hit = this.nearestOnTrack(x, y);
    if (hit.d > t.hw + 8) return;
    if (this.tool === 5) { this.change(() => { this.def.start = hit.s; }); Sound.sfx.select(); return; }
    const fi = this.featureAt(x, y);
    if (fi >= 0) { this.change(() => this.def.feats.splice(fi, 1)); Sound.sfx.select(); return; }
    if (button !== 0 || this.def.feats.length >= MAX_FEATS) return;
    const off = Math.round(clamp(hit.off / t.hw, -0.5, 0.5) * 100) / 100;
    const sAt = d => Math.round(t.pts[wrap(t, hit.i + d)].s * 1000) / 1000;
    const f = { 1: ['jump', hit.s], 2: ['mud', hit.s, off, 28], 3: ['water', hit.s, off, 26], 4: ['bumps', hit.s, sAt(18)],
                6: ['bridge', sAt(-22), sAt(22)], 7: ['tunnel', sAt(-15), sAt(15)] }[this.tool];
    this.change(() => this.def.feats.push(f)); Sound.sfx.buy();
  },

  // Teclas propias del editor; devuelve true si la usó
  key(e) {
    if (e.code === 'Escape') { this.exit(); return true; }
    if (e.code === 'KeyZ') { this.undo(); return true; }
    if ((e.code === 'Backspace' || e.code === 'Delete') && this.tool === 0 && this.hover >= 0) {
      const k = this.hover; this.change(() => this.removePoint(k)); this.hover = -1; return true;
    }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 8 && !e.repeat) { this.tool = n - 1; Sound.sfx.select(); return true; }
    return false;
  },

  draw(g) {
    const th = THEMES[this.def.theme], t = this.track, P = this.def.pts, E = L().editor;
    g.fillStyle = th.ground; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(0,0,0,0.07)'; g.lineWidth = 1; g.beginPath();
    for (let x = 0; x <= W; x += 32) { g.moveTo(x, 0); g.lineTo(x, H); }
    for (let y = 0; y <= H; y += 32) { g.moveTo(0, y); g.lineTo(W, y); }
    g.stroke();
    if (t) {
      const ground = t.bridges.length ? i => !t.bridgeAt[i] : null, path = trackPath(t, 0, ground);
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.strokeStyle = th.wall; g.lineWidth = t.def.width + 16; g.stroke(path);
      g.setLineDash([9, 9]); g.strokeStyle = th.wall2; g.stroke(path); g.setLineDash([]);
      g.strokeStyle = th.dirt; g.lineWidth = t.def.width; g.stroke(path);
      const rnd = mulberry32(5);
      for (const pd of t.puddles) drawPuddle(g, pd, rnd);
      for (const b of t.bumps) { const cnt = wrap(t, b.i1 - b.i0); for (let s = 0; s <= cnt; s += 3) drawBumpRow(g, t, wrap(t, b.i0 + s), s / 3); }
      for (const j of t.jumps) drawJump(g, t, j);
      drawStartLine(g, t);
      if (t.bridges.length) drawBridges(g, t);
      if (t.tunnels.length) { g.globalAlpha = 0.8; drawTunnels(g, t); g.globalAlpha = 1; }
      g.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 14; i < t.N; i += 30) {
        const p = t.pts[i];
        g.save(); g.translate(p.x, p.y); g.rotate(Math.atan2(p.ty, p.tx)); tri(g, -6, -6, -6, 6, 7, 0); g.fill(); g.restore();
      }
    } else if (P.length) {
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 4; g.setLineDash([10, 8]);
      g.beginPath(); P.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.setLineDash([]);
    }
    // puntos de control numerados
    g.globalAlpha = this.tool === 0 ? 1 : 0.45;
    P.forEach(([x, y], i) => {
      const on = i === this.hover || i === this.drag;
      g.fillStyle = on ? '#ffd23f' : '#fff'; ellipse(g, x, y, 11, 11);
      g.lineWidth = 3; g.strokeStyle = '#2a1405'; g.beginPath(); g.arc(x, y, 11, 0, Math.PI * 2); g.stroke();
      g.font = font(11); g.fillStyle = '#2a1405'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i + 1, x, y + 1);
    });
    g.globalAlpha = 1;
    if (P.length < 4) bigText(g, E.needPoints(4 - P.length), W / 2, H / 2, 26, '#fff');

    // barra de herramientas
    g.fillStyle = 'rgba(15,10,5,0.92)'; g.fillRect(0, 0, W, HUD_H);
    const labels = [...E.tools, L().themes[this.def.theme], E.slot(this.slot + 1), E.undo, E.clear, E.test, E.exit], bw = W / 14;
    labels.forEach((lab, i) => {
      const x = i * bw, on = i === this.tool;
      g.fillStyle = on ? '#ffd23f' : i === 12 ? '#2fa84a' : i === this.hoverBtn ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.07)';
      roundRect(g, x + 3, 4, bw - 6, HUD_H - 8, 8); g.fill();
      g.textAlign = 'center'; g.textBaseline = 'middle';
      // los emojis toman la transparencia del color de relleno: van con color opaco
      g.fillStyle = '#fff';
      g.font = '15px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'; g.fillText(ED_ICONS[i], x + bw / 2, 16);
      g.font = font(10, 800); g.fillStyle = on ? '#3a1d00' : '#fff'; g.fillText(lab, x + bw / 2, 35);
    });
    g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(8 * bw - 1, 8, 2, HUD_H - 16);
    // ayuda de la herramienta elegida
    const hint = E.hints[this.tool];
    g.font = font(13, 700);
    const hw = g.measureText(hint).width / 2 + 16;
    g.fillStyle = 'rgba(0,0,0,0.6)'; roundRect(g, W / 2 - hw, H - 34, hw * 2, 26, 13); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(hint, W / 2, H - 21);
  }
};
