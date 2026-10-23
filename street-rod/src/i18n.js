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
    docTitle: 'Street Rod: Verano del 63', subtitle: "VERANO DEL '63",
    ok: 'OK', yes: 'Sí', forget: 'Olvídalo', done: 'Listo', cancel: 'Cancelar', next: 'Sigue', none: 'nada', noThanks: 'No, gracias',
    months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    days: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    date: d => `${STR.es.days[d.getDay()]} ${d.getDate()} de ${STR.es.months[d.getMonth()]}`.replace(/^./, c => c.toUpperCase()),
    shortDate: d => `${d.getDate()} ${STR.es.months[d.getMonth()].slice(0, 3)} 1963`,
    clock: min => clockText(min),
    bankroll: m => `Dinero: ${m}`,
    langSwitch: 'English',
    musicLabel: on => (on ? 'Música: sí' : 'Música: no'),
    musicToggled: on => (on ? 'Música encendida' : 'Música apagada'),
    cruising: 'Paseando por el pueblo...', goingHome: 'De vuelta a casa...',
    buyerOffer: m => `Un comprador pregunta: ¿me lo dejas en ${m}?`,
    noMoreBuyers: 'No hay más compradores por hoy.',
    cond: c => (c >= 0.9 ? 'como nuevo' : c >= 0.7 ? 'bueno' : c >= 0.5 ? 'regular' : c >= 0.25 ? 'malo' : 'hecho pedazos'),
    slot: { engine: 'Motor', intake: 'Múltiple', carb: 'Carburador', trans: 'Caja', tires: 'Neumáticos' },
    parts: {
      six: '6 cil.', four: '4 cil.',
      engine: (F, kind, ci) => `${F}${kind} ${ci} pulg³`,
      intake: (F, k) => `Múltiple ${F}${STR.es.parts.intakeShort[k]}`,
      intakeShort: { '1x2': '2 bocas', '3x2': '3 × 2 bocas', '1x4': '4 bocas', '2x4': '2 × 4 bocas', race: 'de carrera' },
      carb: { '2': 'Carburador de 2 bocas', '4': 'Carburador de 4 bocas', '4R': 'Carburador de carrera' },
      carbShort: { '2': '2 bocas', '4': '4 bocas', '4R': 'carrera' },
      trans: { auto: F => `Caja automática ${F}`, man3: F => `Caja de 3 cambios ${F}`, man4: F => `Caja de 4 cambios ${F}`, man4u: () => 'Caja de 4 universal', race4: F => `Caja de carrera ${F}` },
      transShort: { auto: 'automático', man3: '3 cambios', man4: '4 cambios', man4u: '4 cambios', race4: 'caja de carrera' },
      tires: { std: 'Neumáticos normales', ww: 'Neumáticos banda blanca', slick: 'Neumáticos de carrera' },
      tiresShort: { std: 'normales', ww: 'banda blanca', slick: 'de carrera' }
    },
    problem: (p, car) => ({
      'missing:engine': 'no tiene motor', 'missing:intake': 'no tiene múltiple', 'missing:carb': 'faltan carburadores',
      'missing:trans': 'no tiene caja', 'missing:tires': 'no tiene neumáticos', loose: 'hay pernos sueltos',
      blown: 'el motor está reventado', broken: 'la caja está rota', wrecked: 'está destrozado', fuel: 'no tiene bencina'
    }[p] || p),
    why: {
      type: 'Esa pieza no va aquí.', occupied: 'Ya hay una pieza puesta. Sácala primero.', family: 'Esa pieza es de otra marca: no calza.',
      noEngine: 'Primero hay que poner un motor.', kind: 'Ese múltiple no sirve para este motor.', noIntake: 'Primero hay que poner el múltiple.',
      noRoom: 'Ya no caben más carburadores en este múltiple.', carbType: 'Ese carburador no calza en este múltiple.', gone: 'Ya no está.'
    },
    intro: [
      ['Verano de 1963. Terminaron las clases y tienes $750 en el bolsillo.', '', 'Cada noche los mejores autos del valle se juntan en Bob\'s Drive-In. El más rápido de todos es el Corvette negro de El Rey.'],
      ['Busca un auto en el diario, ármalo en tu garaje y gánales a todos.', '', 'Cuando hayas ganado 6 picadas con apuesta y 6 carreras de ruta, El Rey vendrá a buscarte. Tienes hasta el 3 de septiembre.']
    ],
    how: [
      ['EL GARAJE', '', 'Todo se hace con el mouse. Pasa el mouse por el garaje: abajo dice qué es cada cosa.', '', 'El diario trae autos usados y repuestos. El capó abre el motor; abajo del auto está la caja; la rueda trasera, los neumáticos. Las latas de pintura son para pintar y arreglar el auto, el estante guarda tus repuestos y el portón sale a la calle.'],
      ['EL MOTOR', '', 'Con la llave sacas los pernos uno por uno. Sin pernos, la pieza sale y queda en el estante. Para poner una pieza: PIEZAS, elígela y aprieta sus pernos.', '', 'Las piezas de motor y caja son de una marca (GM, Ford o Chrysler) y solo calzan en esa marca. El múltiple decide cuántos carburadores lleva. AFINAR deja el encendido justo en el 0: se corre un poco después de cada carrera.'],
      ['LAS CARRERAS', '', 'Mantén ↑ para acelerar y suelta el embrague con ESPACIO cuando el semáforo se ponga verde. ESPACIO sube un cambio y Z lo baja: suelta el acelerador al pasar el cambio o raspas la caja.', '', '← → para doblar y ↓ para frenar. Si la policía te sigue, detente (multa de $20) o escápate; si te alcanzan son $75.'],
      ['BOB\'S DRIVE-IN', '', 'Haz clic en el auto del rival para desafiarlo: picada o carrera de ruta, y cuánto apostar. En la ruta puedes apostar los papeles del auto.', '', 'El tipo del poste llama a quien quieras. Antes de apostar, mira bajo el capó del rival. M: música · F: pantalla completa · Esc: pausa.'],
      ['CRÉDITOS', '', 'Basado en Street Rod (1989), de California Dreams. Hecho para Mundo Arcade.', '', 'Los autos salen de modelos 3D de Sketchfab con licencia CC BY 4.0, de Nieve5677, hans1240, Libau Media, TomasLA, everhard, Free Vehicle Archive, Nathaniel Onandia y Kryox Shade. ¡Gracias!']
    ],
    title: { cont: 'Seguir el verano', fresh: 'Nueva partida', how: 'Cómo se juega', fame: 'Reyes de la calle', more: '← Más juegos', credit: 'Basado en Street Rod (1989) · Mundo Arcade' },
    license: { state: 'ESTADO DE CALIFORNIA', dmv: 'DEPARTAMENTO DE VEHÍCULOS MOTORIZADOS', title: 'LICENCIA DE CONDUCIR', name: 'NOMBRE', typeName: 'Escribe tu nombre', born: 'NACIMIENTO', city: 'CIUDAD', cls: 'CLASE', clsValue: '3 · AUTOS', expires: 'VENCE', photo: 'Clic para cambiar la foto' },
    fame: { title: 'REYES DE LA CALLE', empty: 'Todavía nadie le ha ganado al Rey.', hours: h => `${h} horas` },
    chp: { title: 'POLICÍA DE CAMINOS', saved: n => `El expediente de ${n} quedó guardado.`, load: 'Cargar', loaded: n => `Bienvenido de vuelta, ${n}.`, empty: 'No hay expedientes guardados.' },
    g: {
      hot: { engine: 'Motor', trans: 'Caja de cambios', tires: 'Neumáticos', car: 'Tu auto', paper: 'El diario', spares: 'Repuestos', paint: 'Pintura y carrocería', clock: 'Reloj', calendar: 'Calendario', keys: 'Tus autos', door: 'Salir' },
      noCar: 'No tienes auto. Busca uno en el diario.', startTip: 'Mira el diario sobre el banco: ahí venden autos.',
      body: 'Carrocería', bodyFuel: (c, f, t) => `Carrocería: ${c} · Bencina: ${f} de ${t} galones`, weight: lb => `Peso: ${lb} libras`, problems: 'No anda:',
      sparesTitle: 'Repuestos', noSpares: 'No tienes repuestos.', sellIt: 'Venderlo', sold: m => `Vendido en ${m}.`,
      fits: f => (f === 'all' ? 'Calza en todos los autos' : `Solo para autos ${FAM_NAME[f]}`),
      carsTitle: 'Tus autos', noCars: 'No tienes autos.', drive: 'Usar este', junk: 'Chatarra', junkAsk: m => `¿Lo mandas a la chatarra por ${m}?`, runs: 'Listo para salir',
      daysLeft: n => `Quedan ${n} días de verano.`, record: (d, dn, r, rn) => `Picadas con apuesta: ${d} de ${dn} · Rutas: ${r} de ${rn}`, record2: (k, l) => `Por puro gusto: ${k} · Derrotas: ${l}`,
      kingHint: 'Dicen que El Rey solo corre con los que ya les ganaron a todos.', kingReady: '¡El Rey te anda buscando en Bob\'s!',
      save: 'Guardar partida', load: 'Cargar partida', sleep: 'Dormir hasta mañana', quit: 'Salir a la portada',
      sleepAsk: '¿Dormir y saltarte Bob\'s esta noche?', newDay: '¡Buenos días! Llegó el diario.',
      whereTo: '¿Adónde vas?', toBobs: 'Bob\'s Drive-In', toGus: 'Bencinera de Gus', wontStart: 'El auto no anda:', needGas: 'No te alcanza la bencina. Pasa donde Gus primero.',
      pushing: 'Empujando el auto donde Gus...'
    },
    paper: {
      name: 'DIARIO DEL VALLE', price: '10 centavos', usedCars: 'AUTOS USADOS', autoParts: 'REPUESTOS', front: 'Portada', close: 'Cerrar',
      ads: n => `${n} avisos hoy`, partsSub: 'Nuevos y usados', talk: 'CHISMES',
      headlines: ['OLA DE CALOR EN EL VALLE', 'ABRE LA NUEVA AUTOPISTA', 'LOS BEACH BOYS LLENAN EL AUDITORIO', 'EL PRECIO DE LA BENCINA NO SUBE', 'POLICÍA CONTRA LAS PICADAS', 'TORMENTA DE VERANO SORPRENDE AL PUEBLO', 'SE ESTRENA "LOS PÁJAROS" EN EL AUTOCINE', 'RÉCORD DE VENTAS DE CORVETTE'],
      tips: [
        'Dicen que El Rey solo acepta a los que ganaron 6 picadas con apuesta y 6 carreras de ruta.',
        'Un mecánico jura que un motor bien afinado gana medio segundo. La lámpara de tiempo no miente.',
        'Ojo con la caja: el que pasa los cambios a fondo termina raspándola, y una caja rota no anda.',
        'Los neumáticos de carrera agarran mucho más en la partida, pero en las curvas no hacen milagros.',
        'Un múltiple de 2 × 4 bocas despierta a cualquier V-8. Eso sí: necesita dos carburadores.',
        'Sacarle los parachoques a un auto lo aliviana, pero en un choque lo pagas caro.',
        'Gus cobra el doble si te llena el estanque él. Con la bomba tú mismo sale más barato.',
        'El tipo del poste de Bob\'s conoce a todos: pídele que llame a quien quieras correr.',
        'Antes de apostar, mira bajo el capó del rival. Así sabes con qué viene.',
        'Correr de noche por la ruta es peligroso: hay tráfico y a veces aparece la policía.'
      ],
      adLine: (kind, ci, tr) => `${kind} ${ci}, ${tr}.`,
      words: ['Buen precio.', 'Urgente.', 'Único dueño.', 'Lo vendo por viaje.', 'Llamar de noche.', 'Ver para creer.'],
      cond: car => {
        const c = Math.min(car.body, car.p.engine.c);
        return c >= 0.85 ? 'Impecable.' : c >= 0.65 ? 'Anda bien.' : c >= 0.5 ? 'Necesita cariño.' : 'Para arreglar.';
      },
      soldStamp: 'VENDIDO', soldShort: 'vendido',
      cat: { engine: 'Motores', intake: 'Múltiples', carb: 'Carburadores', trans: 'Cajas', tires: 'Neumáticos', used: 'Usados' },
      forKind: I => (I.k[6] && I.k[8] ? 'para 6 cil. y V-8' : I.k[6] ? 'para 6 cilindros' : 'para V-8') + ` · ${I.n} carb.`,
      buy: m => `Comprar ${m}`, buyAsk: (n, m) => `¿Comprar ${n} por ${m}?`, bought: 'Lo compraste: quedó en el estante de repuestos.',
      seeIt: 'Verlo', yeah: 'Comprarlo', yours: '¡Es tuyo!', noMoney: 'No te alcanza la plata.', noRoom: n => `Ya tienes ${n} autos: vende uno primero.`
    },
    seller: {
      hello: 'Es una joya. ¿Lo quieres?', asking: m => `Pide ${m}`, offer: 'Ofrecer menos', offerTitle: '¿Cuánto le ofreces?', offerBtn: 'Ofrecer',
      deal: '¡Trato hecho!', noWay: m => `Ni hablar, chico. Son ${m}.`
    },
    paint: {
      colors: m => `PINTURA ${m}`, stickers: 'CALCOMANÍAS',
      sticker: { hotrod: 'Hot Rod', flames: 'Llamas', star: 'Estrella', checker: 'Cuadros', number: 'Número', lightning: 'Rayo' },
      paintAsk: (c, m) => `¿Pintarlo ${c} por ${m}?`, stickAsk: (s, m) => `¿Poner la calcomanía ${s} por ${m}?`,
      strip: m => `Alivianar ${m}`, stripAsk: '¿Alivianar el auto? Se sacan el asiento trasero, la rueda de repuesto y los adornos: 90 libras menos.',
      fix: m => `Arreglar choque ${m}`, fixAsk: m => `¿Arreglar la carrocería por ${m}?`, unstick: 'Quitar calcomanías'
    },
    mech: {
      tune: 'AFINAR', parts: 'PIEZAS', select: 'ELEGIR', loosen: 'sacar perno', tighten: 'poner perno', install: 'Ponerla',
      blocked: p => `Primero saca: ${p.toLowerCase()}.`, removed: n => `Pieza sacada: ${n}. Quedó en el estante.`, tight: 'Pieza apretada.', boltIt: 'Ahora aprieta sus pernos.',
      noneFit: 'No tienes repuestos de este tipo.', engineParts: 'Piezas de motor', transParts: 'Cajas de cambios', tireParts: 'Neumáticos',
      rivalHood: 'BAJO EL CAPÓ DEL RIVAL', tuneHelp: 'Deja la marca blanca en el 0', tuned: '¡Afinado!'
    },
    gas: {
      hello: '¿Qué va a ser, chico?', tank: (f, t) => `Bencina: ${f} / ${t}`, fill: m => `¡Llénelo, Gus! (${m})`, self: 'Bomba yo mismo (mantén)', pumping: 'Echando bencina...',
      leave: 'Irse', full: '¡Ya está lleno, rápido!', broke: 'Se te acabó la plata, chico.', noMoney: 'Sin plata no hay bencina. ¡Fuera de mi vista, chico!',
      thanks: m => `Son ${m}. ¡Gracias, chico!`
    },
    diner: {
      goHome: 'Irse a casa', postGuy: 'El tipo del poste', challenge: n => `Desafiar a ${n}`, drag: 'Picada', road: 'Carrera de ruta', hood: 'Mirar el motor',
      kicks: 'Por puro gusto', pinks: 'Los papeles', lookingFor: '¿A quién buscas?', call: 'Llamarlo', nobody: 'No queda nadie más por hoy.', calling: n => `¡Eh, ${n}! Te buscan.`,
      hello: ['¿Qué miras?', '¿Te atreves con mi auto?', 'Linda noche para correr.', '¿Buscas pelea?', 'Este auto vuela, amigo.'],
      yes: ['¡Hagámoslo!', '¡Trato hecho!', 'Vamos, te espero en la calle.', '¡Te voy a dejar atrás!'],
      refuse: { broke: 'No tienes esa plata, chico.', noPinks: '¿Tu cacharro por mi auto? Ni lo sueñes.', noMoney: 'No apuesto tanto contigo.', scared: 'Nah, hoy no tengo ganas.' },
      bye: 'Nos vemos.', closing: 'Bob\'s está cerrando. ¡Hasta mañana!', youBroke: 'No tienes esa plata.', homeAsk: '¿Irte a casa? Mañana llega el diario.',
      kingHello: 'Así que tú eres el que anda ganándoles a todos.', kingOnlyPinks: 'Yo solo corro en la ruta, y por los papeles.', kingYes: 'Muy bien. Veamos qué tienes.'
    },
    race: {
      gear: g => `Cambio: ${g}`, ready: '¡Prepárate!', dragName: 'Picada', roadName: 'Carrera de ruta',
      help: 'Mantén ↑ para acelerar · ESPACIO suelta el embrague con la luz verde y sube cambio · Z baja cambio · ← → doblar · ↓ frenar',
      helpAuto: 'Mantén ↑ para acelerar · ESPACIO suelta el freno con la luz verde · ← → doblar · ↓ frenar',
      go: '¡YA!', grind: '¡Raspaste la caja! Suelta el acelerador al pasar el cambio', police: '¡La policía! Detente o escápate', lostCops: 'Perdiste a la policía', dry: 'Te quedaste sin bencina',
      won: '¡GANASTE!', lost: 'PERDISTE', voided: 'CARRERA ANULADA',
      paused: 'PAUSA', resume: 'Seguir', giveUp: 'Rendirse',
      keys1: '↑ acelerar · ↓ frenar · ← → doblar', keys2: 'ESPACIO sube cambio · Z baja cambio',
      winTime: (t, mph) => `Tu tiempo ganador: ${t} seg., promedio ${mph} mph. ¡Felicitaciones!`,
      loseTime: (n, t, me) => `${n} hizo ${t} seg. Tú, ${me} seg.`,
      wonMoney: m => `Ganaste ${m}.`, wonPinks: c => `¡El ${c} ahora es tuyo!`, congrats: 'Buena carrera.',
      lostMoney: m => `Perdiste ${m}.`, lostPinks: 'Perdiste los papeles: tu auto se va con él.', better: 'Mejor suerte la próxima.',
      fine: m => `Multa por exceso de velocidad: ${m}.`,
      reasons: {
        foul: () => 'Saliste antes de la luz verde: pierdes.', rivalFoul: n => `${n} salió antes de la luz verde: ¡ganas!`,
        crash: () => '¡Chocaste!', rivalCrash: n => `${n} chocó: ¡ganas!`, blown: () => '¡Reventaste el motor!', broken: () => '¡Se rompió la caja!',
        dry: () => 'Te quedaste sin bencina.', giveUp: () => 'Te rendiste.', stopped: () => 'Te detuviste y la policía te multó.', caught: () => '¡La policía te alcanzó!'
      },
      rivalWins: ['¡Come mi polvo!', 'Mejor suerte la próxima, perdedor.', '¿Eso es todo lo que tienes?'],
      rivalLoses: ['Buena carrera, chico.', 'Suerte de principiante.', 'La próxima no te va tan bien.'],
      kingWins: 'Vuelve cuando seas grande, chico.', kingLoses: 'Nadie me había ganado... Las llaves son tuyas.'
    },
    ticket: {
      state: 'POLICÍA DE CAMINOS', title: 'ESTADO DE CALIFORNIA · CITACIÓN', name: 'CONDUCTOR', vehicle: 'VEHÍCULO', date: 'FECHA', violation: 'INFRACCIÓN', speeding: 'Exceso de velocidad',
      fine: 'MULTA', signHere: 'FIRME AQUÍ', clickSign: 'Clic para firmar', paid: 'Multa pagada.', cantPay: 'No tienes cómo pagar...'
    },
    end: {
      kingTitle: '¡EL NUEVO REY!',
      king: ['Le ganaste a El Rey en su propia ruta. Su Corvette negro es tuyo y desde esta noche todos en Bob\'s saben tu nombre.',
        'Le ganaste a El Rey.', '', 'Durante años se hablará de la noche en que un chico de garaje dejó atrás al Corvette negro.', '', 'Tu nombre queda en el muro de los Reyes de la calle.'],
      summer: ['Se acabó el verano.', '', 'Mañana empiezan las clases y El Rey sigue siendo El Rey.', '', 'Quizás el próximo verano...'],
      broke: ['Te quedaste sin auto y sin plata.', '', 'Pasarás el resto del verano a pie, mirando las carreras desde la vereda de Bob\'s.'],
      jail: ['No tenías con qué pagar la multa.', '', 'La policía llamó a tus papás y quedaste castigado el resto del verano. Adiós, carreras.'],
      stats: (w, l, m, d) => `Victorias: ${w} · Derrotas: ${l} · Plata: ${m} · Días: ${d}`
    }
  },

  en: {
    docTitle: 'Street Rod: Summer of 63', subtitle: "SUMMER OF '63",
    ok: 'OK', yes: 'Yeah', forget: 'Forget it', done: 'Done', cancel: 'Cancel', next: 'Next', none: 'none', noThanks: 'No thanks',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    date: d => `${STR.en.days[d.getDay()]}, ${STR.en.months[d.getMonth()]} ${d.getDate()}`,
    shortDate: d => `${STR.en.months[d.getMonth()].slice(0, 3)} ${d.getDate()}, 1963`,
    clock: min => { const h = (20 + Math.floor(min / 60)) % 24, m = String(min % 60).padStart(2, '0'); return `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`; },
    bankroll: m => `Bankroll: ${m}`,
    langSwitch: 'Español',
    musicLabel: on => (on ? 'Music: on' : 'Music: off'),
    musicToggled: on => (on ? 'Music on' : 'Music off'),
    cruising: 'Cruising in town...', goingHome: 'Heading home...',
    buyerOffer: m => `A buyer asks: will you take ${m}?`,
    noMoreBuyers: 'No more buyers today.',
    cond: c => (c >= 0.9 ? 'like new' : c >= 0.7 ? 'good' : c >= 0.5 ? 'fair' : c >= 0.25 ? 'poor' : 'shot'),
    slot: { engine: 'Engine', intake: 'Intake', carb: 'Carburetor', trans: 'Transmission', tires: 'Tires' },
    parts: {
      six: '6-cyl.', four: '4-cyl.',
      engine: (F, kind, ci) => `${F}${kind}, ${ci} cu.in.`,
      intake: (F, k) => `${F}${STR.en.parts.intakeShort[k]} intake`,
      intakeShort: { '1x2': '2-barrel', '3x2': '3 × 2-barrel', '1x4': '4-barrel', '2x4': '2 × 4-barrel', race: 'racing' },
      carb: { '2': '2-barrel carburetor', '4': '4-barrel carburetor', '4R': 'Racing carburetor' },
      carbShort: { '2': '2-bbl', '4': '4-bbl', '4R': 'racing' },
      trans: { auto: F => `${F} automatic`, man3: F => `${F} 3-speed`, man4: F => `${F} 4-speed`, man4u: () => 'Universal 4-speed', race4: F => `${F} racing 4-speed` },
      transShort: { auto: 'automatic', man3: '3-speed', man4: '4-speed', man4u: '4-speed', race4: 'racing 4-speed' },
      tires: { std: 'Standard tires', ww: 'Whitewall tires', slick: 'Racing slicks' },
      tiresShort: { std: 'standard', ww: 'whitewalls', slick: 'racing slicks' }
    },
    problem: (p, car) => ({
      'missing:engine': 'no engine', 'missing:intake': 'no intake', 'missing:carb': 'missing carburetors',
      'missing:trans': 'no transmission', 'missing:tires': 'no tires', loose: 'loose bolts',
      blown: 'blown engine', broken: 'broken transmission', wrecked: 'wrecked', fuel: 'out of gas'
    }[p] || p),
    why: {
      type: "That part doesn't go here.", occupied: 'There is a part there already. Take it out first.', family: "That part is for another make: it won't fit.",
      noEngine: 'Put an engine in first.', kind: "That intake doesn't fit this engine.", noIntake: 'Put an intake on first.',
      noRoom: 'No more room for carburetors on this intake.', carbType: "That carburetor doesn't fit this intake.", gone: "It's gone."
    },
    intro: [
      ["Summer of 1963. School's out and you've got $750 in your pocket.", '', "Every night the hottest cars in the valley meet at Bob's Drive-In. The fastest of them all is the King's black Corvette."],
      ['Find a car in the paper, build it in your garage and beat everybody.', '', "Win 6 drag races for money and 6 road races and the King will come looking for you. You've got until September 3."]
    ],
    how: [
      ['THE GARAGE', '', 'Everything is done with the mouse. Move it around the garage: the bar at the bottom says what each thing is.', '', 'The paper has used cars and parts. The hood opens the engine; under the car is the transmission; the rear wheel, the tires. The paint cans paint and fix the car, the shelf holds your spare parts and the door goes out to the street.'],
      ['THE ENGINE', '', 'Click bolts with the wrench to take them out one by one. With no bolts left, the part comes out and goes on the shelf. To put a part in: PARTS, pick it and tighten its bolts.', '', 'Engine and transmission parts belong to a make (GM, Ford or Chrysler) and only fit that make. The intake decides how many carburetors it takes. TUNE puts the timing right on 0: it drifts a little after every race.'],
      ['RACING', '', 'Hold ↑ to rev and drop the clutch with SPACE when the light turns green. SPACE shifts up and Z shifts down: lift off the gas when you shift or you will grind the gears.', '', '← → steer and ↓ brakes. If the police chase you, pull over ($20 fine) or lose them; if they catch you it is $75.'],
      ["BOB'S DRIVE-IN", '', "Click the rival's car to challenge him: drag or road race, and how much to bet. On the road you can race for pink slips.", '', 'The guy on the post calls anyone you want. Before you bet, look under the hood. M: music · F: full screen · Esc: pause.'],
      ['CREDITS', '', 'Based on Street Rod (1989) by California Dreams. Made for Mundo Arcade.', '', 'The cars come from 3D models on Sketchfab under the CC BY 4.0 license, by Nieve5677, hans1240, Libau Media, TomasLA, everhard, Free Vehicle Archive, Nathaniel Onandia and Kryox Shade. Thank you!']
    ],
    title: { cont: 'Continue summer', fresh: 'New game', how: 'How to play', fame: 'King Street Rodders', more: '← More games', credit: 'Based on Street Rod (1989) · Mundo Arcade' },
    license: { state: 'STATE OF CALIFORNIA', dmv: 'DEPARTMENT OF MOTOR VEHICLES', title: "OPERATOR'S LICENSE", name: 'NAME', typeName: 'Type your name', born: 'BIRTH DATE', city: 'CITY', cls: 'CLASS', clsValue: '3 · CARS', expires: 'EXPIRES', photo: 'Click to change the photo' },
    fame: { title: 'KING STREET RODDERS', empty: 'Nobody has beaten the King yet.', hours: h => `${h} hours` },
    chp: { title: 'CALIFORNIA HIGHWAY PATROL', saved: n => `${n}'s record is on file.`, load: 'Load', loaded: n => `Welcome back, ${n}.`, empty: 'No records on file.' },
    g: {
      hot: { engine: 'Engine', trans: 'Transmission', tires: 'Tires', car: 'Your car', paper: 'Newspaper', spares: 'Spare parts', paint: 'Paint & body', clock: 'Clock', calendar: 'Calendar', keys: 'Your cars', door: 'Go out' },
      noCar: "You don't have a car. Check the newspaper.", startTip: 'Check the newspaper on the bench: cars for sale.',
      body: 'Body', bodyFuel: (c, f, t) => `Body: ${c} · Gas: ${f} of ${t} gallons`, weight: lb => `Weight: ${lb} lbs`, problems: "Won't run:",
      sparesTitle: 'Spare parts', noSpares: 'No spare parts.', sellIt: 'Sell it', sold: m => `Sold for ${m}.`,
      fits: f => (f === 'all' ? 'Fits every car' : `${FAM_NAME[f]} cars only`),
      carsTitle: 'Your cars', noCars: 'No cars.', drive: 'Use this one', junk: 'Junk it', junkAsk: m => `Junk it for ${m}?`, runs: 'Ready to roll',
      daysLeft: n => `${n} days of summer left.`, record: (d, dn, r, rn) => `Drags for money: ${d} of ${dn} · Road races: ${r} of ${rn}`, record2: (k, l) => `Just for kicks: ${k} · Losses: ${l}`,
      kingHint: 'They say the King only races guys who already beat everybody.', kingReady: "The King is looking for you at Bob's!",
      save: 'Save game', load: 'Load game', sleep: 'Sleep till tomorrow', quit: 'Quit to title',
      sleepAsk: "Sleep and skip Bob's tonight?", newDay: 'Good morning! The paper is here.',
      whereTo: 'Where to?', toBobs: "Bob's Drive-In", toGus: "Gus' Gas", wontStart: "The car won't run:", needGas: "Not enough gas. Go to Gus' first.",
      pushing: "Pushing the car to Gus'..."
    },
    paper: {
      name: 'THE VALLEY NEWS', price: 'Ten cents', usedCars: 'USED CARS', autoParts: 'AUTO PARTS', front: 'Front page', close: 'Close',
      ads: n => `${n} ads today`, partsSub: 'New and used', talk: 'STREET TALK',
      headlines: ['HEAT WAVE HITS THE VALLEY', 'NEW FREEWAY OPENS', 'BEACH BOYS PACK THE AUDITORIUM', 'GAS PRICES HOLD STEADY', 'POLICE CRACK DOWN ON STREET RACING', 'SUMMER STORM SURPRISES TOWN', '"THE BIRDS" OPENS AT THE DRIVE-IN', 'CORVETTE SALES BREAK RECORD'],
      tips: [
        'Word is the King only races guys who won 6 drags for money and 6 road races.',
        'A mechanic swears a well-tuned engine is worth half a second. The timing light never lies.',
        'Easy on the gearbox: shift at full throttle and you grind it, and a broken transmission goes nowhere.',
        'Racing slicks grip much better off the line, but they are no miracle in the curves.',
        'A 2 × 4-barrel intake wakes up any V-8. It needs two carburetors, though.',
        'Pulling the bumpers makes a car lighter, but a crash costs more.',
        "Gus charges double to fill the tank himself. Pumping it yourself is cheaper.",
        "The guy on the post at Bob's knows everybody: ask him to call whoever you want to race.",
        "Before you bet, look under your rival's hood. Then you know what you're up against.",
        'Road racing at night is dangerous: there is traffic and sometimes the police show up.'
      ],
      adLine: (kind, ci, tr) => `${kind} ${ci}, ${tr}.`,
      words: ['Good price.', 'Must sell.', 'One owner.', 'Moving, must go.', 'Call evenings.', 'See to believe.'],
      cond: car => {
        const c = Math.min(car.body, car.p.engine.c);
        return c >= 0.85 ? 'Mint.' : c >= 0.65 ? 'Runs good.' : c >= 0.5 ? 'Needs love.' : 'Fixer-upper.';
      },
      soldStamp: 'SOLD', soldShort: 'sold',
      cat: { engine: 'Engines', intake: 'Intakes', carb: 'Carburetors', trans: 'Transmissions', tires: 'Tires', used: 'Used parts' },
      forKind: I => (I.k[6] && I.k[8] ? 'for 6-cyl. and V-8' : I.k[6] ? 'for 6-cylinder' : 'for V-8') + ` · ${I.n} carb.`,
      buy: m => `Buy ${m}`, buyAsk: (n, m) => `Buy the ${n} for ${m}?`, bought: 'Bought it: it is on the spare parts shelf.',
      seeIt: 'See it', yeah: 'Buy it', yours: "It's yours!", noMoney: "You can't afford it.", noRoom: n => `You already have ${n} cars: sell one first.`
    },
    seller: {
      hello: "She's a beauty. Want her?", asking: m => `Asking ${m}`, offer: 'Offer less', offerTitle: 'How much do you offer?', offerBtn: 'Offer',
      deal: "It's a deal!", noWay: m => `No way, kid. It's ${m}.`
    },
    paint: {
      colors: m => `PAINT ${m}`, stickers: 'DECALS',
      sticker: { hotrod: 'Hot Rod', flames: 'Flames', star: 'Star', checker: 'Checkers', number: 'Number', lightning: 'Lightning' },
      paintAsk: (c, m) => `Paint it ${c} for ${m}?`, stickAsk: (s, m) => `Put on the ${s} decal for ${m}?`,
      strip: m => `Lighten up ${m}`, stripAsk: 'Lighten the car? Out go the back seat, the spare tire and the trim: 90 pounds less.',
      fix: m => `Fix body ${m}`, fixAsk: m => `Fix the body for ${m}?`, unstick: 'Strip decals'
    },
    mech: {
      tune: 'TUNE', parts: 'PARTS', select: 'SELECT', loosen: 'remove bolt', tighten: 'put bolt in', install: 'Put it in',
      blocked: p => `Take out the ${p.toLowerCase()} first.`, removed: n => `Took out: ${n}. It's on the shelf.`, tight: 'All tight.', boltIt: 'Now tighten its bolts.',
      noneFit: 'No spare parts of this kind.', engineParts: 'Engine parts', transParts: 'Transmissions', tireParts: 'Tires',
      rivalHood: "UNDER THE RIVAL'S HOOD", tuneHelp: 'Line up the white mark with 0', tuned: 'Tuned!'
    },
    gas: {
      hello: "What'll it be, kid?", tank: (f, t) => `Gas: ${f} / ${t}`, fill: m => `Fill it up, Gus! (${m})`, self: 'Self serve (hold)', pumping: 'Pumping...',
      leave: 'Leave', full: "It's full, speedy!", broke: "You're out of money, kid.", noMoney: 'No money, no gas. Get out of my face, kiddo!',
      thanks: m => `That's ${m}. Thanks, kid!`
    },
    diner: {
      goHome: 'Go home', postGuy: 'The guy on the post', challenge: n => `Challenge ${n}`, drag: 'Drag race', road: 'Road race', hood: 'Look under the hood',
      kicks: 'Just for kicks', pinks: 'Pink slips', lookingFor: 'Looking for...', call: 'Call him', nobody: 'Nobody else around tonight.', calling: n => `Hey, ${n}! Somebody wants you.`,
      hello: ["What're you looking at?", 'Think you can take my car?', 'Nice night for a race.', 'Looking for trouble?', 'This baby flies, pal.'],
      yes: ["Let's do it!", "You're on!", "See you on the street.", "I'll leave you in the dust!"],
      refuse: { broke: "You don't have that kind of money, kid.", noPinks: 'Your heap for my car? Dream on.', noMoney: "I'm not betting that much with you.", scared: 'Nah, not tonight.' },
      bye: 'See you around.', closing: "Bob's is closing. See you tomorrow!", youBroke: "You don't have that much money.", homeAsk: 'Go home? The paper comes in the morning.',
      kingHello: "So you're the hotshot who's been beating everybody.", kingOnlyPinks: 'I only race on the road, for pink slips.', kingYes: "Fine. Let's see what you've got."
    },
    race: {
      gear: g => `Gear: ${g}`, ready: 'Get ready!', dragName: 'Drag race', roadName: 'Road race',
      help: 'Hold ↑ to rev · SPACE drops the clutch on green and shifts up · Z shifts down · ← → steer · ↓ brake',
      helpAuto: 'Hold ↑ to rev · SPACE lets go of the brake on green · ← → steer · ↓ brake',
      go: 'GO!', grind: 'You ground the gears! Lift off the gas when you shift', police: 'Police! Pull over or lose them', lostCops: 'You lost the police', dry: 'Out of gas',
      won: 'YOU WON!', lost: 'YOU LOST', voided: 'RACE OFF',
      paused: 'PAUSED', resume: 'Resume', giveUp: 'Give up',
      keys1: '↑ gas · ↓ brake · ← → steer', keys2: 'SPACE shifts up · Z shifts down',
      winTime: (t, mph) => `Your winning time ${t} sec., avg. speed ${mph} mph. Congratulations!`,
      loseTime: (n, t, me) => `${n}'s time ${t} sec. Yours ${me} sec.`,
      wonMoney: m => `You won ${m}.`, wonPinks: c => `The ${c} is yours now!`, congrats: 'Nice race.',
      lostMoney: m => `You lost ${m}.`, lostPinks: 'You lost the pink slip: your car goes with him.', better: 'Better luck next time.',
      fine: m => `Speeding ticket: ${m}.`,
      reasons: {
        foul: () => 'You jumped the light: you lose.', rivalFoul: n => `${n} jumped the light: you win!`,
        crash: () => 'You crashed!', rivalCrash: n => `${n} crashed: you win!`, blown: () => 'You blew the engine!', broken: () => 'The transmission broke!',
        dry: () => 'You ran out of gas.', giveUp: () => 'You gave up.', stopped: () => 'You pulled over and got a ticket.', caught: () => 'The police caught you!'
      },
      rivalWins: ['Eat my dust!', 'Better luck next time, chump.', "Is that all you've got?"],
      rivalLoses: ['Nice driving, kid.', "Beginner's luck.", 'Next time you won\'t be so lucky.'],
      kingWins: 'Come back when you grow up, kid.', kingLoses: 'Nobody ever beat me... The keys are yours.'
    },
    ticket: {
      state: 'HIGHWAY PATROL', title: 'STATE OF CALIFORNIA · NOTICE TO APPEAR', name: 'DRIVER', vehicle: 'VEHICLE', date: 'DATE', violation: 'VIOLATION', speeding: 'Speeding',
      fine: 'FINE', signHere: 'SIGN HERE', clickSign: 'Click to sign', paid: 'Fine paid.', cantPay: "You can't pay..."
    },
    end: {
      kingTitle: 'THE NEW KING!',
      king: ["You beat the King on his own road. His black Corvette is yours, and from tonight everybody at Bob's knows your name.",
        'You beat the King.', '', 'For years they will talk about the night a garage kid left the black Corvette behind.', '', 'Your name goes up on the wall of King Street Rodders.'],
      summer: ['Summer is over.', '', 'School starts tomorrow and the King is still the King.', '', 'Maybe next summer...'],
      broke: ["You're out of cars and out of money.", '', "You'll spend the rest of the summer on foot, watching the races from the curb at Bob's."],
      jail: ["You couldn't pay the fine.", '', 'The police called your folks and you are grounded for the rest of the summer. So long, racing.'],
      stats: (w, l, m, d) => `Wins: ${w} · Losses: ${l} · Money: ${m} · Days: ${d}`
    }
  }
};
