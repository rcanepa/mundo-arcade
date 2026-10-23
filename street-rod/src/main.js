// ===== Street Rod 3D: el arranque, el paso de una pantalla a otra y el ciclo de cada cuadro =====
import { stage, MOBILE } from './stage.js';
import { Race } from './race.js';
import { Sound } from './audio.js';
import { initInput, readInput, edges, buildTouch } from './input.js';
import { buildHud, updateHud } from './hud.js';
import * as G from './game.js';
import * as UI from './screens.js';
import { L, LANG, setLang } from './i18n.js';
import { rivalById } from './data.js';
import { makeSpec } from './physics.js';

const $ = id => document.getElementById(id);
const STEP = 1 / 120;
const sound = new Sound();
try { sound.muted = localStorage.getItem('streetrod3d.mute') === '1'; } catch (e) { /* nada */ }
let mode = 'title', race = null, info = null, paused = false, resultAt = 0, resultShown = false, acc = 0;
try { stage.cam = localStorage.getItem('streetrod3d.cam') || 'chase'; } catch (e) { stage.cam = 'chase'; }
const kingCar = () => G.rivalCar(rivalById('king'));
const showHud = on => { $('hud').classList.toggle('hidden', !on); $('touch').classList.toggle('hidden', !(on && MOBILE)); };

const app = {
  muted: () => sound.muted,
  toggleSound() { sound.toggle(); try { localStorage.setItem('streetrod3d.mute', sound.muted ? '1' : '0'); } catch (e) { /* nada */ } },
  toggleLang() { setLang(LANG === 'es' ? 'en' : 'es'); document.documentElement.lang = LANG; this.title(); },
  title() { mode = 'title'; race = null; showHud(false); sound.silence(); stage.setTitle(kingCar()); UI.title(app); },
  cont() { if (!G.load()) return this.title(); if (G.S.over) this.ending(); else if (G.S.night) this.bobs(); else this.garage(); },
  license() { UI.license(app); },
  newGame(name) { G.newGame(name); UI.pages(L().intro, 0, () => this.garage()); },
  garage() { mode = 'garage'; race = null; showHud(false); sound.silence(); this.refreshGarage(); UI.garage(app); },
  refreshGarage() { const d = G.dateOf(G.S.day); stage.setGarage(G.activeCar(), L().months[d.getUTCMonth()].toUpperCase(), d.getUTCDate()); },
  bobs() {
    if (!G.S.night) { const r = G.startNight(); if (r) { UI.toast(L().bobs.why.noCar, 'bad'); return this.garage(); } }
    mode = 'bobs'; race = null; showHud(false); sound.silence();
    stage.setBobs(G.activeCar(), G.S.night.present.map(id => ({ id, state: G.rivalCar(rivalById(id)) })));
    UI.bobs(app);
  },
  focus(id) { stage.focus(id); },
  home() { G.endNight(); UI.clearPick(); if (G.S.over) this.ending(); else this.garage(); },
  race(id, type, bet, pink) {
    const r = rivalById(id), me = G.activeCar();
    if (!me || G.challenge(r, type, bet, pink)) return;
    const world = stage.useWorld(type === 'drag' ? 'drag' : 'road'), rv = G.rivalCar(r);
    race = new Race(type, world, { car: stage.car('me', me), spec: makeSpec(me, { auto: G.S.autoShift }) }, { car: stage.car('rv:' + id, rv), spec: makeSpec(rv, { auto: type !== 'drag' }), skill: r.skill });
    info = { rival: r, bet, pink, free: false };
    startRace();
  },
  testDrive() {
    const me = G.activeCar(); if (!me) return;
    race = new Race('free', stage.useWorld('road'), { car: stage.car('me', me), spec: makeSpec(me, { auto: G.S.autoShift }) }, null);
    info = { free: true };
    startRace();
  },
  afterRace() { race = null; if (G.S.over) return this.ending(); if (info && info.free) return this.garage(); this.bobs(); },
  ending() { mode = 'ending'; race = null; showHud(false); sound.silence(); stage.setTitle(G.S.over === 'king' ? kingCar() : G.activeCar() || kingCar()); UI.ending(app); },
  resume() { paused = false; UI.clear(); },
  quitRace() {
    paused = false;
    if (info.free) return this.garage();
    resultShown = true; race.phase = 'done';
    const out = G.applyResult({ rivalId: info.rival.id, bet: info.bet, pink: info.pink, win: false });
    sound.silence();
    UI.result(app, { title: L().race.lost, win: false, rows: [] }, out, info.rival.name);
  }
};

function startRace() {
  mode = 'race'; paused = false; resultAt = 0; resultShown = false; acc = 0;
  UI.clear(); stage.setRace(race);
  buildHud(race); showHud(true);
  if (MOBILE) buildTouch($('touch'), race.kind === 'drag');
  sound.init(); edges.clear();
}
// sonidos y avisos de lo que pasó en la carrera
function raceEvents() {
  const T = L().race;
  for (const [r, e] of race.events) {
    if (e === 'hit' && r === race.me) sound.thump(0.6);
    if (r !== race.me) continue;
    if (e === 'perfect') { race.say(T.perfect, 0.9, 'good'); sound.beep(1320, 0.08, 0.12, 'sine'); }
    if (e === 'early') race.say(T.early, 0.8, 'warn');
    if (e === 'shift') sound.thump(0.25);
    if (e === 'nitro') { race.say(T.nitro, 0.9, 'go'); sound.thump(0.7); }
  }
}
function showResult() {
  resultShown = true;
  if (info.free) return;
  const out = G.applyResult({ rivalId: info.rival.id, bet: info.bet, pink: info.pink, win: race.result.win });
  UI.result(app, race.result, out, info.rival.name);
}

// ----- teclas especiales -----
initInput(code => {
  sound.init();
  if (code === 'Escape' && mode === 'race' && !resultShown) {
    if (info.free) return app.garage();
    paused = !paused; if (paused) { sound.silence(); UI.pause(app); } else UI.clear();
  }
  if (code === 'KeyC' && mode === 'race') { stage.cam = stage.cam === 'chase' ? 'hood' : 'chase'; try { localStorage.setItem('streetrod3d.cam', stage.cam); } catch (e) { /* nada */ } }
  if (code === 'KeyM') app.toggleSound();
  if (code === 'KeyR' && mode === 'race' && race.kind !== 'drag' && !resultShown) {
    const v = race.me.v, q = race.track.query(v.x, v.z, -1), p = race.track.at(q.s);
    v.reset(p.x, p.y, p.z, Math.atan2(p.tx, p.tz)); race.me.hint = -1;
  }
});
document.addEventListener('pointerdown', () => sound.init(), { once: true });
UI.onAction(() => sound.beep(660, 0.04, 0.05, 'sine'));

// ----- etiquetas con los nombres sobre los autos en Bob's -----
const tags = new Map();
function labels() {
  const list = mode === 'bobs' ? stage.labels() : [], seen = new Set();
  for (const l of list) {
    let el = tags.get(l.id);
    if (!el) { el = document.createElement('button'); el.className = 'tag3d'; el.dataset.a = 'pick'; el.dataset.v = l.id; el.textContent = rivalById(l.id).name; $('labels').appendChild(el); tags.set(l.id, el); }
    el.style.transform = `translate(${l.x.toFixed(0)}px, ${l.y.toFixed(0)}px) translate(-50%, -100%)`;
    seen.add(l.id);
  }
  for (const [id, el] of tags) if (!seen.has(id)) { el.remove(); tags.delete(id); }
}

// ----- el ciclo -----
let last = performance.now();
function frame(now, once) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (mode === 'race' && race && !paused) {
    const inp = readInput();
    acc += dt;
    let first = true;
    while (acc >= STEP) {
      race.step(STEP, first ? inp : Object.assign({}, inp, { launch: false, up: false, down: false, nitro: false }));
      if (first) edges.clear();
      first = false; acc -= STEP;
    }
    raceEvents();
    for (const r of race.racers) r.car.sync(r.v, dt);
    updateHud(race, info.rival && info.rival.name);
    sound.update([{ rpm: race.me.v.rpmShown, gas: race.me.v.gas, slip: race.me.v.slip, speed: race.me.v.speed }, race.rv ? { rpm: race.rv.v.rpmShown, gas: race.rv.v.gas, dist: Math.hypot(race.rv.v.x - race.me.v.x, race.rv.v.z - race.me.v.z) } : null]);
    if (race.phase === 'done' && !resultShown) { if (!resultAt) resultAt = race.t + 1.4; if (race.t > resultAt) showResult(); }
  } else { readInput(); edges.clear(); acc = 0; }
  stage.frame(dt);
  if (race) race.events.length = 0;
  labels();
  if (!once) requestAnimationFrame(frame);
}

stage.init($('c'));
document.documentElement.lang = LANG;
app.title();
// ?cover: la portada para el catálogo del sitio (sin menú, con la cámara quieta)
if (/[?&]cover\b/.test(location.search)) { UI.clear(); stage.setCover({ model: 'starliner', color: '#c8202a', decal: 'flames', num: 0, up: { engine: 3, intake: 2, exhaust: 2, trans: 0, tires: 2, susp: 1, weight: 0, nitro: 0 }, cond: 1 }, kingCar()); }
requestAnimationFrame(frame);

// Para probar sin el navegador al frente: avanzar a mano y dibujar un cuadro
window.__sr = {
  app, G, stage, get race() { return race; },
  tick() { frame(performance.now(), true); },
  sim(sec, fn) {
    const n = Math.round(sec / STEP), base = { gas: 0, brake: 0, steer: 0, analog: false, hand: false, launch: false, up: false, down: false, nitro: false };
    for (let i = 0; i < n && race; i++) {
      race.step(STEP, Object.assign({}, base, fn ? fn(race, i) : {}));
      if (i % 4 === 3) { for (const r of race.racers) r.car.sync(r.v, STEP * 4); stage.effects(STEP * 4); race.events.length = 0; }
      if (race.phase === 'done' && !resultShown) showResult();
    }
    if (race) { for (const r of race.racers) r.car.sync(r.v, 0.016); updateHud(race, info.rival && info.rival.name); }
    return race;
  }
};
