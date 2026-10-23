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
    for (let i = 0; i < 11; i++) this.traffic.push({ z: 450 + R() * len * 1.9, x: -LANE, v: -(17 + R() * 6), color: rpick(R, ['#b9bec4', '#2f4f3a', '#6a1f2b', '#ece8dc', '#1d2a4d', '#8ab8de']), oncoming: true });
    for (let i = 0; i < 5; i++) {
      const model = rpick(R, ['chevy49', 'falcon60', 'olds50', 'chevy55', 'valiant61']);
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
    if (this.t - this.goAt > (this.type === 'drag' ? 45 : 260)) return this.finish('lose', 'finish');
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
    const S = L().race;
    const big = outcome === 'win' ? S.won : outcome === 'void' ? S.voided : S.lost;
    this.say(big, 99, outcome === 'win' ? '#ffd23a' : outcome === 'void' ? '#9ec8ff' : '#ff6a5a');
    this.sub = S.reasons[reason] || '';
    if (outcome === 'win') Sound.sfx.win(); else if (outcome === 'lose') Sound.sfx.lose();
  }

  // ¿Ya se puede salir de la pantalla de la carrera?
  get over() { return this.phase === 'done' && this.endT > 1.2; }

  // ----- Dibujo -----
  draw(g) {
    const me = this.me, rv = this.rv, T = this.T;
    const sh = (me.veh.v / 60) * 1.2 + (me.veh.offroad ? 3 : 0) + this.flash * 8;
    const ox = (Math.random() - 0.5) * sh, oy = (Math.random() - 0.5) * sh;
    g.save(); g.translate(ox, oy);
    const objs = [];
    // la persona con la bandera
    objs.push({ z: T.start + 10, x: 0, draw: (gg, sx, sy, sc, light) => drawFlagger(gg, sx, sy, sc, light, this.flag, this.t) });
    if (T.kind === 'road') objs.push({ z: T.finish, x: 0, draw: (gg, sx, sy, sc, light) => drawFinishBanner(gg, sx, sy, sc, light, this.t) });
    if (rv.z > me.z + 1) objs.push({ z: rv.z, x: rv.x, draw: (gg, sx, sy, sc, light) => {
      drawCarRear(gg, rv.car, sx, sy, 2.0 * sc, { light: clamp(light * 1.3 + 0.08, 0, 1), brake: rv.veh.brake > 0.1 || this.phase === 'done', plate: this.o.rival.king ? 'KING 1' : 'HOT 63' });
    } });
    for (const o of this.traffic) {
      if (o.z < me.z + 1) continue;
      objs.push({ z: o.z, x: o.x, draw: (gg, sx, sy, sc, light) => {
        if (o.oncoming) drawCarFront(gg, sx, sy, 1.9 * sc, { color: o.color, light });
        else drawCarRear(gg, o.car, sx, sy, 1.9 * sc, { light: clamp(light + 0.05, 0, 1) });
      } });
    }
    if (this.cop && this.cop.z > me.z) objs.push({ z: this.cop.z, x: this.cop.x, draw: (gg, sx, sy, sc, light) => drawCarFront(gg, sx, sy, 2 * sc, { color: '#111', roof: '#eee', light, cop: 1, t: this.t, headlights: 0.3 }) });
    for (const p of this.smoke) if (p.z > me.z + 2) {
      objs.push({ z: p.z, x: p.x, draw: (gg, sx, sy, sc, light) => {
        gg.fillStyle = `rgba(200,200,210,${(0.35 * (1 - p.age / 2.2) * (0.3 + light)).toFixed(3)})`;
        gg.beginPath(); gg.arc(sx, sy - p.y * sc, p.r * sc, 0, TAU); gg.fill();
      } });
    }
    const cam = { z: me.z, x: me.x, scroll: this.scroll, pitch: clamp(-me.veh.acc * 1.2, -8, 8) };
    const P = renderRoad(g, T, cam, objs, this.t);
    // la luz de los focos del rival (y de la policía) sobre el asfalto
    const beam = (c, ahead) => {
      const n = Math.floor((c.z + ahead) / SEG) - Math.floor(me.z / SEG);
      const q = P[n];
      if (!q || q.hidden) return;
      const sx = q.p1[0] + c.x * q.p1[2], sy = q.p1[1], k = q.p1[2];
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(sx, sy); g.scale(1, 0.18);
      const bg = g.createRadialGradient(0, 0, 0, 0, 0, 7 * k);
      bg.addColorStop(0, 'rgba(255,236,190,0.32)'); bg.addColorStop(1, 'rgba(255,236,190,0)');
      g.fillStyle = bg; g.beginPath(); g.arc(0, 0, 7 * k, 0, TAU); g.fill(); g.restore();
    };
    if (rv.z > me.z - 30 && rv.z < me.z + 60) { beam(rv, 14); beam(rv, 26); }
    // el auto del rival por la ventana del costado cuando van a la par
    const side = rv.z - me.z;
    if (side > -5 && side < 3 && Math.abs(rv.x - me.x) < 5) {
      const dir = rv.x < me.x ? -1 : 1, px = dir < 0 ? 40 : W - 40;
      g.save(); g.globalCompositeOperation = 'lighter';
      glow(g, px + dir * 0 + (side + 2) * 60 * -dir * -1, 360, 90, '#fff2cc', 0.35);
      g.restore();
    }
    // la luz de tus propios focos sobre el camino
    g.save(); g.globalCompositeOperation = 'lighter';
    const lg = g.createRadialGradient(W / 2, H * 0.62, 30, W / 2, H * 0.6, 520);
    lg.addColorStop(0, 'rgba(255,240,200,0.10)'); lg.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = lg; g.fillRect(0, HORIZON, W, H - HORIZON);
    g.restore();
    // humo de mis ruedas por los costados
    if (me.veh.spin > 0.3) {
      g.fillStyle = `rgba(210,210,220,${(me.veh.spin * 0.22).toFixed(3)})`;
      for (const sx of [80, W - 80]) { g.beginPath(); g.arc(sx + Math.sin(this.t * 9) * 20, 420, 120 + me.veh.spin * 60, 0, TAU); g.fill(); }
    }
    drawCockpit(g, this);
    g.restore();
    this.drawHud(g);
  }

  drawHud(g) {
    const S = L().race, o = this.o, me = this.me;
    // etiqueta de la carrera
    g.save();
    g.font = font(15, 'bold', FONT_SANS); g.textBaseline = 'middle';
    const tag = `${o.type === 'drag' ? S.drag : S.road}  ·  ${o.bet === 'pinks' ? S.pinks : o.bet ? money(o.bet) : S.kicks}`;
    const tw = g.measureText(tag).width + 28;
    g.fillStyle = 'rgba(8,10,18,0.72)'; roundRect(g, 150, 76, tw, 30, 15); g.fill();
    g.fillStyle = '#ffd23a'; g.textAlign = 'left'; g.fillText(tag, 164, 92);
    // rival y distancia
    const rtag = (o.rival.king ? '👑 ' : '') + o.rival.name;
    g.font = font(14, 'bold', FONT_SANS);
    const rw = g.measureText(rtag).width + 28;
    g.fillStyle = 'rgba(8,10,18,0.72)'; roundRect(g, W - 150 - Math.max(rw, 220), 76, Math.max(rw, 220), 30, 15); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'right'; g.fillText(rtag, W - 164, 92);
    // barra de avance (los dos autos)
    const bx = W - 150 - 220, by = 114, bw = 220;
    g.fillStyle = 'rgba(8,10,18,0.6)'; roundRect(g, bx, by, bw, 14, 7); g.fill();
    const len = this.T.finish - this.T.start;
    const pos = c => clamp((c.z - this.T.start) / len, 0, 1);
    g.fillStyle = '#ff5a4a'; g.beginPath(); g.arc(bx + 7 + pos(this.rv) * (bw - 14), by + 7, 5, 0, TAU); g.fill();
    g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(bx + 7 + pos(me) * (bw - 14), by + 7, 6, 0, TAU); g.fill();
    if (this.cop) { g.fillStyle = Math.sin(this.t * 14) > 0 ? '#ff2020' : '#2060ff'; g.beginPath(); g.arc(bx + 7 + clamp((this.cop.z - this.T.start) / len, 0, 1) * (bw - 14), by + 7, 4, 0, TAU); g.fill(); }
    // mapita de la ruta
    if (this.T.map) drawMiniMap(g, this, W - 150 - 110, 140, 104);
    // mensajes grandes
    if (this.phase === 'intro') {
      const a = clamp(this.phaseT < 0.4 ? this.phaseT / 0.4 : 1, 0, 1);
      g.globalAlpha = a;
      g.textAlign = 'center';
      g.font = font(44, 'bold', FONT_DISPLAY); g.fillStyle = '#fff';
      g.shadowColor = 'rgba(0,0,0,0.8)'; g.shadowBlur = 12;
      g.fillText(o.type === 'drag' ? S.dragTitle : S.roadTitle, W / 2, 190);
      g.font = font(20, 'normal', FONT_SANS); g.fillText(o.type === 'drag' ? S.dragPlace : S.roadPlace, W / 2, 232);
      g.shadowBlur = 0; g.globalAlpha = 1;
    }
    if (this.phase === 'stage' || this.phase === 'intro') {
      this.hintText(g, me.s.auto ? S.hintAuto : S.hintStage);
    } else if (this.phase === 'run' && this.t - this.goAt < 6 && me.veh.gear > 0 && !me.s.auto && me.veh.gear < me.veh.nGears) {
      this.hintText(g, S.hintShift);
    } else if (this.phase === 'run' && this.cop) {
      this.hintText(g, S.hintCops);
    }
    if (this.msg) {
      const m = this.msg, a = clamp(m.t / 0.3, 0, 1) * clamp((m.max - m.t) / 0.15, 0, 1);
      g.globalAlpha = a; g.textAlign = 'center';
      g.font = font(this.phase === 'done' ? 64 : 34, 'bold', FONT_DISPLAY);
      g.lineWidth = 8; g.strokeStyle = 'rgba(0,0,0,0.75)'; g.lineJoin = 'round';
      g.strokeText(m.text, W / 2, 250); g.fillStyle = m.color; g.fillText(m.text, W / 2, 250);
      if (this.phase === 'done' && this.sub) {
        g.font = font(22, 'bold', FONT_SANS); g.lineWidth = 6; g.strokeText(this.sub, W / 2, 298); g.fillStyle = '#fff'; g.fillText(this.sub, W / 2, 298);
      }
      g.globalAlpha = 1;
    }
    if (this.phase === 'done' && this.endT > 1.2) this.hintText(g, S.continue);
    // destellos de choque
    if (this.flash > 0) { g.fillStyle = `rgba(255,255,255,${(this.flash * 0.6).toFixed(3)})`; g.fillRect(0, 0, W, H); }
    g.restore();
  }
  hintText(g, text) {
    g.save(); g.font = font(16, 'bold', FONT_SANS); g.textAlign = 'center'; g.textBaseline = 'middle';
    const w = g.measureText(text).width + 36;
    g.fillStyle = 'rgba(8,10,18,0.7)'; roundRect(g, W / 2 - w / 2, 330, w, 34, 17); g.fill();
    g.fillStyle = '#f2ecd8'; g.fillText(text, W / 2, 347); g.restore();
  }
}

function drawMiniMap(g, race, x, y, size) {
  const m = race.T.map;
  if (!race._mapBox) {
    let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
    for (const [px, pz] of m) { a = Math.min(a, px); b = Math.max(b, px); c = Math.min(c, pz); d = Math.max(d, pz); }
    race._mapBox = [a, b, c, d];
  }
  const [a, b, c, d] = race._mapBox, k = (size - 16) / Math.max(b - a, d - c);
  const P = i => { const p = m[clamp(i, 0, m.length - 1)]; return [x + 8 + (p[0] - a) * k, y + size - 8 - (p[1] - c) * k]; };
  g.fillStyle = 'rgba(8,10,18,0.6)'; roundRect(g, x, y, size, size, 12); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 2; g.beginPath();
  const fi = Math.floor(race.T.finish / SEG);
  for (let i = 0; i <= fi; i += 3) { const [px, py] = P(i); i ? g.lineTo(px, py) : g.moveTo(px, py); }
  g.stroke();
  const dot = (z, col, r) => { const [px, py] = P(Math.floor(z / SEG)); g.fillStyle = col; g.beginPath(); g.arc(px, py, r, 0, TAU); g.fill(); };
  dot(race.T.finish, '#fff', 3);
  dot(race.rv.z, '#ff5a4a', 4); dot(race.me.z, '#ffd23a', 5);
  if (race.cop) dot(race.cop.z, '#5aa0ff', 4);
}

// La persona que da la partida: brazos arriba con la bandera, y la baja de golpe
function drawFlagger(g, sx, sy, sc, light, flag, t) {
  const h = 1.75 * sc;
  if (h < 2) return;
  const lit = clamp(light * 1.2 + 0.12, 0, 1);
  const skin = css(mix('#000', '#e0b090', lit)), shirt = css(mix('#000', '#f2f0ea', lit)), pants = css(mix('#000', '#2a3a6a', lit));
  g.save(); g.translate(sx, sy);
  g.fillStyle = 'rgba(0,0,0,0.4)'; g.beginPath(); g.ellipse(0, 0, 0.5 * sc, 0.08 * sc, 0, 0, TAU); g.fill();
  g.fillStyle = pants; g.fillRect(-0.2 * sc, -0.9 * sc, 0.17 * sc, 0.9 * sc); g.fillRect(0.03 * sc, -0.9 * sc, 0.17 * sc, 0.9 * sc);
  g.fillStyle = shirt; roundRect(g, -0.25 * sc, -1.5 * sc, 0.5 * sc, 0.65 * sc, 0.1 * sc); g.fill();
  g.fillStyle = skin; g.beginPath(); g.arc(0, -1.62 * sc, 0.13 * sc, 0, TAU); g.fill();
  g.fillStyle = css(mix('#000', '#2a1f18', lit)); g.beginPath(); g.arc(0, -1.66 * sc, 0.13 * sc, Math.PI, 0); g.fill();
  // brazos y bandera
  const up = flag === 1, drop = flag === 2;
  const ang = up ? -2.6 + Math.sin(t * 6) * 0.05 : drop ? 0.5 : 0.25;
  g.strokeStyle = shirt; g.lineWidth = 0.12 * sc; g.lineCap = 'round';
  for (const d of [-1, 1]) {
    const a = d < 0 ? Math.PI - ang : ang;
    g.beginPath(); g.moveTo(d * 0.22 * sc, -1.42 * sc); g.lineTo(d * 0.22 * sc + Math.cos(a) * 0.65 * sc, -1.42 * sc + Math.sin(a) * 0.65 * sc); g.stroke();
  }
  const hx = 0.22 * sc + Math.cos(ang) * 0.65 * sc, hy = -1.42 * sc + Math.sin(ang) * 0.65 * sc;
  g.fillStyle = css(mix('#000', '#ffffff', lit));
  g.beginPath(); g.moveTo(hx, hy);
  const wave = Math.sin(t * 9) * 0.08 * sc;
  if (up) { g.lineTo(hx + 0.55 * sc, hy - 0.1 * sc + wave); g.lineTo(hx + 0.5 * sc, hy + 0.32 * sc + wave); g.lineTo(hx, hy + 0.3 * sc); }
  else { g.lineTo(hx + 0.3 * sc, hy + 0.5 * sc); g.lineTo(hx + 0.05 * sc, hy + 0.6 * sc); }
  g.closePath(); g.fill();
  g.restore();
}
function drawFinishBanner(g, sx, sy, sc, light, t) {
  const w = (ROAD_W + 1.2) * sc, top = sy - 5.2 * sc, bh = 0.9 * sc;
  if (sc < 0.3) return;
  g.fillStyle = '#222'; g.fillRect(sx - w - 0.1 * sc, top, 0.2 * sc, 5.2 * sc); g.fillRect(sx + w - 0.1 * sc, top, 0.2 * sc, 5.2 * sc);
  const n = 16, cw = (2 * w) / n, lit = clamp(light + 0.25, 0, 1);
  for (let i = 0; i < n; i++) for (let r = 0; r < 2; r++) {
    g.fillStyle = (i + r) % 2 ? css(mix('#000', '#f2f2f2', lit)) : '#080808';
    g.fillRect(sx - w + i * cw, top + r * bh / 2 + Math.sin(t * 3 + i) * 0.05 * sc, cw + 0.5, bh / 2);
  }
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const d of [-1, 1]) glow(g, sx + d * w, top, 1.2 * sc, '#fff1c0', 0.6);
  g.restore();
}

// ----- La cabina: tablero, volante, espejo, tacómetro y palanca -----
function cockpitStatic(race) {
  if (race._cockpit) return race._cockpit;
  const c = makeCanvas(W, H), g = c.getContext('2d'), car = race.me.car, M = MODELS[car.model];
  const paint = car.color, dash = mix(paint, '#2a2622', 0.35), old = M.year < 1958;
  // techo interior
  const hg = g.createLinearGradient(0, 0, 0, 64);
  hg.addColorStop(0, '#2c2924'); hg.addColorStop(1, '#151412');
  g.fillStyle = hg; g.beginPath(); g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, 66); g.quadraticCurveTo(W / 2, 22, 0, 66); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(210,215,222,0.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(W, 66); g.quadraticCurveTo(W / 2, 22, 0, 66); g.stroke();
  // parantes del parabrisas
  for (const d of [-1, 1]) {
    const X = v => (d < 0 ? v : W - v);
    const pg = g.createLinearGradient(X(0), 0, X(110), 0);
    pg.addColorStop(0, '#0d0c0b'); pg.addColorStop(1, css(mix(paint, '#000', 0.6)));
    g.fillStyle = pg; g.beginPath(); g.moveTo(X(0), 30); g.lineTo(X(128), 40); g.lineTo(X(44), 470); g.lineTo(X(0), 480); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(200,205,212,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(128), 40); g.lineTo(X(44), 470); g.stroke();
  }
  // capó (con lo que lleve encima)
  const hoodY = 428;
  const hp = new Path2D();
  hp.moveTo(120, 506); hp.quadraticCurveTo(700, hoodY - 52, 1220, 506); hp.lineTo(1220, 530); hp.lineTo(120, 530); hp.closePath();
  g.fillStyle = css(shade(paint, -0.45)); g.fill(hp);
  g.save(); g.clip(hp);
  const hg2 = g.createLinearGradient(0, hoodY - 20, 0, 500);
  hg2.addColorStop(0, 'rgba(255,240,210,0.34)'); hg2.addColorStop(0.12, 'rgba(255,255,255,0.1)'); hg2.addColorStop(0.5, 'rgba(0,0,0,0.05)'); hg2.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = hg2; g.fillRect(0, hoodY - 50, W, 120);
  // reflejo del cielo nocturno y una línea al centro del capó
  g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(700, hoodY - 12); g.lineTo(700, 520); g.stroke();
  if (car.mods.flames) {
    for (let i = 0; i < 6; i++) {
      const x0 = 300 + i * 160, len = 40 + (i % 3) * 18;
      const fg = g.createLinearGradient(0, 520, 0, 500 - len);
      fg.addColorStop(0, '#ffe46a'); fg.addColorStop(0.5, '#ff8a1c'); fg.addColorStop(1, '#d4210f');
      g.fillStyle = fg; g.beginPath(); g.moveTo(x0 - 60, 530); g.quadraticCurveTo(x0 - 20, 500, x0 + (i % 2 ? 26 : -26), 492 - len); g.quadraticCurveTo(x0 + 10, 500, x0 + 60, 530); g.fill();
    }
  }
  g.restore();
  const intake = car.p.intake && car.p.intake.k;
  if (car.mods.scoop || M.year === 1957 && M.fam === 'ford') {
    g.fillStyle = css(shade(paint, -0.35)); roundRect(g, 640, hoodY - 6, 120, 22, 8); g.fill();
    g.fillStyle = '#0a0a0a'; roundRect(g, 650, hoodY - 2, 100, 9, 4); g.fill();
  } else if (car.model === 'ford32' && intake && INTAKES[intake].n > 1) {
    // filtros de aire cromados asomando del motor
    for (let i = 0; i < INTAKES[intake].n; i++) { g.fillStyle = chromeGrad(g, hoodY - 30, hoodY); g.beginPath(); g.ellipse(640 + (i - (INTAKES[intake].n - 1) / 2) * 52, hoodY - 4, 24, 12, 0, 0, TAU); g.fill(); }
  } else {
    // adorno del capó
    g.fillStyle = chromeGrad(g, hoodY - 30, hoodY + 10);
    g.beginPath(); g.moveTo(700, hoodY - 22); g.lineTo(716, hoodY + 8); g.lineTo(684, hoodY + 8); g.closePath(); g.fill();
  }
  // tablero
  const dp = new Path2D();
  dp.moveTo(0, 512); dp.quadraticCurveTo(W / 2, 486, W, 512); dp.lineTo(W, H); dp.lineTo(0, H); dp.closePath();
  const dg = g.createLinearGradient(0, 480, 0, H);
  dg.addColorStop(0, css(shade(dash, -0.1))); dg.addColorStop(0.25, css(shade(dash, 0.08))); dg.addColorStop(1, css(shade(dash, -0.55)));
  g.fillStyle = dg; g.fill(dp);
  // acolchado de arriba y moldura cromada
  g.strokeStyle = '#141210'; g.lineWidth = 26; g.beginPath(); g.moveTo(0, 516); g.quadraticCurveTo(W / 2, 488, W, 516); g.stroke();
  g.strokeStyle = chromeGrad(g, 526, 534); g.lineWidth = 4; g.beginPath(); g.moveTo(0, 532); g.quadraticCurveTo(W / 2, 504, W, 532); g.stroke();
  // grupo de instrumentos detrás del volante
  g.fillStyle = chromeGrad(g, 520, 680); roundRect(g, 300, 532, 330, 150, 60); g.fill();
  g.fillStyle = '#0c0d10'; roundRect(g, 308, 540, 314, 134, 54); g.fill();
  // radio
  g.fillStyle = chromeGrad(g, 548, 600); roundRect(g, 760, 552, 220, 56, 10); g.fill();
  g.fillStyle = '#2a1e10'; roundRect(g, 790, 562, 160, 22, 6); g.fill();
  g.fillStyle = 'rgba(255,190,90,0.85)'; g.font = font(11, 'bold', FONT_SANS); g.textAlign = 'center';
  g.fillText('55  60  70  80  100  120  140  160', 870, 577);
  for (let i = 0; i < 5; i++) { g.fillStyle = chromeGrad(g, 590, 602); roundRect(g, 794 + i * 32, 590, 24, 12, 3); g.fill(); }
  // guantera
  g.fillStyle = css(shade(dash, -0.15)); roundRect(g, 1010, 560, 210, 70, 10); g.fill();
  g.fillStyle = chromeGrad(g, 586, 600); roundRect(g, 1095, 588, 40, 10, 4); g.fill();
  // nombre del auto en el tablero
  g.fillStyle = chromeGrad(g, 604, 624); g.font = font(18, 'italic bold', FONT_SERIF); g.textAlign = 'left';
  g.fillText(M.name.split(' ').slice(-1)[0], 1026, 620);
  // espejo retrovisor (marco)
  g.fillStyle = '#1a1816'; g.fillRect(636, 22, 8, 26);
  race._cockpit = { c, old };
  return race._cockpit;
}

function gauge(g, cx, cy, r, value, max, labels, o = {}) {
  g.save();
  const a0 = o.a0 ?? Math.PI * 0.75, a1 = o.a1 ?? Math.PI * 2.25;
  const face = g.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
  face.addColorStop(0, o.face || '#1c1f24'); face.addColorStop(1, '#07080a');
  g.fillStyle = face; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.strokeStyle = chromeGrad(g, cy - r, cy + r); g.lineWidth = Math.max(3, r * 0.08); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
  if (o.red) {
    g.strokeStyle = '#d42a1e'; g.lineWidth = r * 0.12; g.beginPath(); g.arc(cx, cy, r * 0.82, a0 + (a1 - a0) * o.red / max, a1); g.stroke();
  }
  // zona verde: las vueltas para largar
  if (o.green) {
    g.strokeStyle = '#3ad16a'; g.lineWidth = r * 0.12; g.beginPath(); g.arc(cx, cy, r * 0.82, a0 + (a1 - a0) * (o.green - 500) / max, a0 + (a1 - a0) * (o.green + 150) / max); g.stroke();
  }
  g.strokeStyle = 'rgba(240,236,220,0.85)'; g.fillStyle = 'rgba(240,236,220,0.92)';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font(Math.max(8, r * 0.17), 'bold', FONT_SANS);
  labels.forEach((lab, i) => {
    const a = a0 + (a1 - a0) * i / (labels.length - 1);
    g.lineWidth = 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * r * 0.86, cy + Math.sin(a) * r * 0.86); g.lineTo(cx + Math.cos(a) * r * 0.72, cy + Math.sin(a) * r * 0.72); g.stroke();
    if (lab !== '') g.fillText(lab, cx + Math.cos(a) * r * 0.56, cy + Math.sin(a) * r * 0.56);
  });
  if (o.title) { g.font = font(Math.max(7, r * 0.12), 'bold', FONT_SANS); g.fillStyle = 'rgba(240,236,220,0.6)'; g.fillText(o.title, cx, cy + r * 0.38); }
  const a = a0 + (a1 - a0) * clamp(value / max, 0, 1.05);
  g.strokeStyle = o.needle || '#ff6a2a'; g.lineWidth = Math.max(2, r * 0.05); g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx - Math.cos(a) * r * 0.12, cy - Math.sin(a) * r * 0.12); g.lineTo(cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8); g.stroke();
  g.fillStyle = '#2a2a2e'; g.beginPath(); g.arc(cx, cy, r * 0.1, 0, TAU); g.fill();
  // luz de los instrumentos
  g.globalCompositeOperation = 'lighter';
  glow(g, cx, cy, r * 1.1, '#6aff9a', 0.05);
  g.restore();
}

function drawCockpit(g, race) {
  const me = race.me, v = me.veh, s = me.s, car = me.car;
  const st = cockpitStatic(race);
  // espejo: lo que viene detrás
  drawMirror(g, race);
  g.drawImage(st.c, 0, 0, W, H);
  // si viene la policía, la cabina se tiñe de rojo y azul
  if (race.cop && race.cop.z > me.z - 200) {
    const on = Math.sin(race.t * 14) > 0;
    g.fillStyle = on ? 'rgba(255,30,30,0.10)' : 'rgba(40,80,255,0.07)'; g.fillRect(0, 0, W, H);
  }
  // instrumentos
  const metric = LANG === 'es';
  const spd = metric ? v.v * 3.6 : v.v * 2.237, smax = metric ? 240 : 150;
  const sl = metric ? ['0', '40', '80', '120', '160', '200', '240'] : ['0', '25', '50', '75', '100', '125', '150'];
  gauge(g, 410, 608, 62, spd, smax, sl, { title: metric ? 'km/h' : 'MPH' });
  const fuelLeft = clamp((race.fuel0 - v.fuelUse * 3) / TANK, 0, 1);
  gauge(g, 520, 580, 26, fuelLeft, 1, ['E', '', 'F'], { a0: Math.PI * 1.1, a1: Math.PI * 1.9, needle: '#f2f0e0', title: '' });
  const temp = clamp(0.35 + v.engineDmg * 0.7 + (v.rpm > s.red ? 0.15 : 0), 0, 1);
  gauge(g, 520, 640, 26, temp, 1, ['C', '', 'H'], { a0: Math.PI * 1.1, a1: Math.PI * 1.9, needle: temp > 0.8 ? '#ff3a2a' : '#f2f0e0' });
  // luces de aviso
  g.font = font(10, 'bold', FONT_SANS); g.textAlign = 'center';
  const warn = (x, label, on, col) => {
    g.fillStyle = on ? col : '#2a2420'; roundRect(g, x - 16, 664, 32, 14, 4); g.fill();
    if (on) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, 671, 26, col, 0.4); g.restore(); }
    g.fillStyle = on ? '#fff' : '#5a524a'; g.fillText(label, x, 674);
  };
  warn(360, 'OIL', v.blown, '#ff3a2a'); warn(400, 'GEN', v.dead(), '#ff3a2a'); warn(440, 'HOT', temp > 0.8, '#ff7a2a'); warn(480, 'GAS', fuelLeft < 0.1, '#ffb02a');
  // marcha de los automáticos
  if (s.auto) {
    g.fillStyle = 'rgba(240,236,220,0.85)'; g.font = font(14, 'bold', FONT_SANS);
    const sel = v.gear === 0 ? 'N' : 'D';
    'PRNDL'.split('').forEach((ch, i) => { g.fillStyle = ch === sel ? '#ff8a3a' : 'rgba(240,236,220,0.5)'; g.fillText(ch, 340 + i * 26, 560); });
  }
  // tacómetro Sun sobre la columna (con su luz para pasar el cambio)
  const tx = 600, ty = 452, tr = 66;
  g.fillStyle = '#0c0c0e'; g.fillRect(tx - 8, ty + tr - 6, 16, 40);
  g.fillStyle = chromeGrad(g, ty - tr - 8, ty + tr + 8); g.beginPath(); g.arc(tx, ty, tr + 8, 0, TAU); g.fill();
  const rmax = Math.ceil((s.red + 1000) / 1000) * 1000;
  const labs = []; for (let r = 0; r <= rmax; r += 1000) labs.push(String(r / 1000));
  gauge(g, tx, ty, tr, v.rpm, rmax, labs, { red: s.red, green: v.gear === 0 ? s.peak * LAUNCH : 0, title: 'RPM x1000', face: '#15161a' });
  const shiftOn = !s.auto && v.gear > 0 && v.gear < v.nGears && v.rpm > s.peak * 1.02;
  g.fillStyle = shiftOn ? '#ff2a1a' : '#4a1010'; g.beginPath(); g.arc(tx + tr * 0.8, ty - tr * 0.85, 9, 0, TAU); g.fill();
  if (shiftOn) { g.save(); g.globalCompositeOperation = 'lighter'; glow(g, tx + tr * 0.8, ty - tr * 0.85, 46, '#ff3020', 0.8); g.restore(); }
  // palanca de cambios
  drawShifter(g, race);
  // volante
  drawSteeringWheel(g, 420, 822, 330, me.steer * 1.6, st.old ? '#e9e1c8' : '#16161a');
  // vidrio trizado tras un choque
  if (race.crack) {
    g.save(); g.strokeStyle = 'rgba(230,240,255,0.7)'; g.lineWidth = 1.5;
    const cx = 760, cy = 230, R = rng(9);
    for (let i = 0; i < 14; i++) {
      const a = R() * TAU; let x = cx, y = cy; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 5; k++) { x += Math.cos(a + (R() - 0.5) * 0.8) * 40; y += Math.sin(a + (R() - 0.5) * 0.8) * 40; g.lineTo(x, y); }
      g.stroke();
    }
    for (const r of [18, 42, 70]) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); }
    g.restore();
  }
}

function drawShifter(g, race) {
  const v = race.me.veh, s = race.me.s;
  if (s.auto) {
    // palanca en la columna del volante
    g.strokeStyle = chromeGrad(g, 600, 640); g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(470, 660); g.lineTo(560, v.gear === 0 ? 610 : 630); g.stroke();
    g.fillStyle = '#efe8d8'; g.beginPath(); g.arc(564, v.gear === 0 ? 608 : 632, 9, 0, TAU); g.fill();
    return;
  }
  // palanca al piso con patrón en H
  const n = v.nGears, g0 = v.gear;
  const col = g0 === 0 ? 0 : Math.ceil(g0 / 2) - 1, up = g0 % 2 === 1;
  const cols = Math.ceil(n / 2);
  const kx = 880 + (g0 === 0 ? 0 : (col - (cols - 1) / 2) * 30) + (v.shiftT > 0 ? Math.sin(race.t * 60) * 3 : 0);
  const ky = g0 === 0 ? 600 : up ? 572 : 628;
  g.fillStyle = '#121214'; g.beginPath(); g.ellipse(900, 712, 60, 20, 0, 0, TAU); g.fill();
  g.strokeStyle = chromeGrad(g, ky, 712); g.lineWidth = 10; g.lineCap = 'round';
  g.beginPath(); g.moveTo(900, 712); g.quadraticCurveTo(905, 660, kx, ky); g.stroke();
  const kg = g.createRadialGradient(kx - 6, ky - 6, 2, kx, ky, 18);
  kg.addColorStop(0, '#ffffff'); kg.addColorStop(1, '#b8b0a0');
  g.fillStyle = kg; g.beginPath(); g.arc(kx, ky, 17, 0, TAU); g.fill();
  g.fillStyle = '#333'; g.font = font(14, 'bold', FONT_SANS); g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(g0 === 0 ? 'N' : String(g0), kx, ky + 1);
  // patrón del cambio
  g.fillStyle = 'rgba(8,10,18,0.55)'; roundRect(g, 1010, 650, 150, 54, 10); g.fill();
  for (let i = 1; i <= n; i++) {
    const cx = 1040 + (Math.ceil(i / 2) - 1) * 36, cy = i % 2 ? 666 : 690;
    g.fillStyle = i === g0 ? '#ffd23a' : 'rgba(240,236,220,0.5)'; g.font = font(14, 'bold', FONT_SANS);
    g.fillText(String(i), cx, cy);
  }
}

function drawSteeringWheel(g, cx, cy, r, ang, color) {
  g.save(); g.translate(cx, cy); g.rotate(ang);
  // aro
  g.strokeStyle = color; g.lineWidth = 22;
  g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 4; g.beginPath(); g.arc(0, 0, r + 5, Math.PI * 1.1, Math.PI * 1.6); g.stroke();
  // rayos y aro de la bocina
  g.strokeStyle = color; g.lineWidth = 16;
  for (const a of [0.12, Math.PI - 0.12, Math.PI / 2]) { g.beginPath(); g.moveTo(Math.cos(a) * 60, Math.sin(a) * 60); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); g.stroke(); }
  g.strokeStyle = chromeGrad(g, -150, 150); g.lineWidth = 7; g.beginPath(); g.arc(0, 0, 130, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  g.fillStyle = chromeGrad(g, -60, 60); g.beginPath(); g.arc(0, 0, 58, 0, TAU); g.fill();
  g.restore();
}

function drawMirror(g, race) {
  const me = race.me, x = 520, y = 44, w = 240, h = 56;
  g.save();
  roundRect(g, x, y, w, h, 14);
  g.save(); g.clip();
  const bg = g.createLinearGradient(0, y, 0, y + h); bg.addColorStop(0, '#0b1022'); bg.addColorStop(0.55, '#181a2a'); bg.addColorStop(1, '#101012');
  g.fillStyle = bg; g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(200,200,190,0.15)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x + w / 2 - 6, y + h * 0.5); g.lineTo(x + 20, y + h); g.moveTo(x + w / 2 + 6, y + h * 0.5); g.lineTo(x + w - 20, y + h); g.stroke();
  const things = [];
  if (race.rv.z < me.z) things.push({ d: me.z - race.rv.z, x: race.rv.x, kind: 'car' });
  if (race.cop && race.cop.z < me.z) things.push({ d: me.z - race.cop.z, x: race.cop.x, kind: 'cop' });
  for (const o of race.traffic) if (o.z < me.z && me.z - o.z < 300) things.push({ d: me.z - o.z, x: o.x, kind: o.oncoming ? 'tail' : 'car' });
  g.globalCompositeOperation = 'lighter';
  for (const t of things) {
    const k = 30 / Math.max(6, t.d);
    const mx = x + w / 2 + (t.x - me.x) * k * 9, my = y + h * 0.52 + 9 * k;
    if (t.kind === 'tail') { glow(g, mx - 6 * k, my, 10 * k + 3, '#ff2a1a', 0.6); glow(g, mx + 6 * k, my, 10 * k + 3, '#ff2a1a', 0.6); continue; }
    glow(g, mx - 10 * k, my, 18 * k + 4, '#fff4d6', 0.7); glow(g, mx + 10 * k, my, 18 * k + 4, '#fff4d6', 0.7);
    if (t.kind === 'cop') { const on = Math.sin(race.t * 14) > 0; glow(g, mx, my - 8 * k, 30 * k + 10, on ? '#ff2020' : '#3060ff', 0.9); }
  }
  for (const p of race.smoke) if (p.who === me) { g.fillStyle = `rgba(160,160,170,${(0.25 * (1 - p.age / 2.2)).toFixed(3)})`; g.beginPath(); g.arc(x + w / 2 + (p.x - me.x) * 12, y + h * 0.75 - p.age * 8, 10 + p.age * 20, 0, TAU); g.fill(); }
  g.restore();
  g.lineWidth = 5; g.strokeStyle = chromeGrad(g, y, y + h); roundRect(g, x, y, w, h, 14); g.stroke();
  g.restore();
}
