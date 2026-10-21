// ===== Clima: sol, temperatura y lluvia de un clima mediterráneo (como Santiago de Chile) =====
const DAYS_SEASON = 13, DAYS_YEAR = 52;
const LAT = -33.5 * Math.PI / 180;     // hemisferio sur: el sol del mediodía viene del norte
const seasonOf = yd => Math.floor(yd / DAYS_SEASON) % 4; // 0 primavera, 1 verano, 2 otoño, 3 invierno
// Día real del año (1–365): el primer día del juego es el 22 de septiembre
const realDOY = yd => (265 + Math.round(yd * 7)) % 365;

function declination(yd) {
  return 23.44 * Math.PI / 180 * Math.sin(TAU * (284 + realDOY(yd)) / 365);
}

// Dirección hacia el sol. En el mundo: x crece hacia abajo a la derecha, y hacia abajo a la izquierda, z hacia arriba.
// El norte queda arriba de la pantalla, el este a la derecha.
function sunVector(yd, hour) {
  const d = declination(yd), H = (hour - 12) * 15 * Math.PI / 180;
  const E = -Math.cos(d) * Math.sin(H);
  const N = Math.sin(d) * Math.cos(LAT) - Math.cos(d) * Math.cos(H) * Math.sin(LAT);
  const U = Math.sin(d) * Math.sin(LAT) + Math.cos(d) * Math.cos(H) * Math.cos(LAT);
  return { x: (E - N) * Math.SQRT1_2, y: (-E - N) * Math.SQRT1_2, z: U };
}

// Horas en que el sol está sobre el horizonte
function dayLength(yd) {
  const c = -Math.tan(LAT) * Math.tan(declination(yd));
  return 24 * Math.acos(clamp(c, -1, 1)) / Math.PI;
}
const sunrise = yd => 12 - dayLength(yd) / 2;
const sunset = yd => 12 + dayLength(yd) / 2;

// Promedios del clima según la época (enero es lo más caluroso y julio lo más frío)
function normals(yd) {
  const c = Math.cos(TAU * (yd - 17) / DAYS_YEAR);
  return { tmax: 22 + 8.5 * c, tmin: 7.5 + 5.5 * c, rainP: 0.16 - 0.145 * c, hum: 0.55 - 0.2 * c };
}

// Crea el tiempo de un día. r es una función de azar (para poder repetir pronósticos).
function makeWeather(yd, prev, r) {
  const n = normals(yd), s = seasonOf(yd);
  const anom = (prev ? prev.anom * 0.55 : 0) + (r() - 0.5) * 4.5;
  const w = { yd, anom, rain: 0, cloud: r() * (s === 1 ? 0.25 : 0.55), heat: false, frost: false, storm: false };
  // la lluvia suele venir en rachas de varios días
  const rainy = r() < n.rainP * (prev && prev.rain > 0 ? 1.6 : 1);
  if (rainy) {
    w.rain = 4 + r() * 24; w.cloud = 0.85 + r() * 0.15;
    if (w.rain > 22 && s >= 2) w.storm = true;
  }
  w.tmax = n.tmax + anom - (rainy ? 4 : 0) - w.cloud * 2;
  w.tmin = n.tmin + anom * 0.8 + (rainy ? 2.5 : 0) - (w.cloud < 0.2 ? 1.6 : 0);
  if (s === 1 && !rainy && r() < 0.13) { w.tmax += 5 + r() * 3; w.tmin += 2; w.heat = true; }   // ola de calor
  if (s === 3 && !rainy && r() < 0.18) w.tmin -= 3 + r() * 3;                                    // helada fuerte
  if (s === 0 && yd < 4 && !rainy && r() < 0.15) w.tmin -= 4;                                     // helada tardía
  w.tmin = Math.min(w.tmin, w.tmax - 4);
  w.frost = w.tmin < 0;
  w.hum = clamp(n.hum + (rainy ? 0.3 : 0) - (w.heat ? 0.1 : 0), 0.2, 0.95);
  w.kind = w.storm ? 'storm' : rainy ? 'rain' : w.heat ? 'heat' : w.cloud > 0.45 ? 'cloud' : w.cloud > 0.22 ? 'partly' : 'sun';
  return w;
}

// Temperatura a una hora del día: mínima al amanecer, máxima a las 15:00
function tempAt(w, hour) {
  const h = ((hour % 24) + 24) % 24;
  let f;
  if (h >= 6 && h <= 15) f = 0.5 - 0.5 * Math.cos(Math.PI * (h - 6) / 9);
  else { const t = h > 15 ? h - 15 : h + 9; f = 0.5 + 0.5 * Math.cos(Math.PI * t / 15); }
  return w.tmin + (w.tmax - w.tmin) * f;
}

// Horas de frío (< 7 °C) que acumula un día; cada día del juego es una semana, por eso × 7
function chillHours(w) {
  let n = 0;
  for (let h = 0; h < 24; h++) if (tempAt(w, h) < 7) n++;
  return n * 7;
}

const WEATHER_ICON = { sun: '☀️', partly: '⛅', cloud: '☁️', rain: '🌧️', storm: '⛈️', heat: '🔥' };
