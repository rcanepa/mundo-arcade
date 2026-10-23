// ===== El verano: la plata, los autos, el diario, el taller, las noches en Bob's y los rivales =====
// Sin dibujo: todo esto se prueba con node (tests/smoke.mjs).
import {
  MODELS, MODEL_KEYS, COLORS, UPGRADES, RIVALS, rivalById, CLASSES, CLASS_ET, CLASS_BET,
  START_MONEY, MAX_CARS, FIRST_DAY, DAYS, NIGHT_OPEN, NIGHT_CLOSE, RACE_MINUTES, PAINT_PRICE, DECAL_PRICE, noUpgrades
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
    stats: { wins: 0, losses: 0, won: 0, lost: 0, pinks: 0 }
  };
  for (const r of RIVALS) S.rivals[r.id] = { w: 0, l: 0 };
  makePaper();
  return S;
}
export const save = () => { if (S) store.set(SAVE_KEY, JSON.stringify(S)); };
export function load() {
  try { const s = JSON.parse(store.get(SAVE_KEY)); if (s && s.v === 1) { S = s; return true; } } catch (e) { /* guardado roto */ }
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
export function endNight() {
  S.night = null; S.day++;
  if (S.day >= DAYS && !S.over) S.over = 'summer';
  makePaper(); save();
}
// ¿Acepta el rival? type: 'drag' | 'road'; pink: los papeles del auto (solo en la ruta)
export function challenge(r, type, bet, pink) {
  const N = S.night, me = activeCar();
  if (!N || !me) return 'noCar';
  if (N.raced.includes(r.id)) return 'raced';
  if (r.boss && !bossReady(r.cls)) return 'notYet';
  if (pink && type !== 'road') return 'pinkRoad';
  if (r.king && !(type === 'road' && pink)) return 'kingPink';
  const my = carStats(me).et, their = carStats(rivalCar(r)).et;
  if (pink) { if (!r.king && their > my + 0.3) return 'scared'; return ''; }
  if (bet > S.money) return 'money';
  if (bet > CLASS_BET[r.cls]) return 'tooMuch';
  if (their > my + 1.6) return 'tooFast';
  return '';
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
