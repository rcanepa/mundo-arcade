// Pruebas automáticas: corren el juego armado (index.html) sin navegador, con una página de mentira,
// y revisan que las plantas, el clima, el suelo, los visitantes y el guardado sigan funcionando.
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
      if (k === 'measureText') return s => ({ width: String(s).length * 7 });
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; }
  });
}
function fakeEl() {
  return {
    style: { setProperty() {} }, dataset: {}, hidden: false, children: [], innerHTML: '', textContent: '', width: 0, height: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener() {}, removeEventListener() {}, setPointerCapture() {}, matches: () => false, closest: () => null,
    prepend() {}, append() {}, appendChild() {}, remove() {}, click() {}, querySelector: () => fakeEl(), querySelectorAll: () => [],
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 1024, bottom: 48, width: 1024, height: 48 }),
    getContext: fakeContext2d, toDataURL: () => 'data:,'
  };
}
const memory = {};
const sandbox = {
  console, Math, JSON, performance, setTimeout, clearTimeout, setInterval: () => 0, URLSearchParams,
  localStorage: { getItem: k => (k in memory ? memory[k] : null), setItem: (k, v) => { memory[k] = String(v); }, removeItem: k => { delete memory[k]; } },
  navigator: { language: 'es-CL' }, confirm: () => true,
  location: { pathname: '/jardin-vivo/index.html', search: '', href: '' },
  innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
  requestAnimationFrame: () => 0, addEventListener() {},
  Blob: class { constructor(parts) { this.parts = parts; } }, URL: { createObjectURL: () => 'blob:', revokeObjectURL() {} },
  document: {
    createElement: fakeEl, getElementById: fakeEl, querySelector: fakeEl, querySelectorAll: () => [],
    documentElement: { style: { setProperty() {} } }, body: fakeEl(), addEventListener() {}, title: '', hidden: false
  }
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
  catch (e) { failed++; console.log('  ✘ ' + name + '\n      ' + e.message); }
}
const assert = (ok, msg) => { if (!ok) throw new Error(msg); };
const G = get('G'), SP = get('SP'), SPECIES = get('SPECIES'), STR = get('STR');
const tileAt = get('tileAt'), addPlant = get('addPlant'), evaluate = get('evaluate'), plantAt = (x, y) => tileAt(x, y).plant;

// Un jardín nuevo, ya jugando (sin la pantalla de título). Las pruebas de plantas usan el jardín clásico,
// que siempre es igual; los terrenos al azar tienen sus propias pruebas.
function fresh(o = {}) {
  run('newGarden(' + (o.seed || 7) + ', undefined, true); UI.title = false; VIS.list = []; VIS.queue = [];');
  if (o.money) G.money = o.money;
  if (o.tier) { G.repMax = o.tier; G.rep = o.tier; }
}
// Avanza horas del juego como si pasara el tiempo
function hours(n, each) {
  const onHour = get('onHour'), updateVisitors = get('updateVisitors');
  for (let i = 0; i < n; i++) {
    G.hour = Math.floor(G.hour) + 1; onHour();
    for (let k = 0; k < 4; k++) updateVisitors(0.25, 0.1);
    if (each) each(Math.floor(G.hour) % 24);
  }
}
const days = (n, each) => hours(24 * n, each);
// Un jardinero cuidadoso: riega cuando hace falta, cosecha y saca lo seco
function careful(h) {
  if (h !== 8) return;
  const W = get('WATER');
  for (const p of [...G.plants]) {
    const t = tileAt(p.x, p.y), sp = SP[p.sp];
    if (!t.own) continue;
    if (p.dead) { run(`actRemove(${p.x}, ${p.y})`); continue; }
    if (sp.water !== 'aquatic' && t.moist < W[sp.water][0] + 0.12) get('waterTile')(t, 0.35);
    if (p.pests) p.pests = 0;
    t.weeds = 0;
  }
}

console.log('Pruebas de Jardín Vivo');

check('los textos en español e inglés tienen las mismas claves', () => {
  const walk = (a, b, where) => {
    for (const k of Object.keys(a)) {
      assert(k in b, `falta "${where}${k}" en inglés`);
      if (a[k] && typeof a[k] === 'object' && !Array.isArray(a[k])) walk(a[k], b[k], where + k + '.');
    }
    for (const k of Object.keys(b)) assert(k in a, `falta "${where}${k}" en español`);
  };
  walk(STR.es, STR.en, '');
});

check('cada especie tiene datos completos y coherentes', () => {
  const W = get('WATER'), FORMS = get('FORMS'), ids = new Set();
  for (const s of SPECIES) {
    assert(!ids.has(s.id), 'especie repetida: ' + s.id); ids.add(s.id);
    assert(s.es && s.en && s.es[0] && s.en[1], s.id + ': faltan nombre o descripción');
    assert(s.sun[0] <= s.sun[1] && s.ph[0] < s.ph[1] && s.drain[0] < s.drain[1], s.id + ': rangos al revés');
    assert(W[s.water], s.id + ': tipo de riego desconocido');
    assert(FORMS[s.art.f], s.id + ': forma de dibujo desconocida ' + s.art.f);
    for (const w of [s.bloom, s.fruit, s.dorm]) if (w) assert(w[0] >= 0 && w[1] <= 51, s.id + ': ventana fuera del año');
    assert(s.grow > 0 && s.price > 0 && s.tier >= 0 && s.tier <= 4, s.id + ': crecimiento, precio o nivel inválido');
  }
  assert(SPECIES.length >= 80, 'hay pocas especies: ' + SPECIES.length);
});

check('todas las especies se pueden dibujar en todas sus etapas', () => {
  const render = get('renderPlantCanvas'), rgbOf = get('rgbOf');
  for (const s of SPECIES) for (const st of [{ g: 0.05 }, { g: 0.5 }, { g: 1, bloom: 1, fruit: 1 }, { g: 1, dorm: true }, { g: 1, dead: true, wilt: 1 }]) {
    const vs = { g: 1, hp: 1, bloom: 0, fruit: 0, dorm: false, dead: false, wilt: 0, yellow: 0, burn: 0, frost: 0, fall: 0, pests: 0, cloth: 0, ph: 6, ...st };
    vs.lc = rgbOf(s.art.lc); vs.stem = vs.lc;
    if (s.art.fl) { vs.fc = rgbOf(s.art.fl.c); vs.fc2 = rgbOf(s.art.fl.c2 || '#f2d230'); }
    render(s, vs, 99, 40);
  }
});

check('la casa da sombra: junto a ella hay menos horas de sol que en el pasto abierto', () => {
  fresh();
  const near = tileAt(3, 6).sun, open = Math.max(...G.tiles.filter(t => t.own && t.t === 'grass').map(t => t.sun));
  assert(open > 8, 'el pasto abierto debería tener más de 8 h de sol, tiene ' + open.toFixed(1));
  assert(near < open - 2, `junto a la casa (${near.toFixed(1)} h) debería haber menos sol que al aire libre (${open.toFixed(1)} h)`);
});

check('en invierno los días son más cortos que en verano', () => {
  const dl = get('dayLength');
  assert(dl(19) > dl(45) + 3, 'el verano debería tener días mucho más largos que el invierno');
});

check('con riego y cuidados, las plantas del huerto pasan la primavera sanas', () => {
  fresh({ money: 5000 });
  for (let x = 4; x <= 9; x++) run(`actBuild('bed', ${x}, 16)`);
  for (const [id, x] of [['calendula', 4], ['tagetes', 5], ['lettuce', 6], ['cosmos', 7], ['geranium', 8], ['sunflower', 9]]) run(`actPlant('${id}', ${x}, 16)`);
  days(12, careful);
  const ours = G.plants.filter(p => p.y === 16 && p.x >= 4);
  assert(ours.length >= 5, 'se perdieron plantas: quedan ' + ours.length);
  const avg = ours.reduce((a, p) => a + p.hp, 0) / ours.length;
  assert(avg > 70, 'la salud promedio debería superar 70, es ' + avg.toFixed(0));
});

check('sin riego, las anuales mueren pero el nogal y el romero aguantan', () => {
  fresh({ money: 5000 });
  for (let x = 4; x <= 6; x++) { run(`actBuild('bed', ${x}, 16)`); run(`actPlant('basil', ${x}, 16)`); }
  G.w = run('makeWeather(15, null, () => 0.5)'); G.w.rain = 0;
  G.day = 14; for (let i = 0; i < 26; i++) { days(1); G.w.rain = 0; G.wNext.rain = 0; }
  const basil = G.plants.filter(p => p.sp === 'basil');
  assert(basil.every(p => p.dead || p.hp < 30), 'la albahaca sin riego en verano debería sufrir mucho');
  const walnut = G.plants.find(p => p.sp === 'walnut'), rosemary = G.plants.find(p => p.sp === 'rosemary');
  assert(!walnut.dead && !rosemary.dead, 'el nogal y el romero tienen raíces profundas y deberían sobrevivir');
});

check('una helada daña a la albahaca y no a la lavanda', () => {
  fresh({ money: 5000 });
  run("actBuild('bed', 5, 16); actBuild('bed', 6, 16); actPlant('basil', 5, 16); actPlant('lavender', 6, 16)");
  const b = plantAt(5, 16), l = plantAt(6, 16), hb = b.hp, hl = l.hp;
  G.w.tmin = -3; run('frostCheck()');
  assert(b.hp < hb - 20, 'la albahaca debería dañarse con −3 °C');
  assert(l.hp === hl, 'la lavanda resiste −18 °C');
});

check('la manta antiheladas protege unos grados', () => {
  fresh({ money: 5000 });
  run("actBuild('bed', 5, 16); actPlant('geranium', 5, 16)");
  const p = plantAt(5, 16), h0 = p.hp;
  run("actCare('cloth', 5, 16)");
  G.w.tmin = -2; run('frostCheck()');
  assert(p.hp === h0, 'con manta (+3 °C) el cardenal no debería sufrir a −2 °C');
});

check('la hortensia es azul en suelo ácido y rosada en suelo alcalino', () => {
  const hc = get('hydrangeaColor');
  const blue = hc(5.0), pink = hc(7.5);
  assert(blue[2] > blue[0], 'con pH 5 debería ser azul');
  assert(pink[0] > pink[2], 'con pH 7,5 debería ser rosada');
});

check('el azufre baja el pH y la cal lo sube', () => {
  fresh({ money: 5000 });
  const t = tileAt(8, 2), ph = t.ph;
  run("actCare('sulfur', 8, 2)"); assert(t.ph < ph - 0.4, 'el azufre debería bajar el pH');
  const ph2 = t.ph; run("actCare('lime', 8, 2)"); assert(t.ph > ph2 + 0.3, 'la cal debería subir el pH');
});

check('las plantas acuáticas solo van en el estanque', () => {
  fresh({ money: 5000, tier: 3 });
  assert(!run("actPlant('waterlily', 5, 7)"), 'un nenúfar no debería ir en un cantero');
  run("actBuild('pond', 5, 14)");
  assert(run("actPlant('waterlily', 5, 14)"), 'un nenúfar sí va en el estanque');
});

check('el riego por goteo mantiene la humedad que pide cada planta, sin regar a mano', () => {
  fresh({ money: 5000 });
  G.day = 15; G.w = run('makeWeather(15, null, () => 0.5)'); G.w.rain = 0;
  run("actBuild('bed', 5, 16); actBuild('bed', 6, 16); actPlant('lettuce', 5, 16); actPlant('echeveria', 6, 16)");
  run("actBuild('drip', 5, 16); actBuild('drip', 6, 16)");
  const m0 = G.money, W = get('WATER');
  days(6, () => { G.w.rain = 0; });
  const l = tileAt(5, 16), e = tileAt(6, 16);
  assert(l.moist > W.med[0] - 0.05, 'la lechuga con goteo no debería secarse: ' + l.moist.toFixed(2));
  assert(e.moist < W.xeric[1] + 0.05, 'el goteo no debería encharcar a la echeveria: ' + e.moist.toFixed(2));
  assert(G.money < m0, 'el agua del goteo debería costar algo');
});

check('"regar lo que tiene sed" riega solo a las sedientas y cobra el agua', () => {
  fresh({ money: 100 });
  run("actBuild('bed', 5, 16); actBuild('bed', 6, 16); actPlant('lettuce', 5, 16); actPlant('lettuce', 6, 16)");
  tileAt(5, 16).moist = 0.05; tileAt(6, 16).moist = 0.6;
  const thirsty = run('thirstyPlants()').map(p => p.x);
  assert(thirsty.includes(5) && !thirsty.includes(6), 'solo la lechuga seca tiene sed');
  const m0 = G.money; run('actWaterThirsty()');
  assert(tileAt(5, 16).moist > 0.4 && G.money < m0, 'debería regarla y cobrar');
});

check('las semillas del cobertizo se plantan gratis', () => {
  fresh({ money: 100 });
  const n = G.inv.calendula;
  run("actBuild('bed', 5, 16)"); const m = G.money;
  assert(run("actPlant('calendula', 5, 16)"), 'no se pudo plantar');
  assert(G.money === m && G.inv.calendula === n - 1, 'debería usar una semilla del semillero sin cobrar');
});

check('la albahaca ayuda al tomate y el poroto abona a sus vecinos', () => {
  fresh({ money: 5000, tier: 2 });
  for (let x = 4; x <= 7; x++) run(`actBuild('bed', ${x}, 16)`);
  run("actPlant('tomato', 4, 16); actPlant('basil', 5, 16); actPlant('bean', 7, 16)");
  const tom = plantAt(4, 16), f = evaluate(SP.tomato, tileAt(4, 16), tom, G.w, false);
  assert(f.comp > 1 && f.compNames.includes('basil'), 'el tomate debería tener a la albahaca de compañera');
  plantAt(7, 16).g = 1; const before = tileAt(6, 16).fert;
  days(3, careful);
  assert(tileAt(6, 16).fert > before - 0.005, 'el poroto debería mantener abonada la casilla vecina');
});

check('el rosal sin podar florece menos y se puede podar en invierno', () => {
  fresh({ money: 100 });
  const rose = G.plants.find(p => p.sp === 'rose');
  assert(run('needsPrune')(rose), 'el rosal viejo de la abuela necesita poda');
  G.day = 45;
  assert(run('canPrune')(rose), 'a fines del invierno se puede podar');
  assert(run('actPrune')(rose) && !run('needsPrune')(rose), 'después de podarlo ya no le falta poda');
});

check('se pueden sacar esquejes y dividir matas para el semillero', () => {
  fresh({ money: 100 });
  const rosemary = G.plants.find(p => p.sp === 'rosemary');
  const n = G.inv.rosemary || 0;
  assert(run('propCount')(rosemary) > 0, 'un romero adulto da esquejes');
  run('actPropagate')(rosemary);
  assert(G.inv.rosemary === n + 2 && run('propCount')(rosemary) === 0, 'deberían quedar 2 esquejes y no más este año');
});

check('cada clima tiene su tiempo: Valdivia llueve, La Serena casi no y en Ciudad de México no hiela', () => {
  const stats = id => {
    run(`setClimate('${id}')`);
    let rain = 0, frost = 0, prev = null, tmax = -99;
    for (let y = 0; y < 3; y++) for (let d = 0; d < 52; d++) { const w = run('makeWeather')(d, prev, Math.random); prev = w; if (w.rain) rain++; if (w.tmin < -1) frost++; tmax = Math.max(tmax, w.tmax); }
    return { rain: rain / 156, frost: frost / 156, tmax };
  };
  const st = stats('santiago'), va = stats('valdivia'), se = stats('serena'), mx = stats('cdmx');
  run("setClimate('santiago')");
  assert(va.rain > st.rain * 1.8, 'Valdivia debería llover mucho más que Santiago');
  assert(se.rain < st.rain * 0.5, 'La Serena debería llover mucho menos que Santiago');
  assert(se.frost === 0, 'en La Serena no debería helar');
  assert(mx.frost < st.frost, 'en Ciudad de México debería helar menos que en Santiago');
  assert(st.tmax > va.tmax + 4, 'Santiago debería tener veranos más calurosos que Valdivia');
});

check('en el hemisferio norte el sol del mediodía viene del sur', () => {
  run("setClimate('santiago')"); const s = run('sunVector')(19, 12);
  run("setClimate('cdmx')"); const m = run('sunVector')(0, 12);
  run("setClimate('santiago')");
  // en el mundo del juego el norte está hacia x e y negativos
  assert(s.x + s.y < 0, 'en Santiago el sol del mediodía debería venir del norte');
  assert(m.x + m.y > 0, 'en Ciudad de México (en primavera) el sol del mediodía debería venir del sur');
});

check('un jardín en Valdivia empieza con suelo ácido', () => {
  run("newGarden(5, 'valdivia')");
  const lawn = G.tiles.filter(t => t.parcel === 0 && t.t === 'grass');
  const ph = lawn.reduce((a, t) => a + t.ph, 0) / lawn.length;
  assert(ph < 6.3, 'el pH promedio debería ser ácido, es ' + ph.toFixed(2));
  assert(G.climate === 'valdivia', 'el clima no quedó guardado');
  run('newGarden(7)');
});

check('las ventanas reciben soles distintos y las macetas de adentro no se hielan', () => {
  fresh({ money: 500, tier: 4 });
  const win = id => G.pots.find(t => t.win === id).sun;
  assert(win('N') > win('S') + 2, `en Santiago la ventana norte (${win('N').toFixed(1)} h) debería tener más sol que la sur (${win('S').toFixed(1)} h)`);
  const i = G.pots.findIndex(t => t.win === 'S' && t.own === 0);
  assert(run('actBuyPot')(i) && G.pots[i].own, 'debería poder comprarse una maceta');
  assert(run(`actPlant('calathea', ${100 + i}, 0)`), 'la calathea debería poder ir en una maceta');
  const cal = G.plants.find(p => p.sp === 'calathea'), hp = cal.hp;
  G.w.tmin = -4; run('frostCheck()');
  assert(cal.hp === hp, 'adentro no debería helar');
  assert(!run("canPlantHere(SP.walnut, G.pots[0])"), 'un nogal no cabe en una maceta');
});

check('se puede llevar una planta del jardín a una maceta y volver', () => {
  fresh({ money: 500 });
  const ger = G.plants.find(p => p.sp === 'geranium'), from = [ger.x, ger.y];
  const pot = G.pots.findIndex(t => t.own && !t.plant);
  assert(run('actTransplant')(ger, 100 + pot, 0) && tileAt(...from).plant === null, 'debería entrar a la maceta');
  days(1);
  assert(run('actTransplant')(ger, from[0], from[1]), 'debería volver al jardín');
});

check('los visitantes llegan, pagan la entrada y comentan', () => {
  fresh({ money: 100 });
  G.open = true; G.price = 3; G.rep = 2; G.beauty = 200; G.hour = 8;
  const m = G.money;
  hours(10);
  assert(G.today.visitors > 0 || G.stats.visitors > 0, 'deberían llegar visitantes');
  assert(G.money > m, 'las entradas deberían dar dinero');
});

check('los objetivos avanzan en orden y dan su premio', () => {
  fresh({ money: 300 });
  G.stats.lens = 1; run('checkGoals()');
  assert(G.goal === 1, 'el primer objetivo (ver la luz) debería cumplirse');
  for (let x = 4; x <= 6; x++) { run(`actBuild('bed', ${x}, 16)`); run(`actPlant('calendula', ${x}, 16)`); }
  run('checkGoals()');
  assert(G.goal === 2, 'plantar 3 especies debería cumplir el segundo objetivo');
});

check('los objetivos nuevos se pueden cumplir sin esperar a los anteriores', () => {
  fresh({ money: 300 });
  G.stats.pruned = 3; run('checkGoals()');
  assert(G.goalsDone.prune && G.goal === 0, 'podar debería cumplirse aunque el primer objetivo siga pendiente');
});

check('el concurso de jardines premia a un jardín lindo y sano', () => {
  fresh({ money: 100 });
  G.beauty = 900; G.kinds = 30;
  const m = G.money, place = run('judgeContest()');
  assert(place === 1 && G.money > m && G.stats.contestBest === 1, 'un jardín así debería ganar el primer lugar');
  G.beauty = 20; assert(run('judgeContest()') === 0, 'un jardín pobre no debería ganar');
});

check('el jardín se guarda y se recupera igual', () => {
  fresh({ money: 777 });
  run("actBuild('bed', 5, 16); actPlant('calendula', 5, 16)");
  G.day = 9; G.hour = 13;
  const money = G.money, inv = G.inv.calendula;
  assert(run('saveGame()'), 'no se pudo guardar');
  run('newGarden(1)');
  assert(run('loadGame()'), 'no se pudo cargar');
  assert(G.money === money && G.day === 9, 'el dinero o el día no coinciden');
  assert(G.inv.calendula === inv, 'el semillero no se guardó');
  assert(plantAt(5, 16) && plantAt(5, 16).sp === 'calendula', 'falta la caléndula');
});

check('cada partida nueva tiene un terreno distinto, y la misma partida se arma igual', () => {
  const PARCELS = get('PARCELS');
  const sig = () => JSON.stringify([PARCELS.map(p => [p.x1, p.y0, p.y1, p.soil]), G.tiles.filter(t => t.t !== 'grass').map(t => t.x + ',' + t.y + t.t), G.plants.map(p => p.sp + p.x + ',' + p.y)]);
  const seen = new Set();
  for (let i = 1; i <= 12; i++) { run(`newGarden(${i * 7919})`); seen.add(sig()); }
  assert(seen.size === 12, `de 12 partidas salieron solo ${seen.size} terrenos distintos`);
  run('newGarden(4242)'); const a = sig();
  run("newGarden(4242, undefined, true)"); assert(sig() !== a, 'el jardín clásico debería ser distinto de uno al azar');
  run('newGarden(4242)'); assert(sig() === a, 'la misma partida debería armar el mismo terreno');
});

check('todos los terrenos al azar se pueden jugar, en las cuatro ciudades', () => {
  const PARCELS = get('PARCELS'), H = get('HOUSE'), GX = get('GATE_X'), GH = get('GH'), findPath = get('findPath'), climateLow = get('climateLow');
  for (let i = 1; i <= 40; i++) {
    const cl = get('CLIMATE_ORDER')[i % 4], where = `(partida ${i}, ${cl})`;
    run(`newGarden(${i * 104729}, '${cl}'); bumpVis()`);
    // parcelas: cubren todo el terreno, cada una con su suelo y de buen tamaño
    assert(G.tiles.every(t => t.parcel >= 0), 'hay casillas sin parcela ' + where);
    assert(PARCELS.slice(1).every(p => p.x1 - p.x0 >= 6 && p.y1 - p.y0 >= 7), 'una parcela quedó muy chica ' + where);
    assert(new Set(PARCELS.map(p => p.soil)).size === 5, 'falta un tipo de suelo ' + where);
    // la casa entera y el camino de la puerta a la reja
    for (let y = H.y1; y < GH; y++) assert(tileAt(GX, y).t === 'path', 'el camino a la reja está cortado ' + where);
    assert(G.tiles.filter(t => t.t === 'house').length === (H.x1 - H.x0) * (H.y1 - H.y0), 'la casa perdió casillas ' + where);
    // cada planta en su casilla, ninguna sobre la casa o el camino, y en el agua solo las acuáticas
    for (const p of G.plants) {
      const t = tileAt(p.x, p.y);
      assert(t.plant === p, 'dos plantas en la misma casilla ' + where);
      assert(t.t !== 'house' && t.t !== 'path' && (t.t === 'water') === (SP[p.sp].water === 'aquatic'), `${p.sp} quedó sobre ${t.t} ${where}`);
      if (t.own) assert(SP[p.sp].minT <= climateLow(), `${p.sp} no aguanta el invierno de ${cl}`);
    }
    // el rosal de la abuela junto a la casa, y canteros con sol para sembrar y para rescatarlo
    const rose = G.plants.find(p => p.sp === 'rose');
    assert(rose && rose.x <= H.x1 && rose.y <= H.y1, 'el rosal de la abuela no está junto a la casa ' + where);
    const beds = G.tiles.filter(t => t.own && t.t === 'bed' && !t.plant);
    assert(beds.length >= 8, `quedan solo ${beds.length} canteros libres ${where}`);
    assert(beds.filter(t => t.sun >= 6).length >= 3, 'faltan canteros soleados adonde llevar el rosal ' + where);
    // un árbol viejo en el jardín y el estanque dentro del rincón húmedo
    assert(G.plants.some(p => p.old && SP[p.sp].art.f === 'tree' && tileAt(p.x, p.y).own), 'falta el árbol de la abuela ' + where);
    const wet = PARCELS.findIndex(p => p.soil === 'wet'), pond = G.tiles.filter(t => t.t === 'water');
    assert(pond.length >= 3 && pond.every(t => t.parcel === wet), 'el estanque no quedó en el rincón húmedo ' + where);
    // los visitantes llegan desde la reja a todo el pasto del jardín
    const lawn = G.tiles.filter(t => t.own && (t.t === 'grass' || t.t === 'path') && !t.plant && !t.obj);
    const lost = lawn.filter(t => !(t.x === GX && t.y === GH - 1) && !findPath(GX, GH - 1, t.x, t.y));
    assert(lost.length <= 2, `${lost.length} rincones del jardín quedan encerrados ${where}`);
  }
});

check('las plantas de la abuela están a gusto donde quedaron', () => {
  for (const [seed, cl] of [[11, 'santiago'], [23, 'valdivia'], [37, 'serena'], [41, 'cdmx']]) {
    run(`newGarden(${seed}, '${cl}'); UI.title = false; VIS.list = []; VIS.queue = [];`);
    days(8, careful);
    const sick = G.plants.filter(p => tileAt(p.x, p.y).own && p.sp !== 'rose' && (p.dead || p.hp < 50));
    assert(!sick.length, `en ${cl} sufren: ${sick.map(p => `${p.sp} (${Math.round(p.hp)})`).join(', ')}`);
  }
});

check('un terreno al azar se guarda con sus parcelas, y las partidas antiguas siguen con el jardín clásico', () => {
  const PARCELS = get('PARCELS'), shape = () => JSON.stringify(PARCELS) + G.tiles.map(t => t.t[0] + t.parcel).join('');
  run("newGarden(99, 'serena'); UI.title = false;");
  const before = shape(), n = G.plants.length;
  run('saveGame()'); run("newGarden(5, 'cdmx')");
  assert(run('loadGame()') && shape() === before && G.plants.length === n && G.climate === 'serena', 'el terreno no volvió igual');
  // una partida guardada antes de los terrenos al azar no trae sus parcelas
  fresh();
  run('saveGame()');
  const key = get('SAVE_KEY'), d = JSON.parse(memory[key]); delete d.parcels; delete d.map; memory[key] = JSON.stringify(d);
  run('newGarden(3)');
  assert(run('loadGame()') && JSON.stringify(PARCELS) === JSON.stringify(get('CLASSIC_PARCELS')), 'una partida antigua debería volver al jardín clásico');
  assert(G.plants.some(p => p.sp === 'walnut' && p.x === 7 && p.y === 13), 'el nogal clásico no está');
});

check('la vista gira a los cuatro lados: el puntero sigue señalando la casilla correcta y todo se dibuja', () => {
  run('demoGarden("santiago"); UI.title = false; VIS.list = [];');
  for (const [x, y] of [[5.5, 9.5], [12.5, 3.5], [20.5, 14.5]]) run(`(() => { const v = spawnVisitor(true); Object.assign(v, { x: ${x}, y: ${y}, state: 'look', wait: 99 }); })()`);
  const cam = get('cam'), P = get('P'), screenToWorld = get('screenToWorld'), keyOf = get('keyOf'), facing = get('facing');
  const GH = get('GH'), GW = get('GW');
  for (let r = 0; r < 4; r++) {
    run(`cam.rot = ${r}; centerOn(GW / 2, GH / 2, 1)`);
    for (const [x, y] of [[3.2, 7.7], [20.1, 1.3], [11.5, GH + 1]]) {
      const [sx, sy] = P(x, y), [wx, wy] = screenToWorld(sx, sy);
      assert(Math.abs(wx - x) < 1e-9 && Math.abs(wy - y) < 1e-9, `vista ${r}: (${x}, ${y}) vuelve como (${wx}, ${wy})`);
    }
    const seen = [[0, 1], [1, 0], [0, -1], [-1, 0]].filter(n => facing(...n) > 0).length;
    assert(seen === 2, `vista ${r}: se ven ${seen} muros de la casa`);
    for (const h of [12, 21.5]) { G.hour = h; run('drawWorld(0.016)'); }
    assert(get('R.houseGlows').length > 0, `vista ${r}: la casa no tiene luces en las ventanas`);
  }
  // de frente se ve la calle adelante; dado vuelta, la calle queda al fondo
  run('cam.rot = 0'); assert(keyOf(5, GH + 1) > keyOf(5, 0), 'la calle debería ir adelante');
  run('cam.rot = 2'); assert(keyOf(5, GH + 1) < keyOf(5, 0), 'girado, la calle debería ir al fondo');
  // girar cuatro veces deja todo como estaba, mirando el mismo punto
  run('cam.rot = 0; centerOn(8.5, 6.5, 1)');
  for (let i = 0; i < 4; i++) run('rotateView(1)');
  const [cx, cy] = run('screenToWorld(VW / 2, VH / 2)');
  assert(cam.rot === 0 && Math.abs(cx - 8.5) < 0.6 && Math.abs(cy - 6.5) < 0.6, `después de dar la vuelta se mira (${cx}, ${cy})`);
});

check('un año completo pasa sin errores', () => {
  fresh({ money: 3000 });
  G.open = true;
  days(52, careful);
  assert(G.day >= 52, 'no pasó el año');
});

if (failed) { console.log(`\n${failed} prueba(s) fallaron`); process.exit(1); }
console.log('\nTodo bien ✔');
