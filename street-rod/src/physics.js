// ===== Física arcade: motor con curva de torque, cambios, agarre de neumáticos y derrapes =====
import { clamp } from './util.js';
import { MODELS, UPGRADES, GEARS_4, GEARS_CLOSE } from './data.js';

const G = 9.81;
// Los números de manejo de un auto con sus mejoras. car: { model, up, cond }. opt.auto: los cambios los pasa el juego.
export function makeSpec(car, opt = {}) {
  const M = MODELS[car.model], u = car.up, U = UPGRADES, cond = car.cond ?? 1, pot = M.pot ?? 1;
  const k = (a, lv) => 1 + (a[lv] - 1) * pot;
  const torque = M.torque * k(U.engine.torque, u.engine) * k(U.intake.torque, u.intake) * k(U.exhaust.torque, u.exhaust) * (0.75 + 0.25 * cond);
  const auto = !!opt.auto;
  return {
    mass: M.mass * k(U.weight.mass, u.weight), wb: M.shape.wb, r: M.shape.tire, cda: M.cda,
    torque, peak: M.peak + U.engine.peak[u.engine] * pot, red: M.red + U.engine.red[u.engine] * pot, idle: 800,
    gears: u.trans === 2 ? GEARS_CLOSE : u.trans === 1 ? GEARS_4 : M.gears, final: M.final, eff: 0.88,
    mu: M.mu * U.tires.mu[u.tires], lat: M.lat * U.susp.lat[u.susp], crr: 0.014,
    manual: !auto, nitro: u.nitro, shiftTime: (u.trans === 2 ? 0.15 : u.trans === 1 ? 0.2 : 0.28) + (auto ? 0.1 : 0)
  };
}
// Un cuarto de milla con un piloto que larga y cambia bien: tiempo y velocidad final (sirve para la categoría)
const _qm = new Map();
export function quarterMile(spec) {
  const key = JSON.stringify(spec);
  if (_qm.has(key)) return _qm.get(key);
  const v = new Vehicle(spec), dt = 1 / 120;
  v.hold = true;
  for (let t = 0; t < 1.5; t += dt) v.update(dt, { gas: v.rpm < spec.red * 0.55 ? 1 : 0, brake: 0, steer: 0 }, {});
  v.hold = false;
  let t = 0;
  while (v.z < 402.3 && t < 60) {
    const up = v.rpm > spec.red * 0.94 && v.shiftT <= 0 && v.vf > 3;
    v.update(dt, { gas: 1, brake: 0, steer: 0, up }, {});
    t += dt;
  }
  const r = { et: t, trap: v.speed * 3.6 };
  _qm.set(key, r);
  return r;
}
// Velocidad máxima en una recta larga (km/h)
export function topSpeed(spec) {
  const v = new Vehicle(spec), dt = 1 / 30;
  let best = 0;
  for (let t = 0; t < 90; t += dt) { v.update(dt, { gas: 1, brake: 0, steer: 0, up: v.rpm > spec.red * 0.95 && v.shiftT <= 0 }, {}); best = Math.max(best, v.speed); }
  return best * 3.6;
}

// Torque: sube hasta el máximo y cae de a poco hasta el corte
export function torqueAt(sp, rpm) {
  const k = rpm < sp.peak ? 0.5 + 0.5 * Math.sin(clamp(rpm / sp.peak, 0, 1) * Math.PI / 2) : 1 - 0.32 * Math.pow((rpm - sp.peak) / (sp.red - sp.peak), 1.5);
  return sp.torque * Math.max(0.25, k);
}

export class Vehicle {
  constructor(spec) { this.spec = spec; this.reset(0, 0, 0, 0); }
  reset(x, y, z, h) {
    Object.assign(this, { x, y, z, h, vx: 0, vz: 0, vf: 0, vl: 0, yaw: 0, steer: 0, steerAngle: 0, rpm: this.spec.idle, gear: 1, shiftT: 0,
      launchRpm: 0, spin: 0, slip: 0, limiter: 0, ax: 0, alat: 0, braking: false, hold: false, nitroT: 0, nitroLeft: this.spec.nitro,
      reversing: false, gas: 0, events: [], hint: -1, surface: 'road', bump: 0 });
  }
  get speed() { return Math.hypot(this.vx, this.vz); }
  shift(d) {
    const sp = this.spec, n = sp.gears.length;
    if (this.shiftT > 0 || this.gear + d < 1 || this.gear + d > n) return;
    const q = this.rpm / sp.red;
    let t = sp.shiftTime;
    if (d > 0 && sp.manual) {
      if (q >= 0.86) { t *= 0.45; this.events.push('perfect'); }
      else if (q < 0.65) this.events.push('early');
    }
    if (d > 0 && q > 0.75) this.events.push('pop');
    this.gear += d; this.shiftT = t; this.events.push('shift');
  }
  // inp: { gas, brake, steer, hand, up, down, nitro }  env: { mu, drag, y }
  update(dt, inp, env) {
    const sp = this.spec, n = sp.gears.length;
    // ----- dirección: el giro máximo baja con la velocidad -----
    const speed = this.speed;
    const rate = inp.analog ? 10 : (Math.sign(inp.steer) !== Math.sign(this.steer) && inp.steer ? 7 : 3.2);
    this.steer += clamp(inp.steer - this.steer, -rate * dt, rate * dt);
    const maxSteer = 0.58 - 0.46 * clamp(speed / 48, 0, 1);
    this.steerAngle = this.steer * maxSteer;
    // ----- marchas -----
    if (this.shiftT > 0) this.shiftT -= dt;
    if (inp.up) this.shift(1);
    if (inp.down) this.shift(-1);
    if (!sp.manual && this.shiftT <= 0 && !this.hold) {
      const down = this.gear > 1 && this.rpm * sp.gears[this.gear - 2] / sp.gears[this.gear - 1] < sp.red * 0.82;
      if (this.rpm > sp.red * 0.94 && this.gear < n && this.gas > 0.3) this.shift(1);
      else if (down && this.rpm < sp.peak * 0.6) this.shift(-1);
    }
    if (inp.nitro && this.nitroLeft > 0 && this.nitroT <= 0 && !this.hold) { this.nitroLeft--; this.nitroT = 3; this.events.push('nitro'); }
    // ----- giro de la carrocería (antes de las fuerzas, así el deslizamiento aparece solo) -----
    let fx = Math.sin(this.h), fz = Math.cos(this.h);
    let vf = this.vx * fx + this.vz * fz;
    const mu = sp.mu * (env.mu ?? 1);
    const handGrip = inp.hand && speed > 3 ? 0.32 : 1;
    let latGrip = mu * G * (sp.lat || 1) * handGrip * (this.spin > 0.4 ? 0.62 : 1);
    let yawT = -vf * Math.tan(this.steerAngle) / sp.wb;
    let yawLim = latGrip * 1.12 / Math.max(2, Math.abs(vf));
    if (inp.hand || this.spin > 0.4) { yawLim *= 1.9; yawT *= 1.35; }
    yawT = clamp(yawT, -yawLim, yawLim);
    const sliding = this.slip > 0.35;
    this.yaw += (yawT - this.yaw) * Math.min(1, dt * (sliding ? 3.5 : 9));
    if (this.hold) this.yaw = 0;
    this.h += this.yaw * dt;
    fx = Math.sin(this.h); fz = Math.cos(this.h);
    const rx = -fz, rz = fx;
    vf = this.vx * fx + this.vz * fz;
    let vl = this.vx * rx + this.vz * rz;
    // ----- motor y embrague -----
    const ratio = sp.gears[this.gear - 1] * sp.final;
    const wheelRpm = Math.abs(vf) / sp.r * ratio * 9.549;
    let gas = inp.gas;
    if (this.limiter > 0) { this.limiter -= dt; gas = 0; }
    this.gas = gas;
    const engaged = this.shiftT <= 0;
    if (this.hold) {
      // en la línea de largada, frenado: el motor sube de vueltas en vacío
      const free = sp.idle + gas * (sp.red * 1.02 - sp.idle);
      this.rpm += (free - this.rpm) * Math.min(1, dt * (free > this.rpm ? 5 : 3));
      this.launchRpm = this.rpm;
    } else if (!engaged) {
      // cambiando: el motor baja a las vueltas de la marcha nueva
      this.rpm += (Math.max(sp.idle, wheelRpm) - this.rpm) * Math.min(1, dt * 12);
    } else {
      // en primera, a poca velocidad, el embrague patina y el motor no baja de cierto régimen
      this.launchRpm = Math.max(sp.idle, this.launchRpm - (this.launchRpm - wheelRpm) * Math.min(1, dt * 2.2));
      const slipRpm = this.gear === 1 ? Math.max(sp.idle + gas * 1500, this.launchRpm) : sp.idle;
      const target = Math.max(wheelRpm, slipRpm);
      this.rpm += (target - this.rpm) * Math.min(1, dt * 14);
    }
    if (this.rpm >= sp.red) { this.rpm = sp.red; this.limiter = 0.06; }
    let T = torqueAt(sp, this.rpm) * gas;
    if (this.nitroT > 0) { this.nitroT -= dt; T *= 1.5; }
    let Fd = engaged && !this.hold ? T * ratio * sp.eff / sp.r : 0;
    // ----- tracción: al acelerar se carga peso atrás; si pide más de lo que agarra, patina -----
    const W = sp.mass * G;
    const rear = 0.52 + clamp(this.ax / G * 0.2, -0.08, 0.16);
    const traction = mu * W * rear * (inp.hand ? 0.35 : 1);
    let spinning = false;
    if (Fd > traction) { spinning = true; Fd = traction * 0.86 + (Fd - traction) * 0.04; }
    this.spin += ((spinning ? clamp((T * ratio * sp.eff / sp.r) / traction - 1, 0.35, 1) : 0) - this.spin) * Math.min(1, dt * (spinning ? 8 : 4));
    // ----- marcha atrás: frenando detenido -----
    if (!this.hold && !inp.noReverse && Math.abs(vf) < 1.2 && inp.brake > 0.3 && inp.gas < 0.1) this.reversing = true;
    if (inp.gas > 0.1 || vf > 1.5) this.reversing = false;
    // ----- fuerzas a lo largo -----
    const vf0 = vf;
    if (this.reversing) { if (vf > -6) vf -= 3.2 * inp.brake * dt; }
    else vf += Fd / sp.mass * dt;
    vf -= (sp.cda * 0.6 * vf * Math.abs(vf) + sp.crr * W * Math.sign(vf) * Math.min(1, Math.abs(vf) * 2)) / sp.mass * dt;
    vf -= (env.drag || 0) * vf * dt;
    const brakeIn = this.reversing ? 0 : inp.brake;
    let decel = brakeIn * mu * G * 0.95 + (inp.hand ? 0.45 * G : 0);
    if (this.reversing && inp.gas > 0.1) decel += inp.gas * mu * G;
    if (decel > 0) { const d = decel * dt; vf = Math.abs(vf) <= d ? 0 : vf - Math.sign(vf) * d; }
    this.braking = brakeIn > 0.1 || (inp.hand && speed > 1);
    // ----- agarre de costado: los neumáticos frenan el deslizamiento hasta su límite -----
    const want = -vl * Math.min(1, 14 * dt), lim = latGrip * dt;
    vl += clamp(want, -lim, lim);
    this.slip = clamp(Math.abs(vl) / 3.5 + this.spin * 0.8 + (brakeIn > 0.9 && Math.abs(vf) > 8 ? 0.3 : 0), 0, 1);
    if (this.hold) { vf = 0; vl = 0; }
    // ----- de vuelta al mundo -----
    this.vx = fx * vf + rx * vl; this.vz = fz * vf + rz * vl;
    this.x += this.vx * dt; this.z += this.vz * dt;
    this.y += ((env.y ?? 0) - this.y) * Math.min(1, dt * 12);
    this.ax += ((vf - vf0) / dt - this.ax) * Math.min(1, dt * 6);
    this.alat += (vf * this.yaw - this.alat) * Math.min(1, dt * 6);
    this.vf = vf; this.vl = vl;
  }
  // Para el tacómetro y el sonido: con el patinazo el motor se dispara
  get rpmShown() { return Math.min(this.spec.red, this.rpm + this.spin * 900); }
}
