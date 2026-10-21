// ===== Modelos de camioneta, pinturas y decoraciones =====
const PAINTS = [
  { c: '#e8312a', d: '#8f1712' }, // rojo
  { c: '#2f6fe8', d: '#173c8f' }, // azul
  { c: '#f2c21b', d: '#9c7a05' }, // amarillo
  { c: '#3cbf4a', d: '#1d6e26' }, // verde
  { c: '#ff8a1f', d: '#a34d00' }, // naranjo
  { c: '#9b4dff', d: '#5420a3' }, // morado
  { c: '#ff6fb5', d: '#a8336d' }, // rosado
  { c: '#38d6e8', d: '#167f8c' }, // celeste
  { c: '#3a3a44', d: '#151519' }, // negro
  { c: '#f4f4f4', d: '#9a9aa6' }  // blanco
];
const DECAL_COUNT = 6, HORN_COUNT = 5;
const MODEL_KEYS = ['pickup', 'monster', 'buggy', 'tractor', 'icecream'];
// Multiplicadores sobre la camioneta normal. mud = resistencia al barro, bump = amortiguación extra
const MODELS = {
  pickup:   { price: 0,   max: 1,    accel: 1,    turn: 1,    grip: 1,   mass: 1,    jump: 1,    mud: 0,     bump: 0 },
  monster:  { price: 300, max: 0.95, accel: 0.95, turn: 0.95, grip: 1,   mass: 1.4,  jump: 1.35, mud: 0.15,  bump: 2 },
  buggy:    { price: 250, max: 1.07, accel: 1.12, turn: 1.08, grip: 0.9, mass: 0.75, jump: 1.1,  mud: -0.08, bump: 0 },
  tractor:  { price: 120, max: 0.86, accel: 0.9,  turn: 0.92, grip: 1.2, mass: 1.8,  jump: 0.7,  mud: 0.3,   bump: 1 },
  icecream: { price: 150, max: 1,    accel: 0.98, turn: 0.98, grip: 1,   mass: 1.1,  jump: 0.95, mud: 0,     bump: 0 }
};

// Barras de 1 a 5 para mostrar en el taller: velocidad, aceleración, agarre, peso, salto
function modelBars(key) {
  const m = MODELS[key], bar = v => clamp(Math.round(v), 1, 5);
  return [3 + (m.max - 1) * 25, 3 + (m.accel - 1) * 20, 3 + (m.grip * m.turn - 1) * 12, 3 + (m.mass - 1) * 2.5, 3 + (m.jump - 1) * 6].map(bar);
}

function wheel(g, x, y, w, h) {
  g.fillStyle = '#151515'; roundRect(g, x, y, w, h, 1.5); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.12)';
  for (let i = x + 2; i < x + w - 1; i += 3) g.fillRect(i, y, 1, h);
}

// Cada modelo se dibuja mirando hacia +x. box = zona de la carrocería para pintura y barro
const MODEL_DRAW = {
  pickup: {
    box: [-12, -6.5, 24, 13],
    clip(g) { roundRect(g, -12, -6.5, 24, 13, 3.5); },
    base(g, c, d) {
      wheel(g, -11, -10, 8, 4); wheel(g, 4, -10, 8, 4); wheel(g, -11, 6, 8, 4); wheel(g, 4, 6, 8, 4);
      g.fillStyle = d; roundRect(g, -13, -7.5, 26, 15, 4); g.fill();
      g.fillStyle = c; roundRect(g, -12, -6.5, 24, 13, 3.5); g.fill();
      g.fillStyle = d; roundRect(g, -11, -5, 8, 10, 1.5); g.fill();
      g.fillStyle = c; roundRect(g, -3, -6, 10, 12, 2.5); g.fill();
    },
    top(g) {
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-2, -5, 8, 2);
      g.fillStyle = '#9fdcff'; roundRect(g, 4.5, -5, 3, 10, 1); g.fill();
      g.fillStyle = '#fff3a8'; g.fillRect(11, -5.5, 2, 3); g.fillRect(11, 2.5, 2, 3);
    }
  },
  monster: {
    box: [-12, -8, 24, 16],
    clip(g) { roundRect(g, -12, -8, 24, 16, 5); },
    base(g, c, d) {
      g.fillStyle = '#333'; g.fillRect(-10, -9, 2, 18); g.fillRect(8, -9, 2, 18);
      wheel(g, -15, -14, 11, 7); wheel(g, 5, -14, 11, 7); wheel(g, -15, 7, 11, 7); wheel(g, 5, 7, 11, 7);
      g.fillStyle = d; roundRect(g, -13, -9, 26, 18, 5); g.fill();
      g.fillStyle = c; roundRect(g, -12, -8, 24, 16, 5); g.fill();
      g.fillStyle = d; roundRect(g, -3, -7, 11, 14, 3); g.fill();
      g.fillStyle = c; roundRect(g, -2, -6, 9, 12, 2.5); g.fill();
    },
    top(g) {
      g.strokeStyle = '#222'; g.lineWidth = 1.2; g.strokeRect(-10, -6, 6, 12);
      g.fillStyle = '#9fdcff'; roundRect(g, 5, -5.5, 2.5, 11, 1); g.fill();
      g.fillStyle = '#ffd23f'; g.fillRect(-1, -7.6, 6, 1.4);
      g.fillStyle = '#fff3a8'; g.fillRect(11, -6.5, 2, 3); g.fillRect(11, 3.5, 2, 3);
    }
  },
  buggy: {
    box: [-11, -4.5, 22, 9],
    clip(g) { roundRect(g, -11, -4.5, 22, 9, 4); },
    base(g, c, d) {
      g.fillStyle = '#444'; g.fillRect(-9, -9, 1.6, 18); g.fillRect(7, -9, 1.6, 18);
      wheel(g, -13, -12, 8, 5); wheel(g, 4, -12, 8, 5); wheel(g, -13, 7, 8, 5); wheel(g, 4, 7, 8, 5);
      g.fillStyle = d; roundRect(g, -12, -5.5, 24, 11, 4.5); g.fill();
      g.fillStyle = c; roundRect(g, -11, -4.5, 22, 9, 4); g.fill();
    },
    top(g) {
      g.fillStyle = '#2a2a2a'; ellipse(g, -2, 0, 3.2, 3);
      g.strokeStyle = '#1a1a1a'; g.lineWidth = 1.4; g.strokeRect(-6, -4.5, 8, 9);
      g.beginPath(); g.moveTo(-6, -4.5); g.lineTo(2, 4.5); g.moveTo(-6, 4.5); g.lineTo(2, -4.5); g.stroke();
      g.fillStyle = '#888'; roundRect(g, -11, -2.5, 4, 5, 1); g.fill();
      g.fillStyle = '#fff3a8'; g.fillRect(10, -3.5, 1.6, 2.2); g.fillRect(10, 1.3, 1.6, 2.2);
    }
  },
  tractor: {
    box: [-11, -6.5, 24, 13],
    clip(g) { g.beginPath(); g.rect(-11, -6.5, 10, 13); g.rect(-2, -4, 15, 8); },
    base(g, c, d) {
      wheel(g, -13, -13, 12, 6.5); wheel(g, -13, 6.5, 12, 6.5);
      wheel(g, 6, -8.5, 6, 3.5); wheel(g, 6, 5, 6, 3.5);
      g.fillStyle = d; roundRect(g, -3, -5, 17, 10, 2.5); g.fill();
      g.fillStyle = c; roundRect(g, -2, -4, 15, 8, 2); g.fill();
      g.fillStyle = d; roundRect(g, -12, -7.5, 12, 15, 2.5); g.fill();
      g.fillStyle = c; roundRect(g, -11, -6.5, 10, 13, 2); g.fill();
    },
    top(g) {
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(-10, -5.5, 8, 2);
      g.fillStyle = '#9fdcff'; g.fillRect(-2.6, -5.5, 1.6, 11);
      g.fillStyle = '#222'; ellipse(g, 5, -2, 1.8, 1.8);
      g.fillStyle = '#fff3a8'; g.fillRect(12, -3.5, 1.6, 2.2); g.fillRect(12, 1.3, 1.6, 2.2);
    }
  },
  icecream: {
    box: [-14, -7.5, 28, 15],
    clip(g) { roundRect(g, -14, -7.5, 28, 15, 3); },
    base(g, c) {
      wheel(g, -12, -10.5, 8, 4); wheel(g, 5, -10.5, 8, 4); wheel(g, -12, 6.5, 8, 4); wheel(g, 5, 6.5, 8, 4);
      g.fillStyle = '#c9bca8'; roundRect(g, -15, -8.5, 30, 17, 3.5); g.fill();
      g.fillStyle = '#fff7ea'; roundRect(g, -14, -7.5, 28, 15, 3); g.fill();
      g.fillStyle = c; g.fillRect(-14, -7.5, 28, 3); g.fillRect(-14, 4.5, 28, 3);
    },
    top(g) {
      g.fillStyle = '#9fdcff'; roundRect(g, 8, -6, 3, 12, 1); g.fill();
      g.fillStyle = '#e0a458'; tri(g, -9, -3, -9, 3, -1, 0); g.fill();
      g.fillStyle = '#ff9ccf'; ellipse(g, -9, 0, 4, 4);
      g.fillStyle = '#fff'; ellipse(g, -10, -1, 1.2, 1.2);
      g.fillStyle = '#fff3a8'; g.fillRect(13, -6, 1.6, 3); g.fillRect(13, 3, 1.6, 3);
    }
  }
};

function star(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5 - Math.PI / 2, rr = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  g.closePath(); g.fill();
}

function drawDecal(g, decal, b) {
  const [x, y, w, h] = b, cx = x + w / 2, cy = y + h / 2;
  if (decal === 1) { // rayas
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(x, cy - 2.6, w, 1.6); g.fillRect(x, cy + 1, w, 1.6);
  } else if (decal === 2) { // llamas que salen del frente
    const fx = x + w, k = h / 13;
    const flame = (col, s) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(fx, cy - 5 * k * s);
      [[-6, -4], [-4, -2.5], [-11, -1.5], [-7, 0], [-12, 1.5], [-4, 2.5], [-7, 4], [0, 5]]
        .forEach(([dx, dy]) => g.lineTo(fx + dx * s, cy + dy * k * s));
      g.closePath(); g.fill();
    };
    flame('#ff6a00', 1); flame('#ffd23f', 0.6);
  } else if (decal === 3) { // estrellas
    g.fillStyle = '#fff6a8';
    [[-0.3, -0.25], [0.05, 0.25], [0.32, -0.2]].forEach(([fx, fy]) => star(g, cx + fx * w, cy + fy * h, 2.4));
  } else if (decal === 4) { // rayo
    g.fillStyle = '#ffe14a'; g.beginPath();
    [[-0.45, 0.1], [0.02, -0.38], [-0.02, -0.05], [0.45, -0.12], [-0.02, 0.38], [0.02, 0.06]]
      .forEach(([fx, fy], i) => (i ? g.lineTo(cx + fx * w, cy + fy * h) : g.moveTo(cx + fx * w, cy + fy * h)));
    g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 0.6; g.stroke();
  } else if (decal === 5) { // manchas de vaca
    g.fillStyle = 'rgba(20,20,20,0.85)';
    [[-0.32, -0.22, 3, 2.2], [0.05, 0.25, 2.6, 2], [0.28, -0.25, 2, 2.6], [0.4, 0.28, 1.8, 1.4], [-0.1, -0.05, 1.6, 1.4]]
      .forEach(([fx, fy, rx, ry]) => ellipse(g, cx + fx * w, cy + fy * h, rx, ry));
  }
}

const DIRT_SPOTS = [[-0.35, -0.3, 2.2], [-0.1, 0.35, 1.8], [0.2, -0.25, 2.5], [0.4, 0.3, 1.6], [-0.45, 0.25, 1.5],
                    [0.05, -0.05, 2.8], [0.3, 0.05, 1.5], [-0.2, -0.05, 1.7], [0.45, -0.35, 1.3], [-0.05, 0.2, 1.2]];
function drawDirt(g, dirt, b) {
  const [x, y, w, h] = b, n = Math.ceil(DIRT_SPOTS.length * Math.min(1, 0.3 + dirt));
  g.fillStyle = `rgba(86,56,26,${Math.min(0.9, dirt)})`;
  for (let i = 0; i < n; i++) {
    const [fx, fy, r] = DIRT_SPOTS[i];
    ellipse(g, x + w * (0.5 + fx), y + h * (0.5 + fy), r * 1.3, r);
  }
}

// look: cualquier objeto con color, dark, model, decal y opcionalmente dirt y nitroT (una Truck sirve)
function drawTruck(g, look) {
  const m = MODEL_DRAW[look.model] || MODEL_DRAW.pickup, b = m.box;
  if (look.nitroT > 0) {
    const l = 10 + Math.random() * 10, rx = b[0] - 1;
    g.fillStyle = '#ff7a00'; tri(g, rx, -4, rx, 4, rx - l, 0); g.fill();
    g.fillStyle = '#ffe14a'; tri(g, rx, -2, rx, 2, rx - l * 0.6, 0); g.fill();
  }
  m.base(g, look.color, look.dark);
  if (look.decal) { g.save(); m.clip(g); g.clip(); drawDecal(g, look.decal, b); g.restore(); }
  m.top(g);
  if (look.dirt > 0.04) { g.save(); m.clip(g); g.clip(); drawDirt(g, look.dirt, b); g.restore(); }
}
