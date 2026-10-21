// ===== Sonido: todo sintetizado con WebAudio (música suave, pájaros, grillos, lluvia y efectos) =====
const Sound = (() => {
  const PREFS = 'jardinvivo.sound';
  // volúmenes medidos con Sound.levels(): música suave de fondo, efectos claros, nada satura
  const MUSIC_VOL = 0.65, SFX_VOL = 1.3, AMB_VOL = 0.55;
  let ac = null, master, sfxBus, musicBus, ambBus, verb, noiseBuf, meter;
  let musicOn = true, sfxOn = true, playing = false;
  let nextT = 0, step = 0, chord = 0, birdT = 0, cricketT = 0;
  let rain = null, wind = null;
  try { const p = JSON.parse(localStorage.getItem(PREFS)); if (p) { musicOn = p.m !== false; sfxOn = p.s !== false; } } catch (e) { /* sin preferencias */ }
  const savePrefs = () => { try { localStorage.setItem(PREFS, JSON.stringify({ m: musicOn, s: sfxOn })); } catch (e) { /* sin guardado */ } };

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 1; master.connect(ac.destination);
    meter = ac.createAnalyser(); meter.fftSize = 2048; master.connect(meter);
    // reverberación suave hecha con ruido que se apaga
    verb = ac.createConvolver();
    const len = ac.sampleRate * 2.6, ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = ir;
    const wet = ac.createGain(); wet.gain.value = 0.35; verb.connect(wet); wet.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = sfxOn ? SFX_VOL : 0; sfxBus.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = musicOn ? MUSIC_VOL : 0; musicBus.connect(master); musicBus.connect(verb);
    ambBus = ac.createGain(); ambBus.gain.value = sfxOn ? AMB_VOL : 0; ambBus.connect(master); ambBus.connect(verb);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    rain = loopNoise(1400, 'lowpass'); wind = loopNoise(380, 'lowpass');
    nextT = ac.currentTime + 0.3;
    setInterval(schedule, 60);
  }
  function loopNoise(freq, type) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = 0;
    s.connect(f); f.connect(g); g.connect(ambBus); s.start();
    return g;
  }

  function voice(freq, at, dur, type, vol, bus, slideTo, attack = 0.005) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, at);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(bus); o.start(at); o.stop(at + dur + 0.05);
  }
  function hiss(at, dur, vol, freq, type, bus) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    s.connect(f); f.connect(g); g.connect(bus); s.start(at, Math.random()); s.stop(at + dur + 0.05);
  }
  const tone = (f, dur, type = 'sine', vol = 0.2, slide = 0, delay = 0) => { if (ac && sfxOn) voice(f, ac.currentTime + delay, dur, type, vol, sfxBus, slide); };
  const noise = (dur, vol, freq, type = 'lowpass', delay = 0) => { if (ac && sfxOn) hiss(ac.currentTime + delay, dur, vol, freq, type, sfxBus); };

  const sfx = {
    click() { tone(880, 0.06, 'triangle', 0.08); },
    plant() { noise(0.12, 0.25, 600); tone(392, 0.18, 'sine', 0.15, 523, 0.04); },
    water() { noise(0.35, 0.18, 2200, 'bandpass'); noise(0.2, 0.1, 900, 'lowpass', 0.1); },
    coin() { tone(1318, 0.1, 'triangle', 0.12); tone(1760, 0.25, 'triangle', 0.1, 0, 0.07); },
    harvest() { [784, 988, 1175].forEach((f, i) => tone(f, 0.2, 'triangle', 0.12, 0, i * 0.06)); },
    build() { noise(0.15, 0.3, 300); tone(140, 0.15, 'sine', 0.2, 90); },
    dig() { noise(0.2, 0.3, 500); },
    care() { noise(0.18, 0.18, 1200, 'bandpass'); tone(660, 0.12, 'sine', 0.08, 0, 0.05); },
    nope() { tone(220, 0.18, 'triangle', 0.15, 180); },
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.45, 'triangle', 0.13, 0, i * 0.09)); }
  };

  // Música: arpegios pentatónicos tipo cajita de música; los acordes cambian según la estación
  const SCALES = [[0, 2, 4, 7, 9], [0, 2, 4, 7, 9], [0, 3, 5, 7, 10], [0, 3, 5, 7, 10]];
  const PROG = [[0, 7], [9, 4], [5, 0], [7, 2]];
  function schedule() {
    if (!ac) return;
    const now = ac.currentTime;
    const season = typeof G !== 'undefined' && G.day !== undefined ? seasonOf(G.day % DAYS_YEAR) : 0;
    const night = typeof G !== 'undefined' && G.hour !== undefined ? (G.hour < 6 || G.hour > 20.5) : false;
    const beat = night ? 0.62 : 0.48;
    while (nextT < now + 0.4) {
      if (playing && musicOn) {
        const base = [60, 62, 57, 55][season], sc = SCALES[season], [r1] = PROG[chord];
        if (step % 16 === 0) { // acorde suave de fondo
          for (const k of [0, 4, 7]) voice(midi(base - 12 + r1 + (season >= 2 && k === 4 ? -1 : k)), nextT, beat * 15, 'sine', 0.05, musicBus, 0, 0.8);
        }
        if (Math.random() < (night ? 0.35 : 0.6) && step % 2 === 0) {
          const n = sc[Math.floor(Math.random() * sc.length)] + (Math.random() < 0.3 ? 12 : 0);
          voice(midi(base + r1 + n), nextT, 1.6, 'sine', 0.11, musicBus);
          voice(midi(base + r1 + n + 12), nextT, 0.6, 'triangle', 0.025, musicBus);
        }
        step++;
        if (step % 16 === 0) chord = (chord + 1) % PROG.length;
      }
      nextT += beat;
    }
  }
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  // Ambiente: pájaros de día, grillos de noche, lluvia y viento
  function update(dt) {
    if (!ac || typeof G === 'undefined' || !G.w) return;
    const h = G.hour, w = G.w, raining = w.rain > 0 && h >= 4 && h < 4 + Math.min(18, w.rain * 0.6);
    const t = ac.currentTime;
    rain.gain.setTargetAtTime(raining ? 0.12 + Math.min(0.15, w.rain / 120) : 0, t, 0.8);
    wind.gain.setTargetAtTime(0.04 + R.wind * 0.08, t, 1.5);
    if (!sfxOn) return;
    birdT -= dt; cricketT -= dt;
    const s = seasonOf(G.day % DAYS_YEAR);
    if (birdT <= 0 && h > 5.5 && h < 19.5 && !raining) {
      birdT = (h < 9 ? 0.6 : 2.2) + Math.random() * 3;
      const f = 2200 + Math.random() * 1800, n = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < n; i++) voice(f * (1 + (Math.random() - 0.5) * 0.2), t + i * 0.11, 0.09, 'sine', 0.05, ambBus, f * (1.2 + Math.random() * 0.3));
    }
    if (cricketT <= 0 && (h > 20.5 || h < 5) && s <= 1 && !raining) {
      cricketT = 0.45 + Math.random() * 0.4;
      for (let i = 0; i < 3; i++) voice(4300 + Math.random() * 200, t + i * 0.045, 0.03, 'sine', 0.025, ambBus);
    }
  }

  function thunder() { if (ac && sfxOn) { hiss(ac.currentTime + 0.3, 2.5, 0.5, 160, 'lowpass', sfxBus); hiss(ac.currentTime + 0.35, 1.2, 0.3, 400, 'lowpass', sfxBus); } }
  function play() { playing = true; }
  function toggleMusic() { musicOn = !musicOn; if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? MUSIC_VOL : 0, ac.currentTime, 0.3); savePrefs(); return musicOn; }
  function toggleSfx() {
    sfxOn = !sfxOn;
    if (sfxBus) { sfxBus.gain.setTargetAtTime(sfxOn ? SFX_VOL : 0, ac.currentTime, 0.1); ambBus.gain.setTargetAtTime(sfxOn ? AMB_VOL : 0, ac.currentTime, 0.3); }
    savePrefs(); return sfxOn;
  }
  // Nivel de lo que suena ahora (para revisar volúmenes en las pruebas)
  function levels() {
    if (!meter) return null;
    const d = new Float32Array(meter.fftSize);
    meter.getFloatTimeDomainData(d);
    let sum = 0, peak = 0;
    for (const v of d) { sum += v * v; peak = Math.max(peak, Math.abs(v)); }
    return { rms: Math.sqrt(sum / d.length), peak, state: ac.state };
  }
  return { init, play, sfx, update, thunder, toggleMusic, toggleSfx, levels, musicOn: () => musicOn, sfxOn: () => sfxOn };
})();
