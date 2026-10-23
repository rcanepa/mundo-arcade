// Pruebas automáticas: corren el juego armado (index.html) sin navegador, con una página de mentira,
// y revisan que los autos, las piezas, los pernos, el diario, las carreras, los rivales, El Rey y el guardado sigan funcionando.
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
      if (k === 'getImageData' || k === 'putImageData') return undefined;    // sin píxeles: se salta el paso a la paleta
      if (k === 'createLinearGradient' || k === 'createRadialGradient') return () => ({ addColorStop() {} });
      if (k === 'measureText') return s => ({ width: String(s).length * 8 });
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; }
  });
}
function fakeEl() {
  return {
    style: {}, dataset: {}, hidden: false, value: '', width: 0, height: 0,
    addEventListener() {}, removeEventListener() {}, focus() {}, blur() {}, setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 640, bottom: 400, width: 640, height: 400 }),
    getContext: fakeContext2d
  };
}
const memory = {};
const sandbox = {
  console, Math, JSON, Date, performance, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0,
  localStorage: { getItem: k => (k in memory ? memory[k] : null), setItem: (k, v) => { memory[k] = String(v); }, removeItem: k => { delete memory[k]; } },
  navigator: { language: 'es-CL', getGamepads: () => [] },
  location: { pathname: '/street-rod/index.html', search: '', href: '' },
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, matchMedia: () => ({ matches: false }),
  requestAnimationFrame: () => 0, addEventListener() {},
  document: { createElement: fakeEl, getElementById: fakeEl, documentElement: {}, addEventListener() {}, title: '', hidden: false, activeElement: null }
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

const STR = get('STR'), MODELS = get('MODELS'), MODEL_KEYS = get('MODEL_KEYS'), RIVALS = get('RIVALS'), SLOT_INFO = get('SLOT_INFO');
const makeCar = get('makeCar'), buildCar = get('buildCar'), carStats = get('carStats'), carET = get('carET'), carValue = get('carValue');
const carRuns = get('carRuns'), carProblems = get('carProblems'), makePart = get('makePart'), fitProblem = get('fitProblem'), allBolts = get('allBolts');
const Race = get('Race'), newGame = get('newGame'), KING = get('KING'), Game = get('Game'), UI = get('UI');
const state = () => get('S');

// Corre una carrera con los dos autos manejados por la computadora hasta que termine
function driveRace(opts, maxSeconds = 320) {
  const r = new Race(Object.assign({ auto: true }, opts));
  let n = 0;
  while (r.phase !== 'done' && n < 60 * maxSeconds) { r.update(1 / 60); n++; }
  for (let i = 0; i < 90; i++) r.update(1 / 60);
  return r;
}
const rival = (car, skill = 0.8) => ({ id: 'steve', name: 'Steve', look: RIVALS[0].look, car, skill });
// Saca todos los pernos de una pieza (y la pieza, si quedó suelta)
function unbolt(car, sl) { for (let i = 0; i < SLOT_INFO[sl].bolts; i++) get('loosenBolt')(car, sl, i); return get('removePart')(car, sl); }
function boltAll(car, sl) { for (let i = 0; i < SLOT_INFO[sl].bolts; i++) get('tightenBolt')(car, sl, i); }
// Un cuadro completo: lógica y dibujo, como en el navegador
function frames(n = 2) { for (let i = 0; i < n; i++) { Game.update(1 / 60); Game.draw(get('ctx')); } }

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

check('cada auto tiene sus imágenes de lado, de atrás y de frente, con su máscara de pintura', () => {
  const IMG = get('CAR_IMG'), META = get('CAR_META');
  for (const k of MODEL_KEYS) {
    for (const v of ['side', 'rear', 'front']) for (const suf of ['', '_mask']) assert(IMG[`${k}_${v}${suf}`] && IMG[`${k}_${v}${suf}`].startsWith('data:image/webp'), `falta la imagen ${k}_${v}${suf}`);
    assert(META[k] && META[k].img && META[k].ground > 0.8, `faltan los datos de la imagen de ${k}`);
  }
});

// Ancho y alto de una imagen WebP (leídos de su encabezado)
function webpSize(dataUrl) {
  const b = Buffer.from(dataUrl.split(',')[1], 'base64'), kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (kind === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
}
check('las máscaras de pintura calzan justo con sus imágenes', () => {
  const IMG = get('CAR_IMG'), META = get('CAR_META');
  for (const k of MODEL_KEYS) for (const v of ['side', 'rear', 'front']) {
    const a = webpSize(IMG[`${k}_${v}`]), m = webpSize(IMG[`${k}_${v}_mask`]);
    assert(a[0] === m[0] && a[1] === m[1], `${k}_${v}: la imagen mide ${a} y la máscara ${m}`);
    assert(a[0] === META[k].img[v][0] && a[1] === META[k].img[v][1], `${k}_${v}: los datos dicen ${META[k].img[v]} y la imagen mide ${a}`);
  }
});

check('los 21 autos del diario se arman, andan y tienen números razonables', () => {
  assert(MODEL_KEYS.length === 21, 'deberían ser 21 modelos');
  for (const k of MODEL_KEYS) {
    const car = makeCar(k);
    assert(carRuns(car), `${k} no anda de fábrica: ${carProblems(car)}`);
    const st = carStats(car), q = carET(car);
    num(st.hp, k + ' potencia'); num(q.et, k + ' tiempo');
    assert(q.et > 12 && q.et < 28, `${k}: cuarto de milla raro (${q.et.toFixed(2)} s)`);
    assert(carValue(car) > 100, `${k}: vale muy poco`);
  }
  assert(carET(buildCar(KING.car)).et < 14.5, 'el Corvette de El Rey debería ser el más rápido');
  // la progresión: los autos baratos son lentos y los caros rápidos
  const cheap = MODEL_KEYS.filter(k => MODELS[k].price <= 350), pricey = MODEL_KEYS.filter(k => MODELS[k].price >= 1600);
  const avg = ks => ks.reduce((a, k) => a + carET(makeCar(k)).et, 0) / ks.length;
  assert(avg(cheap) > avg(pricey) + 3, 'los autos baratos andan casi igual que los caros');
});

check('más motor = más rápido; mal afinado = más lento', () => {
  const base = makeCar('chevy57');
  const hot = buildCar({ model: 'chevy57', engine: 'gm327', intake: 'race', carbs: ['4R', '4R'], trans: 'race4', tires: 'slick' });
  assert(carET(hot).et < carET(base).et - 1.5, `el 327 no gana: ${carET(hot).et.toFixed(2)} vs ${carET(base).et.toFixed(2)}`);
  const off = makeCar('chevy57'); off.tune = 7;
  assert(carET(off).et > carET(base).et, 'el encendido corrido no se nota');
});

check('las piezas solo calzan en su marca y donde corresponde', () => {
  newGame('Piezas', 3);
  const car = makeCar('chevy57');
  assert(fitProblem(car, 'engine', makePart('engine', 'fd390')) === 'family', 'un motor Ford calzó en un Chevrolet');
  assert(fitProblem(car, 'engine', makePart('engine', 'gm409')) === '', 'un motor GM no calzó en un Chevrolet');
  assert(fitProblem(car, 'trans', makePart('trans', 'man4u', { f: 'all' })) === '', 'la caja universal no calzó');
  assert(fitProblem(car, 'trans', makePart('trans', 'man4', { f: 'mopar' })) === 'family', 'una caja Chrysler calzó en un Chevrolet');
  assert(fitProblem(car, 'intake', makePart('intake', '3x2', { f: 'gm' })) === 'kind', 'un múltiple de 6 cilindros calzó en un V-8');
  // en un 2 × 4 bocas no va un carburador de 2 bocas
  const t = buildCar({ model: 'chevy57', intake: '2x4' });
  unbolt(t, 'carb1');
  assert(fitProblem(t, 'carb1', makePart('carb', '2')) === 'carbType', 'un carburador de 2 bocas calzó en un múltiple de 4');
  assert(fitProblem(t, 'carb1', makePart('carb', '4R')) === '', 'el carburador de carrera no calzó');
});

check('taller: los pernos se sacan en orden, la pieza sale y vuelve a entrar', () => {
  newGame('Taller', 5);
  const S = state(), car = makeCar('chevy57');
  S.cars.push(car); S.active = car.id;
  assert(!get('loosenBolt')(car, 'intake', 0), 'se soltó el múltiple con el carburador puesto');
  get('loosenBolt')(car, 'carb0', 0);
  assert(!carRuns(car) && carProblems(car).includes('loose'), 'con un perno suelto el auto igual anda');
  assert(unbolt(car, 'carb0'), 'el carburador no salió');
  assert(unbolt(car, 'intake') && unbolt(car, 'engine'), 'el motor no salió');
  assert(S.spares.length === 3, 'las piezas no quedaron en el estante');
  const install = id => get('installPart')(car, id);
  assert(install(S.spares.find(p => p.t === 'intake').id).why === 'noEngine', 'el múltiple entró sin motor');
  for (const t of ['engine', 'intake', 'carb']) { const r = install(S.spares.find(p => p.t === t).id); assert(r.sl, 'no entró: ' + t + ' ' + r.why); boltAll(car, r.sl); }
  assert(carRuns(car), 'el auto armado de nuevo no anda: ' + carProblems(car));
  assert(car.tight.engine === allBolts('engine'), 'los pernos no quedaron apretados');
});

check('el diario de todo el verano: siempre hay un auto barato que anda', () => {
  newGame('Diario', 11);
  const S = state();
  for (let d = 0; d < 30; d++) {
    const ads = S.paper.ads;
    assert(ads.length === 8, 'el diario no trae 8 autos');
    assert(ads[0].price <= 450 && carRuns(ads[0].car), 'no hay un cacharro barato que ande');
    for (const a of ads) assert(a.price > 0 && a.min <= a.price, 'precio raro');
    assert(S.paper.used.length === 4, 'no hay repuestos usados');
    get('endNight')();
  }
  assert(get('catalog')().length > 50, 'el catálogo de repuestos está corto');
});

check('comprar, regatear y vender', () => {
  newGame('Compras', 21);
  const S = state(), ad = S.paper.ads[0];
  assert(!get('haggle')(0, Math.max(5, ad.min - 50)), 'el vendedor aceptó muy poca plata');
  assert(!get('haggle')(0, ad.price), 'se pudo regatear dos veces');
  const money0 = S.money;
  assert(get('buyCar')(0, ad.price) === '' && S.money === money0 - ad.price && S.cars.length === 1, 'no se pudo comprar el auto');
  assert(get('buyCar')(0, ad.price) === 'gone', 'se compró dos veces el mismo auto');
  newGame('Regateo', 22);
  const S2 = state(), ad2 = S2.paper.ads[1];
  assert(get('haggle')(1, ad2.min) && ad2.price === ad2.min, 'ofrecer el mínimo no funcionó');
  const p = makePart('carb', '4'); S2.spares.push(p);
  const offer = get('buyerOffer')(get('partWorth')(p), 0);
  assert(offer > 0 && offer < 60, 'oferta rara por un carburador: ' + offer);
  get('sellPart')(p.id, offer);
  assert(!S2.spares.length && S2.money === 750 + offer, 'la venta no se registró');
});

check('los rivales traen su auto de siempre, parecido al tuyo', () => {
  newGame('Rivales', 31);
  const S = state(), car = makeCar('chevy57', { fuel: 16 });
  S.cars.push(car); S.active = car.id;
  for (const r of RIVALS.slice(0, 9)) {
    const rc = get('rivalCar')(r.id);
    assert(rc.model === r.model, `${r.name} no vino en su ${r.model}`);
    assert(carRuns(rc), `el auto de ${r.name} no anda`);
    assert(Math.abs(carET(rc).et - carET(car).et) < 3.5, `${r.name} trae un auto muy distinto (${carET(rc).et.toFixed(1)} vs ${carET(car).et.toFixed(1)})`);
  }
});

check('picada: los dos llegan a la meta y hay ganador', () => {
  for (let i = 0; i < 3; i++) {
    const r = driveRace({ type: 'drag', car: makeCar('chevy57', { fuel: 10 }), rival: rival(makeCar('nomad56')), bet: 10, seed: 3 + i });
    const res = r.result;
    assert(res && ['win', 'lose'].includes(res.outcome), 'la picada no terminó: ' + (res && res.reason));
    if (res.reason === 'finish') { num(res.time, 'tiempo'); num(res.rivalTime, 'tiempo del rival'); assert(res.time > 20 && res.time < 50, 'tiempo raro ' + res.time); }
  }
});

check('carrera de ruta: se completa sin quedarse pegado', () => {
  let finished = 0;
  for (let i = 0; i < 4; i++) {
    const r = driveRace({ type: 'road', car: makeCar('pont58', { fuel: 14 }), rival: rival(makeCar('chevy57')), bet: 25, seed: 100 + i * 17, police: 0 });
    assert(r.result, 'la carrera no terminó');
    if (r.result.reason === 'finish') finished++;
  }
  assert(finished >= 3, `solo ${finished} de 4 carreras llegaron a la meta`);
});

check('la policía aparece y la carrera se anula si te pillan', () => {
  let cops = 0;
  for (let i = 0; i < 3; i++) {
    const r = new Race({ type: 'road', car: makeCar('chevy49', { fuel: 14 }), rival: rival(makeCar('valiant60')), bet: 25, seed: 9 + i, police: 1, auto: true });
    let n = 0;
    while (r.phase !== 'done' && n < 60 * 320) { r.update(1 / 60); if (r.cop) cops++; n++; }
    assert(r.result, 'no terminó');
    if (['caught', 'stopped'].includes(r.result.reason)) assert(r.result.outcome === 'void' && r.result.fine > 0, 'la multa no se aplicó');
  }
  assert(cops > 0, 'la policía nunca apareció');
});

check('largar antes de la luz verde es falta', () => {
  const r = new Race({ type: 'drag', car: makeCar('chevy57', { fuel: 8 }), rival: rival(makeCar('nomad56')), bet: 10, seed: 1 });
  run('Input.read = () => ({ gas: true, brake: false, steer: 0, up: true, down: false, horn: false })');
  for (let i = 0; i < 300 && r.phase !== 'done'; i++) r.update(1 / 60);
  assert(r.result && r.result.reason === 'foul' && r.result.outcome === 'lose', 'la largada anticipada no se castigó');
});

check('raspar la caja a fondo la rompe', () => {
  const v = new (get('Vehicle'))(carStats(makeCar('vette61')));
  v.launch();
  for (let i = 0; i < 12 && !v.broken; i++) { v.throttle = 1; v.shiftT = 0; v.gear = 1; v.shiftUp(); }
  assert(v.broken, 'la caja aguantó doce raspadas');
});

check('una noche en Bob\'s: llegan rivales, se corre y se apuesta', () => {
  newGame('Noche', 41);
  const S = state(), raceOptions = get('raceOptions'), applyResult = get('applyResult');
  const car = makeCar('chevy57', { fuel: 16 }); S.cars.push(car); S.active = car.id;
  assert(get('goDiner')() === '', 'no se pudo ir a Bob\'s');
  let races = 0;
  for (let k = 0; k < 3; k++) {
    const cur = get('nextRival')();
    if (!cur) break;
    const opts = raceOptions(cur.id, k % 2 ? 'road' : 'drag', k % 2 ? 25 : 10);
    opts.police = 0;
    const out = applyResult(opts, driveRace(opts).result);
    races++;
    assert(out && isFinite(S.money), 'el dinero quedó raro');
  }
  assert(races > 0, 'nadie llegó a Bob\'s');
  assert(S.wins.drag + S.wins.road + S.wins.kicks + S.losses + S.history.filter(h => h.o === 'void').length === races, 'las cuentas de carreras no cuadran');
  assert(get('callable')().length > 0, 'el tipo del poste no conoce a nadie');
  const day = S.day; get('endNight')();
  assert(S.day === day + 1 && !S.night && S.paper.day === S.day, 'no pasó al otro día');
});

check('apostar los papeles: si ganas te llevas su auto, si pierdes te quedas sin el tuyo', () => {
  newGame('Papeles', 51);
  const S = state(), applyResult = get('applyResult');
  const mine = makeCar('chevy57'), theirs = makeCar('fair58');
  S.cars.push(mine); S.active = mine.id; S.night = { min: 0, queue: [], cur: null, raced: [] };
  const res = (outcome) => ({ outcome, reason: 'finish', engineDmg: 0, transDmg: 0, body: 0, fuel: 1, tread: 0.05 });
  applyResult({ type: 'road', bet: 'pinks', car: mine, rival: { id: 'charlie', name: 'Charlie', car: theirs, skill: 0.8 } }, res('win'));
  assert(S.cars.some(c => c.model === 'fair58'), 'no te llevaste el Fairlane');
  applyResult({ type: 'road', bet: 'pinks', car: mine, rival: { id: 'lou', name: 'Lou', car: makeCar('nomad56'), skill: 0.8 } }, res('lose'));
  assert(!S.cars.includes(mine) && S.active === S.cars[0].id, 'perdiste los papeles y te quedaste con el auto');
});

check('sin auto y sin plata se acaba el juego; sin plata para la multa, castigado', () => {
  newGame('Pobre', 61);
  const S = state(); S.money = 20; get('checkBroke')();
  assert(S.over === 'broke', 'sin auto ni plata el juego sigue');
  newGame('Multa', 62);
  const S2 = state(), car = makeCar('chevy49'); S2.cars.push(car); S2.active = car.id; S2.money = 30; S2.night = { min: 0, queue: [], cur: null, raced: [] };
  get('applyResult')({ type: 'road', bet: 25, car, rival: { id: 'steve', name: 'Steve', car: makeCar('ford40'), skill: 0.6 } },
    { outcome: 'void', reason: 'caught', fine: 75, engineDmg: 0, transDmg: 0, body: 0, fuel: 1, tread: 0.05 });
  assert(S2.over === 'jail', 'sin plata para la multa no pasó nada');
});

check('El Rey llega con 6 picadas y 6 rutas ganadas, y ganarle termina el juego', () => {
  newGame('Rey', 71);
  const S = state(), car = buildCar({ model: 'vette61', engine: 'gm327', intake: '2x4' }); car.fuel = 16;
  S.cars.push(car); S.active = car.id;
  assert(!get('kingReady')(), 'El Rey apareció sin victorias');
  S.wins.drag = 6; S.wins.road = 5;
  assert(!get('kingReady')(), 'El Rey apareció con 5 rutas');
  S.wins.road = 6;
  assert(get('kingReady')(), 'El Rey no apareció con 6 y 6');
  get('goDiner')();
  const cur = get('nextRival')();
  assert(cur && cur.id === 'king' && cur.car.model === 'vette63', 'El Rey no fue el primero en llegar');
  assert(get('rivalAnswer')('king', 'road', 'pinks') === '', 'El Rey no aceptó');
  const opts = get('raceOptions')('king', 'road', 'pinks');
  assert(opts.police === 0 && opts.rival.king, 'la carrera con El Rey no es especial');
  get('applyResult')(opts, { outcome: 'win', reason: 'finish', engineDmg: 0, transDmg: 0, body: 0, fuel: 1, tread: 0.05 });
  assert(S.over === 'king' && S.kingBeaten && S.cars.some(c => c.model === 'vette63'), 'ganarle al Rey no terminó el juego');
  assert(get('fameList')()[0].name === 'Rey', 'no quedaste en el muro de los Reyes');
});

check('el verano se acaba el 3 de septiembre', () => {
  newGame('Verano', 81);
  const S = state(), car = makeCar('chevy57'); S.cars.push(car); S.active = car.id;
  for (let d = 0; d < get('SUMMER_DAYS'); d++) get('endNight')();
  assert(S.over === 'summer', 'el verano no se acabó');
  const end = get('dateOf')(S.day);
  assert(end.getMonth() === 8 && end.getDate() === 3, 'el verano termina otro día: ' + end);
});

check('el guardado y el libro de la policía se recuperan igual', () => {
  newGame('Guardado', 91);
  const S = state(); S.money = 1234; S.cars.push(makeCar('tbird57')); S.active = S.cars[0].id;
  get('saveGame')();
  const before = JSON.stringify(S);
  run('S = null');
  assert(get('loadGame')(), 'no se pudo cargar');
  assert(JSON.stringify(get('S')) === before, 'lo cargado no es igual a lo guardado');
  get('saveSlot')();
  newGame('Otro', 92);
  assert(get('savedDrivers')().includes('Guardado') && get('loadSlot')('Guardado') && get('S').money === 1234, 'el libro de la policía no guardó la partida');
});

check('todas las pantallas se dibujan sin errores', () => {
  newGame('Pantallas', 101);
  const S = state(), car = makeCar('chevy57', { fuel: 10 });
  S.cars.push(car); S.active = car.id; S.spares.push(makePart('carb', '4R'), makePart('engine', 'gm283'));
  const go = (name, arg) => { Game.go(name, arg); frames(3); };
  for (const sc of ['title', 'license', 'intro', 'how', 'fame', 'garage', 'paper', 'gas', 'cover']) go(sc);
  go('paper', 'cars'); go('paper', 'parts'); go('seller', 2);
  for (const sc of ['engine', 'trans', 'tires', 'tune', 'paint']) go(sc, { car });
  go('engine', { car: makeCar('valiant60'), readOnly: true });
  go('garage');
  for (const d of ['sparesBox', 'carsBox', 'calendarBox', 'clockMenu', 'goOut']) { get(d)(); frames(2); Game.dialogs = []; }
  get('carInfo')(car); frames(2); Game.dialogs = [];
  go('cruise', { car, night: true, text: 'x', then: () => {} });
  get('goDiner')(); go('diner');
  for (let i = 0; i < 300 && get('SCENES').diner.state !== 'parked'; i++) frames(1);
  assert(get('SCENES').diner.state === 'parked', 'ningún rival se estacionó en Bob\'s');
  get('SCENES').diner.challenge(); frames(2); Game.dialogs = [];
  get('SCENES').diner.callList(); frames(2); Game.dialogs = [];
  const opts = get('raceOptions')(S.night.cur.id, 'drag', 10);
  opts.auto = true;
  go('race', opts);
  const race = get('SCENES').race.race;
  for (let i = 0; i < 60 * 80 && !race.over; i++) frames(1);
  frames(3);
  assert(race.over && Game.dialogs.length, 'no se mostró el resultado de la carrera');
  get('SCENES').race.done(); frames(2);
  assert(['diner', 'ticket', 'ending'].includes(Game.name), 'después de la carrera no se volvió a Bob\'s');
  go('ticket', { fine: 75, car });
  for (const over of ['king', 'summer', 'broke', 'jail']) { S.over = over; go('ending'); }
  get('setLang')('en'); go('garage'); go('title'); get('setLang')('es');
});

if (failed) { console.log(`\n${failed} prueba(s) fallaron`); process.exit(1); }
console.log('\nTodo bien ✔');
