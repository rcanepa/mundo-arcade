// ===== Sonido sintetizado: motor V8, chirrido de neumáticos, viento y avisos (sin archivos) =====
export class Sound {
  constructor() { this.ctx = null; this.muted = false; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.7; this.master.connect(ctx.destination);
    // ruido blanco que se reutiliza
    const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = nb;
    this.engines = [this.engine(1), this.engine(0.45)];
    // neumáticos: ruido filtrado agudo
    this.screech = this.noise(1600, 9, 'bandpass');
    // viento
    this.wind = this.noise(500, 0.7, 'lowpass');
  }
  noise(freq, q, type) {
    const ctx = this.ctx, src = ctx.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    src.connect(f); f.connect(g); g.connect(this.master); src.start();
    return { f, g };
  }
  // Motor: dos ondas en la frecuencia de explosión de un V8 (4 por vuelta) más un retumbe grave, con filtro que se abre con el acelerador
  engine(vol) {
    const ctx = this.ctx;
    const o1 = ctx.createOscillator(); o1.type = 'sawtooth';
    const o2 = ctx.createOscillator(); o2.type = 'square';
    const o3 = ctx.createOscillator(); o3.type = 'triangle';
    const g1 = ctx.createGain(); g1.gain.value = 0.5; const g2 = ctx.createGain(); g2.gain.value = 0.25; const g3 = ctx.createGain(); g3.gain.value = 0.6;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 3;
    const shaper = ctx.createWaveShaper(); const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 2.2); }
    shaper.curve = curve;
    // pulso de las explosiones (le da el "burbujeo" de un V8)
    const am = ctx.createOscillator(); am.type = 'sine'; const amg = ctx.createGain(); amg.gain.value = 0;
    const out = ctx.createGain(); out.gain.value = 0;
    o1.connect(g1); o2.connect(g2); o3.connect(g3); g1.connect(lp); g2.connect(lp); g3.connect(lp);
    lp.connect(shaper); shaper.connect(out);
    am.connect(amg); amg.connect(out.gain);
    out.connect(this.master);
    for (const o of [o1, o2, o3, am]) o.start();
    return { o1, o2, o3, am, amg, lp, out, vol };
  }
  // rpm, gas (0..1) de cada auto; dist = distancia al rival (para que se escuche más bajo)
  update(cars) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    cars.forEach((c, i) => {
      const e = this.engines[i]; if (!e) return;
      if (!c) { e.out.gain.setTargetAtTime(0, t, 0.05); return; }
      const f = Math.max(28, c.rpm / 60 * 4);
      e.o1.frequency.setTargetAtTime(f, t, 0.02); e.o2.frequency.setTargetAtTime(f * 0.5, t, 0.02); e.o3.frequency.setTargetAtTime(f * 0.25, t, 0.02);
      e.am.frequency.setTargetAtTime(f * 0.125, t, 0.02);
      e.lp.frequency.setTargetAtTime(220 + c.gas * 1400 + c.rpm * 0.18, t, 0.03);
      const near = c.dist === undefined ? 1 : Math.max(0.05, 1 / (1 + c.dist * 0.06));
      const base = e.vol * near * (0.1 + c.gas * 0.16);
      e.out.gain.setTargetAtTime(base, t, 0.04); e.amg.gain.setTargetAtTime(base * 0.45, t, 0.04);
    });
    const me = cars[0];
    if (me) {
      this.screech.g.gain.setTargetAtTime(Math.min(0.3, Math.max(0, me.slip - 0.35) * 0.6), t, 0.05);
      this.screech.f.frequency.setTargetAtTime(1300 + me.slip * 700, t, 0.05);
      this.wind.g.gain.setTargetAtTime(Math.min(0.18, me.speed * me.speed * 0.00008), t, 0.1);
    }
  }
  beep(freq, dur = 0.12, vol = 0.18, type = 'square') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  thump(vol = 0.5) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, src = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    src.buffer = this.noiseBuf; f.type = 'lowpass'; f.frequency.value = 400; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    src.connect(f); f.connect(g); g.connect(this.master); src.start(t, Math.random()); src.stop(t + 0.3);
  }
  silence() { if (this.ctx) for (const e of this.engines) e.out.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); if (this.screech) { this.screech.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); this.wind.g.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); } }
  toggle() { this.muted = !this.muted; if (this.master) this.master.gain.value = this.muted ? 0 : 0.7; return this.muted; }
}
