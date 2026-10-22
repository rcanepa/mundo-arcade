// ===== Acciones del jugador, objetivos y encargos =====
function spend(cost) {
  if (G.money < cost) { toast(L().noMoney, 'bad'); Sound.sfx.nope(); return false; }
  G.money -= cost;
  return true;
}
function changed() { bumpVis(); G.lightDirty = true; }

function actPlant(id, x, y) {
  const sp = SP[id], t = tileAt(x, y), own = (G.inv[id] || 0) > 0;
  if (sp.tier > unlockedTier() && !own) { toast(L().locked(sp.tier), 'bad'); return false; }
  if (!canPlantHere(sp, t)) {
    if (!t || !t.own) toast(L().notYours, 'bad');
    else if (t.plant) toast(L().occupied, 'bad');
    else toast(sp.water === 'aquatic' ? L().needPond : t.t === 'water' ? L().notInWater : L().needBed, 'bad');
    Sound.sfx.nope(); return false;
  }
  // lo que hay en el semillero se planta gratis
  if (own) G.inv[id]--;
  else if (!spend(sp.price)) return false;
  const p = addPlant(id, x, y, { hp: 85, g: own ? Math.min(sp.start, 0.12) : undefined });
  p.fac = evaluate(sp, t, p, G.w, false); p.cond = p.fac.cond;
  G.stats.planted++;
  if (!G.herb[id]) G.herb[id] = 1;
  fxPuff(x + 0.5, y + 0.5, css(soilColor(t)));
  if (!own) fxFloat(x + 0.5, y + 0.5, '−' + money(sp.price), '#8a4a2a');
  Sound.sfx.plant();
  changed();
  return true;
}

function actWater(x, y, rad) {
  let n = 0;
  for (let j = y - rad; j <= y + rad; j++) for (let i = x - rad; i <= x + rad; i++) {
    if (Math.hypot(i - x, j - y) > rad + 0.3) continue;
    const t = tileAt(i, j);
    if (!t || !t.own || t.t === 'water' || t.t === 'house') continue;
    if (waterTile(t)) { n++; fxSplash(i + 0.5, j + 0.5); }
  }
  if (n) { G.stats.watered += n; Sound.sfx.water(); bumpVis(); }
  return n > 0;
}

function actPrune(p) {
  const sp = spOf(p);
  if (!sp.prune) { toast(L().noPrune, 'info'); return false; }
  if (!canPrune(p)) { toast(L().notPruneTime(L().seasonRange(sp.prune)), 'info'); return false; }
  p.prunedDay = G.day;
  G.stats.pruned = (G.stats.pruned || 0) + 1;
  if (sp.type !== 'vine') p.g = Math.max(0.85, p.g - 0.05);
  fxPuff(p.x + 0.5, p.y + 0.5, '#6f9a45'); fxFloat(p.x + 0.5, p.y + 0.5, L().pruned, '#3a6b35');
  Sound.sfx.care(); changed();
  return true;
}

// Juntar semillas, sacar esquejes o dividir la mata: van al semillero y se plantan gratis
function actPropagate(p) {
  const n = propCount(p), sp = spOf(p), how = propMethod(sp);
  if (!n) return false;
  G.inv[sp.id] = (G.inv[sp.id] || 0) + n;
  p.propYear = Math.floor(G.day / DAYS_YEAR);
  if (how === 'cutting') p.hp -= 8;
  if (how === 'division') p.hp -= 12;
  G.stats.propagated = (G.stats.propagated || 0) + n;
  fxSparkle(p.x + 0.5, p.y + 0.5, '#bfe6a0');
  toast(L().propDone(n, spName(sp), L().propK[how]), 'good');
  Sound.sfx.harvest(); changed();
  return true;
}

function actBuyPot(i) {
  const t = G.pots[i];
  if (!t || t.own || !spend(POT_PRICE)) return false;
  t.own = 1; t.moist = 0.5;
  Sound.sfx.build(); changed();
  return true;
}

function actWaterThirsty() {
  const list = thirstyPlants();
  if (!list.length) { toast(L().noneThirsty, 'info'); return false; }
  const cost = list.length * THIRSTY_PRICE;
  if (!spend(cost)) return false;
  G.today.water = (G.today.water || 0) + cost;
  for (const p of list) { const t = tileAt(p.x, p.y); waterTile(t, waterTarget(spOf(p)) - t.moist); fxSplash(p.x + 0.5, p.y + 0.5); }
  G.stats.watered += list.length;
  toast(L().thirstyDone(list.length, money(cost)), 'good');
  Sound.sfx.water(); bumpVis();
  return true;
}

function actCare(k, x, y) {
  const t = tileAt(x, y), c = CARE[k];
  if (!t || !t.own || t.t === 'house' || t.t === 'water' || t.t === 'path') { toast(L().careWhere, 'bad'); Sound.sfx.nope(); return false; }
  const p = t.plant;
  if ((k === 'spray' || k === 'cloth') && (!p || p.dead)) { toast(L().needPlant, 'bad'); Sound.sfx.nope(); return false; }
  if (k === 'spray' && !p.pests) { toast(L().noPests, 'info'); return false; }
  if (k === 'weed' && t.weeds < 0.1) return false;
  if (k === 'prune') return p && !p.dead ? actPrune(p) : (toast(L().needPlant, 'bad'), false);
  if (k === 'tray' && (!t.pot || t.tray)) return false;
  if (k === 'cloth' && p.cloth) { p.cloth = 0; Sound.sfx.click(); changed(); return true; } // quitar la manta es gratis
  if (!spend(c.cost)) return false;
  switch (k) {
    case 'compost': t.org = clamp(t.org + 0.22, 0, 1); t.fert = clamp(t.fert + 0.18, 0, 1); t.drain += (0.55 - t.drain) * 0.3; t.ph += (6.9 - t.ph) * 0.15; t.ph0 += (6.9 - t.ph0) * 0.05; break;
    case 'sand': t.drain = clamp(t.drain + 0.15, 0, 1); t.org = Math.max(0.02, t.org - 0.03); t.fert = Math.max(0, t.fert - 0.03); break;
    case 'peat': t.ph = clamp(t.ph - 0.35, 3.8, 9); t.ph0 = clamp(t.ph0 - 0.1, 4, 9); t.org = clamp(t.org + 0.25, 0, 1); t.drain += (0.42 - t.drain) * 0.2; t.fert = Math.max(0, t.fert - 0.02); break;
    case 'sulfur': t.ph = clamp(t.ph - 0.6, 3.8, 9); t.ph0 = clamp(t.ph0 - 0.15, 4, 9); break;
    case 'lime': t.ph = clamp(t.ph + 0.5, 3.8, 9); t.ph0 = clamp(t.ph0 + 0.12, 4, 9); break;
    case 'fert': t.fert = clamp(t.fert + 0.35, 0, 1); break;
    case 'mulch': t.mulch = 26; t.weeds = 0; break;
    case 'weed': t.weeds = 0; break;
    case 'spray': p.pests = 0; p.imm = 6; break;
    case 'cloth': p.cloth = 1; break;
    case 'tray': t.tray = 1; break;
  }
  G.stats.care = (G.stats.care || 0) + 1;
  fxPuff(x + 0.5, y + 0.5, { compost: '#5a3f28', sand: '#e0c890', peat: '#3f2c20', sulfur: '#f2e05a', lime: '#f4f4ee', fert: '#9fd0f0', mulch: '#a0703f', weed: '#6f9a45', spray: '#e8f4ff', cloth: '#ffffff' }[k]);
  if (c.cost) fxFloat(x + 0.5, y + 0.5, '−' + money(c.cost), '#8a4a2a');
  Sound.sfx.care();
  changed();
  return true;
}

// ---------- Construir ----------
function footprint(k, x, y) { const b = BUILD[k]; return { w: b.w || 1, h: b.h || 1 }; }
function canBuild(k, x, y) {
  const b = BUILD[k], { w, h } = footprint(k, x, y);
  if (b.tier && b.tier > unlockedTier()) return L().locked(b.tier);
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const t = tileAt(i, j);
    if (!t || !t.own) return L().notYours;
    if (t.t === 'house') return L().occupied;
    if (b.tile) {
      if (t.t === b.tile) return L().already;
      if (t.plant || t.obj || t.gh) return L().occupied;
      // la entrada desde la reja y la puerta de la casa quedan libres para pasar
      if (b.tile !== 'path' && b.tile !== 'grass' && i === GATE_X && (j === GH - 1 || j === HOUSE.y1)) return L().occupied;
      continue;
    }
    if (k === 'shade') { if (t.shade) return L().already; continue; }
    if (k === 'drip') { if (t.drip) return L().already; if (t.t !== 'bed') return L().dripWhere; continue; }
    if (i === GATE_X && (j === GH - 1 || j === HOUSE.y1)) return L().occupied;
    if (t.plant || t.obj || t.gh || (b.overhead && t.over) || t.t === 'water') return L().occupied;
    if (k === 'greenhouse' && t.over) return L().occupied;
  }
  return null;
}
function actBuild(k, x, y) {
  const b = BUILD[k], err = canBuild(k, x, y);
  if (err) { if (err !== L().already) { toast(err, 'bad'); Sound.sfx.nope(); } return false; }
  if (!spend(b.cost)) return false;
  if (b.tile) {
    const t = tileAt(x, y);
    t.t = b.tile; t.weeds = 0;
    if (b.tile === 'bed') { G.stats.beds = (G.stats.beds || 0) + 1; t.moist = Math.max(t.moist, 0.35); }
    if (b.tile === 'water') t.moist = 1;
    if (b.tile !== 'bed') t.mulch = 0;
  } else if (k === 'shade') tileAt(x, y).shade = 1;
  else if (k === 'drip') tileAt(x, y).drip = 1;
  else addStruct(k, x, y);
  const { w, h } = footprint(k, x, y);
  fxPuff(x + w / 2, y + h / 2, b.tile === 'water' ? '#6aa8c0' : '#c8b89a');
  if (b.cost >= 10) fxFloat(x + w / 2, y + h / 2, '−' + money(b.cost), '#8a4a2a');
  Sound.sfx.build();
  changed();
  return true;
}

// Quitar: plantas (las secas se vuelven compost), malezas, estructuras
function actRemove(x, y) {
  const t = tileAt(x, y);
  if (!t || !t.own) return false;
  if (t.plant) {
    const p = t.plant;
    if (p.old && spOf(p).walnut && !confirm(L().confirmWalnut)) return false;
    if (p.dead) { t.org = clamp(t.org + 0.06, 0, 1); t.fert = clamp(t.fert + 0.05, 0, 1); }
    removePlant(p); fxPuff(x + 0.5, y + 0.5, '#7a5a3a'); Sound.sfx.dig();
    if (R.sel === p) R.sel = null;
    changed(); return true;
  }
  if (t.weeds > 0.1) { t.weeds = 0; Sound.sfx.dig(); changed(); return true; }
  const st = structAt(x, y);
  if (st) {
    if (st.k === 'greenhouse' && G.plants.some(p => tileAt(p.x, p.y).gh === st.id)) { toast(L().emptyFirst, 'bad'); return false; }
    removeStruct(st);
    const back = Math.floor(BUILD[st.k].cost * 0.5);
    G.money += back; fxFloat(x + 0.5, y + 0.5, '+' + money(back), '#2f6a2a');
    Sound.sfx.dig(); changed(); return true;
  }
  if (t.shade) { t.shade = 0; changed(); return true; }
  if (t.drip) { t.drip = 0; Sound.sfx.dig(); changed(); return true; }
  if (t.t === 'bed' || t.t === 'path' || t.t === 'water') { t.t = 'grass'; t.mulch = 0; Sound.sfx.dig(); changed(); return true; }
  return false;
}

// ---------- Cosechar ----------
function canHarvest(p) {
  const sp = spOf(p);
  if (!sp.harv || p.dead || !tileAt(p.x, p.y).own) return false;
  const k = sp.harv[0];
  if (k === 'fruit') return p.fruit >= 1;
  if (k === 'flower') return p.bloom >= 0.6 && !p.cut;
  return p.g >= 1 && p.hp > 35 && !p.dorm && !p.cut;
}
function actHarvest(p) {
  if (!canHarvest(p)) return false;
  const sp = spOf(p), [k, val, again] = sp.harv, year = Math.floor(G.day / DAYS_YEAR);
  const q = 0.5 + 0.5 * p.hp / 100, earn = Math.max(1, Math.round(val * q));
  G.money += earn; G.today.income += earn; G.stats.harvests++; G.stats.income += earn; G.today.harvest += earn;
  if (k === 'fruit') { p.fruit = 0; if (!again) { if (sp.life === 'annual') killPlant(p, 'cycle'); } }
  else if (k === 'flower') { p.bloom = 0.05; p.cut = 2; if (!again) p.cutYear = year; }
  else if (again) { p.g = 0.72; p.cut = 1; }
  else removePlant(p);
  registerHerb(p);
  fxSparkle(p.x + 0.5, p.y + 0.5); fxFloat(p.x + 0.5, p.y + 0.5, '+' + money(earn), '#2f6a2a');
  Sound.sfx.harvest();
  orderProgress(sp.id);
  changed();
  return true;
}

// ---------- Trasplantar: en reposo casi no sufre; en pleno crecimiento, sí ----------
function actTransplant(p, x, y) {
  const t = tileAt(x, y), sp = spOf(p);
  if (!canPlantHere(sp, t)) { toast(t && t.own ? (t.plant ? L().occupied : L().needBed) : L().notYours, 'bad'); Sound.sfx.nope(); return false; }
  const from = tileAt(p.x, p.y);
  from.plant = null;
  p.x = x; p.y = y; t.plant = p;
  const shock = p.dorm ? 3 : isTree(sp) ? 30 : 15;
  p.hp = Math.max(5, p.hp - shock);
  p.fac = evaluate(sp, t, p, G.w, false); p.cond = p.fac.cond;
  G.stats.moved = (G.stats.moved || 0) + 1;
  fxPuff(x + 0.5, y + 0.5, css(soilColor(t)));
  Sound.sfx.plant();
  toast(p.dorm ? L().movedDorm : L().moved(shock), 'info');
  changed();
  return true;
}

// ---------- Terreno ----------
function actBuyParcel(i) {
  const pc = PARCELS[i];
  if (G.owned[i]) return false;
  if (!spend(pc.price)) return false;
  G.owned[i] = true;
  for (const t of G.tiles) if (t.parcel === i) t.own = true;
  for (const p of G.plants) if (tileAt(p.x, p.y).parcel === i && !G.herb[p.sp]) G.herb[p.sp] = 1;
  G.stats.parcels = (G.stats.parcels || 0) + 1;
  fxSparkle((pc.x0 + pc.x1) / 2, (pc.y0 + pc.y1) / 2, '#fff2a0');
  Sound.sfx.fanfare();
  toast(L().parcelBought(L().parcels[pc.soil]), 'good');
  changed();
  return true;
}

// ---------- Objetivos (guían al principio y dan metas después) ----------
const blooming = (f) => G.plants.some(p => !p.dead && p.bloom > 0.5 && tileAt(p.x, p.y).own && f(p));
const herbCount = () => Object.values(G.herb).filter(v => v === 2).length;
const GOALS = [
  { id: 'lens', reward: 20, done: () => G.stats.lens > 0 },
  { id: 'plant', reward: 30, done: () => G.stats.planted >= 3 },
  { id: 'water', reward: 15, done: () => G.stats.watered >= 5 },
  { id: 'open', reward: 25, done: () => G.open },
  { id: 'rose', reward: 60, done: () => G.plants.some(p => p.sp === 'rose' && !p.dead && tileAt(p.x, p.y).sun >= 5.5 && p.hp >= 75) },
  { id: 'beds', reward: 40, done: () => (G.stats.beds || 0) >= 6 },
  { id: 'bloom5', reward: 80, done: () => herbCount() >= 5 },
  { id: 'visitors', reward: 80, done: () => G.stats.visitors >= 30 },
  { id: 'harvest', reward: 60, done: () => G.stats.harvests >= 10 },
  { id: 'star2', reward: 120, done: () => G.repMax >= 2 },
  { id: 'parcel', reward: 150, done: () => G.owned.filter(Boolean).length >= 2 },
  { id: 'prune', reward: 60, done: () => (G.stats.pruned || 0) >= 3 },
  { id: 'seeds', reward: 100, done: () => (G.stats.propagated || 0) >= 10 },
  { id: 'sisters', reward: 120, done: () => G.plants.some(p => p.sp === 'corn' && !p.dead && p.fac && p.fac.compNames.includes('bean') && p.fac.compNames.includes('pumpkin')) },
  { id: 'contest', reward: 150, done: () => (G.stats.contestBest || 9) <= 3 },
  { id: 'acid', reward: 150, done: () => blooming(p => spOf(p).ph[1] <= 6.0 && p.hp > 70) },
  { id: 'pond', reward: 150, done: () => blooming(p => p.sp === 'waterlily' || p.sp === 'lotus') },
  { id: 'blue', reward: 200, done: () => blooming(p => p.sp === 'hydrangea' && tileAt(p.x, p.y).ph < 5.5) },
  { id: 'greenhouse', reward: 200, done: () => G.structs.some(s => s.k === 'greenhouse') },
  { id: 'indoor', reward: 150, done: () => (G.pots || []).filter(t => t.plant && !t.plant.dead && t.plant.hp > 70 && t.plant.g > 0.5).length >= 4 },
  { id: 'winter', reward: 300, done: () => seasonOf(G.day % DAYS_YEAR) === 3 && G.plants.filter(p => p.bloom > 0.5 && !p.dead && tileAt(p.x, p.y).own).length >= 5 },
  { id: 'tropic', reward: 300, done: () => blooming(p => p.sp === 'orchid' || p.sp === 'anthurium') },
  { id: 'herb25', reward: 400, done: () => herbCount() >= 25 },
  { id: 'star4', reward: 500, done: () => G.repMax >= 4 },
  { id: 'copihue', reward: 500, done: () => blooming(p => p.sp === 'copihue') },
  { id: 'star5', reward: 1000, done: () => G.repMax >= 4.95 },
  { id: 'herbAll', reward: 2000, done: () => herbCount() >= SPECIES.length }
];
// Los objetivos se pueden cumplir en cualquier orden; el "actual" es el primero que falta
const OLD_GOAL_ORDER = ['lens', 'plant', 'water', 'open', 'rose', 'beds', 'bloom5', 'visitors', 'harvest', 'star2', 'parcel', 'acid', 'pond',
  'blue', 'greenhouse', 'winter', 'tropic', 'herb25', 'star4', 'copihue', 'star5', 'herbAll'];
const goalDone = gl => !!G.goalsDone[gl.id];
function checkGoals() {
  let n = 0;
  for (const gl of GOALS) {
    if (n >= 3 || goalDone(gl) || !gl.done()) continue;
    G.goalsDone[gl.id] = 1;
    G.money += gl.reward;
    toast(L().goalDone(L().goals[gl.id][0], money(gl.reward)), 'goal');
    Sound.sfx.fanfare();
    n++;
  }
  G.goal = GOALS.findIndex(gl => !goalDone(gl));
  if (G.goal < 0) G.goal = GOALS.length;
}

// ---------- Concurso de jardines: una vez al año, a fines de primavera ----------
const CONTEST_DAY = 8;
function contestScore() {
  const mine = G.plants.filter(p => !p.dead && tileAt(p.x, p.y).own && p.x < POT_X);
  const health = mine.length ? mine.reduce((a, p) => a + p.hp, 0) / mine.length / 100 : 0;
  return G.beauty * health * (1 + G.kinds * 0.01);
}
function judgeContest() {
  const year = Math.floor(G.day / DAYS_YEAR), score = contestScore();
  const th = [120, 300, 650].map(v => v * (1 + 0.3 * year));
  const place = score >= th[2] ? 1 : score >= th[1] ? 2 : score >= th[0] ? 3 : 0;
  if (!place) { news('contestNone', {}); return 0; }
  const prize = [0, 800, 400, 200][place];
  G.money += prize; G.stats.income += prize;
  G.rep = Math.min(5, G.rep + [0, 0.4, 0.25, 0.15][place]);
  G.stats.contestBest = Math.min(G.stats.contestBest || 9, place);
  news('contestWin', { place, prize: money(prize) });
  Sound.sfx.fanfare();
  return place;
}

// ---------- Encargos: florerías, restoranes y vecinos piden cosechas ----------
const CLIENTS = ['florist', 'restaurant', 'neighbor', 'market', 'wedding', 'school'];
function maybeNewOrder() {
  if (G.day < G.orderDay || G.orders.length >= 3) return;
  G.orderDay = G.day + 5 + Math.floor(Math.random() * 4);
  const pool = SPECIES.filter(s => s.harv && s.tier <= unlockedTier() && s.id !== 'walnut');
  if (!pool.length) return;
  // prefiere especies que el jugador ya conoce
  const known = pool.filter(s => G.herb[s.id]);
  const sp = pick(known.length && Math.random() < 0.7 ? known : pool);
  const n = sp.harv[0] === 'fruit' || sp.harv[0] === 'flower' ? 2 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 3);
  const client = sp.harv[0] === 'flower' ? pick(['florist', 'wedding', 'neighbor']) : pick(['restaurant', 'market', 'neighbor', 'school']);
  G.orders.push({ sp: sp.id, n, got: 0, reward: Math.round(sp.harv[1] * n * 2.4 + 20), until: G.day + 10, client, seen: false });
  news('order', { sp: sp.id, n });
}
function orderProgress(id) {
  for (const o of G.orders) {
    if (o.sp !== id || o.got >= o.n) continue;
    o.got++;
    if (o.got >= o.n) {
      G.money += o.reward; G.stats.orders = (G.stats.orders || 0) + 1;
      G.rep = Math.min(5, G.rep + 0.08);
      toast(L().orderDone(L().clients[o.client], money(o.reward)), 'goal');
      Sound.sfx.fanfare();
    }
    break;
  }
  G.orders = G.orders.filter(o => o.got < o.n);
}
function expireOrders() {
  const before = G.orders.length;
  G.orders = G.orders.filter(o => o.until >= G.day);
  if (G.orders.length < before) news('orderLost', {});
}
