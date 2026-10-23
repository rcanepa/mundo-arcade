// ===== Controles: teclado, joystick y botones en pantalla (teléfonos) =====
export const keys = new Set(), edges = new Set(), touch = {};
const BLOCK = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
let padPrev = {}, onKey = () => {};
export function initInput(handler) {
  onKey = handler;
  addEventListener('keydown', e => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (BLOCK.has(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code); edges.add(e.code);
    onKey(e.code);
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => keys.clear());
}
// Lo que pide el jugador este cuadro (los "bordes" son las teclas recién apretadas)
export function readInput() {
  const k = c => keys.has(c), ed = c => edges.has(c);
  const inp = {
    gas: k('ArrowUp') || k('KeyW') || touch.gas ? 1 : 0, brake: k('ArrowDown') || k('KeyS') || touch.brake ? 1 : 0,
    steer: (k('ArrowRight') || k('KeyD') || touch.right ? 1 : 0) - (k('ArrowLeft') || k('KeyA') || touch.left ? 1 : 0), analog: false,
    hand: k('Space') || !!touch.act, launch: ed('Space') || ed('touchAct'),
    up: ed('KeyE') || ed('ShiftRight') || ed('KeyX') || ed('touchUp'), down: ed('KeyQ') || ed('KeyZ'), nitro: ed('KeyN') || ed('touchNitro')
  };
  const p = navigator.getGamepads ? [...navigator.getGamepads()].find(Boolean) : null;
  if (p) {
    const b = i => (p.buttons[i] ? p.buttons[i].value || (p.buttons[i].pressed ? 1 : 0) : 0), was = i => padPrev[i];
    const ax = p.axes[0] || 0;
    if (Math.abs(ax) > 0.12) { inp.steer = Math.sign(ax) * Math.pow((Math.abs(ax) - 0.12) / 0.88, 1.4); inp.analog = true; }
    inp.gas = Math.max(inp.gas, b(7)); inp.brake = Math.max(inp.brake, b(6));
    const now = {}; for (const i of [0, 1, 2, 3, 4, 5, 8, 9]) now[i] = b(i) > 0.5;
    if (now[0] && !was(0)) inp.launch = true;
    if (now[5] && !was(5)) inp.up = true; if ((now[4] && !was(4)) || (now[2] && !was(2))) inp.down = true;
    if (now[3] && !was(3)) inp.nitro = true;
    inp.hand = inp.hand || now[1];
    if (now[9] && !was(9)) onKey('Escape');
    if (now[8] && !was(8)) onKey('KeyC');
    padPrev = now;
  }
  return inp;
}
// Botones táctiles de la carrera. drag: el botón de acción también sube cambios.
export function buildTouch(el, isDrag) {
  el.innerHTML = '';
  const TB = [['left', '◀', 16, 18, 74], ['right', '▶', 104, 18, 74], ['brake', '▼', -186, 18, 84], ['gas', '▲', -92, 18, 84], ['act', isDrag ? '⇧' : '✋', -92, 114, 74], ['nitro', 'N₂O', -184, 114, 66]];
  for (const [id, label, x, y, s] of TB) {
    const b = document.createElement('button'); b.textContent = label;
    Object.assign(b.style, { width: s + 'px', height: s + 'px', bottom: y + 'px', [x < 0 ? 'right' : 'left']: Math.abs(x) + 'px' });
    const on = v => { touch[id] = v; b.classList.toggle('on', v); if (v) { edges.add('touch' + id[0].toUpperCase() + id.slice(1)); if (id === 'act' && isDrag) edges.add('touchUp'); } };
    b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (err) { /* nada */ } on(true); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => on(false));
    el.appendChild(b);
  }
}
