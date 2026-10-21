// Catálogo de juegos del sitio.
// Para agregar un juego: crea su carpeta (con su index.html y cover.jpg) y copia una entrada aquí.
const GAMES = [
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
