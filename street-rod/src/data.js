// ===== Datos del verano de 1963: los autos del diario, los repuestos, los colores y los rivales de Bob's =====
// Como en el original, las piezas de motor y caja son de una marca (GM, Ford o Chrysler) y solo calzan en esa marca.
const FAMS = ['gm', 'ford', 'mopar'];
const FAM_NAME = { gm: 'GM', ford: 'Ford', mopar: 'Chrysler' };

// Motores. hp = potencia con su carburación de referencia (V-8: un carburador de 4 bocas; 6 cilindros: uno de 2).
// rpm = donde da su máxima potencia; red = zona roja; lb = peso.
const ENGINES = {
  gm216:  { fam: 'gm', kind: '6', ci: 216, hp: 95, rpm: 3600, red: 4300, lb: 520, price: 140 },
  gm235:  { fam: 'gm', kind: '6', ci: 235, hp: 130, rpm: 4200, red: 4800, lb: 530, price: 190 },
  gm268:  { fam: 'gm', kind: '8', ci: 268, hp: 125, rpm: 3800, red: 4400, lb: 640, price: 170 },
  gm265:  { fam: 'gm', kind: '8', ci: 265, hp: 185, rpm: 4600, red: 5400, lb: 560, price: 260 },
  gm303:  { fam: 'gm', kind: '8', ci: 303, hp: 165, rpm: 3800, red: 4600, lb: 640, price: 230 },
  gm283:  { fam: 'gm', kind: '8', ci: 283, hp: 220, rpm: 4800, red: 5700, lb: 570, price: 345 },
  gm348:  { fam: 'gm', kind: '8', ci: 348, hp: 270, rpm: 5000, red: 5800, lb: 660, price: 460 },
  gm327:  { fam: 'gm', kind: '8', ci: 327, hp: 300, rpm: 5600, red: 6400, lb: 575, price: 560 },
  gm409:  { fam: 'gm', kind: '8', ci: 409, hp: 370, rpm: 5600, red: 6300, lb: 680, price: 820 },
  fd201:  { fam: 'ford', kind: '4', ci: 201, hp: 40, rpm: 2200, red: 2900, lb: 380, price: 60 },
  fd223:  { fam: 'ford', kind: '6', ci: 223, hp: 137, rpm: 4200, red: 4800, lb: 510, price: 180 },
  fd221:  { fam: 'ford', kind: '8', ci: 221, hp: 100, rpm: 3600, red: 4300, lb: 560, price: 150 },
  fd239:  { fam: 'ford', kind: '8', ci: 239, hp: 110, rpm: 3800, red: 4400, lb: 565, price: 165 },
  fd256:  { fam: 'ford', kind: '8', ci: 256, hp: 170, rpm: 4400, red: 5200, lb: 610, price: 230 },
  fd272:  { fam: 'ford', kind: '8', ci: 272, hp: 185, rpm: 4400, red: 5200, lb: 615, price: 250 },
  fd292:  { fam: 'ford', kind: '8', ci: 292, hp: 200, rpm: 4600, red: 5400, lb: 620, price: 290 },
  fd312:  { fam: 'ford', kind: '8', ci: 312, hp: 245, rpm: 4800, red: 5600, lb: 625, price: 380 },
  fd390:  { fam: 'ford', kind: '8', ci: 390, hp: 300, rpm: 4800, red: 5700, lb: 650, price: 500 },
  fd406:  { fam: 'ford', kind: '8', ci: 406, hp: 385, rpm: 5800, red: 6300, lb: 660, price: 800 },
  fd427:  { fam: 'ford', kind: '8', ci: 427, hp: 410, rpm: 6000, red: 6600, lb: 670, price: 990 },
  mp170:  { fam: 'mopar', kind: '6', ci: 170, hp: 101, rpm: 4400, red: 5000, lb: 450, price: 130 },
  mp230:  { fam: 'mopar', kind: '6', ci: 230, hp: 103, rpm: 3600, red: 4200, lb: 520, price: 110 },
  mp225:  { fam: 'mopar', kind: '6', ci: 225, hp: 145, rpm: 4000, red: 4800, lb: 470, price: 190 },
  mp270:  { fam: 'mopar', kind: '8', ci: 270, hp: 190, rpm: 4400, red: 5200, lb: 600, price: 250 },
  mp318:  { fam: 'mopar', kind: '8', ci: 318, hp: 230, rpm: 4400, red: 5400, lb: 600, price: 320 },
  mp361:  { fam: 'mopar', kind: '8', ci: 361, hp: 265, rpm: 4400, red: 5400, lb: 640, price: 400 },
  mp383:  { fam: 'mopar', kind: '8', ci: 383, hp: 330, rpm: 4800, red: 5700, lb: 650, price: 540 },
  mp413:  { fam: 'mopar', kind: '8', ci: 413, hp: 390, rpm: 5400, red: 6000, lb: 680, price: 850 },
  mp426:  { fam: 'mopar', kind: '8', ci: 426, hp: 415, rpm: 5600, red: 6200, lb: 690, price: 1000 }
};

// Múltiples de admisión (uno por marca). Un 4 cilindros lleva 2 bocas; un 6, 2 bocas o 3×2; un V-8, 2 bocas, 4 bocas, 2×4 o de carrera.
const INTAKES = {
  '1x2': { carb: '2', n: 1, k: { 4: 1, 6: 1, 8: 0.86 }, price: 25 },
  '3x2': { carb: '2', n: 3, k: { 6: 1.14 }, price: 70 },
  '1x4': { carb: '4', n: 1, k: { 8: 1 }, price: 45 },
  '2x4': { carb: '4', n: 2, k: { 8: 1.12 }, price: 95 },
  race:  { carb: '4', n: 2, k: { 8: 1.22 }, price: 180 }
};
const intakeFits = (ik, kind) => kind in INTAKES[ik].k;
// Carburadores: calzan en cualquier auto. Los de carrera (cromados) usan las fijaciones de 4 bocas.
const CARBS = {
  '2':  { slot: '2', price: 25 },
  '4':  { slot: '4', price: 40 },
  '4R': { slot: '4', price: 60, k: 1.04 }
};
// Cajas: automática, 3 y 4 velocidades por marca, una de 4 que calza en todos y la de carrera
const TRANS = {
  auto:  { auto: true, ratios: [2.45, 1.45, 1], price: { gm: 115, ford: 120, mopar: 125 } },
  man3:  { ratios: [2.58, 1.48, 1], price: { gm: 175, ford: 160, mopar: 170 } },
  man4:  { ratios: [2.54, 1.92, 1.51, 1], price: { gm: 250, ford: 260, mopar: 245 } },
  man4u: { ratios: [2.54, 1.92, 1.51, 1], price: { all: 275 }, all: true },
  race4: { ratios: [2.2, 1.64, 1.28, 1], price: { gm: 400, ford: 405, mopar: 410 } }
};
// Neumáticos (se venden de a cuatro). grip = agarre al acelerar; lat = agarre en las curvas.
const TIRES = {
  std:   { grip: 0.82, lat: 0.82, price: 45 },
  ww:    { grip: 0.82, lat: 0.82, price: 65, ww: true },
  slick: { grip: 1.12, lat: 0.86, price: 150 }
};
const PART_TYPES = ['engine', 'intake', 'carb', 'trans', 'tires'];

// Los autos que aparecen en el diario: cada uno sale de un modelo 3D del auto real (ver assets/cars/CREDITS.md).
// lb = peso; cda = resistencia al aire (m²); price = valor en buen estado (dólares de 1963); axle = relación del diferencial;
// len = largo real en pulgadas (para dibujarlos a escala).
const MODELS = {
  modelA:    { fam: 'ford', year: 1930, name: 'Ford Model A', lb: 2300, cda: 1.15, price: 200, axle: 3.78, len: 165,
    stock: { engine: 'fd201', intake: '1x2', carb: '2', trans: 'man3', tires: 'std' }, colors: ['#1c3ca8', '#1c1c24', '#1c7a2c', '#6a3c1c'] },
  ford32:    { fam: 'ford', year: 1932, name: 'Ford Hot Rod Roadster', lb: 2250, cda: 0.95, price: 1100, axle: 3.78, len: 150,
    stock: { engine: 'fd292', intake: '2x4', carb: '4', trans: 'man3', tires: 'std' }, colors: ['#d02c2c', '#1c1c24', '#f0c830', '#d06018'] },
  ford40:    { fam: 'ford', year: 1940, name: 'Ford Deluxe Coupe', lb: 2950, cda: 1.0, price: 350, axle: 3.78, len: 188,
    stock: { engine: 'fd221', intake: '1x2', carb: '2', trans: 'man3', tires: 'std' }, colors: ['#1c1c24', '#8c1820', '#1c7a2c', '#5c5c6a'] },
  merc48:    { fam: 'ford', year: 1948, name: 'Mercury Eight', lb: 3350, cda: 1.0, price: 300, axle: 3.9, len: 201,
    stock: { engine: 'fd239', intake: '1x2', carb: '2', trans: 'man3', tires: 'std' }, colors: ['#1c7a2c', '#1c1c24', '#0c1a5a', '#6a3c1c'] },
  chevy49:   { fam: 'gm', year: 1949, name: 'Chevrolet Fleetline', lb: 3150, cda: 0.98, price: 300, axle: 4.11, len: 197,
    stock: { engine: 'gm216', intake: '1x2', carb: '2', trans: 'man3', tires: 'std' }, colors: ['#1a8a8a', '#5c5c6a', '#1c3ca8', '#8c1820'] },
  merc49:    { fam: 'ford', year: 1949, name: 'Mercury Coupe', lb: 3350, cda: 0.95, price: 550, axle: 3.9, len: 206,
    stock: { engine: 'fd256', intake: '1x2', carb: '2', trans: 'man3', tires: 'ww' }, colors: ['#8c1820', '#1c1c24', '#1c7a2c', '#e0d0a0'] },
  olds49:    { fam: 'gm', year: 1949, name: 'Oldsmobile 88 Convertible', lb: 3700, cda: 1.0, price: 500, axle: 3.64, len: 202,
    stock: { engine: 'gm303', intake: '1x2', carb: '2', trans: 'auto', tires: 'ww' }, colors: ['#e0d0a0', '#1a8a8a', '#8c1820', '#1c1c24'] },
  dodge50:   { fam: 'mopar', year: 1950, name: 'Dodge Coronet', lb: 3450, cda: 1.0, price: 250, axle: 3.9, len: 204,
    stock: { engine: 'mp230', intake: '1x2', carb: '2', trans: 'man3', tires: 'std' }, colors: ['#5a2ca0', '#1c7a2c', '#0c1a5a', '#8a8a96'] },
  olds54:    { fam: 'gm', year: 1954, name: 'Oldsmobile 88 Holiday', lb: 3650, cda: 0.95, price: 700, axle: 3.42, len: 206,
    stock: { engine: 'gm303', intake: '1x4', carb: '4', trans: 'auto', tires: 'ww' }, colors: ['#3cd0d0', '#e0d0a0', '#d02c2c', '#1c1c24'] },
  nomad56:   { fam: 'gm', year: 1956, name: 'Chevrolet Nomad', lb: 3450, cda: 0.95, price: 950, axle: 3.55, len: 200,
    stock: { engine: 'gm265', intake: '1x4', carb: '4', trans: 'man3', tires: 'std' }, colors: ['#d06018', '#d02c2c', '#1a8a8a', '#1c1c24'] },
  chevy57:   { fam: 'gm', year: 1957, name: 'Chevrolet Bel Air', lb: 3300, cda: 0.92, price: 1100, axle: 3.55, len: 200,
    stock: { engine: 'gm283', intake: '1x4', carb: '4', trans: 'man3', tires: 'ww' }, colors: ['#d02c2c', '#3cd0d0', '#f0c830', '#1c1c24'] },
  plym57:    { fam: 'mopar', year: 1957, name: 'Plymouth Belvedere', lb: 3450, cda: 0.9, price: 950, axle: 3.73, len: 206,
    stock: { engine: 'mp318', intake: '1x4', carb: '4', trans: 'auto', tires: 'ww' }, colors: ['#3c6cf0', '#3cd0d0', '#d02c2c', '#ffffff'] },
  tbird57:   { fam: 'ford', year: 1957, name: 'Ford Thunderbird', lb: 3200, cda: 0.82, price: 1800, axle: 3.56, len: 181,
    stock: { engine: 'fd312', intake: '1x4', carb: '4', trans: 'man3', tires: 'ww' }, colors: ['#3cd0d0', '#d02c2c', '#ffffff', '#1c1c24'] },
  pont58:    { fam: 'gm', year: 1958, name: 'Pontiac Bonneville', lb: 3900, cda: 0.92, price: 1600, axle: 3.42, len: 211,
    stock: { engine: 'gm348', intake: '1x4', carb: '4', trans: 'auto', tires: 'ww' }, colors: ['#1c3ca8', '#d02c2c', '#ffffff', '#1c1c24'] },
  fair58:    { fam: 'ford', year: 1958, name: 'Ford Fairlane 500', lb: 3700, cda: 0.92, price: 1300, axle: 3.56, len: 207,
    stock: { engine: 'fd312', intake: '1x4', carb: '4', trans: 'auto', tires: 'ww' }, colors: ['#1c1c24', '#d02c2c', '#3c6cf0', '#ffffff'] },
  fury58:    { fam: 'mopar', year: 1958, name: 'Plymouth Fury', lb: 3600, cda: 0.88, price: 1700, axle: 3.73, len: 206,
    stock: { engine: 'mp318', intake: '2x4', carb: '4', trans: 'auto', tires: 'ww' }, colors: ['#d02c2c', '#e0d0a0', '#1c1c24', '#ffffff'] },
  caddy59:   { fam: 'gm', year: 1959, name: 'Cadillac Fleetwood', lb: 4900, cda: 1.0, price: 2400, axle: 3.21, len: 225,
    stock: { engine: 'gm409', intake: '1x4', carb: '4', trans: 'auto', tires: 'ww' }, colors: ['#e04ab0', '#ffffff', '#1c1c24', '#8c1820'] },
  valiant60: { fam: 'mopar', year: 1960, name: 'Plymouth Valiant', lb: 2650, cda: 0.86, price: 650, axle: 3.23, len: 184,
    stock: { engine: 'mp170', intake: '1x2', carb: '2', trans: 'man3', tires: 'std' }, colors: ['#8cb4ff', '#d02c2c', '#ffffff', '#1c7a2c'] },
  vette61:   { fam: 'gm', year: 1961, name: 'Corvette', lb: 2950, cda: 0.76, price: 2200, axle: 3.70, len: 177,
    stock: { engine: 'gm283', intake: '2x4', carb: '4', trans: 'man4', tires: 'ww' }, colors: ['#d02c2c', '#1c3ca8', '#ffffff', '#1c1c24'] },
  galaxie63: { fam: 'ford', year: 1963, name: 'Ford Galaxie 500', lb: 3800, cda: 0.9, price: 2900, axle: 3.5, len: 210,
    stock: { engine: 'fd390', intake: '1x4', carb: '4', trans: 'man4', tires: 'std' }, colors: ['#f0c830', '#d02c2c', '#ffffff', '#1c3ca8'] },
  vette63:   { fam: 'gm', year: 1963, name: 'Corvette Sting Ray', lb: 3050, cda: 0.7, price: 3500, axle: 3.70, len: 175,
    stock: { engine: 'gm327', intake: '1x4', carb: '4', trans: 'man4', tires: 'std' }, colors: ['#1c1c24', '#d02c2c', '#b4b4bc', '#3cd0d0'] }
};
const MODEL_KEYS = Object.keys(MODELS);
const carTitle = model => `${MODELS[model].year} ${MODELS[model].name}`;

// Los 12 colores de la pintura del original, más negro y blanco
const PAINTS = [
  { c: '#8a8a96', es: 'Gris', en: 'Grey' }, { c: '#a0602c', es: 'Café', en: 'Brown' }, { c: '#d02c2c', es: 'Rojo', en: 'Red' },
  { c: '#e04ab0', es: 'Rosado', en: 'Pink' }, { c: '#d06018', es: 'Naranjo', en: 'Orange' }, { c: '#f0c830', es: 'Amarillo', en: 'Yellow' },
  { c: '#1c7a2c', es: 'Verde oscuro', en: 'Dark green' }, { c: '#3cc03c', es: 'Verde claro', en: 'Light green' },
  { c: '#1c3ca8', es: 'Azul oscuro', en: 'Dark blue' }, { c: '#3c6cf0', es: 'Celeste', en: 'Light blue' },
  { c: '#5a2ca0', es: 'Morado oscuro', en: 'Dark purple' }, { c: '#9a6ae0', es: 'Morado claro', en: 'Light purple' },
  { c: '#1c1c24', es: 'Negro', en: 'Black' }, { c: '#ffffff', es: 'Blanco', en: 'White' }
];
const PAINT_PRICE = 50;
// Calcomanías y alivianar el auto (sacar asiento trasero, rueda de repuesto y adornos)
const STICKERS = { hotrod: 15, flames: 25, star: 10, checker: 15, number: 10, lightning: 15 };
const BODYWORK = { strip: { price: 25, days: 0, lb: 90 } };

// Los rivales de Bob's Drive-In: cada uno con su auto. edge = segundos que les sobran (+) o faltan (-)
// respecto a tu auto; skill = qué tan bien manejan; look = cómo se ven al volante.
const RIVALS = [
  { id: 'steve',   name: 'Steve',   model: 'dodge50',   skill: 0.62, edge: 0.4,  look: { skin: '#f4c8a0', hc: '#6a3c1c', top: '#1c3ca8' } },
  { id: 'vinnie',  name: 'Vinnie',  model: 'merc48', skill: 0.6,  edge: 0.5,  look: { skin: '#d89a60', hc: '#000000', top: '#ffffff' } },
  { id: 'ralph',   name: 'Ralph',   model: 'chevy49',    skill: 0.58, edge: 0.7,  look: { skin: '#f4c8a0', hc: '#f0c830', top: '#d02c2c' } },
  { id: 'george',  name: 'George',  model: 'merc49',    skill: 0.62, edge: 0.6,  look: { skin: '#a0602c', hc: '#000000', top: '#1c7a2c' } },
  { id: 'eddie',   name: 'Eddie',   model: 'valiant60', skill: 0.55, edge: 0.9,  look: { skin: '#f4c8a0', hc: '#d06018', top: '#f0c830' } },
  { id: 'clyde',   name: 'Clyde',   model: 'ford40',    skill: 0.7,  edge: 0.2,  look: { skin: '#f4c8a0', hc: '#3a2010', top: '#1c1c24', shades: 1 } },
  { id: 'charlie', name: 'Charlie', model: 'olds49',    skill: 0.7,  edge: 0.1,  look: { skin: '#d89a60', hc: '#3a2010', top: '#3cd0d0' } },
  { id: 'mike',    name: 'Mike',    model: 'olds54',   skill: 0.75, edge: 0.0,  look: { skin: '#f4c8a0', hc: '#000000', top: '#ffffff', shades: 1 } },
  { id: 'lou',     name: 'Lou',     model: 'nomad56',    skill: 0.72, edge: 0.05, look: { skin: '#6a3c1c', hc: '#000000', top: '#e04ab0' } },
  { id: 'frankie', name: 'Frankie', model: 'chevy57',   skill: 0.8,  edge: -0.2, tier: 2, look: { skin: '#f4c8a0', hc: '#3a2010', top: '#d02c2c' } },
  { id: 'jim',     name: 'Jim',     model: 'plym57',   skill: 0.8,  edge: -0.2, tier: 2, look: { skin: '#f4c8a0', hc: '#a0602c', top: '#1c3ca8' } },
  { id: 'tom',     name: 'Tom',     model: 'fair58',   skill: 0.82, edge: -0.3, tier: 3, look: { skin: '#d89a60', hc: '#000000', top: '#ffffff' } },
  { id: 'spike',   name: 'Spike',   model: 'ford32',    skill: 0.86, edge: -0.4, tier: 4, look: { skin: '#f4c8a0', hc: '#000000', top: '#1c1c24', shades: 1 } },
  { id: 'rocky',   name: 'Rocky',   model: 'vette61',   skill: 0.86, edge: -0.45, tier: 5, look: { skin: '#a0602c', hc: '#000000', top: '#f0c830' } },
  { id: 'joe',     name: 'Joe',     model: 'galaxie63',   skill: 0.88, edge: -0.5, tier: 6, look: { skin: '#f4c8a0', hc: '#6a3c1c', top: '#1c1c24' } },
  { id: 'bill',    name: 'Bill',    model: 'fury58',   skill: 0.9,  edge: -0.6, tier: 7, look: { skin: '#f4c8a0', hc: '#f0c830', top: '#ffffff', shades: 1 } }
];
// El Rey: su Corvette '63 negro, preparado al máximo
const KING = {
  id: 'king', name: { es: 'El Rey', en: 'The King' }, skill: 0.97, edge: 0, model: 'vette63',
  look: { skin: '#f4c8a0', hc: '#000000', top: '#ffffff', shades: 1 },
  car: { model: 'vette63', color: '#1c1c24', engine: 'gm327', intake: 'race', carbs: ['4R', '4R'], trans: 'race4', tires: 'slick' }
};
// Para que El Rey te acepte hay que ganar 6 picadas con apuesta y 6 carreras de ruta (como descubrieron los speedrunners)
const KING_DRAGS = 6, KING_ROADS = 6;
