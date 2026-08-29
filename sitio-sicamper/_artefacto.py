#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Empaqueta el sitio en un único HTML autocontenido, para poder verlo y
navegarlo sin servidor. Las diez páginas quedan en el mismo documento y un
enrutador mínimo cambia entre ellas; las fotos van incrustadas en base64.

Uso:  python3 _artefacto.py [salida.html]
"""
import base64, os, re, sys

DIR = os.path.dirname(os.path.abspath(__file__))
SALIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(DIR, "_vista-previa.html")

PAGINAS = [
    ("index", "Portada"), ("precios", "Precios"), ("autocaravana", "La autocaravana"),
    ("servicios", "Servicios y extras"), ("reservar", "Reservar"),
    ("localidades", "Zonas de entrega"), ("venta", "Venta de ocasión"),
    ("faq", "Preguntas frecuentes"), ("contacto", "Contacto"), ("legal", "Legal"),
]

def leer(n):
    with open(os.path.join(DIR, n), encoding="utf-8") as f:
        return f.read()

def trozo(html, etiqueta):
    """Devuelve el contenido interior de la primera etiqueta indicada."""
    m = re.search(r"<%s[^>]*>(.*)</%s>" % (etiqueta, etiqueta), html, re.S)
    return m.group(1) if m else ""

# ── Fotos a base64 ─────────────────────────────────────────────────────────
fotos = {}
for f in sorted(os.listdir(os.path.join(DIR, "img"))):
    ruta = os.path.join(DIR, "img", f)
    fotos["img/" + f] = "data:image/webp;base64," + base64.b64encode(open(ruta, "rb").read()).decode()
print("fotos incrustadas: %d (%.1f MB en base64)"
      % (len(fotos), sum(len(v) for v in fotos.values()) / 1024 / 1024))

def incrustar(html):
    """Cada foto se escribe una sola vez: en el HTML queda una referencia y un
    script le pone el src. Si no, las fotos que salen en varias páginas se
    duplicarían y el archivo pesaría el doble."""
    for rel in fotos:
        clave = os.path.splitext(os.path.basename(rel))[0]
        html = html.replace('src="%s"' % rel, 'data-foto="%s"' % clave)
    html = re.sub(r'<iframe[^>]*openstreetmap[^>]*></iframe>',
                  '<div class="mapa mapa-off"><p>El mapa se carga desde OpenStreetMap y en esta '
                  'vista previa de un solo archivo no est&#225; disponible.</p></div>', html)
    return html

def mapa_fotos():
    pares = ",\n".join('"%s":"%s"' % (os.path.splitext(os.path.basename(k))[0], v)
                        for k, v in sorted(fotos.items()))
    return ("var FOTOS = {\n%s\n};\n"
            "[].forEach.call(document.querySelectorAll('img[data-foto]'), function (i) {\n"
            "  var d = FOTOS[i.dataset.foto]; if (d) i.src = d;\n"
            "});\n") % pares

# ── Cabecera, pie y páginas ────────────────────────────────────────────────
base = leer("index.html")
cabecera = re.search(r"(<header class=\"cabecera.*?</header>)", base, re.S).group(1)
cabecera = cabecera.replace('class="cabecera sobre-hero"', 'class="cabecera sobre-hero"')
cajon = re.search(r"(<div class=\"cajon\".*?</div>)\s*<main", base, re.S)
# El cajón acaba justo antes de <main>: lo recortamos por posición
ini = base.index('<div class="cajon"')
fin = base.index("<main", ini)
cajon = base[ini:fin].strip()

pie_ini = base.index('<footer class="pie">')
pie_fin = base.index('<script src="tema.js"')
pie = base[pie_ini:pie_fin].strip()

secciones = []
for archivo, titulo in PAGINAS:
    html = leer(archivo + ".html")
    m = re.search(r'<main id="principal">(.*?)</main>', html, re.S)
    cuerpo = m.group(1)
    secciones.append('<div class="pagina" data-pagina="%s.html" aria-label="%s" hidden>%s</div>'
                     % (archivo, titulo, cuerpo))

css = leer("tema.css")
js  = leer("tema.js")

ENRUTADOR = """
/* ── Enrutador de la vista previa de un solo archivo ────────────────────
   Las diez páginas viven en el mismo documento: al pulsar un enlace se
   muestra la que toca en lugar de navegar. */
(function () {
  var paginas = [].slice.call(document.querySelectorAll('.pagina'));
  var cabecera = document.querySelector('.cabecera');

  function nombre(href) {
    var m = /([a-z-]+\\.html)/.exec(href || '');
    return m ? m[1] : null;
  }

  function mostrar(pag, ancla, empujar) {
    var destino = paginas.filter(function (p) { return p.dataset.pagina === pag; })[0];
    if (!destino) return false;
    paginas.forEach(function (p) { p.hidden = p !== destino; });

    // Marcar el enlace activo en el menú y en el cajón
    [].forEach.call(document.querySelectorAll('.menu a, .cajon a'), function (a) {
      if (nombre(a.getAttribute('href')) === pag) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    // La cabecera vuelve a estado «sobre hero» al empezar cada página
    cabecera.classList.add('sobre-hero');
    cabecera.classList.remove('fija');

    if (empujar !== false) history.replaceState(null, '', '#' + pag + (ancla ? '@' + ancla : ''));
    if (ancla) {
      var d = destino.querySelector('#' + ancla) || document.getElementById(ancla);
      if (d) { d.scrollIntoView({ behavior: 'auto', block: 'start' }); return true; }
    }
    window.scrollTo(0, 0);
    return true;
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || /^(https?:|mailto:|tel:)/.test(href)) return;

    if (href.charAt(0) === '#') {          // ancla dentro de la misma página
      var actual = paginas.filter(function (p) { return !p.hidden; })[0];
      var d = (actual && actual.querySelector(href)) || document.querySelector(href);
      if (d) { e.preventDefault(); d.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      return;
    }
    var partes = href.split('#'), pag = nombre(partes[0]);
    if (!pag) return;
    if (mostrar(pag, partes[1])) e.preventDefault();
  });

  // Estado inicial: lo que venga en el hash, o la portada
  var h = (location.hash || '').replace('#', '').split('@');
  if (!mostrar(h[0] || 'index.html', h[1], false)) mostrar('index.html', null, false);
})();
"""

AVISO = ""

EXTRA_CSS = """
/* ── Sólo para la vista previa de un solo archivo ─────────────────────── */
.pagina[hidden] { display: none; }
.mapa-off {
  display: grid; place-items: center; padding: 2rem; text-align: center;
  background: var(--fondo-alt); border: 1px dashed var(--borde);
}
.mapa-off p { color: var(--texto-3); font-size: .875rem; max-width: 34ch; }
"""

# Todo a ASCII: en un archivo suelto no hay cabecera HTTP ni <meta charset>
# que garantice UTF-8, y los acentos saldrian como mojibake.
def a_ascii_html(t):
    return "".join(c if ord(c) < 128 else "&#%d;" % ord(c) for c in t)

def a_ascii_css(t):
    # En CSS el escape de un carácter es \XXXXXX seguido de un espacio
    return "".join(c if ord(c) < 128 else "\\%06X " % ord(c) for c in t)

def a_ascii_js(t):
    return "".join(c if ord(c) < 128 else "\\u%04X" % ord(c) for c in t)

css, EXTRA_CSS = a_ascii_css(css), a_ascii_css(EXTRA_CSS)
js, ENRUTADOR = a_ascii_js(js), a_ascii_js(ENRUTADOR)
cabecera, cajon, pie = map(a_ascii_html, (cabecera, cajon, pie))
secciones = [a_ascii_html(x) for x in secciones]

DOC = """<title>Redise&#241;o de S&#237; Camper</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Inter:wght@400..700&display=swap');
%s
%s
</style>
%s
<a class="salta" href="#principal">Saltar al contenido</a>
%s
%s
<main id="principal">
%s
</main>
%s
<script>
%s
%s
%s
</script>
""" % (css, EXTRA_CSS, AVISO, cabecera, cajon, "\n".join(secciones), pie,
        "@@FOTOS@@", js, ENRUTADOR)

DOC = incrustar(DOC).replace("@@FOTOS@@", mapa_fotos())
with open(SALIDA, "w", encoding="utf-8") as f:
    f.write(DOC)
print("→ %s  (%.1f MB)" % (SALIDA, os.path.getsize(SALIDA) / 1024 / 1024))
