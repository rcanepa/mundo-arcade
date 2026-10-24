// ===== El mundo de noche: cielo, luna, la recta de picadas o la ruta por los cerros, faroles, árboles y el pueblo =====
import * as THREE from 'three';
import { Track } from './track.js';
import { buildCar } from './car.js';
import { noUpgrades, MODEL_KEYS } from './data.js';
import { canvasTex, radialTex, rnd, clamp } from './fx.js';

export const DRAG_LEN = 402.3;     // un cuarto de milla
export const LANE = 2.4;           // centro de cada pista de la recta (la derecha es x negativa)
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const glowColor = (r, g, b, k) => new THREE.Color(r, g, b).multiplyScalar(k);

// ----- reflejos de la pintura: un cielo oscuro con algunas luces cálidas -----
export function nightEnvironment(renderer) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y; vec3 c = mix(vec3(0.05,0.045,0.07), vec3(0.012,0.016,0.04), smoothstep(0.0, 0.6, h)); c += vec3(0.18,0.09,0.1) * exp(-abs(h) * 10.0) * 0.5; if (h < -0.02) c = vec3(0.012); gl_FragColor = vec4(c, 1.0); }'
  })));
  const warm = new THREE.MeshBasicMaterial({ color: glowColor(1, 0.72, 0.42, 7) }), cool = new THREE.MeshBasicMaterial({ color: glowColor(0.6, 0.7, 1, 3) });
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2, m = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.4), i === 3 ? cool : warm);
    m.position.set(Math.cos(a) * 30, 14 + (i % 3) * 5, Math.sin(a) * 30); m.lookAt(0, 0, 0); s.add(m);
  }
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.03).texture;
  pm.dispose();
  return tex;
}

// ----- cielo (sigue a la cámara), estrellas y luna -----
function makeSky() {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vP; void main(){
      float h = vP.y;
      vec3 c = mix(vec3(0.045,0.032,0.07), vec3(0.004,0.006,0.022), smoothstep(-0.02, 0.45, h));
      c += vec3(0.2,0.08,0.1) * exp(-abs(h) * 16.0) * 0.55;
      gl_FragColor = vec4(c, 1.0); }`
  })));
  const N = 1800, p = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, y = Math.pow(Math.random(), 0.7) * 0.95 + 0.03, r = Math.sqrt(1 - y * y);
    p.set([Math.cos(a) * r * 2400, y * 2400, Math.sin(a) * r * 2400], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false })));
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex([[0, 'rgba(255,250,235,1)'], [0.16, 'rgba(255,248,230,1)'], [0.2, 'rgba(200,210,255,0.35)'], [0.5, 'rgba(120,140,220,0.08)'], [1, 'rgba(0,0,0,0)']], 256), color: glowColor(1, 1, 1, 2.2), depthWrite: false, fog: false }));
  moon.position.copy(MOON_DIR).multiplyScalar(2200); moon.scale.setScalar(330);
  g.add(moon);
  g.traverse(o => { o.frustumCulled = false; o.renderOrder = -10; });
  return g;
}
const MOON_DIR = new THREE.Vector3(-0.45, 0.42, 0.79).normalize();

// ----- texturas del camino -----
function roadTex(kind, aniso) {
  return canvasTex(256, 512, (g, w, h) => {
    g.fillStyle = '#2b2c31'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = Math.random(); g.fillStyle = v < 0.5 ? `rgba(0,0,0,${v * 0.25})` : `rgba(255,255,255,${(v - 0.5) * 0.09})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2); }
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(w * 0.18, 0, w * 0.12, h); g.fillRect(w * 0.7, 0, w * 0.12, h);
    g.fillStyle = '#e9e7df'; g.fillRect(6, 0, 6, h); g.fillRect(w - 12, 0, 6, h);
    if (kind === 'drag') { g.fillRect(w / 2 - 3, 0, 6, h); }
    else { g.fillStyle = '#e8b830'; g.fillRect(w / 2 - 7, 0, 5, h * 0.5); g.fillRect(w / 2 + 2, 0, 5, h * 0.5); }
  }, { repeat: true, aniso });
}
function noiseTex(base, spots, aniso, size = 256) {
  return canvasTex(size, size, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < size * 30; i++) { g.fillStyle = spots[Math.floor(Math.random() * spots.length)]; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 3); }
  }, { repeat: true, aniso });
}

// Cinta que sigue la pista entre dos distancias al costado (a, b). dyA/dyB: bajar los bordes.
function ribbon(track, a, b, mat, o = {}) {
  const n = track.n, count = track.closed ? n + 1 : n, from = o.from ?? 0, to = o.to ?? count;
  const vs = o.vScale ?? 1 / 12, lift = o.lift ?? 0.02;
  const pos = [], uv = [], idx = [];
  for (let k = from; k < to; k++) {
    const i = k % n, rx = -track.tz[i], rz = track.tx[i], x = track.x[i], z = track.z[i], y = track.y[i] + lift;
    pos.push(x + rx * a, y + (o.dyA || 0), z + rz * a, x + rx * b, y + (o.dyB || 0), z + rz * b);
    const s = k >= n ? track.length : track.s[i];
    uv.push(0, s * vs, 1, s * vs);
    if (k > from) { const q = (k - from - 1) * 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat); m.receiveShadow = true;
  return m;
}

// Faroles: poste, brazo, foco encendido y la mancha de luz en el suelo. pts: [x, y, z, dirX, dirZ] (hacia dónde mira el brazo)
function lampPosts(G, pts, groundY) {
  const n = pts.length, d = new THREE.Object3D();
  const pole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.16, 8, 8).translate(0, 4, 0), new THREE.MeshStandardMaterial({ color: 0x3a3e46, metalness: 0.5, roughness: 0.5 }), n);
  const arm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.1, 2.2).translate(0, 7.9, 1.1), pole.material, n);
  const headG = new THREE.CylinderGeometry(0.42, 0.3, 0.22, 12).translate(0, 7.8, 2.1);
  const head = new THREE.InstancedMesh(headG, new THREE.MeshBasicMaterial({ color: glowColor(1, 0.78, 0.48, 3.2) }), n);
  const pool = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: radialTex([[0, 'rgba(255,190,120,0.3)'], [0.45, 'rgba(255,170,100,0.1)'], [1, 'rgba(255,160,90,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }), n);
  const out = [];
  pts.forEach(([x, y, z, dx, dz], i) => {
    d.position.set(x, y, z); d.rotation.set(0, Math.atan2(dx, dz), 0); d.scale.set(1, 1, 1); d.updateMatrix();
    pole.setMatrixAt(i, d.matrix); arm.setMatrixAt(i, d.matrix); head.setMatrixAt(i, d.matrix);
    const lx = x + dx * 2.1, lz = z + dz * 2.1;
    d.position.set(lx, groundY(lx, lz) + 0.05, lz); d.rotation.set(0, 0, 0); d.scale.set(17, 1, 17); d.updateMatrix(); pool.setMatrixAt(i, d.matrix);
    out.push(new THREE.Vector3(lx, y + 7.5, lz));
  });
  pool.renderOrder = 2;
  G.add(pole, arm, head, pool);
  return out;
}
// Pinos de pocas caras y rocas, repartidos lejos del camino
function forest(G, count, place, heightAt) {
  const cone = new THREE.InstancedMesh(new THREE.ConeGeometry(2.3, 7.5, 7).translate(0, 5.4, 0), new THREE.MeshStandardMaterial({ color: 0x1d3a26, roughness: 0.95, flatShading: true }), count);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.22, 0.32, 2, 6).translate(0, 1, 0), new THREE.MeshStandardMaterial({ color: 0x3a2618, roughness: 1 }), count);
  const d = new THREE.Object3D(), col = new THREE.Color();
  let k = 0;
  for (let tries = 0; k < count && tries < count * 20; tries++) {
    const p = place(); if (!p) continue;
    const s = rnd(0.7, 1.5);
    d.position.set(p[0], heightAt(p[0], p[1]) - 0.2, p[1]); d.rotation.set(0, rnd(0, 6.3), 0); d.scale.set(s, s * rnd(0.85, 1.25), s); d.updateMatrix();
    cone.setMatrixAt(k, d.matrix); trunk.setMatrixAt(k, d.matrix);
    cone.setColorAt(k, col.setHSL(rnd(0.33, 0.4), rnd(0.25, 0.4), rnd(0.1, 0.16)));
    k++;
  }
  cone.count = trunk.count = k;
  G.add(cone, trunk);
}
function palms(G, pts, heightAt) {
  const n = pts.length, d = new THREE.Object3D();
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.26, 9, 7).translate(0, 4.5, 0), new THREE.MeshStandardMaterial({ color: 0x5a4430, roughness: 1 }), n);
  const leafG = new THREE.ConeGeometry(0.9, 4.2, 4).rotateZ(Math.PI / 2 + 0.5).translate(2.1, 8.4, 0);
  const leaves = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ color: 0x1f4a2a, roughness: 0.9, flatShading: true }), n * 7);
  pts.forEach(([x, z], i) => {
    const y = heightAt(x, z);
    d.position.set(x, y, z); d.rotation.set(rnd(-0.05, 0.05), 0, rnd(-0.06, 0.06)); d.scale.setScalar(rnd(0.9, 1.2)); d.updateMatrix(); trunk.setMatrixAt(i, d.matrix);
    for (let j = 0; j < 7; j++) { d.rotation.set(0, j / 7 * Math.PI * 2 + i, 0); d.updateMatrix(); leaves.setMatrixAt(i * 7 + j, d.matrix); }
  });
  G.add(trunk, leaves);
}
// Cerros lejanos: una cinta de siluetas suaves alrededor de todo, y luces de pueblos en el horizonte
function horizon(G, cx, cz) {
  const N = 220, R = 1700, pos = [], idx = [];
  const ridge = (a, k) => 70 + 90 * k + 60 * Math.sin(a * 3 + k * 2) + 45 * Math.sin(a * 7.3 + 1 + k) + 22 * Math.sin(a * 17 + k * 3) + 10 * Math.sin(a * 41);
  for (let layer = 0; layer < 2; layer++) {
    const r = R + layer * 260, base = pos.length / 3;
    for (let i = 0; i <= N; i++) {
      const a = i / N * Math.PI * 2, h = ridge(a, layer) * (layer ? 1.35 : 1);
      pos.push(cx + Math.cos(a) * r, -60, cz + Math.sin(a) * r, cx + Math.cos(a) * r, h, cz + Math.sin(a) * r);
      if (i) { const q = base + (i - 1) * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const cols = []; for (let i = 0; i < pos.length / 3; i++) { const top = pos[i * 3 + 1] > 0, far = i >= (N + 1) * 2; cols.push(...(far ? (top ? [0.05, 0.045, 0.1] : [0.03, 0.03, 0.06]) : (top ? [0.03, 0.03, 0.055] : [0.012, 0.012, 0.02]))); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false }));
  m.renderOrder = -5; G.add(m);
  const NL = 260, p = new Float32Array(NL * 3);
  for (let i = 0; i < NL; i++) { const a = rnd(1.2, 2.6) + (i % 2) * 2.6, r = rnd(1100, 1400); p.set([cx + Math.cos(a) * r, rnd(2, 25), cz + Math.sin(a) * r], i * 3); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(p, 3));
  G.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: glowColor(1, 0.75, 0.45, 2), size: 2.2, sizeAttenuation: false, fog: false })));
}
// Letrero de neón (texto con brillo)
function neon(text, color, w = 1024, h = 256) {
  const tex = canvasTex(w, h, (g) => {
    g.font = `italic 900 ${h * 0.62}px "Avenir Next", "Helvetica Neue", Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = color; g.shadowBlur = h * 0.12; g.strokeStyle = color; g.lineWidth = h * 0.05; g.strokeText(text, w / 2, h / 2);
    g.shadowBlur = h * 0.05; g.fillStyle = '#fff6fb'; g.fillText(text, w / 2, h / 2);
  });
  return new THREE.MeshBasicMaterial({ map: tex, transparent: true, color: glowColor(1, 1, 1, 2.6), depthWrite: false, side: THREE.DoubleSide });
}
function windowsTex() {
  return canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#1b1820'; g.fillRect(0, 0, w, h);
    for (let y = 10; y < h - 10; y += 30) for (let x = 8; x < w - 8; x += 28) { g.fillStyle = Math.random() < 0.6 ? '#ffcf7a' : '#2a2a38'; g.fillRect(x, y, 16, 18); }
  });
}
function building(G, x, z, w, d, h, rotY, lit = true) {
  const tex = windowsTex(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 5)));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: 0x2a2630, roughness: 0.9, emissive: lit ? 0xffffff : 0x000000, emissiveMap: tex, emissiveIntensity: 1.6 }));
  m.position.set(x, h / 2, z); m.rotation.y = rotY; G.add(m);
  return m;
}

// =================== la recta de picadas ===================
function buildDrag(G, aniso) {
  const track = new Track([[0, 0, -70], [0, 0, DRAG_LEN + 330]], { width: 9.6, step: 2 });
  const heightAt = () => 0;
  const asphalt = new THREE.MeshStandardMaterial({ map: roadTex('drag', aniso), roughness: 0.82 });
  asphalt.map.repeat.set(1, 1);
  G.add(ribbon(track, -track.hw, track.hw, asphalt));
  // la losa de concreto de la largada, con las marcas de goma
  const pad = canvasTex(256, 1024, (g, w, h) => {
    g.fillStyle = '#5d5b57'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 12000; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    for (const cx of [w * 0.25, w * 0.75]) for (const off of [-30, 30]) {
      const gr = g.createLinearGradient(0, h, 0, 0); gr.addColorStop(0, 'rgba(8,8,8,0.92)'); gr.addColorStop(0.55, 'rgba(10,10,10,0.6)'); gr.addColorStop(1, 'rgba(10,10,10,0)');
      g.fillStyle = gr; g.fillRect(cx + off - 11, 0, 22, h);
    }
    g.fillStyle = '#e9e7df'; g.fillRect(w / 2 - 3, 0, 6, h); g.fillRect(6, 0, 6, h); g.fillRect(w - 12, 0, 6, h);
  }, { aniso });
  const padM = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 150).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: pad, roughness: 0.75 }));
  padM.position.set(0, 0.03, 15); padM.rotation.y = Math.PI; G.add(padM);
  const line = (z, tex, depth) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(9.6, depth).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); m.position.set(0, 0.04, z); G.add(m); };
  line(0, canvasTex(8, 8, (g) => { g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, 8, 8); }), 0.3);
  line(DRAG_LEN, canvasTex(64, 8, (g) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#f2f0ea'; g.fillRect(i * 4, j * 4, 4, 4); } }), 0.8);
  // pasto alrededor
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: noiseTex('#16211a', ['#111a14', '#1c2a1f', '#202a1b'], aniso), roughness: 1 }));
  grass.material.map.repeat.set(400, 400); grass.position.set(0, -0.02, 300); G.add(grass);
  // muros de concreto a los dos lados
  const jersey = new THREE.Shape(); jersey.moveTo(-0.32, 0); jersey.lineTo(0.32, 0); jersey.lineTo(0.12, 0.3); jersey.lineTo(0.09, 0.85); jersey.lineTo(-0.09, 0.85); jersey.lineTo(-0.12, 0.3); jersey.closePath();
  const wallTex = canvasTex(512, 64, (g, w, h) => { g.fillStyle = '#9c9890'; g.fillRect(0, 0, w, h); g.fillStyle = '#d02c3a'; g.fillRect(0, 0, w, 10); for (let x = 0; x < w; x += 64) { g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(x, 0, 2, h); } }, { repeat: true, aniso });
  wallTex.repeat.set(0.25, 1);
  const wallG = new THREE.ExtrudeGeometry(jersey, { depth: 800, bevelEnabled: false, steps: 1 });
  for (const sx of [-1, 1]) { const m = new THREE.Mesh(wallG, new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9 })); m.position.set(sx * 6.2, 0, -70); G.add(m); }
  // faroles
  const lampPts = [];
  for (let z = -50; z < DRAG_LEN + 330; z += 38) for (const sx of [-1, 1]) lampPts.push([sx * 7.4, 0, z, -sx, 0]);
  const lamps = lampPosts(G, lampPts, heightAt);
  // el árbol de largada
  const tree = christmasTree(G);
  // pórtico de la meta y tableros de tiempos
  const post = new THREE.MeshStandardMaterial({ color: 0x30343c, metalness: 0.6, roughness: 0.4 });
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 0.4), post); p.position.set(sx * 6.9, 3.5, DRAG_LEN); G.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(14.2, 1.3, 0.5), post); beam.position.set(0, 7.2, DRAG_LEN); G.add(beam);
  const meta = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 1.6), neon('META', '#ff3b8d', 512, 128)); meta.position.set(0, 7.2, DRAG_LEN - 0.27); meta.rotation.y = Math.PI; G.add(meta);
  const boards = [-1, 1].map(sx => timingBoard(G, sx * 9.5, DRAG_LEN - 30));
  // tribuna con público a la izquierda
  const stand = new THREE.MeshStandardMaterial({ color: 0x55504a, roughness: 0.9 });
  const crowd = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.22, 0.5, 3, 6), new THREE.MeshStandardMaterial({ roughness: 0.8 }), 260);
  const d = new THREE.Object3D(), col = new THREE.Color(); let k = 0;
  for (let row = 0; row < 7; row++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5 * (row + 1), 70), stand);
    step.position.set(9.6 + row * 1.2, 0.25 * (row + 1), 20); G.add(step);
    for (let z = -12; z < 52 && k < 260; z += rnd(1.2, 3.5)) {
      d.position.set(9.6 + row * 1.2, 0.5 * (row + 1) + 0.47, z); d.rotation.set(0, rnd(-0.4, 0.4), 0); d.updateMatrix();
      crowd.setMatrixAt(k, d.matrix); crowd.setColorAt(k, col.setHSL(Math.random(), rnd(0.25, 0.5), rnd(0.18, 0.34))); k++;
    }
  }
  crowd.count = k; G.add(crowd);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 72), post); roof.position.set(13.5, 6.4, 20); G.add(roof);
  // letrero de neón
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), neon("BOB'S DRAGWAY", '#ff3b8d'));
  sign.position.set(14, 9.6, 70); sign.rotation.y = -Math.PI / 2 - 0.5; G.add(sign);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.3, 9, 0.3), post); frame.position.set(14, 4.5, 70); G.add(frame);
  // autos estacionados detrás del muro de la derecha
  const cols = ['#1a8a8a', '#e8d8a8', '#2c4a8a', '#7a1c2c', '#d06018', '#f2f0e8'];
  for (let i = 0; i < 6; i++) {
    const c = buildCar({ model: MODEL_KEYS[(i * 3) % MODEL_KEYS.length], color: cols[i], decal: 'none', up: noUpgrades() });
    c.root.position.set(-13 - (i % 2) * 6.5, 0, -10 + i * 9); c.root.rotation.y = Math.PI / 2 + rnd(-0.2, 0.2);
    c.head.emissiveIntensity = 0; G.add(c.root);
  }
  palms(G, Array.from({ length: 26 }, (_, i) => [(i % 2 ? 1 : -1) * rnd(26, 40), -40 + i * 30]), heightAt);
  forest(G, 400, () => { const x = rnd(-700, 700), z = rnd(-500, 1100); return Math.abs(x) > 45 ? [x, z] : null; }, heightAt);
  horizon(G, 0, 300);
  return { track, heightAt, lamps, tree, boards, rails: null, startS: 70 };
}
// El árbol: amarillas de pre-stage y stage, tres ámbar, verde y roja, una columna por pista
function christmasTree(G) {
  const T = new THREE.Group(); T.position.set(0, 0, 7); T.rotation.y = Math.PI; G.add(T);
  const dark = new THREE.MeshStandardMaterial({ color: 0x15161a, metalness: 0.4, roughness: 0.5 });
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), dark); pole.position.y = 1.3; T.add(pole);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.1, 0.25), dark); box.position.y = 2.45; T.add(box);
  const kinds = [['pre', 0xffd24a, 3.3, 0.07], ['stage', 0xffd24a, 3.15, 0.07], ['a1', 0xffa018, 2.9, 0.1], ['a2', 0xffa018, 2.62, 0.1], ['a3', 0xffa018, 2.34, 0.1], ['green', 0x30ff60, 2.04, 0.11], ['red', 0xff2020, 1.76, 0.11]];
  const bulbs = {};
  for (const lane of [-1, 1]) {
    // lane -1 = pista derecha (x negativa); el árbol está girado, así que su x local positiva es la x negativa del mundo
    for (const [k, c, y, r] of kinds) {
      const m = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: c, emissiveIntensity: 0.04 });
      const b = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m);
      b.position.set(-lane * 0.24, y - 0.75, 0.14); T.add(b);
      bulbs[lane + k] = m;
    }
  }
  return {
    set(lane, k, on) { const m = bulbs[lane + k]; if (m) m.emissiveIntensity = on ? (k === 'pre' || k === 'stage' ? 3 : 7) : 0.04; },
    reset() { for (const k in bulbs) bulbs[k].emissiveIntensity = 0.04; }
  };
}
function timingBoard(G, x, z) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, color: glowColor(1, 1, 1, 1.6) });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), mat); m.position.set(x, 5.2, z); m.rotation.y = Math.PI; G.add(m);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.8, 0.25), new THREE.MeshStandardMaterial({ color: 0x30343c })); legs.position.set(x, 1.9, z + 0.2); G.add(legs);
  const draw = (a, b) => {
    const g = c.getContext('2d'); g.fillStyle = '#07080b'; g.fillRect(0, 0, 512, 256);
    g.font = '700 110px "SF Mono", Menlo, Consolas, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffb02e'; g.fillText(a, 256, 80); g.fillStyle = '#ff5a3c'; g.font = '700 80px "SF Mono", Menlo, Consolas, monospace'; g.fillText(b, 256, 190);
    tex.needsUpdate = true;
  };
  draw('--.---', '---');
  return { set: draw };
}

// =================== la ruta por los cerros ===================
const ROAD_PTS = [
  [0, 0, -120], [0, 0, 60], [0, 0.5, 240], [-25, 2.5, 330], [-90, 6, 392], [-180, 10, 402], [-252, 14, 352], [-272, 16, 272],
  [-232, 15, 202], [-262, 13, 132], [-332, 10, 92], [-382, 8, 20], [-362, 7, -62], [-302, 6, -72], [-262, 5, -22],
  [-202, 3, -62], [-150, 2, -150], [-80, 1, -200], [-25, 0, -190]
];
function buildRoad(G, aniso) {
  const track = new Track(ROAD_PTS, { closed: true, width: 9, step: 2 });
  const hw = track.hw;
  // grilla para encontrar rápido la muestra de pista más cercana
  const CELL = 24, grid = new Map(), key = (i, j) => i * 100003 + j;
  for (let i = 0; i < track.n; i++) { const k = key(Math.floor(track.x[i] / CELL), Math.floor(track.z[i] / CELL)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); }
  const nearest = (x, z) => {
    const ci = Math.floor(x / CELL), cj = Math.floor(z / CELL);
    let best = -1, bd = Infinity;
    for (let r = 0; r <= 4 && (best < 0 || r <= 2); r++) for (let i = ci - r; i <= ci + r; i++) for (let j = cj - r; j <= cj + r; j++) {
      if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r) continue;
      const l = grid.get(key(i, j)); if (!l) continue;
      for (const s of l) { const dx = x - track.x[s], dz = z - track.z[s], d = dx * dx + dz * dz; if (d < bd) { bd = d; best = s; } }
    }
    return best < 0 ? { i: 0, d: 999 } : { i: best, d: Math.sqrt(bd) };
  };
  const hills = (x, z) => 26 * (0.5 + 0.5 * Math.sin(x * 0.0061 + 1.3) * Math.cos(z * 0.0052 - 0.4)) + 9 * Math.sin(x * 0.013 + z * 0.011) + 4 * Math.sin(x * 0.031 - z * 0.027);
  const heightAt = (x, z) => {
    const { i, d } = nearest(x, z);
    return track.y[i] - 0.28 + smooth(hw + 12, hw + 170, d) * Math.max(0, hills(x, z) + 4) * 0.85;
  };
  // terreno
  const SIZE = 1700, SEG = 210, cx = -190, cz = 100;
  const tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG).rotateX(-Math.PI / 2);
  const pa = tg.attributes.position, colors = new Float32Array(pa.count * 3), col = new THREE.Color();
  for (let i = 0; i < pa.count; i++) {
    const x = pa.getX(i) + cx, z = pa.getZ(i) + cz, y = heightAt(x, z);
    pa.setXYZ(i, x, y, z);
    const n = 0.5 + 0.5 * Math.sin(x * 0.07) * Math.cos(z * 0.06);
    col.setHSL(0.24 + n * 0.08, 0.32, 0.075 + n * 0.035 + clamp(y / 300, 0, 0.05)); colors.set([col.r, col.g, col.b], i * 3);
  }
  tg.setAttribute('color', new THREE.BufferAttribute(colors, 3)); tg.computeVertexNormals();
  const ground = new THREE.Mesh(tg, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, map: noiseTex('#d8d8d8', ['#bcbcbc', '#e8e8e8', '#a8a8a8'], aniso) }));
  ground.material.map.repeat.set(160, 160); ground.receiveShadow = true; G.add(ground);
  // camino y bermas de ripio
  G.add(ribbon(track, -hw, hw, new THREE.MeshStandardMaterial({ map: roadTex('road', aniso), roughness: 0.84 })));
  const gravel = new THREE.MeshStandardMaterial({ map: noiseTex('#4a4136', ['#3a332b', '#5a5044', '#2e2924'], aniso), roughness: 1 });
  gravel.map.repeat.set(1, 1);
  G.add(ribbon(track, hw, hw + 2.6, gravel, { lift: 0.0, dyB: -0.22, vScale: 1 / 4 }));
  G.add(ribbon(track, -hw - 2.6, -hw, gravel, { lift: 0.0, dyA: -0.22, vScale: 1 / 4 }));
  // barandas en las curvas cerradas (por fuera) y postes con reflectantes en el resto
  const rails = new Int8Array(track.n);
  for (let i = 0; i < track.n; i++) {
    if (track.k[i] < 0.0075) continue;
    const a = track.wrap(i - 3), b = track.wrap(i + 3);
    const turn = track.tx[a] * track.tz[b] - track.tz[a] * track.tx[b];   // > 0: dobla a la izquierda
    rails[i] = turn > 0 ? 1 : -1;      // la baranda va por fuera de la curva
  }
  for (let i = 0; i < track.n; i++) if (rails[i]) for (let d = -4; d <= 4; d++) { const j = track.wrap(i + d); if (!rails[j]) rails[j] = rails[i]; }
  const railMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.8, roughness: 0.35 });
  const railCount = rails.reduce((a, r) => a + (r ? 1 : 0), 0);
  const railI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.32, 2.1), railMat, railCount);
  const postI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.8, 0.12).translate(0, 0.4, 0), new THREE.MeshStandardMaterial({ color: 0x5a5e66 }), railCount);
  const d = new THREE.Object3D(); let k = 0;
  for (let i = 0; i < track.n; i++) {
    if (!rails[i]) continue;
    const off = rails[i] * (hw + 3.0), x = track.x[i] - track.tz[i] * off, z = track.z[i] + track.tx[i] * off;
    d.position.set(x, track.y[i] + 0.55, z); d.rotation.set(0, Math.atan2(track.tx[i], track.tz[i]), 0); d.updateMatrix(); railI.setMatrixAt(k, d.matrix);
    d.position.y = track.y[i] - 0.1; d.updateMatrix(); postI.setMatrixAt(k, d.matrix); k++;
  }
  G.add(railI, postI);
  const refl = [];
  for (let i = 0; i < track.n; i += 12) for (const side of [-1, 1]) if (rails[i] !== side) refl.push([i, side]);
  const pI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.95, 0.12).translate(0, 0.47, 0), new THREE.MeshStandardMaterial({ color: 0xdedcd4, roughness: 0.6 }), refl.length);
  const rI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.13, 0.14, 0.04).translate(0, 0.78, 0), new THREE.MeshBasicMaterial({ color: glowColor(1, 0.5, 0.1, 3.5) }), refl.length);
  refl.forEach(([i, side], n) => {
    const off = side * (hw + 1.9), x = track.x[i] - track.tz[i] * off, z = track.z[i] + track.tx[i] * off;
    d.position.set(x, track.y[i] - 0.1, z); d.rotation.set(0, Math.atan2(track.tx[i], track.tz[i]), 0); d.updateMatrix();
    pI.setMatrixAt(n, d.matrix); rI.setMatrixAt(n, d.matrix);
  });
  G.add(pI, rI);
  // faroles y pueblo en la recta de la largada
  const START = 60;     // metros desde el comienzo de la pista hasta la línea
  const lampPts = [];
  for (let s = -170; s < 260; s += 34) {
    const p = track.at(START + s);
    for (const side of [-1, 1]) { const off = side * (hw + 4.2); lampPts.push([p.x + p.rx * off, p.y - 0.2, p.z + p.rz * off, -side * p.rx, -side * p.rz]); }
  }
  const lamps = lampPosts(G, lampPts, heightAt);
  building(G, 34, 40, 26, 14, 9, 0.02); building(G, 30, 110, 18, 12, 14, -0.05); building(G, -30, 150, 16, 16, 11, 0.1); building(G, -32, -30, 20, 12, 8, -0.04); building(G, 36, -90, 22, 14, 12, 0.08);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(18, 4.5), neon("BOB'S DRIVE-IN", '#ff3b8d')); sign.position.set(21, 11, 60); sign.rotation.y = -Math.PI / 2 + 0.35; G.add(sign);
  // pórtico de partida
  const sp = track.at(START), post = new THREE.MeshStandardMaterial({ color: 0x30343c, metalness: 0.6, roughness: 0.4 });
  for (const side of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 0.4), post); p.position.set(sp.x + sp.rx * side * (hw + 1.6), sp.y + 3.3, sp.z + sp.rz * side * (hw + 1.6)); G.add(p); }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(hw * 2 + 4, 1.2, 0.5), post); beam.position.set(sp.x, sp.y + 7, sp.z); beam.rotation.y = Math.atan2(sp.tx, sp.tz) + Math.PI / 2; G.add(beam);
  const lineM = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, 0.9).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: canvasTex(64, 8, (g) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#f2f0ea'; g.fillRect(i * 4, j * 4, 4, 4); } }) }));
  lineM.position.set(sp.x, sp.y + 0.045, sp.z); lineM.rotation.y = Math.atan2(sp.tx, sp.tz); G.add(lineM);
  palms(G, Array.from({ length: 18 }, (_, i) => { const p = track.at(START - 150 + i * 24), side = i % 2 ? 1 : -1, off = side * (hw + rnd(9, 14)); return [p.x + p.rx * off, p.z + p.rz * off]; }), heightAt);
  forest(G, 900, () => { const x = cx + rnd(-SIZE / 2, SIZE / 2), z = cz + rnd(-SIZE / 2, SIZE / 2), n = nearest(x, z); return n.d > hw + 14 ? [x, z] : null; }, heightAt);
  // rocas
  const rock = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: 1, flatShading: true }), 160);
  for (let i = 0; i < 160; i++) {
    let x, z; do { x = cx + rnd(-SIZE / 2, SIZE / 2); z = cz + rnd(-SIZE / 2, SIZE / 2); } while (nearest(x, z).d < hw + 8);
    const s = rnd(0.6, 3); d.position.set(x, heightAt(x, z) - s * 0.3, z); d.rotation.set(rnd(0, 3), rnd(0, 3), 0); d.scale.set(s, s * rnd(0.6, 1), s); d.updateMatrix(); rock.setMatrixAt(i, d.matrix);
  }
  G.add(rock);
  horizon(G, cx, cz);
  return { track, heightAt, lamps, rails, startS: START };
}

// =================== el garaje ===================
function brickTex(aniso) {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#5a3a30'; g.fillRect(0, 0, w, h);
    for (let row = 0; row < 16; row++) for (let col = -1; col < 9; col++) {
      const x = col * 64 + (row % 2) * 32, y = row * 32, v = Math.random();
      g.fillStyle = `rgb(${120 + v * 40},${66 + v * 22},${52 + v * 14})`; g.fillRect(x + 2, y + 2, 60, 28);
    }
    g.fillStyle = 'rgba(255,240,220,0.05)'; g.fillRect(0, 0, w, h);
  }, { repeat: true, aniso });
}
function buildGarage(G, aniso) {
  const W = 11, D = 9.5, H = 3.5;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.05, map: canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#77736c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.06})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    for (const [x, y, r] of [[250, 280, 70], [300, 230, 40], [120, 400, 30], [420, 120, 26]]) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(20,16,12,0.55)'); gr.addColorStop(1, 'rgba(20,16,12,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
    g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, h / 2, w, 2); g.fillRect(w / 2, 0, 2, h);
  }, { aniso }) }));
  G.add(floor);
  const brick = new THREE.MeshStandardMaterial({ map: brickTex(aniso), roughness: 0.9 });
  brick.map.repeat.set(3, 1.2);
  const wall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), brick); m.position.set(x, H / 2, z); m.rotation.y = ry; G.add(m); };
  wall(W, 0, -D / 2, 0); wall(D, -W / 2, 0, Math.PI / 2); wall(D, W / 2, 0, -Math.PI / 2);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 1 })); ceil.position.y = H; G.add(ceil);
  const wood = new THREE.MeshStandardMaterial({ color: 0x6a4a30, roughness: 0.8 }), metalM = new THREE.MeshStandardMaterial({ color: 0x5a5e66, metalness: 0.6, roughness: 0.4 });
  for (let i = -2; i <= 2; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, D), wood); b.position.set(i * 2.4, H - 0.12, 0); G.add(b); }
  const header = new THREE.Mesh(new THREE.BoxGeometry(W, 0.5, 0.3), wood); header.position.set(0, H - 0.25, D / 2); G.add(header);
  const door = new THREE.Mesh(new THREE.BoxGeometry(W - 1, 0.35, 0.2), new THREE.MeshStandardMaterial({ color: 0x8a8e94, metalness: 0.4, roughness: 0.5 })); door.position.set(0, H - 0.6, D / 2 - 0.3); G.add(door);
  // banco de trabajo con tablero de herramientas
  const bench = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.8), wood); bench.position.set(-2.4, 0.45, -D / 2 + 0.45); G.add(bench);
  const top = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.06, 0.9), new THREE.MeshStandardMaterial({ color: 0x3a2a1c, roughness: 0.7 })); top.position.set(-2.4, 0.93, -D / 2 + 0.45); G.add(top);
  const peg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.3), new THREE.MeshStandardMaterial({ roughness: 0.9, map: canvasTex(512, 196, (g, w, h) => {
    g.fillStyle = '#b8946a'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 8; y < h; y += 14) for (let x = 8; x < w; x += 14) g.fillRect(x, y, 3, 3);
    g.strokeStyle = '#2a2c30'; g.lineCap = 'round';
    for (let i = 0; i < 9; i++) { const x = 30 + i * 52; g.lineWidth = 7; g.beginPath(); g.moveTo(x, 30); g.lineTo(x + (i % 3 - 1) * 6, 120 + (i % 2) * 20); g.stroke(); g.lineWidth = 16; g.beginPath(); g.arc(x, 30, 10, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = '#c8202a'; g.fillRect(380, 130, 90, 40);
  }) })); peg.position.set(-2.4, 1.85, -D / 2 + 0.02); G.add(peg);
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.4, metalness: 0.3 })); box.position.set(-1.2, 1.16, -D / 2 + 0.4); G.add(box);
  // estantes con latas
  for (let k = 0; k < 3; k++) {
    const sh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 2.6), wood); sh.position.set(-W / 2 + 0.28, 0.6 + k * 0.7, -1.4); G.add(sh);
    for (let i = 0; i < 6; i++) { const can = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.26, 12), new THREE.MeshStandardMaterial({ color: [0xc8202a, 0x2c4a9a, 0xe8b830, 0x2c7a3c, 0xd06018, 0xeeeeee][(i + k) % 6], roughness: 0.4, metalness: 0.3 })); can.position.set(-W / 2 + 0.28, 0.76 + k * 0.7, -2.5 + i * 0.4); G.add(can); }
  }
  // neumáticos apilados, tambor de aceite, afiche y calendario
  for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.13, 10, 22), new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.9 })); t.rotation.x = Math.PI / 2; t.position.set(W / 2 - 0.6, 0.14 + k * 0.25, -D / 2 + 0.7); G.add(t); }
  const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 18), new THREE.MeshStandardMaterial({ color: 0x1c3ca8, roughness: 0.5, metalness: 0.4 })); drum.position.set(W / 2 - 0.6, 0.45, D / 2 - 1.2); G.add(drum);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), new THREE.MeshStandardMaterial({ roughness: 0.8, map: canvasTex(256, 350, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1a1030'); gr.addColorStop(1, '#5a1840'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffd36b'; g.font = 'italic 900 46px "Avenir Next", Arial, sans-serif'; g.textAlign = 'center'; g.fillText("BOB'S", w / 2, 80); g.fillText('DRAG', w / 2, 128);
    g.fillStyle = '#ff6aa9'; g.font = '700 22px "Avenir Next", Arial, sans-serif'; g.fillText('SÁBADOS · 9 PM', w / 2, 180); g.fillText('SATURDAYS', w / 2, 210);
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(40, 300); g.lineTo(216, 300); g.lineTo(190, 270); g.lineTo(70, 270); g.fill();
  }) })); poster.position.set(W / 2 - 0.02, 1.9, 0.6); poster.rotation.y = -Math.PI / 2; G.add(poster);
  const calTex = document.createElement('canvas'); calTex.width = 200; calTex.height = 240;
  const cal = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.6), new THREE.MeshStandardMaterial({ roughness: 0.8, map: new THREE.CanvasTexture(calTex) }));
  cal.material.map.colorSpace = THREE.SRGBColorSpace; cal.position.set(0.6, 1.9, -D / 2 + 0.02); G.add(cal);
  // tubos fluorescentes y una ampolleta sobre el banco
  const tube = new THREE.MeshBasicMaterial({ color: glowColor(1, 0.96, 0.86, 1.3) });
  const lights = [];
  for (const z of [-1.3, 1.3]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 0.14), tube); t.position.set(0, H - 0.5, z); G.add(t);
    const hous = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.26), metalM); hous.position.set(0, H - 0.44, z); G.add(hous);
    const l = new THREE.PointLight(0xfff2dc, 26, 14, 1.6); l.position.set(0, H - 0.65, z); G.add(l); lights.push(l);
  }
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshBasicMaterial({ color: glowColor(1, 0.8, 0.5, 6) })); bulb.position.set(-2.4, 2.75, -D / 2 + 0.7); G.add(bulb);
  const bl = new THREE.PointLight(0xffc888, 8, 6, 1.8); bl.position.copy(bulb.position); G.add(bl);
  // afuera: la calle de noche y un farol
  const street = new THREE.Mesh(new THREE.PlaneGeometry(40, 20).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x1c1d22, roughness: 0.9 })); street.position.set(0, -0.01, D / 2 + 10); G.add(street);
  lampPosts(G, [[4, 0, D / 2 + 7, -1, 0]], () => 0);
  building(G, -6, D / 2 + 22, 14, 8, 7, 0.1); building(G, 10, D / 2 + 25, 12, 8, 10, -0.1);
  palms(G, [[-9, D / 2 + 8], [12, D / 2 + 12]], () => 0);
  return {
    track: null, heightAt: () => 0, lamps: [], rails: null, fog: 0.0005, carAt: [0, 0, 0.2, 0.6],
    setDate(text, big) {
      const g = calTex.getContext('2d'); g.fillStyle = '#f4efe2'; g.fillRect(0, 0, 200, 240); g.fillStyle = '#c8202a'; g.fillRect(0, 0, 200, 60);
      g.fillStyle = '#fff'; g.font = '700 30px "Avenir Next", Arial, sans-serif'; g.textAlign = 'center'; g.fillText(text, 100, 42);
      g.fillStyle = '#1c1c22'; g.font = '900 120px "Avenir Next", Arial, sans-serif'; g.fillText(String(big), 100, 180);
      g.font = '600 26px "Avenir Next", Arial, sans-serif'; g.fillText('1963', 100, 225); cal.material.map.needsUpdate = true;
    }
  };
}

// =================== Bob's Drive-In ===================
function buildBobs(G, aniso) {
  // estacionamiento con sus líneas
  const lot = new THREE.Mesh(new THREE.PlaneGeometry(90, 70).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: noiseTex('#2a2b30', ['#232428', '#303136', '#26272b'], aniso), roughness: 0.85 }));
  lot.material.map.repeat.set(18, 14); lot.position.set(0, 0, 4); G.add(lot);
  const lineM = new THREE.MeshBasicMaterial({ color: 0xbfbcb2 });
  const spots = [];
  for (let i = 0; i < 6; i++) {
    const x = -12.5 + i * 5;
    for (const dx of [-2.5, 2.5]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 6).rotateX(-Math.PI / 2), lineM); l.position.set(x + dx, 0.012, -3); G.add(l); }
    spots.push([x, -3.4, 0]);
  }
  // el local: paredes, ventanales encendidos, toldo a rayas y neón en el techo
  const wallM = new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.6 });
  const bld = new THREE.Mesh(new THREE.BoxGeometry(32, 4.6, 10), wallM); bld.position.set(0, 2.3, -14); G.add(bld);
  const winTex = canvasTex(1024, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff3c4'); gr.addColorStop(1, '#e8b468'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c72631'; g.fillRect(0, h * 0.72, w, h * 0.1); g.fillStyle = '#d8d8d8'; g.fillRect(0, h * 0.82, w, h * 0.18);
    for (let i = 0; i < 26; i++) { const x = 20 + i * 39 + Math.random() * 10; g.fillStyle = ['#7a2a2a', '#2a3a6a', '#2a5a3a', '#5a2a5a', '#3a3a3a'][i % 5]; g.beginPath(); g.ellipse(x, h * 0.66, 12, 16, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3a2418'; g.beginPath(); g.arc(x, h * 0.42, 9, 0, Math.PI * 2); g.fill(); }
    for (let x = 0; x < w; x += 128) { g.fillStyle = 'rgba(60,40,30,0.8)'; g.fillRect(x, 0, 6, h); }
  });
  const wins = new THREE.Mesh(new THREE.PlaneGeometry(28, 2.2), new THREE.MeshStandardMaterial({ map: winTex, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.9, roughness: 0.2 }));
  wins.position.set(0, 2.0, -8.98); G.add(wins);
  const awnTex = canvasTex(256, 16, (g, w) => { for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#f4f0e6' : '#d02c3a'; g.fillRect(i * 16, 0, 16, 16); } }, { repeat: true });
  awnTex.repeat.set(8, 1);
  const awn = new THREE.Mesh(new THREE.BoxGeometry(30, 0.08, 2.2), new THREE.MeshStandardMaterial({ map: awnTex, roughness: 0.7 })); awn.position.set(0, 3.55, -8.0); awn.rotation.x = 0.28; G.add(awn);
  const neonPink = new THREE.MeshBasicMaterial({ color: glowColor(1, 0.25, 0.6, 2.6) }), neonCyan = new THREE.MeshBasicMaterial({ color: glowColor(0.3, 0.9, 1, 2.2) });
  const edge = new THREE.Mesh(new THREE.BoxGeometry(32.2, 0.07, 0.07), neonPink); edge.position.set(0, 4.62, -8.98); G.add(edge);
  const edge2 = new THREE.Mesh(new THREE.BoxGeometry(32.2, 0.07, 0.07), neonCyan); edge2.position.set(0, 0.95, -8.97); G.add(edge2);
  // el letrero alto
  const post = new THREE.MeshStandardMaterial({ color: 0x30343c, metalness: 0.6, roughness: 0.4 });
  for (const dx of [-0.6, 0.6]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.25, 11, 0.25), post); p.position.set(19 + dx, 5.5, -10); G.add(p); }
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(11, 3.4), neon("BOB'S", '#ff3b8d', 512, 160)); sign.position.set(19, 9.6, -9.85); G.add(sign);
  const sign2 = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.6), neon('DRIVE-IN', '#4fd8ff', 512, 96)); sign2.position.set(19, 7.4, -9.85); G.add(sign2);
  const back = new THREE.Mesh(new THREE.BoxGeometry(11.4, 6, 0.3), new THREE.MeshStandardMaterial({ color: 0x1a1426, roughness: 0.6 })); back.position.set(19, 8.6, -10.05); G.add(back);
  // techo de los estacionamientos con ampolletas
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(31, 0.2, 7.4), new THREE.MeshStandardMaterial({ color: 0x8c8678, roughness: 0.85 })); canopy.position.set(0, 3.7, -3.6); G.add(canopy);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(31.1, 0.05, 0.05), new THREE.MeshBasicMaterial({ color: glowColor(1, 0.3, 0.6, 1.4) })); trim.position.set(0, 3.68, 0.1); G.add(trim);
  for (const x of [-15, -7.5, 0, 7.5, 15]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.7, 8), post); p.position.set(x, 1.85, -0.1); G.add(p); }
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshBasicMaterial({ color: glowColor(1, 0.85, 0.55, 2.5) }), 60);
  const d = new THREE.Object3D(); for (let i = 0; i < 60; i++) { d.position.set(-14.5 + (i % 30), 3.56, i < 30 ? -1.2 : -5.8); d.updateMatrix(); bulbs.setMatrixAt(i, d.matrix); } G.add(bulbs);
  const lights = [];
  for (const x of [-10, 0, 10]) { const l = new THREE.PointLight(0xffd6a0, 22, 14, 1.8); l.position.set(x, 3.3, -3.4); G.add(l); lights.push(l); }
  // la calle de enfrente, faroles, palmeras y cerros
  const road = new THREE.Mesh(new THREE.PlaneGeometry(200, 9).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: roadTex('road', aniso), roughness: 0.85 }));
  road.material.map.repeat.set(1, 16); road.material.map.rotation = Math.PI / 2; road.position.set(0, 0.01, 22); G.add(road);
  const lamps = lampPosts(G, [[-24, 0, 12, 1, 0], [24, 0, 12, -1, 0], [-30, 0, 26, 0, -1], [0, 0, 27.5, 0, -1], [30, 0, 26, 0, -1]], () => 0);
  palms(G, [[-20, -6], [-27, 4], [26, 2], [30, -8], [-8, 15], [10, 15], [-35, 16], [36, 15]], () => 0);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x141c16, roughness: 1 })); grass.position.y = -0.02; G.add(grass);
  forest(G, 160, () => { const x = rnd(-500, 500), z = rnd(-500, 500); return Math.abs(x) > 50 || Math.abs(z - 5) > 45 ? [x, z] : null; }, () => 0);
  building(G, -40, -20, 16, 12, 9, 0.2); building(G, 44, -24, 18, 12, 12, -0.2);
  horizon(G, 0, 0);
  return { track: null, heightAt: () => 0, lamps, rails: null, fog: 0.0035, spots, mySpot: [-4, 9, -0.35] };
}

export function buildWorld(kind, renderer) {
  const G = new THREE.Group(), aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const w = kind === 'drag' ? buildDrag(G, aniso) : kind === 'road' ? buildRoad(G, aniso) : kind === 'garage' ? buildGarage(G, aniso) : buildBobs(G, aniso);
  const sky = makeSky();
  const hemi = new THREE.HemisphereLight(0x5a6aa8, 0x120e0a, kind === 'garage' ? 0.35 : 0.6);
  const moon = new THREE.DirectionalLight(0x9fb2ff, 0.55); moon.position.copy(MOON_DIR).multiplyScalar(100);
  G.add(hemi, moon, moon.target);
  return Object.assign({ fog: kind === 'drag' ? 0.0024 : 0.0032 }, w, {
    kind, group: G, sky,
    dispose() {
      G.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { for (const m of [].concat(o.material)) { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose(); } } });
    }
  });
}
