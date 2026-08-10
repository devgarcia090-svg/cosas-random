#!/usr/bin/env python3
"""Genera el sitio estático de Burger Bar Venecia a partir de data/menu.json.

Uso:  python3 build.py

No necesita dependencias. Para cambiar precios o platos edita data/menu.json
y vuelve a ejecutar este script: se regeneran las páginas y el sitemap.
"""

from __future__ import annotations

import html
import json
import pathlib
import datetime

RAIZ = pathlib.Path(__file__).parent
DATOS = json.loads((RAIZ / "data" / "menu.json").read_text(encoding="utf-8"))
NEG = DATOS["negocio"]
BASE = NEG["web"].rstrip("/")
HOY = datetime.date.today().isoformat()

DIAS_SCHEMA = {
    "Monday": "Mo", "Tuesday": "Tu", "Wednesday": "We", "Thursday": "Th",
    "Friday": "Fr", "Saturday": "Sa", "Sunday": "Su",
}


def e(t) -> str:
    """Escapa texto para HTML."""
    return html.escape(str(t), quote=True)


def precio(v) -> str:
    if v is None:
        return "Consultar"
    txt = f"{v:.2f}".replace(".", ",")
    if txt.endswith(",00"):
        txt = txt[:-3]
    return txt + " €"


# --------------------------------------------------------------- plantillas

def cabecera(titulo, descripcion, ruta, *, og_img="/assets/img/og.jpg", extra_head="") -> str:
    url = BASE + ruta
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(titulo)}</title>
<meta name="description" content="{e(descripcion)}">
<link rel="canonical" href="{e(url)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101216" media="(prefers-color-scheme: dark)">
<meta name="geo.region" content="ES-MC">
<meta name="geo.placename" content="Beniel, Murcia">

<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="{e(NEG['nombre'])}">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(descripcion)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(BASE + og_img)}">
<meta name="twitter:card" content="summary_large_image">

<link rel="icon" href="/assets/img/favicon.png" sizes="any">
<link rel="apple-touch-icon" href="/assets/img/favicon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="stylesheet" href="/assets/css/styles.css">
{extra_head}
</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido</a>
{barra(ruta)}
<main id="contenido">
"""


def barra(ruta) -> str:
    # "secundario" se oculta en móviles estrechos: el logo ya lleva a Inicio
    # y Nosotros está en el pie.
    enlaces = [("/", "Inicio", True), ("/menu", "Carta", False), ("/nosotros", "Nosotros", True)]
    actual = ' aria-current="page"'
    items = "".join(
        f'<a href="{h}" class="{"secundario" if sec else ""}"{actual if h == ruta else ""}>{t}</a>'
        for h, t, sec in enlaces
    )
    return f"""<header class="barra">
  <div class="contenedor barra__int">
    <a class="barra__logo" href="/" aria-label="{e(NEG['nombre'])} — inicio">
      <img class="logo-img" src="/assets/img/logo-barra.webp" width="416" height="169" alt="{e(NEG['nombre'])}">
    </a>
    <nav class="barra__nav" aria-label="Principal">{items}</nav>
    <a class="btn btn--sm" href="tel:+34{NEG['telefono']}" aria-label="Llamar al {e(NEG['telefonoTexto'])}">Llamar</a>
  </div>
</header>"""


def pie() -> str:
    filas = ""
    for d in NEG["horario"]:
        valor = "Cerrado" if d.get("cerrado") else f"{d['abre']} – {d['cierra']}"
        filas += f"<li><span>{e(d['dia'])}</span> · {e(valor)}</li>"
    dir_ = NEG["direccion"]
    return f"""</main>
<footer class="pie">
  <div class="contenedor pie__grid">
    <div>
      <p class="pie__logo"><img class="logo-img" src="/assets/img/logo-barra.webp" width="416" height="169" alt="{e(NEG['nombre'])}"></p>
      <p>{e(NEG['claim'])}.</p>
    </div>
    <div>
      <h2>Dónde estamos</h2>
      <ul>
        <li><a href="{e(NEG['mapa'])}" rel="noopener">{e(dir_['calle'])}<br>{e(dir_['cp'])} {e(dir_['localidad'])} ({e(dir_['provincia'])})</a></li>
        <li><a href="tel:+34{NEG['telefono']}">{e(NEG['telefonoTexto'])}</a></li>
        <li><a href="{e(NEG['instagram'])}" rel="noopener me">Instagram</a> · <a href="{e(NEG['facebook'])}" rel="noopener me">Facebook</a></li>
      </ul>
    </div>
    <div>
      <h2>Horario</h2>
      <ul>{filas}</ul>
    </div>
  </div>
  <div class="contenedor pie__legal">
    <p>© {datetime.date.today().year} {e(NEG['nombre'])} · <a href="/politica-de-privacidad">Política de privacidad</a></p>
  </div>
</footer>
<script src="/assets/js/venecia.js" defer></script>
</body>
</html>
"""


# ------------------------------------------------------------ datos schema

def schema_restaurante() -> dict:
    dir_ = NEG["direccion"]
    horas = []
    for d in NEG["horario"]:
        if d.get("cerrado"):
            continue
        horas.append({
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": f"https://schema.org/{d['codigo']}",
            "opens": d["abre"],
            "closes": d["cierra"],
        })
    return {
        "@type": "Restaurant",
        "@id": BASE + "/#restaurante",
        "name": NEG["nombre"],
        "description": NEG["descripcion"],
        "url": BASE + "/",
        "telephone": "+34" + NEG["telefono"],
        "image": BASE + "/assets/img/og.jpg",
        "logo": BASE + "/assets/img/logo.webp",
        "priceRange": NEG["rangoPrecios"],
        "servesCuisine": ["Hamburguesas", "Americana", "Comida rápida"],
        "acceptsReservations": "False",
        "currenciesAccepted": "EUR",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": dir_["calle"],
            "postalCode": dir_["cp"],
            "addressLocality": dir_["localidad"],
            "addressRegion": dir_["provincia"],
            "addressCountry": dir_["pais"],
        },
        "areaServed": [dir_["localidad"], "Murcia", "Santomera", "Zeneta"],
        "hasMap": NEG["mapa"],
        "sameAs": [NEG["instagram"], NEG["facebook"]],
        "openingHoursSpecification": horas,
        "hasMenu": BASE + "/menu",
    }


def schema_menu() -> dict:
    secciones = []
    for sec in DATOS["secciones"]:
        items = []
        if sec.get("grupos"):
            for grupo in sec["grupos"]:
                for it in grupo["items"]:
                    items.append(item_schema(it))
        else:
            for it in sec["items"]:
                items.append(item_schema(it))
        bloque = {"@type": "MenuSection", "name": sec["titulo"], "hasMenuItem": items}
        if sec.get("intro"):
            bloque["description"] = sec["intro"]
        secciones.append(bloque)
    return {
        "@type": "Menu",
        "@id": BASE + "/menu#carta",
        "name": f"Carta de {NEG['nombre']}",
        "url": BASE + "/menu",
        "inLanguage": "es-ES",
        "hasMenuSection": secciones,
    }


def item_schema(it) -> dict:
    desc = it.get("descripcion") or ""
    if it.get("ingredientes"):
        desc = (desc + " " if desc else "") + "Ingredientes: " + "; ".join(it["ingredientes"]) + "."
    d = {"@type": "MenuItem", "name": it["nombre"]}
    if desc:
        d["description"] = desc.strip()
    if it.get("img"):
        d["image"] = f"{BASE}/assets/img/{it['img']}.webp"
    if it.get("precio") is not None:
        d["offers"] = {
            "@type": "Offer",
            "price": f"{it['precio']:.2f}",
            "priceCurrency": "EUR",
            "availability": "https://schema.org/InStock",
        }
    return d


def bloque_jsonld(*grafos) -> str:
    doc = {"@context": "https://schema.org", "@graph": list(grafos)}
    return ('<script type="application/ld+json">'
            + json.dumps(doc, ensure_ascii=False, separators=(",", ":"))
            + "</script>")


def total_platos() -> int:
    """Número de platos y bebidas de toda la carta."""
    return sum(
        len(s.get("items", [])) + sum(len(g["items"]) for g in s.get("grupos", []))
        for s in DATOS["secciones"]
    )


# ------------------------------------------------------------------ páginas

def render_plato(it) -> str:
    etiquetas = ""
    if it.get("picante"):
        etiquetas += '<span class="etiqueta etiqueta--picante">🌶 Picante</span>'
    if it.get("para2"):
        etiquetas += '<span class="etiqueta etiqueta--dos">Para 2 personas</span>'
    if it.get("conPatatas"):
        etiquetas += '<span class="etiqueta">Con patatas Canoe</span>'
    if it.get("pollo"):
        etiquetas += '<span class="etiqueta">De pollo</span>'
    if etiquetas:
        etiquetas = f'<div class="etiquetas">{etiquetas}</div>'

    cuerpo = ""
    if it.get("descripcion"):
        cuerpo += f'<p class="plato__desc">{e(it["descripcion"])}</p>'
    if it.get("ingredientes"):
        lis = "".join(f"<li>{e(x)}</li>" for x in it["ingredientes"])
        cuerpo += f'<ul class="plato__ing">{lis}</ul>'
    if it.get("extras"):
        lis = "".join(f"<li>{e(x)}</li>" for x in it["extras"])
        cuerpo += f'<div class="plato__extras"><strong>A elegir</strong><ul class="plato__ing">{lis}</ul></div>'
    if it.get("nota"):
        cuerpo += f'<p class="plato__nota">{e(it["nota"])}</p>'

    if it.get("img"):
        # La foto grande solo se descarga al pulsar (data-grande, no src).
        foto = (
            f'<button class="plato__zoom" type="button" '
            f'data-grande="/assets/img/{it["img"]}-g.webp" '
            f'data-nombre="{e(it["nombre"])}" '
            f'data-precio="{e(precio(it.get("precio")))}" '
            f'aria-label="Ver la foto de {e(it["nombre"])} más grande">'
            f'<img class="plato__foto" src="/assets/img/{it["img"]}.webp" '
            f'width="96" height="96" loading="lazy" decoding="async" '
            f'alt="{e(it["nombre"])}">'
            f'<span class="plato__lupa" aria-hidden="true">'
            f'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="7"/>'
            f'<path d="m20 20-3.5-3.5M11 8v6M8 11h6"/></svg></span>'
            f'</button>'
        )
        clase = "plato"
    else:
        foto = ""
        clase = "plato plato--sinfoto"

    sufijo = ""
    if it.get("conPatatas"):
        sufijo = "<small>con patatas</small>"

    buscable = " ".join(
        [it["nombre"], it.get("descripcion", "")] + it.get("ingredientes", []) + it.get("extras", [])
    )

    return f"""<li class="{clase}" data-buscable="{e(buscable)}">
  {foto}
  <div>
    <div class="plato__cab">
      <h3 class="plato__nombre">{e(it["nombre"])}</h3>
      <div class="plato__precio">{e(precio(it.get("precio")))}{sufijo}</div>
    </div>
    {cuerpo}
    {etiquetas}
  </div>
</li>"""


def render_bebidas(sec) -> str:
    out = '<div class="bebidas">'
    for grupo in sec["grupos"]:
        out += f'<h3>{e(grupo["titulo"])}</h3><ul>'
        for it in grupo["items"]:
            out += (f'<li data-buscable="{e(it["nombre"])}">'
                    f'<span class="b-nombre">{e(it["nombre"])}</span>'
                    f'<span class="b-puntos" aria-hidden="true"></span>'
                    f'<span class="b-precio">{e(precio(it.get("precio")))}</span></li>')
        out += "</ul>"
    return out + "</div>"


def pagina_menu() -> str:
    chips = "".join(
        f'<a href="#{s["id"]}">{s.get("emoji","")} {e(s["titulo"])}</a>'
        for s in DATOS["secciones"]
    )

    secciones = ""
    for s in DATOS["secciones"]:
        intro = f'<p class="seccion__intro">{e(s["intro"])}</p>' if s.get("intro") else ""
        if s.get("grupos"):
            cuerpo = render_bebidas(s)
        else:
            cuerpo = '<ul class="platos">' + "".join(render_plato(i) for i in s["items"]) + "</ul>"
        secciones += f"""<section class="seccion" id="{s['id']}" aria-labelledby="t-{s['id']}">
  <h2 id="t-{s['id']}"><span aria-hidden="true">{s.get('emoji','')}</span> {e(s['titulo'])}</h2>
  {intro}
  {cuerpo}
</section>"""

    migas = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": BASE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Carta", "item": BASE + "/menu"},
        ],
    }

    n_platos = total_platos()

    desc = ("Carta completa de Burger Bar Venecia (Beniel, Murcia): burgers de 200 g de vacuno "
            "nacional con todos sus ingredientes y precios, entrantes, sándwiches brioche, "
            "menú kids, postres y bebidas.")

    return (
        cabecera("Carta y precios | Burger Bar Venecia — Beniel (Murcia)", desc, "/menu",
                 extra_head=bloque_jsonld(schema_restaurante(), schema_menu(), migas))
        + f"""
<div class="contenedor carta-cab">
  <h1>Nuestra carta</h1>
  <p>{n_platos} platos con todos sus ingredientes y precios. Actualizada a {HOY[8:10]}/{HOY[5:7]}/{HOY[0:4]}.</p>
</div>

<div class="filtros">
  <div class="contenedor">
    <div class="buscador">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      <label class="saltar" for="buscar">Buscar en la carta</label>
      <input id="buscar" type="search" placeholder="Buscar: bacon, trufa, pollo…" autocomplete="off" enterkeyhint="search">
      <button class="buscador__limpiar" type="button" aria-label="Borrar búsqueda" hidden>×</button>
    </div>
    <nav class="chips" aria-label="Categorías de la carta">{chips}</nav>
  </div>
</div>

<div class="contenedor">
  <div class="aviso">
    <span aria-hidden="true">🍟</span>
    <p>{e(DATOS['avisos']['burgersExtra'])} {e(DATOS['avisos']['alergenos'])}</p>
  </div>

  <p id="sin-resultados" class="sin-resultados" hidden>No hay ningún plato con ese nombre o ingrediente.</p>

  {secciones}
</div>

<a class="btn btn--fantasma volver-arriba" href="#contenido">↑ Categorías</a>

<dialog class="lupa" id="lupa" aria-label="Foto del plato">
  <button class="lupa__cerrar" type="button" aria-label="Cerrar la foto">&times;</button>
  <figure>
    <img id="lupa-foto" alt="">
    <figcaption>
      <strong id="lupa-nombre"></strong>
      <span id="lupa-precio"></span>
    </figcaption>
  </figure>
</dialog>
"""
        + pie()
    )


def pagina_inicio() -> str:
    filas = ""
    hoy_idx = datetime.date.today().weekday()
    for i, d in enumerate(NEG["horario"]):
        valor = "Cerrado" if d.get("cerrado") else f"{d['abre']} – {d['cierra']}"
        marca = ' data-hoy="1"' if i == hoy_idx else ""
        filas += f"<tr{marca}><th scope=\"row\">{e(d['dia'])}</th><td>{e(valor)}</td></tr>"

    horario_js = json.dumps(
        [{"dia": d["dia"], "abre": d.get("abre"), "cierra": d.get("cierra")} for d in NEG["horario"]],
        ensure_ascii=False,
    )

    destacadas = [
        ("clasica", "Clásica", "10,50 €"),
        ("tio-jack", "Tío Jack", "12 €"),
        ("pistagocha", "Pistagocha", "12 €"),
        ("fire-fox", "Fire Fox", "11 €"),
    ]
    cards = "".join(
        f'<a class="destacado" href="/menu#burgers">'
        f'<img src="/assets/img/{img}.webp" width="200" height="200" loading="lazy" decoding="async" alt="Hamburguesa {e(n)}">'
        f'<span>{e(n)}<b>{e(p)}</b></span></a>'
        for img, n, p in destacadas
    )

    dir_ = NEG["direccion"]
    desc = ("Hamburguesería en Beniel (Murcia). Burgers artesanales de 200 g de vacuno 100% nacional "
            "y pan brioche. Consulta la carta completa con ingredientes y precios.")

    return (
        cabecera(f"Hamburguesería en Beniel (Murcia) | {NEG['nombre']}", desc, "/",
                 extra_head=bloque_jsonld(schema_restaurante()))
        + f"""
<div class="contenedor">
  <div class="hero">
    <img class="hero__logo logo-img" src="/assets/img/logo.webp" width="200" height="129" fetchpriority="high" alt="{e(NEG['nombre'])}">
    <h1>Hamburguesería artesanal en Beniel</h1>
    <p>{e(NEG['claim'])}.</p>
    <span class="estado" data-estado data-horario='{horario_js}' hidden></span>
    <div class="hero__acciones">
      <a class="btn" href="/menu">Ver la carta</a>
      <a class="btn btn--fantasma" href="tel:+34{NEG['telefono']}">Llamar y reservar</a>
    </div>
  </div>

  <h2>Las más pedidas</h2>
  <div class="destacados">{cards}</div>

  <div class="tarjetas">
    <div class="tarjeta">
      <h2>Dónde estamos</h2>
      <p>{e(dir_['calle'])}<br>{e(dir_['cp'])} {e(dir_['localidad'])} ({e(dir_['provincia'])})</p>
      <p><a class="btn btn--fantasma btn--sm" href="{e(NEG['mapa'])}" rel="noopener">Cómo llegar</a></p>
    </div>
    <div class="tarjeta">
      <h2>Horario</h2>
      <table class="horario"><tbody>{filas}</tbody></table>
    </div>
  </div>

  <div class="tarjeta">
    <h2>Carne 100% vacuno nacional, pan brioche y salsas propias</h2>
    <p>Desde 2017 en la Plaza Ramón y Cajal de Beniel. Empezamos como cafetería y acabamos
    encontrando lo que de verdad nos apasiona: las hamburguesas. Cada burger lleva 200 g de carne
    de vacuno 100% nacional, pan brioche de Juanito Baker y salsas que preparamos nosotros.</p>
    <p><a href="/menu">Ver los {total_platos()} platos de la carta</a>
    · <a href="/nosotros">Conócenos</a></p>
  </div>
</div>
"""
        + pie()
    )


def pagina_nosotros() -> str:
    migas = {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": BASE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Nosotros", "item": BASE + "/nosotros"},
        ],
    }
    desc = ("Somos Burger Bar Venecia, en Beniel (Murcia). Abrimos en 2017 y desde entonces "
            "cocinamos hamburguesas con ingredientes frescos y recetas propias.")
    return (
        cabecera(f"Nosotros | {NEG['nombre']}", desc, "/nosotros",
                 extra_head=bloque_jsonld(schema_restaurante(), migas))
        + f"""
<div class="contenedor">
  <div class="hero">
    <h1>Nuestra historia</h1>
  </div>
  <p>Somos <strong>{e(NEG['nombre'])}</strong>. Abrimos nuestras puertas en 2017 como una pequeña
  cafetería y, desde entonces, hemos recorrido un camino lleno de experiencias. Probamos diferentes
  conceptos hasta encontrar lo que realmente nos apasiona: ¡las hamburguesas! Y parece que a
  vosotros también os encantaron.</p>

  <p>Nuestra filosofía se basa en la calidad y frescura de los ingredientes, la precisión y rapidez
  en el servicio, y el cuidado en cada detalle. No solo cocinamos: creamos una experiencia.</p>

  <p>Cada día trabajamos para mejorar nuestro espacio, desarrollar nuevas recetas e ideas y seguir
  sorprendiendo. Crecemos gracias a vosotros. ¡Gracias por elegirnos!</p>

  <div class="tarjeta">
    <h2>Ven a probarnos</h2>
    <p>{e(NEG['direccion']['calle'])}, {e(NEG['direccion']['cp'])} {e(NEG['direccion']['localidad'])} ({e(NEG['direccion']['provincia'])})</p>
    <p><a class="btn" href="/menu">Ver la carta</a></p>
  </div>
</div>
"""
        + pie()
    )


# -------------------------------------------------------------------- salida

def escribir(ruta: str, contenido: str) -> None:
    destino = RAIZ / ruta
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(contenido, encoding="utf-8")
    print(f"  {ruta:<28} {len(contenido.encode()) / 1024:6.1f} KB")


def sitemap() -> str:
    urls = [("/", "1.0", "weekly"), ("/menu", "0.9", "weekly"), ("/nosotros", "0.5", "monthly")]
    cuerpo = "".join(
        f"<url><loc>{BASE}{u}</loc><lastmod>{HOY}</lastmod>"
        f"<changefreq>{c}</changefreq><priority>{p}</priority></url>"
        for u, p, c in urls
    )
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            + cuerpo + "</urlset>\n")


def pagina_privacidad() -> str:
    return (
        cabecera(f"Política de privacidad y cookies | {NEG['nombre']}",
                 "Información sobre el tratamiento de datos y el uso de cookies en la web de "
                 "Burger Bar Venecia.",
                 "/politica-de-privacidad",
                 extra_head='<meta name="robots" content="noindex, follow">')
        + f"""
<div class="contenedor">
  <div class="hero"><h1>Política de privacidad y cookies</h1></div>

  <h2>Responsable</h2>
  <p>{e(NEG['nombre'])} · {e(NEG['direccion']['calle'])}, {e(NEG['direccion']['cp'])}
  {e(NEG['direccion']['localidad'])} ({e(NEG['direccion']['provincia'])}) ·
  Teléfono: <a href="tel:+34{NEG['telefono']}">{e(NEG['telefonoTexto'])}</a></p>

  <h2>Datos personales</h2>
  <p>Esta web es informativa: muestra la carta, el horario y la forma de contacto del
  restaurante. No incluye formularios ni ningún sistema de registro, por lo que
  <strong>no se recogen datos personales a través del sitio</strong>. Si nos llamas o nos
  escribes por redes sociales, usamos tus datos únicamente para atender tu consulta o tu
  reserva y no los cedemos a terceros salvo obligación legal.</p>

  <h2>Cookies</h2>
  <p>Las cookies son pequeñas cantidades de información que se almacenan en el navegador
  para que un sitio web recuerde datos entre visitas. <strong>Esta web no instala cookies
  propias ni de terceros</strong> y no utiliza herramientas de analítica ni de publicidad.
  Tampoco carga recursos externos (fuentes, mapas o vídeos incrustados) que pudieran
  instalarlas.</p>
  <p>Si en el futuro se añadiera cualquier servicio que use cookies, se solicitará tu
  consentimiento previo y se actualizará esta página. En cualquier caso, puedes
  deshabilitar, rechazar y eliminar cookies desde la configuración de tu navegador.</p>

  <h2>Tus derechos</h2>
  <p>Puedes ejercer los derechos de acceso, rectificación, supresión, oposición, limitación
  y portabilidad escribiéndonos a la dirección indicada arriba. También puedes reclamar ante
  la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener">aepd.es</a>).</p>

  <h2>Enlaces externos</h2>
  <p>Esta web enlaza a perfiles de Instagram y Facebook y a Google Maps. Al acceder a ellos
  te aplican las políticas de privacidad de esos servicios.</p>
</div>
"""
        + pie()
    )


# URLs del sitio antiguo (una página por plato) → destino en la nueva carta.
# Se sirven como 301 para no perder el posicionamiento ya conseguido.
REDIRECCIONES = [
    ("/inicio", "/"),
    ("/cerrado-por-vacaciones", "/"),
    ("/alergenos", "/menu"),
    ("/burgers", "/menu#burgers"),
    ("/entrantes", "/menu#entrantes"),
    ("/sandwiches-briche", "/menu#sandwiches"),
    ("/menu-kids", "/menu#kids"),
    ("/postres", "/menu#postres"),
    ("/bebidas", "/menu#bebidas"),
] + [
    (f"/{slug}", "/menu#burgers") for slug in [
        "big-gublins1", "agila-dorada", "la-yucatana", "hannibal", "bad-bro",
        "amor-prohibido", "emmily", "presumida", "pistagocha", "chees-bacon",
        "camelot", "iberica", "trufada", "mamba", "marty", "lotus", "clasica",
        "tio-jack", "lady-goat", "fire-fox", "cryspy-pollo", "cryspy-cesar",
        "bad-chicken",
    ]
] + [
    (f"/{slug}", "/menu#entrantes") for slug in [
        "patatas-lotus", "patatas-de-bacon", "patatas-pulled-pork", "patatas-trufadas",
        "patatas-vulcano", "bocaditos-de-pulled-pork", "bocaditos-italianos",
        "bocaditos-de-trufa", "medallones-de-queso-camembert", "tequenos-de-queso",
        "nachos-fritos-rellenos-de-queso-cheddar", "nachos-pulled-pork", "pollo-cajun",
        "solomillo-de-pollo-kentucky", "bolitas-de-chedar-con-jalapeno", "nuggets-de-pollo",
        "croquetas-de-jamon", "croquetas-de-setas", "croquetas-de-cecina",
    ]
]


def redirecciones_netlify() -> str:
    lineas = [f"{o:<48} {d:<20} 301" for o, d in REDIRECCIONES]
    return "# Redirecciones 301 de las URLs antiguas a la carta única\n" + "\n".join(lineas) + "\n"


def redirecciones_apache() -> str:
    cuerpo = "\n".join(f"Redirect 301 {o} {BASE}{d}" for o, d in REDIRECCIONES)
    return f"""# Burger Bar Venecia — configuración Apache
# Redirecciones 301 de las URLs del sitio antiguo
{cuerpo}

# Compresión
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml application/json
</IfModule>

# Caché de estáticos
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/png  "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType text/css   "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html  "access plus 1 hour"
</IfModule>

# URLs limpias sin /index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{{REQUEST_FILENAME}} !-f
  RewriteCond %{{REQUEST_FILENAME}}/index.html -f
  RewriteRule ^(.*)$ /$1/index.html [L]
</IfModule>
"""


def main() -> None:
    print("Generando el sitio…")
    escribir("index.html", pagina_inicio())
    escribir("menu/index.html", pagina_menu())
    escribir("nosotros/index.html", pagina_nosotros())
    escribir("politica-de-privacidad/index.html", pagina_privacidad())
    escribir("sitemap.xml", sitemap())
    escribir("_redirects", redirecciones_netlify())
    escribir(".htaccess", redirecciones_apache())
    print("Listo.")


if __name__ == "__main__":
    main()
