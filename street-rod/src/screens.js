// ===== Pantallas (HTML encima del 3D): portada, garaje, diario, taller, pintura, Bob's, resultados y finales =====
import { L } from './i18n.js';
import { MODELS, UPGRADES, UP_KEYS, COLORS, DECALS, PAINT_PRICE, DECAL_PRICE, BETS, CUP, rivalById } from './data.js';
import * as G from './game.js';
import { makeSpec, topSpeed } from './physics.js';
import { carPhoto, portrait } from './photo.js';
import { money } from './util.js';

const $ = id => document.getElementById(id);
let handlers = {};
export function onAction(fn) { document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const h = handlers[b.dataset.a]; if (h) { fn(); h(b.dataset.v, b); } }); }
function render(html, on) { $('ui').innerHTML = html; handlers = on; }
export function toast(text, cls = '') {
  const t = document.createElement('div'); t.className = 'toast ' + cls; t.textContent = text;
  $('toasts').appendChild(t); setTimeout(() => t.classList.add('out'), 2200); setTimeout(() => t.remove(), 2700);
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const carName = car => `'${String(MODELS[car.model].year).slice(2)} ${MODELS[car.model].name}`;
const badge = c => `<span class="cls cls-${c}">${c}</span>`;
const bar = (v, cls = '') => `<i class="bar ${cls}"><b style="width:${Math.round(Math.max(0.04, Math.min(1, v)) * 100)}%"></b></i>`;
const _top = new Map();
const topKmh = car => { const k = JSON.stringify([car.model, car.up, car.cond]); if (!_top.has(k)) _top.set(k, topSpeed(makeSpec(car))); return _top.get(k); };
const btn = (a, label, o = {}) => `<button class="btn ${o.cls || ''}" data-a="${a}" ${o.v !== undefined ? `data-v="${esc(o.v)}"` : ''} ${o.off ? 'disabled' : ''} ${o.title ? `title="${esc(o.title)}"` : ''}>${label}</button>`;
function topbar(extra) {
  const T = L(), S = G.S;
  return `<div class="topbar"><b>${esc(S.name)}</b><span class="money">${money(S.money)}</span><span>${extra}</span></div>`;
}
const dateLine = () => `${L().date(G.dateOf(G.S.day))} · ${L().daysLeft(G.daysLeft())}`;
const clock = t => `${Math.floor(t / 60) % 24}:${String(t % 60).padStart(2, '0')}`;

// ----- portada y lo que cuelga de ella -----
export function title(app) {
  const T = L().title, cont = G.hasSave();
  render(`<div class="panel titlep">
      <h1 class="logo">Street Rod</h1><div class="logosub">${T.sub}</div>
      <div class="menu">
        ${cont ? btn('cont', T.cont, { cls: 'go' }) : ''}
        ${btn('fresh', T.fresh, { cls: cont ? '' : 'go' })}
        ${btn('how', T.how)}${btn('fame', T.fame)}
        <div class="two">${btn('lang', T.lang)}${btn('sound', app.muted() ? T.soundOff : T.soundOn)}</div>
        ${btn('more', T.more, { cls: 'ghost' })}
      </div>
      <p class="credit">${T.credit}</p></div>`, {
    cont: () => app.cont(), fresh: () => (cont ? confirmBox(T.sure, () => app.license(), () => title(app)) : app.license()),
    how: () => how(app, 0), fame: () => fame(app), lang: () => app.toggleLang(), sound: () => { app.toggleSound(); title(app); }, more: () => { location.href = '../index.html'; }
  });
}
export function confirmBox(text, yes, no) {
  const T = L();
  render(`<div class="panel dialog"><p>${esc(text)}</p><div class="row2">${btn('yes', T.yes, { cls: 'go' })}${btn('no', T.no)}</div></div>`, { yes, no });
}
export function license(app) {
  const T = L().license;
  render(`<div class="panel licensep"><div class="lic-top"><small>${T.state}</small><b>${T.title}</b></div>
    <div class="lic-body"><img src="${portrait(['#f4c8a0', '#2a1a10', '#ffffff'], false, 180)}" alt=""><div>
    <label>${T.name}</label><input id="nameIn" maxlength="14" autocomplete="off" placeholder="${T.placeholder}" value="">
    <small>CLASE 3 · 1963</small></div></div>
    <div class="row2">${btn('ok', T.ok, { cls: 'go' })}${btn('back', L().cancel)}</div></div>`, {
    ok: () => app.newGame(($('nameIn').value || '').trim().toUpperCase()), back: () => app.title()
  });
  const inp = $('nameIn'); inp.focus();
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') app.newGame(inp.value.trim().toUpperCase()); });
}
export function pages(list, k, onEnd) {
  const T = L(), p = list[k];
  render(`<div class="panel pagep"><h2>${p[0]}</h2>${p.slice(1).map(x => `<p>${x}</p>`).join('')}
    <div class="row2"><span class="pn">${k + 1}/${list.length}</span>${btn('next', k < list.length - 1 ? T.next : T.ok, { cls: 'go' })}</div></div>`, {
    next: () => (k < list.length - 1 ? pages(list, k + 1, onEnd) : onEnd())
  });
}
export const how = (app, k) => pages(L().how, k, () => app.title());
export function fame(app) {
  const T = L().fame, list = G.fame();
  render(`<div class="panel pagep"><h2>${T.title}</h2>${list.length ? `<ol class="fame">${list.map(f => `<li><b>${esc(f.name)}</b><span>${T.days(f.days)}</span></li>`).join('')}</ol>` : `<p>${T.empty}</p>`}
    <div class="row2"><span></span>${btn('back', L().back, { cls: 'go' })}</div></div>`, { back: () => app.title() });
}

// ----- el garaje -----
export function garage(app) {
  const T = L().garage, car = G.activeCar();
  let info = `<p class="muted">${T.noCar}</p>`;
  if (car) {
    const st = G.carStats(car);
    info = `<div class="carname">${carName(car)} ${badge(st.cls)}</div>
      <div class="stats">
        <span>${T.et}</span><b>${st.et.toFixed(2)} s</b>
        <span>${T.top}</span><b>${Math.round(topKmh(car))} km/h</b>
        <span>${T.grip}</span>${bar((st.mu * st.lat - 0.8) / 0.75)}
        <span>${T.cond}</span>${bar(car.cond, car.cond < 0.8 ? 'warn' : '')}
      </div>${car.cond < 0.8 ? `<p class="warnp">${T.worn}</p>` : ''}`;
  }
  const tr = G.S.trophies || [];
  if (tr.length) info += `<p class="trophies">🏆 ${L().cup.trophies}: ${['D', 'C', 'B', 'A', 'S'].filter(c => tr.includes(c)).map(c => `${c} ×${tr.filter(x => x === c).length}`).join(' · ')}</p>`;
  render(topbar(dateLine()) + `<div class="panel side">
      <h2>${T.title}</h2>${info}
      <div class="grid2">${btn('paper', '📰 ' + T.paper)}${btn('shop', '🔧 ' + T.shop, { off: !car })}${btn('paint', '🎨 ' + T.paint, { off: !car })}${btn('cars', '🚗 ' + T.cars, { off: !G.S.cars.length })}${btn('test', '🏁 ' + T.test, { off: !car })}${btn('menu', T.menu)}</div>
      ${btn('bobs', '🌙 ' + T.bobs, { cls: 'go wide', off: !car })}
    </div>`, {
    paper: () => paper(app), shop: () => shop(app), paint: () => paintShop(app), cars: () => myCars(app), test: () => app.testDrive(), menu: () => app.title(), bobs: () => app.bobs()
  });
}
export function paper(app) {
  const T = L().paper, P = G.S.paper;
  const ads = P.ads.map((ad, i) => {
    const c = ad.car, st = G.carStats(c), extras = c.up.engine || c.up.intake || c.up.tires;
    return `<div class="ad ${ad.sold ? 'sold' : ''}"><img src="${carPhoto(c, 300, 160)}" alt="">
      <div class="adt"><b>${carName(c).toUpperCase()}</b><span class="price">${money(ad.price)}</span></div>
      <small>${T.cond} ${Math.round(c.cond * 100)}% · ${T.lines[ad.line]}${extras ? ' · ' + T.upgrades : ''}</small>
      <div class="adb">${badge(st.cls)}<span class="et">${st.et.toFixed(2)} s</span>
      ${ad.sold ? `<span class="stamp">${T.sold}</span>` : btn('buy', T.buy(money(ad.price)), { v: i, cls: 'small go', off: G.S.money < ad.price }) + btn('offer', T.offer, { v: i, cls: 'small', off: ad.haggled })}</div></div>`;
  }).join('');
  render(topbar(dateLine()) + `<div class="panel paperp"><div class="mast">${T.title}</div><div class="dateline">${L().date(G.dateOf(G.S.day))}, 1963 · 10¢</div>
      <h3>${T.sub}</h3><div class="ads">${ads}</div><div class="row2"><span></span>${btn('back', L().close, { cls: 'go' })}</div></div>`, {
    buy: v => { const ad = P.ads[+v], r = G.buyCar(+v, ad.price); if (r) toast(T[r] || r, 'bad'); else { toast(T.bought(carName(ad.car)), 'good'); app.refreshGarage(); } paper(app); },
    offer: v => { const r = G.haggle(+v); toast(r ? T.deal(money(r)) : T.noDeal, r ? 'good' : 'bad'); paper(app); },
    back: () => garage(app)
  });
}
// El taller: el auto en 3D muestra la pieza elegida (con el capó abierto para el motor), y el panel compara antes y después
const SHOP_ICON = { engine: '⚙️', intake: '🌀', exhaust: '💨', trans: '🕹️', tires: '◎', susp: '📐', weight: '⚖️', nitro: '🧪' };
const SHOP_VIEW = { engine: 'engine', intake: 'engine', nitro: 'engine', exhaust: 'rear', trans: 'side', tires: 'wheel', susp: 'side', weight: 'side' };
let shopCat = 'engine';
export function shop(app, cat) {
  if (cat) shopCat = cat;
  const T = L().shop, B = T.bars, car = G.activeCar(), st = G.carStats(car), k = shopCat;
  const [name, levels] = T.cats[k], lv = car.up[k], cost = G.upCost(car, k);
  const nx = cost == null ? null : JSON.parse(JSON.stringify(car));
  if (nx) nx.up[k]++;
  const s2 = nx ? G.carStats(nx) : null;
  // las barras: ahora, y en verde lo que se gana con la mejora elegida
  const fr = {
    accel: c => (19 - G.carStats(c).et) / 9, top: c => (topKmh(c) - 140) / 140,
    grip: c => { const q = G.carStats(c); return (q.mu * q.lat - 0.8) / 0.75; }, weight: c => (2150 - G.carStats(c).mass) / 1050
  };
  const val = { accel: c => G.carStats(c).et.toFixed(2) + ' s', top: c => Math.round(topKmh(c)) + ' km/h', grip: c => { const q = G.carStats(c); return Math.round(q.mu * q.lat * 100) + '%'; }, weight: c => Math.round(G.carStats(c).mass) + ' kg' };
  const cl = v => Math.max(0.03, Math.min(1, v));
  const bars = Object.keys(fr).map(b => {
    const a = cl(fr[b](car)), z = nx ? cl(fr[b](nx)) : a, gain = z > a + 0.004;
    return `<span>${B[b]}</span><i class="bar2"><b style="width:${Math.round(a * 100)}%"></b>${gain ? `<u style="left:${Math.round(a * 100)}%;width:${Math.round((z - a) * 100)}%"></u>` : ''}</i>
      <em class="${gain ? 'up' : ''}">${val[b](car)}${gain ? ` → ${val[b](nx)}` : ''}</em>`;
  }).join('');
  const tiles = UP_KEYS.map(c => {
    const l = car.up[c], max = UPGRADES[c].max;
    const pips = Array.from({ length: max + 1 }, (_, i) => `<i class="${i <= l ? 'on' : ''}"></i>`).join('');
    return `<button class="tile ${c === k ? 'on' : ''}" data-a="cat" data-v="${c}"><span class="ic">${SHOP_ICON[c]}</span><b>${T.cats[c][0]}</b><small>${T.cats[c][1][l]}</small><span class="pips">${pips}</span></button>`;
  }).join('');
  const rc = G.repairCost(car);
  render(topbar(dateLine()) + `<div class="panel side shop2">
      <h2>${T.title} · ${carName(car)} ${badge(st.cls)}${s2 && s2.cls !== st.cls ? ` → ${badge(s2.cls)}` : ''}</h2>
      <div class="sbars">${bars}</div>
      <div class="tiles">${tiles}</div>
      <div class="detail">
        <div class="dh"><span class="ic big">${SHOP_ICON[k]}</span><div><b>${name}: ${levels[lv]}</b>${nx ? `<small>→ ${levels[lv + 1]}</small>` : ''}</div></div>
        <p>${T.desc[k][nx ? lv + 1 : lv]}</p>
        ${cost == null ? `<span class="maxed">${T.max}</span>` : btn('up', T.upgrade(money(cost)), { cls: 'go wide', off: G.S.money < cost })}
      </div>
      <div class="uprow"><div class="upn"><b>${L().garage.cond}</b><small>${Math.round(car.cond * 100)}%</small></div><div></div>${car.cond < 0.995 ? btn('fix', T.repair(money(rc)), { cls: 'small', off: G.S.money < rc }) : `<span class="maxed">${T.fine}</span>`}</div>
      <div class="seg">${btn('shift', T.shiftAuto, { v: 1, cls: G.S.autoShift ? 'on' : '' })}${btn('shift', T.shiftManual, { v: 0, cls: G.S.autoShift ? '' : 'on' })}</div>
      ${btn('back', L().back, { cls: 'ghost wide' })}</div>`, {
    cat: c => shop(app, c),
    up: () => { const r = G.buyUpgrade(car, k); if (r) return toast(L().paper.money, 'bad'); app.refreshGarage(); app.upgraded(); toast(T.bought(name, levels[car.up[k]]), 'good'); shop(app); },
    fix: () => { if (!G.repair(car)) app.refreshGarage(); shop(app); },
    shift: v => { G.S.autoShift = v === '1'; G.save(); shop(app); },
    back: () => { app.shopView(null); garage(app); }
  });
  app.shopView(SHOP_VIEW[k]);
}
export function paintShop(app) {
  const T = L().paint, car = G.activeCar();
  const sw = COLORS.map(c => `<button class="swatch ${car.color === c ? 'on' : ''}" data-a="color" data-v="${c}" style="background:${c}"></button>`).join('');
  const dc = DECALS.map(d => btn('decal', T.names[d], { v: d, cls: car.decal === d ? 'on' : '' })).join('');
  render(topbar(dateLine()) + `<div class="panel side">
      <h2>${T.title} · ${carName(car)}</h2>
      <label class="lab">${T.colors(money(PAINT_PRICE))}</label><div class="swatches">${sw}</div>
      <label class="lab">${T.decals(money(DECAL_PRICE))}</label><div class="seg wrap">${dc}</div>
      ${btn('back', L().back, { cls: 'go wide' })}</div>`, {
    color: c => { if (G.paint(car, c)) toast(L().paper.money, 'bad'); app.refreshGarage(); paintShop(app); },
    decal: d => { if (G.decal(car, d)) toast(L().paper.money, 'bad'); app.refreshGarage(); paintShop(app); },
    back: () => garage(app)
  });
}
export function myCars(app) {
  const T = L().cars;
  const list = G.S.cars.map(c => {
    const st = G.carStats(c), act = c.id === G.S.active;
    return `<div class="ad mine ${act ? 'act' : ''}"><img src="${carPhoto(c, 300, 160)}" alt=""><div class="adt"><b>${carName(c)}</b>${badge(st.cls)}</div>
      <small>${st.et.toFixed(2)} s · ${L().garage.cond} ${Math.round(c.cond * 100)}%</small>
      <div class="adb">${act ? `<span class="tag">${T.active}</span>` : btn('use', T.use, { v: c.id, cls: 'small go' })}${btn('sell', T.sell(money(G.sellPrice(c))), { v: c.id, cls: 'small' })}</div></div>`;
  }).join('');
  render(topbar(dateLine()) + `<div class="panel paperp"><h2>${T.title}</h2><div class="ads">${list}</div><div class="row2"><span></span>${btn('back', L().back, { cls: 'go' })}</div></div>`, {
    use: id => { G.S.active = +id; G.save(); app.refreshGarage(); myCars(app); },
    sell: id => { const c = G.S.cars.find(x => x.id === +id); confirmBox(T.sure(carName(c), money(G.sellPrice(c))), () => { toast(T.sold(money(G.sellCar(+id))), 'good'); app.refreshGarage(); if (G.S.over) app.ending(); else garage(app); }, () => myCars(app)); },
    back: () => garage(app)
  });
}

// ----- Bob's Drive-In -----
const pickState = { id: null, type: 'drag', bet: 25, pink: false };
export function bobs(app, sel) {
  const T = L().bobs, N = G.S.night, me = G.activeCar();
  if (sel !== undefined) { pickState.id = sel; pickState.pink = false; }
  if (pickState.id && !N.present.includes(pickState.id)) pickState.id = null;
  const mySt = me ? G.carStats(me) : null;
  const list = N.present.map(id => {
    const r = rivalById(id), st = G.carStats(G.rivalCar(r)), rec = G.S.rivals[id];
    return `<button class="rival ${pickState.id === id ? 'on' : ''}" data-a="pick" data-v="${id}"><img src="${portrait(r.look, r.shades, 96)}" alt="">
      <span><b>${esc(r.name)}</b>${r.king ? `<em class="king">${T.king}</em>` : r.boss ? `<em class="boss">${T.boss}</em>` : ''}<small>${carName(G.rivalCar(r))} ${badge(st.cls)}</small><small>${T.record(rec.w, rec.l)}</small></span></button>`;
  }).join('');
  const over = G.nightOver() || !N.present.length;
  // la copa de los sábados
  const CT = L().cup, cs = G.cupStatus();
  let cup = '';
  if (cs !== 'closed' && me) {
    const cls = G.cupClass(), C = CUP[cls];
    cup = `<div class="cupbox"><b>🏆 ${CT.title}</b><small>${CT.tonight(cls)}</small><small>${CT.terms(money(C.fee), money(C.prize))}</small>
      ${cs ? `<small class="why">${CT.why[cs] || ''}</small>` : btn('cup', CT.enter, { cls: 'go small' })}</div>`;
  }
  let card = '';
  if (pickState.id && !over) {
    const r = rivalById(pickState.id), rc = G.rivalCar(r), st = G.carStats(rc), P = pickState;
    if (r.king) { P.type = 'road'; P.pink = true; }
    if (P.type === 'drag') P.pink = false;
    const top = G.maxBet(r), pinkOk = G.acceptsPink(r);
    const bets = BETS.filter(b => b <= top);
    if (!P.pink && P.bet > Math.min(top, G.S.money)) P.bet = bets.filter(b => b <= G.S.money).pop() || 0;
    const why = G.challenge(r, P.type, P.bet, P.pink), W = T.why;
    const reason = !why ? '' : typeof W[why] === 'function' ? W[why](why === 'tooMuch' ? money(top) : r.cls) : W[why];
    const d = st.et - mySt.et, cmp = Math.abs(d) < 0.1 ? T.even : d < 0 ? T.faster((-d).toFixed(2)) : T.slower(d.toFixed(2));
    const line = r.king ? T.kingHi : T.hi[(G.S.day + r.id.length) % T.hi.length];
    const terms = r.king ? '' : `<p class="terms">${T.terms(T.both, top ? money(top) : 0, pinkOk)}</p>`;
    card = `<div class="panel rcard"><div class="rhead"><img src="${portrait(r.look, r.shades, 160)}" alt=""><div><h2>${esc(r.name)}</h2><p class="quote">“${line}”</p></div></div>
      <img class="rcar" src="${carPhoto(rc, 360, 190, -0.75)}" alt="">
      <div class="carname">${carName(rc)} ${badge(st.cls)}</div><p class="cmp ${d < -0.1 ? 'bad' : d > 0.1 ? 'good' : ''}">${cmp}</p>${terms}
      <div class="seg">${btn('type', '🏁 ' + T.drag, { v: 'drag', cls: P.type === 'drag' ? 'on' : '', off: r.king })}${btn('type', '🛣️ ' + T.road, { v: 'road', cls: P.type === 'road' ? 'on' : '' })}</div>
      ${r.king ? `<p class="pinknote">📄 ${T.pink}</p>` : `<label class="lab">${T.bet}</label><div class="seg wrap">
        ${btn('bet', T.honor, { v: 0, cls: !P.pink && P.bet === 0 ? 'on' : '' })}
        ${bets.map(b => btn('bet', money(b), { v: b, cls: !P.pink && P.bet === b ? 'on' : '', off: b > G.S.money })).join('')}
        ${P.type === 'road' ? btn('pink', '📄 ' + T.pink, { cls: P.pink ? 'on' : '', off: !pinkOk }) : ''}</div>`}
      ${btn('go', T.go, { cls: 'go wide', off: !!why })}${why ? `<p class="why">${reason}</p>` : ''}
      ${btn('unpick', L().back, { cls: 'ghost wide' })}</div>`;
  }
  render(topbar(`${T.title} · ${clock(N.time)}`) + `<div class="panel side bobsp ${card ? 'haspick' : ''}"><h2>${T.title}</h2><small class="muted">${T.tonight} · ${clock(N.time)}</small>
      ${over ? '' : cup}
      <div class="rivals">${over ? `<p class="muted">${N.time >= 25 * 60 ? T.closing : T.empty}</p>` : list}</div>
      ${btn('home', '🏠 ' + T.home, { cls: over ? 'go wide' : 'wide' })}</div>${card}`, {
    pick: id => { app.focus(id); bobs(app, id); },
    unpick: () => { pickState.id = null; app.focus(null); bobs(app); },
    type: v => { pickState.type = v; bobs(app); },
    bet: v => { pickState.bet = +v; pickState.pink = false; bobs(app); },
    pink: () => { pickState.pink = !pickState.pink; bobs(app); },
    go: () => app.race(pickState.id, pickState.type, pickState.pink ? 0 : pickState.bet, pickState.pink),
    cup: () => app.cup(),
    home: () => app.home()
  });
  app.focus(pickState.id);
}
export function clearPick() { pickState.id = null; }
// Un rival se acerca a desafiarte
export function offer(app, p) {
  const T = L().offer, r = rivalById(p.id), rc = G.rivalCar(r), st = G.carStats(rc);
  const box = document.createElement('div');
  box.className = 'panel offerp';
  box.innerHTML = `<div class="rhead"><img src="${portrait(r.look, r.shades, 120)}" alt=""><div><small class="muted">${T.comes(esc(r.name))}</small>
    <h2>“${T[p.type](p.bet ? money(p.bet) : 0)}”</h2><small>${carName(rc)} ${badge(st.cls)}</small></div></div>
    <div class="row2"><button class="btn go" data-o="yes">${T.yes}</button><button class="btn" data-o="no">${T.no}</button></div>`;
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-o]'); if (!b) return;
    box.remove();
    if (b.dataset.o === 'yes') app.race(p.id, p.type, p.bet, false);
  });
  $('ui').appendChild(box);
  app.focus(p.id);
}

// ----- resultado de la carrera -----
export function result(app, R, out, rivalName, cup) {
  const T = L().result, TR = L().race, CT = L().cup, lines = [];
  if (cup) {
    if (!cup.done) lines.push(CT.passed(cup.round + 1));
    else if (cup.champion) lines.push(CT.champion(cup.cls, money(cup.prize)));
    else if (cup.prize) lines.push(CT.second(money(cup.prize)));
    else lines.push(CT.out);
  }
  if (out) {
    if (!out.money && !out.gotCar && !out.lostCar) lines.push(R.win ? T.honorWin : T.honorLose);
    if (out.money > 0) lines.push(T.money(money(out.money)));
    if (out.money < 0) lines.push(T.lose(money(-out.money)));
    if (out.gotCar && out.sold) lines.push(T.soldCar(carName(out.gotCar), money(out.sold)));
    else if (out.gotCar) lines.push(T.gotCar(carName(out.gotCar)));
    if (out.lostCar) lines.push(T.lostCar(carName(out.lostCar)));
    if (out.unlocked && out.unlocked !== 'S') lines.push(T.unlocked(out.unlocked));
    if (out.unlocked === 'S') lines.push(T.kingNow);
  }
  render(`<div class="panel resultp"><h2 class="${R.win ? 'win' : 'lose'}">${R.title}</h2>
      <table><thead><tr><th></th><th>${TR.you}</th><th>${esc(rivalName || '')}</th></tr></thead><tbody>${R.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}</tbody></table>
      ${lines.map(l => `<p class="resline">${l}</p>`).join('')}
      ${btn('back', cup && !cup.done ? CT.next : out || cup ? T.back : L().back, { cls: 'go wide' })}</div>`, { back: () => app.afterRace() });
}
export function ending(app) {
  const S = G.S, E = L().end[S.over] || L().end.summer;
  render(`<div class="panel endp"><h1 class="${S.over === 'king' ? 'win' : ''}">${E[0]}</h1><p>${E[1](esc(S.name))}</p><p class="muted">${L().end.stats(S.stats.wins, S.stats.losses, S.day + 1)}</p>
    ${btn('menu', L().ok, { cls: 'go wide' })}</div>`, { menu: () => { G.clearSave(); app.title(); } });
}
export function pause(app) {
  const T = L().pause;
  render(`<div class="panel dialog"><p>${T.title}</p><div class="row2">${btn('resume', T.resume, { cls: 'go' })}${btn('quit', T.quit)}</div></div>`, {
    resume: () => app.resume(), quit: () => app.quitRace()
  });
}
export function clear() { render('', {}); }
