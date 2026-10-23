// ===== Interfaz dentro del juego, como la del original: botones biselados, cuadros verdes, menús y globos =====
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
  // style: 'grey' (los de diálogo), 'red' (TUNE / PARTS / DONE), 'green'
  button(g, x, y, w, h, label, o = {}) {
    const style = o.style || 'grey', dis = o.disabled;
    const hov = !dis && this.over(x, y, w, h), down = hov && this.held;
    const C = style === 'red' ? [PAL.r3, PAL.r4, PAL.r1, PAL.w] : style === 'green' ? [PAL.e2, PAL.e4, PAL.e1, PAL.e4] : [PAL.g5, PAL.w, PAL.g2, PAL.k];
    g.fillStyle = PAL.k; g.fillRect(x - 1, y - 1, w + 2, h + 2);
    if (style === 'red') { g.fillStyle = PAL.g6; g.fillRect(x, y, w, h); g.fillStyle = PAL.g3; g.fillRect(x + 2, y + 2, w - 2, h - 2); bevel(g, x + 3, y + 3, w - 6, h - 6, C[0], C[1], C[2], down); }
    else bevel(g, x, y, w, h, hov ? (style === 'grey' ? PAL.g6 : PAL.e3) : C[0], C[1], C[2], down);
    const sc = o.scale || 2, ty = y + Math.round(h / 2) - FONT_H * sc / 2 - (sc > 1 ? 1 : 0) + (down ? 1 : 0);
    ptext(g, label, x + w / 2 + (down ? 1 : 0), ty, dis ? PAL.g4 : C[3], sc, { align: 'center' });
    if (hov) { this.cursor = 'hand'; if (o.hint) this.hover = o.hint; }
    if (dis) return false;
    return this.clicked(x, y, w, h);
  },
  // Menú vertical de botones grises (como "Just for kicks / $10 / $50 / Forget it"). Devuelve el índice elegido o -1.
  menu(g, x, y, w, items, o = {}) {
    const h = o.h || 26;
    let chosen = -1;
    g.fillStyle = PAL.k; g.fillRect(x - 4, y - 4, w + 8, items.length * (h + 4) + 4);
    items.forEach((it, i) => {
      const label = typeof it === 'string' ? it : it.label;
      if (this.button(g, x, y + i * (h + 4), w, h, label, { disabled: it.disabled })) chosen = i;
    });
    return chosen;
  },

  // ----- cuadros -----
  // Cuadro verde con borde doble (como "Spare parts" del original)
  greenBox(g, x, y, w, h, title) {
    g.fillStyle = PAL.k; g.fillRect(x - 3, y - 3, w + 6, h + 6);
    g.fillStyle = PAL.e3; g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = PAL.e2; g.fillRect(x, y, w, h);
    g.fillStyle = PAL.e4; g.fillRect(x + 3, y + 3, w - 6, 1); g.fillRect(x + 3, y + h - 4, w - 6, 1); g.fillRect(x + 3, y + 3, 1, h - 6); g.fillRect(x + w - 4, y + 3, 1, h - 6);
    if (title) { ptext(g, title, x + w / 2, y + 6, PAL.e4, 2, { align: 'center' }); g.fillStyle = PAL.e4; g.fillRect(x + 3, y + 26, w - 6, 1); }
  },
  // Cuadro gris claro (diálogos de compra, el diario)
  greyBox(g, x, y, w, h) {
    g.fillStyle = PAL.k; g.fillRect(x - 2, y - 2, w + 4, h + 4);
    bevel(g, x, y, w, h, PAL.g6, PAL.w, PAL.g4);
  },
  // Lista con flechas para subir y bajar. st = { sel, top }. Devuelve el índice si se eligió uno con doble clic.
  list(g, x, y, w, h, items, st, o = {}) {
    const rowH = 18, rows = Math.floor((h - 8) / rowH);
    st.top = clamp(st.top || 0, 0, Math.max(0, items.length - rows));
    items.slice(st.top, st.top + rows).forEach((it, k) => {
      const i = st.top + k, ry = y + 4 + k * rowH;
      const label = typeof it === 'string' ? it : it.label;
      if (st.sel === i) { g.fillStyle = PAL.e4; g.fillRect(x + 2, ry - 1, w - 34, rowH); }
      ptext(g, label.slice(0, Math.floor((w - 40) / 12)), x + 6, ry, st.sel === i ? PAL.e1 : PAL.e4, 2);
      if (it.right) ptext(g, it.right, x + w - 38, ry, st.sel === i ? PAL.e1 : PAL.e4, 2, { align: 'right' });
      if (this.over(x, ry - 1, w - 34, rowH)) this.cursor = 'hand';
      if (this.clicked(x, ry - 1, w - 34, rowH)) st.sel = i;
    });
    if (!items.length && o.empty) ptext(g, o.empty, x + (w - 34) / 2, y + 30, PAL.e4, 2, { align: 'center' });
    // flechas
    const ax = x + w - 28;
    const arrow = (ay, dir, dbl) => {
      if (this.button(g, ax, ay, 24, 22, dbl ? (dir < 0 ? '«' : '»') : (dir < 0 ? '<' : '>'), { style: 'green', scale: 1 })) st.top += dir * (dbl ? rows : 1);
    };
    arrow(y + 2, -1, false); arrow(y + 28, -1, true); arrow(y + h - 50, 1, true); arrow(y + h - 24, 1, false);
    if (this.takeKey('ArrowDown')) st.sel = Math.min(items.length - 1, (st.sel ?? -1) + 1);
    if (this.takeKey('ArrowUp')) st.sel = Math.max(0, (st.sel ?? 1) - 1);
    if (st.sel !== undefined && st.sel >= 0) { if (st.sel < st.top) st.top = st.sel; if (st.sel >= st.top + rows) st.top = st.sel - rows + 1; }
  },

  // ----- textos -----
  // Pantalla de texto amarillo con esquinas (como el final del original)
  textScreen(g, lines) {
    g.fillStyle = PAL.g3; g.fillRect(0, 0, PW, PH);
    g.fillStyle = PAL.y2;
    for (const [x, y, dx, dy] of [[30, 30, 1, 1], [PW - 30, 30, -1, 1], [30, PH - 30, 1, -1], [PW - 30, PH - 30, -1, -1]]) {
      g.fillRect(Math.min(x, x + dx * 40), y, 40, 3); g.fillRect(x, Math.min(y, y + dy * 40), 3, 40);
    }
    lines.forEach((l, i) => ptext(g, l, 60, 60 + i * 26, PAL.y3, 2, { shadow: PAL.y1 }));
  },

  // ----- campo de texto (el nombre en la licencia) -----
  field(g, x, y, w, st, max = 14) {
    for (const k of this.keys.splice(0)) {
      if (k === 'Backspace') st.text = st.text.slice(0, -1);
      else if (k === 'Enter') st.done = true;
      else if (k.length === 1 && st.text.length < max && FONT[k.toUpperCase()]) st.text += k.toUpperCase();
    }
    ptext(g, st.text, x, y, PAL.u1, 2);
    if (Math.floor(performance.now() / 400) % 2) { g.fillStyle = PAL.u1; g.fillRect(x + textWidth(st.text, 2) + 3, y + 2, 2, 18); }
    g.fillStyle = PAL.k; g.fillRect(x, y + 20, w, 2);
  },

  // ----- cursor (mano, llave o flecha) -----
  drawCursor(g) {
    if (this.mx < 0) return;
    const x = Math.round(this.mx), y = Math.round(this.my);
    const pts = CURSORS[this.cursor] || CURSORS.arrow;
    for (const [c, rows] of pts) { g.fillStyle = c; rows.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) if (row[rx] === '#') g.fillRect(x + rx * 2 - (this.cursor === 'hand' ? 6 : 0), y + ry * 2, 2, 2); }); }
  }
};
// Cursores dibujados a mano (silueta negra y relleno blanco)
const CURSORS = {
  arrow: [[PAL.k, ['#......', '##.....', '###....', '####...', '#####..', '######.', '####...', '#.##...', '..##...']],
    [PAL.w, ['.......', '.......', '.#.....', '.##....', '.###...', '.......', '.#.....', '.......', '.......']]],
  hand: [[PAL.k, ['...##.....', '..#..#....', '..#..#....', '..#..###..', '..#..#..##', '###..#..#.#', '#.#.....#.#', '#.........#', '.#.......#.', '..#.....#..', '...#####...']],
    [PAL.w, ['..........', '...##.....', '...##.....', '...##.....', '...##.##...', '...##.##.#.', '.#.#######.', '.#########.', '..#######..', '...#####...', '...........']]],
  wrench: [[PAL.k, ['.##.....', '#..#....', '#...#...', '.#..##..', '..#...#.', '...#..##', '....####', '.....##.']],
    [PAL.r3, ['........', '.##.....', '.###....', '..##....', '...###..', '....##..', '.....##.', '........']]]
};

// ----- Globos de diálogo que se van solos (lo que dicen los vendedores, los rivales, Gus...) -----
const Bubbles = {
  list: [],
  say(text, x, y, tx, ty, t = 3) { this.list = [{ text, x, y, tx, ty, t }]; },
  clear() { this.list = []; },
  update(dt) { for (const b of this.list) b.t -= dt; this.list = this.list.filter(b => b.t > 0); },
  draw(g) { for (const b of this.list) speechBubble(g, b.text, b.x, b.y, b.tx, b.ty); }
};
