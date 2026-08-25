# Oficina del Barbero — web

Web de una sola página para **Oficina del Barbero** (Calle Poeta Sánchez Bautista, 3 · Llano de Brujas, Murcia): barbería y academia de prótesis capilares.

Es **un solo archivo** (`index.html`) con el CSS y el JS dentro. No hay build, ni dependencias, ni servidor. Se abre haciendo doble clic y se publica copiándolo tal cual.

---

## Antes de publicar: 4 cosas que hay que confirmar

Están marcadas en el código con el comentario `REVISAR`.

| # | Qué | Dónde |
|---|-----|-------|
| 1 | **Teléfono / WhatsApp.** Puse `+34 674 48 59 68`, que es el que aparece en las fichas públicas de Booksy. Hay una segunda ficha (Fresha, no gestionada por el negocio) con otro número, así que conviene confirmarlo. | Buscar `REVISAR-TEL`: barra inferior móvil, botón del curso, formulario (`var WA`), sección Visítanos y datos estructurados |
| 2 | **Precios.** Tomados de Booksy en agosto de 2026. | Sección `#servicios` y el bloque `hasOfferCatalog` del JSON-LD |
| 3 | **Programa del curso y preguntas frecuentes.** Los 4 módulos y las 5 respuestas son una propuesta escrita según el estándar del sector, no dictadas por Samu. Hay que ajustarlas a lo que se imparte de verdad. | Sección `#academia` |
| 4 | **Fotos.** La página está diseñada a propósito sin fotografías (ver más abajo). | — |

## Datos que sí son reales

Sacados de la ficha de Booksy del negocio y de Google Maps:

- Valoración **5,0 sobre 5 con 166 reseñas**, y las cuatro reseñas citadas son literales.
- Servicios y precios: corte 13 €, recorte de barba 8 €, barba premium 15 €, corte + perfilado 15 €, corte + barba 19 €, corte y barba premium 26 €.
- Horario: L–V 9:30–13:30 y 16:30–20:30 · S 9:30–13:30 · D cerrado.
- Equipo: Samuel Guerrero y Joti. Instagram: `@samu_thebarber`.
- Coordenadas del local para el mapa: `38.004766, -1.0712198`.
- Curso de prótesis capilares: **800 €** (dato del cliente).

---

## Publicarla

Cualquiera de estas tres opciones vale, todas gratis:

**Cloudflare Pages** (la que usa la competencia del enlace de referencia)
1. Entrar en [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create → Pages → Upload assets.
2. Arrastrar `index.html`. Queda en `https://<nombre>.pages.dev`.

**Netlify Drop** — arrastrar la carpeta a [app.netlify.com/drop](https://app.netlify.com/drop). Cero configuración.

**GitHub Pages** — Settings → Pages → publicar desde esta carpeta.

Con dominio propio (p. ej. `oficinadelbarbero.es`, unos 12 €/año): comprarlo y apuntar los DNS al hosting elegido. Después hay que cambiar en `index.html` las tres URLs que llevan el dominio de ejemplo: `<link rel="canonical">`, `og:url` y los `@id`/`url` del JSON-LD.

## Después de publicar (SEO local, esto es lo que trae clientes)

1. **Google Business Profile**: en la ficha de Google Maps del negocio, añadir la web en el campo "Sitio web". Es lo que más mueve la aguja en búsquedas tipo "barbería Llano de Brujas".
2. **Instagram**: poner el enlace en la bio, encima del de Booksy — la web ya lleva a Booksy y además vende el curso.
3. La página ya incluye datos estructurados de `HairSalon`, `Course` y `FAQPage`, así que Google puede mostrar la valoración, el precio del curso y las preguntas desplegables directamente en los resultados.

---

## Cómo está hecha

- **Un archivo, sin dependencias.** Solo se descarga de fuera la tipografía (Google Fonts). Si se cae, hay pila de reserva declarada y la página sigue legible.
- **Dos temas.** Se adapta al modo claro u oscuro del móvil de quien la visita: papel envejecido o caoba nocturna. Todos los colores salen de variables CSS agrupadas al principio del archivo.
- **Formulario del curso sin servidor.** No guarda ni envía nada: compone el mensaje con los datos y lo abre en el WhatsApp del propio visitante. Cero mantenimiento y cero obligaciones de protección de datos por almacenar información.
- **Accesibilidad.** Contrastes comprobados (el más bajo, 5,2:1, por encima del mínimo AA), foco visible con teclado, enlace de salto al contenido, y las animaciones se desactivan si el sistema pide menos movimiento.
- **Verificada en Chromium** en escritorio y móvil, en los dos temas: sin errores de consola, sin scroll horizontal.

### Tipografía y color

| Rol | Fuente | Uso |
|-----|--------|-----|
| Display | Bodoni Moda | titulares, nombres de servicio, cifras |
| Texto | Jost | párrafos e interfaz |
| Etiquetas | Courier Prime | antetítulos, horarios, botones |

El concepto es tomarse en serio la palabra *Oficina*: la elegancia de un despacho antiguo —madera, latón y sello de tinta— en vez del típico barbershop vintage de ladrillo y poste de barbero. El sello circular del inicio es SVG, no una imagen, y lleva la valoración real.

### Añadir fotos

No hay ninguna: sin material propio, un banco de imágenes con barberos genéricos delata al instante que la web es de plantilla, y era mejor apoyarlo todo en tipografía. Cuando haya fotos buenas (el local vacío y limpio, un antes/después de prótesis, Samu trabajando):

1. Guardarlas junto al `index.html`, comprimidas a WebP y a un máximo de 1600 px de ancho.
2. Insertarlas con el ancho y alto declarados, para que no salte la maquetación:
   ```html
   <img src="local.webp" alt="Interior de la barbería" width="1600" height="1067" loading="lazy">
   ```
3. Los mejores sitios: bajo el titular de portada (a la izquierda del sello), y como banda de tres antes de la sección de Instagram.

---

## La competencia en Murcia

Lo que hay ahora mismo, y por qué esta página está planteada así:

- **La mayoría no tiene web.** Barberías con mucha reputación en Murcia —Jjota Barber Shop, Romero Peluqueros y compañía— viven en Booksy, Treatwell o Instagram. Tener página propia ya es una ventaja: es el único sitio donde el negocio controla el mensaje y donde el curso puede venderse.
- **Las que la tienen la usan de folleto.** Caso de Barbería Javi García: web informativa, sin precios claros y sin nada que empuje a reservar.
- **La referencia premium es de marca personal.** Henko Prime Studio (Dani Ortiz) va por otro camino: el barbero como protagonista, cifras a la vista, formación por niveles y captación directa a WhatsApp. Su fuerza está en la venta, no en el diseño.
- **Nadie compite en prótesis capilar.** En Murcia hay centros capilares (Centros Beltrán) y academias generalistas online (Superhairpieces, Carmen Olmedo), pero no una barbería con 5,0 en reseñas que además forme protesistas. Ese es el hueco, y por eso el curso tiene banda propia a página completa en vez de un párrafo perdido.

De ahí las decisiones: precios visibles (lo contrario que la competencia), cifras verificables arriba, el curso como segundo protagonista con formulario propio, y acción siempre a mano en móvil.
