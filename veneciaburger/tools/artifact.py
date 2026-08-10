#!/usr/bin/env python3
"""Empaqueta /menu en un único archivo HTML autocontenido (para previsualizar).

CSS, JS e imágenes quedan embebidos, así que el archivo se puede abrir desde
cualquier sitio sin servidor. El sitio real sigue siendo el de build.py: esto es
solo una copia para enseñarla.

Uso:  python3 tools/artifact.py salida.html
"""

from __future__ import annotations

import base64
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def datauri(ruta: pathlib.Path) -> str:
    tipos = {".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png",
             ".woff2": "font/woff2"}
    b64 = base64.b64encode(ruta.read_bytes()).decode()
    return f"data:{tipos[ruta.suffix]};base64,{b64}"


def main() -> None:
    destino = pathlib.Path(sys.argv[1])

    html = (RAIZ / "menu" / "index.html").read_text(encoding="utf-8")
    css = (RAIZ / "assets" / "css" / "styles.css").read_text(encoding="utf-8")
    js = (RAIZ / "assets" / "js" / "venecia.js").read_text(encoding="utf-8")

    # Las fuentes van dentro del CSS: en un archivo suelto no hay servidor que
    # las sirva (y el visor de artefactos bloquea cualquier origen externo).
    for fuente in sorted((RAIZ / "assets" / "fonts").iterdir()):
        css = css.replace(f"/assets/fonts/{fuente.name}", datauri(fuente))

    cuerpo = html[html.index("<body>") + len("<body>"):html.index("</body>")]

    # Los enlaces a otras páginas no existen dentro de un archivo suelto
    cuerpo = re.sub(r'<nav class="barra__nav".*?</nav>', "", cuerpo, flags=re.S)
    cuerpo = re.sub(r'<a class="barra__logo"[^>]*>', '<span class="barra__logo">', cuerpo)
    cuerpo = cuerpo.replace("</a>\n    \n", "</span>\n", 1)
    cuerpo = re.sub(r' · <a href="/politica-de-privacidad">[^<]*</a>', "", cuerpo)
    cuerpo = re.sub(r'<script src="[^"]*"[^>]*></script>', "", cuerpo)

    # Con todo embebido no tiene sentido llevar dos tamaños de cada foto: se
    # deja solo la grande y el navegador la escala para la miniatura.
    cuerpo = re.sub(r' data-grande="[^"]*"', "", cuerpo)
    img = RAIZ / "assets" / "img"
    for ruta in sorted(img.iterdir()):
        marcador = f"/assets/img/{ruta.name}"
        if marcador not in cuerpo:
            continue
        grande = ruta.with_name(ruta.stem + "-g" + ruta.suffix)
        cuerpo = cuerpo.replace(marcador, datauri(grande if grande.exists() else ruta))

    destino.write_text(
        "<title>Carta de Burger Bar Venecia — Beniel (Murcia)</title>\n"
        f"<style>\n{css}\n</style>\n{cuerpo}\n<script>\n{js}\n</script>\n",
        encoding="utf-8",
    )
    print(f"{destino}  {destino.stat().st_size / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
