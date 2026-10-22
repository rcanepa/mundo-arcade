// ===== Taller: modelo, pintura, decoración y bocina de cada jugador =====
Object.assign(STR.es, {
  garage: 'TALLER', garageMenu: '🎨 Taller',
  gRows: ['Modelo', 'Color', 'Decoración', 'Bocina'],
  models: {
    pickup: ['Camioneta', 'La de siempre: buena en todo'],
    monster: ['Monster', 'Ruedas gigantes: salta más y no le importan los baches'],
    buggy: ['Buggy', 'Liviano y muy rápido, pero sufre en el barro'],
    tractor: ['Tractor', 'Lento pero pesado: empuja a todos y cruza el barro'],
    icecream: ['Carrito de helados', '¡Reparte helados mientras corre!'],
    ambulance: ['Ambulancia', '¡Con sirena! Rápida para llegar a tiempo'],
    police: ['Carro policial', '¡Con sirena! Ágil y rápido en las curvas'],
    firetruck: ['Carro de bomberos', '¡Con sirena! Grande y pesado: empuja a todos'],
    italian: ['Superdeportivo italiano', 'Velocidad máxima de locos. Ojo: odia el barro'],
    electric: ['Superdeportivo eléctrico', 'Acelera como un rayo y casi no hace ruido']
  },
  statNames: ['Velocidad', 'Aceleración', 'Agarre', 'Peso', 'Salto'],
  decals: ['Ninguna', 'Rayas', 'Llamas', 'Estrellas', 'Rayo', 'Vaca'],
  horns: ['Clásica', 'Camión', 'Payaso', 'Melodía', 'Pato'], sirenName: '🚨 Sirena',
  owned: '✔ Es tuya', buyModel: p => `🔒 $${p}  ·  ENTER o clic para comprar`, earnModel: p => `🔒 $${p}  ·  cómprala en la tienda, entre carreras`,
  noMoney: '¡Te falta dinero!', newTruck: '¡Nueva camioneta!', earnHint: 'Gana dinero en el campeonato para comprarla',
  done: 'Listo', switchPlayer: n => `Cambiar a Jugador ${n}`,
  garageHelp: '↑ ↓ elegir  ·  ← → cambiar  ·  ENTER comprar o probar bocina  ·  o usa el mouse'
});
Object.assign(STR.en, {
  garage: 'GARAGE', garageMenu: '🎨 Garage',
  gRows: ['Model', 'Color', 'Decal', 'Horn'],
  models: {
    pickup: ['Pickup', 'The classic: good at everything'],
    monster: ['Monster', 'Giant wheels: jumps higher and ignores bumps'],
    buggy: ['Buggy', 'Light and very fast, but struggles in mud'],
    tractor: ['Tractor', 'Slow but heavy: pushes everyone and plows through mud'],
    icecream: ['Ice cream truck', 'Delivers ice cream while it races!'],
    ambulance: ['Ambulance', 'With a siren! Quick to get there in time'],
    police: ['Police car', 'With a siren! Agile and quick in the corners'],
    firetruck: ['Fire truck', 'With a siren! Big and heavy: pushes everyone'],
    italian: ['Italian supercar', 'Crazy top speed. Careful: it hates mud'],
    electric: ['Electric supercar', 'Accelerates like lightning and is almost silent']
  },
  statNames: ['Speed', 'Acceleration', 'Grip', 'Weight', 'Jump'],
  decals: ['None', 'Stripes', 'Flames', 'Stars', 'Lightning', 'Cow'],
  horns: ['Classic', 'Truck', 'Clown', 'Tune', 'Duck'], sirenName: '🚨 Siren',
  owned: '✔ It\'s yours', buyModel: p => `🔒 $${p}  ·  ENTER or click to buy`, earnModel: p => `🔒 $${p}  ·  buy it in the shop, between races`,
  noMoney: 'Not enough money!', newTruck: 'New truck!', earnHint: 'Win money in the championship to buy it',
  done: 'Done', switchPlayer: n => `Switch to Player ${n}`,
  garageHelp: '↑ ↓ choose  ·  ← → change  ·  ENTER buy or test horn  ·  or use the mouse'
});

const defaultGarage = p => ({ model: 'pickup', owned: ['pickup'], color: p, decal: 0, horn: p === 1 ? 2 : 0 });
const cycle = (v, d, n) => (v + d + n) % n;

function garageMenu() {
  const C = Game.garageCtx, gp = () => Game.garage[C.player], save = () => Game.savePrefs();
  const sirenOf = () => MODELS[MODEL_KEYS[C.view]].siren;
  const setView = d => {
    C.view = cycle(C.view, d, MODEL_KEYS.length);
    const k = MODEL_KEYS[C.view];
    if (gp().owned.includes(k)) { gp().model = k; save(); }
  };
  const setColor = v => { gp().color = v; save(); };
  const setDecal = d => { gp().decal = cycle(gp().decal, d, DECAL_COUNT); save(); };
  const setHorn = d => { gp().horn = cycle(gp().horn, d, HORN_COUNT); save(); Sound.horn(gp().horn, C.player); };
  const items = [
    { left: () => setView(-1), right: () => setView(1), action: buyModel },
    { left: () => setColor(cycle(gp().color, -1, PAINTS.length)), right: () => setColor(cycle(gp().color, 1, PAINTS.length)), set: setColor, action: () => { setColor(cycle(gp().color, 1, PAINTS.length)); Sound.sfx.select(); } },
    { left: () => setDecal(-1), right: () => setDecal(1), action: () => { setDecal(1); Sound.sfx.select(); } },
    // los vehículos con sirena no cambian de bocina: probarla hace sonar la sirena y prende las balizas
    { left: () => sirenOf() || setHorn(-1), right: () => sirenOf() || setHorn(1),
      action: () => { if (sirenOf()) { Sound.siren(sirenOf(), C.player); Game.garageSirenUntil = Game.t + 1.6; } else Sound.horn(gp().horn, C.player); } }
  ];
  if (C.ret === 'title') {
    items.push({ label: () => L().switchPlayer(2 - C.player), action: () => {
      C.player = 1 - C.player; C.view = MODEL_KEYS.indexOf(gp().model); Sound.sfx.select();
    } });
  }
  items.push({ label: () => L().done, action: () => Game.closeGarage() });
  return new Menu(items);
}

function buyModel() {
  const C = Game.garageCtx, gp = Game.garage[C.player], k = MODEL_KEYS[C.view];
  if (gp.owned.includes(k)) { gp.model = k; Game.savePrefs(); Sound.sfx.select(); return; }
  const r = C.ret === 'shop' ? Game.racers.find(x => x.player === C.player) : null, price = MODELS[k].price;
  if (r && r.money >= price) {
    r.money -= price; gp.owned.push(k); gp.model = k;
    Game.savePrefs(); Game.save(); Sound.sfx.buy(); Game.showToast(L().newTruck);
  } else {
    Sound.sfx.nope(); Game.showToast(r ? L().noMoney : L().earnHint);
  }
}

function workshopBg(g) {
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#3b2614'); grd.addColorStop(1, '#140c05');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  g.fillStyle = '#111'; g.fillRect(0, 0, W, 14);
  g.fillStyle = '#ffc61a';
  for (let x = -40; x < W + 40; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 20, 0); g.lineTo(x + 8, 14); g.lineTo(x - 12, 14); g.fill(); }
}

function drawGarage(g) {
  workshopBg(g);
  const C = Game.garageCtx, gp = Game.garage[C.player], M = Game.menu, key = MODEL_KEYS[C.view];
  const owned = gp.owned.includes(key), paint = PAINTS[gp.color];
  const racer = C.ret === 'shop' ? Game.racers.find(x => x.player === C.player) : null;
  const emoji = s => { g.font = `${s}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`; };

  // izquierda: camioneta girando en una plataforma
  bigText(g, L().garage, 200, 62, 44, '#ffd23f');
  g.font = font(20); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = paint.c;
  g.fillText(Game.names[C.player] || L().player(C.player + 1), 200, 102);
  g.fillStyle = 'rgba(0,0,0,0.35)'; ellipse(g, 204, 286, 128, 128);
  g.fillStyle = '#5a4030'; ellipse(g, 200, 280, 125, 125);
  g.strokeStyle = '#ffc61a'; g.lineWidth = 4; g.setLineDash([14, 10]);
  g.beginPath(); g.arc(200, 280, 116, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
  g.save(); g.translate(200, 280); g.rotate(Game.t * 0.7); g.scale(5.4, 5.4);
  g.globalAlpha = owned ? 1 : 0.5;
  drawTruck(g, { model: key, color: paint.c, dark: paint.d, decal: gp.decal, sirenT: Game.t < (Game.garageSirenUntil || 0) ? 1 : 0 });
  g.restore(); g.globalAlpha = 1;
  if (!owned) { emoji(54); g.textAlign = 'center'; g.fillText('🔒', 200, 280); }
  if (racer) bigText(g, '$' + racer.money, 200, 452, 40, '#7dff7a');

  // derecha: filas que se cambian con ← →
  const x = 400, w = 590;
  M.rects = [];
  const row = (i, y, h) => {
    const on = M.sel === i;
    g.fillStyle = on ? 'rgba(255,210,63,0.22)' : 'rgba(0,0,0,0.45)'; roundRect(g, x, y, w, h, 12); g.fill();
    g.lineWidth = 3; g.strokeStyle = on ? '#ffd23f' : 'rgba(255,255,255,0.12)'; g.stroke();
  };
  const arrows = (i, cy, lx, rx) => {
    [[lx, 'left', '◀'], [rx, 'right', '▶']].forEach(([ax, side, ch]) => {
      g.fillStyle = 'rgba(255,255,255,0.14)'; roundRect(g, ax, cy - 19, 38, 38, 10); g.fill();
      g.fillStyle = '#fff'; g.font = font(16); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ch, ax + 19, cy + 1);
      M.rects.push({ x: ax, y: cy - 19, w: 38, h: 38, item: i, side });
    });
  };
  const label = (txt, y) => { g.font = font(13, 700); g.fillStyle = '#c9b48a'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(txt, x + 18, y); };

  // 0: modelo con sus barras
  row(0, 28, 172); arrows(0, 66, x + 12, x + w - 50);
  const [mName, mDesc] = L().models[key];
  label(L().gRows[0], 44);
  g.textAlign = 'center'; g.font = font(24); g.fillStyle = '#fff'; g.fillText(mName, x + w / 2, 68);
  g.font = font(13, 600); g.fillStyle = '#ddd'; g.fillText(mDesc, x + w / 2, 96);
  modelBars(key).forEach((v, k) => {
    const sx = x + 30 + k * 110;
    g.textAlign = 'left'; g.font = font(11, 700); g.fillStyle = '#bbb'; g.fillText(L().statNames[k], sx, 122);
    for (let j = 0; j < 5; j++) { g.fillStyle = j < v ? '#7dff7a' : 'rgba(255,255,255,0.15)'; roundRect(g, sx + j * 18, 133, 15, 9, 2); g.fill(); }
  });
  g.textAlign = 'center'; g.font = font(15);
  g.fillStyle = owned ? '#7dff7a' : racer && racer.money >= MODELS[key].price ? '#ffd23f' : '#ff9c7a';
  g.fillText(owned ? L().owned : racer ? L().buyModel(MODELS[key].price) : L().earnModel(MODELS[key].price), x + w / 2, 174);
  M.rects.push({ x, y: 28, w, h: 172, item: 0 });

  // 1: colores, cada muestra se puede clickear
  row(1, 210, 76); label(L().gRows[1], 230);
  PAINTS.forEach((p, i) => {
    const cx = x + 40 + i * 56, cy = 258;
    g.fillStyle = p.d; ellipse(g, cx, cy, 19, 19);
    g.fillStyle = p.c; ellipse(g, cx, cy, 16, 16);
    if (i === gp.color) { g.lineWidth = 4; g.strokeStyle = '#fff'; g.beginPath(); g.arc(cx, cy, 22, 0, Math.PI * 2); g.stroke(); }
    M.rects.push({ x: cx - 22, y: cy - 22, w: 44, h: 44, item: 1, value: i });
  });
  M.rects.push({ x, y: 210, w, h: 76, item: 1 });

  // 2 y 3: decoración y bocina
  const siren = MODELS[key].siren;
  [[2, 296, L().decals[gp.decal]], [3, 368, siren ? L().sirenName : '🔊 ' + L().horns[gp.horn]]].forEach(([i, y, val]) => {
    row(i, y, 62); label(L().gRows[i], y + 31);
    if (!(i === 3 && siren)) arrows(i, y + 31, x + 170, x + w - 52);
    g.textAlign = 'center'; g.font = font(20); g.fillStyle = '#fff'; g.fillText(val, x + 380, y + 32);
    M.rects.push({ x, y, w, h: 62, item: i });
  });

  // botones de abajo
  let by = 442;
  for (let i = 4; i < M.items.length; i++) {
    const h = i === M.items.length - 1 ? 58 : 46;
    M.rects.push({ x, y: by, w, h, item: i });
    button(g, x, by, w, h, M.label(M.items[i]), M.sel === i);
    by += h + 10;
  }
  g.font = font(13, 700); g.fillStyle = '#bbb'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(L().garageHelp, W / 2, 618);
}
