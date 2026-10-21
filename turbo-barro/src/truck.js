// ===== Camionetas: física, IA y dibujo =====
const NO_INPUT = { gas: false, brake: false, steer: 0, nitro: false };

class Truck {
  constructor(r) {
    this.r = r; // datos que duran todo el campeonato (dinero, mejoras...)
    this.name = r.name; this.color = r.color; this.dark = r.dark;
    this.model = r.model || 'pickup'; this.decal = r.decal || 0; this.horn = r.horn || 0; this.dirt = 0;
    this.human = r.human; this.player = r.player;
    this.upg = { ...r.upg }; this.skill = r.skill || 1; this.rb = 1;
    this.nitros = r.nitros; this.nitroT = 0; this.nitroHeld = false;
    this.x = 0; this.y = 0; this.a = 0; this.vx = 0; this.vy = 0; this.z = 0; this.vz = 0;
    this.idx = 0; this.prog = 0; this.lapDone = -1; this.finished = false; this.place = 0; this.pos = 0;
    this.earned = 0; this.stuckT = 0; this.revT = 0; this.revSteer = 1; this.lane = 0; this.laneT = 0;
    this.surface = 'dirt'; this.lastSurf = 'dirt'; this.fxT = 0; this.lastBump = -1;
  }

  spawn(t, off, lat) {
    this.idx = wrap(t, off);
    const p = t.pts[this.idx];
    this.x = p.x + p.nx * lat; this.y = p.y + p.ny * lat;
    this.a = Math.atan2(p.ty, p.tx); this.prog = off;
  }

  get speed() { return Math.hypot(this.vx, this.vy); }

  stats() {
    const u = this.upg, s = this.skill * this.rb, m = MODELS[this.model] || MODELS.pickup;
    return {
      max: (185 + u.motor * 20) * s * m.max,
      accel: (230 + u.acel * 42) * s * m.accel,
      turn: (3.0 + u.llantas * 0.22) * m.turn,
      grip: (5 + u.llantas * 1.4) * m.grip,
      shock: u.amort + m.bump, mud: m.mud, jump: m.jump, mass: m.mass
    };
  }

  update(dt, inp, race) {
    const t = race.track, st = this.stats();
    this.surface = 'dirt';
    if (this.z <= 0) {
      for (const pd of t.puddles) {
        if ((this.x - pd.x) ** 2 + (this.y - pd.y) ** 2 < pd.r * pd.r) { this.surface = pd.type; break; }
      }
    }
    let maxS = st.max, drag = 0;
    if (this.surface === 'mud') { maxS *= Math.min(1, 0.42 + st.shock * 0.04 + this.upg.llantas * 0.03 + st.mud); drag = 1.2 * (1 - st.mud); }
    if (this.surface === 'water') { maxS *= 0.6 + st.shock * 0.05; drag = 0.6; }
    if (this.nitroT > 0) { this.nitroT -= dt; maxS *= 1.45; }
    // el barro ensucia la camioneta y el agua la lava
    if (this.surface === 'mud') this.dirt = Math.min(1, this.dirt + dt * 0.9);
    else if (this.surface === 'water') this.dirt = Math.max(0, this.dirt - dt * 1.4);
    else if (this.z <= 0 && this.speed > 120) this.dirt = Math.min(1, this.dirt + dt * 0.006);

    if (this.z > 0 || this.vz > 0) {
      // en el aire: no se puede doblar ni acelerar
      this.z += this.vz * dt; this.vz -= 950 * dt;
      if (this.z <= 0) {
        this.z = 0;
        if (this.vz < -120) {
          const k = Math.min(1, 0.8 + st.shock * 0.035);
          this.vx *= k; this.vy *= k;
          race.fx('land', this);
        }
        this.vz = 0;
      }
    } else {
      let fx = Math.cos(this.a), fy = Math.sin(this.a);
      const f0 = this.vx * fx + this.vy * fy;
      const sf = 0.35 + 0.65 * Math.min(1, Math.abs(f0) / 70);
      this.a += inp.steer * st.turn * sf * (f0 < -5 ? -1 : 1) * dt;
      fx = Math.cos(this.a); fy = Math.sin(this.a);
      let fwd = this.vx * fx + this.vy * fy, lat = -this.vx * fy + this.vy * fx;
      const boost = this.nitroT > 0 ? 2.2 : 1;
      if (inp.gas) { if (fwd < maxS) fwd = Math.min(maxS, fwd + st.accel * boost * dt * (fwd < 0 ? 2 : 1)); }
      else if (inp.brake) fwd -= (fwd > 0 ? 420 : 170) * dt;
      else fwd *= Math.exp(-1.2 * dt);
      if (fwd > maxS) fwd += (maxS - fwd) * Math.min(1, 2.5 * dt);
      if (fwd < -90) fwd = -90;
      fwd *= Math.exp(-drag * dt);
      lat *= Math.exp(-st.grip * dt); // el agarre de las llantas frena el derrape
      this.vx = fx * fwd - fy * lat; this.vy = fy * fwd + fx * lat;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;

    // avance por la pista
    const oldIdx = this.idx;
    this.idx = nearestIdx(t, this.x, this.y, oldIdx);
    let d = this.idx - oldIdx;
    if (d > t.N / 2) d -= t.N;
    if (d < -t.N / 2) d += t.N;
    this.prog += d;

    if (this.z <= 0 && d > 0) {
      for (const j of t.jumps) {
        const w = wrap(t, j - oldIdx);
        if (w > 0 && w <= d) {
          const f = this.vx * Math.cos(this.a) + this.vy * Math.sin(this.a);
          if (f > 70) { this.vz = Math.min(360, f * 1.2) * st.jump; this.z = 0.01; race.fx('jump', this, f); }
        }
      }
      for (const b of t.bumps) {
        if (inRange(t, this.idx, b.i0, b.i1) && wrap(t, this.idx - b.i0) % 3 === 0 && this.lastBump !== this.idx) {
          this.lastBump = this.idx;
          const sp = this.speed;
          if (sp > 80) {
            this.vz = (40 + sp * 0.35) * (1 - st.shock * 0.1); this.z = 0.01;
            const k = Math.min(1, 0.95 + st.shock * 0.008);
            this.vx *= k; this.vy *= k;
            race.fx('bump', this);
          }
        }
      }
    }

    // muros: empuja de vuelta a la pista y rebota
    const p = t.pts[this.idx];
    const off = (this.x - p.x) * p.nx + (this.y - p.y) * p.ny, lim = t.hw - 8;
    if (Math.abs(off) > lim) {
      const s = Math.sign(off), push = Math.abs(off) - lim;
      this.x -= p.nx * push * s; this.y -= p.ny * push * s;
      const vn = this.vx * p.nx + this.vy * p.ny;
      if (vn * s > 0) {
        this.vx -= p.nx * vn * 1.5; this.vy -= p.ny * vn * 1.5;
        this.vx *= 0.92; this.vy *= 0.92;
        // ayuda: endereza un poco la camioneta hacia la pista
        this.a += angDiff(Math.atan2(p.ty, p.tx), this.a) * 0.12;
        if (Math.abs(vn) > 50) race.fx('wall', this, Math.abs(vn));
      }
    }
  }

  drawShadow(g) {
    g.save();
    g.translate(this.x + 2 + this.z * 0.15, this.y + 3 + this.z * 0.2); g.rotate(this.a);
    g.fillStyle = `rgba(0,0,0,${0.35 - Math.min(0.2, this.z / 400)})`;
    roundRect(g, -14, -10, 28, 20, 6); g.fill();
    g.restore();
  }

  draw(g, demo) {
    const sc = 1 + this.z / 160, y = this.y - this.z * 0.5;
    g.save(); g.translate(this.x, y); g.rotate(this.a); g.scale(sc, sc);
    drawTruck(g, this);
    g.restore();
    if (this.human && !demo) {
      const ay = y - 20 * sc;
      g.fillStyle = this.color; tri(g, this.x - 6, ay - 7, this.x + 6, ay - 7, this.x, ay + 1); g.fill();
      g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
      if (Game.players === 2) {
        g.font = font(11); g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = 3; g.strokeStyle = '#000'; g.strokeText(this.player + 1, this.x, ay - 15);
        g.fillStyle = '#fff'; g.fillText(this.player + 1, this.x, ay - 15);
      }
    }
  }
}

// ===== Pilotos de la computadora =====
function aiInput(car, race) {
  const t = race.track, dt = race.dt, spd = car.speed;
  if (car.revT > 0) {
    car.revT -= dt;
    return { gas: false, brake: true, steer: car.revSteer, nitro: false };
  }
  car.laneT -= dt;
  if (car.laneT <= 0) { car.lane = (Math.random() * 2 - 1) * 0.45; car.laneT = 1.5 + Math.random() * 2.5; }
  const look = 5 + Math.floor(spd / 35);
  const p = t.pts[wrap(t, car.idx + look)];
  let lane = car.lane;
  for (const pd of t.puddles) {
    if ((p.x - pd.x) ** 2 + (p.y - pd.y) ** 2 < (pd.r + t.hw * 0.6) ** 2) {
      const side = (pd.x - p.x) * p.nx + (pd.y - p.y) * p.ny;
      lane = side > 0 ? -0.62 : 0.62;
    }
  }
  let tx = p.x + p.nx * lane * t.hw, ty = p.y + p.ny * lane * t.hw;
  for (const pk of race.pickups) {
    const dx = pk.x - car.x, dy = pk.y - car.y;
    if (dx * dx + dy * dy < 110 * 110 && Math.abs(angDiff(Math.atan2(dy, dx), car.a)) < 0.5) { tx = pk.x; ty = pk.y; }
  }
  const diff = angDiff(Math.atan2(ty - car.y, tx - car.x), car.a);
  const far = t.pts[wrap(t, car.idx + look + 10)];
  const curve = Math.abs(angDiff(Math.atan2(far.y - p.y, far.x - p.x), car.a));
  const st = car.stats();
  let gas = true, brake = false;
  if (curve > 1.0 && spd > st.max * 0.75) gas = false;
  if (Math.abs(diff) > 1.3 && spd > 80) { gas = false; brake = true; }
  const nitro = !car.finished && car.nitros > 0 && car.nitroT <= 0 && curve < 0.3 && Math.abs(diff) < 0.2 && Math.random() < 0.008;
  if (race.state === 'race' && spd < 20) {
    car.stuckT += dt;
    if (car.stuckT > 1.0) { car.stuckT = 0; car.revT = 0.7; car.revSteer = diff > 0 ? -1 : 1; }
  } else car.stuckT = 0;
  return { gas, brake, steer: clamp(diff * 3, -1, 1), nitro };
}
