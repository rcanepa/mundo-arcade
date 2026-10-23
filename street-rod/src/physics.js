// ===== Física: motor, caja de cambios, embrague, patinazos y zona roja =====
// Todo en metros, segundos y kilos. La velocidad v va en m/s.
const TIRE_R = 0.33, IDLE = 800, G = 9.81, QUARTER = 402.3;
const DRAG_DIST = 920;      // la picada de Street Rod es más larga que un cuarto de milla (unos 30 segundos)
const NET = 0.8;            // los caballos "brutos" de los catálogos de 1963 eran optimistas
const LAUNCH = 0.68;        // a qué fracción de las rpm de potencia máxima se larga mejor
const ENGINE_I = 0.16;      // inercia del motor y volante (kg·m²)

// Potencia relativa a una fracción x de las rpm de máxima potencia (1 en x = 1, cae al pasarse)
const powerCurve = x => Math.max(0, x + x * x - x * x * x);

class Vehicle {
  constructor(stats) {
    this.s = stats;
    this.v = 0; this.dist = 0; this.acc = 0;
    this.rpm = IDLE; this.gear = 0; this.shiftT = 0; this.clutch = 0; this.spin = 0;
    this.throttle = 0; this.brake = 0; this.offroad = 0;
    this.engineDmg = 0; this.transDmg = 0; this.blown = false; this.broken = false; this.dry = false;
    this.grinds = 0; this.redT = 0; this.events = [];
    this.fuelUse = 0;
  }
  get nGears() { return this.s.ratios.length; }
  ratio(g = this.gear) { return g > 0 ? this.s.ratios[g - 1] * this.s.axle : 0; }
  wheelRpm(g = this.gear) { return this.v / TIRE_R * this.ratio(g) * 60 / TAU; }
  dead() { return this.blown || this.broken || this.dry; }

  // Torque del motor (N·m) a unas rpm, sin contar el acelerador
  torque(rpm) {
    const s = this.s, x = Math.max(rpm, IDLE) / s.peak;
    let p = s.hp * 745.7 * NET * powerCurve(x);
    if (x < 0.6) p *= lerp(s.low, 1, x / 0.6);
    return p / (Math.max(rpm, IDLE) * TAU / 60);
  }

  // Suelta el embrague (o el freno, en los automáticos) en la partida
  launch() {
    if (this.gear !== 0) return;
    this.gear = 1;
    this.clutch = this.s.auto ? 0 : this.rpm;
  }

  shiftUp() {
    if (this.gear === 0 || this.gear >= this.nGears || this.s.auto || this.shiftT > 0 || this.dead()) return;
    // Pasar el cambio con el acelerador a fondo raspa la caja y la puede romper
    if (this.throttle > 0.35) {
      this.grinds++;
      this.transDmg += (0.2 + Math.random() * 0.12) * (1.5 - 0.5 * this.s.tc);
      this.events.push('grind');
      if (this.transDmg >= 1) { this.broken = true; this.events.push('broken'); return; }
      this.shiftT = 0.55;
      if (Math.random() < 0.35) return;    // no entró el cambio
    } else {
      this.shiftT = 0.2;
      this.events.push('shift');
    }
    this.gear++;
  }
  shiftDown() {
    if (this.gear <= 1 || this.s.auto || this.shiftT > 0 || this.dead()) return;
    this.gear--;
    this.shiftT = 0.25;
    this.events.push('shift');
  }

  // Cambios automáticos: suben cerca de la potencia máxima y bajan si se pisa a fondo
  autoShift() {
    const s = this.s;
    if (this.gear < 1 || this.shiftT > 0) return;
    const up = this.throttle > 0.6 ? s.peak * 1.06 : s.peak * 0.6;
    if (this.gear < this.nGears && this.wheelRpm() > Math.min(up, s.red - 150)) { this.gear++; this.shiftT = 0.32; this.events.push('autoshift'); }
    else if (this.gear > 1 && this.throttle > 0.9 && this.wheelRpm(this.gear - 1) < s.peak * 0.85) { this.gear--; this.shiftT = 0.3; }
  }

  step(dt, inp) {
    const s = this.s;
    this.throttle = this.dead() ? 0 : clamp(inp.throttle, 0, 1);
    this.brake = clamp(inp.brake, 0, 1);
    if (s.auto) this.autoShift();
    const m = s.mass, ratio = this.ratio(), wr = this.wheelRpm();
    let force = 0, spinTarget = 0;

    if (this.gear === 0) {
      // Detenido en la partida: el motor acelera libre (embrague apretado) hasta las vueltas justas para largar
      const target = IDLE + this.throttle * (s.peak * LAUNCH - IDLE);
      this.rpm = approach(this.rpm, target, (target > this.rpm ? 7000 : 3500) * dt);
    } else if (this.shiftT > 0) {
      // Pasando el cambio: no hay tracción; el motor baja de vueltas (o sube si se acelera)
      this.shiftT -= dt;
      const free = IDLE + this.throttle * (s.red - 200 - IDLE);
      this.rpm = approach(this.rpm, Math.max(free, s.auto ? wr : IDLE), 4500 * dt);
      if (s.auto) force = this.torque(this.rpm) * this.throttle * ratio * 0.35 / TIRE_R;
      if (this.shiftT <= 0 && !s.auto) this.rpm = Math.max(IDLE, wr);
    } else {
      let rpm = wr * (1 + this.spin), mult = 1;
      if (s.auto) {
        // Convertidor de torque: deja subir las vueltas a baja velocidad y multiplica la fuerza
        const stall = 1500 + s.peak * 0.12 * this.throttle;
        if (rpm < stall) { mult = 1 + 0.9 * (1 - rpm / stall); rpm = lerp(rpm, stall, 0.85); }
      } else if (this.clutch > 0) {
        // Embrague patinando en la largada: las vueltas bajan de a poco hasta enganchar
        this.clutch -= 3200 * dt * (0.6 + this.throttle);
        if (this.clutch > rpm) rpm = this.clutch; else this.clutch = 0;
      }
      if (rpm < IDLE) rpm = IDLE;
      this.rpm = Math.min(rpm, s.red + 1400);
      const eff = s.auto ? 0.82 : 0.88;
      force = this.torque(this.rpm) * this.throttle * mult * ratio * eff / TIRE_R;
      // Agarre de las ruedas traseras (al acelerar el peso se va atrás)
      const rear = m * G * (0.5 + 0.1 * clamp(this.acc / G, 0, 1.2));
      const fmax = s.grip * rear * (this.offroad ? 0.65 : 1);
      if (force > fmax) {
        spinTarget = clamp((force / fmax - 1) * 0.9, 0, 1.3);
        force = fmax * 0.9;
      }
    }
    this.spin = approach(this.spin, spinTarget, (spinTarget > this.spin ? 4 : 2.5) * dt);

    // Zona roja: el motor aguanta un rato y después revienta
    if (this.rpm > s.red && !this.blown) {
      const over = (this.rpm - s.red) / 700;
      this.redT += dt;
      this.engineDmg += dt * (0.12 + over * 0.55) * (1.7 - 0.7 * (this.s.ec ?? 1));
      if (this.engineDmg >= 1) { this.blown = true; this.events.push('blown'); }
    } else this.redT = 0;

    const drag = 0.5 * 1.2 * s.cda * this.v * this.v;
    const roll = (0.015 + this.offroad * 0.12) * m * G * (this.v > 0.1 ? 1 : 0);
    const brake = this.brake * 0.8 * G * m * (this.v > 0.05 ? 1 : 0);
    const meff = m + ENGINE_I * (ratio / TIRE_R) * (ratio / TIRE_R) * 0.9;
    const a = (force - drag - roll - brake) / meff;
    this.acc = a;
    this.v = Math.max(0, this.v + a * dt);
    this.dist += this.v * dt;
    this.fuelUse += dt * (0.0004 + 0.0022 * this.throttle * this.rpm / s.red) * s.engine.ci / 300;
  }
}

// ----- Pilotos de la computadora -----
// Devuelve qué hacer este instante: acelerar, frenar, pasar cambios. skill = 0..1.
function makeDriver(skill, rnd = Math.random) {
  return {
    skill,
    react: lerp(0.62, 0.17, skill) + rnd() * 0.12,       // segundos que tarda en largar
    launchAt: lerp(0.45, 0.72, skill) + (rnd() - 0.5) * 0.12,
    shiftAt: lerp(0.9, 1.02, skill) + (rnd() - 0.5) * 0.06,
    lift: 0
  };
}
// Un paso del piloto automático en línea recta. target = velocidad que quiere llevar (m/s), o Infinity.
function driveStraight(veh, drv, dt, goT, target = Infinity) {
  const s = veh.s;
  const inp = { throttle: 0, brake: 0 };
  if (veh.gear === 0) {
    inp.throttle = veh.rpm < s.peak * drv.launchAt ? 1 : 0.4;
    if (goT !== null && goT >= drv.react) { veh.launch(); }
    return inp;
  }
  if (veh.v > target + 1) { inp.brake = clamp((veh.v - target) / 8, 0.15, 1); return inp; }
  inp.throttle = veh.v < target - 2 ? 1 : 0.55;
  if (veh.shiftT > 0 && !s.auto) inp.throttle = 0;
  if (!s.auto) {
    if (drv.lift > 0) { drv.lift -= dt; inp.throttle = 0; if (drv.lift <= 0) { veh.throttle = 0; veh.shiftUp(); } }
    else if (veh.gear < veh.nGears && veh.rpm > Math.min(s.peak * 1.08 * drv.shiftAt, s.red - 60) && veh.shiftT <= 0 && veh.clutch <= 0) {
      drv.lift = 0.06; inp.throttle = 0;
    }
  }
  return inp;
}

// Tiempo del cuarto de milla y velocidad final con un piloto perfecto (para el diario y para elegir rivales)
function quarterMile(stats) {
  const veh = new Vehicle(stats), drv = makeDriver(1, () => 0.5);
  drv.react = 0; drv.launchAt = 0.62; drv.shiftAt = 1;
  const dt = 1 / 120;
  let t = 0;
  for (let i = 0; i < 60 * 120 && veh.dist < QUARTER; i++) {
    veh.step(dt, driveStraight(veh, drv, dt, 1));
    if (veh.gear > 0) t += dt;
  }
  return { et: veh.dist >= QUARTER ? t : 60, trap: veh.v };
}
const _etCache = new Map();
function carET(car) {
  const key = JSON.stringify([car.model, Math.round((car.tune || 0) * 2), car.mods.noroof, car.mods.nobump, SLOTS.map(sl => car.p[sl] ? car.p[sl].k + (car.p[sl].c ?? 1).toFixed(2) : '')]);
  let r = _etCache.get(key);
  if (!r) {
    r = carRuns(car) ? quarterMile(carStats(car)) : { et: 60, trap: 0 };
    if (_etCache.size > 400) _etCache.clear();
    _etCache.set(key, r);
  }
  return r;
}
// Velocidad máxima: la menor entre lo que da el motor contra el viento y la zona roja en el último cambio
function topSpeed(stats) {
  const veh = new Vehicle(stats);
  let best = 0;
  for (let v = 10; v < 90; v += 0.5) {
    veh.v = v;
    const g = veh.nGears, rpm = veh.wheelRpm(g);
    if (rpm > stats.red) break;
    const f = veh.torque(rpm) * veh.ratio(g) * 0.86 / TIRE_R;
    if (f < 0.5 * 1.2 * stats.cda * v * v + 0.015 * stats.mass * G) break;
    best = v;
  }
  return best;
}
