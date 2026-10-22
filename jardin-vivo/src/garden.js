// ===== El jardín: terreno, suelo, luz, plantas y la simulación día a día =====
const GW = 24, GH = 18;                 // metros; cada casilla es 1 m²
const HOUSE = { x0: 0, y0: 0, x1: 6, y1: 5, wall: 3.2, ridge: 5.8 };
const GATE_X = 3;                       // la reja de entrada, en el borde de la calle (y = GH)
const START_MONEY = 300;

// Parcelas: la primera es tuya; las otras se compran y cada una tiene su propio suelo.
// En cada partida cambian de forma y de lugar (layoutParcels); estas son las del jardín clásico de la portada.
const CLASSIC_PARCELS = [
  { x0: 0, y0: 0, x1: 10, y1: GH, price: 0, soil: 'home' },
  { x0: 10, y0: 9, x1: 17, y1: GH, price: 900, soil: 'sandy' },
  { x0: 10, y0: 0, x1: 17, y1: 9, price: 1600, soil: 'wet' },
  { x0: 17, y0: 9, x1: 24, y1: GH, price: 2600, soil: 'rocky' },
  { x0: 17, y0: 0, x1: 24, y1: 9, price: 4200, soil: 'forest' }
];
const PARCELS = CLASSIC_PARCELS.map(p => ({ ...p }));

// Cosas que se pueden construir. tile = cambia el suelo; w/h = ocupa varias casillas
const BUILD = {
  bed: { cost: 6, tile: 'bed', icon: '🟫' },
  path: { cost: 4, tile: 'path', icon: '🪨' },
  grass: { cost: 2, tile: 'grass', icon: '🌿' },
  pond: { cost: 30, tile: 'water', icon: '💧', tier: 1 },
  drip: { cost: 14, icon: '🪢' },
  shade: { cost: 18, over: 1, icon: '🕸️', tier: 1 },
  bench: { cost: 70, beauty: 4, walk: 1, icon: '🪑' },
  lantern: { cost: 45, beauty: 3, icon: '🏮' },
  gnome: { cost: 25, beauty: 1.5, icon: '🧙' },
  birdbath: { cost: 90, beauty: 6, icon: '🐦', tier: 1 },
  sprinkler: { cost: 85, icon: '🚿', tier: 1 },
  beehive: { cost: 160, beauty: 4, icon: '🐝', tier: 1 },
  arch: { cost: 60, beauty: 3, walk: 1, overhead: 1, icon: '⛩️', tier: 1 },
  pergola: { cost: 240, w: 2, h: 2, beauty: 10, walk: 1, overhead: 1, icon: '🏛️', tier: 2 },
  sundial: { cost: 120, beauty: 7, icon: '🕰️', tier: 2 },
  fountain: { cost: 650, w: 2, h: 2, beauty: 32, icon: '⛲', tier: 2 },
  greenhouse: { cost: 1500, w: 4, h: 3, beauty: 18, icon: '🏡', tier: 2 },
  statue: { cost: 380, beauty: 18, icon: '🗿', tier: 3 }
};
const BUILD_ORDER = ['bed', 'path', 'grass', 'drip', 'pond', 'shade', 'bench', 'lantern', 'gnome', 'birdbath', 'sprinkler', 'beehive', 'arch', 'pergola', 'sundial', 'fountain', 'greenhouse', 'statue'];

// Cuidados del suelo y de las plantas
const CARE = {
  compost: { cost: 8, icon: '🍂' }, sand: { cost: 6, icon: '⏳' }, peat: { cost: 10, icon: '🟤' },
  sulfur: { cost: 8, icon: '🟡' }, lime: { cost: 6, icon: '⚪' }, fert: { cost: 5, icon: '🧪' },
  mulch: { cost: 4, icon: '🪵' }, weed: { cost: 0, icon: '🌾' }, prune: { cost: 0, icon: '✂️' }, spray: { cost: 6, icon: '🫧' }, cloth: { cost: 12, icon: '🧣' },
  tray: { cost: 6, icon: '🪨' }   // bandeja con piedras y agua bajo una maceta: más humedad para plantas tropicales
};
const CARE_ORDER = ['compost', 'sand', 'peat', 'sulfur', 'lime', 'fert', 'mulch', 'weed', 'prune', 'spray', 'cloth'];

const idx = (x, y) => y * GW + x;
const inside = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH;
// Las macetas de las ventanas de la casa viven "fuera" del terreno: x = 100, 101, …
const POT_X = 100, POTS_PER_WINDOW = 3, POT_PRICE = 8;
const tileAt = (x, y) => (inside(x, y) ? G.tiles[idx(x, y)] : x >= POT_X && G.pots ? G.pots[x - POT_X] || null : null);
// Hacia dónde mira cada ventana (en el mundo, el norte está hacia x e y negativos)
const WINDOWS = [
  { id: 'N', n: [-Math.SQRT1_2, -Math.SQRT1_2] }, { id: 'E', n: [Math.SQRT1_2, -Math.SQRT1_2] },
  { id: 'S', n: [Math.SQRT1_2, Math.SQRT1_2] }, { id: 'W', n: [-Math.SQRT1_2, Math.SQRT1_2] }
];
// Una maceta con sustrato: franco, suelto, rico y casi neutro. Las dos primeras ya están en la casa.
function makePot(i) {
  return {
    x: POT_X + i, y: 0, t: 'pot', pot: 1, win: WINDOWS[Math.floor(i / POTS_PER_WINDOW)].id, own: i % POTS_PER_WINDOW === 0 && i < 6 ? 1 : 0, parcel: 0,
    drain: 0.62, ph: 6.5, ph0: 6.5, org: 0.6, fert: 0.55, moist: 0.5, mulch: 0, weeds: 0, obj: 0, over: 0, gh: 0, shade: 0, drip: 0, tray: 0,
    plant: null, seedBank: null, sun: 0, sunAm: 0, sunPm: 0, prof: new Float32Array(48), mSum: 0, mN: 0, mMin: 0.5, mMax: 0.5, wet: 0, v: 0.5
  };
}
const isHouse = (x, y) => x >= HOUSE.x0 && x < HOUSE.x1 && y >= HOUSE.y0 && y < HOUSE.y1;
const parcelOf = (x, y) => PARCELS.findIndex(p => x >= p.x0 && x < p.x1 && y >= p.y0 && y < p.y1);

const G = {};

// ---------- Crear un jardín nuevo ----------
// classic = el jardín de siempre (portada y partidas guardadas antes de que los terrenos cambiaran)
function newGarden(seed, climate, classic) {
  setClimate(climate);
  Object.assign(G, {
    v: 1, seed: seed || (Math.random() * 1e9) | 0, climate: climate && CLIMATES[climate] ? climate : 'santiago', day: 0, hour: 7.5, speed: 1,
    money: START_MONEY, rep: 0, repMax: 0, open: false, price: 3,
    tiles: [], plants: [], structs: [], nextId: 1, owned: [true, false, false, false, false],
    w: null, wNext: null, beauty: 0, fair: 3,
    stats: { visitors: 0, income: 0, harvests: 0, planted: 0, watered: 0, lens: 0, beds: 0, bloomed: 0 },
    today: { visitors: 0, income: 0, sat: 0, satN: 0, harvest: 0 },
    herb: {}, goal: 0, goalsDone: {}, orders: [], orderDay: 6, log: [], hose: 0,
    // la abuela dejó semillas en el cobertizo
    inv: { calendula: 4, lettuce: 4, tagetes: 3, sunflower: 2, basil: 2 }
  });
  const r = rng(G.seed), rl = rng(G.seed ^ 0x5bd1e995);
  PARCELS.splice(0, PARCELS.length, ...(classic ? CLASSIC_PARCELS.map(p => ({ ...p })) : layoutParcels(rl)));
  G.map = classic ? { classic: 1, spring: { p: 2, x: 14, y: 4 } } : {};
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) G.tiles.push(makeTile(x, y));
  G.pots = WINDOWS.flatMap((_, w) => Array.from({ length: POTS_PER_WINDOW }, (_, k) => makePot(w * POTS_PER_WINDOW + k)));
  G.w = makeWeather(0, null, r);
  G.w.cloud = 0.1; G.w.rain = 0; G.w.kind = 'sun'; G.w.tmax = 21; G.w.tmin = 8;
  G.wNext = makeWeather(1, G.w, r);
  if (classic) classicGarden(); else randomGarden(rl);
  for (const p of G.plants) if (tileAt(p.x, p.y).own) G.herb[p.sp] = 1;
  computeLight();
  for (const t of G.tiles) resetMoistStats(t);
  updateBeauty();
}

function classicGarden() {
  // camino de la puerta de la casa a la reja
  for (let y = HOUSE.y1; y < GH; y++) setType(GATE_X, y, 'path');
  for (let x = HOUSE.x1; x < HOUSE.x1 + 2; x++) setType(x, 3, 'path');
  // el antiguo jardín: un cantero junto a la casa y el nogal viejo
  for (let x = 1; x < 3; x++) for (let y = 6; y < 9; y++) setType(x, y, 'bed');
  for (let x = 4; x < 9; x++) setType(x, 7, 'bed');
  setType(6, 8, 'bed'); setType(7, 8, 'bed');
  for (let x = 7; x < 10; x++) for (let y = 1; y < 3; y++) setType(x, y, 'bed');
  grandmaBeds();
  oldTreeSoil(7, 13);
  addPlant('walnut', 7, 13, { g: 1, hp: 95, old: 1 });
  addPlant('rose', 1, 6, { g: 1, hp: 55, old: 1 });          // la rosa de la abuela, a la sombra de la casa
  addPlant('rosemary', 2, 8, { g: 1, hp: 90 });
  addPlant('lemon', 8, 8, { g: 0.85, hp: 85 });
  addPlant('lavender', 5, 7, { g: 0.6, hp: 80 });
  addPlant('geranium', 8, 1, { g: 1, hp: 90 });
  addStruct('bench', 8, 11);
  // parcelas que se compran: un estanque natural en el rincón húmedo y un viejo arce en el bosque
  for (const [x, y] of [[13, 3], [14, 3], [13, 4], [14, 4], [15, 4]]) setType(x, y, 'water');
  addPlant('maple', 20, 4, { g: 1, hp: 95, old: 1 });
  addPlant('fern', 19, 6, { g: 1, hp: 90 }); addPlant('fern', 21, 6, { g: 1, hp: 90 });
  addPlant('hellebore', 22, 3, { g: 1, hp: 90 });
  addPlant('agave', 21, 14, { g: 1, hp: 95 });
  addPlant('opuntia', 19, 16, { g: 1, hp: 95 });
}
// la abuela abonaba sus canteros: tierra franca, rica y casi neutra
function grandmaBeds() {
  for (const t of G.tiles) if (t.t === 'bed' && t.parcel === 0) Object.assign(t, { drain: 0.52, ph: 6.8, ph0: 6.9, org: 0.5, fert: 0.55 });
}
// bajo un árbol viejo la tierra es más rica y algo más ácida (hojarasca de muchos años)
function oldTreeSoil(tx, ty) {
  for (const t of G.tiles) {
    if (t.parcel !== 0 || t.t === 'bed' || Math.hypot(t.x - tx, t.y - ty) >= 4) continue;
    t.org = clamp(t.org + 0.2, 0, 1); t.fert = clamp(t.fert + 0.1, 0, 1);
    if (t.ph > 6.5) t.ph = t.ph0 = clamp(t.ph - 0.35, 4.8, 8.6);
  }
}

// ---------- Un terreno distinto en cada partida ----------
// La casa, la reja y el camino entre ellas no se mueven; todo lo demás sale del azar de la partida.
const PARCEL_PRICES = [900, 1600, 2600, 4200];
function layoutParcels(r) {
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  const hx = ri(9, 11), sx = ri(hx + 6, GW - 6), syL = ri(7, 11), syR = ri(7, 11);
  const soils = shuffleR(['sandy', 'wet', 'rocky', 'forest'], r);
  // los precios suben al alejarse de la casa y de la calle
  const cells = [[hx, syL, sx, GH], [hx, 0, sx, syL], [sx, syR, GW, GH], [sx, 0, GW, syR]];
  return [{ x0: 0, y0: 0, x1: hx, y1: GH, price: 0, soil: 'home' }]
    .concat(cells.map(([x0, y0, x1, y1], i) => ({ x0, y0, x1, y1, price: PARCEL_PRICES[i], soil: soils[i] })));
}
function shuffleR(a, r) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Lo más frío de un invierno normal en esta ciudad: las plantas que la abuela dejó lo aguantan
function climateLow() {
  let m = 99;
  for (let yd = 0; yd < DAYS_YEAR; yd++) m = Math.min(m, CL.normals(yd).tmin);
  return m - 2;
}
// Horas de frío de un invierno normal (lo que piden cerezos, magnolios y peonías para florecer)
function climateChill() {
  let n = 0;
  for (let yd = 0; yd < DAYS_YEAR; yd++) if (yd >= 26 || yd < 2) { const c = CL.normals(yd); n += chillHours({ tmin: c.tmin, tmax: c.tmax }); }
  return n;
}
function randomGarden(r) {
  const H = HOUSE, home = PARCELS[0], low = climateLow(), chill = climateChill(), ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  let rain = 0;
  for (let yd = 0; yd < DAYS_YEAR; yd++) rain += CL.normals(yd).rainP / DAYS_YEAR;
  // solo especies que se dan en esta ciudad: aguantan su invierno, reciben el frío que piden, toleran su suelo y su lluvia
  const hardy = ids => ids.filter(id => {
    const sp = SP[id];
    return sp.minT <= low && (sp.chill || 0) <= chill * 0.8 && CL.ph >= sp.ph[0] - 0.3 && CL.ph <= sp.ph[1] + 0.3 &&
      !(rain > 0.3 && (sp.water === 'low' || sp.water === 'xeric'));
  });
  const pickR = a => a[Math.floor(r() * a.length)];
  const free = (x, y, p = 0) => { const t = tileAt(x, y); return !!t && t.parcel === p && t.t === 'grass' && !t.plant && !t.obj; };
  const nearHouse = (x, y) => x >= H.x0 - 1 && x <= H.x1 && y >= H.y0 - 1 && y <= H.y1;
  // ¿se puede caminar desde la reja hasta todo el pasto del jardín? (nada queda encerrado)
  const walk = t => t.parcel === 0 && (t.t === 'grass' || t.t === 'path') && !t.plant && (!t.obj || BUILD[G.structs.find(s => s.id === t.obj).k].walk);
  const connected = () => {
    const seen = new Set([idx(GATE_X, GH - 1)]), q = [[GATE_X, GH - 1]];
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const t = tileAt(x + dx, y + dy);
        if (t && !seen.has(idx(t.x, t.y)) && walk(t)) { seen.add(idx(t.x, t.y)); q.push([t.x, t.y]); }
      }
    }
    return G.tiles.every(t => !walk(t) || seen.has(idx(t.x, t.y)));
  };
  // prueba un cambio y lo deshace si deja algún rincón encerrado
  const tryBeds = cells => { for (const t of cells) t.t = 'bed'; if (connected()) return true; for (const t of cells) t.t = 'grass'; return false; };
  // la abuela le preparó la tierra a cada planta suya: más suelta para las de poco riego, con el pH que les gusta
  const suitSoil = (x, y, id) => {
    const t = tileAt(x, y), sp = SP[id], dry = sp.water === 'low' || sp.water === 'xeric';
    t.drain = lerp(sp.drain[0], sp.drain[1], dry ? 0.8 : 0.5);
    t.ph = t.ph0 = clamp(t.ph, sp.ph[0] + 0.1, sp.ph[1] - 0.1);
    if (dry) t.org = Math.min(t.org, 0.3);
  };
  // un lugar libre al azar dentro de una parcela, lejos de sus bordes si se puede
  const spot = (p, ok, tries = 300) => {
    const pc = PARCELS[p];
    for (let i = 0; i < tries; i++) {
      const m = i < tries / 2 ? 1 : 0, x = ri(pc.x0 + m, pc.x1 - 1 - m), y = ri(pc.y0 + m, pc.y1 - 1 - m);
      if (free(x, y, p) && (!ok || ok(x, y))) return [x, y];
    }
    return null;
  };
  // caminos: de la casa a la reja (siempre) y a veces uno que sale por el costado de la casa
  for (let y = H.y1; y < GH; y++) setType(GATE_X, y, 'path');
  if (r() < 0.6) { const y = ri(1, 3); for (let x = H.x1; x < Math.min(home.x1, H.x1 + ri(2, 4)); x++) setType(x, y, 'path'); }
  // el árbol viejo de la abuela, con su banca
  const tree = spot(0, (x, y) => y >= H.y1 + 2 && y <= GH - 3 && Math.abs(x - GATE_X) >= 2 && x <= home.x1 - 2);
  const trees = hardy(['walnut', 'walnut', 'jacaranda', 'olive', 'cherry', 'magnolia']);
  if (tree) {
    const id = pickR(trees.length ? trees : ['olive']);
    oldTreeSoil(tree[0], tree[1]);
    suitSoil(tree[0], tree[1], id);
    addPlant(id, tree[0], tree[1], { g: 1, hp: 95, old: 1 });
    const seat = spot(0, (x, y) => { const d = Math.hypot(x - tree[0], y - tree[1]); return d >= 1.4 && d <= 2.3 && x !== GATE_X; }, 120);
    if (seat) {
      addStruct('bench', seat[0], seat[1]);
      // unas piedras desde el camino hasta la banca
      const dir = Math.sign(seat[0] - GATE_X);
      if (r() < 0.6) for (let x = GATE_X + dir; x !== seat[0]; x += dir) { if (!free(x, seat[1])) break; setType(x, seat[1], 'path'); }
    }
  }
  // las parcelas vecinas: estanque con vertiente, bosquecito, pedregal y lomita
  for (let p = 1; p < PARCELS.length; p++) {
    const pc = PARCELS[p];
    if (pc.soil === 'wet') {
      const s = spot(p, null) || [pc.x0 + 2, pc.y0 + 2], pond = [s], want = ri(4, 7);
      setType(s[0], s[1], 'water');
      for (let i = 0; i < 80 && pond.length < want; i++) {
        const [bx, by] = pickR(pond), [dx, dy] = pickR([[1, 0], [-1, 0], [0, 1], [0, -1]]), x = bx + dx, y = by + dy;
        if (free(x, y, p) && x > pc.x0 && x < pc.x1 - 1 && y > pc.y0 && y < pc.y1 - 1) { setType(x, y, 'water'); pond.push([x, y]); }
      }
      G.map.spring = { p, x: pond.reduce((a, c) => a + c[0], 0) / pond.length, y: pond.reduce((a, c) => a + c[1], 0) / pond.length };
      for (let i = ri(0, 2); i > 0; i--) {
        const b = spot(p, (x, y) => nearWater(x, y));
        const id = pickR(hardy(['yellowiris', 'calla', 'papyrus']));
        if (b && id) addPlant(id, b[0], b[1], { g: 1, hp: 90 });
      }
    } else if (pc.soil === 'forest') {
      const a = spot(p, null);
      const big = hardy(['maple', 'maple', 'magnolia', 'cherry']);
      if (a) addPlant(pickR(big.length ? big : ['maple']), a[0], a[1], { g: 1, hp: 95, old: 1 });
      const b = r() < 0.5 && big.length && spot(p, (x, y) => !a || Math.hypot(x - a[0], y - a[1]) >= 3);
      if (b) addPlant(pickR(big), b[0], b[1], { g: 0.9, hp: 90 });
    } else if (pc.soil === 'rocky') {
      for (let i = ri(2, 3); i > 0; i--) {
        const c = spot(p, (x, y) => !G.plants.some(q => Math.abs(q.x - x) <= 1 && Math.abs(q.y - y) <= 1));
        const id = pickR(hardy(['agave', 'opuntia', 'aloe', 'barrel', 'sempervivum']));
        if (c && id) addPlant(id, c[0], c[1], { g: 1, hp: 95 });
      }
    } else if (pc.soil === 'sandy') {
      for (let i = ri(0, 3); i > 0; i--) {
        const c = spot(p, null);
        const id = pickR(hardy(['stipa', 'poppy', 'thyme', 'lavender']));
        if (c && id) addPlant(id, c[0], c[1], { g: 1, hp: 90 });
      }
    }
  }
  // con los árboles en su lugar ya se sabe cuánto sol recibe cada rincón, hoy y en pleno verano
  // (una planta de sombra tiene que aguantar también los días largos)
  G.day = 19; computeLight();
  for (const t of G.tiles) t.sunS = t.sun;
  G.day = 0; computeLight();
  for (const t of G.tiles) resetMoistStats(t);
  // plantas de sombra bajo los árboles del bosquecito
  const fp = PARCELS.findIndex(p => p.soil === 'forest');
  const shady = G.tiles.filter(t => t.parcel === fp && free(t.x, t.y, fp) && t.sunS <= 6).sort((a, b) => a.sunS - b.sunS);
  for (let i = ri(2, 4); i > 0 && shady.length; i--) {
    const t = shady.splice(Math.floor(r() * Math.min(4, shady.length)), 1)[0];
    const id = pickR(hardy(['fern', 'fern', 'hellebore', 'hosta', 'foxglove']).filter(id => SP[id].sun[1] + 0.5 >= t.sunS));
    if (id) addPlant(id, t.x, t.y, { g: 1, hp: 90 });
  }
  // los canteros de la abuela: dos a cuatro manchones, el primero en el lugar más soleado
  const shapes = [[5, 1], [1, 5], [4, 1], [1, 4], [3, 2], [2, 3], [2, 2], [4, 2], [2, 4], [3, 3]];
  const around = [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1]];
  const okBed = (x, y) => free(x, y) && !nearHouse(x, y) && !(tree && Math.abs(x - tree[0]) <= 1 && Math.abs(y - tree[1]) <= 1) &&
    !around.some(([dx, dy]) => { const n = tileAt(x + dx, y + dy); return n && n.t === 'bed'; });
  // al menos 14 casillas, y varias con 6 horas de sol o más (para sembrar y para rescatar el rosal)
  let bedN = 0;
  const sunnyBeds = () => G.tiles.filter(t => t.parcel === 0 && t.t === 'bed' && t.sun >= 6).length;
  for (let n = 0; n < 6 && (n < 2 || bedN < 14 || sunnyBeds() < 6); n++) {
    const options = [];
    for (let k = 0; k < 160; k++) {
      const [w, h] = pickR(shapes), x0 = ri(0, home.x1 - w), y0 = ri(0, GH - 1 - h), cells = [];
      for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) cells.push(tileAt(x, y));
      if (!cells.every(t => okBed(t.x, t.y))) continue;
      const sun = cells.reduce((a, t) => a + t.sun, 0) / cells.length;
      if (sun >= (n === 0 || sunnyBeds() < 6 ? 6 : 3.5)) options.push({ cells, score: n === 0 ? sun : sun + r() * 4 });
    }
    const best = options.sort((a, b) => b.score - a.score).find(o => tryBeds(o.cells));
    if (best) bedN += best.cells.length;
  }
  // el rosal de la abuela quedó en el rincón más sombrío junto a la casa
  const rt = G.tiles.filter(t => free(t.x, t.y) && nearHouse(t.x, t.y) && t.x !== GATE_X).sort((a, b) => a.sun - b.sun).find(t => tryBeds([t]));
  if (rt) for (const [dx, dy] of shuffleR([[1, 0], [-1, 0], [0, 1], [0, -1]], r)) {
    const n = tileAt(rt.x + dx, rt.y + dy);
    if (n && free(n.x, n.y) && nearHouse(n.x, n.y) && n.x !== GATE_X && tryBeds([n])) break;
  }
  grandmaBeds();
  if (rt) addPlant('rose', rt.x, rt.y, { g: 1, hp: 55, old: 1 });
  // otras plantas que la abuela cuidó por años, cada una donde se siente bien; quedan canteros libres para sembrar
  const pool = shuffleR(hardy(['rosemary', 'lavender', 'geranium', 'agapanthus', 'iris', 'hydrangea', 'fuchsia', 'calla', 'camellia', 'peony',
    'salvia', 'boxwood', 'alstroemeria', 'strelitzia', 'aloe', 'daisy', 'thyme', 'jasmine']), r);
  const keep = ri(3, 5);
  let placed = 0;
  for (const id of pool) {
    const beds = G.tiles.filter(t => t.parcel === 0 && t.t === 'bed' && !t.plant), sunny = beds.filter(t => t.sun >= 6).length;
    if (placed >= keep || beds.length <= 9) break;
    let bt = null, bc = 0.8;
    for (const t of beds) {
      if ((t.sun >= 6 && sunny <= 5) || t.sunS > SP[id].sun[1] + 0.5) continue;
      const c = evaluate(SP[id], t, null, G.w, true).cond;
      if (c > bc) { bc = c; bt = t; }
    }
    if (!bt) continue;
    suitSoil(bt.x, bt.y, id);
    addPlant(id, bt.x, bt.y, { g: 0.6 + r() * 0.4, hp: 80 + ri(0, 15) });
    placed++;
  }
  // a veces también un frutal chico en el pasto
  const fruit = hardy(['lemon', 'olive', 'cherry']);
  if (fruit.length && r() < 0.6) {
    const f = spot(0, (x, y) => !nearHouse(x, y) && tileAt(x, y).sun >= 7 && !G.plants.some(q => isTree(spOf(q)) && Math.hypot(q.x - x, q.y - y) < 4));
    if (f) {
      const id = pickR(fruit), p = addPlant(id, f[0], f[1], { g: 0.85, hp: 85 });
      if (connected()) suitSoil(f[0], f[1], id); else removePlant(p);
    }
  }
}

function makeTile(x, y) {
  const p = parcelOf(x, y), soil = PARCELS[p].soil;
  const n1 = noise2(x / 4, y / 4, G.seed), n2 = noise2(x / 3 + 9, y / 3, G.seed + 7);
  let drain = 0.48 + CL.drain + (n1 - 0.5) * 0.3, ph = CL.ph + (n2 - 0.5) * 0.7, org = 0.25 + n2 * 0.15 + (CL.ph < 6.2 ? 0.15 : 0), fert = 0.35 + n1 * 0.15;
  if (soil === 'home') {
    // junto a la casa la tierra quedó compactada (arcillosa)
    const dh = Math.hypot(x - 3, y - 2.5);
    if (dh < 7) drain -= (7 - dh) * 0.035;
    ph = clamp(ph, 4.8, 8.6);
  } else if (soil === 'sandy') { drain = 0.78 + n1 * 0.12; ph = 7.0 + (n2 - 0.5) * 0.4; org = 0.12; fert = 0.2; }
  else if (soil === 'wet') { drain = 0.16 + n1 * 0.16; ph = 6.6 + (n2 - 0.5) * 0.4; org = 0.55; fert = 0.5; }
  else if (soil === 'rocky') { drain = 0.9 + n1 * 0.1; ph = 7.9 + (n2 - 0.5) * 0.4; org = 0.06; fert = 0.12; }
  else if (soil === 'forest') { drain = 0.5 + (n1 - 0.5) * 0.2; ph = 5.4 + (n2 - 0.5) * 0.5; org = 0.75; fert = 0.55; }
  drain = clamp(drain, 0.05, 1);
  return {
    x, y, t: isHouse(x, y) ? 'house' : 'grass', own: p === 0, parcel: p,
    drain, ph, ph0: ph, org: clamp(org, 0, 1), fert: clamp(fert, 0, 1), moist: 0.45 + n1 * 0.15,
    mulch: 0, weeds: 0, obj: 0, over: 0, gh: 0, shade: 0, drip: 0, plant: null, seedBank: null,
    sun: 0, sunAm: 0, sunPm: 0, prof: new Float32Array(48), mSum: 0, mN: 0, mMin: 1, mMax: 0, wet: 0, v: hash2(x, y, 3)
  };
}

function setType(x, y, t) { const tl = tileAt(x, y); if (tl) tl.t = t; }
const tileWet = t => t.t === 'water';
const nearWater = (x, y) => {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const t = tileAt(x + dx, y + dy); if (t && t.t === 'water' && (dx || dy)) return true;
  }
  return false;
};

// ---------- Plantas ----------
function addPlant(id, x, y, o = {}) {
  const sp = SP[id], t = tileAt(x, y);
  const yd = G.day % DAYS_YEAR;
  const p = {
    id: G.nextId++, sp: id, x, y, g: o.g !== undefined ? o.g : sp.start, hp: o.hp || 80, age: o.old ? 400 : 0,
    bloom: 0, fruit: 0, dorm: false, dead: false, chill: 0, pests: 0, imm: 0, cloth: 0, cut: 0, cutYear: -1,
    seed: (Math.random() * 1e9) | 0, fac: null, cond: 1, wilt: 0, burn: 0, yellow: 0, frostHit: 0, done: 0,
    bloomedYear: -1, rich: 0, old: o.old || 0, pal: 0, prunedDay: o.old ? -999 : G.day, propYear: -1
  };
  if (sp.art.fl && sp.art.fl.pal) p.pal = (p.seed >>> 3) % sp.art.fl.pal.length;
  // las plantas de vivero que necesitan frío ya lo pasaron si se compran a fines del invierno
  if (sp.chill && (yd >= 39 || yd <= 3)) p.chill = sp.chill;
  if (o.g === 1 && sp.chill) p.chill = sp.chill;
  p.dorm = isDormant(sp, yd);
  t.plant = p;
  G.plants.push(p);
  return p;
}
const isDormant = (sp, yd) => !!sp.dorm && inWindow(yd, sp.dorm);
function removePlant(p) {
  const t = tileAt(p.x, p.y);
  if (t && t.plant === p) t.plant = null;
  G.plants.splice(G.plants.indexOf(p), 1);
  if (typeof dropSprite === 'function') dropSprite(p);
}
const spOf = p => SP[p.sp];
const isTree = sp => sp.art.f === 'tree';
// Tamaño actual en metros (alto y ancho), según cuánto ha crecido
function plantSize(p) {
  const sp = spOf(p), a = sp.art, k = 0.18 + 0.82 * clamp(p.g, 0, 1);
  return { h: (a.h || 0.3) * k, w: (a.w || 0.4) * k };
}

// ---------- Estructuras ----------
function addStruct(k, x, y) {
  const b = BUILD[k], w = b.w || 1, h = b.h || 1;
  const s = { id: G.nextId++, k, x, y, w, h };
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) {
    const t = tileAt(i, j);
    if (k === 'greenhouse') { t.gh = s.id; t.t = 'bed'; }
    else if (b.overhead) t.over = s.id;
    else t.obj = s.id;
  }
  G.structs.push(s);
  return s;
}
function structAt(x, y) {
  const t = tileAt(x, y);
  if (!t) return null;
  const id = t.obj || t.gh || t.over;
  return id ? G.structs.find(s => s.id === id) : null;
}
function removeStruct(s) {
  for (let j = s.y; j < s.y + s.h; j++) for (let i = s.x; i < s.x + s.w; i++) {
    const t = tileAt(i, j);
    if (t.obj === s.id) t.obj = 0;
    if (t.over === s.id) t.over = 0;
    if (t.gh === s.id) t.gh = 0;
  }
  G.structs.splice(G.structs.indexOf(s), 1);
}

// ---------- Luz: horas de sol directo en cada casilla ----------
// Se lanza un rayo hacia el sol cada media hora y se ve si lo tapa la casa, un árbol, la pérgola…
let OCC = null;
function buildOccluders() {
  const n = GW * GH, z0 = new Float32Array(n), z1 = new Float32Array(n), tr = new Float32Array(n).fill(1);
  const put = (i, a, b, t) => {
    if (z1[i] === 0 || t < tr[i]) { z0[i] = z1[i] === 0 ? a : Math.min(z0[i], a); z1[i] = Math.max(z1[i], b); tr[i] = Math.min(tr[i], t); }
  };
  const yd = G.day % DAYS_YEAR;
  for (let y = HOUSE.y0; y < HOUSE.y1; y++) for (let x = HOUSE.x0; x < HOUSE.x1; x++) {
    const c = (HOUSE.y1 - HOUSE.y0) / 2, k = 1 - Math.abs(y + 0.5 - c) / c;
    put(idx(x, y), 0, HOUSE.wall + (HOUSE.ridge - HOUSE.wall) * k, 0);
  }
  for (const p of G.plants) {
    if (p.dead) continue;
    const sp = spOf(p), sz = plantSize(p);
    if (isTree(sp)) {
      const R = sz.w / 2, bare = p.dorm && sp.life === 'deciduous';
      const t = bare ? 0.72 : sp.art.cn === 'umbrella' ? 0.45 : 0.3;
      for (let y = Math.floor(p.y - R); y <= p.y + R; y++) for (let x = Math.floor(p.x - R); x <= p.x + R; x++) {
        if (!inside(x, y) || Math.hypot(x - p.x, y - p.y) > R) continue;
        put(idx(x, y), sz.h * 0.33, sz.h, t);
      }
    } else if (sz.h > 1.3 && !p.dorm) put(idx(p.x, p.y), 0.3, sz.h, 0.55);
  }
  for (const s of G.structs) {
    if (s.k !== 'pergola' && s.k !== 'arch') continue;
    for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) {
      const vine = G.plants.some(p => !p.dead && spOf(p).art.f === 'vine' && Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1 && p.g > 0.6);
      put(idx(x, y), 2.1, 2.6, s.k === 'arch' ? 0.8 : vine ? 0.4 : 0.62);
    }
  }
  for (const t of G.tiles) if (t.shade) put(idx(t.x, t.y), 2.0, 2.3, 0.35);
  OCC = { z0, z1, tr };
}

function traceSun(px, py, own, s) {
  const hl = Math.hypot(s.x, s.y) || 1e-6, dx = s.x / hl, dy = s.y / hl, dz = s.z / hl;
  let v = 1, last = own, used = true;
  for (let d = 0.3; d < 60; d += 0.3) {
    const z = 0.35 + dz * d;
    if (z > 7) break;
    const x = px + dx * d, y = py + dy * d;
    if (x < 0 || y < 0) { if (z < 1.3) v *= 0.4; break; }  // cerco del fondo
    if (x >= GW || y >= GH) break;
    const i = (y | 0) * GW + (x | 0);
    if (i !== last) { last = i; used = false; }
    if (!used && OCC.z1[i] > 0 && z >= OCC.z0[i] && z <= OCC.z1[i]) {
      v *= OCC.tr[i]; used = true;
      if (v < 0.03) return 0;
    }
  }
  return v;
}

function computeLight() {
  buildOccluders();
  const yd = G.day % DAYS_YEAR, sm = [];
  for (let k = 0; k < 48; k++) {
    const s = sunVector(yd, (k + 0.5) / 2);
    if (s.z > 0.1) sm.push([k, s]);   // sol a más de ~6° sobre el horizonte
  }
  G.openSun = sm.length / 2;
  for (const t of G.tiles) {
    t.prof.fill(0); t.sun = t.sunAm = t.sunPm = 0;
    if (t.t === 'house') continue;
    const own = idx(t.x, t.y), glass = t.gh ? 0.85 : 1;
    for (const [k, s] of sm) {
      const v = traceSun(t.x + 0.5, t.y + 0.5, own, s) * glass;
      t.prof[k] = v; t.sun += v / 2;
      if (k < 26) t.sunAm += v / 2; else t.sunPm += v / 2;
    }
  }
  // por una ventana entra sol cuando el sol está de frente; el alero tapa el sol muy alto y el vidrio deja pasar el 85 %
  for (const t of G.pots) {
    t.prof.fill(0); t.sun = t.sunAm = t.sunPm = 0;
    const n = WINDOWS.find(w => w.id === t.win).n;
    for (const [k, s] of sm) {
      const facing = (s.x * n[0] + s.y * n[1]) / (Math.hypot(s.x, s.y) || 1), elev = Math.asin(clamp(s.z, -1, 1));
      const v = facing > 0.25 ? 0.85 * clamp(1 - (elev - 0.9) / 0.5, 0, 1) : 0;
      t.prof[k] = v; t.sun += v / 2;
      if (k < 26) t.sunAm += v / 2; else t.sunPm += v / 2;
    }
  }
  G.lightDirty = false;
}

// ---------- Necesidades: qué tan feliz está cada planta en su lugar ----------
const rangeScore = (v, r, soft, floor = 0.1) =>
  v < r[0] ? clamp(1 - (r[0] - v) / soft, floor, 1) : v > r[1] ? clamp(1 - (v - r[1]) / soft, floor, 1) : 1;

function ambientHum(t, w) {
  if (t.pot) return 0.4 + (t.tray ? 0.2 : 0);   // dentro de la casa el aire es seco; la bandeja con agua ayuda
  if (t.gh) return 0.82;
  return clamp(w.hum + (nearWater(t.x, t.y) ? 0.15 : 0) + (t.sun < 3 ? 0.08 : 0), 0, 1);
}
function nightMin(t, p, w) {
  if (t.pot) return 16;                          // dentro de la casa nunca hiela
  let tmin = w.tmin;
  if (t.gh) tmin = Math.max(tmin + 8, 14);   // invernadero con calefacción
  if (p && p.cloth) tmin += 3;
  if (t.mulch) tmin += 0.5;
  if (OCC && OCC.z1[idx(t.x, t.y)] > 1.5) tmin += 1;     // bajo los árboles o la pérgola hiela menos
  return tmin;
}
function dayMax(t, w) {
  if (t.pot) return 23 + t.sun * 0.4;
  let tmax = w.tmax - (1 - clamp(t.sun / 10, 0, 1)) * 3;
  if (t.gh) tmax += 4;
  return tmax;
}

// Evalúa cada factor (1 = perfecto). Si plan = true, mira una casilla vacía para una especie (vista previa al plantar).
function evaluate(sp, t, p, w, plan) {
  const f = {}, dorm = p ? p.dorm : false, yd = G.day % DAYS_YEAR;
  // Luz
  const need = sp.sun[0] * clamp(G.openSun / 12.5, 0.72, 1);
  // las plantas altas (árboles, girasoles) reciben la luz en su copa, por encima de las sombras bajas
  const tall = p ? clamp((plantSize(p).h - 1.2) / 2, 0, 1) : 0;
  const hrs = lerp(t.sun, Math.max(t.sun, G.openSun * 0.92), tall) * (p && p.cloth ? 0.7 : 1), pm = sp.am ? t.sunPm * 0.5 : 0;
  f.light = 1; f.lightLow = 0; f.lightHigh = 0;
  if (!dorm) {
    if (hrs < need - 0.25) { f.light = clamp(0.3 + 0.7 * hrs / need, 0.25, 1); f.lightLow = 1; }
    else if (hrs + pm > sp.sun[1] + 0.5) { f.light = clamp(1 - (hrs + pm - sp.sun[1] - 0.5) * (w.tmax > 28 ? 0.14 : 0.09), 0.25, 1); f.lightHigh = 1; }
  }
  // Agua
  if (sp.water === 'aquatic') f.water = t.t === 'water' ? 1 : 0.05;
  else if (t.t === 'water') f.water = sp.water === 'bog' ? 1 : 0.05;
  else {
    const W = WATER[sp.water];
    const avg = plan || !t.mN ? t.moist : t.mSum / t.mN, lo = plan || !t.mN ? t.moist : t.mMin;
    // las raíces profundas de árboles y arbustos establecidos alcanzan agua que la superficie ya perdió
    const root = p && p.g >= 0.8 ? (isTree(sp) ? 0.25 : sp.type === 'shrub' || sp.type === 'vine' ? 0.14 : sp.life !== 'annual' ? 0.07 : 0) : 0;
    let dry = lo + root < W[0] ? clamp(1 - (W[0] - lo - root) / 0.28, 0.08, 1) : 1;
    let wet = avg > W[1] ? clamp(1 - (avg - W[1]) / 0.32, 0.08, 1) : 1;
    if (dorm) { dry = 1 - (1 - dry) * 0.3; wet = 1 - (1 - wet) * 0.6; }
    if (plan) { dry = 1; if (sp.water === 'bog' && !nearWater(t.x, t.y)) wet = 1; }
    f.water = Math.min(dry, wet); f.dry = dry < 0.97; f.wet = wet < 0.97;
  }
  // Suelo
  // un poco fuera del rango ideal todavía se tolera bien
  f.drain = sp.water === 'aquatic' || t.t === 'water' ? 1 : rangeScore(t.drain, [sp.drain[0] - 0.08, sp.drain[1] + 0.08], 0.4, 0.25);
  f.ph = sp.water === 'aquatic' ? 1 : rangeScore(t.ph, [sp.ph[0] - 0.3, sp.ph[1] + 0.3], 2.0, 0.12);
  const F = FEED[sp.feed];
  f.feed = t.fert < F[0] ? clamp(0.5 + 0.5 * t.fert / F[0], 0.5, 1) : 1;
  f.rich = sp.feed === 0 && t.fert > F[1] ? 1 : 0;
  if (sp.carniv && t.fert > 0.32) f.feed = clamp(1 - (t.fert - 0.32) * 2.5, 0.1, 1);
  // Temperatura y humedad del aire
  const tmax = dayMax(t, w);
  f.heat = !dorm && tmax > sp.maxT ? clamp(1 - (tmax - sp.maxT) * 0.09, 0.3, 1) : 1;
  f.coldRisk = nightMin(t, p, w) < sp.minT - (dorm ? 4 : 0) ? 1 : 0;
  f.cold = plan ? (sp.minT > 8 && !t.gh && !t.pot ? 0.7 : 1) : 1;
  const amb = ambientHum(t, w);
  f.hum = sp.hum && amb < sp.hum && !dorm ? clamp(1 - (sp.hum - amb) * 1.8, 0.3, 1) : 1;
  // Vecinos y bichos
  f.jug = 1;
  if (sp.juglone) for (const q of G.plants) if (spOf(q).walnut && !q.dead && Math.hypot(q.x - t.x, q.y - t.y) < 4) f.jug = 0.55;
  f.pest = p && p.pests ? 0.65 : 1;
  f.weed = t.weeds > 0.5 ? 0.88 : 1;
  // plantas compañeras a un paso de distancia
  f.comp = 1; f.compNames = [];
  const comp = COMPANIONS[sp.id];
  if (comp) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const n = (dx || dy) && tileAt(t.x + dx, t.y + dy), q = n && n.plant;
    if (q && !q.dead && comp[q.sp] && !f.compNames.includes(q.sp)) { f.comp += comp[q.sp]; f.compNames.push(q.sp); }
  }
  f.comp = Math.min(f.comp, 1.12);
  f.cond = Math.pow(f.light, 1) * Math.pow(f.water, 1.05) * Math.pow(f.drain, 0.65) * Math.pow(f.ph, 0.65) *
    Math.pow(f.feed, 0.4) * Math.pow(f.heat, 0.75) * Math.pow(f.hum, 0.75) * f.jug * f.pest * f.weed * f.cold;
  f.cond = Math.min(1, f.cond * f.comp);
  return f;
}

// ¿Puede ir esta especie en esta casilla?
function canPlantHere(sp, t) {
  if (!t || !t.own || t.plant || t.obj) return false;
  if (t.pot) return sp.water !== 'aquatic' && !isTree(sp) && (sp.art.h || 0) <= 1.4;
  if (sp.water === 'aquatic') return t.t === 'water';
  if (t.t === 'water') return sp.water === 'bog';
  return t.t === 'bed';
}

// ---------- Simulación por hora: humedad del suelo ----------
function resetMoistStats(t) { t.mSum = 0; t.mN = 0; t.mMin = t.moist; t.mMax = t.moist; }

function hourTick(h) {
  const w = G.w, T = tempAt(w, h), k = Math.floor(h * 2) % 48;
  const raining = w.rain > 0 && h >= 4 && h < 4 + Math.min(18, w.rain * 0.6), spring = G.map && G.map.spring;
  for (const t of G.tiles) {
    if (t.t === 'house') continue;
    if (t.t === 'water') { t.moist = 1; continue; }
    const sunF = (h > 5 && h < 21 ? t.prof[k] : 0) * (1 - w.cloud * 0.7);
    let et = 0.0135 * (0.25 + Math.max(0, T - 5) / 20) * (0.35 + 0.65 * sunF) * (t.mulch ? 0.6 : 1) * (0.8 + 0.4 * t.drain);
    if (t.gh) et *= 0.75;
    if (t.plant && !t.plant.dead && !t.plant.dorm) et += 0.004 * clamp(plantSize(t.plant).w, 0.1, 1.5) * (sunF > 0 ? 1 : 0.2);
    t.moist -= et;
    if (raining && !t.gh) t.moist += 0.06;
    const fc = 0.5 + 0.35 * (1 - t.drain) + 0.12 * t.org;
    if (t.moist > fc) t.moist -= (t.moist - fc) * (0.12 + 0.55 * t.drain);
    if (spring && t.parcel === spring.p) t.moist = Math.max(t.moist, 0.62 - Math.hypot(t.x - spring.x, t.y - spring.y) * 0.05); // vertiente
    if (nearWater(t.x, t.y)) t.moist = Math.max(t.moist, 0.78);
    t.moist = clamp(t.moist, 0, 1);
    t.mSum += t.moist; t.mN++;
    if (t.moist < t.mMin) t.mMin = t.moist;
    if (t.moist > t.mMax) t.mMax = t.moist;
  }
  // macetas: se secan más lento que el jardín y drenan por abajo
  for (const t of G.pots) {
    if (!t.own) continue;
    const sunF = h > 5 && h < 21 ? t.prof[k] : 0;
    t.moist -= 0.006 * (0.6 + 0.6 * sunF) * (0.8 + 0.4 * t.drain) + (t.plant && !t.plant.dead && !t.plant.dorm ? 0.003 * clamp(plantSize(t.plant).w, 0.1, 1.2) : 0);
    const fc = 0.5 + 0.35 * (1 - t.drain) + 0.12 * t.org;
    if (t.moist > fc) t.moist -= (t.moist - fc) * (0.2 + 0.5 * t.drain);
    t.moist = clamp(t.moist, 0, 1);
    t.mSum += t.moist; t.mN++;
    if (t.moist < t.mMin) t.mMin = t.moist;
    if (t.moist > t.mMax) t.mMax = t.moist;
  }
  if (h === 6) frostCheck();
  if (h === 7) runSprinklers();
  if (h === 6 || h === 15) runDrip();
}

function waterTile(t, amount = 0.4) {
  if (!t || t.t === 'water' || t.t === 'house') return false;
  t.moist = clamp(t.moist + amount, 0, 1);
  if (t.moist > t.mMax) t.mMax = t.moist;
  t.wet = 1;
  return true;
}

// El agua de la llave se paga (en Chile es cara): el riego automático suma a la cuenta del día
const WATER_PRICE = 0.25;
function payWater(tiles) {
  const cost = tiles * WATER_PRICE;
  G.money -= cost; G.today.water = (G.today.water || 0) + cost;
}

function runSprinklers() {
  if (G.w.rain > 0) return;
  for (const s of G.structs) {
    if (s.k !== 'sprinkler') continue;
    let n = 0;
    for (let y = s.y - 2; y <= s.y + 2; y++) for (let x = s.x - 2; x <= s.x + 2; x++) {
      const t = tileAt(x, y);
      if (t && t.own && Math.hypot(x - s.x, y - s.y) <= 2.3 && waterTile(t, 0.32)) n++;
    }
    payWater(n);
    if (typeof fxSprinkle === 'function') fxSprinkle(s);
  }
}

// Riego por goteo con temporizador: a las 6:00 y a las 15:00 repone el agua justo hasta lo que pide cada planta
const waterTarget = sp => (WATER[sp.water][0] + Math.min(1, WATER[sp.water][1])) / 2;
function runDrip() {
  let n = 0;
  for (const t of G.tiles) {
    const p = t.plant;
    if (!t.drip || !t.own || !p || p.dead || p.dorm) continue;
    const target = waterTarget(spOf(p));
    if (t.moist < target - 0.04) { waterTile(t, target - t.moist); t.wet = 0; n++; }
  }
  if (n) payWater(n);
}

// Regar de una vez todas las plantas que tienen sed (cuesta el agua y el trabajo)
const THIRSTY_PRICE = 0.5;
function thirstyPlants() {
  return G.plants.filter(p => {
    const t = tileAt(p.x, p.y), sp = spOf(p);
    return !p.dead && t.own && sp.water !== 'aquatic' && t.t !== 'water' && t.moist < WATER[sp.water][0] + 0.08;
  });
}

// La helada llega al amanecer: daña a las plantas que no la resisten
function frostCheck() {
  const w = G.w, hit = [];
  for (const p of G.plants) {
    if (p.dead) continue;
    const sp = spOf(p), t = tileAt(p.x, p.y);
    const tol = sp.minT - (p.dorm ? (sp.life === 'bulb' ? 12 : 4) : 0);
    const tmin = nightMin(t, p, w);
    if (tmin < tol) {
      const dmg = (tol - tmin) * 14;
      p.hp -= dmg; p.frostHit = 3;
      hit.push(p);
      if (p.hp <= 0) killPlant(p, 'frost');
    }
  }
  if (hit.length) news('frost', { n: hit.length, sp: hit[0].sp, t: Math.round(w.tmin) });
}

// ---------- Simulación por día ----------
function dayTick() {
  const w = G.w, yd = G.day % DAYS_YEAR, year = Math.floor(G.day / DAYS_YEAR);
  const tmean = (w.tmax + w.tmin) / 2, chill = chillHours(w);
  const hives = G.structs.filter(s => s.k === 'beehive');
  for (const p of [...G.plants]) {
    const sp = spOf(p), t = tileAt(p.x, p.y);
    p.age++;
    if (p.frostHit) p.frostHit--;
    if (p.cut) p.cut--;
    if (p.imm) p.imm--;
    if (p.dead) continue;
    if (yd === 20) p.chill = 0;
    if (yd >= 26 || yd < 2) p.chill += chill;
    const f = evaluate(sp, t, p, w, false);
    p.fac = f; p.cond = f.cond; p.rich = f.rich;
    // salud: tiende hacia lo que permiten sus condiciones
    const tgt = t.own ? 100 * clamp((f.cond - 0.28) / 0.55, 0, 1) : Math.max(85, 100 * clamp((f.cond - 0.28) / 0.55, 0, 1));
    if (p.hp < tgt) p.hp = Math.min(tgt, p.hp + (p.dorm ? 4 : 9));
    else p.hp -= Math.max(3, (p.hp - tgt) * 0.35);
    // ciclo de vida de las anuales: después de florecer (o de dar su cosecha) se secan
    if (sp.life === 'annual' && p.g >= 1) {
      const past = (sp.bloom ? p.bloomedYear >= 0 && !inWindow(yd, sp.bloom) : true) && (!sp.fruit || !inWindow(yd, sp.fruit));
      if ((past && p.age > sp.grow + 4) || p.age > sp.grow + (sp.bloom ? 34 : 9)) {
        p.hp -= 14;
        if (!p.done) { p.done = 1; news('cycle', { sp: p.sp }); }
      }
    }
    p.hp = clamp(p.hp, 0, 100);
    if (p.hp <= 0) { killPlant(p, p.done ? 'cycle' : 'stress'); continue; }
    p.wilt = f.dry ? 1 - f.water : 0;
    p.yellow = Math.max(f.wet ? 1 - f.water : 0, 1 - f.ph, 1 - f.feed) * 0.9;
    p.burn = f.lightHigh ? 1 - f.light : f.heat < 1 ? 1 - f.heat : 0;
    // reposo invernal (o estival en los bulbos de primavera)
    const wasDorm = p.dorm;
    p.dorm = isDormant(sp, yd);
    if (p.dorm !== wasDorm && typeof dropSprite === 'function') { dropSprite(p); G.lightDirty = true; }
    // crecer
    if (!p.dorm && p.g < 1) {
      const gT = clamp((tmean - sp.baseT) / 7, 0, 1);
      const before = p.g;
      p.g = Math.min(1, p.g + (1 / sp.grow) * gT * (0.35 + 0.65 * p.hp / 100) * (0.7 + 0.3 * f.feed) * f.comp);
      if (isTree(sp) || (sp.art.h || 0) > 1.3) if (Math.floor(before * 10) !== Math.floor(p.g * 10)) G.lightDirty = true;
    }
    // florecer
    const chillOK = !sp.chill || p.chill >= sp.chill;
    const canBloom = sp.bloom && p.g >= 0.92 && inWindow(yd, sp.bloom) && !p.dorm && p.hp > 30 && chillOK && !p.done &&
      p.cutYear !== year && !p.cut;
    const target = canBloom ? clamp(p.hp / 100 * (p.rich ? 0.35 : 1) * (0.4 + 0.6 * f.light) * (needsPrune(p) ? 0.65 : 1), 0, 1) : 0;
    p.bloom = clamp(p.bloom + clamp(target - p.bloom, -0.4, 0.45), 0, 1);
    if (p.bloom > 0.5 && p.hp > 50 && t.own) registerHerb(p);
    if (p.bloom > 0.5) p.bloomedYear = year;
    // frutos
    if (sp.fruit) {
      if (p.g >= 0.95 && inWindow(yd, sp.fruit) && p.hp > 30 && !p.dorm && chillOK) {
        const bees = hives.some(s => Math.hypot(s.x - p.x, s.y - p.y) < 6) ? 1.25 : 1;
        p.fruit = Math.min(1, p.fruit + (0.2 + 0.4 * p.hp / 100) * bees);
      } else if (!inWindow(yd, sp.fruit)) p.fruit = Math.max(0, p.fruit - 0.4);
    }
    // plagas
    if (t.own) pestTick(p, sp, t, w, yd);
    // se expande sola (menta, frutilla, siempreviva)
    if (sp.spread && t.own && p.g >= 1 && !p.dorm && Math.random() < sp.spread * p.hp / 100) spreadPlant(p);
    if (sp.reseed && p.done && Math.random() < 0.3) t.seedBank = sp.id;
    if (p.dorm !== wasDorm && p.dorm && !isTree(sp)) p.bloom = 0;
  }
  // suelo
  const s = seasonOf(yd);
  for (const t of G.tiles) {
    if (!t.own || t.t === 'house' || t.t === 'water') continue;
    t.ph += (t.ph0 - t.ph) * 0.012;
    t.fert += 0.004 * t.org - 0.005 * t.drain * (w.rain > 0 ? 2 : 1);
    if (t.plant && !t.plant.dead && !t.plant.dorm) t.fert -= (spOf(t.plant).feed + 0.5) * 0.008 * clamp(plantSize(t.plant).w, 0.2, 1.2);
    // el poroto fija nitrógeno del aire y abona su casilla y las vecinas
    if (t.plant && spOf(t.plant).nfix && !t.plant.dead && t.plant.g > 0.4) {
      t.fert += 0.012;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = tileAt(t.x + dx, t.y + dy); if (n && n.own) n.fert = clamp(n.fert + 0.006, 0, 1); }
    }
    t.org = Math.max(0.03, t.org - 0.0012 + (t.mulch ? 0.002 : 0));
    t.fert = clamp(t.fert, 0, 1);
    if (t.mulch) t.mulch--;
    if (t.t === 'bed' && !t.gh && !t.mulch && s !== 3) {
      const big = t.plant && plantSize(t.plant).w > 0.7;
      t.weeds = clamp(t.weeds + (0.028 + (t.moist > 0.5 ? 0.022 : 0)) * (big ? 0.4 : 1) * (Math.random() * 0.8 + 0.6), 0, 1);
      if (t.weeds > 0.5) t.fert = Math.max(0, t.fert - 0.004);
    }
    if (t.seedBank && !t.plant && t.t === 'bed' && yd >= 0 && yd <= 3 && Math.random() < 0.5) {
      addPlant(t.seedBank, t.x, t.y, { g: 0.05, hp: 80 }); t.seedBank = null;
    }
    t.wet = 0;
    resetMoistStats(t);
  }
  for (const t of G.pots) {
    if (!t.own) continue;
    t.ph += (t.ph0 - t.ph) * 0.012;
    if (t.plant && !t.plant.dead && !t.plant.dorm) t.fert -= (spOf(t.plant).feed + 0.5) * 0.008;
    t.fert = clamp(t.fert + 0.002 * t.org, 0, 1);
    resetMoistStats(t);
  }
}

function pestTick(p, sp, t, w, yd) {
  if (p.pests) {
    // los insectos útiles de las flores vecinas ayudan a limpiar
    if (insectaries(p.x, p.y) > 0 && Math.random() < 0.18) p.pests = 0;
    else for (const q of G.plants) {
      if (q !== p && q.sp === p.sp && !q.pests && !q.imm && !q.dead && Math.abs(q.x - p.x) <= 1 && Math.abs(q.y - p.y) <= 1 && Math.random() < 0.2) q.pests = 1;
    }
    return;
  }
  if (!sp.pests || p.imm || p.dorm || p.g < 0.4) return;
  const s = seasonOf(yd);
  let chance = 0.03 * (1.4 - p.hp / 100) * (s === 0 || s === 1 ? 1.3 : 0.6) * (p.fac && p.fac.comp > 1 ? 0.7 : 1);
  if (sp.pests === 'slug') chance *= t.moist > 0.6 || w.rain ? 2.2 : 0.5;
  if (sp.pests === 'mildew') chance *= (ambientHum(t, w) > 0.6 ? 1.6 : 0.6) * (t.sun < 5 ? 1.8 : 0.8);
  chance *= Math.max(0.25, 1 - 0.3 * insectaries(p.x, p.y));
  if (Math.random() < chance) { p.pests = 1; news('pest', { sp: p.sp, k: sp.pests }); }
}

// Flores que atraen insectos útiles (mariquitas, abejas) cerca de una casilla
function insectaries(x, y) {
  let n = 0;
  for (const q of G.plants) if (spOf(q).insect && q.bloom > 0.3 && Math.hypot(q.x - x, q.y - y) < 2.6) n++;
  return n;
}

function spreadPlant(p) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]], [dx, dy] = pick(dirs), t = tileAt(p.x + dx, p.y + dy);
  if (t && t.own && t.t === 'bed' && !t.plant && !t.obj) addPlant(p.sp, t.x, t.y, { g: 0.3, hp: p.hp });
}

function killPlant(p, why) {
  p.dead = true; p.hp = 0; p.bloom = 0; p.fruit = 0;
  if (typeof dropSprite === 'function') dropSprite(p);
  if (why !== 'cycle' && why !== 'frost') news('died', { sp: p.sp });
  G.lightDirty = true;
}

// ---------- Poda y multiplicación ----------
// Una planta que debía podarse y no se podó el invierno pasado florece menos (ramas viejas)
const needsPrune = p => !!spOf(p).prune && p.age > 52 && G.day - (p.prunedDay === undefined ? -999 : p.prunedDay) > 44;
const canPrune = p => !!spOf(p).prune && !p.dead && inWindow(G.day % DAYS_YEAR, spOf(p).prune) && G.day - (p.prunedDay === undefined ? -999 : p.prunedDay) > 20;
// Cuántas semillas, esquejes o divisiones se pueden sacar ahora (0 = no se puede)
function propCount(p) {
  const sp = spOf(p), how = propMethod(sp), year = Math.floor(G.day / DAYS_YEAR);
  if (!how || p.dead || p.propYear === year || !tileAt(p.x, p.y).own) return 0;
  if (how === 'seed') return (p.bloomedYear === year && p.bloom < 0.4) || p.done ? 3 : 0;
  if (how === 'cutting') return p.g >= 1 && !p.dorm && p.hp > 60 ? 2 : 0;
  return p.g >= 1 && p.age >= 26 && p.hp > 50 ? 2 : 0;
}

// ---------- Herbario ----------
function registerHerb(p) {
  if (G.herb[p.sp] === 2) return;
  G.herb[p.sp] = 2;
  G.stats.bloomed++;
  news('herb', { sp: p.sp });
}

// ---------- Belleza del jardín, visitas y reputación ----------
function plantBeauty(p, yd) {
  const sp = spOf(p);
  if (p.dead) return -2;
  const sz = 0.15 + 0.85 * clamp(p.g, 0, 1);
  let interest = sp.fol + p.bloom * 1.25;
  if (sp.fall && seasonOf(yd) === 2 && !p.dorm) interest += 0.5;
  if (p.fruit >= 1) interest += 0.2;
  if (p.dorm) interest *= sp.life === 'deciduous' ? 0.3 : 0.12;
  let b = sp.beauty * sz * interest * Math.pow(p.hp / 100, 1.4);
  if (sp.art.f === 'vine' && G.structs.some(s => (s.k === 'pergola' || s.k === 'arch') && p.x >= s.x - 1 && p.x <= s.x + s.w && p.y >= s.y - 1 && p.y <= s.y + s.h)) b *= 1.35;
  if (p.pests) b *= 0.7;
  return b;
}

function updateBeauty() {
  const yd = G.day % DAYS_YEAR;
  let b = 0;
  const kinds = new Set();
  for (const p of G.plants) {
    const t = tileAt(p.x, p.y);
    if (!t.own || t.pot) continue;
    const pb = plantBeauty(p, yd);
    p.beauty = pb; b += pb;
    if (!p.dead && p.hp > 50 && p.g > 0.5) kinds.add(p.sp);
  }
  for (const s of G.structs) b += BUILD[s.k].beauty || 0;
  let water = 0, weeds = 0;
  for (const t of G.tiles) {
    if (!t.own) continue;
    if (t.t === 'water') water++;
    if (t.weeds > 0.5) weeds++;
    if (t.t === 'path') b += 0.15;
  }
  b += Math.min(water, 20) * 2.5 - weeds * 0.3;
  G.kinds = kinds.size;
  G.beauty = Math.max(0, b * (1 + Math.min(1.2, kinds.size * 0.025)));
  G.fair = 1.5 + Math.sqrt(G.beauty) * 0.33;
}

const repTarget = () => clamp(Math.log2(G.beauty / 40 + 1), 0, 5);
// Visitantes esperados para hoy
function expectedVisitors() {
  if (!G.open) return 0;
  const w = G.w, weather = w.storm ? 0.15 : w.rain ? 0.35 : w.heat ? 0.7 : 1;
  const x = G.price / Math.max(1, G.fair);
  return (3 + G.rep * 6) * Math.sqrt(Math.max(G.beauty, 1) / 60) * weather * Math.exp(-(x - 0.6) * 1.2);
}

function updateRep() {
  const sat = G.today.satN ? G.today.sat / G.today.satN : 0.6;
  const target = repTarget() * (0.65 + 0.35 * sat) * (G.open ? 1 : 0.85);
  // la fama sube rápido con un jardín lindo y baja despacio (un invierno sin flores no la borra)
  G.rep += (target - G.rep) * (target > G.rep ? 0.12 : 0.025);
  G.rep = clamp(G.rep, 0, 5);
  if (G.rep > G.repMax) {
    const before = Math.floor(G.repMax);
    G.repMax = G.rep;
    if (Math.floor(G.repMax) > before) news('star', { n: Math.floor(G.repMax) });
  }
}
const unlockedTier = () => Math.floor(G.repMax + 1e-6);

// ---------- Guardar ----------
const SAVE_KEY = 'jardinvivo.save';
const POT_KEYS = ['own', 'drain', 'ph', 'ph0', 'org', 'fert', 'moist', 'tray'];
const TILE_KEYS = ['t', 'own', 'drain', 'ph', 'ph0', 'org', 'fert', 'moist', 'mulch', 'weeds', 'obj', 'over', 'gh', 'shade', 'seedBank', 'drip'];
const PLANT_KEYS = ['id', 'sp', 'x', 'y', 'g', 'hp', 'age', 'bloom', 'fruit', 'dorm', 'dead', 'chill', 'pests', 'imm', 'cloth', 'cut', 'prunedDay', 'propYear',
  'cutYear', 'seed', 'done', 'bloomedYear', 'old', 'pal'];

function serialize() {
  const r3 = v => (typeof v === 'number' ? Math.round(v * 1000) / 1000 : v);
  return JSON.stringify({
    v: 1, seed: G.seed, climate: G.climate, map: G.map, parcels: PARCELS, day: G.day, hour: G.hour, money: G.money, rep: G.rep, repMax: G.repMax, open: G.open, price: G.price,
    nextId: G.nextId, owned: G.owned, w: G.w, wNext: G.wNext, stats: G.stats, today: G.today, herb: G.herb, goal: G.goal, goalsDone: G.goalsDone,
    orders: G.orders, orderDay: G.orderDay, speed: G.speed, hose: G.hose || 0, inv: G.inv,
    tiles: G.tiles.map(t => TILE_KEYS.map(k => r3(t[k]))),
    plants: G.plants.map(p => PLANT_KEYS.map(k => r3(p[k]))),
    pots: G.pots.map(t => POT_KEYS.map(k => r3(t[k]))),
    structs: G.structs
  });
}

function deserialize(json) {
  const d = JSON.parse(json);
  if (!d || d.v !== 1) return false;
  // las partidas guardadas antes de que cada jardín fuera distinto no traen sus parcelas: son el jardín clásico
  newGarden(d.seed, d.climate || 'santiago', !d.parcels);
  if (d.parcels) {
    PARCELS.splice(0, PARCELS.length, ...d.parcels.map(p => ({ ...p })));
    for (const t of G.tiles) t.parcel = parcelOf(t.x, t.y);
  }
  if (d.map) G.map = d.map;
  Object.assign(G, {
    day: d.day, hour: d.hour, money: d.money, rep: d.rep, repMax: d.repMax, open: d.open, price: d.price, nextId: d.nextId,
    owned: d.owned, w: d.w, wNext: d.wNext, stats: d.stats, today: d.today, herb: d.herb, goal: d.goal, orders: d.orders || [],
    orderDay: d.orderDay || 0, speed: d.speed || 1, structs: d.structs, plants: [], hose: d.hose || 0, inv: d.inv || {},
    // las partidas antiguas guardaban solo cuántos objetivos iban en orden
    goalsDone: d.goalsDone || Object.fromEntries(OLD_GOAL_ORDER.slice(0, d.goal || 0).map(id => [id, 1]))
  });
  d.tiles.forEach((row, i) => { const t = G.tiles[i]; TILE_KEYS.forEach((k, j) => { t[k] = row[j]; }); t.plant = null; });
  if (d.pots) d.pots.forEach((row, i) => { const t = G.pots[i]; if (t) POT_KEYS.forEach((k, j) => { t[k] = row[j]; }); });
  for (const row of d.plants) {
    const p = { fac: null, cond: 1, wilt: 0, burn: 0, yellow: 0, frostHit: 0, rich: 0 };
    PLANT_KEYS.forEach((k, j) => { p[k] = row[j]; });
    if (!SP[p.sp] || !tileAt(p.x, p.y)) continue;
    G.plants.push(p);
    tileAt(p.x, p.y).plant = p;
  }
  computeLight();
  for (const p of G.plants) if (!p.dead) { const f = evaluate(spOf(p), tileAt(p.x, p.y), p, G.w, false); p.fac = f; p.cond = f.cond; }
  updateBeauty();
  return true;
}

function saveGame() {
  try { localStorage.setItem(SAVE_KEY, serialize()); return true; } catch (e) { return false; }
}
function loadGame() {
  try { const s = localStorage.getItem(SAVE_KEY); return s ? deserialize(s) : false; } catch (e) { return false; }
}
const hasSave = () => { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } };
