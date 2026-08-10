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
    tipos = {".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png"}
    b64 = base64.b64encode(ruta.read_bytes()).decode()
    return f"data:{tipos[ruta.suffix]};base64,{b64}"


def separa_reglas(cuerpo: str) -> list[tuple[str, str]]:
    """Parte el interior de un bloque @media en pares (selector, declaraciones)."""
    reglas, i = [], 0
    while True:
        abre = cuerpo.find("{", i)
        if abre == -1:
            break
        cierra = cuerpo.find("}", abre)
        selector = cuerpo[i:abre].strip()
        if selector:
            reglas.append((selector, cuerpo[abre + 1:cierra].strip()))
        i = cierra + 1
    return reglas


def tres_estados(css: str) -> str:
    """El visor de artefactos usa data-theme además de prefers-color-scheme.

    Cada bloque oscuro se duplica: uno dentro del media query (que pierde ante
    un data-theme="light" explícito) y otro bajo data-theme="dark".
    """
    salida, i = [], 0
    marca = "@media (prefers-color-scheme: dark) {"
    while True:
        ini = css.find(marca, i)
        if ini == -1:
            salida.append(css[i:])
            break
        salida.append(css[i:ini])

        # localizar la llave de cierre del @media contando anidamiento
        j = ini + len(marca)
        nivel = 1
        while nivel:
            if css[j] == "{":
                nivel += 1
            elif css[j] == "}":
                nivel -= 1
            j += 1
        interior = css[ini + len(marca):j - 1]

        def con_ambito(ambito: str) -> str:
            partes = []
            for sel, decl in separa_reglas(interior):
                sel = ", ".join(
                    ambito if s.strip() == ":root" else f"{ambito} {s.strip()}"
                    for s in sel.split(",")
                )
                partes.append(f"{sel} {{ {decl} }}")
            return "\n".join(partes)

        salida.append(
            "@media (prefers-color-scheme: dark) {\n"
            + con_ambito(':root:not([data-theme="light"])')
            + "\n}\n"
            + con_ambito(':root[data-theme="dark"]')
            + "\n"
        )
        i = j
    return "".join(salida)


def main() -> None:
    destino = pathlib.Path(sys.argv[1])

    html = (RAIZ / "menu" / "index.html").read_text(encoding="utf-8")
    css = tres_estados((RAIZ / "assets" / "css" / "styles.css").read_text(encoding="utf-8"))
    js = (RAIZ / "assets" / "js" / "venecia.js").read_text(encoding="utf-8")

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
