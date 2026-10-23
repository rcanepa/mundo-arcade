// ===== Pantallas (HTML encima del 3D): portada, garaje, diario, taller, pintura, Bob's, resultados y finales =====
import { L } from './i18n.js';
import { MODELS, UPGRADES, UP_KEYS, COLORS, DECALS, PAINT_PRICE, DECAL_PRICE, CLASS_BET, rivalById } from './data.js';
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
export function shop(app) {
  const T = L().shop, car = G.activeCar(), st = G.carStats(car);
  const rows = UP_KEYS.map(k => {
    const [name, levels] = T.cats[k], lv = car.up[k], max = UPGRADES[k].max, cost = G.upCost(car, k);
    let after = '';
    if (cost != null && k !== 'nitro' && k !== 'susp') { const nx = JSON.parse(JSON.stringify(car)); nx.up[k]++; const e2 = G.carStats(nx).et; after = `<em>${(e2 - st.et).toFixed(2).replace('-0.00', '0.00')} s</em>`; }
    if (k === 'susp' && cost != null) after = `<em>+${Math.round((UPGRADES.susp.lat[lv + 1] / UPGRADES.susp.lat[lv] - 1) * 100)}% ${L().garage.grip.toLowerCase()}</em>`;
    if (k === 'tires' && cost != null && after.includes('0.00')) after = `<em>+${Math.round((UPGRADES.tires.mu[lv + 1] / UPGRADES.tires.mu[lv] - 1) * 100)}% ${L().garage.grip.toLowerCase()}</em>`;
    const pips = Array.from({ length: max + 1 }, (_, i) => `<i class="${i <= lv ? 'on' : ''}"></i>`).join('');
    return `<div class="uprow"><div class="upn"><b>${name}</b><small>${levels[lv]}</small></div><div class="pips">${pips}</div>
      ${cost == null ? `<span class="maxed">${T.max}</span>` : btn('up', `${levels[lv + 1]} · ${money(cost)} ${after}`, { v: k, cls: 'small', off: G.S.money < cost })}</div>`;
  }).join('');
  const rc = G.repairCost(car);
  render(topbar(dateLine()) + `<div class="panel side wide2">
      <h2>${T.title} · ${carName(car)} ${badge(st.cls)}</h2>
      <div class="stats one"><span>${L().garage.et}</span><b>${st.et.toFixed(2)} s</b></div>
      <div class="uplist">${rows}</div>
      <div class="uprow"><div class="upn"><b>${L().garage.cond}</b><small>${Math.round(car.cond * 100)}%</small></div>${car.cond < 0.995 ? btn('fix', T.repair(money(rc)), { cls: 'small', off: G.S.money < rc }) : `<span class="maxed">${T.fine}</span>`}</div>
      <div class="seg">${btn('shift', T.shiftAuto, { v: 1, cls: G.S.autoShift ? 'on' : '' })}${btn('shift', T.shiftManual, { v: 0, cls: G.S.autoShift ? '' : 'on' })}</div>
      <p class="muted small">${T.shiftHint}</p>
      ${btn('back', L().back, { cls: 'go wide' })}</div>`, {
    up: k => { const r = G.buyUpgrade(car, k); if (r) toast(L().paper.money, 'bad'); else { toast(T.bought(T.cats[k][0], T.cats[k][1][car.up[k]]), 'good'); app.refreshGarage(); } shop(app); },
    fix: () => { if (!G.repair(car)) app.refreshGarage(); shop(app); },
    shift: v => { G.S.autoShift = v === '1'; G.save(); shop(app); },
    back: () => garage(app)
  });
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
const pickState = { id: null, type: 'drag', bet: 50, pink: false };
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
  let card = '';
  if (pickState.id && !over) {
    const r = rivalById(pickState.id), rc = G.rivalCar(r), st = G.carStats(rc), P = pickState;
    if (r.king) { P.type = 'road'; P.pink = true; }
    if (P.type === 'drag') P.pink = false;
    const maxBet = Math.min(CLASS_BET[r.cls], G.S.money), bets = [25, 50, 100, 250, 500, 1000, 1500].filter(b => b <= CLASS_BET[r.cls]);
    if (P.bet > maxBet) P.bet = bets.filter(b => b <= maxBet).pop() || 0;
    const why = G.challenge(r, P.type, P.bet, P.pink), W = T.why;
    const reason = !why ? '' : typeof W[why] === 'function' ? W[why](why === 'tooMuch' ? money(CLASS_BET[r.cls]) : r.cls) : W[why];
    const d = st.et - mySt.et, cmp = Math.abs(d) < 0.1 ? T.even : d < 0 ? T.faster((-d).toFixed(2)) : T.slower(d.toFixed(2));
    const line = r.king ? T.kingHi : T.hi[(G.S.day + r.id.length) % T.hi.length];
    card = `<div class="panel rcard"><div class="rhead"><img src="${portrait(r.look, r.shades, 160)}" alt=""><div><h2>${esc(r.name)}</h2><p class="quote">“${line}”</p></div></div>
      <img class="rcar" src="${carPhoto(rc, 360, 190, -0.75)}" alt="">
      <div class="carname">${carName(rc)} ${badge(st.cls)}</div><p class="cmp ${d < -0.1 ? 'bad' : d > 0.1 ? 'good' : ''}">${cmp}</p>
      <div class="seg">${btn('type', '🏁 ' + T.drag, { v: 'drag', cls: P.type === 'drag' ? 'on' : '', off: r.king })}${btn('type', '🛣️ ' + T.road, { v: 'road', cls: P.type === 'road' ? 'on' : '' })}</div>
      ${r.king ? '' : `<label class="lab">${T.bet}</label><div class="seg wrap">${bets.map(b => btn('bet', money(b), { v: b, cls: !P.pink && P.bet === b ? 'on' : '', off: b > G.S.money })).join('')}${P.type === 'road' ? btn('pink', '📄 ' + T.pink, { cls: P.pink ? 'on' : '' }) : ''}</div>`}
      ${r.king ? `<p class="pinknote">📄 ${T.pink}</p>` : ''}
      ${btn('go', T.go, { cls: 'go wide', off: !!why })}${why ? `<p class="why">${reason}</p>` : ''}
      ${btn('unpick', L().back, { cls: 'ghost wide' })}</div>`;
  }
  render(topbar(`${T.title} · ${clock(N.time)}`) + `<div class="panel side bobsp ${card ? 'haspick' : ''}"><h2>${T.title}</h2><small class="muted">${T.tonight} · ${clock(N.time)}</small>
      <div class="rivals">${over ? `<p class="muted">${N.time >= 25 * 60 ? T.closing : T.empty}</p>` : list}</div>
      ${btn('home', '🏠 ' + T.home, { cls: over ? 'go wide' : 'wide' })}</div>${card}`, {
    pick: id => { app.focus(id); bobs(app, id); },
    unpick: () => { pickState.id = null; app.focus(null); bobs(app); },
    type: v => { pickState.type = v; bobs(app); },
    bet: v => { pickState.bet = +v; pickState.pink = false; bobs(app); },
    pink: () => { pickState.pink = !pickState.pink; bobs(app); },
    go: () => app.race(pickState.id, pickState.type, pickState.pink ? 0 : pickState.bet, pickState.pink),
    home: () => app.home()
  });
  app.focus(pickState.id);
}
export function clearPick() { pickState.id = null; }

// ----- resultado de la carrera -----
export function result(app, R, out, rivalName) {
  const T = L().result, TR = L().race, lines = [];
  if (out) {
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
      ${btn('back', out ? T.back : L().back, { cls: 'go wide' })}</div>`, { back: () => app.afterRace() });
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
