// ===== El escenario 3D: dibujo, lugares (garaje, Bob's, recta, ruta), autos, luces, cámaras y efectos =====
import * as THREE from 'three';
import { EffectComposer } from '../vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../vendor/jsm/postprocessing/OutputPass.js';
import { buildCar, lookKey } from './car.js';
import { buildWorld, nightEnvironment, LANE } from './world.js';
import { Particles, radialTex } from './fx.js';
import { clamp, rnd } from './util.js';

const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
export const MOBILE = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

export const stage = {
  mode: 'none', world: null, worlds: {}, race: null, cars: new Map(), shown: new Set(), cam: 'chase', spots: {}, focusId: null,
  init(canvas) {
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio, MOBILE ? 1.5 : 2));
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
    const S = this.scene = new THREE.Scene();
    S.fog = new THREE.FogExp2(0x0b0c18, 0.003);
    S.environment = nightEnvironment(r);
    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 6000);
    this.composer = new EffectComposer(r, new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: MOBILE ? 0 : 4 }));
    this.composer.addPass(new RenderPass(S, this.camera));
    this.composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.4, 0.9));
    this.composer.addPass(new OutputPass());
    const soft = radialTex([[0, 'rgba(255,255,255,0.9)'], [0.5, 'rgba(255,255,255,0.35)'], [1, 'rgba(255,255,255,0)']]);
    const hot = radialTex([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,200,120,0.9)'], [1, 'rgba(255,80,20,0)']]);
    this.smoke = new Particles(S, { max: 700, tex: soft, color: 0x6c6e78, drag: 1.4, rise: 0.5 });
    this.dust = new Particles(S, { max: 300, tex: soft, color: 0x5a4c3c, drag: 2, rise: 0.2 });
    this.flames = new Particles(S, { max: 160, additive: true, tex: hot, color: 0xff8a3a, drag: 4 });
    this.sparks = new Particles(S, { max: 120, additive: true, tex: hot, color: 0xffd080, drag: 2, rise: -9 });
    this.parts = [this.smoke, this.dust, this.flames, this.sparks];
    this.lampLights = Array.from({ length: 4 }, () => { const l = new THREE.PointLight(0xffc489, 110, 34, 2); S.add(l); return l; });
    this.heads = [0, 1].map(() => { const s = new THREE.SpotLight(0xfff1d6, 1400, 120, 0.5, 0.9, 1.7); S.add(s, s.target); return s; });
    this.camState = { yaw: 0, pos: new THREE.Vector3(), look: new THREE.Vector3(), shake: 0, orbit: 0, t: 0 };
    this.resize();
    addEventListener('resize', () => this.resize());
  },
  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false); this.composer.setSize(w, h);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.particleScale();
  },
  particleScale() {
    const sc = innerHeight * this.renderer.getPixelRatio() / 2 / Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    for (const p of this.parts) p.mat.uniforms.scale.value = sc;
  },
  // ----- lugares -----
  useWorld(kind) {
    if (this.world && this.world.kind === kind) return this.world;
    if (this.world) this.scene.remove(this.world.group, this.world.sky);
    const w = this.worlds[kind] || (this.worlds[kind] = buildWorld(kind, this.renderer));
    this.scene.add(w.group, w.sky);
    this.scene.fog.density = w.fog;
    this.world = w;
    return w;
  },
  // Un auto armado para mostrar (se reutiliza mientras se vea igual). slot: quién es (yo, rival, etc.)
  car(slot, state) {
    const key = lookKey(state);
    let c = this.cars.get(slot);
    if (!c || c.lookKey !== key) {
      if (c) { this.scene.remove(c.root); c.dispose(); }
      c = buildCar(state); c.lookKey = key; this.cars.set(slot, c);
    }
    return c;
  },
  showCars(list) {      // list: [[slot, state, x, y, z, heading]]
    const keep = new Set(list.map(l => l[0]));
    for (const [slot, c] of this.cars) if (!keep.has(slot) && c.root.parent) this.scene.remove(c.root);
    const out = {};
    for (const [slot, state, x, y, z, h] of list) {
      const c = this.car(slot, state);
      c.root.position.set(x, y, z); c.root.rotation.y = h; c.body.rotation.set(0, 0, 0); c.setBrake(false);
      c.head.emissiveIntensity = this.mode === 'garage' ? 0.5 : 2;
      for (const w of c.wheels) w.pivot.rotation.y = 0;
      if (!c.root.parent) this.scene.add(c.root);
      out[slot] = c;
    }
    return out;
  },
  // ----- escenas -----
  setTitle(kingState) {
    this.mode = 'title'; this.race = null;
    const w = this.useWorld('bobs');
    this.showCars([['title', kingState, 0, 0, 5, -0.6]]);
    this.target = this.cars.get('title');
  },
  // La portada del catálogo: un auto preparado y El Rey en la línea de la recta, con el árbol en amarillo
  setCover(hero, king) {
    this.mode = 'cover'; this.race = null;
    const w = this.useWorld('drag');
    this.showCars([['c1', hero, -2.4, 0, -2.6, 0], ['c2', king, 2.4, 0, -2.3, 0]]);
    for (const lane of [-1, 1]) for (const k of ['pre', 'stage', 'a1', 'a2']) w.tree.set(lane, k, true);
  },
  setGarage(state, dateText, dayNum) {
    this.mode = 'garage'; this.race = null;
    const w = this.useWorld('garage');
    w.setDate(dateText, dayNum);
    this.showCars(state ? [['me', state, 0, 0, 0.3, 0.55]] : []);
    this.target = state ? this.cars.get('me') : null;
  },
  setBobs(me, rivals) {     // rivals: [{ id, state }]
    this.mode = 'bobs'; this.race = null; this.focusId = null;
    const w = this.useWorld('bobs'), list = [];
    if (me) list.push(['me', me, w.mySpot[0], 0, w.mySpot[1], w.mySpot[2]]);
    rivals.forEach((r, i) => { const s = w.spots[[1, 3, 4, 2, 0, 5][i]]; list.push(['rv:' + r.id, r.state, s[0], 0, s[1], s[2]]); this.spots[r.id] = s; });
    this.showCars(list);
  },
  focus(id) { this.focusId = id; },
  // Las etiquetas con el nombre de cada rival en Bob's: posición en pantalla
  labels() {
    if (this.mode !== 'bobs') return [];
    const out = [], v = new THREE.Vector3();
    for (const [slot, c] of this.cars) {
      if (!slot.startsWith('rv:') || !c.root.parent) continue;
      v.copy(c.root.position); v.y += 2.1; v.project(this.camera);
      if (v.z < 1) out.push({ id: slot.slice(3), x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight });
    }
    return out;
  },
  setRace(race) {
    this.mode = 'race'; this.race = race;
    this.useWorld(race.kind === 'drag' ? 'drag' : 'road');
    for (const [slot, c] of this.cars) if (c.root.parent && !race.racers.some(r => r.car === c)) this.scene.remove(c.root);
    for (const r of race.racers) { if (!r.car.root.parent) this.scene.add(r.car.root); r.car.head.emissiveIntensity = 3; r.car.sync(r.v, 0); }
    for (const p of this.parts) p.clear();
    this.chase(0, true);
  },
  // ----- cada cuadro -----
  frame(dt) {
    const C = this.camState, cam = this.camera;
    C.t += dt;
    if (this.mode === 'race') { this.effects(dt); this.chase(dt, false); this.nearestLamps(this.race.me.v); }
    else {
      C.orbit += dt;
      if (this.mode === 'garage') {
        const a = 0.9 + Math.sin(C.orbit * 0.12) * 0.75, p = new THREE.Vector3(0, 0, 0.3);
        cam.position.set(p.x + Math.sin(a) * 7.2, 1.75 + Math.sin(C.orbit * 0.09) * 0.25, p.z + Math.cos(a) * 7.2);
        this.lookShift(p.set(0, 0.7, 0.3), innerWidth > 820 ? -1.9 : 0);
      } else if (this.mode === 'bobs') {
        const w = this.world, s = this.focusId && this.spots[this.focusId];
        const want = s ? new THREE.Vector3(s[0] + 4.2, 1.7, s[1] + 6.2) : new THREE.Vector3(-5 + Math.sin(C.orbit * 0.07) * 2.5, 2.9, 15);
        const look = s ? new THREE.Vector3(s[0], 0.9, s[1]) : new THREE.Vector3(1, 1.5, -6);
        C.pos.lerp(want, Math.min(1, dt * 2.5)); if (C.pos.lengthSq() < 1) C.pos.copy(want);
        C.look.lerp(look, Math.min(1, dt * 3)); if (C.look.lengthSq() < 0.1) C.look.copy(look);
        cam.position.copy(C.pos); this.lookShift(C.look.clone(), innerWidth > 820 ? (s ? 1.4 : -2.5) : 0);
        void w;
      } else if (this.mode === 'cover') {
        cam.position.set(-4.7, 1.05, 6.0); cam.lookAt(0.4, 0.95, -2.4);
      } else if (this.mode === 'title') {
        const a = this.cover ? 0.62 : 0.35 + Math.sin(C.orbit * 0.1) * 0.55;
        cam.position.set(Math.sin(a) * 8.2, this.cover ? 1.35 : 1.25 + Math.sin(C.orbit * 0.13) * 0.2, 5 + Math.cos(a) * 8.2);
        this.lookShift(new THREE.Vector3(0, 0.95, 5), this.cover ? 0 : innerWidth > 820 ? -2.2 : 0);
      }
      const fov = this.mode === 'cover' ? 52 : 50;
      if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); this.particleScale(); }
      this.nearestLamps(cam.position);
    }
    this.headlights();
    if (this.world) this.world.sky.position.copy(cam.position);
    this.composer.render();
  },
  // mirar a un punto, corrido hacia un lado para dejar lugar al panel
  lookShift(p, side) {
    this.camera.lookAt(p);
    if (side) { const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0); p.addScaledVector(right, side); this.camera.lookAt(p); }
  },
  chase(dt, snap) {
    const R = this.race, v = R.me.v, C = this.camState, cam = this.camera, spd = v.speed, me = R.me.car;
    if (this.cam === 'hood') {
      const P = me.shape, wsX = P.len / 2 - P.hood, eye = new THREE.Vector3(0.3, P.roof + 0.02, wsX - 0.3), tgt = new THREE.Vector3(0.3, P.roof - 0.9, wsX + 30);
      me.body.localToWorld(eye); me.body.localToWorld(tgt); cam.position.copy(eye); cam.lookAt(tgt);
    } else {
      const drag = R.kind === 'drag';
      C.yaw += wrapA(v.h - C.yaw) * (snap ? 1 : Math.min(1, dt * 3.2));
      const back = (drag ? 6.2 : 6.8) + spd * 0.02 + me.len * 0.2 - 1, up = (drag ? 2.0 : 2.3) + spd * 0.005;
      const want = new THREE.Vector3(v.x - Math.sin(C.yaw) * back, v.y + up, v.z - Math.cos(C.yaw) * back);
      if (snap) C.pos.copy(want); else C.pos.lerp(want, Math.min(1, dt * 8));
      const g = this.world.kind === 'drag' ? 0 : this.world.heightAt(C.pos.x, C.pos.z);
      if (C.pos.y < g + 0.8) C.pos.y = g + 0.8;
      cam.position.copy(C.pos);
      C.look.set(v.x + Math.sin(v.h) * 3.5, v.y + 1.05, v.z + Math.cos(v.h) * 3.5);
      cam.lookAt(C.look);
    }
    if (C.shake > 0) { C.shake = Math.max(0, C.shake - dt * 2.5); cam.position.x += rnd(-1, 1) * C.shake * 0.08; cam.position.y += rnd(-1, 1) * C.shake * 0.08; }
    const rough = R.me.surf && R.me.surf !== 'road' ? Math.min(1, spd / 25) : 0;
    if (rough) cam.position.y += Math.sin(C.t * 50) * 0.03 * rough;
    const fov = 58 + clamp(spd * 0.32, 0, 16) + (v.nitroT > 0 ? 6 : 0);
    if (snap) cam.fov = fov; else cam.fov += (fov - cam.fov) * Math.min(1, dt * 4);
    cam.updateProjectionMatrix(); this.particleScale();
  },
  headlights() {
    const cars = this.mode === 'race' ? this.race.racers.map(r => r.car) : this.mode === 'title' ? [this.cars.get('title')] : this.mode === 'cover' ? [] : this.mode === 'garage' ? [] : [this.cars.get('me')];
    this.heads.forEach((s, i) => {
      const c = cars[i];
      if (!c || !c.root.parent) { s.visible = false; return; }
      s.visible = true;
      const h = c.root.rotation.y, p = c.root.position, fx = Math.sin(h), fz = Math.cos(h);
      s.position.set(p.x + fx * (c.len / 2 - 0.1), p.y + 0.72, p.z + fz * (c.len / 2 - 0.1));
      s.target.position.set(p.x + fx * 30, p.y - 1.2, p.z + fz * 30);
    });
  },
  nearestLamps(p) {
    const L = this.world ? this.world.lamps : [];
    const best = L.map((l, i) => [(l.x - p.x) ** 2 + (l.z - p.z) ** 2, i]).sort((a, b) => a[0] - b[0]);
    this.lampLights.forEach((l, k) => { if (best[k]) l.position.copy(L[best[k][1]]); l.visible = !!best[k]; });
  },
  // humo de los neumáticos, polvo, llamas del escape y chispas
  effects(dt) {
    const R = this.race;
    for (const r of R.racers) {
      const v = r.v, P = r.car.shape, fx = Math.sin(v.h), fz = Math.cos(v.h), rx = -fz, rz = fx;
      const rear = P.len / 2 - P.fo - P.wb, wz = P.wid / 2 - 0.17;
      const rate = Math.max(0, v.slip - 0.45) * 130 * dt;
      for (const s of [-1, 1]) {
        const x = v.x + fx * rear + rx * wz * s, z = v.z + fz * rear + rz * wz * s;
        if (rate > 0) for (let n = rate + Math.random() - 0.5; n > 0; n--) this.smoke.emit(x + rnd(-0.2, 0.2), v.y + 0.25, z + rnd(-0.2, 0.2), v.vx * 0.25 + rnd(-1, 1), rnd(0.3, 1.0), v.vz * 0.25 + rnd(-1, 1), rnd(0.8, 1.3), rnd(1.2, 2.0), 1.8, 0.3);
        if (r.surf && r.surf !== 'road' && v.speed > 4 && Math.random() < v.speed * dt * 1.2) this.dust.emit(x, v.y + 0.2, z, v.vx * 0.2 + rnd(-1, 1), rnd(0.4, 1.5), v.vz * 0.2 + rnd(-1, 1), rnd(1, 2), rnd(0.8, 1.6), 2.4, 0.5);
      }
      if (v.nitroT > 0) for (let n = 0; n < 2; n++) { const ex = v.x - fx * (P.len / 2 + 0.2), ez = v.z - fz * (P.len / 2 + 0.2); this.flames.emit(ex - rx * 0.4, v.y + P.clr + 0.06, ez - rz * 0.4, -fx * 9 + v.vx, rnd(-0.3, 0.3), -fz * 9 + v.vz, rnd(0.5, 0.8), 0.12, -2, 1); }
    }
    for (const [r, e] of R.events) {
      const v = r.v, P = r.car.shape, fx = Math.sin(v.h), fz = Math.cos(v.h);
      if (e === 'pop') for (let n = 0; n < 9; n++) this.flames.emit(v.x - fx * (P.len / 2 + 0.15), v.y + P.clr + 0.06, v.z - fz * (P.len / 2 + 0.15), -fx * rnd(4, 8) + v.vx, rnd(-0.4, 0.6), -fz * rnd(4, 8) + v.vz, rnd(0.4, 0.75), rnd(0.08, 0.16), -1.5, 1);
      if (e === 'hit') { for (let n = 0; n < 14; n++) this.sparks.emit(v.x + rnd(-1, 1), v.y + 0.4, v.z + rnd(-1, 1), rnd(-4, 4) + v.vx * 0.5, rnd(1, 4), rnd(-4, 4) + v.vz * 0.5, 0.18, rnd(0.3, 0.6), 0, 1); if (r === R.me) this.camState.shake = 1; }
    }
    for (const p of this.parts) p.update(dt);
  }
};
export { LANE };
