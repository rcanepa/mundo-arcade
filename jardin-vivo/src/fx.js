// ===== Efectos: lluvia, mariposas, abejas, picaflores, hojas que caen y textos flotantes =====
const FX = { parts: [], floats: [], critters: [], rain: [], flash: 0, cloudShade: [] };

function fxFloat(wx, wy, text, col = '#2f6a2a', big) {
  FX.floats.push({ x: wx, y: wy, z: 1.2, text, col, t: 0, life: 1.8, big });
}
function fxBurst(wx, wy, n, col, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, v = (o.v || 1) * (0.5 + Math.random());
    FX.parts.push({ x: wx, y: wy, z: o.z || 0.3, vx: Math.cos(a) * v * 0.6, vy: Math.sin(a) * v * 0.6, vz: (o.up || 2) * (0.5 + Math.random()),
      col: Array.isArray(col) ? pick(col) : col, t: 0, life: o.life || 0.8, r: o.r || 2, g: o.g !== undefined ? o.g : 9, kind: o.kind || 'dot' });
  }
}
const fxSplash = (x, y) => fxBurst(x, y, 10, ['#a8d4f0', '#d8f0ff', '#7fbfe8'], { up: 2.5, life: 0.6, r: 1.8 });
const fxSparkle = (x, y, col = '#ffe680') => fxBurst(x, y, 12, [col, '#ffffff'], { up: 3, life: 0.9, r: 2.2, g: 4, kind: 'star' });
const fxPuff = (x, y, col = '#8b6845') => fxBurst(x, y, 9, [col, shade(col, 0.2)], { up: 1.2, life: 0.6, r: 2.6, g: 5 });
function fxSprinkle(st) {
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * TAU, d = Math.random() * 2.2;
    FX.parts.push({ x: st.x + 0.5, y: st.y + 0.5, z: 0.3, vx: Math.cos(a) * d * 0.9, vy: Math.sin(a) * d * 0.9, vz: 3 + Math.random() * 1.5,
      col: '#cfe9ff', t: -Math.random() * 1.5, life: 1.1, r: 1.6, g: 8, kind: 'dot' });
  }
}

// ---------- Bichos del jardín ----------
const BUTTERFLY = [['#f7f3e8', '#d8d2c0'], ['#f6c73a', '#d89a1a'], ['#f08a2a', '#2a2a2a'], ['#7fb0e8', '#3a5f9a'], ['#e8a0c8', '#a05080']];
function updateCritters(dt, s) {
  const day = s.z > 0.12 && !G.w.rain && tempAt(G.w, G.hour) > 11;
  const blooming = G.plants.filter(p => p.bloom > 0.4 && !p.dead && tileAt(p.x, p.y).own);
  const want = day ? Math.min(16, Math.round(blooming.length * 0.45)) : 0;
  const bf = FX.critters;
  if (bf.length < want && blooming.length && Math.random() < dt * 1.5) {
    const p = pick(blooming), sp = spOf(p);
    const bird = (sp.id === 'fuchsia' || sp.id === 'salvia' || sp.id === 'copihue') && Math.random() < 0.35;
    const kind = bird ? 'hummer' : sp.insect && Math.random() < 0.55 ? 'bee' : 'butterfly';
    const edge = Math.random() < 0.5;
    bf.push({ kind, x: edge ? -1 : p.x + rand(-6, 6), y: edge ? p.y + rand(-4, 4) : -1, z: 2 + Math.random(), tgt: p, t: 0, rest: 0,
      col: pick(BUTTERFLY), ph: Math.random() * TAU, life: 25 + Math.random() * 30 });
  }
  for (let i = bf.length - 1; i >= 0; i--) {
    const c = bf[i];
    c.t += dt; c.life -= dt;
    const leaving = c.life < 0 || !day;
    let tx, ty, tz;
    if (leaving) { tx = c.x + (c.x < GW / 2 ? -8 : 8); ty = c.y - 6; tz = 3; }
    else {
      if (!c.tgt || c.tgt.dead || c.tgt.bloom < 0.3 || (c.rest <= 0 && Math.random() < dt * 0.25)) { c.tgt = blooming.length ? pick(blooming) : null; c.rest = 0; }
      if (!c.tgt) { c.life = -1; continue; }
      const h = plantSize(c.tgt).h;
      tx = c.tgt.x + 0.5 + Math.sin(c.ph) * 0.15; ty = c.tgt.y + 0.5; tz = h * 0.95 + 0.05;
    }
    const sp = c.kind === 'bee' ? 2.4 : c.kind === 'hummer' ? 3.2 : 1.3;
    const dx = tx - c.x, dy = ty - c.y, dz = tz - c.z, d = Math.hypot(dx, dy, dz);
    if (d < 0.15 && !leaving) { c.rest += dt; c.z = tz + Math.sin(c.t * (c.kind === 'butterfly' ? 2 : 20)) * 0.03; }
    else {
      const k = Math.min(1, sp * dt / Math.max(d, 0.01));
      c.x += dx * k + Math.sin(c.t * 3 + c.ph) * dt * 0.5; c.y += dy * k + Math.cos(c.t * 2.3 + c.ph) * dt * 0.4;
      c.z += dz * k + (c.kind === 'butterfly' ? Math.sin(c.t * 5) * dt * 0.6 : 0);
    }
    if (leaving && (c.x < -6 || c.x > GW + 6 || c.y < -6)) bf.splice(i, 1);
  }
}
function drawCritter(g, c) {
  const [x, y] = P(c.x, c.y, c.z), z = cam.z;
  if (c.kind === 'butterfly') {
    const flap = Math.abs(Math.sin(c.t * (c.rest > 0 ? 4 : 14) + c.ph));
    g.fillStyle = css(c.col[0]);
    g.beginPath(); g.ellipse(x - 2.5 * z * flap, y - 1 * z, 3.4 * z * flap, 2.6 * z, -0.4, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + 2.5 * z * flap, y - 1 * z, 3.4 * z * flap, 2.6 * z, 0.4, 0, TAU); g.fill();
    g.fillStyle = css(c.col[1]);
    g.beginPath(); g.ellipse(x - 1.8 * z * flap, y + 1.5 * z, 2 * z * flap, 1.6 * z, -0.6, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + 1.8 * z * flap, y + 1.5 * z, 2 * z * flap, 1.6 * z, 0.6, 0, TAU); g.fill();
    g.fillStyle = '#2a2a2a'; g.fillRect(x - 0.5 * z, y - 2.5 * z, 1 * z, 5 * z);
  } else if (c.kind === 'bee') {
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(x, y - 2 * z, 2 * z, 1.2 * z + Math.abs(Math.sin(c.t * 40)) * z, 0, 0, TAU); g.fill();
    g.fillStyle = '#f2c230'; g.beginPath(); g.ellipse(x, y, 2.4 * z, 1.7 * z, 0, 0, TAU); g.fill();
    g.fillStyle = '#2a2a2a'; g.fillRect(x - 0.6 * z, y - 1.6 * z, 1.1 * z, 3.2 * z);
  } else {
    const dir = Math.sign((c.tgt ? c.tgt.x - c.x : 1) || 1);
    g.fillStyle = '#2f8a5a'; g.beginPath(); g.ellipse(x, y, 4 * z, 2.4 * z, dir * -0.3, 0, TAU); g.fill();
    g.fillStyle = '#c8304a'; g.beginPath(); g.arc(x + dir * 2 * z, y - 0.5 * z, 1.4 * z, 0, TAU); g.fill();
    g.strokeStyle = '#2a2a2a'; g.lineWidth = 1 * z; g.beginPath(); g.moveTo(x + dir * 3.5 * z, y - 1 * z); g.lineTo(x + dir * 7.5 * z, y - 0.5 * z); g.stroke();
    g.fillStyle = 'rgba(200,230,210,0.6)'; const w = Math.sin(c.t * 60) * 4 * z;
    g.beginPath(); g.ellipse(x - dir * z, y - 2 * z, 1.5 * z, Math.abs(w), 0, 0, TAU); g.fill();
  }
}

// Hojas de otoño, pétalos de cerezo y polen
function updateParts(dt) {
  const ps = FX.parts;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i];
    p.t += dt;
    if (p.t < 0) continue;
    if (p.kind === 'leaf') { p.x += (p.vx + R.wind * 0.6) * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz = -0.5 - Math.sin(p.t * 3) * 0.3; }
    else { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= p.g * dt; }
    if (p.z < 0) { p.z = 0; p.vx *= 0.5; p.vy *= 0.5; p.vz = 0; if (p.kind === 'leaf') p.life = Math.min(p.life, p.t + 3); }
    if (p.t > p.life) ps.splice(i, 1);
  }
  // árboles que sueltan hojas o pétalos
  if (ps.length < 160 && Math.random() < dt * 4) {
    for (const p of G.plants) {
      if (p.dead || !isTree(spOf(p)) && spOf(p).art.f !== 'bush') continue;
      const sp = spOf(p), vs = p._vs;
      const falling = vs && vs.fall > 0.4, petals = sp.art.nb && p.bloom > 0.5;
      if (!(falling || petals) || Math.random() > (isTree(sp) ? 0.5 : 0.1)) continue;
      const sz = plantSize(p);
      ps.push({ x: p.x + 0.5 + rand(-sz.w / 2, sz.w / 2), y: p.y + 0.5 + rand(-sz.w / 3, sz.w / 3), z: sz.h * rand(0.5, 0.95), vx: rand(-0.2, 0.2), vy: rand(-0.1, 0.3), vz: -0.5,
        col: petals ? (vs ? css(vs.fc) : '#f7c6d9') : css(shade(sp.fall, rand(-0.15, 0.1))), t: 0, life: 9, r: petals ? 1.8 : 2.4, g: 0, kind: 'leaf', rot: Math.random() * 6 });
    }
  }
}
function drawPart(g, p) {
  if (p.t < 0) return;
  const [x, y] = P(p.x, p.y, p.z), z = cam.z, a = clamp(1 - p.t / p.life, 0, 1) * (p.kind === 'leaf' ? 1 : 1);
  g.globalAlpha = p.kind === 'leaf' ? Math.min(1, a * 3) : a;
  g.fillStyle = p.col;
  if (p.kind === 'leaf') { g.save(); g.translate(x, y); g.rotate(p.rot + p.t * 2); g.beginPath(); g.ellipse(0, 0, p.r * z, p.r * 0.55 * z, 0, 0, TAU); g.fill(); g.restore(); }
  else if (p.kind === 'star') { g.beginPath(); for (let k = 0; k < 8; k++) { const r = (k % 2 ? 0.4 : 1) * p.r * 1.6 * z, an = k / 8 * TAU + p.t * 4; g.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); } g.fill(); }
  else { g.beginPath(); g.arc(x, y, p.r * z, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
}

function fxItems(items, g) {
  for (const c of FX.critters) items.push({ k: c.x + c.y + 1.2 + c.z * 0.4, f: () => drawCritter(g, c) });
  for (const p of FX.parts) items.push({ k: p.x + p.y + 0.5 + p.z * 0.3, f: () => drawPart(g, p) });
}

// ---------- Clima: sombra de nubes, lluvia, relámpagos ----------
function drawWeatherFx(g, s, dt) {
  const w = G.w;
  // sombras de nubes que cruzan el jardín
  if (w.cloud > 0.15 && w.cloud < 0.85 && s.z > 0.05) {
    while (FX.cloudShade.length < 4) FX.cloudShade.push({ x: rand(-0.4, 1.2), y: rand(0, 1), r: rand(0.18, 0.32) });
    for (const c of FX.cloudShade) {
      c.x += dt * 0.012 * (0.6 + R.wind);
      if (c.x > 1.4) { c.x = -0.4; c.y = Math.random(); }
      const x = c.x * VW, y = c.y * VH, r = c.r * Math.max(VW, VH);
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(20,30,40,${0.16 * w.cloud * 1.6})`); gr.addColorStop(1, 'rgba(20,30,40,0)');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * 0.55, 0, 0, TAU); g.fill();
    }
  }
  const raining = w.rain > 0 && G.hour >= 4 && G.hour < 4 + Math.min(18, w.rain * 0.6);
  const rn = FX.rain;
  if (raining) {
    const want = Math.min(420, 120 + w.rain * 10);
    while (rn.length < want) rn.push({ x: Math.random() * VW, y: Math.random() * VH, v: 600 + Math.random() * 300, l: 10 + Math.random() * 10 });
  } else if (rn.length) rn.length = Math.max(0, rn.length - 20);
  if (rn.length) {
    g.strokeStyle = 'rgba(200,215,235,0.45)'; g.lineWidth = 1;
    g.beginPath();
    const wx = R.wind * 0.35;
    for (const d of rn) {
      d.y += d.v * dt; d.x += d.v * dt * wx;
      if (d.y > VH) { d.y = -20; d.x = Math.random() * VW; }
      if (d.x > VW) d.x -= VW;
      g.moveTo(d.x, d.y); g.lineTo(d.x - d.l * wx, d.y - d.l);
    }
    g.stroke();
    // salpicaduras en el suelo
    g.strokeStyle = 'rgba(220,235,255,0.5)';
    for (let i = 0; i < 12; i++) {
      const [x, y] = P(Math.random() * GW, Math.random() * GH);
      g.beginPath(); g.ellipse(x, y, 3 * cam.z, 1.3 * cam.z, 0, 0, TAU); g.stroke();
    }
  }
  if (w.storm && raining && Math.random() < dt * 0.08) { FX.flash = 1; if (typeof Sound !== 'undefined') Sound.thunder(); }
}

function drawOverlayFx(g, s, dt) {
  // luciérnagas en noches de verano
  const night = nightness(s.z);
  if (night > 0.5 && seasonOf(G.day % DAYS_YEAR) === 1 && !G.w.rain) {
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const fx = (i * 7.31) % GW, fy = (i * 3.77) % GH, t = R.t * 0.3 + i;
      const [x, y] = P(fx + Math.sin(t) * 0.8, fy + Math.cos(t * 0.7) * 0.8, 0.6 + Math.sin(t * 1.3) * 0.3);
      const a = (0.5 + 0.5 * Math.sin(R.t * 3 + i * 2)) * night;
      const gr = g.createRadialGradient(x, y, 0, x, y, 7 * cam.z);
      gr.addColorStop(0, `rgba(220,255,140,${a})`); gr.addColorStop(1, 'rgba(220,255,140,0)');
      g.fillStyle = gr; g.fillRect(x - 8 * cam.z, y - 8 * cam.z, 16 * cam.z, 16 * cam.z);
    }
    g.globalCompositeOperation = 'source-over';
  }
  if (FX.flash > 0) { g.fillStyle = `rgba(240,245,255,${FX.flash * 0.55})`; g.fillRect(0, 0, VW, VH); FX.flash -= dt * 3; }
  // textos flotantes ("+$12", "¡Regada!")
  for (let i = FX.floats.length - 1; i >= 0; i--) {
    const f = FX.floats[i];
    f.t += dt;
    if (f.t > f.life) { FX.floats.splice(i, 1); continue; }
    const [x, y] = P(f.x, f.y, f.z + f.t * 0.7), a = clamp((f.life - f.t) * 2, 0, 1);
    g.globalAlpha = a;
    g.font = `800 ${f.big ? 17 : 13}px ui-rounded, "SF Pro Rounded", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineWidth = 4; g.strokeStyle = 'rgba(255,253,245,0.95)'; g.strokeText(f.text, x, y);
    g.fillStyle = f.col; g.fillText(f.text, x, y);
    g.globalAlpha = 1;
  }
}

function updateFx(dt) {
  const s = sunNow();
  updateCritters(dt, s);
  updateParts(dt);
}
