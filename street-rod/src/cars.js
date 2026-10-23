// ===== Autos: imágenes sacadas de modelos 3D de los autos reales, teñidas del color de cada uno =====
// Las imágenes están en assets/cars (build.sh las mete en el HTML como CAR_IMG). Cada vista trae una máscara de la pintura:
// la pintura se renderizó gris, así que se tiñe de cualquier color sin perder brillos, cromados ni vidrios.
const CAR_VIEWS = ['side', 'rear', 'front'];
const CarArt = { img: {}, mask: {}, ready: false, loading: null, cache: new Map(), base: 'assets/cars/' };

const carImgUrl = name => (typeof CAR_IMG !== 'undefined' && CAR_IMG[name]) || CarArt.base + name + '.webp';
// Carga todas las imágenes (una vez). Sin navegador (pruebas) no hace nada y los autos no se dibujan.
function loadCarArt() {
  if (CarArt.loading) return CarArt.loading;
  if (typeof Image === 'undefined') { CarArt.loading = Promise.resolve(); return CarArt.loading; }
  const jobs = [];
  for (const m of MODEL_KEYS) for (const v of CAR_VIEWS) for (const suf of ['', '_mask']) {
    const name = `${m}_${v}${suf}`;
    jobs.push(new Promise(res => {
      const im = new Image();
      im.onload = () => { (suf ? CarArt.mask : CarArt.img)[`${m}_${v}`] = suf ? maskToAlpha(im) : im; res(); };
      im.onerror = () => res();
      im.src = carImgUrl(name);
    }));
  }
  CarArt.loading = Promise.all(jobs).then(() => { CarArt.ready = true; });
  return CarArt.loading;
}
// La máscara (blanco = pintura) pasa a un canvas con la pintura como transparencia
function maskToAlpha(im) {
  const c = makeCanvas(im.naturalWidth, im.naturalHeight), g = c.getContext('2d');
  g.drawImage(im, 0, 0);
  if (!g.getImageData) return c;
  const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4) { p[i + 3] = p[i]; p[i] = p[i + 1] = p[i + 2] = 255; }
  g.putImageData(d, 0, 0);
  return c;
}

// Tiñe la pintura: los medios tonos toman el color; los brillos van al blanco y las sombras al negro
function tintPaint(img, mask, color) {
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const c = makeCanvas(w, h), g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  if (!g.getImageData || !mask) return c;
  const d = g.getImageData(0, 0, w, h), p = d.data;
  const md = mask.getContext('2d').getImageData(0, 0, w, h).data;
  // el tono medio de la pintura de esta imagen (la mediana): ese tono queda exactamente del color pedido
  const hist = new Uint32Array(64);
  let n = 0;
  for (let i = 0; i < p.length; i += 16) if (md[i + 3] > 200) { hist[Math.min(63, ((0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 4) | 0)]++; n++; }
  let acc = 0, mid = 0.42;
  for (let b = 0; b < 64 && n; b++) { acc += hist[b]; if (acc >= n / 2) { mid = clamp((b + 0.5) / 64, 0.2, 0.8); break; } }
  const col = rgbOf(color).map(v => v / 255);
  for (let i = 0; i < p.length; i += 4) {
    const a = md[i + 3] / 255;
    if (a < 0.02) continue;
    const l = (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 255;
    for (let k = 0; k < 3; k++) {
      const v = l <= mid ? col[k] * (l / mid) : col[k] + (1 - col[k]) * Math.pow((l - mid) / (1 - mid), 1.8);
      p[i + k] = p[i + k] * (1 - a) + v * 255 * a;
    }
  }
  g.putImageData(d, 0, 0);
  return c;
}

// Dónde está la pintura en una columna de la vista de lado (para poner calcomanías): [arriba, abajo] en píxeles
function paintSpan(mask, x) {
  const g = mask.getContext('2d'), h = mask.height, col = g.getImageData(Math.round(clamp(x, 0, mask.width - 1)), 0, 1, h).data;
  let top = -1, bot = -1;
  for (let y = 0; y < h; y++) if (col[y * 4 + 3] > 128) { if (top < 0) top = y; bot = y; }
  return top < 0 ? [h * 0.4, h * 0.7] : [top, bot];
}
// Calcomanías sobre la pintura (vista de lado). Se dibujan en el tamaño de la imagen y se recortan con la máscara.
function drawDecals(c, mask, stickers) {
  const g = c.getContext('2d'), w = c.width, h = c.height;
  const lay = makeCanvas(w, h), lg = lay.getContext('2d');
  const at = fx => { const [t, b] = paintSpan(mask, w * fx); return { t, b, m: (t + b) / 2, hh: b - t }; };
  if (stickers.checker) {
    // franja a cuadros a lo largo de la parte baja
    const s = at(0.5), y = s.t + s.hh * 0.62, q = Math.max(4, s.hh * 0.07);
    for (let x = 0, i = 0; x < w; x += q, i++) for (let r = 0; r < 2; r++) { lg.fillStyle = (i + r) % 2 ? '#111' : '#f4f4f4'; lg.fillRect(x, y + r * q, q, q); }
  }
  if (stickers.flames) {
    // llamas desde la nariz hacia atrás
    const s = at(0.86), base = s.t + s.hh * 0.55, len = w * 0.36, x0 = w * 0.985;
    const tongue = (dy, l, th, colr) => {
      lg.fillStyle = colr; lg.beginPath(); lg.moveTo(x0, base + dy - th);
      lg.bezierCurveTo(x0 - l * 0.4, base + dy - th * 1.6, x0 - l * 0.7, base + dy - th * 0.2, x0 - l, base + dy - th * 0.9);
      lg.bezierCurveTo(x0 - l * 0.75, base + dy + th * 0.3, x0 - l * 0.4, base + dy + th * 1.2, x0, base + dy + th); lg.closePath(); lg.fill();
    };
    const th = s.hh * 0.09;
    [[-th * 1.6, len * 0.8], [0, len], [th * 1.7, len * 0.7]].forEach(([dy, l]) => tongue(dy, l, th, '#ffb000'));
    [[-th * 1.6, len * 0.62], [0, len * 0.8], [th * 1.7, len * 0.5]].forEach(([dy, l]) => tongue(dy, l, th * 0.55, '#ff4a12'));
  }
  if (stickers.lightning) {
    const s = at(0.45), y = s.t + s.hh * 0.42, x0 = w * 0.22, x1 = w * 0.78, z = s.hh * 0.08;
    lg.fillStyle = '#ffd400'; lg.beginPath();
    lg.moveTo(x0, y); lg.lineTo(w * 0.45, y - z); lg.lineTo(w * 0.43, y); lg.lineTo(x1, y - z * 0.4); lg.lineTo(w * 0.55, y + z * 1.2); lg.lineTo(w * 0.57, y + z * 0.2); lg.closePath(); lg.fill();
  }
  const door = at(0.5), dy = door.t + door.hh * 0.42, sz = door.hh * 0.22;
  if (stickers.hotrod) {
    lg.font = `italic 900 ${Math.round(sz * 0.9)}px "Futura", "Trebuchet MS", Arial, sans-serif`; lg.textAlign = 'center'; lg.textBaseline = 'middle';
    lg.lineWidth = sz * 0.12; lg.strokeStyle = '#7a0a10'; lg.strokeText('HOT ROD', w * 0.5, dy); lg.fillStyle = '#ffd400'; lg.fillText('HOT ROD', w * 0.5, dy);
  } else if (stickers.number) {
    lg.fillStyle = '#fff'; lg.beginPath(); lg.arc(w * 0.5, dy, sz * 0.75, 0, TAU); lg.fill();
    lg.font = `900 ${Math.round(sz)}px "Futura", "Trebuchet MS", Arial, sans-serif`; lg.textAlign = 'center'; lg.textBaseline = 'middle'; lg.fillStyle = '#111'; lg.fillText('7', w * 0.5, dy + sz * 0.05);
  }
  if (stickers.star) {
    const sx = w * (stickers.hotrod || stickers.number ? 0.62 : 0.5), r = sz * 0.6;
    lg.fillStyle = '#ffd400'; lg.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; lg.lineTo(sx + Math.cos(a) * rr, dy + Math.sin(a) * rr); }
    lg.closePath(); lg.fill();
  }
  lg.globalCompositeOperation = 'destination-in'; lg.drawImage(mask, 0, 0);
  g.globalAlpha = 0.92; g.drawImage(lay, 0, 0); g.globalAlpha = 1;
}

// La imagen lista de un auto (teñida y con calcomanías), guardada para no rehacerla en cada cuadro
function carImage(car, view = 'side') {
  const key = `${car.model}_${view}`, img = CarArt.img[key];
  if (!img) return null;
  const st = car.mods && car.mods.stickers ? Object.keys(car.mods.stickers).filter(k => car.mods.stickers[k]).sort().join(',') : '';
  const ck = `${key}|${car.color}|${view === 'side' ? st : ''}`;
  let c = CarArt.cache.get(ck);
  if (!c) {
    c = tintPaint(img, CarArt.mask[key], car.color);
    if (view === 'side' && st && CarArt.mask[key]) drawDecals(c, CarArt.mask[key], car.mods.stickers);
    CarArt.cache.set(ck, c);
    if (CarArt.cache.size > 80) CarArt.cache.delete(CarArt.cache.keys().next().value);
  }
  return c;
}

// Píxeles (lógicos) por pulgada para que un auto de este largo mida `width` de pantalla
const carScale = (model, width) => width / (MODELS[model].len * 1.04);
// Caja de la vista de lado (para zonas de clic y para ubicar cosas encima)
function carSideBox(car, x, ground, k) {
  const M = MODELS[car.model], meta = CAR_META[car.model];
  const w = M.len * 1.04 * k, h = meta ? w * meta.img.side[1] / meta.img.side[0] : w * 0.33;
  return { x: x - w / 2, y: ground - (meta ? meta.ground : 0.96) * h, w, h };
}
// Dibuja un auto de lado. x = centro, ground = línea del suelo; k = píxeles por pulgada (los autos quedan a escala real).
// o: { flip (mira a la izquierda), shadow, alpha, gray (foto del diario), night (más oscuro), reflect (reflejo en el piso, 0..1) }
function drawCarSide(g, car, x, ground, k, o = {}) {
  const box = carSideBox(car, x, ground, k), c = carImage(car, 'side');
  if (o.shadow !== false) {
    const r = box.w * 0.52, sg = g.createRadialGradient(x, ground, 0, x, ground, r);
    sg.addColorStop(0, 'rgba(0,0,0,0.45)'); sg.addColorStop(0.75, 'rgba(0,0,0,0.16)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(x, ground); g.scale(1, 0.07); g.translate(-x, -ground); g.fillStyle = sg; g.beginPath(); g.arc(x, ground, r, 0, TAU); g.fill(); g.restore();
  }
  if (!c) return box;
  // reflejo en el piso (garaje, asfalto mojado): el auto dado vuelta, tenue y aplastado
  if (o.reflect) {
    g.save();
    g.globalAlpha = o.reflect;
    g.translate(0, ground); g.scale(o.flip ? -1 : 1, -0.55); g.translate(0, -ground);
    if (o.flip) { g.translate(-2 * x, 0); }
    g.drawImage(c, box.x, box.y, box.w, box.h);
    g.restore();
  }
  g.save();
  if (o.alpha !== undefined) g.globalAlpha = o.alpha;
  if (o.gray) g.filter = 'grayscale(1) contrast(1.15) brightness(1.05)';
  else if (o.night) g.filter = 'brightness(0.66) saturate(0.85)';
  if (o.flip) { g.translate(x, 0); g.scale(-1, 1); g.translate(-x, 0); }
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(c, box.x, box.y, box.w, box.h);
  g.restore();
  return box;
}
// De atrás (la carrera): cx = centro, ground = suelo, w = ancho en pantalla. brake = luces de freno encendidas.
function drawCarRear(g, car, cx, ground, w, brake) {
  const meta = CAR_META[car.model], c = carImage(car, 'rear');
  const h = meta ? w * meta.img.rear[1] / meta.img.rear[0] : w * 0.8, top = ground - h * 0.965;
  if (c) { g.imageSmoothingEnabled = true; g.drawImage(c, cx - w / 2, top, w, h); }
  if (brake) {
    const lights = meta && meta.tail.length ? meta.tail : [[0.1, 0.5, 0.2, 0.58], [0.8, 0.5, 0.9, 0.58]];
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [x0, y0, x1, y1] of lights) {
      const lx = cx - w / 2 + (x0 + x1) / 2 * w, ly = top + (y0 + y1) / 2 * h, r = Math.max(2, Math.max(x1 - x0, y1 - y0) * w * 1.6);
      const gl = g.createRadialGradient(lx, ly, 0, lx, ly, r);
      gl.addColorStop(0, 'rgba(255,90,70,0.95)'); gl.addColorStop(0.4, 'rgba(255,20,10,0.5)'); gl.addColorStop(1, 'rgba(255,0,0,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(lx, ly, r, 0, TAU); g.fill();
    }
    g.restore();
  }
  return { x: cx - w / 2, y: top, w, h };
}
// De frente (el tráfico que viene en contra), con los focos encendidos
function drawCarFrontView(g, car, cx, ground, w, lights = 1) {
  const meta = CAR_META[car.model], c = carImage(car, 'front');
  const h = meta ? w * meta.img.front[1] / meta.img.front[0] : w * 0.8, top = ground - h * 0.965;
  if (c) { g.imageSmoothingEnabled = true; g.drawImage(c, cx - w / 2, top, w, h); }
  if (lights) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const fx of [0.2, 0.8]) {
      const lx = cx - w / 2 + fx * w, ly = top + h * 0.55, r = w * 0.22;
      const gl = g.createRadialGradient(lx, ly, 0, lx, ly, r);
      gl.addColorStop(0, `rgba(255,250,220,${0.9 * lights})`); gl.addColorStop(0.3, `rgba(255,240,190,${0.35 * lights})`); gl.addColorStop(1, 'rgba(255,240,190,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(lx, ly, r, 0, TAU); g.fill();
    }
    g.restore();
  }
}
