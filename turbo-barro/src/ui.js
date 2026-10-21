// ===== Juego: menús, opciones, tienda, resultados y campeonato =====
const DIFFS = [
  { skill: 0.8, rbMin: 0.78, rbMax: 1.04, aiUp: 0.35 },
  { skill: 0.9, rbMin: 0.86, rbMax: 1.08, aiUp: 0.6 },
  { skill: 1.0, rbMin: 0.94, rbMax: 1.12, aiUp: 0.85 }
];
const SHOP = [
  { key: 'motor', icon: '🔥' },
  { key: 'acel', icon: '⚡' },
  { key: 'llantas', icon: '🛞' },
  { key: 'amort', icon: '🦘' },
  { key: 'nitro', icon: '🚀' }
];
const MAX_UPG = 5, NITRO_COST = 15, NAME_MAX = 10;
const SAVE_KEY = 'turbobarro4x4', PREFS_KEY = 'turbobarro4x4.prefs';
const upgCost = lvl => 60 + lvl * 45;
// Dentro del sitio de juegos se muestra "Más juegos"; en la copia descargada no
const IN_SITE = /\/turbo-barro\/(index\.html)?$/.test(location.pathname);
const LANG_CHIP = { x: W - 118, y: 10, w: 106, h: 32 };
const inRect = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

function button(g, x, y, w, h, text, on) {
  g.fillStyle = on ? '#ffd23f' : 'rgba(20,12,5,0.8)';
  roundRect(g, x, y, w, h, 12); g.fill();
  g.lineWidth = 3; g.strokeStyle = on ? '#fff3b0' : 'rgba(255,255,255,0.25)'; g.stroke();
  g.font = font(Math.min(22, h * 0.42)); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = on ? '#3a1d00' : '#fff'; g.fillText(text, x + w / 2, y + h / 2 + 1);
  if (on) {
    const b = Math.sin(performance.now() / 120) * 3, cy = y + h / 2;
    tri(g, x + 16 + b, cy - 8, x + 16 + b, cy + 8, x + 28 + b, cy); g.fill();
  }
}

// Las zonas clickeables (rects) pueden apuntar a una fila (item), a sus flechas (side) o a un valor (value)
class Menu {
  constructor(items) { this.items = items; this.sel = 0; this.rects = []; }
  label(it) { return typeof it.label === 'function' ? it.label() : it.label; }
  press(a) {
    const n = this.items.length, it = this.items[this.sel];
    if (a === 'up') { this.sel = (this.sel + n - 1) % n; Sound.sfx.select(); }
    else if (a === 'down') { this.sel = (this.sel + 1) % n; Sound.sfx.select(); }
    else if (a === 'left' && it.left) { it.left(); Sound.sfx.select(); }
    else if (a === 'right' && it.right) { it.right(); Sound.sfx.select(); }
    else if (a === 'ok') it.action();
  }
  hit(x, y) {
    const r = this.rects.find(q => inRect(q, x, y));
    return r ? { r, i: r.item ?? this.rects.indexOf(r) } : null;
  }
  click(x, y) {
    const h = this.hit(x, y);
    if (!h) return;
    const it = this.items[h.i];
    this.sel = h.i;
    if (h.r.side) { it[h.r.side](); Sound.sfx.select(); }
    else if (h.r.value !== undefined) { it.set(h.r.value); Sound.sfx.select(); }
    else it.action();
  }
  hover(x, y) {
    const h = this.hit(x, y);
    if (h && h.i !== this.sel) { this.sel = h.i; Sound.sfx.select(); }
  }
  draw(g, x, y, w, h, gap) {
    this.rects = this.items.map((it, i) => ({ x, y: y + i * (h + gap), w, h }));
    this.items.forEach((it, i) => {
      const r = this.rects[i];
      button(g, r.x, r.y, r.w, r.h, this.label(it), i === this.sel);
    });
  }
}

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
}
function loadSave() {
  const s = readJSON(SAVE_KEY);
  return s && s.v === 1 && s.racers ? s : null;
}
const PREFS = readJSON(PREFS_KEY) || {};

const Game = {
  scene: 'title', sub: 'main', players: 1,
  diff: PREFS.diff || 0, autoGas: !!PREFS.autoGas, announcer: PREFS.announcer !== false,
  names: Array.isArray(PREFS.names) ? PREFS.names : ['', ''],
  garage: Array.isArray(PREFS.garage) ? PREFS.garage : [defaultGarage(0), defaultGarage(1)],
  racers: [], trackIndex: 0, raceNum: 0, lastOrder: null,
  race: null, demo: null, menu: null, results: null, shopTurn: 0, garageCtx: null, testing: null,
  t: 0, lock: 0, toast: null, editing: null, editBtn: null,

  press(a) {
    if (this.editing) {
      if (a === 'ok') this.endEdit(true);
      else if (a === 'pause' || a === 'back') this.endEdit(false);
      return;
    }
    if (this.lock > 0) return;
    if (this.scene === 'editor') { if (a === 'pause' || a === 'back') Editor.exit(); return; }
    if (this.scene === 'race') {
      if (a === 'pause' || a === 'back') this.togglePause();
      else if (this.race.paused) this.menu.press(a);
      return;
    }
    if (a === 'pause' || a === 'back') {
      if (this.scene === 'title' && this.sub === 'options') this.mainMenu();
      else if (this.scene === 'garage') this.closeGarage();
      return;
    }
    if (this.menu) this.menu.press(a);
  },
  menuActive() { return this.scene !== 'race' || (this.race && this.race.paused); },
  pointer(type, x, y, button) {
    if (this.scene === 'editor' && !this.editing) { Editor.pointer(type, x, y, button); return; }
    if (type === 'down' && button === 0) this.click(x, y);
    else if (type === 'move') this.hover(x, y);
  },
  click(x, y) {
    if (this.editing) {
      if (this.editBtn && inRect(this.editBtn, x, y)) this.endEdit(true);
      return;
    }
    if (this.lock > 0) return;
    if (this.scene === 'title' && inRect(LANG_CHIP, x, y)) { this.toggleLang(); return; }
    if (this.menuActive() && this.menu) this.menu.click(x, y);
  },
  hover(x, y) { if (!this.editing && this.menuActive() && this.menu) this.menu.hover(x, y); },
  showToast(text) { this.toast = { text, t: 1.8 }; },
  toggleLang() { setLang(LANG === 'es' ? 'en' : 'es'); Sound.sfx.select(); },

  savePrefs() {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({
        diff: this.diff, autoGas: this.autoGas, announcer: this.announcer, names: this.names, garage: this.garage
      }));
    } catch (e) { /* sin guardado: se juega igual */ }
  },

  toTitle() {
    this.scene = 'title'; this.race = null; this.testing = null;
    Announcer.stop();
    const demoRacers = PAINTS.slice(0, 4).map((p, i) => ({
      id: i, name: '', color: p.c, dark: p.d, model: MODEL_KEYS[i], human: false, player: -1, nitros: 2,
      skill: 0.9 + Math.random() * 0.1, upg: { motor: 2, acel: 2, llantas: 2, amort: 2 }
    }));
    this.demo = new Race(Math.floor(Math.random() * TRACK_DEFS.length), demoRacers, true);
    Sound.stopEngines(); Sound.play('menu');
    this.mainMenu();
  },

  mainMenu() {
    this.sub = 'main';
    const saved = loadSave(), items = [];
    if (saved) items.push({ label: () => L().menu.continue, action: () => this.continueSave(saved) });
    items.push({ label: () => L().menu.p1, action: () => this.newSeason(1) });
    items.push({ label: () => L().menu.p2, action: () => this.newSeason(2) });
    items.push({ label: () => L().garageMenu, action: () => this.openGarage(0, 'title') });
    items.push({ label: () => L().editor.menu, action: () => Editor.open(0) });
    items.push({ label: () => '⚙️ ' + L().menu.options, action: () => { this.optionsMenu(); Sound.sfx.select(); } });
    if (IN_SITE) items.push({ label: () => L().menu.more, action: () => { location.href = '../index.html'; } });
    this.menu = new Menu(items);
  },

  optionsMenu() {
    this.sub = 'options';
    const O = () => L().opt, yn = v => (v ? O().yes : O().no);
    const cd = d => { this.diff = (this.diff + d + 3) % 3; this.savePrefs(); };
    const ag = () => { this.autoGas = !this.autoGas; this.savePrefs(); };
    const an = () => { this.announcer = !this.announcer; this.savePrefs(); if (!this.announcer) Announcer.stop(); };
    const tl = () => this.toggleLang();
    this.menu = new Menu([
      { label: () => O().diff + ': ' + L().diffs[this.diff], action: () => { cd(1); Sound.sfx.select(); }, left: () => cd(-1), right: () => cd(1) },
      { label: () => O().auto + ': ' + yn(this.autoGas), action: () => { ag(); Sound.sfx.select(); }, left: ag, right: ag },
      { label: () => L().menu.lang, action: tl, left: tl, right: tl },
      { label: () => '📣 ' + O().ann + ': ' + yn(this.announcer), action: () => { an(); Sound.sfx.select(); }, left: an, right: an },
      { label: () => '✏️ ' + O().name1 + ': ' + (this.names[0] || L().you), action: () => this.editName(0) },
      { label: () => '✏️ ' + O().name2 + ': ' + (this.names[1] || L().player(2)), action: () => this.editName(1) },
      { label: () => L().menu.back, action: () => { this.mainMenu(); Sound.sfx.select(); } }
    ]);
  },

  editName(p) {
    this.editing = { player: p, text: this.names[p] || '' };
    Sound.sfx.select();
  },
  editKey(e) {
    const ed = this.editing;
    if (e.key === 'Enter') return this.endEdit(true);
    if (e.key === 'Escape') return this.endEdit(false);
    if (e.key === 'Backspace') { ed.text = ed.text.slice(0, -1); return; }
    if (e.key.length === 1 && /[\p{L}\p{N} .\-]/u.test(e.key) && ed.text.length < NAME_MAX && !(e.key === ' ' && !ed.text)) {
      ed.text += e.key; Sound.sfx.select();
    }
  },
  endEdit(ok) {
    if (ok) { this.names[this.editing.player] = this.editing.text.trim(); this.savePrefs(); Sound.sfx.buy(); }
    this.editing = null; this.lock = 0.15;
  },

  openGarage(player, ret) {
    this.garageCtx = { player, ret, view: MODEL_KEYS.indexOf(this.garage[player].model) };
    this.scene = 'garage'; this.lock = 0.2;
    this.menu = garageMenu();
    Sound.sfx.select();
  },
  closeGarage() {
    if (this.garageCtx.ret === 'shop') { this.openShop(this.garageCtx.player); this.menu.sel = 5; }
    else { this.scene = 'title'; this.mainMenu(); this.menu.sel = this.menu.items.findIndex(it => it.label() === L().garageMenu); }
  },

  makeRacers(players) {
    return PAINTS.slice(0, 4).map((p, i) => {
      const human = i < players;
      return {
        id: i, color: p.c, dark: p.d, human, player: human ? i : -1, ai: human ? undefined : i - players,
        name: human ? '' : STR.es.ai[i - players],
        upg: { motor: 0, acel: 0, llantas: 0, amort: 0 }, nitros: human ? 3 : 2, money: 0, points: 0, skill: 1
      };
    });
  },

  // Los humanos usan lo que eligieron en el taller; los rivales toman colores que nadie usa
  applyLooks(racers) {
    const used = [];
    for (const r of racers) if (r.human) {
      const gp = this.garage[r.player], p = PAINTS[gp.color];
      Object.assign(r, { color: p.c, dark: p.d, model: gp.model, decal: gp.decal, horn: gp.horn });
      used.push(gp.color);
    }
    const free = [2, 3, 4, 5, 7, 6, 0, 1, 8, 9].filter(i => !used.includes(i));
    let k = 0;
    for (const r of racers) if (!r.human) {
      const p = PAINTS[free[k++]];
      Object.assign(r, { color: p.c, dark: p.d, model: 'pickup', decal: 0, horn: r.id % HORN_COUNT });
    }
  },

  newSeason(players) {
    this.players = players; this.trackIndex = 0; this.raceNum = 0; this.lastOrder = null;
    this.racers = this.makeRacers(players);
    this.startRace();
  },

  startRace() {
    const D = DIFFS[this.diff];
    for (const r of this.racers) if (!r.human) { r.skill = D.skill + Math.min(0.1, this.raceNum * 0.012); r.nitros = 2; }
    this.applyLooks(this.racers);
    // el que llegó último sale adelante
    const grid = this.lastOrder ? [...this.lastOrder].reverse() : [...this.racers].sort((a, b) => b.human - a.human);
    this.race = new Race(this.trackIndex, grid);
    this.scene = 'race'; this.demo = null; this.menu = null;
    Sound.play('race');
  },

  // Carrera de prueba en una pista del editor: no da dinero ni puntos
  testTrack(def) {
    this.testing = def; this.players = 1;
    const racers = this.makeRacers(1);
    this.applyLooks(racers);
    for (const r of racers) if (!r.human) r.skill = DIFFS[this.diff].skill;
    this.race = new Race(def, racers);
    this.scene = 'race'; this.menu = null;
    Sound.play('race');
  },
  endTest() {
    this.testing = null; this.race = null;
    Announcer.stop();
    Editor.resume();
  },

  togglePause() {
    const r = this.race;
    if (!r) return;
    r.paused = !r.paused;
    if (!r.paused) { this.menu = null; return; }
    const items = [{ label: () => L().resume, action: () => this.togglePause() }];
    if (this.testing) {
      items.push({ label: () => L().restart, action: () => this.testTrack(this.testing) });
      items.push({ label: () => L().editor.backToEditor, action: () => this.endTest() });
    } else {
      items.push({ label: () => L().restart, action: () => this.startRace() });
      items.push({ label: () => L().quit, action: () => { this.save(); this.toTitle(); } });
    }
    this.menu = new Menu(items);
  },
  autoPause() {
    if (this.scene === 'race' && this.race && !this.race.paused) this.togglePause();
  },

  raceOver(race) {
    if (this.testing) { this.endTest(); return; }
    const rows = race.order.map((tr, i) => {
      const r = tr.r;
      r.money += PRIZES[i] + tr.earned; r.points += POINTS[i];
      if (r.human) r.nitros = tr.nitros;
      const earned = tr.earned;
      tr.earned = 0; // ya está sumado al dinero; así el marcador de fondo no lo cuenta dos veces
      return { r, place: i + 1, prize: PRIZES[i], earned, pts: POINTS[i] };
    });
    this.lastOrder = race.order.map(tr => tr.r);
    const D = DIFFS[this.diff];
    for (const r of this.racers) {
      if (r.human || Math.random() > D.aiUp) continue;
      const k = SHOP[Math.floor(Math.random() * 4)].key;
      if (r.upg[k] < MAX_UPG) r.upg[k]++;
    }
    this.raceNum++;
    const best = rows.find(x => x.r.human);
    this.results = { rows, trackIndex: race.trackIndex, best: best ? best.place : 4 };
    this.trackIndex = (this.trackIndex + 1) % trackList().length;
    this.scene = 'results'; this.lock = 1.2;
    Sound.play('menu');
    this.menu = new Menu([{ label: () => L().next, action: () => this.openShop(0) }]);
    this.save();
  },

  openShop(turn) {
    if (turn >= this.players) return this.startRace();
    this.shopTurn = turn; this.scene = 'shop'; this.lock = 0.3;
    this.applyLooks(this.racers);
    const r = this.racers.find(x => x.player === turn);
    const items = SHOP.map(s => ({ action: () => this.buy(r, s) }));
    items.push({ label: () => L().garageMenu, action: () => this.openGarage(turn, 'shop') });
    items.push({ label: () => (turn + 1 < this.players ? L().ready2 : L().race), action: () => this.openShop(turn + 1) });
    this.menu = new Menu(items);
  },

  buy(r, s) {
    if (s.key === 'nitro') {
      if (r.money >= NITRO_COST && r.nitros < 9) { r.money -= NITRO_COST; r.nitros++; Sound.sfx.buy(); }
      else Sound.sfx.nope();
    } else {
      const lvl = r.upg[s.key], c = upgCost(lvl);
      if (lvl < MAX_UPG && r.money >= c) { r.money -= c; r.upg[s.key]++; Sound.sfx.buy(); }
      else Sound.sfx.nope();
    }
    this.save();
  },

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1, players: this.players, diff: this.diff, autoGas: this.autoGas,
        trackIndex: this.trackIndex, raceNum: this.raceNum, racers: this.racers,
        lastOrder: this.lastOrder ? this.lastOrder.map(r => r.id) : null
      }));
    } catch (e) { /* sin guardado: se juega igual */ }
  },

  continueSave(s) {
    Object.assign(this, { players: s.players, diff: s.diff, autoGas: s.autoGas, trackIndex: s.trackIndex, raceNum: s.raceNum, racers: s.racers });
    this.lastOrder = s.lastOrder ? s.lastOrder.map(id => this.racers[id]) : null;
    this.openShop(0);
  }
};

// ===== Pantallas =====
function drawTitle(g) {
  Game.demo.draw(g);
  g.fillStyle = 'rgba(10,6,2,0.5)'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, 96); g.rotate(-0.04 + Math.sin(Game.t * 2) * 0.015);
  const grd = g.createLinearGradient(0, -40, 0, 40);
  grd.addColorStop(0, '#fff27a'); grd.addColorStop(1, '#ff8a00');
  bigText(g, L().title, 0, 0, 86, grd);
  const bx = g.measureText(L().title).width / 2 - 125;
  g.rotate(0.12);
  g.fillStyle = '#d8342b'; roundRect(g, bx, 28, 110, 50, 10); g.fill();
  g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke();
  bigText(g, '4x4', bx + 55, 54, 36, '#fff', '#5a0d08');
  g.restore();
  // botón de idioma en la esquina
  const c = LANG_CHIP;
  g.fillStyle = 'rgba(0,0,0,0.6)'; roundRect(g, c.x, c.y, c.w, c.h, 16); g.fill();
  g.font = font(14); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('🌐 ' + (LANG === 'es' ? 'ES → EN' : 'EN → ES'), c.x + c.w / 2, c.y + c.h / 2 + 1);
  if (Game.sub === 'options') {
    Game.menu.draw(g, W / 2 - 190, 186, 380, 46, 10);
  } else {
    Game.menu.draw(g, W / 2 - 170, 186, 340, 42, 8);
    g.fillStyle = 'rgba(0,0,0,0.7)'; roundRect(g, 62, 546, 900, 82, 12); g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font(14, 700);
    const help = L().help;
    g.fillStyle = '#fff'; g.fillText(help[0], W / 2, 565); g.fillText(help[1], W / 2, 587);
    g.fillStyle = '#ffd23f'; g.fillText(help[2], W / 2, 609);
  }
  if (Game.editing) drawNameEditor(g);
}

function drawNameEditor(g) {
  const ed = Game.editing, cx = W / 2, gp = Game.garage[ed.player], p = PAINTS[gp.color];
  g.fillStyle = 'rgba(0,0,0,0.75)'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2a1a0c'; roundRect(g, cx - 270, 160, 540, 300, 20); g.fill();
  g.lineWidth = 5; g.strokeStyle = p.c; g.stroke();
  g.save(); g.translate(cx - 205, 213); g.scale(2, 2); drawTruck(g, { model: gp.model, color: p.c, dark: p.d, decal: gp.decal }); g.restore();
  bigText(g, L().nameTitle(ed.player + 1), cx + 30, 213, 30, '#ffd23f');
  g.fillStyle = '#fff'; roundRect(g, cx - 210, 250, 420, 66, 12); g.fill();
  g.font = font(32); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2a1405';
  g.fillText(ed.text, cx, 284);
  if (Math.floor(Game.t * 2.5) % 2 === 0) g.fillRect(cx + g.measureText(ed.text).width / 2 + 4, 263, 4, 40);
  g.font = font(13, 700); g.fillStyle = '#ddd';
  g.fillText(L().nameHelp, cx, 342);
  Game.editBtn = { x: cx - 110, y: 372, w: 220, h: 56 };
  button(g, Game.editBtn.x, Game.editBtn.y, Game.editBtn.w, Game.editBtn.h, L().nameOk, true);
}

function drawResults(g) {
  Game.race.draw(g);
  g.fillStyle = 'rgba(10,6,2,0.78)'; g.fillRect(0, 0, W, H);
  const R = Game.results;
  bigText(g, L().results, W / 2, 60, 46, '#ffd23f');
  g.font = font(17, 700); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(trackName(R.trackIndex), W / 2, 100);
  const x0 = 120, w = W - 240, rh = 62, colX = [560, 660, 770, 860];
  g.font = font(13, 700); g.fillStyle = '#bbb';
  L().cols.forEach((txt, i) => g.fillText(txt, colX[i], 132));
  const medal = ['#e8b400', '#b8b8b8', '#c07a3a', '#666'];
  R.rows.forEach((row, i) => {
    const y = 148 + i * (rh + 8), r = row.r, cy = y + rh / 2;
    g.fillStyle = r.human ? 'rgba(255,210,63,0.2)' : 'rgba(255,255,255,0.07)';
    roundRect(g, x0, y, w, rh, 10); g.fill();
    g.fillStyle = medal[i]; ellipse(g, x0 + 36, cy, 22, 22);
    bigText(g, String(row.place), x0 + 36, cy + 1, 24, '#fff');
    g.save(); g.translate(x0 + 100, cy); g.scale(1.6, 1.6); drawTruck(g, r); g.restore();
    g.textAlign = 'left'; g.font = font(22); g.fillStyle = '#fff'; g.fillText(racerName(r), x0 + 140, cy);
    g.textAlign = 'center'; g.font = font(18, 700);
    g.fillStyle = '#7dff7a'; g.fillText('+$' + row.prize, colX[0], cy);
    g.fillStyle = '#ffe04a'; g.fillText(row.earned ? '+$' + row.earned : '—', colX[1], cy);
    g.fillStyle = '#8ff'; g.fillText(`${r.points} (+${row.pts})`, colX[2], cy);
    g.fillStyle = '#fff'; g.fillText(r.human ? '$' + r.money : '', colX[3], cy);
  });
  bigText(g, L().msgs[R.best - 1], W / 2, 470, 26, '#fff');
  Game.menu.draw(g, W / 2 - 160, 540, 320, 54, 0);
}

function drawShop(g) {
  workshopBg(g);
  const r = Game.racers.find(x => x.player === Game.shopTurn), M = Game.menu;
  bigText(g, L().shop, 200, 62, 44, '#ffd23f');
  g.font = font(20); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = r.color;
  g.fillText(Game.names[r.player] || (Game.players === 1 ? L().yourTruck : L().player(r.player + 1)), 200, 102);
  bigText(g, '$' + r.money, 200, 146, 42, '#7dff7a');
  g.fillStyle = 'rgba(0,0,0,0.35)'; ellipse(g, 204, 262, 88, 88);
  g.fillStyle = '#5a4030'; ellipse(g, 200, 256, 85, 85);
  g.strokeStyle = '#ffc61a'; g.lineWidth = 4; g.setLineDash([14, 10]); g.beginPath(); g.arc(200, 256, 78, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  g.save(); g.translate(200, 256); g.rotate(Game.t * 0.8); g.scale(3.8, 3.8); drawTruck(g, r); g.restore();

  const x = 400, w = 590, h = 78, gap = 10, y0 = 34;
  M.rects = [];
  // botón del taller bajo la camioneta
  M.rects[5] = { x: 70, y: 362, w: 260, h: 48 };
  button(g, 70, 362, 260, 48, M.label(M.items[5]), M.sel === 5);
  const nt = getTrack(Game.trackIndex);
  g.font = font(14, 700); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(L().nextTrack + trackName(Game.trackIndex), 200, 440);
  g.fillStyle = '#000'; g.fillRect(77, 457, 246, 156);
  g.drawImage(nt.canvas, 80, 460, 240, 150);
  if (nt.over) g.drawImage(nt.over, 80, 460, 240, 150);
  if (nt.cover) g.drawImage(nt.cover, 80, 460, 240, 150);

  SHOP.forEach((s, i) => {
    const y = y0 + i * (h + gap), on = M.sel === i, [name, desc] = L().shopItems[i];
    M.rects[i] = { x, y, w, h };
    g.fillStyle = on ? 'rgba(255,210,63,0.22)' : 'rgba(0,0,0,0.45)'; roundRect(g, x, y, w, h, 12); g.fill();
    g.lineWidth = 3; g.strokeStyle = on ? '#ffd23f' : 'rgba(255,255,255,0.12)'; g.stroke();
    g.font = '34px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.fillText(s.icon, x + 40, y + h / 2);
    g.textAlign = 'left'; g.font = font(20); g.fillText(name, x + 80, y + 22);
    g.font = font(13, 600); g.fillStyle = '#ccc'; g.fillText(desc, x + 80, y + 44);
    let cost, can;
    if (s.key === 'nitro') {
      g.font = font(14); g.fillStyle = '#8ff'; g.fillText(L().have + r.nitros, x + 80, y + 64);
      cost = NITRO_COST; can = r.money >= cost && r.nitros < 9;
    } else {
      const lvl = r.upg[s.key];
      for (let k = 0; k < MAX_UPG; k++) {
        g.fillStyle = k < lvl ? '#7dff7a' : 'rgba(255,255,255,0.15)';
        roundRect(g, x + 80 + k * 30, y + 58, 26, 10, 3); g.fill();
      }
      cost = lvl < MAX_UPG ? upgCost(lvl) : 0; can = lvl < MAX_UPG && r.money >= cost;
    }
    const bx = x + w - 130, by = y + 18;
    g.fillStyle = cost === 0 ? '#555' : can ? '#2fa84a' : '#6b3a2a'; roundRect(g, bx, by, 112, 42, 10); g.fill();
    g.textAlign = 'center'; g.font = font(20); g.fillStyle = can || cost === 0 ? '#fff' : '#d9a89a';
    g.fillText(cost === 0 ? L().max : '$' + cost, bx + 56, by + 22);
  });
  const by = y0 + 5 * (h + gap) + 6;
  M.rects[6] = { x, y: by, w, h: 64 };
  button(g, x, by, w, 64, M.label(M.items[6]), M.sel === 6);
  g.font = font(13, 700); g.fillStyle = '#bbb'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(L().shopHelp, x + w / 2, 575);
  g.fillText(L().shopInfo(Game.raceNum + 1, r.points), x + w / 2, 600);
}

function drawPause(g) {
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, W, H);
  bigText(g, L().pause, W / 2, 170, 70, '#fff');
  Game.menu.draw(g, W / 2 - 170, 240, 340, 54, 14);
  g.font = font(14, 700); g.fillStyle = '#ddd'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(L().pauseHint, W / 2, 480);
}
