// Pruebas automáticas de Street Rod 3D: la lógica del verano (sin navegador) y la física de los autos.
// Uso: node tests/smoke.mjs   (build.sh las corre solo después de armar el juego)
const mem = {};
globalThis.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
const D = await import('../src/data.js');
const G = await import('../src/game.js');
const { makeSpec, quarterMile, Vehicle } = await import('../src/physics.js');

let fails = 0;
const test = (name, fn) => { try { fn(); console.log('  ✔ ' + name); } catch (e) { fails++; console.log('  ✘ ' + name + '\n    ' + (e.stack || e).toString().split('\n').slice(0, 3).join('\n    ')); } };
const ok = (c, msg) => { if (!c) throw new Error(msg || 'falló'); };
console.log('Pruebas de Street Rod 3D');

const { STR } = await import('../src/i18n.js');
test('los textos en español e inglés tienen las mismas claves', () => {
  const walk = (a, b, path) => {
    ok(typeof a === typeof b, path + ': tipo distinto');
    if (Array.isArray(a)) { ok(a.length === b.length, path + ': largo distinto'); a.forEach((x, i) => walk(x, b[i], path + '[' + i + ']')); return; }
    if (a && typeof a === 'object') { const ka = Object.keys(a).sort().join(), kb = Object.keys(b).sort().join(); ok(ka === kb, path + ': ' + ka + ' ≠ ' + kb); for (const k in a) walk(a[k], b[k], path + '.' + k); }
  };
  walk(STR.es, STR.en, 'STR');
});
test('cada auto anda y su categoría tiene sentido (los baratos en D, los caros en B)', () => {
  for (const k of D.MODEL_KEYS) {
    const st = G.carStats({ model: k, up: D.noUpgrades(), cond: 1 });
    ok(st.et > 12 && st.et < 19, k + ' tarda ' + st.et.toFixed(2));
    ok(D.MODELS[k].price >= 300 && D.MODELS[k].price <= 4000, k + ' precio');
  }
  ok(G.carStats({ model: 'sprite', up: D.noUpgrades(), cond: 1 }).cls === 'D', 'sprite debería ser D');
  ok(G.carStats({ model: 'viper', up: D.noUpgrades(), cond: 1 }).cls === 'B', 'viper de fábrica debería ser B');
});
test('las mejoras hacen más rápido el auto, pero un auto barato no llega arriba', () => {
  const full = { engine: 3, intake: 2, exhaust: 2, trans: 2, tires: 2, susp: 2, weight: 2, nitro: 0 };
  const a = G.carStats({ model: 'bantam', up: D.noUpgrades(), cond: 1 }), b = G.carStats({ model: 'bantam', up: full, cond: 1 });
  ok(b.et < a.et - 2, 'el bantam con todo no mejora lo suficiente');
  ok(['B', 'C'].includes(b.cls), 'un bantam con todo no debería pasar de B: ' + b.cls);
  ok(G.carStats({ model: 'viper', up: full, cond: 1 }).cls === 'S', 'el viper con todo debería ser S');
  const worn = G.carStats({ model: 'vandal', up: D.noUpgrades(), cond: 0.6 }), fresh = G.carStats({ model: 'vandal', up: D.noUpgrades(), cond: 1 });
  ok(worn.et > fresh.et, 'un motor gastado debería ser más lento');
});
test('cada rival corre en su categoría', () => {
  for (const r of D.RIVALS) { const c = G.carStats(G.rivalCar(r)).cls; ok(c === r.cls, `${r.id} es ${c} y debería ser ${r.cls}`); }
});
test('partida nueva: plata de partida y un diario con un auto barato', () => {
  G.newGame('PRUEBA', 42);
  ok(G.S.money === D.START_MONEY);
  ok(G.S.paper.ads.length === 6, 'el diario trae 6 autos');
  ok(G.S.paper.ads[0].price <= 460, 'el primero es barato');
  ok(new Set(G.S.paper.ads.map(a => a.car.model)).size === 6, 'sin modelos repetidos');
});
test('todo el verano: siempre hay un auto que se puede comprar con la plata de partida', () => {
  G.newGame('PRUEBA', 7);
  for (let d = 0; d < D.DAYS; d++) { G.S.day = d; G.makePaper(); ok(Math.min(...G.S.paper.ads.map(a => a.price)) <= D.START_MONEY, 'día ' + d); }
});
test('comprar, regatear, mejorar, pintar, reparar y vender', () => {
  G.newGame('PRUEBA', 3);
  const ad = G.S.paper.ads[0], before = G.S.money;
  const h = G.haggle(0); ok(h === 0 || h < before, 'regatear devuelve un precio menor o 0');
  ok(G.haggle(0) === null, 'solo se regatea una vez');
  ok(G.buyCar(0, ad.price) === '', 'compra');
  ok(G.S.money === before - ad.price && G.activeCar(), 'cobra y deja el auto activo');
  ok(G.buyCar(0, ad.price) === 'gone', 'no se compra dos veces');
  const car = G.activeCar(), et0 = G.carStats(car).et, cost = G.upCost(car, 'intake');
  ok(G.buyUpgrade(car, 'intake') === '' && car.up.intake === 1, 'mejora');
  ok(G.carStats(car).et < et0, 'la mejora acelera');
  G.S.money = 0; ok(G.buyUpgrade(car, 'engine') === 'money', 'sin plata no hay mejora');
  G.S.money = 5000; car.up.nitro = 3; ok(G.upCost(car, 'nitro') === null && G.buyUpgrade(car, 'nitro') === 'max', 'tope de nitro');
  ok(G.paint(car, '#16161c') === '' && car.color === '#16161c', 'pintar');
  ok(G.decal(car, 'flames') === '' && car.decal === 'flames', 'llamas');
  car.cond = 0.7; ok(G.repairCost(car) > 0 && G.repair(car) === '' && car.cond === 1, 'reparar');
  const m = G.S.money, p = G.sellPrice(car); ok(G.sellCar(car.id) === p && G.S.money === m + p && !G.activeCar(), 'vender');
  ok(cost > 0);
});
test('una noche en Bob\'s: llegan rivales de la D, se corre y el reloj avanza hasta el cierre', () => {
  G.newGame('PRUEBA', 11); G.buyCar(0, 0);
  ok(G.startNight() === '');
  const N = G.S.night;
  ok(N.present.length >= 1 && N.present.length <= 4, 'llegan rivales');
  ok(N.present.every(id => D.rivalById(id).cls === 'D' && !D.rivalById(id).boss), 'solo de la D y sin el jefe');
  const r = D.rivalById(N.present[0]);
  ok(G.challenge(r, 'drag', 50, false) === '', 'acepta una picada por $50');
  ok(G.challenge(r, 'drag', 500, false) === 'tooMuch', 'no apuesta tanto');
  ok(G.challenge(r, 'drag', 0, true) === 'pinkRoad', 'los papeles solo en la ruta');
  const m = G.S.money, res = G.applyResult({ rivalId: r.id, bet: 50, win: true });
  ok(res.money === 50 && G.S.money === m + 50 && G.S.rivals[r.id].w === 1 && G.S.beaten.includes(r.id), 'cobra y anota');
  ok(!G.S.night.present.includes(r.id) && G.S.night.raced.includes(r.id), 'ese rival ya corrió');
  ok(G.challenge(r, 'drag', 50, false) === 'raced', 'no repite esta noche');
  let guard = 0; while (!G.nightOver() && guard++ < 20) { const id = G.S.night.present[0]; if (!id) break; G.applyResult({ rivalId: id, bet: 10, win: false }); }
  ok(G.nightOver() || !G.S.night.present.length, 'la noche se termina');
  const d = G.S.day; G.endNight(); ok(G.S.day === d + 1 && !G.S.night && G.S.paper.day === d + 1, 'amanece con diario nuevo');
});
test('ganarle a 3 de la D trae al jefe; ganarle al jefe abre la C, y así hasta El Rey', () => {
  G.newGame('PRUEBA', 5); G.S.money = 100000; G.buyCar(0, 0);
  for (const cls of ['D', 'C', 'B', 'A']) {
    const boss = G.bossOf(cls);
    ok(!G.bossReady(cls), 'el jefe de la ' + cls + ' no está listo');
    G.S.night = { time: D.NIGHT_OPEN, present: [], raced: [] };
    ok(G.challenge(boss, 'drag', 10, false) === 'notYet', 'el jefe no acepta todavía');
    for (const r of D.RIVALS.filter(x => x.cls === cls && !x.boss).slice(0, 3)) G.applyResult({ rivalId: r.id, bet: 10, win: true });
    ok(G.bossReady(cls), 'ahora sí');
    const res = G.applyResult({ rivalId: boss.id, bet: 10, win: true });
    if (cls !== 'A') ok(res.unlocked === D.CLASSES[D.CLASSES.indexOf(cls) + 1] && G.openClasses().includes(res.unlocked), 'se abre la siguiente');
  }
  ok(G.kingReady(), 'llega El Rey');
  G.S.night = { time: 22 * 60 + 10, present: [], raced: [] };
  G.startNight(); G.S.night.time = 22 * 60 + 10; G.applyResult({ rivalId: 'steve', bet: 0, win: true });
  ok(G.S.night.present.includes('king'), 'El Rey aparece después de las diez');
  const king = D.rivalById('king');
  ok(G.challenge(king, 'drag', 100, false) === 'kingPink', 'El Rey solo corre por los papeles en la ruta');
  ok(G.challenge(king, 'road', 0, true) === '', 'acepta la ruta por los papeles');
  const res = G.applyResult({ rivalId: 'king', pink: true, win: true });
  ok(res.king && G.S.over === 'king' && G.S.cars.some(c => c.model === 'viper'), 'ganarle a El Rey termina el verano con su auto');
  ok(G.fame().some(f => f.name === 'PRUEBA'), 'queda en el muro de los Reyes de la Calle');
});
test('los papeles: si ganas te llevas su auto, si pierdes te quedas sin el tuyo', () => {
  G.newGame('PRUEBA', 9); G.buyCar(0, 0); G.startNight();
  const r = D.rivalById(G.S.night.present[0]);
  const win = G.applyResult({ rivalId: r.id, pink: true, win: true });
  ok(win.gotCar && G.S.cars.length === 2, 'gané su auto');
  const mine = G.activeCar();
  G.applyResult({ rivalId: G.S.night.present[0], pink: true, win: false });
  ok(!G.S.cars.includes(mine) && G.S.cars.length === 1 && G.activeCar(), 'perdí el mío y quedo con el ganado');
});
test('sin auto y sin plata se acaba el verano; y se acaba el 3 de septiembre', () => {
  G.newGame('PRUEBA', 13); G.buyCar(0, 0); G.S.money = 0; G.startNight();
  G.applyResult({ rivalId: G.S.night.present[0], pink: true, win: false });
  ok(G.S.over === 'broke', 'quedó en la calle');
  G.newGame('PRUEBA', 14); G.S.day = D.DAYS - 1; G.endNight(); ok(G.S.over === 'summer', 'fin del verano');
});
test('el guardado se recupera igual', () => {
  G.newGame('GUARDA', 21); G.buyCar(0, 0); G.buyUpgrade(G.activeCar(), 'tires'); G.save();
  const copy = JSON.stringify(G.S);
  ok(G.hasSave() && G.load() && JSON.stringify(G.S) === copy, 'mismo estado');
  G.clearSave(); ok(!G.hasSave());
});
test('física: con más motor se llega antes, y el auto dobla y frena', () => {
  const a = quarterMile(makeSpec({ model: 'vandal', up: D.noUpgrades(), cond: 1 })), b = quarterMile(makeSpec({ model: 'vandal', up: Object.assign(D.noUpgrades(), { engine: 2 }), cond: 1 }));
  ok(b.et < a.et);
  const v = new Vehicle(makeSpec({ model: 'starliner', up: D.noUpgrades(), cond: 1 }));
  for (let i = 0; i < 600; i++) v.update(1 / 120, { gas: 1, brake: 0, steer: 0 }, {});
  ok(v.speed > 15, 'acelera'); const h0 = v.h;
  for (let i = 0; i < 120; i++) v.update(1 / 120, { gas: 0.5, brake: 0, steer: 1 }, {});
  ok(v.h < h0 - 0.2, 'dobla a la derecha');
  for (let i = 0; i < 900; i++) v.update(1 / 120, { gas: 0, brake: 1, steer: 0, noReverse: true }, {});
  ok(v.speed < 0.5, 'frena');
});

const fs = await import('fs'), vm = await import('vm');
test('el catálogo del sitio se puede leer y trae Street Rod (si se rompe, la portada queda sin juegos)', () => {
  const src = fs.readFileSync(new URL('../../catalog.js', import.meta.url), 'utf8'), box = {};
  vm.runInNewContext(src + ';this.G = GAMES;', box);
  ok(box.G.some(g => g.slug === 'street-rod'), 'falta street-rod en el catálogo');
});
console.log(fails ? `\n${fails} prueba(s) fallaron ✘` : '\nTodo bien ✔');
if (fails) process.exit(1);
