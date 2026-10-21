// ===== Locutor: frases con la voz del computador (funciona sin internet) =====
Object.assign(STR.es.opt, { ann: 'Locutor' });
Object.assign(STR.en.opt, { ann: 'Announcer' });
STR.es.ann = {
  go: ['¡Arrancan!', '¡Comienza la carrera!', '¡A todo motor!'],
  lastLap: ['¡Última vuelta!', '¡Queda una vuelta!'],
  jump: ['¡Qué salto!', '¡Vuela!', '¡Increíble salto!'],
  lead: n => [`¡${n} pasa adelante!`, `¡${n} toma el primer lugar!`],
  win: n => [`¡${n} gana la carrera!`, `¡Victoria para ${n}!`],
  mud: ['¡Qué barro!', '¡Al barro!', '¡Puro barro!'],
  crash: ['¡Uy, qué golpe!', '¡Cuidado con el muro!'],
  nitro: ['¡Turbo!', '¡Nitro a fondo!'],
  tunnel: ['¡Al túnel!', '¡Qué oscuro!'],
  bridge: ['¡Por el puente!', '¡Arriba del puente!'],
  cup: n => [`¡${n} gana la ${cupName(Game.podium.tier)}!`, `¡${n} es campeón de la ${cupName(Game.podium.tier)}!`]
};
STR.en.ann = {
  go: ['And they\'re off!', 'Here we go!', 'Full throttle!'],
  lastLap: ['Final lap!', 'One lap to go!'],
  jump: ['What a jump!', 'Flying high!', 'Huge air!'],
  lead: n => [`${n} takes the lead!`, `${n} moves into first!`],
  win: n => [`${n} wins the race!`, `Victory for ${n}!`],
  mud: ['Mud everywhere!', 'Into the mud!', 'What a mess!'],
  crash: ['Ouch, what a crash!', 'Watch that wall!'],
  nitro: ['Turbo boost!', 'Nitro on!'],
  tunnel: ['Into the tunnel!', 'So dark in here!'],
  bridge: ['Over the bridge!', 'Up on the bridge!'],
  cup: n => [`${n} wins the ${cupName(Game.podium.tier)}!`, `${n} is the ${cupName(Game.podium.tier)} champion!`]
};

const Announcer = (() => {
  const synth = window.speechSynthesis;
  // Las frases importantes interrumpen a las chicas; las chicas no siempre suenan
  const PRIORITY = { cup: 4, win: 3, lastLap: 2, go: 2, lead: 1 };
  let voices = [], lastT = -99, lastKey = '', lastPri = 0;
  const loadVoices = () => { voices = synth.getVoices(); };
  if (synth) { loadVoices(); synth.addEventListener('voiceschanged', loadVoices); }

  function pickVoice() {
    const mine = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(LANG));
    return mine.find(v => v.localService) || mine[0] || null;
  }

  function event(key, tr) {
    if (!synth || !Game.announcer) return;
    const now = performance.now() / 1000, pri = PRIORITY[key] || 0;
    if (key === lastKey && now - lastT < 4) return;
    if (synth.speaking && pri <= lastPri) return;
    if (pri === 0 && (now - lastT < 2.5 || Math.random() < 0.45)) return;
    let list = L().ann[key];
    if (typeof list === 'function') list = list(racerName(tr.r));
    const u = new SpeechSynthesisUtterance(list[Math.floor(Math.random() * list.length)]);
    const v = pickVoice();
    if (v) u.voice = v;
    u.lang = v ? v.lang : (LANG === 'es' ? 'es-ES' : 'en-US');
    u.rate = 1.12; u.pitch = 1.1;
    synth.cancel();
    synth.speak(u);
    lastT = now; lastKey = key; lastPri = pri;
  }

  function stop() { if (synth) synth.cancel(); }
  return { event, stop };
})();
