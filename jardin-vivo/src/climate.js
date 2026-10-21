// ===== Clima: sol, temperatura y lluvia de la ciudad elegida =====
const DAYS_SEASON = 13, DAYS_YEAR = 52;
const seasonOf = yd => Math.floor(yd / DAYS_SEASON) % 4; // 0 primavera, 1 verano, 2 otoño, 3 invierno
const cosY = (yd, peak) => Math.cos(TAU * (yd - peak) / DAYS_YEAR);

// Cada clima: latitud (el hemisferio decide de dónde viene el sol), el día real en que empieza la primavera,
// el pH típico del suelo y los promedios de temperatura, lluvia y humedad a lo largo del año.
const CLIMATES = {
  santiago: { // mediterráneo: veranos secos y calurosos, inviernos lluviosos con heladas
    lat: -33.5, spring: 265, ph: 7.4, drain: 0, cloud: 0.35, frostSnap: 0.18, heatwave: 0.13, lateFrost: 0.15, sky: 'andes',
    normals: yd => { const c = cosY(yd, 17); return { tmax: 22 + 8.5 * c, tmin: 7.5 + 5.5 * c, rainP: 0.16 - 0.145 * c, hum: 0.55 - 0.2 * c }; }
  },
  valdivia: { // templado lluvioso: llueve casi todo el año, veranos frescos y suelos volcánicos ácidos
    lat: -39.8, spring: 265, ph: 5.7, drain: -0.04, cloud: 0.6, frostSnap: 0.22, heatwave: 0.03, lateFrost: 0.2, sky: 'volcano',
    normals: yd => { const c = cosY(yd, 18); return { tmax: 16.5 + 6 * c, tmin: 6 + 3.5 * c, rainP: 0.42 - 0.22 * c, hum: 0.82 - 0.08 * c }; }
  },
  serena: { // semiárido costero: casi no llueve, sin heladas y con neblina matinal (camanchaca)
    lat: -29.9, spring: 265, ph: 7.8, drain: 0.12, cloud: 0.45, frostSnap: 0, heatwave: 0.02, lateFrost: 0, sky: 'dryhills',
    normals: yd => { const c = cosY(yd, 19); return { tmax: 19.5 + 3.5 * c, tmin: 10 + 3.5 * c, rainP: 0.045 - 0.04 * c, hum: 0.72 }; }
  },
  cdmx: { // subtropical de altura: primavera calurosa, lluvias de verano por la tarde, inviernos secos y suaves
    lat: 19.43, spring: 79, ph: 7.0, drain: 0.02, cloud: 0.3, frostSnap: 0.06, heatwave: 0.05, lateFrost: 0, sky: 'volcanoes',
    normals: yd => {
      const wet = Math.exp(-Math.pow((yd - 19) / 7, 2));
      return { tmax: 24 + 3 * cosY(yd, 7), tmin: 9 + 4 * cosY(yd, 15), rainP: 0.04 + 0.5 * wet, hum: 0.42 + 0.3 * wet };
    }
  }
};
const CLIMATE_ORDER = ['santiago', 'valdivia', 'serena', 'cdmx'];
let CL = CLIMATES.santiago, LAT = CL.lat * Math.PI / 180;
function setClimate(id) {
  CL = CLIMATES[id] || CLIMATES.santiago;
  LAT = CL.lat * Math.PI / 180;
}
// Día real del año (1–365) para un día del juego: el primer día de juego es el comienzo de la primavera
const realDOY = yd => (CL.spring + Math.round(yd * 7)) % 365;

function declination(yd) {
  return 23.44 * Math.PI / 180 * Math.sin(TAU * (284 + realDOY(yd)) / 365);
}

// Dirección hacia el sol. En el mundo: x crece hacia abajo a la derecha, y hacia abajo a la izquierda, z hacia arriba.
// El norte queda arriba de la pantalla y el este a la derecha: en el hemisferio sur el sol del mediodía viene del norte,
// y en el norte, del sur.
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
const normals = yd => CL.normals(yd);

// Crea el tiempo de un día. r es una función de azar (para poder repetir pronósticos).
function makeWeather(yd, prev, r) {
  const n = normals(yd), s = seasonOf(yd);
  const anom = (prev ? prev.anom * 0.55 : 0) + (r() - 0.5) * 4.5;
  const w = { yd, anom, rain: 0, cloud: r() * CL.cloud * (s === 1 ? 0.7 : 1.4), heat: false, frost: false, storm: false };
  // la lluvia suele venir en rachas de varios días
  const rainy = r() < n.rainP * (prev && prev.rain > 0 ? 1.6 : 1);
  if (rainy) {
    w.rain = 4 + r() * 24; w.cloud = 0.85 + r() * 0.15;
    if (w.rain > 22 && s >= 2) w.storm = true;
  }
  w.tmax = n.tmax + anom - (rainy ? 4 : 0) - w.cloud * 2;
  w.tmin = n.tmin + anom * 0.8 + (rainy ? 2.5 : 0) - (w.cloud < 0.2 ? 1.6 : 0);
  if (s === 1 && !rainy && r() < CL.heatwave) { w.tmax += 5 + r() * 3; w.tmin += 2; w.heat = true; }   // ola de calor
  if (s === 3 && !rainy && r() < CL.frostSnap) w.tmin -= 3 + r() * 3;                                    // helada fuerte
  if (s === 0 && yd < 4 && !rainy && r() < CL.lateFrost) w.tmin -= 4;                                     // helada tardía
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
