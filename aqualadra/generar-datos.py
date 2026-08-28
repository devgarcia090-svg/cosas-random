#!/usr/bin/env python3
"""
Regenera los datos estructurados (JSON-LD) leyendolos del propio index.html.

Por que existe: Google exige que el dato estructurado coincida con lo que ve la
persona, y las IA responden lo que leen ahi. Manteniendo las dos cosas a mano se
separan a la primera: se cambia un precio en la tabla y el JSON-LD sigue
publicando el viejo. Asi que el catalogo de servicios, las preguntas frecuentes
y los pasos del autolavado NO se escriben a mano: se leen del HTML.

Uso:
    python3 generar-datos.py              regenera y escribe index.html
    python3 generar-datos.py --comprobar  no escribe; sale con error si hay
                                          algo que regenerar (para antes de
                                          desplegar)

Lo que NO toca: el resto de la ficha del negocio (direccion, telefono, horario,
coordenadas, imagenes), el nodo WebSite y el texto de los pasos del HowTo. Eso
se edita a mano en el bloque JSON-LD de index.html.
"""
import json
import pathlib
import re
import sys

BASE = "https://www.aqualadra.com"
HTML = pathlib.Path(__file__).with_name("index.html")

INCLUYE = "Incluye corte de uñas y limpieza de oídos."
DETALLE_PELUQUERIA = {
    "Baño": "Baño completo con champú profesional y secado. " + INCLUYE,
    "Arreglo": "Baño y retoque de las zonas que lo necesiten. " + INCLUYE,
    "Corte": "Corte completo a tijera o máquina. " + INCLUYE,
    "Stripping": "Arrancado del pelo muerto. " + INCLUYE,
}
DETALLE_MAQUINA = {
    "Lavado de mascota": (
        "Ocho minutos de programa: agua templada, champú con acondicionador, "
        "aclarado y secador. Sin cita previa y para cualquier tamaño. La máquina "
        "se autolimpia y se desinfecta al terminar cada lavado."
    ),
    "Tiempo extra": "Dos minutos más de programa. Se puede repetir hasta tres veces.",
    "Deslanadora": "Máquina de deslanado profesional para retirar el pelo muerto.",
}


def sin_etiquetas(texto):
    # Se quitan las etiquetas SIN dejar espacio en su sitio, porque asi es como
    # el navegador construye textContent: "6 €</strong>," da "6 €," y no
    # "6 € ,". Si no coinciden caracter a caracter, el dato estructurado y lo
    # que ve la persona dejan de ser lo mismo, y la prueba de SEO lo detecta.
    texto = re.sub(r"<[^>]+>", "", texto)
    for entidad, letra in (("&lt;", "<"), ("&gt;", ">"), ("&amp;", "&"),
                           ("&nbsp;", " "), ("&mdash;", "—")):
        texto = texto.replace(entidad, letra)
    return re.sub(r"\s+", " ", texto).strip()


def oferta(nombre, precio, descripcion, desde=False):
    especificacion = {"@type": "UnitPriceSpecification", "priceCurrency": "EUR"}
    especificacion["minPrice" if desde else "price"] = precio
    return {
        "@type": "Offer",
        "itemOffered": {"@type": "Service", "name": nombre,
                        "description": descripcion,
                        "provider": {"@id": BASE + "/#negocio"}},
        "priceSpecification": especificacion,
        "availability": "https://schema.org/InStock",
    }


def leer_tarifas(html):
    """Las tarifas de peluqueria, de las pestañas y sus paneles."""
    ofertas = []
    pestanyas = re.findall(
        r'id="tab-(p\d)" aria-controls="panel-p\d"[^>]*>(.*?)</button>', html)
    if not pestanyas:
        raise SystemExit("No se han encontrado las pestañas de tarifas.")
    for clave, etiqueta in pestanyas:
        grupo = sin_etiquetas(etiqueta)
        panel = re.search(r'<div class="panel" id="panel-%s".*?</div>\s*</div>' % clave,
                          html, re.S)
        if not panel:
            raise SystemExit(f"No se ha encontrado el panel {clave}.")
        for nombre, precio in re.findall(
                r'class="price__name">(.*?)</p><p class="price__value">'
                r'(?:<span class="price__desde">Desde</span>\s*)?(\d+)<sup>',
                panel.group(0)):
            nombre = sin_etiquetas(nombre)
            ofertas.append(oferta(
                f"{nombre} en peluquería · {grupo}", precio,
                DETALLE_PELUQUERIA.get(nombre, INCLUYE) + f" Tarifa para {grupo.lower()}.",
                desde=True))
    return ofertas


def leer_maquina(html):
    """Las tarifas de la maquina del autolavado."""
    bloque = re.search(r'<ul class="machine__list"[^>]*>(.*?)</ul>', html, re.S)
    if not bloque:
        raise SystemExit("No se ha encontrado el bloque de la máquina.")
    filas = re.findall(
        r'<span class="txt"><b>([^<]{1,40})</b><small>[^<]*</small></span>\s*'
        r'<span class="eur">(\d+) €</span>', bloque.group(1))
    if not filas:
        raise SystemExit("No se han encontrado tarifas en el bloque de la máquina.")
    return [oferta(f"{sin_etiquetas(n)} (autolavado)", p,
                   DETALLE_MAQUINA.get(sin_etiquetas(n), "")) for n, p in filas]


def leer_preguntas(html):
    bloque = re.search(r'<div class="faq[^"]*">(.*?)\n    </div>', html, re.S)
    if not bloque:
        raise SystemExit("No se ha encontrado la sección de preguntas frecuentes.")
    pares = re.findall(
        r'<summary>(.*?)</summary>\s*<div class="respuesta">(.*?)</div>',
        bloque.group(1), re.S)
    if not pares:
        raise SystemExit("No se han encontrado preguntas dentro de la sección.")
    return [{"@type": "Question", "name": sin_etiquetas(p),
             "acceptedAnswer": {"@type": "Answer", "text": sin_etiquetas(r)}}
            for p, r in pares]


def leer_pasos(html):
    """Los pasos del autolavado, con su titulo y su texto."""
    bloque = re.search(r'<ol class="steps"[^>]*>(.*?)</ol>', html, re.S)
    if not bloque:
        raise SystemExit("No se ha encontrado la lista de pasos.")
    pasos = re.findall(r"<h3>(.*?)</h3>\s*<p>(.*?)</p>", bloque.group(1), re.S)
    return [{"@type": "HowToStep", "position": i, "name": sin_etiquetas(t),
             "text": sin_etiquetas(d), "url": BASE + "/#autolavado"}
            for i, (t, d) in enumerate(pasos, 1)]


def main():
    comprobar = "--comprobar" in sys.argv[1:]
    html = HTML.read_text(encoding="utf-8")

    marca = re.search(r'(<script type="application/ld\+json">\n)(.*?)(\n</script>)',
                      html, re.S)
    if not marca:
        raise SystemExit("No se ha encontrado el bloque JSON-LD en index.html.")
    grafo = json.loads(marca.group(2))

    ofertas = leer_tarifas(html) + leer_maquina(html)
    preguntas = leer_preguntas(html)
    pasos = leer_pasos(html)

    for nodo in grafo["@graph"]:
        tipos = nodo["@type"] if isinstance(nodo["@type"], list) else [nodo["@type"]]
        if "LocalBusiness" in tipos:
            nodo["hasOfferCatalog"] = {"@type": "OfferCatalog",
                                       "name": "Servicios y tarifas de AquaLadra",
                                       "itemListElement": ofertas}
        elif "FAQPage" in tipos:
            nodo["mainEntity"] = preguntas
        elif "HowTo" in tipos:
            nodo["step"] = pasos

    nuevo = html[:marca.start(2)] + json.dumps(grafo, ensure_ascii=False, indent=2) + html[marca.end(2):]

    print(f"  {len(ofertas)} servicios con precio")
    print(f"  {len(preguntas)} preguntas frecuentes")
    print(f"  {len(pasos)} pasos del autolavado")

    if nuevo == html:
        print("\nEl JSON-LD ya está al día.")
        return 0
    if comprobar:
        print("\nHay cambios sin regenerar: ejecuta 'python3 generar-datos.py'.", file=sys.stderr)
        return 1
    HTML.write_text(nuevo, encoding="utf-8")
    print("\nindex.html actualizado.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
