// ===== Copas: 4 carreras, premiación con podio y trofeos para la vitrina =====
Object.assign(STR.es, {
  trophyMenu: '🏆 Trofeos', trophyTitle: 'VITRINA DE TROFEOS',
  trophyCount: n => (n === 1 ? '1 trofeo' : `${n} trofeos`), trophyEmpty: '¡Termina una copa para ganar tu primer trofeo!',
  cups: ['Bronce', 'Plata', 'Oro', 'Diamante', 'Arcoíris'], legend: n => 'Leyenda ' + n, cupName: c => 'Copa ' + c,
  raceOf: (n, t) => `carrera ${n} de ${t}`,
  podiumBtn: 'Ver premiación 🏆', cupDone: '¡Copa terminada!',
  cupMsg: (p, c) => (p === 1 ? `¡Ganaste la ${c}!` : p <= 3 ? `¡Llegaste ${p}° en la ${c}!` : '¡Buen intento! Te llevas una medalla'),
  nextCup: c => `Siguiente: ${c} →`, sameCup: 'Sube al podio (1°, 2° o 3°) para pasar a la siguiente copa',
  shopCup: (label, p) => `${label}  ·  Puntos de la copa: ${p}`
});
Object.assign(STR.en, {
  trophyMenu: '🏆 Trophies', trophyTitle: 'TROPHY CASE',
  trophyCount: n => (n === 1 ? '1 trophy' : `${n} trophies`), trophyEmpty: 'Finish a cup to win your first trophy!',
  cups: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Rainbow'], legend: n => 'Legend ' + n, cupName: c => c + ' Cup',
  raceOf: (n, t) => `race ${n} of ${t}`,
  podiumBtn: 'See awards 🏆', cupDone: 'Cup complete!',
  cupMsg: (p, c) => (p === 1 ? `You won the ${c}!` : p <= 3 ? `You finished ${STR.en.ord(p)} in the ${c}!` : 'Nice try! You earned a medal'),
  nextCup: c => `Next: ${c} →`, sameCup: 'Reach the podium (1st, 2nd or 3rd) to move up to the next cup',
  shopCup: (label, p) => `${label}  ·  Cup points: ${p}`
});

const CUP_RACES = 4;
// Bronce, plata, oro, diamante, arcoíris y desde ahí "Leyenda 1, 2, 3..." para siempre
const TIERS = [
  { c: '#d08a4a', d: '#7a4a1c' },
  { c: '#dfe1ea', d: '#8a8c99' },
  { c: '#ffd23f', d: '#a07a00' },
  { c: '#9cf0ff', d: '#2a8fb0' },
  { c: null, d: '#7a3fb0' },
  { c: '#ff6fa5', d: '#a3244f' }
];
const tierLook = t => TIERS[Math.min(t, TIERS.length - 1)];
const cupName = t => L().cupName(t < 5 ? L().cups[t] : L().legend(t - 4));
const CONFETTI = ['#ff4d4d', '#ffd23f', '#4dd2ff', '#7dff7a', '#ff7af5'];

// Trofeo con la base en y + 32 (escala 1). Del 4° lugar para abajo es una medalla.
function drawTrophy(g, x, y, s, tier, place) {
  const T = tierLook(tier);
  let fill = T.c;
  g.save(); g.translate(x, y); g.scale(s, s);
  if (!fill) {
    fill = g.createLinearGradient(-16, -26, 16, 4);
    ['#ff4d4d', '#ffb13b', '#ffe14a', '#4dd26e', '#4da6ff', '#9b6bff'].forEach((c, i, a) => fill.addColorStop(i / (a.length - 1), c));
  }
  if (place > 3) {
    g.fillStyle = '#2f6fe8'; tri(g, -9, -18, 9, -18, 0, 6); g.fill();
    g.fillStyle = '#e8312a'; tri(g, -4, -18, 4, -18, 0, 0); g.fill();
    g.fillStyle = T.d; ellipse(g, 0, 16, 14, 14);
    g.fillStyle = fill; ellipse(g, 0, 16, 11.5, 11.5);
    g.fillStyle = 'rgba(255,255,255,0.6)'; star(g, 0, 16, 6);
  } else {
    g.fillStyle = '#5a3a1c'; roundRect(g, -16, 22, 32, 10, 2); g.fill();
    g.fillStyle = '#7a5230'; roundRect(g, -12, 16, 24, 7, 2); g.fill();
    g.fillStyle = T.d; g.fillRect(-3, 3, 6, 14);
    g.strokeStyle = T.d; g.lineWidth = 3.5;
    g.beginPath(); g.arc(-16, -16, 7, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
    g.beginPath(); g.arc(16, -16, 7, -Math.PI * 0.5, Math.PI * 0.5); g.stroke();
    const bowl = r => {
      g.beginPath(); g.moveTo(-r, -28 + (18 - r)); g.lineTo(r, -28 + (18 - r));
      g.quadraticCurveTo(r, 6 - (18 - r), 0, 6 - (18 - r)); g.quadraticCurveTo(-r, 6 - (18 - r), -r, -28 + (18 - r)); g.fill();
    };
    g.fillStyle = T.d; bowl(18);
    g.fillStyle = fill; bowl(15.5);
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(-10, -22, 3.5, 15);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (tier >= 5) { g.font = font(9); g.fillStyle = '#fff'; g.fillText('★' + (tier - 4), 2, -12); }
    g.font = font(8); g.fillStyle = '#ffe9b0'; g.fillText(L().ord(place), 0, 27.5);
  }
  g.restore();
}

Object.assign(Game, {
  cupLabel() {
    return cupName(this.cup.tier) + '  ·  ' + L().raceOf(Math.min(this.cup.race + 1, CUP_RACES), CUP_RACES);
  },

  // Premiación: tabla de la copa, trofeos para los jugadores y cuál es la siguiente copa
  openPodium() {
    const order = this.lastOrder || this.racers;
    const standings = [...this.racers].sort((a, b) => b.points - a.points || order.indexOf(a) - order.indexOf(b));
    const humans = standings.filter(r => r.human), tier = this.cup.tier;
    const best = Math.min(...humans.map(r => standings.indexOf(r) + 1));
    if (!this.cup.awarded) {
      // se marca para no dar el trofeo dos veces si se vuelve a abrir desde "Continuar campeonato"
      const day = new Date().toISOString().slice(0, 10);
      for (const r of humans) this.trophies.push({ tier, place: standings.indexOf(r) + 1, name: racerName(r), color: r.color, day });
      this.cup.awarded = true;
      this.cup.next = best <= 3 ? tier + 1 : tier;
      this.savePrefs(); this.save();
    }
    this.podium = { tier, standings, best, next: this.cup.next };
    this.scene = 'podium'; this.lock = 1.5;
    Sound.play('menu'); Sound.sfx.finish();
    Announcer.event('cup', { r: standings[0] });
    this.menu = new Menu([{ label: () => L().nextCup(cupName(this.podium.next)), action: () => this.nextCup() }]);
  },

  nextCup() {
    this.cup = { tier: this.podium.next, race: 0 };
    for (const r of this.racers) r.points = 0;
    this.save();
    this.openShop(0);
  },

  openTrophies() {
    this.scene = 'trophies';
    this.menu = new Menu([{ label: () => L().menu.back, action: () => { this.scene = 'title'; this.mainMenu(); } }]);
    Sound.sfx.select();
  }
});

function drawPodium(g) {
  const P = Game.podium, t = Game.t;
  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#1b1036'); grd.addColorStop(1, '#3b1f0f');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  // focos del estadio
  for (const x of [170, W - 170]) {
    const spot = g.createRadialGradient(x, 0, 10, x, 0, 520);
    spot.addColorStop(0, 'rgba(255,240,180,0.22)'); spot.addColorStop(1, 'rgba(255,240,180,0)');
    g.fillStyle = spot; g.fillRect(0, 0, W, H);
  }
  // confeti que cae (sale del tiempo, no necesita guardar nada)
  for (let i = 0; i < 90; i++) {
    const x = (i * 97.3 + t * (25 + (i % 5) * 14)) % W, y = (i * 53.7 + t * (55 + (i % 7) * 18)) % H;
    g.save(); g.translate(x, y); g.rotate(t * (1 + (i % 3)) + i);
    g.fillStyle = CONFETTI[i % 5]; g.fillRect(-4, -2, 8, 4); g.restore();
  }
  bigText(g, cupName(P.tier).toUpperCase(), W / 2, 50, 42, tierLook(P.tier).c || '#ffd23f');
  g.font = font(18, 700); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(L().cupDone, W / 2, 90);
  drawTrophy(g, W / 2, 168 + Math.sin(t * 2) * 4, 1.9, P.tier, P.best);

  // podio: 2° a la izquierda, 1° al centro y 3° a la derecha
  const base = 520;
  [[1, W / 2 - 175, 380], [0, W / 2, 330], [2, W / 2 + 175, 410]].forEach(([i, cx, top]) => {
    const r = P.standings[i];
    g.fillStyle = ['#e8b400', '#b8b8c4', '#c07a3a'][i]; roundRect(g, cx - 82, top, 164, base - top, 8); g.fill();
    g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(cx - 82, top + 14, 164, 3);
    bigText(g, String(i + 1), cx, top + 44, 38, '#fff');
    g.font = font(15); g.fillStyle = '#2a1405'; g.textAlign = 'center'; g.fillText(racerName(r), cx, top + 76);
    g.font = font(12, 700); g.fillText(r.points + ' pts', cx, top + 94);
    g.save(); g.translate(cx, top - 36); g.rotate(-Math.PI / 2); g.scale(2.6, 2.6); drawTruck(g, r); g.restore();
  });
  bigText(g, L().cupMsg(P.best, cupName(P.tier)), W / 2, 545, 24, '#fff');
  if (P.next === P.tier) { g.font = font(13, 700); g.fillStyle = '#ffd23f'; g.fillText(L().sameCup, W / 2, 570); }
  Game.menu.draw(g, W / 2 - 210, 584, 420, 48, 0);
}

function drawTrophies(g) {
  workshopBg(g);
  bigText(g, L().trophyTitle, W / 2, 62, 42, '#ffd23f');
  const all = Game.trophies, list = all.slice(-18).reverse();
  g.font = font(15, 700); g.fillStyle = '#ddd'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(all.length ? L().trophyCount(all.length) : '', W / 2, 102);
  // tres repisas de seis, lo más nuevo primero
  for (let row = 0; row < 3; row++) {
    const y = 230 + row * 140;
    g.fillStyle = '#6b4423'; g.fillRect(90, y, W - 180, 12);
    g.fillStyle = '#4a2f17'; g.fillRect(90, y + 12, W - 180, 6);
  }
  list.forEach((tp, i) => {
    const x = 175 + (i % 6) * 135, y = 230 + Math.floor(i / 6) * 140;
    drawTrophy(g, x, y - 34, 1.05, tp.tier, tp.place);
    g.font = font(11, 700); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(cupName(tp.tier), x, y + 32);
    g.fillStyle = tp.color || '#ddd'; g.fillText(tp.name, x, y + 48);
  });
  if (!all.length) bigText(g, L().trophyEmpty, W / 2, 300, 26, '#fff');
  Game.menu.draw(g, W / 2 - 150, 578, 300, 48, 0);
}
