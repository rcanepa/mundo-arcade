// ===== Entrada (teclado, control y pantalla táctil), pantalla y bucle principal =====
const KEYS = {
  gas: ['ArrowUp', 'KeyW'], brake: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
  up: ['Space', 'KeyX', 'ShiftRight'], down: ['KeyZ', 'KeyC', 'ShiftLeft'], horn: ['KeyH']
};
const BLOCK_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab']);

const Input = {
  down: new Set(), edges: new Set(), touch: { gas: 0, brake: 0, left: 0, right: 0 }, padPrev: {},
  has(name) { return KEYS[name].some(c => this.down.has(c)); },
  pad() {
    const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
    const p = pads[0];
    if (!p) return null;
    const b = i => !!p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.3);
    const ax = p.axes[0] || 0;
    const s = { gas: b(7) || b(12), brake: b(6) || b(13), steer: Math.abs(ax) > 0.2 ? ax : (b(15) ? 1 : 0) - (b(14) ? 1 : 0), up: b(0) || b(5), down: b(2) || b(4), horn: b(3), pause: b(9) };
    const prev = this.padPrev; this.padPrev = s;
    return Object.assign({}, s, { upEdge: s.up && !prev.up, downEdge: s.down && !prev.down, hornEdge: s.horn && !prev.horn, pauseEdge: s.pause && !prev.pause });
  },
  // Lo que pide el jugador este instante en la carrera
  read() {
    const p = this.pad(), t = this.touch;
    const r = {
      gas: this.has('gas') || !!t.gas, brake: this.has('brake') || !!t.brake,
      steer: (this.has('right') || t.right ? 1 : 0) - (this.has('left') || t.left ? 1 : 0),
      up: KEYS.up.some(c => this.edges.has(c)) || this.edges.has('touchUp'), down: KEYS.down.some(c => this.edges.has(c)) || this.edges.has('touchDown'),
      horn: this.edges.has('KeyH')
    };
    if (p) {
      r.gas = r.gas || p.gas; r.brake = r.brake || p.brake; if (p.steer) r.steer = p.steer;
      r.up = r.up || p.upEdge; r.down = r.down || p.downEdge; r.horn = r.horn || p.hornEdge;
      if (p.pauseEdge) togglePause();
    }
    r.steer = clamp(r.steer, -1, 1);
    this.edges.clear();
    return r;
  }
};

// ----- Pantalla: 16:9 centrado, nítido en pantallas de alta densidad -----
const stage = document.getElementById('stage'), canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
let SCALE = 1, PIX = 1;
function resize() {
  const s = Math.min(innerWidth / W, innerHeight / H), dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.floor(W * s), h = Math.floor(H * s);
  stage.style.width = w + 'px'; stage.style.height = h + 'px';
  stage.style.left = Math.floor((innerWidth - w) / 2) + 'px'; stage.style.top = Math.floor((innerHeight - h) / 2) + 'px';
  canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr);
  SCALE = s; PIX = canvas.width / W;
  uiEl.style.transform = `scale(${s})`;
}
addEventListener('resize', resize);

function toggleFullscreen() {
  const d = document, el = d.documentElement;
  try {
    if (!(d.fullscreenElement || d.webkitFullscreenElement)) (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  } catch (e) { /* el navegador no lo permite */ }
}
function togglePause() {
  if (Game.scene !== 'race' || !Game.race || Game.race.phase === 'done') return;
  Game.modal = Game.modal === 'pause' ? null : 'pause';
  if (Game.modal) Sound.stopEngines();
  UI.render();
}

addEventListener('keydown', e => {
  Sound.init();
  if (e.target && e.target.tagName === 'INPUT') return;
  if (BLOCK_KEYS.has(e.code)) e.preventDefault();
  Input.down.add(e.code);
  if (e.repeat || e.metaKey || e.ctrlKey) return;
  Input.edges.add(e.code);
  if (e.code === 'KeyM') { Game.toast(L().toast.music(Sound.toggleMusic())); if (Game.scene === 'title') UI.render(); return; }
  if (e.code === 'KeyF') { toggleFullscreen(); return; }
  if (Game.scene === 'race') {
    if (e.code === 'Escape' || e.code === 'KeyP') return togglePause();
    if (Game.race && Game.race.over && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) Game.finishRace();
    return;
  }
  if (e.code === 'Escape') {
    if (Game.modal && Game.modal !== 'pause') { Game.modal = null; UI.render(); }
    else if (['paper', 'shop', 'body', 'gas'].includes(Game.scene)) Game.go('garage');
  }
  if ((e.code === 'Enter' || e.code === 'NumpadEnter') && Game.scene === 'result') Game.afterResult();
});
addEventListener('keyup', e => Input.down.delete(e.code));
addEventListener('blur', () => { Input.down.clear(); togglePauseIfRacing(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { Input.down.clear(); togglePauseIfRacing(); } });
function togglePauseIfRacing() { if (Game.scene === 'race' && !Game.modal && Game.race && Game.race.phase === 'run') togglePause(); }

// mouse sobre el canvas: el taller usa clics en las piezas
const toGame = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
canvas.addEventListener('pointermove', e => {
  if (Game.scene !== 'shop') return;
  const [x, y] = toGame(e), sl = mechHit(x, y);
  Mech.hover = sl ? { sl, x, y } : null;
  canvas.style.cursor = sl ? 'pointer' : 'default';
});
canvas.addEventListener('pointerdown', e => {
  Sound.init();
  if (Game.scene === 'race' && Game.race && Game.race.over) return Game.finishRace();
  if (Game.scene !== 'shop') return;
  const car = activeCar(), [x, y] = toGame(e), sl = mechHit(x, y);
  if (!car || !sl) return;
  const r = mechClick(car, sl);
  if (r && r.blocked) { Sound.sfx.nope(); Game.toast(L().shop.blocked(r.blocked.map(b => L().parts[SLOT_INFO[b].t]).filter((v, i, a) => a.indexOf(v) === i).join(', '))); }
});

// ----- Controles táctiles para la carrera -----
const touchEl = document.getElementById('touch');
const IS_TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
if (IS_TOUCH && touchEl) {
  const btn = (k, label, style) => `<button data-t="${k}" style="${style}">${label}</button>`;
  touchEl.innerHTML = btn('left', '◀', 'left:3%;bottom:6%') + btn('right', '▶', 'left:15%;bottom:6%') +
    btn('brake', '■', 'right:16%;bottom:6%') + btn('gas', '▲', 'right:3%;bottom:6%') +
    btn('up', '⇧', 'right:3%;bottom:30%;width:80px;height:80px') + btn('down', '⇩', 'right:16%;bottom:30%;width:80px;height:80px');
  const set = (e, on) => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    e.preventDefault(); Sound.init();
    const k = b.dataset.t;
    if (k === 'up' || k === 'down') { if (on) Input.edges.add(k === 'up' ? 'touchUp' : 'touchDown'); }
    else Input.touch[k] = on ? 1 : 0;
    b.classList.toggle('on', on);
    if (on && Game.race && Game.race.over) Game.finishRace();
  };
  touchEl.addEventListener('pointerdown', e => set(e, true));
  touchEl.addEventListener('pointerup', e => set(e, false));
  touchEl.addEventListener('pointercancel', e => set(e, false));
  touchEl.addEventListener('pointerleave', e => set(e, false));
}

// ----- Bucle principal -----
const STEP = 1 / 60;
let last = performance.now(), acc = 0;

function update(dt) {
  Game.t += dt;
  if (Game.toastT > 0) { Game.toastT -= dt; if (Game.toastT <= 0) toastEl.hidden = true; }
  const car = S && activeCar();
  switch (Game.scene) {
    case 'race': {
      const r = Game.race;
      if (r && !Game.modal) r.update(dt);
      break;
    }
    case 'shop':
      if (car && mechUpdate(car, dt)) { saveGame(); UI.render(); }
      break;
    case 'gas':
      if (Game.pumping && car) {
        const got = buyGas(car, dt * 1.8);
        if (got <= 0) { Game.pumping = false; Game.toast(car.fuel >= TANK - 0.05 ? L().gas.full : L().paper.noMoney); UI.render(); break; }
        Game.pump.gal += got; Game.pump.cost += got * GAS_PRICE;
        if (Math.floor(Game.pump.gal) > Game.pump.tick) { Game.pump.tick = Math.floor(Game.pump.gal); Sound.sfx.pumpTick(); }
        const info = uiEl.querySelector('.gasinfo');
        if (info && info.firstChild) info.firstChild.textContent = `${car.fuel.toFixed(1)} / ${TANK} ${L().gas.gallons}`;
      }
      break;
    case 'diner': {
      const cur = S && S.night && S.night.cur;
      if (!cur) break;
      if (Game.leaving) {
        Game.rivalX -= dt * 900;
        if (Game.rivalX < -500) { Game.leaving = false; Game.arrive(); }
      } else if (Game.rivalX > Game.rivalTarget) {
        Game.rivalX = Math.max(Game.rivalTarget, Game.rivalX - dt * Math.max(140, (Game.rivalX - Game.rivalTarget) * 1.6));
        if (Game.rivalX <= Game.rivalTarget + 4) { Game.rivalX = Game.rivalTarget; UI.render(); }
      }
      break;
    }
  }
}

function engineSounds() {
  const r = Game.race;
  if (Game.scene === 'race' && r && !Game.modal) {
    const me = r.me.veh, rv = r.rv.veh;
    Sound.engine('me', { rpm: me.dead() && me.blown ? 0 : me.rpm, throttle: me.throttle, cyl: r.me.s.cyl, vol: 1, pan: 0 });
    const gap = r.rv.z - r.me.z;
    Sound.engine('rival', { rpm: rv.rpm, throttle: rv.throttle, cyl: r.rv.s.cyl, vol: clamp(1 - Math.abs(gap) / 160, 0, 0.8), pan: clamp(r.rv.x / 4, -0.8, 0.8) });
    Sound.skid(clamp(Math.max(me.spin, r.me.slide || 0) * 0.8, 0, 1));
    Sound.wind(clamp(me.v / 60, 0, 1));
  } else if (Game.scene === 'diner' && S && S.night && S.night.cur && (Game.rivalX > Game.rivalTarget + 4 || Game.leaving)) {
    Sound.engine('rival', { rpm: 1600, throttle: 0.3, cyl: 8, vol: 0.5, pan: 0.5 });
  } else Sound.stopEngines();
}

function draw() {
  ctx.setTransform(PIX, 0, 0, PIX, 0, 0);
  const t = Game.t, car = S && activeCar();
  switch (Game.scene) {
    case 'title': drawTitle(ctx, t); break;
    case 'garage': case 'paper': drawGarage(ctx, t, car); break;
    case 'body': drawGarage(ctx, t, car, { x: 450, y: 600, size: 730 }); break;
    case 'shop': drawMechanic(ctx, car, t); break;
    case 'gas': drawGasStation(ctx, t, car, Game.pump); break;
    case 'diner': drawDiner(ctx, t, { me: car, rival: S.night && S.night.cur && S.night.cur.car, rivalX: Game.rivalX, spin: Game.rivalX * 0.05 }); break;
    case 'race': case 'result': if (Game.race) Game.race.draw(ctx); else drawDiner(ctx, t, { me: car }); break;
    case 'end': drawEnding(ctx, t, S && S.over === 'king' ? (S.cars.find(c => c.model === 'vette63') || car) : car, S && S.over === 'king'); break;
  }
  if (touchEl) touchEl.hidden = !(IS_TOUCH && Game.scene === 'race' && !Game.modal);
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 6) { update(STEP); acc -= STEP; n++; }
  if (n >= 6) acc = 0;
  engineSounds();
  draw();
  requestAnimationFrame(frame);
}

resize();
setLang(LANG, false);
if (COVER) uiEl.hidden = true;
Game.go('title');
requestAnimationFrame(frame);
