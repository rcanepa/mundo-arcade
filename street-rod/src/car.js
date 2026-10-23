// ===== Autos y piezas: qué calza dónde, si el auto anda, cuánta potencia tiene y cuánto vale =====
let _uid = 0;
const newId = p => p + Date.now().toString(36).slice(-5) + (++_uid).toString(36);

// Una pieza suelta o instalada. c = estado (1 = nueva). f = marca (en múltiples y cajas; 'all' si calza en todos).
function makePart(t, k, o = {}) {
  const p = { id: newId('p'), t, k, c: o.c ?? 1 };
  if (t === 'intake' || t === 'trans') p.f = o.f;
  return p;
}
const partFam = p => (p.t === 'engine' ? ENGINES[p.k].fam : p.f || 'all');
function partPrice(p) {
  switch (p.t) {
    case 'engine': return ENGINES[p.k].price;
    case 'intake': return INTAKES[p.k].price;
    case 'carb': return CARBS[p.k].price;
    case 'trans': { const pr = TRANS[p.k].price; return pr[p.f] ?? pr.all; }
    case 'tires': return TIRES[p.k].price;
  }
  return 0;
}
// Lo que vale una pieza usada
const partValue = p => partPrice(p) * (0.35 + 0.65 * (p.c ?? 1));

// ----- Espacios del auto y sus pernos -----
// Para sacar una pieza primero hay que sacar las que están encima (above).
const SLOTS = ['engine', 'intake', 'carb0', 'carb1', 'carb2', 'trans', 'tires'];
const SLOT_INFO = {
  engine: { t: 'engine', bolts: 4, above: ['intake'] },
  intake: { t: 'intake', bolts: 6, above: ['carb0', 'carb1', 'carb2'] },
  carb0:  { t: 'carb', bolts: 4, above: [] },
  carb1:  { t: 'carb', bolts: 4, above: [] },
  carb2:  { t: 'carb', bolts: 4, above: [] },
  trans:  { t: 'trans', bolts: 4, above: [] },
  tires:  { t: 'tires', bolts: 5, above: [] }
};
const ENGINE_SLOTS = ['engine', 'intake', 'carb0', 'carb1', 'carb2'];
// Los pernos de cada pieza se guardan como bits (1 = puesto): así se sabe cuál falta
const allBolts = sl => (1 << SLOT_INFO[sl].bolts) - 1;
const boltOn = (car, sl, i) => !!((car.tight[sl] || 0) & (1 << i));
const carbCount = car => (car.p.intake ? INTAKES[car.p.intake.k].n : 0);

// Un auto de un modelo, con sus piezas de fábrica y todos los pernos apretados
function makeCar(model, o = {}) {
  const M = MODELS[model], s = M.stock;
  const car = {
    id: newId('c'), model, color: o.color || M.colors[0], body: o.body ?? 1, repairs: 0,
    fuel: o.fuel ?? 8, tune: o.tune ?? 0, mods: { stickers: {} }, p: {}, tight: {}
  };
  car.p.engine = makePart('engine', s.engine, { c: o.ec ?? 1 });
  car.p.intake = makePart('intake', s.intake, { f: M.fam });
  for (let i = 0; i < 3; i++) car.p['carb' + i] = i < INTAKES[s.intake].n ? makePart('carb', s.carb) : null;
  car.p.trans = makePart('trans', s.trans, { f: M.fam, c: o.tc ?? 1 });
  car.p.tires = makePart('tires', s.tires, { c: o.tread ?? 1 });
  for (const sl of SLOTS) car.tight[sl] = car.p[sl] ? allBolts(sl) : 0;
  return car;
}

// Arma un auto completo a partir de una ficha (la del Rey, la de un rival o una de prueba)
function buildCar(spec) {
  const car = makeCar(spec.model, { color: spec.color, fuel: 16 });
  setSpec(car, spec);
  if (spec.stickers) Object.assign(car.mods.stickers, spec.stickers);
  if (spec.mods) Object.assign(car.mods, spec.mods);
  return car;
}
// Cambia piezas de un auto ya armado (sin pernos ni banco: para rivales y pruebas)
function setSpec(car, sp) {
  const fam = MODELS[car.model].fam;
  const set = (sl, part) => { car.p[sl] = part; car.tight[sl] = part ? allBolts(sl) : 0; };
  if (sp.engine) set('engine', makePart('engine', sp.engine));
  const kind = ENGINES[car.p.engine.k].kind;
  if (sp.intake || sp.engine) {
    let ik = sp.intake || (kind === '8' ? '1x4' : '1x2');
    if (!intakeFits(ik, kind)) ik = kind === '8' ? '2x4' : kind === '6' ? '3x2' : '1x2';
    set('intake', makePart('intake', ik, { f: fam }));
    const n = INTAKES[ik].n;
    for (let i = 0; i < 3; i++) set('carb' + i, i < n ? makePart('carb', (sp.carbs && sp.carbs[i]) || INTAKES[ik].carb) : null);
  }
  if (sp.trans) set('trans', makePart('trans', sp.trans, { f: TRANS[sp.trans].all ? 'all' : fam }));
  if (sp.tires) set('tires', makePart('tires', sp.tires));
  if (sp.tune !== undefined) car.tune = sp.tune;
}

// ¿Esta pieza calza en este espacio del auto? Devuelve '' si sí, o el motivo si no.
function fitProblem(car, sl, part) {
  const M = MODELS[car.model], info = SLOT_INFO[sl];
  if (!part || part.t !== info.t) return 'type';
  const eng = car.p.engine;
  switch (sl) {
    case 'engine': return ENGINES[part.k].fam === M.fam ? '' : 'family';
    case 'trans': return part.f === 'all' || part.f === M.fam ? '' : 'family';
    case 'intake':
      if (!eng) return 'noEngine';
      if (part.f !== ENGINES[eng.k].fam) return 'family';
      return intakeFits(part.k, ENGINES[eng.k].kind) ? '' : 'kind';
    case 'tires': return '';
    default: {
      if (!car.p.intake) return 'noIntake';
      const idx = +sl.slice(4), ik = INTAKES[car.p.intake.k];
      if (idx >= ik.n) return 'noRoom';
      return CARBS[part.k].slot === ik.carb ? '' : 'carbType';
    }
  }
}
// El primer espacio libre donde calza la pieza (o null), y si no hay, el motivo
function slotFor(car, part) {
  const cands = SLOTS.filter(sl => SLOT_INFO[sl].t === part.t);
  let why = 'type';
  for (const sl of cands) {
    if (car.p[sl]) { if (why === 'type') why = 'occupied'; continue; }
    const pr = fitProblem(car, sl, part);
    if (!pr) return { sl };
    why = pr;
  }
  return { sl: null, why };
}
// Piezas que impiden sacar la de este espacio
const blockers = (car, sl) => SLOT_INFO[sl].above.filter(a => car.p[a]);

// ¿Anda el auto? Devuelve la lista de problemas (vacía = listo para salir)
function carProblems(car) {
  const out = [], p = car.p;
  for (const sl of ['engine', 'intake', 'trans', 'tires']) if (!p[sl]) out.push('missing:' + sl);
  const n = carbCount(car);
  for (let i = 0; i < n; i++) if (!p['carb' + i]) { out.push('missing:carb'); break; }
  for (const sl of SLOTS) if (p[sl] && (car.tight[sl] || 0) !== allBolts(sl)) { out.push('loose'); break; }
  if (p.engine && p.engine.c <= 0.02) out.push('blown');
  if (p.trans && p.trans.c <= 0.02) out.push('broken');
  if (car.body <= 0.12) out.push('wrecked');
  if (car.fuel <= 0.05) out.push('fuel');
  return out;
}
const carRuns = car => carProblems(car).filter(p => p !== 'fuel').length === 0;

// ----- Números del auto -----
const LB = 0.4536, DRIVER_LB = 165;
// Afinación: tune = grados que el encendido está corrido de la marca (0 = perfecto)
const tuneFactor = t => 1 - Math.min(0.14, Math.abs(t) * 0.014);

function carStats(car) {
  const M = MODELS[car.model], p = car.p;
  const s = { ok: !!(p.engine && p.intake && p.trans && p.tires) };
  const E = ENGINES[(p.engine || { k: M.stock.engine }).k];
  const kind = E.kind, ik = p.intake ? INTAKES[p.intake.k] : INTAKES[kind === '8' ? '1x4' : '1x2'];
  const carbs = [0, 1, 2].slice(0, ik.n).map(i => p['carb' + i]).filter(Boolean);
  const raceCarbs = carbs.length === ik.n && carbs.every(c => c.k === '4R') ? CARBS['4R'].k : 1;
  const ec = p.engine ? p.engine.c : 1;
  s.engine = E; s.cyl = { 4: 4, 6: 6 }[kind] || 8;
  s.hp = E.hp * (ik.k[kind] || 1) * raceCarbs * tuneFactor(car.tune) * (0.62 + 0.38 * ec);
  s.peak = E.rpm; s.red = E.red; s.low = 1;
  const tr = TRANS[p.trans ? p.trans.k : M.stock.trans];
  s.auto = !!tr.auto; s.ratios = tr.ratios;
  s.axle = M.axle;
  const tire = TIRES[p.tires ? p.tires.k : 'std'], tread = p.tires ? p.tires.c : 1;
  s.grip = tire.grip * (0.72 + 0.28 * tread);
  s.lat = tire.lat * (0.78 + 0.22 * tread);
  let lb = M.lb - ENGINES[M.stock.engine].lb + E.lb + DRIVER_LB;
  if (car.mods.strip) lb -= BODYWORK.strip.lb;
  s.lb = lb; s.mass = lb * LB;
  s.cda = M.cda;
  s.handling = clamp(1.06 - (lb - 2700) / 9000 + (M.cda < 0.8 ? 0.06 : 0), 0.82, 1.15);
  s.tc = p.trans ? p.trans.c : 1;
  s.ec = ec;
  return s;
}

// Lo que vale el auto completo, con sus piezas, su carrocería y sus adornos
function stockPartsValue(model) {
  const M = MODELS[model], s = M.stock, n = INTAKES[s.intake].n;
  return ENGINES[s.engine].price + INTAKES[s.intake].price + CARBS[s.carb].price * n + TRANS[s.trans].price[M.fam] + TIRES[s.tires].price;
}
function carValue(car) {
  const M = MODELS[car.model];
  let parts = 0;
  for (const sl of SLOTS) if (car.p[sl]) parts += partValue(car.p[sl]);
  let extras = 0;
  for (const k in car.mods.stickers || {}) if (car.mods.stickers[k]) extras += STICKERS[k];
  if (car.color !== M.colors[0]) extras += PAINT_PRICE * 0.4;
  const chassis = Math.max(40, M.price - 0.8 * stockPartsValue(car.model)) * (0.3 + 0.7 * car.body) * Math.pow(0.9, car.repairs);
  return Math.round(chassis + parts * 0.8 + extras * 0.5);
}
const junkValue = car => {
  let parts = 0;
  for (const sl of SLOTS) if (car.p[sl]) parts += partValue(car.p[sl]);
  return Math.round(MODELS[car.model].price * 0.1 + parts * 0.3);
};
// Arreglar el choque: cuesta más mientras peor quedó. Muy destrozado o arreglado muchas veces = solo chatarra.
const repairCost = car => Math.round(30 + (1 - car.body) * MODELS[car.model].price * 0.55);
const canRepair = car => car.body > 0.15 && car.repairs < 3;
const TANK = 16, GAS_PRICE = 0.31;
