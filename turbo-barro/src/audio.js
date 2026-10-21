// ===== Sonido: todo sintetizado con WebAudio (no necesita archivos ni internet) =====
const Sound = (() => {
  let ac = null, master, sfxBus, musicBus, noiseBuf;
  let musicOn = true, songName = null, song = null, step = 0, nextT = 0;
  const engines = {};

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = musicOn ? 0.15 : 0; musicBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(schedule, 40);
    if (songName) play(songName);
  }

  function voice(freq, at, dur, type, vol, slideTo, bus) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    o.connect(g); g.connect(bus);
    o.start(at); o.stop(at + dur + 0.05);
  }

  function hiss(at, dur, vol, freq, ftype, bus) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = ftype; f.frequency.value = freq;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0005, at + dur);
    s.connect(f); f.connect(g); g.connect(bus);
    s.start(at, Math.random() * 0.5); s.stop(at + dur + 0.05);
  }

  const tone = (freq, dur, type = 'square', vol = 0.15, slideTo = 0, delay = 0) => {
    if (ac) voice(freq, ac.currentTime + delay, dur, type, vol, slideTo, sfxBus);
  };
  const noise = (dur, vol, freq, ftype = 'lowpass', delay = 0) => {
    if (ac) hiss(ac.currentTime + delay, dur, vol, freq, ftype, sfxBus);
  };

  const sfx = {
    beep() { tone(520, 0.2, 'square', 0.18); },
    go() { tone(1040, 0.55, 'square', 0.2); },
    select() { tone(700, 0.05, 'square', 0.08); },
    buy() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.12, 0, i * 0.06)); },
    nope() { tone(160, 0.25, 'sawtooth', 0.15); },
    coin() { tone(988, 0.08, 'square', 0.15); tone(1319, 0.3, 'square', 0.15, 0, 0.08); },
    nitroPick() { tone(400, 0.25, 'triangle', 0.25, 1200); },
    nitro() { noise(0.8, 0.3, 900, 'bandpass'); tone(150, 0.8, 'sawtooth', 0.08, 600); },
    crash() { noise(0.18, 0.35, 500); },
    bump() { noise(0.08, 0.15, 300); },
    splash() { noise(0.35, 0.2, 1500, 'highpass'); },
    jump() { tone(250, 0.25, 'triangle', 0.15, 500); },
    land() { noise(0.15, 0.3, 250); },
    lap() { tone(784, 0.1, 'square', 0.15); tone(1175, 0.22, 'square', 0.15, 0, 0.1); },
    finish() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.2, 'square', 0.15, 0, i * 0.12)); },
    lose() { [392, 349, 330, 262].forEach((f, i) => tone(f, 0.25, 'triangle', 0.2, 0, i * 0.18)); }
  };

  // Un motor por jugador humano: el tono sube con la velocidad
  function engine(id, speed01, active) {
    if (!ac) return;
    let e = engines[id];
    if (!e) {
      const o = ac.createOscillator(), o2 = ac.createOscillator();
      const f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth'; o2.type = 'square';
      f.type = 'lowpass'; f.frequency.value = 600;
      g.gain.value = 0;
      o.connect(f); o2.connect(f); f.connect(g); g.connect(sfxBus);
      o.start(); o2.start();
      e = engines[id] = { o, o2, f, g };
    }
    const t = ac.currentTime, fr = 45 + speed01 * 110;
    e.o.frequency.setTargetAtTime(fr, t, 0.05);
    e.o2.frequency.setTargetAtTime(fr * 0.5 + 3, t, 0.05);
    e.f.frequency.setTargetAtTime(300 + speed01 * 900, t, 0.05);
    e.g.gain.setTargetAtTime(active ? 0.045 + speed01 * 0.04 : 0, t, 0.08);
  }
  function stopEngines() {
    if (!ac) return;
    for (const id in engines) engines[id].g.gain.setTargetAtTime(0, ac.currentTime, 0.05);
  }

  // Música chiptune: melodía, bajo y batería en pasos de corchea
  const SONGS = {
    menu: {
      dt: 0.14,
      lead: [76, 0, 79, 0, 84, 0, 79, 0, 81, 0, 79, 0, 76, 0, 74, 0, 76, 0, 79, 0, 84, 0, 86, 0, 88, 0, 86, 0, 84, 0, 0, 0],
      bass: [48, 0, 60, 0, 55, 0, 60, 0, 53, 0, 65, 0, 57, 0, 65, 0, 48, 0, 60, 0, 55, 0, 60, 0, 55, 0, 67, 0, 59, 0, 67, 0],
      drum: [1, 0, 3, 0, 2, 0, 3, 0]
    },
    race: {
      dt: 0.12,
      lead: [69, 0, 72, 0, 76, 0, 74, 72, 0, 0, 72, 0, 74, 0, 76, 0, 79, 0, 76, 0, 74, 0, 72, 74, 0, 0, 71, 0, 68, 0, 0, 0],
      bass: [45, 45, 57, 45, 45, 57, 45, 57, 41, 41, 53, 41, 41, 53, 41, 53, 43, 43, 55, 43, 43, 55, 43, 55, 40, 40, 52, 40, 44, 44, 56, 44],
      drum: [1, 0, 2, 0, 1, 1, 2, 0]
    }
  };
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function play(name) {
    songName = name; song = SONGS[name] || null; step = 0;
    if (ac) nextT = ac.currentTime + 0.08;
  }

  function schedule() {
    if (!ac || !song) return;
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.02;
    while (nextT < ac.currentTime + 0.25) {
      const i = step % song.lead.length;
      const L = song.lead[i], B = song.bass[i % song.bass.length], D = song.drum[i % song.drum.length];
      if (L) voice(midi(L), nextT, song.dt * 1.6, 'square', 0.09, 0, musicBus);
      if (B) voice(midi(B), nextT, song.dt * 0.9, 'triangle', 0.35, 0, musicBus);
      if (D === 1) voice(130, nextT, 0.12, 'sine', 0.6, 40, musicBus);
      if (D === 2) hiss(nextT, 0.1, 0.25, 1800, 'highpass', musicBus);
      if (D === 3) hiss(nextT, 0.03, 0.12, 7000, 'highpass', musicBus);
      nextT += song.dt; step++;
    }
  }

  function toggleMusic() {
    musicOn = !musicOn;
    if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? 0.15 : 0, ac.currentTime, 0.05);
    return musicOn;
  }

  // Bocinas: cada estilo es una pequeña secuencia de notas; cada jugador suena un poco distinto
  const HORN_PITCH = [1, 0.84, 1.18, 0.92];
  function horn(style, who = 0) {
    if (!ac) return;
    const p = HORN_PITCH[(who % 4 + 4) % 4], t = ac.currentTime;
    const v = (f, at, dur, type, vol, slide) => voice(f * p, t + at, dur, type, vol, slide ? slide * p : 0, sfxBus);
    switch (style) {
      case 1: v(140, 0, 0.6, 'sawtooth', 0.14); v(176, 0, 0.6, 'sawtooth', 0.12); break;                    // camión
      case 2: v(600, 0, 0.18, 'triangle', 0.3, 1300); v(1300, 0.18, 0.2, 'triangle', 0.3, 700); break;      // payaso
      case 3: [523, 659, 784, 1047].forEach((f, i) => v(f, i * 0.11, 0.13, 'square', 0.12)); break;          // melodía
      case 4: v(330, 0, 0.12, 'sawtooth', 0.2, 220); v(330, 0.16, 0.14, 'sawtooth', 0.2, 200); break;       // pato
      default: v(392, 0, 0.35, 'square', 0.11); v(494, 0, 0.35, 'square', 0.11);                           // clásica
    }
  }

  return { init, sfx, engine, stopEngines, play, toggleMusic, horn };
})();
