// ===== El taller: el motor visto desde arriba, la caja desde abajo, las ruedas y la lámpara de tiempo =====
// Como en el original: con la llave se sacan los pernos uno por uno; sin pernos, la pieza sale.
const FAM_COLOR = { gm: PAL.o2, ford: PAL.u2, mopar: PAL.r3 };
const BAY = { cx: 320, top: 70, bot: 330 };

// Dónde va cada cosa del motor según sea V-8 o de 6 cilindros
function engineLayout(kind) {
  const v8 = kind !== '6';
  const ix = v8 ? 320 : 286;                       // eje del múltiple (el 6 lo tiene a un lado)
  return {
    v8, ix,
    mounts: [[196, 140], [444, 140], [196, 280], [444, 280]],
    intake: { x: ix - (v8 ? 52 : 36), y: 104, w: v8 ? 104 : 72, h: 196 },
    intakeBolts: v8 ? [[272, 116], [368, 116], [272, 202], [368, 202], [272, 288], [368, 288]] : [[254, 116], [318, 116], [254, 202], [318, 202], [254, 288], [318, 288]],
    carbs: n => (n === 1 ? [[ix, 202]] : n === 2 ? [[ix, 158], [ix, 246]] : [[ix, 136], [ix, 202], [ix, 268]])
  };
}
const carbBolts = (cx, cy, r) => [[cx - r, cy - r], [cx + r, cy - r], [cx - r, cy + r], [cx + r, cy + r]];

function bayBackground(color) {
  return pxBackground('bay:' + color, g => {
    const ramp = paintRamp(color);
    g.fillStyle = PAL.g1; g.fillRect(0, 0, PW, PH);
    g.fillStyle = PAL.k; for (let y = 0; y < 380; y += 3) for (let x = (y % 6) ? 0 : 1; x < PW; x += 3) g.fillRect(x, y, 1, 1);
    // guardabarros a los lados (color del auto)
    for (const [x, w] of [[0, 92], [548, 92]]) {
      g.fillStyle = ramp.md; g.fillRect(x, 0, w, 380);
      g.fillStyle = ramp.lt; g.fillRect(x + (x ? 10 : w - 30), 0, 14, 380);
      g.fillStyle = ramp.hi; g.fillRect(x + (x ? 14 : w - 26), 0, 3, 380);
      g.fillStyle = ramp.dk; g.fillRect(x ? x : w - 6, 0, 6, 380);
    }
    // pasos de rueda dentro del motor
    for (const x of [92, 470]) { g.fillStyle = PAL.k; g.beginPath(); g.ellipse(x + 39, 88, 40, 58, 0, 0, TAU); g.fill(); g.fillStyle = PAL.g2; g.beginPath(); g.ellipse(x + 39, 90, 30, 46, 0, 0, TAU); g.fill(); }
    // radiador y parrilla arriba
    g.fillStyle = PAL.g6; g.fillRect(92, 0, 456, 10);
    g.fillStyle = PAL.g2; g.fillRect(120, 10, 400, 34);
    g.fillStyle = PAL.g3; for (let x = 124; x < 516; x += 4) g.fillRect(x, 12, 1, 30);
    g.fillStyle = PAL.g5; g.fillRect(120, 10, 400, 3); g.fillRect(304, 2, 32, 10); g.fillStyle = PAL.g6; g.fillRect(310, 2, 20, 4);
    // batería y cilindro de freno
    g.fillStyle = PAL.k; g.fillRect(470, 180, 54, 40); g.fillStyle = PAL.g2; g.fillRect(472, 182, 50, 8);
    g.fillStyle = PAL.r3; g.fillRect(478, 176, 8, 6); g.fillStyle = PAL.g4; g.fillRect(508, 176, 8, 6);
    g.fillStyle = PAL.g4; g.fillRect(110, 300, 34, 22); g.fillStyle = PAL.g6; g.fillRect(114, 296, 26, 6);
    // muro de fuego abajo
    g.fillStyle = PAL.k; g.fillRect(92, 336, 456, 44);
    g.fillStyle = PAL.g2; g.fillRect(92, 336, 456, 4);
    g.fillStyle = PAL.g3; for (let x = 110; x < 540; x += 30) g.fillRect(x, 350, 12, 3);
  });
}

// El motor completo (sirve también para mirar bajo el capó del rival). Devuelve los pernos con su posición.
function drawEngineBay(g, car) {
  g.drawImage(bayBackground(car.color), 0, 0);
  const p = car.p, bolts = [];
  const kind = p.engine ? ENGINES[p.engine.k].kind : (ENGINES[MODELS[car.model].stock.engine].kind);
  const Lo = engineLayout(kind);
  // soportes del motor (se ven siempre)
  for (const [x, y] of Lo.mounts) { g.fillStyle = PAL.g3; g.fillRect(x - 14, y - 10, 28, 20); g.fillStyle = PAL.g2; g.fillRect(x - 14, y + 6, 28, 4); }
  if (p.engine) {
    const fam = ENGINES[p.engine.k].fam, col = FAM_COLOR[fam], ramp = paintRamp(col);
    // bloque, ventilador y poleas
    g.fillStyle = PAL.g2; g.fillRect(212, 84, 216, 236);
    g.fillStyle = PAL.g3; g.fillRect(212, 84, 216, 4);
    g.fillStyle = PAL.g4; g.beginPath(); g.arc(320, 64, 18, 0, TAU); g.fill();
    g.fillStyle = PAL.k; for (let a = 0; a < 4; a++) { g.save(); g.translate(320, 64); g.rotate(a * Math.PI / 2 + 0.4); g.fillRect(-4, -34, 8, 30); g.restore(); }
    g.fillStyle = PAL.g6; g.beginPath(); g.arc(320, 64, 6, 0, TAU); g.fill();
    g.strokeStyle = PAL.k; g.lineWidth = 4; g.beginPath(); g.moveTo(300, 70); g.lineTo(262, 92); g.moveTo(340, 70); g.lineTo(378, 92); g.stroke();
    // múltiples de escape a los costados
    g.fillStyle = PAL.b2;
    for (const x of Lo.v8 ? [196, 428] : [404]) { g.fillRect(x, 110, 16, 190); for (let i = 0; i < (Lo.v8 ? 4 : 6); i++) g.fillRect(x + (x < 300 ? 10 : -6), 120 + i * (Lo.v8 ? 48 : 30), 12, 14); }
    // tapas de válvulas del color de la marca
    const cover = (x, w) => {
      g.fillStyle = ramp.dk; g.fillRect(x, 98, w, 212);
      g.fillStyle = ramp.md; g.fillRect(x + 2, 98, w - 6, 208);
      g.fillStyle = ramp.lt; g.fillRect(x + 6, 102, 4, 200);
      for (let y = 112; y < 300; y += 46) { g.fillStyle = PAL.g6; g.fillRect(x + w / 2 - 3, y, 6, 6); g.fillStyle = PAL.g3; g.fillRect(x + w / 2 - 1, y + 2, 2, 2); }
      ptext(g, FAM_NAME[fam], x + w / 2, 196, PAL.w, 1, { align: 'center' });
    };
    if (Lo.v8) { cover(214, 46); cover(380, 46); } else cover(334, 64);
    // pernos del motor (en los soportes)
    Lo.mounts.forEach(([x, y], i) => bolts.push({ sl: 'engine', i, x, y }));
    if (p.intake) {
      const I = Lo.intake, alu = p.intake.k === 'race';
      g.fillStyle = alu ? PAL.g5 : PAL.g3; g.fillRect(I.x, I.y, I.w, I.h);
      g.fillStyle = alu ? PAL.w : PAL.g4; g.fillRect(I.x, I.y, I.w, 3); g.fillRect(I.x, I.y, 3, I.h);
      g.fillStyle = alu ? PAL.g4 : PAL.g2; g.fillRect(I.x + I.w - 3, I.y, 3, I.h); g.fillRect(I.x, I.y + I.h - 3, I.w, 3);
      // runners hacia las culatas
      g.fillStyle = alu ? PAL.g6 : PAL.g4;
      for (let k = 0; k < 4; k++) { const y = I.y + 24 + k * 44; g.fillRect(I.x - (Lo.v8 ? 10 : 0), y, 10, 14); if (Lo.v8) g.fillRect(I.x + I.w, y, 10, 14); else g.fillRect(I.x + I.w, y, 14, 14); }
      Lo.intakeBolts.forEach(([x, y], i) => bolts.push({ sl: 'intake', i, x, y }));
      const n = INTAKES[p.intake.k].n;
      Lo.carbs(n).forEach(([cx, cy], k) => {
        const sl = 'carb' + k, c = p[sl], r = n === 3 ? 13 : 15;
        // base del carburador (siempre se ve si el múltiple está puesto)
        g.fillStyle = PAL.g2; g.fillRect(cx - r - 3, cy - r - 3, 2 * r + 6, 2 * r + 6);
        if (c) {
          const race = c.k === '4R', big = c.k !== '2';
          g.fillStyle = PAL.g4; g.fillRect(cx - r, cy - r, 2 * r, 2 * r);
          if (race) {
            // carburador de carrera: cornetas cromadas abiertas
            for (const [dx, dy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) { g.fillStyle = PAL.w; g.beginPath(); g.arc(cx + dx, cy + dy, 6, 0, TAU); g.fill(); g.fillStyle = PAL.k; g.beginPath(); g.arc(cx + dx, cy + dy, 3, 0, TAU); g.fill(); }
          } else {
            // filtro de aire redondo y cromado con su mariposa
            const ar = big ? r + 11 : r + 6;
            g.fillStyle = PAL.g2; g.beginPath(); g.arc(cx, cy, ar + 1, 0, TAU); g.fill();
            g.fillStyle = PAL.g5; g.beginPath(); g.arc(cx, cy, ar, 0, TAU); g.fill();
            g.fillStyle = PAL.w; g.beginPath(); g.arc(cx - ar * 0.3, cy - ar * 0.3, ar * 0.45, 0, TAU); g.fill();
            g.fillStyle = PAL.g6; g.beginPath(); g.arc(cx, cy, ar * 0.7, 0, TAU); g.fill();
            g.fillStyle = PAL.g3; g.fillRect(cx - 7, cy - 2, 14, 4); g.fillStyle = PAL.g4; g.fillRect(cx - 2, cy - 2, 4, 4);
          }
        }
        carbBolts(cx, cy, r + 1).forEach(([x, y], i) => bolts.push({ sl, i, x, y, hidden: !c }));
      });
    } else {
      // sin múltiple: se ven las lumbreras del bloque
      const I = Lo.intake;
      g.fillStyle = PAL.k; g.fillRect(I.x + 6, I.y + 6, I.w - 12, I.h - 12);
      g.fillStyle = PAL.g3; for (let k = 0; k < 4; k++) { g.fillRect(I.x + 10, I.y + 24 + k * 44, 12, 12); g.fillRect(I.x + I.w - 22, I.y + 24 + k * 44, 12, 12); }
      Lo.intakeBolts.forEach(([x, y], i) => bolts.push({ sl: 'intake', i, x, y, hidden: true }));
    }
  } else {
    // sin motor: el hueco y la caja al fondo
    g.fillStyle = PAL.k; g.fillRect(230, 100, 180, 220);
    g.fillStyle = PAL.g2; g.beginPath(); g.moveTo(270, 330); g.lineTo(370, 330); g.lineTo(350, 300); g.lineTo(290, 300); g.fill();
    Lo.mounts.forEach(([x, y], i) => bolts.push({ sl: 'engine', i, x, y, hidden: true }));
  }
  // los pernos: tuerca hexagonal si está puesto, agujero si no
  for (const b of bolts) {
    if (b.hidden) continue;
    b.on = boltOn(car, b.sl, b.i);
    if (b.on) { g.fillStyle = PAL.k; g.fillRect(b.x - 5, b.y - 5, 10, 10); g.fillStyle = PAL.g5; g.fillRect(b.x - 4, b.y - 4, 8, 8); g.fillStyle = PAL.w; g.fillRect(b.x - 4, b.y - 4, 8, 2); g.fillStyle = PAL.g3; g.fillRect(b.x - 1, b.y - 1, 3, 3); }
    else { g.fillStyle = PAL.g4; g.fillRect(b.x - 3, b.y - 3, 6, 6); g.fillStyle = PAL.k; g.fillRect(b.x - 2, b.y - 2, 4, 4); }
  }
  return bolts.filter(b => !b.hidden);
}

// Lo común de las tres vistas del taller: pernos, botones rojos y lista de repuestos
function boltClicks(g, car, bolts) {
  const T = L();
  for (const b of bolts) {
    if (!UI.over(b.x - 8, b.y - 8, 16, 16)) continue;
    g.strokeStyle = PAL.y3; g.lineWidth = 1; g.strokeRect(b.x - 7.5, b.y - 7.5, 15, 15);
    if (UI.hot(b.x - 8, b.y - 8, 16, 16, T.slot[SLOT_INFO[b.sl].t] + (b.on ? ' · ' + T.mech.loosen : ' · ' + T.mech.tighten), 'wrench')) {
      if (b.on) {
        const bl = blockers(car, b.sl);
        if (bl.length) { Sound.sfx.nope(); Game.tell(T.mech.blocked(T.slot[SLOT_INFO[bl[0]].t])); return; }
        loosenBolt(car, b.sl, b.i); Sound.sfx.ratchet();
        if (!car.tight[b.sl]) {
          const part = car.p[b.sl];
          removePart(car, b.sl); Sound.sfx.clunk();
          Game.tell(T.mech.removed(partName(part)));
        }
      } else { tightenBolt(car, b.sl, b.i); Sound.sfx.ratchet(); if (car.tight[b.sl] === allBolts(b.sl)) Game.tell(T.mech.tight); }
      saveGame();
      return;
    }
  }
}
// Lista de repuestos que se pueden poner en esta vista
function installBox(car, types, title) {
  const T = L();
  listBox(title, () => S.spares.filter(p => types.includes(p.t)).map(p => ({ label: partName(p), right: Math.round(p.c * 100) + '%', p })), [
    { label: T.mech.install, fn: (i, it) => {
      const r = installPart(car, it.p.id);
      if (!r.sl) { Sound.sfx.nope(); say(T.why[r.why] || T.why.type); return; }
      Sound.sfx.clunk(); Game.tell(T.mech.boltIt); saveGame();
    } },
    { label: T.forget, need: false, fn: () => {} }
  ], { empty: T.mech.noneFit, info: (g, it, x, y) => ptext(g, T.g.fits(partFam(it.p)), x, y, PAL.e4, 1) });
}
// Los botones rojos de la derecha (TUNE / PARTS / DONE en el original)
function redButtons(g, items) {
  items.forEach(([label, fn, dis], i) => { if (UI.button(g, 548, 214 + i * 40, 88, 36, label, { style: 'red', disabled: dis })) fn(); });
}
// Cartel de abajo con lo que tiene puesto el auto en esta vista
function partsCaption(g, car, slots) {
  g.fillStyle = PAL.k; g.fillRect(0, 344, 540, 36);
  slots.forEach((sl, i) => ptext(g, slotLine(car, sl), 8, 346 + i * 12, PAL.g6, 1));
}

SCENES.engine = {
  music: 'garage',
  enter(o) { this.car = o.car; this.ro = !!o.readOnly; this.back = o.back || (() => Game.go('garage')); Sound.sfx.hood(); },
  key(code) { if (code === 'Escape') this.back(); },
  draw(g) {
    const T = L(), car = this.car;
    const bolts = drawEngineBay(g, car);
    // nombres de las piezas (abajo)
    g.fillStyle = PAL.k; g.fillRect(0, 344, 540, 36);
    const p = car.p, n = carbCount(car);
    ptext(g, `${T.slot.engine}: ${p.engine ? partName(p.engine) + ' (' + Math.round(p.engine.c * 100) + '%)' : T.none}`, 8, 346, PAL.g6, 1);
    ptext(g, `${T.slot.intake}: ${p.intake ? T.parts.intakeShort[p.intake.k] : T.none}` + (n ? ` · ${T.slot.carb}: ${[0, 1, 2].slice(0, n).map(i => (p['carb' + i] ? T.parts.carbShort[p['carb' + i].k] : '—')).join(' + ')}` : ''), 8, 358, PAL.g6, 1);
    if (this.ro) {
      ptext(g, T.mech.rivalHood, 320, 6, PAL.y3, 2, { align: 'center', shadow: PAL.k });
      redButtons(g, [[T.done, this.back]]);
      return;
    }
    if (!Game.dialogs.length) boltClicks(g, car, bolts);
    redButtons(g, [
      [T.mech.tune, () => Game.go('tune', { car }), !p.engine],
      [T.mech.parts, () => installBox(car, ['engine', 'intake', 'carb'], T.mech.engineParts)],
      [T.done, this.back]
    ]);
  }
};

// La caja de cambios vista desde abajo del auto
SCENES.trans = {
  music: 'garage',
  enter(o) { this.car = o.car; },
  key(code) { if (code === 'Escape') Game.go('garage'); },
  draw(g) {
    const T = L(), car = this.car, p = car.p.trans;
    g.drawImage(underBackground(), 0, 0);
    const bolts = [[196, 150], [196, 250], [252, 128], [252, 272]].map(([x, y], i) => ({ sl: 'trans', i, x, y }));
    if (p) {
      const race = p.k === 'race4', auto = TRANS[p.k].auto;
      // campana, caja y cola
      g.fillStyle = PAL.k; g.fillRect(176, 118, 6, 164);
      g.fillStyle = race ? PAL.g6 : PAL.g5; g.beginPath(); g.moveTo(182, 120); g.lineTo(264, 150); g.lineTo(264, 250); g.lineTo(182, 280); g.fill();
      g.fillStyle = race ? PAL.w : PAL.g6; g.beginPath(); g.moveTo(182, 120); g.lineTo(264, 150); g.lineTo(264, 156); g.lineTo(182, 128); g.fill();
      g.fillStyle = race ? PAL.g5 : PAL.g4; g.fillRect(264, 150, 150, 100);
      g.fillStyle = race ? PAL.w : PAL.g5; for (let x = 274; x < 410; x += 14) g.fillRect(x, 154, 3, 92);
      g.fillStyle = race ? PAL.g6 : PAL.g4; g.fillRect(414, 172, 60, 56); g.fillStyle = PAL.g5; g.fillRect(414, 172, 60, 3);
      if (auto) { g.fillStyle = PAL.g2; g.beginPath(); g.ellipse(340, 200, 60, 40, 0, 0, TAU); g.fill(); g.fillStyle = PAL.g3; g.beginPath(); g.ellipse(340, 200, 54, 34, 0, 0, TAU); g.fill(); for (let a = 0; a < 10; a++) { g.fillStyle = PAL.g5; g.fillRect(340 + Math.cos(a / 10 * TAU) * 56 - 1, 200 + Math.sin(a / 10 * TAU) * 37 - 1, 3, 3); } }
      else { g.strokeStyle = PAL.g6; g.lineWidth = 3; g.beginPath(); g.moveTo(330, 250); g.lineTo(330, 290); g.lineTo(380, 300); g.moveTo(360, 250); g.lineTo(360, 280); g.stroke(); }
      ptext(g, FAM_NAME[p.f] || 'ALL', 340, 160, PAL.k, 1, { align: 'center' });
      bolts.forEach(b => { b.on = boltOn(car, 'trans', b.i); });
    } else {
      g.fillStyle = PAL.k; g.beginPath(); g.ellipse(200, 200, 30, 60, 0, 0, TAU); g.fill();
      bolts.forEach(b => { b.on = false; });
    }
    for (const b of bolts) {
      if (!p) { g.fillStyle = PAL.g4; g.fillRect(b.x - 3, b.y - 3, 6, 6); g.fillStyle = PAL.k; g.fillRect(b.x - 2, b.y - 2, 4, 4); continue; }
      if (b.on) { g.fillStyle = PAL.k; g.fillRect(b.x - 5, b.y - 5, 10, 10); g.fillStyle = PAL.g5; g.fillRect(b.x - 4, b.y - 4, 8, 8); g.fillStyle = PAL.w; g.fillRect(b.x - 4, b.y - 4, 8, 2); }
      else { g.fillStyle = PAL.g4; g.fillRect(b.x - 3, b.y - 3, 6, 6); g.fillStyle = PAL.k; g.fillRect(b.x - 2, b.y - 2, 4, 4); }
    }
    partsCaption(g, car, ['trans']);
    if (p && !Game.dialogs.length) boltClicks(g, car, bolts);
    redButtons(g, [[T.mech.select, () => installBox(car, ['trans'], T.mech.transParts)], [T.done, () => Game.go('garage')]]);
  }
};
function underBackground() {
  return pxBackground('under', g => {
    g.fillStyle = PAL.g1; g.fillRect(0, 0, PW, PH);
    g.fillStyle = PAL.k; for (let y = 0; y < 380; y += 2) for (let x = (y % 4) ? 0 : 1; x < PW; x += 2) if ((x * 7 + y * 3) % 5 === 0) g.fillRect(x, y, 1, 1);
    // largueros del chasis
    for (const y of [90, 300]) { g.fillStyle = PAL.g2; g.fillRect(0, y, PW, 18); g.fillStyle = PAL.g3; g.fillRect(0, y, PW, 3); }
    // cárter del motor a la izquierda
    g.fillStyle = PAL.g2; g.fillRect(0, 130, 176, 140); g.fillStyle = PAL.g3; g.fillRect(0, 130, 176, 3); g.fillRect(0, 267, 176, 3);
    g.fillStyle = PAL.g3; for (let x = 10; x < 170; x += 22) { g.fillRect(x, 134, 4, 4); g.fillRect(x, 262, 4, 4); }
    g.fillStyle = PAL.g4; g.fillRect(110, 192, 14, 14); g.fillStyle = PAL.g5; g.fillRect(112, 194, 6, 4);
    // escapes
    g.fillStyle = PAL.b2; g.fillRect(0, 118, PW, 10); g.fillRect(0, 272, PW, 10);
    g.fillStyle = PAL.b3; g.fillRect(0, 118, PW, 2); g.fillRect(0, 272, PW, 2);
    g.fillStyle = PAL.g3; g.fillRect(520, 110, 80, 26); g.fillRect(520, 264, 80, 26);
    // cardán hacia atrás
    g.fillStyle = PAL.g4; g.fillRect(474, 190, 170, 20); g.fillStyle = PAL.g6; g.fillRect(474, 192, 170, 3);
  });
}

// Las ruedas: los cuatro neumáticos son un juego; se cambian sacando las 5 tuercas
SCENES.tires = {
  music: 'garage',
  enter(o) { this.car = o.car; },
  key(code) { if (code === 'Escape') Game.go('garage'); },
  draw(g) {
    const T = L(), car = this.car, p = car.p.tires, ramp = paintRamp(car.color);
    g.drawImage(garageBackground(), 0, 0);
    g.fillStyle = PAL.k; g.globalAlpha = 0.55; g.fillRect(0, 0, PW, PH); g.globalAlpha = 1;
    // el guardabarros encima de la rueda
    g.fillStyle = ramp.md; g.beginPath(); g.moveTo(40, 0); g.lineTo(540, 0); g.lineTo(540, 120); g.arc(290, 200, 186, -0.2, Math.PI + 0.2, true); g.lineTo(40, 120); g.fill();
    g.fillStyle = ramp.lt; g.fillRect(40, 20, 500, 6);
    g.fillStyle = PAL.k; g.beginPath(); g.arc(290, 200, 190, Math.PI, TAU); g.fill();
    const cx = 290, cy = 210, bolts = [];
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; bolts.push({ sl: 'tires', i, x: Math.round(cx + Math.cos(a) * 34), y: Math.round(cy + Math.sin(a) * 34) }); }
    if (p) {
      const slick = p.k === 'slick';
      g.fillStyle = PAL.g1; g.beginPath(); g.arc(cx, cy, 160, 0, TAU); g.fill();
      if (!slick) { g.fillStyle = PAL.g2; for (let a = 0; a < 48; a++) { const t = a / 48 * TAU; g.fillRect(cx + Math.cos(t) * 154 - 2, cy + Math.sin(t) * 154 - 2, 4, 4); } }
      else { g.fillStyle = PAL.g3; g.beginPath(); g.arc(cx - 40, cy - 60, 100, Math.PI * 1.1, Math.PI * 1.5); g.lineTo(cx - 40, cy - 60); g.fill(); g.fillStyle = PAL.g1; g.beginPath(); g.arc(cx, cy, 140, 0, TAU); g.fill(); ptext(g, 'RACING', cx, cy - 134, PAL.w, 2, { align: 'center' }); }
      if (p.k === 'ww') { g.fillStyle = PAL.w; g.beginPath(); g.arc(cx, cy, 118, 0, TAU); g.fill(); g.fillStyle = PAL.g1; g.beginPath(); g.arc(cx, cy, 98, 0, TAU); g.fill(); }
      // la llanta: rojo o del color del auto, con su centro
      g.fillStyle = slick ? PAL.g5 : ramp.md; g.beginPath(); g.arc(cx, cy, 90, 0, TAU); g.fill();
      g.strokeStyle = slick ? PAL.w : ramp.lt; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, 82, Math.PI * 1.05, Math.PI * 1.55); g.stroke();
      g.strokeStyle = ramp.dk; g.beginPath(); g.arc(cx, cy, 82, Math.PI * 0.1, Math.PI * 0.6); g.stroke();
      if (slick) for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.6; g.fillStyle = PAL.g3; g.beginPath(); g.arc(cx + Math.cos(a) * 62, cy + Math.sin(a) * 62, 14, 0, TAU); g.fill(); }
      g.fillStyle = PAL.g4; g.beginPath(); g.arc(cx, cy, 50, 0, TAU); g.fill();
      g.fillStyle = PAL.g5; g.beginPath(); g.arc(cx, cy, 44, 0, TAU); g.fill();
      g.fillStyle = PAL.g3; g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.fill();
      if (p.c < 0.4) { g.fillStyle = PAL.g3; for (let i = 0; i < 8; i++) g.fillRect(cx - 150 + i * 6, cy + 40 - i * 9, 4, 3); }
      for (const b of bolts) {
        b.on = boltOn(car, 'tires', b.i);
        if (b.on) { g.fillStyle = PAL.k; g.fillRect(b.x - 6, b.y - 6, 12, 12); g.fillStyle = PAL.g6; g.fillRect(b.x - 5, b.y - 5, 10, 10); g.fillStyle = PAL.w; g.fillRect(b.x - 5, b.y - 5, 10, 3); g.fillStyle = PAL.g4; g.fillRect(b.x - 2, b.y - 2, 4, 4); }
        else { g.fillStyle = PAL.g5; g.fillRect(b.x - 2, b.y - 2, 4, 4); }
      }
    } else {
      // sin neumáticos: el tambor de freno con sus pernos
      g.fillStyle = PAL.b2; g.beginPath(); g.arc(cx, cy, 92, 0, TAU); g.fill();
      g.fillStyle = PAL.b3; g.beginPath(); g.arc(cx, cy, 80, 0, TAU); g.fill();
      g.fillStyle = PAL.g3; g.beginPath(); g.arc(cx, cy, 50, 0, TAU); g.fill();
      for (const b of bolts) { g.fillStyle = PAL.g6; g.fillRect(b.x - 2, b.y - 2, 4, 4); }
      g.fillStyle = PAL.g2; g.fillRect(cx - 50, cy + 150, 100, 30);
    }
    partsCaption(g, car, ['tires']);
    if (p && !Game.dialogs.length) boltClicks(g, car, bolts);
    redButtons(g, [[T.mech.select, () => installBox(car, ['tires'], T.mech.tireParts)], [T.done, () => Game.go('garage')]]);
  }
};

// Afinar con la lámpara de tiempo: la marca blanca de la polea tiene que quedar en el 0
SCENES.tune = {
  music: 'garage',
  enter(o) { this.car = o.car; this.spin = 0; },
  key(code) {
    if (code === 'Escape') this.done();
    if (code === 'ArrowLeft') this.turn(-1);
    if (code === 'ArrowRight') this.turn(1);
  },
  turn(d) { this.car.tune = clamp(Math.round(this.car.tune || 0) + d, -12, 12); _etCache.clear(); Sound.sfx.click(); },
  done() { saveGame(); Game.go('engine', { car: this.car }); },
  update(dt) { this.spin += dt * 40; },
  draw(g) {
    const T = L(), car = this.car;
    const cx = 290, cy = 210, R = 120;
    g.fillStyle = PAL.k; g.fillRect(0, 0, PW, PH);
    const flash = Math.floor(Game.t * 6) % 2 === 0;
    // el frente del motor en penumbra
    g.fillStyle = PAL.g1; g.fillRect(60, 30, 460, 330);
    g.fillStyle = PAL.g2; g.fillRect(80, 40, 420, 20);
    // la polea: con el destello de la lámpara se ve quieta; entre destellos, borrosa
    g.fillStyle = flash ? PAL.g4 : PAL.g2; g.beginPath(); g.arc(cx, cy, R + 8, 0, TAU); g.fill();
    g.fillStyle = flash ? PAL.g3 : PAL.g1; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
    g.fillStyle = flash ? PAL.g5 : PAL.g2; g.beginPath(); g.arc(cx, cy, 40, 0, TAU); g.fill();
    g.fillStyle = PAL.k; g.beginPath(); g.arc(cx, cy, 14, 0, TAU); g.fill();
    g.strokeStyle = PAL.k; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R - 14, 0, TAU); g.stroke();
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; g.fillStyle = PAL.k; g.fillRect(cx + Math.cos(a) * 27 - 3, cy + Math.sin(a) * 27 - 3, 6, 6); }
    // escala de grados arriba de la polea
    g.fillStyle = PAL.g5; g.fillRect(cx - 110, cy - R - 40, 220, 26);
    for (let d = -10; d <= 10; d += 2) {
      const x = cx + d * 10;
      g.fillStyle = PAL.k; g.fillRect(x - 1, cy - R - 26, 2, d === 0 ? 12 : 7);
      if (d % 4 === 0 || d === 0) ptext(g, String(Math.abs(d)), x, cy - R - 38, d === 0 ? PAL.r3 : PAL.k, 1, { align: 'center' });
    }
    // la marca: con destello, queda donde está el encendido; sin destello, gira
    const off = clamp(car.tune || 0, -12, 12);
    const a = flash ? -Math.PI / 2 + off * 10 / R : this.spin;
    g.save(); g.translate(cx, cy); g.rotate(a + Math.PI / 2);
    g.fillStyle = flash ? PAL.w : PAL.g3; g.fillRect(-2, -R, 4, 26);
    g.restore();
    // la lámpara de tiempo (pistola) y su luz
    if (flash) { g.fillStyle = 'rgba(255,240,138,0.25)'; g.beginPath(); g.moveTo(124, 316); g.lineTo(cx - 60, cy - R + 30); g.lineTo(cx + 40, cy - R - 10); g.fill(); }
    g.fillStyle = PAL.r3; g.beginPath(); g.moveTo(120, 300); g.lineTo(40, 320); g.lineTo(50, 350); g.lineTo(128, 330); g.fill();
    g.fillStyle = PAL.r2; g.fillRect(62, 336, 18, 40);
    g.fillStyle = flash ? PAL.y3 : PAL.g3; g.beginPath(); g.arc(124, 316, 12, 0, TAU); g.fill();
    ptext(g, T.mech.tuneHelp, cx, 8, PAL.y3, 2, { align: 'center' });
    if (Math.round(off) === 0) ptext(g, T.mech.tuned, cx, 366, PAL.e3, 2, { align: 'center' });
    redButtons(g, [['◄', () => this.turn(-1)], ['►', () => this.turn(1)], [T.done, () => this.done()]]);
  }
};
