// ===== Fotos: los autos para el diario y las listas (con su propio dibujante) y las caras de los rivales =====
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/jsm/environments/RoomEnvironment.js';
import { buildCar, lookKey } from './car.js';

let R = null, scene = null, cam = null;
const cache = new Map();
export function carPhoto(state, w = 360, h = 200, angle = 0.8) {
  const key = lookKey(state) + '|' + w + 'x' + h + '|' + angle;
  if (cache.has(key)) return cache.get(key);
  if (!R) {
    R = new THREE.WebGLRenderer({ canvas: document.createElement('canvas'), antialias: true, alpha: true, preserveDrawingBuffer: true });
    R.setPixelRatio(1); R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.05;
    scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose();
    const d = new THREE.DirectionalLight(0xffffff, 1.6); d.position.set(4, 6, 5); scene.add(d, new THREE.HemisphereLight(0xffffff, 0x303030, 0.6));
    cam = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
  }
  R.setSize(w * 2, h * 2, false);
  const car = buildCar(state);
  scene.add(car.root);
  const dist = car.len * 1.55 + 0.9;
  cam.aspect = w / h; cam.updateProjectionMatrix();
  cam.position.set(Math.sin(angle) * dist, 1.7, Math.cos(angle) * dist); cam.lookAt(0, 0.58, 0);
  R.render(scene, cam);
  const url = R.domElement.toDataURL('image/png');
  scene.remove(car.root); car.dispose();
  cache.set(key, url);
  return url;
}

// Cara de un rival: piel, pelo, polera y (a veces) lentes oscuros
const faces = new Map();
export function portrait(look, shades, size = 160) {
  const key = look.join() + shades + size;
  if (faces.has(key)) return faces.get(key);
  const [skin, hair, top] = look, c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), s = size / 100;
  g.scale(s, s);
  const bg = g.createLinearGradient(0, 0, 0, 100); bg.addColorStop(0, '#2a2246'); bg.addColorStop(1, '#14121e'); g.fillStyle = bg; g.fillRect(0, 0, 100, 100);
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * (1 + k)))); return `rgb(${f(n >> 16 & 255)},${f(n >> 8 & 255)},${f(n & 255)})`; };
  // hombros y cuello
  g.fillStyle = top; g.beginPath(); g.moveTo(10, 100); g.quadraticCurveTo(12, 74, 34, 70); g.lineTo(66, 70); g.quadraticCurveTo(88, 74, 90, 100); g.fill();
  g.fillStyle = shade(skin, -0.12); g.fillRect(42, 56, 16, 18);
  // cara con sombra
  const fg = g.createRadialGradient(44, 38, 4, 50, 44, 26); fg.addColorStop(0, shade(skin, 0.12)); fg.addColorStop(1, shade(skin, -0.18));
  g.fillStyle = shade(skin, -0.1); g.beginPath(); g.ellipse(29, 46, 4, 6, 0, 0, 7); g.ellipse(71, 46, 4, 6, 0, 0, 7); g.fill();
  g.fillStyle = fg; g.beginPath(); g.ellipse(50, 44, 21, 25, 0, 0, Math.PI * 2); g.fill();
  // pelo: jopo
  g.fillStyle = hair; g.beginPath(); g.moveTo(28, 44); g.quadraticCurveTo(24, 16, 48, 14); g.quadraticCurveTo(76, 10, 74, 42); g.quadraticCurveTo(70, 28, 56, 26); g.quadraticCurveTo(40, 24, 31, 44); g.fill();
  g.beginPath(); g.ellipse(46, 16, 18, 8, -0.2, 0, Math.PI * 2); g.fill();
  // ojos (o lentes), cejas, nariz y boca
  if (shades) { g.fillStyle = '#0a0a0e'; g.beginPath(); g.roundRect ? g.roundRect(33, 38, 14, 9, 3) : g.rect(33, 38, 14, 9); g.fill(); g.beginPath(); g.roundRect ? g.roundRect(53, 38, 14, 9, 3) : g.rect(53, 38, 14, 9); g.fill(); g.fillRect(46, 40, 8, 2); }
  else { g.fillStyle = '#20140e'; g.beginPath(); g.ellipse(41, 43, 2.4, 3, 0, 0, 7); g.ellipse(59, 43, 2.4, 3, 0, 0, 7); g.fill(); g.strokeStyle = hair; g.lineWidth = 2; g.beginPath(); g.moveTo(36, 37); g.lineTo(45, 36); g.moveTo(55, 36); g.lineTo(64, 37); g.stroke(); }
  g.strokeStyle = shade(skin, -0.3); g.lineWidth = 1.6; g.beginPath(); g.moveTo(50, 46); g.lineTo(52, 53); g.lineTo(48, 54); g.stroke();
  g.strokeStyle = '#7a2e22'; g.lineWidth = 2; g.beginPath(); g.moveTo(42, 60); g.quadraticCurveTo(50, 63, 58, 59); g.stroke();
  const url = c.toDataURL();
  faces.set(key, url);
  return url;
}
