// ===== Carrera =====
const LAPS = 4;
const PRIZES = [100, 70, 50, 30];
const POINTS = [10, 6, 4, 2];

function drawPickup(g, pk, bob) {
  g.fillStyle = 'rgba(0,0,0,0.3)'; ellipse(g, pk.x + 2, pk.y + 7, 9, 4);
  const y = pk.y - 4 + bob;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (pk.type === 'nitro') {
    g.fillStyle = '#0d3a8f'; roundRect(g, pk.x - 7, y - 11, 14, 20, 4); g.fill();
    g.fillStyle = '#2f7bff'; roundRect(g, pk.x - 5.5, y - 9.5, 11, 17, 3); g.fill();
    g.fillStyle = '#ddd'; g.fillRect(pk.x - 2.5, y - 15, 5, 5);
    g.fillStyle = '#fff'; g.font = font(10); g.fillText('N', pk.x, y);
  } else {
    g.fillStyle = '#a87a10'; ellipse(g, pk.x, y, 10, 10);
    g.fillStyle = '#ffd84a'; ellipse(g, pk.x - 1, y - 1, 8.5, 8.5);
    g.fillStyle = '#9a6b00'; g.font = font(11); g.fillText('$', pk.x - 1, y);
  }
}

class Race {
  constructor(trackIndex, racers, demo = false) {
    this.trackIndex = trackIndex;
    this.track = getTrack(trackIndex);
    this.demo = demo;
    this.trucks = racers.map(r => new Truck(r));
    const t = this.track, slots = [[-3, -0.45], [-3, 0.45], [-8, -0.45], [-8, 0.45]];
    this.trucks.forEach((tr, i) => tr.spawn(t, slots[i][0], slots[i][1] * t.hw));
    this.hudOrder = [...this.trucks].sort((a, b) => a.r.id - b.r.id);
    this.state = demo ? 'race' : 'countdown';
    this.count = 3.99; this.time = 0; this.dt = 1 / 60; this.goT = 0;
    this.pickups = []; this.parts = []; this.popups = []; this.spawnT = 2.5;
    this.order = []; this.banner = null; this.endT = 0; this.paused = false; this.shake = 0;
  }

  update(dt) {
    if (this.paused) return;
    this.dt = dt;
    if (this.state === 'countdown') {
      const b = Math.ceil(this.count);
      this.count -= dt;
      const a = Math.ceil(this.count);
      if (a !== b && a >= 1 && a <= 3) Sound.sfx.beep();
      if (this.count <= 0) { this.state = 'race'; this.goT = 1.2; Sound.sfx.go(); Announcer.event('go'); }
    } else this.time += dt;
    if (this.goT > 0) this.goT -= dt;

    // "Liga elástica": los rivales se frenan si van muy adelante y apuran si van atrás
    const humans = this.trucks.filter(tr => tr.human);
    const ref = humans.length ? Math.max(...humans.map(h => h.prog)) : null;
    const D = DIFFS[Game.diff];
    for (const tr of this.trucks) {
      if (!tr.human) {
        if (ref === null || tr.finished) tr.rb = 1;
        else tr.rb = clamp(1 - (tr.prog - ref) / this.track.N * 0.3, D.rbMin, D.rbMax);
      }
      let inp = NO_INPUT;
      if (this.state !== 'countdown') {
        inp = tr.human && !tr.finished ? Input.get(tr.player, Game.autoGas) : aiInput(tr, this);
      }
      if (inp.nitro && !tr.nitroHeld && tr.nitros > 0 && tr.nitroT <= 0) {
        tr.nitros--; tr.nitroT = 1.6;
        if (tr.human && !this.demo) { Sound.sfx.nitro(); Announcer.event('nitro', tr); }
      }
      tr.nitroHeld = inp.nitro;
      if (inp.horn && !tr.hornHeld && tr.human && !this.demo) this.honk(tr);
      tr.hornHeld = inp.horn;
      tr.update(dt, inp, this);
      this.checkLap(tr);
      this.emitDust(tr, dt);
      if (tr.human && !this.demo) {
        const inTunnel = this.track.tunnelAt[tr.idx] === 1;
        if (inTunnel && !tr.wasTunnel) Announcer.event('tunnel', tr);
        if (tr.upper && !tr.wasBridge) Announcer.event('bridge', tr);
        tr.wasTunnel = inTunnel; tr.wasBridge = tr.upper;
      }
    }
    this.collide();
    this.updatePickups(dt);

    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; p.life -= dt; }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const p of this.popups) { p.y -= 30 * dt; p.life -= dt; }
    this.popups = this.popups.filter(p => p.life > 0);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    if (this.shake > 0) this.shake -= dt;

    const rank = this.ranking();
    rank.forEach((tr, i) => { tr.pos = i + 1; });
    if (!this.demo && this.state === 'race' && rank[0] !== this.leader) {
      const prev = this.leader;
      this.leader = rank[0];
      if (prev && this.time > 4 && !rank[0].finished && (rank[0].human || prev.human)) Announcer.event('lead', rank[0]);
    }

    if (!this.demo && this.state === 'race') {
      if (this.endT === 0 && humans.every(h => h.finished)) this.endT = 3;
      if (this.endT > 0) { this.endT -= dt; if (this.endT <= 0) { this.endT = -1; this.finish(); } }
    }
  }

  ranking() {
    return [...this.trucks].sort((a, b) =>
      a.finished && b.finished ? a.place - b.place : a.finished ? -1 : b.finished ? 1 : b.prog - a.prog);
  }

  checkLap(tr) {
    if (tr.finished || this.demo) return;
    const lap = Math.floor(tr.prog / this.track.N);
    if (lap <= tr.lapDone) return;
    tr.lapDone = lap;
    const who = Game.players === 2 ? racerName(tr.r) + ': ' : '';
    if (lap >= LAPS) {
      tr.finished = true; this.order.push(tr); tr.place = this.order.length;
      if (tr.place === 1) Announcer.event('win', tr);
      if (tr.human) {
        this.showBanner(who + (tr.place === 1 ? L().won : L().placed(tr.place)), tr.place === 1 ? '#ffd23f' : '#fff', 3);
        if (tr.place === 1) { Sound.sfx.finish(); this.confetti(tr); } else Sound.sfx.lap();
      }
    } else if (lap >= 1 && tr.human) {
      Sound.sfx.lap();
      if (lap === LAPS - 1) Announcer.event('lastLap', tr);
      this.showBanner(who + (lap === LAPS - 1 ? L().lastLap : L().lapBanner(lap + 1)), '#fff', 1.4);
    }
  }

  finish() {
    const rest = this.trucks.filter(tr => !tr.finished).sort((a, b) => b.prog - a.prog);
    for (const tr of rest) { tr.finished = true; this.order.push(tr); tr.place = this.order.length; }
    Sound.stopEngines();
    Game.raceOver(this);
  }

  collide() {
    const T = this.trucks, R = 20;
    for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
      const a = T[i], b = T[j];
      if (a.upper !== b.upper || Math.abs(a.elev - b.elev) > 14) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
      if (d2 >= R * R || d2 < 0.01) continue;
      // el más pesado (tractor, monster) empuja más y se mueve menos
      const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, o = R - d;
      const ma = a.stats().mass, mb = b.stats().mass, wa = mb / (ma + mb), wb = ma / (ma + mb);
      a.x -= nx * o * wa; a.y -= ny * o * wa; b.x += nx * o * wb; b.y += ny * o * wb;
      const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (rv < 0) {
        const J = -1.4 * rv / (1 / ma + 1 / mb);
        a.vx -= nx * J / ma; a.vy -= ny * J / ma; b.vx += nx * J / mb; b.vy += ny * J / mb;
        if (rv < -60 && (a.human || b.human) && !this.demo) {
          Sound.sfx.bump();
          const other = a.human ? b : a;
          if (!other.human && Math.random() < 0.3) Sound.horn(other.horn, 2 + (other.r.id % 2));
        }
      }
    }
  }

  spawnPickup() {
    const t = this.track;
    for (let tries = 0; tries < 12; tries++) {
      const i = Math.floor(Math.random() * t.N);
      if (i < 15 || i > t.N - 15 || t.bridgeAt[i] || t.tunnelAt[i]) continue;
      const p = t.pts[i], off = (Math.random() * 2 - 1) * 0.55 * t.hw;
      const x = p.x + p.nx * off, y = p.y + p.ny * off;
      if (t.puddles.some(pd => (pd.x - x) ** 2 + (pd.y - y) ** 2 < (pd.r + 10) ** 2)) continue;
      const nitro = Math.random() < 0.45;
      this.pickups.push({ x, y, type: nitro ? 'nitro' : 'money', value: Math.random() < 0.5 ? 20 : 30, life: 12, bob: Math.random() * 6 });
      return;
    }
  }

  updatePickups(dt) {
    if (this.state !== 'race') return;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      this.spawnT = 2.5 + Math.random() * 2.5;
      if (this.pickups.length < 3) this.spawnPickup();
    }
    for (const pk of this.pickups) {
      pk.life -= dt;
      for (const tr of this.trucks) {
        if (pk.life <= 0 || tr.elev > 18 || (tr.x - pk.x) ** 2 + (tr.y - pk.y) ** 2 > 18 * 18) continue;
        pk.life = 0;
        const loud = tr.human && !this.demo;
        if (pk.type === 'nitro') {
          tr.nitros++;
          if (loud) { Sound.sfx.nitroPick(); this.popup(pk.x, pk.y, '+1 NITRO', '#8ff'); }
        } else {
          tr.earned += pk.value;
          if (loud) { Sound.sfx.coin(); this.popup(pk.x, pk.y, '+$' + pk.value, '#ffe04a'); }
        }
      }
    }
    this.pickups = this.pickups.filter(p => p.life > 0);
  }

  fx(type, tr, v) {
    this.curUp = tr.upper;
    const loud = tr.human && !this.demo;
    if (type === 'jump') { if (loud) { Sound.sfx.jump(); if (v > 190) Announcer.event('jump', tr); } }
    else if (type === 'land') { if (loud) Sound.sfx.land(); this.burst(tr.x, tr.y, 10, this.track.theme.d3, 60); }
    else if (type === 'bump') { if (loud && Math.random() < 0.5) Sound.sfx.bump(); }
    else if (type === 'wall') {
      if (loud) { Sound.sfx.crash(); if (v > 150) Announcer.event('crash', tr); }
      this.burst(tr.x, tr.y, 6, '#fff3a0', 90, 0.3);
      if (loud && v > 120) this.shake = 0.15;
    }
  }

  emitDust(tr, dt) {
    this.curUp = tr.upper;
    if (tr.surface !== tr.lastSurf) {
      if (tr.surface === 'water') { this.burst(tr.x, tr.y, 14, '#bfe0ff', 90); if (tr.human && !this.demo) Sound.sfx.splash(); }
      if (tr.surface === 'mud') { this.burst(tr.x, tr.y, 10, '#4a2f17', 70); if (tr.human && !this.demo) Announcer.event('mud', tr); }
      tr.lastSurf = tr.surface;
    }
    if (tr.z > 0) return;
    tr.fxT -= dt;
    if (tr.fxT > 0 || tr.speed < 40) return;
    tr.fxT = tr.surface === 'dirt' ? 0.05 : 0.03;
    const bx = tr.x - Math.cos(tr.a) * 12, by = tr.y - Math.sin(tr.a) * 12;
    if (tr.surface === 'mud') this.part(bx, by, '#4a2f17', 3, 40, 0.5, false);
    else if (tr.surface === 'water') { this.part(bx, by, '#6fb0ff', 2.5, 70, 0.5, false); this.part(bx, by, '#e6f4ff', 2, 70, 0.4, false); }
    else this.part(bx, by, this.track.theme.d3, 4 + Math.random() * 3, 20, 0.6, true);
  }

  part(x, y, col, size, spd, life, grow) {
    if (this.parts.length > 450) return;
    const a = Math.random() * Math.PI * 2, s = Math.random() * spd;
    this.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, col, size, life, max: life, grow, up: !!this.curUp });
  }
  burst(x, y, n, col, spd, life = 0.5) {
    for (let i = 0; i < n; i++) this.part(x, y, col, 2 + Math.random() * 3, spd, life, false);
  }
  confetti(tr) {
    const cols = ['#ff4d4d', '#ffd23f', '#4dd2ff', '#7dff7a', '#ff7af5'];
    this.curUp = tr.upper;
    for (let i = 0; i < 60; i++) this.part(tr.x, tr.y, cols[i % 5], 2.5, 220, 1.4, false);
  }
  drawParts(g, up) {
    for (const p of this.parts) {
      if (p.up !== up) continue;
      const f = Math.max(0, p.life / p.max), s = p.grow ? p.size * (2 - f) : p.size;
      g.globalAlpha = f * 0.8; g.fillStyle = p.col; ellipse(g, p.x, p.y, s, s);
    }
    g.globalAlpha = 1;
  }
  nearBridge(tr) {
    const t = this.track, r2 = (t.hw + 34) ** 2;
    return t.bridgeIdx.some(i => (t.pts[i].x - tr.x) ** 2 + (t.pts[i].y - tr.y) ** 2 < r2);
  }
  // Dibuja una capa (puente o túnel) con un agujero suave donde están los jugadores tapados
  drawLayer(g, layer, holes) {
    if (!holes.length) { g.drawImage(layer, 0, 0, W, H); return; }
    const tmp = this.tmp || (this.tmp = document.createElement('canvas'));
    if (tmp.width !== layer.width || tmp.height !== layer.height) { tmp.width = layer.width; tmp.height = layer.height; }
    const tg = tmp.getContext('2d'), k = layer.width / W;
    tg.globalCompositeOperation = 'source-over';
    tg.clearRect(0, 0, tmp.width, tmp.height);
    tg.drawImage(layer, 0, 0);
    tg.globalCompositeOperation = 'destination-out';
    for (const tr of holes) {
      const x = tr.x * k, y = tr.y * k, r = 54 * k, grd = tg.createRadialGradient(x, y, r * 0.35, x, y, r);
      grd.addColorStop(0, 'rgba(0,0,0,0.78)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      tg.fillStyle = grd; tg.beginPath(); tg.arc(x, y, r, 0, Math.PI * 2); tg.fill();
    }
    g.drawImage(tmp, 0, 0, W, H);
  }
  honk(tr) { Sound.horn(tr.horn, tr.player); this.popup(tr.x, tr.y - 8, '♪♪', tr.color); }
  popup(x, y, text, col) { this.popups.push({ x, y, text, col, life: 1.2 }); }
  showBanner(text, col, t) { this.banner = { text, col, t, max: t }; }

  draw(g) {
    const t = getTrack(this.trackIndex);
    g.save();
    if (this.shake > 0) g.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
    g.drawImage(t.canvas, 0, 0, W, H);
    const now = performance.now() / 1000;
    for (const pk of this.pickups) {
      if (pk.life < 2 && Math.floor(pk.life * 8) % 2) continue;
      drawPickup(g, pk, Math.sin(now * 4 + pk.bob) * 2);
    }
    // Por capas: lo de abajo, el puente, lo de arriba y los túneles.
    // El puente y el cerro se aclaran alrededor del jugador que pasa por debajo o por dentro.
    const byY = (a, b) => (a.z > 0) - (b.z > 0) || a.y - b.y;
    const lower = this.trucks.filter(tr => !tr.upper).sort(byY), upper = this.trucks.filter(tr => tr.upper).sort(byY);
    this.drawParts(g, false);
    for (const tr of lower) tr.drawShadow(g);
    for (const tr of lower) tr.draw(g, this.demo);
    if (t.over) this.drawLayer(g, t.over, lower.filter(tr => tr.human && this.nearBridge(tr)));
    this.drawParts(g, true);
    for (const tr of upper) tr.drawShadow(g);
    for (const tr of upper) tr.draw(g, this.demo);
    if (t.cover) this.drawLayer(g, t.cover, this.trucks.filter(tr => tr.human && t.tunnelAt[tr.idx]));
    for (const p of this.popups) {
      g.globalAlpha = Math.min(1, p.life * 2);
      bigText(g, p.text, p.x, p.y - 14, 16, p.col);
    }
    g.globalAlpha = 1;
    g.restore();
    if (this.demo) return;
    this.drawHUD(g);
    if (this.state === 'countdown') {
      const n = Math.ceil(this.count), f = this.count - Math.floor(this.count);
      bigText(g, trackName(this.trackIndex), W / 2, H / 2 - 110, 44, '#fff');
      if (Game.cup && !Game.testing) bigText(g, Game.cupLabel(), W / 2, H / 2 - 155, 22, '#ffd23f');
      if (n <= 3) bigText(g, String(n), W / 2, H / 2, 110 * (0.8 + f * 0.5), '#ffd23f');
      else bigText(g, L().laps(LAPS), W / 2, H / 2, 40, '#ffd23f');
    } else if (this.goT > 0) {
      g.globalAlpha = Math.min(1, this.goT * 2);
      bigText(g, L().go, W / 2, H / 2, 130, '#7dff7a');
      g.globalAlpha = 1;
    }
    if (this.banner) {
      const b = this.banner, e = b.max - b.t, s = Math.min(1, e * 6);
      g.globalAlpha = Math.min(1, b.t * 2);
      bigText(g, b.text, W / 2, H * 0.36, 54 * (0.6 + s * 0.4), b.col);
      g.globalAlpha = 1;
    }
  }

  drawHUD(g) {
    g.fillStyle = 'rgba(15,10,5,0.85)'; g.fillRect(0, 0, W, HUD_H);
    const pw = W / this.hudOrder.length;
    this.hudOrder.forEach((tr, i) => {
      const x = i * pw;
      g.fillStyle = tr.color; roundRect(g, x + 5, 5, 40, HUD_H - 10, 6); g.fill();
      g.textBaseline = 'middle'; g.textAlign = 'center';
      g.font = font(LANG === 'en' ? 16 : 20); g.fillStyle = '#fff'; g.fillText(L().ord(tr.pos), x + 25, HUD_H / 2 + 1);
      g.textAlign = 'left'; g.font = font(14); g.fillStyle = tr.human ? '#fff' : '#bbb';
      g.fillText(racerName(tr.r), x + 52, 15);
      g.font = font(12, 700); g.fillStyle = '#ddd';
      g.fillText(tr.finished ? L().finishTag : L().lap(clamp(tr.lapDone + 1, 1, LAPS), LAPS), x + 52, 33);
      if (tr.human) {
        g.textAlign = 'right';
        g.font = font(13); g.fillStyle = '#8ff'; g.fillText('NITRO ×' + tr.nitros, x + pw - 10, 15);
        g.fillStyle = '#ffe04a'; g.fillText('$' + (tr.r.money + tr.earned), x + pw - 10, 33);
      }
      if (i) { g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(x, 6, 1, HUD_H - 12); }
    });
  }
}
