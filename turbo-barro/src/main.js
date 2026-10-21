// ===== Entrada: teclado y controles de videojuego =====
const KEYS = {
  p1: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], nitro: ['Enter', 'NumpadEnter', 'ShiftRight', 'Slash', 'Period', 'Numpad0'], horn: ['KeyL', 'Numpad1'] },
  p2: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], nitro: ['Space', 'KeyQ', 'KeyE', 'ShiftLeft'], horn: ['KeyH', 'KeyR'] }
};
const MENU_KEYS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right', Enter: 'ok', NumpadEnter: 'ok', Space: 'ok',
  Escape: 'pause', KeyP: 'pause', Backspace: 'back'
};
const BLOCK_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter', 'Slash', 'Backspace', 'Tab']);

const Input = {
  down: new Set(), padPrev: [],
  pads() { return navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : []; },
  padState(p) {
    const b = i => !!p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.4);
    const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    return {
      gas: b(0) || b(7) || b(12), brake: b(1) || b(6) || b(13),
      steer: Math.abs(ax) > 0.25 ? ax : (b(15) ? 1 : 0) - (b(14) ? 1 : 0),
      nitro: b(2) || b(4) || b(5), horn: b(3) || b(10),
      up: b(12) || ay < -0.6, down: b(13) || ay > 0.6, left: b(14) || ax < -0.6, right: b(15) || ax > 0.6,
      ok: b(0), pause: b(9)
    };
  },
  get(player, auto) {
    const maps = Game.players === 2 ? [player === 0 ? KEYS.p1 : KEYS.p2] : [KEYS.p1, KEYS.p2];
    const on = name => maps.some(m => m[name].some(c => this.down.has(c)));
    let gas = on('up'), brake = on('down'), nitro = on('nitro'), horn = on('horn');
    let steer = (on('right') ? 1 : 0) - (on('left') ? 1 : 0);
    const pads = this.pads(), mine = Game.players === 2 ? [pads[player]] : pads;
    for (const p of mine) {
      if (!p) continue;
      const s = this.padState(p);
      gas = gas || s.gas; brake = brake || s.brake; nitro = nitro || s.nitro; horn = horn || s.horn;
      if (s.steer) steer = s.steer;
    }
    if (auto && !brake) gas = true;
    return { gas, brake, steer: clamp(steer, -1, 1), nitro, horn };
  },
  poll() {
    this.pads().forEach((p, i) => {
      const s = this.padState(p), prev = this.padPrev[i] || {};
      for (const a of ['up', 'down', 'left', 'right', 'ok', 'pause']) if (s[a] && !prev[a]) Game.press(a);
      this.padPrev[i] = s;
    });
  }
};

// ===== Pantalla =====
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
let resizeTimer = 0;
function resize(now) {
  const s = Math.min(innerWidth / W, innerHeight / H), dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.style.width = Math.floor(W * s) + 'px'; canvas.style.height = Math.floor(H * s) + 'px';
  canvas.width = Math.floor(W * s * dpr); canvas.height = Math.floor(H * s * dpr);
  clearTimeout(resizeTimer);
  // las pistas se vuelven a dibujar en alta resolución cuando la ventana deja de cambiar
  if (now) RENDER_K = canvas.width / W;
  else resizeTimer = setTimeout(() => { RENDER_K = canvas.width / W; }, 200);
}
addEventListener('resize', () => resize(false));

function toggleFullscreen() {
  const d = document, el = d.documentElement;
  try {
    if (!(d.fullscreenElement || d.webkitFullscreenElement)) (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  } catch (e) { /* el navegador no lo permite */ }
}

addEventListener('keydown', e => {
  Sound.init();
  // escribiendo un nombre: las teclas son letras, no controles
  if (Game.editing) { e.preventDefault(); Game.editKey(e); return; }
  if (Game.scene === 'editor' && Editor.key(e)) { e.preventDefault(); return; }
  if (BLOCK_KEYS.has(e.code)) e.preventDefault();
  Input.down.add(e.code);
  if (e.repeat || e.metaKey || e.ctrlKey) return;
  if (e.code === 'KeyM') { Game.showToast(L().music(Sound.toggleMusic())); return; }
  if (e.code === 'KeyF') { toggleFullscreen(); return; }
  const a = MENU_KEYS[e.code];
  if (a) Game.press(a);
});
addEventListener('keyup', e => Input.down.delete(e.code));
addEventListener('blur', () => { Input.down.clear(); Game.autoPause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { Input.down.clear(); Game.autoPause(); } });

const toGame = e => {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
};
canvas.addEventListener('mousedown', e => { Sound.init(); Game.pointer('down', ...toGame(e), e.button); });
canvas.addEventListener('mousemove', e => Game.pointer('move', ...toGame(e), e.button));
addEventListener('mouseup', e => Game.pointer('up', ...toGame(e), e.button));
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ===== Bucle principal =====
const STEP = 1 / 60;
let last = performance.now(), acc = 0;

function update(dt) {
  Game.t += dt;
  if (Game.lock > 0) Game.lock -= dt;
  if (Game.toast) { Game.toast.t -= dt; if (Game.toast.t <= 0) Game.toast = null; }
  if (Game.scene === 'title' && Game.demo) Game.demo.update(dt);
  if (Game.scene === 'race') Game.race.update(dt);
}

function engineSounds() {
  const r = Game.race;
  if (Game.scene === 'race' && r && !r.paused) {
    for (const tr of r.trucks) if (tr.human) Sound.engine(tr.player, Math.min(1, tr.speed / 300), true);
  } else Sound.stopEngines();
}

function draw() {
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (Game.scene === 'title') drawTitle(ctx);
  else if (Game.scene === 'race') { Game.race.draw(ctx); if (Game.race.paused) drawPause(ctx); }
  else if (Game.scene === 'results') drawResults(ctx);
  else if (Game.scene === 'shop') drawShop(ctx);
  else if (Game.scene === 'garage') drawGarage(ctx);
  else if (Game.scene === 'editor') Editor.draw(ctx);
  if (Game.toast) {
    ctx.globalAlpha = Math.min(1, Game.toast.t * 3);
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; roundRect(ctx, W / 2 - 130, H - 70, 260, 44, 22); ctx.fill();
    ctx.font = font(18); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(Game.toast.text, W / 2, H - 48);
    ctx.globalAlpha = 1;
  }
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  Input.poll();
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 6) { update(STEP); acc -= STEP; n++; }
  if (n >= 6) acc = 0;
  engineSounds();
  draw();
  requestAnimationFrame(frame);
}

resize(true);
setLang(LANG);
Game.toTitle();
requestAnimationFrame(frame);
