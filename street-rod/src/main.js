// ===== Entrada (mouse, teclado, control y pantalla táctil), pantalla y bucle principal =====
const KEYS = {
  gas: ['ArrowUp', 'KeyW'], brake: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
  up: ['Space', 'KeyX', 'ShiftRight'], down: ['KeyZ', 'KeyC', 'ShiftLeft'], horn: ['KeyH']
};
const BLOCK_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backspace']);
const IS_TOUCH = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

// Botones táctiles de la carrera (se dibujan en la pantalla del juego)
const TOUCH_BTNS = {
  left: [8, 300, 64, 64, '◄'], right: [80, 300, 64, 64, '►'],
  down: [470, 230, 52, 52, '-'], up: [530, 230, 52, 52, '+'],
  brake: [500, 300, 64, 64, 'B'], gas: [570, 300, 64, 64, 'A']
};

const Input = {
  down: new Set(), edges: new Set(), touch: {}, pointers: new Map(), padPrev: {},
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
      if (p.pauseEdge) Game.key('Escape');
    }
    r.steer = clamp(r.steer, -1, 1);
    this.edges.clear();
    return r;
  },
  // Qué botones táctiles están apretados según los dedos en la pantalla
  syncTouch() {
    const t = {};
    for (const [x, y] of this.pointers.values()) {
      for (const k in TOUCH_BTNS) {
        const [bx, by, bw, bh] = TOUCH_BTNS[k];
        if (x >= bx - 6 && x < bx + bw + 6 && y >= by - 6 && y < by + bh + 6) t[k] = 1;
      }
    }
    if (t.up && !this.touch.up) this.edges.add('touchUp');
    if (t.down && !this.touch.down) this.edges.add('touchDown');
    this.touch = t;
  }
};
const touchControls = () => IS_TOUCH && Game.name === 'race';
function drawTouchControls(g) {
  for (const k in TOUCH_BTNS) {
    const [x, y, w, h, label] = TOUCH_BTNS[k], on = Input.touch[k];
    g.fillStyle = PAL.k; g.fillRect(x - 1, y - 1, w + 2, h + 2);
    bevel(g, x, y, w, h, on ? PAL.y2 : PAL.g4, PAL.g6, PAL.g2, on);
    ptext(g, label, x + w / 2, y + h / 2 - 10, on ? PAL.k : PAL.w, 2, { align: 'center' });
  }
}

// ----- Pantalla: 640×400 agrandado lo más posible, sin suavizar -----
const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
const nameEl = document.getElementById('name');
ctx.imageSmoothingEnabled = false;
function resize() {
  const s = Math.min(innerWidth / PW, innerHeight / PH);
  // si cabe una escala entera sin perder mucho, se usa (los píxeles quedan todos iguales)
  const si = Math.floor(s), k = si >= 1 && si / s > 0.9 ? si : s;
  const w = Math.floor(PW * k), h = Math.floor(PH * k);
  Object.assign(canvas.style, { width: w + 'px', height: h + 'px', left: Math.floor((innerWidth - w) / 2) + 'px', top: Math.floor((innerHeight - h) / 2) + 'px' });
}
addEventListener('resize', resize);

function toggleFullscreen() {
  const d = document, el = d.documentElement;
  try {
    if (!(d.fullscreenElement || d.webkitFullscreenElement)) (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  } catch (e) { /* el navegador no lo permite */ }
}

addEventListener('keydown', e => {
  Sound.init();
  const typing = e.target === nameEl;
  if (BLOCK_KEYS.has(e.code) && !typing) e.preventDefault();
  Input.down.add(e.code);
  if (e.repeat || e.metaKey || e.ctrlKey) return;
  Input.edges.add(e.code);
  if (typing) { if (e.code === 'Enter' || e.code === 'NumpadEnter') UI.key('Enter'); return; }
  if (e.code === 'KeyM' && Game.name !== 'race') { Game.tell(L().musicToggled(Sound.toggleMusic())); return; }
  if (e.code === 'KeyF' && Game.name !== 'license') { toggleFullscreen(); return; }
  UI.key(e.code === 'NumpadEnter' ? 'Enter' : e.code);
  Game.key(e.code);
});
addEventListener('keyup', e => Input.down.delete(e.code));
addEventListener('blur', () => { Input.down.clear(); Game.key('blur'); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { Input.down.clear(); Game.key('blur'); } });

// ----- Mouse y dedos: se pasan a coordenadas de la pantalla de 640×400 -----
const toGame = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * PW, (e.clientY - r.top) / r.height * PH]; };
canvas.addEventListener('pointermove', e => {
  const [x, y] = toGame(e);
  UI.mouse = e.pointerType === 'mouse';
  UI.pointer(x, y);
  if (Input.pointers.has(e.pointerId)) { Input.pointers.set(e.pointerId, [x, y]); Input.syncTouch(); }
});
canvas.addEventListener('pointerdown', e => {
  Sound.init();
  const [x, y] = toGame(e);
  UI.mouse = e.pointerType === 'mouse';
  if (e.pointerType !== 'mouse') { try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* nada */ } }
  if (touchControls() && !Game.dialogs.length) {
    Input.pointers.set(e.pointerId, [x, y]); Input.syncTouch();
    if (Object.keys(Input.touch).length) return;
  }
  UI.press(x, y);
});
const lift = e => {
  if (Input.pointers.delete(e.pointerId)) Input.syncTouch();
  UI.release();
  if (e.pointerType !== 'mouse') UI.pointer(-1, -1);
};
canvas.addEventListener('pointerup', lift);
canvas.addEventListener('pointercancel', lift);
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') UI.pointer(-1, -1); });
canvas.addEventListener('contextmenu', e => e.preventDefault());

// ----- Bucle principal: la lógica a 60 pasos por segundo, el dibujo en cada cuadro -----
const STEP = 1 / 60;
let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt;
  let n = 0;
  while (acc >= STEP && n < 6) { Game.update(STEP); acc -= STEP; n++; }
  if (n >= 6) acc = 0;
  Game.sounds();
  Game.draw(ctx);
  requestAnimationFrame(frame);
}

resize();
setLang(LANG, false);
Game.go(COVER ? 'cover' : 'title');
requestAnimationFrame(frame);
