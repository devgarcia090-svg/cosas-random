#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generador estático del sitio de Sí Camper.
Ensambla la cabecera, el pie y los metadatos comunes con el cuerpo de cada
página para que todo quede consistente. Uso:  python3 _construir.py
"""
import os, re, datetime

DIR = os.path.dirname(os.path.abspath(__file__))
DOMINIO = "https://sicamper.com"

TEL      = "+34 670 64 08 76"
TEL_URL  = "+34670640876"
WA       = "https://wa.me/34670640876?text=Hola%2C%20me%20gustar%C3%ADa%20alquilar%20una%20autocaravana"
EMAIL    = "info@sicamper.com"
DIRECCION= "C/ de la Terra Alta, 29 · 08211 Castellar del Vallès, Barcelona"
MAPS     = "https://maps.google.com/?q=C%2F+de+la+Terra+Alta,+29,+08211+Castellar+del+Vall%C3%A8s,+Barcelona"

# ── Iconos SVG reutilizables ────────────────────────────────────────────────
def ico(d, extra=""):
    return ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" %s>%s</svg>' % (extra, d))

I = {
 "camper":   ico('<path d="M3 17V8a2 2 0 0 1 2-2h9l3 3h2a2 2 0 0 1 2 2v6h-2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M9 17h6M7 10h4v3H7z"/>'),
 "casa":     ico('<path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 21v-7h6v7"/>'),
 "reloj":    ico('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
 "escudo":   ico('<path d="M12 3 5 6v6c0 4.2 2.9 7.9 7 9 4.1-1.1 7-4.8 7-9V6z"/><path d="m9 12 2 2 4-4"/>'),
 "auricular":ico('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2zM20 14a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2z"/><path d="M18 18v1a3 3 0 0 1-3 3h-2"/>'),
 "carrito":  ico('<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 11.2a2 2 0 0 0 2 1.5h7.9a2 2 0 0 0 2-1.6L21 7H6"/>'),
 "mascota":  ico('<path d="M11 5.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM17 5.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM6.5 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM21.5 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/><path d="M12 10c2.8 0 5 2.4 5 5.2 0 2-1.3 3.3-3 3.3-.9 0-1.4-.4-2-.4s-1.1.4-2 .4c-1.7 0-3-1.3-3-3.3C7 12.4 9.2 10 12 10Z"/>'),
 "euro":     ico('<path d="M16.5 6.5A6.5 6.5 0 1 0 16.5 17.5"/><path d="M3.5 10h9M3.5 14h9"/>'),
 "mapa":     ico('<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'),
 "tel":      ico('<path d="M6.6 3h3l1.5 4-2 1.4a11 11 0 0 0 5.5 5.5l1.4-2 4 1.5v3A2 2 0 0 1 18 18.4 15 15 0 0 1 5.6 6 2 2 0 0 1 6.6 3Z"/>'),
 "correo":   ico('<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>'),
 "calendar": ico('<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/>'),
 "cama":     ico('<path d="M3 18v-7a2 2 0 0 1 2-2h9a4 4 0 0 1 4 4v5M3 14h18M3 18h18"/><circle cx="7.5" cy="12" r="1.6"/>'),
 "ducha":    ico('<path d="M4 20V8a4 4 0 0 1 8 0M12 8h9"/><path d="M15 12v.01M18 12v.01M15 16v.01M18 16v.01"/>'),
 "cocina":   ico('<path d="M6 3v7M9 3v7M6 10h3v11H6zM15 3c-1.5 2-1.5 4 0 6 1.5 2 1.5 4 0 6v6h3V3z"/>'),
 "sol":      ico('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
 "bici":     ico('<circle cx="6" cy="17" r="3.2"/><circle cx="18" cy="17" r="3.2"/><path d="m9 17 3.5-7h3M11 10h5l2 7M8 10h4"/>'),
 "nino":     ico('<circle cx="12" cy="6" r="3"/><path d="M8 21v-4l-2-1 1.5-4A2 2 0 0 1 9.4 11h5.2a2 2 0 0 1 1.9 1l1.5 4-2 1v4"/>'),
 "tienda":   ico('<path d="M12 4 3 20h18z"/><path d="m12 4v16M8.5 20l3.5-6 3.5 6"/>'),
 "avion":    ico('<path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 0 0-3-3L13 8 4.8 6.2a1 1 0 0 0-.9 1.7L9 11l-2 4-2.5.5.7 2 2-.6L11 15l3.1 5.1a1 1 0 0 0 1.7-.9Z"/>'),
 "chispa":   ico('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>'),
 "estrella": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>',
 "wa":       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-1.6-.1a12 12 0 0 1-4.4-2.8 10 10 0 0 1-2-3c-.2-.6-.2-1.2 0-1.7.2-.4.9-1.2 1.2-1.3.3-.1.7-.1.9.1l.9 1.6c.1.3 0 .5-.1.7l-.5.6c-.1.2-.2.3 0 .6.5.9 1.6 2 2.6 2.5.3.1.5.1.6 0l.7-.8c.2-.2.4-.2.6-.1l1.6.9c.2.1.3.4.3.6-.1.3-.2.6-.3.8Z"/></svg>',
 "ig":       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2c2.7 0 3 0 4.1.1 1 0 1.7.2 2.3.4.6.3 1.1.6 1.6 1.1.5.5.8 1 1.1 1.6.2.6.4 1.3.4 2.3V16.6c0 1-.2 1.7-.4 2.3-.3.6-.6 1.1-1.1 1.6-.5.5-1 .8-1.6 1.1-.6.2-1.3.4-2.3.4H7.4c-1 0-1.7-.2-2.3-.4-.6-.3-1.1-.6-1.6-1.1-.5-.5-.8-1-1.1-1.6-.2-.6-.4-1.3-.4-2.3V7.4c0-1 .2-1.7.4-2.3.3-.6.6-1.1 1.1-1.6.5-.5 1-.8 1.6-1.1.6-.2 1.3-.4 2.3-.4H12Zm0 1.8H7.5c-.9 0-1.4.2-1.7.3-.4.2-.7.4-1 .7-.3.3-.5.6-.7 1-.1.3-.3.8-.3 1.7v9c0 .9.2 1.4.3 1.7.2.4.4.7.7 1 .3.3.6.5 1 .7.3.1.8.3 1.7.3h9c.9 0 1.4-.2 1.7-.3.4-.2.7-.4 1-.7.3-.3.5-.6.7-1 .1-.3.3-.8.3-1.7v-9c0-.9-.2-1.4-.3-1.7a2.7 2.7 0 0 0-.7-1 2.7 2.7 0 0 0-1-.7c-.3-.1-.8-.3-1.7-.3H12Zm0 3.1a5.1 5.1 0 1 1 0 10.2 5.1 5.1 0 0 1 0-10.2Zm0 1.8a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6Zm5.4-2.9a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"/></svg>',
 "fb":       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 21v-8h2.8l.4-3.2h-3.2V7.7c0-.9.3-1.5 1.6-1.5h1.7V3.3c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.3V13h2.8v8z"/></svg>',
 "yt":       '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8ZM10 15.2V8.8l5.5 3.2z"/></svg>',
 "lupa":     ico('<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>'),
 "flecha":   ico('<path d="M5 12h14M13 6l6 6-6 6"/>'),
}

LOGO_SVG = ('<svg viewBox="9.5 4.5 38 25.5" fill="none" aria-hidden="true" focusable="false">'
 '<path d="M14 6.5h13.5l4.5 5H43a3.5 3.5 0 0 1 3.5 3.5v6.5a3.5 3.5 0 0 1-3.5 3.5H14a3.5 3.5 0 0 1-3.5-3.5V10a3.5 3.5 0 0 1 3.5-3.5Z" fill="#007FFF"/>'
 '<rect x="34.6" y="14" width="8.6" height="5.4" rx="1.6" fill="#fff" opacity=".9"/>'
 '<circle cx="18.5" cy="25.6" r="3.7" fill="currentColor"/><circle cx="18.5" cy="25.6" r="1.5" fill="#007FFF"/>'
 '<circle cx="38" cy="25.6" r="3.7" fill="currentColor"/><circle cx="38" cy="25.6" r="1.5" fill="#007FFF"/>'
 '</svg>')

def logo(clase=""):
    return ('<a class="logo %s" href="index.html" aria-label="Sí Camper · inicio">%s'
            '<span class="logo-txt"><em>Sí</em> camper</span></a>' % (clase, LOGO_SVG))

# ── Menú ────────────────────────────────────────────────────────────────────
CARET = '<svg class="caret" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m2.5 4.5 3.5 3.5 3.5-3.5"/></svg>'

SUBMENU_ALQUILER = [
    ("precios.html",      "Precios y presupuesto",  "Tarifas por temporada y calculadora"),
    ("autocaravana.html", "La autocaravana",        "McLouis Glamys · 7 plazas"),
    ("servicios.html",    "Servicios y extras",     "Lo que va incluido y lo opcional"),
    ("reservar.html",     "Reservar",               "Comprueba fechas y solicita"),
]
MENU = [
    ("Alquiler", None, SUBMENU_ALQUILER),
    ("Localidades", "localidades.html", None),
    ("Preguntas frecuentes", "faq.html", None),
    ("Venta de ocasión", "venta.html", None),
    ("Contacto", "contacto.html", None),
]

def menu_escritorio(actual):
    out = ['<ul class="menu">']
    for texto, href, sub in MENU:
        if sub:
            act = ' aria-current="page"' if actual in [s[0] for s in sub] else ''
            out.append('<li><button class="mp" type="button" aria-expanded="false"%s>%s%s</button><ul class="submenu">' % (act, texto, CARET))
            for h, t, d in sub:
                out.append('<li><a href="%s"%s>%s<span>%s</span></a></li>' % (h, ' aria-current="page"' if h == actual else '', t, d))
            out.append('</ul></li>')
        else:
            out.append('<li><a href="%s"%s>%s</a></li>' % (href, ' aria-current="page"' if href == actual else '', texto))
    out.append('</ul>')
    return "".join(out)

def cajon_movil():
    out = ['<div class="cajon" id="cajon"><nav aria-label="Menú principal"><ul>']
    for texto, href, sub in MENU:
        if sub:
            out.append('<li class="grupo"><button type="button" aria-expanded="false">%s%s</button><ul>' % (texto, CARET))
            for h, t, d in sub:
                out.append('<li><a href="%s">%s</a></li>' % (h, t))
            out.append('</ul></li>')
        else:
            out.append('<li><a href="%s">%s</a></li>' % (href, texto))
    out.append('</ul></nav>')
    out.append('<div class="cajon-pie">'
               '<a class="btn btn-primario btn-bloque" href="reservar.html">Comprobar fechas y reservar</a>'
               '<a class="btn btn-linea btn-bloque" href="%s" rel="noopener">%s WhatsApp</a></div>' % (WA, I["wa"]))
    out.append('<div class="cajon-contacto"><a href="tel:%s">%s</a><a href="mailto:%s">%s</a>'
               '<span>%s</span></div>' % (TEL_URL, TEL, EMAIL, EMAIL, DIRECCION))
    out.append('</div>')
    return "".join(out)

def cabecera(actual, sobre_hero):
    clase = "cabecera sobre-hero" if sobre_hero else "cabecera fija"
    return ('<header class="%s">'
            '<div class="env">%s%s'
            '<div class="cabecera-cta">'
            '<button class="btn-tema" type="button" aria-label="Cambiar entre tema claro y oscuro">'
            '<span class="icono-sol">%s</span><span class="icono-luna">%s</span></button>'
            '<a class="btn btn-primario btn-sm" href="reservar.html">Reservar</a></div>'
            '<button class="hamb" type="button" aria-expanded="false" aria-controls="cajon" aria-label="Abrir menú">'
            '<span></span><span></span><span></span></button>'
            '</div></header>%s') % (
        clase, logo(), menu_escritorio(actual),
        I["sol"],
        ico('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>'),
        cajon_movil())

LOCALIDADES = ["Castellar del Vallès","Sabadell","Terrassa","Barberà del Vallès","Cerdanyola del Vallès",
               "Caldes de Montbui","Parets del Vallès","Granollers","Mollet del Vallès","La Roca del Vallès"]

def pie():
    locs = "".join('<li><a href="localidades.html#%s">%s</a></li>' % (
        re.sub(r'[^a-z]+','-', l.lower().replace('à','a').replace('è','e')), l) for l in LOCALIDADES[:6])
    return """<footer class="pie">
  <div class="env pie-top">
    <div class="sobre">
      %s
      <p>Alquiler de autocaravanas en Barcelona con entrega a domicilio y sin horarios. Un proyecto personal de Ismael, apasionado del caravaning.</p>
      <div class="pie-contacto">
        <a href="tel:%s">%s<span>%s</span></a>
        <a href="mailto:%s">%s<span>%s</span></a>
        <a href="%s" rel="noopener">%s<span>%s</span></a>
      </div>
      <div class="redes">
        <a href="https://www.instagram.com/sicamper.autocaravanas/" rel="noopener" aria-label="Instagram">%s</a>
        <a href="https://www.facebook.com/sicamper.autocaravanas" rel="noopener" aria-label="Facebook">%s</a>
        <a href="https://www.youtube.com/@sicamper" rel="noopener" aria-label="YouTube">%s</a>
        <a href="%s" rel="noopener" aria-label="WhatsApp">%s</a>
      </div>
    </div>
    <div>
      <h4>Alquiler</h4>
      <ul>
        <li><a href="precios.html">Precios y presupuesto</a></li>
        <li><a href="autocaravana.html">La autocaravana</a></li>
        <li><a href="servicios.html">Servicios y extras</a></li>
        <li><a href="reservar.html">Reservar</a></li>
        <li><a href="venta.html">Venta de ocasión</a></li>
      </ul>
    </div>
    <div>
      <h4>Zonas de entrega</h4>
      <ul>%s<li><a href="localidades.html">Ver todas →</a></li></ul>
    </div>
    <div>
      <h4>Información</h4>
      <ul>
        <li><a href="faq.html">Preguntas frecuentes</a></li>
        <li><a href="contacto.html">Contacto</a></li>
        <li><a href="faq.html#condiciones">Condiciones de alquiler</a></li>
        <li><a href="legal.html">Aviso legal y privacidad</a></li>
      </ul>
    </div>
  </div>
  <div class="env pie-bajo">
    <span>© <span data-anio>2026</span> Autocaravanas Sí Camper · Ismael Lázaro Cifuentes</span>
    <ul>
      <li><a href="legal.html">Aviso legal</a></li>
      <li><a href="legal.html#privacidad">Privacidad</a></li>
      <li><a href="legal.html#cookies">Cookies</a></li>
    </ul>
  </div>
</footer>

<div class="barra-movil">
  <a href="tel:%s">%s Llamar</a>
  <a href="%s" rel="noopener">%s WhatsApp</a>
  <a class="destacado" href="reservar.html">%s Reservar</a>
</div>

<a class="wa-flot" href="%s" rel="noopener">%s Escríbeme por WhatsApp</a>

<div class="cookies" role="dialog" aria-label="Aviso de cookies">
  <p>Uso cookies propias para que la web funcione. Si me das permiso, también de analítica para saber qué páginas resultan útiles.</p>
  <div class="acciones">
    <button class="btn btn-primario btn-sm" data-cookies="todo" type="button">Aceptar todas</button>
    <button class="btn btn-linea btn-sm" data-cookies="solo-necesarias" type="button">Solo necesarias</button>
  </div>
</div>

<div class="visor" role="dialog" aria-label="Galería de fotos" aria-modal="true">
  <button class="cerrar" type="button" aria-label="Cerrar galería">%s</button>
  <button class="nav-v prev" type="button" aria-label="Foto anterior">%s</button>
  <img src="" alt="">
  <button class="nav-v next" type="button" aria-label="Foto siguiente">%s</button>
  <p class="contador"></p>
</div>
""" % (logo(), TEL_URL, I["tel"], TEL, EMAIL, I["correo"], EMAIL, MAPS, I["mapa"], DIRECCION,
       I["ig"], I["fb"], I["yt"], WA, I["wa"], locs,
       TEL_URL, I["tel"], WA, I["wa"], I["calendar"], WA, I["wa"],
       ico('<path d="M6 6l12 12M18 6 6 18"/>'),
       ico('<path d="M15 5l-7 7 7 7"/>'),
       ico('<path d="M9 5l7 7-7 7"/>'))

# ── JSON-LD del negocio ─────────────────────────────────────────────────────
NEGOCIO_LD = """{
  "@context": "https://schema.org",
  "@type": "AutoRental",
  "@id": "%s/#negocio",
  "name": "Autocaravanas Sí Camper",
  "description": "Alquiler de autocaravanas en Barcelona con entrega a domicilio y sin horarios.",
  "url": "%s/",
  "telephone": "%s",
  "email": "%s",
  "priceRange": "€€",
  "image": "%s/img/hero.webp",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "C/ de la Terra Alta, 29",
    "postalCode": "08211",
    "addressLocality": "Castellar del Vallès",
    "addressRegion": "Barcelona",
    "addressCountry": "ES"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 41.6169, "longitude": 2.0897 },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"],
    "opens": "00:00", "closes": "23:59"
  },
  "areaServed": ["Barcelona","Vallès Occidental","Vallès Oriental","Maresme","Girona","Tarragona","Lleida"],
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "5", "reviewCount": "9", "bestRating": "5" },
  "sameAs": ["https://www.instagram.com/sicamper.autocaravanas/","https://www.facebook.com/sicamper.autocaravanas"]
}""" % (DOMINIO, DOMINIO, TEL, EMAIL, DOMINIO)

PLANTILLA = """<!DOCTYPE html>
<html lang="es" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{dominio}/{ruta}">
<meta name="theme-color" content="#0C1420" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#FBF9F5" media="(prefers-color-scheme: light)">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta name="author" content="Autocaravanas Sí Camper">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Sí Camper">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="{titulo}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{dominio}/{ruta}">
<meta property="og:image" content="{dominio}/img/{og}.webp">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{titulo}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="{dominio}/img/{og}.webp">

<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="favicon.svg">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@400..700&display=swap">
<link rel="stylesheet" href="tema.css">
{preload}
<script type="application/ld+json">{negocio}</script>
{ld}
</head>
<body>
<a class="salta" href="#principal">Saltar al contenido</a>
{cabecera}
<main id="principal">
{cuerpo}
</main>
{pie}
<script src="tema.js" defer></script>
</body>
</html>
"""

PAGINAS = []   # se rellena desde los módulos de contenido

def registrar(**kw):
    PAGINAS.append(kw)

def construir():
    for p in PAGINAS:
        html = PLANTILLA.format(
            titulo=p["titulo"], desc=p["desc"], ruta=p["ruta"], dominio=DOMINIO,
            og=p.get("og", "hero"),
            preload=('<link rel="preload" as="image" href="img/%s.webp" fetchpriority="high">' % p["preload"]) if p.get("preload") else "",
            negocio=NEGOCIO_LD, ld=p.get("ld", ""),
            cabecera=cabecera(p["archivo"], p.get("sobre_hero", True)),
            cuerpo=p["cuerpo"], pie=pie())
        with open(os.path.join(DIR, p["archivo"]), "w", encoding="utf-8") as f:
            f.write(html)
        print("  ✓ %-22s %6.1f KB" % (p["archivo"], len(html) / 1024))

    # Sitemap
    hoy = datetime.date.today().isoformat()
    urls = "".join(
        '  <url><loc>%s/%s</loc><lastmod>%s</lastmod><priority>%s</priority></url>\n'
        % (DOMINIO, p["ruta"], hoy, p.get("prio", "0.7")) for p in PAGINAS)
    with open(os.path.join(DIR, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?>\n'
                '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % urls)
    print("  ✓ sitemap.xml")
