// ===== Sonido: todo sintetizado con WebAudio (no necesita archivos ni internet) =====
// Sin AudioContext (por ejemplo en las pruebas con Node) todo es silencioso: nada se crea hasta que init() funciona.
const Sound = (() => {
  const MUSIC_KEY = 'streetrod63.music', MUSIC_VOL = 0.13;
  let ac = null, master, sfxBus, musicBus, fxIn, noiseBuf, lumpWave, shapeCurve;
  let musicOn = (() => { try { return localStorage.getItem(MUSIC_KEY) !== '0'; } catch (e) { return true; } })();
  let songName = null, song = null, cur = null, step = 0, nextT = 0;
  const engines = {};
  let skidV = null, sirenV = null, windV = null;

  const clamp01 = v => (v > 0 ? (v < 1 ? v : 1) : 0);
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
    if (!AC) return;
    try { ac = new AC(); } catch (e) { ac = null; return; }
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ac.createGain(); master.gain.value = 0.6;
    master.connect(comp); comp.connect(ac.destination);
    sfxBus = ac.createGain(); sfxBus.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = musicOn ? MUSIC_VOL : 0; musicBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // Eco de resorte (como el reverb de las guitarras surf): dos retardos cortos que se realimentan
    fxIn = ac.createGain();
    const d1 = ac.createDelay(1), d2 = ac.createDelay(1), fb1 = ac.createGain(), fb2 = ac.createGain();
    const damp = ac.createBiquadFilter(), wet = ac.createGain();
    d1.delayTime.value = 0.11; d2.delayTime.value = 0.043; fb1.gain.value = 0.42; fb2.gain.value = 0.3;
    damp.type = 'lowpass'; damp.frequency.value = 2800; wet.gain.value = 0.6;
    fxIn.connect(d1); d1.connect(damp); damp.connect(fb1); fb1.connect(d1);
    damp.connect(d2); d2.connect(fb2); fb2.connect(d2);
    damp.connect(wet); d2.connect(wet); wet.connect(musicBus);
    // El pulso "rengo" del V8 de cigüeñal cruzado: armónicos fijos, desparejos a propósito
    lumpWave = ac.createPeriodicWave(new Float32Array([0, 0.3, 0.1, 0.5, 0.15, 0.6, 0.1, 0.35, 0.2]),
      new Float32Array([0, 1, 0.4, 0.2, 0.7, 0.3, 0.5, 0.1, 0.25]));
    shapeCurve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; shapeCurve[i] = Math.tanh(x * 2.6); }
    setInterval(schedule, 40);
    if (songName) startSong();
  }

  // --- piezas básicas ---
  const src = () => { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s; };
  function filt(type, f, q) { const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q || 0.8; return fl; }
  function envelope(g, at, vol, dur, a, rel) {
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(vol, at + a);
    if (rel) g.gain.setValueAtTime(vol, Math.max(at + a, at + dur - rel));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  }
  // Una nota: tipo de onda, frecuencia, inicio, duración y volumen.
  // o: slide (frecuencia final), lp + ft + q (filtro), a (ataque), rel (suelta: la nota se sostiene hasta el final),
  //    vib [Hz, profundidad], detune, dest (salida) y send (cuánto va al eco)
  function note(type, f, at, dur, vol, o = {}) {
    const os = ac.createOscillator(), g = ac.createGain();
    os.type = type; os.frequency.setValueAtTime(f, at);
    if (o.slide) os.frequency.exponentialRampToValueAtTime(o.slide, at + dur);
    if (o.detune) os.detune.value = o.detune;
    let node = os;
    if (o.lp) { const fl = filt(o.ft || 'lowpass', o.lp, o.q); node.connect(fl); node = fl; }
    node.connect(g);
    envelope(g, at, vol, dur, o.a || 0.004, o.rel);
    g.connect(o.dest || sfxBus);
    if (o.send && fxIn) { const s = ac.createGain(); s.gain.value = o.send; g.connect(s); s.connect(cur ? cur.fx : fxIn); }
    if (o.vib) {
      const l = ac.createOscillator(), lg = ac.createGain();
      l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
      l.connect(lg); lg.connect(os.frequency); l.start(at); l.stop(at + dur + 0.05);
    }
    os.start(at); os.stop(at + dur + 0.05);
  }
  // Un golpe de ruido filtrado. o: ft, q, f2 (barrido del filtro), a (ataque), dest
  function burst(at, dur, vol, f, o = {}) {
    const s = src(), fl = filt(o.ft || 'lowpass', f, o.q), g = ac.createGain();
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(o.f2, at + dur);
    envelope(g, at, vol, dur, o.a || 0.003);
    s.connect(fl); fl.connect(g); g.connect(o.dest || sfxBus);
    s.start(at, Math.random() * 1.5); s.stop(at + dur + 0.05);
  }

  // --- efectos de una vez ---
  const fx = fn => () => { if (ac) fn(ac.currentTime); };
  const sfx = {
    click: fx(t => { note('square', 1800, t, 0.025, 0.05); burst(t, 0.015, 0.06, 5000, { ft: 'highpass' }); }),
    select: fx(t => note('square', 700, t, 0.05, 0.06)),
    // Llave de chicharra: una ráfaga de clics metálicos
    ratchet: fx(t => {
      for (let i = 0; i < 8; i++) {
        const at = t + i * 0.05 + Math.random() * 0.01;
        burst(at, 0.018, 0.25, 4200, { ft: 'highpass' });
        note('square', 2400 + Math.random() * 300, at, 0.02, 0.035);
      }
    }),
    clunk: fx(t => {
      burst(t, 0.1, 0.3, 500); note('sine', 120, t, 0.12, 0.35, { slide: 55 }); note('square', 1400, t, 0.02, 0.03);
    }),
    // Caja que rechina: ruido metálico que tiembla a 38 golpes por segundo
    grind: fx(t => {
      const s = src(), f = filt('bandpass', 1400, 3), am = ac.createGain(), g = ac.createGain();
      const l = ac.createOscillator(), lg = ac.createGain();
      f.frequency.setValueAtTime(1400, t); f.frequency.linearRampToValueAtTime(2600, t + 0.2); f.frequency.linearRampToValueAtTime(900, t + 0.5);
      l.type = 'square'; l.frequency.value = 38; lg.gain.value = 0.5; am.gain.value = 0.5;
      l.connect(lg); lg.connect(am.gain);
      envelope(g, t, 0.4, 0.55, 0.01);
      s.connect(f); f.connect(am); am.connect(g); g.connect(sfxBus);
      s.start(t); s.stop(t + 0.6); l.start(t); l.stop(t + 0.6);
      note('sawtooth', 95, t, 0.5, 0.12, { slide: 70, lp: 900 });
    }),
    crash: fx(t => {
      burst(t, 0.9, 0.7, 1500, { f2: 150 });
      note('sine', 90, t, 0.5, 0.5, { slide: 30 });
      note('square', 320, t + 0.02, 0.25, 0.06, { lp: 1800 }); note('square', 457, t + 0.05, 0.3, 0.05, { lp: 1800 });
      burst(t + 0.02, 0.45, 0.18, 5000, { ft: 'highpass' });
      for (let i = 0; i < 10; i++) note('triangle', 2800 + Math.random() * 4000, t + 0.03 + Math.random() * 0.5, 0.12 + Math.random() * 0.2, 0.05);
    }),
    bump: fx(t => { burst(t, 0.12, 0.35, 350); note('sine', 100, t, 0.1, 0.25, { slide: 50 }); }),
    boom: fx(t => {
      burst(t, 1.3, 0.75, 900, { f2: 120 }); note('sine', 70, t, 0.9, 0.6, { slide: 25 });
      [0.15, 0.32, 0.5].forEach(d => { burst(t + d, 0.09, 0.4, 1200, { f2: 200 }); });
      burst(t + 0.25, 1.6, 0.08, 3000, { ft: 'highpass', a: 0.3 });               // vapor del radiador
    }),
    coin: fx(t => { note('square', 988, t, 0.08, 0.1); note('square', 1319, t + 0.08, 0.3, 0.1); }),
    // Caja registradora: dos clacs, el cajón y la campanita
    buy: fx(t => {
      burst(t, 0.03, 0.2, 2500, { ft: 'highpass' }); burst(t + 0.06, 0.03, 0.2, 2500, { ft: 'highpass' });
      burst(t + 0.08, 0.18, 0.18, 600, { ft: 'bandpass', q: 2 });
      note('sine', 2093, t + 0.12, 0.9, 0.12); note('triangle', 4186, t + 0.12, 0.5, 0.035); note('sine', 5274, t + 0.12, 0.3, 0.02);
    }),
    nope: fx(t => { note('sawtooth', 160, t, 0.2, 0.12, { lp: 1200 }); note('sawtooth', 120, t + 0.14, 0.28, 0.12, { lp: 1000 }); }),
    // Bocina de los años 50: dos notas a la vez
    horn: fx(t => {
      note('sawtooth', 349, t, 0.42, 0.08, { lp: 1600, rel: 0.05 }); note('sawtooth', 440, t, 0.42, 0.07, { lp: 1600, rel: 0.05 });
      note('square', 175, t, 0.42, 0.04, { lp: 700, rel: 0.05 });
    }),
    pumpTick: fx(t => { note('sine', 1760, t, 0.6, 0.12); note('triangle', 2640, t, 0.4, 0.04); note('sine', 4400, t, 0.25, 0.03); }),
    win: fx(t => {
      [523, 659, 784, 1047].forEach((f, i) => note('square', f, t + i * 0.09, 0.12, 0.08, { lp: 3000 }));
      note('square', 1319, t + 0.36, 0.5, 0.08, { lp: 3000, rel: 0.2 });
    }),
    // Trombón triste
    lose: fx(t => {
      [196, 185, 175].forEach((f, i) => note('sawtooth', f, t + i * 0.32, 0.3, 0.12, { lp: 900, a: 0.03, rel: 0.08 }));
      note('sawtooth', 165, t + 0.96, 0.95, 0.12, { lp: 900, a: 0.03, rel: 0.3, vib: [5, 6] });
    }),
    go: fx(t => burst(t, 0.45, 0.25, 500, { ft: 'bandpass', f2: 3500, q: 1.5, a: 0.08 })),
    backfire: fx(t => { burst(t, 0.09, 0.6, 1200, { f2: 200 }); note('sine', 140, t, 0.1, 0.4, { slide: 40 }); }),
    // Bisagra que cruje y el capó que cae
    hood: fx(t => {
      note('sawtooth', 120, t, 0.55, 0.06, { slide: 170, lp: 800, ft: 'bandpass', q: 6, a: 0.05, rel: 0.1, vib: [9, 25] });
      burst(t + 0.62, 0.2, 0.5, 250); note('sine', 75, t + 0.62, 0.2, 0.5, { slide: 40 });
    }),
    // El pañuelo que baja y el grito de partida
    flag: fx(t => {
      [0, 0.08, 0.16].forEach(d => burst(t + d, 0.06, 0.25, 900, { ft: 'bandpass', q: 1.5 }));
      note('sawtooth', 260, t + 0.05, 0.35, 0.09, { slide: 330, lp: 1000, ft: 'bandpass', q: 2, a: 0.02 });
      note('sawtooth', 260, t + 0.05, 0.35, 0.04, { slide: 330, lp: 2400, ft: 'bandpass', q: 4, a: 0.02 });
    }),
    neon: fx(t => {
      for (let i = 0; i < 6; i++) {
        const at = t + i * 0.07 + Math.random() * 0.04;
        note('sawtooth', 120, at, 0.04 + Math.random() * 0.04, 0.05, { lp: 2000 });
        burst(at, 0.02, 0.04, 6000, { ft: 'highpass' });
      }
    }),
    door: fx(t => { note('square', 900, t, 0.02, 0.05); burst(t + 0.01, 0.25, 0.5, 500); note('sine', 110, t + 0.01, 0.15, 0.4, { slide: 60 }); })
  };

  // --- motores: una voz por auto, que se ajusta suave en cada cuadro ---
  function makeEngine() {
    const e = { saw: ac.createOscillator(), sub: ac.createOscillator(), lfo: ac.createOscillator(), noise: src() };
    e.saw.type = 'sawtooth'; e.sub.type = 'square'; e.lfo.setPeriodicWave(lumpWave);
    e.mixSaw = ac.createGain(); e.mixSub = ac.createGain();
    e.shaper = ac.createWaveShaper(); e.shaper.curve = shapeCurve;
    e.lp = filt('lowpass', 600, 2); e.am = ac.createGain(); e.lfoGain = ac.createGain();
    e.nbp = filt('bandpass', 800, 1.2); e.ngain = ac.createGain(); e.ngain.gain.value = 0;
    e.out = ac.createGain(); e.out.gain.value = 0;
    e.pan = ac.createStereoPanner ? ac.createStereoPanner() : null;
    e.saw.connect(e.mixSaw); e.sub.connect(e.mixSub); e.mixSaw.connect(e.shaper); e.mixSub.connect(e.shaper);
    e.shaper.connect(e.lp); e.lp.connect(e.am); e.am.connect(e.out);
    e.lfo.connect(e.lfoGain); e.lfoGain.connect(e.am.gain);
    e.noise.connect(e.nbp); e.nbp.connect(e.ngain); e.ngain.connect(e.am);
    if (e.pan) { e.out.connect(e.pan); e.pan.connect(sfxBus); } else e.out.connect(sfxBus);
    e.srcs = [e.saw, e.sub, e.lfo, e.noise];
    e.srcs.forEach(s => s.start());
    return e;
  }
  function engine(id, o = {}) {
    if (!ac) return;
    const rpm = Math.max(300, isFinite(o.rpm) ? o.rpm : 800), thr = clamp01(o.throttle || 0);
    const v8 = o.cyl !== 6, vol = clamp01(o.vol === undefined ? 1 : o.vol), t = ac.currentTime, k = 0.03;
    const e = engines[id] || (engines[id] = makeEngine());
    const f = rpm / 60 * (v8 ? 8 : 6) / 2;
    e.saw.frequency.setTargetAtTime(f, t, k);
    e.sub.frequency.setTargetAtTime(v8 ? f / 2 : f, t, k);
    e.lfo.frequency.setTargetAtTime(rpm / 120, t, k);
    // el V8 "borbotea" en bajas y se empareja al subir; el 6 es parejo y más zumbón
    const depth = v8 ? 0.12 + 0.55 * (1 - clamp01((rpm - 800) / 4000)) * (1 - thr * 0.4) : 0.08;
    e.am.gain.setTargetAtTime(1 - depth * 0.5, t, k);
    e.lfoGain.gain.setTargetAtTime(depth * 0.5, t, k);
    e.mixSaw.gain.setTargetAtTime(v8 ? 0.5 : 0.75, t, k);
    e.mixSub.gain.setTargetAtTime(v8 ? 0.6 : 0.25, t, k);
    e.lp.frequency.setTargetAtTime(Math.min(6000, 250 + thr * 1800 + f * (v8 ? 2.5 : 3.2)), t, k);
    e.nbp.frequency.setTargetAtTime(Math.min(5000, f * 4), t, k);
    e.ngain.gain.setTargetAtTime(thr * 0.25 * clamp01(rpm / 6000 + 0.2), t, k);
    e.out.gain.setTargetAtTime(vol * (0.07 + thr * 0.05), t, k);
    if (e.pan) e.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, o.pan || 0)), t, k);
  }
  function stopEngine(id) {
    const e = engines[id];
    if (!e || !ac) return;
    delete engines[id];
    e.out.gain.setTargetAtTime(0, ac.currentTime, 0.04);
    setTimeout(() => { try { e.srcs.forEach(s => s.stop()); e.out.disconnect(); } catch (err) { /* ya estaba detenido */ } }, 400);
  }
  function stopEngines() {
    for (const id in engines) stopEngine(id);
    skid(0); siren(false); wind(0);
  }

  // Chirrido de neumáticos: ruido afinado y un silbido que tiembla
  function skid(amount) {
    if (!ac) return;
    amount = clamp01(amount);
    if (!skidV) {
      if (!amount) return;
      const s = src(), bp = filt('bandpass', 2200, 6), o = ac.createOscillator(), og = ac.createGain();
      const l = ac.createOscillator(), lg = ac.createGain(), g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = 1000; og.gain.value = 0.3;
      l.frequency.value = 7; lg.gain.value = 40; l.connect(lg); lg.connect(o.frequency);
      g.gain.value = 0;
      s.connect(bp); bp.connect(g); o.connect(og); og.connect(g); g.connect(sfxBus);
      s.start(); o.start(); l.start();
      skidV = { g, o };
    }
    const t = ac.currentTime;
    skidV.g.gain.setTargetAtTime(amount * 0.11, t, 0.04);
    skidV.o.frequency.setTargetAtTime(900 + amount * 300, t, 0.1);
  }

  // Sirena mecánica de los 60: un aullido que sube y baja despacio
  function siren(on, vol = 1) {
    if (!ac) return;
    if (!sirenV) {
      if (!on) return;
      const o = ac.createOscillator(), o2 = ac.createOscillator(), l = ac.createOscillator();
      const lg = ac.createGain(), lg2 = ac.createGain(), g2 = ac.createGain(), lp = filt('lowpass', 2400), g = ac.createGain();
      o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = 880; o2.frequency.value = 1760;
      l.frequency.value = 0.3; lg.gain.value = 380; lg2.gain.value = 760; g2.gain.value = 0.3;
      l.connect(lg); lg.connect(o.frequency); l.connect(lg2); lg2.connect(o2.frequency);
      o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(sfxBus);
      g.gain.value = 0;
      o.start(); o2.start(); l.start();
      sirenV = { g };
    }
    sirenV.g.gain.setTargetAtTime(on ? 0.05 * clamp01(vol) : 0, ac.currentTime, 0.15);
  }

  // Viento y ruido del camino
  function wind(amount) {
    if (!ac) return;
    amount = clamp01(amount);
    if (!windV) {
      if (!amount) return;
      const s = src(), lp = filt('lowpass', 400), hp = filt('highpass', 80), g = ac.createGain();
      g.gain.value = 0;
      s.connect(lp); lp.connect(hp); hp.connect(g); g.connect(sfxBus); s.start();
      windV = { g, lp };
    }
    const t = ac.currentTime;
    windV.g.gain.setTargetAtTime(amount * 0.07, t, 0.1);
    windV.lp.frequency.setTargetAtTime(400 + amount * 1600, t, 0.1);
  }

  // --- música: un secuenciador por pasos; cada canción dibuja sus notas en at(paso, tiempo, duración del paso) ---
  const out = () => cur.out;
  const kick = (t, v) => note('sine', 120, t, 0.14, v, { slide: 40, dest: out() });
  const snare = (t, v) => { burst(t, 0.12, v, 1800, { ft: 'bandpass', q: 0.8, dest: out() }); note('triangle', 180, t, 0.06, v * 0.6, { dest: out() }); };
  const hat = (t, v) => burst(t, 0.035, v, 7000, { ft: 'highpass', dest: out() });

  // Boogie de 12 compases en La: I I I I IV IV I I V IV I V
  const BOOGIE = [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7], WALK = [0, 4, 7, 9, 10, 9, 7, 4];
  const SAX = [
    { 0: [12, 1], 1: [15, 1], 2: [16, 2], 4: [19, 1], 5: [16, 1], 6: [12, 2] },
    { 0: [22, 3], 3: [19, 1], 4: [16, 2], 6: [15, 1], 7: [12, 1] },
    { 0: [24, 2], 2: [22, 1], 3: [21, 1], 4: [19, 1], 5: [18, 1], 6: [16, 1], 7: [15, 1] },
    { 0: [12, 6] }
  ];
  // Surf en Mi frigio dominante (Mi Fa Sol# La Si Do Re)
  const SURF_ROOT = [40, 41, 40, 41, 43, 41, 40, 40], SURF_BASS = [0, 0, 12, 0, 0, 7, 12, 10];
  const SURF_MEL = [
    [[76, 8], [74, 4], [72, 4]], [[71, 4], [72, 4], [71, 4], [69, 4]], [[68, 8], [69, 4], [71, 4]], [[72, 12], [71, 4]],
    [[74, 8], [72, 4], [71, 4]], [[72, 4], [71, 4], [69, 4], [68, 4]], [[69, 8], [68, 4], [65, 4]], [[64, 16]]
  ];
  // Doo-wop en Do: Do – Lam – Fa – Sol7, en 12/8
  const DOO = [[48, [60, 64, 67], 4], [45, [57, 60, 64], 3], [41, [57, 60, 65], 4], [43, [55, 59, 62, 65], 4]];
  const DOO_MEL = [
    [[64, 0, 6], [67, 6, 3], [69, 9, 3]], [[67, 0, 9], [64, 9, 3]], [[65, 0, 6], [69, 6, 6]], [[67, 0, 12]],
    [[72, 0, 6], [71, 6, 3], [69, 9, 3]], [[67, 0, 6], [64, 6, 6]], [[65, 0, 3], [64, 3, 3], [62, 6, 6]], [[62, 0, 6], [59, 6, 6]]
  ];

  const SONGS = {
    title: {
      dur: 60 / 150 / 3, len: 144,
      at(i, t, d) {
        const bar = Math.floor(i / 12), k = i % 12, sub = k % 3, root = 45 + BOOGIE[bar];
        if (sub === 1) return;                                         // ritmo shuffle: 1.ª y 3.ª del tresillo
        const e = Math.floor(k / 3) * 2 + (sub === 2 ? 1 : 0), D = out();
        const f = midi(root + WALK[e]);
        note('sawtooth', f, t, d * 1.7, 0.08, { lp: 700, dest: D }); note('triangle', f, t, d * 1.8, 0.22, { dest: D });
        hat(t, sub === 2 ? 0.07 : 0.05);
        if (e === 0 || e === 4) kick(t, 0.5);
        if (e === 2 || e === 6) snare(t, 0.22);
        if (e === 3 || e === 7) [12, 16, 19, 22].forEach(n => note('triangle', midi(root + n), t, 0.18, 0.05, { dest: D }));
        const riff = SAX[bar < 10 ? bar % 2 : bar - 8][e];
        if (riff) note('sawtooth', midi(root + 12 + riff[0]), t, riff[1] * d * 1.5 + 0.05, 0.07,
          { lp: 1500, q: 1.5, a: 0.02, rel: 0.06, vib: [5.5, 4], dest: D, send: 0.15 });
      }
    },
    garage: {
      dur: 60 / 160 / 4, len: 128,
      at(i, t, d) {
        const bar = i >> 4, k = i & 15, root = SURF_ROOT[bar], D = out();
        if (k % 2 === 0) {
          const f = midi(root + SURF_BASS[k / 2]);
          note('sawtooth', f, t, d * 1.8, 0.07, { lp: 600, dest: D }); note('triangle', f, t, d * 1.9, 0.2, { dest: D });
          hat(t, 0.045);
        }
        if (k === 0 || k === 6 || k === 8) kick(t, 0.5);
        if (k === 4 || k === 12) snare(t, 0.25);
        if (bar === 7 && k >= 8 && k % 2 === 0) note('sine', 220 - (k - 8) * 18, t, 0.18, 0.3, { slide: 90, dest: D });   // redoble de tambores
        if (k === 0) [12, 19, 24].forEach(n => note('sawtooth', midi(root + n), t, 1.2, 0.025, { lp: 1800, dest: D, send: 0.6 }));
        // guitarra con trémolo: la nota de la melodía se repite en cada paso
        let pos = 0, n = 0;
        for (const [m, len] of SURF_MEL[bar]) { if (k < pos + len) { n = m; break; } pos += len; }
        if (n) note('sawtooth', midi(n), t, d * 0.95, 0.045, { lp: 3000, dest: D, send: 0.5 });
      }
    },
    diner: {
      dur: 60 / 68 / 3, len: 96,
      at(i, t, d) {
        const bar = Math.floor(i / 12), k = i % 12, [root, chord, third] = DOO[bar % 4], D = out();
        if (k === 0) chord.forEach(n => [-7, 7].forEach(c => note('sawtooth', midi(n), t, d * 12, 0.022,
          { lp: 800, q: 2, a: 0.25, rel: 0.6, detune: c, dest: D, send: 0.4 })));
        chord.slice(-3).forEach(n => note('triangle', midi(n + 12), t, 0.25, k % 3 === 0 ? 0.022 : 0.014, { dest: D }));
        const bass = { 0: 0, 3: third, 6: 7, 9: 12 }[k];
        if (bass !== undefined) { const f = midi(root + bass); note('triangle', f, t, d * 3, 0.24, { dest: D }); note('sawtooth', f, t, d * 2.5, 0.05, { lp: 500, dest: D }); }
        if (k === 0 || k === 6) kick(t, 0.3);
        if (k === 3 || k === 9) burst(t, 0.18, 0.05, 2500, { ft: 'bandpass', dest: D });     // escobillas
        for (const [m, s, len] of DOO_MEL[bar]) if (s === k) note('triangle', midi(m), t, len * d, 0.07, { a: 0.06, rel: 0.25, vib: [5, 3], dest: D, send: 0.3 });
      }
    },
    win: {
      dur: 0.075, len: 56, once: true,
      at(i, t, d) {
        const D = out(), brass = (m, len) => note('sawtooth', midi(m), t, len * d, 0.08, { lp: 2200, a: 0.02, rel: 0.15, vib: [5, 4], dest: D, send: 0.3 });
        const notes = { 0: [67, 2], 2: [72, 2], 4: [76, 2], 6: [79, 6], 12: [76, 2], 14: [79, 2], 16: [84, 38] };
        if (notes[i]) brass(...notes[i]);
        if (i >= 8 && i < 16) snare(t, 0.06 + (i - 8) * 0.02);
        if (i === 16) {
          [60, 64, 67, 72].forEach(m => note('sawtooth', midi(m), t, 38 * d, 0.04, { lp: 1600, a: 0.03, rel: 0.6, dest: D, send: 0.3 }));
          kick(t, 0.6); burst(t, 2.5, 0.05, 6000, { ft: 'highpass', dest: D });
        }
      }
    }
  };

  function releaseCur(after) {
    if (!cur) return;
    const c = cur, t = ac.currentTime;
    cur = null;
    if (after < 3) { c.out.gain.setTargetAtTime(0, t, 0.25); c.fx.gain.setTargetAtTime(0, t, 0.25); }
    setTimeout(() => { c.out.disconnect(); c.fx.disconnect(); }, after * 1000);
  }
  function startSong() {
    releaseCur(2.5);
    song = SONGS[songName] || null; step = 0; nextT = ac.currentTime + 0.1;
    if (!song) return;
    cur = { out: ac.createGain(), fx: ac.createGain() };
    cur.out.connect(musicBus); cur.fx.connect(fxIn);
  }
  function schedule() {
    if (!ac || !song) return;
    const now = ac.currentTime;
    if (nextT < now) nextT = now + 0.02;
    while (nextT < now + 0.2) {
      if (song.once && step >= song.len) { song = null; songName = null; releaseCur(5); return; }
      if (musicOn) song.at(step % song.len, nextT, song.dur);
      nextT += song.dur; step++;
    }
  }
  function setMusic(name) {
    name = name || null;
    if (name === songName) return;
    songName = name;
    if (!ac) { if (name === 'win') songName = null; return; }     // la fanfarria no se guarda para después
    startSong();
  }
  function toggleMusic() {
    musicOn = !musicOn;
    try { localStorage.setItem(MUSIC_KEY, musicOn ? '1' : '0'); } catch (e) { /* sin almacenamiento */ }
    if (ac) musicBus.gain.setTargetAtTime(musicOn ? MUSIC_VOL : 0, ac.currentTime, 0.1);
    return musicOn;
  }

  return {
    init, setMusic, toggleMusic, engine, stopEngine, stopEngines, skid, siren, wind, sfx,
    get musicOn() { return musicOn; }
  };
})();
