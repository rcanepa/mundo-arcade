// ===== El taller: el motor visto desde arriba, la caja desde abajo, las ruedas y la lámpara de tiempo =====
// Como en el original: con la llave se sacan los pernos uno por uno; sin pernos, la pieza sale.
const FAM_COLOR = { gm: PAL.o2, ford: PAL.u2, mopar: PAL.r3 };
const BAY = { cx: 320, top: 70, bot: 330 };

// Dónde va cada cosa del motor según sea V-8 o de 6 cilindros
function engineLayout(kind) {
  const v8 = kind === '8';
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

// Brillo de metal: de x0,y0 a x1,y1, claro al medio como un tubo o una tapa pulida
function metal(g, x0, y0, x1, y1, base, k = 1) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, css(shade(base, -0.25 * k))); gr.addColorStop(0.35, css(shade(base, 0.35 * k)));
  gr.addColorStop(0.55, css(rgbOf(base))); gr.addColorStop(1, css(shade(base, -0.4 * k)));
  return gr;
}
// Cromo redondo (filtro de aire, poleas): anillo brillante con el centro más oscuro
function chromeDisc(g, cx, cy, r) {
  oval(g, cx + 1.5, cy + 2.5, r + 1, r + 1, 'rgba(0,0,0,0.45)');
  const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.35, '#d4d8de'); gr.addColorStop(0.75, '#8a9098'); gr.addColorStop(1, '#4a4e56');
  oval(g, cx, cy, r, r, gr);
  g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, r * 0.72, Math.PI * 0.9, Math.PI * 1.6); g.stroke();
}
function hexNut(g, x, y, r, on) {
  if (!on) { oval(g, x, y, r * 0.75, r * 0.75, '#6a6e76'); oval(g, x, y, r * 0.5, r * 0.5, '#050506'); return; }
  oval(g, x + 0.8, y + 1.2, r, r, 'rgba(0,0,0,0.5)');
  const gr = g.createLinearGradient(x - r, y - r, x + r, y + r);
  gr.addColorStop(0, '#f4f6f8'); gr.addColorStop(0.5, '#a8aeb6'); gr.addColorStop(1, '#5a6068');
  g.fillStyle = gr; g.beginPath();
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + Math.PI / 6; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  g.closePath(); g.fill();
  oval(g, x, y, r * 0.42, r * 0.42, '#7a8088'); oval(g, x - 0.4, y - 0.4, r * 0.22, r * 0.22, '#e8ecf0');
}

function bayBackground(color) {
  return pxBackground('bay:' + color, g => {
    const ramp = paintRamp(color);
    const floor = g.createRadialGradient(320, 200, 30, 320, 200, 300);
    floor.addColorStop(0, '#2c2f36'); floor.addColorStop(1, '#0e0f12');
    g.fillStyle = floor; g.fillRect(0, 0, PW, PH);
    const R = rng(21);
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(255,255,255,${0.015 + R() * 0.03})`; g.fillRect(92 + R() * 456, R() * 336, 1, 1); }
    // guardabarros a los lados (color del auto), redondeados con su brillo
    for (const [x, w] of [[0, 92], [548, 92]]) {
      const left = x === 0, gr = g.createLinearGradient(x, 0, x + w, 0);
      const stops = [ramp.dk, ramp.md, ramp.lt, ramp.hi, ramp.md, ramp.dk];
      (left ? stops : stops.slice().reverse()).forEach((c, i) => gr.addColorStop(i / 5, c));
      g.fillStyle = gr; g.fillRect(x, 0, w, 380);
      g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(left ? w - 3 : x, 0, 3, 380);
      g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(left ? w - 18 : x + 16, 0, 1.5, 380);
    }
    // pasos de rueda: la goma asoma por arriba
    for (const x of [92, 470]) {
      const cx = x + 39, wg = g.createRadialGradient(cx, 88, 10, cx, 88, 60);
      wg.addColorStop(0, '#26272c'); wg.addColorStop(1, '#050506');
      g.fillStyle = wg; g.beginPath(); g.ellipse(cx, 88, 40, 58, 0, 0, TAU); g.fill();
      const tg = g.createLinearGradient(cx - 24, 0, cx + 24, 0);
      tg.addColorStop(0, '#0c0c0e'); tg.addColorStop(0.45, '#3a3b40'); tg.addColorStop(1, '#0c0c0e');
      g.fillStyle = tg; g.beginPath(); g.ellipse(cx, 90, 24, 42, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.2;
      for (let ty = 56; ty < 128; ty += 7) { g.beginPath(); g.moveTo(cx - 18, ty); g.lineTo(cx + 18, ty + 3); g.stroke(); }
    }
    // radiador con su tapa, y la parrilla arriba
    g.fillStyle = metal(g, 0, 0, 0, 10, '#c8ccd2'); g.fillRect(92, 0, 456, 10);
    g.fillStyle = '#1a1c20'; roundRect(g, 118, 9, 404, 38, 4); g.fill();
    for (let x = 122; x < 518; x += 3) { g.fillStyle = x % 2 ? '#3a3e46' : '#2a2d33'; g.fillRect(x, 13, 1.5, 30); }
    g.fillStyle = metal(g, 0, 9, 0, 16, '#7a8088'); g.fillRect(120, 9, 400, 6);
    chromeDisc(g, 320, 6, 9);
    // batería con sus bornes y cables
    g.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(g, 473, 183, 54, 40, 4); g.fill();
    const bg2 = g.createLinearGradient(470, 180, 524, 220); bg2.addColorStop(0, '#3a3c42'); bg2.addColorStop(1, '#141518');
    g.fillStyle = bg2; roundRect(g, 470, 180, 54, 40, 4); g.fill();
    g.fillStyle = '#2a2c30'; g.fillRect(474, 184, 46, 6);
    for (let i = 0; i < 6; i++) oval(g, 478 + i * 7.6, 199, 2.2, 2.2, '#4a4c52');
    oval(g, 482, 178, 4.5, 3.5, '#d02c2c'); oval(g, 512, 178, 4.5, 3.5, '#9aa0aa');
    g.strokeStyle = '#d02c2c'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(482, 176); g.quadraticCurveTo(470, 150, 440, 160); g.stroke();
    g.strokeStyle = '#1a1a1c'; g.beginPath(); g.moveTo(512, 176); g.quadraticCurveTo(530, 150, 520, 120); g.stroke();
    // cilindro de freno
    g.fillStyle = metal(g, 110, 0, 144, 0, '#9aa0aa'); roundRect(g, 110, 300, 34, 22, 4); g.fill();
    chromeDisc(g, 118, 300, 5); chromeDisc(g, 136, 300, 5);
    // muro de fuego abajo, con cables y mangueras
    const fw = g.createLinearGradient(0, 336, 0, 380); fw.addColorStop(0, '#25272c'); fw.addColorStop(1, '#0c0d10');
    g.fillStyle = fw; g.fillRect(92, 336, 456, 44);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(92, 336, 456, 1.5);
    g.strokeStyle = '#141416'; g.lineWidth = 4; g.beginPath(); g.moveTo(150, 336); g.quadraticCurveTo(170, 300, 205, 312); g.stroke();
    g.strokeStyle = '#3a2a1c'; g.lineWidth = 2; g.beginPath(); g.moveTo(480, 336); g.quadraticCurveTo(470, 310, 445, 318); g.stroke();
  });
}

// El motor completo (sirve también para mirar bajo el capó del rival). Devuelve los pernos con su posición.
function drawEngineBay(g, car) {
  blit(g, bayBackground(car.color), 0, 0);
  const p = car.p, bolts = [];
  const kind = p.engine ? ENGINES[p.engine.k].kind : (ENGINES[MODELS[car.model].stock.engine].kind);
  const Lo = engineLayout(kind);
  // soportes del motor (se ven siempre)
  for (const [x, y] of Lo.mounts) {
    g.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(g, x - 13, y - 8, 28, 20, 3); g.fill();
    g.fillStyle = metal(g, 0, y - 10, 0, y + 10, '#6a6e76'); roundRect(g, x - 14, y - 10, 28, 20, 3); g.fill();
  }
  if (p.engine) {
    const fam = ENGINES[p.engine.k].fam, col = FAM_COLOR[fam], ramp = paintRamp(col);
    // bloque, ventilador y poleas
    g.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(g, 214, 88, 216, 236, 8); g.fill();
    const blk = g.createLinearGradient(212, 0, 428, 0); blk.addColorStop(0, '#2c2f35'); blk.addColorStop(0.5, '#3c4048'); blk.addColorStop(1, '#22252a');
    g.fillStyle = blk; roundRect(g, 212, 84, 216, 236, 8); g.fill();
    g.strokeStyle = '#121316'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(300, 70); g.lineTo(262, 92); g.moveTo(340, 70); g.lineTo(378, 92); g.stroke();
    for (let a = 0; a < 4; a++) {
      g.save(); g.translate(320, 64); g.rotate(a * Math.PI / 2 + 0.4);
      const bl = g.createLinearGradient(-5, 0, 5, 0); bl.addColorStop(0, '#3a3c42'); bl.addColorStop(1, '#0a0a0c');
      g.fillStyle = bl; g.beginPath(); g.moveTo(-3, -6); g.quadraticCurveTo(-7, -22, -3, -35); g.lineTo(5, -33); g.quadraticCurveTo(6, -20, 3, -6); g.closePath(); g.fill();
      g.restore();
    }
    chromeDisc(g, 320, 64, 12); oval(g, 320, 64, 4, 4, '#2a2c30');
    // múltiples de escape a los costados
    for (const x of Lo.v8 ? [196, 428] : [404]) {
      g.fillStyle = metal(g, x, 0, x + 16, 0, '#7a4228'); roundRect(g, x, 110, 16, 190, 6); g.fill();
      for (let i = 0; i < (Lo.v8 ? 4 : 6); i++) { g.fillStyle = metal(g, 0, 120 + i * (Lo.v8 ? 48 : 30), 0, 134 + i * (Lo.v8 ? 48 : 30), '#8a5032'); roundRect(g, x + (x < 300 ? 10 : -6), 120 + i * (Lo.v8 ? 48 : 30), 12, 14, 3); g.fill(); }
    }
    // tapas de válvulas del color de la marca
    const cover = (x, w) => {
      g.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(g, x + 2, 101, w, 212, 9); g.fill();
      const cg = g.createLinearGradient(x, 0, x + w, 0);
      cg.addColorStop(0, ramp.dk); cg.addColorStop(0.25, ramp.lt); cg.addColorStop(0.4, ramp.hi); cg.addColorStop(0.6, ramp.md); cg.addColorStop(1, ramp.dk);
      g.fillStyle = cg; roundRect(g, x, 98, w, 212, 9); g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1;
      for (let fx = x + 8; fx < x + w - 6; fx += 7) { g.beginPath(); g.moveTo(fx, 120); g.lineTo(fx, 170); g.moveTo(fx, 222); g.lineTo(fx, 290); g.stroke(); }
      for (let y = 112; y < 300; y += 46) chromeDisc(g, x + w / 2, y + 3, 3.2);
      ptext(g, FAM_NAME[fam], x + w / 2 + 0.6, 188.6, 'rgba(0,0,0,0.45)', 1.4, { align: 'center', weight: 900, italic: true });
      ptext(g, FAM_NAME[fam], x + w / 2, 188, '#ffffff', 1.4, { align: 'center', weight: 900, italic: true });
    };
    if (Lo.v8) { cover(214, 46); cover(380, 46); } else cover(334, 64);
    // pernos del motor (en los soportes)
    Lo.mounts.forEach(([x, y], i) => bolts.push({ sl: 'engine', i, x, y }));
    if (p.intake) {
      const I = Lo.intake, alu = p.intake.k === 'race', base = alu ? '#c4c8ce' : '#6a6e76';
      g.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(g, I.x + 3, I.y + 4, I.w, I.h, 8); g.fill();
      g.fillStyle = metal(g, I.x, 0, I.x + I.w, 0, base, 0.8); roundRect(g, I.x, I.y, I.w, I.h, 8); g.fill();
      // runners hacia las culatas
      for (let k = 0; k < 4; k++) {
        const y = I.y + 24 + k * 44;
        g.fillStyle = metal(g, 0, y, 0, y + 14, base);
        if (Lo.v8) { roundRect(g, I.x - 12, y, 14, 14, 4); g.fill(); roundRect(g, I.x + I.w - 2, y, 14, 14, 4); g.fill(); }
        else { roundRect(g, I.x - 2, y, 6, 14, 3); g.fill(); roundRect(g, I.x + I.w - 2, y, 16, 14, 4); g.fill(); }
      }
      Lo.intakeBolts.forEach(([x, y], i) => bolts.push({ sl: 'intake', i, x, y }));
      const n = INTAKES[p.intake.k].n;
      Lo.carbs(n).forEach(([cx, cy], k) => {
        const sl = 'carb' + k, c = p[sl], r = n === 3 ? 13 : 15;
        // base del carburador (siempre se ve si el múltiple está puesto)
        g.fillStyle = '#26282d'; roundRect(g, cx - r - 3, cy - r - 3, 2 * r + 6, 2 * r + 6, 4); g.fill();
        if (c) {
          const race = c.k === '4R', big = c.k !== '2';
          g.fillStyle = metal(g, cx - r, cy - r, cx + r, cy + r, '#a8a07a'); roundRect(g, cx - r, cy - r, 2 * r, 2 * r, 3); g.fill();
          if (race) {
            // carburador de carrera: cornetas cromadas abiertas
            for (const [dx, dy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) {
              chromeDisc(g, cx + dx, cy + dy, 6.2);
              const th = g.createRadialGradient(cx + dx, cy + dy, 0, cx + dx, cy + dy, 3.6);
              th.addColorStop(0, '#000000'); th.addColorStop(1, '#3a3c42');
              oval(g, cx + dx, cy + dy, 3.6, 3.6, th);
            }
          } else {
            // filtro de aire redondo y cromado con su mariposa
            const ar = big ? r + 11 : r + 6;
            oval(g, cx, cy, ar + 1.5, ar + 1.5, '#1a1c20');
            chromeDisc(g, cx, cy, ar);
            g.fillStyle = metal(g, cx - 7, cy - 2, cx + 7, cy + 2, '#9aa0aa'); roundRect(g, cx - 8, cy - 2.2, 16, 4.4, 2); g.fill();
            oval(g, cx, cy, 2.6, 2.6, '#d8dce2');
          }
        }
        carbBolts(cx, cy, r + 1).forEach(([x, y], i) => bolts.push({ sl, i, x, y, hidden: !c }));
      });
    } else {
      // sin múltiple: se ven las lumbreras del bloque
      const I = Lo.intake;
      g.fillStyle = '#0a0a0c'; roundRect(g, I.x + 6, I.y + 6, I.w - 12, I.h - 12, 6); g.fill();
      for (let k = 0; k < 4; k++) for (const px of [I.x + 10, I.x + I.w - 22]) {
        const pg = g.createRadialGradient(px + 6, I.y + 30 + k * 44, 1, px + 6, I.y + 30 + k * 44, 8);
        pg.addColorStop(0, '#000000'); pg.addColorStop(1, '#4a4e56');
        g.fillStyle = pg; roundRect(g, px, I.y + 24 + k * 44, 12, 12, 3); g.fill();
      }
      Lo.intakeBolts.forEach(([x, y], i) => bolts.push({ sl: 'intake', i, x, y, hidden: true }));
    }
  } else {
    // sin motor: el hueco y la caja al fondo
    const hole = g.createRadialGradient(320, 210, 20, 320, 210, 140);
    hole.addColorStop(0, '#000000'); hole.addColorStop(1, '#16171a');
    g.fillStyle = hole; roundRect(g, 230, 100, 180, 220, 10); g.fill();
    g.fillStyle = metal(g, 270, 0, 370, 0, '#4a4e56'); g.beginPath(); g.moveTo(270, 330); g.lineTo(370, 330); g.lineTo(350, 300); g.lineTo(290, 300); g.fill();
    Lo.mounts.forEach(([x, y], i) => bolts.push({ sl: 'engine', i, x, y, hidden: true }));
  }
  // los pernos: tuerca hexagonal si está puesto, agujero si no
  for (const b of bolts) {
    if (b.hidden) continue;
    b.on = boltOn(car, b.sl, b.i);
    hexNut(g, b.x, b.y, 5.2, b.on);
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
  const bg = g.createLinearGradient(0, 344, 0, 380); bg.addColorStop(0, 'rgba(14,16,20,0.92)'); bg.addColorStop(1, 'rgba(6,7,9,0.96)');
  g.fillStyle = bg; g.fillRect(0, 344, 540, 36);
  g.fillStyle = 'rgba(255,255,255,0.1)'; g.fillRect(0, 344, 540, 1);
  slots.forEach((sl, i) => ptext(g, slotLine(car, sl), 10, 347 + i * 13, '#ece6d8', 1.1));
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
    blit(g, underBackground(), 0, 0);
    const bolts = [[196, 150], [196, 250], [252, 128], [252, 272]].map(([x, y], i) => ({ sl: 'trans', i, x, y }));
    if (p) {
      const race = p.k === 'race4', auto = TRANS[p.k].auto, alu = race ? '#d4d8de' : '#9a9ea6';
      // campana, caja y cola, con su sombra en el piso
      g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.moveTo(186, 126); g.lineTo(268, 156); g.lineTo(478, 178); g.lineTo(478, 236); g.lineTo(268, 258); g.lineTo(186, 288); g.fill();
      g.fillStyle = '#0e0f12'; roundRect(g, 174, 116, 8, 168, 3); g.fill();
      g.fillStyle = metal(g, 0, 120, 0, 280, alu, 0.9); g.beginPath(); g.moveTo(182, 120); g.lineTo(264, 150); g.lineTo(264, 250); g.lineTo(182, 280); g.fill();
      g.fillStyle = metal(g, 0, 150, 0, 250, alu); roundRect(g, 262, 150, 154, 100, 6); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.3)'; for (let x = 274; x < 410; x += 14) g.fillRect(x, 156, 2, 88);
      g.fillStyle = 'rgba(0,0,0,0.25)'; for (let x = 276; x < 410; x += 14) g.fillRect(x, 156, 1.5, 88);
      g.fillStyle = metal(g, 0, 172, 0, 228, alu); roundRect(g, 412, 172, 64, 56, 6); g.fill();
      if (auto) {
        oval(g, 342, 203, 60, 40, 'rgba(0,0,0,0.4)');
        const pan = g.createRadialGradient(325, 185, 10, 340, 200, 64);
        pan.addColorStop(0, '#9aa0a8'); pan.addColorStop(1, '#3a3e46');
        oval(g, 340, 200, 58, 38, pan);
        for (let a = 0; a < 10; a++) oval(g, 340 + Math.cos(a / 10 * TAU) * 52, 200 + Math.sin(a / 10 * TAU) * 33, 1.8, 1.8, '#d8dce2');
      } else {
        g.strokeStyle = '#d8dce2'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(330, 250); g.lineTo(330, 290); g.lineTo(380, 300); g.moveTo(360, 250); g.lineTo(360, 280); g.stroke();
        chromeDisc(g, 330, 250, 4); chromeDisc(g, 360, 250, 4);
      }
      ptext(g, FAM_NAME[p.f] || 'ALL', 340, 158, '#1c1e22', 1.2, { align: 'center', weight: 900 });
      bolts.forEach(b => { b.on = boltOn(car, 'trans', b.i); });
    } else {
      const hole = g.createRadialGradient(200, 200, 4, 200, 200, 64);
      hole.addColorStop(0, '#000000'); hole.addColorStop(1, '#202226');
      g.fillStyle = hole; g.beginPath(); g.ellipse(200, 200, 30, 60, 0, 0, TAU); g.fill();
      bolts.forEach(b => { b.on = false; });
    }
    for (const b of bolts) hexNut(g, b.x, b.y, 5.2, p && b.on);
    partsCaption(g, car, ['trans']);
    if (p && !Game.dialogs.length) boltClicks(g, car, bolts);
    redButtons(g, [[T.mech.select, () => installBox(car, ['trans'], T.mech.transParts)], [T.done, () => Game.go('garage')]]);
  }
};
function underBackground() {
  return pxBackground('under', g => {
    const floor = g.createRadialGradient(320, 200, 20, 320, 200, 360);
    floor.addColorStop(0, '#2a2c32'); floor.addColorStop(1, '#0c0d10');
    g.fillStyle = floor; g.fillRect(0, 0, PW, PH);
    const R = rng(31);
    for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(255,255,255,${0.015 + R() * 0.03})`; g.fillRect(R() * PW, R() * 380, 1, 1); }
    // largueros del chasis
    for (const y of [90, 300]) { g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(0, y + 4, PW, 18); g.fillStyle = metal(g, 0, y, 0, y + 18, '#3e424a'); g.fillRect(0, y, PW, 18); }
    // escapes y silenciadores
    for (const y of [118, 272]) {
      g.fillStyle = metal(g, 0, y, 0, y + 10, '#7a4228'); g.fillRect(0, y, PW, 10);
      g.fillStyle = metal(g, 0, y - 8, 0, y + 18, '#5a5e66'); roundRect(g, 520, y - 8, 84, 26, 10); g.fill();
    }
    // cárter del motor a la izquierda, con sus pernos y el tapón
    g.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(g, -10, 134, 190, 140, 10); g.fill();
    g.fillStyle = metal(g, 0, 130, 0, 270, '#4a4e56', 0.8); roundRect(g, -10, 130, 186, 140, 10); g.fill();
    for (let x = 10; x < 170; x += 22) { oval(g, x + 2, 136, 2, 2, '#9aa0aa'); oval(g, x + 2, 264, 2, 2, '#9aa0aa'); }
    hexNut(g, 117, 199, 7, true);
    // cardán hacia atrás
    g.fillStyle = 'rgba(0,0,0,0.4)'; g.fillRect(474, 196, 170, 20);
    g.fillStyle = metal(g, 0, 190, 0, 210, '#8a8e96'); g.fillRect(474, 190, 170, 20);
    g.fillStyle = metal(g, 0, 186, 0, 214, '#6a6e76'); roundRect(g, 478, 186, 14, 28, 3); g.fill();
  });
}

// Las ruedas: los cuatro neumáticos son un juego; se cambian sacando las 5 tuercas
SCENES.tires = {
  music: 'garage',
  enter(o) { this.car = o.car; },
  key(code) { if (code === 'Escape') Game.go('garage'); },
  draw(g) {
    const T = L(), car = this.car, p = car.p.tires, ramp = paintRamp(car.color);
    blit(g, garageBackground(), 0, 0);
    g.fillStyle = PAL.k; g.globalAlpha = 0.55; g.fillRect(0, 0, PW, PH); g.globalAlpha = 1;
    // el guardabarros encima de la rueda
    const fg = g.createLinearGradient(0, 0, 0, 200);
    fg.addColorStop(0, ramp.hi); fg.addColorStop(0.12, ramp.lt); fg.addColorStop(0.5, ramp.md); fg.addColorStop(1, ramp.dk);
    g.fillStyle = fg; g.beginPath(); g.moveTo(40, 0); g.lineTo(540, 0); g.lineTo(540, 120); g.arc(290, 200, 186, -0.2, Math.PI + 0.2, true); g.lineTo(40, 120); g.fill();
    g.fillStyle = metal(g, 0, 18, 0, 26, '#c8ccd2'); g.fillRect(40, 18, 500, 7);
    const well = g.createRadialGradient(290, 200, 120, 290, 200, 192);
    well.addColorStop(0, '#000000'); well.addColorStop(1, '#1a1b1f');
    g.fillStyle = well; g.beginPath(); g.arc(290, 200, 190, Math.PI, TAU); g.fill();
    const cx = 290, cy = 210, bolts = [];
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; bolts.push({ sl: 'tires', i, x: Math.round(cx + Math.cos(a) * 34), y: Math.round(cy + Math.sin(a) * 34) }); }
    if (p) {
      const slick = p.k === 'slick';
      // la goma: costado con brillo suave y el dibujo en el borde
      const rub = g.createRadialGradient(cx - 50, cy - 60, 40, cx, cy, 162);
      rub.addColorStop(0, '#3a3b40'); rub.addColorStop(0.7, '#1c1d21'); rub.addColorStop(1, '#0a0a0c');
      oval(g, cx, cy, 160, 160, rub);
      if (!slick) for (let a = 0; a < 48; a++) {
        const t = a / 48 * TAU; g.save(); g.translate(cx + Math.cos(t) * 153, cy + Math.sin(t) * 153); g.rotate(t);
        g.fillStyle = '#2c2d32'; roundRect(g, -4, -5, 8, 10, 2); g.fill(); g.restore();
      } else { g.strokeStyle = 'rgba(255,255,255,0.08)'; g.lineWidth = 10; g.beginPath(); g.arc(cx, cy, 150, Math.PI * 1.05, Math.PI * 1.5); g.stroke(); ptext(g, 'RACING', cx, cy - 136, '#ffffff', 2, { align: 'center', weight: 900 }); }
      if (p.k === 'ww') {
        const ww = g.createLinearGradient(cx - 118, cy - 118, cx + 118, cy + 118); ww.addColorStop(0, '#ffffff'); ww.addColorStop(1, '#c8ccd2');
        oval(g, cx, cy, 118, 118, ww); oval(g, cx, cy, 98, 98, '#16171a');
      }
      // la llanta: del color del auto (o pulida en las de carrera), con su tapa cromada
      oval(g, cx + 3, cy + 5, 90, 90, 'rgba(0,0,0,0.5)');
      const rim = g.createRadialGradient(cx - 30, cy - 34, 10, cx, cy, 92);
      if (slick) { rim.addColorStop(0, '#f4f6f8'); rim.addColorStop(1, '#7a8088'); }
      else { rim.addColorStop(0, ramp.hi); rim.addColorStop(0.5, ramp.md); rim.addColorStop(1, ramp.dk); }
      oval(g, cx, cy, 90, 90, rim);
      g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, 84, Math.PI * 1.05, Math.PI * 1.55); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.arc(cx, cy, 84, Math.PI * 0.1, Math.PI * 0.6); g.stroke();
      if (slick) for (let i = 0; i < 5; i++) {
        const a = i / 5 * TAU + 0.6, hx = cx + Math.cos(a) * 62, hy = cy + Math.sin(a) * 62;
        const hg = g.createRadialGradient(hx + 3, hy + 3, 2, hx, hy, 15); hg.addColorStop(0, '#000000'); hg.addColorStop(1, '#3a3e46');
        oval(g, hx, hy, 14, 14, hg);
      }
      chromeDisc(g, cx, cy, 50);
      oval(g, cx, cy, 14, 14, '#5a5e66'); chromeDisc(g, cx, cy, 10);
      if (p.c < 0.4) { g.strokeStyle = 'rgba(160,160,170,0.55)'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(cx - 150 + i * 6, cy + 46 - i * 10); g.lineTo(cx - 144 + i * 6, cy + 40 - i * 10); g.stroke(); } }
      for (const b of bolts) { b.on = boltOn(car, 'tires', b.i); hexNut(g, b.x, b.y, 6.2, b.on); }
    } else {
      // sin neumáticos: el tambor de freno con sus pernos
      oval(g, cx + 3, cy + 5, 92, 92, 'rgba(0,0,0,0.5)');
      oval(g, cx, cy, 92, 92, metal(g, cx - 92, cy - 92, cx + 92, cy + 92, '#7a4a30'));
      g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 2; for (let r = 60; r < 92; r += 8) { g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke(); }
      oval(g, cx, cy, 50, 50, metal(g, cx - 50, cy - 50, cx + 50, cy + 50, '#6a6e76'));
      for (const b of bolts) chromeDisc(g, b.x, b.y, 3);
      g.fillStyle = '#26282d'; g.fillRect(cx - 50, cy + 150, 100, 30);
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
    const flash = Math.floor(Game.t * 6) % 2 === 0;
    const bg = g.createRadialGradient(cx, cy, 40, cx, cy, 380);
    bg.addColorStop(0, '#1c1e24'); bg.addColorStop(1, '#050506');
    g.fillStyle = bg; g.fillRect(0, 0, PW, PH);
    // el frente del motor en penumbra
    g.fillStyle = metal(g, 60, 30, 60, 360, '#2a2d33', 0.6); roundRect(g, 60, 30, 460, 330, 14); g.fill();
    g.fillStyle = metal(g, 0, 40, 0, 60, '#3a3e46'); roundRect(g, 80, 40, 420, 20, 6); g.fill();
    // la polea: con el destello de la lámpara se ve quieta; entre destellos, borrosa
    oval(g, cx + 4, cy + 7, R + 8, R + 8, 'rgba(0,0,0,0.55)');
    const pul = g.createRadialGradient(cx - 40, cy - 50, 10, cx, cy, R + 8);
    pul.addColorStop(0, flash ? '#c8ccd2' : '#4a4e56'); pul.addColorStop(1, flash ? '#4a4e56' : '#16171a');
    oval(g, cx, cy, R + 8, R + 8, pul);
    oval(g, cx, cy, R, R, flash ? '#3a3e46' : '#1a1c20');
    g.strokeStyle = 'rgba(0,0,0,0.7)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, R - 14, 0, TAU); g.stroke();
    if (flash) chromeDisc(g, cx, cy, 40); else oval(g, cx, cy, 40, 40, '#2a2c30');
    oval(g, cx, cy, 14, 14, '#050506');
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; hexNut(g, cx + Math.cos(a) * 27, cy + Math.sin(a) * 27, 4.5, flash); }
    // escala de grados arriba de la polea
    g.fillStyle = metal(g, 0, cy - R - 40, 0, cy - R - 14, '#c8ccd2'); roundRect(g, cx - 110, cy - R - 40, 220, 26, 4); g.fill();
    for (let d = -10; d <= 10; d += 2) {
      const x = cx + d * 10;
      g.fillStyle = '#16171a'; g.fillRect(x - 1, cy - R - 26, 2, d === 0 ? 12 : 7);
      if (d % 4 === 0 || d === 0) ptext(g, String(Math.abs(d)), x, cy - R - 38, d === 0 ? PAL.r3 : '#16171a', 1, { align: 'center', weight: 800 });
    }
    // la marca: con destello, queda donde está el encendido; sin destello, gira
    const off = clamp(car.tune || 0, -12, 12);
    const a = flash ? -Math.PI / 2 + off * 10 / R : this.spin;
    g.save(); g.translate(cx, cy); g.rotate(a + Math.PI / 2);
    g.fillStyle = flash ? PAL.w : '#4a4e56'; g.fillRect(-2, -R, 4, 26);
    g.restore();
    // la lámpara de tiempo (pistola) y su luz
    if (flash) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const beam = g.createLinearGradient(124, 316, cx - 10, cy - R + 10);
      beam.addColorStop(0, 'rgba(255,240,170,0.4)'); beam.addColorStop(1, 'rgba(255,240,170,0.08)');
      g.fillStyle = beam; g.beginPath(); g.moveTo(124, 316); g.lineTo(cx - 60, cy - R + 30); g.lineTo(cx + 40, cy - R - 10); g.fill();
      glow(g, 124, 316, 40, '#fff4c0', 0.7); g.restore();
    }
    g.fillStyle = metal(g, 62, 336, 80, 336, '#a01c1c'); roundRect(g, 60, 334, 20, 44, 5); g.fill();
    const gun = g.createLinearGradient(0, 296, 0, 350); gun.addColorStop(0, '#ff5a4a'); gun.addColorStop(1, '#8c1614');
    g.fillStyle = gun; g.beginPath(); g.moveTo(120, 298); g.lineTo(38, 318); g.quadraticCurveTo(40, 344, 52, 351); g.lineTo(130, 332); g.closePath(); g.fill();
    oval(g, 124, 316, 13, 13, '#2a2c30'); oval(g, 124, 316, 10, 10, flash ? '#fff8d8' : '#5a5e66');
    ptext(g, T.mech.tuneHelp, cx, 8, PAL.y3, 2, { align: 'center' });
    if (Math.round(off) === 0) ptext(g, T.mech.tuned, cx, 366, PAL.e3, 2, { align: 'center' });
    redButtons(g, [['◄', () => this.turn(-1)], ['►', () => this.turn(1)], [T.done, () => this.done()]]);
  }
};
