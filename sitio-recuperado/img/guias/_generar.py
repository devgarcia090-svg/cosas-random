#!/usr/bin/env python3
"""Genera el set de ilustraciones SVG de las guias (paleta de la web)."""
import os

FUEGO = "#C8722A"
FUEGO2 = "#E0965A"
CREMA = "#F2EDE6"
ROJO = "#C0392B"
OUT = os.path.dirname(os.path.abspath(__file__))


def paw(cx, cy, s=1.0, fill=CREMA, op=1.0):
    return (f'<g transform="translate({cx} {cy}) scale({s})" fill="{fill}" opacity="{op}">'
            f'<ellipse cx="0" cy="10" rx="20" ry="16"/>'
            f'<circle cx="-18" cy="-12" r="7"/><circle cx="-6" cy="-19" r="7"/>'
            f'<circle cx="6" cy="-19" r="7"/><circle cx="18" cy="-12" r="7"/></g>')


def heart(cx, cy, s, fill="none", stroke=FUEGO, sw=8, op=1.0):
    d = "M0 18 C-26 -2 -20 -30 0 -14 C20 -30 26 -2 0 18 Z"
    return (f'<g transform="translate({cx} {cy}) scale({s})" opacity="{op}">'
            f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" '
            f'stroke-linejoin="round"/></g>')


TEMPLATE = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 220" '
            'preserveAspectRatio="xMidYMid slice" role="img" aria-label="{label}">'
            '<title>{label}</title><defs>'
            '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
            '<stop offset="0" stop-color="#1E1008"/><stop offset="1" stop-color="#0D0B09"/>'
            '</linearGradient>'
            '<radialGradient id="gl" cx="0.5" cy="0.42" r="0.62">'
            '<stop offset="0" stop-color="#C8722A" stop-opacity="0.22"/>'
            '<stop offset="1" stop-color="#C8722A" stop-opacity="0"/></radialGradient>'
            '</defs>'
            '<rect width="480" height="220" fill="url(#bg)"/>'
            '<rect width="480" height="220" fill="url(#gl)"/>'
            + paw(432, 196, 1.15, FUEGO, 0.06)  # marca de agua sutil
            + '{icon}</svg>')


def L(pts):
    return " ".join(f"{x},{y}" for x, y in pts)


# ---- iconos por tema ----
ICONS = {}

# Alimentacion: cuenco + hueso
ICONS["alimentacion"] = ('Guia de alimentacion del Rottweiler',
    f'<g transform="translate(240 66) rotate(-18)" fill="{CREMA}">'
    f'<rect x="-40" y="-9" width="80" height="18" rx="9"/>'
    f'<circle cx="-40" cy="-11" r="11"/><circle cx="-40" cy="11" r="11"/>'
    f'<circle cx="40" cy="-11" r="11"/><circle cx="40" cy="11" r="11"/></g>'
    f'<g fill="none" stroke="{FUEGO}" stroke-width="8" stroke-linejoin="round" stroke-linecap="round">'
    f'<ellipse cx="240" cy="126" rx="86" ry="20"/><path d="M166 130 q74 52 148 0"/>'
    f'<path d="M150 128 q90 62 180 0" opacity="0.35"/></g>'
    f'<ellipse cx="240" cy="126" rx="70" ry="13" fill="{FUEGO}" opacity="0.18"/>')

# Salud general: latido + huella + cruz
ICONS["salud"] = ('Salud del Rottweiler',
    f'<path d="M96 104 H180 l14 -34 22 68 18 -44 12 20 H392" fill="none" stroke="{FUEGO}" '
    f'stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'
    + paw(240, 150, 1.0, CREMA) +
    f'<g transform="translate(240 160)" fill="{FUEGO}">'
    f'<rect x="-4" y="-9" width="8" height="20" rx="2"/><rect x="-9" y="-4" width="20" height="8" rx="2"/></g>')

# Displasia: articulacion de cadera
ICONS["displasia"] = ('Displasia de cadera en Rottweiler',
    f'<g fill="none" stroke="{CREMA}" stroke-width="14" stroke-linecap="round">'
    f'<path d="M300 150 L232 104"/></g>'
    f'<circle cx="224" cy="98" r="26" fill="{CREMA}"/>'
    f'<path d="M196 128 A34 34 0 0 1 196 66" fill="none" stroke="{FUEGO}" stroke-width="12" stroke-linecap="round"/>'
    f'<circle cx="224" cy="98" r="10" fill="{FUEGO}"/>'
    f'<g transform="translate(300 76)" fill="{ROJO}">'
    f'<circle cx="0" cy="0" r="15"/><rect x="-3" y="-9" width="6" height="10" rx="3" fill="{CREMA}"/>'
    f'<circle cx="0" cy="6" r="3" fill="{CREMA}"/></g>')

# Enfermedades: usa salud tambien pero variacion con escudo-cruz
ICONS["enfermedades"] = ('Enfermedades comunes del Rottweiler',
    f'<path d="M240 54 L300 74 V120 C300 152 274 168 240 180 C206 168 180 152 180 120 V74 Z" '
    f'fill="none" stroke="{FUEGO}" stroke-width="8" stroke-linejoin="round"/>'
    f'<g transform="translate(240 116)" fill="{CREMA}">'
    f'<rect x="-9" y="-24" width="18" height="48" rx="5"/><rect x="-24" y="-9" width="48" height="18" rx="5"/></g>')

# Educar: birrete + huella
ICONS["educar"] = ('Como educar un Rottweiler',
    f'<g transform="translate(240 92)"><polygon points="{L([(0,-34),(82,-6),(0,22),(-82,-6)])}" fill="{FUEGO}"/>'
    f'<path d="M-46 6 V44 q46 30 92 0 V6" fill="none" stroke="{CREMA}" stroke-width="7" stroke-linejoin="round"/>'
    f'<line x1="82" y1="-6" x2="82" y2="40" stroke="{CREMA}" stroke-width="5" stroke-linecap="round"/>'
    f'<circle cx="82" cy="46" r="7" fill="{CREMA}"/></g>'
    + paw(240, 176, 0.78, CREMA, 0.9))

# Niños/familia: corazon grande con huella + corazon pequeño
ICONS["ninos"] = ('Rottweiler con ninos',
    heart(228, 104, 3.0, "none", FUEGO, 8)
    + paw(228, 104, 0.62, CREMA)
    + heart(318, 70, 1.3, FUEGO, FUEGO, 6))

# Macho vs hembra
ICONS["genero"] = ('Rottweiler macho o hembra',
    f'<g fill="none" stroke="{FUEGO}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">'
    f'<circle cx="206" cy="118" r="34"/><line x1="206" y1="152" x2="206" y2="188"/>'
    f'<line x1="186" y1="170" x2="226" y2="170"/></g>'
    f'<g fill="none" stroke="{CREMA}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">'
    f'<circle cx="286" cy="104" r="34"/><line x1="310" y1="80" x2="342" y2="48"/>'
    f'<polyline points="{L([(320,48),(342,48),(342,70)])}"/></g>')

# Socializar: huellas conectadas
ICONS["socializar"] = ('Socializar un Rottweiler adulto',
    f'<path d="M150 150 Q240 90 330 150" fill="none" stroke="{FUEGO}" stroke-width="4" '
    f'stroke-dasharray="2 12" stroke-linecap="round" opacity="0.7"/>'
    + paw(150, 150, 0.7, CREMA) + paw(240, 96, 0.85, FUEGO2) + paw(330, 150, 0.7, CREMA))

# Ejercicio: pelota + movimiento + huella
ICONS["ejercicio"] = ('Ejercicio para Rottweiler',
    f'<g fill="none" stroke="{FUEGO}" stroke-width="7" stroke-linecap="round">'
    f'<path d="M150 96 h-34"/><path d="M162 128 h-46"/><path d="M156 160 h-30"/></g>'
    f'<circle cx="272" cy="128" r="40" fill="{CREMA}"/>'
    f'<path d="M240 112 q32 16 64 0 M240 144 q32 -16 64 0" fill="none" stroke="{FUEGO}" stroke-width="5"/>'
    + paw(210, 128, 0.6, FUEGO2, 0.9))

# Piso/vivienda: edificio con ventana-corazon
ICONS["piso"] = ('Puede un Rottweiler vivir en un piso',
    f'<rect x="196" y="70" width="88" height="118" rx="6" fill="none" stroke="{CREMA}" stroke-width="8"/>'
    f'<g fill="{FUEGO}" opacity="0.85">'
    f'<rect x="212" y="88" width="18" height="18" rx="3"/><rect x="250" y="88" width="18" height="18" rx="3"/>'
    f'<rect x="212" y="120" width="18" height="18" rx="3"/></g>'
    + heart(259, 133, 0.75, FUEGO, FUEGO, 7)
    + f'<rect x="230" y="160" width="20" height="28" rx="2" fill="{FUEGO}"/>')

# Gatos: cara de gato + huella
ICONS["gatos"] = ('Rottweiler y gatos conviviendo',
    f'<g transform="translate(214 116)">'
    f'<polygon points="{L([(-30,-20),(-14,-40),(-6,-16)])}" fill="{CREMA}"/>'
    f'<polygon points="{L([(30,-20),(14,-40),(6,-16)])}" fill="{CREMA}"/>'
    f'<circle cx="0" cy="4" r="32" fill="{CREMA}"/>'
    f'<circle cx="-12" cy="-2" r="4" fill="{FUEGO}"/><circle cx="12" cy="-2" r="4" fill="{FUEGO}"/>'
    f'<path d="M0 8 l-6 6 M0 8 l6 6" stroke="{FUEGO}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    f'<path d="M-16 12 h-20 M-16 18 h-16 M16 12 h20 M16 18 h16" stroke="{CREMA}" stroke-width="2" opacity="0.6"/></g>'
    + paw(312, 132, 0.85, FUEGO))

# Seguro: escudo + check
ICONS["seguro"] = ('Seguro de responsabilidad civil para Rottweiler',
    f'<path d="M240 52 L302 74 V122 C302 156 274 174 240 186 C206 174 178 156 178 122 V74 Z" '
    f'fill="none" stroke="{FUEGO}" stroke-width="8" stroke-linejoin="round"/>'
    f'<path d="M212 118 l20 22 40 -50" fill="none" stroke="{CREMA}" stroke-width="11" '
    f'stroke-linecap="round" stroke-linejoin="round"/>')

# Historia de la raza: columna romana
ICONS["historia-raza"] = ('Historia y origen del Rottweiler',
    f'<g stroke="{FUEGO}" stroke-width="0" fill="{CREMA}">'
    f'<rect x="196" y="60" width="88" height="16" rx="3"/>'
    f'<rect x="204" y="76" width="72" height="12"/>'
    f'<rect x="192" y="172" width="96" height="16" rx="3"/>'
    f'<rect x="200" y="160" width="80" height="12"/></g>'
    f'<g stroke="{FUEGO}" stroke-width="6" opacity="0.9">'
    f'<line x1="216" y1="90" x2="216" y2="158"/><line x1="234" y1="90" x2="234" y2="158"/>'
    f'<line x1="252" y1="90" x2="252" y2="158"/><line x1="270" y1="90" x2="270" y2="158"/></g>')

# Cachorro: carita de perro
ICONS["cachorro"] = ('Guia del Rottweiler cachorro',
    f'<g transform="translate(240 116)">'
    f'<path d="M-46 -30 Q-64 -8 -50 26 L-30 6 Z" fill="{FUEGO}"/>'
    f'<path d="M46 -30 Q64 -8 50 26 L30 6 Z" fill="{FUEGO}"/>'
    f'<circle cx="0" cy="0" r="46" fill="{CREMA}"/>'
    f'<circle cx="-17" cy="-6" r="6" fill="{FUEGO}"/><circle cx="17" cy="-6" r="6" fill="{FUEGO}"/>'
    f'<ellipse cx="0" cy="16" rx="9" ry="7" fill="{FUEGO}"/>'
    f'<path d="M0 23 V32 M0 32 q-10 0 -12 -6 M0 32 q10 0 12 -6" stroke="{FUEGO}" stroke-width="3" fill="none" stroke-linecap="round"/></g>')

# Agresivo/comportamiento: perfil de cabeza + corazon (caracter real)
ICONS["comportamiento"] = ('Rottweiler agresivo: causas reales',
    f'<path d="M170 150 V96 Q170 64 206 60 L300 60 Q276 78 288 96 L316 100 Q322 118 300 122 '
    f'L292 150 M240 60 Q238 74 250 82" fill="none" stroke="{CREMA}" stroke-width="7" '
    f'stroke-linejoin="round" stroke-linecap="round"/>'
    f'<circle cx="212" cy="92" r="5" fill="{CREMA}"/>'
    + heart(236, 116, 1.25, FUEGO, FUEGO, 6))

# Bozal
ICONS["bozal"] = ('Bozal para Rottweiler',
    f'<g fill="none" stroke="{FUEGO}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">'
    f'<path d="M188 92 Q188 74 210 74 L300 84 Q330 90 330 118 Q330 150 296 156 L214 156 Q188 150 188 128 Z"/>'
    f'<path d="M210 74 L206 156 M244 78 L242 156 M278 82 L276 156"/>'
    f'<path d="M188 108 H328 M192 134 H320"/></g>'
    f'<ellipse cx="316" cy="120" rx="10" ry="12" fill="{CREMA}"/>')

# Esperanza de vida: reloj de arena + corazon
ICONS["vida"] = ('Esperanza de vida del Rottweiler',
    f'<g fill="none" stroke="{FUEGO}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">'
    f'<line x1="204" y1="62" x2="276" y2="62"/><line x1="204" y1="178" x2="276" y2="178"/>'
    f'<path d="M210 62 Q210 108 240 120 Q270 132 270 178"/>'
    f'<path d="M270 62 Q270 108 240 120 Q210 132 210 178"/></g>'
    + heart(240, 92, 0.7, CREMA, CREMA, 0)
    + f'<circle cx="240" cy="150" r="5" fill="{CREMA}"/><circle cx="230" cy="164" r="4" fill="{CREMA}"/>'
    f'<circle cx="250" cy="164" r="4" fill="{CREMA}"/>')

# Temperamento: medalla/roseta (caracter noble)
ICONS["temperamento"] = ('Temperamento y caracter del Rottweiler',
    f'<g transform="translate(240 100)">'
    f'<polygon points="{L([(-14,44),(-4,20),(-24,26)])}" fill="{FUEGO}"/>'
    f'<polygon points="{L([(14,44),(4,20),(24,26)])}" fill="{FUEGO}"/>'
    f'<circle cx="0" cy="0" r="40" fill="none" stroke="{FUEGO}" stroke-width="8"/>'
    f'<path d="M0 -22 l7 15 16 2 -12 12 3 16 -14 -8 -14 8 3 -16 -12 -12 16 -2 Z" fill="{CREMA}"/></g>')

# Microchip
ICONS["microchip"] = ('Microchip obligatorio para Rottweiler',
    f'<rect x="200" y="84" width="80" height="72" rx="8" fill="none" stroke="{CREMA}" stroke-width="7"/>'
    f'<rect x="222" y="104" width="36" height="32" rx="4" fill="{FUEGO}"/>'
    f'<g stroke="{CREMA}" stroke-width="6" stroke-linecap="round">'
    f'<path d="M212 84 V68 M240 84 V68 M268 84 V68"/><path d="M212 156 V172 M240 156 V172 M268 156 V172"/>'
    f'<path d="M200 100 H184 M200 128 H184"/><path d="M280 100 H296 M280 128 H296"/></g>')

# Requisitos: portapapeles con checks
ICONS["requisitos"] = ('Requisitos para tener un Rottweiler en Espana',
    f'<rect x="192" y="66" width="96" height="120" rx="8" fill="none" stroke="{CREMA}" stroke-width="7"/>'
    f'<rect x="222" y="56" width="36" height="20" rx="5" fill="{FUEGO}"/>'
    f'<g stroke="{FUEGO}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">'
    f'<path d="M210 100 l8 8 14 -16"/><path d="M210 130 l8 8 14 -16"/><path d="M210 160 l8 8 14 -16"/></g>'
    f'<g stroke="{CREMA}" stroke-width="5" stroke-linecap="round" opacity="0.7">'
    f'<line x1="244" y1="104" x2="272" y2="104"/><line x1="244" y1="134" x2="272" y2="134"/>'
    f'<line x1="244" y1="164" x2="272" y2="164"/></g>')

# Ley: balanza de justicia
ICONS["ley"] = ('Ley de Bienestar Animal 2023',
    f'<g fill="none" stroke="{FUEGO}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">'
    f'<line x1="240" y1="58" x2="240" y2="176"/><line x1="176" y1="80" x2="304" y2="80"/>'
    f'<line x1="204" y1="184" x2="276" y2="184"/>'
    f'<path d="M176 80 L156 122 A24 24 0 0 0 196 122 Z"/>'
    f'<path d="M304 80 L284 122 A24 24 0 0 0 324 122 Z"/></g>'
    f'<circle cx="240" cy="58" r="8" fill="{CREMA}"/>')

# Adopcion/protectoras: casa con corazon
ICONS["adopcion"] = ('Adoptar un Rottweiler en protectoras PPP',
    f'<path d="M188 118 L240 72 L292 118" fill="none" stroke="{FUEGO}" stroke-width="8" '
    f'stroke-linecap="round" stroke-linejoin="round"/>'
    f'<path d="M200 110 V176 H280 V110" fill="none" stroke="{CREMA}" stroke-width="8" '
    f'stroke-linejoin="round"/>'
    + heart(240, 138, 1.0, FUEGO, FUEGO, 7))

# Coste: monedas con euro
ICONS["coste"] = ('Cuanto cuesta tener un Rottweiler en Espana',
    f'<g fill="{CREMA}" stroke="{FUEGO}" stroke-width="5">'
    f'<ellipse cx="240" cy="150" rx="52" ry="18"/><ellipse cx="240" cy="132" rx="52" ry="18"/>'
    f'<ellipse cx="240" cy="114" rx="52" ry="18"/></g>'
    f'<text x="240" y="122" font-family="Georgia,serif" font-size="26" font-weight="700" '
    f'fill="{FUEGO}" text-anchor="middle">€</text>')

# Historia de Maya (tarjeta): corazon + huella
ICONS["historia-maya"] = ('La historia de Maya',
    heart(240, 104, 3.1, "none", FUEGO, 8) + paw(240, 104, 0.66, CREMA))


def main():
    for slug, (label, icon) in ICONS.items():
        svg = TEMPLATE.format(label=label, icon=icon)
        with open(os.path.join(OUT, f"{slug}.svg"), "w") as f:
            f.write(svg)
    print(f"Generadas {len(ICONS)} ilustraciones en {OUT}")


if __name__ == "__main__":
    main()
