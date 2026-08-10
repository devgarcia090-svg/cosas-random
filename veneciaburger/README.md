# Burger Bar Venecia — web rehecha

Rediseño de [veneciaburger.es](https://veneciaburger.es) centrado en **leer la carta desde el
móvil** (el caso real: el cliente escanea un QR en la mesa) y en **posicionar en Google**.

Sitio estático: HTML + una hoja de estilos + 3 KB de JavaScript. Sin frameworks, sin peticiones a
servidores externos, sin cookies.

## La dirección de diseño: servicio de noche

El local abre de 19:30 a 23:30 y cierra lunes y martes: **nunca se ve a la luz del día**. De ahí
sale todo lo demás. La carta se compone en oscuro por decisión, no por moda — es el ambiente real
de la sala y lo que menos deslumbra cuando alguien escanea el QR en la mesa. Las fotos de los
platos son la única fuente de color; el fondo es carbón cálido, del tono del papel de estraza y la
madera sobre la que están hechas.

- **Color.** Carbón cálido `#12100E`, tinta crema `#F4EFE8` y un único acento: el azul del propio
  logo (`#5CC2F2`), reservado para filetes, precios señalados y el botón de llamar. El naranja
  brasa aparece solo para marcar los platos picantes, porque ahí el color significa algo.
- **Tipografía.** **Fraunces** para los nombres de los platos y los títulos: un serif de contraste
  alto con carácter, que hace que cada burger se lea como una entrada de carta y no como el título
  de una tarjeta. **Archivo** para ingredientes, etiquetas y precios, que aguanta bien el cuerpo
  pequeño en pantalla. Ambas van incrustadas en el sitio (68 KB en total, subconjunto con solo los
  caracteres que usa la carta): no se pide nada a Google Fonts, así que no hay ni una petición
  externa ni cookies de terceros.
- **Trazado.** Carta impresa, no rejilla de tarjetas: filas separadas por filete fino, precios a la
  derecha con cifras tabulares, encabezados de sección con su recuento («23 burgers»), rótulos en
  versalita espaciada y márgenes amplios. Sin emojis, sin cajas redondeadas y sin sombras.

El logo original es negro sobre blanco, así que sobre el fondo oscuro desaparecía: se generó una
versión nocturna (`logo-noche.webp`) que pasa la letra a crema y conserva el trazo azul y el
amarillo del icono.

---

## El problema del sitio anterior

Los ingredientes existían, pero estaban **escondidos detrás de un clic por plato**:

- `/burgers` era una rejilla de fotos con nombre y precio. Para saber qué llevaba la *Hannibal*
  había que entrar en `/hannibal`, leer y volver atrás. **Con 23 burgers eso son 46 navegaciones**
  para comparar la carta entera desde el móvil.
- Los precios **no coincidían** entre la rejilla y la ficha del plato (ver más abajo).
- No había buscador ni forma de filtrar: para encontrar "algo con trufa" tocaba abrir platos a ciegas.
- Sin datos estructurados: Google no sabía que eso era un restaurante con una carta.

## Qué hace esta versión

| | Antes | Ahora |
|---|---|---|
| Ver los ingredientes de un plato | 1 clic + volver, por plato | Visibles en la propia lista |
| Recorrer la carta entera | ~44 páginas | 1 página |
| Buscar "trufa" | No se podía | Buscador que filtra por nombre e ingrediente |
| Ver la foto en grande | No se podía | Se pulsa la foto y se abre a pantalla completa |
| Peso de la carta | ~300 KB de HTML por página | 80 KB (≈12 KB comprimidos) + fotos diferidas |
| Datos para Google | Ninguno | `Restaurant` + `Menu` + `BreadcrumbList` (JSON-LD) |

Además:

- **Chips de categoría fijos** arriba que se marcan solos según por dónde vas scrolleando.
- El aviso de las patatas por +1,50 € aparece **una sola vez**, en la entradilla de Burgers, que es
  donde aplica. El aviso general de la cabecera queda solo para los alérgenos.
- **Pulsar la foto la abre en grande** con el nombre y el precio. La versión grande solo se
  descarga al pulsar, así que no penaliza la carga inicial. Se cierra con Esc, con la aspa o
  tocando fuera, y el foco vuelve donde estaba.
- **Fotos diferidas** (`loading="lazy"`) con tamaño reservado: no hay saltos de maquetación (CLS 0).
- **Hoja de impresión**: en papel sale en blanco y negro, sin menús ni fotos, aprovechando la hoja.
- **Aviso de abierto/cerrado** en la portada, calculado en el navegador con el horario real.
- Funciona **sin JavaScript**: la carta completa está en el HTML. El JS solo añade buscador,
  categoría activa y el aviso de horario.

### Auditorías (Lighthouse móvil, Chrome 133)

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO |
|---|---|---|---|---|
| `/menu` | 100 | 100 | 100 | 100 |
| `/` | 97 | 100 | 100 | 100 |

`axe-core` (WCAG 2.1 A + AA + best-practice): **0 violaciones** en las tres páginas.
Contrastes ≥ 4,5:1 en todo el texto y objetivos táctiles ≥ 44 px en los botones.

---

## Estructura

```
veneciaburger/
├── data/menu.json        ← la carta entera (única fuente de datos)
├── build.py              ← genera el HTML a partir del JSON
├── tools/fotos.py        ← descarga y recorta las fotos de los platos
├── tools/artifact.py     ← empaqueta la carta en un HTML suelto para enseñarla
├── assets/
│   ├── css/styles.css    ← incluye la dirección de diseño documentada arriba
│   ├── fonts/            ← Fraunces y Archivo, subconjunto propio (68 KB)
│   ├── js/venecia.js
│   └── img/              ← fotos en WebP: nombre.webp (miniatura) y nombre-g.webp (ampliada)
├── index.html            ← generados por build.py
├── menu/index.html
├── nosotros/index.html
├── politica-de-privacidad/index.html
├── sitemap.xml
├── robots.txt
├── _redirects            ← redirecciones 301 (Netlify)
└── .htaccess             ← redirecciones 301 + caché + gzip (Apache/Hostinger)
```

## Cambiar precios o platos

Todo está en `data/menu.json`. Se edita el precio o el texto y se ejecuta:

```bash
python3 build.py
```

No hace falta instalar nada (Python 3 y ya). Eso regenera las cuatro páginas y el `sitemap.xml`,
y de paso mantiene sincronizados los datos que lee Google.

## Cambiar o añadir fotos

`tools/fotos.py` descarga los originales, les quita el marco decorativo negro y genera los dos
tamaños que usa la carta (miniatura y ampliada). Necesita Pillow:

```bash
pip install Pillow && python3 tools/fotos.py
```

Para una foto nueva basta con añadirla al diccionario `FOTOS` del script, o dejar los dos
archivos (`nombre.webp` y `nombre-g.webp`) directamente en `assets/img/`.

**Aviso sobre la calidad:** las fotos del sitio original son de 768×768 px y buena parte de eso
era marco, así que la foto real ronda los 500–700 px. Se ve bien en el móvil, pero si tenéis los
originales de la cámara, sustituirlos mejoraría bastante la vista ampliada.

## Publicar

Es HTML plano: vale cualquier hosting.

- **Hostinger / Apache** (donde está ahora): subir el contenido de esta carpeta a `public_html`.
  El `.htaccess` ya trae las redirecciones, la caché y la compresión.
- **Netlify / Cloudflare Pages**: arrastrar la carpeta. El archivo `_redirects` se aplica solo.

### Ver el resultado en local

```bash
python3 -m http.server 8000
# http://localhost:8000
```

## SEO

- `<title>` y `description` propios por página, con la localidad ("Beniel", "Murcia") en los sitios
  donde de verdad se busca una hamburguesería.
- **JSON-LD**: `Restaurant` (dirección, teléfono, horario, redes) + `Menu` con las 6 secciones y los
  69 platos con su precio en euros. Es lo que permite que Google enseñe la carta y el horario
  directamente en los resultados.
- **Redirecciones 301** de las ~44 URLs antiguas a la nueva carta (`/hannibal` → `/menu#burgers`,
  etc.). Sin esto se perdería el posicionamiento que ya tienen esas páginas.
- `sitemap.xml`, `robots.txt`, `canonical`, Open Graph y favicon.

### Lo que falta y depende de ti (no lo puedo hacer yo)

1. **Perfil de Empresa en Google.** Para una hamburguesería de pueblo esto pesa más que la web:
   fotos, horario, y sobre todo pedir reseñas. Luego enlázalo desde la web.
2. **Coordenadas GPS** del local: añadirlas al JSON-LD (`geo`) mejora el resultado en mapas.
   Se sacan de Google Maps (clic derecho sobre el local → copiar coordenadas).
3. **Verificar en Google Search Console** y enviar el `sitemap.xml`.

---

## Datos: incoherencias que traía el sitio original

Todo el contenido (nombres, ingredientes, descripciones, precios) está copiado del sitio original.
No me he inventado nada. Pero al extraerlo aparecieron **contradicciones que conviene que
confirméis**, porque afectan a lo que se le cobra al cliente:

### 1. Los precios de las burgers no coinciden entre la rejilla y la ficha del plato

La página `/burgers` daba un precio y la ficha individual otro distinto, con la etiqueta
"Sin patatas Dip Canoe y salsa". **He usado el precio de la rejilla** (el más visible y el que
parece más reciente), pero la diferencia no sigue ningún patrón: va de 0 € a 1,10 €.

| Burger | Rejilla `/burgers` | Ficha del plato | Diferencia |
|---|---|---|---|
| Big Gublins | 12,00 € | 11,50 € | 0,50 € |
| Águila Dorada | 12,00 € | 11,50 € | 0,50 € |
| La Yucatana | 11,40 € | 11,40 € | — |
| Hannibal | 11,50 € | 11,10 € | 0,40 € |
| Bad Bro | 11,50 € | 11,10 € | 0,40 € |
| Amor Prohibido | 12,00 € | 10,90 € | **1,10 €** |
| Emmily | 11,50 € | 10,90 € | 0,60 € |
| Presumida | 11,00 € | 10,90 € | 0,10 € |
| Pistagocha | 12,00 € | 11,50 € | 0,50 € |
| Cheese-Bacon | 11,00 € | 10,50 € | 0,50 € |
| Camelot | 11,00 € | 10,40 € | 0,60 € |
| Ibérica | 10,90 € | 10,90 € | — |
| Trufada | 12,00 € | 11,50 € | 0,50 € |
| Mamba | 11,00 € | 10,50 € | 0,50 € |
| Marty | 10,00 € | 10,00 € | — |
| Lotus | 11,00 € | 10,50 € | 0,50 € |
| Clásica | 10,50 € | 9,90 € | 0,60 € |
| Tío Jack | 12,00 € | 11,80 € | 0,20 € |
| Lady Goat | 12,00 € | 10,90 € | **1,10 €** |
| Fire Fox | 11,00 € | 9,90 € | **1,10 €** |
| Cryspy Pollo | 9,90 € | 9,90 € | — |
| Cryspy César | 10,90 € | 10,90 € | — |
| Bad Chicken | 9,90 € | 9,90 € | — |

**Qué hacer:** decidid cuál es el bueno y corregidlo en `data/menu.json`. Ahora solo hay un sitio
donde tocarlo, así que el problema no se puede repetir.

### 2. Otros detalles

- **Cerveza sin 0,0 San Miguel tercio**: en el original aparecía con el símbolo € y sin importe.
  Está puesta como "Consultar" — falta el precio.
- **Medallones de queso Camembert**: no tenían foto en el original. Aparecen sin imagen.
- **Mini croquetas de cecina**: el sitio original reutilizaba la foto de las croquetas de jamón.
  Se ha mantenido, pero convendría una foto propia.
- **Aviso "Cerrado por vacaciones" (13 julio – 7 agosto)**: era una página suelta ya caducada.
  No se ha trasladado. Si volvéis a cerrar, lo suyo es un aviso en la portada, no una página.
- **Alérgenos**: el original solo enlazaba a una imagen genérica con los 14 alérgenos, sin decir
  cuáles lleva cada plato. He puesto un aviso claro para que el cliente pregunte, pero lo correcto
  es marcar los alérgenos plato a plato. El JSON ya está preparado para ello: solo hay que añadir
  un campo `alergenos` a cada plato y pintarlo en `render_plato()`.
- **Textos legales**: la política de privacidad se ha reescrito para que se ajuste a esta web (que
  no usa cookies ni analítica). La anterior hablaba de Google Analytics y cookies de terceros que
  aquí ya no existen. Convendría que un asesor le eche un ojo, y añadir un aviso legal con el
  NIF/razón social si vais a hacer venta o reservas online.

---

## El QR de la mesa

Que apunte directamente a `https://veneciaburger.es/menu` (no a la portada: el cliente sentado
quiere la carta, no la historia del local). La página está pensada para eso:

- Carga en ~1,2 s con datos móviles y pesa unos 12 KB comprimidos antes de las fotos.
- Las fotos se descargan solo según se van viendo, y la versión grande solo si se pulsa.
- El buscador está a mano nada más entrar.
- Se puede añadir a la pantalla de inicio como app (`site.webmanifest`, arranca en `/menu`).
