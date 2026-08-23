# AquaLadra — web nueva

Rediseño de [aqualadra.com](https://www.aqualadra.com): autolavado de mascotas y
peluquería canina y felina en Puente Tocinos (Murcia).

Es una web **estática**: HTML, CSS y JavaScript sin dependencias ni compilación.
Se sube tal cual a cualquier hosting y funciona.

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

Al ser estática vale cualquier hosting. La web actual está en **Cloudflare**,
así que lo natural es seguir ahí:

```bash
npm install -g wrangler
wrangler login
wrangler pages deploy aqualadra --project-name aqualadra
```

Después, en el panel de Cloudflare Pages, apuntar el dominio `aqualadra.com`
al proyecto. También funciona igual arrastrando la carpeta a Netlify, o
subiéndola a un hosting normal por FTP.

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
├── 404.html              página de error
├── css/
│   ├── estilos.css       sistema de diseño: tokens, componentes, responsive
│   └── tipografias.css   las dos fuentes, auto-alojadas
├── js/
│   ├── config.js         teléfono y URL del calendario ← lo que se toca
│   └── app.js            menú, pestañas, galería, calendario
├── fonts/                Baloo 2 y Nunito Sans (.woff2)
├── img/                  fotos optimizadas + logo y emblema
├── pruebas/              comprobaciones automáticas
├── _headers              caché y seguridad (Cloudflare / Netlify)
├── robots.txt
└── sitemap.xml
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

## Tareas típicas

**Cambiar un precio** → en `index.html`, buscar el panel del tamaño
(`panel-p1` es menos de 10 kg, `p2` de 10 a 20, `p3` más de 20, `p4` gatos) y
editar el número. Está también en el bloque `application/ld+json` del final,
que es lo que lee Google.

**Añadir una foto a la galería** → meter el fichero en `img/` (a ser posible en
`webp` y `jpg`) y copiar uno de los bloques `<figure class="gallery__item">`
cambiando nombres, `alt`, `width` y `height`. Con 5 fotos la rejilla queda
cuadrada en ordenador; conviene añadirlas de 4 en 4 para que siga cuadrando.

**Cambiar el horario** → aparece en tres sitios: los *chips* del hero, la lista
de la sección de contacto y el `openingHoursSpecification` del JSON-LD.

**Quitar una opinión** → borrar su `<article class="review">`.

---

## Pruebas

Comprueban lo que se puede romper sin darse cuenta: que las pestañas cambien,
que la galería se abra, que el menú del móvil funcione, que no haya imágenes sin
`alt` ni anclas rotas, y que **todos los textos tengan contraste
suficiente**.

```bash
npx http-server aqualadra -p 8899 -s &
node aqualadra/pruebas/comprobar.mjs    # 24 comprobaciones
node aqualadra/pruebas/contraste.mjs    # contraste de cada texto de la página
```

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
- **Los precios de la máquina.** En la foto de la central de pago se lee la
  pantalla: «LAVADO MASCOTA 6,00 € · TIEMPO EXTRA 1,00 € · DESLANADORA 3,00 €».
  La deslanadora a 3 € no se menciona en ningún texto de la web, ni en la
  antigua ni en esta. Si sigue siendo así, merece la pena decirlo: es un
  servicio de pago que ahora mismo no se está anunciando. No se ha puesto por
  no dar por buenos unos precios leídos en una foto.
