// ===== Idiomas: español e inglés =====
// La clave se comparte con el sitio, así que el idioma elegido en el portal se usa aquí también.
const LANG_KEY = 'arcade.lang';
let LANG = (() => {
  // ?lang=es o ?lang=en en la dirección manda (sirve para compartir el enlace o sacar la portada)
  const q = /[?&]lang=(es|en)\b/.exec(location.search || '');
  if (q) return q[1];
  try {
    const s = localStorage.getItem(LANG_KEY);
    if (s === 'es' || s === 'en') return s;
  } catch (e) { /* sin almacenamiento */ }
  return (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
})();
const L = () => STR[LANG];
function setLang(l, save = true) {
  LANG = l;
  if (save) try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* sin almacenamiento */ }
  if (document.documentElement) document.documentElement.lang = l;
  document.title = L().docTitle;
}

const STR = {
  es: {
    docTitle: 'Street Rod: Verano del 63', subtitle: 'Verano del \'63', langName: 'Español',
    months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    days: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    date: d => `${STR.es.days[d.getDay()]} ${d.getDate()} de ${STR.es.months[d.getMonth()]}`,
    shortDate: d => `${d.getDate()} ${STR.es.months[d.getMonth()].slice(0, 3)}`,
    menu: { cont: 'Continuar el verano', fresh: 'Nueva partida', how: 'Cómo se juega', lang: '🌐 English', more: '← Más juegos', music: on => (on ? '🎵 Música: sí' : '🔇 Música: no') },
    intro: [
      'Es junio de 1963 en San Lucas, California. Terminaron las clases y tienes $750 ahorrados.',
      'Todas las noches los mejores autos del pueblo se juntan en el Lucky\'s Drive-In. Y el mejor de todos es el de El Rey.',
      'Compra un auto en el diario, ármalo en tu garaje y gánale a todos. Tienes hasta que empiecen las clases, el 3 de septiembre.'
    ],
    license: 'LICENCIA DE CONDUCIR', state: 'ESTADO DE CALIFORNIA', yourName: 'Tu nombre', start: '¡Empezar el verano!',
    defaultName: 'Johnny',
    how: [
      ['🗞️', 'El diario', 'Cada mañana trae autos usados y piezas. Las piezas de motor y caja solo calzan en autos de su misma marca (GM, Ford o Chrysler).'],
      ['🔧', 'El taller', 'Abre el capó y haz clic en los pernos para sacar y poner piezas. El múltiple decide cuántos carburadores lleva.'],
      ['🍔', 'El drive-in', 'De noche llegan los rivales. Elige picada (cuarto de milla) o carrera de ruta, y cuánto apostar. En la ruta puedes apostar los papeles del auto.'],
      ['🏁', 'Manejar', '↑ acelerar · ↓ frenar · ← → doblar · ESPACIO suelta el embrague y sube cambio · Z baja cambio. ¡Suelta el acelerador al pasar el cambio o raspas la caja!'],
      ['🚓', 'La policía', 'En la ruta te puede seguir la policía. Detente (multa de $20) o escapa: si te alcanzan son $75.'],
      ['👑', 'El Rey', `Gana ${KING_WINS} carreras y El Rey te aceptará un desafío un sábado en la noche. Si le ganas, eres el nuevo Rey de la calle.`]
    ],
    hud: { day: 'Día', wins: 'Victorias', king: 'El Rey', money: 'Dinero', rep: 'Fama' },
    garage: {
      title: 'Tu garaje', noCar: 'No tienes auto. Busca uno en el diario.',
      paper: 'Diario', shop: 'Taller', body: 'Pintura', gas: 'Bencinera', cars: 'Mis autos', diner: 'Ir al Drive-In', sleep: 'Dormir',
      paperSub: 'Autos y piezas', shopSub: 'Armar el motor', bodySub: 'Pintura y estilo', gasSub: '31¢ el galón', carsSub: 'Elegir o vender', dinerSub: 'Carreras de noche', sleepSub: 'Pasar al otro día',
      stats: { hp: 'Potencia', et: '¼ de milla', top: 'Vel. máx.', lb: 'Peso', value: 'Valor', fuel: 'Bencina' },
      cond: { engine: 'Motor', trans: 'Caja', tires: 'Neumáticos', body: 'Carrocería' },
      cantGo: 'Tu auto no está listo para salir', repair: 'Reparar', rebuild: c => `Reparar el motor (${money(c)})`, rebuildT: c => `Reparar la caja (${money(c)})`,
      fixBody: c => `Arreglar la carrocería (${money(c)})`,
      sleepAsk: '¿Dormir y saltarte el Drive-In de esta noche?'
    },
    probs: {
      'missing:engine': 'Falta el motor', 'missing:intake': 'Falta el múltiple de admisión', 'missing:carb': 'Faltan carburadores',
      'missing:exhaust': 'Falta el escape', 'missing:trans': 'Falta la caja de cambios', 'missing:axle': 'Falta el diferencial',
      'missing:tires': 'Faltan los neumáticos', loose: 'Hay pernos sueltos', wrecked: 'Está destrozado', fuel: 'No tiene bencina',
      blown: 'El motor está reventado', broken: 'La caja está rota'
    },
    paper: {
      name: 'La Gaceta de San Lucas', motto: 'El diario del valle desde 1921', price: '5¢',
      cars: 'AUTOS USADOS', parts: 'REPUESTOS USADOS', shop: 'SPEED SHOP «EL PISTÓN»', shopSub: 'Piezas nuevas con garantía',
      sell: 'VENDE LO TUYO', call: 'Llamar', buy: 'Comprar', sellBtn: 'Vender', only: 'Solo para mi auto', all: 'Todo',
      noRoom: 'Tu garaje está lleno (3 autos). Vende uno primero.', noMoney: 'No te alcanza el dinero.',
      bought: n => `¡Compraste ${n}!`, sold: (n, m) => `Vendiste ${n} por ${money(m)}.`,
      offer: m => `Te ofrecen ${money(m)}`, nothing: 'No tienes nada que vender.', fits: 'Calza en tu auto', nofit: 'No calza en tu auto',
      tel: 'Tel.', cond: 'Estado', good: ['como nuevo', 'buen estado', 'con detalles', 'para restaurar'],
      ad: (m, extra) => `${m}. ${extra}`, kept: 'Llévalo a tu garaje', active: 'En uso', loose: 'Pieza suelta',
      headlines: {
        win: (n, r) => `${n} le gana a ${r} en la recta del aeródromo`,
        lose: (n, r) => `${r} sigue invicto: ${n} no pudo con él`,
        king: n => `¡El Rey acepta el desafío de ${n}! Este sábado en el Lucky's`,
        rumor: 'Dicen que El Rey solo corre con los que han ganado varias carreras',
        police: 'La policía promete mano dura con las carreras en la ruta del cerro',
        weather: ['Ola de calor: 35 grados en el valle', 'Cielo despejado toda la semana', 'Noches tibias para ir al drive-in'],
        local: ['Abre un nuevo boliche en la calle 9', 'Los Halcones ganan el campeonato de béisbol juvenil', 'Récord de ventas de radios a transistores', 'El cine Paramount estrena película de playa', 'Feria de la naranja este fin de semana', 'Nueva autopista unirá San Lucas con Los Ángeles']
      }
    },
    parts: {
      engine: 'Motor', intake: 'Múltiple', carb: 'Carburador', cam: 'Árbol de levas', exhaust: 'Escape', trans: 'Caja', axle: 'Diferencial', tires: 'Neumáticos',
      kind: { 6: '6 cil.', F: 'Flathead V8', 8: 'V8' },
      intakeName: k => `Múltiple ${k === 'race' ? 'de carrera 2×4' : k.replace('x', '×')}`,
      carbName: k => (k === '2' ? 'Carburador de 2 bocas' : k === '4' ? 'Carburador de 4 bocas' : 'Carburador de carrera 4 bocas'),
      camName: k => (k === 'r34' ? 'Árbol de levas ¾ carrera' : 'Árbol de levas de carrera'),
      exhName: k => (k === 'hdr' ? 'Headers de competición' : 'Escape de fierro'),
      transType: { auto2: 'automática 2 vel.', auto3: 'automática 3 vel.', man3: 'manual 3 vel.', man4: 'manual 4 vel.', man4cr: 'manual 4 vel. cerrada' },
      axleName: k => `Diferencial ${k}`,
      tireName: { std: 'Neumáticos normales', ww: 'Neumáticos banda blanca', wide: 'Neumáticos anchos', slick: 'Slicks de picada' },
      fitsFor: 'Para', any: 'Cualquier auto', carbsNeed: (n, t) => `lleva ${n} carburador${n > 1 ? 'es' : ''} de ${t} bocas`,
      descs: {
        engine: 'Más cilindrada, más fuerza. Para cambiarlo saca primero el múltiple, el escape y el árbol.',
        intake: 'Decide cuántos carburadores lleva el motor. Más carburadores = más potencia.',
        carb: 'Los de carrera usan las mismas fijaciones que los de 4 bocas.',
        cam: 'Más potencia arriba, pero el motor tironea abajo.',
        exhaust: 'Los headers dejan respirar al motor.',
        trans: 'Las manuales son más rápidas, pero hay que pasar bien los cambios.',
        axle: 'Más alto = sale más rápido pero llega a menos velocidad máxima.',
        tires: 'Los slicks agarran mucho en la recta; los anchos sirven para todo.'
      }
    },
    shop: {
      title: 'Taller', bay: 'Bajo el capó', under: 'Bajo el auto', bench: 'Tu banco de trabajo', empty: 'No tienes piezas sueltas. Cómpralas en el diario.',
      help: 'Haz clic en una pieza del auto para soltar sus pernos y sacarla. Luego elige una pieza de tu banco para ponerla y aprieta sus pernos.',
      blocked: list => `Primero saca: ${list}`, wontFit: { family: 'No calza: es de otra marca', mount: 'No calza en este motor', noEngine: 'Primero pon un motor', noIntake: 'Primero pon un múltiple', carbType: 'Este múltiple lleva otro tipo de carburador', noRoom: 'Este múltiple no lleva más carburadores', occupied: 'Ese lugar está ocupado: saca la pieza vieja primero', blocked: 'Primero saca el múltiple', type: 'Esa pieza no va ahí' },
      tune: 'Afinar el encendido', tuneHelp: 'Más avance = más potencia… hasta que el motor empieza a cascabelear (y se gasta).',
      dyno: 'Dinamómetro', ready: '¡Listo para correr!', tighten: 'Aprieta los pernos', loosen: 'Suelta los pernos', sellPart: 'Vender',
      deg: '°', ping: '¡Cascabelea!'
    },
    body: {
      title: 'Pintura y estilo', paint: 'Pintura', paintCost: (p, c) => `${p} · ${money(c)}`,
      mods: { flames: 'Llamas', stripes: 'Franjas', pinstripe: 'Filetes a mano', nobump: 'Sacar parachoques', chop: 'Rebajar el techo', lowered: 'Rebajar la suspensión', scoop: 'Toma de aire' },
      modDesc: { flames: 'Clásicas llamas pintadas a mano', stripes: 'Dos franjas a lo largo', pinstripe: 'Firuletes finos en el capó y la maleta', nobump: '70 libras menos', chop: 'Menos resistencia al aire', lowered: 'Mejor en las curvas', scoop: 'Se ve bravo' },
      wheels: 'Llantas', wheelNames: { caps: 'Tapas de fábrica', moons: 'Tapas cromadas «luna»', mags: 'Llantas de magnesio' },
      done: 'Hecho', have: 'Ya lo tiene', remove: 'Quitar'
    },
    gas: { title: 'Bencinera', hold: 'Mantén apretado para cargar', full: 'Estanque lleno', gallons: 'galones', total: 'Total', pay: 'Pagar e irse', wash: 'Lavar el auto ($1)' },
    cars: { title: 'Mis autos', use: 'Usar este', using: 'En uso', sell: v => `Vender por ${money(v)}`, junk: v => `Chatarra por ${money(v)}`, last: 'Es tu único auto' },
    diner: {
      title: 'Lucky\'s Drive-In', arrives: 'Llega alguien…', closing: 'El drive-in está cerrando. ¡A casa!',
      challenge: 'Desafiar', pass: 'Dejarlo pasar', home: 'Volver a casa',
      type: 'Tipo de carrera', drag: 'Picada (¼ de milla)', road: 'Ruta del cerro', bet: 'Apuesta',
      kicks: 'Por diversión', pinks: 'Los papeles', record: (w, l) => `Contigo: ${w} ganadas, ${l} perdidas`,
      car: 'Maneja', go: '¡Vamos!', time: 'Hora',
      noCar: 'Tu auto no puede correr así.', broke: 'No tienes ese dinero.',
      lines: {
        hi: ['¿Qué miras, novato?', 'Lindo auto. ¿Corre o solo se ve bonito?', 'Hace rato que nadie me gana.', '¿Quieres probar?', 'Mi auto está que vuela esta noche.', '¿Tienes hora? Porque es hora de correr.'],
        yes: ['¡Trato hecho!', 'Vamos a la recta.', 'Prepárate para ver mis focos traseros.', '¡Esto va a ser fácil!'],
        noPinks: ['¿Mis papeles? Ni lo sueñes.', 'No arriesgo mi auto por ti.', 'Tráeme algo mejor y hablamos.'],
        noMoney: ['¿Tanta plata? Mejor no.', 'Mi papá me mata si pierdo eso.'],
        scared: ['Con ese auto… no, gracias.', 'Hoy no, mi motor anda raro.']
      },
      kingArrives: '¡Llegó El Rey!', kingLine: 'Me dicen que andas ganando carreras. Veamos si es verdad. Ruta del cerro, por los papeles.',
      kingNotYet: n => `Te faltan ${n} victorias para que El Rey te tome en serio.`,
      kingSat: 'El Rey solo aparece los sábados en la noche.'
    },
    race: {
      drag: 'PICADA', road: 'RUTA', kicks: 'Por diversión', pinks: 'POR LOS PAPELES',
      dragTitle: 'PICADA · CUARTO DE MILLA', dragPlace: 'La recta del viejo aeródromo', roadTitle: 'CARRERA DE RUTA', roadPlace: 'La ruta del cerro, hasta el estanque de agua',
      hintStage: '↑ sube las vueltas · ESPACIO suelta el embrague cuando BAJE la bandera', hintAuto: '↑ sube las vueltas · ESPACIO suelta el freno cuando BAJE la bandera',
      hintShift: 'Mira la luz roja del tacómetro: suelta ↑, toca ESPACIO, y vuelve a acelerar',
      hintCops: 'Frena hasta parar (multa $20) o escápate a más de 400 metros',
      go: '¡YA!', grind: '¡RASPASTE LA CAJA! Suelta el acelerador al cambiar', police: '¡LA POLICÍA!', lostCops: '¡Te escapaste de la policía!',
      dry: '¡Te quedaste sin bencina!', won: '¡GANASTE!', lost: 'PERDISTE', voided: 'CARRERA ANULADA', continue: 'ENTER para seguir',
      reasons: {
        finish: '', foul: 'Largaste antes de la bandera', rivalFoul: 'Tu rival largó antes de la bandera', rivalCrash: '¡Tu rival chocó!', crash: '¡Chocaste!', blown: 'Reventaste el motor', broken: 'Se rompió la caja de cambios',
        dry: 'Sin bencina', stopped: 'Te detuviste: multa de $20', caught: 'Te atrapó la policía: multa de $75'
      }
    },
    result: {
      title: 'Resultado', you: 'Tú', time: 'Tiempo', trap: 'Velocidad final', reaction: 'Reacción', bet: 'Apuesta',
      win: m => `Ganaste ${money(m)}`, lose: m => `Perdiste ${money(m)}`, kicks: 'Corrieron por diversión',
      wonCar: n => `¡Te quedas con el ${n}!`, lostCar: n => `Perdiste tu ${n}…`, autoSold: (n, m) => `No cabía en tu garaje: lo vendiste por ${money(m)}`,
      fine: m => `Multa: ${money(m)}`, jail: 'No pudiste pagar la multa: pasaste la noche en la comisaría y tus papás te castigaron 5 días.',
      engineHurt: 'El motor quedó resentido', transHurt: 'La caja quedó dañada', blown: 'El motor está reventado: necesitas otro', broken: 'La caja está rota: necesitas otra',
      crash: 'El auto quedó chocado', fix: c => `Arreglarlo (${money(c)})`, junk: v => `Venderlo como chatarra (${money(v)})`, noFix: 'Quedó tan mal que solo sirve como chatarra.',
      next: 'Seguir', back: 'Volver al drive-in'
    },
    end: {
      kingTitle: '¡ERES EL NUEVO REY DE LA CALLE!', kingText: n => `${n} le ganó a El Rey en la ruta del cerro y se quedó con su Corvette Sting Ray. Todo San Lucas habla de lo mismo.`,
      headline: n => `¡HAY NUEVO REY! ${n.toUpperCase()} DESTRONA AL CAMPEÓN`,
      summerOver: 'Se acabó el verano', summerText: 'Empezaron las clases y El Rey sigue siendo El Rey. Quizás el próximo verano…',
      broke: 'Sin auto y sin dinero', brokeText: 'Te quedaste sin auto y sin plata para comprar otro. El verano terminó antes de tiempo.',
      stats: (w, l, m) => `${w} carreras ganadas · ${l} perdidas · ${money(m)} en el bolsillo`,
      again: 'Jugar otro verano', keep: 'Seguir paseando'
    },
    toast: { saved: 'Partida guardada', music: on => (on ? '🎵 Música: sí' : '🔇 Música: no') },
    pause: { title: 'PAUSA', resume: 'Seguir', quit: 'Abandonar la carrera' }
  },
  en: {
    docTitle: 'Street Rod: Summer of 63', subtitle: 'Summer of \'63', langName: 'English',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    date: d => `${STR.en.days[d.getDay()]}, ${STR.en.months[d.getMonth()]} ${d.getDate()}`,
    shortDate: d => `${STR.en.months[d.getMonth()].slice(0, 3)} ${d.getDate()}`,
    menu: { cont: 'Continue the summer', fresh: 'New game', how: 'How to play', lang: '🌐 Español', more: '← More games', music: on => (on ? '🎵 Music: on' : '🔇 Music: off') },
    intro: [
      'It\'s June 1963 in San Lucas, California. School\'s out and you\'ve saved $750.',
      'Every night the hottest cars in town meet at Lucky\'s Drive-In. And the hottest of all belongs to The King.',
      'Buy a car from the paper, build it in your garage and beat everyone. You have until school starts on September 3rd.'
    ],
    license: 'DRIVER LICENSE', state: 'STATE OF CALIFORNIA', yourName: 'Your name', start: 'Start the summer!',
    defaultName: 'Johnny',
    how: [
      ['🗞️', 'The paper', 'Every morning brings used cars and parts. Engine and transmission parts only fit cars of the same make (GM, Ford or Chrysler).'],
      ['🔧', 'The garage', 'Open the hood and click the bolts to remove and install parts. The intake decides how many carburetors you need.'],
      ['🍔', 'The drive-in', 'At night the rivals show up. Pick a drag race (quarter mile) or a road race, and how much to bet. On the road you can race for pink slips.'],
      ['🏁', 'Driving', '↑ gas · ↓ brake · ← → steer · SPACE drops the clutch and shifts up · Z shifts down. Lift off the gas when you shift or you\'ll grind the gears!'],
      ['🚓', 'The police', 'On the road the cops may chase you. Pull over ($20 fine) or run: if they catch you it\'s $75.'],
      ['👑', 'The King', `Win ${KING_WINS} races and The King will accept a challenge on a Saturday night. Beat him and you\'re the new King of the street.`]
    ],
    hud: { day: 'Day', wins: 'Wins', king: 'The King', money: 'Cash', rep: 'Rep' },
    garage: {
      title: 'Your garage', noCar: 'You don\'t have a car. Find one in the paper.',
      paper: 'Paper', shop: 'Workshop', body: 'Paint', gas: 'Gas station', cars: 'My cars', diner: 'Go to the drive-in', sleep: 'Sleep',
      paperSub: 'Cars and parts', shopSub: 'Build the engine', bodySub: 'Paint and style', gasSub: '31¢ a gallon', carsSub: 'Pick or sell', dinerSub: 'Night races', sleepSub: 'Skip to tomorrow',
      stats: { hp: 'Power', et: '¼ mile', top: 'Top speed', lb: 'Weight', value: 'Value', fuel: 'Gas' },
      cond: { engine: 'Engine', trans: 'Gearbox', tires: 'Tires', body: 'Body' },
      cantGo: 'Your car isn\'t ready to go out', repair: 'Repair', rebuild: c => `Rebuild engine (${money(c)})`, rebuildT: c => `Rebuild gearbox (${money(c)})`,
      fixBody: c => `Fix the body (${money(c)})`,
      sleepAsk: 'Sleep and skip tonight\'s drive-in?'
    },
    probs: {
      'missing:engine': 'No engine', 'missing:intake': 'No intake manifold', 'missing:carb': 'Missing carburetors',
      'missing:exhaust': 'No exhaust', 'missing:trans': 'No transmission', 'missing:axle': 'No rear axle',
      'missing:tires': 'No tires', loose: 'There are loose bolts', wrecked: 'It\'s wrecked', fuel: 'Out of gas',
      blown: 'The engine is blown', broken: 'The gearbox is broken'
    },
    paper: {
      name: 'The San Lucas Gazette', motto: 'The valley\'s newspaper since 1921', price: '5¢',
      cars: 'USED CARS', parts: 'USED PARTS', shop: '«THE PISTON» SPEED SHOP', shopSub: 'New parts, guaranteed',
      sell: 'SELL YOUR STUFF', call: 'Call', buy: 'Buy', sellBtn: 'Sell', only: 'Only for my car', all: 'Everything',
      noRoom: 'Your garage is full (3 cars). Sell one first.', noMoney: 'You can\'t afford it.',
      bought: n => `You bought ${n}!`, sold: (n, m) => `You sold ${n} for ${money(m)}.`,
      offer: m => `They offer ${money(m)}`, nothing: 'You have nothing to sell.', fits: 'Fits your car', nofit: 'Doesn\'t fit your car',
      tel: 'Tel.', cond: 'Condition', good: ['like new', 'good shape', 'some wear', 'project car'],
      ad: (m, extra) => `${m}. ${extra}`, kept: 'Take it home', active: 'In use', loose: 'Loose part',
      headlines: {
        win: (n, r) => `${n} beats ${r} on the airfield straight`,
        lose: (n, r) => `${r} still unbeaten: ${n} couldn't keep up`,
        king: n => `The King accepts ${n}'s challenge! This Saturday at Lucky's`,
        rumor: 'Word is The King only races those who have won a few',
        police: 'Police promise a crackdown on racing on the hill road',
        weather: ['Heat wave: 95 degrees in the valley', 'Clear skies all week long', 'Warm nights for the drive-in'],
        local: ['New bowling alley opens on 9th Street', 'Hawks win the junior baseball title', 'Transistor radio sales hit a record', 'Paramount theater opens a new beach movie', 'Orange fair this weekend', 'New freeway will link San Lucas and Los Angeles']
      }
    },
    parts: {
      engine: 'Engine', intake: 'Intake', carb: 'Carburetor', cam: 'Camshaft', exhaust: 'Exhaust', trans: 'Gearbox', axle: 'Rear axle', tires: 'Tires',
      kind: { 6: 'Six', F: 'Flathead V8', 8: 'V8' },
      intakeName: k => (k === 'race' ? '2×4 racing intake' : `${k.replace('x', '×')} intake`),
      carbName: k => (k === '2' ? '2-barrel carburetor' : k === '4' ? '4-barrel carburetor' : 'Racing 4-barrel carburetor'),
      camName: k => (k === 'r34' ? '¾ race camshaft' : 'Full race camshaft'),
      exhName: k => (k === 'hdr' ? 'Racing headers' : 'Cast-iron exhaust'),
      transType: { auto2: '2-speed automatic', auto3: '3-speed automatic', man3: '3-speed manual', man4: '4-speed manual', man4cr: 'close-ratio 4-speed' },
      axleName: k => `${k} rear axle`,
      tireName: { std: 'Street tires', ww: 'Whitewall tires', wide: 'Wide tires', slick: 'Drag slicks' },
      fitsFor: 'For', any: 'Any car', carbsNeed: (n, t) => `takes ${n} ${t}-barrel carburetor${n > 1 ? 's' : ''}`,
      descs: {
        engine: 'More inches, more power. To swap it, remove the intake, exhaust and cam first.',
        intake: 'Decides how many carburetors the engine takes. More carbs = more power.',
        carb: 'Racing carbs use the same mounting as 4-barrels.',
        cam: 'More top-end power, but the engine stumbles down low.',
        exhaust: 'Headers let the engine breathe.',
        trans: 'Manuals are quicker, but you have to shift right.',
        axle: 'Higher = quicker launch but lower top speed.',
        tires: 'Slicks hook up on the strip; wide tires are good everywhere.'
      }
    },
    shop: {
      title: 'Workshop', bay: 'Under the hood', under: 'Under the car', bench: 'Your workbench', empty: 'No loose parts. Buy some in the paper.',
      help: 'Click a part on the car to loosen its bolts and pull it. Then pick a part from your bench to put it in and tighten its bolts.',
      blocked: list => `Remove first: ${list}`, wontFit: { family: 'Won\'t fit: it\'s another make', mount: 'Won\'t fit this engine', noEngine: 'Put an engine in first', noIntake: 'Put an intake in first', carbType: 'This intake takes another kind of carburetor', noRoom: 'This intake takes no more carburetors', occupied: 'That spot is taken: remove the old part first', blocked: 'Remove the intake first', type: 'That part doesn\'t go there' },
      tune: 'Ignition timing', tuneHelp: 'More advance = more power… until the engine starts to ping (and wears out).',
      dyno: 'Dyno', ready: 'Ready to race!', tighten: 'Tighten bolts', loosen: 'Loosen bolts', sellPart: 'Sell',
      deg: '°', ping: 'Pinging!'
    },
    body: {
      title: 'Paint and style', paint: 'Paint', paintCost: (p, c) => `${p} · ${money(c)}`,
      mods: { flames: 'Flames', stripes: 'Stripes', pinstripe: 'Pinstriping', nobump: 'Shave the bumpers', chop: 'Chop the top', lowered: 'Lower it', scoop: 'Hood scoop' },
      modDesc: { flames: 'Classic hand-painted flames', stripes: 'Two long side stripes', pinstripe: 'Fine scrolls on the hood and trunk', nobump: '70 pounds lighter', chop: 'Less drag', lowered: 'Better in the corners', scoop: 'Looks mean' },
      wheels: 'Wheels', wheelNames: { caps: 'Stock hubcaps', moons: 'Chrome moon discs', mags: 'Mag wheels' },
      done: 'Done', have: 'Already has it', remove: 'Remove'
    },
    gas: { title: 'Gas station', hold: 'Hold to pump', full: 'Tank full', gallons: 'gallons', total: 'Total', pay: 'Pay and go', wash: 'Wash the car ($1)' },
    cars: { title: 'My cars', use: 'Drive this one', using: 'In use', sell: v => `Sell for ${money(v)}`, junk: v => `Scrap for ${money(v)}`, last: 'It\'s your only car' },
    diner: {
      title: 'Lucky\'s Drive-In', arrives: 'Someone\'s pulling in…', closing: 'The drive-in is closing. Time to go home!',
      challenge: 'Challenge', pass: 'Let them go', home: 'Go home',
      type: 'Race type', drag: 'Drag race (¼ mile)', road: 'Hill road', bet: 'Bet',
      kicks: 'Just for kicks', pinks: 'Pink slips', record: (w, l) => `Against you: ${w} won, ${l} lost`,
      car: 'Drives', go: 'Let\'s go!', time: 'Time',
      noCar: 'Your car can\'t race like this.', broke: 'You don\'t have that money.',
      lines: {
        hi: ['What are you looking at, rookie?', 'Nice car. Does it run or just look pretty?', 'Nobody\'s beaten me in ages.', 'Wanna try?', 'My car is flying tonight.', 'Got the time? Because it\'s time to race.'],
        yes: ['You\'re on!', 'To the strip.', 'Get ready to see my taillights.', 'This\'ll be easy!'],
        noPinks: ['My pink slip? Dream on.', 'I\'m not risking my car for you.', 'Bring something better and we\'ll talk.'],
        noMoney: ['That much? I\'ll pass.', 'My dad would kill me if I lost that.'],
        scared: ['With that car… no thanks.', 'Not tonight, my engine\'s acting up.']
      },
      kingArrives: 'The King is here!', kingLine: 'I hear you\'ve been winning races. Let\'s see if it\'s true. The hill road, for pink slips.',
      kingNotYet: n => `You need ${n} more wins for The King to take you seriously.`,
      kingSat: 'The King only shows up on Saturday nights.'
    },
    race: {
      drag: 'DRAG', road: 'ROAD', kicks: 'Just for kicks', pinks: 'FOR PINK SLIPS',
      dragTitle: 'DRAG RACE · QUARTER MILE', dragPlace: 'The old airfield straight', roadTitle: 'ROAD RACE', roadPlace: 'The hill road, to the water tower',
      hintStage: '↑ revs the engine · SPACE drops the clutch when the flag comes DOWN', hintAuto: '↑ revs the engine · SPACE releases the brake when the flag comes DOWN',
      hintShift: 'Watch the tach\'s red light: lift ↑, tap SPACE, and floor it again',
      hintCops: 'Brake to a stop ($20 fine) or get 400 meters away',
      go: 'GO!', grind: 'YOU GROUND THE GEARS! Lift off the gas to shift', police: 'THE COPS!', lostCops: 'You lost the cops!',
      dry: 'You ran out of gas!', won: 'YOU WIN!', lost: 'YOU LOST', voided: 'RACE CALLED OFF', continue: 'ENTER to continue',
      reasons: {
        finish: '', foul: 'You jumped the flag', rivalFoul: 'Your rival jumped the flag', rivalCrash: 'Your rival crashed!', crash: 'You crashed!', blown: 'You blew the engine', broken: 'The gearbox broke',
        dry: 'Out of gas', stopped: 'You pulled over: $20 fine', caught: 'The cops caught you: $75 fine'
      }
    },
    result: {
      title: 'Result', you: 'You', time: 'Time', trap: 'Top speed', reaction: 'Reaction', bet: 'Bet',
      win: m => `You won ${money(m)}`, lose: m => `You lost ${money(m)}`, kicks: 'Raced just for kicks',
      wonCar: n => `The ${n} is yours!`, lostCar: n => `You lost your ${n}…`, autoSold: (n, m) => `No room in your garage: you sold it for ${money(m)}`,
      fine: m => `Fine: ${money(m)}`, jail: 'You couldn\'t pay the fine: you spent the night at the station and your folks grounded you for 5 days.',
      engineHurt: 'The engine took a beating', transHurt: 'The gearbox got damaged', blown: 'The engine is blown: you need another one', broken: 'The gearbox is broken: you need another one',
      crash: 'The car is wrecked', fix: c => `Fix it (${money(c)})`, junk: v => `Sell it for scrap (${money(v)})`, noFix: 'It\'s so bad it\'s only good for scrap.',
      next: 'Continue', back: 'Back to the drive-in'
    },
    end: {
      kingTitle: 'YOU\'RE THE NEW KING OF THE STREET!', kingText: n => `${n} beat The King on the hill road and drove off in his Corvette Sting Ray. All of San Lucas is talking about it.`,
      headline: n => `THERE'S A NEW KING! ${n.toUpperCase()} DETHRONES THE CHAMP`,
      summerOver: 'Summer\'s over', summerText: 'School started and The King is still The King. Maybe next summer…',
      broke: 'No car, no money', brokeText: 'You ended up with no car and no cash to buy another. Summer ended early.',
      stats: (w, l, m) => `${w} races won · ${l} lost · ${money(m)} in your pocket`,
      again: 'Play another summer', keep: 'Keep cruising'
    },
    toast: { saved: 'Game saved', music: on => (on ? '🎵 Music: on' : '🔇 Music: off') },
    pause: { title: 'PAUSED', resume: 'Resume', quit: 'Quit the race' }
  }
};
