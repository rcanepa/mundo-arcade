// Tiñe la pintura de un auto renderizado: los medios tonos toman el color; las luces y sombras se conservan
function tintCar(img, mask, color) {
  const w = img.width, h = img.height, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, w, h);
  const mc = document.createElement('canvas'); mc.width = w; mc.height = h; const mg = mc.getContext('2d'); mg.drawImage(mask, 0, 0);
  const m = mg.getImageData(0, 0, w, h).data, p = d.data;
  const col = [parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16)].map(v => v / 255);
  const mid = 0.42;   // luminancia de la pintura gris de referencia
  for (let i = 0; i < p.length; i += 4) {
    const a = m[i] / 255;
    if (a < 0.02) continue;
    const l = (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 255;
    for (let k = 0; k < 3; k++) {
      const v = l <= mid ? col[k] * (l / mid) : col[k] + (1 - col[k]) * Math.pow((l - mid) / (1 - mid), 1.6);
      p[i + k] = p[i + k] * (1 - a) + v * 255 * a;
    }
  }
  g.putImageData(d, 0, 0);
  return c;
}
