// ===== Interfaz dentro del juego: botones, cuadros, menús, listas y globos =====
// Es "inmediata": cada cuadro, la pantalla dibuja sus botones y pregunta si les hicieron clic.
const UI = {
  mx: -1, my: -1, clicks: [], click: null, keys: [], enabled: true,
  hover: '', cursor: 'arrow', held: false, mouse: false,

  // ----- entrada -----
  pointer(x, y) { this.mx = x; this.my = y; },
  press(x, y) { this.mx = x; this.my = y; this.held = true; this.clicks.push([x, y]); },
  release() { this.held = false; },
  key(code) { this.keys.push(code); },
  beginFrame() {
    this.click = this.clicks.shift() || null;
    this.hover = ''; this.cursor = 'arrow';
  },
  endFrame() { this.keys.length = 0; },
  takeKey(...codes) { const i = this.keys.findIndex(k => codes.includes(k)); if (i < 0) return false; this.keys.splice(i, 1); return true; },

  // ¿El mouse está sobre este rectángulo?
  over(x, y, w, h) { return this.enabled && this.mx >= x && this.mx < x + w && this.my >= y && this.my < y + h; },
  // Un clic en este rectángulo (y lo consume)
  clicked(x, y, w, h) {
    const c = this.click;
    if (!this.enabled || !c || c[0] < x || c[0] >= x + w || c[1] < y || c[1] >= y + h) return false;
    this.click = null;
    Sound.sfx.click();
    return true;
  },
  // Zona invisible de una escena (el diario, el capó, el reloj...): nombre en la barra de estado y cursor de mano
  hot(x, y, w, h, label, cursor = 'hand') {
    if (this.over(x, y, w, h)) { this.hover = label; this.cursor = cursor; }
    return this.clicked(x, y, w, h);
  },

  // ----- botones -----
  // style: 'grey' (crema, los de diálogo), 'red' (los grandes del taller), 'green' (turquesa)
  button(g, x, y, w, h, label, o = {}) {
    const style = o.style || 'grey', dis = o.disabled;
    const hov = !dis && this.over(x, y, w, h), down = hov && this.held;
    const C = {
      grey: ['#fbf5e6', '#e9dcc0', '#3a2c22', '#c9b48a'],
      red: ['#e8463c', '#a8191f', '#ffffff', '#6e0d12'],
      green: ['#2fb7a8', '#137366', '#ffffff', '#0b4a42']
    }[style];
    const r = Math.min(h / 2, 7), dy = down ? 1 : 0;
    g.save();
    g.fillStyle = 'rgba(0,0,0,0.35)'; roundRect(g, x + 0.5, y + 2.2, w, h, r); g.fill();
    const gr = g.createLinearGradient(0, y + dy, 0, y + h + dy);
    gr.addColorStop(0, hov ? css(shade(C[0], 0.15)) : C[0]); gr.addColorStop(1, hov ? css(shade(C[1], 0.12)) : C[1]);
    g.fillStyle = dis ? '#9a9590' : gr; roundRect(g, x, y + dy, w, h, r); g.fill();
    g.strokeStyle = dis ? '#77726c' : C[3]; g.lineWidth = 1; roundRect(g, x + 0.5, y + dy + 0.5, w - 1, h - 1, r); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.28)'; roundRect(g, x + 2, y + dy + 1.5, w - 4, h * 0.42, Math.max(1, r - 1)); g.fill();
    g.restore();
    const sc = o.scale || 2, th = sc * 7.4 + 1;
    ptext(g, label, x + w / 2, y + dy + (h - th) / 2 - sc * 1.6 - 0.5, dis ? '#d8d4ce' : C[2], sc, { align: 'center', weight: 700 });
    if (hov) { this.cursor = 'hand'; if (o.hint) this.hover = o.hint; }
    if (dis) return false;
    return this.clicked(x, y, w, h);
  },
  // Menú vertical de botones (como "Por puro gusto / $10 / $50 / Olvídalo"). Devuelve el índice elegido o -1.
  menu(g, x, y, w, items, o = {}) {
    const h = o.h || 26;
    let chosen = -1;
    panel(g, x - 7, y - 7, w + 14, items.length * (h + 5) + 9, 'rgba(14,18,26,0.85)');
    items.forEach((it, i) => {
      const label = typeof it === 'string' ? it : it.label;
      if (this.button(g, x, y + i * (h + 5), w, h, label, { disabled: it.disabled })) chosen = i;
    });
    return chosen;
  },

  // ----- cuadros -----
  // Panel oscuro con título (repuestos, autos, listas)
  greenBox(g, x, y, w, h, title) {
    panel(g, x, y, w, h, null, true);
    if (title) {
      ptext(g, title, x + w / 2, y + 5, '#ffd36b', 2, { align: 'center', weight: 800 });
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x + 10, y + 28, w - 20, 1);
    }
  },
  // Tarjeta clara (diálogos, avisos)
  greyBox(g, x, y, w, h) { card(g, x, y, w, h); },
  // Lista con flechas para subir y bajar. st = { sel, top }.
  list(g, x, y, w, h, items, st, o = {}) {
    const rowH = 19, rows = Math.floor((h - 8) / rowH);
    st.top = clamp(st.top || 0, 0, Math.max(0, items.length - rows));
    items.slice(st.top, st.top + rows).forEach((it, k) => {
      const i = st.top + k, ry = y + 4 + k * rowH;
      const label = typeof it === 'string' ? it : it.label;
      const hov = this.over(x, ry - 1, w - 34, rowH);
      if (st.sel === i || hov) { g.fillStyle = st.sel === i ? 'rgba(255,211,107,0.92)' : 'rgba(255,255,255,0.08)'; roundRect(g, x + 2, ry - 1, w - 38, rowH - 1, 4); g.fill(); }
      const col = st.sel === i ? '#1c1408' : '#eef3f7';
      let txt = label;
      while (textWidth(txt, 2) > w - (it.right ? 120 : 48) && txt.length > 4) txt = txt.slice(0, -2);
      if (txt !== label) txt = txt.trim() + '…';
      ptext(g, txt, x + 8, ry - 2, col, 2);
      if (it.right) ptext(g, it.right, x + w - 42, ry - 2, col, 2, { align: 'right' });
      if (hov) this.cursor = 'hand';
      if (this.clicked(x, ry - 1, w - 34, rowH)) st.sel = i;
    });
    if (!items.length && o.empty) ptext(g, o.empty, x + (w - 34) / 2, y + 30, '#b8c4cf', 2, { align: 'center' });
    const ax = x + w - 28;
    const arrow = (ay, dir, dbl) => {
      if (this.button(g, ax, ay, 24, 22, dbl ? (dir < 0 ? '«' : '»') : (dir < 0 ? '‹' : '›'), { style: 'green', scale: 2 })) st.top += dir * (dbl ? rows : 1);
    };
    arrow(y + 2, -1, false); arrow(y + 28, -1, true); arrow(y + h - 50, 1, true); arrow(y + h - 24, 1, false);
    if (this.takeKey('ArrowDown')) st.sel = Math.min(items.length - 1, (st.sel ?? -1) + 1);
    if (this.takeKey('ArrowUp')) st.sel = Math.max(0, (st.sel ?? 1) - 1);
    if (st.sel !== undefined && st.sel >= 0) { if (st.sel < st.top) st.top = st.sel; if (st.sel >= st.top + rows) st.top = st.sel - rows + 1; }
  },

  // ----- textos -----
  // Pantalla de texto (intro, cómo se juega, finales): fondo nocturno con un marco dorado
  textScreen(g, lines) {
    const bg = g.createLinearGradient(0, 0, 0, PH);
    bg.addColorStop(0, '#141a2c'); bg.addColorStop(1, '#2a1830');
    g.fillStyle = bg; g.fillRect(0, 0, PW, PH);
    g.strokeStyle = 'rgba(255,211,107,0.7)'; g.lineWidth = 2; roundRect(g, 26, 22, PW - 52, PH - 44, 14); g.stroke();
    g.strokeStyle = 'rgba(255,211,107,0.25)'; g.lineWidth = 1; roundRect(g, 32, 28, PW - 64, PH - 56, 10); g.stroke();
    lines.forEach((l, i) => ptext(g, l, 60, 54 + i * 25, i === 0 ? '#ffd36b' : '#f3eee2', 2, { weight: i === 0 ? 800 : 500 }));
  },

  // El cursor del sistema: flecha, mano o llave inglesa
  cssCursor() { return this.cursor === 'hand' ? 'pointer' : this.cursor === 'wrench' ? WRENCH_CURSOR : 'default'; }
};
const WRENCH_CURSOR = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><path d="M19 2a7 7 0 0 0-6.6 9.3L2.6 21.1a2.6 2.6 0 0 0 3.7 3.7l9.8-9.8A7 7 0 0 0 25.6 9l-4 4-3.6-1-1-3.6 4-4A7 7 0 0 0 19 2z" fill="#dfe4ea" stroke="#20262e" stroke-width="1.6"/></svg>')}") 3 25, pointer`;

// Panel oscuro redondeado con sombra (glass = con un brillo arriba)
function panel(g, x, y, w, h, fill, glass) {
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.4)'; roundRect(g, x + 2, y + 4, w, h, 12); g.fill();
  if (fill) g.fillStyle = fill;
  else { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#22303f'); gr.addColorStop(1, '#151d28'); g.fillStyle = gr; }
  roundRect(g, x, y, w, h, 12); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1; roundRect(g, x + 0.5, y + 0.5, w - 1, h - 1, 12); g.stroke();
  if (glass) { g.fillStyle = 'rgba(255,255,255,0.05)'; roundRect(g, x + 2, y + 2, w - 4, Math.min(30, h / 3), 10); g.fill(); }
  g.restore();
}
// Tarjeta clara redondeada con sombra
function card(g, x, y, w, h) {
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.38)'; roundRect(g, x + 2, y + 5, w, h, 12); g.fill();
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#fffaf0'); gr.addColorStop(1, '#efe4cc');
  g.fillStyle = gr; roundRect(g, x, y, w, h, 12); g.fill();
  g.strokeStyle = 'rgba(80,56,30,0.35)'; g.lineWidth = 1; roundRect(g, x + 0.5, y + 0.5, w - 1, h - 1, 12); g.stroke();
  g.restore();
}

// ----- Globos de diálogo que se van solos (lo que dicen los vendedores, los rivales, Gus...) -----
const Bubbles = {
  list: [],
  say(text, x, y, tx, ty, t = 3) { this.list = [{ text, x, y, tx, ty, t }]; },
  clear() { this.list = []; },
  update(dt) { for (const b of this.list) b.t -= dt; this.list = this.list.filter(b => b.t > 0); },
  draw(g) { for (const b of this.list) speechBubble(g, b.text, b.x, b.y, b.tx, b.ty); }
};
