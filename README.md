# Mundo Arcade

Sitio de juegos para jugar en el navegador, en español e inglés. Son solo archivos estáticos: no necesita servidor ni base de datos.

**En internet:** https://rcanepa.github.io/mundo-arcade/

## Estructura

```
index.html      portada del sitio
site.css        estilos de la portada
catalog.js      lista de juegos que muestra la portada
turbo-barro/    primer juego
  index.html    el juego armado (un solo archivo, funciona sin internet)
  cover.jpg     imagen de la tarjeta (800×500)
  build.sh      arma index.html a partir de src/
  src/          código del juego (los textos de ambos idiomas están en i18n.js)
jardin-vivo/    segundo juego, con la misma estructura
```

## Probar en el computador

Abrir `index.html` con doble clic funciona. Para probarlo como si estuviera en internet:

```bash
python3 -m http.server 8770
```

y luego entrar a http://localhost:8770

## Cambiar Turbo Barro

Edita los archivos de `turbo-barro/src/` y vuelve a armar el juego:

```bash
./turbo-barro/build.sh
```

El mismo comando corre las pruebas automáticas (`turbo-barro/tests/smoke.js`). Juegan carreras sin abrir el navegador y revisan que las pistas, el campeonato, las copas, el taller y el editor sigan funcionando. Si algo se rompió, lo dicen.

## Cambiar Jardín Vivo

Edita los archivos de `jardin-vivo/src/` y vuelve a armar el juego:

```bash
./jardin-vivo/build.sh
```

El mismo comando corre las pruebas automáticas (`jardin-vivo/tests/smoke.js`). Hacen pasar semanas y años de juego sin abrir el navegador y revisan que las plantas, las heladas, el suelo, el riego por goteo, las semillas y esquejes, la poda, las plantas compañeras, los climas, las macetas de la casa, los visitantes, el concurso, el guardado, la vista girada y los terrenos al azar sigan funcionando (revisan 40 terrenos distintos: que se puedan recorrer, que haya canteros con sol y que las plantas de la abuela estén a gusto).

- Las especies y sus necesidades reales (luz, riego, suelo, pH, temperaturas, floración, poda) y las plantas compañeras están en `species.js`.
- Los climas de cada ciudad (Santiago, Valdivia, La Serena y Ciudad de México) y el sol están en `climate.js`; la luz de cada casilla y de cada ventana de la casa, en `garden.js`.
- Cada partida nueva arma un terreno distinto (`randomGarden` en `garden.js`): cambian la forma y el lugar de las parcelas, el estanque, el árbol viejo, los canteros y las plantas que dejó la abuela, elegidas para que se den en la ciudad elegida. La casa y la reja no se mueven. La pantalla de título y las partidas guardadas antes de este cambio usan el jardín clásico (`classicGarden`).
- Los textos en español e inglés están en `i18n.js`.
- La imagen de la tarjeta se puede volver a sacar abriendo `jardin-vivo/index.html?cover` (muestra el jardín de muestra sin botones). Acepta opciones para probar otros momentos: `h` (hora), `d` (día del año), `z` (zoom), `rot` (vista girada, 0 a 3), `cl` (clima: `santiago`, `valdivia`, `serena`, `cdmx`), `rain`, `frost` y `seed` (muestra el terreno con que empezaría una partida nueva, en vez del jardín de muestra). Por ejemplo `index.html?cover&h=21&rot=2&cl=valdivia` o `index.html?cover&seed=123&cl=cdmx`.

## Agregar un juego nuevo

1. Crea una carpeta con el nombre del juego (por ejemplo `space-blaster/`) con su `index.html` y un `cover.jpg` de 800×500.
2. Copia la entrada de Turbo Barro en `catalog.js` y cambia los datos (textos en `es` y `en`).
3. Para que el juego abra en el mismo idioma que el sitio, lee `localStorage.getItem('arcade.lang')` (`'es'` o `'en'`).
4. Para volver al sitio, enlaza a `../index.html`.

## Publicar en internet

El sitio está en GitHub Pages (repositorio `rcanepa/mundo-arcade`, rama `main`). Para publicar cambios basta con subirlos:

```bash
git add -A && git commit -m "Describe el cambio" && git push
```

GitHub actualiza el sitio solo, en uno o dos minutos.
