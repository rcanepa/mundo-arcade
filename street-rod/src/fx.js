// ===== Texturas dibujadas con canvas y partículas (humo de neumáticos, llamas del escape) =====
import * as THREE from 'three';

export { rnd, clamp } from './util.js';

export function canvasTex(w, h, draw, o = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (o.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  if (o.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (o.aniso) t.anisotropy = o.aniso;
  return t;
}
// Mancha redonda que se desvanece hacia afuera (luces, sombras, humo)
export function radialTex(stops, size = 128) {
  return canvasTex(size, size, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    for (const [k, c] of stops) gr.addColorStop(k, c);
    g.fillStyle = gr; g.fillRect(0, 0, w, w);
  });
}

// Partículas como puntos con su propio tamaño y transparencia. scale se ajusta al alto de la pantalla.
export class Particles {
  constructor(parent, o = {}) {
    const max = this.max = o.max || 300;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.size = new Float32Array(max); this.alpha = new Float32Array(max);
    this.life = new Float32Array(max); this.age = new Float32Array(max); this.grow = new Float32Array(max); this.a0 = new Float32Array(max);
    this.drag = o.drag ?? 1.5; this.rise = o.rise ?? 0;
    this.next = 0;
    const geo = this.geo = new THREE.BufferGeometry();
    const attr = (a, n) => new THREE.BufferAttribute(a, n).setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('position', attr(this.pos, 3)); geo.setAttribute('size', attr(this.size, 1)); geo.setAttribute('alpha', attr(this.alpha, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: o.tex }, color: { value: new THREE.Color(o.color ?? 0xffffff) }, scale: { value: 500 } },
      vertexShader: `attribute float size; attribute float alpha; varying float vA; uniform float scale;
        void main() { vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * scale / max(0.1, -mv.z); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 color; varying float vA;
        void main() { vec4 t = texture2D(map, gl_PointCoord); float a = t.a * vA; if (a < 0.004) discard; gl_FragColor = vec4(color * t.rgb, a); }`,
      transparent: true, depthWrite: false, blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.frustumCulled = false; this.points.renderOrder = 5;
    parent.add(this.points);
  }
  emit(x, y, z, vx, vy, vz, size, life, grow = 1, alpha = 1) {
    const i = this.next; this.next = (i + 1) % this.max;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx; this.vel[i * 3 + 1] = vy; this.vel[i * 3 + 2] = vz;
    this.size[i] = size; this.life[i] = life; this.age[i] = 0; this.grow[i] = grow; this.a0[i] = alpha; this.alpha[i] = alpha;
  }
  update(dt) {
    const k = Math.exp(-this.drag * dt);
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.age[i] += dt;
      const t = this.age[i] / this.life[i];
      if (t >= 1) { this.life[i] = 0; this.alpha[i] = 0; continue; }
      const j = i * 3;
      this.vel[j] *= k; this.vel[j + 1] = this.vel[j + 1] * k + this.rise * dt; this.vel[j + 2] *= k;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      this.size[i] += this.grow[i] * dt;
      this.alpha[i] = this.a0[i] * (1 - t) * Math.min(1, t * 6);
    }
    const a = this.geo.attributes;
    a.position.needsUpdate = true; a.size.needsUpdate = true; a.alpha.needsUpdate = true;
  }
  clear() { this.life.fill(0); this.alpha.fill(0); this.geo.attributes.alpha.needsUpdate = true; }
}
