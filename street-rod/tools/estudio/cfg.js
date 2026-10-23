// Cómo se fotografía cada modelo: flip = darlo vuelta para que mire a la derecha; mats = qué material es cada pieza
// Los modelos estilo Humster3D usan los mismos nombres de materiales
const HUMSTER = { carpaint: 'paint', tire_white: 'whitewall', '^tire': 'rubber', '^chrome': 'chrome', '^black': 'dark', clearglass: 'glass2', windowglass: 'glass', redglass: 'redlight', '^interior': 'interior', mattemetal: 'chrome', '^mirror': 'chrome', '^material(_\\d+)?$': 'chrome', rim_second: 'chrome', '^rim': 'chrome' };
window.CFG = {
  ford40: { flip: true, mats: { primary: 'paint', chassis: 'chrome', 'wheel\\.0': 'rubber', 'wheel\\.4': 'chrome', glass: 'glass', zglas: 'lens', int: 'interior', motor: 'dark', light: 'redlight' } },
  ford32: { mats: { FRAME: 'paint', 'pasted__METAL': 'chrome', aiStandardSurface1$: 'chrome', RUBBER: 'rubber', SEATS: 'interior', LIGHTS: 'lens' } },
  modelA: { mats: { body_2: 'paint', body_1: 'dark', '^metal': 'chrome', Glass: 'glass', white_wall: 'whitewall', interior: 'interior', grille: 'dark', tail_light: 'redlight', '^light': 'lens', mirror: 'chrome' } },
  chevy49: { mats: HUMSTER },
  merc49: { mats: HUMSTER },
  olds54: { mats: Object.assign({ brakedisk: 'dark' }, HUMSTER) },
  tbird57: { mats: HUMSTER },
  caddy59: { mats: HUMSTER }, galaxie63: { mats: HUMSTER },
  vette63: { mats: { 'CP-Ferrari': 'paint' } }, valiant60: { mats: HUMSTER },
  fair58: { prefix: 'Ford_Fairlane_500_Sunliner_1958_', mats: Object.assign({ brakedisk: 'dark', interior_: 'interior' }, HUMSTER) },
  fury58: { mats: Object.assign({ carpaint_second: 'paint', '^carpaint$': 'cream' }, HUMSTER) },
  vette63b: { meshes: { 'main_body|^body_ ': 'paint', body_chrom: 'chrome', 'tire_wheel|^tire_': 'rubber', 'steel_whee|^steel': 'chrome', clear_glas: 'glass', red_glass: 'redlight', body_black: 'dark', body_rubbe: 'rubber', body_steel: 'chrome', 'inter|white_inte': 'interior' } },
  vette61: { flip: true, mats: { Floor: 'hide', '^material$': 'hide', MBlue: 'paint', MWhite: 'cream', MSilver: 'chrome', MBlackout: 'dark', MWindows: 'glass', TireMAT: 'rubber', StainedTires: 'whitewall', Leather: 'interior', MHeadlights: 'lens', MBrakelights: 'redlight', MMirror: 'chrome' } },
  chevy57: { split: '+', mats: Object.assign({ '^wire_': 'hide' }, HUMSTER) },
  nomad56: { mats: { '^Body_Paint$': 'paint', Glass: 'glass', '^Chrome': 'chrome', Matte_Black: 'dark', '^Tyre$': 'rubber', Rubber: 'rubber', Leather: 'interior', Carpet: 'interior', '^Interior': 'interior', Glossy_Red: 'redlight', Mirror: 'chrome', '^headlight$': 'lens' } },
  plym57: { flip: true, mats: { '^extra': 'hide', '^extra': 'hide', '^primary': 'paint', '^secondary': 'cream', 'wheel\\.0': 'chrome', 'wheel\\.1': 'chrome', 'wheel\\.2': 'rubber', 'wheel\\.3': 'whitewall', '^glass': 'glass', '^int': 'interior', 'light': 'lens' } },
  pont58: { flip: true, mats: { white_body__prim: 'paint', roof__prim: 'paint', impala_body: 'paint', 'chrome2': 'chrome', '^bron': 'chrome', '^black1': 'dark', '^rubber': 'rubber', tyre: 'rubber', mirorglass: 'glass', letherss: 'interior' } }, dodge50: { mats: HUMSTER }, olds49: { mats: HUMSTER },
  merc48: { mats: { paint2: 'paint', Glass: 'glass', seats: 'interior', headlight_glass: 'lens', tail_light: 'redlight', ground: 'hide', Paint_main: 'paint' } }
};
window.sheet = async (keys, cols, o = {}) => {
  const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const shots = [];
  for (const k of keys) { const r = await shoot(Object.assign({ url: `models/${k}/model.glb`, w: 1100, wr: 420, save: o.save === false ? null : k }, CFG[k] || {})); shots.push([k, await load(LAST.side), await load(LAST.sideMask), await load(LAST.rear), await load(LAST.rearMask), r]); }
  const out = document.getElementById('out'); out.innerHTML = '';
  const RH = 260, cv = document.createElement('canvas'); cv.width = 1200; cv.height = RH * shots.length; cv.style.width = '100%'; out.appendChild(cv);
  const g = cv.getContext('2d'); const bg = g.createLinearGradient(0, 0, 0, cv.height); bg.addColorStop(0, '#a9bccf'); bg.addColorStop(1, '#5d6b78'); g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
  shots.forEach(([k, s, sm, r, rm], i) => {
    const c = cols[i % cols.length], t = tintCar(s, sm, c), tr = tintCar(r, rm, c);
    const sc = Math.min(820 / t.width, (RH - 30) / t.height), w = t.width * sc, h = t.height * sc; g.drawImage(t, 10, i * RH + RH - 6 - h, w, h);
    const rs = Math.min(300 / tr.width, (RH - 30) / tr.height); g.drawImage(tr, 870, i * RH + RH - 6 - tr.height * rs, tr.width * rs, tr.height * rs);
    g.fillStyle = '#000'; g.font = 'bold 16px sans-serif'; g.fillText(k, 12, i * RH + 18);
  });
  window.scrollTo(0, 0);
  return shots.map(x => x[0] + ':' + x[5].size.map(v => +v.toFixed(2)).join('x'));
};

// Vitrina: todos los autos de lado, cada uno con un color de época y su nombre
window.ROSTER = [
  ['modelA', 'Ford Model A', '#1c3ca8'], ['ford32', "Ford '32 Hot Rod", '#d02c2c'], ['ford40', "Ford '40 Deluxe", '#1c1c24'],
  ['merc48', "Mercury '48", '#1c7a2c'], ['chevy49', "Chevrolet '49 Fleetline", '#1a8a8a'], ['merc49', "Mercury '49", '#8c1820'],
  ['olds49', "Oldsmobile 88 '49", '#e0d0a0'], ['dodge50', "Dodge Coronet '50", '#5a2ca0'], ['olds54', "Oldsmobile 88 '54", '#3cd0d0'],
  ['nomad56', "Chevrolet Nomad '56", '#d06018'], ['chevy57', "Chevrolet Bel Air '57", '#d02c2c'], ['plym57', "Plymouth Belvedere '57", '#3c6cf0'],
  ['tbird57', "Ford Thunderbird '57", '#3cd0d0'], ['pont58', "Pontiac Bonneville '58", '#1c3ca8'], ['fair58', "Ford Fairlane 500 '58", '#1c1c24'],
  ['fury58', "Plymouth Fury '58", '#d02c2c'], ['caddy59', "Cadillac '59", '#e04ab0'], ['valiant60', "Plymouth Valiant '60", '#8cb4ff'],
  ['vette61', "Corvette '61", '#d02c2c'], ['galaxie63', "Ford Galaxie 500 '63", '#f0c830'], ['vette63', "Corvette Sting Ray '63", '#1c1c24']
];
window.showcase = async () => {
  const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = src; });
  const cols = 3, cw = 620, ch = 250, cv = document.createElement('canvas');
  cv.width = cols * cw; cv.height = Math.ceil(ROSTER.length / cols) * ch;
  const g = cv.getContext('2d'); const bg = g.createLinearGradient(0, 0, 0, cv.height); bg.addColorStop(0, '#dfe7ef'); bg.addColorStop(1, '#8e9aa6'); g.fillStyle = bg; g.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < ROSTER.length; i++) {
    const [k, name, col] = ROSTER[i];
    await shoot(Object.assign({ url: `models/${k}/model.glb`, w: 1400, wr: 560 }, CFG[k] || {}));
    const t = tintCar(await load(LAST.side), await load(LAST.sideMask), col);
    const x = (i % cols) * cw, y = Math.floor(i / cols) * ch, sc = Math.min((cw - 30) / t.width, (ch - 50) / t.height);
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(x + cw / 2, y + ch - 18, (t.width * sc) / 2, 7, 0, 0, Math.PI * 2); g.fill();
    g.drawImage(t, x + (cw - t.width * sc) / 2, y + ch - 18 - t.height * sc, t.width * sc, t.height * sc);
    g.fillStyle = '#1d232a'; g.font = '600 20px -apple-system, Helvetica, sans-serif'; g.fillText(name, x + 16, y + 28);
  }
  await fetch('/save?name=showcase.jpg', { method: 'POST', body: cv.toDataURL('image/jpeg', 0.9) });
  const out = document.getElementById('out'); out.innerHTML = ''; cv.style.width = '100%'; out.appendChild(cv); window.scrollTo(0, 0);
  return 'ok';
};

// Saca las tres vistas de todos los autos y las guarda en out/ (después: ./copy_assets.sh ../../assets/cars ../..)
window.exportAll = async () => {
  for (const [k] of ROSTER) await shoot(Object.assign({ url: `models/${k}/model.glb`, w: 1200, wr: 480, wf: 360, save: k, webp: true }, CFG[k] || {}));
  return 'ok';
};
