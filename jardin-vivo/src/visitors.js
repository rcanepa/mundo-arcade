// ===== Visitantes: llegan por la vereda, pagan la entrada, recorren el jardín y comentan =====
const VIS = { list: [], queue: [], pois: [], poiVer: -1, walkVer: -1, walk: null, passT: 0 };
const OPEN_H = 9, CLOSE_H = 18, MAX_ON_SCREEN = 28;
const WALK_SPEED = 4.4;          // casillas por hora del juego
const SIDEWALK_Y = GH + 0.62;

const SKIN = ['#f3d2b5', '#e8b98f', '#c98e62', '#a86b45', '#7a4a30', '#f6dcc6'];
const HAIR = ['#2a1f18', '#4a3020', '#8a5a2a', '#c9a060', '#e8d8b0', '#9a9a9a', '#6a2a1a'];
const SHIRT = ['#e86a5a', '#5a9ad8', '#f2c14e', '#7ac08a', '#c48ad8', '#f29ab8', '#ffffff', '#4a6a8a', '#e8954a', '#3fa7a0'];
const PANTS = ['#3a4a6a', '#5a4a3a', '#2a2a2a', '#7a6a58', '#4a6a4a', '#c9b89a'];

function newLook() {
  const kid = Math.random() < 0.13, old = !kid && Math.random() < 0.14;
  return {
    skin: pick(SKIN), hair: old ? pick(['#d8d8d8', '#b8b8b8', '#f0f0f0']) : pick(HAIR), shirt: pick(SHIRT), pants: pick(PANTS),
    hat: Math.random() < 0.28 ? pick(['sun', 'cap', 'beret']) : null, hatCol: pick(['#e8d8a8', '#c84a3a', '#3a5a8a', '#f4efe2', '#6a8a4a']),
    camera: Math.random() < 0.2, bag: Math.random() < 0.25, long: Math.random() < 0.45, kid, old, h: kid ? 1.05 + Math.random() * 0.2 : 1.55 + Math.random() * 0.25
  };
}

// ---------- Por dónde se puede caminar ----------
function walkable(x, y) {
  const t = tileAt(x, y);
  if (!t || !t.own || (t.t !== 'grass' && t.t !== 'path') || t.plant) return false;
  if (t.obj) { const st = G.structs.find(s => s.id === t.obj); return st && BUILD[st.k].walk; }
  return true;
}
function walkGrid() {
  if (VIS.walkVer === VIS_VER && VIS.walk) return VIS.walk;
  const wk = new Uint8Array(GW * GH);
  for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) wk[idx(x, y)] = walkable(x, y) ? 1 : 0;
  VIS.walk = wk; VIS.walkVer = VIS_VER;
  return wk;
}
function findPath(sx, sy, tx, ty) {
  const wk = walkGrid();
  if (!inside(tx, ty) || !wk[idx(tx, ty)]) return null;
  const prev = new Int32Array(GW * GH).fill(-1), start = idx(sx, sy), goal = idx(tx, ty);
  const q = [start]; prev[start] = start;
  for (let h = 0; h < q.length; h++) {
    const c = q[h];
    if (c === goal) break;
    const cx = c % GW, cy = (c / GW) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!inside(nx, ny)) continue;
      const n = idx(nx, ny);
      if (prev[n] !== -1 || !wk[n]) continue;
      prev[n] = c; q.push(n);
    }
  }
  if (prev[goal] === -1) return null;
  const path = [];
  for (let c = goal; c !== start; c = prev[c]) path.push([(c % GW) + 0.5, ((c / GW) | 0) + 0.5]);
  return path.reverse();
}

// Lugares interesantes para mirar: plantas lindas (o con problemas), la fuente, los bancos…
function buildPOIs() {
  if (VIS.poiVer === VIS_VER) return VIS.pois;
  const wk = walkGrid(), pois = [];
  const spotNear = (x0, y0, w = 1, h = 1) => {
    const out = [];
    for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) if (inside(x, y) && wk[idx(x, y)]) out.push([x, y]);
    return out;
  };
  for (const p of G.plants) {
    const t = tileAt(p.x, p.y);
    if (!t.own) continue;
    const problem = p.dead || (p.fac && p.cond < 0.6) || p.pests;
    const w = Math.max(0, p.beauty || 0) + (p.bloom > 0.5 ? 2 : 0) + (problem ? 1.2 : 0);
    if (w < 0.6) continue;
    const spots = spotNear(p.x, p.y);
    if (spots.length) pois.push({ p, spots, w });
  }
  for (const s of G.structs) {
    const b = BUILD[s.k];
    if (s.k === 'bench') { pois.push({ s, spots: [[s.x, s.y]], w: 2.5, sit: 1 }); continue; }
    if (!b.beauty) continue;
    const spots = spotNear(s.x, s.y, s.w, s.h);
    if (spots.length) pois.push({ s, spots, w: b.beauty * 0.4 });
  }
  const water = G.tiles.filter(t => t.own && t.t === 'water');
  if (water.length) {
    const t = water[Math.floor(water.length / 2)], spots = spotNear(t.x, t.y);
    if (spots.length) pois.push({ pond: 1, spots, w: 3 + water.length * 0.3 });
  }
  VIS.pois = pois; VIS.poiVer = VIS_VER;
  return pois;
}

// ---------- Programar las visitas del día ----------
function planVisitors() {
  VIS.queue = [];
  const n = expectedVisitors(), count = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
  for (let i = 0; i < count; i++) VIS.queue.push(OPEN_H + Math.random() * (CLOSE_H - OPEN_H - 1.2));
  VIS.queue.sort((a, b) => a - b);
}

function spawnVisitor(enter) {
  const side = Math.random() < 0.5 ? -1 : 1;
  const v = {
    id: Math.random(), x: side < 0 ? -1.5 : GW + 1.5, y: SIDEWALK_Y + (Math.random() - 0.5) * 0.3, look: newLook(),
    state: enter ? 'toGate' : 'pass', side, path: [], t: 0, wait: 0, sat: 0.55, stops: 0, maxStops: 4 + Math.floor(Math.random() * 5),
    seen: new Set(), bubble: null, phase: Math.random() * 6, dir: -side, paid: false, timeLeft: 3.5 + Math.random() * 2.5
  };
  VIS.list.push(v);
  return v;
}

function payEntry(v) {
  v.paid = true;
  const ratio = G.price / Math.max(1, G.fair);
  v.sat += clamp((1 - ratio) * 0.18, -0.25, 0.12);
  G.money += G.price; G.today.income += G.price; G.today.visitors++; G.stats.visitors++; G.stats.income += G.price;
  if (G.price > 0 && !UI.title) { fxFloat(GATE_X + 0.5, GH - 0.4, '+' + money(G.price), '#2f6a2a'); Sound.sfx.coin(); }
  if (ratio > 1.35 && Math.random() < 0.5) say(v, 'expensive');
}

// Un visitante "invisible" (cuando hay demasiada gente en pantalla): paga y se lleva una impresión general
function ghostVisit() {
  G.money += G.price; G.today.income += G.price; G.today.visitors++; G.stats.visitors++; G.stats.income += G.price;
  const ratio = G.price / Math.max(1, G.fair);
  const sat = clamp(0.5 + Math.min(0.35, G.beauty / 2500) + (1 - ratio) * 0.18, 0, 1);
  G.today.sat += sat; G.today.satN++;
}

function updateVisitors(dtH, dtReal) {
  // llegan según lo programado
  while (VIS.queue.length && VIS.queue[0] <= G.hour) {
    VIS.queue.shift();
    if (VIS.list.filter(v => v.state !== 'pass').length < MAX_ON_SCREEN) spawnVisitor(true); else ghostVisit();
  }
  // gente que pasa por la calle
  VIS.passT -= dtH;
  if (VIS.passT <= 0 && G.hour > 7 && G.hour < 21 && !G.w.storm) {
    VIS.passT = 0.6 + Math.random() * 1.6;
    if (VIS.list.length < MAX_ON_SCREEN + 6) spawnVisitor(false);
  }
  for (let i = VIS.list.length - 1; i >= 0; i--) {
    const v = VIS.list[i];
    v.t += dtH;
    if (v.bubble) { v.bubble.t -= dtReal; if (v.bubble.t <= 0) v.bubble = null; }
    if (!stepVisitor(v, dtH)) VIS.list.splice(i, 1);
  }
}

function moveAlong(v, dtH) {
  let d = WALK_SPEED * dtH * (v.look.old ? 0.7 : v.look.kid ? 1.2 : 1);
  while (d > 0 && v.path.length) {
    const [tx, ty] = v.path[0], dx = tx - v.x, dy = ty - v.y, l = Math.hypot(dx, dy);
    if (l > 0.01) v.dir = dx - dy >= 0 ? 1 : -1;
    if (l <= d) { v.x = tx; v.y = ty; v.path.shift(); d -= l; }
    else { v.x += dx / l * d; v.y += dy / l * d; d = 0; }
  }
  v.moving = v.path.length > 0;
  return v.path.length === 0;
}

function stepVisitor(v, dtH) {
  const closing = G.hour >= CLOSE_H || !G.open;
  switch (v.state) {
    case 'pass': // camina por la vereda
      if (!v.path.length) v.path = [[v.side < 0 ? GW + 2 : -2, v.y]];
      moveAlong(v, dtH * 0.9);
      if (v.x < -1.8 || v.x > GW + 1.8) return v.path.length > 0;
      return true;
    case 'toGate':
      if (!v.path.length) v.path = [[GATE_X + 0.5, SIDEWALK_Y], [GATE_X + 0.5, GH - 0.5]];
      if (moveAlong(v, dtH)) { payEntry(v); v.state = 'choose'; }
      return true;
    case 'choose': {
      if (closing || v.stops >= v.maxStops || v.t > v.timeLeft + 2) { v.state = 'leave'; return true; }
      const poi = choosePOI(v);
      if (!poi) { v.state = 'leave'; return true; }
      const path = findPath(Math.floor(v.x), Math.floor(v.y), poi.spot[0], poi.spot[1]);
      if (!path) { v.seen.add(poi.poi); return true; }
      v.path = path; v.target = poi; v.state = 'walk';
      return true;
    }
    case 'walk':
      if (moveAlong(v, dtH)) { v.state = 'look'; v.wait = v.target.poi.sit ? 0.9 + Math.random() * 0.8 : 0.3 + Math.random() * 0.4; react(v, v.target.poi); }
      return true;
    case 'look':
      v.wait -= dtH;
      if (v.target && v.target.poi.p) v.dir = (v.target.poi.p.x - v.target.poi.p.y) - (v.x - v.y) >= 0 ? 1 : -1;
      if (v.wait <= 0) { v.stops++; v.state = 'choose'; v.sitting = false; }
      return true;
    case 'leave': {
      const path = findPath(Math.floor(v.x), Math.floor(v.y), GATE_X, GH - 1) || [];
      v.path = path.concat([[GATE_X + 0.5, GH - 0.5], [GATE_X + 0.5, SIDEWALK_Y], [v.side < 0 ? -2 : GW + 2, SIDEWALK_Y]]);
      v.state = 'exit';
      if (v.paid) {
        v.sat = clamp(v.sat, 0, 1);
        G.today.sat += v.sat; G.today.satN++;
        if (v.sat > 0.85 && Math.random() < 0.3) {
          const tip = 1 + Math.floor(Math.random() * Math.max(2, G.price));
          G.money += tip; G.today.income += tip; G.stats.income += tip;
          fxFloat(v.x, v.y, L().tip(money(tip)), '#b8860b'); say(v, 'thanks');
        }
      }
      return true;
    }
    case 'exit':
      moveAlong(v, dtH);
      return v.path.length > 0;
  }
  return false;
}

function choosePOI(v) {
  const pois = buildPOIs();
  let tot = 0;
  const opts = [];
  for (const poi of pois) {
    if (v.seen.has(poi)) continue;
    let best = null, bd = 1e9;
    for (const s of poi.spots) { const d = Math.abs(s[0] + 0.5 - v.x) + Math.abs(s[1] + 0.5 - v.y); if (d < bd) { bd = d; best = s; } }
    const w = poi.w / (1 + bd * 0.12);
    opts.push([poi, best, w]); tot += w;
  }
  if (!opts.length) return null;
  let r = Math.random() * tot;
  for (const [poi, spot, w] of opts) { r -= w; if (r <= 0) { v.seen.add(poi); return { poi, spot }; } }
  const [poi, spot] = opts[opts.length - 1]; v.seen.add(poi);
  return { poi, spot };
}

// Qué siente al ver algo
function react(v, poi) {
  const chatty = Math.random() < 0.62;
  if (poi.sit) { v.sitting = true; v.sat += 0.03; if (chatty) say(v, 'bench'); return; }
  if (poi.pond) { v.sat += 0.05; if (chatty) say(v, 'pond'); return; }
  if (poi.s) {
    v.sat += 0.02 + (BUILD[poi.s.k].beauty || 0) * 0.002;
    if (chatty) say(v, poi.s.k === 'fountain' ? 'fountain' : poi.s.k === 'greenhouse' ? 'greenhouse' : 'decor');
    return;
  }
  const p = poi.p, sp = spOf(p), name = sp;
  if (p.dead) { v.sat -= 0.06; say(v, 'dead', name); return; }
  const f = p.fac;
  if (p.pests) { v.sat -= 0.03; say(v, 'pests', name); return; }
  if (f && p.cond < 0.62) {
    v.sat -= 0.03;
    const issue = f.water < 0.75 ? (f.dry ? 'thirsty' : 'soggy') : f.light < 0.75 ? (f.lightLow ? 'dark' : 'burnt') : f.ph < 0.75 ? 'yellow' : f.heat < 0.8 ? 'hot' : f.hum < 0.8 ? 'dry_air' : f.drain < 0.8 ? 'soil' : f.feed < 0.8 ? 'pale' : 'sad';
    say(v, issue, name);
    return;
  }
  const b = Math.max(0, p.beauty || 0);
  v.sat += 0.015 + b * 0.007;
  if (sp.rare && p.bloom > 0.4) { v.sat += 0.05; say(v, 'rare', name); return; }
  if (!chatty) return;
  if (p.fruit >= 1) say(v, 'fruit', name);
  else if (p.bloom > 0.5 && sp.scent && Math.random() < 0.5) say(v, 'scent', name);
  else if (p.bloom > 0.5) { say(v, 'bloom', name); if (v.look.camera) fxSparkle(p.x + 0.5, p.y + 0.5, '#ffffff'); }
  else if (seasonOf(G.day % DAYS_YEAR) === 2 && sp.fall && p._vs && p._vs.fall > 0.3) say(v, 'autumn', name);
  else if (b > 1) say(v, 'leaves', name);
}

function say(v, kind, sp) {
  const pool = L().vc[kind];
  if (!pool) return;
  let text = pick(pool);
  if (sp) text = text.replace('{p}', noun(sp)).replace('{P}', noun(sp, true)).replace('{n}', spName(sp).toLowerCase());
  if (LANG === 'es') text = fixES(text);
  v.bubble = { text, t: 2.8, kind };
  G.log.unshift({ day: G.day, h: Math.floor(G.hour), text, kind });
  if (G.log.length > 40) G.log.length = 40;
}

// ---------- Dibujo ----------
function visitorItems(items, g) {
  for (const v of VIS.list) items.push({ k: v.state === 'pass' || v.y > GH ? v.x + v.y + 0.3 : v.x + v.y + 0.02, f: () => drawVisitor(g, v) });
}
function drawVisitor(g, v) {
  const [x, y] = P(v.x, v.y), z = cam.z, L0 = v.look, H = L0.h * ZS * z;
  if (x < -40 || x > VW + 40 || y < -100 || y > VH + 100) return;
  const fade = clamp(Math.min(v.x + 1.8, GW + 1.8 - v.x), 0, 1);
  g.globalAlpha = fade;
  const walk = v.moving ? Math.sin((v.t * 26 + v.phase) * (v.look.kid ? 1.3 : 1)) : 0;
  g.fillStyle = 'rgba(20,20,10,0.22)'; g.beginPath(); g.ellipse(x, y, 7 * z, 3.2 * z, 0, 0, TAU); g.fill();
  const sit = v.sitting ? 0.22 * ZS * z : 0, hip = y - H * 0.47 + sit, sh = y - H * 0.8 + sit, head = y - H * 0.89 + sit;
  const lw = Math.max(2, 3.4 * z * (L0.kid ? 0.85 : 1));
  // piernas
  g.strokeStyle = L0.pants; g.lineWidth = lw; g.lineCap = 'round';
  if (v.sitting) { g.beginPath(); g.moveTo(x - 2 * z, hip); g.lineTo(x - 2 * z + v.dir * 6 * z, hip + 1); g.lineTo(x - 2 * z + v.dir * 6 * z, y - 1); g.moveTo(x + 2 * z, hip); g.lineTo(x + 2 * z + v.dir * 6 * z, hip + 1); g.lineTo(x + 2 * z + v.dir * 6 * z, y - 1); g.stroke(); }
  else { g.beginPath(); g.moveTo(x - 1.8 * z, hip); g.lineTo(x - 1.8 * z + walk * 3.5 * z, y - 1); g.moveTo(x + 1.8 * z, hip); g.lineTo(x + 1.8 * z - walk * 3.5 * z, y - 1); g.stroke(); }
  // cuerpo
  g.fillStyle = L0.shirt;
  g.beginPath(); g.roundRect(x - 5 * z * (L0.kid ? 0.8 : 1), sh, 10 * z * (L0.kid ? 0.8 : 1), hip - sh + 2 * z, 4 * z); g.fill();
  if (L0.long) { g.fillStyle = css(shade(L0.shirt, -0.15)); g.beginPath(); g.moveTo(x - 5 * z, hip - 1); g.lineTo(x + 5 * z, hip - 1); g.lineTo(x + 6.5 * z, hip + H * 0.18); g.lineTo(x - 6.5 * z, hip + H * 0.18); g.fill(); }
  // brazos
  g.strokeStyle = css(shade(L0.shirt, -0.08)); g.lineWidth = lw * 0.8;
  g.beginPath(); g.moveTo(x - 4.5 * z, sh + 2 * z); g.lineTo(x - 5.5 * z - walk * 2.5 * z, sh + H * 0.27); g.moveTo(x + 4.5 * z, sh + 2 * z); g.lineTo(x + 5.5 * z + walk * 2.5 * z, sh + H * 0.27); g.stroke();
  if (L0.camera) { g.fillStyle = '#2a2a2a'; g.fillRect(x + v.dir * 4 * z - 2.5 * z, sh + 5 * z, 5 * z, 3.5 * z); }
  if (L0.bag) { g.fillStyle = '#8a6a4a'; g.beginPath(); g.roundRect(x - v.dir * 7 * z - 2.5 * z, hip - 5 * z, 5 * z, 6 * z, 1.5 * z); g.fill(); }
  if (L0.old && !v.sitting) { g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.4 * z; g.beginPath(); g.moveTo(x + v.dir * 7 * z, sh + H * 0.27); g.lineTo(x + v.dir * 8 * z, y); g.stroke(); }
  // cabeza
  const hr = (L0.kid ? 4.4 : 4.8) * z;
  g.fillStyle = L0.skin; g.beginPath(); g.arc(x, head, hr, 0, TAU); g.fill();
  g.fillStyle = L0.hair; g.beginPath(); g.arc(x - v.dir * 0.8 * z, head - 1 * z, hr * 1.02, Math.PI * 0.95, Math.PI * 2.05); g.fill();
  if (L0.long && !L0.hat) { g.fillRect(x - v.dir * hr - (v.dir > 0 ? 1.5 * z : -0), head - 1 * z, 2.5 * z, hr * 1.4); }
  if (L0.hat === 'sun') { g.fillStyle = L0.hatCol; g.beginPath(); g.ellipse(x, head - hr * 0.6, hr * 1.9, hr * 0.55, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(x, head - hr * 0.6, hr * 0.9, Math.PI, TAU); g.fill(); }
  else if (L0.hat === 'cap') { g.fillStyle = L0.hatCol; g.beginPath(); g.arc(x, head - hr * 0.3, hr, Math.PI, TAU); g.fill(); g.fillRect(x + (v.dir > 0 ? 0 : -hr * 1.6), head - hr * 0.4, hr * 1.6, hr * 0.3); }
  else if (L0.hat === 'beret') { g.fillStyle = L0.hatCol; g.beginPath(); g.ellipse(x, head - hr * 0.75, hr * 1.1, hr * 0.45, -0.2, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  if (v.bubble) R.bubbles.push([x, head - hr - 8 * z, v.bubble]);
}

function drawBubble(g, x, y, b) {
  const a = clamp(Math.min(b.t * 3, (2.8 - b.t) * 6), 0, 1);
  if (a <= 0) return;
  g.globalAlpha = a;
  g.font = '600 12px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  const words = b.text.split(' '), lines = [];
  let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > 170 && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  const w = Math.max(...lines.map(l => g.measureText(l).width)) + 16, h = lines.length * 15 + 10;
  const bx = clamp(x - w / 2, 6, VW - w - 6), by = y - h;
  const bad = ['thirsty', 'soggy', 'dark', 'burnt', 'yellow', 'hot', 'dry_air', 'soil', 'pale', 'sad', 'dead', 'pests', 'expensive'].includes(b.kind);
  g.fillStyle = bad ? 'rgba(255,244,232,0.97)' : 'rgba(255,253,246,0.97)';
  g.strokeStyle = bad ? 'rgba(200,110,70,0.6)' : 'rgba(90,110,80,0.35)'; g.lineWidth = 1.2;
  g.beginPath(); g.roundRect(bx, by, w, h, 9); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(x - 5, by + h); g.lineTo(x, by + h + 6); g.lineTo(x + 5, by + h); g.fill();
  g.fillStyle = '#2c3a2e'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, bx + w / 2, by + 12 + i * 15));
  g.globalAlpha = 1;
}
