// ===== Datos del juego: los autos inventados, las mejoras del taller, los rivales y las categorías =====

// Cada auto: su forma (la usa car.js para armarlo) y su mecánica de fábrica.
// Forma: len/wid = largo y ancho; wb = entre ejes; fo = de la punta al eje delantero; clr = altura del piso; tire/tireW = rueda.
//   nose/belt/deck/tail = alturas de la trompa, el capó, la maleta y la cola; fin = aletas; brows = cejas sobre los focos.
//   hood = largo del capó; rake/roofLen/rrake = parabrisas, techo y luneta; roof = alto del techo.
//   pF/pR = qué tan cuadrada es la planta adelante y atrás; nTop = redondez de los hombros; tumble = cuánto se angosta arriba.
// Mecánica: torque (Nm) en peak rpm, corte en red; gears = caja de fábrica; final = diferencial; mu = agarre de las gomas.
// pot = cuánto rinden las mejoras de motor y alivianado en este auto (los baratos tienen techo: para subir hay que cambiar de auto).
export const MODELS = {
  sprite: {
    brand: 'Sprite', name: 'Sprite Deluxe', year: 1960, price: 420, tier: 0.8, pot: 0.45, cyl: 6,
    mass: 1180, cda: 0.78, torque: 205, peak: 2400, red: 4600, gears: [2.8, 1.6, 1.0], final: 3.4, mu: 0.92, lat: 1.04,
    shape: { len: 4.45, wid: 1.78, wb: 2.68, fo: 0.78, clr: 0.27, tire: 0.32, tireW: 0.2, nose: 0.6, belt: 0.86, deck: 0.86, tail: 0.66, fin: 0.06, brows: 0.04,
      hood: 1.32, rake: 0.5, roofLen: 1.15, roof: 1.38, rrake: 0.55, pF: 5, pR: 6, nTop: 2.8, tumble: 0.12, ww: false, cover: false, rims: '#e8e4da' }
  },
  bantam: {
    brand: 'Bantam', name: 'Bantam Business Coupé', year: 1946, price: 360, tier: 0.75, pot: 0.5, cyl: 6,
    mass: 1360, cda: 1.0, torque: 250, peak: 2200, red: 4200, gears: [2.8, 1.6, 1.0], final: 3.9, mu: 0.9, lat: 0.96,
    shape: { len: 4.6, wid: 1.82, wb: 2.85, fo: 0.72, clr: 0.32, tire: 0.38, tireW: 0.2, nose: 0.78, belt: 1.02, deck: 0.92, tail: 0.56, fin: 0, brows: 0.08,
      hood: 1.5, rake: 0.42, roofLen: 0.75, roof: 1.6, rrake: 1.1, pF: 2.6, pR: 2.8, nTop: 1.9, tumble: 0.16, ww: true, cover: false, rims: '#1c1c22' }
  },
  marquis: {
    brand: 'Marquis', name: 'Marquis Fastback', year: 1949, price: 480, tier: 0.85, pot: 0.45, cyl: 8,
    mass: 1590, cda: 1.0, torque: 300, peak: 2300, red: 4300, gears: [2.6, 1.55, 1.0], final: 3.7, mu: 0.92, lat: 0.95,
    shape: { len: 5.0, wid: 1.92, wb: 3.0, fo: 0.88, clr: 0.3, tire: 0.38, tireW: 0.22, nose: 0.68, belt: 0.95, deck: 0.82, tail: 0.6, fin: 0, brows: 0.06,
      hood: 1.55, rake: 0.5, roofLen: 0.7, roof: 1.52, rrake: 1.7, pF: 3.0, pR: 2.6, nTop: 2.0, tumble: 0.14, ww: true, cover: true }
  },
  vandal: {
    brand: 'Vandal', name: 'Vandal Coupé', year: 1955, price: 950, tier: 1, pot: 0.5, cyl: 8,
    mass: 1520, cda: 0.92, torque: 370, peak: 2800, red: 5000, gears: [2.5, 1.5, 1.0], final: 3.55, mu: 0.95, lat: 1.0,
    shape: { len: 4.72, wid: 1.92, wb: 2.84, fo: 0.82, clr: 0.27, tire: 0.37, tireW: 0.27, nose: 0.6, belt: 0.88, deck: 0.86, tail: 0.62, fin: 0, brows: 0.02,
      hood: 1.78, rake: 0.46, roofLen: 1.0, roof: 1.36, rrake: 0.8, pF: 3.6, pR: 4.5, nTop: 2.4, tumble: 0.1, ww: false, cover: false, rims: '#c8202a' }
  },
  starliner: {
    brand: 'Comet', name: 'Comet Starliner', year: 1957, price: 1250, tier: 1.1, pot: 0.5, cyl: 8,
    mass: 1640, cda: 0.95, torque: 410, peak: 2900, red: 5000, gears: [2.45, 1.5, 1.0], final: 3.55, mu: 0.95, lat: 1.0,
    shape: { len: 5.05, wid: 1.96, wb: 2.95, fo: 0.98, clr: 0.3, tire: 0.36, tireW: 0.24, nose: 0.62, belt: 0.92, deck: 0.93, tail: 0.66, fin: 0.16, brows: 0.05,
      hood: 1.62, rake: 0.55, roofLen: 1.1, roof: 1.42, rrake: 0.62, pF: 4.5, pR: 6, nTop: 2.4, tumble: 0.1, ww: true, cover: true, spear: true, sweep: '#f1ede2', dagmars: true }
  },
  monarch: {
    brand: 'Monarch', name: 'Monarch Eldorado', year: 1959, price: 1750, tier: 1.25, pot: 0.45, cyl: 8,
    mass: 2050, cda: 1.05, torque: 560, peak: 2800, red: 4800, gears: [2.4, 1.48, 1.0], final: 3.2, mu: 0.95, lat: 0.92,
    shape: { len: 5.6, wid: 2.02, wb: 3.3, fo: 1.05, clr: 0.28, tire: 0.38, tireW: 0.25, nose: 0.66, belt: 0.92, deck: 0.9, tail: 0.66, fin: 0.3, brows: 0.06,
      hood: 1.85, rake: 0.55, roofLen: 1.25, roof: 1.4, rrake: 0.6, pF: 6, pR: 7, nTop: 2.6, tumble: 0.1, ww: true, cover: true, spear: true, dagmars: true }
  },
  hornet: {
    brand: 'Hornet', name: 'Hornet GT', year: 1963, price: 2400, tier: 1.4, pot: 0.85, cyl: 8,
    mass: 1620, cda: 0.9, torque: 520, peak: 3300, red: 5600, gears: [2.2, 1.64, 1.28, 1.0], final: 3.55, mu: 1.0, lat: 1.04,
    shape: { len: 5.0, wid: 1.94, wb: 2.9, fo: 0.92, clr: 0.27, tire: 0.36, tireW: 0.27, nose: 0.66, belt: 0.86, deck: 0.86, tail: 0.68, fin: 0.02, brows: 0.02,
      hood: 1.95, rake: 0.6, roofLen: 1.0, roof: 1.33, rrake: 0.75, pF: 8, pR: 9, nTop: 3.4, tumble: 0.08, ww: false, cover: false, rims: '#9aa0aa', stripes: '#f2efe6' }
  },
  viper: {
    brand: 'Viper', name: 'Viper Sport', year: 1963, price: 3600, tier: 1.6, pot: 1.0, cyl: 8,
    mass: 1420, cda: 0.74, torque: 480, peak: 3600, red: 6000, gears: [2.2, 1.64, 1.28, 1.0], final: 3.7, mu: 1.05, lat: 1.12,
    shape: { len: 4.48, wid: 1.86, wb: 2.5, fo: 0.95, clr: 0.24, tire: 0.34, tireW: 0.25, nose: 0.52, belt: 0.76, deck: 0.8, tail: 0.66, fin: 0, brows: 0.07,
      hood: 1.9, rake: 0.62, roofLen: 0.55, roof: 1.22, rrake: 1.2, pF: 2.4, pR: 3.4, nTop: 2.2, tumble: 0.12, ww: false, cover: false, rims: '#c8ccd2' }
  }
};
export const MODEL_KEYS = Object.keys(MODELS);
export const COLORS = ['#c8202a', '#1a8a8a', '#f2efe6', '#16161c', '#2c4a9a', '#e8b830', '#6a2ca0', '#2c7a3c', '#e86a8a', '#d06018', '#8fb8d8', '#7a1c2c'];
export const PAINT_PRICE = 60, DECAL_PRICE = 40;
export const DECALS = ['none', 'flames', 'stripes', 'number'];

// ----- mejoras del taller: cada categoría tiene niveles; el precio se multiplica por el "tier" del auto -----
export const UPGRADES = {
  engine:  { max: 3, cost: [0, 160, 420, 950], torque: [1, 1.22, 1.45, 1.72], red: [0, 500, 1000, 1500], peak: [0, 300, 600, 900] },
  intake:  { max: 2, cost: [0, 90, 240], torque: [1, 1.07, 1.14] },
  exhaust: { max: 2, cost: [0, 70, 180], torque: [1, 1.04, 1.08] },
  trans:   { max: 2, cost: [0, 220, 480] },
  tires:   { max: 2, cost: [0, 130, 360], mu: [1, 1.15, 1.38] },
  susp:    { max: 2, cost: [0, 140, 340], lat: [1, 1.08, 1.17], drop: [0, 0.03, 0.06] },
  weight:  { max: 2, cost: [0, 160, 460], mass: [1, 0.94, 0.88] },
  nitro:   { max: 3, cost: [0, 220, 380, 560] }
};
export const UP_KEYS = Object.keys(UPGRADES);
export const GEARS_4 = [2.68, 1.91, 1.39, 1.0], GEARS_CLOSE = [2.2, 1.64, 1.28, 1.0];
export const noUpgrades = () => ({ engine: 0, intake: 0, exhaust: 0, trans: 0, tires: 0, susp: 0, weight: 0, nitro: 0 });

// ----- categorías por el tiempo en el cuarto de milla -----
export const CLASSES = ['D', 'C', 'B', 'A', 'S'];
export const CLASS_ET = { D: Infinity, C: 16.2, B: 14.6, A: 13.2, S: 12.0 };   // tiempo máximo para entrar en cada una
export const CLASS_BET = { D: 100, C: 250, B: 500, A: 1000, S: 1500 };        // lo más que apuestan los rivales de cada categoría
export const BETS = [10, 25, 50, 100, 250, 500, 1000, 1500];                    // 0 = por el honor
// La Copa de Bob's (los sábados): inscripción, premio al campeón y al que pierde la final
export const CUP = { D: { fee: 20, prize: 200, second: 60 }, C: { fee: 40, prize: 400, second: 120 }, B: { fee: 80, prize: 800, second: 240 }, A: { fee: 150, prize: 1500, second: 450 }, S: { fee: 150, prize: 1500, second: 450 } };
export const WAGE = 30;            // lo que paga Gus cada día por el turno en la bencinera

// ----- rivales: su auto, su mano para manejar (skill 0..1) y su cara -----
// look: piel, pelo, polera; boss = el jefe de su categoría (hay que ganarle a 3 de esa categoría para que acepte)
const R = (id, name, cls, model, color, up, skill, look, extra = {}) => ({ id, name, cls, model, color, up: Object.assign(noUpgrades(), up), skill, look, ...extra });
export const RIVALS = [
  R('steve', 'Steve', 'D', 'sprite', '#2c4a9a', {}, 0.55, ['#f4c8a0', '#6a3c1c', '#1c3ca8']),
  R('vinnie', 'Vinnie', 'D', 'bantam', '#16161c', { intake: 1 }, 0.6, ['#d89a60', '#000000', '#ffffff']),
  R('ralph', 'Ralph', 'D', 'marquis', '#2c7a3c', {}, 0.58, ['#f4c8a0', '#f0c830', '#d02c2c']),
  R('dolores', 'Dolores', 'D', 'sprite', '#e86a8a', { tires: 1, exhaust: 1 }, 0.66, ['#c58a5c', '#3a2010', '#f0c830']),
  R('earl', 'Big Earl', 'D', 'marquis', '#7a1c2c', { engine: 1, intake: 1, exhaust: 1 }, 0.72, ['#a0602c', '#000000', '#3cc03c'], { boss: true }),
  R('eddie', 'Eddie', 'C', 'vandal', '#e8b830', {}, 0.64, ['#f4c8a0', '#d06018', '#16161c']),
  R('clyde', 'Clyde', 'C', 'starliner', '#16161c', {}, 0.68, ['#f4c8a0', '#3a2010', '#16161c'], { shades: true }),
  R('charlie', 'Charlie', 'C', 'bantam', '#d06018', { engine: 2, intake: 1, tires: 1 }, 0.7, ['#d89a60', '#3a2010', '#3cd0d0']),
  R('rosie', 'Rosie', 'C', 'vandal', '#8fb8d8', { intake: 1, exhaust: 1, susp: 1 }, 0.74, ['#f4c8a0', '#b0402a', '#e04ab0']),
  R('tommy', 'Tommy Two-Tone', 'C', 'starliner', '#1a8a8a', { engine: 1, intake: 1 }, 0.8, ['#f4c8a0', '#000000', '#f2efe6'], { boss: true }),
  R('lou', 'Lou', 'B', 'monarch', '#e86a8a', { engine: 1, intake: 1, tires: 1 }, 0.7, ['#6a3c1c', '#000000', '#e04ab0']),
  R('frankie', 'Frankie', 'B', 'vandal', '#c8202a', { engine: 2, intake: 2, tires: 1, trans: 1 }, 0.76, ['#f4c8a0', '#000000', '#c8202a']),
  R('mike', 'Mike', 'B', 'hornet', '#f2efe6', {}, 0.74, ['#f4c8a0', '#000000', '#ffffff'], { shades: true }),
  R('rocky', 'Rocky', 'B', 'monarch', '#16161c', { engine: 2, intake: 2, exhaust: 1, tires: 1 }, 0.84, ['#d89a60', '#000000', '#16161c'], { boss: true }),
  R('joe', 'Joe', 'A', 'hornet', '#2c4a9a', { engine: 1, intake: 1, tires: 1, trans: 1 }, 0.8, ['#a0602c', '#000000', '#2c4a9a']),
  R('bill', 'Bill', 'A', 'viper', '#c8202a', { engine: 1, tires: 1, susp: 1 }, 0.82, ['#f4c8a0', '#6a3c1c', '#ffffff']),
  R('spike', 'Spike', 'A', 'starliner', '#e86a8a', { engine: 3, intake: 2, exhaust: 2, tires: 2, trans: 2, weight: 2 }, 0.8, ['#f4c8a0', '#f0c830', '#16161c']),
  R('ace', 'Ace', 'A', 'hornet', '#e8b830', { engine: 1, intake: 1, exhaust: 1, tires: 1, trans: 2, susp: 1 }, 0.9, ['#f4c8a0', '#e8e8e8', '#16161c'], { boss: true, shades: true }),
  R('king', 'El Rey', 'S', 'viper', '#0c0c10', { engine: 3, intake: 2, exhaust: 2, tires: 2, trans: 2, susp: 2, weight: 2, nitro: 1 }, 0.96, ['#f4c8a0', '#000000', '#16161c'], { king: true, shades: true })
];
export const rivalById = id => RIVALS.find(r => r.id === id);

// ----- el verano -----
export const START_MONEY = 750, MAX_CARS = 3;
export const FIRST_DAY = Date.UTC(1963, 5, 15), DAYS = 80;      // del 15 de junio al 3 de septiembre
export const NIGHT_OPEN = 20 * 60, NIGHT_CLOSE = 25 * 60, RACE_MINUTES = 40;
