"""Genera la identidad visual de Maya (Club PPP) como SVG sueltos.

Salida en identidad-maya/svg/. Los textos de los logos se convierten a
curvas con fontTools, asi los SVG no dependen de tener la fuente instalada.

    pip install fonttools
    python3 herramientas/generar-identidad.py

Las fuentes (Bagel Fat One y Bebas Neue, ambas OFL) se descargan la primera
vez en herramientas/.fuentes/ y no se versionan.
"""
import math
import os
import urllib.request

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(RAIZ, "identidad-maya", "svg")
CACHE = os.path.join(RAIZ, "herramientas", ".fuentes")

# Paleta. Negro, fuego y crema son los de la web (tema.css); el resto amplia
# la marca para el club: lengua sale de la lengua de Maya, parque del cesped
# de los paseos y oro del --oro que ya usaba la web.
NEGRO = "#0D0B09"
FUEGO = "#C8722A"
CREMA = "#F2EDE6"
LENGUA = "#F28CA5"
LENGUA_OSC = "#D96A86"
PARQUE = "#1F5C45"
ORO = "#F2B544"

FUENTES = {
    "bagel": "https://raw.githubusercontent.com/google/fonts/main/ofl/bagelfatone/BagelFatOne-Regular.ttf",
    "bebas": "https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/BebasNeue-Regular.ttf",
}


def fuente(nombre):
    os.makedirs(CACHE, exist_ok=True)
    ruta = os.path.join(CACHE, nombre + ".ttf")
    if not os.path.exists(ruta):
        urllib.request.urlretrieve(FUENTES[nombre], ruta)
    return TTFont(ruta)


# ── Texto a curvas ────────────────────────────────────────────────────────

def _glifos(font, texto, tracking=0):
    """Lista de (nombre_glifo, x_avance_acumulado) en unidades de la fuente."""
    cmap = font.getBestCmap()
    hmtx = font["hmtx"]
    x, out = 0, []
    for ch in texto:
        g = cmap.get(ord(ch))
        if g is None:
            continue
        out.append((g, x))
        x += hmtx[g][0] + tracking
    return out, x - tracking


def ancho_texto(font, texto, size, tracking=0):
    upm = font["head"].unitsPerEm
    return _glifos(font, texto, tracking)[1] * size / upm


def texto(font, s, size, x, y, fill, anchor="start", tracking=0):
    """Texto en linea recta como un unico <path>. y es la linea base."""
    upm = font["head"].unitsPerEm
    k = size / upm
    glifos, ancho = _glifos(font, s, tracking)
    if anchor == "middle":
        x -= ancho * k / 2
    elif anchor == "end":
        x -= ancho * k
    gs = font.getGlyphSet()
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    for g, gx in glifos:
        gs[g].draw(TransformPen(pen, Transform(k, 0, 0, -k, x + gx * k, y)))
    return f'<path d="{pen.getCommands()}" fill="{fill}"/>'


def texto_arco(font, s, size, cx, cy, r, centro_deg, fill, tracking=0, abajo=False):
    """Texto repartido sobre una circunferencia, centrado en centro_deg
    (0 = arriba, sentido horario). Con abajo=True se lee derecho por la
    parte inferior del circulo."""
    upm = font["head"].unitsPerEm
    k = size / upm
    glifos, ancho = _glifos(font, s, tracking)
    hmtx = font["hmtx"]
    gs = font.getGlyphSet()
    pen = SVGPathPen(gs, ntos=lambda v: f"{v:.1f}".rstrip("0").rstrip("."))
    total = ancho * k / r  # radianes que ocupa
    for g, gx in glifos:
        adv = hmtx[g][0] * k
        medio = (gx * k + adv / 2) / r - total / 2
        if abajo:
            ang = math.radians(centro_deg - 180) - medio
            t = (Transform().translate(cx, cy).rotate(ang).translate(0, r)
                 .translate(-adv / 2, 0).scale(k, -k).translate(0, -font["OS/2"].sCapHeight))
        else:
            ang = math.radians(centro_deg) + medio
            t = (Transform().translate(cx, cy).rotate(ang).translate(0, -r)
                 .translate(-adv / 2, 0).scale(k, -k))
        gs[g].draw(TransformPen(pen, t))
    return f'<path d="{pen.getCommands()}" fill="{fill}"/>'


def svg(vb, cuerpo, titulo):
    w, h = vb
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
            f'role="img" aria-label="{titulo}"><title>{titulo}</title>{cuerpo}</svg>\n')


# ── Isotipo: la cabeza de Maya ───────────────────────────────────────────
# Lienzo de 240x240. Lo que la hace Maya y no "un perro": las dos cejas
# fuego (las manchas que tiene todo Rottweiler encima de los ojos) y la
# lengua fuera, que es el "peluche" de la marca.

CABEZA = "M120 40 C168 40 194 60 195 100 C196 134 188 160 170 178 C154 193 86 193 70 178 C52 160 44 134 45 100 C46 60 72 40 120 40 Z"
OREJA_I = "M62 54 Q32 58 26 94 Q24 120 40 128 Q56 124 90 76 Z"
OREJA_D = "M178 54 Q208 58 214 94 Q216 120 200 128 Q184 124 150 76 Z"
NARIZ = "M100 140 C100 130 140 130 140 140 C140 152 128 156 120 156 C112 156 100 152 100 140 Z"
BOCA = "M120 154 V163 M120 163 C113 172 102 172 97 165 M120 163 C127 172 138 172 143 165"
LENGUA_D = "M105 168 C102 214 138 214 135 168 Z"


def ojos(ink, blanco=CREMA, cx=(96, 144), cy=111):
    a, b = cx
    return (f'<g fill="{blanco}"><circle cx="{a}" cy="{cy}" r="7"/><circle cx="{b}" cy="{cy}" r="7"/></g>'
            f'<g fill="{ink}"><circle cx="{a + 1.5}" cy="{cy + 1}" r="4"/><circle cx="{b + 1.5}" cy="{cy + 1}" r="4"/></g>')


def ojos_felices(ink, cx=(96, 144), cy=112):
    a, b = cx
    return (f'<path d="M{a - 8} {cy + 2} Q{a} {cy - 8} {a + 8} {cy + 2} M{b - 8} {cy + 2} Q{b} {cy - 8} {b + 8} {cy + 2}" '
            f'fill="none" stroke="{ink}" stroke-width="5" stroke-linecap="round"/>')


def lengua(color=LENGUA, linea=LENGUA_OSC):
    return (f'<path d="{LENGUA_D}" fill="{color}"/>'
            f'<path d="M120 176 V196" stroke="{linea}" stroke-width="3.5" stroke-linecap="round"/>')


def nariz_boca(ink):
    return (f'<path d="{NARIZ}" fill="{ink}"/>'
            f'<path d="{BOCA}" fill="none" stroke="{ink}" stroke-width="5" stroke-linecap="round"/>')


def isotipo(fondo=CREMA, ink=NEGRO, tan=FUEGO, ojo=CREMA, lengua_c=LENGUA, linea=LENGUA_OSC):
    """La cabeza a color. fondo es el color sobre el que va (se usa para el
    filo que separa orejas y cabeza)."""
    return (f'<g fill="{ink}"><path d="{OREJA_I}"/><path d="{OREJA_D}"/>'
            f'<path d="{CABEZA}" stroke="{fondo}" stroke-width="4.5" paint-order="stroke"/></g>'
            f'<g fill="{tan}"><ellipse cx="92" cy="88" rx="10" ry="8.5"/><ellipse cx="148" cy="88" rx="10" ry="8.5"/>'
            f'<circle cx="100" cy="158" r="25"/><circle cx="140" cy="158" r="25"/>'
            f'<ellipse cx="120" cy="176" rx="28" ry="13"/></g>'
            + lengua(lengua_c, linea) + ojos(ink, ojo) + nariz_boca(ink))


def isotipo_pegatina(borde=CREMA):
    """Para fondos oscuros: la silueta con un filo crema, como una pegatina."""
    sil = f'<path d="{OREJA_I}"/><path d="{OREJA_D}"/><path d="{CABEZA}"/><path d="{LENGUA_D}"/>'
    return (f'<g fill="{borde}" stroke="{borde}" stroke-width="14" stroke-linejoin="round">{sil}</g>'
            + isotipo(fondo=borde))


def isotipo_mono(tinta, fondo):
    """Una sola tinta: la cabeza en tinta y los rasgos calados en el fondo."""
    return isotipo(fondo=fondo, ink=tinta, tan=fondo, ojo=fondo, lengua_c=tinta, linea=fondo)


# ── Personajes del club ──────────────────────────────────────────────────
# Mismo esqueleto que el isotipo (240x240) para que se lean como familia.
# Cada uno es una raza de la lista PPP del RD 287/2002 con un cargo.

def gorra(color, visera, letra_font):
    """Gorra de cinco paneles encima de la cabeza, con la M del logo."""
    m = texto(letra_font, "M", 30, 120, 58, CREMA, anchor="middle")
    return (f'<path d="M58 72 C58 22 182 22 182 72 Z" fill="{color}"/>'
            f'<path d="M120 26 V72" stroke="{visera}" stroke-width="2" opacity=".35"/>'
            f'<circle cx="120" cy="27" r="5" fill="{visera}"/>'
            f'<path d="M54 70 C80 62 160 62 186 70 C192 78 190 84 182 84 C160 76 80 76 58 84 C50 84 48 78 54 70 Z" fill="{visera}"/>'
            + m)


def p_maya(bagel):
    return isotipo() + gorra(PARQUE, "#174634", bagel)


def p_pitbull():
    # Pit Bull color arena con lista blanca. Orejas en rosa (pequenas y altas).
    cara = "M120 46 C172 46 200 70 200 108 C200 146 186 174 162 186 C146 194 94 194 78 186 C54 174 40 146 40 108 C40 70 68 46 120 46 Z"
    return (f'<g fill="{FUEGO}"><path d="M60 72 Q52 50 70 46 Q90 46 96 58 Q80 58 72 84 Z"/>'
            f'<path d="M180 72 Q188 50 170 46 Q150 46 144 58 Q160 58 168 84 Z"/></g>'
            f'<path d="{cara}" fill="{ORO}"/>'
            f'<path d="M112 50 Q120 46 128 50 L134 128 L106 128 Z" fill="{CREMA}"/>'
            f'<ellipse cx="120" cy="160" rx="54" ry="30" fill="{CREMA}"/>'
            # gafas de sol
            f'<g fill="{NEGRO}"><rect x="66" y="94" width="46" height="30" rx="12"/><rect x="128" y="94" width="46" height="30" rx="12"/>'
            f'<rect x="108" y="100" width="24" height="6" rx="3"/></g>'
            f'<path d="M76 102 L90 102" stroke="{CREMA}" stroke-width="4" stroke-linecap="round" opacity=".7"/>'
            f'<path d="M138 102 L152 102" stroke="{CREMA}" stroke-width="4" stroke-linecap="round" opacity=".7"/>'
            f'<path d="M100 136 C100 128 140 128 140 136 C140 146 128 150 120 150 C112 150 100 146 100 136 Z" fill="{NEGRO}"/>'
            # sonrisa ancha de pit
            f'<path d="M84 160 C100 186 140 186 156 160 Z" fill="{NEGRO}"/>'
            f'<path d="M104 172 C108 186 132 186 136 172 Z" fill="{LENGUA}"/>'
            f'<path d="M120 150 V164" stroke="{NEGRO}" stroke-width="5" stroke-linecap="round"/>')


def p_dogo():
    # Dogo Argentino: blanco entero, parche negro en un ojo, antifaz de siesta.
    cara = "M120 44 C170 44 196 66 196 106 C196 142 184 170 162 184 C146 194 94 194 78 184 C56 170 44 142 44 106 C44 66 70 44 120 44 Z"
    return (f'<g fill="{CREMA}" stroke="{NEGRO}" stroke-width="5" stroke-linejoin="round">'
            f'<path d="M66 60 Q40 62 34 92 Q34 112 48 116 Q60 108 84 78 Z"/><path d="M174 60 Q200 62 206 92 Q206 112 192 116 Q180 108 156 78 Z"/>'
            f'<path d="{cara}"/></g>'
            f'<path d="M128 96 C140 88 166 92 166 112 C166 128 146 132 134 124 C124 116 120 104 128 96 Z" fill="{NEGRO}"/>'
            # ojos cerrados: el del parche va en crema para que se vea
            f'<path d="M88 118 Q96 108 104 118" fill="none" stroke="{NEGRO}" stroke-width="5" stroke-linecap="round"/>'
            f'<path d="M138 118 Q146 108 154 118" fill="none" stroke="{CREMA}" stroke-width="5" stroke-linecap="round"/>'
            # antifaz subido a la frente
            f'<path d="M62 70 C90 56 150 56 178 70 L176 84 C150 74 90 74 64 84 Z" fill="{LENGUA}"/>'
            f'<path d="M84 64 C92 58 104 60 108 68 C100 76 88 74 84 64 Z M156 64 C148 58 136 60 132 68 C140 76 152 74 156 64 Z" fill="{LENGUA_OSC}"/>'
            f'<ellipse cx="120" cy="150" rx="16" ry="11" fill="{NEGRO}"/>'
            f'<path d="M120 160 V168 M120 168 C113 176 104 176 99 170 M120 168 C127 176 136 176 141 170" fill="none" stroke="{NEGRO}" stroke-width="5" stroke-linecap="round"/>'
            # zzz
            f'<path d="M188 34 h14 l-14 16 h14 M208 18 h10 l-10 12 h10" fill="none" stroke="{PARQUE}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')


def p_staffy():
    # Staffordshire negro con pechera blanca, hueso en la boca (tesorera).
    cara = "M120 48 C170 48 198 72 198 110 C198 144 186 170 164 184 C148 194 92 194 76 184 C54 170 42 144 42 110 C42 72 70 48 120 48 Z"
    return (f'<g fill="{NEGRO}"><path d="M74 62 Q50 36 34 52 Q30 74 56 92 Z"/><path d="M166 62 Q190 36 206 52 Q210 74 184 92 Z"/>'
            f'<path d="{cara}" stroke="{CREMA}" stroke-width="4.5" paint-order="stroke"/></g>'
            f'<path d="M114 56 Q120 52 126 56 L130 120 L110 120 Z" fill="{CREMA}"/>'
            f'<ellipse cx="120" cy="158" rx="46" ry="28" fill="{CREMA}"/>'
            + ojos(NEGRO, CREMA, cx=(92, 148), cy=108)
            + f'<path d="M102 134 C102 126 138 126 138 134 C138 144 128 148 120 148 C112 148 102 144 102 134 Z" fill="{NEGRO}"/>'
            # hueso
            f'<g fill="{ORO}" stroke="{NEGRO}" stroke-width="4"><path d="M62 164 h116"/>'
            f'<rect x="64" y="158" width="112" height="16" rx="8"/>'
            f'<circle cx="62" cy="156" r="10"/><circle cx="62" cy="176" r="10"/><circle cx="178" cy="156" r="10"/><circle cx="178" cy="176" r="10"/></g>'
            f'<rect x="66" y="159" width="108" height="14" rx="7" fill="{ORO}"/>'
            f'<path d="M98 150 C106 156 134 156 142 150" fill="none" stroke="{NEGRO}" stroke-width="5" stroke-linecap="round"/>')


def p_akita():
    # Akita Inu: orejas de punta, mascara crema (urajiro), cascos de DJ.
    cara = "M120 52 C168 52 194 76 194 112 C194 146 180 172 158 184 C144 192 96 192 82 184 C60 172 46 146 46 112 C46 76 72 52 120 52 Z"
    return (f'<g fill="{FUEGO}"><path d="M60 92 L66 30 Q72 22 80 28 L112 60 Z"/><path d="M180 92 L174 30 Q168 22 160 28 L128 60 Z"/>'
            f'<path d="{cara}" stroke="{CREMA}" stroke-width="4.5" paint-order="stroke"/></g>'
            f'<path d="M68 48 L72 38 L96 60 Z M172 48 L168 38 L144 60 Z" fill="{LENGUA}"/>'
            f'<path d="M58 126 C70 104 96 112 120 132 C144 112 170 104 182 126 C184 164 156 184 120 184 C84 184 56 164 58 126 Z" fill="{CREMA}"/>'
            f'<g fill="{CREMA}"><ellipse cx="94" cy="96" rx="9" ry="6"/><ellipse cx="146" cy="96" rx="9" ry="6"/></g>'
            + ojos_felices(NEGRO, cx=(94, 146), cy=114)
            + f'<ellipse cx="120" cy="146" rx="14" ry="10" fill="{NEGRO}"/>'
            f'<path d="M120 154 V162 M120 162 C114 170 106 170 102 164 M120 162 C126 170 134 170 138 164" fill="none" stroke="{NEGRO}" stroke-width="4.5" stroke-linecap="round"/>'
            # cascos
            f'<path d="M50 120 C44 40 196 40 190 120" fill="none" stroke="{PARQUE}" stroke-width="10" stroke-linecap="round"/>'
            f'<rect x="32" y="104" width="30" height="46" rx="13" fill="{PARQUE}"/><rect x="178" y="104" width="30" height="46" rx="13" fill="{PARQUE}"/>'
            f'<rect x="40" y="114" width="10" height="26" rx="5" fill="{LENGUA}"/><rect x="190" y="114" width="10" height="26" rx="5" fill="{LENGUA}"/>')


# ── Formas y patrones ────────────────────────────────────────────────────

def huella(cx, cy, s, fill):
    return (f'<g transform="translate({cx} {cy}) scale({s})" fill="{fill}">'
            f'<path d="M0 -2 C16 -2 26 12 26 22 C26 32 16 34 0 30 C-16 34 -26 32 -26 22 C-26 12 -16 -2 0 -2 Z"/>'
            f'<ellipse cx="-24" cy="-14" rx="8" ry="10"/><ellipse cx="-9" cy="-28" rx="8" ry="11"/>'
            f'<ellipse cx="9" cy="-28" rx="8" ry="11"/><ellipse cx="24" cy="-14" rx="8" ry="10"/></g>')


def pompon(cx, cy, r, fill, n=9, rot=0):
    """Circulo de borde festoneado: la forma 'peluche'."""
    lobulos = "".join(
        f'<circle cx="{cx + r * 0.78 * math.cos(math.radians(rot + i * 360 / n)):.1f}" '
        f'cy="{cy + r * 0.78 * math.sin(math.radians(rot + i * 360 / n)):.1f}" r="{r * 0.32:.1f}"/>'
        for i in range(n))
    return f'<g fill="{fill}"><circle cx="{cx}" cy="{cy}" r="{r * 0.82:.1f}"/>{lobulos}</g>'


def ceja_par(cx, cy, s, fill):
    return (f'<g fill="{fill}"><ellipse cx="{cx - 14 * s}" cy="{cy}" rx="{10 * s}" ry="{8.5 * s}"/>'
            f'<ellipse cx="{cx + 14 * s}" cy="{cy}" rx="{10 * s}" ry="{8.5 * s}"/></g>')


def lengua_forma(cx, cy, s, fill, linea, rot=0):
    return (f'<g transform="translate({cx} {cy}) rotate({rot}) scale({s})">'
            f'<path d="M-16 -20 C-20 30 20 30 16 -20 Z" fill="{fill}"/>'
            f'<path d="M0 -10 V12" stroke="{linea}" stroke-width="3.5" stroke-linecap="round"/></g>')


def hueso(cx, cy, s, fill, rot=0):
    return (f'<g transform="translate({cx} {cy}) rotate({rot}) scale({s})" fill="{fill}">'
            f'<rect x="-26" y="-7" width="52" height="14" rx="7"/>'
            f'<circle cx="-27" cy="-8" r="9"/><circle cx="-27" cy="8" r="9"/>'
            f'<circle cx="27" cy="-8" r="9"/><circle cx="27" cy="8" r="9"/></g>')


def patron(fondo, tile, motivo, titulo):
    """Lienzo de 480x480 con un <pattern> de baldosa tile x tile."""
    return svg((480, 480),
               f'<defs><pattern id="p" width="{tile}" height="{tile}" patternUnits="userSpaceOnUse">'
               f'<rect width="{tile}" height="{tile}" fill="{fondo}"/>{motivo}</pattern></defs>'
               f'<rect width="480" height="480" fill="url(#p)"/>', titulo)


# ── Ensamblado ───────────────────────────────────────────────────────────

def main():
    bagel = fuente("bagel")
    bebas = fuente("bebas")
    piezas = {}

    # Logotipo: "Maya" en Bagel Fat One con el punto en fuego (la ceja).
    ancho = ancho_texto(bagel, "Maya", 200)
    W = ancho + 80
    def logo(tinta, punto=FUEGO):
        return (texto(bagel, "Maya", 200, 20, 190, tinta)
                + f'<circle cx="{20 + ancho + 34:.1f}" cy="168" r="22" fill="{punto}"/>')
    piezas["logo-maya"] = svg((W, 240), logo(NEGRO), "Maya")
    piezas["logo-maya-crema"] = svg((W, 240), logo(CREMA), "Maya")
    piezas["logo-maya-negro"] = svg((W, 240), logo(NEGRO, NEGRO), "Maya")

    # Logo horizontal: isotipo + palabra + bajada.
    hz = (f'<g transform="translate(0 0) scale(1)">{isotipo()}</g>'
          f'<g transform="translate(224 -6) scale(.78)">{logo(NEGRO)}</g>'
          + texto(bebas, "EL ROTTWEILER PELUCHE", 40, 246, 204, NEGRO, tracking=40))
    piezas["logo-horizontal"] = svg((240 + W * .78, 240), hz, "Maya, el Rottweiler Peluche")
    hz_c = (f'{isotipo_pegatina()}'
            f'<g transform="translate(224 -6) scale(.78)">{logo(CREMA)}</g>'
            + texto(bebas, "EL ROTTWEILER PELUCHE", 40, 246, 204, CREMA, tracking=40))
    piezas["logo-horizontal-crema"] = svg((240 + W * .78, 240), hz_c, "Maya, el Rottweiler Peluche")

    # Isotipo en sus variantes.
    piezas["isotipo"] = svg((240, 240), isotipo(), "Isotipo de Maya")
    piezas["isotipo-pegatina"] = svg((240, 240), isotipo_pegatina(), "Isotipo de Maya")
    piezas["isotipo-mono-negro"] = svg((240, 240), isotipo_mono(NEGRO, CREMA), "Isotipo de Maya")
    piezas["isotipo-mono-crema"] = svg((240, 240), isotipo_mono(CREMA, NEGRO), "Isotipo de Maya")

    # Sello del club: isotipo dentro de un aro con el lema en curva.
    sello = (f'<circle cx="200" cy="200" r="196" fill="{PARQUE}"/>'
             f'<circle cx="200" cy="200" r="128" fill="{CREMA}"/>'
             + texto_arco(bagel, "CLUB PPP", 50, 200, 200, 146, 0, CREMA, tracking=60)
             + texto_arco(bebas, "PURO PERRO PELUCHE", 44, 200, 200, 150, 180, CREMA, tracking=90, abajo=True)
             + f'<circle cx="62" cy="200" r="9" fill="{FUEGO}"/><circle cx="338" cy="200" r="9" fill="{FUEGO}"/>'
             f'<g transform="translate(86 80) scale(.95)">{isotipo()}</g>')
    piezas["sello-club-ppp"] = svg((400, 400), sello, "Club PPP, Puro Perro Peluche")

    # Favicon / avatar: cabeza sobre fuego.
    piezas["favicon"] = svg((240, 240),
                            f'<rect width="240" height="240" rx="56" fill="{FUEGO}"/>'
                            f'<g transform="translate(12 10) scale(.9)">{isotipo(fondo=FUEGO, tan=ORO)}</g>',
                            "Maya")

    # Personajes.
    piezas["personaje-maya"] = svg((240, 240), p_maya(bagel), "Maya, presidenta del club")
    piezas["personaje-pitbull"] = svg((240, 240), p_pitbull(), "Pit Bull, relaciones publicas")
    piezas["personaje-dogo"] = svg((240, 240), p_dogo(), "Dogo Argentino, jefe de siestas")
    piezas["personaje-staffy"] = svg((240, 240), p_staffy(), "Staffordshire, tesorera de chuches")
    piezas["personaje-akita"] = svg((240, 240), p_akita(), "Akita Inu, DJ de los paseos")

    # Formas sueltas (para la pagina de formas).
    piezas["forma-cejas"] = svg((120, 120), ceja_par(60, 60, 2.2, FUEGO), "Las cejas")
    piezas["forma-lengua"] = svg((120, 120), lengua_forma(60, 56, 2, LENGUA, LENGUA_OSC), "La lengua")
    piezas["forma-huella"] = svg((120, 120), huella(60, 66, 1.45, NEGRO), "La huella")
    piezas["forma-pompon"] = svg((120, 120), pompon(60, 60, 50, ORO), "El pompon")
    piezas["forma-hueso"] = svg((120, 120), hueso(60, 60, 1.25, CREMA, -30), "El hueso")

    # Patrones.
    piezas["patron-cejas"] = patron(
        NEGRO, 120, ceja_par(30, 30, 1, FUEGO) + ceja_par(90, 90, 1, FUEGO), "Patron de cejas")
    piezas["patron-lenguas"] = patron(
        PARQUE, 160, lengua_forma(40, 40, 1.1, LENGUA, LENGUA_OSC, -12) + lengua_forma(120, 120, 1.1, LENGUA, LENGUA_OSC, 14),
        "Patron de lenguas")
    piezas["patron-pompones"] = patron(
        FUEGO, 200, pompon(50, 50, 40, CREMA) + pompon(150, 150, 40, CREMA, rot=20)
        + pompon(150, 48, 14, ORO) + pompon(48, 152, 14, ORO), "Patron de pompones")
    piezas["patron-huellas"] = patron(
        LENGUA, 160, huella(40, 46, .8, NEGRO) + hueso(120, 120, .8, CREMA, -30)
        + hueso(40, 128, .55, NEGRO, 25) + huella(124, 40, .5, CREMA), "Patron de huellas")

    os.makedirs(OUT, exist_ok=True)
    for nombre, contenido in piezas.items():
        with open(os.path.join(OUT, nombre + ".svg"), "w") as f:
            f.write(contenido)
    print(f"Generados {len(piezas)} SVG en {OUT}")


if __name__ == "__main__":
    main()
