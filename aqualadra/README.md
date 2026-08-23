# AquaLadra — web nueva

Rediseño de [aqualadra.com](https://www.aqualadra.com): autolavado de mascotas y
peluquería canina y felina en Puente Tocinos (Murcia).

Es una web **estática**: HTML, CSS y JavaScript sin dependencias ni compilación.
Se sube tal cual a cualquier hosting y funciona.

> ## ⚠️ Antes de publicar en aqualadra.com
>
> Las páginas legales están escritas pero **les faltan datos que no constaban
> en ninguna parte**. Están marcados en amarillo dentro de las propias páginas
> (`aviso-legal.html` y `privacidad.html`), así que se ven a simple vista:
>
> - Nombre y apellidos o razón social del titular
> - NIF o CIF
> - Un correo electrónico de contacto
> - Si es sociedad, los datos del Registro Mercantil
> - Los plazos de conservación de datos
>
> Busca `class="rellenar"` en el código para encontrarlos todos. Y que le dé un
> repaso la gestoría o quien lleve la protección de datos: esto es una
> estructura estándar bien montada, no un dictamen jurídico.

---

## Qué cambia respecto a la web anterior

| | Antes | Ahora |
|---|---|---|
| Reservas | un botón pequeño que abría una ventana de Google | el calendario **incrustado** en la propia web, con su sección |
| Colores | los mismos tonos pero sin sistema, mucho blanco plano | la misma paleta ordenada en tokens: el aqua de las burbujas del logo, el mostaza de las paredes del local y el azul tinta del trazo |
| Tipografías | tres fuentes mezcladas (Protest Riot, Poppins, PoorStory) | dos: **Baloo 2** para titulares y **Nunito Sans** para el texto, auto-alojadas |
| Autolavado | 4 pasos genéricos | los 4 pasos reales del cartel del local, con los 8 minutos y la ampliación de 1 € |
| Tarifas | cuatro bloques con SVG enormes incrustados | pestañas por tamaño, precios legibles |
| Móvil | poco cuidado | barra fija abajo con *Reservar* y *WhatsApp*, menú desplegable |
| Fotos | con marco de Instagram y marca de agua encima | recortadas y limpias, en `webp` + `jpg` |
| Accesibilidad | contrastes por debajo del mínimo | todos los textos cumplen WCAG AA (comprobado, ver *Pruebas*) |
| Legal | no había aviso legal, ni privacidad, ni cookies | las tres páginas, enlazadas desde el pie |
| Cookies | el mapa cargaba Google sin preguntar | ningún contenido de Google se carga hasta que la persona lo pide |
| Movimiento | estática | oleaje, burbujas que suben y apariciones escalonadas, todo pausado fuera de pantalla |

Los precios, el teléfono, la dirección, el horario y las opiniones son
**los mismos** que había en la web anterior. No se ha inventado nada.

---

## El calendario de reservas

Esto era el objetivo principal, y resulta que **ya existía**: la web antigua
cargaba una página de citas de Google Calendar llamada *«Peluqueria
Aqualadra»*, pero escondida detrás de un botón discreto que abría una ventana
aparte. Mucha gente no la encontraba.

Ahora ese mismo calendario está **incrustado dentro de la web**, en su propia
sección, con la disponibilidad real. Ventajas de mantener Google en lugar de
montar un sistema nuevo:

- La peluquera sigue gestionando su agenda **desde su propio Google Calendar**,
  donde ya trabaja. No hay que aprender nada nuevo.
- Los huecos que muestra la web son los reales: si bloquea una mañana en su
  calendario, desaparece de la web al momento.
- Google manda la confirmación por email y permite cambiar o cancelar la cita.
- No hay servidor, ni base de datos, ni contraseñas que mantener.

El calendario se carga solo cuando la persona se acerca a la sección, para que
no ralentice la primera visita.

### Si alguna vez cambia la página de citas

Se toca **un solo sitio**, `js/config.js`:

```js
reservasUrl: "https://calendar.google.com/calendar/appointments/schedules/...?gv=true"
```

Para sacar esa dirección: Google Calendar → la programación de citas →
**Abrir página de reservas** → copiar la URL del navegador. Tiene que acabar en
`?gv=true`.

En ese mismo fichero está el teléfono, por si algún día cambia.

---

## Poner la web en marcha

### Verla en local

```bash
npx http-server aqualadra -p 8899 -s
# y abrir http://127.0.0.1:8899
```

### Publicarla

Hay un script que lo hace todo. Antes, autenticarse de una de estas dos formas:

```bash
wrangler login                       # abre el navegador
# o bien, sin navegador:
export CLOUDFLARE_API_TOKEN="..."    # token con permiso Workers Scripts: Edit
```

Y entonces:

```bash
./aqualadra/desplegar.sh                 # vista previa en aqualadra.pages.dev
./aqualadra/desplegar.sh --produccion    # cuando ya tenga el dominio propio
./aqualadra/desplegar.sh --workers       # al Worker antiguo (*.workers.dev)
./aqualadra/desplegar.sh --solo-preparar # deja el paquete listo sin desplegar
```

> **Sobre la dirección de la vista previa.** El primer despliegue se hizo como
> Worker y Cloudflare le asignó a la cuenta el subdominio `fate-forgery`, o sea
> `aqualadra.fate-forgery.workers.dev`. Ese subdominio **no se puede renombrar**
> (la API responde «Account already has an associated subdomain»), y *forgery*
> significa falsificación: una URL así no se le manda a un cliente, y es
> carnaza para cualquier filtro de seguridad. Por eso ahora se despliega en
> **Cloudflare Pages**, que da `aqualadra.pages.dev`: más corta, sin palabras
> raras y en un dominio distinto. `--workers` sigue ahí por si hiciera falta.

La diferencia entre los dos primeros es importante y no es solo el `noindex`:

En modo vista previa el script **reescribe las URLs absolutas de la cabecera**
(`canonical`, `og:url`, `og:image` y el sitemap) para que apunten a la dirección
provisional en lugar de a `aqualadra.com`. Si no se hace, pasa algo que parece
un misterio: WhatsApp e Instagram **usan `og:url` como destino real del
enlace**, así que al tocarlo te llevan a la web *antigua* en vez de a la nueva,
y `og:image` se busca en un dominio donde no existe, con lo que la tarjeta de
previsualización sale rota.

La dirección de la vista previa se puede cambiar:

```bash
URL_VISTA_PREVIA=https://otra.workers.dev ./aqualadra/desplegar.sh
```

Solo se reescribe el `<head>`. El cuerpo se deja tal cual a propósito: en el
aviso legal, el sitio web del negocio es un dato legal y tiene que seguir
siendo `aqualadra.com` aunque el despliegue esté en otra dirección.

En modo `--produccion` no se toca nada: las URLs ya son las buenas.

El script copia el sitio a una carpeta aparte antes de subirlo, para no publicar
las pruebas ni este README (todo lo que esté en la carpeta de assets se sirve).

Para poner el dominio: en el panel de Cloudflare, **Workers & Pages → aqualadra
→ Settings → Domains & Routes → Add**, y añadir `aqualadra.com` y
`www.aqualadra.com`.

Al ser una web estática también vale cualquier otro hosting: arrastrar la
carpeta a Netlify, o subirla por FTP.

> El fichero `_headers` configura la caché y unas cabeceras de seguridad en
> Cloudflare Pages y Netlify. En otros hostings se ignora sin dar problemas.

### Vista previa rápida, sin cuenta

Wrangler puede publicar en una cuenta temporal anónima, sin necesidad de estar
logueado. Va bien para mandar un enlace y que alguien lo vea en el móvil:

```bash
mkdir -p /tmp/prev && cp -r aqualadra /tmp/prev/public
cd /tmp/prev && cat > wrangler.jsonc <<'EOF'
{
  "name": "aqualadra",
  "compatibility_date": "2026-08-01",
  "assets": { "directory": "./public", "not_found_handling": "404-page" }
}
EOF
npx wrangler deploy --temporary
```

Devuelve una URL `*.workers.dev` y, con ella, un **enlace para reclamar** el
despliegue: si se abre desde una cuenta de Cloudflare dentro del plazo que
indica (algo menos de una hora), el proyecto pasa a esa cuenta y deja de ser
temporal. Si no se reclama, la cuenta temporal se pierde.

Conviene añadir `<meta name="robots" content="noindex, nofollow">` y un
`robots.txt` con `Disallow: /` **solo en la copia de la vista previa**, para que
los buscadores no indexen una dirección provisional.

---

## Cómo está organizado

```
aqualadra/
├── index.html            la web entera (una sola página con anclas)
├── aviso-legal.html      \
├── privacidad.html        > páginas legales
├── cookies.html          /
├── 404.html              página de error
├── prueba.html           diagnóstico: carga sin CSS ni JS (ver más arriba)
├── css/
│   ├── estilos.css       sistema de diseño: tokens, componentes, responsive
│   └── tipografias.css   las dos fuentes, auto-alojadas
├── js/
│   ├── config.js         teléfono y URL del calendario ← lo que se toca
│   └── app.js            menú, pestañas, galería, calendario
├── fonts/                Baloo 2 y Nunito Sans (.woff2)
├── img/                  fotos optimizadas + logo y emblema
├── pruebas/              comprobaciones automáticas
├── desplegar.sh          publica en Cloudflare
├── _headers              caché y seguridad (Cloudflare / Netlify)
├── robots.txt            incluye los rastreadores de IA
├── sitemap.xml
└── llms.txt              resumen del negocio para asistentes de IA
```

### Los colores

Están todos como variables al principio de `css/estilos.css`. Salen del propio
logo y del local:

| Variable | Color | De dónde sale |
|---|---|---|
| `--aqua-700` `--aqua-600` | azul aqua | las burbujas del logo |
| `--sand-500` `--sand-700` | mostaza y caramelo | las paredes del local |
| `--ink` | azul tinta | el trazo del dibujo del logo |
| `--cream` | crema | fondo, para no cansar la vista |

Cambiando esas variables cambia toda la web de golpe.

---

## Cookies y contenidos de Google

El calendario de reservas y el mapa vienen de Google, y **ponen cookies suyas
en cuanto se cargan**. Para no instalar nada sin permiso, en su sitio aparece un
aviso con un botón: hasta que no se pulsa, no se carga nada de Google y no se
instala ninguna cookie de terceros.

Es la razón por la que la web **no necesita el típico banner de cookies** que
tapa media pantalla: no hay cookies propias de análisis ni publicidad, y las de
terceros no llegan a ponerse sin que se pidan.

Quien no quiera cargar el calendario tiene igualmente el botón de WhatsApp y el
teléfono a la vista, así que puede pedir cita sin pasar por Google. Y en la
sección de contacto, el enlace «Abrir en Google Maps» funciona sin incrustar
nada.

La decisión se recuerda en el almacenamiento local del navegador con la clave
`aqualadra:consiente-google`. No es una cookie y no viaja a ningún servidor. Se
puede retirar desde el botón que hay en la política de cookies.

## Las animaciones

Todas se mueven con `transform` y `opacity`, que son las dos propiedades que el
navegador puede animar en la GPU sin recalcular la página. Es lo que hace que en
un móvil no se note ningún tirón:

- **Oleaje** en los separadores entre secciones y en la entrada al pie. Son dos
  copias de la misma onda desplazándose; al recorrer 1440 px el bucle encaja sin
  salto.
- **Burbujas que suben** en el hero y en la llamada final, cada una con su
  duración y su desvío.
- **Apariciones escalonadas**: las tarjetas de una rejilla entran una detrás de
  otra en vez de todas de golpe. Se consigue poniendo `data-escalonar` en el
  contenedor; el JavaScript reparte los retrasos solo.
- **La foto del hero y las de la galería** se acercan al ritmo del scroll, con
  `animation-timeline: view()`. Donde el navegador no lo soporta, simplemente no
  pasa nada.
- **Al toque**: como en el móvil no hay «hover», los pies de foto de la galería
  se ven siempre y las tarjetas se hunden un poco al tocarlas.

Dos cosas que evitan que esto pase factura:

1. Las animaciones infinitas **se pausan cuando su sección no está en pantalla**
   (`app.js` pone la clase `fuera-de-vista`).
2. Quien tenga activado *reducir movimiento* en su sistema **no ve nada de
   esto**. La web queda quieta y completamente legible.

## Tareas típicas

**Cambiar un precio** → en `index.html`, buscar el panel del tamaño
(`panel-p1` es menos de 10 kg, `p2` de 10 a 20, `p3` más de 20, `p4` gatos) y
editar el número. Está también en el bloque `application/ld+json` del final,
que es lo que lee Google.

**Añadir una foto a la galería** → meter el fichero en `img/` (a ser posible en
`webp` y `jpg`) y copiar uno de los bloques `<figure class="gallery__item">`
cambiando nombres, `alt`, `width` y `height`. Con 5 fotos la rejilla queda
cuadrada en ordenador; conviene añadirlas de 4 en 4 para que siga cuadrando.

**Cambiar la imagen de previsualización** (la tarjeta que sale al compartir el
enlace por WhatsApp) → es `img/og.jpg`, de 1200x630. Está referenciada en las
etiquetas `og:image` y `twitter:image`.

**Cambiar el horario** → aparece en tres sitios: los *chips* del hero, la lista
de la sección de contacto y el `openingHoursSpecification` del JSON-LD.

**Quitar una opinión** → borrar su `<article class="review">`.

**Cambiar los precios de la máquina** → en `index.html`, el bloque
`<div class="machine">` de la sección de autolavado. Están también en el
JSON-LD.

**Rellenar los datos legales** → buscar `class="rellenar"` en `aviso-legal.html`
y `privacidad.html`, y sustituir cada marca amarilla por el dato real. Cuando no
quede ninguna, la web está lista para publicarse.

---

## SEO: qué se ha hecho y qué falta

### Para Google

- **Datos estructurados** (JSON-LD) con cuatro entidades en un solo grafo:
  `LocalBusiness` (dirección, teléfono, horario de los siete días, rango de
  precios, zona de servicio, imágenes y un catálogo con **los 18 servicios y
  sus precios**), `WebSite`, `HowTo` con los cuatro pasos del autolavado y
  `FAQPage` con las nueve preguntas.
- **Preguntas frecuentes** de verdad en la página, no solo en el dato
  estructurado. Aportan el texto relevante que antes faltaba y son candidatas
  a salir como resultado enriquecido.
- **Titulares con las palabras que la gente busca**: «Tarifas de peluquería…»,
  «Reserva cita en la peluquería canina», «Dónde estamos: Puente Tocinos,
  Murcia». Sin apelotonar palabras clave: el titular principal sigue siendo
  para las personas.
- **Sitemap** con las cuatro páginas indexables y su fecha, y **robots.txt**
  apuntando a él.

### Para las IA

- **`llms.txt`** ([convención de llmstxt.org](https://llmstxt.org)): un
  resumen en texto plano con los datos del negocio, los servicios, **todas las
  tarifas** y las preguntas frecuentes. Es lo que lee un asistente para poder
  responder «¿cuánto cuesta bañar un perro en Murcia?» sin tener que
  interpretar el diseño de la web.
- **`robots.txt` con los rastreadores de IA listados uno a uno** (GPTBot,
  ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot y algún
  otro). La regla general ya les deja pasar; se listan aparte para que la
  decisión quede escrita y cambiarla sea poner `Disallow` en uno.
- Los desplegables de las preguntas usan `<details>` nativo: **el texto de las
  respuestas está en el HTML aunque estén cerrados**, que es justo lo que
  necesitan los rastreadores.

### Lo que la prueba de SEO vigila

`pruebas/seo.mjs` no comprueba que existan las etiquetas, comprueba que **no
mientan**. Lo que más se rompe con el tiempo no es que falte una etiqueta: es
que se cambia un precio en la tabla y el JSON-LD sigue publicando el viejo.
Google lo penaliza y las IA responden un precio que no existe.

Así que compara, uno a uno: los 18 precios del JSON-LD contra los de la tabla
visible (en los dos sentidos: ni sobra ni falta ninguno), las nueve preguntas
palabra por palabra, los pasos del HowTo, y que el teléfono del dato
estructurado sea el mismo que el enlace de la página. **Si se cambia un precio
y no se regenera el JSON-LD, la prueba falla.**

### Lo que falta, y no es código

Por orden de impacto real:

1. **La ficha de Google del negocio.** Para una peluquería de barrio, quien
   decide si sales en el mapa cuando alguien busca «peluquería canina cerca»
   es el perfil de Google Business, no la web. Ya tienen ficha
   (`AQUALADRA - Autolavado de Mascotas`): lo que más rinde es completarla con
   horario, servicios, fotos recientes y pedir reseñas. Eso pesa más que todo
   lo que se pueda escribir en el HTML.
2. **Las coordenadas del local.** Falta el `geo` del `LocalBusiness`. No se han
   puesto porque no se han podido verificar: el número 138 de Calle Mayor no es
   geocodificable, y el único resultado con ese número está en Los Garres, otro
   distrito. Unas coordenadas equivocadas sitúan el negocio en el sitio
   erróneo, que es peor que no ponerlas. Se saca en diez segundos: Google Maps,
   pulsación larga sobre el local, y copiar los dos números. Las
   instrucciones están junto al bloque JSON-LD del `index.html`.
3. **Las reseñas reales de Google.** Las tres opiniones de la web son las que
   ya había en la anterior. No se ha marcado ninguna con datos estructurados a
   propósito: las reseñas que un negocio publica sobre sí mismo en su propia
   web no dan resultado enriquecido y pueden dar aviso en Search Console. Lo
   que sí funciona es tener reseñas en Google.
4. **Contenido propio.** Fotos de trabajos de peluquería (antes y después) es
   lo que más vende y sigue sin haber ninguna.

## Cuando alguien dice «no me abre la web»

Hay una página de diagnóstico en `prueba.html`
([aqualadra.pages.dev/prueba.html](https://aqualadra.pages.dev/prueba.html)).
No carga **nada** de fuera: ni CSS, ni JavaScript, ni fuentes, ni imágenes.
Todo va dentro del propio fichero.

Sirve para separar dos causas que se confunden todo el rato:

- **Si esa página carga y la web no** → el problema está en la web: algún CSS o
  JavaScript. La propia página lista qué soporta el navegador, así que la
  captura ya dice por dónde mirar.
- **Si esa página tampoco carga** → el problema está en el camino, no en el
  código: la red, el DNS, un filtro o el navegador. Ahí no hay nada que
  arreglar en el repositorio.

Al pedir la captura, pide también que se vea el apartado «Navegador»: el
user-agent completo suele resolver el misterio en un segundo.

## Pruebas

Comprueban lo que se puede romper sin darse cuenta: que las pestañas cambien,
que la galería se abra, que el menú del móvil funcione, que no haya imágenes sin
`alt` ni anclas rotas, y que **todos los textos tengan contraste
suficiente**.

```bash
npx http-server aqualadra -p 8899 -s &
node aqualadra/pruebas/comprobar.mjs    # 24 comprobaciones de interacción
node aqualadra/pruebas/consentimiento.mjs  # 38 sobre cookies, legal y animaciones
node aqualadra/pruebas/contraste.mjs    # contraste de cada texto, en las 5 páginas
node aqualadra/pruebas/seo.mjs         # 35 sobre datos estructurados y etiquetas
```

La de consentimiento comprueba lo más fácil de romper sin enterarse: que **no
salga ni una petición a Google** antes de que alguien acepte.

Necesitan Playwright (`npm i -D playwright`).

---

## Pendiente de comprobar al publicar

Dos cosas que dependen de servicios de Google y que no se han podido verificar
desde el entorno donde se hizo la web (bloquea las conexiones a Google):

1. **El calendario incrustado.** La página de citas responde correctamente y no
   manda ninguna cabecera que impida incrustarla (`X-Frame-Options` ni
   `frame-ancestors`), así que debería verse sin problema. Conviene mirarlo una
   vez publicada y, si no cargara, revisar en Google Calendar que la página de
   reservas siga siendo pública.
2. **El mapa** de la sección de contacto, incrustado igual.

Si alguno fallara, la web no se rompe: el calendario muestra un enlace para
abrirlo en otra pestaña y el teléfono, y el mapa deja la dirección enlazada a
Google Maps.

## Cosas que quizá quieran añadir

- **Horario de la peluquería.** Ahora la web dice «con cita previa» y remite al
  calendario, porque el horario concreto de la peluquera no estaba en ninguna
  parte de la web antigua. Si lo dicen, se pone.
- **Opiniones de Google.** Las tres que hay son las que estaban en la web
  antigua. Si tienen reseñas en Google, mejor esas, con su nombre real.
- **Fotos de trabajos de peluquería** (antes y después). Es lo que más vende en
  este negocio y no hay ninguna: todas las fotos son del autolavado.
- **Confirmar los precios de la máquina.** El bloque de la sección de
  autolavado (lavado 6 €, tiempo extra 1 €, deslanadora 3 €) sale de la pantalla
  de la central de pago que se ve en una de las fotos. El servicio está
  confirmado; conviene repasar que los importes sigan siendo esos.
