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
    const b = e.target.closest('[data-lens]'); if (!b) return;
    R.lens = R.lens === b.dataset.lens ? null : b.dataset.lens;
    if (R.lens) G.stats.lens = (G.stats.lens || 0) + 1;
    Sound.sfx.click(); renderLensBar();
  });
  $('#speed').addEventListener('click', e => { const b = e.target.closest('[data-speed]'); if (b) setSpeed(+b.dataset.speed); });
  $('#menubtns').addEventListener('click', e => {
    const b = e.target.closest('[data-open]'); if (!b) return;
    Sound.sfx.click();
    ({ herb: () => openHerbarium(), goals: openGoals, visits: openVisits, menu: openMenu, help: openHelp })[b.dataset.open]();
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
  $('#menubtns').innerHTML = [['herb', '📖'], ['goals', '🎯'], ['visits', '🎟️'], ['help', '❔'], ['menu', '⚙️']]
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
    if (sp) html += `<div class="seedsel"><img src="${speciesThumb(sp, 54)}" alt=""><div><b>${esc(spName(sp))}</b><small>${money(sp.price)} · ${esc(sunLabel(sp))}</small></div></div>`;
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
    html += `<p class="hint">${esc(G.hose ? T.hoseOn : T.canOn)}</p>`;
    if (!G.hose) html += `<button class="btn" data-act="hose">🚿 ${esc(T.buyHose)} · ${money(HOSE_COST)}</button>`;
  } else if (tool === 'land') {
    html += `<div class="trayrow wrap">` + PARCELS.map((p, i) => i === 0 ? '' : `<div class="parcel ${G.owned[i] ? 'owned' : ''}"><b>${esc(T.parcels[i])}</b><small>${esc(T.parcelDesc[i])}</small>
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
  $('#lensbar').innerHTML = `<small>${esc(L().lensTitle)}</small>` + LENSES.map(([k, i]) => `<button data-lens="${k}" class="${R.lens === k ? 'on' : ''}" title="${esc(L().lens[k][1])}"><span>${i}</span><em>${esc(L().lens[k][0])}</em></button>`).join('') +
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
  rows.push({ i: '🌡️', n: T.need.temp, v: `${deg(w.tmin)} / ${deg(w.tmax)}`, ideal: T.hardy(deg(sp.minT)) + (sp.maxT < 34 ? ' · ' + T.heatMax(deg(sp.maxT)) : ''),
    s: f.coldRisk || (G.wNext && nightMin(t, p, G.wNext) < sp.minT) ? 0 : f.heat < 0.95 ? 1 : 2,
    h: (G.wNext && nightMin(t, p, G.wNext) < sp.minT - (p && p.dorm ? 4 : 0)) ? T.hint.frostSoon(deg(G.wNext.tmin)) : f.heat < 0.95 ? T.hint.heat : sp.minT > 5 && !t.gh ? T.hint.tender : '' });
  if (sp.hum) rows.push({ i: '💨', n: T.need.hum, v: pct(ambientHum(t, w)), ideal: '≥ ' + pct(sp.hum), s: st(f.hum), h: f.hum < 0.95 ? T.hint.hum : '' });
  if (f.jug < 1) rows.push({ i: '🌰', n: T.need.special, v: T.juglone, ideal: '', s: 0, h: T.hint.juglone });
  if (p && p.pests) rows.push({ i: '🐛', n: T.need.special, v: T.pestK[spOf(p).pests || 'aphid'], ideal: '', s: 0, h: T.hint.pests });
  if (t.weeds > 0.5) rows.push({ i: '🌾', n: T.need.special, v: T.weedsV, ideal: '', s: 1, h: T.hint.weeds });
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
  const t = tileAt(UI.sel.x, UI.sel.y), p = t.plant, T = L();
  if (!force && el.matches(':hover')) return;
  el.hidden = false;
  let html = `<button class="close" data-act="close" aria-label="${esc(T.close)}">✕</button>`;
  if (!t.own) {
    html += `<h3>${esc(T.parcels[t.parcel])}</h3><p class="muted">${esc(T.parcelDesc[t.parcel])}</p><button class="btn" data-buy="${t.parcel}">${esc(T.buy)} ${money(PARCELS[t.parcel].price)}</button>`;
    el.innerHTML = html; return;
  }
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
    if (p.pests) acts.push(`<button class="btn" data-act="spray">🫧 ${esc(T.care.spray[0])} · ${money(CARE.spray.cost)}</button>`);
    if (!p.dead) acts.push(`<button class="btn" data-act="cloth">🧣 ${esc(p.cloth ? T.clothOff : T.clothOn)}</button>`);
    if (!p.dead) acts.push(`<button class="btn" data-act="move">🪴 ${esc(T.tools.move[0])}</button>`);
    acts.push(`<button class="btn danger" data-act="remove">⛏️ ${esc(p.dead ? T.compostIt : T.pullOut)}</button>`);
    html += `<div class="acts">${acts.join('')}</div>`;
    html += `<p class="desc">${esc(spDesc(sp))}</p><p class="muted small">🌸 ${esc(T.blooms)}: ${esc(bloomText(sp))}${sp.harv ? ' · 🧺 ' + esc(T.harvK[sp.harv[0]]) : ''}</p>`;
  } else {
    const st = structAt(t.x, t.y);
    html += `<h3>${st ? esc(T.build[st.k][0]) : esc(T.tileK[t.t] || T.tileK.grass)}</h3>`;
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
    if (t.t === 'bed' || t.t === 'water') {
      const tier = unlockedTier();
      const best = SPECIES.filter(s => s.tier <= tier && canPlantHere(s, t)).map(s => [s, suitability(s, t)]).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (best.length) html += `<h4>${esc(T.bestHere)}</h4><div class="bestgrid">` + best.map(([s, v]) => `<button data-seed="${s.id}" title="${esc(spName(s))} · ${Math.round(v * 100)}%"><img src="${speciesThumb(s, 44)}" alt=""><small>${esc(spName(s))}</small><i class="${v > 0.8 ? 'ok' : v > 0.55 ? 'mid' : 'bad'}">${Math.round(v * 100)}%</i></button>`).join('') + `</div>`;
    }
  }
  el.innerHTML = html;
}
function inspectorClick(e) {
  const b = e.target.closest('button');
  if (!b || !UI.sel) return;
  const t = tileAt(UI.sel.x, UI.sel.y), p = t.plant;
  const a = b.dataset.act;
  if (a === 'close') { closeInspector(); return; }
  if (b.dataset.seed) { selectSeed(b.dataset.seed); actPlant(b.dataset.seed, t.x, t.y); refreshInspector(true); return; }
  if (b.dataset.buy) { confirmBuy(+b.dataset.buy); return; }
  if (a === 'harvest' && p) actHarvest(p);
  if (a === 'water') actWater(t.x, t.y, 0);
  if (a === 'spray') actCare('spray', t.x, t.y);
  if (a === 'cloth') actCare('cloth', t.x, t.y);
  if (a === 'move' && p) { setTool('move'); UI.moving = p; renderTray(); }
  if (a === 'remove') { if (actRemove(t.x, t.y)) { if (!t.plant) R.sel = null; } }
  refreshInspector(true);
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
    order: () => [T.news.order(d.n, name), 'info'], orderLost: () => [T.news.orderLost, 'bad'], forecast: () => [d.text, d.type]
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
    else list.sort((a, b) => (a.tier > tier) - (b.tier > tier) || a.tier - b.tier || a.price - b.price);
    const cats = ['all', ...CATS].map(c => `<button data-cat="${c}" class="${UI.catCat === c ? 'on' : ''}">${esc(T.cats[c])}</button>`).join('');
    const suns = ['all', 'sun', 'part', 'shade', ...(forTile ? ['here'] : [])].map(c => `<button data-sun="${c}" class="${UI.catSun === c ? 'on' : ''}">${esc(T.sunF[c])}</button>`).join('');
    const cards = list.map(s => {
      const lock = s.tier > tier, v = forTile && canPlantHere(s, selT) ? suitability(s, selT) : null;
      return `<button class="card ${lock ? 'locked' : ''} ${UI.seed === s.id ? 'on' : ''}" data-pick="${s.id}">
        <img src="${speciesThumb(s, 84)}" alt="" loading="lazy">
        ${lock ? `<span class="lock">🔒 ★${s.tier}</span>` : `<span class="price">${money(s.price)}</span>`}
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
      if (s.tier > unlockedTier()) { toast(L().locked(s.tier), 'bad'); Sound.sfx.nope(); return; }
      selectSeed(s.id); closeModal();
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
      ${s.harv ? row('🧺', T.harvL, T.harvK[s.harv[0]] + ' · ' + money(s.harv[1])) : ''}
      <div class="acts"><button class="btn" data-back="1">← ${esc(T.back)}</button>${s.tier <= unlockedTier() ? `<button class="btn good" data-plantit="${s.id}">🌱 ${esc(T.plantThis)} · ${money(s.price)}</button>` : `<span class="muted">🔒 ★${s.tier}</span>`}</div>
    </div></div>`;
}

// Objetivos y encargos
function openGoals() {
  openModal(() => {
    const T = L();
    const goals = GOALS.map((gl, i) => {
      const [t, d] = T.goals[gl.id], cls = i < G.goal ? 'done' : i === G.goal ? 'now' : 'next';
      if (i > G.goal + 2) return '';
      return `<div class="goal ${cls}"><span>${i < G.goal ? '✓' : i === G.goal ? '🎯' : '·'}</span><div><b>${esc(t)}</b><small>${esc(d)}</small></div><em>${money(gl.reward)}</em></div>`;
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
    return `<div class="letter"><p class="date">${esc(T.letterDate)}</p>${T.letter.map(p => `<p>${esc(p)}</p>`).join('')}<p class="sign">${esc(T.letterSign)}</p>
      <button class="btn good big" data-close>🌱 ${esc(T.letterGo)}</button></div>`;
  }, 'letterbox');
}

function confirmBuy(i) {
  const pc = PARCELS[i], T = L();
  openModal(() => modalHead(T.parcels[i], T.parcelDesc[i]) + `<p>${esc(T.buyAsk(money(pc.price)))}</p><div class="acts"><button class="btn" data-close>${esc(T.cancel)}</button><button class="btn good" data-yes="1">${esc(T.buy)} ${money(pc.price)}</button></div>`);
  UI.modal.onclick = e => { if (e.target.closest('[data-yes]')) { closeModal(); actBuyParcel(i); renderTray(); } };
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
    ${IN_SITE ? `<a class="btn" href="../index.html">← ${esc(T.moreGames)}</a>` : ''}</div>
    <small>${esc(T.titleFoot)}</small></div>`;
  el.onclick = e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    Sound.init();
    const a = b.dataset.t;
    if (a === 'lang') { setLang(LANG === 'es' ? 'en' : 'es'); showTitle(); renderAll(); return; }
    if (a === 'new') {
      if (hasSave() && !confirm(T.confirmNew)) return;
      newGarden(); startPlaying(true);
    }
    if (a === 'continue') { if (!loadGame()) newGarden(); startPlaying(false); }
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
