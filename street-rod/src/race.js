// ===== Las carreras: picada con árbol de largada, ruta de dos vueltas contra un rival, y manejo libre =====
import { Vehicle } from './physics.js';
import { DRAG_LEN, LANE } from './world.js';
import { clamp, rnd } from './util.js';
import { L } from './i18n.js';

const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
const KMH = 3.6;
export const LAPS = 2;

// Un participante: el auto que se ve, su física y, si no es el jugador, su piloto
class Racer {
  constructor(car, spec, skill) {
    this.car = car; this.v = new Vehicle(spec); this.skill = skill; this.ai = skill !== undefined;
    this.q = { i: 0, s: 0, lat: 0, y: 0, tx: 0, tz: 1 }; this.hint = -1;
    this.prog = 0; this.lastS = 0; this.lap = 0; this.lapStart = 0; this.best = null; this.done = false; this.finishT = 0;
    this.launched = false; this.etStart = null; this.sixty = null; this.et = null; this.trap = 0; this.rt = null;
  }
}

export class Race {
  // kind: 'drag' | 'road' | 'free'. me / rival: { car, spec, skill? }
  constructor(kind, world, me, rival) {
    this.kind = kind; this.world = world; this.track = world.track;
    this.t = 0; this.goT = null; this.phase = 'ready'; this.msg = null; this.events = []; this.result = null; this.foul = false;
    this.me = new Racer(me.car, me.spec);
    this.rv = rival ? new Racer(rival.car, rival.spec, rival.skill ?? 0.9) : null;
    this.racers = [this.me, this.rv].filter(Boolean);
    this.wrongT = 0;
    if (kind === 'drag') this.placeDrag(); else this.placeRoad();
  }
  say(text, dur = 1.6, cls = '') { this.msg = { text, until: this.t + dur, cls }; }

  // ----- posiciones de salida -----
  placeDrag() {
    for (const r of this.racers) {
      const x = r === this.me ? -LANE : LANE;
      r.v.reset(x, 0, -r.car.len / 2 - 0.05, 0); r.v.hold = true; r.startZ = r.v.z;
    }
    this.world.tree.reset();
    for (const b of this.world.boards) b.set('--.---', '---');
    this.treeAt = 1.4 + rnd(0.5, 1.6);
    this.phase = 'stage';
    this.say(L().race.hint, 5, 'hint');
  }
  placeRoad() {
    const s0 = this.world.startS, T = this.track;
    const put = (r, s, lat) => { const p = T.at(s); r.v.reset(p.x + p.rx * lat, p.y, p.z + p.rz * lat, Math.atan2(p.tx, p.tz)); r.hint = -1; r.lastS = s; r.prog = s - s0; };
    put(this.me, s0 - 10, 2.1);
    if (this.rv) put(this.rv, s0 - 4, -2.1);
    if (this.kind === 'road') { for (const r of this.racers) r.v.hold = true; this.phase = 'grid'; this.say('3', 1, 'count'); }
    else { this.phase = 'run'; this.goT = 0; this.say(L().race.free, 3, 'hint'); }
  }

  // ----- un paso de física (1/120 s) -----
  step(dt, inp) {
    this.t += dt;
    if (this.kind === 'drag') this.dragLogic(inp); else this.roadLogic();
    for (const r of this.racers) {
      const env = this.surface(r);
      const ctl = r.ai ? this.pilot(r) : this.playerInput(r, inp);
      r.v.update(dt, ctl, env);
      this.walls(r);
      for (const e of r.v.events) this.events.push([r, e]);
      r.v.events.length = 0;
      this.timing(r);
    }
    if (this.rv) this.collide(this.me.v, this.rv.v);
    if (this.kind !== 'drag' && this.phase === 'run') this.wrongWay(dt);
    if (this.phase !== 'done' && this.finished()) this.finish();
  }
  playerInput(r, inp) {
    const c = { gas: inp.gas, brake: inp.brake, steer: inp.steer, analog: inp.analog, hand: false, up: inp.up, down: inp.down, nitro: inp.nitro };
    if (this.kind === 'drag') {
      // en la picada ESPACIO suelta el embrague y después sube los cambios; el auto se mantiene en su pista
      if (r.v.hold) { c.up = false; if (inp.launch) this.launch(r); }
      else if (inp.launch && r.v.spec.manual) c.up = true;
      if (Math.abs(inp.steer) < 0.1) c.steer = clamp((r.v.x + LANE) * 0.35 + r.v.h * 2.5, -0.5, 0.5);
      if (r.done) c.gas = 0;
    } else c.hand = inp.hand;
    if (this.phase === 'done' && this.kind !== 'free') { c.gas = 0; c.brake = Math.max(c.brake, 0.4); c.noReverse = true; }
    return c;
  }
  launch(r) {
    r.v.hold = false; r.launched = true;
    if (this.goT === null || this.t < this.goT) {
      if (r === this.me) { this.foul = true; this.world.tree.set(-1, 'red', true); this.say(L().race.foul, 2.2, 'bad'); }
      r.rt = this.goT === null ? -1 : this.t - this.goT;
    } else r.rt = this.t - this.goT;
    if (r === this.me && !this.foul) {
      const q = r.v.rpm / r.v.spec.red;
      const T = L().race; this.say(q < 0.32 ? T.lowRevs : q > 0.76 ? T.spin : r.rt < 0.2 ? T.greatRt : T.goodStart, 1.4, q < 0.32 || q > 0.76 ? 'warn' : 'good');
    }
  }
  // ----- el árbol de largada -----
  dragLogic() {
    const tr = this.world.tree, t = this.t;
    if (this.phase === 'stage') {
      if (t > 0.4) { tr.set(-1, 'pre', true); tr.set(1, 'pre', true); }
      if (t > 1.0) { tr.set(-1, 'stage', true); tr.set(1, 'stage', true); }
      if (t >= this.treeAt) this.phase = 'tree';
    }
    if (this.phase === 'tree') {
      const k = t - this.treeAt;
      for (const lane of [-1, 1]) { tr.set(lane, 'a1', k >= 0); tr.set(lane, 'a2', k >= 0.5); tr.set(lane, 'a3', k >= 1); }
      if (k >= 1.5) {
        this.goT = this.treeAt + 1.5; this.phase = 'run';
        for (const lane of [-1, 1]) { for (const a of ['a1', 'a2', 'a3']) tr.set(lane, a, false); tr.set(lane, 'green', !(lane === -1 && this.foul)); }
        if (!this.me.launched) this.say(L().race.green, 0.8, 'go');
      }
    }
  }
  roadLogic() {
    if (this.phase === 'grid') {
      const k = Math.floor(this.t);
      if (this.t < 3 && this.msg && this.msg.text !== String(3 - k)) this.say(String(3 - k), 1, 'count');
      if (this.t >= 3) { this.phase = 'run'; this.goT = this.t; for (const r of this.racers) { r.v.hold = false; r.v.launchRpm = r.v.rpm; } this.say(L().race.go, 0.9, 'go'); }
    }
  }
  // ----- piso: asfalto, ripio o pasto -----
  surface(r) {
    const v = r.v, T = this.track;
    r.q = T.query(v.x, v.z, r.hint, r.q); r.hint = r.q.i;
    if (this.kind === 'drag') return { mu: 1, drag: 0, y: 0 };
    const a = Math.abs(r.q.lat), hw = T.hw;
    r.surf = a < hw + 0.3 ? 'road' : a < hw + 2.6 ? 'gravel' : 'grass';
    if (r.surf === 'road') return { mu: 1, drag: 0, y: r.q.y };
    if (r.surf === 'gravel') return { mu: 0.78, drag: 0.15, y: r.q.y - (a - hw) * 0.07 };
    return { mu: 0.55, drag: 0.55, y: this.world.heightAt(v.x, v.z) + 0.25 };
  }
  // ----- muros de la recta, barandas de las curvas y el borde del mundo -----
  walls(r) {
    const v = r.v;
    if (this.kind === 'drag') {
      const lim = 6.2 - 0.33 - r.car.wid / 2;
      if (Math.abs(v.x) > lim) { const s = Math.sign(v.x); v.x = s * lim; if (v.vx * s > 0) { v.vx *= -0.2; v.vz *= 0.985; this.events.push([r, 'hit']); } v.h *= 0.9; }
      if (v.z > DRAG_LEN + 318) { v.z = DRAG_LEN + 318; v.vz = Math.min(v.vz, 0); v.vx *= 0.5; }
      return;
    }
    const q = r.q, hw = this.track.hw, side = Math.sign(q.lat), a = Math.abs(q.lat);
    const rail = this.world.rails && this.world.rails[q.i] === side;
    const lim = rail ? hw + 3 - 0.95 : hw + 32;
    if (a > lim) {
      const nx = -q.tz * side, nz = q.tx * side, push = a - lim;
      v.x -= nx * push; v.z -= nz * push;
      const vn = v.vx * nx + v.vz * nz;
      if (vn > 0) { v.vx -= nx * vn * 1.25; v.vz -= nz * vn * 1.25; v.vx *= 0.97; v.vz *= 0.97; if (vn > 2) this.events.push([r, 'hit']); }
    }
  }
  collide(a, b) {
    for (const da of [-1.25, 1.25]) for (const db of [-1.25, 1.25]) {
      const ax = a.x + Math.sin(a.h) * da, az = a.z + Math.cos(a.h) * da, bx = b.x + Math.sin(b.h) * db, bz = b.z + Math.cos(b.h) * db;
      const dx = bx - ax, dz = bz - az, d = Math.hypot(dx, dz), R = 2.0;
      if (d >= R || d < 1e-4) continue;
      const nx = dx / d, nz = dz / d, push = (R - d) / 2;
      a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push;
      const rv = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
      if (rv < 0) { const j = -rv * 0.6; a.vx -= nx * j; a.vz -= nz * j; b.vx += nx * j; b.vz += nz * j; if (rv < -2) this.events.push([this.me, 'hit']); }
    }
  }
  wrongWay(dt) {
    const v = this.me.v, q = this.me.q;
    const back = Math.sin(v.h) * q.tx + Math.cos(v.h) * q.tz < -0.4 && v.speed > 4;
    this.wrongT = back ? this.wrongT + dt : 0;
    if (this.wrongT > 1.5 && (!this.msg || this.msg.until < this.t + 0.2)) this.say(L().race.wrong, 0.6, 'bad');
  }
  // ----- tiempos -----
  timing(r) {
    const v = r.v;
    if (this.kind === 'drag') {
      const moved = v.z - r.startZ;
      if (r.etStart === null && moved > 0.25) r.etStart = this.t;
      if (r.sixty === null && moved > 18.3) r.sixty = this.t - r.etStart;
      if (!r.done && v.z + r.car.len / 2 >= DRAG_LEN) { r.done = true; r.et = this.t - r.etStart; r.trap = v.speed * KMH; r.finishT = this.t; if (r === this.me) this.world.boards[0].set(r.et.toFixed(3), Math.round(r.trap) + ' km/h'); else this.world.boards[1].set(r.et.toFixed(3), Math.round(r.trap) + ' km/h'); }
      return;
    }
    // vueltas: lo recorrido sin saltos al pasar por el comienzo de la pista
    const len = this.track.length;
    let ds = r.q.s - r.lastS; if (ds < -len / 2) ds += len; if (ds > len / 2) ds -= len;
    r.lastS = r.q.s; r.prog += ds;
    if (this.phase !== 'run') return;
    const lap = Math.floor(r.prog / len);
    if (lap > r.lap && r.prog > 0) {
      const lt = this.t - (r.lap === 0 ? this.goT : r.lapStart);
      r.lap = lap; r.lapStart = this.t;
      if (r.prog > len * 0.5) { if (!r.best || lt < r.best) r.best = lt; if (r === this.me && this.kind === 'free') this.say(L().race.lap(fmt(lt)), 2, 'good'); }
      if (this.kind === 'road' && r.lap >= LAPS && !r.done) { r.done = true; r.finishT = this.t; }
      else if (r === this.me && this.kind === 'road' && r.lap === LAPS - 1) this.say(L().race.lastLap, 1.6, 'good');
    }
  }
  finished() {
    if (this.kind === 'free') return false;
    const me = this.me, rv = this.rv;
    if (this.kind === 'drag') return me.done && (rv.done || this.t - me.finishT > 4) || rv.done && this.t - rv.finishT > 12;
    return me.done || (rv && rv.done && this.t - rv.finishT > 25);
  }
  finish() {
    this.phase = 'done';
    const me = this.me, rv = this.rv, f = x => (x == null ? '—' : x.toFixed(3)), T = L().race, R = T.rows;
    if (this.kind === 'drag') {
      const tot = r => (r.done ? r.finishT - this.goT : Infinity);
      const win = !this.foul && tot(me) < tot(rv);
      this.result = {
        title: this.foul ? T.foulTitle : win ? T.won : T.lost, win,
        rows: [[R.rt, f(me.rt), f(rv.rt)], [R.sixty, f(me.sixty), f(rv.sixty)], [R.et, f(me.et), f(rv.et)], [R.trap, me.done ? Math.round(me.trap) + ' km/h' : '—', rv.done ? Math.round(rv.trap) + ' km/h' : '—']]
      };
    } else {
      const win = me.done && (!rv.done || me.finishT <= rv.finishT);
      this.result = {
        title: win ? T.won : T.lost, win,
        rows: [[R.total, me.done ? fmt(me.finishT - this.goT) : '—', rv.done ? fmt(rv.finishT - this.goT) : T.unfinished], [R.bestLap, me.best ? fmt(me.best) : '—', rv.best ? fmt(rv.best) : '—']]
      };
    }
  }

  // ----- piloto automático del rival -----
  pilot(r) {
    const v = r.v, sp = v.spec, c = { gas: 0, brake: 0, steer: 0, analog: true, hand: false, up: false, down: false, nitro: false };
    if (this.kind === 'drag') {
      if (v.hold) {
        // acelera en vacío hasta un régimen de largada y suelta un rato después de la verde
        c.gas = v.rpm < sp.red * (0.42 + r.skill * 0.12) ? 1 : 0.15;
        if (this.goT !== null && this.t >= this.goT + (r.react ??= rnd(0.26, 0.5) / r.skill)) this.launch(r);
        return c;
      }
      c.gas = r.done ? 0 : 1; c.brake = r.done ? 0.5 : 0; c.noReverse = true;
      r.shiftQ ??= rnd(0.88, 0.97);
      if (v.rpm >= sp.red * r.shiftQ && v.shiftT <= 0) { c.up = true; r.shiftQ = rnd(0.88, 0.97); }
      c.steer = clamp((v.x - LANE) * 0.35 + v.h * 2.5, -0.5, 0.5);
      return c;
    }
    if (v.hold) { c.gas = v.rpm < sp.red * 0.45 ? 1 : 0.2; return c; }
    c.noReverse = true;
    // seguir la pista mirando adelante; frenar antes de las curvas según lo que agarra
    const T = this.track, spd = v.speed, s = r.q.s;
    const ahead = T.at(s + 7 + spd * 0.7);
    let lat = 0;
    const o = this.me.v, dxo = o.x - v.x, dzo = o.z - v.z, fwd = dxo * Math.sin(v.h) + dzo * Math.cos(v.h);
    if (fwd > 0 && fwd < 16 && Math.abs(this.me.q.lat - r.q.lat) < 2.6) lat = this.me.q.lat > 0 ? -2.4 : 2.4;
    const tx = ahead.x + ahead.rx * lat, tz = ahead.z + ahead.rz * lat;
    const err = wrapA(Math.atan2(tx - v.x, tz - v.z) - v.h);
    c.steer = clamp(-err * 2.4, -1, 1);
    const lead = this.rv && this.me ? r.prog - this.me.prog : 0;
    const budget = sp.mu * 9.81 * (0.74 + 0.16 * r.skill) * (lead > 90 ? 0.92 : lead < -90 ? 1.06 : 1);
    let vmax = 80;
    for (let d = 0; d <= 160; d += 8) {
      const k = T.curvature(s + d), vc = Math.sqrt(budget / Math.max(k, 1e-4));
      vmax = Math.min(vmax, Math.sqrt(vc * vc + 2 * budget * 0.8 * d));
    }
    if (r.surf && r.surf !== 'road') vmax = Math.min(vmax, 18);
    if (r.done) vmax = Math.min(vmax, 12);            // ya terminó: sigue despacio para no estorbar
    c.gas = spd < vmax - 0.5 ? 1 : 0;
    c.brake = spd > vmax + 1.5 ? clamp((spd - vmax) / 5, 0, 1) : 0;
    return c;
  }
}
export function fmt(t) {
  if (t == null) return '—';
  const m = Math.floor(t / 60), s = t - m * 60;
  return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2);
}
