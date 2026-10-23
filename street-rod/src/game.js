// ===== La partida: dinero, días, autos, diario, rivales, El Rey y guardado =====
const SAVE_KEY = 'streetrod63', START_MONEY = 750, MAX_CARS = 3;
const SUMMER_DAYS = 81;              // del viernes 14 de junio al lunes 2 de septiembre de 1963
const OPEN_MIN = 0, CLOSE_MIN = 270; // el drive-in abre a las 20:00 y cierra a las 00:30
let S = null;                        // el estado de la partida

const dateOf = day => new Date(1963, 5, 14 + day);
const isSaturday = day => dateOf(day).getDay() === 6;
const activeCar = () => (S && S.cars.find(c => c.id === S.active)) || null;
const clockText = min => { const h = 20 + Math.floor(min / 60), m = min % 60; return `${h % 24}:${String(m).padStart(2, '0')}`; };

function newGame(name, seed = Math.floor(Math.random() * 1e9)) {
  S = {
    v: 1, name: name || L().defaultName, seed, roadSeed: seed % 100000 + 11, day: 0, money: START_MONEY,
    cars: [], active: null, bench: [], wins: 0, losses: 0, rep: 0, rivals: {}, news: [], night: null,
    kingBeaten: false, kingRaces: 0, over: null, keepPlaying: false, history: []
  };
  for (const r of RIVALS) S.rivals[r.id] = { w: 0, l: 0, car: null, away: 0 };
  makePaper();
  return S;
}

// ----- Guardado -----
function saveGame() {
  if (!S) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* sin almacenamiento */ }
}
function loadGame() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (s && s.v === 1 && Array.isArray(s.cars)) { S = s; return true; }
  } catch (e) { /* guardado roto */ }
  return false;
}
const hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };

// ----- El diario de cada mañana -----
function randomUsedCar(R, model) {
  const M = MODELS[model];
  const body = clamp(0.45 + R() * 0.6, 0.4, 1), ec = clamp(0.4 + R() * 0.65, 0.35, 1);
  const car = makeCar(model, { color: rpick(R, M.colors), body, ec, tc: clamp(0.5 + R() * 0.55, 0.4, 1), tread: 0.35 + R() * 0.6, fuel: Math.round(2 + R() * 6) });
  // a veces el dueño anterior le hizo cosas
  const mount = engineMount(car.p.engine.k);
  if (R() < 0.3 && ENGINES[car.p.engine.k].kind !== '8') {
    car.p.intake = makePart('intake', ENGINES[car.p.engine.k].kind === 'F' ? '2x2' : '3x2', { m: mount });
    const n = INTAKES[car.p.intake.k].n;
    for (let i = 0; i < 3; i++) { car.p['carb' + i] = i < n ? makePart('carb', '2') : null; car.tight['carb' + i] = i < n ? 4 : 0; }
  } else if (R() < 0.25 && ENGINES[car.p.engine.k].kind === '8' && car.p.intake.k !== '2x4') {
    car.p.intake = makePart('intake', '2x4', { m: mount });
    for (let i = 0; i < 3; i++) { car.p['carb' + i] = i < 2 ? makePart('carb', '4') : null; car.tight['carb' + i] = i < 2 ? 4 : 0; }
  }
  if (R() < 0.2) car.p.exhaust = makePart('exhaust', 'hdr', { m: mount });
  if (R() < 0.15) { car.mods.wheels = rpick(R, ['moons', 'mags']); }
  if (R() < 0.1) car.mods.flames = 1;
  if (R() < 0.12) car.mods.lowered = 1;
  return car;
}
function makePaper() {
  const R = rng(S.seed * 7 + S.day * 131 + 5);
  const listings = [];
  // siempre hay un cacharro barato, para no quedarse sin auto
  const cheap = rpick(R, ['chevy49', 'ford40', 'falcon60', 'valiant61', 'olds50']);
  const junker = randomUsedCar(R, cheap);
  junker.body = 0.42 + R() * 0.12; junker.p.engine.c = 0.4 + R() * 0.15;
  listings.push(junker);
  const pool = SALE_MODELS.filter(k => k !== cheap);
  for (let i = 0; i < 5; i++) {
    // los autos caros aparecen menos
    let model = rpick(R, pool);
    if (MODELS[model].price > 2000 && R() < 0.4) model = rpick(R, pool);
    listings.push(randomUsedCar(R, model));
  }
  const ads = listings.map((car, i) => ({
    // el primero es el cacharro: barato aunque sea un buen modelo
    car, price: i ? Math.max(120, Math.round(carValue(car) * (0.88 + R() * 0.3) / 5) * 5) : Math.round((180 + R() * 220) / 5) * 5,
    phone: `${rpick(R, EXCHANGES)} ${2 + Math.floor(R() * 7)}-${1000 + Math.floor(R() * 9000)}`, sold: false
  }));
  // repuestos usados
  const parts = [];
  for (let i = 0; i < 5; i++) {
    const p = randomPart(R);
    p.c = Math.round((0.5 + R() * 0.4) * 100) / 100;
    parts.push({ part: p, price: Math.max(5, Math.round(partPrice(p) * p.c * 0.65)), sold: false });
  }
  S.paper = { day: S.day, ads, parts, headlines: makeHeadlines(R) };
}
function randomPart(R) {
  const t = rpick(R, ['engine', 'engine', 'intake', 'intake', 'carb', 'carb', 'cam', 'exhaust', 'trans', 'axle', 'tires']);
  const fam = rpick(R, FAMS);
  switch (t) {
    case 'engine': return makePart('engine', rpick(R, Object.keys(ENGINES)));
    case 'intake': { const m = rpick(R, MOUNTS); const ks = Object.keys(INTAKES).filter(k => intakeFits(k, m)); return makePart('intake', rpick(R, ks), { m }); }
    case 'carb': return makePart('carb', rpick(R, ['2', '2', '4', '4', '4R']));
    case 'cam': return makePart('cam', rpick(R, ['r34', 'full']));
    case 'exhaust': return makePart('exhaust', 'hdr', { m: rpick(R, MOUNTS) });
    case 'trans': return makePart('trans', rpick(R, Object.keys(TRANS)), { f: fam });
    case 'axle': return makePart('axle', rpick(R, Object.keys(AXLES)));
    default: return makePart('tires', rpick(R, ['std', 'ww', 'wide', 'slick']));
  }
}
function makeHeadlines(R) {
  const H = L().paper.headlines, out = [...S.news];
  S.news = [];
  if (S.wins >= KING_WINS && !S.kingBeaten && !out.length) out.push({ k: 'king' });
  if (out.length < 2 && R() < 0.4) out.push({ k: 'rumor' });
  if (R() < 0.25) out.push({ k: 'police' });
  out.push({ k: 'weather', i: Math.floor(R() * H.weather.length) });
  out.push({ k: 'local', i: Math.floor(R() * H.local.length) });
  return out.slice(0, 4);
}
function headlineText(h) {
  const H = L().paper.headlines;
  switch (h.k) {
    case 'win': return H.win(S.name, h.r);
    case 'lose': return H.lose(S.name, h.r);
    case 'king': return H.king(S.name);
    case 'rumor': return H.rumor;
    case 'police': return H.police;
    case 'weather': return H.weather[h.i];
    default: return H.local[h.i];
  }
}

// Todas las piezas nuevas del speed shop (si only, solo las que calzan en tu auto)
function shopCatalog(car, only) {
  const out = [];
  const fam = car ? MODELS[car.model].fam : null, mount = car && car.p.engine ? engineMount(car.p.engine.k) : null;
  for (const k in ENGINES) if (!only || ENGINES[k].fam === fam) out.push(makePart('engine', k));
  for (const m of only ? (mount ? [mount] : []) : MOUNTS) for (const k in INTAKES) if (intakeFits(k, m)) out.push(makePart('intake', k, { m }));
  for (const k in CARBS) out.push(makePart('carb', k));
  for (const k of ['r34', 'full']) out.push(makePart('cam', k));
  for (const m of only ? (mount ? [mount] : []) : MOUNTS) out.push(makePart('exhaust', 'hdr', { m }));
  for (const f of only ? [fam] : FAMS) for (const k in TRANS) out.push(makePart('trans', k, { f }));
  for (const k in AXLES) out.push(makePart('axle', k));
  for (const k in TIRES) out.push(makePart('tires', k));
  return out;
}
function partName(p) {
  const P = L().parts;
  const mountName = m => `${FAM_NAME[m.replace(/[6F8]$/, '')]} ${P.kind[m.slice(-1)]}`;
  switch (p.t) {
    case 'engine': return ENGINES[p.k].name;
    case 'intake': return `${P.intakeName(p.k)} · ${mountName(p.m)}`;
    case 'carb': return P.carbName(p.k);
    case 'cam': return P.camName(p.k);
    case 'exhaust': return `${P.exhName(p.k)} · ${mountName(p.m)}`;
    case 'trans': return `${TRANS_NAME[p.f][p.k]} · ${P.transType[p.k]}`;
    case 'axle': return P.axleName(p.k);
    case 'tires': return P.tireName[p.k];
  }
  return '?';
}
const carName = car => `${MODELS[car.model].name} '${String(MODELS[car.model].year).slice(2)}`;

// ----- Comprar y vender -----
function buyAd(i) {
  const ad = S.paper.ads[i];
  if (!ad || ad.sold) return 'gone';
  if (S.cars.length >= MAX_CARS) return 'noRoom';
  if (S.money < ad.price) return 'noMoney';
  S.money -= ad.price; ad.sold = true;
  S.cars.push(ad.car);
  if (!activeCar()) S.active = ad.car.id;
  saveGame();
  return '';
}
function buyPart(part, price) {
  if (S.money < price) return 'noMoney';
  S.money -= price;
  const p = Object.assign({}, part, { id: newId('p') });
  S.bench.push(p);
  saveGame();
  return '';
}
const carOffer = car => Math.round(carValue(car) * 0.8);
const partOffer = p => Math.max(1, Math.round(partValue(p) * 0.5));
function sellCar(id) {
  const i = S.cars.findIndex(c => c.id === id);
  if (i < 0) return 0;
  const m = carOffer(S.cars[i]);
  S.money += m; S.cars.splice(i, 1);
  if (S.active === id) S.active = S.cars.length ? S.cars[0].id : null;
  checkBroke(); saveGame();
  return m;
}
function junkCar(id) {
  const i = S.cars.findIndex(c => c.id === id);
  if (i < 0) return 0;
  const m = junkValue(S.cars[i]);
  S.money += m; S.cars.splice(i, 1);
  if (S.active === id) S.active = S.cars.length ? S.cars[0].id : null;
  checkBroke(); saveGame();
  return m;
}
function sellPart(id) {
  const i = S.bench.findIndex(p => p.id === id);
  if (i < 0) return 0;
  const m = partOffer(S.bench[i]);
  S.money += m; S.bench.splice(i, 1); saveGame();
  return m;
}

// ----- El taller: pernos, sacar y poner piezas -----
function loosenBolt(car, sl) {
  if (!car.p[sl] || (car.tight[sl] || 0) <= 0) return false;
  if (blockers(car, sl).length) return false;
  car.tight[sl]--; return true;
}
function tightenBolt(car, sl) {
  if (!car.p[sl] || (car.tight[sl] || 0) >= SLOT_INFO[sl].bolts) return false;
  car.tight[sl]++; return true;
}
// Saca una pieza con todos sus pernos sueltos y la deja en el banco
function removePart(car, sl) {
  const p = car.p[sl];
  if (!p || car.tight[sl] > 0 || blockers(car, sl).length) return false;
  car.p[sl] = null; car.tight[sl] = 0;
  S.bench.push(p);
  _etCache.clear();
  return true;
}
// Pone una pieza del banco en su lugar (queda con los pernos sueltos)
function installPart(car, partId) {
  const i = S.bench.findIndex(p => p.id === partId);
  if (i < 0) return { why: 'gone' };
  const r = slotFor(car, S.bench[i]);
  if (!r.sl) return r;
  car.p[r.sl] = S.bench[i]; car.tight[r.sl] = 0;
  S.bench.splice(i, 1);
  return r;
}

// ----- Servicios -----
const engineRebuildCost = car => (car.p.engine ? Math.round(15 + ENGINES[car.p.engine.k].price * (1 - car.p.engine.c) * 0.55) : 0);
const transRebuildCost = car => (car.p.trans ? Math.round(10 + TRANS[car.p.trans.k].price * (1 - car.p.trans.c) * 0.6) : 0);
function pay(m) { if (S.money < m) return false; S.money -= m; saveGame(); return true; }
function rebuildEngine(car) { const c = engineRebuildCost(car); if (!pay(c)) return false; car.p.engine.c = 1; _etCache.clear(); saveGame(); return true; }
function rebuildTrans(car) { const c = transRebuildCost(car); if (!pay(c)) return false; car.p.trans.c = 1; saveGame(); return true; }
function fixBody(car) {
  if (!canRepair(car)) return false;
  const c = repairCost(car); if (!pay(c)) return false;
  car.body = 1; car.repairs++; saveGame(); return true;
}
const paintCost = color => ((paintOf(color) || {}).candy ? 90 : 45);
function paintCar(car, color) { if (car.color === color || !pay(paintCost(color))) return false; car.color = color; saveGame(); return true; }
function toggleMod(car, k) {
  if (car.mods[k]) { car.mods[k] = 0; _etCache.clear(); saveGame(); return true; }
  if (!pay(MODS[k].price)) return false;
  car.mods[k] = 1; _etCache.clear(); saveGame(); return true;
}
function setWheels(car, k) { if (car.mods.wheels === k || !pay(WHEELS[k])) return false; car.mods.wheels = k; saveGame(); return true; }
function buyGas(car, gal) {
  gal = Math.min(gal, TANK - car.fuel);
  const cost = gal * GAS_PRICE;
  if (gal <= 0 || S.money < cost) return 0;
  S.money -= cost; car.fuel += gal;
  return gal;
}

// ----- Los rivales -----
const rivalById = id => (id === 'king' ? KING : RIVALS.find(r => r.id === id));
// Nombre con apodo: Eddie "Pecas", o "Gato" Morales cuando el apodo va primero
const rivalName = r => (typeof r.name === 'object' ? r.name[LANG] : !r.nick ? r.name : r.nf ? `"${r.nick[LANG]}" ${r.name}` : `${r.name} "${r.nick[LANG]}"`);

// Pasos para preparar un auto, de lo más barato a lo más caro
function upgradeSteps(car) {
  const M = MODELS[car.model], fam = M.fam;
  const big = Object.keys(ENGINES).filter(k => ENGINES[k].fam === fam && ENGINES[k].kind === '8').sort((a, b) => ENGINES[a].hp - ENGINES[b].hp);
  const steps = [];
  steps.push(c => { c.timing = 10; });
  steps.push(c => { setSpec(c, { exhaust: 'hdr' }); });
  steps.push(c => { const k = ENGINES[c.p.engine.k].kind; setSpec(c, { intake: k === '8' ? '2x4' : k === 'F' ? '3x2' : '3x2' }); });
  steps.push(c => { setSpec(c, { cam: 'r34' }); });
  steps.push(c => { setSpec(c, { tires: 'wide', axle: '3.90' }); });
  steps.push(c => { setSpec(c, { trans: 'man4' }); });
  for (const e of big) steps.push(c => { if (ENGINES[e].hp > ENGINES[c.p.engine.k].hp || ENGINES[c.p.engine.k].kind !== '8') setSpec(c, { engine: e, intake: '2x4', exhaust: 'hdr', cam: 'r34' }); });
  steps.push(c => { setSpec(c, { cam: 'full', axle: '4.11', trans: 'man4cr' }); });
  steps.push(c => { setSpec(c, { intake: 'race', carbs: ['4R', '4R'], tires: 'slick' }); });
  return steps;
}
// Cambia piezas de un auto ya armado (para los rivales: sin pernos ni banco)
function setSpec(car, sp) {
  const fam = MODELS[car.model].fam;
  if (sp.engine) { car.p.engine = makePart('engine', sp.engine); }
  const mount = engineMount(car.p.engine.k), kind = ENGINES[car.p.engine.k].kind;
  if (sp.intake || sp.engine) {
    let ik = sp.intake || (kind === '8' ? '1x4' : '1x2');
    if (!intakeFits(ik, mount)) ik = kind === '8' ? '2x4' : '3x2';
    if (!intakeFits(ik, mount)) ik = '1x2';
    car.p.intake = makePart('intake', ik, { m: mount });
    const n = INTAKES[ik].n;
    for (let i = 0; i < 3; i++) car.p['carb' + i] = i < n ? makePart('carb', (sp.carbs && sp.carbs[i]) || INTAKES[ik].carb) : null;
  }
  if (sp.exhaust || sp.engine) car.p.exhaust = makePart('exhaust', sp.exhaust || 'iron', { m: mount });
  if (sp.cam) car.p.cam = makePart('cam', sp.cam);
  if (sp.trans) car.p.trans = makePart('trans', sp.trans, { f: fam });
  if (sp.axle) car.p.axle = makePart('axle', sp.axle);
  if (sp.tires) car.p.tires = makePart('tires', sp.tires);
  for (const sl of SLOTS) car.tight[sl] = car.p[sl] ? SLOT_INFO[sl].bolts : 0;
}
// Arma el auto de un rival para que haga más o menos el tiempo pedido en el cuarto de milla
function makeRivalCar(r, target, R = Math.random) {
  const models = SALE_MODELS.filter(k => MODELS[k].fam === r.fam);
  models.sort((a, b) => carET(makeCar(b)).et - carET(makeCar(a)).et);   // del más lento al más rápido
  // el modelo más rápido que todavía sea más lento que el objetivo (o el más lento de todos)
  let pickModel = models[0];
  for (const k of models) if (carET(makeCar(k)).et >= target - 0.2) pickModel = k;
  if (R() < 0.3) { const alt = models.filter(k => carET(makeCar(k)).et >= target - 0.2); if (alt.length) pickModel = alt[Math.floor(R() * alt.length)]; }
  // va preparando el auto paso a paso y se queda con la versión que más se acerca al tiempo pedido
  let car = makeCar(pickModel, { color: rpick(R, MODELS[pickModel].colors), fuel: TANK });
  let best = JSON.stringify(car), bestErr = Math.abs(carET(car).et - target);
  for (const step of upgradeSteps(car)) {
    if (carET(car).et <= target) break;
    step(car);
    const err = Math.abs(carET(car).et - target);
    if (err < bestErr) { bestErr = err; best = JSON.stringify(car); }
  }
  car = JSON.parse(best);
  if (R() < 0.35) car.mods.wheels = rpick(R, ['moons', 'mags']);
  if (R() < 0.25) car.mods.flames = 1;
  if (R() < 0.3) car.mods.lowered = 1;
  if (R() < 0.2) car.mods.pinstripe = 1;
  return car;
}
function playerET() { const c = activeCar(); return c ? carET(c).et : 20; }

// Rivales disponibles esta noche (los más bravos aparecen cuando ya ganaste varias)
function nightQueue() {
  const R = rng(S.seed * 3 + S.day * 977 + 1);
  const avail = RIVALS.filter(r => (r.tier || 0) <= S.wins && S.rivals[r.id].away <= S.day);
  const q = [];
  const pool = avail.slice();
  while (q.length < 6 && pool.length) q.push(pool.splice(Math.floor(R() * pool.length), 1)[0].id);
  if (isSaturday(S.day) && S.wins >= KING_WINS && !S.kingBeaten) q.splice(1 + Math.floor(R() * 2), 0, 'king');
  return q;
}
function rivalCar(id) {
  if (id === 'king') return buildCar(KING.car);
  const r = rivalById(id), st = S.rivals[id];
  const target = clamp(playerET() + r.edge + (Math.random() - 0.5) * 0.5, 12.6, 23);
  // si tu auto cambió mucho, el rival también se prepara (o se busca otro auto)
  if (!st.car || !carRuns(st.car) || Math.abs(carET(st.car).et - target) > 1.1) st.car = makeRivalCar(r, target);
  return st.car;
}

// ----- La noche en el drive-in -----
function goDiner() {
  const car = activeCar();
  if (!car || !carRuns(car)) return 'noCar';
  if (car.fuel < 0.6) return 'fuel';
  car.fuel = Math.max(0, car.fuel - 0.5 * ENGINES[car.p.engine.k].ci / 300);
  S.night = { min: OPEN_MIN, queue: nightQueue(), cur: null, raced: [] };
  saveGame();
  return '';
}
function nextRival() {
  const N = S.night;
  if (!N) return null;
  N.min += N.cur ? 15 : 5;
  N.cur = null;
  while (N.queue.length && N.min < CLOSE_MIN) {
    const id = N.queue.shift();
    if (N.raced.includes(id)) continue;
    N.cur = { id, car: rivalCar(id), line: Math.floor(Math.random() * 6) };
    return N.cur;
  }
  return null;
}
// ¿El rival acepta? Devuelve '' si sí, o el tipo de excusa
function rivalAnswer(id, type, bet) {
  if (id === 'king') return '';
  const r = rivalById(id), car = activeCar(), rc = S.rivals[id].car;
  if (bet !== 'pinks' && bet > S.money) return 'broke';
  const edge = playerET() - carET(rc).et;            // positivo: el rival es más rápido
  const conf = edge + r.skill * 0.6 - 0.45 + (Math.random() - 0.5) * 0.5;
  if (bet === 'pinks') {
    if (type !== 'road') return 'noPinks';
    if (carValue(car) < carValue(rc) * 0.45) return 'noPinks';
    return conf > 0.35 ? '' : 'noPinks';
  }
  const need = { 0: -9, 10: -1.6, 25: -1.3, 50: -0.8, 100: -0.3 }[bet] ?? -1;
  return conf > need ? '' : bet >= 50 ? 'noMoney' : 'scared';
}
function raceOptions(id, type, bet) {
  const r = rivalById(id);
  return {
    type, bet, car: activeCar(), seed: type === 'road' ? S.roadSeed : S.seed % 997 + S.day,
    rival: { id, name: rivalName(r), look: r.look, car: S.night.cur.car, skill: r.skill, king: id === 'king' },
    police: id === 'king' ? 0 : 0.28
  };
}

// Aplica lo que pasó en la carrera. Devuelve un resumen para la pantalla de resultados.
function applyResult(o, res) {
  const car = o.car, out = { res, lines: [], money: 0, carWon: null, carLost: null, crash: false };
  const r = rivalById(o.rival.id), rec = S.rivals[o.rival.id];
  const betMoney = o.bet === 'pinks' ? 0 : o.bet;
  // desgaste del auto
  if (car.p.engine) car.p.engine.c = res.blown ? 0 : clamp(car.p.engine.c - res.engineDmg * 0.55 - 0.008 - (car.timing > 10 ? (car.timing - 10) * 0.006 : 0), 0, 1);
  if (car.p.trans) car.p.trans.c = res.broken ? 0 : clamp(car.p.trans.c - res.transDmg * 0.6 - 0.004, 0, 1);
  if (car.p.tires) car.p.tires.c = clamp(car.p.tires.c - res.tread, 0, 1);
  car.fuel = Math.max(0, car.fuel - res.fuel);
  if (res.body) { car.body = clamp(car.body - res.body, 0, 1); out.crash = true; }
  if (res.blown) out.lines.push(L().result.blown); else if (res.engineDmg > 0.25) out.lines.push(L().result.engineHurt);
  if (res.broken) out.lines.push(L().result.broken); else if (res.transDmg > 0.2) out.lines.push(L().result.transHurt);
  _etCache.clear();
  if (res.outcome === 'win') {
    S.wins++; S.rep += { 0: 1, 10: 2, 25: 2, 50: 3, 100: 4 }[o.bet] || 6;
    if (rec) rec.l++;
    S.money += betMoney; out.money = betMoney;
    if (o.bet === 'pinks') {
      const won = o.rival.car;
      won.id = newId('c'); won.fuel = Math.max(won.fuel, 3);
      if (S.cars.length < MAX_CARS) { S.cars.push(won); out.carWon = won; }
      else { const m = carOffer(won); S.money += m; out.carWon = won; out.autoSold = m; }
      if (rec) { rec.car = null; rec.away = S.day + 6; }
      if (o.rival.id === 'king') { S.kingBeaten = true; S.over = 'king'; }
    }
    if (o.rival.id !== 'king' && (o.bet === 'pinks' || o.bet >= 50 || (r.tier || 0) >= 3)) S.news.push({ k: 'win', r: rivalName(r) });
  } else if (res.outcome === 'lose') {
    S.losses++;
    if (rec) rec.w++;
    if (o.rival.id === 'king') S.kingRaces++;
    S.money -= betMoney; out.money = -betMoney;
    if (o.bet === 'pinks') {
      out.carLost = car;
      S.cars = S.cars.filter(c => c.id !== car.id);
      S.active = S.cars.length ? S.cars[0].id : null;
    }
  } else if (res.fine) {
    out.fine = res.fine;
    if (S.money >= res.fine) S.money -= res.fine;
    else { S.money = 0; out.jail = true; S.day += 4; }   // endNight suma el quinto día
  }
  if (S.night) { S.night.min += 40; S.night.raced.push(o.rival.id); S.night.cur = null; }
  S.history.push({ d: S.day, r: o.rival.id, t: o.type, b: o.bet, o: res.outcome });
  if (S.history.length > 60) S.history.shift();
  checkBroke();
  saveGame();
  return out;
}

// ----- Pasar los días -----
function endNight() {
  S.night = null;
  S.day++;
  if (S.day >= SUMMER_DAYS && !S.over) S.over = S.kingBeaten ? 'king' : 'summer';
  if (!S.over || S.keepPlaying) makePaper();
  saveGame();
}
// Sin auto y sin plata para el auto más barato del diario (contando lo que darían por las piezas sueltas): se acabó
function checkBroke() {
  if (S.over || S.cars.length) return;
  const cheapest = S.paper ? Math.min(...S.paper.ads.filter(a => !a.sold).map(a => a.price), 400) : 200;
  const parts = S.bench.reduce((a, p) => a + partOffer(p), 0);
  if (S.money + parts < cheapest) S.over = 'broke';
}
const kingNeeds = () => Math.max(0, KING_WINS - S.wins);
