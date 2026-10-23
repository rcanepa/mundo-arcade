// ===== Autos y piezas: qué calza dónde, si el auto anda, cuánta potencia tiene y cuánto vale =====
let _uid = 0;
const newId = p => p + Date.now().toString(36).slice(-5) + (++_uid).toString(36);

// Una pieza suelta o instalada. c = estado (1 = nueva). m = montaje (motor al que calza), f = familia.
function makePart(t, k, o = {}) {
  const p = { id: newId('p'), t, k, c: o.c ?? 1 };
  if (t === 'intake' || t === 'exhaust') p.m = o.m;
  if (t === 'trans') p.f = o.f;
  return p;
}
function partPrice(p) {
  switch (p.t) {
    case 'engine': return ENGINES[p.k].price;
    case 'intake': return INTAKES[p.k].price;
    case 'carb': return CARBS[p.k].price;
    case 'cam': return CAMS[p.k].price;
    case 'exhaust': return EXHAUSTS[p.k].price;
    case 'trans': return TRANS[p.k].price;
    case 'axle': return AXLES[p.k];
    case 'tires': return TIRES[p.k].price;
  }
  return 0;
}
// Lo que vale una pieza usada (al venderla suelta se recibe la mitad)
const partValue = p => partPrice(p) * (0.35 + 0.65 * (p.c ?? 1));

// ----- Espacios del auto y sus pernos -----
// Para sacar una pieza primero hay que sacar las que están encima (needs).
const SLOTS = ['engine', 'cam', 'intake', 'carb0', 'carb1', 'carb2', 'exhaust', 'trans', 'axle', 'tires'];
const SLOT_INFO = {
  engine:  { t: 'engine', bolts: 4, above: ['intake', 'exhaust', 'cam'] },
  cam:     { t: 'cam', bolts: 2, above: ['intake'] },
  intake:  { t: 'intake', bolts: 6, above: ['carb0', 'carb1', 'carb2'] },
  carb0:   { t: 'carb', bolts: 4, above: [] },
  carb1:   { t: 'carb', bolts: 4, above: [] },
  carb2:   { t: 'carb', bolts: 4, above: [] },
  exhaust: { t: 'exhaust', bolts: 6, above: [] },
  trans:   { t: 'trans', bolts: 4, above: [] },
  axle:    { t: 'axle', bolts: 4, above: [] },
  tires:   { t: 'tires', bolts: 4, above: [] }
};
const BAY_SLOTS = ['engine', 'cam', 'intake', 'carb0', 'carb1', 'carb2', 'exhaust'];   // se ven bajo el capó
const UNDER_SLOTS = ['trans', 'axle', 'tires'];                                         // se ven con el auto levantado
const carbCount = car => (car.p.intake ? INTAKES[car.p.intake.k].n : 0);

// Un auto nuevo de un modelo, con sus piezas de fábrica y todos los pernos apretados
function makeCar(model, o = {}) {
  const M = MODELS[model], s = M.stock, mount = engineMount(s.engine);
  const car = {
    id: newId('c'), model, color: o.color || M.colors[0], body: o.body ?? 1, repairs: 0,
    fuel: o.fuel ?? 10, timing: 6, mods: { wheels: 'caps' }, p: {}, tight: {}
  };
  car.p.engine = makePart('engine', s.engine, { c: o.ec ?? 1 });
  car.p.intake = makePart('intake', s.intake, { m: mount });
  for (let i = 0; i < INTAKES[s.intake].n; i++) car.p['carb' + i] = makePart('carb', s.carb);
  car.p.exhaust = makePart('exhaust', 'iron', { m: mount });
  car.p.trans = makePart('trans', s.trans, { f: M.fam, c: o.tc ?? 1 });
  car.p.axle = makePart('axle', s.axle);
  car.p.tires = makePart('tires', s.tires, { c: o.tread ?? 1 });
  if (s.tires === 'ww') car.mods.wheels = 'caps';
  for (const sl of SLOTS) if (car.p[sl]) car.tight[sl] = SLOT_INFO[sl].bolts;
  return car;
}

// Arma un auto completo a partir de una ficha (la del Rey, la de un rival o una de prueba)
function buildCar(spec) {
  const car = makeCar(spec.model, { color: spec.color });
  const fam = MODELS[spec.model].fam, mount = engineMount(spec.engine || car.p.engine.k);
  const set = (sl, part) => { car.p[sl] = part; car.tight[sl] = part ? SLOT_INFO[sl].bolts : 0; };
  if (spec.engine) set('engine', makePart('engine', spec.engine));
  if (spec.intake || spec.engine) {
    const ik = spec.intake || (ENGINES[car.p.engine.k].kind === '8' ? '1x4' : '1x2');
    set('intake', makePart('intake', ik, { m: mount }));
    const n = INTAKES[ik].n, carbs = spec.carbs || Array(n).fill(INTAKES[ik].carb);
    for (let i = 0; i < 3; i++) set('carb' + i, i < n ? makePart('carb', carbs[i] || INTAKES[ik].carb) : null);
  }
  set('exhaust', makePart('exhaust', spec.exhaust || 'iron', { m: mount }));
  if (spec.cam && spec.cam !== 'stock') set('cam', makePart('cam', spec.cam));
  if (spec.trans) set('trans', makePart('trans', spec.trans, { f: fam }));
  if (spec.axle) set('axle', makePart('axle', spec.axle));
  if (spec.tires) set('tires', makePart('tires', spec.tires));
  if (spec.mods) Object.assign(car.mods, spec.mods);
  if (spec.timing) car.timing = spec.timing;
  car.fuel = 16;
  return car;
}

// ¿Esta pieza calza en este espacio del auto? Devuelve '' si sí, o el motivo si no.
function fitProblem(car, sl, part) {
  const M = MODELS[car.model], info = SLOT_INFO[sl];
  if (!part || part.t !== info.t) return 'type';
  const eng = car.p.engine, mount = eng && engineMount(eng.k);
  switch (sl) {
    case 'engine': return ENGINES[part.k].fam === M.fam ? '' : 'family';
    case 'trans': return part.f === M.fam ? '' : 'family';
    case 'cam': return !eng ? 'noEngine' : car.p.intake ? 'blocked' : '';
    case 'intake': return !eng ? 'noEngine' : part.m !== mount ? 'mount' : '';
    case 'exhaust': return !eng ? 'noEngine' : part.m !== mount ? 'mount' : '';
    default:
      if (sl.startsWith('carb')) {
        if (!car.p.intake) return 'noIntake';
        const idx = +sl.slice(4), ik = INTAKES[car.p.intake.k];
        if (idx >= ik.n) return 'noRoom';
        return CARBS[part.k].slot === ik.carb ? '' : 'carbType';
      }
      return '';
  }
}
// El primer espacio libre donde calza la pieza (o null), y si no hay, el motivo
function slotFor(car, part) {
  const cands = SLOTS.filter(sl => SLOT_INFO[sl].t === part.t);
  let why = 'type';
  for (const sl of cands) {
    if (car.p[sl]) { why = why === 'type' ? 'occupied' : why; continue; }
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
  for (const sl of ['engine', 'intake', 'exhaust', 'trans', 'axle', 'tires']) if (!car.p[sl]) out.push('missing:' + sl);
  const n = carbCount(car);
  for (let i = 0; i < n; i++) if (!car.p['carb' + i]) { out.push('missing:carb'); break; }
  for (const sl of SLOTS) if (car.p[sl] && (car.tight[sl] || 0) < SLOT_INFO[sl].bolts) { out.push('loose:' + sl); break; }
  if (p.engine && p.engine.c <= 0.02) out.push('blown');
  if (p.trans && p.trans.c <= 0.02) out.push('broken');
  if (car.body <= 0.12) out.push('wrecked');
  if (car.fuel <= 0.05) out.push('fuel');
  return out;
}
const carRuns = car => carProblems(car).filter(p => p !== 'fuel').length === 0;

// ----- Números del auto -----
const LB = 0.4536, DRIVER_LB = 165;
const timingFactor = t => 1 - 0.004 * (t - 10) * (t - 10);

function carStats(car) {
  const M = MODELS[car.model], p = car.p;
  const s = { ok: !!(p.engine && p.intake && p.trans && p.axle && p.tires) };
  const E = ENGINES[(p.engine || { k: M.stock.engine }).k];
  const kind = E.kind, ik = p.intake ? INTAKES[p.intake.k] : INTAKES[kind === '8' ? '1x4' : '1x2'];
  const carbs = [0, 1, 2].slice(0, ik.n).map(i => p['carb' + i]).filter(Boolean);
  const raceCarbs = carbs.length === ik.n && carbs.every(c => c.k === '4R') ? CARBS['4R'].k : 1;
  const cam = CAMS[p.cam ? p.cam.k : 'stock'];
  const exh = EXHAUSTS[p.exhaust ? p.exhaust.k : 'iron'];
  const ec = p.engine ? p.engine.c : 1;
  s.engine = E; s.cyl = kind === '6' ? 6 : 8;
  s.hp = E.hp * (ik.k[kind] || 1) * raceCarbs * cam.k * exh.k * timingFactor(car.timing) * (0.62 + 0.38 * ec);
  s.peak = E.rpm + cam.rpm;
  s.red = E.red + cam.rpm * 0.8;
  s.low = cam.low;
  const tr = TRANS[p.trans ? p.trans.k : M.stock.trans];
  s.auto = !!tr.auto; s.ratios = tr.ratios;
  s.axle = parseFloat(p.axle ? p.axle.k : M.stock.axle);
  const tire = TIRES[p.tires ? p.tires.k : 'std'], tread = p.tires ? p.tires.c : 1;
  s.grip = tire.grip * (0.72 + 0.28 * tread);
  s.lat = tire.lat * (0.78 + 0.22 * tread);
  let lb = M.lb - ENGINES[M.stock.engine].lb + E.lb + DRIVER_LB;
  if (car.mods.nobump) lb -= MODS.nobump.w;
  s.lb = lb; s.mass = lb * LB;
  s.cda = M.cda * (car.mods.chop ? 1 - MODS.chop.drag : 1) * (car.mods.lowered ? 1 - MODS.lowered.drag : 1);
  s.handling = clamp(1.06 - (lb - 2700) / 9000 + (car.mods.lowered ? MODS.lowered.handling : 0) + (M.year >= 1958 && M.cda < 0.8 ? 0.06 : 0), 0.82, 1.15);
  s.tc = p.trans ? p.trans.c : 1;
  s.ec = ec;
  return s;
}

// Lo que vale el auto completo, con sus piezas, su carrocería y sus arreglos
function stockPartsValue(model) {
  const s = MODELS[model].stock, n = INTAKES[s.intake].n;
  return ENGINES[s.engine].price + INTAKES[s.intake].price + CARBS[s.carb].price * n + EXHAUSTS.iron.price +
    TRANS[s.trans].price + AXLES[s.axle] + TIRES[s.tires].price;
}
function carValue(car) {
  const M = MODELS[car.model];
  let parts = 0;
  for (const sl of SLOTS) if (car.p[sl]) parts += partValue(car.p[sl]);
  let mods = 0;
  for (const k in MODS) if (car.mods[k]) mods += MODS[k].price;
  mods += WHEELS[car.mods.wheels] || 0;
  const paint = paintOf(car.color);
  if (paint && paint.candy) mods += 40;
  const chassis = Math.max(40, M.price - 0.8 * stockPartsValue(car.model)) * (0.3 + 0.7 * car.body) * Math.pow(0.9, car.repairs);
  return Math.round(chassis + parts * 0.8 + mods * 0.5);
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
