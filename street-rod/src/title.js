// ===== Portada, licencia de conducir, cómo se juega y los finales =====
// Letras grandes cromadas (como el logo del original): degradado de cromo, borde oscuro y brillo
function chromeTitle(g, s, x, y, scale) {
  const size = scale * 7.4 + 1;
  g.save();
  g.font = `italic 900 ${size}px ${FONT_TITLE}`; g.textAlign = 'center'; g.textBaseline = 'top';
  const top = y + scale * 1.2, bot = top + size;
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText(s, x + scale * 0.6, top + scale * 0.8);
  g.lineJoin = 'round'; g.lineWidth = Math.max(2, scale * 0.9); g.strokeStyle = '#0c1a5a'; g.strokeText(s, x, top);
  const gr = g.createLinearGradient(0, top, 0, bot);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#c9e2ff'); gr.addColorStop(0.5, '#3a5f9c'); gr.addColorStop(0.52, '#a86a2c');
  gr.addColorStop(0.75, '#ffe9b0'); gr.addColorStop(1, '#ffffff');
  g.fillStyle = gr; g.fillText(s, x, top);
  g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.strokeText(s, x, top);
  g.restore();
}
function titleBackground() {
  return pxBackground('title', g => {
    g.fillStyle = PAL.k; g.fillRect(0, 0, PW, PH);
    stars(g, 0, 0, PW, 260, 200, 8);
    // luna y cerros
    g.fillStyle = PAL.c1; g.beginPath(); g.arc(590, 150, 18, 0, TAU); g.fill(); g.fillStyle = PAL.k; g.beginPath(); g.arc(598, 145, 16, 0, TAU); g.fill();
    g.fillStyle = PAL.p1; g.beginPath(); g.moveTo(0, 250); g.lineTo(100, 200); g.lineTo(220, 236); g.lineTo(360, 190); g.lineTo(500, 232); g.lineTo(PW, 200); g.lineTo(PW, 290); g.lineTo(0, 290); g.fill();
    // ciudad lejana con lucecitas
    const R = rng(77);
    for (let x = 0; x < PW; x += 14) { const h = 10 + Math.floor(R() * 30); g.fillStyle = PAL.g1; g.fillRect(x, 270 - h, 12, h); for (let k = 0; k < 4; k++) if (R() < 0.5) { g.fillStyle = PAL.y2; g.fillRect(x + 2 + Math.floor(R() * 8), 272 - h + Math.floor(R() * h), 1, 1); } }
    // camino que se pierde en el horizonte
    g.fillStyle = PAL.g1; g.fillRect(0, 270, PW, 130);
    g.fillStyle = PAL.k; g.beginPath(); g.moveTo(300, 270); g.lineTo(340, 270); g.lineTo(PW, PH); g.lineTo(0, PH); g.fill();
    g.fillStyle = PAL.y2; for (let k = 0; k < 8; k++) { const t = k / 8, y = 272 + t * t * 130, w = 2 + t * 10; g.fillRect(320 - w / 2, y, w, 2 + t * 8); }
  });
}
SCENES.title = {
  music: 'title', status: false,
  enter() { this.king = buildCar(KING.car); },
  key(code) { if (code === 'Enter' && hasSave()) this.cont(); },
  cont() { if (loadGame()) Game.go(S.over ? 'ending' : 'garage'); },
  draw(g) {
    const T = L();
    blit(g, titleBackground(), 0, 0);
    chromeTitle(g, 'STREET ROD', PW / 2, 14, 9);
    bulbText(g, T.subtitle, PW / 2 - (T.subtitle.length * (FONT_W + 1) * 5 - 5) / 2, 96, 5, '#ff7ad0', '#3a0c2a');
    // el Corvette negro de El Rey esperando en el camino
    drawCarSide(g, this.king, 455, 388, 2.0, { flip: true });
    // menú
    const items = [];
    if (hasSave()) items.push([T.title.cont, () => this.cont()]);
    items.push([T.title.fresh, () => Game.go('license')]);
    items.push([T.title.how, () => Game.go('how')]);
    items.push([T.title.fame, () => Game.go('fame')]);
    items.push([T.langSwitch, () => setLang(LANG === 'es' ? 'en' : 'es')]);
    items.push([T.musicLabel(Sound.musicOn), () => Sound.toggleMusic()]);
    items.push([T.title.more, () => { location.href = '../index.html'; }]);
    const w = 232, x = 24, y0 = 166;
    items.forEach(([label, fn], i) => { if (UI.button(g, x, y0 + i * 30, w, 26, label)) fn(); });
    ptext(g, T.title.credit, 24, 388, PAL.g4, 1);
  }
};

// La licencia de conducir del DMV: aquí se escribe el nombre
SCENES.license = {
  music: 'title', status: false,
  enter() {
    this.st = { text: '', done: false };
    nameEl.value = ''; nameEl.focus();
    this.look = { skin: PAL.b5, hc: PAL.b1, top: PAL.w };
  },
  onExit() { nameEl.blur(); },
  key(code) { if (code === 'Escape') Game.go('title'); },
  draw(g) {
    const T = L();
    g.fillStyle = PAL.u1; g.fillRect(0, 0, PW, PH);
    g.fillStyle = PAL.p1; for (let y = 0; y < PH; y += 4) g.fillRect(0, y, PW, 1);
    const x = 70, y = 50, w = 500, h = 290;
    g.fillStyle = PAL.k; g.fillRect(x + 6, y + 6, w, h);
    g.fillStyle = PAL.c1; g.fillRect(x, y, w, h);
    g.fillStyle = PAL.e2; g.fillRect(x, y, w, 50);
    ptext(g, T.license.state, x + w / 2, y + 6, PAL.y3, 2, { align: 'center' });
    ptext(g, T.license.dmv, x + w / 2, y + 30, PAL.w, 1, { align: 'center' });
    ptext(g, T.license.title, x + w / 2, y + 60, PAL.r2, 3, { align: 'center' });
    // la foto
    g.fillStyle = PAL.u4; g.fillRect(x + 20, y + 100, 110, 130);
    blit(g, pxPortrait(this.look), x + 19, y + 99);
    g.fillStyle = PAL.k; g.strokeStyle = PAL.k; g.lineWidth = 2; g.strokeRect(x + 20, y + 100, 110, 130);
    // el nombre (con el teclado; en el teléfono, tocar el campo abre el teclado)
    ptext(g, T.license.name, x + 150, y + 104, PAL.u1, 1);
    this.st.text = nameEl.value.toUpperCase().replace(/[^A-ZÁÉÍÓÚÑÜ .'-]/g, '').slice(0, 14);
    g.fillStyle = PAL.w; g.fillRect(x + 150, y + 116, 320, 28);
    ptext(g, this.st.text, x + 156, y + 120, PAL.k, 2);
    if (document.activeElement === nameEl && Math.floor(Game.t * 2.5) % 2) { g.fillStyle = PAL.k; g.fillRect(x + 158 + textWidth(this.st.text, 2), y + 122, 2, 18); }
    if (UI.hot(x + 150, y + 116, 320, 28, T.license.typeName, 'arrow')) nameEl.focus();
    const rows = [[T.license.born, '06-16-1946'], [T.license.city, 'Los Angeles, Calif.'], [T.license.cls, T.license.clsValue], [T.license.expires, '1967']];
    rows.forEach(([k, v], i) => { ptext(g, k, x + 150, y + 156 + i * 18, PAL.u1, 1); ptext(g, v, x + 260, y + 156 + i * 18, PAL.k, 1); });
    // el pelo y la polera se eligen con clics en la foto
    if (UI.hot(x + 20, y + 100, 110, 130, T.license.photo)) { const R = Math.random; this.look = { skin: rpick(R, [PAL.b5, PAL.b4, PAL.b3, PAL.b2]), hc: rpick(R, [PAL.k, PAL.b1, PAL.b3, PAL.y2, PAL.o2]), top: rpick(R, [PAL.w, PAL.r3, PAL.u3, PAL.k, PAL.e3]), shades: R() < 0.3 ? 1 : 0 }; }
    const ok = this.st.text.trim().length > 0;
    if (UI.button(g, x + w - 270, y + h - 44, 120, 30, T.ok, { disabled: !ok }) || (ok && UI.takeKey('Enter'))) this.start();
    if (UI.button(g, x + w - 140, y + h - 44, 120, 30, T.cancel)) Game.go('title');
  },
  start() {
    newGame(this.st.text.trim(), undefined);
    S.look = this.look;
    saveGame();
    nameEl.blur();
    Game.go('intro');
  }
};

// Textos de varias páginas sobre fondo gris con esquinas amarillas (como en el original)
// art(g, page): un dibujo debajo del texto de cada página (opcional)
function pagesScene(getPages, onEnd, music = 'title', art) {
  return {
    music, status: false,
    enter() { this.page = 0; },
    key(code) { if (code === 'Escape') onEnd(); else if (code === 'Enter' || code === 'Space') this.next(); },
    next() { if (++this.page >= getPages().length) onEnd(); },
    draw(g) {
      const T = L(), pages = getPages(), lines = pages[Math.min(this.page, pages.length - 1)];
      UI.textScreen(g, lines.flatMap(l => (l ? wrapText(l, 520, 2) : [''])));
      if (art) art(g, this.page);
      ptext(g, `${this.page + 1}/${pages.length}`, PW - 182, PH - 32, PAL.y2, 1, { align: 'right' });
      if (UI.button(g, PW - 170, PH - 40, 110, 26, this.page < pages.length - 1 ? T.next : T.ok) || UI.clicked(0, 0, PW, PH - 50)) this.next();
    }
  };
}
// La introducción: el auto de El Rey, y después el camino de un cacharro a un auto de verdad
const INTRO_CARS = {};
const introCar = (model, color, spec = {}) => INTRO_CARS[model] || (INTRO_CARS[model] = buildCar(Object.assign({ model, color }, spec)));
function introArt(g, page) {
  const king = INTRO_CARS.king || (INTRO_CARS.king = buildCar(KING.car));
  const floor = (x, w) => { const fg = g.createRadialGradient(x, 330, 0, x, 330, w); fg.addColorStop(0, 'rgba(255,211,107,0.18)'); fg.addColorStop(1, 'rgba(255,211,107,0)'); g.save(); g.translate(x, 330); g.scale(1, 0.12); g.translate(-x, -330); g.fillStyle = fg; g.fillRect(x - w, 330 - w, w * 2, w * 2); g.restore(); };
  if (page === 0) { floor(320, 220); drawCarSide(g, king, 320, 330, 1.75, { reflect: 0.12 }); return; }
  const row = [introCar('modelA', '#6a4a30'), introCar('chevy57', '#1a8a8a'), king];
  row.forEach((car, i) => { const x = 130 + i * 190; floor(x, 100); drawCarSide(g, car, x, 330, carScale(car.model, 150) * (0.85 + i * 0.1)); });
  for (const x of [225, 415]) { g.fillStyle = '#ffd36b'; g.beginPath(); g.moveTo(x - 7, 296); g.lineTo(x + 7, 304); g.lineTo(x - 7, 312); g.closePath(); g.fill(); }
}
SCENES.intro = pagesScene(() => L().intro, () => { Game.go('garage'); Game.tell(L().g.startTip, 6); }, 'title', introArt);
SCENES.how = pagesScene(() => L().how, () => Game.go('title'));
// El muro de los Reyes de la Calle
SCENES.fame = {
  music: 'title', status: false,
  key(code) { if (code === 'Escape' || code === 'Enter') Game.go('title'); },
  draw(g) {
    const T = L(), list = fameList();
    UI.textScreen(g, []);
    chromeTitle(g, T.fame.title, PW / 2, 46, 3);
    if (!list.length) ptext(g, T.fame.empty, PW / 2, 170, PAL.y3, 2, { align: 'center' });
    list.forEach((f, i) => {
      ptext(g, `${i + 1}. ${f.name}`, 110, 100 + i * 24, PAL.y3, 2, { shadow: PAL.y1 });
      ptext(g, T.fame.hours(f.hours), 530, 100 + i * 24, PAL.y3, 2, { align: 'right', shadow: PAL.y1 });
    });
    if (UI.button(g, PW / 2 - 55, PH - 44, 110, 26, T.ok) || UI.clicked(0, 0, PW, PH - 50)) Game.go(Game.fameBack || 'title');
  }
};
// Los finales: le ganaste al Rey, se acabó el verano, sin plata o preso
SCENES.ending = {
  music: 'title', status: false,
  enter() {
    this.kind = S.over || 'summer';
    if (this.kind === 'king') Sound.setMusic('win');
    this.page = 0;
  },
  draw(g) {
    const T = L(), E = T.end[this.kind];
    if (this.kind === 'king' && this.page === 0) {
      blit(g, titleBackground(), 0, 0);
      drawCarSide(g, buildCar(KING.car), PW / 2, 382, 2.3);
      chromeTitle(g, T.end.kingTitle, PW / 2, 30, 5);
      wrapText(E[0], 560, 2).forEach((l, i) => ptext(g, l, PW / 2, 100 + i * 22, PAL.y3, 2, { align: 'center', shadow: PAL.k }));
    } else {
      const lines = this.kind === 'king' ? E.slice(1) : E;
      UI.textScreen(g, lines.flatMap(l => (l ? wrapText(l, 520, 2) : [''])).concat(['', T.end.stats(S.wins.drag + S.wins.road + S.wins.kicks, S.losses, money(S.money), S.day)]));
    }
    if (UI.clicked(0, 0, PW, PH) || UI.takeKey('Enter', 'Space')) {
      if (this.kind === 'king' && this.page === 0) { this.page = 1; return; }
      try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ }
      Game.fameBack = 'title';
      Game.go(this.kind === 'king' ? 'fame' : 'title');
    }
  }
};
// La portada para el catálogo del sitio (?cover)
SCENES.cover = {
  music: null, status: false,
  enter() { this.k = buildCar(KING.car); this.r = buildCar({ model: 'ford32', color: '#d02c2c', engine: 'fd312', intake: '2x4', tires: 'slick', stickers: { flames: 1 } }); },
  draw(g) {
    drawDriveIn(g, 3, { car: this.k, carX: 330, flip: true, bgCars: DINER_BG.map(([m, col]) => makeCar(m, { color: col })) });
    speechBubble(g, LANG === 'es' ? '¿Una picada, chico?' : 'Wanna race, kid?', 482, 226, 366, 322);
  }
};
