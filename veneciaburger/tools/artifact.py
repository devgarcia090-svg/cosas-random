#!/usr/bin/env python3
"""Empaqueta TODO el sitio en un único archivo HTML autocontenido.

Sirve para enseñar la web sin desplegarla: CSS, fuentes, imágenes y las cinco
páginas quedan embebidos, y un router mínimo cambia de una a otra, así que los
enlaces de la barra, el botón «Ver la carta» y el pie funcionan igual que en el
sitio real.

No sustituye a build.py: el sitio de verdad son las páginas que genera aquel.

Uso:  python3 tools/artifact.py salida.html
"""

from __future__ import annotations

import base64
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent

# id del bloque, archivo generado, ruta real en el sitio
PAGINAS = [
    ("p-inicio", "index.html", "/"),
    ("p-menu", "menu/index.html", "/menu"),
    ("p-alergenos", "alergenos/index.html", "/alergenos"),
    ("p-nosotros", "nosotros/index.html", "/nosotros"),
    ("p-privacidad", "politica-de-privacidad/index.html", "/politica-de-privacidad"),
]

ROUTER = """
/* Router del archivo suelto: enseña una página y esconde el resto. En el sitio
   real cada una es su propio HTML y esto no existe. */
(function () {
  var paginas = [].slice.call(document.querySelectorAll('.pagina'));
  var porDefecto = 'p-inicio';

  function mostrar(id, seccion) {
    if (!document.getElementById(id)) id = porDefecto;
    paginas.forEach(function (p) { p.hidden = p.id !== id; });
    var saltar = document.querySelector('.saltar');
    if (saltar) saltar.setAttribute('href', '#contenido-' + id);
    var destino = seccion && document.getElementById(seccion);
    if (destino) destino.scrollIntoView();
    else window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (ev) {
    var a = ev.target.closest && ev.target.closest('a[href^="#p-"]');
    if (!a) return;
    ev.preventDefault();
    var id = a.getAttribute('href').slice(1);
    mostrar(id, a.getAttribute('data-seccion'));
    history.replaceState(null, '', '#' + id);
  });

  var inicial = location.hash.slice(1);
  mostrar(inicial.indexOf('p-') === 0 ? inicial : porDefecto);
})();
"""


def datauri(ruta: pathlib.Path) -> str:
    tipos = {".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png",
             ".woff2": "font/woff2"}
    b64 = base64.b64encode(ruta.read_bytes()).decode()
    return f"data:{tipos[ruta.suffix]};base64,{b64}"


def cuerpo_de(archivo: str, ident: str) -> str:
    """Saca el <body> de una página y lo prepara para convivir con las demás."""
    html = (RAIZ / archivo).read_text(encoding="utf-8")
    cuerpo = html[html.index("<body>") + len("<body>"):html.index("</body>")]

    # Cada página trae su propio <main id="contenido">: al juntarlas habría
    # cinco ids iguales, así que se les pone apellido (y al enlace de saltar).
    cuerpo = cuerpo.replace('id="contenido"', f'id="contenido-{ident}"')
    cuerpo = cuerpo.replace('href="#contenido"', f'href="#contenido-{ident}"')

    # El JS va una sola vez al final del archivo
    cuerpo = re.sub(r'<script src="[^"]*"[^>]*></script>', "", cuerpo)

    # El enlace de "saltar al contenido" se saca fuera: uno solo para todo el
    # archivo, como en el sitio real, y el router le cambia el destino.
    cuerpo = re.sub(r'<a class="saltar"[^>]*>.*?</a>', "", cuerpo, flags=re.S)
    return cuerpo


def enlaza_paginas(cuerpo: str) -> str:
    """Convierte los enlaces internos en saltos del router."""
    rutas = {ruta: ident for ident, _, ruta in PAGINAS}
    # de más largo a más corto, para que "/" no se coma "/menu"
    for ruta in sorted(rutas, key=len, reverse=True):
        ident = rutas[ruta]
        cuerpo = cuerpo.replace(
            f'href="{ruta}#', f'href="#{ident}" data-seccion="@')
        cuerpo = cuerpo.replace(f'href="{ruta}"', f'href="#{ident}"')
    # cierra el data-seccion que quedó abierto arriba
    cuerpo = re.sub(r'data-seccion="@([^"]*)"', r'data-seccion="\1"', cuerpo)
    return cuerpo


def main() -> None:
    destino = pathlib.Path(sys.argv[1])

    css = (RAIZ / "assets" / "css" / "styles.css").read_text(encoding="utf-8")
    js = (RAIZ / "assets" / "js" / "venecia.js").read_text(encoding="utf-8")

    # Las fuentes van dentro del CSS: en un archivo suelto no hay servidor que
    # las sirva (y el visor de artefactos bloquea cualquier origen externo).
    for fuente in sorted((RAIZ / "assets" / "fonts").iterdir()):
        css = css.replace(f"/assets/fonts/{fuente.name}", datauri(fuente))
    css += "\n.pagina[hidden] { display: none; }\n"

    cuerpo = "".join(
        f'<div class="pagina" id="{ident}" hidden>{cuerpo_de(archivo, ident)}</div>'
        for ident, archivo, _ in PAGINAS
    )
    cuerpo = enlaza_paginas(cuerpo)

    # Con todo embebido no tiene sentido llevar dos tamaños de cada foto: se
    # deja solo la grande y el navegador la escala para la miniatura.
    cuerpo = re.sub(r' data-grande="[^"]*"', "", cuerpo)
    for ruta in sorted((RAIZ / "assets" / "img").iterdir()):
        marcador = f"/assets/img/{ruta.name}"
        if marcador not in cuerpo:
            continue
        grande = ruta.with_name(ruta.stem + "-g" + ruta.suffix)
        cuerpo = cuerpo.replace(marcador, datauri(grande if grande.exists() else ruta))

    destino.write_text(
        "<title>Burger Bar Venecia — Beniel (Murcia)</title>\n"
        f"<style>\n{css}\n</style>\n"
        '<a class="saltar" href="#contenido-p-inicio">Saltar al contenido</a>\n'
        f"{cuerpo}\n"
        f"<script>\n{js}\n{ROUTER}\n</script>\n",
        encoding="utf-8",
    )
    print(f"{destino}  {destino.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
