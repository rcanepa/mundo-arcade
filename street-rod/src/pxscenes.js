// ===== Escenarios: Bob's Drive-In, gente, barra de estado y globos =====
const STATUS_H = 20;   // la barra de estado de abajo (el dinero y lo que está bajo el mouse)

// Un fondo dibujado una sola vez, en alta resolución
const _bgCache = new Map();
function pxBackground(key, draw) {
  const k = key + '@' + RES;
  let c = _bgCache.get(k);
  if (!c) {
    c = makeCanvas(PW * RES, PH * RES);
    c.lw = PW; c.lh = PH;
    const g = c.getContext('2d');
    g.scale(RES, RES);
    draw(g);
    _bgCache.set(k, c);
  }
  return c;
}
function stars(g, x0, y0, w, h, n, seed = 3) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const r = R() < 0.15 ? 0.9 : 0.5;
    g.fillStyle = `rgba(255,255,255,${0.35 + R() * 0.65})`;
    g.beginPath(); g.arc(x0 + R() * w, y0 + R() * h, r, 0, TAU); g.fill();
  }
}

// Letras gigantes hechas de ampolletas (BOB'S DRIVE-IN), con el resplandor del neón
function bulbText(g, s, x, y, size, on, off, lit = 1) {
  const step = size;
  let cx = x;
  const pts = [];
  for (const ch of s) { for (const [px, py] of FONT[ch] || []) pts.push([cx + px * step + step / 2, y + py * step + step / 2]); cx += (FONT_W + 1) * step; }
  if (lit) { g.save(); g.globalCompositeOperation = 'lighter'; for (const [bx, by] of pts) glow(g, bx, by, step * 1.6, on, 0.22); g.restore(); }
  for (const [bx, by] of pts) {
    g.fillStyle = off; g.beginPath(); g.arc(bx, by, step * 0.46, 0, TAU); g.fill();
    const bg = g.createRadialGradient(bx - step * 0.12, by - step * 0.12, 0, bx, by, step * 0.4);
    bg.addColorStop(0, lit ? '#ffffff' : on); bg.addColorStop(0.45, on); bg.addColorStop(1, css(shade(on, -0.35)));
    g.fillStyle = bg; g.beginPath(); g.arc(bx, by, step * 0.36, 0, TAU); g.fill();
  }
}

// ----- Personas: figuras de formas suaves, con la luz desde arriba a la izquierda -----
// Todas se dibujan en el tamaño de un hombre de 92 de alto y se achican al hacer el sprite.
const oval = (g, x, y, rx, ry, fill, rot = 0) => { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
// Color con brillo a la izquierda y sombra a la derecha (entre x0 y x1)
function sideLit(g, color, x0, x1, k = 1) {
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, css(shade(color, 0.16 * k))); gr.addColorStop(0.5, css(rgbOf(color))); gr.addColorStop(1, css(shade(color, -0.3 * k)));
  return gr;
}
function limb(g, x1, y1, x2, y2, w, fill) {
  g.strokeStyle = fill; g.lineWidth = w; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
}
// Cabeza. o: { skin, hair, style: 'pomp' | 'short' | 'pony' | 'bob', back (de espaldas), cap (color), mustache, chef }
function figHead(g, cx, cy, o) {
  const skin = o.skin || PAL.b5, hair = o.hair || PAL.k, rx = 6.2, ry = 7.4;
  const hg = g.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + 2);
  hg.addColorStop(0, css(shade(hair, 0.3))); hg.addColorStop(1, css(shade(hair, -0.15)));
  // pelo largo por detrás de la cabeza
  if (o.style === 'pony') { oval(g, cx - rx - 1.5, cy + 2, 2.6, 7, hg, 0.35); }
  if (o.style === 'bob') { g.fillStyle = hg; g.beginPath(); g.ellipse(cx, cy + 1, rx + 1.8, ry + 1.5, 0, 0, TAU); g.fill(); }
  // orejas y cara
  oval(g, cx - rx + 0.2, cy + 0.8, 1.5, 2.2, css(shade(skin, -0.1)));
  oval(g, cx + rx - 0.2, cy + 0.8, 1.5, 2.2, css(shade(skin, -0.16)));
  const fg = g.createRadialGradient(cx - 2, cy - 2.5, 1, cx, cy, ry + 1);
  fg.addColorStop(0, css(shade(skin, 0.14))); fg.addColorStop(0.7, css(rgbOf(skin))); fg.addColorStop(1, css(shade(skin, -0.22)));
  oval(g, cx, cy, rx, ry, fg);
  if (!o.back) {
    oval(g, cx - 2.3, cy + 0.7, 0.75, 0.95, '#2a1a12'); oval(g, cx + 2.3, cy + 0.7, 0.75, 0.95, '#2a1a12');
    g.lineCap = 'round';
    g.strokeStyle = css(shade(hair, 0.05)); g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(cx - 3.4, cy - 1.3); g.lineTo(cx - 1.3, cy - 1.7); g.moveTo(cx + 1.3, cy - 1.7); g.lineTo(cx + 3.4, cy - 1.3); g.stroke();
    g.strokeStyle = css(shade(skin, -0.28)); g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(cx + 0.3, cy + 1); g.lineTo(cx + 0.9, cy + 3); g.lineTo(cx - 0.1, cy + 3.2); g.stroke();
    oval(g, cx - 3.7, cy + 3, 1.3, 0.8, 'rgba(230,110,90,0.25)'); oval(g, cx + 3.7, cy + 3, 1.3, 0.8, 'rgba(230,110,90,0.25)');
    if (o.mustache) { g.fillStyle = css(shade(hair, 0.1)); g.beginPath(); g.ellipse(cx - 1.3, cy + 4.1, 1.8, 0.8, 0.2, 0, TAU); g.moveTo(cx + 3.1, cy + 4.1); g.ellipse(cx + 1.3, cy + 4.1, 1.8, 0.8, -0.2, 0, TAU); g.fill(); }
    g.strokeStyle = '#8a3a2c'; g.lineWidth = 0.75;
    g.beginPath(); g.moveTo(cx - 1.7, cy + 4.9); g.quadraticCurveTo(cx, cy + 5.8, cx + 1.7, cy + 4.9); g.stroke();
  }
  // el pelo: un casquete recortado a la forma de la cabeza, más el jopo o la cola
  g.save();
  g.beginPath(); g.ellipse(cx, cy, rx + 0.4, ry + 0.4, 0, 0, TAU); g.clip();
  g.fillStyle = hg;
  if (o.back) { g.beginPath(); g.ellipse(cx, cy - 1.5, rx + 1, ry, 0, 0, TAU); g.fill(); }
  else {
    g.beginPath(); g.ellipse(cx + 0.4, cy - ry * 0.82, rx * 1.25, ry * 0.5, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(cx - rx + 0.4, cy - 2, 1.5, 3.6, 0, 0, TAU); g.moveTo(cx + rx + 1.1, cy - 2); g.ellipse(cx + rx - 0.4, cy - 2, 1.5, 3.6, 0, 0, TAU); g.fill();
  }
  g.restore();
  if (o.style === 'pomp' && !o.cap) {
    oval(g, cx - 0.4, cy - ry + 0.4, 6.6, 3.4, hg, -0.12);
    g.strokeStyle = css(shade(hair, 0.45)); g.lineWidth = 0.6;
    g.beginPath(); g.moveTo(cx - 4.5, cy - ry - 0.6); g.quadraticCurveTo(cx - 0.5, cy - ry - 3, cx + 4.5, cy - ry - 0.4); g.stroke();
  }
  if (o.style === 'pony' && !o.back) oval(g, cx - 0.5, cy - ry + 1.2, 6.3, 2.8, hg, -0.1);
  if (o.cap) {
    const cg = g.createLinearGradient(cx - rx, cy - ry - 2, cx + rx, cy - ry + 4);
    cg.addColorStop(0, css(shade(o.cap, 0.2))); cg.addColorStop(1, css(shade(o.cap, -0.25)));
    g.fillStyle = cg; g.beginPath(); g.ellipse(cx, cy - ry + 3.6, rx + 0.9, 5.4, 0, Math.PI, 0); g.fill();
    oval(g, cx + 2.6, cy - ry + 3.8, 6.4, 1.5, css(shade(o.cap, -0.35)));
    oval(g, cx - 0.5, cy - ry + 0.6, 1.6, 1.2, '#ffffff');
  }
  if (o.chef) {
    const wg = g.createLinearGradient(cx - 8, 0, cx + 8, 0);
    wg.addColorStop(0, '#ffffff'); wg.addColorStop(1, '#c9ccd4');
    g.fillStyle = wg; g.fillRect(cx - rx - 0.3, cy - ry - 3.5, (rx + 0.3) * 2, 5.5);
    oval(g, cx - 4.2, cy - ry - 6, 4.6, 4.2, wg); oval(g, cx + 4.2, cy - ry - 6, 4.6, 4.2, wg); oval(g, cx, cy - ry - 8, 5.6, 5, wg);
  }
}
// Hombre de pie (34 × 92). o: { skin, hair, style, shirt, pants, arms: 'crossed' | 'down', overall, cap, mustache }
function figMan(g, o) {
  const skin = o.skin || PAL.b5, shirt = o.shirt || '#f4f4f0', pants = o.pants || '#2a4f9a';
  oval(g, 17, 89.6, 14, 2.6, 'rgba(0,0,0,0.28)');
  // piernas, basta doblada y zapatos
  g.fillStyle = sideLit(g, pants, 7, 27);
  g.beginPath(); g.moveTo(7.6, 50); g.lineTo(17.2, 50); g.lineTo(16.2, 87); g.lineTo(9.4, 87); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(16.8, 50); g.lineTo(26.4, 50); g.lineTo(24.6, 87); g.lineTo(17.8, 87); g.closePath(); g.fill();
  g.strokeStyle = css(shade(pants, -0.4)); g.lineWidth = 0.7; g.beginPath(); g.moveTo(17, 56); g.lineTo(17, 87); g.stroke();
  if (!o.overall) { g.fillStyle = css(shade(pants, 0.25)); g.fillRect(9.3, 84, 7, 3); g.fillRect(17.7, 84, 7, 3); }
  oval(g, 12.2, 88.3, 5.2, 2.4, '#1c1614'); oval(g, 21.8, 88.3, 5.2, 2.4, '#1c1614');
  oval(g, 10.8, 87.4, 2, 0.7, 'rgba(255,255,255,0.35)'); oval(g, 20.4, 87.4, 2, 0.7, 'rgba(255,255,255,0.35)');
  // cuello y torso
  g.fillStyle = css(shade(skin, -0.15)); g.fillRect(14, 15, 6, 9);
  g.fillStyle = sideLit(g, shirt, 4, 30);
  g.beginPath();
  g.moveTo(9, 23.5); g.quadraticCurveTo(17, 21.6, 25, 23.5);
  g.quadraticCurveTo(29.2, 24.5, 29.6, 29.5); g.lineTo(26.6, 51.5); g.lineTo(7.4, 51.5); g.lineTo(4.4, 29.5);
  g.quadraticCurveTo(4.8, 24.5, 9, 23.5); g.fill();
  oval(g, 17, 23.4, 3.6, 1.7, css(shade(skin, -0.12)));
  if (o.overall) {
    g.fillStyle = sideLit(g, pants, 9, 25);
    g.beginPath(); g.moveTo(10.5, 32); g.lineTo(23.5, 32); g.lineTo(24.5, 51.5); g.lineTo(9.5, 51.5); g.closePath(); g.fill();
    limb(g, 10.8, 32, 9.4, 24.5, 2.2, css(shade(pants, -0.1))); limb(g, 23.2, 32, 24.6, 24.5, 2.2, css(shade(pants, -0.2)));
    oval(g, 11.2, 33, 0.9, 0.9, '#d8d8dc'); oval(g, 22.8, 33, 0.9, 0.9, '#d8d8dc');
    g.fillStyle = css(shade(pants, 0.18)); g.fillRect(13.5, 36, 7, 5);
    oval(g, 20.5, 27.5, 2.6, 1.3, '#ffffff');
  } else {
    g.fillStyle = '#3a2414'; g.fillRect(7.8, 49.2, 18.4, 2.8); g.fillStyle = '#cfd2d8'; g.fillRect(15.6, 49.3, 2.8, 2.6);
  }
  // brazos
  const sl = css(shade(shirt, -0.06)), sk = css(rgbOf(skin)), skd = css(shade(skin, -0.14));
  if (o.arms === 'crossed') {
    limb(g, 6.4, 27, 5.6, 32, 6.8, sl); limb(g, 27.6, 27, 28.4, 32, 6.8, css(shade(shirt, -0.2)));
    limb(g, 5.7, 31.5, 5.4, 38, 5.2, sk); limb(g, 28.3, 31.5, 28.6, 38, 5.2, skd);
    limb(g, 6, 38.4, 23.5, 36.6, 5.2, skd); oval(g, 24.5, 36.4, 2.4, 2.2, skd);
    limb(g, 28, 38.6, 10.5, 36.4, 5.2, sk); oval(g, 9.6, 36.2, 2.4, 2.2, sk);
  } else {
    limb(g, 6.4, 27, 5.4, 32, 6.8, sl); limb(g, 27.6, 27, 28.6, 32, 6.8, css(shade(shirt, -0.2)));
    limb(g, 5.4, 31.5, 4.4, 47.5, 4.8, sk); limb(g, 28.6, 31.5, 29.6, 47.5, 4.8, skd);
    oval(g, 4.3, 49.4, 2.4, 2.9, sk); oval(g, 29.7, 49.4, 2.4, 2.9, skd);
  }
  if (o.rag) { g.fillStyle = PAL.r3; g.beginPath(); g.moveTo(24, 47); g.lineTo(27.5, 46.5); g.lineTo(28, 58); g.lineTo(25.5, 57); g.closePath(); g.fill(); }
  figHead(g, 17, 10.8, o);
}
// La mesera en patines con su bandeja (46 × 92)
function figWaitress(g, o) {
  const skin = o.skin || PAL.b5, dress = o.dress || '#e04ab0';
  oval(g, 23, 90, 13, 2.2, 'rgba(0,0,0,0.25)');
  limb(g, 20, 56, 20, 79, 4.2, css(rgbOf(skin))); limb(g, 26, 56, 26.5, 79, 4.2, css(shade(skin, -0.14)));
  for (const x of [16, 23]) {
    const bg = g.createLinearGradient(x, 0, x + 9, 0); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#c8ccd4');
    g.fillStyle = bg; g.beginPath(); g.moveTo(x + 1.5, 77); g.lineTo(x + 6.5, 77); g.lineTo(x + 7, 84); g.lineTo(x + 9.5, 85); g.lineTo(x + 9.5, 87); g.lineTo(x, 87); g.lineTo(x + 0.5, 84); g.closePath(); g.fill();
    g.fillStyle = '#8a8e96'; g.fillRect(x, 86.6, 9.5, 1.2);
    oval(g, x + 2, 89, 1.7, 1.7, PAL.r3); oval(g, x + 7.5, 89, 1.7, 1.7, PAL.r3);
  }
  // vestido acampanado, delantal y cuello
  g.fillStyle = sideLit(g, dress, 10, 36);
  g.beginPath(); g.moveTo(17.5, 23.5); g.quadraticCurveTo(23, 22, 28.5, 23.5); g.quadraticCurveTo(30.5, 30, 29, 37);
  g.quadraticCurveTo(33, 48, 35.5, 58); g.quadraticCurveTo(23, 61.5, 10.5, 58); g.quadraticCurveTo(13, 48, 17, 37); g.quadraticCurveTo(15.5, 30, 17.5, 23.5); g.fill();
  g.fillStyle = '#ffffff'; g.fillRect(17, 36.5, 12, 2);
  const ag = g.createLinearGradient(17, 0, 30, 0); ag.addColorStop(0, '#ffffff'); ag.addColorStop(1, '#d6d8de');
  g.fillStyle = ag; g.beginPath(); g.moveTo(18.5, 38.5); g.lineTo(27.5, 38.5); g.quadraticCurveTo(30, 48, 30.5, 54); g.quadraticCurveTo(23, 57, 15.5, 54); g.quadraticCurveTo(16, 48, 18.5, 38.5); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(19, 23); g.lineTo(23, 27.5); g.lineTo(27, 23); g.lineTo(23, 24.6); g.closePath(); g.fill();
  // brazos: uno abajo, el otro sostiene la bandeja
  oval(g, 16.8, 26, 3.4, 3, css(shade(dress, 0.08))); oval(g, 29.2, 26, 3.4, 3, css(shade(dress, -0.15)));
  limb(g, 16, 28, 14.2, 43, 3.6, css(rgbOf(skin))); oval(g, 14, 44.5, 2, 2.4, css(rgbOf(skin)));
  limb(g, 30, 28, 35.5, 35.5, 3.6, css(shade(skin, -0.12))); limb(g, 35.5, 35.5, 38.5, 25, 3.4, css(shade(skin, -0.12)));
  oval(g, 38, 23, 8.5, 1.8, '#9aa0aa'); oval(g, 38, 22.5, 8.5, 1.5, '#d8dce2');
  g.fillStyle = PAL.r3; g.fillRect(33, 14, 3.6, 8.4); g.fillStyle = '#ffffff'; g.fillRect(33, 13, 3.6, 1.6);
  limb(g, 34.4, 13.2, 36.2, 9, 0.6, '#ffffff');
  oval(g, 41.5, 21.2, 3.6, 1.2, '#7a3a18'); oval(g, 41.5, 19.6, 3.8, 1.1, '#3cc03c'); oval(g, 41.5, 18.6, 3.8, 1.8, '#d89a40', 0);
  figHead(g, 23, 12.6, { skin, hair: o.hair || PAL.y2, style: 'pony' });
  // gorrito de papel
  g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(17.5, 6.5); g.lineTo(28.5, 6.5); g.lineTo(26.5, 2.5); g.lineTo(19.5, 2.5); g.closePath(); g.fill();
  g.fillStyle = dress; g.fillRect(18.4, 4.6, 9.2, 1.2);
}
// Busto (26 × 32): el cliente del mesón (de espaldas) o el cocinero (de frente, con gorro)
function figBust(g, o) {
  const top = o.top || PAL.r3;
  g.fillStyle = sideLit(g, top, 0, 26);
  g.beginPath(); g.moveTo(0.5, 32); g.quadraticCurveTo(0.5, 21.5, 7, 20.5); g.lineTo(19, 20.5); g.quadraticCurveTo(25.5, 21.5, 25.5, 32); g.closePath(); g.fill();
  g.fillStyle = css(shade(o.skin || PAL.b5, -0.15)); g.fillRect(10.5, 14, 5, 7);
  if (o.long) { g.fillStyle = css(shade(o.hair || PAL.k, 0.05)); g.beginPath(); g.ellipse(13, 15, 7.6, 9.5, 0, 0, TAU); g.fill(); }
  if (o.chef) { g.fillStyle = PAL.r3; g.beginPath(); g.moveTo(9.5, 20.5); g.lineTo(16.5, 20.5); g.lineTo(13, 25); g.closePath(); g.fill(); }
  figHead(g, 13, 10.5, o);
}
function pxPerson(kind, look = {}) {
  const key = 'person:' + kind + JSON.stringify(look);
  let c = PXCACHE.get(key);
  if (c) return c;
  const K = look.k || 1.35;
  // s: lo que mide la figura dibujada al tamaño de un hombre de 92 de alto
  const spr = (w, h, s, draw) => pixelSprite(Math.ceil(w * K), Math.ceil(h * K), g => { g.scale(K * s, K * s); draw(g); });
  const skin = look.skin || PAL.b5, hair = look.hair || PAL.k;
  if (kind === 'post') c = spr(34, 92, 1, g => figMan(g, { skin, hair, style: 'pomp', arms: 'crossed' }));
  else if (kind === 'gus') c = spr(34, 92, 1, g => figMan(g, { skin, hair: '#6a5a4c', style: 'short', cap: PAL.r3, mustache: 1, shirt: '#a8bcd8', pants: '#24489a', overall: 1, rag: 1, arms: 'down' }));
  else if (kind === 'waitress') c = spr(36, 70, 0.76, g => figWaitress(g, { skin }));
  else if (kind === 'cook') c = spr(30, 34, 0.86, g => { g.translate(4, 10); figBust(g, { skin, hair, top: '#f4f4f4', chef: 1, mustache: 1, style: 'short' }); });
  else c = spr(20, 24, 0.76, g => figBust(g, { skin, hair, top: look.top, long: look.long, back: 1, style: look.long ? 'bob' : 'short' }));
  PXCACHE.set(key, c);
  return c;
}

// ----- Piezas del paisaje: palmeras, nubes, ventanas y fachadas de tiendas -----
// Palmera de tronco curvo con anillos y hojas de peineta. dark: silueta de noche.
function palmTree(g, x, base, h, lean = 0.12, dark = false) {
  const at = t => [x + lean * h * t * t, base - h * t];
  g.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const [x0, y0] = at(i / 16), [x1, y1] = at((i + 1) / 16), w = 6.4 - 3 * i / 16;
    g.strokeStyle = dark ? '#100c0a' : '#8a6644'; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    if (!dark) { g.strokeStyle = 'rgba(255,230,190,0.28)'; g.lineWidth = w * 0.3; g.beginPath(); g.moveTo(x0 - w * 0.22, y0); g.lineTo(x1 - w * 0.22, y1); g.stroke(); }
    g.strokeStyle = dark ? 'rgba(0,0,0,0.5)' : 'rgba(70,46,26,0.45)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(x1 - w / 2, y1); g.lineTo(x1 + w / 2, y1 + 0.8); g.stroke();
  }
  const [tx, ty] = at(1), L = h * 0.33;
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < 9; i++) {
    if ((i + pass) % 2) continue;
    const a = -Math.PI + (i + 0.5) / 9 * Math.PI + (pass ? 0.12 : -0.1), dx = Math.cos(a), dy = Math.sin(a);
    const droop = L * (0.3 + 0.35 * Math.abs(dx));
    const C = [tx + dx * L * 0.55, ty + dy * L * 0.45 - L * 0.18], E = [tx + dx * L, ty + dy * L * 0.4 + droop];
    const leaf = dark ? '#0b120e' : pass ? '#4c9a3e' : '#2f7330', rib = dark ? '#0b120e' : pass ? '#3a7a30' : '#235a26';
    g.strokeStyle = leaf; g.lineWidth = 1.3;
    for (let t = 0.12; t <= 1.001; t += 0.07) {
      const u = 1 - t, px = u * u * tx + 2 * u * t * C[0] + t * t * E[0], py = u * u * ty + 2 * u * t * C[1] + t * t * E[1];
      const qx = 2 * u * (C[0] - tx) + 2 * t * (E[0] - C[0]), qy = 2 * u * (C[1] - ty) + 2 * t * (E[1] - C[1]), ql = Math.hypot(qx, qy) || 1;
      const nx = -qy / ql, ny = qx / ql, ll = L * 0.2 * (1.1 - t * 0.6);
      g.beginPath(); g.moveTo(px + nx * ll, py + ny * ll + ll * 0.6); g.lineTo(px, py); g.lineTo(px - nx * ll, py - ny * ll + ll * 0.6); g.stroke();
    }
    g.strokeStyle = rib; g.lineWidth = 1.4; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(C[0], C[1], E[0], E[1]); g.stroke();
  }
  if (!dark) for (const [cx, cy] of [[-2, 2], [2, 2.5], [0, 4]]) oval(g, tx + cx, ty + cy, 2, 2, '#6a4a22');
}
// Nube de ilustración: bolas blancas unidas, con la base plana y algo de sombra abajo
function softCloud(g, x, y, w, a = 0.92) {
  const R = rng(Math.round(x * 7 + y));
  const gr = g.createLinearGradient(0, y - w * 0.32, 0, y);
  gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(1, `rgba(214,228,244,${a})`);
  g.save(); g.beginPath(); g.rect(x - w, y - w, w * 2, w); g.clip();
  g.fillStyle = gr; g.beginPath();
  for (let i = 0; i < 5; i++) {
    const t = i / 4, cx = x + (t - 0.5) * w * 0.78, r = w * (0.1 + 0.13 * Math.sin(t * Math.PI)) * (0.85 + R() * 0.3);
    g.moveTo(cx + r, y - r * 0.4); g.arc(cx, y - r * 0.4, r, 0, TAU);
  }
  g.fill(); g.restore();
}
// Vidrio: de día refleja el cielo; de noche, encendido (cálido) o apagado
function glassPane(g, x, y, w, h, night, lit) {
  const gr = g.createLinearGradient(x, y, x + w * 0.4, y + h);
  if (!night) { gr.addColorStop(0, '#d6ecfa'); gr.addColorStop(0.45, '#6f9ac4'); gr.addColorStop(1, '#2a4668'); }
  else if (lit) { gr.addColorStop(0, '#fff1bc'); gr.addColorStop(1, '#e6a24e'); }
  else { gr.addColorStop(0, '#1c2436'); gr.addColorStop(1, '#0c111c'); }
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  if (!night || !lit) {
    g.fillStyle = `rgba(255,255,255,${night ? 0.05 : 0.22})`;
    g.beginPath(); g.moveTo(x + w * 0.15, y + h); g.lineTo(x + w * 0.55, y); g.lineTo(x + w * 0.8, y); g.lineTo(x + w * 0.4, y + h); g.closePath(); g.fill();
  }
}
// Una tienda de dos o tres pisos con letrero, toldo y vitrina
function storefront(g, x, w, h, base, col, night, R, sign) {
  const top = base - h, shop = base - 46;
  const fg = g.createLinearGradient(0, top, 0, base);
  fg.addColorStop(0, css(shade(col, night ? -0.62 : 0.1))); fg.addColorStop(1, css(shade(col, night ? -0.76 : -0.12)));
  g.fillStyle = fg; g.fillRect(x, top, w, h);
  g.fillStyle = css(shade(col, night ? -0.5 : 0.3)); g.fillRect(x - 2, top - 4, w + 4, 6);
  g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x, top + 2, w, 2.5);
  g.fillStyle = 'rgba(0,0,0,0.14)'; g.fillRect(x + w - 4, top, 4, h);
  // ventanas de los pisos de arriba
  const n = Math.max(1, Math.floor((w - 10) / 30)), gap = (w - n * 16) / (n + 1);
  for (let wy = top + 14; wy + 22 < shop - 10; wy += 34) for (let i = 0; i < n; i++) {
    const wx = x + gap + i * (16 + gap), lit = night && R() < 0.55;
    if (lit) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, wx + 8, wy + 11, 20, '#ffb860', 0.18); g.restore(); }
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(wx - 1.5, wy - 1.5, 19, 25);
    glassPane(g, wx, wy, 16, 22, night, lit);
    g.fillStyle = night ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.75)'; g.fillRect(wx + 7.5, wy, 1, 22); g.fillRect(wx, wy + 9, 16, 1);
    g.fillStyle = css(shade(col, night ? -0.45 : 0.32)); g.fillRect(wx - 2.5, wy + 22, 21, 2.5);
  }
  // letrero
  const sc = rgbOf(sign.c);
  g.fillStyle = night ? '#141018' : css(shade(sc, -0.1)); g.fillRect(x + 4, shop - 14, w - 8, 13);
  if (night) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x + w / 2, shop - 8, w * 0.45, sc, 0.35); g.restore(); }
  ptext(g, sign.t, x + w / 2, shop - 13.5, night ? css(shade(sc, 0.35)) : '#ffffff', 1, { align: 'center', weight: 800 });
  // vitrina y puerta
  const doorX = x + (sign.door ? w - 30 : 10);
  glassPane(g, x + 6, shop + 6, w - 12, 40, night, night && R() < 0.8);
  g.fillStyle = night ? '#0d0f14' : '#3a3f48';
  g.fillRect(x + 4, shop + 2, w - 8, 4); g.fillRect(x + 4, base - 6, w - 8, 6); g.fillRect(x + 4, shop + 2, 2, 44); g.fillRect(x + w - 6, shop + 2, 2, 44);
  g.fillRect(doorX - 1, shop + 6, 2, 40); g.fillRect(doorX + 19, shop + 6, 2, 40);
  g.fillStyle = night ? 'rgba(255,200,120,0.35)' : 'rgba(30,40,60,0.35)'; g.fillRect(doorX + 1, shop + 8, 18, 32);
  g.fillStyle = '#c8ccd2'; g.fillRect(doorX + 3, shop + 26, 14, 1.5);
  // toldo a rayas
  if (sign.awn) {
    const ay = shop + 2, ah = 12;
    g.save(); g.beginPath(); g.moveTo(x + 3, ay); g.lineTo(x + w - 3, ay); g.lineTo(x + w + 1, ay + ah); g.lineTo(x - 1, ay + ah); g.closePath(); g.clip();
    for (let sx = x - 2; sx < x + w + 2; sx += 8) { g.fillStyle = (Math.round((sx - x) / 8) % 2) ? (night ? '#3a3a40' : '#fbfbf6') : css(shade(sign.awn, night ? -0.6 : 0)); g.fillRect(sx, ay, 8, ah); }
    const sh = g.createLinearGradient(0, ay, 0, ay + ah); sh.addColorStop(0, 'rgba(0,0,0,0.25)'); sh.addColorStop(1, 'rgba(255,255,255,0.08)');
    g.fillStyle = sh; g.fillRect(x - 2, ay, w + 4, ah);
    g.restore();
    for (let sx = x - 1; sx < x + w; sx += 8) { g.fillStyle = (Math.round((sx - x + 1) / 8) % 2) ? (night ? '#3a3a40' : '#fbfbf6') : css(shade(sign.awn, night ? -0.6 : -0.05)); g.beginPath(); g.arc(sx + 4, ay + ah, 4, 0, Math.PI); g.fill(); }
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x + 4, ay + ah + 4, w - 8, 3);
  }
}

// ----- Bob's Drive-In -----
function driveInBackground() {
  return pxBackground('drivein', g => {
    // cielo de noche
    const sky = g.createLinearGradient(0, 0, 0, 110);
    sky.addColorStop(0, '#05060f'); sky.addColorStop(1, '#1a1430');
    g.fillStyle = sky; g.fillRect(0, 0, PW, 110);
    stars(g, 0, 0, PW, 70, 120);
    // letrero de ampolletas
    bulbText(g, "BOB'S DRIVE-IN", 37, -3, 7, '#ff5bc0', '#3a0c2a');
    // alero a rayas con luz por debajo
    for (let x = 0; x < PW; x += 16) {
      const ag = g.createLinearGradient(0, 72, 0, 98);
      const c0 = (x / 16) % 2 ? '#ffd2ec' : '#e2343f';
      ag.addColorStop(0, css(shade(c0, 0.15))); ag.addColorStop(1, css(shade(c0, -0.25)));
      g.fillStyle = ag; g.fillRect(x, 72, 16, 26);
    }
    g.fillStyle = '#7a1450'; g.fillRect(0, 96, PW, 6);
    g.fillStyle = '#3a0820'; g.fillRect(0, 70, PW, 3);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let x = 6; x < PW; x += 12) glow(g, x + 1.5, 104.5, 5, '#ffe9a0', 0.55);
    g.restore();
    for (let x = 6; x < PW; x += 12) { g.fillStyle = '#fff6c8'; g.beginPath(); g.arc(x + 1.5, 104.5, 1.4, 0, TAU); g.fill(); }
    // fachada y ventanales iluminados
    const wall = g.createLinearGradient(0, 108, 0, 250);
    wall.addColorStop(0, '#9aa3ad'); wall.addColorStop(1, '#5d6670');
    g.fillStyle = wall; g.fillRect(0, 108, PW, 142);
    const winTop = 116, winBot = 214;
    for (let i = 0; i < 6; i++) {
      const x = 8 + i * 106;
      const wg = g.createLinearGradient(0, winTop, 0, winBot);
      wg.addColorStop(0, '#fff6c4'); wg.addColorStop(0.6, '#f6dc96'); wg.addColorStop(1, '#d9b36e');
      g.fillStyle = wg; g.fillRect(x, winTop, 96, winBot - winTop);
      // lámparas colgantes del local
      for (let k = 0; k < 3; k++) {
        const lx = x + 19 + k * 30;
        g.strokeStyle = '#6b5a40'; g.lineWidth = 0.6; g.beginPath(); g.moveTo(lx, winTop); g.lineTo(lx, winTop + 6); g.stroke();
        g.fillStyle = '#e2343f'; g.beginPath(); g.ellipse(lx, winTop + 8, 6, 3, 0, Math.PI, 0); g.fill();
        g.save(); g.globalCompositeOperation = 'lighter'; glow(g, lx, winTop + 10, 14, '#fff2b0', 0.5); g.restore();
      }
      // mesón y pisos
      const cg = g.createLinearGradient(0, winBot - 28, 0, winBot);
      cg.addColorStop(0, '#c72631'); cg.addColorStop(0.3, '#8e1720'); cg.addColorStop(0.32, '#eef0f2'); cg.addColorStop(1, '#bfc5cc');
      g.fillStyle = cg; g.fillRect(x, winBot - 28, 96, 28);
      // reflejo en el vidrio
      g.fillStyle = 'rgba(255,255,255,0.13)'; g.beginPath(); g.moveTo(x + 6, winTop); g.lineTo(x + 26, winTop); g.lineTo(x + 6, winTop + 40); g.closePath(); g.fill();
    }
    // ventanilla de pedidos
    g.fillStyle = '#ffd34a'; roundRect(g, 262, 118, 70, 16, 3); g.fill(); g.fillStyle = '#d0262f'; roundRect(g, 264, 120, 66, 12, 2); g.fill();
    ptext(g, 'ORDER', 297, 117.5, '#ffffff', 1, { align: 'center', weight: 800 });
    // franja de cuadros bajo los ventanales
    for (let x = 0; x < PW; x += 8) for (let r = 0; r < 2; r++) { g.fillStyle = ((x / 8) + r) % 2 ? '#141414' : '#f4f4f0'; g.fillRect(x, 214 + r * 8, 8, 8); }
    const plinth = g.createLinearGradient(0, 230, 0, 252);
    plinth.addColorStop(0, '#41464e'); plinth.addColorStop(1, '#25282e');
    g.fillStyle = plinth; g.fillRect(0, 230, PW, 22);
    // pilares turquesa cromados
    for (let i = 0; i <= 6; i++) {
      const x = i * 106, pg = g.createLinearGradient(x, 0, x + 8, 0);
      pg.addColorStop(0, '#0f6e68'); pg.addColorStop(0.35, '#7ff1e4'); pg.addColorStop(1, '#127a72');
      g.fillStyle = pg; g.fillRect(x, 102, 8, 150);
    }
    // estacionamiento: asfalto con la luz del local y líneas
    const lot = g.createLinearGradient(0, 252, 0, 362);
    lot.addColorStop(0, '#2b2b33'); lot.addColorStop(1, '#3d3d46');
    g.fillStyle = lot; g.fillRect(0, 252, PW, 110);
    const pool = g.createRadialGradient(320, 252, 10, 320, 252, 380);
    pool.addColorStop(0, 'rgba(255,214,140,0.22)'); pool.addColorStop(1, 'rgba(255,214,140,0)');
    g.fillStyle = pool; g.fillRect(0, 252, PW, 110);
    g.strokeStyle = 'rgba(240,236,220,0.55)'; g.lineWidth = 2;
    for (let x = -40; x < PW + 40; x += 120) { g.beginPath(); g.moveTo(x + 30, 256); g.lineTo(x, 300); g.stroke(); }
    // vereda y solera
    const curb = g.createLinearGradient(0, 360, 0, 384);
    curb.addColorStop(0, '#d6d8dc'); curb.addColorStop(0.25, '#a5a9b0'); curb.addColorStop(1, '#7c8088');
    g.fillStyle = curb; g.fillRect(0, 360, PW, 24);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = 0; x < PW; x += 40) g.fillRect(x, 366, 1, 18);
    // poste para amarrar (bolardo)
    const bo = g.createLinearGradient(28, 0, 44, 0);
    bo.addColorStop(0, '#6c717a'); bo.addColorStop(0.4, '#e6e8ec'); bo.addColorStop(1, '#5b6068');
    g.fillStyle = bo; g.fillRect(28, 342, 16, 20); g.beginPath(); g.ellipse(36, 342, 16, 6, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.3)'; g.beginPath(); g.ellipse(36, 363, 15, 3.5, 0, 0, TAU); g.fill();
  });
}
const DINER_CROWD = [
  [30, '#d02c2c', '#3a2010'], [70, '#1c3ca8', '#000000', 1], [130, '#3cc03c', '#a0602c'], [176, '#e04ab0', '#f0c830', 1],
  [350, '#ffffff', '#000000'], [392, '#9a6ae0', '#6a3c1c', 1], [450, '#ff9a3c', '#000000'], [560, '#3cd0d0', '#d89a60', 1], [600, '#d02c2c', '#000000']
];
const DINER_K = 2.15, DINER_GROUND = 367;      // escala y suelo del auto del rival en primer plano
// o = { car (el auto del rival), carX (su centro), flip, bgCars: [auto, auto] }
function drawDriveIn(g, t, o = {}) {
  blit(g, driveInBackground(), 0, 0);
  // clientes en el mesón y el cocinero
  for (const [x, top, hair, long] of DINER_CROWD) blit(g, pxPerson('client', { top, hair, long, k: 1.15 }), x, 162 + Math.sin(t * 1.3 + x) * 0.8);
  blit(g, pxPerson('cook', { k: 1.2 }), 280, 146);
  // autos estacionados al fondo
  if (o.bgCars) {
    drawCarSide(g, o.bgCars[0], 70, 300, 1.25, { flip: false });
    drawCarSide(g, o.bgCars[1], 560, 304, 1.3, { flip: true });
  }
  // el tipo del poste (sirve para llamar a un rival) y la mesera
  blit(g, pxPerson('post'), 314, 150);
  const wx = o.waitressX ?? (320 + Math.sin(t * 0.45) * 240);
  const w = pxPerson('waitress');
  if (Math.cos(t * 0.45) < 0) { g.save(); g.translate(wx + w.lw, 0); g.scale(-1, 1); blit(g, w, 0, 196); g.restore(); }
  else blit(g, w, wx, 196);
  // el auto del rival, grande en primer plano
  if (o.car) drawCarSide(g, o.car, o.carX ?? 320, DINER_GROUND, DINER_K, { flip: o.flip, reflect: 0.12 });
  vignette(g, 0.35);
}

// Bordes un poco más oscuros (da profundidad a cualquier escena)
function vignette(g, k = 0.45) {
  const v = g.createRadialGradient(PW / 2, PH * 0.45, PH * 0.35, PW / 2, PH * 0.5, PW * 0.72);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${k})`);
  g.fillStyle = v; g.fillRect(0, 0, PW, PH);
}
// Luz de una lámpara: cono cálido que aclara lo que toca
function lampLight(g, x, y, r, color = '255,226,170', a = 0.35) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const l = g.createRadialGradient(x, y, 0, x, y, r);
  l.addColorStop(0, `rgba(${color},${a})`); l.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = l; g.fillRect(x - r, y - r, r * 2, r * 2);
  g.restore();
}

// ----- Barra de estado (abajo): el dinero, lo que está bajo el mouse y la fecha -----
function statusBar(g, left, right = '', mid = '') {
  const y = PH - STATUS_H;
  const bg = g.createLinearGradient(0, y, 0, PH);
  bg.addColorStop(0, 'rgba(18,22,30,0.96)'); bg.addColorStop(1, 'rgba(8,10,14,0.98)');
  g.fillStyle = bg; g.fillRect(0, y, PW, STATUS_H);
  g.fillStyle = 'rgba(255,211,107,0.55)'; g.fillRect(0, y, PW, 1);
  ptext(g, left, 8, y - 0.5, '#8dffa6', 2, { weight: 700 });
  // lo del medio va centrado en el espacio libre; si no cabe, se esconde lo de la derecha
  const lw = left ? textWidth(left, 2, { weight: 700 }) + 22 : 8, mw = mid ? textWidth(mid, 2) : 0;
  let rw = right ? textWidth(right, 2) + 22 : 8;
  if (mid && mw > PW - lw - rw) rw = 8;
  else if (right) ptext(g, right, PW - 8, y - 0.5, '#c9d3dd', 2, { align: 'right' });
  if (mid) ptext(g, mid, lw + Math.max(0, (PW - lw - rw - mw) / 2), y - 0.5, '#ffd36b', 2, { weight: 600 });
}

// Globo de diálogo (como "¡Es tuyo!" del original)
function speechBubble(g, text, x, y, tailX, tailY, o = {}) {
  const lines = wrapText(text, o.maxW || 300, 2);
  const w = Math.max(...lines.map(l => textWidth(l, 2))) + 28, h = lines.length * 20 + 14;
  const bx = clamp(Math.round(x - w / 2), 4, PW - w - 4), by = Math.round(y);
  const tx = clamp(tailX, bx + 14, bx + w - 34);
  g.save();
  g.fillStyle = 'rgba(0,0,0,0.3)'; roundRect(g, bx + 2, by + 4, w, h, 12); g.fill();
  g.fillStyle = '#ffffff'; roundRect(g, bx, by, w, h, 12); g.fill();
  g.beginPath(); g.moveTo(tx, by + h - 1); g.lineTo(tx + 18, by + h - 1); g.lineTo(tailX, tailY); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(30,40,55,0.35)'; g.lineWidth = 1; roundRect(g, bx + 0.5, by + 0.5, w - 1, h - 1, 12); g.stroke();
  g.restore();
  lines.forEach((l, i) => ptext(g, l, bx + w / 2, by + 5 + i * 20, '#1d232c', 2, { align: 'center', weight: 600 }));
}

// Foto de carnet: cara de frente con el peinado de los 60 (licencia de conducir y final)
function pxPortrait(look, w = 110, h = 130) {
  const key = 'portrait:' + JSON.stringify(look) + w;
  let c = PXCACHE.get(key);
  if (c) return c;
  const skin = look.skin || PAL.b5, hair = look.hc || PAL.b1, k = w / 110;
  c = pixelSprite(w, h, g => {
    g.scale(k, k);
    g.fillStyle = look.top || PAL.w; g.beginPath(); g.ellipse(55, 142, 58, 42, 0, 0, TAU); g.fill();
    g.fillStyle = css(shade(skin, -0.12)); g.fillRect(44, 82, 22, 22);
    g.fillStyle = skin; g.beginPath(); g.ellipse(30, 62, 6, 9, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(80, 62, 6, 9, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(55, 60, 25, 31, 0, 0, TAU); g.fill();
    // jopo y patillas
    g.fillStyle = hair; g.beginPath(); g.ellipse(55, 36, 28, 15, 0, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(62, 26, 22, 11, -0.2, 0, TAU); g.fill();
    g.fillRect(28, 36, 7, 22); g.fillRect(75, 36, 7, 22);
    g.fillStyle = css(shade(hair, 0.35)); g.fillRect(50, 21, 22, 3);
    if (look.shades) { g.fillStyle = PAL.k; g.fillRect(36, 54, 38, 11); g.fillStyle = PAL.g4; g.fillRect(40, 56, 8, 2); g.fillRect(60, 56, 8, 2); }
    else {
      g.fillStyle = hair; g.fillRect(40, 51, 11, 3); g.fillRect(59, 51, 11, 3);
      g.fillStyle = PAL.w; g.fillRect(41, 57, 9, 5); g.fillRect(60, 57, 9, 5);
      g.fillStyle = PAL.k; g.fillRect(45, 57, 4, 5); g.fillRect(64, 57, 4, 5);
    }
    g.fillStyle = css(shade(skin, -0.2)); g.fillRect(53, 64, 4, 12);
    g.fillStyle = PAL.r2; g.fillRect(47, 80, 16, 3);
    // cuello de la camisa
    g.fillStyle = css(shade(look.top || PAL.w, -0.15)); g.beginPath(); g.moveTo(40, 102); g.lineTo(55, 112); g.lineTo(70, 102); g.lineTo(66, 98); g.lineTo(55, 106); g.lineTo(44, 98); g.fill();
  }, { outline: false });
  PXCACHE.set(key, c);
  return c;
}
