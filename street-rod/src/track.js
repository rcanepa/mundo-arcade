// ===== Pista: la línea central muestreada cada pocos metros, con su ancho, altura y curvatura =====
import * as THREE from 'three';

export class Track {
  // pts: puntos de control [x, y, z]. closed: circuito cerrado. step: metros entre muestras.
  constructor(pts, { closed = false, width = 9, step = 2 } = {}) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), closed, 'catmullrom', 0.5);
    const n0 = Math.max(8, Math.round(curve.getLength() / step));
    const P = curve.getSpacedPoints(n0);
    if (closed) P.pop();
    const n = this.n = P.length;
    this.closed = closed; this.width = width; this.hw = width / 2;
    this.x = new Float32Array(n); this.y = new Float32Array(n); this.z = new Float32Array(n);
    this.tx = new Float32Array(n); this.tz = new Float32Array(n); this.s = new Float32Array(n); this.k = new Float32Array(n);
    for (let i = 0; i < n; i++) { this.x[i] = P[i].x; this.y[i] = P[i].y; this.z[i] = P[i].z; }
    let acc = 0;
    for (let i = 0; i < n; i++) {
      this.s[i] = acc;
      const j = this.wrap(i + 1);
      if (closed || i < n - 1) acc += Math.hypot(this.x[j] - this.x[i], this.y[j] - this.y[i], this.z[j] - this.z[i]);
    }
    this.length = acc; this.ds = acc / (closed ? n : n - 1);
    // dirección (diferencia centrada) y curvatura (cuánto gira la dirección por metro)
    for (let i = 0; i < n; i++) {
      const a = this.wrap(i - 1), b = this.wrap(i + 1);
      const dx = this.x[b] - this.x[a], dz = this.z[b] - this.z[a], l = Math.hypot(dx, dz) || 1;
      this.tx[i] = dx / l; this.tz[i] = dz / l;
    }
    const raw = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = this.wrap(i - 2), b = this.wrap(i + 2);
      const cross = this.tx[a] * this.tz[b] - this.tz[a] * this.tx[b], dot = this.tx[a] * this.tx[b] + this.tz[a] * this.tz[b];
      raw[i] = Math.abs(Math.atan2(cross, dot)) / (4 * this.ds);
    }
    for (let i = 0; i < n; i++) { let m = 0; for (let d = -3; d <= 3; d++) m += raw[this.wrap(i + d)]; this.k[i] = m / 7; }
    this.q = { i: 0, s: 0, lat: 0, y: 0, tx: 0, tz: 1 };
  }
  wrap(i) { return this.closed ? ((i % this.n) + this.n) % this.n : Math.max(0, Math.min(this.n - 1, i)); }
  // El punto de la pista más cercano a (x, z). hint: la muestra de la vez anterior (busca cerca de ahí).
  // Devuelve { i, s (metros recorridos), lat (al costado: + derecha), y (altura), tx, tz (dirección) }. El objeto se reutiliza.
  query(x, z, hint = -1, out = this.q) {
    let best = 0, bd = Infinity;
    const scan = (i) => { const dx = x - this.x[i], dz = z - this.z[i], d = dx * dx + dz * dz; if (d < bd) { bd = d; best = i; } };
    if (hint < 0) for (let i = 0; i < this.n; i++) scan(i);
    else for (let d = -40; d <= 40; d++) scan(this.wrap(hint + d));
    // se proyecta sobre el tramo hacia la muestra vecina para que no salte de a 2 m
    const i = best, j = this.wrap(i + 1), h = this.wrap(i - 1);
    const seg = (a, b) => {
      const ex = this.x[b] - this.x[a], ez = this.z[b] - this.z[a], l2 = ex * ex + ez * ez || 1;
      return Math.max(0, Math.min(1, ((x - this.x[a]) * ex + (z - this.z[a]) * ez) / l2));
    };
    let a = i, b = j, t = seg(i, j);
    if (t <= 0 && (this.closed || i > 0)) { a = h; b = i; t = seg(h, i); }
    const cx = this.x[a] + (this.x[b] - this.x[a]) * t, cz = this.z[a] + (this.z[b] - this.z[a]) * t;
    const tx = this.tx[a] + (this.tx[b] - this.tx[a]) * t, tz = this.tz[a] + (this.tz[b] - this.tz[a]) * t, tl = Math.hypot(tx, tz) || 1;
    out.i = best; out.tx = tx / tl; out.tz = tz / tl;
    out.s = this.s[a] + (b === 0 && a === this.n - 1 ? this.ds : this.s[b] - this.s[a]) * t;
    out.y = this.y[a] + (this.y[b] - this.y[a]) * t;
    out.lat = (x - cx) * -out.tz + (z - cz) * out.tx;
    return out;
  }
  // Posición y dirección a s metros del comienzo
  at(s, out = {}) {
    if (this.closed) s = ((s % this.length) + this.length) % this.length; else s = Math.max(0, Math.min(this.length, s));
    const f = s / this.ds, i = Math.min(this.n - 1, Math.floor(f)), j = this.wrap(i + 1), t = f - i;
    out.x = this.x[i] + (this.x[j] - this.x[i]) * t; out.y = this.y[i] + (this.y[j] - this.y[i]) * t; out.z = this.z[i] + (this.z[j] - this.z[i]) * t;
    out.tx = this.tx[i] + (this.tx[j] - this.tx[i]) * t; out.tz = this.tz[i] + (this.tz[j] - this.tz[i]) * t;
    const l = Math.hypot(out.tx, out.tz) || 1; out.tx /= l; out.tz /= l;
    out.rx = -out.tz; out.rz = out.tx;      // a la derecha
    out.k = this.k[i];
    return out;
  }
  curvature(s) { return this.at(s, this._c || (this._c = {})).k; }
}
