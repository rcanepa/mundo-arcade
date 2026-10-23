// ===== La pantalla de la carrera: tacómetro, cambio, velocidad, árbol de largada, tiempos y avisos =====
import { L } from './i18n.js';
import { fmt, LAPS } from './race.js';
import { clamp } from './util.js';

const $ = id => document.getElementById(id);
const LAUNCH = [0.4, 0.68];     // vueltas ideales para largar (fracción del corte)
let tachMax = 7000;
const pills = new Map();

export function buildHud(race) {
  const sp = race.me.v.spec;
  tachMax = Math.ceil(sp.red / 1000 + 1) * 1000;
  const A = v => (-135 + 270 * v / tachMax) * Math.PI / 180, P = (v, r) => [100 + r * Math.sin(A(v)), 100 - r * Math.cos(A(v))];
  let s = '<defs><radialGradient id="tg" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#1e2236"/><stop offset="1" stop-color="#090a12"/></radialGradient></defs>';
  s += '<circle cx="100" cy="100" r="96" fill="url(#tg)" stroke="rgba(255,255,255,0.18)" stroke-width="2"/>';
  const arc = (a, b, color, id, op = 0.9) => { const [x0, y0] = P(a, 84), [x1, y1] = P(b, 84); return `<path ${id ? `id="${id}"` : ''} d="M${x0} ${y0} A84 84 0 0 1 ${x1} ${y1}" stroke="${color}" stroke-width="7" fill="none" opacity="${op}"/>`; };
  s += arc(sp.red, tachMax, '#ff3434');
  s += arc(sp.red * LAUNCH[0], sp.red * LAUNCH[1], '#3cff6a', 'launchZone', 0);
  for (let v = 0; v <= tachMax; v += 500) {
    const big = v % 1000 === 0, [a, b] = P(v, 88), [c, d] = P(v, big ? 74 : 80);
    s += `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${v >= sp.red ? '#ff6a6a' : '#e8e2d4'}" stroke-width="${big ? 3 : 1.5}"/>`;
    if (big) { const [tx, ty] = P(v, 62); s += `<text x="${tx}" y="${ty + 5}" fill="#e8e2d4" font-size="14" font-weight="700" text-anchor="middle">${v / 1000}</text>`; }
  }
  s += '<text x="100" y="168" fill="#e8e2d4" opacity="0.5" font-size="9" text-anchor="middle" letter-spacing="2">RPM ×1000</text>';
  s += '<g id="needle"><line x1="100" y1="112" x2="100" y2="24" stroke="#ff5a3c" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="100" r="9" fill="#2a2d36" stroke="#ff5a3c" stroke-width="2"/></g>';
  $('tach').innerHTML = s;
  $('treeHud').classList.toggle('hidden', race.kind !== 'drag');
  $('prog').classList.toggle('hidden', race.kind !== 'drag');
  $('nitro').classList.toggle('hidden', !sp.nitro);
  $('keys').innerHTML = L().keys[race.kind === 'drag' ? 'drag' : 'road'];
  for (const el of pills.values()) el.remove();
  pills.clear();
}
function pill(i, label, value) {
  let el = pills.get(i);
  if (!el) { el = document.createElement('div'); el.className = 'pill'; el.innerHTML = '<small></small><b></b>'; pills.set(i, el); $('top').appendChild(el); }
  if (el.firstChild.textContent !== label) el.firstChild.textContent = label;
  if (el.lastChild.textContent !== value) el.lastChild.textContent = value;
}
export function updateHud(race, rivalName) {
  const T = L().race, v = race.me.v, sp = v.spec, q = v.rpmShown / tachMax;
  $('needle').setAttribute('transform', `rotate(${(-135 + 270 * q).toFixed(1)} 100 100)`);
  $('speed').firstChild.textContent = Math.round(v.speed * 3.6);
  $('gear').textContent = v.reversing ? 'R' : v.shiftT > 0 ? '·' : String(v.gear);
  const r = v.rpm / sp.red, inZone = r >= LAUNCH[0] && r <= LAUNCH[1];
  $('launchZone').setAttribute('opacity', v.hold ? (inZone ? 1 : 0.45) : 0);
  $('shiftLight').className = v.hold ? (inZone ? 'on' : r > LAUNCH[1] ? 'lim' : '') : v.limiter > 0 ? 'lim' : (sp.manual && r > 0.86 ? 'on' : r > 0.75 ? 'warn' : '');
  $('nitro').lastChild.textContent = v.nitroT > 0 ? '!' : String(v.nitroLeft);
  const t = race.goT === null ? 0 : race.t - race.goT;
  if (race.kind === 'drag') {
    pill(0, T.time, race.goT === null ? '0.000' : (race.me.done ? race.me.finishT - race.goT : t).toFixed(3));
    pill(1, T.rt, race.me.rt == null ? '—' : race.me.rt < 0 ? T.foulShort : race.me.rt.toFixed(3));
    if (rivalName) pill(2, rivalName, race.rv.rt == null ? '—' : race.rv.rt.toFixed(3));
    const f = r2 => clamp((r2.v.z - r2.startZ) / 402.3, 0, 1) * 100;
    $('pMe').style.left = f(race.me) + '%'; $('pRv').style.left = f(race.rv) + '%';
    const tr = $('treeHud').children, k = race.t - race.treeAt;
    tr[0].classList.toggle('on', race.t > 0.4); tr[1].classList.toggle('on', race.t > 1.0);
    for (let i = 0; i < 3; i++) tr[2 + i].classList.toggle('on', race.goT === null && k >= i * 0.5);
    tr[5].classList.toggle('on', race.goT !== null && !race.foul); tr[6].classList.toggle('on', race.foul);
  } else if (race.kind === 'road') {
    const meFirst = race.me.done || race.rv.done ? race.me.done && (!race.rv.done || race.me.finishT <= race.rv.finishT) : race.me.prog >= race.rv.prog;
    pill(0, T.lapL, Math.min(LAPS, Math.max(1, race.me.lap + 1)) + '/' + LAPS);
    pill(1, T.pos, meFirst ? '1°' : '2°');
    pill(2, T.time, fmt(race.me.done ? race.me.finishT - race.goT : t));
  } else {
    pill(0, T.lapL, fmt(race.t - (race.me.lap === 0 ? race.goT : race.me.lapStart)));
    pill(1, T.best, race.me.best ? fmt(race.me.best) : '—');
  }
  const m = race.msg, el = $('msg');
  if (m && m.until > race.t) { if (el.textContent !== m.text) el.textContent = m.text; el.className = m.cls; el.style.opacity = 1; } else el.style.opacity = 0;
}
