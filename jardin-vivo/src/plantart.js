// ===== Dibujo de plantas: cada especie se genera a partir de sus datos (forma, hojas, flores, frutos) =====
// Todo se dibuja con el origen en la base de la planta; y negativo es hacia arriba. S = píxeles por metro.
const PX_M = 40;
const C_DEAD = '#9c8256', C_YELLOW = '#cfc25a', C_BURN = '#93693a', C_FROST = '#5a6352';

function hydrangeaColor(ph) {
  if (ph < 5.5) return mix('#5f86e0', '#8a7fd8', clamp((ph - 4.8) / 0.7, 0, 1));
  if (ph < 6.6) return mix('#8a7fd8', '#d98fc0', (ph - 5.5) / 1.1);
  return mix('#d98fc0', '#f3a6c3', clamp((ph - 6.6) / 1, 0, 1));
}

// ---------- Estado visual ----------
function visualState(p, over) {
  const sp = spOf(p), yd = G.day % DAYS_YEAR, a = sp.art;
  const vs = {
    g: clamp(p.g, 0, 1), hp: p.hp / 100, bloom: p.bloom, fruit: p.fruit, dorm: p.dorm, dead: p.dead,
    wilt: p.wilt || 0, yellow: p.yellow || 0, burn: p.burn || 0, frost: p.frostHit ? 1 : 0, fall: 0,
    pests: p.pests ? sp.pests || 'aphid' : 0, cloth: p.cloth ? 1 : 0, ph: 7
  };
  if (over) Object.assign(vs, over);
  if (sp.fall && sp.dorm && !vs.dorm) {
    const s = sp.dorm[0];
    if (yd >= s - 9 && yd < s) vs.fall = clamp((yd - (s - 9)) / 6, 0, 1);
  }
  if (sp.hydra) { const t = tileAt(p.x, p.y); vs.ph = over && over.ph ? over.ph : t ? t.ph : 7; }
  // colores
  let lc = rgbOf(a.lc);
  lc = mix(lc, C_YELLOW, clamp(vs.yellow * 0.75, 0, 0.7));
  lc = mix(lc, C_BURN, clamp(vs.burn * 0.6, 0, 0.55));
  if (vs.fall) lc = mix(lc, sp.fall, vs.fall);
  if (vs.frost) lc = mix(lc, C_FROST, 0.45);
  lc = mix(lc, [176, 166, 120], vs.wilt * 0.35);
  if (vs.dead) lc = rgbOf(C_DEAD);
  vs.lc = lc;
  vs.stem = vs.dead ? shade(C_DEAD, -0.15) : mix(shade(lc, -0.25), [110, 120, 70], 0.25);
  if (a.fl) {
    let fc = a.fl.pal ? a.fl.pal[p.pal % a.fl.pal.length] : a.fl.c;
    if (sp.hydra) fc = hydrangeaColor(vs.ph);
    vs.fc = rgbOf(fc); vs.fc2 = rgbOf(a.fl.c2 || '#f2d230');
    if (vs.wilt > 0.4) vs.fc = mix(vs.fc, [190, 170, 130], 0.3);
  }
  vs.key = [Math.round(vs.g * 14), Math.round(vs.hp * 4), Math.round(vs.bloom * 6), Math.round(vs.fruit * 4), vs.dorm | 0, vs.dead | 0,
    Math.round(vs.wilt * 3), Math.round(vs.yellow * 4), Math.round(vs.burn * 3), vs.frost, Math.round(vs.fall * 5), vs.pests, vs.cloth,
    sp.hydra ? Math.round(vs.ph * 3) : 0].join(',');
  return vs;
}

// ---------- Hojas ----------
function leafPath(g, shape, L, W) {
  g.beginPath();
  switch (shape) {
    case 'lance': case 'grass':
      g.moveTo(0, 0); g.quadraticCurveTo(L * 0.42, -W, L, 0); g.quadraticCurveTo(L * 0.42, W, 0, 0); break;
    case 'round': case 'heartbig':
      g.moveTo(0, 0); g.bezierCurveTo(L * 0.05, -W * 1.25, L * 1.05, -W * 1.15, L, 0); g.bezierCurveTo(L * 1.05, W * 1.15, L * 0.05, W * 1.25, 0, 0); break;
    case 'heart':
      g.moveTo(0, 0); g.bezierCurveTo(-L * 0.12, -W * 1.2, L * 0.75, -W * 1.05, L, 0); g.bezierCurveTo(L * 0.75, W * 1.05, -L * 0.12, W * 1.2, 0, 0); break;
    case 'frilly': {
      g.moveTo(0, 0);
      const n = 7;
      for (let i = 0; i <= n; i++) { const t = i / n, a = Math.PI * t; g.lineTo(L * (0.5 - 0.5 * Math.cos(a)), -W * Math.sin(a) * (1 + 0.18 * Math.sin(i * 2.7))); }
      for (let i = n; i >= 0; i--) { const t = i / n, a = Math.PI * t; g.lineTo(L * (0.5 - 0.5 * Math.cos(a)), W * Math.sin(a) * (1 + 0.18 * Math.cos(i * 2.3))); }
      break;
    }
    case 'serrate': {
      g.moveTo(0, 0);
      const n = 6;
      for (let i = 1; i <= n; i++) { const t = i / n; g.lineTo(L * t - L * 0.06, -W * Math.sin(Math.PI * t) * 1.05); g.lineTo(L * t, -W * Math.sin(Math.PI * t) * 0.8); }
      for (let i = n - 1; i >= 0; i--) { const t = i / n; g.lineTo(L * t + L * 0.06, W * Math.sin(Math.PI * t) * 1.05); g.lineTo(L * t, W * Math.sin(Math.PI * t) * 0.8); }
      break;
    }
    case 'succ':
      g.moveTo(0, -W * 0.5); g.quadraticCurveTo(L * 0.55, -W * 1.2, L, 0); g.quadraticCurveTo(L * 0.55, W * 1.2, 0, W * 0.5); g.closePath(); break;
    case 'aloe': case 'agave':
      g.moveTo(0, -W); g.quadraticCurveTo(L * 0.5, -W * 0.85, L, 0); g.quadraticCurveTo(L * 0.5, W * 0.85, 0, W); g.closePath(); break;
    case 'arrow':
      g.moveTo(0, 0); g.bezierCurveTo(-L * 0.25, -W * 1.3, L * 0.6, -W * 0.9, L, 0); g.bezierCurveTo(L * 0.6, W * 0.9, -L * 0.25, W * 1.3, 0, 0); break;
    default: // oval, glossy, big, orchid, hosta, calathea, monstera, paddle
      g.moveTo(0, 0); g.bezierCurveTo(L * 0.22, -W * 1.05, L * 0.78, -W * 0.95, L, 0); g.bezierCurveTo(L * 0.78, W * 0.95, L * 0.22, W * 1.05, 0, 0);
  }
}

// Dibuja una hoja con base en (x, y) apuntando al ángulo a
function leaf(g, x, y, a, L, W, col, shape, o = {}) {
  if (L < 0.6) return;
  g.save(); g.translate(x, y); g.rotate(a);
  if (shape === 'needle') {
    g.strokeStyle = css(col); g.lineWidth = Math.max(0.6, W * 0.9); g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, 0); g.lineTo(L, 0); g.stroke(); g.restore(); return;
  }
  if (shape === 'compound' || shape === 'feather' || shape === 'parsley' || shape === 'trifol') { compoundLeaf(g, shape, L, W, col); g.restore(); return; }
  if (shape === 'palmate') { palmLeaf(g, L, W, col); g.restore(); return; }
  if (shape === 'trap') { trapLeaf(g, L, W, col); g.restore(); return; }
  leafPath(g, shape, L, W);
  g.fillStyle = css(col); g.fill();
  if (o.edge) { g.lineWidth = Math.max(0.7, W * 0.22); g.strokeStyle = css(o.edge); g.stroke(); }
  if (shape === 'aloe' || shape === 'agave') {
    g.fillStyle = css(shade(col, 0.22), 0.55);
    g.beginPath(); g.moveTo(0, -W * 0.25); g.quadraticCurveTo(L * 0.5, -W * 0.4, L * 0.96, 0); g.quadraticCurveTo(L * 0.5, 0, 0, W * 0.15); g.fill();
    if (shape === 'agave') { g.strokeStyle = css(shade(col, -0.5)); g.lineWidth = Math.max(0.6, W * 0.12); g.beginPath(); g.moveTo(L * 0.94, 0); g.lineTo(L * 1.06, 0); g.stroke(); }
    g.fillStyle = css(shade(col, 0.5), 0.7);
    for (let i = 1; i < 7; i++) { const t = i / 7; g.fillRect(L * t, -W * (1 - t) * 0.95 - 0.6, 1, 1); g.fillRect(L * t, W * (1 - t) * 0.95 - 0.4, 1, 1); }
  } else if (shape === 'succ') {
    g.fillStyle = css(shade(col, 0.25), 0.45);
    g.beginPath(); g.moveTo(L * 0.1, -W * 0.2); g.quadraticCurveTo(L * 0.55, -W * 0.7, L * 0.92, -W * 0.05); g.quadraticCurveTo(L * 0.55, -W * 0.15, L * 0.1, -W * 0.2); g.fill();
    if (o.tip) { g.fillStyle = css(o.tip, 0.8); g.beginPath(); g.arc(L * 0.93, 0, W * 0.32, 0, TAU); g.fill(); }
  } else if (shape === 'monstera') {
    g.fillStyle = 'rgba(0,0,0,0)';
    g.globalCompositeOperation = 'destination-out';
    for (let i = 1; i <= 4; i++) {
      const t = i / 5.2;
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(L * t, s * W * 0.25); g.lineTo(L * (t + 0.08), s * W * 1.1); g.lineTo(L * (t + 0.14), s * W * 1.1); g.lineTo(L * (t + 0.05), s * W * 0.25);
        g.fillStyle = '#000'; g.fill();
        g.beginPath(); g.ellipse(L * (t - 0.02), s * W * 0.55, L * 0.025, W * 0.09, 0, 0, TAU); g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over';
  } else if (shape === 'calathea') {
    g.save(); leafPath(g, shape, L, W); g.clip();
    g.fillStyle = css(shade(col, 0.35), 0.8);
    for (let i = 1; i < 7; i++) { const t = i / 7; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(L * t, s * W * 0.45, L * 0.04, W * 0.3, s * 0.5, 0, TAU); g.fill(); } }
    g.fillStyle = css(shade(col, -0.35), 0.8);
    for (let i = 1; i < 7; i++) { const t = i / 7 + 0.07; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(L * t, s * W * 0.5, L * 0.025, W * 0.25, s * 0.5, 0, TAU); g.fill(); } }
    g.restore();
  } else if (shape === 'hosta') {
    g.strokeStyle = css(shade(col, -0.18), 0.5); g.lineWidth = Math.max(0.5, W * 0.05);
    for (let i = -2; i <= 2; i++) { if (!i) continue; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.45, W * i * 0.42, L * 0.95, W * i * 0.06); g.stroke(); }
  }
  // nervio central y brillo
  g.strokeStyle = css(shade(col, 0.2), 0.55); g.lineWidth = Math.max(0.5, W * 0.11);
  g.beginPath(); g.moveTo(L * 0.04, 0); g.lineTo(L * 0.86, 0); g.stroke();
  if (shape === 'glossy' || shape === 'heartbig' || shape === 'orchid') {
    g.strokeStyle = 'rgba(255,255,255,0.28)'; g.lineWidth = Math.max(0.6, W * 0.2);
    g.beginPath(); g.moveTo(L * 0.25, -W * 0.45); g.quadraticCurveTo(L * 0.5, -W * 0.62, L * 0.72, -W * 0.4); g.stroke();
  }
  g.restore();
}

function compoundLeaf(g, shape, L, W, col) {
  g.strokeStyle = css(shade(col, -0.15)); g.lineWidth = Math.max(0.5, W * 0.12); g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(L, 0); g.stroke();
  if (shape === 'trifol') {
    for (const a of [-0.75, 0, 0.75]) { g.save(); g.translate(L * 0.55, 0); g.rotate(a); leafPath(g, 'serrate', L * 0.5, W * 0.65); g.fillStyle = css(shade(col, a ? -0.06 : 0.04)); g.fill(); g.restore(); }
    return;
  }
  const fine = shape === 'feather' || shape === 'parsley', pairs = fine ? 5 : 3;
  for (let i = 0; i < pairs; i++) {
    const t = 0.25 + 0.7 * i / pairs, l = (fine ? L * 0.3 : L * 0.36) * (1 - i / pairs * 0.4);
    for (const s of [-1, 1]) {
      g.save(); g.translate(L * t, 0); g.rotate(s * (fine ? 0.9 : 0.75));
      if (shape === 'feather') { g.lineWidth = Math.max(0.5, W * 0.08); g.strokeStyle = css(col); g.beginPath(); g.moveTo(0, 0); g.lineTo(l, 0); g.moveTo(l * 0.5, 0); g.lineTo(l * 0.75, -l * 0.2); g.moveTo(l * 0.5, 0); g.lineTo(l * 0.75, l * 0.2); g.stroke(); }
      else { leafPath(g, shape === 'parsley' ? 'serrate' : 'oval', l, W * (fine ? 0.35 : 0.42)); g.fillStyle = css(shade(col, s * 0.05)); g.fill(); }
      g.restore();
    }
  }
  if (shape === 'feather') return;
  g.save(); g.translate(L * 0.92, 0); leafPath(g, 'oval', L * 0.32, W * 0.42); g.fillStyle = css(col); g.fill(); g.restore();
}

function palmLeaf(g, L, W, col) {
  const n = 5;
  g.fillStyle = css(col);
  for (let i = 0; i < n; i++) {
    const a = (i - (n - 1) / 2) * 0.55;
    g.save(); g.rotate(a); leafPath(g, 'lance', L * (1 - Math.abs(i - 2) * 0.15), W * 0.42); g.fill();
    g.strokeStyle = css(shade(col, 0.18), 0.5); g.lineWidth = Math.max(0.4, W * 0.06); g.beginPath(); g.moveTo(0, 0); g.lineTo(L * 0.8, 0); g.stroke();
    g.restore();
  }
}

function trapLeaf(g, L, W, col) {
  g.fillStyle = css(col);
  leafPath(g, 'lance', L * 0.55, W * 0.4); g.fill();
  g.save(); g.translate(L * 0.55, 0);
  for (const s of [-1, 1]) {
    g.beginPath(); g.ellipse(L * 0.22, s * W * 0.32, L * 0.24, W * 0.42, 0, 0, TAU);
    g.fillStyle = css(col); g.fill();
    g.beginPath(); g.ellipse(L * 0.22, s * W * 0.28, L * 0.17, W * 0.26, 0, 0, TAU);
    g.fillStyle = 'rgba(205,45,50,0.85)'; g.fill();
    g.strokeStyle = css(shade(col, 0.2)); g.lineWidth = 0.7;
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.15 + 0.7 * i / 6), cx = L * 0.22 + Math.cos(a) * L * 0.24 * -1, cy = s * (W * 0.32 + Math.sin(a) * W * 0.42);
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - Math.cos(a) * W * 0.18, cy + s * Math.sin(a) * W * 0.25); g.stroke();
    }
  }
  g.restore();
}

// ---------- Flores ----------
function petalRing(g, R, n, w, col, k, rot = 0, shape = 'ell', dark = 0) {
  for (let i = 0; i < n; i++) {
    const a = rot + i * TAU / n;
    g.save(); g.scale(1, k); g.rotate(a);
    g.beginPath();
    if (shape === 'point') { g.moveTo(0, 0); g.quadraticCurveTo(R * 0.45, -w, R, 0); g.quadraticCurveTo(R * 0.45, w, 0, 0); }
    else if (shape === 'round') { g.moveTo(0, 0); g.bezierCurveTo(R * 0.2, -w * 1.3, R * 1.1, -w * 1.2, R, 0); g.bezierCurveTo(R * 1.1, w * 1.2, R * 0.2, w * 1.3, 0, 0); }
    else g.ellipse(R * 0.55, 0, R * 0.5, w, 0, 0, TAU);
    const sh = dark ? -0.06 * Math.sin(a + 1) : 0;
    g.fillStyle = css(sh ? shade(col, sh) : col); g.fill();
    g.restore();
  }
}
function disk(g, x, y, r, col, k = 1) { g.beginPath(); g.ellipse(x, y, r, r * k, 0, 0, TAU); g.fillStyle = css(col); g.fill(); }

const FLOWER_K = 1.55;   // las flores se dibujan algo más grandes que en la realidad para que se lean en pantalla
function flower(g, x, y, R, s, col, c2, open, rr) {
  R *= FLOWER_K;
  if (R < 0.5) return;
  if (open < 0.35) { // capullo
    g.fillStyle = css(mix(col, [90, 140, 60], 0.45));
    g.beginPath(); g.ellipse(x, y, R * 0.28, R * 0.42, 0, 0, TAU); g.fill();
    return;
  }
  R *= 0.55 + 0.45 * open;
  g.save(); g.translate(x, y);
  switch (s) {
    case 'daisy':
      petalRing(g, R, 14, R * 0.17, col, 0.68, rr * 3, 'ell', 1);
      disk(g, 0, 0, R * 0.3, c2, 0.68); disk(g, -R * 0.06, -R * 0.06, R * 0.14, shade(c2, 0.25), 0.68); break;
    case 'daisy2':
      petalRing(g, R, 18, R * 0.15, shade(col, -0.08), 0.7, rr * 3);
      petalRing(g, R * 0.72, 14, R * 0.16, col, 0.7, rr * 3 + 0.2);
      disk(g, 0, 0, R * 0.26, c2, 0.7); break;
    case 'cone':
      g.save(); g.translate(0, R * 0.1);
      for (let i = 0; i < 12; i++) {
        const a = Math.PI * (0.05 + 0.9 * i / 11);
        g.save(); g.rotate(a); g.scale(1, 0.6); g.beginPath(); g.ellipse(R * 0.6, 0, R * 0.55, R * 0.16, 0, 0, TAU);
        g.fillStyle = css(shade(col, (i % 2) * -0.08)); g.fill(); g.restore();
      }
      g.restore();
      g.beginPath(); g.ellipse(0, -R * 0.05, R * 0.34, R * 0.3, 0, 0, TAU); g.fillStyle = css(c2); g.fill();
      g.fillStyle = css(shade(c2, 0.3)); for (let i = 0; i < 8; i++) g.fillRect(-R * 0.25 + (i % 4) * R * 0.15, -R * 0.2 + Math.floor(i / 4) * R * 0.15, 1, 1);
      break;
    case 'head': {
      petalRing(g, R, 22, R * 0.13, shade(col, -0.1), 0.88, rr, 'point');
      petalRing(g, R * 0.86, 20, R * 0.13, col, 0.88, rr + 0.15, 'point');
      disk(g, 0, 0, R * 0.48, c2, 0.88);
      g.fillStyle = css(shade(c2, -0.35));
      for (let i = 0; i < 40; i++) { const a = i * 2.39996, d = Math.sqrt(i / 40) * R * 0.44; g.fillRect(Math.cos(a) * d, Math.sin(a) * d * 0.88, 1.2, 1.2); }
      break;
    }
    case 'star': petalRing(g, R, 6, R * 0.16, col, 0.85, rr, 'point'); disk(g, 0, 0, R * 0.22, shade(col, -0.2)); break;
    case 'star5': petalRing(g, R, 5, R * 0.3, col, 0.8, rr, 'round'); disk(g, 0, 0, R * 0.25, c2, 0.8); break;
    case 'flat5': petalRing(g, R, 5, R * 0.42, col, 0.78, rr, 'round', 1); disk(g, 0, 0, R * 0.16, shade(col, -0.3), 0.78); break;
    case 'flat4':
      petalRing(g, R, 2, R * 0.5, col, 0.8, rr, 'round'); petalRing(g, R * 0.6, 2, R * 0.4, shade(col, 0.1), 0.8, rr + Math.PI / 2, 'round');
      disk(g, 0, 0, R * 0.2, '#f2d230', 0.8); break;
    case 'pom': case 'dahlia': {
      const rings = s === 'dahlia' ? 5 : 4;
      for (let k = 0; k < rings; k++) {
        const t = k / rings;
        petalRing(g, R * (1 - t * 0.78), s === 'dahlia' ? 14 - k : 12 - k, R * (s === 'dahlia' ? 0.12 : 0.17) * (1 - t * 0.4),
          shade(col, -0.18 + t * 0.32), 0.72, rr + k * 0.3, s === 'dahlia' ? 'point' : 'round');
      }
      if (c2 && s === 'pom') disk(g, 0, 0, R * 0.12, c2, 0.72);
      break;
    }
    case 'rose': case 'camellia': case 'gardenia': case 'peony': {
      const pe = s === 'peony' ? 7 : s === 'camellia' ? 6 : 5;
      petalRing(g, R, pe, R * 0.42, shade(col, -0.16), 0.74, rr, 'round');
      if (s === 'peony') {
        for (let i = 0; i < 22; i++) {
          const a = i * 2.39996 + rr, d = Math.sqrt(i / 22) * R * 0.62;
          g.beginPath(); g.ellipse(Math.cos(a) * d, Math.sin(a) * d * 0.74 - R * 0.06, R * 0.26, R * 0.18, a, 0, TAU);
          g.fillStyle = css(shade(col, 0.15 - (i % 3) * 0.08)); g.fill();
        }
      } else if (s === 'camellia') {
        petalRing(g, R * 0.7, 7, R * 0.3, col, 0.74, rr + 0.4, 'round');
        petalRing(g, R * 0.42, 6, R * 0.22, shade(col, 0.12), 0.74, rr + 0.8, 'round');
      } else {
        petalRing(g, R * 0.7, 5, R * 0.34, col, 0.74, rr + 0.6, 'round');
        g.strokeStyle = css(shade(col, s === 'gardenia' ? -0.12 : -0.32)); g.lineWidth = Math.max(0.6, R * 0.08);
        for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, -R * 0.04, R * (0.42 - i * 0.12), R * (0.3 - i * 0.09), 0, rr + i, rr + i + 4.2); g.stroke(); }
      }
      break;
    }
    case 'carnation':
      for (let k = 0; k < 3; k++) {
        const r0 = R * (1 - k * 0.28);
        g.beginPath();
        for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, rr2 = r0 * (i % 2 ? 0.86 : 1); g.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2 * 0.7 - k * R * 0.08); }
        g.fillStyle = css(shade(col, -0.12 + k * 0.14)); g.fill();
      }
      break;
    case 'azalea': case 'hibiscus': {
      petalRing(g, R, 5, R * (s === 'hibiscus' ? 0.5 : 0.4), col, 0.78, rr, 'round', 1);
      disk(g, 0, 0, R * 0.22, shade(col, -0.35), 0.78);
      g.strokeStyle = css(s === 'hibiscus' ? c2 : shade(col, -0.3)); g.lineWidth = Math.max(0.6, R * 0.06);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(R * 0.15, -R * 0.75); g.stroke();
      disk(g, R * 0.15, -R * 0.78, R * 0.08, s === 'hibiscus' ? c2 : '#f6e27a');
      break;
    }
    case 'funnel': case 'trumpet':
      petalRing(g, R, 5, R * 0.45, col, 0.8, rr, 'round');
      g.strokeStyle = css(shade(col, -0.3), 0.6); g.lineWidth = Math.max(0.5, R * 0.05);
      for (let i = 0; i < 5; i++) { const a = rr + i * TAU / 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.64); g.stroke(); }
      disk(g, 0, 0, R * 0.22, s === 'trumpet' ? shade(col, -0.2) : shade(col, -0.45), 0.8); break;
    case 'trumpet2':
      petalRing(g, R, 5, R * 0.4, col, 0.8, rr, 'round');
      g.strokeStyle = css(shade(col, -0.4), 0.7); g.lineWidth = Math.max(0.5, R * 0.06);
      for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + (i - 1) * 0.5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.5); g.stroke(); }
      disk(g, 0, 0, R * 0.14, '#f6e27a'); break;
    case 'pansy':
      g.fillStyle = css(shade(col, -0.1));
      for (const a of [-2.2, -0.95]) { g.beginPath(); g.ellipse(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45, R * 0.48, R * 0.4, a, 0, TAU); g.fill(); }
      g.fillStyle = css(col);
      for (const a of [2.6, 0.55, Math.PI / 2]) { g.beginPath(); g.ellipse(Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.38, R * 0.45, R * 0.38, a, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(40,20,50,0.75)'; g.beginPath(); g.ellipse(0, R * 0.12, R * 0.34, R * 0.26, 0, 0, TAU); g.fill();
      disk(g, 0, 0.02 * R, R * 0.1, c2); break;
    case 'poppy':
      g.fillStyle = css(shade(col, -0.18));
      for (const a of [-2.3, -0.8]) { g.beginPath(); g.ellipse(Math.cos(a) * R * 0.38, Math.sin(a) * R * 0.32, R * 0.62, R * 0.5, a, 0, TAU); g.fill(); }
      g.fillStyle = css(col);
      for (const a of [2.4, 0.7]) { g.beginPath(); g.ellipse(Math.cos(a) * R * 0.38, Math.sin(a) * R * 0.3, R * 0.6, R * 0.48, a, 0, TAU); g.fill(); }
      disk(g, 0, 0, R * 0.24, c2, 0.75); disk(g, 0, -R * 0.05, R * 0.12, '#6e8f4a', 0.75); break;
    case 'cup5':
      petalRing(g, R, 5, R * 0.46, col, 0.62, rr, 'round', 1);
      disk(g, 0, 0, R * 0.3, shade(col, -0.22), 0.62);
      g.fillStyle = css(c2); for (let i = 0; i < 9; i++) { const a = i * 0.7; g.fillRect(Math.cos(a) * R * 0.18, Math.sin(a) * R * 0.12, 1.2, 1.2); }
      break;
    case 'waterlily':
      petalRing(g, R, 10, R * 0.2, shade(col, -0.12), 0.42, rr, 'point');
      petalRing(g, R * 0.8, 10, R * 0.18, col, 0.48, rr + 0.3, 'point');
      g.translate(0, -R * 0.08);
      petalRing(g, R * 0.55, 8, R * 0.16, shade(col, 0.12), 0.55, rr + 0.6, 'point');
      disk(g, 0, 0, R * 0.18, c2, 0.5); break;
    case 'umbel': case 'cluster': case 'mophead': {
      const n = s === 'mophead' ? 34 : s === 'cluster' ? 14 : 26, fr = s === 'mophead' ? R * 0.2 : R * 0.22;
      disk(g, 0, 0, R * 0.92, shade(col, -0.3));
      for (let i = 0; i < n; i++) {
        const a = i * 2.39996 + rr, d = Math.sqrt((i + 0.5) / n) * R * 0.82;
        const fx = Math.cos(a) * d, fy = Math.sin(a) * d * 0.9;
        g.fillStyle = css(shade(col, (fy < 0 ? 0.14 : -0.08) + ((i * 7) % 5) * 0.02));
        if (s === 'umbel') { g.beginPath(); g.ellipse(fx, fy, fr * 0.6, fr * 0.9, a, 0, TAU); g.fill(); }
        else for (let k = 0; k < (s === 'mophead' ? 4 : 5); k++) {
          const b = k * TAU / (s === 'mophead' ? 4 : 5) + a;
          g.beginPath(); g.ellipse(fx + Math.cos(b) * fr * 0.45, fy + Math.sin(b) * fr * 0.45, fr * 0.42, fr * 0.32, b, 0, TAU); g.fill();
        }
      }
      break;
    }
    case 'tulip':
      g.fillStyle = css(shade(col, -0.2));
      g.beginPath(); g.moveTo(-R * 0.62, -R * 0.5); g.bezierCurveTo(-R * 0.7, R * 0.45, R * 0.7, R * 0.45, R * 0.62, -R * 0.5); g.lineTo(0, -R * 0.2); g.fill();
      g.fillStyle = css(col);
      g.beginPath(); g.moveTo(-R * 0.4, -R * 0.62); g.bezierCurveTo(-R * 0.62, R * 0.4, R * 0.5, R * 0.48, R * 0.38, -R * 0.66); g.quadraticCurveTo(0, -R * 0.35, -R * 0.4, -R * 0.62); g.fill();
      g.fillStyle = css(shade(col, 0.2), 0.6);
      g.beginPath(); g.ellipse(-R * 0.18, -R * 0.1, R * 0.08, R * 0.3, 0.2, 0, TAU); g.fill();
      break;
    case 'daffodil':
      petalRing(g, R, 6, R * 0.26, shade(col, 0.25), 0.85, rr, 'point');
      g.fillStyle = css(c2);
      g.beginPath(); g.ellipse(R * 0.08, R * 0.05, R * 0.3, R * 0.27, 0, 0, TAU); g.fill();
      g.fillStyle = css(shade(c2, -0.2)); g.beginPath(); g.ellipse(R * 0.16, R * 0.08, R * 0.2, R * 0.18, 0, 0, TAU); g.fill();
      break;
    case 'lily': case 'lilysmall': {
      petalRing(g, R, 6, R * (s === 'lily' ? 0.2 : 0.24), col, 0.85, rr, s === 'lily' ? 'point' : 'round', 1);
      g.strokeStyle = css(c2, 0.8); g.lineWidth = Math.max(0.5, R * 0.05);
      for (let i = 0; i < 6; i++) { const a = rr + i * TAU / 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.38); g.stroke(); }
      if (s === 'lily') {
        g.strokeStyle = '#d8c69a'; g.lineWidth = Math.max(0.5, R * 0.03);
        for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.3; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6); g.stroke(); disk(g, Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62, R * 0.05, '#8a3a1a'); }
      }
      break;
    }
    case 'iris':
      g.fillStyle = css(shade(col, -0.12));
      for (const a of [Math.PI * 0.5, Math.PI * 0.12, Math.PI * 0.88]) { g.beginPath(); g.ellipse(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.5, R * 0.3, R * 0.5, a - Math.PI / 2, 0, TAU); g.fill(); }
      g.fillStyle = css(shade(col, 0.1));
      for (const a of [-Math.PI * 0.5, -Math.PI * 0.2, -Math.PI * 0.8]) { g.beginPath(); g.ellipse(Math.cos(a) * R * 0.35, Math.sin(a) * R * 0.4, R * 0.22, R * 0.42, a - Math.PI / 2, 0, TAU); g.fill(); }
      g.fillStyle = css(c2); for (const a of [Math.PI * 0.5, Math.PI * 0.12, Math.PI * 0.88]) { g.beginPath(); g.ellipse(Math.cos(a) * R * 0.25, Math.sin(a) * R * 0.28, R * 0.06, R * 0.16, a - Math.PI / 2, 0, TAU); g.fill(); }
      break;
    case 'calla':
      g.fillStyle = css(shade(col, -0.08));
      g.beginPath(); g.moveTo(0, R * 0.7); g.bezierCurveTo(-R * 0.75, R * 0.1, -R * 0.55, -R * 0.75, R * 0.15, -R * 0.95); g.bezierCurveTo(R * 0.55, -R * 0.4, R * 0.45, R * 0.2, 0, R * 0.7); g.fill();
      g.fillStyle = css(shade(col, 0.1));
      g.beginPath(); g.moveTo(0, R * 0.6); g.bezierCurveTo(-R * 0.4, R * 0.1, -R * 0.3, -R * 0.5, R * 0.1, -R * 0.75); g.bezierCurveTo(R * 0.2, -R * 0.3, R * 0.2, R * 0.2, 0, R * 0.6); g.fill();
      g.strokeStyle = css(c2); g.lineWidth = Math.max(1, R * 0.14); g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, R * 0.4); g.lineTo(R * 0.02, -R * 0.2); g.stroke(); break;
    case 'anthurium':
      g.fillStyle = css(col);
      g.beginPath(); g.moveTo(0, -R * 0.1); g.bezierCurveTo(-R * 1.1, -R * 0.9, -R * 0.9, R * 0.6, 0, R * 0.9); g.bezierCurveTo(R * 0.9, R * 0.6, R * 1.1, -R * 0.9, 0, -R * 0.1); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.3)'; g.beginPath(); g.ellipse(-R * 0.35, R * 0.05, R * 0.15, R * 0.3, 0.4, 0, TAU); g.fill();
      g.strokeStyle = css(c2); g.lineWidth = Math.max(1, R * 0.13); g.lineCap = 'round';
      g.beginPath(); g.moveTo(0, -R * 0.05); g.quadraticCurveTo(R * 0.15, -R * 0.5, R * 0.05, -R * 0.85); g.stroke(); break;
    case 'orchid':
      g.fillStyle = css(shade(col, -0.05));
      for (const a of [-Math.PI / 2, Math.PI * 0.2, Math.PI * 0.8]) { g.beginPath(); g.ellipse(Math.cos(a) * R * 0.45, Math.sin(a) * R * 0.45, R * 0.18, R * 0.42, a + Math.PI / 2, 0, TAU); g.fill(); }
      g.fillStyle = css(col);
      for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(s2 * R * 0.42, -R * 0.05, R * 0.45, R * 0.4, 0, 0, TAU); g.fill(); }
      g.fillStyle = css(c2); g.beginPath(); g.ellipse(0, R * 0.28, R * 0.2, R * 0.24, 0, 0, TAU); g.fill();
      disk(g, 0, 0, R * 0.1, '#f7e08a'); break;
    case 'bird':
      g.fillStyle = '#4f7a5a';
      g.beginPath(); g.moveTo(-R * 0.9, R * 0.2); g.quadraticCurveTo(0, R * 0.45, R * 0.9, -R * 0.05); g.quadraticCurveTo(0, R * 0.1, -R * 0.9, R * 0.2); g.fill();
      g.fillStyle = '#8a4a6a'; g.beginPath(); g.moveTo(-R * 0.2, R * 0.18); g.quadraticCurveTo(R * 0.3, R * 0.25, R * 0.9, -R * 0.05); g.quadraticCurveTo(R * 0.3, R * 0.12, -R * 0.2, R * 0.18); g.fill();
      for (let i = 0; i < 3; i++) {
        g.fillStyle = css(shade(col, i * 0.06));
        g.beginPath(); g.moveTo(-R * 0.1 + i * R * 0.1, R * 0.1); g.lineTo(-R * 0.35 + i * R * 0.18, -R * 0.85 + i * R * 0.05); g.lineTo(-R * 0.02 + i * R * 0.12, -R * 0.75); g.closePath(); g.fill();
      }
      g.fillStyle = css(c2); g.beginPath(); g.moveTo(0, R * 0.1); g.lineTo(R * 0.25, -R * 0.65); g.lineTo(R * 0.12, R * 0.05); g.fill();
      break;
    case 'tulipTree':
      g.fillStyle = css(shade(col, -0.1));
      g.beginPath(); g.moveTo(-R * 0.5, -R * 0.4); g.bezierCurveTo(-R * 0.55, R * 0.4, R * 0.55, R * 0.4, R * 0.5, -R * 0.4); g.lineTo(0, -R * 0.1); g.fill();
      g.fillStyle = css(col);
      g.beginPath(); g.moveTo(-R * 0.3, -R * 0.55); g.bezierCurveTo(-R * 0.45, R * 0.3, R * 0.35, R * 0.35, R * 0.28, -R * 0.55); g.quadraticCurveTo(0, -R * 0.3, -R * 0.3, -R * 0.55); g.fill();
      g.fillStyle = css(c2, 0.55); g.beginPath(); g.ellipse(0, R * 0.2, R * 0.32, R * 0.14, 0, 0, TAU); g.fill();
      break;
    case 'lotus':
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.42, l = R * (1 - Math.abs(i - 3) * 0.08);
        g.save(); g.rotate(a + Math.PI / 2); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-l * 0.45, -l * 0.3, -l * 0.3, -l * 0.9, 0, -l); g.bezierCurveTo(l * 0.3, -l * 0.9, l * 0.45, -l * 0.3, 0, 0);
        g.fillStyle = css(shade(col, Math.abs(i - 3) * -0.05 + 0.08)); g.fill();
        g.strokeStyle = css(shade(col, -0.2), 0.5); g.lineWidth = 0.6; g.stroke(); g.restore();
      }
      disk(g, 0, -R * 0.3, R * 0.22, c2, 0.6); break;
    case 'pea':
      g.fillStyle = css(col); g.beginPath(); g.ellipse(0, -R * 0.2, R * 0.6, R * 0.55, 0, 0, TAU); g.fill();
      g.fillStyle = css(shade(col, -0.15)); for (const s2 of [-1, 1]) { g.beginPath(); g.ellipse(s2 * R * 0.25, R * 0.25, R * 0.3, R * 0.25, s2 * 0.5, 0, TAU); g.fill(); }
      break;
    case 'fuchsia':
      g.fillStyle = css(col);
      for (const a of [-0.9, -0.3, 0.3, 0.9]) { g.save(); g.rotate(a); g.beginPath(); g.moveTo(-R * 0.1, 0); g.quadraticCurveTo(0, R * 0.9, R * 0.06, R * 1.0); g.quadraticCurveTo(R * 0.12, R * 0.4, R * 0.1, 0); g.fill(); g.restore(); }
      g.fillStyle = css(c2); g.beginPath(); g.ellipse(0, R * 0.45, R * 0.24, R * 0.32, 0, 0, TAU); g.fill();
      g.strokeStyle = css(col); g.lineWidth = 0.6; g.beginPath(); g.moveTo(0, R * 0.6); g.lineTo(0, R * 1.2); g.stroke(); break;
    case 'copihue':
      g.fillStyle = css(shade(col, -0.15));
      g.beginPath(); g.moveTo(-R * 0.32, -R * 0.6); g.bezierCurveTo(-R * 0.5, R * 0.3, -R * 0.42, R * 0.95, 0, R * 1.0); g.bezierCurveTo(R * 0.42, R * 0.95, R * 0.5, R * 0.3, R * 0.32, -R * 0.6); g.fill();
      g.fillStyle = css(col);
      g.beginPath(); g.moveTo(-R * 0.18, -R * 0.62); g.bezierCurveTo(-R * 0.32, R * 0.3, -R * 0.2, R * 0.9, R * 0.05, R * 0.95); g.bezierCurveTo(R * 0.25, R * 0.6, R * 0.3, R * 0.2, R * 0.18, -R * 0.62); g.fill();
      g.fillStyle = css(shade(col, 0.4), 0.6); for (let i = 0; i < 6; i++) g.fillRect(-R * 0.15 + (i % 2) * R * 0.18, -R * 0.2 + i * R * 0.15, 1.2, 1.2);
      break;
    case 'bract':
      for (let k = 0; k < 3; k++) {
        const a = rr + k * TAU / 3;
        g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(R * 0.2, -R * 0.75, R * 0.95, -R * 0.45, R * 0.9, 0); g.bezierCurveTo(R * 0.95, R * 0.45, R * 0.2, R * 0.75, 0, 0);
        g.fillStyle = css(shade(col, -0.08 + k * 0.08)); g.fill(); g.restore();
      }
      disk(g, 0, 0, R * 0.12, '#fffbe8'); break;
    case 'dots':
      g.fillStyle = css(col); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc((i - 1) * R * 0.7, (i % 2) * R * 0.4, R * 0.55, 0, TAU); g.fill(); }
      break;
    default: disk(g, 0, 0, R * 0.6, col);
  }
  g.restore();
}

// Espiga de florecitas (lavanda, salvia, albahaca)
function spike(g, x, y, len, w, col, open) {
  w *= 1.3;
  const n = Math.max(3, Math.round(len / Math.max(1.2, w * 0.9)));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), py = y - len * t, sw = w * (1 - t * 0.55);
    const on = open > 0.35 ? 1 : 0.3;
    g.fillStyle = css(on ? shade(col, -0.12 + t * 0.25) : mix(col, [110, 140, 90], 0.6));
    g.beginPath(); g.ellipse(x - sw * 0.35, py, sw * 0.5, sw * 0.42, -0.4, 0, TAU); g.fill();
    g.beginPath(); g.ellipse(x + sw * 0.35, py - sw * 0.3, sw * 0.5, sw * 0.42, 0.4, 0, TAU); g.fill();
  }
}
// Racimo colgante (glicina)
function raceme(g, x, y, len, w, col) {
  const n = Math.max(4, Math.round(len / (w * 0.7)));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), sw = w * (1 - t * 0.7);
    g.fillStyle = css(shade(col, 0.12 - t * 0.3));
    g.beginPath(); g.ellipse(x + Math.sin(i * 1.7) * sw * 0.4, y + len * t, sw * 0.55, sw * 0.4, 0, 0, TAU); g.fill();
  }
}
// Campanitas colgando de una vara (dedalera, hosta, arándano)
function bells(g, x, y, len, n, R, col, open, lean) {
  R *= 1.5;
  g.strokeStyle = css(shade(col, -0.4), 0.7); g.lineWidth = Math.max(0.6, R * 0.12);
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * 0.5, y - len * 0.5, x + lean, y - len); g.stroke();
  for (let i = 0; i < n; i++) {
    const t = 0.15 + 0.85 * i / n, bx = x + lean * t * t, by = y - len * t, r = R * (1 - t * 0.45);
    if (open < 0.35 || t > 0.85) { disk(g, bx + r * 0.4, by, r * 0.35, mix(col, [110, 140, 90], 0.5)); continue; }
    g.fillStyle = css(shade(col, (i % 2) * 0.06));
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + r * 1.4, by - r * 0.2, bx + r * 1.1, by + r * 1.0);
    g.quadraticCurveTo(bx + r * 0.5, by + r * 1.25, bx - r * 0.1, by + r * 0.85); g.closePath(); g.fill();
    g.fillStyle = css(shade(col, -0.35), 0.6); g.beginPath(); g.ellipse(bx + r * 0.55, by + r * 0.95, r * 0.4, r * 0.18, -0.3, 0, TAU); g.fill();
  }
}

// ---------- Frutos ----------
function fruit(g, x, y, R, s, col, ripe) {
  const c = ripe >= 1 ? rgbOf(col) : mix([110, 150, 60], col, clamp(ripe, 0, 1) ** 2 * 0.7);
  switch (s) {
    case 'round': case 'berry': case 'citrus': case 'olive': case 'nut':
      g.beginPath();
      if (s === 'citrus') g.ellipse(x, y, R * 0.85, R, 0.3, 0, TAU); else g.arc(x, y, R, 0, TAU);
      g.fillStyle = css(c); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.38)'; g.beginPath(); g.arc(x - R * 0.35, y - R * 0.35, R * 0.32, 0, TAU); g.fill();
      if (s === 'round') { g.fillStyle = '#3f6f2a'; g.beginPath(); g.arc(x, y - R * 0.85, R * 0.3, 0, TAU); g.fill(); }
      break;
    case 'long':
      g.fillStyle = css(c);
      g.beginPath(); g.moveTo(x - R * 0.5, y); g.quadraticCurveTo(x - R * 0.7, y + R * 2.2, x + R * 0.3, y + R * 3.2); g.quadraticCurveTo(x + R * 0.4, y + R * 1.6, x + R * 0.5, y); g.closePath(); g.fill();
      g.fillStyle = '#3f6f2a'; g.fillRect(x - R * 0.4, y - R * 0.5, R * 0.8, R * 0.6); break;
    case 'strawberry':
      g.fillStyle = css(c);
      g.beginPath(); g.moveTo(x - R, y - R * 0.3); g.quadraticCurveTo(x - R * 0.8, y + R * 1.1, x, y + R * 1.4); g.quadraticCurveTo(x + R * 0.8, y + R * 1.1, x + R, y - R * 0.3); g.closePath(); g.fill();
      g.fillStyle = 'rgba(255,230,120,0.85)'; for (let i = 0; i < 5; i++) g.fillRect(x - R * 0.5 + (i % 3) * R * 0.45, y + (i < 3 ? 0 : R * 0.6), 1, 1);
      g.fillStyle = '#3f8a2a'; g.beginPath(); g.ellipse(x, y - R * 0.35, R * 0.9, R * 0.3, 0, 0, TAU); g.fill(); break;
    case 'pumpkin':
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.ellipse(x + i * R * 0.32, y, R * 0.42, R * 0.72, 0, 0, TAU); g.fillStyle = css(shade(c, -Math.abs(i) * 0.08 + (i === 0 ? 0.06 : 0))); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.18)'; g.beginPath(); g.ellipse(x - R * 0.3, y - R * 0.3, R * 0.3, R * 0.2, -0.4, 0, TAU); g.fill();
      g.strokeStyle = '#5a6a2a'; g.lineWidth = Math.max(1, R * 0.12); g.beginPath(); g.moveTo(x, y - R * 0.65); g.lineTo(x + R * 0.12, y - R * 0.95); g.stroke(); break;
    default: disk(g, x, y, R, c);
  }
}

// ---------- Formas ----------
const FORMS = {};

// Plántula: dos hojitas
function seedling(g, S, vs, sp) {
  const h = S * (0.04 + vs.g * 0.4), c = vs.lc;
  g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.8, S * 0.008);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -h); g.stroke();
  if (sp.type === 'bulb' || sp.art.f === 'strap') {
    for (const a of [-0.25, 0.2]) leaf(g, 0, 0, -Math.PI / 2 + a, h * 1.3, S * 0.012, c, 'lance');
    return;
  }
  leaf(g, 0, -h, -0.35, S * 0.05, S * 0.02, c, 'oval');
  leaf(g, 0, -h, Math.PI + 0.35, S * 0.05, S * 0.02, shade(c, -0.08), 'oval');
}

// Planta en reposo: una estaca de jardinero y unos tallos secos
function dormantStub(g, S, vs, sp) {
  g.fillStyle = 'rgba(80,58,38,0.55)'; g.beginPath(); g.ellipse(0, 0, S * 0.12, S * 0.05, 0, 0, TAU); g.fill();
  if (sp.type !== 'bulb' && sp.type !== 'aquatic') {
    g.strokeStyle = css(C_DEAD); g.lineWidth = Math.max(0.8, S * 0.008); g.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.3; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * S * 0.12, Math.sin(a) * S * 0.12); g.stroke(); }
  }
  // etiqueta
  g.fillStyle = '#d9c9a3'; g.fillRect(S * 0.06, -S * 0.2, S * 0.012, S * 0.2);
  g.fillStyle = '#f4ecd8'; g.fillRect(S * 0.035, -S * 0.24, S * 0.07, S * 0.06);
  g.strokeStyle = 'rgba(80,60,40,0.5)'; g.lineWidth = 0.6; g.strokeRect(S * 0.035, -S * 0.24, S * 0.07, S * 0.06);
}

FORMS.stem = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.18 + 0.82 * vs.g, droop = vs.wilt * 0.9 + (vs.dead ? 0.8 : 0);
  const lwk = a.lf === 'lance' || a.lf === 'grass' ? 0.2 : a.lf === 'heart' ? 0.46 : a.lf === 'feather' ? 0.35 : 0.36;
  const stems = [];
  for (let i = 0; i < a.st; i++) {
    stems.push({ bx: (r() - 0.5) * a.w * S * 0.25, tx: (a.st > 1 ? (i / (a.st - 1) - 0.5) : 0) * a.w * S * 0.75 + (r() - 0.5) * a.w * S * 0.2,
      h: a.h * S * (0.78 + 0.22 * r()), lr: Array.from({ length: 16 }, r), fr: Array.from({ length: 8 }, r) });
  }
  const basal = Array.from({ length: 7 }, () => [r(), r(), r()]);
  // tutor de caña para los tomates
  if (a.stake && vs.g > 0.25) {
    g.strokeStyle = '#b89a62'; g.lineWidth = Math.max(1, S * 0.014); g.lineCap = 'round';
    g.beginPath(); g.moveTo(S * 0.03, S * 0.01); g.lineTo(S * 0.02, -a.h * S * 1.02); g.stroke();
  }
  // hojas basales: dan cuerpo a la planta
  if (!a.nobasal) {
    const nb = Math.round((3 + a.st) * (0.5 + 0.5 * vs.g));
    basal.slice(0, Math.min(7, nb)).forEach(([u, v, w], i) => {
      const side = i % 2 ? 1 : -1, ang = -Math.PI / 2 + side * (0.7 + u * 0.7) + side * droop * 0.5;
      const L = a.ls * S * 1.45 * (0.6 + 0.4 * sz) * (0.8 + v * 0.4);
      leaf(g, (w - 0.5) * S * 0.04, 0, ang, L, L * lwk, shade(vs.lc, -0.16 + w * 0.08), a.lf);
    });
  }
  const fl = a.fl, showFl = fl && vs.bloom > 0.05 && !vs.dead;
  for (const s of stems) {
    const h = s.h * sz * (1 - droop * 0.18), tx = s.tx * sz + droop * s.tx * 0.6, cx = s.bx + (tx - s.bx) * 0.15;
    const pt = t => [lerp(lerp(s.bx, cx, t), lerp(cx, tx, t), t), lerp(lerp(0, -h * 0.6, t), lerp(-h * 0.6, -h, t), t)];
    g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.9, S * 0.012 * Math.sqrt(a.h) * (0.5 + 0.5 * sz)); g.lineCap = 'round';
    g.beginPath(); g.moveTo(s.bx, 0); g.quadraticCurveTo(cx, -h * 0.6, tx, -h); g.stroke();
    const n = Math.max(2, Math.round(a.ld * (0.5 + 0.5 * vs.g)));
    for (let i = 0; i < n; i++) {
      const t = 0.1 + 0.8 * i / n, [x, y] = pt(t), side = i % 2 ? 1 : -1;
      const ang = -Math.PI / 2 + side * (0.85 + s.lr[i % 16] * 0.45) + side * droop * 0.7;
      const L = a.ls * S * 1.45 * (0.55 + 0.45 * sz) * (1.1 - t * 0.45) * (0.85 + s.lr[(i + 5) % 16] * 0.3);
      leaf(g, x, y, ang, L, L * lwk, shade(vs.lc, -0.12 + t * 0.2 + s.lr[(i + 9) % 16] * 0.06), a.lf);
    }
    if (a.fr && vs.fruit > 0.15 && !vs.dead) {
      const nf = Math.ceil(a.fr.n * Math.min(1, vs.fruit * 1.2) / Math.max(1, a.st * 0.7));
      for (let i = 0; i < nf; i++) { const [x, y] = pt(0.3 + 0.45 * s.fr[i % 8]); fruit(g, x + (s.fr[(i + 3) % 8] - 0.5) * S * 0.12, y + S * 0.04, a.fr.r * S * 1.15 * (0.7 + 0.3 * vs.fruit), a.fr.s, a.fr.c, vs.fruit); }
    }
    if (showFl) {
      const R = fl.r * S * 1.15;
      if (fl.s === 'spike') spike(g, tx, -h + S * 0.01, (fl.len || 0.1) * S, R * 1.6, vs.fc, vs.bloom);
      else if (fl.s === 'umbel') flower(g, tx, -h - R * 0.4, R, 'umbel', vs.fc, vs.fc2, vs.bloom, s.lr[0] * 6);
      else {
        const nf = Math.max(1, Math.round(fl.n * (fl.n > 1 ? 0.5 + 0.5 * vs.bloom : 1)));
        for (let i = 0; i < nf; i++) {
          let x = tx, y = -h;
          if (i > 0) {
            const [px, py] = pt(0.8 - i * 0.08);
            x = px + (i % 2 ? 1 : -1) * R * (a.st > 1 ? 1.2 : 1.6); y = py - R * 0.5;
            g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.6, S * 0.006); g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
          }
          flower(g, x, y, R * (i ? 0.85 : 1), fl.s, vs.fc, vs.fc2, vs.bloom, s.lr[i % 16] * 6);
        }
      }
    }
  }
};

FORMS.bush = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.18 + 0.82 * vs.g, W = a.w * S * sz, H = a.h * S * sz * (1 - vs.wilt * 0.12);
  const bare = vs.dorm && sp.life === 'deciduous', needle = a.lf === 'needle';
  // ramas
  const branches = [];
  for (let i = 0; i < 7; i++) branches.push([(i / 6 - 0.5) * 1.6 + (r() - 0.5) * 0.3, 0.6 + r() * 0.4]);
  g.strokeStyle = css(shade(vs.stem, -0.1)); g.lineCap = 'round';
  for (const [ang, l] of branches) {
    g.lineWidth = Math.max(0.8, S * 0.014 * sz);
    const ex = Math.sin(ang) * W * 0.45 * l, ey = -H * (a.up ? 0.95 : 0.8) * l * Math.cos(ang * 0.6);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(ex * 0.2, ey * 0.6, ex, ey); g.stroke();
    if (bare) { g.lineWidth = Math.max(0.5, S * 0.006); g.beginPath(); g.moveTo(ex * 0.7, ey * 0.7); g.lineTo(ex * 0.95 + W * 0.08, ey * 0.95 - H * 0.08); g.moveTo(ex * 0.8, ey * 0.8); g.lineTo(ex * 0.7 - W * 0.06, ey * 1.05); g.stroke(); }
  }
  // follaje: tantas hojas como hagan falta para cubrir la cúpula
  const cy = -H * (a.low ? 0.4 : 0.5), rx = W / 2, ry = H * (a.low ? 0.42 : 0.5);
  const L = a.ls * S * 1.5 * (0.55 + 0.45 * sz), lw = L * (needle ? 0.07 : a.lf === 'lance' ? 0.2 : a.lf === 'feather' ? 0.3 : 0.38);
  const MAX = 420, pts = [];
  for (let i = 0; i < MAX; i++) {
    const ang = r() * TAU, d = Math.sqrt(r()), k = r(), j = r();
    const x = Math.cos(ang) * d * rx, y = cy + Math.sin(ang) * d * ry * 0.95;
    pts.push({ x, y: Math.min(y, -S * 0.015), a: Math.atan2(y - cy * 0.2, x * 1.3) + (k - 0.5) * 0.9, k, j, d });
  }
  const need = Math.PI * rx * ry / Math.max(4, L * (needle ? L * 0.35 : lw * 2)) * (needle ? 2.4 : 1.6);
  const N = Math.round(clamp(need, 14, MAX) * (0.55 + 0.45 * vs.g));
  if (!bare) {
    g.fillStyle = css(shade(vs.lc, -0.3)); g.beginPath(); g.ellipse(0, cy + ry * 0.1, rx * 0.8, ry * 0.78, 0, 0, TAU); g.fill();
    pts.slice(0, N).sort((p, q) => p.y - q.y).forEach(p => {
      const light = (cy - p.y) / ry * 0.2 - p.x / rx * 0.07 + p.j * 0.1 - 0.08;
      const col = shade(vs.lc, light);
      if (needle) {
        const ang = p.a - Math.PI * 0.1 * Math.sign(p.x);
        g.strokeStyle = css(col); g.lineWidth = Math.max(0.7, S * 0.009); g.lineCap = 'round';
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + Math.cos(ang) * L * (0.6 + p.k * 0.6), p.y + Math.sin(ang) * L * (0.6 + p.k * 0.6) - L * 0.3); g.stroke();
      } else leaf(g, p.x, p.y, p.a + vs.wilt * 0.8 * Math.sign(Math.cos(p.a)), L * (0.75 + p.k * 0.5), lw * (0.75 + p.k * 0.5), col, a.lf);
    });
  }
  // flores y frutos en la superficie
  const fl = a.fl;
  if (fl && vs.bloom > 0.05 && !vs.dead && !bare) {
    const n = Math.round(fl.n * (0.35 + 0.65 * vs.bloom) * (0.5 + 0.5 * vs.g)), R = fl.r * S * 1.15;
    const fls = [];
    for (let i = 0; i < fl.n; i++) {
      const ang = -Math.PI * (0.06 + 0.88 * r()), d = 0.62 + r() * 0.38;
      fls.push({ x: Math.cos(ang) * rx * d, y: cy + Math.sin(ang) * ry * d * 0.9 + ry * 0.12 * r(), rr: r(), lean: (r() - 0.5) });
    }
    fls.slice(0, n).sort((p, q) => p.y - q.y).forEach(({ x, y, rr, lean }) => {
      if (fl.sh) {
        const top = y - fl.sh * S * sz * (0.8 + rr * 0.35), tx = x + lean * S * 0.1;
        g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.5, S * 0.005); g.beginPath(); g.moveTo(x * 0.85, y + ry * 0.25); g.lineTo(tx, top); g.stroke();
        if (fl.s === 'spike') spike(g, tx, top + (fl.len || 0.08) * S * 0.2, (fl.len || 0.08) * S, R * 1.4, vs.fc, vs.bloom);
        else flower(g, tx, top, R, fl.s, vs.fc, vs.fc2, vs.bloom, rr * 6);
      } else if (fl.s === 'spike') spike(g, x, y, (fl.len || 0.06) * S, R * 1.5, vs.fc, vs.bloom);
      else if (fl.s === 'bells') bells(g, x, y + R, R * 3, 3, R, vs.fc, vs.bloom, R);
      else if (fl.s === 'fuchsia') { g.strokeStyle = css(vs.stem); g.lineWidth = 0.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + R * 0.3, y + R * 0.8); g.stroke(); flower(g, x + R * 0.3, y + R * 0.9, R, 'fuchsia', vs.fc, vs.fc2, vs.bloom, rr); }
      else flower(g, x, y, R, fl.s, vs.fc, vs.fc2, vs.bloom, rr * 6);
    });
  }
  if (a.fr && vs.fruit > 0.15 && !vs.dead && !bare) {
    for (let i = 0; i < a.fr.n * vs.fruit; i++) {
      const ang = -Math.PI * (0.1 + 0.8 * r()), d = 0.55 + r() * 0.4;
      fruit(g, Math.cos(ang) * rx * d, cy + Math.sin(ang) * ry * d + ry * 0.2, a.fr.r * S * 1.2, a.fr.s, a.fr.c, vs.fruit);
    }
  }
};

FORMS.topiary = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.25 + 0.75 * vs.g, R = a.w * S * sz / 2;
  g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(1, S * 0.02); g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -R * 0.4); g.stroke();
  const grd = g.createRadialGradient(-R * 0.35, -R * 1.45, R * 0.1, 0, -R, R * 1.1);
  grd.addColorStop(0, css(shade(vs.lc, 0.28))); grd.addColorStop(0.6, css(vs.lc)); grd.addColorStop(1, css(shade(vs.lc, -0.4)));
  g.fillStyle = grd; g.beginPath(); g.arc(0, -R, R, 0, TAU); g.fill();
  for (let i = 0; i < 90; i++) {
    const ang = r() * TAU, d = Math.sqrt(r()) * R * 0.95, x = Math.cos(ang) * d, y = -R + Math.sin(ang) * d;
    g.fillStyle = css(shade(vs.lc, (y < -R ? 0.2 : -0.15) + (r() - 0.5) * 0.2), 0.7);
    g.fillRect(x, y, Math.max(1, S * 0.015), Math.max(1, S * 0.012));
  }
};

FORMS.rosette = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.2 + 0.8 * vs.g, L0 = a.ls * S * sz;
  const leaves = [];
  const succ = a.lf === 'succ', erect = ['lance', 'monstera', 'calathea', 'heartbig', 'aloe', 'agave'].includes(a.lf);
  for (let i = 0; i < a.n; i++) {
    const th = i * 2.39996 + r() * 0.3, ring = succ ? i / a.n : 0;
    leaves.push({ th, ring, k: r(), j: r() });
  }
  const clusters = a.cluster ? [[-L0 * 1.3, -L0 * 0.25, 0.65], [L0 * 1.4, -L0 * 0.2, 0.6], [0, 0, 1], [L0 * 0.5, L0 * 0.55, 0.5]] : [[0, 0, 1]];
  for (const [ox, oy, cs] of clusters) {
    const n = Math.round(a.n * (0.4 + 0.6 * vs.g));
    leaves.slice(0, n).map(l => ({ ...l, dy: Math.sin(l.th) })).sort((p, q) => p.dy - q.dy).forEach(l => {
      let L = L0 * cs * (succ ? 1 - l.ring * 0.7 : 0.75 + l.k * 0.35);
      const lift = succ ? 0.25 + l.ring * 0.9 : erect ? 0.75 + l.k * 0.25 : 0.45 + l.k * 0.3;
      const droop = vs.wilt * 0.6 + (vs.dead ? 0.5 : 0);
      const dx = Math.cos(l.th), dy = Math.sin(l.th) * 0.5;
      const up = Math.max(0.1, lift - droop);
      const tipx = dx * L * (1 - up * 0.35), tipy = dy * L - L * up * (a.lf === 'monstera' ? 0.9 : 0.6);
      const base = succ ? [ox, oy - S * 0.01 * (1 - l.ring)] : [ox, oy];
      const ang = Math.atan2(tipy, tipx), len = Math.hypot(tipx, tipy);
      if (a.lf === 'monstera' || a.lf === 'heartbig' || a.lf === 'paddle' || a.lf === 'calathea') {
        // pecíolo largo y hoja grande al final
        const px = base[0] + tipx * 0.55, py = base[1] + tipy * 0.55;
        g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.8, S * 0.012); g.beginPath(); g.moveTo(base[0], base[1]); g.quadraticCurveTo(base[0] + tipx * 0.2, base[1] + tipy * 0.6, px, py); g.stroke();
        leaf(g, px, py, ang + (dx > 0 ? 0.5 : -0.5), len * 0.75, len * 0.38, shade(vs.lc, (dy < 0 ? -0.12 : 0.04) + l.j * 0.06), a.lf);
      } else {
        const w = a.lf === 'succ' ? L * 0.42 : a.lf === 'aloe' || a.lf === 'agave' ? L * 0.13 : a.lf === 'frilly' ? L * 0.5 : a.lf === 'hosta' ? L * 0.42 : a.lf === 'trap' ? L * 0.3 : L * 0.3;
        leaf(g, base[0], base[1], ang, len, w, shade(vs.lc, (dy < 0 ? -0.12 : 0.05) + l.j * 0.06 + (succ ? l.ring * 0.15 : 0)), a.lf, { edge: a.edge, tip: a.tip });
      }
    });
  }
  const fl = a.fl;
  if (fl && vs.bloom > 0.05 && !vs.dead) {
    const R = fl.r * S, n = fl.s === 'bells' || fl.s === 'orchid' ? 1 : Math.max(1, Math.round(fl.n * (0.4 + 0.6 * vs.bloom)));
    for (let i = 0; i < n; i++) {
      const th = r() * TAU, d = r() * 0.4, bx = Math.cos(th) * L0 * d * 0.5, sh = (fl.sh || 0.1) * S * (0.8 + 0.2 * r()) * (0.6 + 0.4 * sz), lean = (r() - 0.5) * S * 0.12;
      if (fl.s === 'bells') { bells(g, bx, 0, sh, fl.n, R, vs.fc, vs.bloom, lean); continue; }
      if (fl.s === 'torch') { g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.6, S * 0.008); g.beginPath(); g.moveTo(bx, 0); g.lineTo(bx, -sh); g.stroke(); spike(g, bx, -sh * 0.85, sh * 0.3, R * 1.4, vs.fc, vs.bloom); continue; }
      g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.6, S * 0.007);
      if (fl.s === 'orchid') {
        g.beginPath(); g.moveTo(bx, 0); g.quadraticCurveTo(bx, -sh * 1.1, bx + sh * 0.5, -sh * 0.9); g.stroke();
        for (let k = 0; k < fl.n; k++) {
          const t = 0.45 + 0.55 * k / fl.n, fx = lerp(bx, bx + sh * 0.5, t * t), fy = lerp(-sh * 0.5, -sh * 0.9, t) - Math.sin(t * Math.PI) * sh * 0.25;
          flower(g, fx, fy + R * 0.4, R * (1 - k * 0.06), 'orchid', vs.fc, vs.fc2, vs.bloom - k * 0.08, k);
        }
        continue;
      }
      g.beginPath(); g.moveTo(bx, 0); g.quadraticCurveTo(bx + lean * 0.3, -sh * 0.6, bx + lean, -sh); g.stroke();
      flower(g, bx + lean, -sh, R, fl.s, vs.fc, vs.fc2, vs.bloom, th);
    }
  }
  if (a.fr && vs.fruit > 0.15 && !vs.dead) {
    for (let i = 0; i < a.fr.n * vs.fruit; i++) { const th = r() * TAU; fruit(g, Math.cos(th) * L0 * 0.7, Math.sin(th) * L0 * 0.32 + S * 0.01, a.fr.r * S, a.fr.s, a.fr.c, vs.fruit); }
  }
};

FORMS.strap = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.2 + 0.8 * vs.g, H = a.h * S * sz, droop = vs.wilt * 0.7 + (vs.dead ? 0.6 : 0);
  const n = Math.round(a.n * (0.5 + 0.5 * vs.g));
  const ls = [];
  for (let i = 0; i < a.n; i++) ls.push({ a: (i / Math.max(1, a.n - 1) - 0.5) * (a.wide ? 1.4 : 1.9) + (r() - 0.5) * 0.3, k: r(), j: r(), b: (r() - 0.5) * S * 0.05 });
  ls.slice(0, n).sort((p, q) => Math.abs(q.a) - Math.abs(p.a)).forEach(l => {
    const len = H * (0.75 + l.k * 0.35), ang = l.a * (1 + droop), w = a.wide ? len * 0.17 : a.lf === 'arrow' || a.lf === 'paddle' ? len * 0.05 : len * 0.06;
    const tx = Math.sin(ang) * len * 0.75, ty = -Math.cos(ang) * len * (1 - droop * 0.4);
    if (a.lf === 'arrow' || a.lf === 'paddle') {
      g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.8, S * 0.01);
      g.beginPath(); g.moveTo(l.b, 0); g.quadraticCurveTo(l.b + tx * 0.2, ty * 0.5, l.b + tx * 0.6, ty * 0.6); g.stroke();
      leaf(g, l.b + tx * 0.6, ty * 0.6, Math.atan2(ty, tx) + (tx > 0 ? 0.2 : -0.2), len * 0.5, len * (a.lf === 'arrow' ? 0.2 : 0.12), shade(vs.lc, l.j * 0.08 - 0.05), a.lf === 'arrow' ? 'arrow' : 'oval');
      return;
    }
    g.fillStyle = css(shade(vs.lc, (Math.abs(ang) > 0.5 ? -0.1 : 0.04) + l.j * 0.06));
    g.beginPath(); g.moveTo(l.b - w, 0);
    g.quadraticCurveTo(l.b + tx * 0.15 - w * 0.6, ty * 0.6, l.b + tx, ty);
    g.quadraticCurveTo(l.b + tx * 0.15 + w * 0.6, ty * 0.6, l.b + w, 0); g.closePath(); g.fill();
    g.strokeStyle = css(shade(vs.lc, 0.2), 0.4); g.lineWidth = Math.max(0.4, w * 0.2);
    g.beginPath(); g.moveTo(l.b, 0); g.quadraticCurveTo(l.b + tx * 0.15, ty * 0.6, l.b + tx, ty); g.stroke();
  });
  const fl = a.fl;
  if (fl && vs.bloom > 0.05 && !vs.dead) {
    const R = fl.r * S, nf = Math.max(1, Math.round(fl.n * (0.5 + 0.5 * vs.bloom)));
    for (let i = 0; i < fl.n; i++) {
      const lean = (r() - 0.5) * S * 0.2 * (fl.n > 1 ? 1 : 0.3), sh = fl.sh * S * sz * (0.85 + 0.15 * r()), rr = r();
      if (i >= nf) continue;
      g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.7, S * 0.009);
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(lean * 0.2, -sh * 0.6, lean, -sh); g.stroke();
      flower(g, lean, -sh, R, fl.s, vs.fc, vs.fc2, vs.bloom, rr * 6);
    }
  }
};

FORMS.fern = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.2 + 0.8 * vs.g, L0 = a.h * S * 1.15 * sz, droop = vs.wilt * 0.5 + (vs.dead ? 0.5 : 0);
  const fr = [];
  for (let i = 0; i < a.n; i++) fr.push({ th: -Math.PI / 2 + (i / (a.n - 1) - 0.5) * 2.6 + (r() - 0.5) * 0.25, k: r(), front: r() });
  fr.sort((p, q) => p.front - q.front).forEach(f => {
    const L = L0 * (0.75 + f.k * 0.3), dx = Math.cos(f.th), dy = Math.sin(f.th);
    const tip = [dx * L * 0.85, -L * (0.55 - droop * 0.4) + dy * 0.1 + f.front * S * 0.05];
    const ctrl = [dx * L * 0.3, -L * (0.9 - droop * 0.3)];
    const col = shade(vs.lc, -0.1 + f.front * 0.18);
    g.strokeStyle = css(shade(col, -0.25)); g.lineWidth = Math.max(0.6, S * 0.008);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(ctrl[0], ctrl[1], tip[0], tip[1]); g.stroke();
    const np = 13;
    for (let i = 1; i < np; i++) {
      const t = i / np, x = lerp(lerp(0, ctrl[0], t), lerp(ctrl[0], tip[0], t), t), y = lerp(lerp(0, ctrl[1], t), lerp(ctrl[1], tip[1], t), t);
      const tx = lerp(ctrl[0], tip[0], t) - lerp(0, ctrl[0], t), ty = lerp(ctrl[1], tip[1], t) - lerp(0, ctrl[1], t), ang = Math.atan2(ty, tx);
      const pl = L * 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * 0.3);
      for (const s of [-1, 1]) leaf(g, x, y, ang + s * 1.15, pl, pl * 0.22, shade(col, s * 0.05), 'lance');
    }
  });
};

FORMS.grass = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.2 + 0.8 * vs.g, H = a.h * S * sz;
  g.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const ang = (r() - 0.5) * 1.5, len = H * (0.6 + r() * 0.5), tx = Math.sin(ang) * len * 0.8, ty = -Math.cos(ang) * len * 0.85;
    g.strokeStyle = css(shade(vs.lc, (r() - 0.5) * 0.3)); g.lineWidth = Math.max(0.5, S * 0.005);
    g.beginPath(); g.moveTo((r() - 0.5) * S * 0.06, 0); g.quadraticCurveTo(tx * 0.2, ty * 0.8, tx, ty); g.stroke();
    if (vs.bloom > 0.1 && i % 2 === 0) {
      g.strokeStyle = css(a.fl.c, 0.75 * vs.bloom); g.lineWidth = Math.max(0.8, S * 0.012);
      g.beginPath(); g.moveTo(tx * 0.85, ty * 0.85); g.quadraticCurveTo(tx * 1.05, ty * 1.0, tx * 1.2 + S * 0.05, ty * 0.9); g.stroke();
    }
  }
};

FORMS.cactus = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.25 + 0.75 * vs.g, col = vs.lc;
  if (a.k === 'barrel') {
    const R = a.w * S * sz / 2, H = a.h * S * sz;
    const grd = g.createRadialGradient(-R * 0.4, -H * 0.75, R * 0.1, 0, -H * 0.45, R * 1.2);
    grd.addColorStop(0, css(shade(col, 0.25))); grd.addColorStop(0.7, css(col)); grd.addColorStop(1, css(shade(col, -0.35)));
    g.fillStyle = grd; g.beginPath(); g.ellipse(0, -H * 0.48, R, H * 0.52, 0, 0, TAU); g.fill();
    g.strokeStyle = css(shade(col, -0.3), 0.6); g.lineWidth = Math.max(0.6, S * 0.006);
    for (let i = -4; i <= 4; i++) { const k = i / 4.6; g.beginPath(); g.ellipse(0, -H * 0.48, Math.abs(k) * R, H * 0.52, 0, k < 0 ? Math.PI / 2 : -Math.PI / 2, k < 0 ? Math.PI * 1.5 : Math.PI / 2); g.stroke(); }
    g.fillStyle = css(a.sp);
    for (let i = -4; i <= 4; i++) for (let j = 0; j < 7; j++) { const k = i / 4.6, t = j / 7; const y = -H * 0.48 - Math.cos(t * Math.PI) * H * 0.48; const x = k * R * Math.sin(t * Math.PI + 0.1); g.fillRect(x - 0.6, y, 1.4, 1.4); }
    if (vs.bloom > 0.1) for (let i = 0; i < a.fl.n; i++) { const ang = i / a.fl.n * TAU; flower(g, Math.cos(ang) * R * 0.45, -H * 0.94 + Math.sin(ang) * R * 0.15, S * 0.03, 'daisy', a.fl.c, '#e8a020', vs.bloom, i); }
    return;
  }
  // tuna: paletas planas
  const pads = [[0, 0, 0, 1], [0.5, -0.55, -0.5, 0.8], [-0.55, -0.6, 0.6, 0.75], [0.15, -1.1, -0.2, 0.7], [0.9, -1.05, -0.9, 0.55], [-0.85, -1.15, 0.8, 0.55]];
  const n = Math.round(2 + 4 * vs.g), PW = S * 0.17 * (0.7 + 0.3 * sz), PH = S * 0.25 * (0.7 + 0.3 * sz);
  pads.slice(0, n).forEach(([px, py, rot, k], i) => {
    const x = px * PW * 1.3, y = -PH * 0.9 + py * PH * 1.25;
    g.save(); g.translate(x, y); g.rotate(rot * 0.6);
    g.fillStyle = css(shade(col, -0.1 + i * 0.04)); g.beginPath(); g.ellipse(0, 0, PW * k, PH * k, 0, 0, TAU); g.fill();
    g.fillStyle = css(shade(col, 0.15), 0.5); g.beginPath(); g.ellipse(-PW * 0.25 * k, -PH * 0.2 * k, PW * 0.4 * k, PH * 0.6 * k, 0, 0, TAU); g.fill();
    g.fillStyle = css(a.sp); for (let j = 0; j < 9; j++) g.fillRect(((j % 3) - 1) * PW * 0.45 * k, (Math.floor(j / 3) - 1) * PH * 0.5 * k, 1.3, 1.3);
    if (i >= 3 || n <= 3) {
      if (vs.bloom > 0.1) flower(g, 0, -PH * k, S * 0.035, 'cup5', a.fl.c, '#e8a020', vs.bloom, i);
      if (vs.fruit > 0.2) { for (const s of [-0.5, 0.5]) { g.fillStyle = css(mix([150, 170, 80], a.fr.c, vs.fruit)); g.beginPath(); g.ellipse(s * PW * 0.6, -PH * k * 0.92, S * 0.025, S * 0.035, 0, 0, TAU); g.fill(); } }
    }
    g.restore();
  });
};

FORMS.feather = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.2 + 0.8 * vs.g, H = a.h * S * sz;
  if (vs.g > 0.4) { g.fillStyle = css(a.root); g.beginPath(); g.ellipse(0, -S * 0.005, S * 0.028 * sz, S * 0.016, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 9; i++) {
    const ang = -Math.PI / 2 + (i / 8 - 0.5) * 1.6 + (r() - 0.5) * 0.2, len = H * (0.7 + r() * 0.35);
    leaf(g, 0, -S * 0.01, ang + vs.wilt * 0.5 * Math.sign(ang + Math.PI / 2), len, len * 0.3, shade(vs.lc, (r() - 0.5) * 0.15), 'feather');
  }
};

FORMS.corn = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.18 + 0.82 * vs.g, H = a.h * S * sz * (1 - vs.wilt * 0.1);
  g.strokeStyle = css(shade(vs.lc, -0.1)); g.lineWidth = Math.max(1.2, S * 0.03 * sz); g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, 0); g.lineTo(S * 0.02, -H); g.stroke();
  for (let i = 0; i < 9; i++) {
    const t = 0.1 + i * 0.095, y = -H * t, side = i % 2 ? 1 : -1, len = S * a.h * 0.42 * sz * (1 - t * 0.4);
    const ex = side * len * 0.8, ey = y - len * 0.2 + len * (0.45 + vs.wilt * 0.4);
    g.fillStyle = css(shade(vs.lc, -0.08 + (r() - 0.5) * 0.12));
    g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(ex * 0.4, y - len * 0.45, ex, ey); g.quadraticCurveTo(ex * 0.45, y - len * 0.3, 0, y + S * 0.03); g.fill();
  }
  if (vs.bloom > 0.1 || vs.g >= 1) {
    g.strokeStyle = '#d8c070'; g.lineWidth = Math.max(0.6, S * 0.006);
    for (let i = 0; i < 6; i++) { const ang = -Math.PI / 2 + (i - 2.5) * 0.25; g.beginPath(); g.moveTo(S * 0.02, -H); g.lineTo(S * 0.02 + Math.cos(ang) * S * 0.18, -H + Math.sin(ang) * S * 0.2 + S * 0.06); g.stroke(); }
  }
  if (vs.fruit > 0.15) for (const [y, s] of [[-H * 0.45, 1], [-H * 0.58, -1]]) {
    g.fillStyle = css(mix([120, 160, 70], [235, 205, 90], vs.fruit * 0.6)); g.beginPath(); g.ellipse(s * S * 0.05, y, S * 0.035, S * 0.1, s * 0.3, 0, TAU); g.fill();
    g.strokeStyle = css(vs.fruit >= 1 ? '#8a5a2a' : '#d8c070'); g.lineWidth = 0.8; g.beginPath(); g.moveTo(s * S * 0.07, y - S * 0.09); g.lineTo(s * S * 0.1, y - S * 0.15); g.stroke();
  }
};

FORMS.papyrus = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.2 + 0.8 * vs.g, H = a.h * S * sz;
  for (let i = 0; i < 9; i++) {
    const ang = (i / 8 - 0.5) * 0.7 + (r() - 0.5) * 0.15, len = H * (0.7 + r() * 0.35), tx = Math.sin(ang) * len, ty = -Math.cos(ang) * len;
    g.strokeStyle = css(shade(vs.lc, -0.05)); g.lineWidth = Math.max(0.8, S * 0.01);
    g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(tx * 0.3, ty * 0.6, tx, ty); g.stroke();
    g.strokeStyle = css(shade(vs.lc, 0.15)); g.lineWidth = Math.max(0.5, S * 0.004);
    for (let k = 0; k < 18; k++) { const b = -Math.PI / 2 + (k / 17 - 0.5) * 3.3, l = S * 0.14 * sz; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(b) * l * 0.6, ty + Math.sin(b) * l * 0.7, tx + Math.cos(b) * l, ty + Math.sin(b) * l * 0.6 + l * 0.25); g.stroke(); }
  }
};

FORMS.ground = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.25 + 0.75 * vs.g, W = a.w * S * sz, H = a.h * S * sz;
  g.fillStyle = css(shade(vs.lc, -0.22)); g.beginPath(); g.ellipse(0, -H * 0.3, W * 0.48, H * 0.6, 0, 0, TAU); g.fill();
  for (let i = 0; i < 260; i++) {
    const ang = r() * TAU, d = Math.sqrt(r()), x = Math.cos(ang) * d * W * 0.5, y = -H * 0.3 + Math.sin(ang) * d * H * 0.55 - (1 - d) * H * 0.4;
    g.fillStyle = css(shade(vs.lc, (-H * 0.3 - y) / H * 0.5 + (r() - 0.5) * 0.18));
    g.fillRect(x, y, Math.max(1, S * 0.016), Math.max(1, S * 0.013));
  }
  if (vs.bloom > 0.05) for (let i = 0; i < a.fl.n * vs.bloom; i++) {
    const ang = r() * TAU, d = Math.sqrt(r()) * 0.9; g.fillStyle = css(shade(a.fl.c, (r() - 0.5) * 0.2));
    g.beginPath(); g.arc(Math.cos(ang) * d * W * 0.5, -H * 0.4 + Math.sin(ang) * d * H * 0.5, Math.max(0.8, S * 0.012), 0, TAU); g.fill();
  }
};

FORMS.sprawl = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.2 + 0.8 * vs.g, W = a.w * S * sz;
  g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.8, S * 0.012);
  for (let i = 0; i < 4; i++) { const ang = i * 1.6 + r(); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(ang) * W * 0.3, Math.sin(ang) * W * 0.15 - S * 0.05, Math.cos(ang) * W * 0.5, Math.sin(ang) * W * 0.22); g.stroke(); }
  const lv = [];
  for (let i = 0; i < 12; i++) { const ang = r() * TAU, d = 0.2 + r() * 0.8; lv.push([Math.cos(ang) * W * 0.45 * d, Math.sin(ang) * W * 0.2 * d, r()]); }
  lv.slice(0, Math.round(4 + 8 * vs.g)).sort((p, q) => p[1] - q[1]).forEach(([x, y, k]) => {
    const L = S * 0.3 * (0.7 + k * 0.4) * (0.5 + 0.5 * sz);
    g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.6, S * 0.007); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - L * (0.5 - vs.wilt * 0.3)); g.stroke();
    g.save(); g.translate(x, y - L * (0.5 - vs.wilt * 0.3)); g.scale(1, 0.75);
    palmLeaf(g, L * 0.55, L * 1.1, shade(vs.lc, (y < 0 ? -0.1 : 0.04) + k * 0.05)); g.restore();
  });
  if (vs.bloom > 0.1) for (let i = 0; i < a.fl.n; i++) flower(g, (r() - 0.5) * W * 0.6, -S * 0.12 - r() * S * 0.05, a.fl.r * S, 'trumpet', a.fl.c, a.fl.c, vs.bloom, i);
  if (vs.fruit > 0.15) fruit(g, W * 0.12, S * 0.02, a.fr.r * S * (0.4 + 0.6 * vs.fruit), 'pumpkin', a.fr.c, vs.fruit);
};

FORMS.vine = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.2 + 0.8 * vs.g, H = a.h * S, VH = H * sz, W = a.w * S;
  // espaldera de madera
  g.strokeStyle = '#9a7a56'; g.lineWidth = Math.max(1, S * 0.018); g.lineCap = 'round';
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * W * 0.32, 0); g.lineTo(s * W * 0.22, -H); g.stroke(); }
  g.lineWidth = Math.max(0.5, S * 0.008); g.strokeStyle = '#b09068';
  for (let i = 1; i <= 4; i++) { const y = -H * i / 4.4, k = 1 - i / 4.4 * 0.3; g.beginPath(); g.moveTo(-W * 0.32 * k, y); g.lineTo(W * 0.32 * k, y); g.stroke(); }
  if (vs.dorm && sp.life === 'deciduous') {
    g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.7, S * 0.01);
    for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(0, 0); for (let i = 1; i <= 10; i++) { const t = i / 10; g.lineTo(Math.sin(t * 9 + k * 2) * W * 0.28, -VH * t); } g.stroke(); }
    return;
  }
  // tallos que se enroscan
  const stems = [0, 1.6, 3.2, 4.8];
  g.strokeStyle = css(vs.stem); g.lineWidth = Math.max(0.7, S * 0.01);
  const pts = [];
  for (const ph of stems) {
    g.beginPath(); g.moveTo(0, 0);
    for (let i = 1; i <= 18; i++) { const t = i / 18, x = Math.sin(t * 8 + ph) * W * 0.32 * (0.6 + t * 0.4), y = -VH * t; g.lineTo(x, y); pts.push([x, y, t]); }
    g.stroke();
  }
  // masa de follaje detrás de las hojas sueltas, para que la trepadora se vea tupida
  const mass = Math.round(10 * vs.g);
  for (let i = 0; i < 10; i++) {
    const t = 0.15 + 0.8 * r(), x = (r() - 0.5) * W * 0.5, rr = W * (0.09 + r() * 0.07) * (0.6 + 0.4 * sz);
    if (i >= mass) continue;
    g.fillStyle = css(shade(vs.lc, -0.18 - r() * 0.08), 0.5); g.beginPath(); g.ellipse(x, -VH * t, rr, rr * 0.9, 0, 0, TAU); g.fill();
  }
  const n = Math.round(pts.length * (0.5 + 0.5 * vs.g));
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    for (let k = 0; k < 3; k++) {
      const ang = -Math.PI / 2 + (r() - 0.5) * 3, L = a.ls * S * 1.8 * (0.75 + r() * 0.5) * (0.6 + 0.4 * sz);
      leaf(g, x + (r() - 0.5) * S * 0.12, y + (r() - 0.5) * S * 0.06, ang + vs.wilt * 0.8, L, L * (a.lf === 'lance' ? 0.22 : 0.4), shade(vs.lc, (r() - 0.5) * 0.2 - 0.04 + k * 0.04), a.lf);
    }
  }
  const fl = a.fl;
  if (fl && vs.bloom > 0.05 && !vs.dead) {
    const R = fl.r * S, nf = Math.round(fl.n * (0.35 + 0.65 * vs.bloom) * (0.4 + 0.6 * vs.g));
    for (let i = 0; i < fl.n; i++) {
      const [x, y, t] = pts[Math.floor(r() * pts.length)], ox = (r() - 0.5) * W * 0.25, rr = r();
      if (i >= nf || t < 0.2) continue;
      if (fl.s === 'raceme') raceme(g, x + ox, y, (fl.len || 0.3) * S * (0.6 + 0.4 * vs.bloom), R, vs.fc);
      else if (fl.s === 'copihue') { g.strokeStyle = css(vs.stem); g.lineWidth = 0.7; g.beginPath(); g.moveTo(x, y); g.lineTo(x + ox * 0.3, y + R * 0.6); g.stroke(); flower(g, x + ox * 0.3, y + R * 1.4, R, 'copihue', vs.fc, vs.fc2, vs.bloom, rr); }
      else flower(g, x + ox, y, R, fl.s, vs.fc, vs.fc2, vs.bloom, rr * 6);
    }
  }
};

FORMS.aquatic = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.3 + 0.7 * vs.g;
  const pads = [];
  for (let i = 0; i < 7; i++) { const ang = r() * TAU, d = 0.1 + r() * 0.75; pads.push([Math.cos(ang) * d * S * 0.42, Math.sin(ang) * d * S * 0.2, 0.75 + r() * 0.5, r() * TAU]); }
  const n = Math.round(3 + 4 * vs.g);
  pads.slice(0, n).sort((p, q) => p[1] - q[1]).forEach(([x, y, k, rot]) => {
    const R = S * 0.19 * k * sz;
    g.fillStyle = css(shade(vs.lc, -0.1 + k * 0.1));
    g.beginPath(); g.ellipse(x, y, R, R * 0.45, 0, rot, rot + TAU * 0.92); g.lineTo(x, y); g.closePath(); g.fill();
    g.strokeStyle = css(shade(vs.lc, 0.22), 0.6); g.lineWidth = 0.6; g.beginPath(); g.ellipse(x, y, R * 0.98, R * 0.44, 0, rot, rot + TAU * 0.92); g.stroke();
  });
  if (a.k === 'lotus') {
    for (let i = 0; i < 3; i++) {
      const x = (r() - 0.5) * S * 0.4, h = S * (0.45 + r() * 0.3) * sz;
      g.strokeStyle = css(shade(vs.lc, -0.2)); g.lineWidth = Math.max(0.7, S * 0.008); g.beginPath(); g.moveTo(x, 0); g.quadraticCurveTo(x + S * 0.05, -h * 0.5, x, -h); g.stroke();
      g.fillStyle = css(shade(vs.lc, i * 0.06)); g.beginPath(); g.ellipse(x, -h, S * 0.16 * sz, S * 0.06 * sz, (r() - 0.5) * 0.4, 0, TAU); g.fill();
      g.fillStyle = css(shade(vs.lc, 0.2)); g.beginPath(); g.ellipse(x, -h - S * 0.01, S * 0.12 * sz, S * 0.035 * sz, 0, Math.PI, TAU); g.fill();
    }
  }
  const fl = a.fl;
  if (fl && vs.bloom > 0.05) {
    for (let i = 0; i < fl.n; i++) {
      const [x, y] = pads[i];
      if (a.k === 'lotus') {
        const h = S * 0.8 * sz; g.strokeStyle = css(shade(vs.lc, -0.2)); g.lineWidth = Math.max(0.7, S * 0.008);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + S * 0.03, y - h); g.stroke();
        flower(g, x + S * 0.03, y - h, fl.r * S, 'lotus', vs.fc, vs.fc2, vs.bloom, i);
      } else flower(g, x, y - S * 0.02, fl.r * S, 'waterlily', vs.fc, vs.fc2, vs.bloom, r() * 6);
    }
  }
};

FORMS.tree = (g, sp, vs, S, r) => {
  const a = sp.art, sz = 0.18 + 0.82 * vs.g, H = a.h * S * sz, W = a.w * S * sz;
  const bare = (vs.dorm && sp.life === 'deciduous') || (a.nb && vs.bloom > 0.3 && !vs.dead);
  const cn = a.cn;
  const cy = cn === 'umbrella' ? -H * 0.78 : cn === 'spread' ? -H * 0.66 : cn === 'oval' ? -H * 0.6 : -H * 0.64;
  const crx = W / 2, cry = cn === 'umbrella' ? H * 0.2 : cn === 'spread' ? H * 0.3 : cn === 'oval' ? H * 0.4 : H * 0.36;
  const trunkTop = cy + cry * 0.3;
  const bark = rgbOf(a.tr), tw = Math.max(1.5, S * 0.085 * Math.sqrt(a.h / 3) * sz);
  // tronco
  g.fillStyle = css(bark);
  g.beginPath(); g.moveTo(-tw, 0); g.quadraticCurveTo(-tw * 0.8, trunkTop * 0.5, -tw * 0.45, trunkTop); g.lineTo(tw * 0.45, trunkTop); g.quadraticCurveTo(tw * 0.8, trunkTop * 0.5, tw, 0); g.closePath(); g.fill();
  g.fillStyle = css(shade(bark, -0.3), 0.6); g.beginPath(); g.moveTo(tw * 0.2, 0); g.quadraticCurveTo(tw * 0.45, trunkTop * 0.5, tw * 0.25, trunkTop); g.lineTo(tw * 0.45, trunkTop); g.quadraticCurveTo(tw * 0.8, trunkTop * 0.5, tw, 0); g.fill();
  if (cn === 'spread' && sp.id === 'olive') { g.strokeStyle = css(shade(bark, -0.2)); g.lineWidth = 0.8; g.beginPath(); g.moveTo(-tw * 0.5, 0); g.bezierCurveTo(tw * 0.6, trunkTop * 0.3, -tw * 0.6, trunkTop * 0.6, tw * 0.2, trunkTop); g.stroke(); }
  // ramas principales
  const br = [];
  for (let i = 0; i < 6; i++) {
    const ang = -Math.PI / 2 + (i / 5 - 0.5) * (cn === 'umbrella' || cn === 'spread' ? 2.4 : 1.7) + (r() - 0.5) * 0.25;
    const len = (cn === 'umbrella' ? 0.9 : 0.75 + r() * 0.25);
    br.push({ ang, len, sub: [r(), r(), r(), r(), r(), r()] });
  }
  const drawBranches = (twigs) => {
    g.strokeStyle = css(shade(bark, -0.05)); g.lineCap = 'round';
    for (const b of br) {
      const ex = Math.cos(b.ang) * crx * b.len, ey = trunkTop + Math.sin(b.ang) * (cry + (trunkTop - cy)) * b.len * 1.1;
      g.lineWidth = tw * 0.55; g.beginPath(); g.moveTo(0, trunkTop); g.quadraticCurveTo(ex * 0.3, trunkTop + (ey - trunkTop) * 0.7, ex, ey); g.stroke();
      if (!twigs) continue;
      for (let k = 0; k < 4; k++) {
        const t = 0.45 + b.sub[k] * 0.5, sx = ex * t, sy = trunkTop + (ey - trunkTop) * t;
        const a2 = b.ang + (k % 2 ? 0.6 : -0.6) * (0.6 + b.sub[k + 1] * 0.6), l2 = crx * 0.35 * (0.6 + b.sub[k + 2] * 0.5);
        g.lineWidth = Math.max(0.6, tw * 0.22); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a2) * l2, sy + Math.sin(a2) * l2 * 0.8); g.stroke();
        g.lineWidth = Math.max(0.4, tw * 0.1); g.beginPath(); g.moveTo(sx + Math.cos(a2) * l2 * 0.6, sy + Math.sin(a2) * l2 * 0.48);
        g.lineTo(sx + Math.cos(a2 - 0.5) * l2 * 1.1, sy + Math.sin(a2 - 0.5) * l2 * 0.95); g.stroke();
      }
    }
  };
  // grupos de follaje
  const clumps = [];
  const nC = a.big ? 24 : 18;
  for (let i = 0; i < nC; i++) {
    const ang = r() * TAU, d = Math.sqrt(r()) * 0.78;
    let x = Math.cos(ang) * crx * d, y = cy + Math.sin(ang) * cry * d;
    if (cn === 'layered') y = cy + (Math.floor(r() * 3) - 1) * cry * 0.62 + Math.sin(ang) * cry * 0.15;
    const cr = (cn === 'layered' ? crx * 0.3 : Math.min(crx, cry) * (0.36 + r() * 0.22)) * (cn === 'spread' || cn === 'umbrella' ? 1.15 : 1);
    clumps.push({ x, y, cr, k: r(), dots: Array.from({ length: 14 }, () => [r(), r(), r()]) });
  }
  clumps.sort((p, q) => p.y - q.y);
  const lc = vs.lc, fallThin = vs.fall > 0.85 ? 0.55 : 1;
  const blossomTime = a.fl && a.fl.s === 'blossom' && vs.bloom > 0.05;
  if (bare) {
    drawBranches(true);
  } else {
    drawBranches(false);
    const show = clumps.filter((c, i) => i / clumps.length < fallThin * (0.55 + 0.45 * vs.g));
    const ek = cn === 'layered' ? 0.55 : 0.82;
    for (const c of show) { g.fillStyle = css(shade(lc, -0.42)); g.beginPath(); g.ellipse(c.x + c.cr * 0.08, c.y + c.cr * 0.12, c.cr * 1.1, c.cr * ek, 0, 0, TAU); g.fill(); }
    for (const c of show) {
      g.fillStyle = css(shade(lc, -0.12 + c.k * 0.08)); g.beginPath(); g.ellipse(c.x, c.y, c.cr * 1.02, c.cr * ek * 0.92, 0, 0, TAU); g.fill();
      g.fillStyle = css(shade(lc, 0.14 + c.k * 0.06), 0.85); g.beginPath(); g.ellipse(c.x - c.cr * 0.25, c.y - c.cr * 0.28, c.cr * 0.6, c.cr * ek * 0.55, 0, 0, TAU); g.fill();
      // bordes con textura de hojas
      for (const [u, v, w] of c.dots) {
        const ang = Math.PI * (0.9 + u * 1.2), d = c.cr * (0.78 + v * 0.3), lx = c.x + Math.cos(ang) * d * 1.05, ly = c.y + Math.sin(ang) * d * ek;
        g.fillStyle = css(shade(lc, w > 0.5 ? 0.22 : -0.05), 0.9);
        if (cn === 'layered' || sp.id === 'maple') { g.save(); g.translate(lx, ly); g.scale(0.5, 0.5); palmLeaf(g, c.cr * 0.35, c.cr * 0.5, shade(lc, w > 0.5 ? 0.2 : -0.05)); g.restore(); }
        else { g.beginPath(); g.ellipse(lx, ly, c.cr * 0.2, c.cr * 0.12, ang + 1.2, 0, TAU); g.fill(); }
      }
    }
    if (sp.id === 'olive') for (const c of show) for (const [u, v] of c.dots) { g.fillStyle = 'rgba(230,235,215,0.35)'; g.fillRect(c.x + (u - 0.5) * c.cr * 1.4, c.y + (v - 0.6) * c.cr, 1.5, 1); }
  }
  // flores: nube de florecitas (cerezo, jacarandá, limonero) o grandes copas (magnolio)
  if (a.fl && vs.bloom > 0.05 && !vs.dead) {
    const fc = vs.fc, dens = a.fl.s === 'blossom' ? (bare ? 1.6 : sp.id === 'lemon' ? 0.25 : 0.8) : 0.5;
    if (a.fl.s === 'tulipTree') {
      for (const b of br) for (let k = 0; k < 4; k++) {
        const t = 0.6 + b.sub[k] * 0.4, x = Math.cos(b.ang) * crx * b.len * t + (b.sub[k + 1] - 0.5) * crx * 0.5, y = trunkTop + Math.sin(b.ang) * (cry + trunkTop - cy) * b.len * 1.1 * t - b.sub[k + 2] * cry * 0.5;
        if (b.sub[k + 1] < vs.bloom) flower(g, x, y, a.fl.r * S * (0.6 + 0.4 * sz), 'tulipTree', fc, vs.fc2, vs.bloom, k);
      }
    } else {
      const n = Math.round(180 * dens * vs.bloom * (a.big ? 1.5 : 1));
      for (let i = 0; i < n; i++) {
        const ang = r() * TAU, d = Math.sqrt(r()) * 0.98, x = Math.cos(ang) * crx * d, y = cy + Math.sin(ang) * cry * d;
        const top = (cy - y) / cry;
        g.fillStyle = css(shade(fc, top * 0.18 - 0.06 + (r() - 0.5) * 0.12), 0.95);
        const pr = Math.max(1, S * (sp.id === 'lemon' ? 0.025 : bare ? 0.05 : 0.04) * (0.6 + r() * 0.6));
        g.beginPath(); g.arc(x, y, pr, 0, TAU); g.fill();
        if (pr > 2 && r() < 0.4) { g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(x - pr * 0.3, y - pr * 0.3, pr * 0.4, 0, TAU); g.fill(); }
      }
    }
  }
  // frutos
  if (a.fr && vs.fruit > 0.15 && !bare) {
    const n = Math.round(a.fr.n * vs.fruit * (0.4 + 0.6 * vs.g));
    for (let i = 0; i < n; i++) {
      const ang = Math.PI * (0.1 + r() * 0.8), d = 0.45 + r() * 0.5;
      fruit(g, Math.cos(ang) * crx * d * (r() > 0.5 ? 1 : -1), cy + Math.sin(ang) * cry * d * 0.9, a.fr.r * S * (0.7 + 0.3 * sz), a.fr.s, a.fr.c, vs.fruit);
    }
  }
};

// ---------- Plagas, mantas y estados especiales ----------
function overlays(g, sp, vs, S, r, box) {
  if (vs.pests && !vs.dead) {
    if (vs.pests === 'slug') {
      g.fillStyle = '#8a7a5a';
      g.beginPath(); g.ellipse(S * 0.08, -S * 0.01, S * 0.05, S * 0.015, 0, 0, TAU); g.fill();
      g.strokeStyle = '#8a7a5a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(S * 0.12, -S * 0.015); g.lineTo(S * 0.135, -S * 0.04); g.stroke();
    } else {
      const col = vs.pests === 'mildew' ? 'rgba(245,245,240,0.8)' : 'rgba(60,90,40,0.95)';
      g.fillStyle = col;
      for (let i = 0; i < 26; i++) {
        const x = (r() - 0.5) * box.w * 0.7, y = -r() * box.h * 0.8;
        const s = vs.pests === 'mildew' ? Math.max(1.5, S * 0.025) : Math.max(1, S * 0.01);
        g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill();
      }
    }
  }
  if (vs.cloth) {
    const w = Math.max(box.w * 0.6, S * 0.35), h = Math.max(box.h * 1.05, S * 0.3);
    g.fillStyle = 'rgba(248,248,244,0.72)';
    g.beginPath(); g.moveTo(-w / 2, 0); g.bezierCurveTo(-w / 2, -h * 1.1, w / 2, -h * 1.1, w / 2, 0); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(200,200,190,0.8)'; g.lineWidth = 0.8;
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * w * 0.2, -h * 0.82); g.quadraticCurveTo(i * w * 0.32, -h * 0.4, i * w * 0.38, 0); g.stroke(); }
  }
}

// Tamaño del dibujo (en metros) para reservar el lienzo
function artBox(sp) {
  const a = sp.art, f = a.f;
  let w = a.w || 0.4, up = a.h || 0.3, down = 0.08;
  if (a.fl && a.fl.sh) up = Math.max(up, a.fl.sh + a.fl.r * 2);
  if (f === 'rosette' || f === 'ground' || f === 'sprawl') { w = Math.max(w, (a.ls || 0.1) * 2.3); down = w * 0.3; up = Math.max(up, (a.ls || 0.1) * 1.1); }
  if (f === 'aquatic') { w = 1.1; down = 0.3; up = a.k === 'lotus' ? 1.0 : 0.25; }
  if (f === 'fern') { w = a.w * 1.6; up = a.h * 1.1; }
  if (f === 'strap') { w = Math.max(w, a.h * 1.2); up += 0.1; }
  if (f === 'stem') { w = w * 1.4 + (a.ls || 0.1); up += (a.fl ? a.fl.r * 2 + (a.fl.len || 0) : 0) + 0.05; }
  if (f === 'bush') { w *= 1.25; up = up * 1.15 + (a.fl && a.fl.sh ? a.fl.sh : 0) + 0.08; }
  if (f === 'tree') { w *= 1.12; up *= 1.04; }
  if (f === 'vine') { w = Math.max(w * 1.2, 0.6); up += 0.15; }
  if (f === 'corn') { w = 1.0; up += 0.15; }
  if (f === 'papyrus') { w = 1.2; up += 0.15; }
  if (f === 'grass') { w = a.h * 1.6; up += 0.1; }
  if (f === 'cactus') { w = a.k === 'pads' ? 1.0 : w + 0.1; up += 0.1; }
  return { w: w + 0.15, up: up + 0.08, down: down + 0.06 };
}

// Dibuja una planta (o una especie de muestra) en su propio lienzo
function renderPlantCanvas(sp, vs, seed, S) {
  const box = artBox(sp), cw = Math.ceil(box.w * S), ch = Math.ceil((box.up + box.down) * S);
  const cv = document.createElement('canvas');
  cv.width = Math.max(2, cw); cv.height = Math.max(2, ch);
  const g = cv.getContext('2d');
  const ox = cw / 2, oy = box.up * S;
  g.translate(ox, oy);
  const r = rng(seed);
  if (vs.dorm && (sp.life === 'perennial' || sp.life === 'bulb') && !isTree(sp) && sp.art.f !== 'vine') dormantStub(g, S, vs, sp);
  else if (vs.g < 0.12 && !isTree(sp) && sp.art.f !== 'aquatic' && sp.art.f !== 'cactus') seedling(g, S, vs, sp);
  else (FORMS[sp.art.f] || FORMS.bush)(g, sp, vs, S, r);
  const sz = plantSizeFromArt(sp, vs.g);
  overlays(g, sp, vs, S, rng(seed + 1), { w: sz.w * S, h: sz.h * S });
  return { cv, ox, oy };
}
const plantSizeFromArt = (sp, gg) => { const k = 0.18 + 0.82 * clamp(gg, 0, 1); return { h: (sp.art.h || 0.3) * k, w: (sp.art.w || 0.4) * k }; };

// Silueta negra para la sombra
function silhouette(cv) {
  const s = document.createElement('canvas');
  s.width = cv.width; s.height = cv.height;
  const g = s.getContext('2d');
  g.drawImage(cv, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = '#000'; g.fillRect(0, 0, s.width, s.height);
  return s;
}

// Miniatura de una especie en flor (para el catálogo y el herbario)
const THUMBS = new Map();
function speciesThumb(sp, px, opts = {}) {
  const key = sp.id + '|' + px + '|' + (opts.dorm ? 1 : 0);
  if (THUMBS.has(key)) return THUMBS.get(key);
  const box = artBox(sp), dpr = Math.min(2, window.devicePixelRatio || 1);
  const S = Math.min(px * dpr / box.w, px * dpr / (box.up + box.down)) * 0.95;
  const fake = { g: 1, hp: 100, bloom: sp.bloom ? 1 : 0, fruit: sp.fruit ? 1 : 0, dorm: false, dead: false, wilt: 0, yellow: 0, burn: 0, frost: 0, fall: 0, pests: 0, cloth: 0, ph: 5 };
  const a = sp.art, vs = { ...fake };
  vs.lc = rgbOf(a.lc); vs.stem = mix(shade(vs.lc, -0.25), [110, 120, 70], 0.25);
  if (a.fl) { vs.fc = rgbOf(sp.hydra ? hydrangeaColor(5) : a.fl.pal ? a.fl.pal[0] : a.fl.c); vs.fc2 = rgbOf(a.fl.c2 || '#f2d230'); }
  const { cv, ox, oy } = renderPlantCanvas(sp, vs, 12345 + sp.idx * 7, S);
  const out = document.createElement('canvas');
  out.width = px * dpr; out.height = px * dpr;
  const g = out.getContext('2d');
  // un poco de tierra o agua debajo
  g.fillStyle = sp.water === 'aquatic' ? 'rgba(90,150,170,0.35)' : 'rgba(110,80,50,0.18)';
  g.beginPath(); g.ellipse(out.width / 2, out.height - box.down * S - 2, Math.min(out.width * 0.42, box.w * S * 0.4), Math.max(3, box.down * S * 0.8), 0, 0, TAU); g.fill();
  g.drawImage(cv, out.width / 2 - ox, out.height - box.down * S - oy - 2);
  const url = out.toDataURL();
  THUMBS.set(key, url);
  return url;
}
