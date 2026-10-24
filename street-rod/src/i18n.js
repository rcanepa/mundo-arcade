// ===== Idiomas: español e inglés =====
// La clave se comparte con el sitio, así que el idioma elegido en el portal se usa aquí también. ?lang=es|en manda.
const LANG_KEY = 'arcade.lang';
export let LANG = (() => {
  const q = typeof location !== 'undefined' && /[?&]lang=(es|en)\b/.exec(location.search || '');
  if (q) return q[1];
  try { const s = localStorage.getItem(LANG_KEY); if (s === 'es' || s === 'en') return s; } catch (e) { /* sin almacenamiento */ }
  return typeof navigator !== 'undefined' && !(navigator.language || 'es').toLowerCase().startsWith('es') ? 'en' : 'es';
})();
export function setLang(l) { LANG = l; try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* nada */ } }
export const L = () => STR[LANG];

const ES = {
  months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  date: d => `${d.getUTCDate()} de ${ES.months[d.getUTCMonth()]}`,
  daysLeft: n => (n === 1 ? 'queda 1 día' : `quedan ${n} días`),
  ok: 'Listo', cancel: 'Cancelar', back: 'Volver', close: 'Cerrar', yes: 'Sí', no: 'No', next: 'Sigue',
  title: { sub: "Verano del '63", cont: 'Seguir el verano', fresh: 'Nueva partida', how: 'Cómo se juega', fame: 'Reyes de la calle', lang: 'English', soundOn: 'Sonido: sí', soundOff: 'Sonido: no', more: '← Más juegos', credit: 'Basado en Street Rod (1989) · Mundo Arcade', sure: 'Ya tienes un verano empezado. ¿Empezar de nuevo?' },
  license: { state: 'ESTADO DE CALIFORNIA', title: 'LICENCIA DE CONDUCIR', name: 'Tu nombre', placeholder: 'Escribe tu nombre', ok: 'Listo' },
  intro: [
    ["Verano de 1963. Terminaron las clases y tienes $750 en el bolsillo.", "Cada noche los mejores autos del valle se juntan en Bob's Drive-In. El más rápido de todos es El Rey, con su Viper negro."],
    ['Compra un cacharro en el diario, mejóralo en tu garaje y gánales a todos.', 'Hay cuatro categorías (D, C, B y A). Gánale a tres rivales de una categoría y su jefe te va a desafiar. Gánale al jefe de la A y El Rey te buscará. Tienes hasta el 3 de septiembre.']
  ],
  how: [
    ['El garaje', 'En el diario hay autos usados: siempre hay uno barato. En el taller mejoras el motor, la admisión, el escape, la caja, las gomas, la suspensión, el peso y el nitro. Cada mejora se ve en el auto.', 'Los autos baratos tienen techo: para llegar arriba vas a tener que cambiar de auto. Puedes tener hasta tres.'],
    ["Bob's Drive-In", 'Cada noche llegan rivales. Elige uno, mira lo que acepta y desafíalo a una picada o a una ruta: por plata (desde $10), por el honor, o en la ruta por los papeles. A veces son ellos los que te desafían.', 'Los sábados hay Copa: tres picadas seguidas con premio y trofeo. Gus te paga $30 cada día por tu turno en la bencinera. Bob\'s cierra a la una.'],
    ['La picada', 'Con ↑ deja las vueltas en la zona verde del tacómetro. Cuando el árbol se ponga verde, suelta con ESPACIO. Cada ESPACIO después sube un cambio: cámbiate cuando se encienda la luz verde. Si largas antes de la verde es falta.', 'N: nitro, si tienes. C: cambia la cámara.'],
    ['La ruta', '↑ acelera, ↓ frena (y retrocede), ← → dobla, ESPACIO es el freno de mano para derrapar. Son dos vueltas por los cerros. Si te sales, R te devuelve a la pista.', 'En el taller puedes elegir si los cambios los pasas tú o el auto.'],
    ['Créditos', 'Basado en Street Rod (1989), de California Dreams. Hecho para Mundo Arcade.', 'Los autos son inventados y se arman en 3D con three.js. Sonido sintetizado.']
  ],
  top: { money: 'Plata', day: 'Día', cls: 'Categoría' },
  garage: {
    title: 'Tu garaje', paper: 'Diario', shop: 'Taller', paint: 'Pintura', cars: 'Mis autos', test: 'Probar el auto', bobs: "Ir a Bob's",
    noCar: 'No tienes auto. Busca uno en el diario: siempre hay uno barato.', cond: 'Motor', et: 'Cuarto de milla', top: 'Velocidad máx.', grip: 'Agarre',
    menu: 'Menú', worn: 'Motor gastado: repáralo en el taller.', wage: p => `Gus te pagó ${p} por el turno en la bencinera.`
  },
  paper: {
    title: 'Diario del Valle', sub: 'Autos usados', buy: p => `Comprar ${p}`, offer: 'Ofrecer menos', sold: 'VENDIDO', cond: 'Estado',
    lines: ['Único dueño.', 'Lo vendo por viaje.', 'Necesita cariño.', 'Anda bien.', 'Urgente.', 'Ver para creer.'],
    deal: p => `¡Trato hecho! Ahora pide ${p}.`, noDeal: 'El vendedor no baja el precio.', bought: n => `¡Compraste el ${n}!`,
    noRoom: 'Ya tienes tres autos. Vende uno primero.', money: 'No te alcanza la plata.', upgrades: 'Trae mejoras'
  },
  shop: {
    title: 'Taller', buy: p => `Comprar ${p}`, max: 'Al máximo', repair: p => `Reparar motor (${p})`, fine: 'El motor está como nuevo.',
    shiftAuto: 'Cambios automáticos', shiftManual: 'Cambios a mano', shiftHint: 'Con cambios a mano ganas décimas en la picada.',
    cats: {
      engine: ['Motor', ['De fábrica', 'Preparado', 'Carrera', 'Compresor']],
      intake: ['Admisión', ['Un carburador', 'Doble carburador', 'Cuatro bocas']],
      exhaust: ['Escape', ['De fábrica', 'Doble', 'Laterales']],
      trans: ['Caja', ['De fábrica', 'Manual 4', 'Cerrada de carrera']],
      tires: ['Neumáticos', ['Normales', 'Deportivos', 'Slicks']],
      susp: ['Suspensión', ['De fábrica', 'Rebajada', 'De carrera']],
      weight: ['Peso', ['De fábrica', 'Alivianado', 'Pelado']],
      nitro: ['Nitro', ['Sin nitro', '1 botella', '2 botellas', '3 botellas']]
    },
    bought: (c, l) => `${c}: ${l}`,
    desc: {
      engine: ['Tal como salió de la fábrica.', 'Árbol de levas y culata trabajados: más fuerza en todo el rango.', 'Pistones forjados, tapas cromadas y más vueltas: mucha más potencia arriba.', 'Un compresor que mete aire a presión. La bestia.'],
      intake: ['Un carburador chico.', 'Dos carburadores: el motor respira mejor.', 'Un carburador de cuatro bocas: mucho más aire y nafta.'],
      exhaust: ['Escape de fábrica, con silenciador.', 'Colectores cromados y doble escape: más fuerza y mejor sonido.', 'Escapes laterales libres: más fuerza y mucho ruido.'],
      trans: ['La caja de fábrica.', 'Manual de 4 cambios: cada cambio más cerca del otro.', 'Caja cerrada de carrera: cambios rapidísimos.'],
      tires: ['Gomas de calle.', 'Gomas deportivas con línea roja: agarran más en las curvas y al largar.', 'Slicks de carrera atrás: el máximo agarre para largar sin patinar.'],
      susp: ['Suspensión de fábrica.', 'Rebajada: el auto va más bajo y dobla más plano.', 'De carrera: dobla como sobre rieles.'],
      weight: ['Con todo puesto.', 'Alivianado: fuera el asiento de atrás y lo que sobra.', 'Pelado: solo lo necesario para correr.'],
      nitro: ['Sin nitro.', 'Una botella de óxido nitroso: un empujón por carrera.', 'Dos botellas: dos empujones.', 'Tres botellas: tres empujones.']
    },
    bars: { accel: 'Aceleración', top: 'Velocidad máx.', grip: 'Agarre', weight: 'Peso' },
    now: 'Ahora', next: 'Con la mejora', pick: 'Elige una pieza para ver qué cambia.', upgrade: p => `Mejorar · ${p}`
  },
  paint: { title: 'Pintura', colors: p => `Colores · ${p}`, decals: p => `Calcomanías · ${p}`, names: { none: 'Sin nada', flames: 'Llamas', stripes: 'Franjas', number: 'Número' } },
  cars: { title: 'Mis autos', use: 'Usar este', active: 'En uso', sell: p => `Vender por ${p}`, sure: (n, p) => `¿Vender el ${n} por ${p}?`, sold: p => `Vendido por ${p}.`, last: 'Es tu único auto.' },
  bobs: {
    title: "Bob's Drive-In", tonight: 'Esta noche', home: 'Irse a casa', closing: "Bob's está cerrando. Hora de irse a casa.", empty: 'No queda nadie con quien correr.',
    drag: 'Picada', road: 'Ruta', bet: 'Apuesta', pink: 'Los papeles', go: '¡Desafiar!', record: (w, l) => `Le ganaste ${w} · perdiste ${l}`, boss: 'JEFE', king: 'EL REY',
    yourCar: 'Tu auto', theirCar: 'Su auto', faster: s => `Su auto es ${s} s más rápido`, slower: s => `Tu auto es ${s} s más rápido`, even: 'Autos parejos',
    why: {
      raced: 'Ya corriste con él esta noche.', notYet: n => `Gánale primero a 3 de la categoría ${n}.`, pinkRoad: 'Los papeles solo se juegan en la ruta.',
      kingPink: 'El Rey solo corre en la ruta, y por los papeles.', scared: 'No arriesga su auto contra el tuyo.', money: 'No tienes esa plata.',
      tooMuch: n => `No apuesta más de ${n}.`, tooFast: 'Dice que tu auto es demasiado para él.', noCar: 'Necesitas un auto.'
    },
    hi: ['¿Una carrera, chico?', '¿Tienes con qué?', 'Mi auto está listo.', '¿Picada o ruta?', 'Te veo nervioso.', 'Esta noche me siento rápido.'],
    yes: ['¡Vamos!', 'Prepárate.', 'Hecho.', 'Ya veremos.'],
    kingHi: 'Así que tú eres el que anda ganándole a todos. Ruta. Los papeles. Ahora.',
    honor: 'Por el honor', terms: (types, max, pink) => `Acepta ${types} · ${max ? 'apuesta hasta ' + max : 'solo por el honor'} · papeles: ${pink ? 'sí' : 'no'}`,
    both: 'picada y ruta', roadOnly: 'solo la ruta'
  },
  offer: {
    comes: n => `${n} se acerca`, drag: b => (b ? `¿Una picada por ${b}?` : '¿Una picada, por el honor?'), road: b => (b ? `¿Una ruta por ${b}?` : '¿Una ruta, por el honor?'),
    yes: '¡Vamos!', no: 'Ahora no'
  },
  cup: {
    title: "Copa de Bob's", tonight: c => `Esta noche hay torneo de picadas de la categoría ${c}: tres rondas seguidas.`,
    terms: (f, p) => `Inscripción ${f} · al campeón ${p}`, enter: 'Inscribirse', why: { done: 'Ya corriste la copa de esta noche.', late: 'Se cerraron las inscripciones.', money: 'No te alcanza para la inscripción.', noCar: 'Necesitas un auto.' },
    round: k => `Ronda ${k} de 3`, vs: n => `Copa · ${n}`, next: 'Siguiente ronda', passed: k => `¡Pasaste la ronda ${k}!`,
    champion: (c, p) => `¡Campeón de la Copa ${c}! Te llevas ${p} y el trofeo.`, second: p => `Perdiste la final: te llevas ${p}.`, out: 'Quedaste fuera de la copa.',
    trophies: 'Trofeos', saturday: 'Los sábados hay Copa en Bob\'s.'
  },
  race: {
    hint: 'Con ↑ deja las vueltas en la zona verde · suelta con ESPACIO en la verde', foul: '¡Falta! Largaste antes de la verde', green: '¡VERDE!', go: '¡YA!',
    lowRevs: 'Largaste con pocas vueltas', spin: 'Demasiadas vueltas: ¡patina!', greatRt: '¡Gran reacción!', goodStart: '¡Buena largada!',
    perfect: '¡Cambio perfecto!', early: 'Muy temprano', nitro: '¡NITRO!', lastLap: '¡Última vuelta!', wrong: '¡Vas al revés!', lap: t => `Vuelta: ${t}`,
    free: 'Prueba libre · Esc para volver', time: 'Tiempo', rt: 'Reacción', lapL: 'Vuelta', pos: 'Posición', best: 'Mejor', foulShort: 'falta',
    rows: { rt: 'Reacción', sixty: '18 m', et: 'Cuarto de milla', trap: 'Velocidad final', total: 'Tiempo', bestLap: 'Mejor vuelta' },
    unfinished: 'sin terminar', you: 'Tú', won: '¡Ganaste!', lost: 'Perdiste', foulTitle: '¡Falta!'
  },
  result: {
    money: p => `Te llevas ${p}.`, lose: p => `Pagas ${p}.`, gotCar: n => `¡Te quedas con su ${n}!`, soldCar: (n, p) => `No te cabe su ${n}: lo vendes por ${p}.`,
    lostCar: n => `Le entregas los papeles de tu ${n}.`, unlocked: c => `¡Se abre la categoría ${c}! Ahora llegan rivales más rápidos.`, honorWin: "Por el honor: ahora en Bob's todos saben quién eres.", honorLose: 'Por el honor: esta vez solo perdiste el orgullo.', kingNow: 'El Rey se enteró. Te va a buscar en Bob\'s.', back: "Volver a Bob's"
  },
  keys: {
    drag: '<kbd>↑</kbd> acelerar · <kbd>Espacio</kbd> soltar en la verde y subir cambio · <kbd>Q</kbd> bajar · <kbd>N</kbd> nitro · <kbd>C</kbd> cámara · <kbd>M</kbd> sonido',
    road: '<kbd>↑</kbd> acelerar · <kbd>↓</kbd> frenar · <kbd>← →</kbd> doblar · <kbd>Espacio</kbd> freno de mano · <kbd>E</kbd>/<kbd>Q</kbd> cambios · <kbd>N</kbd> nitro · <kbd>R</kbd> a la pista · <kbd>C</kbd> cámara'
  },
  end: {
    king: ['¡EL NUEVO REY!', n => `Le ganaste a El Rey en su propia ruta. Su Viper negro es tuyo y desde esta noche todos en Bob's saben el nombre de ${n}.`],
    summer: ['Se acabó el verano', () => 'Vuelven las clases. El Rey sigue siendo El Rey... por ahora.'],
    broke: ['Sin auto y sin plata', () => "Pasarás el resto del verano a pie, mirando las carreras desde la vereda de Bob's."],
    stats: (w, l, d) => `Ganaste ${w} carreras y perdiste ${l} en ${d} días.`
  },
  fame: { title: 'Reyes de la calle', empty: 'Todavía nadie le ha ganado a El Rey.', days: n => `${n} días` },
  pause: { title: 'Pausa', resume: 'Seguir', quit: 'Abandonar (pierdes la carrera)' },
  toast: { saved: 'Guardado' }
};

const EN = {
  months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  date: d => `${EN.months[d.getUTCMonth()]} ${d.getUTCDate()}`,
  daysLeft: n => (n === 1 ? '1 day left' : `${n} days left`),
  ok: 'OK', cancel: 'Cancel', back: 'Back', close: 'Close', yes: 'Yes', no: 'No', next: 'Next',
  title: { sub: "Summer of '63", cont: 'Continue summer', fresh: 'New game', how: 'How to play', fame: 'King Street Rodders', lang: 'Español', soundOn: 'Sound: on', soundOff: 'Sound: off', more: '← More games', credit: 'Based on Street Rod (1989) · Mundo Arcade', sure: 'You already have a summer going. Start over?' },
  license: { state: 'STATE OF CALIFORNIA', title: "OPERATOR'S LICENSE", name: 'Your name', placeholder: 'Type your name', ok: 'Done' },
  intro: [
    ["Summer of 1963. School's out and you've got $750 in your pocket.", "Every night the hottest cars in the valley meet at Bob's Drive-In. The fastest of them all is The King, in his black Viper."],
    ['Buy a beater from the paper, build it up in your garage and beat everybody.', 'There are four classes (D, C, B and A). Beat three rivals in a class and their boss will call you out. Beat the boss of class A and The King will come for you. You have until September 3.']
  ],
  how: [
    ['The garage', 'The paper has used cars: there is always a cheap one. In the shop you upgrade the engine, intake, exhaust, gearbox, tires, suspension, weight and nitrous. Every upgrade shows on the car.', 'Cheap cars have a ceiling: to reach the top you will have to move up to a better car. You can own up to three.'],
    ["Bob's Drive-In", 'Rivals show up every night. Pick one, see what they will take and challenge them to a drag or road race: for cash (from $10), for bragging rights, or on the road for pink slips. Sometimes they challenge you.', "Saturdays there's a Cup: three drag races in a row for prize money and a trophy. Gus pays you $30 every day for your shift at the gas station. Bob's closes at one."],
    ['Drag racing', 'Hold ↑ to keep the revs in the green zone of the tach. When the tree turns green, drop the clutch with SPACE. Every SPACE after that shifts up: shift when the green light comes on. Leave before the green and it is a foul.', 'N: nitrous, if you have it. C: camera.'],
    ['Road racing', '↑ gas, ↓ brake (and reverse), ← → steer, SPACE is the handbrake for drifting. Two laps through the hills. If you go off, R puts you back on the road.', 'In the shop you can choose to shift yourself or let the car do it.'],
    ['Credits', 'Based on Street Rod (1989) by California Dreams. Made for Mundo Arcade.', 'The cars are made up and built in 3D with three.js. Synthesized sound.']
  ],
  top: { money: 'Cash', day: 'Day', cls: 'Class' },
  garage: {
    title: 'Your garage', paper: 'Paper', shop: 'Shop', paint: 'Paint', cars: 'My cars', test: 'Test drive', bobs: "Go to Bob's",
    noCar: "You don't have a car. Find one in the paper: there is always a cheap one.", cond: 'Engine', et: 'Quarter mile', top: 'Top speed', grip: 'Grip',
    menu: 'Menu', worn: 'Worn engine: fix it in the shop.', wage: p => `Gus paid you ${p} for your shift at the gas station.`
  },
  paper: {
    title: 'Valley Gazette', sub: 'Used cars', buy: p => `Buy ${p}`, offer: 'Offer less', sold: 'SOLD', cond: 'Condition',
    lines: ['One owner.', 'Moving, must sell.', 'Needs some love.', 'Runs good.', 'Must go.', 'See to believe.'],
    deal: p => `Deal! Now it's ${p}.`, noDeal: "The seller won't budge.", bought: n => `You bought the ${n}!`,
    noRoom: 'You already have three cars. Sell one first.', money: "You can't afford it.", upgrades: 'Comes with upgrades'
  },
  shop: {
    title: 'Shop', buy: p => `Buy ${p}`, max: 'Maxed out', repair: p => `Rebuild engine (${p})`, fine: 'The engine is like new.',
    shiftAuto: 'Automatic shifting', shiftManual: 'Manual shifting', shiftHint: 'Shifting yourself gains tenths in a drag race.',
    cats: {
      engine: ['Engine', ['Stock', 'Street', 'Race', 'Blower']],
      intake: ['Intake', ['Single carb', 'Dual carbs', 'Four-barrel']],
      exhaust: ['Exhaust', ['Stock', 'Dual', 'Side pipes']],
      trans: ['Gearbox', ['Stock', '4-speed', 'Close-ratio']],
      tires: ['Tires', ['Street', 'Sport', 'Slicks']],
      susp: ['Suspension', ['Stock', 'Lowered', 'Race']],
      weight: ['Weight', ['Stock', 'Lightened', 'Stripped']],
      nitro: ['Nitrous', ['None', '1 bottle', '2 bottles', '3 bottles']]
    },
    bought: (c, l) => `${c}: ${l}`,
    desc: {
      engine: ['Just as it left the factory.', 'Ported heads and a hotter cam: more power everywhere.', 'Forged pistons, chrome valve covers and more revs: a lot more power up top.', 'A supercharger forcing air in. The beast.'],
      intake: ['One small carburetor.', 'Two carburetors: the engine breathes better.', 'A four-barrel carburetor: lots more air and fuel.'],
      exhaust: ['Stock exhaust with a muffler.', 'Chrome headers and dual exhaust: more power and a better sound.', 'Open side pipes: more power and a lot of noise.'],
      trans: ['The stock gearbox.', 'Four-speed manual: every gear closer to the next.', 'Close-ratio race gearbox: lightning-fast shifts.'],
      tires: ['Street tires.', 'Redline sport tires: more grip in corners and off the line.', 'Racing slicks out back: maximum grip to launch without wheelspin.'],
      susp: ['Stock suspension.', 'Lowered: the car sits lower and corners flatter.', 'Race suspension: corners like it is on rails.'],
      weight: ['Everything still on.', 'Lightened: out with the back seat and the extras.', 'Stripped: only what it needs to race.'],
      nitro: ['No nitrous.', 'One bottle of nitrous oxide: one push per race.', 'Two bottles: two pushes.', 'Three bottles: three pushes.']
    },
    bars: { accel: 'Acceleration', top: 'Top speed', grip: 'Grip', weight: 'Weight' },
    now: 'Now', next: 'With the upgrade', pick: 'Pick a part to see what changes.', upgrade: p => `Upgrade · ${p}`
  },
  paint: { title: 'Paint', colors: p => `Colors · ${p}`, decals: p => `Decals · ${p}`, names: { none: 'Plain', flames: 'Flames', stripes: 'Stripes', number: 'Number' } },
  cars: { title: 'My cars', use: 'Drive this one', active: 'In use', sell: p => `Sell for ${p}`, sure: (n, p) => `Sell the ${n} for ${p}?`, sold: p => `Sold for ${p}.`, last: "It's your only car." },
  bobs: {
    title: "Bob's Drive-In", tonight: 'Tonight', home: 'Go home', closing: "Bob's is closing. Time to go home.", empty: 'Nobody left to race.',
    drag: 'Drag', road: 'Road', bet: 'Bet', pink: 'Pink slips', go: 'Race!', record: (w, l) => `You beat them ${w} · lost ${l}`, boss: 'BOSS', king: 'THE KING',
    yourCar: 'Your car', theirCar: 'Their car', faster: s => `Their car is ${s} s quicker`, slower: s => `Your car is ${s} s quicker`, even: 'Evenly matched',
    why: {
      raced: 'You already raced them tonight.', notYet: n => `Beat 3 rivals in class ${n} first.`, pinkRoad: 'Pink slips are only for road races.',
      kingPink: 'The King only races on the road, for pink slips.', scared: "Won't risk their car against yours.", money: "You don't have that much.",
      tooMuch: n => `Won't bet more than ${n}.`, tooFast: 'Says your car is too much for them.', noCar: 'You need a car.'
    },
    hi: ['Wanna race, kid?', 'Got what it takes?', 'My car is ready.', 'Drag or road?', 'You look nervous.', 'I feel fast tonight.'],
    yes: ["Let's go!", 'Get ready.', 'Deal.', "We'll see."],
    kingHi: "So you're the one beating everybody. Road. Pink slips. Now.",
    honor: 'For bragging rights', terms: (types, max, pink) => `Takes ${types} · ${max ? 'bets up to ' + max : 'bragging rights only'} · pink slips: ${pink ? 'yes' : 'no'}`,
    both: 'drag and road', roadOnly: 'road only'
  },
  offer: {
    comes: n => `${n} walks over`, drag: b => (b ? `Drag race for ${b}?` : 'Drag race, for bragging rights?'), road: b => (b ? `Road race for ${b}?` : 'Road race, for bragging rights?'),
    yes: "Let's go!", no: 'Not now'
  },
  cup: {
    title: "Bob's Cup", tonight: c => `Tonight there's a class ${c} drag tournament: three rounds in a row.`,
    terms: (f, p) => `Entry ${f} · winner takes ${p}`, enter: 'Sign up', why: { done: "You already raced tonight's cup.", late: 'Sign-up is closed.', money: "You can't afford the entry.", noCar: 'You need a car.' },
    round: k => `Round ${k} of 3`, vs: n => `Cup · ${n}`, next: 'Next round', passed: k => `You made it through round ${k}!`,
    champion: (c, p) => `Class ${c} Cup champion! You take ${p} and the trophy.`, second: p => `You lost the final: you take ${p}.`, out: "You're out of the cup.",
    trophies: 'Trophies', saturday: "Saturdays there's a Cup at Bob's."
  },
  race: {
    hint: 'Hold ↑ to keep the revs in the green · drop the clutch with SPACE on green', foul: 'Foul! You left before the green', green: 'GREEN!', go: 'GO!',
    lowRevs: 'Launched with low revs', spin: 'Too many revs: wheelspin!', greatRt: 'Great reaction!', goodStart: 'Good launch!',
    perfect: 'Perfect shift!', early: 'Too early', nitro: 'NITROUS!', lastLap: 'Last lap!', wrong: 'Wrong way!', lap: t => `Lap: ${t}`,
    free: 'Test drive · Esc to go back', time: 'Time', rt: 'Reaction', lapL: 'Lap', pos: 'Position', best: 'Best', foulShort: 'foul',
    rows: { rt: 'Reaction', sixty: '60 ft', et: 'Quarter mile', trap: 'Trap speed', total: 'Time', bestLap: 'Best lap' },
    unfinished: 'did not finish', you: 'You', won: 'You won!', lost: 'You lost', foulTitle: 'Foul!'
  },
  result: {
    money: p => `You take ${p}.`, lose: p => `You pay ${p}.`, gotCar: n => `Their ${n} is yours!`, soldCar: (n, p) => `No room for their ${n}: you sell it for ${p}.`,
    lostCar: n => `You hand over the pink slip for your ${n}.`, unlocked: c => `Class ${c} is open! Faster rivals will show up now.`, honorWin: "For bragging rights: now everybody at Bob's knows who you are.", honorLose: 'For bragging rights: this time you only lost your pride.', kingNow: 'The King heard about you. He will be waiting at Bob\'s.', back: "Back to Bob's"
  },
  keys: {
    drag: '<kbd>↑</kbd> gas · <kbd>Space</kbd> launch on green and shift up · <kbd>Q</kbd> shift down · <kbd>N</kbd> nitrous · <kbd>C</kbd> camera · <kbd>M</kbd> sound',
    road: '<kbd>↑</kbd> gas · <kbd>↓</kbd> brake · <kbd>← →</kbd> steer · <kbd>Space</kbd> handbrake · <kbd>E</kbd>/<kbd>Q</kbd> shift · <kbd>N</kbd> nitrous · <kbd>R</kbd> back on track · <kbd>C</kbd> camera'
  },
  end: {
    king: ['THE NEW KING!', n => `You beat The King on his own road. His black Viper is yours, and from tonight everybody at Bob's knows the name ${n}.`],
    summer: ['Summer is over', () => "School's back. The King is still The King... for now."],
    broke: ['No car, no cash', () => "You'll spend the rest of the summer on foot, watching the races from the sidewalk at Bob's."],
    stats: (w, l, d) => `You won ${w} races and lost ${l} in ${d} days.`
  },
  fame: { title: 'King Street Rodders', empty: 'Nobody has beaten The King yet.', days: n => `${n} days` },
  pause: { title: 'Paused', resume: 'Resume', quit: 'Quit (you lose the race)' },
  toast: { saved: 'Saved' }
};
export const STR = { es: ES, en: EN };
