// Catálogo de juegos del sitio.
// Para agregar un juego: crea su carpeta (con su index.html y cover.jpg) y copia una entrada aquí.
const GAMES = [
  {
    slug: 'street-rod',
    color: '#ff4f9a',
    cover: 'street-rod/cover.jpg',
    download: 'StreetRod63.html',
    added: '2026-10-22',
    es: {
      title: 'Street Rod: Verano del 63',
      tagline: 'Arma tu hot rod y gánale a El Rey',
      description: 'Verano de 1963 en California: compra un auto en el diario, ármalo perno a perno en tu garaje y desafía de noche a los rivales de Bob\'s Drive-In en picadas y carreras de ruta. Apuesta dinero o los papeles del auto, escápate de la policía y gánale a El Rey y su Corvette negro. Una nueva versión del clásico de 1989, con 21 autos de verdad de los años 30 a los 60.',
      players: '1 jugador', controls: 'Mouse y teclado', age: '10+ años'
    },
    en: {
      title: 'Street Rod: Summer of 63',
      tagline: 'Build your hot rod and beat The King',
      description: 'Summer 1963 in California: buy a car from the paper, build it bolt by bolt in your garage and challenge the rivals at Bob\'s Drive-In to drag races and road races at night. Bet cash or pink slips, outrun the cops and beat The King and his black Corvette. A remake of the 1989 classic, with 21 real cars from the \'30s to the \'60s.',
      players: '1 player', controls: 'Mouse and keyboard', age: 'Ages 10+'
    }
  },
  {
    slug: 'jardin-vivo',
    color: '#6fbf73',
    cover: 'jardin-vivo/cover.jpg',
    download: 'JardinVivo.html',
    added: '2026-10-21',
    es: {
      title: 'Jardín Vivo',
      tagline: 'Cultiva el jardín de tus sueños',
      description: 'Hereda la casa de tu abuela y su jardín en Santiago, Valdivia, La Serena o Ciudad de México. Más de 80 especies con necesidades reales de luz, agua, suelo, pH y clima: observa el sol, mejora la tierra, poda en invierno y protege tus plantas de las heladas. Abre la reja: los visitantes pagarán por ver tus flores y un jurado elige el jardín más lindo.',
      players: '1 jugador', controls: 'Mouse o pantalla táctil', age: '8+ años'
    },
    en: {
      title: 'Living Garden',
      tagline: 'Grow the garden of your dreams',
      description: 'Inherit your grandmother\'s house and garden in Santiago, Valdivia, La Serena or Mexico City. Over 80 species with real needs for light, water, soil, pH and climate: watch the sun, improve the soil, prune in winter and shield your plants from frost. Open the gate: visitors will pay to see your flowers and a jury picks the loveliest garden.',
      players: '1 player', controls: 'Mouse or touch', age: 'Ages 8+'
    }
  },
  {
    slug: 'turbo-barro',              // nombre de la carpeta del juego
    color: '#ff8a00',                 // color del borde de su tarjeta
    cover: 'turbo-barro/cover.jpg',   // imagen 16:10
    download: 'TurboBarro4x4.html',   // nombre del archivo al descargarlo (opcional)
    added: '2026-10-20',              // el más nuevo aparece destacado arriba
    es: {
      title: 'Turbo Barro 4x4',
      tagline: 'Carreras de camionetas en el barro',
      description: 'Compite contra 3 rivales en 5 pistas llenas de saltos, barro y charcos. Gana dinero, mejora tu camioneta en la tienda y conviértete en campeón. ¡Se puede jugar de a dos!',
      players: '1–2 jugadores', controls: 'Teclado o control', age: '5+ años'
    },
    en: {
      title: 'Turbo Mud 4x4',
      tagline: 'Muddy off-road truck racing',
      description: 'Race 3 rivals on 5 tracks full of jumps, mud and puddles. Earn cash, upgrade your truck in the shop and become the champion. Two players can race together!',
      players: '1–2 players', controls: 'Keyboard or gamepad', age: 'Ages 5+'
    }
  }
];
