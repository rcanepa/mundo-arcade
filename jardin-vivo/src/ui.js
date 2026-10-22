// ===== Interfaz: barra superior, herramientas, inspector, catálogo, herbario y menús =====
const UI = { tool: 'inspect', seed: null, care: 'compost', build: 'bed', moving: null, sel: null, recent: [], modal: null,
  catCat: 'all', catSun: 'all', herbCat: 'all', title: true };
const $ = s => document.querySelector(s);
const TOOLS = [
  { id: 'inspect', icon: '🔍' }, { id: 'water', icon: '💧' }, { id: 'plant', icon: '🌱' }, { id: 'harvest', icon: '🧺' },
  { id: 'care', icon: '🧪' }, { id: 'build', icon: '🔨' }, { id: 'move', icon: '🪴' }, { id: 'remove', icon: '⛏️' }, { id: 'land', icon: '🗺️' }
];
const LENSES = [['light', '☀️'], ['water', '💧'], ['soil', '🟫'], ['ph', '🧪'], ['feed', '🌿']];
const IN_SITE = /\/jardin-vivo\/(index\.html)?$/.test(location.pathname);
const HOSE_COST = 150;

function buildUI() {
  $('#toolbar').addEventListener('click', e => { const b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
  $('#lensbar').addEventListener('click', e => {
    const r = e.target.closest('[data-rot]');
    if (r) { rotateView(+r.dataset.rot); Sound.sfx.click(); renderLensBar(); return; }
    const b = e.target.closest('[data-lens]'); if (!b) return;
    R.lens = R.lens === b.dataset.lens ? null : b.dataset.lens;
    if (R.lens) G.stats.lens = (G.stats.lens || 0) + 1;
    Sound.sfx.click(); renderLensBar();
  });
  $('#speed').addEventListener('click', e => { const b = e.target.closest('[data-speed]'); if (b) setSpeed(+b.dataset.speed); });
  $('#menubtns').addEventListener('click', e => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    Sound.sfx.click();
    ({ house: () => openHouse(), herb: () => openHerbarium(), goals: openGoals, visits: openVisits, menu: openMenu, help: openHelp })[b.dataset.open]();
  });
  $('#tray').addEventListener('click', trayClick);
  $('#inspector').addEventListener('click', inspectorClick);
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('#goalcard').addEventListener('click', openGoals);
  renderAll();
}

function renderAll() {
  document.documentElement.lang = LANG;
  document.title = L().title;
  $('#brand').textContent = L().title;
  $('#menubtns').innerHTML = [['house', '🏠'], ['herb', '📖'], ['goals', '🎯'], ['visits', '🎟️'], ['help', '❔'], ['menu', '⚙️']]
    .map(([k, i]) => `<button class="iconbtn ${k}" data-open="${k}" title="${esc(L().menuBtn[k])}"><span>${i}</span><small>${esc(L().menuBtn[k])}</small></button>`).join('');
  renderToolbar(); renderTray(); renderLensBar(); renderHUD(true); renderGoalCard(); layoutHUD();
  if (UI.sel) refreshInspector(true);
  if (UI.modal) UI.modal.render();
}

// Los paneles se acomodan bajo la barra superior (que puede ocupar una o más filas)
function layoutHUD() {
  const tb = $('#topbar').getBoundingClientRect();
  document.documentElement.style.setProperty('--top', Math.round(tb.bottom + 8) + 'px');
  const gc = $('#goalcard');
  document.documentElement.style.setProperty('--top2', Math.round(tb.bottom + 8 + (gc.hidden ? 0 : gc.getBoundingClientRect().height + 8)) + 'px');
}
addEventListener('resize', () => layoutHUD());

// ---------- Barra superior ----------
let hudCache = '';
function renderHUD(force) {
  const yd = G.day % DAYS_YEAR, s = seasonOf(yd), year = Math.floor(G.day / DAYS_YEAR) + 1;
  const h = Math.floor(G.hour), m = Math.floor((G.hour % 1) * 60 / 10) * 10;
  const temp = Math.round(tempAt(G.w, G.hour));
  const stars = starsHTML(G.rep);
  const key = [Math.round(G.money), stars, Math.round(G.beauty), G.day, h, m, temp, G.speed, G.w.kind, LANG, UI.paused].join('|');
  if (!force && key === hudCache) return;
  hudCache = key;
  $('#money').innerHTML = `<span class="ic">🪙</span>${money(G.money)}`;
  $('#stars').innerHTML = stars;
  $('#stars').title = L().repTip(G.rep.toFixed(1));
  $('#beauty').innerHTML = `<span class="ic">🌸</span>${Math.round(G.beauty)}`;
  $('#beauty').title = L().beautyTip;
  $('#date').title = L().climates[G.climate || 'santiago'][0];
  $('#date').innerHTML = `<span class="ic">${['🌷', '☀️', '🍂', '❄️'][s]}</span>${esc(L().seasons[s])} · ${L().dayN(yd % DAYS_SEASON + 1)}${year > 1 ? ' · ' + L().yearN(year) : ''}`;
  $('#time').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  $('#weather').innerHTML = `${WEATHER_ICON[G.w.kind]} ${temp}°`;
  $('#weather').title = L().weatherTip(G.w, G.wNext);
  $('#speed').innerHTML = [[0, '⏸'], [1, '▶'], [2, '▶▶'], [4, '▶▶▶']]
    .map(([v, t]) => `<button data-speed="${v}" class="${(UI.paused ? 0 : G.speed) === v ? 'on' : ''}" title="${esc(L().speedTip[v])}">${t}</button>`).join('');
}
function starsHTML(r) {
  let s = '';
  for (let i = 0; i < 5; i++) { const f = clamp(r - i, 0, 1); s += `<i class="star"><i style="width:${Math.round(f * 100)}%"></i></i>`; }
  return s;
}
function setSpeed(v) {
  if (v === 0) UI.paused = !UI.paused;
  else { G.speed = v; UI.paused = false; }
  Sound.sfx.click(); renderHUD(true);
}

// ---------- Herramientas ----------
function renderToolbar() {
  $('#toolbar').innerHTML = TOOLS.map((t, i) => `<button data-tool="${t.id}" class="${UI.tool === t.id ? 'on' : ''}" title="${esc(L().tools[t.id][1])} (${i + 1})">
    <span>${t.icon}</span><small>${esc(L().tools[t.id][0])}</small></button>`).join('');
}
function setTool(id) {
  if (UI.tool === id && id === 'plant') { openCatalog(); return; }
  UI.tool = id; UI.moving = null;
  R.preview = null; R.area = 0;
  if (id === 'plant' && !UI.seed) { openCatalog(); }
  if (id === 'plant' && UI.seed) R.preview = { kind: 'plant', sp: UI.seed };
  if (id === 'land') R.preview = { kind: 'parcel', hover: -1 };
  if (id === 'water') R.area = G.hose ? 1 : 0;
  Sound.sfx.click();
  renderToolbar(); renderTray();
}

function renderTray() {
  const T = L(), tool = UI.tool;
  let html = `<div class="trayhead"><b>${TOOLS.find(t => t.id === tool).icon} ${esc(T.tools[tool][0])}</b><span>${esc(T.tools[tool][1])}</span></div>`;
  if (tool === 'plant') {
    const sp = UI.seed && SP[UI.seed];
    html += `<div class="trayrow">`;
    if (sp) html += `<div class="seedsel"><img src="${speciesThumb(sp, 54)}" alt=""><div><b>${esc(spName(sp))}</b><small>${G.inv[sp.id] ? '🌰 ' + esc(T.invHave(G.inv[sp.id])) : money(sp.price)} · ${esc(sunLabel(sp))}</small></div></div>`;
    html += `<button class="btn" data-act="catalog">📒 ${esc(T.catalog)}</button>`;
    for (const id of UI.recent.filter(i => i !== UI.seed).slice(0, 5)) html += `<button class="mini" data-seed="${id}" title="${esc(spName(SP[id]))}"><img src="${speciesThumb(SP[id], 34)}" alt=""></button>`;
    html += `</div><p class="hint">${esc(T.plantHint)}</p>`;
  } else if (tool === 'care') {
    html += `<div class="trayrow wrap">` + CARE_ORDER.map(k => `<button class="item ${UI.care === k ? 'on' : ''}" data-care="${k}" title="${esc(T.care[k][1])}"><span>${CARE[k].icon}</span><b>${esc(T.care[k][0])}</b><small>${CARE[k].cost ? money(CARE[k].cost) : T.free}</small></button>`).join('') + `</div>`;
    html += `<p class="hint">${esc(T.care[UI.care][1])}</p>`;
  } else if (tool === 'build') {
    const tier = unlockedTier();
    html += `<div class="trayrow wrap">` + BUILD_ORDER.map(k => {
      const b = BUILD[k], lock = b.tier && b.tier > tier;
      return `<button class="item ${UI.build === k ? 'on' : ''} ${lock ? 'locked' : ''}" data-build="${k}" title="${esc(T.build[k][1])}"><span>${b.icon}</span><b>${esc(T.build[k][0])}</b><small>${lock ? '★' + b.tier : money(b.cost)}</small></button>`;
    }).join('') + `</div><p class="hint">${esc(T.build[UI.build][1])}</p>`;
  } else if (tool === 'water') {
    const thirsty = thirstyPlants().length;
    html += `<div class="trayrow"><button class="btn ${thirsty ? 'good' : ''}" data-act="thirsty">💧 ${esc(T.thirstyBtn(thirsty))}${thirsty ? ' · ' + money(thirsty * THIRSTY_PRICE) : ''}</button>`;
    if (!G.hose) html += `<button class="btn" data-act="hose">🚿 ${esc(T.buyHose)} · ${money(HOSE_COST)}</button>`;
    html += `</div><p class="hint">${esc(G.hose ? T.hoseOn : T.canOn)} ${esc(T.dripTip)}</p>`;
  } else if (tool === 'land') {
    html += `<div class="trayrow wrap">` + PARCELS.map((p, i) => i === 0 ? '' : `<div class="parcel ${G.owned[i] ? 'owned' : ''}"><b>${esc(T.parcels[p.soil])}</b><small>${esc(T.parcelDesc[p.soil])}</small>
      ${G.owned[i] ? `<em>✓ ${esc(T.yours)}</em>` : `<button class="btn small" data-buy="${i}">${esc(T.buy)} ${money(p.price)}</button>`}</div>`).join('') + `</div>`;
  } else if (tool === 'move' && UI.moving) {
    html += `<p class="hint">${esc(T.moveNow(spName(spOf(UI.moving))))}</p>`;
  }
  $('#tray').innerHTML = html;
  $('#tray').classList.toggle('idle', tool === 'inspect' || tool === 'harvest' || tool === 'remove' || (tool === 'move' && !UI.moving));
}
function trayClick(e) {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.act === 'catalog') openCatalog();
  if (b.dataset.act === 'thirsty') { actWaterThirsty(); renderTray(); if (UI.sel) refreshInspector(true); }
  if (b.dataset.act === 'hose') { if (spend(HOSE_COST)) { G.hose = 1; R.area = 1; Sound.sfx.fanfare(); renderTray(); } }
  if (b.dataset.seed) selectSeed(b.dataset.seed);
  if (b.dataset.care) { UI.care = b.dataset.care; Sound.sfx.click(); renderTray(); }
  if (b.dataset.build) {
    const k = b.dataset.build, bd = BUILD[k];
    if (bd.tier && bd.tier > unlockedTier()) { toast(L().locked(bd.tier), 'bad'); return; }
    UI.build = k; Sound.sfx.click(); renderTray();
  }
  if (b.dataset.buy) confirmBuy(+b.dataset.buy);
}
function selectSeed(id) {
  UI.seed = id;
  UI.recent = [id, ...UI.recent.filter(i => i !== id)].slice(0, 8);
  UI.tool = 'plant'; R.preview = { kind: 'plant', sp: id }; R.area = 0;
  Sound.sfx.click(); renderToolbar(); renderTray();
}

function renderLensBar() {
  // la brújula apunta al norte del jardín según cómo esté girada la vista
  const [nx, ny] = PV(-1, -1), deg = Math.round(Math.atan2(nx, -ny) * 180 / Math.PI);
  $('#lensbar').innerHTML = `<small>${esc(L().lensTitle)}</small>` + LENSES.map(([k, i]) => `<button data-lens="${k}" class="${R.lens === k ? 'on' : ''}" title="${esc(L().lens[k][1])}"><span>${i}</span><em>${esc(L().lens[k][0])}</em></button>`).join('') +
    `<div class="rotrow"><button data-rot="-1" title="${esc(L().rotL)}">⟲</button><span class="compass" style="--r:${deg}deg" title="${esc(L().north)}"><i></i><b>N</b></span><button data-rot="1" title="${esc(L().rotR)}">⟳</button></div>` +
    (R.lens ? `<div class="legend">${legendHTML(R.lens)}</div>` : '');
}
function legendHTML(k) {
  const stops = { light: [[0, 1], [3, 3], [5, 5], [8, 8]].map(([h, t]) => [css(LENS.light({ sun: h })), L().legend.light[[0, 3, 5, 8].indexOf(h)]]),
    water: [[0.1], [0.45], [0.85]].map(([m], i) => [css(LENS.water({ moist: m })), L().legend.water[i]]),
    soil: [['#e8cf8e'], ['#9c7650'], ['#c4664a'], ['#4f3a2c']].map(([c], i) => [c, L().legend.soil[i]]),
    ph: [4.8, 6, 7, 8].map((v, i) => [css(LENS.ph({ ph: v })), L().legend.ph[i]]),
    feed: [0.1, 0.5, 0.9].map((v, i) => [css(LENS.feed({ fert: v })), L().legend.feed[i]]) }[k];
  return stops.map(([c, t]) => `<span><i style="background:${c}"></i>${esc(t)}</span>`).join('');
}

// ---------- Objetivo actual ----------
function renderGoalCard() {
  const el = $('#goalcard'), gl = GOALS[G.goal];
  if (!gl || UI.title) { el.hidden = true; return; }
  el.hidden = false;
  const [t, d] = L().goals[gl.id];
  el.innerHTML = `<small>🎯 ${esc(L().goalNow)}</small><b>${esc(t)}</b><span>${esc(d)}</span><em>+${money(gl.reward)}</em>`;
  layoutHUD();
}

// ---------- Necesidades de una planta, explicadas ----------
const sunLabel = sp => (sp.sun[0] >= 6 ? L().sunFull : sp.sun[0] >= 3 ? L().sunPart : sp.sun[1] <= 4 ? L().sunShade : L().sunPart) + (sp.am ? ' · ' + L().amSun : '');
const waterLabel = sp => L().waterK[sp.water];
const drainLabel = sp => sp.water === 'aquatic' ? L().drainAq : sp.drain[0] >= 0.6 ? L().drainFast : sp.drain[1] <= 0.66 ? L().drainWet : L().drainMid;
function soilName(t) {
  if (t.t === 'water') return L().soilK.water;
  if (t.drain >= 0.8) return L().soilK.sandy;
  if (t.drain <= 0.3) return L().soilK.clay;
  if (t.org >= 0.65 && t.ph < 6) return L().soilK.peat;
  return t.org >= 0.5 ? L().soilK.rich : L().soilK.loam;
}
const pct = v => Math.round(v * 100) + '%';
const deg = v => (v < 0 ? '−' : '') + Math.abs(Math.round(v)) + ' °C';
const bloomText = sp => sp.bloom ? L().seasonRange(sp.bloom) : L().noBloom;

function needRows(sp, t, p) {
  const T = L(), w = G.w, f = p && p.fac ? p.fac : evaluate(sp, t, p, w, !p), rows = [];
  const st = v => (v >= 0.95 ? 2 : v >= 0.72 ? 1 : 0);
  rows.push({ i: '☀️', n: T.need.light, v: T.hoursSun(t.sun.toFixed(1), t.sunAm.toFixed(1), t.sunPm.toFixed(1)), ideal: `${sp.sun[0]}–${sp.sun[1]} h · ${sunLabel(sp)}`, s: st(f.light),
    h: f.lightLow ? T.hint.lightLow : f.lightHigh ? T.hint.lightHigh : '' });
  if (sp.water === 'aquatic') rows.push({ i: '💧', n: T.need.water, v: t.t === 'water' ? T.inPond : T.notPond, ideal: waterLabel(sp), s: st(f.water), h: f.water < 0.9 ? T.hint.aquatic : '' });
  else rows.push({ i: '💧', n: T.need.water, v: t.t === 'water' ? T.inPond : T.moistV(pct(t.moist)), ideal: `${pct(WATER[sp.water][0])}–${pct(Math.min(1, WATER[sp.water][1]))} · ${waterLabel(sp)}`, s: st(f.water),
    h: f.dry ? T.hint.dry : f.wet ? T.hint.wet : '' });
  if (sp.water !== 'aquatic') {
    rows.push({ i: '🪨', n: T.need.soil, v: `${soilName(t)} · ${T.drainV(pct(t.drain))}`, ideal: drainLabel(sp), s: st(f.drain), h: f.drain < 0.95 ? (t.drain < sp.drain[0] ? T.hint.heavy : T.hint.loose) : '' });
    rows.push({ i: '🧪', n: T.need.ph, v: t.ph.toFixed(1), ideal: `${sp.ph[0].toFixed(1)}–${sp.ph[1].toFixed(1)}`, s: st(f.ph), h: f.ph < 0.95 ? (t.ph > sp.ph[1] ? T.hint.alkaline : T.hint.acid) : '' });
  }
  rows.push({ i: '🌿', n: T.need.feed, v: pct(t.fert), ideal: T.feedK[sp.feed], s: sp.carniv && f.feed < 1 ? 0 : f.rich ? 1 : st(f.feed),
    h: sp.carniv && f.feed < 1 ? T.hint.carniv : f.rich ? T.hint.rich : f.feed < 0.95 ? T.hint.hungry : '' });
  rows.push({ i: '🌡️', n: T.need.temp, v: t.pot || t.gh ? `${deg(nightMin(t, p, w))} / ${deg(dayMax(t, w))}` : `${deg(w.tmin)} / ${deg(w.tmax)}`, ideal: T.hardy(deg(sp.minT)) + (sp.maxT < 34 ? ' · ' + T.heatMax(deg(sp.maxT)) : ''),
    s: f.coldRisk || (G.wNext && nightMin(t, p, G.wNext) < sp.minT) ? 0 : f.heat < 0.95 ? 1 : 2,
    h: (G.wNext && nightMin(t, p, G.wNext) < sp.minT - (p && p.dorm ? 4 : 0)) ? T.hint.frostSoon(deg(G.wNext.tmin)) : f.heat < 0.95 ? T.hint.heat : sp.minT > 5 && !t.gh && !t.pot ? T.hint.tender : '' });
  if (sp.hum) rows.push({ i: '💨', n: T.need.hum, v: pct(ambientHum(t, w)), ideal: '≥ ' + pct(sp.hum), s: st(f.hum), h: f.hum < 0.95 ? T.hint.hum : '' });
  if (f.jug < 1) rows.push({ i: '🌰', n: T.need.special, v: T.juglone, ideal: '', s: 0, h: T.hint.juglone });
  if (p && p.pests) rows.push({ i: '🐛', n: T.need.special, v: T.pestK[spOf(p).pests || 'aphid'], ideal: '', s: 0, h: T.hint.pests });
  if (t.weeds > 0.5) rows.push({ i: '🌾', n: T.need.special, v: T.weedsV, ideal: '', s: 1, h: T.hint.weeds });
  if (f.compNames && f.compNames.length) rows.push({ i: '🤝', n: T.need.comp, v: f.compNames.map(id => spName(SP[id])).join(', '), ideal: '+' + Math.round((f.comp - 1) * 100) + '%', s: 2, h: '' });
  if (p && needsPrune(p)) rows.push({ i: '✂️', n: T.need.prune, v: T.pruneLate, ideal: '', s: 1, h: T.hint.prune(L().seasonRange(sp.prune)) });
  if (sp.chill && p && !p.dorm) rows.push({ i: '🧊', n: T.need.chill, v: `${Math.round(p.chill)} h`, ideal: `${sp.chill} h`, s: p.chill >= sp.chill ? 2 : 1, h: p.chill >= sp.chill ? '' : T.hint.chill(sp.chill) });
  return rows;
}

function stageText(p) {
  const T = L(), sp = spOf(p);
  if (p.dead) return T.stage.dead;
  if (p.dorm) return T.stage.dorm;
  if (p.fruit >= 1) return T.stage.fruit;
  if (p.bloom > 0.5) return T.stage.bloom;
  if (p.g < 0.12) return sp.start === 0 ? T.stage.seed : T.stage.sprout;
  if (p.g < 0.6) return T.stage.young;
  if (p.g < 1) return T.stage.growing;
  return T.stage.adult;
}

// ---------- Inspector ----------
function selectTile(x, y, plant) {
  const t = tileAt(x, y);
  if (!t) { closeInspector(); return; }
  UI.sel = { x, y };
  R.sel = plant || t.plant || null;
  refreshInspector(true);
}
function closeInspector() { UI.sel = null; R.sel = null; $('#inspector').hidden = true; }
function refreshInspector(force) {
  const el = $('#inspector');
  if (!UI.sel) { el.hidden = true; return; }
  if (!force && el.matches(':hover')) return;
  el.hidden = false;
  el.innerHTML = `<button class="close" data-act="close" aria-label="${esc(L().close)}">✕</button>` + inspectorHTML(tileAt(UI.sel.x, UI.sel.y));
}
// Lo que se sabe de una casilla (o maceta) y su planta, con los botones para cuidarla
function inspectorHTML(t) {
  const p = t.plant, T = L();
  let html = '';
  if (!t.own && t.pot) return `<h3>${esc(T.potEmpty)}</h3><p class="muted">${esc(T.potLocked)}</p><button class="btn good" data-act="buypot">🪴 ${esc(T.potBuy(money(POT_PRICE)))}</button>`;
  if (!t.own) return `<h3>${esc(T.parcels[PARCELS[t.parcel].soil])}</h3><p class="muted">${esc(T.parcelDesc[PARCELS[t.parcel].soil])}</p><button class="btn" data-buy="${t.parcel}">${esc(T.buy)} ${money(PARCELS[t.parcel].price)}</button>`;
  if (p) {
    const sp = spOf(p), hp = Math.round(p.hp);
    html += `<div class="phead"><img src="${speciesThumb(sp, 76)}" alt=""><div><h3>${esc(spName(sp))}</h3><i>${esc(sp.la)}</i>
      <div class="chips"><span class="chip">${esc(stageText(p))}</span><span class="chip">${esc(T.typeK[sp.type])}</span></div></div></div>`;
    html += `<div class="bar"><span>${esc(T.health)}</span><div><i style="width:${hp}%;background:${hp > 70 ? '#5aa04a' : hp > 40 ? '#e0b040' : '#d8573a'}"></i></div><b>${hp}%</b></div>`;
    if (!p.dead && p.g < 1) html += `<div class="bar"><span>${esc(T.growth)}</span><div><i style="width:${Math.round(p.g * 100)}%;background:#7fb0d8"></i></div><b>${Math.round(p.g * 100)}%</b></div>`;
    html += `<div class="needs">` + needRows(sp, t, p).map(r => `<div class="need s${r.s}"><span class="ni">${r.i}</span><div><b>${esc(r.n)}</b> <span>${esc(r.v)}</span>${r.ideal ? `<small>${esc(T.ideal)}: ${esc(r.ideal)}</small>` : ''}${r.h ? `<em>${esc(r.h)}</em>` : ''}</div><span class="st">${['✗', '!', '✓'][r.s]}</span></div>`).join('') + `</div>`;
    const acts = [];
    if (canHarvest(p)) acts.push(`<button class="btn good" data-act="harvest">🧺 ${esc(T.harvestBtn(money(Math.round(sp.harv[1] * (0.5 + p.hp / 200)))))}</button>`);
    if (!p.dead) acts.push(`<button class="btn" data-act="water">💧 ${esc(T.tools.water[0])}</button>`);
    if (t.drip) html += `<p class="muted small">🪢 ${esc(T.dripOn(pct(waterTarget(sp))))}</p>`;
    if (p.pests) acts.push(`<button class="btn" data-act="spray">🫧 ${esc(T.care.spray[0])} · ${money(CARE.spray.cost)}</button>`);
    if (!p.dead && !t.pot) acts.push(`<button class="btn" data-act="cloth">🧣 ${esc(p.cloth ? T.clothOff : T.clothOn)}</button>`);
    if (canPrune(p)) acts.push(`<button class="btn" data-act="prune">✂️ ${esc(T.care.prune[0])}</button>`);
    const np = propCount(p);
    if (np) acts.push(`<button class="btn good" data-act="prop">🌱 ${esc(T.propBtn[propMethod(sp)](np))}</button>`);
    if (!p.dead) acts.push(`<button class="btn" data-act="move">🪴 ${esc(t.pot ? T.moveOut : T.tools.move[0])}</button>`);
    acts.push(`<button class="btn danger" data-act="remove">⛏️ ${esc(p.dead ? T.compostIt : T.pullOut)}</button>`);
    html += `<div class="acts">${acts.join('')}</div>`;
    if (t.pot) html += potCareHTML(t);
    html += `<p class="desc">${esc(spDesc(sp))}</p><p class="muted small">🌸 ${esc(T.blooms)}: ${esc(bloomText(sp))}${sp.harv ? ' · 🧺 ' + esc(T.harvK[sp.harv[0]]) : ''}</p>`;
  } else {
    const st = t.pot ? null : structAt(t.x, t.y);
    html += `<h3>${t.pot ? esc(T.potEmpty) : st ? esc(T.build[st.k][0]) : esc(T.tileK[t.t] || T.tileK.grass)}</h3>`;
    if (t.pot && UI.moving && canPlantHere(spOf(UI.moving), t)) html += `<button class="btn good" data-act="bring">🪴 ${esc(T.bringHere(spName(spOf(UI.moving))))}</button>`;
    if (t.t !== 'house' && t.t !== 'water') {
      html += `<div class="soilgrid">
        <div><span>☀️</span><b>${t.sun.toFixed(1)} h</b><small>${esc(T.sunToday)}</small></div>
        <div><span>💧</span><b>${pct(t.moist)}</b><small>${esc(T.lens.water[0])}</small></div>
        <div><span>🪨</span><b>${esc(soilName(t))}</b><small>${esc(T.drainV(pct(t.drain)))}</small></div>
        <div><span>🧪</span><b>pH ${t.ph.toFixed(1)}</b><small>${esc(t.ph < 6 ? T.acidic : t.ph > 7.3 ? T.alkalineW : T.neutral)}</small></div>
        <div><span>🌿</span><b>${pct(t.fert)}</b><small>${esc(T.lens.feed[0])}</small></div>
        <div><span>🍂</span><b>${pct(t.org)}</b><small>${esc(T.organic)}</small></div>
      </div>`;
      if (t.mulch) html += `<p class="muted small">🪵 ${esc(T.mulchLeft(t.mulch))}</p>`;
      if (t.weeds > 0.3) html += `<p class="muted small">🌾 ${esc(T.hint.weeds)}</p>`;
    }
    if (t.t === 'grass') html += `<p class="muted small">${esc(T.grassTip)}</p>`;
    if (t.pot) html += potCareHTML(t) + `<button class="btn" data-act="potcat">📒 ${esc(T.potCat)}</button>`;
    if (t.t === 'bed' || t.t === 'water' || t.pot) {
      const tier = unlockedTier();
      const best = SPECIES.filter(s => s.tier <= tier && canPlantHere(s, t)).map(s => [s, suitability(s, t)]).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (best.length) html += `<h4>${esc(T.bestHere)}</h4><div class="bestgrid">` + best.map(([s, v]) => `<button data-seed="${s.id}" title="${esc(spName(s))} · ${Math.round(v * 100)}%"><img src="${speciesThumb(s, 44)}" alt=""><small>${esc(spName(s))}</small><i class="${v > 0.8 ? 'ok' : v > 0.55 ? 'mid' : 'bad'}">${Math.round(v * 100)}%</i></button>`).join('') + `</div>`;
    }
  }
  return html;
}
// Cuidados que se aplican a mano a una maceta (las herramientas del jardín no llegan adentro)
function potCareHTML(t) {
  const T = L();
  return `<div class="acts small">` + ['fert', 'compost', 'sand', 'peat', 'lime', 'tray'].filter(k => k !== 'tray' || !t.tray)
    .map(k => `<button class="btn small" data-act="care" data-k="${k}" title="${esc(T.care[k][1])}">${CARE[k].icon} ${esc(T.care[k][0])} · ${money(CARE[k].cost)}</button>`).join('') + `</div>`;
}
function inspectorAction(b, t) {
  const p = t.plant, a = b.dataset.act;
  if (b.dataset.seed) { selectSeed(b.dataset.seed); actPlant(b.dataset.seed, t.x, t.y); return; }
  if (b.dataset.buy) { confirmBuy(+b.dataset.buy); return; }
  if (a === 'harvest' && p) actHarvest(p);
  if (a === 'water') actWater(t.x, t.y, 0);
  if (a === 'spray') actCare('spray', t.x, t.y);
  if (a === 'cloth') actCare('cloth', t.x, t.y);
  if (a === 'care') actCare(b.dataset.k, t.x, t.y);
  if (a === 'move' && p) { if (UI.modal) closeModal(); setTool('move'); UI.moving = p; R.sel = p; renderTray(); }
  if (a === 'prune' && p) actPrune(p);
  if (a === 'prop' && p) actPropagate(p);
  if (a === 'buypot') actBuyPot(t.x - POT_X);
  if (a === 'bring' && UI.moving && actTransplant(UI.moving, t.x, t.y)) { UI.moving = null; renderTray(); }
  if (a === 'potcat') { UI.potTarget = t.x - POT_X; UI.sel = { x: t.x, y: 0 }; UI.catSun = 'here'; closeModal(); openCatalog(); }
  if (a === 'remove') { if (actRemove(t.x, t.y)) { if (!t.plant) R.sel = null; } }
}
function inspectorClick(e) {
  const b = e.target.closest('button');
  if (!b || !UI.sel) return;
  if (b.dataset.act === 'close') { closeInspector(); return; }
  inspectorAction(b, tileAt(UI.sel.x, UI.sel.y));
  refreshInspector(true);
}

// ---------- Guía de los primeros pasos: señala qué tocar ----------
function coachTarget() {
  if (UI.title || G.goal >= 6 || !GOALS[G.goal]) return null;
  const C = L().coach, open = !!UI.modal, ui = (sel, text) => ({ sel, text });
  switch (GOALS[G.goal].id) {
    case 'lens': return open ? null : ui('[data-lens="light"]', C.lens);
    case 'plant':
      if (open) return null;
      if (UI.tool !== 'plant' || !UI.seed) return ui('[data-tool="plant"]', C.plantTool);
      return { tiles: G.tiles.filter(t => t.own && t.t === 'bed' && !t.plant), text: C.plantBed };
    case 'water':
      if (open) return null;
      if (UI.tool !== 'water') return ui('[data-tool="water"]', C.waterTool);
      return { tiles: G.plants.filter(p => !p.dead && tileAt(p.x, p.y).own && tileAt(p.x, p.y).t !== 'water').map(p => tileAt(p.x, p.y)), text: C.waterBed };
    case 'open':
      if (UI.modal && UI.modal.kind === 'visits') return ui('[data-toggle="1"]', C.openBtn);
      return open ? null : ui('[data-open="visits"]', C.visits);
    case 'rose': {
      const rose = G.plants.find(p => p.sp === 'rose' && !p.dead);
      if (open || !rose) return null;
      if (UI.tool !== 'move') return ui('[data-tool="move"]', C.moveTool);
      if (!UI.moving) return { tiles: [tileAt(rose.x, rose.y)], text: C.rose };
      return { tiles: G.tiles.filter(t => t.own && t.t === 'bed' && !t.plant && t.sun >= 6), text: C.roseDest };
    }
    case 'beds':
      if (open) return null;
      if (UI.tool !== 'build') return ui('[data-tool="build"]', C.buildTool);
      if (UI.build !== 'bed') return ui('[data-build="bed"]', C.bedItem);
      return null;
  }
  return null;
}
function updateCoach() {
  const el = $('#coach'), c = coachTarget();
  R.coach = c && c.tiles ? c.tiles.slice(0, 60) : null;
  let x, y, w, h;
  if (c && c.sel) {
    const t = document.querySelector(c.sel), r = t && t.getBoundingClientRect();
    if (r && r.width) { x = r.left; y = r.top; w = r.width; h = r.height; }
  } else if (c && c.tiles && c.tiles.length) {
    const [sx, sy] = P(c.tiles[0].x + 0.5, c.tiles[0].y + 0.5);
    x = sx - 22; y = sy - 14; w = 44; h = 28;
  }
  if (x === undefined) { el.hidden = true; return; }
  el.hidden = false;
  const ring = el.firstElementChild, tag = el.lastElementChild;
  ring.style.cssText = c.sel ? `left:${x - 6}px;top:${y - 6}px;width:${w + 12}px;height:${h + 12}px` : 'display:none';
  if (tag.textContent !== c.text) tag.textContent = c.text;
  const below = y < VH * 0.5, tw = Math.min(260, VW - 24);
  const lx = clamp(x + w / 2 - tw / 2, 12, VW - tw - 12);
  tag.className = 'tag ' + (below ? 'down' : 'up');
  tag.style.cssText = `left:${lx}px;width:${tw}px;${below ? `top:${y + h + 14}px` : `bottom:${VH - y + 14}px`};--ax:${clamp(x + w / 2 - lx, 16, tw - 16)}px`;
}

// ---------- Avisos ----------
function toast(msg, type = 'info') {
  const box = $('#toasts'), el = document.createElement('div');
  el.className = 'toast t-' + type; el.innerHTML = msg;
  box.prepend(el);
  while (box.children.length > 4) box.lastChild.remove();
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, type === 'goal' ? 6000 : 4200);
}
// Mensajes que vienen de la simulación
const NEWS_SEEN = new Set();
function news(kind, d) {
  if (UI.title) return;
  // el mismo aviso (por ejemplo, diez caléndulas que terminan su ciclo) se muestra una vez por día
  if (d.sp && kind !== 'herb') {
    const key = G.day + kind + d.sp;
    if (NEWS_SEEN.has(key)) return;
    if (NEWS_SEEN.size > 200) NEWS_SEEN.clear();
    NEWS_SEEN.add(key);
  }
  const T = L(), name = d.sp ? spName(SP[d.sp]) : '';
  const msg = {
    frost: () => [T.news.frost(d.n, deg(d.t)), 'bad'], cycle: () => [T.news.cycle(name), 'info'], died: () => [T.news.died(name), 'bad'],
    pest: () => [T.news.pest(name, T.pestK[d.k]), 'bad'], herb: () => [T.news.herb(name), 'good'], star: () => [T.news.star(d.n), 'goal'],
    order: () => [T.news.order(d.n, name), 'info'], orderLost: () => [T.news.orderLost, 'bad'], forecast: () => [d.text, d.type],
    contestSoon: () => [T.news.contestSoon, 'info'], contestJury: () => [T.news.contestJury, 'info'],
    contestWin: () => [T.news.contestWin(d.place, d.prize), 'goal'], contestNone: () => [T.news.contestNone, 'info']
  }[kind];
  if (!msg) return;
  const [m, type] = msg();
  toast(m, type);
  if (kind === 'star') { Sound.sfx.fanfare(); renderTray(); }
}

// ---------- Ventanas ----------
function openModal(render, cls = '') {
  const el = $('#modal');
  UI.modal = { render: () => { el.innerHTML = `<div class="sheet ${cls}">${render()}</div>`; } };
  UI.modal.render();
  el.hidden = false;
  el.onclick = e => {
    if (e.target.id === 'modal' || e.target.closest('[data-close]')) return closeModal();
    if (UI.modal && UI.modal.onclick) UI.modal.onclick(e);
  };
}
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; UI.modal = null; }
const modalHead = (title, sub) => `<header><div><h2>${esc(title)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div><button class="close" data-close aria-label="${esc(L().close)}">✕</button></header>`;

// Catálogo de semillas y plantas
function openCatalog() {
  openModal(() => {
    const T = L(), tier = unlockedTier(), selT = UI.sel ? tileAt(UI.sel.x, UI.sel.y) : null;
    const forTile = selT && selT.own && (selT.t === 'bed' || selT.t === 'water') && !selT.plant;
    let list = SPECIES.filter(s => s.id !== 'walnut' || tier >= 4);
    if (UI.catCat !== 'all') list = list.filter(s => s.cat === UI.catCat);
    if (UI.catSun === 'sun') list = list.filter(s => s.sun[0] >= 6);
    if (UI.catSun === 'part') list = list.filter(s => s.sun[0] < 6 && s.sun[1] > 4);
    if (UI.catSun === 'shade') list = list.filter(s => s.sun[1] <= 6 && s.sun[0] <= 2);
    if (forTile && UI.catSun === 'here') list = list.filter(s => canPlantHere(s, selT)).sort((a, b) => suitability(b, selT) - suitability(a, selT));
    else list.sort((a, b) => !!G.inv[b.id] - !!G.inv[a.id] || (a.tier > tier) - (b.tier > tier) || a.tier - b.tier || a.price - b.price);
    const cats = ['all', ...CATS].map(c => `<button data-cat="${c}" class="${UI.catCat === c ? 'on' : ''}">${esc(T.cats[c])}</button>`).join('');
    const suns = ['all', 'sun', 'part', 'shade', ...(forTile ? ['here'] : [])].map(c => `<button data-sun="${c}" class="${UI.catSun === c ? 'on' : ''}">${esc(T.sunF[c])}</button>`).join('');
    const cards = list.map(s => {
      const lock = s.tier > tier && !G.inv[s.id], v = forTile && canPlantHere(s, selT) ? suitability(s, selT) : null;
      return `<button class="card ${lock ? 'locked' : ''} ${UI.seed === s.id ? 'on' : ''}" data-pick="${s.id}">
        <img src="${speciesThumb(s, 84)}" alt="" loading="lazy">
        ${G.inv[s.id] ? `<span class="price inv">🌰 ×${G.inv[s.id]}</span>` : lock ? `<span class="lock">🔒 ★${s.tier}</span>` : `<span class="price">${money(s.price)}</span>`}
        ${v !== null && !lock ? `<span class="fit ${v > 0.8 ? 'ok' : v > 0.55 ? 'mid' : 'bad'}">${Math.round(v * 100)}%</span>` : ''}
        <b>${esc(spName(s))}</b><i>${esc(s.la)}</i>
        <span class="reqs" title="${esc(sunLabel(s))} · ${esc(waterLabel(s))} · ${esc(drainLabel(s))}">${sunIcon(s)} ${waterIcon(s)} ${s.ph[1] <= 6.2 ? '🍋' : s.ph[0] >= 6.8 ? '🐚' : ''}${s.minT > 5 ? '🏡' : ''}</span>
      </button>`;
    }).join('');
    return modalHead(T.catalogTitle, T.catalogSub) + `<div class="filters">${cats}</div><div class="filters small">${suns}</div><div class="cards">${cards || `<p class="muted">${esc(T.none)}</p>`}</div>
      <p class="muted small legendline">${esc(T.catLegend)}</p>`;
  }, 'wide');
  UI.modal.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.cat) { UI.catCat = b.dataset.cat; UI.modal.render(); }
    if (b.dataset.sun) { UI.catSun = b.dataset.sun; UI.modal.render(); }
    if (b.dataset.pick) {
      const s = SP[b.dataset.pick];
      if (s.tier > unlockedTier() && !G.inv[s.id]) { toast(L().locked(s.tier), 'bad'); Sound.sfx.nope(); return; }
      selectSeed(s.id); closeModal();
      if (UI.potTarget !== undefined && UI.potTarget !== null) {
        const i = UI.potTarget; UI.potTarget = null; UI.sel = null; UI.catSun = 'all';
        actPlant(s.id, POT_X + i, 0); UI.potSel = i; openHouse(); return;
      }
      toast(L().seedChosen(spName(s)), 'info');
    }
  };
}
const sunIcon = s => (s.sun[0] >= 6 ? '☀️' : s.sun[1] <= 4 ? '🌑' : '⛅');
const waterIcon = s => ({ xeric: '🌵', low: '💧', med: '💧💧', high: '💧💧💧', bog: '🌊', aquatic: '🪷' }[s.water]);

// Herbario: la colección de especies
function openHerbarium(id) {
  UI.herbSel = id || null;
  openModal(() => {
    const T = L();
    if (UI.herbSel) return herbDetail(SP[UI.herbSel]);
    const got = herbCount();
    let list = SPECIES;
    if (UI.herbCat !== 'all') list = list.filter(s => s.cat === UI.herbCat);
    const cats = ['all', ...CATS].map(c => `<button data-cat="${c}" class="${UI.herbCat === c ? 'on' : ''}">${esc(T.cats[c])}</button>`).join('');
    return modalHead(T.herbTitle, T.herbSub(got, SPECIES.length)) + `<div class="progress"><i style="width:${got / SPECIES.length * 100}%"></i></div><div class="filters">${cats}</div><div class="cards herb">` +
      list.map(s => {
        const st = G.herb[s.id] || 0;
        return `<button class="card h${st}" data-sp="${s.id}"><img src="${speciesThumb(s, 84)}" alt="" loading="lazy">${st === 2 ? '<span class="pressed">✓</span>' : ''}<b>${st ? esc(spName(s)) : '???'}</b><i>${st ? esc(s.la) : esc(T.cats[s.cat])}</i></button>`;
      }).join('') + `</div>`;
  }, 'wide');
  UI.modal.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.cat) { UI.herbCat = b.dataset.cat; UI.modal.render(); }
    if (b.dataset.sp) { UI.herbSel = b.dataset.sp; UI.modal.render(); }
    if (b.dataset.back) { UI.herbSel = null; UI.modal.render(); }
    if (b.dataset.plantit) { const s = SP[b.dataset.plantit]; if (s.tier <= unlockedTier()) { selectSeed(s.id); closeModal(); } else toast(L().locked(s.tier), 'bad'); }
  };
}
function herbDetail(s) {
  const T = L(), st = G.herb[s.id] || 0;
  const row = (i, n, v) => `<div class="hrow"><span>${i}</span><b>${esc(n)}</b><span>${esc(v)}</span></div>`;
  return modalHead(spName(s), s.la) + `<div class="hdetail"><div class="hpic"><img src="${speciesThumb(s, 220)}" alt="">
      <span class="badge h${st}">${esc(T.herbState[st])}</span></div><div>
      <p class="desc">${esc(spDesc(s))}</p>
      ${row('🏷️', T.typeL, T.typeK[s.type] + ' · ' + T.cats[s.cat])}
      ${row('☀️', T.need.light, `${s.sun[0]}–${s.sun[1]} h · ${sunLabel(s)}`)}
      ${row('💧', T.need.water, waterLabel(s))}
      ${row('🪨', T.need.soil, drainLabel(s))}
      ${s.water !== 'aquatic' ? row('🧪', T.need.ph, `${s.ph[0].toFixed(1)} – ${s.ph[1].toFixed(1)}`) : ''}
      ${row('🌿', T.need.feed, T.feedK[s.feed])}
      ${row('❄️', T.need.temp, T.hardy(deg(s.minT)) + (s.maxT < 34 ? ' · ' + T.heatMax(deg(s.maxT)) : ''))}
      ${s.hum ? row('💨', T.need.hum, '≥ ' + pct(s.hum)) : ''}
      ${s.chill ? row('🧊', T.need.chill, `${s.chill} h < 7 °C`) : ''}
      ${row('🌸', T.blooms, bloomText(s))}
      ${s.dorm ? row('💤', T.restsL, L().seasonRange(s.dorm)) : ''}
      ${row('⏳', T.growL, T.weeks(s.grow))}
      ${row('🌱', T.propL, T.propHow[propMethod(s) || 'none'])}
      ${s.prune ? row('✂️', T.pruneL, L().seasonRange(s.prune)) : ''}
      ${COMPANIONS[s.id] && Object.keys(COMPANIONS[s.id]).length ? row('🤝', T.compL, Object.keys(COMPANIONS[s.id]).map(id => spName(SP[id])).join(', ')) : ''}
      ${s.harv ? row('🧺', T.harvL, T.harvK[s.harv[0]] + ' · ' + money(s.harv[1])) : ''}
      <div class="acts"><button class="btn" data-back="1">← ${esc(T.back)}</button>${s.tier <= unlockedTier() ? `<button class="btn good" data-plantit="${s.id}">🌱 ${esc(T.plantThis)} · ${money(s.price)}</button>` : `<span class="muted">🔒 ★${s.tier}</span>`}</div>
    </div></div>`;
}

// Objetivos y encargos
function openGoals() {
  openModal(() => {
    const T = L();
    let shown = 0;
    const goals = GOALS.map((gl, i) => {
      const [t, d] = T.goals[gl.id], done = goalDone(gl), cls = done ? 'done' : i === G.goal ? 'now' : 'next';
      if (!done && ++shown > 4) return '';
      return `<div class="goal ${cls}"><span>${done ? '✓' : i === G.goal ? '🎯' : '·'}</span><div><b>${esc(t)}</b><small>${esc(d)}</small></div><em>${money(gl.reward)}</em></div>`;
    }).join('');
    G.orders.forEach(o => { o.seen = true; });
    const orders = G.orders.length ? G.orders.map(o => `<div class="goal order"><img src="${speciesThumb(SP[o.sp], 40)}" alt=""><div><b>${esc(T.clients[o.client])}</b><small>${esc(T.orderTxt(o.n, spName(SP[o.sp]), o.until - G.day))}</small>
        <div class="progress small"><i style="width:${o.got / o.n * 100}%"></i></div></div><em>${money(o.reward)}</em></div>`).join('') : `<p class="muted">${esc(T.noOrders)}</p>`;
    return modalHead(T.goalsTitle, T.goalsSub) + `<div class="cols"><section><h4>🎯 ${esc(T.goalsH)}</h4>${goals}</section><section><h4>✉️ ${esc(T.ordersH)}</h4>${orders}<p class="muted small">${esc(T.ordersTip)}</p></section></div>`;
  });
}

// Visitas, precio y reputación
function openVisits() {
  openModal(() => {
    const T = L(), exp = expectedVisitors();
    const next = Math.min(5, Math.floor(G.rep) + 1);
    const log = G.log.slice(0, 12).map(c => `<li class="${['thirsty', 'soggy', 'dark', 'burnt', 'yellow', 'hot', 'dry_air', 'soil', 'pale', 'sad', 'dead', 'pests', 'expensive'].includes(c.kind) ? 'bad' : ''}"><small>${esc(T.dayN((c.day % DAYS_YEAR) % DAYS_SEASON + 1))} · ${String(c.h).padStart(2, '0')}h</small>“${esc(c.text)}”</li>`).join('');
    return modalHead(T.visitsTitle, T.visitsSub) + `<div class="cols"><section>
      <div class="openrow"><b>${esc(G.open ? T.isOpen : T.isClosed)}</b><button class="btn ${G.open ? '' : 'good'}" data-toggle="1">${esc(G.open ? T.closeGarden : T.openGarden)}</button></div>
      <div class="pricerow"><span>${esc(T.ticket)}</span><button class="btn small" data-price="-1">−</button><b>${money(G.price)}</b><button class="btn small" data-price="1">+</button></div>
      <p class="muted small">${esc(T.fairPrice(money(G.fair)))}</p>
      <div class="statgrid"><div><b>${G.open ? Math.round(exp) : 0}</b><small>${esc(T.expected)}</small></div><div><b>${G.today.visitors}</b><small>${esc(T.today)}</small></div>
      <div><b>${money(G.today.income)}</b><small>${esc(T.earnedToday)}</small></div><div><b>${G.stats.visitors}</b><small>${esc(T.totalVisitors)}</small></div></div>
      <h4>⭐ ${esc(T.reputation)}</h4><div class="bigstars">${starsHTML(G.rep)}</div><p class="muted small">${esc(T.repExplain(Math.round(G.beauty), next))}</p>
      </section><section><h4>💬 ${esc(T.comments)}</h4><ul class="comments">${log || `<li class="muted">${esc(T.noComments)}</li>`}</ul></section></div>`;
  });
  UI.modal.kind = 'visits';
  UI.modal.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.toggle) { G.open = !G.open; if (G.open && G.hour >= OPEN_H && G.hour < CLOSE_H && !VIS.queue.length) planVisitors(); Sound.sfx.click(); }
    if (b.dataset.price) { G.price = clamp(G.price + +b.dataset.price, 0, 60); Sound.sfx.click(); }
    UI.modal.render();
  };
}

function openMenu() {
  openModal(() => {
    const T = L();
    return modalHead(T.menuTitle) + `<div class="menulist">
      <button class="btn" data-m="lang">🌐 ${esc(T.langBtn)}</button>
      <button class="btn" data-m="music">${Sound.musicOn() ? '🎵' : '🔇'} ${esc(T.musicBtn(Sound.musicOn()))}</button>
      <button class="btn" data-m="sfx">${Sound.sfxOn() ? '🔔' : '🔕'} ${esc(T.sfxBtn(Sound.sfxOn()))}</button>
      <button class="btn" data-m="save">💾 ${esc(T.saveBtn)}</button>
      <button class="btn" data-m="export">📤 ${esc(T.exportBtn)}</button>
      <button class="btn" data-m="import">📥 ${esc(T.importBtn)}</button>
      <button class="btn" data-m="title">🏡 ${esc(T.toTitle)}</button>
      ${IN_SITE ? `<a class="btn" href="../index.html">← ${esc(T.moreGames)}</a>` : ''}
    </div>`;
  });
  UI.modal.onclick = e => {
    const b = e.target.closest('[data-m]'); if (!b) return;
    const m = b.dataset.m;
    if (m === 'lang') { setLang(LANG === 'es' ? 'en' : 'es'); renderAll(); }
    if (m === 'music') Sound.toggleMusic();
    if (m === 'sfx') Sound.toggleSfx();
    if (m === 'save') { saveGame(); toast(L().saved, 'good'); }
    if (m === 'export') exportGame();
    if (m === 'import') { importGame(); return; }
    if (m === 'title') { saveGame(); closeModal(); showTitle(); return; }
    if (UI.modal) UI.modal.render();
  };
}

function openHelp() {
  openModal(() => {
    const T = L();
    return modalHead(T.helpTitle, T.helpSub) + `<div class="helpgrid">${T.help.map(([i, h, p]) => `<div><span>${i}</span><b>${esc(h)}</b><p>${esc(p)}</p></div>`).join('')}</div>
      <p class="muted small">${esc(T.controls)}</p>`;
  }, 'wide');
}

function openIntro() {
  openModal(() => {
    const T = L();
    return `<div class="letter"><p class="date">${esc(T.climates[G.climate][3])}</p>${T.letter.map(p => `<p>${esc(p)}</p>`).join('')}<p class="sign">${esc(T.letterSign)}</p>
      <button class="btn good big" data-close>🌱 ${esc(T.letterGo)}</button></div>`;
  }, 'letterbox');
}

// Antes de empezar: ¿dónde está el jardín? El clima cambia qué plantas prosperan
function openClimates() {
  openModal(() => {
    const T = L();
    return modalHead(T.climateTitle, T.climateSub) + `<div class="climates">` + CLIMATE_ORDER.map(id => {
      const [name, region, desc] = T.climates[id];
      return `<button class="climate" data-climate="${id}"><span class="cimg c-${id}"></span><b>${esc(name)}</b><small>${esc(region)}</small><p>${esc(desc)}</p></button>`;
    }).join('') + `</div>`;
  }, 'wide');
  UI.modal.onclick = e => {
    const b = e.target.closest('[data-climate]'); if (!b) return;
    closeModal();
    newGarden(undefined, b.dataset.climate);
    startPlaying(true);
  };
}

// ---------- Dentro de la casa: macetas en las ventanas ----------
const POT_IMG = new Map();
function potPlantImg(p) {
  const vs = plantVS(p), key = p.id + '|' + vs.key;
  let url = POT_IMG.get(key);
  if (!url) {
    if (POT_IMG.size > 80) POT_IMG.clear();
    const sp = spOf(p), box = artBox(sp), px = 90 * Math.min(2, window.devicePixelRatio || 1);
    const { cv } = renderPlantCanvas(sp, vs, p.seed, Math.min(px * 0.95 / box.w, px * 1.3 / (box.up + box.down)));
    url = cv.toDataURL(); POT_IMG.set(key, url);
  }
  return url;
}
function potHTML(t) {
  const i = t.x - POT_X, sel = UI.potSel === i ? ' sel' : '', p = t.plant;
  if (!t.own) return `<button class="pot buy${sel}" data-pot="${i}"><b>+</b><small>${money(POT_PRICE)}</small></button>`;
  return `<button class="pot${sel}" data-pot="${i}">${p ? `<img src="${potPlantImg(p)}" alt="${esc(spName(spOf(p)))}">` : ''}<i class="clay"></i>${p && (p.wilt > 0.3 || p.dead) ? `<em>${p.dead ? '🥀' : '💧'}</em>` : ''}</button>`;
}
function openHouse() {
  if (UI.potSel === undefined || UI.potSel === null) UI.potSel = 0;
  openModal(() => {
    const T = L(), s = sunNow(), [top, bot] = skyColors(s.z);
    const wins = WINDOWS.map((w, wi) => {
      const pots = G.pots.slice(wi * POTS_PER_WINDOW, (wi + 1) * POTS_PER_WINDOW), lit = pots[0].prof[Math.floor(G.hour * 2) % 48] > 0.2 && s.z > 0.05;
      return `<div class="win"><div class="wintitle"><b>${esc(T.windowK[w.id])}</b><small>☀️ ${pots[0].sun.toFixed(1)} h ${esc(T.sunToday)}</small></div>
        <div class="pane" style="--sky1:${css(top)};--sky2:${css(bot)}">${lit ? '<i class="ray"></i>' : ''}</div>
        <div class="sill">${pots.map(potHTML).join('')}</div></div>`;
    }).join('');
    const t = G.pots[UI.potSel];
    return modalHead(T.houseTitle, T.houseSub) + `<div class="houseview"><div class="wins">${wins}</div><aside class="potpanel">${t ? inspectorHTML(t) : ''}</aside></div>
      <p class="muted small">${esc(T.indoorTip)}</p>`;
  }, 'wide');
  UI.modal.kind = 'house';
  UI.modal.onclick = e => {
    const slot = e.target.closest('[data-pot]');
    if (slot) { UI.potSel = +slot.dataset.pot; Sound.sfx.click(); UI.modal.render(); return; }
    const b = e.target.closest('.potpanel button'), t = G.pots[UI.potSel];
    if (!b || !t) return;
    inspectorAction(b, t);
    if (UI.modal && UI.modal.kind === 'house') UI.modal.render();
  };
}

function confirmBuy(i) {
  const pc = PARCELS[i], T = L();
  openModal(() => modalHead(T.parcels[pc.soil], T.parcelDesc[pc.soil]) + `<p>${esc(T.buyAsk(money(pc.price)))}</p><div class="acts"><button class="btn" data-close>${esc(T.cancel)}</button><button class="btn good" data-yes="1">${esc(T.buy)} ${money(pc.price)}</button></div>`);
  UI.modal.onclick = e => { if (e.target.closest('[data-yes]')) { closeModal(); actBuyParcel(i); renderTray(); } };
}

// ---------- Respaldo: la partida en un archivo ----------
function exportGame() {
  saveGame();
  const blob = new Blob([serialize()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `jardin-vivo-${L().climates[G.climate][0].replace(/\s+/g, '-').toLowerCase()}-${L().yearN(Math.floor(G.day / DAYS_YEAR) + 1).replace(/\s+/g, '')}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast(L().exported, 'good');
}
function importGame() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,application/json';
  input.onchange = () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let ok = false;
      try { ok = deserialize(String(reader.result)); } catch (e) { ok = false; }
      if (!ok) { toast(L().importBad, 'bad'); return; }
      saveGame(); closeModal(); startPlaying(false);
      toast(L().imported, 'good');
    };
    reader.readAsText(file);
  };
  input.click();
}

// ---------- Pantalla de título ----------
function showTitle() {
  UI.title = true;
  $('#hud').classList.add('hidden');
  const T = L(), el = $('#title');
  el.hidden = false;
  el.innerHTML = `<div class="titlebox"><div class="leafs">🌿</div><h1>${esc(T.title)}</h1><p>${esc(T.subtitle)}</p>
    <div class="titlebtns">${hasSave() ? `<button class="btn good big" data-t="continue">▶ ${esc(T.continue)}</button>` : ''}
    <button class="btn ${hasSave() ? '' : 'good'} big" data-t="new">🌱 ${esc(T.newGame)}</button>
    <button class="btn" data-t="lang">🌐 ${esc(T.langBtn)}</button>
    <button class="btn" data-t="import">📥 ${esc(T.importBtn)}</button>
    ${IN_SITE ? `<a class="btn" href="../index.html">← ${esc(T.moreGames)}</a>` : ''}</div>
    <small>${esc(T.titleFoot)}</small></div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    Sound.init();
    const a = b.dataset.t;
    if (a === 'lang') { setLang(LANG === 'es' ? 'en' : 'es'); showTitle(); renderAll(); return; }
    if (a === 'new') {
      if (hasSave() && !confirm(T.confirmNew)) return;
      openClimates();
    }
    if (a === 'continue') { if (!loadGame()) newGarden(); startPlaying(false); }
    if (a === 'import') importGame();
  };
  renderGoalCard();
}
function startPlaying(fresh) {
  UI.title = false; UI.sel = null; R.sel = null; VIS.list = []; VIS.queue = [];
  if (G.open && G.hour >= OPEN_H && G.hour < CLOSE_H) planVisitors();
  $('#title').hidden = true;
  $('#hud').classList.remove('hidden');
  centerOn(7, 9, VW < 700 ? 0.55 : 0.9);
  bumpVis();
  renderAll();
  Sound.play();
  if (fresh) { saveGame(); openIntro(); }
}
