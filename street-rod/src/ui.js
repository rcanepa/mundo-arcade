// ===== Pantallas: portada, garaje, diario, taller, pintura, bencinera, drive-in, resultados y final =====
// Dentro del sitio de juegos se muestra "Más juegos"; en la copia descargada no
const IN_SITE = /\/street-rod\/(index\.html)?$/.test(location.pathname);
const uiEl = document.getElementById('ui'), toastEl = document.getElementById('toast');

const Game = {
  scene: 'title', t: 0, modal: null, race: null, raceOpts: null, out: null, outDone: false,
  paperTab: 'cars', shopOnly: true, chal: null, answer: null, rivalX: 1600, rivalTarget: 950, leaving: false, arriveT: 0,
  pumping: false, pump: { gal: 0, cost: 0, tick: 0 }, toastT: 0,

  go(scene) {
    this.scene = scene; this.modal = null;
    Mech.queue.length = 0; Mech.hover = null;
    Sound.stopEngines();
    const music = { title: 'title', garage: 'garage', paper: 'garage', shop: 'garage', body: 'garage', gas: 'garage', diner: 'diner', race: null, result: null, end: S && S.over === 'king' ? 'win' : 'diner' }[scene];
    Sound.setMusic(music === undefined ? null : music);
    UI.render();
  },
  toast(text, t = 2.6) { this.toastT = t; toastEl.textContent = text; toastEl.hidden = false; },

  // ----- el drive-in -----
  arrive() {
    const cur = nextRival();
    this.chal = null; this.answer = null; this.leaving = false;
    if (cur) { this.rivalX = 1650; this.arriveT = this.t; Sound.sfx.horn(); }
    saveGame(); UI.render();
  },
  startRace() {
    const c = this.chal;
    this.raceOpts = raceOptions(S.night.cur.id, c.type, c.bet);
    this.race = new Race(this.raceOpts);
    this.go('race');
  },
  finishRace() {
    if (!this.race || !this.race.result) return;
    this.out = applyResult(this.raceOpts, this.race.result);
    this.outDone = !this.out.crash;
    this.go('result');
  },
  afterResult() {
    const out = this.out;
    this.race = null;
    if (S.over) return this.go('end');
    if (out && out.jail) { endNight(); this.toast(L().result.jail, 5); return this.go('garage'); }
    const car = activeCar();
    if (!S.night || !car || !carRuns(car) || car.fuel <= 0.3) { if (S.night) endNight(); return this.go(S.over ? 'end' : 'garage'); }
    this.go('diner'); this.arrive();
  }
};

// ----- Pedacitos de HTML -----
const pct = v => Math.round(clamp(v, 0, 1) * 100);
const barCls = v => (v > 0.66 ? '' : v > 0.33 ? 'mid' : 'low');
const speedTxt = v => (LANG === 'es' ? `${Math.round(v * 3.6)} km/h` : `${Math.round(v * 2.237)} mph`);
function topbar(extra = '') {
  const d = dateOf(S.day), H = L().hud;
  const kb = Array.from({ length: KING_WINS }, (_, i) => `<i class="${i < S.wins ? 'on' : ''}"></i>`).join('');
  return `<div class="topbar">
    <div class="pill">📅 ${esc(L().date(d))}</div>
    <div class="pill money">💵 <b>${money(S.money)}</b></div>
    <div class="pill">🏆 ${H.wins} <b>${S.wins}</b></div>
    <div class="pill" title="${esc(H.king)}">👑 <span class="kingbar">${kb}</span></div>
    ${extra}<div class="grow"></div>
    <button class="pill" data-a="music">${Sound.musicOn ? '🎵' : '🔇'}</button>
  </div>`;
}
function probText(p) { const P = L().probs; return P[p] || P[p.split(':')[0]] || p; }

const UI = {
  render() {
    const s = Game.scene;
    let html = '';
    if (s === 'title') html = this.title();
    else if (s === 'garage') html = this.garage();
    else if (s === 'paper') html = this.paper();
    else if (s === 'shop') html = this.shop();
    else if (s === 'body') html = this.body();
    else if (s === 'gas') html = this.gas();
    else if (s === 'diner') html = this.diner();
    else if (s === 'result') html = this.result();
    else if (s === 'end') html = this.end();
    if (Game.modal === 'license') html += this.license();
    else if (Game.modal === 'how') html += this.how();
    else if (Game.modal === 'cars') html += this.cars();
    else if (Game.modal === 'pause') html += this.pause();
    uiEl.innerHTML = html;
    if (s === 'shop') this.drawDyno();
    const inp = uiEl.querySelector('input[name=name]');
    if (inp) { inp.focus(); inp.select && inp.select(); }
  },

  // ----- Portada -----
  title() {
    const M = L().menu;
    return `<div class="titlemenu">
      ${hasSave() ? `<button class="btn big" data-a="cont">▶ ${M.cont}</button>` : ''}
      <button class="btn ${hasSave() ? 'ghost' : 'big'}" data-a="new">${M.fresh}</button>
      <button class="btn teal" data-a="how">${M.how}</button>
      <div class="row"><button class="btn dark" data-a="lang">${M.lang}</button><button class="btn dark" data-a="music">${M.music(Sound.musicOn)}</button></div>
      ${IN_SITE ? `<button class="btn dark" data-a="more">${M.more}</button>` : ''}
    </div>`;
  },
  license() {
    const look = { skin: '#f1c7a5', hair: 'pomp', hc: '#5a3a24', top: '#2a3a5c', collar: 1 };
    return `<div class="dim"><div class="panel license">
      <button class="x" data-a="close">×</button>
      <div class="story">${L().intro.map(p => `<p>${esc(p)}</p>`).join('')}</div>
      <div class="card">
        <div class="hd"><span>${L().state}</span><span>${L().license}</span></div>
        <div class="bd">
          <img src="${portraitURL(look, 64)}" alt="">
          <div>
            <label>${L().yourName}</label>
            <input name="name" maxlength="14" value="${esc(L().defaultName)}" autocomplete="off" spellcheck="false">
            <div class="fields"><span>N° C-196300</span><span>1946</span><span>CLASE 3</span></div>
            <div class="sig" id="sig">${esc(L().defaultName)}</div>
          </div>
        </div>
      </div>
      <div class="go"><button class="btn big" data-a="start">${L().start}</button></div>
    </div></div>`;
  },
  how() {
    return `<div class="dim"><div class="panel how">
      <button class="x" data-a="close">×</button>
      <h2>${L().menu.how}</h2>
      <div class="rows">${L().how.map(([i, t, p]) => `<div class="r"><span>${i}</span><div><b>${esc(t)}</b><p>${esc(p)}</p></div></div>`).join('')}</div>
    </div></div>`;
  },

  // ----- Garaje -----
  garage() {
    const G = L().garage, car = activeCar();
    let side = '', bubble = '', hint = '';
    if (car) {
      const st = carStats(car), q = carET(car), probs = carProblems(car);
      const runs = !probs.filter(p => p !== 'fuel').length;
      const cond = [[G.cond.engine, car.p.engine ? car.p.engine.c : 0], [G.cond.trans, car.p.trans ? car.p.trans.c : 0], [G.cond.tires, car.p.tires ? car.p.tires.c : 0], [G.cond.body, car.body]];
      const fixes = [];
      if (car.p.engine && car.p.engine.c < 0.95) fixes.push(`<button class="btn small teal" data-a="rebuild" ${S.money < engineRebuildCost(car) ? 'disabled' : ''}>${G.rebuild(engineRebuildCost(car))}</button>`);
      if (car.p.trans && car.p.trans.c < 0.95) fixes.push(`<button class="btn small teal" data-a="rebuildT" ${S.money < transRebuildCost(car) ? 'disabled' : ''}>${G.rebuildT(transRebuildCost(car))}</button>`);
      if (car.body < 0.97 && canRepair(car)) fixes.push(`<button class="btn small teal" data-a="fixbody" ${S.money < repairCost(car) ? 'disabled' : ''}>${G.fixBody(repairCost(car))}</button>`);
      side = `<div class="panel side">
        <h3>${esc(carName(car))}</h3>
        <div class="sub">${car.p.engine ? esc(ENGINES[car.p.engine.k].name) : '—'} · ${car.p.trans ? esc(L().parts.transType[car.p.trans.k]) : '—'}</div>
        <div class="stats">
          <div class="stat"><small>${G.stats.hp}</small><b>${runs ? Math.round(st.hp) + ' hp' : '—'}</b></div>
          <div class="stat"><small>${G.stats.et}</small><b>${runs ? q.et.toFixed(1) + ' s' : '—'}</b></div>
          <div class="stat"><small>${G.stats.top}</small><b>${runs ? speedTxt(topSpeed(st)) : '—'}</b></div>
          <div class="stat"><small>${G.stats.lb}</small><b>${Math.round(st.lb - DRIVER_LB).toLocaleString('en-US')} lb</b></div>
          <div class="stat"><small>${G.stats.value}</small><b>${money(carValue(car))}</b></div>
          <div class="stat"><small>${G.stats.fuel}</small><b>${car.fuel.toFixed(1)} / ${TANK} gal</b></div>
        </div>
        <div class="bars">${cond.map(([n, v]) => `<div class="bar"><span>${n}</span><i><em class="${barCls(v)}" style="width:${pct(v)}%"></em></i><span>${pct(v)}%</span></div>`).join('')}</div>
        ${probs.length ? `<div class="probs">${[...new Set(probs.map(probText))].map(t => `<div>⚠️ ${esc(t)}</div>`).join('')}</div>` : ''}
        ${fixes.length ? `<div class="fixes">${fixes.join('')}</div>` : ''}
      </div>`;
      if (car.fuel < 3) hint = L().gas.title + ': ' + car.fuel.toFixed(1) + ' gal';
    } else bubble = `<div class="panel bubble">🗞️ ${esc(G.noCar)}</div>`;
    if (!hint && isSaturday(S.day) && S.wins >= KING_WINS && !S.kingBeaten) hint = '👑 ' + L().diner.kingSat;
    else if (!hint && S.wins < KING_WINS && S.wins > 0) hint = '👑 ' + L().diner.kingNotYet(kingNeeds());
    const runs = car && carRuns(car) && car.fuel > 0.6;
    const act = (a, icon, label, sub, o = '') => `<button class="act ${o}" data-a="${a}"><span>${icon}</span><b>${label}</b><small>${sub}</small></button>`;
    return topbar() + (hint ? `<div class="hint">${esc(hint)}</div>` : '') + side + bubble + `<div class="actions">
      ${act('paper', '🗞️', G.paper, G.paperSub, car ? '' : 'hot')}
      ${act('shop', '🔧', G.shop, G.shopSub)}
      ${act('body', '🎨', G.body, G.bodySub)}
      ${act('gas', '⛽', G.gas, G.gasSub)}
      ${act('cars', '🚗', G.cars, G.carsSub)}
      ${act('diner', '🌙', G.diner, G.dinerSub, runs ? 'hot' : '')}
      ${act('sleep', '😴', G.sleep, G.sleepSub)}
    </div>`;
  },

  // ----- El diario -----
  paper() {
    const P = L().paper, pp = S.paper, d = dateOf(S.day), car = activeCar();
    const heads = pp.headlines.map(headlineText);
    const news = `<div class="news"><div class="lead"><h4>${esc(heads[0] || '')}</h4></div><div><h4>${esc(heads[1] || '')}</h4></div><div><h4>${esc(heads[2] || '')}</h4></div></div>`;
    const tab = (k, label) => `<button class="${Game.paperTab === k ? 'on' : ''}" data-a="tab" data-tab="${k}">${label}</button>`;
    let body = '';
    if (Game.paperTab === 'cars') {
      body = `<div class="ads">${pp.ads.map((ad, i) => {
        const c = ad.car, M = MODELS[c.model], st = carStats(c);
        const cw = P.good[c.body > 0.85 ? 0 : c.body > 0.68 ? 1 : c.body > 0.52 ? 2 : 3];
        const paint = paintOf(c.color);
        const extra = [ENGINES[c.p.engine.k].name, L().parts.transType[c.p.trans.k], (paint ? paint[LANG] : '').toLowerCase(), cw];
        if (c.p.intake.k !== M.stock.intake) extra.push(L().parts.intakeName(c.p.intake.k).toLowerCase());
        if (c.p.exhaust.k === 'hdr') extra.push('headers');
        const can = !ad.sold && S.money >= ad.price && S.cars.length < MAX_CARS;
        return `<div class="ad ${ad.sold ? 'sold' : ''}">
          <h5>${esc(M.name)} '${String(M.year).slice(2)}</h5>
          <img src="${carThumb(c)}" alt="">
          <p>${esc(extra.filter(Boolean).join(', '))}. ${Math.round(st.hp)} hp · ¼ ${carET(c).et.toFixed(1)} s</p>
          <div class="row"><span class="price">${money(ad.price)}</span><span class="tel">${P.tel} ${ad.phone}</span></div>
          <button class="btn small ${can ? '' : 'ghost'}" data-a="buyad" data-i="${i}" ${ad.sold ? 'disabled' : ''}>${ad.sold ? '✔' : P.call}</button>
        </div>`;
      }).join('')}</div>`;
    } else if (Game.paperTab === 'parts') {
      const fitTxt = p => {
        if (!car) return '';
        const ok = SLOTS.some(sl => SLOT_INFO[sl].t === p.t && !['family', 'mount', 'carbType'].includes(fitProblem(Object.assign({}, car, { p: Object.assign({}, car.p, { [sl]: null }) }), sl, p)));
        return ok ? `<small class="ok">✔ ${P.fits}</small>` : `<small class="no">✖ ${P.nofit}</small>`;
      };
      const row = (p, price, a, i, cond) => `<div class="item"><div><b>${esc(partName(p))}</b>${cond ? `<small>${P.cond}: ${pct(p.c)}%</small>` : `<small>${esc(L().parts.descs[p.t])}</small>`}${fitTxt(p)}</div>
        <span class="price">${money(price)}</span><button class="btn small" data-a="${a}" data-i="${i}" ${S.money < price ? 'disabled' : ''}>${P.buy}</button></div>`;
      const used = pp.parts.map((u, i) => (u.sold ? '' : row(u.part, u.price, 'buyused', i, true))).join('');
      const cat = shopCatalog(car, Game.shopOnly && car);
      Game._catalog = cat;
      body = `<div class="cols">
        <div class="col"><h3>${P.parts}</h3>${used || '—'}</div>
        <div class="col"><h3>${P.shop} <small><span class="toggle"><button class="${Game.shopOnly ? 'on' : ''}" data-a="only" data-v="1">${P.only}</button><button class="${Game.shopOnly ? '' : 'on'}" data-a="only" data-v="0">${P.all}</button></span></small></h3>
          ${cat.map((p, i) => row(p, partPrice(p), 'buyshop', i, false)).join('')}</div>
      </div>`;
    } else {
      const cars = S.cars.map(c => `<div class="item"><div><b>${esc(carName(c))}</b><small>${c.id === S.active ? P.active : ''}</small></div><span class="price">${money(carOffer(c))}</span><button class="btn small" data-a="sellcar" data-id="${c.id}">${P.sellBtn}</button></div>`).join('');
      const parts = S.bench.map(p => `<div class="item"><div><b>${esc(partName(p))}</b><small>${P.loose} · ${pct(p.c)}%</small></div><span class="price">${money(partOffer(p))}</span><button class="btn small" data-a="sellpart" data-id="${p.id}">${P.sellBtn}</button></div>`).join('');
      body = `<div class="cols"><div class="col"><h3>${L().garage.cars}</h3>${cars || P.nothing}</div><div class="col"><h3>${L().shop.bench}</h3>${parts || P.nothing}</div></div>`;
    }
    return `<div class="paper">
      <button class="x" data-a="garage">×</button>
      <div class="mast"><h1>${P.name}</h1>
        <div class="meta"><span>${esc(L().date(d))}, 1963</span><span>${P.motto}</span><span>${P.price}</span></div></div>
      ${news}
      <div class="tabs">${tab('cars', P.cars)}${tab('parts', P.parts + ' · ' + P.shop.split(' ')[0])}${tab('sell', P.sell)}<span class="grow"></span><b style="font-family:var(--sans)">💵 ${money(S.money)}</b></div>
      <div class="body">${body}</div>
    </div>`;
  },

  // ----- El taller -----
  shop() {
    const T = L().shop, car = activeCar();
    if (!car) return topbar() + `<div class="panel bubble">${esc(L().garage.noCar)}</div><div class="actions"><button class="btn" data-a="garage">← ${L().garage.title}</button></div>`;
    const probs = carProblems(car).filter(p => p !== 'fuel');
    const bench = S.bench.map(p => {
      const r = slotFor(car, p);
      return `<div class="item"><div><b>${esc(partName(p))}</b><small>${pct(p.c)}% · ${r.sl ? `<span class="ok">✔</span>` : esc(T.wontFit[r.why] || '')}</small></div>
        <button class="btn small teal" data-a="install" data-id="${p.id}">⬅</button><button class="btn small ghost" data-a="sellbench" data-id="${p.id}">${money(partOffer(p))}</button></div>`;
    }).join('');
    const ping = car.timing > 10;
    return `<div class="panel work">
      <h3>🔧 ${T.title}</h3>
      <div class="seg"><button class="${Mech.view === 'bay' ? 'on' : ''}" data-a="view" data-v="bay">${T.bay}</button><button class="${Mech.view === 'under' ? 'on' : ''}" data-a="view" data-v="under">${T.under}</button></div>
      <p class="help">${esc(T.help)}</p>
      <div class="label">${T.bench}</div>
      <div class="bench">${bench || `<p class="help">${esc(T.empty)}</p>`}</div>
      <div class="label">${T.tune}</div>
      <div class="tune"><span>0°</span><input type="range" min="0" max="14" step="1" value="${car.timing}" data-a="timing"><span class="${ping ? 'ping' : ''}">${car.timing}°${ping ? ' ' + T.ping : ''}</span></div>
      <canvas class="dyno" width="716" height="220"></canvas>
      <div class="status ${probs.length ? 'bad' : ''}">${probs.length ? '⚠️ ' + [...new Set(probs.map(probText))].map(esc).join(' · ') : '✔ ' + T.ready}</div>
      <button class="btn" data-a="garage">← ${L().garage.title}</button>
    </div>`;
  },
  drawDyno() {
    const c = uiEl.querySelector('canvas.dyno');
    if (!c || !c.getContext) return;
    const g = c.getContext('2d');
    g.setTransform(2, 0, 0, 2, 0, 0);
    drawDyno(g, activeCar(), c.width / 2, c.height / 2);
  },

  // ----- Pintura -----
  body() {
    const B = L().body, car = activeCar();
    if (!car) return this.shop();
    const sw = PAINTS.map(p => `<button class="sw ${p.candy ? 'candy' : ''} ${car.color === p.c ? 'on' : ''}" style="background-color:${p.c}" title="${esc(B.paintCost(p[LANG], paintCost(p.c)))}" data-a="paint" data-c="${p.c}"></button>`).join('');
    const mods = Object.keys(MODS).map(k => {
      const on = !!car.mods[k];
      return `<div class="mod"><div><b>${B.mods[k]}</b><small>${esc(B.modDesc[k])}</small></div>
        <button class="btn small ${on ? 'ghost' : ''}" data-a="mod" data-k="${k}" ${!on && S.money < MODS[k].price ? 'disabled' : ''}>${on ? B.remove : money(MODS[k].price)}</button></div>`;
    }).join('');
    const wheels = Object.keys(WHEELS).map(k => `<button class="${car.mods.wheels === k ? 'on' : ''}" data-a="wheels" data-k="${k}">${B.wheelNames[k]}${WHEELS[k] ? ' · ' + money(WHEELS[k]) : ''}</button>`).join('');
    const paint = paintOf(car.color);
    return `<div class="panel work">
      <h3>🎨 ${B.title}</h3>
      <div class="label">${B.paint}${paint ? ' · ' + esc(paint[LANG]) : ''}</div>
      <div class="swatches">${sw}</div>
      <div class="label">${B.wheels}</div>
      <div class="seg choose"><div class="opts">${wheels}</div></div>
      <div class="mods">${mods}</div>
      <button class="btn" data-a="garage">← ${L().garage.title}</button>
    </div>` + `<div class="topbar pass"><div class="pill money">💵 <b>${money(S.money)}</b></div></div>`;
  },

  // ----- Bencinera -----
  gas() {
    const G = L().gas, car = activeCar();
    if (!car) return this.shop();
    const full = car.fuel >= TANK - 0.05;
    return topbar() + `<div class="pump">
      <button class="hold ${Game.pumping ? 'on' : ''}" data-hold="1" ${full || S.money < GAS_PRICE ? 'disabled' : ''}>⛽<br>${full ? G.full : G.hold}</button>
      <div class="panel gasinfo">${car.fuel.toFixed(1)} / ${TANK} ${G.gallons}<br>${G.total}: $${Game.pump.cost.toFixed(2)}
        <div style="margin-top:10px"><button class="btn teal" data-a="garage">${G.pay}</button></div></div>
    </div>`;
  },

  // ----- Mis autos -----
  cars() {
    const C = L().cars;
    return `<div class="dim"><div class="panel modal">
      <button class="x" data-a="close">×</button>
      <h2>🚗 ${C.title}</h2>
      <div class="garagecars">${S.cars.map(c => {
        const on = c.id === S.active, runs = carRuns(c);
        return `<div class="gc ${on ? 'on' : ''}"><img src="${carThumb(c, 260, 100)}" alt=""><b>${esc(carName(c))}</b>
          <small>${runs ? '¼ ' + carET(c).et.toFixed(1) + ' s · ' + Math.round(carStats(c).hp) + ' hp' : '⚠️ ' + esc(probText(carProblems(c)[0] || ''))} · ${money(carValue(c))}</small>
          <button class="btn small ${on ? 'ghost' : 'teal'}" data-a="use" data-id="${c.id}" ${on ? 'disabled' : ''}>${on ? C.using : C.use}</button>
          <button class="btn small" data-a="sellcar" data-id="${c.id}">${C.sell(carOffer(c))}</button>
          <button class="btn small dark" data-a="junk" data-id="${c.id}">${C.junk(junkValue(c))}</button></div>`;
      }).join('') || `<p>${esc(L().garage.noCar)}</p>`}</div>
    </div></div>`;
  },

  // ----- El drive-in -----
  diner() {
    const D = L().diner, N = S.night;
    const clock = `<div class="pill">🕗 <span class="clock">${N ? clockText(N.min) : '—'}</span></div>`;
    let html = topbar(clock) + `<div class="actions" style="justify-content:flex-start"><button class="btn dark" data-a="home">🏠 ${D.home}</button></div>`;
    const cur = N && N.cur;
    if (!cur) {
      html += `<div class="panel bubble" style="top:200px">${N && N.min >= CLOSE_MIN || (N && !N.queue.length) ? '🌙 ' + esc(D.closing) : '🚗 ' + esc(D.arrives)}</div>`;
      return html;
    }
    if (Game.rivalX > Game.rivalTarget + 4) return html;
    const r = rivalById(cur.id), rec = S.rivals[cur.id] || { w: 0, l: 0 };
    const king = cur.id === 'king';
    let say = Game.answer ? Game.answer : king ? D.kingLine : D.lines.hi[cur.line % D.lines.hi.length];
    let body = '';
    if (king && !Game.answer) {
      body = `<div class="btns"><button class="btn gold big" data-a="king">👑 ${D.challenge}</button><button class="btn ghost" data-a="pass">${D.pass}</button></div>`;
    } else if (Game.chal && !Game.answer) {
      const c = Game.chal;
      const bets = c.type === 'drag' ? [0, 10, 50] : [25, 50, 100, 'pinks'];
      body = `<div class="choose">
        <div class="label">${D.type}</div>
        <div class="opts"><button class="${c.type === 'drag' ? 'on' : ''}" data-a="type" data-v="drag">🏁 ${D.drag}</button><button class="${c.type === 'road' ? 'on' : ''}" data-a="type" data-v="road">⛰️ ${D.road}</button></div>
        <div class="label">${D.bet}</div>
        <div class="opts">${bets.map(b => `<button class="${c.bet === b ? 'on' : ''}" data-a="bet" data-v="${b}" ${b !== 'pinks' && b > S.money ? 'disabled' : ''}>${b === 0 ? D.kicks : b === 'pinks' ? '📄 ' + D.pinks : money(b)}</button>`).join('')}</div>
        <div class="btns"><button class="btn big" data-a="race">${D.go}</button><button class="btn ghost" data-a="cancel">✕</button></div>
      </div>`;
    } else if (!Game.answer || Game.answerNo) {
      body = `<div class="btns"><button class="btn big" data-a="challenge">${D.challenge}</button><button class="btn ghost" data-a="pass">${D.pass}</button></div>`;
    }
    html += (king ? `<div class="kingbanner">👑 ${esc(D.kingArrives)}</div>` : '') + `<div class="panel rival">
      <div class="who"><img src="${portraitURL(Object.assign({ f: r.f }, r.look), 96)}" alt="">
        <div><h3>${esc(rivalName(r))}</h3><div class="car">${D.car}: ${esc(carName(cur.car))}</div>
        <div class="rec">${king ? '' : D.record(rec.l, rec.w)}</div></div></div>
      <div class="say">«${esc(say)}»</div>
      ${body}
    </div>`;
    return html;
  },

  // ----- Resultado de la carrera -----
  result() {
    const R = L().result, out = Game.out, res = out.res, o = Game.raceOpts;
    const S2 = L().race.reasons;
    const head = res.outcome === 'win' ? L().race.won : res.outcome === 'void' ? L().race.voided : L().race.lost;
    const tm = x => (x == null ? '—' : x.toFixed(2) + ' s');
    // la tabla solo aparece si alguien llegó a la meta (no en las faltas, choques ni con la policía)
    const rows = res.time != null || res.rivalTime != null ? `<table>
      <tr><th></th><th>${R.you}</th><th>${esc(o.rival.name)}</th></tr>
      <tr><td>${R.time}</td><td><b>${tm(res.time)}</b></td><td>${tm(res.rivalTime)}</td></tr>
      ${o.type === 'drag' ? `<tr><td>${R.trap}</td><td>${res.trap ? speedTxt(res.trap) : '—'}</td><td></td></tr>` : ''}
      <tr><td>${R.reaction}</td><td>${res.reaction != null ? res.reaction.toFixed(2) + ' s' : '—'}</td><td></td></tr>
    </table>` : '';
    let money_ = '';
    if (out.fine) money_ = `<div class="big minus">${R.fine(out.fine)}</div>`;
    else if (o.bet === 0 || res.outcome === 'void') money_ = `<div class="big">${R.kicks}</div>`;
    else if (o.bet !== 'pinks') money_ = `<div class="big ${out.money >= 0 ? 'plus' : 'minus'}">${out.money >= 0 ? R.win(out.money) : R.lose(-out.money)}</div>`;
    const lines = [...out.lines];
    if (out.carWon) lines.unshift('🎉 ' + R.wonCar(carName(out.carWon)));
    if (out.autoSold) lines.push(R.autoSold(carName(out.carWon), out.autoSold));
    if (out.carLost) lines.unshift('😢 ' + R.lostCar(carName(out.carLost)));
    if (out.jail) lines.push('🚔 ' + R.jail);
    let btns = `<button class="btn big" data-a="next">${R.next}</button>`;
    if (out.crash && !Game.outDone) {
      const c = S.cars.find(x => x.id === o.car.id);
      if (c) {
        lines.push('💥 ' + R.crash);
        btns = canRepair(c)
          ? `<button class="btn teal" data-a="fix" ${S.money < repairCost(c) ? 'disabled' : ''}>${R.fix(repairCost(c))}</button><button class="btn dark" data-a="junkcrash">${R.junk(junkValue(c))}</button><button class="btn ghost" data-a="next">${R.next}</button>`
          : `<p>${esc(R.noFix)}</p><button class="btn dark" data-a="junkcrash">${R.junk(junkValue(c))}</button>`;
      }
    }
    return `<div class="dim"><div class="panel result">
      <h2 class="${res.outcome}">${head}</h2>
      <div class="why">${esc(S2[res.reason] || '')}</div>
      ${rows}${money_}
      <div class="lines">${lines.map(l => `<div>${esc(l)}</div>`).join('')}</div>
      <div class="btns">${btns}</div>
    </div></div>`;
  },

  // ----- Final -----
  end() {
    const E = L().end, kind = S.over;
    const title = kind === 'king' ? E.headline(S.name) : kind === 'broke' ? E.broke : E.summerOver;
    const text = kind === 'king' ? E.kingText(S.name) : kind === 'broke' ? E.brokeText : E.summerText;
    return `<div class="dim endwrap"><div class="front">
      <h1>${L().paper.name}</h1>
      <h2>${esc(kind === 'king' ? title : title.toUpperCase())}</h2>
      <p>${esc(text)}</p>
      <p><b>${esc(E.stats(S.wins, S.losses, S.money))}</b></p>
      <div class="btns"><button class="btn big" data-a="new">${E.again}</button>${kind === 'king' && S.day < SUMMER_DAYS ? `<button class="btn teal big" data-a="keep">${E.keep}</button>` : ''}</div>
    </div></div>`;
  },
  pause() {
    const P = L().pause;
    return `<div class="dim"><div class="panel pause"><h2>${P.title}</h2><button class="btn big" data-a="resume">${P.resume}</button><button class="btn dark" data-a="quit">${P.quit}</button></div></div>`;
  }
};

// ----- Lo que hace cada botón -----
const ACT = {
  cont() { if (loadGame()) { if (S.over && !S.keepPlaying) return Game.go('end'); Game.go(S.night ? 'diner' : 'garage'); if (S.night && !S.night.cur) Game.arrive(); } },
  new() { Game.modal = 'license'; UI.render(); },
  start() {
    const inp = uiEl.querySelector('input[name=name]');
    const name = ((inp && inp.value) || '').trim().slice(0, 14) || L().defaultName;
    newGame(name.replace(/\b\w/g, c => c.toUpperCase()));
    saveGame();
    Game.go('garage');
  },
  how() { Game.modal = 'how'; UI.render(); },
  close() { Game.modal = null; UI.render(); },
  lang() { setLang(LANG === 'es' ? 'en' : 'es'); UI.render(); },
  music() { Game.toast(L().toast.music(Sound.toggleMusic())); UI.render(); },
  more() { location.href = '../index.html'; },
  garage() { Game.go('garage'); },
  paper() { Game.go('paper'); },
  shop() { Mech.view = 'bay'; Game.go('shop'); },
  body() { Game.go('body'); },
  gas() { Game.pump = { gal: 0, cost: 0, tick: 0 }; Game.go('gas'); },
  cars() { Game.modal = 'cars'; UI.render(); },
  diner() {
    const car = activeCar();
    if (!car) return Game.toast(L().garage.noCar);
    const r = goDiner();
    if (r === 'noCar') return Game.toast('⚠️ ' + probText(carProblems(car).find(p => p !== 'fuel') || 'loose'));
    if (r === 'fuel') return Game.toast('⚠️ ' + probText('fuel'));
    Game.go('diner'); Game.arrive();
  },
  sleep() { endNight(); Game.toast(L().date(dateOf(S.day))); if (S.over) Game.go('end'); else UI.render(); },
  rebuild() { if (rebuildEngine(activeCar())) Sound.sfx.buy(); UI.render(); },
  rebuildT() { if (rebuildTrans(activeCar())) Sound.sfx.buy(); UI.render(); },
  fixbody() { if (fixBody(activeCar())) Sound.sfx.buy(); UI.render(); },
  // diario
  tab(el) { Game.paperTab = el.dataset.tab; UI.render(); },
  only(el) { Game.shopOnly = el.dataset.v === '1'; UI.render(); },
  buyad(el) {
    const ad = S.paper.ads[+el.dataset.i], r = buyAd(+el.dataset.i);
    if (r === 'noRoom') return Game.toast(L().paper.noRoom);
    if (r === 'noMoney') { Sound.sfx.nope(); return Game.toast(L().paper.noMoney); }
    if (!r) { Sound.sfx.buy(); Game.toast(L().paper.bought(carName(ad.car))); }
    UI.render();
  },
  buyused(el) {
    const u = S.paper.parts[+el.dataset.i];
    if (!u || u.sold) return;
    if (buyPart(u.part, u.price)) { Sound.sfx.nope(); return Game.toast(L().paper.noMoney); }
    u.sold = true; saveGame(); Sound.sfx.buy(); Game.toast(L().paper.bought(partName(u.part))); UI.render();
  },
  buyshop(el) {
    const p = Game._catalog && Game._catalog[+el.dataset.i];
    if (!p) return;
    if (buyPart(p, partPrice(p))) { Sound.sfx.nope(); return Game.toast(L().paper.noMoney); }
    Sound.sfx.buy(); Game.toast(L().paper.bought(partName(p))); UI.render();
  },
  sellcar(el) {
    const c = S.cars.find(x => x.id === el.dataset.id);
    if (!c) return;
    const m = sellCar(c.id); Sound.sfx.coin(); Game.toast(L().paper.sold(carName(c), m));
    if (S.over) return Game.go('end');
    UI.render();
  },
  junk(el) { const c = S.cars.find(x => x.id === el.dataset.id); if (!c) return; const m = junkCar(c.id); Sound.sfx.coin(); Game.toast(L().paper.sold(carName(c), m)); if (S.over) return Game.go('end'); UI.render(); },
  sellpart(el) { const p = S.bench.find(x => x.id === el.dataset.id); if (!p) return; const m = sellPart(p.id); Sound.sfx.coin(); Game.toast(L().paper.sold(partName(p), m)); UI.render(); },
  use(el) { S.active = el.dataset.id; saveGame(); UI.render(); },
  // taller
  view(el) { Mech.view = el.dataset.v; UI.render(); },
  install(el) {
    const car = activeCar(), r = installPart(car, el.dataset.id);
    if (!r.sl) { Sound.sfx.nope(); return Game.toast(L().shop.wontFit[r.why] || '✖'); }
    Mech.view = BAY_SLOTS.includes(r.sl) ? 'bay' : 'under';
    Sound.sfx.clunk(); Game.toast(L().shop.tighten + ' 🔩'); saveGame(); UI.render();
  },
  sellbench(el) { ACT.sellpart(el); },
  // pintura
  paint(el) { if (paintCar(activeCar(), el.dataset.c)) Sound.sfx.buy(); else if (activeCar().color !== el.dataset.c) Sound.sfx.nope(); UI.render(); },
  mod(el) { if (toggleMod(activeCar(), el.dataset.k)) Sound.sfx.click(); UI.render(); },
  wheels(el) { if (setWheels(activeCar(), el.dataset.k)) Sound.sfx.buy(); UI.render(); },
  // drive-in
  home() { endNight(); Game.go(S.over ? 'end' : 'garage'); },
  pass() { Game.leaving = true; Sound.sfx.select(); },
  challenge() { Game.chal = { type: 'drag', bet: 0 }; Game.answer = null; Game.answerNo = false; UI.render(); },
  cancel() { Game.chal = null; UI.render(); },
  type(el) { Game.chal.type = el.dataset.v; Game.chal.bet = Game.chal.type === 'drag' ? 0 : 25; if (Game.chal.bet > S.money) Game.chal.bet = 0; UI.render(); },
  bet(el) { const v = el.dataset.v; Game.chal.bet = v === 'pinks' ? 'pinks' : +v; UI.render(); },
  race() {
    const c = Game.chal, cur = S.night.cur;
    if (c.type === 'road' && c.bet === 0) c.bet = 25;
    const ans = rivalAnswer(cur.id, c.type, c.bet);
    const lines = L().diner.lines;
    if (ans === 'broke') return Game.toast(L().diner.broke);
    if (ans) { Game.answer = pick(lines[ans]); Game.answerNo = true; Game.chal = null; Sound.sfx.nope(); return UI.render(); }
    Game.answer = pick(lines.yes); Game.answerNo = false; UI.render();
    Sound.sfx.door();
    setTimeout(() => { if (Game.scene === 'diner' && Game.chal) Game.startRace(); }, 1100);
  },
  king() { Game.chal = { type: 'road', bet: 'pinks' }; Game.answer = '…'; Game.answerNo = false; UI.render(); setTimeout(() => { if (Game.scene === 'diner') Game.startRace(); }, 900); },
  // carrera
  resume() { Game.modal = null; UI.render(); },
  quit() {
    if (Game.race && Game.race.phase !== 'done') { Game.race.finish('lose', 'foul'); Game.race.endT = 9; }
    Game.modal = null; Game.finishRace();
  },
  // resultado
  next() { Game.afterResult(); },
  fix() { const c = S.cars.find(x => x.id === Game.raceOpts.car.id); if (c && fixBody(c)) { Sound.sfx.buy(); Game.outDone = true; } UI.render(); },
  junkcrash() { const c = S.cars.find(x => x.id === Game.raceOpts.car.id); if (c) { const m = junkCar(c.id); Sound.sfx.coin(); Game.toast(L().paper.sold(carName(c), m)); } Game.outDone = true; if (S.over) return Game.go('end'); UI.render(); },
  keep() { S.keepPlaying = true; S.over = null; saveGame(); Game.go('garage'); }
};

uiEl.addEventListener('click', e => {
  Sound.init();
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled || el.tagName === 'INPUT') return;
  const f = ACT[el.dataset.a];
  if (f) { Sound.sfx.click(); f(el); }
});
uiEl.addEventListener('input', e => {
  const el = e.target;
  if (el.name === 'name') { const sig = uiEl.querySelector('#sig'); if (sig) sig.textContent = el.value; }
  if (el.dataset && el.dataset.a === 'timing') {
    const car = activeCar(); if (!car) return;
    car.timing = +el.value; _etCache.clear(); saveGame();
    const span = el.nextElementSibling;
    if (span) { span.textContent = car.timing + '°' + (car.timing > 10 ? ' ' + L().shop.ping : ''); span.className = car.timing > 10 ? 'ping' : ''; }
    UI.drawDyno();
  }
});
uiEl.addEventListener('keydown', e => { if (e.target.name === 'name' && e.key === 'Enter') { e.preventDefault(); ACT.start(); } });
// el botón del surtidor se mantiene apretado
uiEl.addEventListener('pointerdown', e => { const h = e.target.closest('[data-hold]'); if (h && !h.disabled) { Sound.init(); Game.pumping = true; h.classList.add('on'); } });
addEventListener('pointerup', () => { if (Game.pumping) { Game.pumping = false; if (Game.scene === 'gas') UI.render(); } });
