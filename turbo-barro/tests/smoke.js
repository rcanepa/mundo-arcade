// Pruebas automáticas: corren el juego armado (index.html) sin navegador, con un canvas de mentira,
// y revisan que las carreras, el campeonato, el taller y el editor sigan funcionando.
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
const fakeCanvas = () => ({
  width: 0, height: 0, style: {}, getContext: fakeContext2d, addEventListener() {},
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 1024, height: 640 })
});
const memory = {};
const sandbox = {
  console, Math, JSON, performance, setTimeout, clearTimeout, setInterval: () => 0,
  // cualquier método de dibujo (lineTo, arc, quadraticCurveTo...) existe y no hace nada
  Path2D: class { constructor() { return new Proxy(this, { get: (o, k) => (k in o ? o[k] : () => {}) }); } },
  localStorage: { getItem: k => (k in memory ? memory[k] : null), setItem: (k, v) => { memory[k] = String(v); }, removeItem: k => { delete memory[k]; } },
  navigator: { language: 'es-CL', getGamepads: () => [] },
  location: { pathname: '/turbo-barro/index.html', href: '' },
  innerWidth: 1024, innerHeight: 640, devicePixelRatio: 1,
  requestAnimationFrame: () => 0, addEventListener() {},
  document: { createElement: fakeCanvas, getElementById: fakeCanvas, documentElement: {}, addEventListener() {}, title: '', hidden: false }
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'index.html' });
const get = name => vm.runInContext(name, sandbox);

const Game = get('Game'), Race = get('Race'), Editor = get('Editor'), Input = get('Input'), STR = get('STR');
const TRACK_DEFS = get('TRACK_DEFS'), PAINTS = get('PAINTS'), MODEL_KEYS = get('MODEL_KEYS');
const update = get('update'), aiInput = get('aiInput'), trackList = get('trackList'), buyModel = get('buyModel');
const CUP_RACES = get('CUP_RACES'), cupName = get('cupName'), MODELS = get('MODELS');

// --- utilidades ---
let failed = 0;
function check(name, fn) {
  try { fn(); console.log('  ✔ ' + name); }
  catch (e) { failed++; console.log('  ✘ ' + name + '\n      ' + e.message); }
}
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };

// Corre la carrera actual con los jugadores manejados por la computadora, hasta que termine
function driveRace(maxSeconds = 300) {
  const r = Game.race, original = Input.get;
  Input.get = player => aiInput(r.trucks.find(t => t.human && t.player === player), r);
  let n = 0;
  try { while (Game.scene === 'race' && n < 60 * maxSeconds) { update(1 / 60); n++; } }
  finally { Input.get = original; }
  return n / 60;
}

console.log('Pruebas de Turbo Barro');

check('los textos en español e inglés tienen las mismas claves', () => {
  const walk = (a, b, where) => {
    for (const k of Object.keys(a)) {
      assert(k in b, `falta "${where}${k}" en inglés`);
      if (a[k] && typeof a[k] === 'object') walk(a[k], b[k], where + k + '.');
    }
    for (const k of Object.keys(b)) assert(k in a, `falta "${where}${k}" en español`);
  };
  walk(STR.es, STR.en, '');
});

TRACK_DEFS.forEach((def, ti) => {
  check(`${def.name}: las 4 camionetas dan vueltas sin quedarse pegadas`, () => {
    const racers = PAINTS.slice(0, 4).map((p, i) => ({
      id: i, name: '', color: p.c, dark: p.d, model: MODEL_KEYS[i], human: false, player: -1, nitros: 2,
      skill: 0.85, upg: { motor: 0, acel: 0, llantas: 0, amort: 0 }
    }));
    const r = new Race(ti, racers, true);
    for (let i = 0; i < 60 * 90; i++) r.update(1 / 60);
    for (const t of r.trucks) {
      assert(Number.isFinite(t.x) && Number.isFinite(t.y), `${t.model}: posición inválida`);
      const laps = t.prog / r.track.N;
      assert(laps >= 2, `${t.model} hizo solo ${laps.toFixed(2)} vueltas en 90 s`);
    }
  });
});

check('campeonato: cada carrera termina en resultados y sigue en la tienda', () => {
  Game.newSeason(1);
  for (let k = 0; k < trackList().length; k++) {
    const secs = driveRace();
    assert(Game.scene === 'results', `la carrera ${k + 1} no terminó (escena "${Game.scene}" tras ${secs.toFixed(0)} s)`);
    Game.lock = 0; Game.press('ok');
    if (Game.scene === 'podium') { Game.lock = 0; Game.press('ok'); }
    assert(Game.scene === 'shop', `después de la carrera ${k + 1} se esperaba la tienda y quedó "${Game.scene}"`);
    Game.openShop(Game.players);
    assert(Game.scene === 'race', 'la tienda no empezó la siguiente carrera');
  }
});

check('taller: comprar el tractor descuenta $120 y queda como propio', () => {
  Game.newSeason(1);
  Game.racers[0].money = 500;
  Game.openShop(0); Game.openGarage(0, 'shop');
  Game.garageCtx.view = MODEL_KEYS.indexOf('tractor');
  buyModel();
  assert(Game.garage[0].owned.includes('tractor'), 'el tractor no quedó comprado');
  assert(Game.racers[0].money === 380, `quedó $${Game.racers[0].money} en vez de $380`);
});

check('vehículos nuevos: los 5 dan vueltas en una carrera', () => {
  const extra = MODEL_KEYS.slice(5);
  for (const group of [extra.slice(0, 4), [extra[4], extra[0], extra[1], extra[2]]]) {
    const racers = group.map((m, i) => ({
      id: i, name: '', color: PAINTS[i].c, dark: PAINTS[i].d, model: m, human: false, player: -1, nitros: 2,
      skill: 0.85, upg: { motor: 0, acel: 0, llantas: 0, amort: 0 }
    }));
    const r = new Race(0, racers, true);
    for (let i = 0; i < 60 * 90; i++) r.update(1 / 60);
    for (const t of r.trucks) assert(t.prog / r.track.N >= 2, `${t.model} hizo solo ${(t.prog / r.track.N).toFixed(2)} vueltas`);
  }
});

check('sirena: la ambulancia, la policía y los bomberos prenden las balizas al tocar la bocina', () => {
  const owned = Game.garage[0].owned, model = Game.garage[0].model;
  for (const m of ['ambulance', 'police', 'firetruck']) {
    Game.garage[0].owned = [...owned, m]; Game.garage[0].model = m;
    Game.newSeason(1);
    const me = Game.race.trucks.find(t => t.human);
    assert(me.model === m, `el jugador no quedó con ${m}`);
    Game.race.honk(me);
    assert(me.sirenT > 0, `${m}: la sirena no prendió las balizas`);
  }
  Game.garage[0].owned = owned; Game.garage[0].model = model;
});

check('superdeportivos: son los más caros y los mejores en velocidad y aceleración', () => {
  const others = MODEL_KEYS.filter(k => k !== 'italian' && k !== 'electric').map(k => MODELS[k]);
  for (const k of ['italian', 'electric']) {
    assert(MODELS[k].price > Math.max(...others.map(m => m.price)), `${k} debería costar más que todos los demás`);
    assert(MODELS[k].max > Math.max(...others.map(m => m.max)), `${k} debería ser el más rápido`);
    assert(MODELS[k].accel > Math.max(...others.map(m => m.accel)), `${k} debería acelerar más`);
  }
});

check('copas: después de 4 carreras viene la premiación y el trofeo queda guardado', () => {
  Game.trophies.length = 0;
  Game.newSeason(1);
  for (let k = 0; k < 4; k++) {
    driveRace();
    assert(Game.scene === 'results', `la carrera ${k + 1} de la copa no terminó`);
    Game.lock = 0; Game.press('ok');
    if (k < 3) { assert(Game.scene === 'shop', `tras la carrera ${k + 1} se esperaba la tienda`); Game.openShop(Game.players); }
  }
  assert(Game.scene === 'podium', `tras 4 carreras se esperaba la premiación y quedó "${Game.scene}"`);
  assert(Game.trophies.length === 1, `se esperaba 1 trofeo y hay ${Game.trophies.length}`);
  assert(JSON.parse(memory['turbobarro4x4.prefs']).trophies.length === 1, 'el trofeo no quedó guardado');
  const next = Game.podium.next;
  Game.lock = 0; Game.press('ok');
  assert(Game.scene === 'shop', 'después de la premiación se esperaba la tienda');
  assert(Game.cup.tier === next && Game.cup.race === 0, 'la copa siguiente no empezó bien');
  assert(Game.racers.every(r => r.points === 0), 'los puntos no se reiniciaron para la copa nueva');
});

check('copas: sin podio se repite la copa, con una medalla de recuerdo', () => {
  Game.newSeason(1);
  Game.cup = { tier: 2, race: CUP_RACES };
  Game.racers.forEach((r, i) => { r.points = r.human ? 0 : 10 + i; });
  Game.openPodium();
  assert(Game.podium.best === 4, `el jugador quedó ${Game.podium.best}° en vez de 4°`);
  assert(Game.podium.next === 2, 'debería repetir la Copa Oro');
  assert(Game.trophies[Game.trophies.length - 1].place === 4, 'no se guardó la medalla');
});

check('copas: un campeonato guardado antes de las copas sigue en Bronce con los puntos en cero', () => {
  Game.newSeason(1);
  Game.racers.forEach(r => { r.points = 25; });
  Game.save();
  const old = JSON.parse(memory['turbobarro4x4']);
  delete old.cup;
  Game.continueSave(old);
  assert(Game.cup.tier === 0 && Game.cup.race === 0, 'no empezó en la Copa Bronce, carrera 1');
  assert(Game.racers.every(r => r.points === 0), 'quedaron puntos de antes de las copas');
});

check('copas: después del Arcoíris vienen copas Leyenda sin fin', () => {
  assert(cupName(4).includes('Arcoíris'), cupName(4));
  assert(cupName(9).includes('5'), cupName(9));
});

check('editor: al dibujar desde cero los puntos siguen el orden de los clics', () => {
  Editor.open(2);
  Editor.button(11); Editor.button(11); // Borrar (hay que confirmarlo con un segundo clic)
  const clicks = [[712, 544], [858, 544], [912, 345], [858, 146], [712, 146], [312, 544], [166, 544], [112, 345], [166, 146], [312, 146]];
  for (const [x, y] of clicks) Editor.pointer('down', x, y, 0);
  assert(JSON.stringify(Editor.def.pts) === JSON.stringify(clicks), 'los puntos quedaron en otro orden: ' + JSON.stringify(Editor.def.pts));
});

check('editor: el 8 dibujado recibe un puente automático en el cruce', () => {
  assert(Editor.track && Editor.track.autoBridges >= 1, 'no apareció el puente automático');
});

check('editor: la carrera de prueba termina y vuelve al editor', () => {
  Editor.button(12);
  assert(Game.scene === 'race', 'no empezó la carrera de prueba');
  const secs = driveRace();
  assert(Game.scene === 'editor', `quedó en "${Game.scene}" tras ${secs.toFixed(0)} s`);
});

console.log(failed ? `\n${failed} prueba(s) fallaron` : '\nTodo bien ✔');
process.exit(failed ? 1 : 0);
