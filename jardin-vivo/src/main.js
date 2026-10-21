// ===== Bucle principal: el paso del tiempo, el control con mouse, teclado y pantalla táctil =====
const DAY_H_SEC = 3.5, NIGHT_H_SEC = 0.5;   // segundos reales por hora del juego (las noches pasan rápido)
const hourSeconds = h => (h >= 6 && h < 20.5 ? DAY_H_SEC : NIGHT_H_SEC);
const COVER = /[?&]cover\b/.test(location.search);
let lastLight = 0;

// ---------- El tiempo ----------
function advanceTime(dtReal) {
  let rem = dtReal * G.speed, dtH = 0;
  while (rem > 0) {
    const hs = hourSeconds(G.hour), toNext = (Math.floor(G.hour) + 1 - G.hour) * hs;
    if (rem < toNext) { G.hour += rem / hs; dtH += rem / hs; rem = 0; }
    else { dtH += toNext / hs; rem -= toNext; G.hour = Math.floor(G.hour) + 1; onHour(); }
  }
  return dtH;
}

function onHour() {
  if (G.hour >= 24) { G.hour -= 24; onNewDay(); }
  const h = Math.round(G.hour) % 24;
  hourTick(h);
  if (UI.title) return;
  if (h === OPEN_H && G.open) planVisitors();
  if (h === 17) forecast();
  // concurso de jardines del barrio: el jurado pasa a media mañana y da el resultado al atardecer
  if (G.day % DAYS_YEAR === CONTEST_DAY) {
    if (h === 10) { for (let i = 0; i < 3; i++) spawnVisitor(true, 'jury'); news('contestJury', {}); }
    if (h === 17) judgeContest();
  }
  if (h === CLOSE_H && G.open && G.today.visitors) toast(L().dailyReport(G.today.visitors, money(G.today.income)) + (G.today.water ? ' ' + L().waterBill(money(G.today.water)) : ''), 'info');
  if (UI.tool === 'water' && h % 3 === 0) renderTray();
  if (h % 2 === 0) updateBeauty();
  bumpVis();
  checkGoals();
  renderGoalCard();
}

function onNewDay() {
  dayTick();
  updateBeauty();
  updateRep();
  G.today = { visitors: 0, income: 0, sat: 0, satN: 0, harvest: 0 };
  G.day++;
  G.w = G.wNext;
  G.wNext = makeWeather((G.day + 1) % DAYS_YEAR, G.w, Math.random);
  computeLight();
  if (!UI.title) {
    const yd = G.day % DAYS_YEAR;
    if (yd % DAYS_SEASON === 0) toast(`${['🌷', '☀️', '🍂', '❄️'][seasonOf(yd)]} ${L().seasons[seasonOf(yd)]}`, 'goal');
    maybeNewOrder(); expireOrders();
    if (yd === CONTEST_DAY - 6) news('contestSoon', {});
    saveGame();
  }
  bumpVis();
}

// Pronóstico de la tarde: avisa de heladas, calor y lluvia
function forecast() {
  const n = G.wNext;
  if (n.tmin < 1) news('forecast', { text: L().forecastFrost(deg(n.tmin)), type: 'bad' });
  else if (n.heat) news('forecast', { text: L().forecastHeat(deg(n.tmax)), type: 'bad' });
  else if (n.rain > 0 && !G.w.rain) news('forecast', { text: L().forecastRain, type: 'info' });
}

// ---------- Herramientas sobre el mapa ----------
const PAINT = { water: 1, plant: 1, care: 1, harvest: 1, remove: 1 };
function toolTile(sx, sy) {
  const [wx, wy] = screenToWorld(sx, sy);
  let x = Math.floor(wx), y = Math.floor(wy);
  if (UI.tool === 'build') { const b = BUILD[UI.build]; x -= Math.floor(((b.w || 1) - 1) / 2); y -= Math.floor(((b.h || 1) - 1) / 2); }
  return [x, y];
}
function useTool(sx, sy, first) {
  const [x, y] = toolTile(sx, sy), t = tileAt(x, y);
  // primero la planta que está en la casilla tocada; si no hay, la copa de un árbol que la tape
  const picked = ['inspect', 'harvest', 'move'].includes(UI.tool) && !(UI.tool === 'move' && UI.moving) ? (t && t.plant) || pickPlant(sx, sy) : null;
  switch (UI.tool) {
    case 'inspect':
      if (!first) break;
      if (t && t.t === 'house' && !picked) { openHouse(); break; }
      if (picked) selectTile(picked.x, picked.y, picked); else if (t) selectTile(x, y); else closeInspector();
      break;
    case 'water': actWater(x, y, G.hose ? 1 : 0); break;
    case 'plant': if (!UI.seed) { if (first) openCatalog(); } else if (t && !t.plant) actPlant(UI.seed, x, y); else if (first && t && t.plant) selectTile(x, y); break;
    case 'harvest': { const p = picked || (t && t.plant); if (p) actHarvest(p); break; }
    case 'care': actCare(UI.care, x, y); break;
    case 'build': if (first || BUILD[UI.build].tile || UI.build === 'shade') actBuild(UI.build, x, y); break;
    case 'move':
      if (!first) break;
      if (!UI.moving) { const p = picked || (t && t.plant); if (p && !p.dead && tileAt(p.x, p.y).own) { UI.moving = p; R.sel = p; renderTray(); Sound.sfx.click(); } }
      else if (t && t.t === 'house') openHouse();
      else if (actTransplant(UI.moving, x, y)) { const p = UI.moving; UI.moving = null; renderTray(); selectTile(p.x, p.y, p); }
      break;
    case 'remove': if (first || !(t && t.plant)) actRemove(x, y); break;
    case 'land': if (first && t && !G.owned[t.parcel]) confirmBuy(t.parcel); break;
  }
  if (UI.sel && UI.tool !== 'inspect') refreshInspector(true);
  renderHUD();
}

function updateHover(sx, sy) {
  if (UI.title) { R.hover = null; return; }
  const [x, y] = toolTile(sx, sy), t = tileAt(x, y), tip = $('#tip');
  if (!t) { R.hover = null; tip.hidden = true; return; }
  const b = UI.tool === 'build' ? BUILD[UI.build] : null;
  R.hover = { x, y, w: b ? b.w || 1 : 1, h: b ? b.h || 1 : 1, bad: false };
  let html = '';
  if (UI.tool === 'plant' && UI.seed) {
    const sp = SP[UI.seed];
    if (canPlantHere(sp, t)) {
      const f = evaluate(sp, t, null, G.w, true), v = Math.round(f.cond * 100);
      const issues = [];
      if (f.light < 0.9) issues.push(f.lightLow ? '☀️ ' + L().hint.lightLow : '☀️ ' + L().hint.lightHigh);
      if (f.drain < 0.9) issues.push('🪨 ' + (t.drain < sp.drain[0] ? L().hint.heavy : L().hint.loose));
      if (f.ph < 0.9) issues.push('🧪 ' + (t.ph > sp.ph[1] ? L().hint.alkaline : L().hint.acid));
      if (f.hum < 0.9) issues.push('💨 ' + L().hint.hum);
      if (f.cold < 1) issues.push('❄️ ' + L().hint.tender);
      if (f.jug < 1) issues.push('🌰 ' + L().hint.juglone);
      if (f.water < 0.9) issues.push('💧 ' + L().waterK[sp.water]);
      html = `<b>${esc(spName(sp))}</b> · <span class="${v > 80 ? 'ok' : v > 55 ? 'mid' : 'bad'}">${v}%</span>` + issues.slice(0, 3).map(i => `<small>${esc(i)}</small>`).join('');
      R.hover.bad = v <= 55;
    } else { R.hover.bad = true; html = `<small>${esc(!t.own ? L().notYours : t.plant ? L().occupied : sp.water === 'aquatic' ? L().needPond : L().needBed)}</small>`; }
  } else if (UI.tool === 'build') {
    const err = canBuild(UI.build, x, y);
    R.hover.bad = !!err && err !== L().already;
    html = `<b>${esc(L().build[UI.build][0])}</b> · ${money(b.cost)}` + (err ? `<small>${esc(err)}</small>` : '');
  } else if (UI.tool === 'land') {
    if (R.preview) R.preview.hover = t.own ? -1 : t.parcel;
    if (!t.own) html = `<b>${esc(L().parcels[t.parcel])}</b> · ${money(PARCELS[t.parcel].price)}<small>${esc(L().parcelDesc[t.parcel])}</small>`;
  } else if (UI.tool === 'care') {
    html = `<b>${esc(L().care[UI.care][0])}</b>${CARE[UI.care].cost ? ' · ' + money(CARE[UI.care].cost) : ''}`;
  } else if (UI.tool === 'move' && UI.moving) {
    const sp = spOf(UI.moving);
    if (canPlantHere(sp, t)) { const v = Math.round(evaluate(sp, t, null, G.w, true).cond * 100); html = `<b>${esc(spName(sp))}</b> · <span class="${v > 80 ? 'ok' : v > 55 ? 'mid' : 'bad'}">${v}%</span>`; }
    else R.hover.bad = true;
  } else if (UI.tool === 'inspect' || UI.tool === 'harvest') {
    const p = t.plant || pickPlant(sx, sy);
    if (p) html = `<b>${esc(spName(spOf(p)))}</b> · ${esc(stageText(p))}${canHarvest(p) ? ' · 🧺' : ''}`;
  }
  if (html) { tip.innerHTML = html; tip.hidden = false; tip.style.left = Math.min(sx + 16, VW - 260) + 'px'; tip.style.top = (sy + 18) + 'px'; }
  else tip.hidden = true;
}

// ---------- Mouse y pantalla táctil ----------
const ptr = { down: false, btn: 0, sx: 0, sy: 0, lx: 0, ly: 0, moved: false, pan: false, last: '', touches: new Map(), pinch: 0 };
let spaceDown = false;
function bindInput() {
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    Sound.init();
    canvas.setPointerCapture(e.pointerId);
    ptr.touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.touches.size === 2) { ptr.pan = true; ptr.pinch = touchDist(); return; }
    Object.assign(ptr, { down: true, btn: e.button, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false, last: '' });
    ptr.pan = e.button === 1 || e.button === 2 || spaceDown || UI.title;
    if (!ptr.pan && UI.tool !== 'inspect' && !UI.title) applyAt(e.clientX, e.clientY, true);
  });
  canvas.addEventListener('pointermove', e => {
    if (ptr.touches.has(e.pointerId)) ptr.touches.set(e.pointerId, [e.clientX, e.clientY]);
    if (ptr.touches.size === 2) {
      const d = touchDist(), [cx, cy] = touchMid();
      if (ptr.pinch) zoomAt(d / ptr.pinch, cx, cy);
      ptr.pinch = d;
      cam.x += (cx - ptr.lx) * (ptr.lx ? 1 : 0); cam.y += (cy - ptr.ly) * (ptr.ly ? 1 : 0);
      ptr.lx = cx; ptr.ly = cy; clampCam();
      return;
    }
    if (!ptr.down) { updateHover(e.clientX, e.clientY); return; }
    const dx = e.clientX - ptr.lx, dy = e.clientY - ptr.ly;
    if (Math.hypot(e.clientX - ptr.sx, e.clientY - ptr.sy) > 6) ptr.moved = true;
    if (ptr.pan || (UI.tool === 'inspect' && ptr.moved)) { ptr.pan = true; cam.x += dx; cam.y += dy; clampCam(); $('#tip').hidden = true; }
    else if (PAINT[UI.tool] || (UI.tool === 'build' && (BUILD[UI.build].tile || UI.build === 'shade'))) applyAt(e.clientX, e.clientY, false);
    ptr.lx = e.clientX; ptr.ly = e.clientY;
    updateHover(e.clientX, e.clientY);
  });
  const up = e => {
    ptr.touches.delete(e.pointerId);
    if (ptr.touches.size) { ptr.lx = 0; ptr.ly = 0; return; }
    if (ptr.down && !ptr.pan && !ptr.moved && UI.tool === 'inspect' && !UI.title) applyAt(e.clientX, e.clientY, true);
    ptr.down = false; ptr.pan = false; ptr.pinch = 0;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (!ptr.down) { R.hover = null; $('#tip').hidden = true; } });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); updateHover(e.clientX, e.clientY); }, { passive: false });

  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    Sound.init();
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat && !UI.title) setSpeed(0); spaceDown = true; return; }
    if (e.code === 'Escape') {
      if (UI.modal) closeModal();
      else if (UI.moving) { UI.moving = null; renderTray(); }
      else if (UI.sel) closeInspector();
      else if (R.lens) { R.lens = null; renderLensBar(); }
      return;
    }
    if (UI.title || UI.modal) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= TOOLS.length) { setTool(TOOLS[n - 1].id); return; }
    if (e.code === 'KeyL') { R.lens = R.lens === 'light' ? null : 'light'; if (R.lens) G.stats.lens = (G.stats.lens || 0) + 1; renderLensBar(); }
    if (e.code === 'KeyQ' || e.code === 'KeyE') { rotateView(e.code === 'KeyQ' ? -1 : 1); renderLensBar(); }
    if (e.key === '+' || e.key === '=') zoomAt(1.15, VW / 2, VH / 2);
    if (e.key === '-') zoomAt(1 / 1.15, VW / 2, VH / 2);
    keysDown.add(e.code);
  });
  addEventListener('keyup', e => { keysDown.delete(e.code); if (e.code === 'Space') spaceDown = false; });
  addEventListener('blur', () => keysDown.clear());
  document.addEventListener('visibilitychange', () => { if (document.hidden && !UI.title && !COVER) saveGame(); });
  addEventListener('beforeunload', () => { if (!UI.title && !COVER) saveGame(); });
}
const keysDown = new Set();
const touchDist = () => { const [a, b] = [...ptr.touches.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]); };
const touchMid = () => { const [a, b] = [...ptr.touches.values()]; return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
function applyAt(sx, sy, first) {
  const [x, y] = toolTile(sx, sy), key = x + ',' + y;
  if (!first && key === ptr.last) return;
  ptr.last = key;
  useTool(sx, sy, first);
}
function panKeys(dt) {
  const v = 520 * dt;
  if (keysDown.has('ArrowLeft') || keysDown.has('KeyA')) cam.x += v;
  if (keysDown.has('ArrowRight') || keysDown.has('KeyD')) cam.x -= v;
  if (keysDown.has('ArrowUp') || keysDown.has('KeyW')) cam.y += v;
  if (keysDown.has('ArrowDown') || keysDown.has('KeyS')) cam.y -= v;
  if (keysDown.size) clampCam();
}

// ---------- Jardín de muestra (pantalla de título y portada) ----------
function demoGarden(climate) {
  newGarden(4242, climate);
  G.owned = G.owned.map(() => true);
  for (const t of G.tiles) t.own = true;
  G.day = 8; G.hour = 17.6; G.open = true; G.rep = 4.2; G.repMax = 4.2;
  G.w = { yd: 8, anom: 0, rain: 0, cloud: 0.12, heat: false, frost: false, storm: false, tmax: 25, tmin: 11, hum: 0.5, kind: 'sun' };
  G.wNext = { ...G.w };
  const bed = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = tileAt(x, y); if (t && t.t !== 'water' && !t.plant && !t.obj) t.t = 'bed'; } };
  const path = (x0, y0, x1, y1) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = tileAt(x, y); if (t && !t.plant && t.t !== 'water') t.t = 'path'; } };
  const put = (id, x, y, ph) => {
    const t = tileAt(x, y);
    if (!t || t.plant || t.obj) return;
    if (SP[id].water !== 'aquatic' && t.t !== 'water') t.t = 'bed';
    if (ph) t.ph = ph;
    const p = addPlant(id, x, y, { g: 1, hp: 100 });
    const sp = SP[id];
    p.bloom = sp.bloom && inWindow(8, sp.bloom) ? 1 : 0; p.fruit = sp.fruit && inWindow(8, sp.fruit) ? 1 : 0; p.chill = 9999;
    p.dorm = isDormant(sp, 8);
  };
  for (const p of [...G.plants]) if (p.sp === 'rose' && p.old) { removePlant(p); }
  // caminos
  path(3, 12, 23, 12); path(16, 4, 16, 11); path(9, 2, 15, 2); path(16, 2, 16, 3);
  // frente de la casa: rosas, lavandas y peonías
  [['rose', 1, 6], ['rose', 2, 7], ['peony', 1, 7], ['lavender', 2, 6], ['foxglove', 1, 8]].forEach(a => put(...a));
  for (let y = 9; y <= 16; y++) { put(y % 2 ? 'lavender' : 'rose', 2, y); put(['iris', 'poppy', 'agapanthus', 'echinacea'][y % 4], 1, y); }
  for (let x = 4; x <= 9; x++) { put(['peony', 'iris', 'sweetpea', 'poppy', 'daisy', 'dianthus'][x % 6], x, 10); put(['lavender', 'salvia', 'calendula', 'cosmos'][x % 4], x, 11); }
  [['tomato', 4, 14], ['tomato', 5, 14], ['lettuce', 4, 15], ['lettuce', 5, 15], ['strawberry', 4, 16], ['strawberry', 5, 16], ['basil', 6, 15], ['tagetes', 6, 14], ['nasturtium', 6, 16]].forEach(a => put(...a));
  put('jacaranda', 9, 15);
  // lomita soleada: jardín mediterráneo
  for (let x = 10; x <= 16; x++) for (let y = 13; y <= 17; y++) put(['lavender', 'rosemary', 'poppy', 'iris', 'agapanthus', 'stipa', 'thyme'][(x * 3 + y * 5) % 7], x, y);
  for (let x = 10; x <= 15; x++) put(['zinnia', 'cosmos', 'sunflower', 'dahlia', 'alstroemeria', 'petunia'][x % 6], x, 11);
  // rincón de la vertiente: estanque grande con flores acuáticas y una pérgola con glicina
  for (const [x, y] of [[12, 4], [12, 5], [13, 5], [14, 5], [15, 3], [15, 5], [13, 6], [14, 6]]) tileAt(x, y).t = 'water';
  [['waterlily', 13, 4], ['waterlily', 14, 5], ['lotus', 13, 5], ['waterlily', 12, 5], ['lotus', 14, 6], ['waterlily', 15, 3]].forEach(a => put(...a));
  [['papyrus', 12, 3], ['yellowiris', 11, 4], ['calla', 11, 5], ['yellowiris', 12, 6], ['calla', 15, 6], ['papyrus', 15, 7], ['hosta', 11, 6]].forEach(a => put(...a));
  addStruct('pergola', 10, 7); put('wisteria', 12, 8); put('jasmine', 10, 9);
  addStruct('bench', 11, 8);
  // pedregal y el invernadero
  [['agave', 18, 14], ['barrel', 20, 13], ['echeveria', 21, 13], ['aloe', 22, 15], ['sempervivum', 20, 16], ['barrel', 22, 13], ['echeveria', 18, 16], ['aloe', 17, 15], ['opuntia', 23, 16], ['stipa', 19, 13], ['sempervivum', 21, 17]].forEach(a => put(...a));
  addStruct('greenhouse', 18, 9);
  [['orchid', 18, 9], ['anthurium', 19, 9], ['monstera', 20, 9], ['calathea', 21, 9], ['hibiscus', 18, 10], ['orchid', 19, 10], ['strelitzia', 21, 10], ['anthurium', 20, 11], ['orchid', 18, 11]].forEach(a => put(...a));
  // bosquecito
  [['camellia', 18, 2, 5.2], ['azalea', 19, 3, 5.2], ['hydrangea', 22, 6, 5.0], ['hydrangea', 23, 5, 5.0], ['hosta', 18, 6], ['hosta', 19, 7], ['fern', 20, 7], ['fern', 22, 7], ['foxglove', 21, 2], ['foxglove', 23, 2], ['hellebore', 18, 4], ['cherry', 23, 8], ['magnolia', 17, 0]].forEach(a => put(...a));
  // detalles
  addStruct('fountain', 13, 9); addStruct('lantern', 15, 12); addStruct('lantern', 8, 12); addStruct('bench', 6, 12); addStruct('birdbath', 4, 13);
  addStruct('statue', 23, 11); addStruct('beehive', 9, 14); addStruct('sundial', 13, 15); addStruct('gnome', 7, 16);
  for (const t of G.tiles) { t.moist = t.t === 'water' ? 1 : t.t === 'bed' ? 0.55 : 0.5; t.weeds = 0; resetMoistStats(t); }
  computeLight(); updateBeauty();
  for (const p of G.plants) { p.fac = evaluate(spOf(p), tileAt(p.x, p.y), p, G.w, false); p.cond = 1; }
  bumpVis();
}

// ---------- Cuadro a cuadro ----------
let last = performance.now(), hudT = 0, inspT = 0, titleT = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  let dtH = 0;
  if (COVER) { /* la portada queda quieta */ }
  else if (UI.title) {
    titleT += dt;
    G.hour += dt * 0.05;
    if (G.hour >= 21) G.hour = 7;
    cam.x -= dt * 6 * cam.z;
    if (titleT > 50) { titleT = 0; centerTitle(); }
    dtH = dt * 0.25;
  } else if (!UI.paused && !UI.modal) dtH = advanceTime(dt);
  if (!COVER) {
    panKeys(dt);
    updateVisitors(dtH, dt);
    updateFx(dt);
    Sound.update(dt);
    if (G.lightDirty && now - lastLight > 300) { computeLight(); lastLight = now; bumpVis(); }
  }
  drawWorld(dt);
  if (!UI.title && !COVER) {
    hudT -= dt; inspT -= dt;
    if (hudT <= 0) { hudT = 0.25; renderHUD(); updateCoach(); }
    if (inspT <= 0) { inspT = 1; if (UI.sel) refreshInspector(); }
  }
  // la portada se dibuja unas pocas veces y queda quieta (así se puede fotografiar)
  if (COVER && ++coverFrames > 3) {
    // deja la imagen en la página para poder guardarla como portada
    const pre = document.createElement('pre');
    pre.id = 'coverdata'; pre.hidden = true; pre.textContent = canvas.toDataURL('image/png');
    document.body.appendChild(pre);
    document.title = 'cover-ready';
    return;
  }
  requestAnimationFrame(frame);
}
let coverFrames = 0;
function centerTitle() { centerOn(13, 8, Math.min(VW / 1500, VH / 800) * 1.35); }

function boot() {
  initRender();
  demoGarden(COVER ? new URLSearchParams(location.search).get('cl') : undefined);
  buildUI();
  bindInput();
  if (COVER) {
    document.body.classList.add('cover');
    centerOn(11.4, 7.4, Math.min(VW / 1320, VH / 740));
    // parámetros para probar otras horas, estaciones y vistas: ?cover&h=12&d=40&z=0.6&rot=2
    const q = new URLSearchParams(location.search);
    if (q.get('h')) G.hour = +q.get('h');
    if (q.get('d')) { G.day = +q.get('d'); bumpVis(); for (const p of G.plants) { const sp = spOf(p); p.dorm = isDormant(sp, G.day % DAYS_YEAR); p.bloom = sp.bloom && inWindow(G.day % DAYS_YEAR, sp.bloom) ? 1 : 0; } computeLight(); }
    if (q.get('rot')) { cam.rot = +q.get('rot') & 3; centerOn(11.4, 7.4); }
    if (q.get('z')) centerOn(11.5, 9.6, +q.get('z'));
    if (q.get('rain')) Object.assign(G.w, { rain: 16, cloud: 0.92, kind: 'rain' });
    if (q.get('frost')) Object.assign(G.w, { tmin: -3 });
    // algunos visitantes paseando por el jardín
    const spots = [[3, 9, 1], [7, 12, -1], [11, 12, 1], [16, 9, -1], [16, 5, 1], [12, 2, 1], [20, 12, -1], [3, 15, -1], [14, 12, 1]];
    spots.forEach(([x, y, d]) => {
      const v = spawnVisitor(true);
      Object.assign(v, { x: x + 0.5, y: y + 0.5, state: 'look', fx: d, fy: -d, wait: 99, paid: true, moving: false });
    });
    for (let i = 0; i < 3; i++) drawWorld(0.016);
  } else {
    showTitle();
    centerTitle();
    G.hour = 8;
  }
  requestAnimationFrame(frame);
}
boot();
