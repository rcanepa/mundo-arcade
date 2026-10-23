// ===== La partida: dinero, días, autos, repuestos, diario, regateo, rivales, El Rey y guardado =====
const SAVE_KEY = 'streetrod63', SAVES_KEY = 'streetrod63.saves', FAME_KEY = 'streetrod63.fame';
const START_MONEY = 750, MAX_CARS = 4, SUMMER_DAYS = 79;   // del domingo 16 de junio al martes 3 de septiembre
const OPEN_MIN = 0, CLOSE_MIN = 300;                        // Bob's abre a las 20:00 y cierra a la 1:00
let S = null;

const dateOf = day => new Date(1963, 5, 16 + day);
const activeCar = () => (S && S.cars.find(c => c.id === S.active)) || null;
const clockText = min => { const h = 20 + Math.floor(min / 60), m = min % 60; return `${h % 24}:${String(m).padStart(2, '0')}`; };
const hoursPlayed = () => S.day * 24 + (S.night ? 20 + Math.floor(S.night.min / 60) : 10);

function newGame(name, seed = Math.floor(Math.random() * 1e9)) {
  S = {
    v: 3, name: name || 'JOHNNY', seed, roadSeed: seed % 100000 + 11, day: 0, money: START_MONEY,
    cars: [], active: null, spares: [], pop: 0, wins: { drag: 0, road: 0, kicks: 0 }, losses: 0,
    rivals: {}, night: null, kingBeaten: false, over: null, history: []
  };
  for (const r of RIVALS) S.rivals[r.id] = { w: 0, l: 0, car: null, away: 0 };
  makePaper();
  return S;
}

// ----- Guardado: la partida en curso, más las del libro de la Policía de Caminos -----
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
};
function saveGame() { if (S) store.set(SAVE_KEY, S); }
function loadGame() { const s = store.get(SAVE_KEY); if (s && s.v === 3 && Array.isArray(s.cars)) { S = s; return true; } return false; }
const hasSave = () => { const s = store.get(SAVE_KEY); return !!(s && s.v === 3); };
// El libro de la Policía de Caminos guarda una partida por conductor
const savedDrivers = () => Object.keys(store.get(SAVES_KEY) || {});
function saveSlot() { const all = store.get(SAVES_KEY) || {}; all[S.name] = S; store.set(SAVES_KEY, all); saveGame(); }
function loadSlot(name) { const all = store.get(SAVES_KEY) || {}; if (!all[name]) return false; S = all[name]; saveGame(); return true; }
// El muro de los Reyes de la Calle: los que le ganaron al Rey, con las horas que demoraron
function addFame(name, hours) {
  const f = store.get(FAME_KEY) || [];
  f.push({ name, hours });
  f.sort((a, b) => a.hours - b.hours);
  store.set(FAME_KEY, f.slice(0, 10));
}
const fameList = () => store.get(FAME_KEY) || [];

// ----- El diario de cada mañana -----
function randomUsedCar(R, model) {
  const M = MODELS[model];
  const car = makeCar(model, {
    color: rpick(R, M.colors), body: clamp(0.45 + R() * 0.6, 0.4, 1), ec: clamp(0.4 + R() * 0.65, 0.35, 1),
    tc: clamp(0.5 + R() * 0.55, 0.4, 1), tread: 0.35 + R() * 0.6, fuel: Math.round(2 + R() * 6), tune: Math.round((R() - 0.5) * 8)
  });
  const kind = ENGINES[car.p.engine.k].kind;
  car.extras = [];
  // a veces el dueño anterior le hizo cosas
  if (kind !== '4' && R() < 0.28) {
    const ik = kind === '8' ? '2x4' : '3x2';
    setSpec(car, { intake: ik, carbs: Array(INTAKES[ik].n).fill(INTAKES[ik].carb) });
    car.extras.push(ik);
  }
  if (R() < 0.2 && !TRANS[car.p.trans.k].auto) { setSpec(car, { trans: 'man4' }); car.extras.push('man4'); }
  if (R() < 0.12) { car.mods.stickers.hotrod = 1; car.extras.push('custom'); }
  if (R() < 0.08) car.mods.stickers.flames = 1;
  return car;
}
function makePaper() {
  const R = rng(S.seed * 7 + S.day * 131 + 5);
  // siempre hay un cacharro barato, para no quedarse sin auto
  const cheap = rpick(R, ['modelA', 'dodge50', 'chevy49', 'merc48', 'ford40']);
  const junker = randomUsedCar(R, cheap);
  junker.body = 0.45 + R() * 0.1; junker.p.engine.c = 0.4 + R() * 0.15;
  const cars = [junker];
  const pool = MODEL_KEYS.filter(k => k !== cheap);
  for (let i = 0; i < 7; i++) {
    let model = rpick(R, pool);
    if (MODELS[model].price > 1500 && R() < 0.5) model = rpick(R, pool);
    pool.splice(pool.indexOf(model), 1);
    cars.push(randomUsedCar(R, model));
  }
  const ads = cars.map((car, i) => {
    const price = i ? Math.max(150, Math.round(carValue(car) * (0.9 + R() * 0.3) / 5) * 5) : Math.round((250 + R() * 200) / 5) * 5;
    return { car, price, min: Math.round(price * (0.78 + R() * 0.16)), haggled: false, sold: false, words: Math.floor(R() * 6) };
  });
  // repuestos usados mezclados en los avisos
  const used = [];
  for (let i = 0; i < 4; i++) {
    const p = randomPart(R);
    p.c = Math.round((0.5 + R() * 0.4) * 100) / 100;
    used.push({ part: p, price: Math.max(5, Math.round(partPrice(p) * p.c * 0.65 / 5) * 5), sold: false });
  }
  S.paper = { day: S.day, ads, used, news: Math.floor(R() * 1000) };
}
function randomPart(R) {
  const t = rpick(R, ['engine', 'engine', 'intake', 'carb', 'carb', 'trans', 'tires']);
  const fam = rpick(R, FAMS);
  switch (t) {
    case 'engine': return makePart('engine', rpick(R, Object.keys(ENGINES)));
    case 'intake': {
      const ks = Object.keys(INTAKES);
      return makePart('intake', rpick(R, ks), { f: fam });
    }
    case 'carb': return makePart('carb', rpick(R, ['2', '4', '4', '4R']));
    case 'trans': return makePart('trans', rpick(R, ['auto', 'man3', 'man4', 'race4']), { f: fam });
    default: return makePart('tires', rpick(R, ['std', 'ww', 'slick']));
  }
}
// El catálogo de AUTO PARTS: piezas nuevas, siempre las mismas (como en el original)
function catalog() {
  const out = [];
  for (const f of FAMS) for (const k in ENGINES) if (ENGINES[k].fam === f) out.push(makePart('engine', k));
  for (const f of FAMS) for (const k of ['1x2', '3x2', '1x4', '2x4', 'race']) out.push(makePart('intake', k, { f }));
  for (const k in CARBS) out.push(makePart('carb', k));
  for (const k of ['auto', 'man3', 'man4']) for (const f of FAMS) out.push(makePart('trans', k, { f }));
  out.push(makePart('trans', 'man4u', { f: 'all' }));
  for (const f of FAMS) out.push(makePart('trans', 'race4', { f }));
  for (const k in TIRES) out.push(makePart('tires', k));
  return out;
}

// Nombre de una pieza como en los avisos del original ("GM V-8 engine, 283 cu.in.")
function partName(p) {
  const P = L().parts, fam = partFam(p), F = fam === 'all' ? '' : FAM_NAME[fam] + ' ';
  switch (p.t) {
    case 'engine': { const E = ENGINES[p.k]; return P.engine(F, E.kind === '8' ? 'V-8' : E.kind === '6' ? P.six : P.four, E.ci); }
    case 'intake': return P.intake(F, p.k);
    case 'carb': return P.carb[p.k];
    case 'trans': return P.trans[p.k](F.trim());
    case 'tires': return P.tires[p.k];
  }
  return '?';
}
const carName = car => carTitle(car.model);

// ----- Comprar, regatear y vender -----
function buyCar(i, price) {
  const ad = S.paper.ads[i];
  if (!ad || ad.sold) return 'gone';
  if (S.cars.length >= MAX_CARS) return 'noRoom';
  if (S.money < price) return 'noMoney';
  S.money -= price; ad.sold = true;
  const car = ad.car;
  delete car.extras;
  S.cars.push(car);
  if (!activeCar()) S.active = car.id;
  saveGame();
  return '';
}
// Ofrecer menos plata: el dueño acepta si la oferta llega a su mínimo (se puede regatear una sola vez por aviso)
function haggle(i, offer) {
  const ad = S.paper.ads[i];
  if (!ad || ad.haggled) return false;
  ad.haggled = true;
  if (offer >= ad.min) { ad.price = offer; return true; }
  return false;
}
function buyPart(part, price) {
  if (S.money < price) return 'noMoney';
  S.money -= price;
  S.spares.push(Object.assign({}, part, { id: newId('p') }));
  saveGame();
  return '';
}
// Un comprador ofrece por tu auto o tu repuesto; si no aceptas, viene otro con otra oferta (hasta tres)
const buyerOffer = (value, round) => Math.max(1, Math.round(value * (0.55 + Math.random() * 0.25 + round * 0.04) / 5) * 5);
const partWorth = p => Math.max(2, Math.round(partValue(p) * 0.7));
function sellCar(id, money) {
  const i = S.cars.findIndex(c => c.id === id);
  if (i < 0) return;
  S.money += money; S.cars.splice(i, 1);
  if (S.active === id) S.active = S.cars.length ? S.cars[0].id : null;
  checkBroke(); saveGame();
}
function sellPart(id, money) {
  const i = S.spares.findIndex(p => p.id === id);
  if (i < 0) return;
  S.money += money; S.spares.splice(i, 1); saveGame();
}
function junkCar(id) {
  const car = S.cars.find(c => c.id === id);
  if (!car) return 0;
  const m = junkValue(car);
  sellCar(id, m);
  return m;
}

// ----- El taller: pernos, sacar y poner piezas -----
function loosenBolt(car, sl, i) {
  if (!car.p[sl] || !boltOn(car, sl, i) || blockers(car, sl).length) return false;
  car.tight[sl] &= ~(1 << i); return true;
}
function tightenBolt(car, sl, i) {
  if (!car.p[sl] || boltOn(car, sl, i)) return false;
  car.tight[sl] |= 1 << i; return true;
}
// Saca una pieza con todos sus pernos sueltos y la deja con los repuestos
function removePart(car, sl) {
  const p = car.p[sl];
  if (!p || car.tight[sl] > 0 || blockers(car, sl).length) return false;
  car.p[sl] = null; car.tight[sl] = 0;
  S.spares.push(p);
  _etCache.clear();
  return true;
}
// Pone un repuesto en su lugar (queda con los pernos sueltos)
function installPart(car, partId) {
  const i = S.spares.findIndex(p => p.id === partId);
  if (i < 0) return { why: 'gone' };
  const r = slotFor(car, S.spares[i]);
  if (!r.sl) return r;
  car.p[r.sl] = S.spares[i]; car.tight[r.sl] = 0;
  S.spares.splice(i, 1);
  return r;
}

// ----- Pintura, calcomanías y alivianar -----
function pay(m) { if (S.money < m) return false; S.money -= m; saveGame(); return true; }
function paintCar(car, color) { if (car.color === color || !pay(PAINT_PRICE)) return false; car.color = color; S.pop += 1; saveGame(); return true; }
function addSticker(car, k) { if (car.mods.stickers[k] || !pay(STICKERS[k])) return false; car.mods.stickers[k] = 1; S.pop += 1; saveGame(); return true; }
function removeStickers(car) { car.mods.stickers = {}; saveGame(); }
function bodywork(car, k) {
  if (car.mods[k] || !pay(BODYWORK[k].price)) return false;
  car.mods[k] = 1;
  _etCache.clear(); saveGame(); return true;
}
// Bencina: tú mismo, o Gus por el doble
function buyGas(car, gal, full) {
  const price = GAS_PRICE * (full ? 2 : 1);
  gal = Math.min(gal, TANK - car.fuel, S.money / price);
  if (gal <= 0.001) return 0;
  S.money -= gal * price; car.fuel += gal;
  return gal;
}
function fixCrash(car) { if (!canRepair(car) || !pay(repairCost(car))) return false; car.body = 1; car.repairs++; saveGame(); return true; }

// ----- Los rivales -----
const rivalById = id => (id === 'king' ? KING : RIVALS.find(r => r.id === id));
const rivalName = r => (typeof r.name === 'object' ? r.name[LANG] : r.name);

// Pasos para preparar el auto de un rival, de lo más barato a lo más caro
function upgradeSteps(car) {
  const fam = MODELS[car.model].fam;
  const big = Object.keys(ENGINES).filter(k => ENGINES[k].fam === fam && ENGINES[k].kind === '8').sort((a, b) => ENGINES[a].hp - ENGINES[b].hp);
  const steps = [
    c => { c.tune = 0; },
    c => { const kd = ENGINES[c.p.engine.k].kind; setSpec(c, { intake: kd === '8' ? '2x4' : kd === '6' ? '3x2' : '1x2' }); },
    c => { setSpec(c, { trans: 'man4' }); },
    c => { setSpec(c, { tires: 'slick' }); }
  ];
  for (const e of big) steps.push(c => { if (ENGINES[e].hp > ENGINES[c.p.engine.k].hp || ENGINES[c.p.engine.k].kind !== '8') setSpec(c, { engine: e, intake: '2x4' }); });
  steps.push(c => { setSpec(c, { intake: 'race', carbs: ['4R', '4R'], trans: 'race4' }); });
  return steps;
}
// Arma el auto de un rival (su modelo de siempre) para que haga más o menos el tiempo pedido.
// Si su auto de fábrica es más rápido que eso, lo "gasta": motor cansado, mal afinado y neumáticos lisos.
function makeRivalCar(r, target, R = Math.random) {
  let car = makeCar(r.model, { color: rpick(R, MODELS[r.model].colors), fuel: TANK, tune: 0 });
  let best = JSON.stringify(car), bestErr = Math.abs(carET(car).et - target);
  if (carET(car).et < target) {
    const base = best;
    for (let w = 0.1; w <= 1.001; w += 0.1) {
      const c = JSON.parse(base);
      c.p.engine.c = 1 - 0.6 * w; c.p.trans.c = 1 - 0.4 * w; c.p.tires.c = 1 - 0.7 * w; c.tune = Math.round(8 * w) * (R() < 0.5 ? -1 : 1);
      const err = Math.abs(carET(c).et - target);
      if (err < bestErr) { bestErr = err; best = JSON.stringify(c); }
    }
  } else {
    for (const step of upgradeSteps(car)) {
      if (carET(car).et <= target) break;
      step(car);
      const err = Math.abs(carET(car).et - target);
      if (err < bestErr) { bestErr = err; best = JSON.stringify(car); }
    }
  }
  car = JSON.parse(best);
  if (R() < 0.3) car.mods.stickers[rpick(R, ['hotrod', 'flames', 'star', 'checker', 'lightning'])] = 1;
  return car;
}
const playerET = () => { const c = activeCar(); return c && carRuns(c) ? carET(c).et : 20; };
function rivalCar(id) {
  if (id === 'king') return buildCar(KING.car);
  const r = rivalById(id), st = S.rivals[id];
  const target = clamp(playerET() + r.edge + (Math.random() - 0.5) * 0.5, 12.6, 24);
  if (!st.car || !carRuns(st.car) || Math.abs(carET(st.car).et - target) > 1.1) st.car = makeRivalCar(r, target);
  return st.car;
}
const totalWins = () => S.wins.drag + S.wins.road + S.wins.kicks;
const kingReady = () => S.wins.drag >= KING_DRAGS && S.wins.road >= KING_ROADS && !S.kingBeaten;

// ----- La noche en Bob's Drive-In -----
function nightQueue() {
  const R = rng(S.seed * 3 + S.day * 977 + 1);
  const avail = RIVALS.filter(r => (r.tier || 0) <= totalWins() && S.rivals[r.id].away <= S.day);
  const q = [];
  const pool = avail.slice();
  while (q.length < 7 && pool.length) q.push(pool.splice(Math.floor(R() * pool.length), 1)[0].id);
  if (kingReady()) q.unshift('king');
  return q;
}
function goDiner() {
  const car = activeCar();
  if (!car || !carRuns(car)) return 'noCar';
  if (car.fuel < 0.6) return 'fuel';
  car.fuel = Math.max(0, car.fuel - 0.4 * ENGINES[car.p.engine.k].ci / 300);
  S.night = { min: OPEN_MIN, queue: nightQueue(), cur: null, raced: [] };
  saveGame();
  return '';
}
// Llega el siguiente rival (o el que llamaste con el tipo del poste)
function nextRival(callId) {
  const N = S.night;
  if (!N) return null;
  N.min += N.cur ? 15 : 5;
  N.cur = null;
  if (callId) N.queue = [callId, ...N.queue.filter(q => q !== callId)];
  while (N.queue.length && N.min < CLOSE_MIN) {
    const id = N.queue.shift();
    if (N.raced.includes(id)) continue;
    N.cur = { id, car: rivalCar(id) };
    return N.cur;
  }
  return null;
}
// Los que se pueden llamar con el tipo del poste
const callable = () => (S.night ? RIVALS.filter(r => (r.tier || 0) <= totalWins() && S.rivals[r.id].away <= S.day && !S.night.raced.includes(r.id)).map(r => r.id).concat(kingReady() ? ['king'] : []) : []);
// ¿El rival acepta? '' si sí; si no, el tipo de excusa
function rivalAnswer(id, type, bet) {
  if (id === 'king') return '';
  const r = rivalById(id), car = activeCar(), rc = S.rivals[id].car;
  if (bet !== 'pinks' && bet > S.money) return 'broke';
  const edge = playerET() - carET(rc).et;                 // positivo: el rival es más rápido
  const conf = edge + r.skill * 0.6 - 0.45 + Math.min(1, S.pop / 40) * 0.3 + (Math.random() - 0.5) * 0.5;
  if (bet === 'pinks') return carValue(car) >= carValue(rc) * 0.45 && conf > 0.35 ? '' : 'noPinks';
  const need = { 0: -9, 10: -1.6, 25: -1.3, 50: -0.8, 100: -0.3 }[bet] ?? -1;
  return conf > need ? '' : bet >= 50 ? 'noMoney' : 'scared';
}
function raceOptions(id, type, bet) {
  const r = rivalById(id);
  return {
    type, bet, car: activeCar(), seed: type === 'road' ? S.roadSeed : S.seed % 997 + S.day,
    rival: { id, name: rivalName(r), look: r.look, car: S.night.cur.car, skill: r.skill, king: id === 'king' },
    police: id === 'king' ? 0 : 0.3
  };
}

// Aplica lo que pasó en la carrera. Devuelve un resumen para la pantalla de resultados.
function applyResult(o, res) {
  const car = o.car, out = { res, money: 0, carWon: null, carLost: null, crash: false, lines: [] };
  const rec = S.rivals[o.rival.id];
  const betMoney = o.bet === 'pinks' ? 0 : o.bet;
  // desgaste: motor, caja y neumáticos; el encendido se corre un poco en cada carrera
  if (car.p.engine) car.p.engine.c = res.blown ? 0 : clamp(car.p.engine.c - res.engineDmg * 0.55 - 0.01, 0, 1);
  if (car.p.trans) car.p.trans.c = res.broken ? 0 : clamp(car.p.trans.c - res.transDmg * 0.6 - 0.005, 0, 1);
  if (car.p.tires) car.p.tires.c = clamp(car.p.tires.c - res.tread, 0, 1);
  if (Math.random() < 0.7) car.tune = clamp((car.tune || 0) + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.3 ? 2 : 1), -10, 10);
  car.fuel = Math.max(0, car.fuel - res.fuel);
  if (res.body) { car.body = clamp(car.body - res.body, 0, 1); out.crash = true; }
  if (res.blown) out.lines.push('blown'); else if (res.engineDmg > 0.25) out.lines.push('engineHurt');
  if (res.broken) out.lines.push('broken'); else if (res.transDmg > 0.2) out.lines.push('transHurt');
  _etCache.clear();
  if (res.outcome === 'win') {
    if (o.bet === 0) S.wins.kicks++; else S.wins[o.type]++;
    S.pop += o.bet === 0 ? 1 : 3;
    if (rec) rec.l++;
    S.money += betMoney; out.money = betMoney;
    if (o.bet === 'pinks') {
      const won = o.rival.car;
      won.id = newId('c'); won.fuel = Math.max(won.fuel, 3);
      if (S.cars.length < MAX_CARS) { S.cars.push(won); out.carWon = won; }
      else { const m = Math.round(carValue(won) * 0.7); S.money += m; out.carWon = won; out.autoSold = m; }
      if (rec) { rec.car = null; rec.away = S.day + 6; }
      if (o.rival.id === 'king') { S.kingBeaten = true; S.over = 'king'; addFame(S.name, hoursPlayed()); }
    }
  } else if (res.outcome === 'lose') {
    S.losses++; S.pop = Math.max(0, S.pop - 1);
    if (rec) rec.w++;
    S.money -= betMoney; out.money = -betMoney;
    if (o.bet === 'pinks') {
      out.carLost = car;
      S.cars = S.cars.filter(c => c.id !== car.id);
      S.active = S.cars.length ? S.cars[0].id : null;
    }
  } else if (res.fine) {
    out.fine = res.fine;
    if (S.money >= res.fine) S.money -= res.fine;
    else { S.money = 0; out.jail = true; S.over = 'jail'; }
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
  if (S.day >= SUMMER_DAYS && !S.over) S.over = 'summer';
  makePaper();
  saveGame();
}
// Sin auto y sin plata para el auto más barato del diario (contando lo que darían por los repuestos): se acabó
function checkBroke() {
  if (S.over || S.cars.length) return;
  const cheapest = S.paper ? Math.min(...S.paper.ads.filter(a => !a.sold).map(a => a.price), 500) : 300;
  const parts = S.spares.reduce((a, p) => a + partWorth(p), 0);
  if (S.money + parts < cheapest) S.over = 'broke';
}
