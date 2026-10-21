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

## Cambiar Jardín Vivo

Edita los archivos de `jardin-vivo/src/` y vuelve a armar el juego:

```bash
./jardin-vivo/build.sh
```

- Las especies y sus necesidades reales (luz, riego, suelo, pH, temperaturas, floración) están en `species.js`.
- El clima, el sol y la luz de cada casilla están en `climate.js` y `garden.js`.
- La imagen de la tarjeta se puede volver a sacar abriendo `jardin-vivo/index.html?cover` (muestra el jardín de muestra sin botones).

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
