// ===== El verano: la plata, los autos, el diario, el taller, las noches en Bob's y los rivales =====
// Sin dibujo: todo esto se prueba con node (tests/smoke.mjs).
import {
  MODELS, MODEL_KEYS, COLORS, UPGRADES, RIVALS, rivalById, CLASSES, CLASS_ET, CLASS_BET,
  START_MONEY, MAX_CARS, FIRST_DAY, DAYS, NIGHT_OPEN, NIGHT_CLOSE, RACE_MINUTES, PAINT_PRICE, DECAL_PRICE, noUpgrades, BETS, CUP, WAGE
} from './data.js';
import { makeSpec, quarterMile } from './physics.js';
import { rng, pick } from './util.js';

export let S = null;
const SAVE_KEY = 'streetrod3d.save', FAME_KEY = 'streetrod3d.fame';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin guardado */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } }
};
const r5 = n => Math.max(5, Math.round(n / 5) * 5);

export function newGame(name, seed = Math.floor(Math.random() * 1e9)) {
  S = {
    v: 1, name: (name || 'JOHNNY').slice(0, 14), seed, day: 0, money: START_MONEY, cars: [], active: -1, nextId: 1,
    paper: null, night: null, rivals: {}, beaten: [], kingBeaten: false, over: null, autoShift: true,
    stats: { wins: 0, losses: 0, won: 0, lost: 0, pinks: 0 }, trophies: []
  };
  for (const r of RIVALS) S.rivals[r.id] = { w: 0, l: 0 };
  makePaper();
  return S;
}
export const save = () => { if (S) store.set(SAVE_KEY, JSON.stringify(S)); };
export function load() {
  try { const s = JSON.parse(store.get(SAVE_KEY)); if (s && s.v === 1) { S = s; S.trophies = S.trophies || []; return true; } } catch (e) { /* guardado roto */ }
  return false;
}
export const hasSave = () => { try { const s = JSON.parse(store.get(SAVE_KEY)); return !!(s && s.v === 1 && !s.over); } catch (e) { return false; } };
export const clearSave = () => store.del(SAVE_KEY);
export const dateOf = day => new Date(FIRST_DAY + day * 86400000);
export const daysLeft = () => DAYS - S.day;

// ----- autos -----
export function makeCarState(model, color) {
  return { id: 0, model, color: color || MODELS[model].color || COLORS[0], decal: 'none', num: 0, up: noUpgrades(), cond: 1 };
}
export const activeCar = () => S.cars.find(c => c.id === S.active) || null;
// lo que se gastó en mejoras (para el valor de reventa)
export function upgradesSpent(car) {
  const t = MODELS[car.model].tier;
  let sum = 0;
  for (const k in UPGRADES) for (let lv = 1; lv <= car.up[k]; lv++) sum += UPGRADES[k].cost[lv] * t;
  return sum;
}
export const carValue = car => MODELS[car.model].price * (0.45 + 0.55 * car.cond) + upgradesSpent(car) * 0.55;
export const sellPrice = car => r5(carValue(car) * 0.7);
const _stats = new Map();
export function carStats(car) {
  const sp = makeSpec(car), key = JSON.stringify([car.model, car.up, car.cond]);
  if (!_stats.has(key)) { const q = quarterMile(sp); _stats.set(key, { et: q.et, trap: q.trap, cls: classOf(q.et), mu: sp.mu, lat: sp.lat, torque: sp.torque, mass: sp.mass, red: sp.red }); }
  return _stats.get(key);
}
export const classOf = et => (et < CLASS_ET.S ? 'S' : et < CLASS_ET.A ? 'A' : et < CLASS_ET.B ? 'B' : et < CLASS_ET.C ? 'C' : 'D');

// ----- el diario: autos usados de cada día (siempre hay uno barato que anda) -----
export function makePaper() {
  const R = rng(S.seed * 31 + S.day * 977 + 7);
  const ads = [adFor(R, pick(R, ['sprite', 'bantam', 'marquis']), true)];
  const weight = k => 1 / Math.sqrt(MODELS[k].price / 400);
  const used = new Set([ads[0].car.model]);
  while (ads.length < 6) {
    const pool = MODEL_KEYS.filter(k => !used.has(k)), tot = pool.reduce((a, k) => a + weight(k), 0);
    let x = R() * tot, m = pool[0];
    for (const k of pool) { x -= weight(k); if (x <= 0) { m = k; break; } }
    used.add(m); ads.push(adFor(R, m, false));
  }
  S.paper = { day: S.day, ads };
}
function adFor(R, model, cheap) {
  const car = makeCarState(model, pick(R, COLORS));
  car.cond = Math.round((cheap ? 0.6 + R() * 0.15 : 0.62 + R() * 0.36) * 100) / 100;
  if (R() < 0.3) car.up.intake = 1;
  if (R() < 0.2) car.up.tires = 1;
  if (R() < 0.12) car.up.engine = 1;
  if (R() < 0.15) car.decal = pick(R, ['flames', 'stripes']);
  let price = r5(carValue(car) * (0.85 + R() * 0.3));
  if (cheap) price = Math.min(price, 460);
  return { car, price, sold: false, haggled: false, line: Math.floor(R() * 6) };
}
export function buyCar(i, price) {
  const ad = S.paper.ads[i];
  if (!ad || ad.sold) return 'gone';
  if (S.cars.length >= MAX_CARS) return 'noRoom';
  if (S.money < price) return 'money';
  S.money -= price; ad.sold = true;
  const car = JSON.parse(JSON.stringify(ad.car)); car.id = S.nextId++;
  S.cars.push(car);
  if (!activeCar()) S.active = car.id;
  save();
  return '';
}
// Ofrecer menos: a veces el vendedor acepta un 15% menos (se puede intentar una vez por aviso)
export function haggle(i) {
  const ad = S.paper.ads[i];
  if (!ad || ad.sold || ad.haggled) return null;
  ad.haggled = true;
  const R = rng(S.seed + S.day * 17 + i * 101);
  if (R() < 0.5) { ad.price = r5(ad.price * 0.85); save(); return ad.price; }
  save();
  return 0;
}
export function sellCar(id) {
  const k = S.cars.findIndex(c => c.id === id);
  if (k < 0) return 0;
  const p = sellPrice(S.cars[k]);
  S.money += p; S.cars.splice(k, 1);
  if (S.active === id) S.active = S.cars.length ? S.cars[0].id : -1;
  checkBroke(); save();
  return p;
}

// ----- taller -----
export function upCost(car, cat) {
  const U = UPGRADES[cat], lv = car.up[cat];
  return lv >= U.max ? null : r5(U.cost[lv + 1] * MODELS[car.model].tier);
}
export function buyUpgrade(car, cat) {
  const c = upCost(car, cat);
  if (c == null) return 'max';
  if (S.money < c) return 'money';
  S.money -= c; car.up[cat]++; save();
  return '';
}
export const repairCost = car => r5((1 - car.cond) * MODELS[car.model].price * 0.6);
export function repair(car) {
  const c = repairCost(car);
  if (car.cond >= 0.995) return 'fine';
  if (S.money < c) return 'money';
  S.money -= c; car.cond = 1; save();
  return '';
}
export function paint(car, color) {
  if (car.color === color) return '';
  if (S.money < PAINT_PRICE) return 'money';
  S.money -= PAINT_PRICE; car.color = color; save();
  return '';
}
export function decal(car, d, num) {
  if (car.decal === d && (d !== 'number' || car.num === num)) return '';
  if (d !== 'none' && S.money < DECAL_PRICE) return 'money';
  if (d !== 'none') S.money -= DECAL_PRICE;
  car.decal = d; if (d === 'number') car.num = num || Math.floor(Math.random() * 98) + 1;
  save();
  return '';
}

// ----- rivales y categorías -----
export const bossOf = cls => RIVALS.find(r => r.cls === cls && r.boss);
export function rivalCar(r) {
  return { id: -1, model: r.model, color: r.color, decal: r.boss ? 'stripes' : r.king ? 'none' : r.decal || 'none', num: 0, up: Object.assign({}, r.up), cond: 1 };
}
// D está abierta siempre; cada jefe vencido abre la categoría siguiente; ganarle al jefe de la A trae a El Rey
export function openClasses() {
  const out = ['D'];
  for (const c of ['C', 'B', 'A']) if (S.beaten.includes(bossOf(CLASSES[CLASSES.indexOf(c) - 1]).id)) out.push(c);
  return out;
}
export const beatenIn = cls => RIVALS.filter(r => r.cls === cls && !r.boss && S.beaten.includes(r.id)).length;
export const bossReady = cls => beatenIn(cls) >= 3;
export const kingReady = () => S.beaten.includes(bossOf('A').id) && !S.kingBeaten;

// ----- la noche en Bob's: llegan rivales, se corre y el reloj avanza -----
export function startNight() {
  const car = activeCar();
  if (!car) return 'noCar';
  S.night = { time: NIGHT_OPEN, present: [], raced: [] };
  fillNight(); save();
  return '';
}
function fillNight() {
  const N = S.night, R = rng(S.seed + S.day * 131 + N.time * 7), open = openClasses();
  if (!activeCar()) { N.present = []; return; }     // sin auto no hay con qué correr
  const mine = classOf(carStats(activeCar()).et);
  const cands = RIVALS.filter(r => !r.king && open.includes(r.cls) && !N.present.includes(r.id) && !N.raced.includes(r.id) && (!r.boss || bossReady(r.cls)));
  const w = r => { const d = Math.abs(CLASSES.indexOf(r.cls) - CLASSES.indexOf(mine)); return (d === 0 ? 3 : d === 1 ? 1.6 : 0.7) * (r.boss ? 1.4 : 1); };
  while (N.present.length < 4 && cands.length) {
    const tot = cands.reduce((a, r) => a + w(r), 0);
    let x = R() * tot, k = 0;
    for (; k < cands.length - 1; k++) { x -= w(cands[k]); if (x <= 0) break; }
    N.present.push(cands[k].id); cands.splice(k, 1);
  }
  if (kingReady() && N.time >= 22 * 60 && !N.present.includes('king') && !N.raced.includes('king')) N.present.unshift('king');
}
export const nightOver = () => !S.night || S.night.time >= NIGHT_CLOSE;
// Amanece: Gus paga el turno en la bencinera, llega el diario nuevo. Devuelve lo que pagó Gus.
export function endNight() {
  S.night = null; S.day++;
  if (S.day >= DAYS && !S.over) S.over = 'summer';
  const wage = S.over ? 0 : WAGE;
  S.money += wage;
  makePaper(); save();
  return wage;
}
// ¿Arriesga el rival su auto? Se tienen fe: aceptan aunque su auto sea algo más lento, más mientras mejor manejan
export function acceptsPink(r) {
  if (r.king) return true;
  const my = carStats(activeCar()).et, their = carStats(rivalCar(r)).et;
  return their <= my + 0.35 + r.skill * 0.8;
}
// ¿Acepta el rival? type: 'drag' | 'road'; bet 0 = por el honor; pink: los papeles del auto (solo en la ruta)
export function challenge(r, type, bet, pink) {
  const N = S.night, me = activeCar();
  if (!N || !me) return 'noCar';
  if (N.raced.includes(r.id)) return 'raced';
  if (r.boss && !bossReady(r.cls)) return 'notYet';
  if (pink && type !== 'road') return 'pinkRoad';
  if (r.king && !(type === 'road' && pink)) return 'kingPink';
  if (pink) return acceptsPink(r) ? '' : 'scared';
  if (!bet) return '';
  if (bet > S.money) return 'money';
  if (bet > maxBet(r)) return maxBet(r) ? 'tooMuch' : 'tooFast';
  return '';
}
// Lo más que apuesta un rival contra tu auto (0 si tu auto es demasiado para él: entonces solo por el honor)
export function maxBet(r) {
  const my = carStats(activeCar()).et, their = carStats(rivalCar(r)).et;
  return their > my + 2.2 ? 0 : CLASS_BET[r.cls];
}
// A veces un rival se acerca a desafiarte con una apuesta que puedes pagar
export function proposal(R = Math.random) {
  const N = S.night;
  if (!N || !activeCar() || nightOver()) return null;
  const cands = N.present.filter(id => !N.raced.includes(id)).map(rivalById).filter(r => !r.king && (!r.boss || bossReady(r.cls)));
  if (!cands.length) return null;
  const r = cands[Math.floor(R() * cands.length)], type = R() < 0.6 ? 'drag' : 'road';
  const cap = Math.min(maxBet(r), Math.floor(S.money * 0.5));
  const bet = [...BETS].reverse().find(b => b <= cap) || 0;
  return challenge(r, type, bet, false) ? null : { id: r.id, type, bet };
}

// ----- la Copa de Bob's: los sábados, tres picadas seguidas contra rivales de tu categoría -----
export const isSaturday = () => dateOf(S.day).getUTCDay() === 6;
export const cupClass = () => classOf(carStats(activeCar()).et);
export function cupStatus() {
  const N = S.night;
  if (!N || !isSaturday()) return 'closed';
  if (N.cupDone) return 'done';
  if (!activeCar()) return 'noCar';
  if (N.time > 23 * 60) return 'late';
  if (S.money < CUP[cupClass()].fee) return 'money';
  return '';
}
export function startCup() {
  if (cupStatus()) return cupStatus();
  const cls = cupClass(), my = carStats(activeCar()).et, R = rng(S.seed + S.day * 977);
  // los de su categoría (sin jefes); si no alcanzan, los de categorías vecinas con autos parecidos
  let pool = RIVALS.filter(r => !r.king && !r.boss && r.cls === cls);
  if (pool.length < 3) pool = RIVALS.filter(r => !r.king && !r.boss).sort((a, b) => Math.abs(carStats(rivalCar(a)).et - my) - Math.abs(carStats(rivalCar(b)).et - my)).slice(0, 4);
  const ids = pool.map(r => r.id).sort(() => R() - 0.5).slice(0, 3).sort((a, b) => carStats(rivalCar(rivalById(b))).et - carStats(rivalCar(rivalById(a))).et);
  S.money -= CUP[cls].fee;
  S.night.cup = { cls, ids, round: 0 };
  save();
  return '';
}
export const cupRival = () => S.night && S.night.cup ? rivalById(S.night.cup.ids[S.night.cup.round]) : null;
// El resultado de una ronda: pasa a la siguiente, o termina con premio (campeón o finalista)
export function cupResult(win) {
  const N = S.night, cup = N.cup, r = rivalById(cup.ids[cup.round]), C = CUP[cup.cls], me = activeCar();
  const out = { win, round: cup.round, done: false, prize: 0, champion: false, cls: cup.cls };
  const rec = S.rivals[r.id];
  if (win) { rec.w++; S.stats.wins++; if (!S.beaten.includes(r.id)) S.beaten.push(r.id); } else { rec.l++; S.stats.losses++; }
  if (me) me.cond = Math.max(0.5, Math.round((me.cond - 0.006) * 1000) / 1000);
  if (win && cup.round < 2) cup.round++;
  else {
    out.done = true;
    if (win) { out.prize = C.prize; out.champion = true; S.trophies.push(cup.cls); }
    else if (cup.round === 2) out.prize = C.second;
    S.money += out.prize; S.stats.won += out.prize;
    N.cup = null; N.cupDone = true;
    for (const id of cup.ids) if (!N.raced.includes(id)) N.raced.push(id);
    N.present = N.present.filter(id => !cup.ids.includes(id));
    N.time += 90;
    if (N.time < NIGHT_CLOSE) fillNight();
  }
  save();
  return out;
}
// El resultado de una carrera: plata, papeles, récord, jefes y El Rey
export function applyResult({ rivalId, bet = 0, pink = false, win }) {
  const r = rivalById(rivalId), rec = S.rivals[rivalId], me = activeCar();
  const out = { win, money: 0, gotCar: null, lostCar: null, unlocked: null, king: false, sold: 0 };
  if (win) {
    rec.w++; S.stats.wins++;
    if (!S.beaten.includes(rivalId)) S.beaten.push(rivalId);
    if (pink) {
      const car = rivalCar(r); car.id = S.nextId++; S.stats.pinks++;
      if (S.cars.length < MAX_CARS) { S.cars.push(car); out.gotCar = car; }
      else { out.sold = sellPrice(car); S.money += out.sold; out.gotCar = car; }
    } else { S.money += bet; out.money = bet; S.stats.won += bet; }
    if (r.boss) out.unlocked = CLASSES[CLASSES.indexOf(r.cls) + 1];
    if (r.king) { S.kingBeaten = true; S.over = 'king'; out.king = true; addFame(); }
  } else {
    rec.l++; S.stats.losses++;
    if (pink && me) { out.lostCar = me; S.cars = S.cars.filter(c => c !== me); S.active = S.cars.length ? S.cars[0].id : -1; }
    else { const b = Math.min(bet, S.money); S.money -= b; out.money = -b; S.stats.lost += b; }
  }
  if (me && S.cars.includes(me)) me.cond = Math.max(0.5, Math.round((me.cond - 0.008) * 1000) / 1000);
  if (S.night) {
    S.night.raced.push(rivalId); S.night.present = S.night.present.filter(id => id !== rivalId);
    S.night.time += RACE_MINUTES;
    if (S.night.time < NIGHT_CLOSE) fillNight();
  }
  checkBroke(); save();
  return out;
}
// Sin auto y sin plata para el más barato del diario: se acabó
function checkBroke() {
  if (S.over || S.cars.length) return;
  const cheapest = Math.min(...S.paper.ads.filter(a => !a.sold).map(a => a.price), 9999);
  if (S.money < Math.min(cheapest, 300)) S.over = 'broke';
}

// ----- los Reyes de la Calle (los que le ganaron a El Rey, con los días que tardaron) -----
export function fame() { try { return JSON.parse(store.get(FAME_KEY)) || []; } catch (e) { return []; } }
function addFame() {
  const list = fame(); list.push({ name: S.name, days: S.day + 1 });
  list.sort((a, b) => a.days - b.days);
  store.set(FAME_KEY, JSON.stringify(list.slice(0, 10)));
}
