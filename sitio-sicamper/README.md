# Sí Camper · propuesta de rediseño

Rediseño completo de [sicamper.com](https://sicamper.com/) como sitio estático:
sin WordPress, sin jQuery y sin plugins. Diez páginas, un CSS y un JS.

El contenido (tarifas, condiciones, equipamiento, FAQ, ficha del vehículo) está
tomado de la web original y no se ha inventado nada. Donde el precio no es
público —los extras opcionales— se dice explícitamente «a confirmar» en lugar de
poner una cifra.

## Qué mejora respecto a la web actual

**Diseño**
- Sistema de diseño propio: tokens de color, escala tipográfica fluida, sombras
  y radios coherentes en todo el sitio (`tema.css`).
- Tipografía editorial (Fraunces para titulares, Inter para texto) en lugar de
  la fuente por defecto de la plantilla.
- Modo claro y oscuro automático, con conmutador manual que se recuerda.
- Móvil primero de verdad: menú en cajón a pantalla completa, barra inferior
  fija con Llamar · WhatsApp · Reservar, y cero scroll horizontal.

**Función**
- **Calculadora de presupuesto real** (`precios.html`, `reservar.html`): pones
  las fechas y calcula el total con las tarifas oficiales. Detecta la temporada
  día a día —incluida la Semana Santa, que se calcula con el algoritmo de Gauss,
  y los puentes de los festivos nacionales—, aplica los mínimos de estancia, el
  suplemento de menos de 5 días, los descuentos de estancia larga, los
  suplementos de horario, el seguro de cancelación y el reparto 30 % / 100 %
  según la antelación. La web original esconde el precio detrás de un formulario.
- FAQ con 31 preguntas, buscador por palabras, filtro por tema y marcado
  `FAQPage` para los resultados de Google.
- Galería con visor a pantalla completa navegable con teclado.
- Formularios que abren el correo del propio usuario con todo redactado: sin
  backend, sin datos en servidores de terceros y con copia para quien escribe.

**Técnica**
- 37 fotos reconvertidas a WebP: 2,7 MB en total frente a los ~800 KB de HTML
  que pesaba una sola página en la web original.
- HTML semántico, `aria-*` donde hace falta, foco visible, `prefers-reduced-motion`
  respetado y salto al contenido.
- Metadatos completos, Open Graph, JSON-LD (`AutoRental`, `FAQPage`, `Vehicle`),
  `sitemap.xml`, `robots.txt` y cabeceras de seguridad con CSP en `_headers`
  (formato Cloudflare Pages / Netlify).
- Solo dos preferencias en `localStorage` (tema y aviso de cookies). Ni una
  cookie de terceros, y el mapa es de OpenStreetMap en lugar de Google Maps.

## Estructura

```
index.html          Portada
precios.html        Tarifas por temporada + calculadora de presupuesto
autocaravana.html   Ficha, galería, camas, equipamiento y autonomía
servicios.html      Incluido de serie, extras opcionales y servicios
reservar.html       Calculadora + solicitud de reserva
localidades.html    Zonas de entrega a domicilio
venta.html          McLouis Glamys 222 de ocasión
faq.html            31 preguntas con buscador y filtros
contacto.html       Formulario, datos y mapa
legal.html          Aviso legal, privacidad, cookies

tema.css            Sistema de diseño
tema.js             Interacción + motor de cálculo de presupuestos
img/                37 fotos en WebP
_construir.py       Plantilla, cabecera, pie y metadatos
_paginas.py         Contenido de cada página  ← punto de entrada
```

## Regenerar el HTML

Las cabeceras, pies y metadatos son compartidos, así que el HTML se genera:

```bash
cd sitio-sicamper
python3 _paginas.py
```

Editas el contenido en `_paginas.py` y vuelves a ejecutarlo. No hay
dependencias: solo Python 3.

Para verlo en local:

```bash
python3 -m http.server 8000
```

## Pendiente antes de publicar

- Completar los `[por completar]` de `legal.html` (NIF y proveedor de hosting).
- La web original se contradice con el kilómetro extra: la página de precios dice
  0,35 €/km y las preguntas frecuentes 0,30 €/km. Aquí se ha usado **0,35 €** en
  todas partes (precios, FAQ y calculadora); conviene confirmar cuál es la cifra
  buena y cambiarla en `tema.js` (`KM_EXTRA`) si no es esa.
- Confirmar los precios de los extras opcionales, o dejarlos como «a confirmar».
- Enchufar el formulario de reserva a un backend o a un servicio de formularios
  si se prefiere no depender del `mailto:`.
- Sustituir las fotos por otras de mayor resolución donde el original ya venía
  pequeño (`montanas`, `lago`, y las fichas de servicios, a 470 px de ancho).
