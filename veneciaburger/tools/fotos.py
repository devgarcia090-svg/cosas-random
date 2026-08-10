#!/usr/bin/env python3
"""Descarga y prepara las fotos de los platos.

Las originales vienen con un marco decorativo negro y esquinas blancas. Aquí se
recorta ese marco para quedarse solo con la comida y se generan dos tamaños:

  nombre.webp     miniatura de la lista (~400 px)
  nombre-g.webp   la que se abre al pulsar (máximo que dé el original)

Uso:  python3 tools/fotos.py
"""

from __future__ import annotations

import pathlib
import subprocess
import sys

from PIL import Image

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "assets" / "img"
CDN = "https://assets.zyrosite.com/AMq1DBbM23cMD7wX"

# nombre en el sitio -> archivo original en el CDN
FOTOS = {
    "aguila-dorada": "copia-de-disea--o-sin-tatulo-DueC2xfGdrV7U1ui.png",
    "amor-prohibido": "copia-de-disea--o-sin-tatulo-4-Awv4ay1aenTDQOj2.png",
    "bad-bro": "bad-bro-Yan1QDQXZkFaJWzb.png",
    "bad-chicken": "bad-chicken-YZ98Q0QqMyiK6lDy.png",
    "big-gublins": "copia-de-disea--o-sin-tatulo-j0xJtO2DAriI8ipX.png",
    "camelot": "camelot-AoPWbybMD8cBabkW.png",
    "cheese-bacon": "cheesbacon-YbNBgMgQOGSWKoLj.png",
    "clasica": "clasica-mePxQkQ4yJTgbLR0.png",
    "cryspy-cesar": "cryspy-cesar-YKb3WwWZpaIRGvGb.png",
    "cryspy-pollo": "cryspy-pollo-Awv4b1bxXvtzvaj3.png",
    "emmily": "emmy-m2W89597bzSLzQwv.png",
    "fire-fox": "firefox-mp8WbGbZz3tqNNEz.png",
    "hannibal": "hannibal-A85e9j9WDNUyy2Jg.png",
    "iberica": "iberica-YZ98Q0QqnefjLKyd.png",
    "la-yucatana": "copia-de-disea--o-sin-tatulo-sEvExZ2FpljzX4AH.png",
    "lady-goat": "lady-goat-YKb3WwWZxzcWjBxe.png",
    "lotus": "lotus-AVL7Q0QEBViJZkkD.png",
    "mamba": "mamba-YX4lVwVv5nI1lyWB.png",
    "marty": "marty-mv0WbybOXbuKJLvq.png",
    "pistagocha": "pistagocha-A1aP9LvDXJhlwDO4.png",
    "presumida": "presumida-A3Q29K9v4Qh5gDww.png",
    "tio-jack": "tio-jack-AMq1WvWeqZiaMRZB.png",
    "trufada": "trufada-m7V39g96VJt4pxN5.png",
    "patatas-lotus": "patatas-lotus-mjE7bEWMMWh29379.png",
    "patatas-bacon": "patatas-bacon-mxB4bBkvvQiVq90L.png",
    "patatas-pulled-pork": "patatas-pulled-Y4LD9LaGrvC2bMJq.png",
    "patatas-trufadas": "patatas-trufa-A3Q29QW0g9SBrJk2.png",
    "patatas-volcano": "copia-de-disea--o-sin-tatulo-2-YZ98Z9K39rtaoGEn.png",
    "bocaditos-pulled-pork": "copia-de-disea--o-sin-tatulo-14OE9YNPH7nhsSxY.png",
    "bocaditos-italianos": "75ed66a9-894f-4ebc-99e3-36d3cd3831fe-m6LZ9Ke8x4fQ6Dz7.png",
    "bocaditos-trufa": "bocaditos-de-trufa-mp8Wb889bbFK77aN.png",
    "tequenos": "tequea--os-AoPWbPkBpVSajZl0.jpeg",
    "nachos-cheddar": "nachos-fritos-mnlWblB1DKhM6W3z.png",
    "nachos-pulled-pork": "nachos-pulled-pork-AR0LW0q6kvuERPRZ.png",
    "pollo-cajun": "pollo-cajun-mp8Wb80aQMupwxDg.png",
    "solomillo-kentucky": "solomillo-pollo-kentaky-dOqapq2zGMCjrDXX.png",
    "bolitas-cheddar": "bolitas-chilichedar-mxB4bBkvROSB68zG.png",
    "nuggets": "nuggets-de-pollo-YNqBbq8vvjIkaaRa.png",
    "croquetas-jamon": "croquetas-de-jamon-YKb3Wb9q7DC2WE1n.png",
    "croquetas-setas": "croquetas-de-setas-YleWbeZ3PPf0xxw3.png",
    "sandwich-kentucky": "sandwich-kentaky-A3Q2jnX4xKtlbao1.png",
    "sandwich-cabra": "sandwich-la-cabra-m2W8ngwWL3T9KL2p.png",
    "sandwich-bacon": "sandwich-de-bacon-mv0WB36XaxUV2zDr.png",
    "sandwich-brie": "sandwich-queso-brie-YX4ln8k4DGCG4kyO.png",
    "kids-crispy": "chiken-kids-YbNBLxZ5Z2iq6yqe.png",
    "kids-nuggets": "menu-nugets-de-pollo-mp8WD071ObuZzoBy.png",
    "tarta-dubai": "copia-de-disea--o-sin-tatulo-AVL751ov7BtZx1g9.png",
    "tarta-casera": "tarta-de-queso-YX4lnNxpGEt6yK4V.png",
    "tarta-pistacho": "copia-de-disea--o-sin-tatulo-YX4lnNxVGOheGW9g.png",
    "helado-oreo": "helado-artesanal-oreo-mxB4OkXVlvUy2y1v.png",
    "helado-quinder": "helado-artesanal-quinder-mePxENJVyyubkPvP.png",
    "helado-pistacho": "helado-artesanal-pistacho-YZ98Z4jKlPTqkMJW.png",
}

BLANCO = 238   # a partir de aquí se considera fondo blanco
NEGRO = 70     # por debajo de aquí se considera el marco negro


def recorta_marco(im: Image.Image) -> Image.Image:
    """Quita el fondo blanco y el marco negro decorativo del original."""
    gris = im.convert("L")
    w, h = gris.size
    pix = gris.load()

    def avanza(inicio, fin, paso, fijo, horizontal):
        """Salta el blanco del borde y después la banda negra del marco."""
        tope_marco = int((w if horizontal else h) * 0.09)
        i, saltado = inicio, 0
        leer = (lambda k: pix[k, fijo]) if horizontal else (lambda k: pix[fijo, k])
        while i != fin and leer(i) >= BLANCO:
            i += paso
        while i != fin and leer(i) <= NEGRO and saltado < tope_marco:
            i += paso
            saltado += 1
        return i

    cy, cx = h // 2, w // 2
    x0 = avanza(0, w - 1, 1, cy, True)
    x1 = avanza(w - 1, 0, -1, cy, True)
    y0 = avanza(0, h - 1, 1, cx, False)
    y1 = avanza(h - 1, 0, -1, cx, False)

    if x1 - x0 < w * 0.4 or y1 - y0 < h * 0.4:   # detección dudosa: no tocar
        return im

    # El marco es redondeado: un recorte recto deja las esquinas, así que se
    # entra un poco más para que el radio quede fuera.
    margen = round(min(x1 - x0, y1 - y0) * 0.05)
    return im.crop((x0 + margen, y0 + margen, x1 + 1 - margen, y1 + 1 - margen))


def main() -> None:
    DESTINO.mkdir(parents=True, exist_ok=True)
    tmp = pathlib.Path("/tmp/foto-venecia.bin")
    total = 0

    for nombre, origen in sorted(FOTOS.items()):
        r = subprocess.run(["curl", "-sfL", f"{CDN}/{origen}", "-o", str(tmp)])
        if r.returncode:
            print(f"  ! no se pudo descargar {nombre}", file=sys.stderr)
            continue

        original = recorta_marco(Image.open(tmp).convert("RGB"))

        grande = original.copy()
        grande.thumbnail((900, 900), Image.LANCZOS)
        grande.save(DESTINO / f"{nombre}-g.webp", "WEBP", quality=80, method=6)

        mini = original.copy()
        mini.thumbnail((400, 400), Image.LANCZOS)
        mini.save(DESTINO / f"{nombre}.webp", "WEBP", quality=76, method=6)

        total += (DESTINO / f"{nombre}-g.webp").stat().st_size
        total += (DESTINO / f"{nombre}.webp").stat().st_size
        print(f"  {nombre:<24} {original.size[0]}×{original.size[1]}")

    tmp.unlink(missing_ok=True)
    print(f"\n{len(FOTOS)} platos · {total / 1024 / 1024:.2f} MB en total")


if __name__ == "__main__":
    main()
