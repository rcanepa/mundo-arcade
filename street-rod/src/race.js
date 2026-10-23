// ===== Carreras: picadas de cuarto de milla y carreras de ruta, vistas desde el asiento =====
const POLICE_GIVEUP = 380, FINE_STOP = 20, FINE_CAUGHT = 75;

// Cuánto puede doblar un auto en una curva sin salirse (m/s²)
const latGrip = (stats, skill = 1) => stats.lat * G * stats.handling * (0.78 + 0.22 * skill);
// Velocidad segura mirando la pista que viene (para los pilotos de la computadora y la policía)
function safeSpeed(T, z, v, grip, brake = 6) {
  let best = 90;
  for (let d = 0; d < 170; d += SEG) {
    const s = segAt(T, z + d), k = Math.abs(s.curve);
    if (k < 1e-5) continue;
    const vc = Math.sqrt(grip / k);
    best = Math.min(best, Math.sqrt(vc * vc + 2 * brake * d));
  }
  return best;
}

class Race {
  // o = { type: 'drag'|'road', car, rival: { name, look, car, skill, king }, bet, seed, police (0..1), units, auto (piloto automático para pruebas) }
  constructor(o) {
    this.o = o; this.type = o.type; this.t = 0;
    this.T = o.type === 'drag' ? buildDragStrip(o.seed) : buildRoadCourse(o.seed);
    const z0 = this.T.start - 3;
    const meStats = carStats(o.car), rvStats = carStats(o.rival.car);
    this.me = { car: o.car, s: meStats, veh: new Vehicle(meStats), z: z0, x: LANE, vx: 0, steer: 0, shake: 0, startZ: z0 };
    this.rv = { car: o.rival.car, s: rvStats, veh: new Vehicle(rvStats), z: z0, x: -LANE, vx: 0, drv: makeDriver(o.rival.skill), lane: -LANE, startZ: z0, crashed: false };
    if (o.auto) this.me.drv = makeDriver(1, () => 0.5);
    this.phase = 'intro'; this.phaseT = 0;
    this.flag = 0;           // 0 abajo, 1 arriba, 2 bajó (¡ya!)
    this.goAt = 0; this.goT = null;
    this.dropAfter = 1.3 + Math.random() * 1.9;
    this.rivalJump = o.rival.skill < 0.66 && !o.rival.king && Math.random() < 0.12;
    this.msg = null; this.hint = null; this.flash = 0; this.crack = 0;
    this.cross = { me: null, rv: null };
    this.reaction = null;
    this.scroll = 0;
    this.result = null; this.endT = 0;
    this.fuel0 = o.car.fuel;
    this.trap = 0;
    this.traffic = [];
    this.cop = null;
    this.copZ = o.type === 'road' && Math.random() < (o.police || 0) ? this.T.finish * (0.2 + Math.random() * 0.4) : null;
    if (o.type === 'road') this.spawnTraffic(rng(o.seed * 31 + 7));
    this.smoke = [];
  }

  spawnTraffic(R) {
    const len = this.T.finish;
    for (let i = 0; i < 11; i++) {
      const model = rpick(R, ['chevy49', 'dodge50', 'merc48', 'olds54', 'plym57', 'valiant60', 'nomad56']);
      this.traffic.push({ z: 450 + R() * len * 1.9, x: -LANE, v: -(17 + R() * 6), car: makeCar(model, { color: rpick(R, MODELS[model].colors) }), oncoming: true });
    }
    for (let i = 0; i < 5; i++) {
      const model = rpick(R, ['chevy49', 'dodge50', 'merc48', 'ford40', 'olds49', 'valiant60']);
      this.traffic.push({ z: 500 + R() * (len - 700), x: LANE, v: 15 + R() * 5, car: makeCar(model, { color: rpick(R, MODELS[model].colors) }), oncoming: false });
    }
  }

  say(text, t = 2.2, color = '#fff') { this.msg = { text, t, color, max: t }; }

  update(dt) {
    this.t += dt; this.phaseT += dt;
    const me = this.me, rv = this.rv;
    if (this.msg && (this.msg.t -= dt) <= 0) this.msg = null;
    this.flash = Math.max(0, this.flash - dt * 2);
    const inp = this.playerInput(dt);
    // ----- partida -----
    if (this.phase === 'intro' && this.phaseT > 2.2) { this.phase = 'stage'; this.phaseT = 0; }
    if (this.phase === 'stage') {
      if (this.flag === 0 && this.phaseT > 0.7) { this.flag = 1; Sound.sfx.flag(); }
      if (this.flag === 1 && this.phaseT > 0.7 + this.dropAfter) {
        this.flag = 2; this.goAt = this.t; this.phase = 'run'; this.phaseT = 0;
        Sound.sfx.go(); this.say(L().race.go, 1, '#ffd23a');
      } else if (this.rivalJump && this.flag === 1 && this.phaseT > 0.7 + this.dropAfter - 0.35) {
        rv.veh.launch(); return this.finish('win', 'rivalFoul');
      }
    }
    if (inp.launch && me.veh.gear === 0 && this.phase !== 'done') {
      if (this.phase !== 'run') { me.veh.launch(); return this.finish('lose', 'foul'); }
      me.veh.launch(); this.reaction = this.t - this.goAt;
    }
    this.goT = this.phase === 'run' || this.phase === 'done' ? this.t - this.goAt : null;
    // ----- autos -----
    this.stepCar(me, dt, inp);
    const rinp = this.phase === 'stage' || this.phase === 'intro'
      ? driveStraight(rv.veh, rv.drv, dt, null)
      : this.rivalInput(dt);
    this.stepCar(rv, dt, rinp);
    if (this.phase === 'run' || this.phase === 'done') this.stepTraffic(dt);
    // ----- llegada -----
    for (const [k, c] of [['me', me], ['rv', rv]]) {
      if (this.cross[k] === null && c.z >= this.T.finish) {
        const over = (c.z - this.T.finish) / Math.max(1, c.veh.v);
        this.cross[k] = this.t - this.goAt - over;
        if (k === 'me') this.trap = c.veh.v;
      }
    }
    if (this.phase === 'run') this.checkEnd(dt);
    if (this.phase === 'done') { this.endT += dt; }
    // sonido y efectos
    for (const ev of me.veh.events) {
      if (ev === 'shift') Sound.sfx.clunk();
      if (ev === 'grind') { Sound.sfx.grind(); this.say(L().race.grind, 2.4, '#ff8a6a'); }
      if (ev === 'blown') { Sound.sfx.boom(); this.flash = 0.6; }
      if (ev === 'broken') Sound.sfx.grind();
    }
    me.veh.events.length = 0; rv.veh.events.length = 0;
    if (me.veh.spin > 0.25 && me.veh.v < 40) this.puff(me, me.veh.spin);
    if (rv.veh.spin > 0.25 && rv.veh.v < 40) this.puff(rv, rv.veh.spin);
    for (const p of this.smoke) { p.age += dt; p.x += p.vx * dt; p.y -= dt * 0.6; p.r += dt * 1.6; }
    this.smoke = this.smoke.filter(p => p.age < 2.2);
    this.scroll += segAt(this.T, me.z).curve * me.veh.v * dt * 900;
  }

  puff(c, k) {
    if (Math.random() > k * 0.9) return;
    for (const side of [-0.75, 0.75]) this.smoke.push({ who: c, z: c.z - 2.2, x: c.x + side, y: 0.3, vx: side * 0.6, r: 0.6, age: 0 });
  }

  playerInput(dt) {
    const me = this.me;
    if (this.o.auto) {
      if (this.phase === 'intro') return { throttle: 0, brake: 0, steer: 0 };
      const drv = me.drv;
      if (me.veh.gear === 0) {
        const r = driveStraight(me.veh, drv, dt, this.phase === 'run' ? this.t - this.goAt : null);
        const launch = me.veh.gear > 0; if (launch) { me.veh.gear = 0; }
        return { throttle: r.throttle, brake: 0, steer: 0, launch };
      }
      const target = this.type === 'road' ? Math.min(safeSpeed(this.T, me.z, me.veh.v, latGrip(me.s) * 0.95), this.trafficLimit(me, this.rv)) : Infinity;
      const r = driveStraight(me.veh, drv, dt, 1, target);
      if (this.type === 'road') me.lane = this.aiLane(me, this.rv, LANE);
      const tx = this.type === 'road' ? me.lane : LANE;
      return { throttle: r.throttle, brake: r.brake, steer: clamp((tx - me.x) * 1.6 - me.vx * 0.5, -1, 1), auto: true };
    }
    const k = Input.read();
    const out = { throttle: k.gas ? 1 : 0, brake: k.brake ? 1 : 0, steer: k.steer, launch: false };
    if (k.up) { if (me.veh.gear === 0) out.launch = true; else me.veh.shiftUp(); }
    if (k.down) me.veh.shiftDown();
    if (k.horn) Sound.sfx.horn();
    if (this.phase === 'done') { out.throttle = 0; out.brake = 0.4; }
    return out;
  }

  // Elige carril con tres estados: va por su pista, adelanta por la izquierda, o aborta y vuelve detrás del lento
  aiLane(c, other, pref) {
    const v = c.veh.v, T = this.traffic;
    const oncoming = win => T.some(o => o.oncoming && o.z > c.z - 6 && o.z - c.z < win);
    const slowAhead = (x, far) => T.find(o => !o.oncoming && Math.abs(o.x - x) < 1.2 && o.z > c.z - 6 && o.z - c.z < far && o.v < v + 1) ||
      (Math.abs(other.x - x) < 1.9 && other.z > c.z - 6 && other.z - c.z < Math.min(far, 18) && other.veh.v < v + 1 ? other : null);
    const beside = x => T.some(o => !o.oncoming && Math.abs(o.x - x) < 1.4 && o.z - c.z > -6 && o.z - c.z < 7.5) || (Math.abs(other.x - x) < 1.9 && other.z - c.z > -6 && other.z - c.z < 7);
    c.ai = c.ai || 'cruise';
    if (c.ai === 'cruise') {
      if (slowAhead(LANE, 22 + v) && !oncoming(260 + v * 5) && !beside(-LANE)) c.ai = 'pass';
    } else if (c.ai === 'pass') {
      if (oncoming(170 + v * 3.5)) c.ai = 'abort';
      else if (!slowAhead(LANE, 10 + v * 0.6) && !beside(LANE)) c.ai = 'cruise';
    } else if (c.ai === 'abort') {
      if (!beside(LANE) && !slowAhead(LANE, 6)) c.ai = 'cruise';
      else if (!oncoming(240 + v * 5)) c.ai = 'pass';
    }
    if (pref < 0 && c.ai === 'cruise' && !oncoming(240 + v * 5)) return -LANE;
    return c.ai === 'pass' ? -LANE : c.ai === 'abort' ? (beside(LANE) ? -LANE : LANE) : LANE;
  }
  // Velocidad máxima para no chocar al de adelante (o al que viene de frente por tu pista), mirando también el carril al que va
  trafficLimit(c, other) {
    let lim = 90;
    const b = 6.5, lane = c.lane ?? c.x;
    const ahead = (oz, ox, ov, oncoming) => {
      if (oz < c.z || (Math.abs(c.x - ox) > 2.1 && Math.abs(lane - ox) > 1)) return;
      const d = oz - c.z - 9;
      lim = Math.min(lim, d < 0 ? Math.max(0, ov - 2) : Math.sqrt(Math.max(0, ov) ** 2 + 2 * b * d));
    };
    // frenar no sirve contra el que viene de frente: lo que salva es volver a la derecha
    for (const o of this.traffic) if (!o.oncoming) ahead(o.z, o.x, o.v, false);
    if (other) ahead(other.z, other.x, other.veh.v, false);
    // abortando un adelantamiento: frena para quedar detrás del lento
    if (c.ai === 'abort') for (const o of this.traffic) if (!o.oncoming && o.x > 0 && o.z - c.z > -9 && o.z - c.z < 12) lim = Math.min(lim, Math.max(8, o.v - 7));
    return lim;
  }

  rivalInput(dt) {
    const rv = this.rv;
    if (this.type === 'drag') return driveStraight(rv.veh, rv.drv, dt, this.t - this.goAt);
    rv.lane = this.aiLane(rv, this.me, LANE);
    const target = Math.min(safeSpeed(this.T, rv.z, rv.veh.v, latGrip(rv.s, rv.drv.skill) * 0.93, 4 + 3 * rv.drv.skill), this.trafficLimit(rv, this.me));
    return driveStraight(rv.veh, rv.drv, dt, this.t - this.goAt, target);
  }

  stepCar(c, dt, inp) {
    const v = c.veh, T = this.T;
    v.offroad = Math.abs(c.x) > ROAD_W + 0.4 ? 1 : 0;
    v.step(dt, inp);
    c.z += v.v * dt;
    const seg = segAt(T, c.z);
    if (c === this.me) {
      // volante: el teclado gira de a poco; las curvas empujan hacia afuera
      c.steer = approach(c.steer, inp.steer || 0, dt * (inp.auto ? 6 : 3.2));
      const grip = latGrip(c.s);
      const aReq = v.v * v.v * seg.curve;
      const aSteer = c.steer * grip * clamp(v.v / 8, 0, 1);
      let slide = 0;
      if (Math.abs(aReq) > grip) slide = (Math.abs(aReq) - grip) * Math.sign(aReq);
      const target = (aSteer - aReq) * 0.36;
      c.vx = lerp(c.vx, target, clamp(dt * 5, 0, 1));
      c.x = clamp(c.x + c.vx * dt, -ROAD_W - 7, ROAD_W + 7);
      c.slide = Math.abs(slide) + (Math.abs(aSteer) > grip * 0.92 && v.v > 15 ? 0.3 : 0);
      if (v.offroad) { c.shake = 1; }
      if (this.type === 'drag' && this.phase === 'run' && v.spin > 0.3) c.vx += (Math.random() - 0.5) * v.spin * 3 * dt;
    } else {
      c.x = approach(c.x, c.lane ?? c.x, dt * 2.6);
    }
  }

  stepTraffic(dt) {
    const me = this.me, rv = this.rv;
    for (const o of this.traffic) {
      if (!o.oncoming) {
        // los autos lentos frenan si tienen a alguien pegado adelante
        o.z += o.v * dt;
      } else o.z += o.v * dt;
    }
    // choques con el tráfico
    for (const o of this.traffic) {
      for (const c of [me, rv]) {
        if (Math.abs(o.z - c.z) < 4.4 && Math.abs(o.x - c.x) < 1.8) {
          const closing = Math.abs(c.veh.v - o.v);
          if (c === me) {
            if (closing > 6) return this.crash(closing, o);
            // toque suave: si es por detrás frena; si van lado a lado se empujan
            if (Math.abs(o.z - c.z) > 3) { c.veh.v = Math.min(c.veh.v, Math.max(0, o.v - 1)); c.z = o.z - Math.sign(o.z - c.z) * 4.5; }
            else c.x += c.x > o.x ? 0.25 : -0.25;
            Sound.sfx.bump(); this.flash = 0.12;
          } else if (closing > 10 && this.phase === 'run') {
            c.crashed = true; c.veh.v = 0; c.veh.dry = true;
            Sound.sfx.crash();
            return this.finish('win', 'rivalCrash');
          } else c.veh.v = Math.max(0, o.v - 1);
        }
      }
    }
    // roces con el rival
    if (Math.abs(me.z - rv.z) < 4.4 && Math.abs(me.x - rv.x) < 1.85) {
      const closing = Math.abs(me.veh.v - rv.veh.v);
      if (closing > 15) return this.crash(closing, rv);
      const push = me.x > rv.x ? 1 : -1;
      me.x += push * 0.35; me.vx = push * 1.5; Sound.sfx.bump(); this.flash = 0.15;
      if (me.z < rv.z) me.veh.v *= 0.97; else rv.veh.v *= 0.97;
    }
    // postes, árboles y rocas al salirse del camino
    if (Math.abs(me.x) > ROAD_W + 0.8) {
      const s = segAt(this.T, me.z + 2);
      for (const sp of s.sprites) {
        const S = SPRITES[sp.key];
        if (S && S.hit && Math.abs(sp.x - me.x) < S.w * S.hit * 0.5 + 0.9) {
          if (me.veh.v > 9) return this.crash(me.veh.v, null);
          me.veh.v = 0;
        }
      }
    }
    // la policía
    if (this.copZ !== null && !this.cop && me.z > this.copZ) {
      this.cop = { z: me.z - 130, x: LANE, v: me.veh.v, catchT: 0, s: { lat: 0.9, handling: 0.95 } };
      this.say(L().race.police, 3.2, '#ff6a6a');
    }
    if (this.cop) this.stepCop(dt);
  }

  stepCop(dt) {
    const cop = this.cop, me = this.me;
    const gap = me.z - cop.z;
    const target = Math.min(64, me.veh.v + 14, safeSpeed(this.T, cop.z, cop.v, 0.92 * G * 0.95, 7));
    cop.v = approach(cop.v, target, dt * (cop.v < target ? 7.5 : 9));
    cop.z += cop.v * dt;
    cop.x = approach(cop.x, gap < 60 ? me.x : LANE, dt * 3);
    Sound.siren(true, clamp(1 - gap / 400, 0.15, 1));
    if (gap < 9) cop.catchT += dt; else cop.catchT = Math.max(0, cop.catchT - dt * 0.5);
    if (me.veh.v < 2.5 && gap < 160) return this.finish('void', 'stopped');
    if (cop.catchT > 1.4) return this.finish('void', 'caught');
    if (gap > POLICE_GIVEUP) { this.cop = null; this.copZ = null; Sound.siren(false, 0); this.say(L().race.lostCops, 2.6, '#9dffa0'); }
  }

  crash(speed, other) {
    Sound.sfx.crash(); this.flash = 1; this.crack = 1;
    this.me.veh.v = 0; this.me.veh.throttle = 0;
    this.damage = clamp(speed / 38, 0.2, 1);
    return this.finish('lose', 'crash');
  }

  checkEnd(dt) {
    const me = this.me, v = me.veh;
    // bencina
    if (!v.dry) {
      const left = this.fuel0 - v.fuelUse * 3;
      if (left <= 0) { v.dry = true; this.say(L().race.dry, 3, '#ffb36a'); }
    }
    if (v.dead() && !this.deadT) this.deadT = this.t;
    if (this.cross.me !== null || this.cross.rv !== null) {
      if (this.cop && this.cross.me !== null) return this.finish('void', 'caught');
      const winMe = this.cross.me !== null && (this.cross.rv === null || this.cross.me <= this.cross.rv);
      return this.finish(winMe ? 'win' : 'lose', 'finish');
    }
    if (this.deadT && this.t - this.deadT > 1.6) return this.finish('lose', v.blown ? 'blown' : v.broken ? 'broken' : 'dry');
    // si te quedaste muy atrás (más de 30 segundos), la carrera termina
    if (this.t - this.goAt > (this.type === 'drag' ? 75 : 260)) return this.finish('lose', 'finish');
  }

  finish(outcome, reason) {
    if (this.phase === 'done') return;
    this.phase = 'done'; this.endT = 0;
    Sound.siren(false, 0);
    const me = this.me, v = me.veh;
    const fine = reason === 'stopped' ? FINE_STOP : reason === 'caught' ? FINE_CAUGHT : 0;
    // el que perdió la picada no alcanzó a llegar: se calcula cuánto le faltaba
    if (reason === 'finish' && this.type === 'drag') {
      for (const [k, c] of [['me', this.me], ['rv', this.rv]]) {
        if (this.cross[k] !== null) continue;
        this.cross[k] = this.t - this.goAt + Math.max(0, this.T.finish - c.z) / Math.max(8, c.veh.v);
        if (k === 'me') this.trap = c.veh.v;
      }
    }
    this.result = {
      outcome, reason, fine,
      time: this.cross.me, rivalTime: this.cross.rv, trap: this.trap, reaction: this.reaction,
      engineDmg: v.engineDmg, transDmg: v.transDmg, blown: v.blown, broken: v.broken,
      body: reason === 'crash' ? this.damage : 0, fuel: Math.min(this.fuel0, v.fuelUse * 3),
      grinds: v.grinds, tread: (this.type === 'drag' ? 0.03 : 0.06) + (v.grinds ? 0 : 0) + this.smoke.length * 0.0004
    };
    const T = L().race;
    this.say(outcome === 'win' ? T.won : outcome === 'void' ? T.voided : T.lost, 99, outcome === 'win' ? '#ffd23a' : '#fff');
    if (outcome === 'win') Sound.sfx.win(); else if (outcome === 'lose') Sound.sfx.lose();
  }

  // ¿Ya se puede salir de la pantalla de la carrera?
  get over() { return this.phase === 'done' && this.endT > 1.2; }
}
