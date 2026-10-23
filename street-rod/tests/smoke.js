// Pruebas automáticas: corren el juego armado (index.html) sin navegador, con una página de mentira,
// y revisan que los autos, las piezas, el taller, el diario, las carreras, los rivales, El Rey y el guardado sigan funcionando.
// Uso: node tests/smoke.js   (build.sh las corre solo después de armar el juego)
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const code = html.slice(html.indexOf('<script>') + '<script>'.length, html.lastIndexOf('</script>'));

// --- un navegador mínimo: lo justo para que el juego cargue y dibuje "en el aire" ---
function fakeContext2d() {
  return new Proxy({}, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return s => ({ width: String(s).length * 8 });
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; }
  });
}
function fakeEl() {
  return {
    style: {}, dataset: {}, hidden: false, innerHTML: '', textContent: '', width: 0, height: 0, firstChild: null,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {}, removeEventListener() {}, focus() {}, select() {}, closest: () => null,
    querySelector: () => null, querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 1280, bottom: 720, width: 1280, height: 720 }),
    getContext: fakeContext2d, toDataURL: () => 'data:,'
  };
}
const memory = {};
const sandbox = {
  console, Math, JSON, Date, performance, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0,
  Path2D: class { moveTo() {} lineTo() {} quadraticCurveTo() {} bezierCurveTo() {} closePath() {} arc() {} rect() {} },
  localStorage: { getItem: k => (k in memory ? memory[k] : null), setItem: (k, v) => { memory[k] = String(v); }, removeItem: k => { delete memory[k]; } },
  navigator: { language: 'es-CL', getGamepads: () => [] },
  location: { pathname: '/street-rod/index.html', search: '', href: '' },
  innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, matchMedia: () => ({ matches: false }),
  requestAnimationFrame: () => 0, addEventListener() {},
  document: { createElement: fakeEl, getElementById: fakeEl, documentElement: {}, addEventListener() {}, title: '', hidden: false }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'index.html' });
const get = name => vm.runInContext(name, sandbox);
const run = src => vm.runInContext(src, sandbox);

// --- utilidades ---
let failed = 0;
function check(name, fn) {
  try { fn(); console.log('  ✔ ' + name); }
  catch (e) { failed++; console.log('  ✘ ' + name + '\n      ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n      ') : e)); }
}
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const num = (v, msg) => assert(typeof v === 'number' && isFinite(v), msg + ' (' + v + ')');

const STR = get('STR'), MODELS = get('MODELS'), MODEL_KEYS = get('MODEL_KEYS'), ENGINES = get('ENGINES'), RIVALS = get('RIVALS');
const makeCar = get('makeCar'), buildCar = get('buildCar'), carStats = get('carStats'), carET = get('carET'), carValue = get('carValue');
const carRuns = get('carRuns'), carProblems = get('carProblems'), makePart = get('makePart'), slotFor = get('slotFor'), fitProblem = get('fitProblem');
const Race = get('Race'), newGame = get('newGame'), KING = get('KING'), KING_WINS = get('KING_WINS');
const state = () => get('S');

// Corre una carrera con los dos autos manejados por la computadora hasta que termine
function driveRace(opts, maxSeconds = 320) {
  const r = new Race(Object.assign({ auto: true }, opts));
  let n = 0;
  while (r.phase !== 'done' && n < 60 * maxSeconds) { r.update(1 / 60); n++; }
  for (let i = 0; i < 90; i++) r.update(1 / 60);
  return r;
}
const rival = (car, skill = 0.8) => ({ id: 'gato', name: 'Gato', look: RIVALS[0].look, car, skill });

console.log('Pruebas de Street Rod');

check('los textos en español e inglés tienen las mismas claves', () => {
  const walk = (a, b, where) => {
    for (const k of Object.keys(a)) {
      assert(k in b, `falta "${where}${k}" en inglés`);
      if (a[k] && typeof a[k] === 'object') {
        if (Array.isArray(a[k])) assert(Array.isArray(b[k]) && a[k].length === b[k].length, `"${where}${k}" no tiene el mismo largo`);
        walk(a[k], b[k], where + k + '.');
      }
    }
    for (const k of Object.keys(b)) assert(k in a, `falta "${where}${k}" en español`);
  };
  walk(STR.es, STR.en, '');
});

check('todos los autos se arman, andan y tienen números razonables', () => {
  for (const k of MODEL_KEYS) {
    const car = k === 'vette63' ? buildCar(KING.car) : makeCar(k);
    assert(carRuns(car), `${k} no anda de fábrica: ${carProblems(car)}`);
    const st = carStats(car), q = carET(car);
    num(st.hp, k + ' potencia'); num(q.et, k + ' tiempo');
    assert(q.et > 12 && q.et < 24, `${k}: cuarto de milla raro (${q.et.toFixed(2)} s)`);
    assert(carValue(car) > 100, `${k}: vale muy poco`);
  }
});

check('más motor = cuarto de milla más rápido', () => {
  const base = makeCar('chevy57');
  const hot = buildCar({ model: 'chevy57', engine: 'gm409', intake: 'race', carbs: ['4R', '4R'], cam: 'full', exhaust: 'hdr', trans: 'man4cr', axle: '4.11', tires: 'slick' });
  assert(carET(hot).et < carET(base).et - 2, `el 409 no gana: ${carET(hot).et.toFixed(2)} vs ${carET(base).et.toFixed(2)}`);
  const tuned = makeCar('chevy57'); tuned.timing = 10;
  assert(carET(tuned).et < carET(base).et, 'afinar el encendido no ayuda');
});

check('las piezas solo calzan donde corresponde', () => {
  const car = makeCar('chevy57');
  assert(fitProblem(car, 'engine', makePart('engine', 'fd390')) === 'family', 'un motor Ford entró en un Chevrolet');
  assert(fitProblem(car, 'trans', makePart('trans', 'man4', { f: 'mopar' })) === 'family', 'una caja Chrysler entró en un Chevrolet');
  assert(fitProblem(car, 'intake', makePart('intake', '3x2', { m: 'ford8' })) === 'mount', 'un múltiple Ford entró en un motor Chevrolet');
  // el múltiple de 4 bocas no acepta carburadores de 2
  assert(fitProblem(car, 'carb1', makePart('carb', '4')) === 'noRoom', 'cabe un segundo carburador en un 1×4');
  car.p.carb0 = null;
  assert(fitProblem(car, 'carb0', makePart('carb', '2')) === 'carbType', 'un carburador de 2 bocas entró en un múltiple de 4');
  assert(fitProblem(car, 'carb0', makePart('carb', '4R')) === '', 'el carburador de carrera no calza en el de 4 bocas');
  assert(slotFor(car, makePart('tires', 'slick')).why === 'occupied', 'se pueden poner neumáticos sin sacar los viejos');
});

check('taller: desarmar en orden, armar y apretar los pernos', () => {
  newGame('Test', 5);
  const S = state(), car = makeCar('chevy57');
  S.cars.push(car); S.active = car.id;
  const mechClick = get('mechClick'), mechUpdate = get('mechUpdate'), installPart = get('installPart'), Mech = get('Mech');
  const work = () => { for (let i = 0; i < 400 && Mech.queue.length; i++) mechUpdate(car, 1 / 30); };
  assert(mechClick(car, 'intake').blocked.includes('carb0'), 'se pudo sacar el múltiple con el carburador puesto');
  mechClick(car, 'carb0'); work();
  assert(!car.p.carb0 && S.bench.length === 1, 'no salió el carburador');
  mechClick(car, 'intake'); work();
  assert(!car.p.intake, 'no salió el múltiple');
  assert(!carRuns(car), 'el auto anda sin múltiple');
  // un múltiple de dos cuádruples con dos carburadores nuevos
  S.bench.push(makePart('intake', '2x4', { m: 'gm8' }), makePart('carb', '4'));
  const ids = S.bench.map(p => p.id);
  assert(installPart(car, ids.find(id => S.bench.find(p => p.id === id).t === 'carb')).why === 'noIntake', 'entró un carburador sin múltiple');
  const r = installPart(car, S.bench.find(p => p.k === '2x4').id);
  assert(r.sl === 'intake', 'no entró el múltiple 2×4');
  assert(carProblems(car).includes('loose:intake'), 'los pernos nuevos no quedaron sueltos');
  mechClick(car, 'intake'); work();
  for (const p of S.bench.filter(p => p.t === 'carb')) installPart(car, p.id);
  assert(car.p.carb0 && car.p.carb1, 'no entraron los dos carburadores');
  mechClick(car, 'carb0'); work(); mechClick(car, 'carb1'); work();
  assert(carRuns(car), 'el auto armado no anda: ' + carProblems(car));
});

check('el diario de todo el verano: siempre hay un auto barato y precios con sentido', () => {
  newGame('Test', 77);
  const S = state(), makePaper = get('makePaper');
  for (let d = 0; d < 81; d++) {
    S.day = d; makePaper();
    const prices = S.paper.ads.map(a => a.price);
    assert(prices.every(p => p > 0 && isFinite(p)), `día ${d}: precio raro`);
    assert(Math.min(...prices) <= 450, `día ${d}: no hay autos baratos (${Math.min(...prices)})`);
    assert(S.paper.ads.every(a => carRuns(a.car)), `día ${d}: vende un auto que no anda`);
    assert(S.paper.parts.length === 5, `día ${d}: faltan repuestos`);
  }
});

check('los rivales traen autos parecidos al tuyo', () => {
  const makeRivalCar = get('makeRivalCar');
  for (const target of [21, 19, 17, 15.5, 14]) {
    for (const r of [RIVALS[0], RIVALS[4], RIVALS[9]]) {
      const car = makeRivalCar(r, target, () => 0.5);
      const et = carET(car).et;
      assert(carRuns(car), `${r.id} trae un auto que no anda`);
      assert(Math.abs(et - target) < 1.1 || (target > 20 && et < target), `${r.id} pidió ${target} s y trajo ${et.toFixed(2)} s`);
    }
  }
});

check('picada: los dos llegan y hay ganador', () => {
  for (let i = 0; i < 4; i++) {
    const r = driveRace({ type: 'drag', car: makeCar('chevy57', { fuel: 10 }), rival: rival(makeCar('tbird57')), bet: 10, seed: 3 + i });
    const res = r.result;
    assert(res && ['win', 'lose'].includes(res.outcome), 'la picada no terminó: ' + (res && res.reason));
    if (res.reason === 'finish') { num(res.time, 'tiempo'); num(res.rivalTime, 'tiempo del rival'); assert(res.time > 10 && res.time < 30, 'tiempo raro ' + res.time); }
  }
});

check('carrera de ruta: se completa sin quedarse pegado', () => {
  let finished = 0;
  for (let i = 0; i < 4; i++) {
    const r = driveRace({ type: 'road', car: makeCar('impala61', { fuel: 12 }), rival: rival(makeCar('chevy57')), bet: 25, seed: 100 + i * 17, police: 0 });
    assert(r.result, 'la carrera no terminó');
    if (r.result.reason === 'finish') finished++;
  }
  assert(finished >= 3, `solo ${finished} de 4 carreras llegaron a la meta`);
});

check('la policía aparece y la carrera se anula si te pillan o te detienes', () => {
  let cops = 0;
  for (let i = 0; i < 3; i++) {
    const r = new Race({ type: 'road', car: makeCar('chevy49', { fuel: 12 }), rival: rival(makeCar('falcon60')), bet: 25, seed: 9 + i, police: 1, auto: true });
    let n = 0;
    while (r.phase !== 'done' && n < 60 * 320) { r.update(1 / 60); if (r.cop) cops++; n++; }
    assert(r.result, 'no terminó');
    if (['caught', 'stopped'].includes(r.result.reason)) assert(r.result.outcome === 'void' && r.result.fine > 0, 'la multa no se aplicó');
  }
  assert(cops > 0, 'la policía nunca apareció');
});

check('largar antes de la bandera es falta', () => {
  const r = new Race({ type: 'drag', car: makeCar('chevy57', { fuel: 8 }), rival: rival(makeCar('chevy55')), bet: 10, seed: 1 });
  run('Input.read = () => ({ gas: true, brake: false, steer: 0, up: true, down: false, horn: false })');
  for (let i = 0; i < 200 && r.phase !== 'done'; i++) r.update(1 / 60);
  assert(r.result && r.result.reason === 'foul' && r.result.outcome === 'lose', 'la largada anticipada no se castigó');
});

check('raspar la caja a fondo la rompe', () => {
  const v = new (get('Vehicle'))(carStats(makeCar('chevy57')));
  v.s.auto = false; v.s.ratios = [2.54, 1.92, 1.51, 1]; v.launch();
  for (let i = 0; i < 12 && !v.broken; i++) { v.throttle = 1; v.shiftT = 0; v.gear = 1; v.shiftUp(); }
  assert(v.broken, 'la caja aguantó doce raspadas');
});

check('una noche completa en el drive-in con dinero, victorias y desgaste', () => {
  newGame('Test', 31);
  const S = state(), buyAd = get('buyAd'), goDiner = get('goDiner'), nextRival = get('nextRival'), raceOptions = get('raceOptions'), applyResult = get('applyResult'), endNight = get('endNight');
  S.money = 5000;
  assert(buyAd(S.paper.ads.findIndex(a => MODELS[a.car.model].fam)) === '', 'no se pudo comprar un auto');
  const car = get('activeCar')(); car.fuel = 16;
  assert(goDiner() === '', 'no se pudo ir al drive-in');
  let races = 0;
  for (let k = 0; k < 4; k++) {
    const cur = nextRival();
    if (!cur) break;
    const opts = raceOptions(cur.id, k % 2 ? 'road' : 'drag', k % 2 ? 25 : 10);
    opts.police = 0;
    const r = driveRace(opts);
    const out = applyResult(opts, r.result);
    races++;
    assert(out && isFinite(S.money), 'el dinero quedó raro');
    if (!S.night) break;
  }
  assert(races > 0, 'nadie llegó al drive-in');
  assert(S.wins + S.losses + S.history.filter(h => h.o === 'void').length === races, 'las cuentas de carreras no cuadran');
  const day = S.day; endNight();
  assert(S.day === day + 1 && S.paper.day === S.day, 'no pasó al otro día');
});

check('apostar los papeles: si pierdes te quedas sin auto, si ganas te llevas el suyo', () => {
  newGame('Test', 41);
  const S = state(), applyResult = get('applyResult');
  const mine = makeCar('chevy57'), theirs = makeCar('fury58');
  S.cars.push(mine); S.active = mine.id; S.night = { min: 0, queue: [], cur: null, raced: [] };
  const opts = { type: 'road', bet: 'pinks', car: mine, rival: { id: 'rita', name: 'Rita', car: theirs, skill: 0.8 } };
  applyResult(opts, { outcome: 'win', reason: 'finish', engineDmg: 0, transDmg: 0, body: 0, fuel: 1, tread: 0.05 });
  assert(S.cars.some(c => c.model === 'fury58'), 'no te llevaste el Fury');
  const opts2 = Object.assign({}, opts, { rival: { id: 'vince', name: 'Vince', car: makeCar('dart62'), skill: 0.8 } });
  applyResult(opts2, { outcome: 'lose', reason: 'finish', engineDmg: 0, transDmg: 0, body: 0, fuel: 1, tread: 0.05 });
  assert(!S.cars.some(c => c.id === mine.id), 'perdiste los papeles pero conservas el auto');
});

check('sin auto y sin plata se acaba el juego', () => {
  newGame('Test', 51);
  const S = state(); S.money = 20; S.cars = [];
  get('checkBroke')();
  assert(S.over === 'broke', 'el juego siguió sin auto ni dinero');
});

check('sin plata para la multa: castigado cinco días', () => {
  newGame('Test', 61);
  const S = state(), applyResult = get('applyResult'), endNight = get('endNight');
  const car = makeCar('chevy49'); S.cars.push(car); S.active = car.id; S.money = 5; S.night = { min: 0, queue: [], cur: null, raced: [] };
  const out = applyResult({ type: 'road', bet: 25, car, rival: { id: 'eddie', name: 'Eddie', car: makeCar('falcon60'), skill: 0.5 } },
    { outcome: 'void', reason: 'caught', fine: 75, engineDmg: 0, transDmg: 0, body: 0, fuel: 1, tread: 0.05 });
  assert(out.jail, 'no hubo castigo');
  endNight();
  assert(S.day === 5 && S.money === 0, `el castigo no duró cinco días (día ${S.day})`);
});

check('El Rey aparece un sábado con 10 victorias, y ganarle termina el verano', () => {
  newGame('Test', 71);
  const S = state(), nightQueue = get('nightQueue'), applyResult = get('applyResult');
  S.wins = KING_WINS - 1;
  S.day = 1;   // sábado 15 de junio
  assert(get('isSaturday')(S.day), 'el 15 de junio de 1963 no es sábado');
  assert(!nightQueue().includes('king'), 'El Rey apareció antes de tiempo');
  S.wins = KING_WINS;
  assert(nightQueue().includes('king'), 'El Rey no apareció');
  S.day = 2;
  assert(!nightQueue().includes('king'), 'El Rey apareció un domingo');
  // un auto preparado para ganarle
  const mine = buildCar({ model: 'corvette58', engine: 'gm409', intake: 'race', carbs: ['4R', '4R'], cam: 'full', exhaust: 'hdr', trans: 'man4cr', axle: '4.11', tires: 'wide' });
  mine.timing = 10; S.cars.push(mine); S.active = mine.id; S.night = { min: 0, queue: [], cur: null, raced: [] };
  const opts = { type: 'road', bet: 'pinks', car: mine, seed: 5, rival: { id: 'king', name: 'El Rey', look: KING.look, car: buildCar(KING.car), skill: KING.skill, king: true }, police: 0 };
  const r = driveRace(opts);
  assert(r.result, 'la carrera con El Rey no terminó');
  applyResult(opts, { outcome: 'win', reason: 'finish', engineDmg: 0, transDmg: 0, body: 0, fuel: 1, tread: 0.05 });
  assert(S.over === 'king' && S.kingBeaten, 'ganarle al Rey no terminó el juego');
  assert(S.cars.some(c => c.model === 'vette63'), 'no te quedaste con el Corvette del Rey');
});

check('sin tiempos (falta, choque, policía) no se muestra la tabla de tiempos', () => {
  newGame('Tabla', 101);
  const S = state(), Game = get('Game'), UI = get('UI'), uiEl = get('uiEl');
  const car = makeCar('chevy57'); S.cars.push(car); S.active = car.id;
  Game.raceOpts = { type: 'drag', bet: 10, car, rival: { id: 'slim', name: 'Jim', car: makeCar('chevy49'), skill: 0.6 } };
  const base = { engineDmg: 0, transDmg: 0, body: 0, fuel: 0.1, tread: 0.02, fine: 0 };
  Game.out = { res: Object.assign({ outcome: 'win', reason: 'rivalFoul', time: null, rivalTime: null }, base), lines: [], money: 10 };
  Game.scene = 'result'; UI.render();
  assert(!uiEl.innerHTML.includes('<table>'), 'la falta muestra una tabla de tiempos vacía');
  Game.out = { res: Object.assign({ outcome: 'win', reason: 'finish', time: 17.2, rivalTime: 18.1, trap: 38, reaction: 0.3 }, base), lines: [], money: 10 };
  UI.render();
  assert(uiEl.innerHTML.includes('<table>'), 'una picada terminada no muestra los tiempos');
});

check('el guardado se recupera igual', () => {
  newGame('Guardado', 81);
  const S = state(); S.money = 1234; S.cars.push(makeCar('tbird57')); S.active = S.cars[0].id;
  get('saveGame')();
  const before = JSON.stringify(S);
  run('S = null');
  assert(get('loadGame')(), 'no se pudo cargar');
  assert(JSON.stringify(get('S')) === before, 'lo cargado no es igual a lo guardado');
});

check('todas las pantallas se dibujan sin errores', () => {
  newGame('Pantallas', 91);
  const S = state(), Game = get('Game'), UI = get('UI'), draw = get('draw'), update = get('update');
  S.cars.push(makeCar('chevy57')); S.active = S.cars[0].id; S.bench.push(makePart('carb', '4R'));
  for (const sc of ['title', 'garage', 'paper', 'shop', 'body', 'gas']) { Game.go(sc); draw(); update(1 / 60); }
  for (const tab of ['cars', 'parts', 'sell']) { Game.paperTab = tab; Game.go('paper'); }
  get('Mech').view = 'under'; Game.go('shop'); draw();
  for (const m of ['license', 'how', 'cars']) { Game.modal = m; UI.render(); }
  get('goDiner')(); Game.go('diner'); Game.arrive();
  for (let i = 0; i < 300; i++) update(1 / 60);
  draw();
  Game.chal = { type: 'drag', bet: 0 }; UI.render();
  Game.startRace(); Game.race = new Race(Object.assign({}, Game.raceOpts, { auto: true }));
  for (let i = 0; i < 60 * 40 && !Game.race.over; i++) update(1 / 60);
  draw();
  Game.finishRace(); draw();
  assert(Game.scene === 'result', 'no se mostraron los resultados');
  for (const over of ['king', 'summer', 'broke']) { S.over = over; Game.go('end'); draw(); }
  get('setLang')('en'); Game.go('garage'); get('setLang')('es');
});

if (failed) { console.log(`\n${failed} prueba(s) fallaron`); process.exit(1); }
console.log('\nTodo bien ✔');
