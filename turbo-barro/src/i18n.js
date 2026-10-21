// ===== Idiomas: español e inglés =====
// La clave se comparte con el sitio, así que el idioma elegido en el portal se usa aquí también.
const LANG_KEY = 'arcade.lang';
let LANG = (() => {
  try {
    const s = localStorage.getItem(LANG_KEY);
    if (s === 'es' || s === 'en') return s;
  } catch (e) { /* sin almacenamiento */ }
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
})();

function setLang(l) {
  LANG = l;
  try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* sin almacenamiento */ }
  document.documentElement.lang = l;
  document.title = L().title.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()) + ' 4x4';
}

const STR = {
  es: {
    title: 'TURBO BARRO', langName: 'Español',
    you: 'TÚ', player: n => 'Jugador ' + n, ai: ['Tornado', 'Coyote', 'Rayo'],
    ord: n => n + '°',
    tracks: ['Valle Polvoriento', 'Desierto Dorado', 'Cañón Rojo', 'Pantano Loco', 'Montaña Nevada'],
    laps: n => n + ' vueltas', lap: (a, b) => `Vuelta ${a}/${b}`, lapBanner: n => 'VUELTA ' + n,
    lastLap: '¡ÚLTIMA VUELTA!', go: '¡YA!', finishTag: '¡META!', won: '¡GANASTE!', placed: n => `¡LLEGASTE ${n}°!`,
    menu: { continue: 'Continuar campeonato', p1: '1 Jugador', p2: '2 Jugadores', options: 'Opciones', back: '← Volver', more: '← Más juegos', lang: '🌐 Idioma: Español' },
    opt: { diff: 'Dificultad', auto: 'Acelera solo', name1: 'Jugador 1', name2: 'Jugador 2', yes: 'SÍ', no: 'NO' },
    diffs: ['Fácil', 'Normal', 'Difícil'],
    help: [
      '1 JUGADOR:   ↑ acelerar   ↓ frenar   ← → doblar   ESPACIO = nitro   (también W A S D)',
      '2 JUGADORES:   J1 = flechas + ENTER (nitro)      J2 = W A S D + ESPACIO (nitro)',
      '🎮 Funciona con control de videojuegos  ·  P = pausa  ·  M = música  ·  F = pantalla completa'
    ],
    pause: 'PAUSA', resume: 'Seguir jugando', restart: 'Reiniciar carrera', quit: 'Salir al menú',
    pauseHint: 'M = música  ·  F = pantalla completa',
    results: 'RESULTADOS', cols: ['Premio', 'Recogido', 'Puntos', 'Dinero'], next: 'Continuar →',
    msgs: ['¡Ganaste la carrera! ¡Eres un campeón!', '¡Muy bien! ¡Casi ganas!', '¡Bien hecho! ¡Sigue así!', '¡Tú puedes! Mejora tu camioneta en la tienda'],
    shop: 'TIENDA', yourTruck: 'Tu camioneta', nextTrack: 'Próxima pista: ', have: 'Tienes: ', max: 'MÁX',
    shopItems: [
      ['Motor', 'Más velocidad máxima'],
      ['Aceleración', 'Arranca y recupera más rápido'],
      ['Llantas', 'Dobla mejor y derrapa menos'],
      ['Amortiguadores', 'Mejor en saltos, baches y barro'],
      ['Nitro', 'Un turbo extra para la carrera']
    ],
    ready2: 'Listo → turno del Jugador 2', race: '¡A CORRER!',
    shopHelp: '↑ ↓ para elegir  ·  ENTER o ESPACIO para comprar  ·  o haz clic con el mouse',
    shopInfo: (n, p) => `Carrera ${n}  ·  Puntos del campeonato: ${p}`,
    music: on => (on ? '🎵 Música: SÍ' : '🔇 Música: NO'),
    nameTitle: n => `Nombre del jugador ${n}`, nameOk: 'Listo',
    nameHelp: 'Escribe con el teclado  ·  ENTER = listo  ·  ESC = cancelar'
  },
  en: {
    title: 'TURBO MUD', langName: 'English',
    you: 'YOU', player: n => 'Player ' + n, ai: ['Tornado', 'Coyote', 'Bolt'],
    ord: n => n + (['st', 'nd', 'rd'][n - 1] || 'th'),
    tracks: ['Dusty Valley', 'Golden Desert', 'Red Canyon', 'Crazy Swamp', 'Snowy Mountain'],
    laps: n => n + ' laps', lap: (a, b) => `Lap ${a}/${b}`, lapBanner: n => 'LAP ' + n,
    lastLap: 'FINAL LAP!', go: 'GO!', finishTag: 'FINISH!', won: 'YOU WON!', placed: n => `YOU FINISHED ${STR.en.ord(n).toUpperCase()}!`,
    menu: { continue: 'Continue championship', p1: '1 Player', p2: '2 Players', options: 'Options', back: '← Back', more: '← More games', lang: '🌐 Language: English' },
    opt: { diff: 'Difficulty', auto: 'Auto gas', name1: 'Player 1', name2: 'Player 2', yes: 'YES', no: 'NO' },
    diffs: ['Easy', 'Normal', 'Hard'],
    help: [
      '1 PLAYER:   ↑ gas   ↓ brake   ← → steer   SPACE = nitro   (or W A S D)',
      '2 PLAYERS:   P1 = arrows + ENTER (nitro)      P2 = W A S D + SPACE (nitro)',
      '🎮 Works with a game controller  ·  P = pause  ·  M = music  ·  F = full screen'
    ],
    pause: 'PAUSED', resume: 'Keep playing', restart: 'Restart race', quit: 'Quit to menu',
    pauseHint: 'M = music  ·  F = full screen',
    results: 'RESULTS', cols: ['Prize', 'Collected', 'Points', 'Money'], next: 'Continue →',
    msgs: ['You won the race! You\'re a champion!', 'Great job! So close!', 'Well done! Keep it up!', 'You can do it! Upgrade your truck in the shop'],
    shop: 'SHOP', yourTruck: 'Your truck', nextTrack: 'Next track: ', have: 'You have: ', max: 'MAX',
    shopItems: [
      ['Engine', 'Higher top speed'],
      ['Acceleration', 'Faster starts and recovery'],
      ['Tires', 'Better turning, less sliding'],
      ['Shocks', 'Better on jumps, bumps and mud'],
      ['Nitro', 'An extra boost for the race']
    ],
    ready2: 'Done → Player 2\'s turn', race: 'LET\'S RACE!',
    shopHelp: '↑ ↓ to choose  ·  ENTER or SPACE to buy  ·  or click with the mouse',
    shopInfo: (n, p) => `Race ${n}  ·  Championship points: ${p}`,
    music: on => (on ? '🎵 Music: ON' : '🔇 Music: OFF'),
    nameTitle: n => `Player ${n} name`, nameOk: 'Done',
    nameHelp: 'Type on the keyboard  ·  ENTER = done  ·  ESC = cancel'
  }
};
const L = () => STR[LANG];

const trackName = i => L().tracks[((i % TRACK_DEFS.length) + TRACK_DEFS.length) % TRACK_DEFS.length];

// Nombre que se muestra: el que eligió el jugador, o uno por defecto en el idioma actual
function racerName(r) {
  if (!r.human) return r.ai !== undefined ? L().ai[r.ai] : r.name;
  const custom = Game.names[r.player];
  if (custom) return custom;
  return Game.players === 1 ? L().you : L().player(r.player + 1);
}
