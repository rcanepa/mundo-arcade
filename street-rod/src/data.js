// ===== Datos: autos, motores, piezas, pinturas y rivales del verano de 1963 =====
// Las piezas de motor y caja solo calzan en autos de su misma familia (GM, Ford o Chrysler), como en el original.
const FAMS = ['gm', 'ford', 'mopar'];
const FAM_NAME = { gm: 'GM', ford: 'Ford', mopar: 'Chrysler' };

// Motores. hp = potencia con su carburación de referencia (V8: un carburador de 4 bocas;
// seis en línea y flathead: uno de 2 bocas). rpm = donde da su máxima potencia; red = zona roja.
// kind: '6' seis en línea, 'F' V8 flathead (válvulas laterales), '8' V8 de válvulas a la cabeza. lb = peso del motor.
const ENGINES = {
  gm216:   { fam: 'gm', kind: '6', name: 'Chevrolet 216', ci: 216, hp: 95, rpm: 3600, red: 4300, lb: 520, price: 90 },
  gm235:   { fam: 'gm', kind: '6', name: 'Chevrolet 235 Blue Flame', ci: 235, hp: 130, rpm: 4200, red: 4800, lb: 530, price: 150 },
  olds303: { fam: 'gm', kind: '8', name: 'Oldsmobile 303 Rocket', ci: 303, hp: 160, rpm: 3800, red: 4600, lb: 640, price: 170 },
  gm265:   { fam: 'gm', kind: '8', name: 'Chevrolet 265 V8', ci: 265, hp: 185, rpm: 4600, red: 5400, lb: 560, price: 230 },
  gm283:   { fam: 'gm', kind: '8', name: 'Chevrolet 283 V8', ci: 283, hp: 220, rpm: 4800, red: 5700, lb: 570, price: 330 },
  gm348:   { fam: 'gm', kind: '8', name: 'Chevrolet 348 V8', ci: 348, hp: 270, rpm: 5000, red: 5800, lb: 660, price: 460 },
  gm327:   { fam: 'gm', kind: '8', name: 'Chevrolet 327 V8', ci: 327, hp: 300, rpm: 5600, red: 6400, lb: 575, price: 560 },
  gm409:   { fam: 'gm', kind: '8', name: 'Chevrolet 409 V8', ci: 409, hp: 370, rpm: 5600, red: 6300, lb: 680, price: 820 },
  fd144:   { fam: 'ford', kind: '6', name: 'Ford 144 Six', ci: 144, hp: 90, rpm: 4200, red: 4900, lb: 400, price: 70 },
  fd223:   { fam: 'ford', kind: '6', name: 'Ford 223 Six', ci: 223, hp: 137, rpm: 4200, red: 4800, lb: 510, price: 140 },
  flat221: { fam: 'ford', kind: 'F', name: 'Ford Flathead 221', ci: 221, hp: 90, rpm: 3600, red: 4300, lb: 560, price: 90 },
  flat255: { fam: 'ford', kind: 'F', name: 'Mercury Flathead 255', ci: 255, hp: 112, rpm: 3600, red: 4400, lb: 570, price: 130 },
  flat296: { fam: 'ford', kind: 'F', name: 'Mercury 296 Stroker', ci: 296, hp: 150, rpm: 4200, red: 5000, lb: 575, price: 290 },
  fd292:   { fam: 'ford', kind: '8', name: 'Ford 292 Y-Block', ci: 292, hp: 200, rpm: 4600, red: 5400, lb: 620, price: 250 },
  fd312:   { fam: 'ford', kind: '8', name: 'Ford 312 Y-Block', ci: 312, hp: 245, rpm: 4800, red: 5600, lb: 625, price: 370 },
  fd390:   { fam: 'ford', kind: '8', name: 'Ford 390 FE', ci: 390, hp: 300, rpm: 4800, red: 5700, lb: 650, price: 490 },
  fd406:   { fam: 'ford', kind: '8', name: 'Ford 406 FE', ci: 406, hp: 385, rpm: 5800, red: 6300, lb: 660, price: 790 },
  fd427:   { fam: 'ford', kind: '8', name: 'Ford 427 FE', ci: 427, hp: 410, rpm: 6000, red: 6600, lb: 670, price: 990 },
  mp170:   { fam: 'mopar', kind: '6', name: 'Plymouth 170 Slant Six', ci: 170, hp: 101, rpm: 4400, red: 5000, lb: 450, price: 80 },
  mp225:   { fam: 'mopar', kind: '6', name: 'Plymouth 225 Slant Six', ci: 225, hp: 145, rpm: 4000, red: 4800, lb: 470, price: 150 },
  mp318:   { fam: 'mopar', kind: '8', name: 'Chrysler 318 V8', ci: 318, hp: 230, rpm: 4400, red: 5400, lb: 600, price: 300 },
  mp361:   { fam: 'mopar', kind: '8', name: 'Chrysler 361 V8', ci: 361, hp: 265, rpm: 4400, red: 5400, lb: 640, price: 390 },
  mp383:   { fam: 'mopar', kind: '8', name: 'Chrysler 383 V8', ci: 383, hp: 330, rpm: 4800, red: 5700, lb: 650, price: 540 },
  mp413:   { fam: 'mopar', kind: '8', name: 'Dodge 413 Max Wedge', ci: 413, hp: 390, rpm: 5400, red: 6000, lb: 680, price: 850 },
  mp426:   { fam: 'mopar', kind: '8', name: 'Dodge 426 Max Wedge', ci: 426, hp: 415, rpm: 5600, red: 6200, lb: 690, price: 1000 }
};
const engineMount = key => ENGINES[key].fam + ENGINES[key].kind;   // p. ej. 'gm8', 'fordF', 'mopar6'
const MOUNTS = [];
for (const k in ENGINES) if (!MOUNTS.includes(engineMount(k))) MOUNTS.push(engineMount(k));

// Múltiples de admisión: cuántos carburadores llevan y de qué tipo; k = cuánto suben la potencia según el motor
const INTAKES = {
  '1x2': { carb: '2', n: 1, k: { 6: 1, F: 1, 8: 0.86 }, price: 25 },
  '2x2': { carb: '2', n: 2, k: { F: 1.1 }, price: 50 },
  '3x2': { carb: '2', n: 3, k: { 6: 1.14, F: 1.18, 8: 1.07 }, price: 75 },
  '1x4': { carb: '4', n: 1, k: { 8: 1 }, price: 45 },
  '2x4': { carb: '4', n: 2, k: { 8: 1.12 }, price: 100 },
  race:  { carb: '4', n: 2, k: { 8: 1.2 }, price: 180 }
};
const intakeFits = (ik, mount) => mount.slice(-1) in INTAKES[ik].k;
// Carburadores: los de carrera usan las mismas fijaciones que los de 4 bocas
const CARBS = {
  '2':  { slot: '2', price: 22 },
  '4':  { slot: '4', price: 45 },
  '4R': { slot: '4', price: 90, k: 1.04 }
};
const CAMS = {
  stock: { k: 1, rpm: 0, low: 1, price: 0 },
  r34:   { k: 1.05, rpm: 300, low: 0.97, price: 50 },
  full:  { k: 1.11, rpm: 700, low: 0.84, price: 105 }
};
const EXHAUSTS = { iron: { k: 1, price: 10 }, hdr: { k: 1.06, price: 70 } };
const TRANS = {
  auto2:  { auto: true, ratios: [1.82, 1], price: 95 },
  auto3:  { auto: true, ratios: [2.45, 1.45, 1], price: 160 },
  man3:   { ratios: [2.58, 1.48, 1], price: 65 },
  man4:   { ratios: [2.54, 1.92, 1.51, 1], price: 190 },
  man4cr: { ratios: [2.2, 1.64, 1.28, 1], price: 270 }
};
const TRANS_NAME = {
  gm:    { auto2: 'Powerglide', auto3: 'Hydra-Matic', man3: 'Saginaw', man4: 'Borg-Warner T-10', man4cr: 'Muncie' },
  ford:  { auto2: 'Ford-O-Matic', auto3: 'Cruise-O-Matic', man3: 'Ford', man4: 'Borg-Warner T-10', man4cr: 'Toploader' },
  mopar: { auto2: 'PowerFlite', auto3: 'TorqueFlite', man3: 'Chrysler', man4: 'Borg-Warner T-10', man4cr: 'Hurst Racing' }
};
const AXLES = { '3.08': 30, '3.36': 30, '3.55': 40, '3.90': 55, '4.11': 75, '4.56': 95 };
// grip = agarre al acelerar; lat = agarre en las curvas
const TIRES = {
  std:   { grip: 0.82, lat: 0.82, price: 45 },
  ww:    { grip: 0.82, lat: 0.82, price: 65, ww: true },
  wide:  { grip: 0.93, lat: 0.92, price: 115 },
  slick: { grip: 1.12, lat: 0.86, price: 175 }
};
const PART_TYPES = ['engine', 'intake', 'carb', 'cam', 'exhaust', 'trans', 'axle', 'tires'];

// Autos. lb = peso con su motor original; cda = resistencia al aire (m²); price = valor en buen estado.
// stock = cómo viene de fábrica. tail/nose: formas para dibujarlo de atrás y de frente.
const MODELS = {
  chevy49:    { fam: 'gm', year: 1949, name: 'Chevrolet Styleline', lb: 3100, cda: 0.98, price: 380,
    stock: { engine: 'gm216', intake: '1x2', carb: '2', trans: 'man3', axle: '4.11', tires: 'std' },
    colors: ['#3d5a45', '#6b6f75', '#2a3a5c', '#6a1f2b', '#1b1c1e'] },
  falcon60:   { fam: 'ford', year: 1960, name: 'Ford Falcon', lb: 2400, cda: 0.84, price: 620,
    stock: { engine: 'fd144', intake: '1x2', carb: '2', trans: 'man3', axle: '3.36', tires: 'std' },
    colors: ['#ece8dc', '#8ab8de', '#b3202a', '#f0c93a', '#8fd1b3'] },
  valiant61:  { fam: 'mopar', year: 1961, name: 'Plymouth Valiant', lb: 2650, cda: 0.86, price: 680,
    stock: { engine: 'mp170', intake: '1x2', carb: '2', trans: 'man3', axle: '3.36', tires: 'std' },
    colors: ['#ece8dc', '#3fb7a8', '#b88a3e', '#1d2a4d', '#ff7a5c'] },
  ford40:     { fam: 'ford', year: 1940, name: 'Ford Deluxe Coupé', lb: 2800, cda: 0.95, price: 520,
    stock: { engine: 'flat221', intake: '1x2', carb: '2', trans: 'man3', axle: '3.90', tires: 'std' },
    colors: ['#1b1c1e', '#2f4f3a', '#6a1f2b', '#b9bec4', '#1d2a4d'] },
  ford32:     { fam: 'ford', year: 1932, name: 'Ford Roadster', lb: 2300, cda: 1.0, price: 600,
    stock: { engine: 'flat221', intake: '1x2', carb: '2', trans: 'man3', axle: '3.90', tires: 'std' },
    colors: ['#1b1c1e', '#b3202a', '#f0c93a', '#2f6db3', '#e8692a'] },
  merc49:     { fam: 'ford', year: 1949, name: 'Mercury Coupé', lb: 3400, cda: 0.92, price: 680,
    stock: { engine: 'flat255', intake: '1x2', carb: '2', trans: 'man3', axle: '3.90', tires: 'ww' },
    colors: ['#1b1c1e', '#5b2a86', '#6a1f2b', '#1d2a4d', '#8fd1b3'] },
  olds50:     { fam: 'gm', year: 1950, name: 'Oldsmobile Rocket 88', lb: 3500, cda: 0.95, price: 640,
    stock: { engine: 'olds303', intake: '1x2', carb: '2', trans: 'auto3', axle: '3.55', tires: 'ww' },
    colors: ['#2f4f3a', '#6b6f75', '#ece8dc', '#6a1f2b', '#2a3a5c'] },
  chevy55:    { fam: 'gm', year: 1955, name: 'Chevrolet Bel Air', lb: 3200, cda: 0.9, price: 950,
    stock: { engine: 'gm265', intake: '1x2', carb: '2', trans: 'auto2', axle: '3.55', tires: 'ww' },
    colors: ['#f2a7b8', '#3fb7a8', '#f0c93a', '#b3202a', '#ece8dc'] },
  chevy57:    { fam: 'gm', year: 1957, name: 'Chevrolet Bel Air', lb: 3350, cda: 0.88, price: 1250,
    stock: { engine: 'gm283', intake: '1x4', carb: '4', trans: 'auto2', axle: '3.36', tires: 'ww' },
    colors: ['#b3202a', '#3fb7a8', '#1b1c1e', '#ece8dc', '#f0c93a'] },
  tbird57:    { fam: 'ford', year: 1957, name: 'Ford Thunderbird', lb: 3150, cda: 0.8, price: 1750,
    stock: { engine: 'fd312', intake: '1x4', carb: '4', trans: 'man3', axle: '3.55', tires: 'ww' },
    colors: ['#8fd1b3', '#ece8dc', '#b3202a', '#1b1c1e', '#f2a7b8'] },
  fury58:     { fam: 'mopar', year: 1958, name: 'Plymouth Fury', lb: 3600, cda: 0.88, price: 1450,
    stock: { engine: 'mp318', intake: '2x4', carb: '4', trans: 'auto3', axle: '3.36', tires: 'ww' },
    colors: ['#ece8dc', '#b3202a', '#b88a3e', '#1b1c1e', '#2f6db3'] },
  corvette58: { fam: 'gm', year: 1958, name: 'Chevrolet Corvette', lb: 2900, cda: 0.76, price: 2500,
    stock: { engine: 'gm283', intake: '2x4', carb: '4', trans: 'man4', axle: '3.90', tires: 'std' },
    colors: ['#b3202a', '#ece8dc', '#1b1c1e', '#2f6db3', '#b9bec4'] },
  impala61:   { fam: 'gm', year: 1961, name: 'Chevrolet Impala SS', lb: 3650, cda: 0.86, price: 2300,
    stock: { engine: 'gm348', intake: '1x4', carb: '4', trans: 'man4', axle: '3.36', tires: 'std' },
    colors: ['#1d2a4d', '#b3202a', '#ece8dc', '#1b1c1e', '#b9bec4'] },
  galaxie62:  { fam: 'ford', year: 1962, name: 'Ford Galaxie 500', lb: 3700, cda: 0.86, price: 2450,
    stock: { engine: 'fd390', intake: '1x4', carb: '4', trans: 'man4', axle: '3.55', tires: 'std' },
    colors: ['#b3202a', '#2f6db3', '#ece8dc', '#1b1c1e', '#8ab8de'] },
  dart62:     { fam: 'mopar', year: 1962, name: 'Dodge Dart 330', lb: 3400, cda: 0.86, price: 2350,
    stock: { engine: 'mp361', intake: '1x4', carb: '4', trans: 'auto3', axle: '3.55', tires: 'std' },
    colors: ['#ece8dc', '#b3202a', '#1b1c1e', '#e8692a', '#3fb7a8'] },
  vette63:    { fam: 'gm', year: 1963, name: 'Corvette Sting Ray', lb: 3050, cda: 0.7, price: 4300, king: true,
    stock: { engine: 'gm327', intake: '1x4', carb: '4', trans: 'man4', axle: '3.55', tires: 'std' },
    colors: ['#5a0f1a'] }
};
const MODEL_KEYS = Object.keys(MODELS);
const SALE_MODELS = MODEL_KEYS.filter(k => !MODELS[k].king);

// Pinturas de la época. Las "candy" y metalizadas cuestan el doble y brillan más.
const PAINTS = [
  { c: '#111214', es: 'Negro Tuxedo', en: 'Tuxedo Black' },
  { c: '#ece8dc', es: 'Blanco Armiño', en: 'Ermine White' },
  { c: '#b3202a', es: 'Rojo Romano', en: 'Roman Red' },
  { c: '#3fb7a8', es: 'Turquesa Tropical', en: 'Tropical Turquoise' },
  { c: '#f0c93a', es: 'Amarillo Canario', en: 'Canary Yellow' },
  { c: '#2f6db3', es: 'Azul Daytona', en: 'Daytona Blue' },
  { c: '#8fd1b3', es: 'Verde Espuma', en: 'Seafoam Green' },
  { c: '#ff7a5c', es: 'Coral', en: 'Coral' },
  { c: '#f2a7b8', es: 'Rosa Atardecer', en: 'Dusk Pink' },
  { c: '#b9bec4', es: 'Plata Inca', en: 'Inca Silver' },
  { c: '#e8692a', es: 'Naranja Ocaso', en: 'Sunset Orange' },
  { c: '#2f4f3a', es: 'Verde Bosque', en: 'Forest Green' },
  { c: '#1d2a4d', es: 'Azul Medianoche', en: 'Midnight Blue' },
  { c: '#6a1f2b', es: 'Granate', en: 'Maroon' },
  { c: '#c2001a', es: 'Rojo Manzana (candy)', en: 'Candy Apple Red', candy: true },
  { c: '#5b2a86', es: 'Morado Escarchado', en: 'Metalflake Purple', candy: true },
  { c: '#0f6e8c', es: 'Azul Escarchado', en: 'Metalflake Blue', candy: true },
  { c: '#b88a3e', es: 'Oro Sierra', en: 'Sierra Gold', candy: true }
];
const paintOf = c => PAINTS.find(p => p.c === c);

// Trabajos de carrocería (se ven en el auto). w = libras que ahorra; drag = cuánto baja la resistencia al aire.
const MODS = {
  flames:  { price: 60 },
  stripes: { price: 40 },
  pinstripe: { price: 30 },
  nobump:  { price: 15, w: 70 },
  chop:    { price: 160, drag: 0.07 },
  lowered: { price: 45, drag: 0.03, handling: 0.04 },
  scoop:   { price: 35 }
};
const WHEELS = { caps: 0, moons: 30, mags: 85 };

// Rivales del drive-in. edge = segundos que les sobran (+) o faltan (-) respecto a tu auto en el cuarto de milla.
// skill = qué tan bien manejan. look = cómo se ven en su foto.
const RIVALS = [
  { id: 'eddie',  name: 'Eddie', nick: { es: 'Pecas', en: 'Freckles' }, skill: 0.55, edge: 1.0, fam: 'gm',
    look: { skin: '#f1c7a5', hair: 'flat', hc: '#c4642d', top: '#d8d2c0', freckles: 1 } },
  { id: 'bigal',  name: 'Big Al', skill: 0.6, edge: 0.7, fam: 'ford',
    look: { skin: '#e2b08b', hair: 'pomp', hc: '#2a1f18', top: '#1b1b1e', big: 1 } },
  { id: 'peggy',  name: 'Peggy Sue', skill: 0.72, edge: 0.4, fam: 'gm', f: 1,
    look: { skin: '#f3cfb3', hair: 'ponytail', hc: '#e8c56a', top: '#e98aa8', bow: '#ff4f7b' } },
  { id: 'buddy',  name: 'Buddy', skill: 0.6, edge: 0.8, fam: 'mopar',
    look: { skin: '#9a6a48', hair: 'flat', hc: '#1a1411', top: '#3a6fb0' } },
  { id: 'toni',   name: 'Toni Vargas', skill: 0.7, edge: 0.35, fam: 'ford',
    look: { skin: '#c99272', hair: 'duck', hc: '#1a1411', top: '#f2f0ea', tee: 1 } },
  { id: 'rosie',  name: 'Rosie', skill: 0.7, edge: 0.25, fam: 'mopar', f: 1,
    look: { skin: '#e8b996', hair: 'bob', hc: '#7a2a20', top: '#b3202a', bow: '#f2f0ea' } },
  { id: 'slim',   name: 'Jim', nick: { es: 'Flaco', en: 'Slim' }, skill: 0.62, edge: 0.6, fam: 'gm',
    look: { skin: '#f0c6a2', hair: 'pomp', hc: '#9a6b3a', top: '#2f4f3a', slim: 1 } },
  { id: 'gato',   name: 'Morales', nick: { es: 'Gato', en: 'Cat' }, nf: 1, skill: 0.8, edge: 0.0, fam: 'gm',
    look: { skin: '#b98260', hair: 'duck', hc: '#120e0c', top: '#1b1b1e', shades: 1 } },
  { id: 'lola',   name: 'Lola', skill: 0.8, edge: 0.15, fam: 'ford', f: 1,
    look: { skin: '#c48a64', hair: 'beehive', hc: '#1a1411', top: '#3fb7a8' } },
  { id: 'rita',   name: 'Rita', nick: { es: 'Rayo', en: 'Lightning' }, skill: 0.85, edge: -0.1, fam: 'mopar', f: 1,
    look: { skin: '#f3d0b5', hair: 'bob', hc: '#d8a64a', top: '#1b1b1e', shades: 1 } },
  { id: 'hank',   name: 'Hank', nick: { es: 'Martillo', en: 'Hammer' }, skill: 0.72, edge: -0.2, fam: 'ford',
    look: { skin: '#e3b28c', hair: 'buzz', hc: '#5a4030', top: '#6a1f2b', big: 1 } },
  { id: 'vince',  name: 'Vince', skill: 0.78, edge: -0.3, fam: 'mopar', tier: 2,
    look: { skin: '#d9a47e', hair: 'pomp', hc: '#120e0c', top: '#f2f0ea', tee: 1 } },
  { id: 'bobby',  name: 'Bobby Joe', skill: 0.66, edge: 0.45, fam: 'ford',
    look: { skin: '#f1c7a5', hair: 'flat', hc: '#e0c070', top: '#e8692a' } },
  { id: 'doc',    name: 'Wheeler', nick: { es: 'Doc', en: 'Doc' }, nf: 1, skill: 0.9, edge: -0.4, fam: 'gm', tier: 3,
    look: { skin: '#8a5a3c', hair: 'buzz', hc: '#2a1f18', top: '#f2f0ea', glasses: 1 } },
  { id: 'betty',  name: 'Betty', nick: { es: 'Turbo', en: 'Turbo' }, skill: 0.88, edge: -0.5, fam: 'ford', f: 1, tier: 4,
    look: { skin: '#f3cfb3', hair: 'ponytail', hc: '#1a1411', top: '#5b2a86', bow: '#f0c93a', shades: 1 } },
  { id: 'piston', name: 'Mike', nick: { es: 'Pistón', en: 'Piston' }, skill: 0.86, edge: -0.55, fam: 'mopar', tier: 4,
    look: { skin: '#e2b08b', hair: 'duck', hc: '#7a4a2a', top: '#1b1b1e' } },
  { id: 'zorro',  name: 'Carlos', nick: { es: 'El Zorro', en: 'The Fox' }, skill: 0.9, edge: -0.65, fam: 'ford', tier: 6,
    look: { skin: '#b07a55', hair: 'pomp', hc: '#120e0c', top: '#1d2a4d', mustache: 1 } },
  { id: 'duke',   name: 'Duke', skill: 0.93, edge: -0.8, fam: 'gm', tier: 8,
    look: { skin: '#f0c6a2', hair: 'pomp', hc: '#2a1f18', top: '#1b1b1e', shades: 1, collar: 1 } }
];
// El Rey: siempre el mismo auto, preparado al máximo
const KING = {
  id: 'king', name: { es: 'El Rey', en: 'The King' }, skill: 0.97, edge: 0, fam: 'gm',
  look: { skin: '#e8b996', hair: 'pomp', hc: '#0d0b0a', top: '#f2f0ea', shades: 1, crown: 1, collar: 1 },
  car: { model: 'vette63', color: '#5a0f1a', engine: 'gm327', intake: 'race', carbs: ['4R', '4R'], cam: 'full', exhaust: 'hdr',
    trans: 'man4cr', axle: '4.11', tires: 'wide', mods: { pinstripe: 1, wheels: 'mags' } }
};
const KING_WINS = 10;   // victorias que necesitas para que El Rey te acepte

// Teléfonos de los avisos (centrales telefónicas con nombre, como en los años 60)
const EXCHANGES = ['DUnkirk', 'OLympia', 'HOllywood', 'MAdison', 'EXbrook', 'GLadstone', 'NOrmandy', 'WEbster', 'CRestview', 'SUnset'];
