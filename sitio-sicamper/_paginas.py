#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Contenido de cada página. Ejecuta:  python3 _paginas.py"""
from _construir import (registrar, construir, I, TEL, TEL_URL, WA, EMAIL,
                        DIRECCION, MAPS, DOMINIO, LOCALIDADES, ico)

# ── Piezas reutilizables ───────────────────────────────────────────────────
def hero_int(cejilla, h1, texto, foto, migas=None, extra=""):
    m = ""
    if migas:
        items = "".join('<li><a href="%s">%s</a></li>' % (h, t) if h else '<li>%s</li>' % t for h, t in migas)
        m = '<nav aria-label="Ruta"><ol class="migas">%s</ol></nav>' % items
    return """<section class="hero-int">
  <div class="hero-img"><img src="img/%s.webp" alt="" width="1600" height="700" fetchpriority="high"></div>
  <div class="env">%s<p class="cejilla">%s</p><h1>%s</h1><p class="entradilla">%s</p>%s</div>
</section>""" % (foto, m, cejilla, h1, texto, extra)

def cta_final(titulo="¿Nos ponemos en marcha?", texto=None, foto="puesta-sol"):
    texto = texto or ("Dime tus fechas y te digo qué tengo libre, cuánto cuesta y dónde te dejo la "
                      "autocaravana. Sin compromiso y con respuesta el mismo día.")
    return """<section class="cta-final">
  <div class="hero-img"><img src="img/%s.webp" alt="" loading="lazy" width="1400" height="620"></div>
  <div class="env">
    <p class="frase">«La libertad te está esperando»</p>
    <h2>%s</h2>
    <p>%s</p>
    <div class="acciones">
      <a class="btn btn-primario btn-lg" href="reservar.html">Comprobar mis fechas</a>
      <a class="btn btn-fantasma btn-lg" href="%s" rel="noopener">%s WhatsApp</a>
    </div>
  </div>
</section>""" % (foto, titulo, texto, WA, I["wa"])

OPINIONES = [
    ("Alex Estebe", "Setembre 2024",
     "La setmana passada vaig gaudir d’una experiència increïble en autocaravana. Tot va ser fàcil i fluid, "
     "el vehicle en perfectes condicions i equipat amb tot el necessari. Les explicacions, clares i molt detallades. Repetirem!"),
    ("Isa López", "Julio 2024",
     "La autocaravana es perfecta para quienes buscan libertad, comodidad y poder viajar con sus mascotas. "
     "Tiene todo lo necesario y la atención al cliente fue un 10/10."),
    ("Javi Sánchez", "Julio 2024",
     "Espaciosa y cómoda: cada rincón está bien aprovechado y las camas, sorprendentemente cómodas. "
     "Nos explicó todo sobre el funcionamiento y nos dio consejos para el viaje. Superó nuestras expectativas."),
    ("Laura Lehu", "Junio 2024",
     "Buen trato, vehículos impecables, todas las garantías y comodidades. Pasamos un finde con una de sus "
     "autocaravanas y… ¡de lujo! Deseando repetir."),
    ("Carlos Poyatos", "Junio 2024",
     "Un finde extraordinario. La autocaravana es muy completa en todos los sentidos y tiene bastante "
     "espacio para 5 personas."),
    ("Xavi Padullés", "Agosto 2024",
     "Vam llogar l’autocaravana a Sí Camper. Estava nova i el servei, impecable. Molt bona atenció d’Ismael."),
]

def opiniones_seccion():
    tarjetas = []
    for n, (nombre, fecha, texto) in enumerate(OPINIONES):
        estrellas = I["estrella"] * 5
        inicial = nombre[0]
        tarjetas.append("""<figure class="card opinion" data-revelar="%d">
  <div class="estrellas" aria-label="5 de 5 estrellas">%s</div>
  <blockquote>%s</blockquote>
  <figcaption><span class="avatar" aria-hidden="true">%s</span><span class="quien"><b>%s</b><span>%s · Google</span></span></figcaption>
</figure>""" % (n, estrellas, texto, inicial, nombre, fecha))
    return """<section class="seccion">
  <div class="env">
    <div class="cabecera-sec centro" data-revelar>
      <p class="cejilla">5,0 sobre 5 en Google</p>
      <h2>Lo que cuentan quienes ya han viajado</h2>
      <p class="entradilla">Opiniones reales de clientes en Google. Sin filtros ni retoques.</p>
    </div>
  </div>
  <div class="env"><div class="carril">%s</div><div class="puntos-carril" aria-hidden="true"></div></div>
</section>""" % "".join(tarjetas)

VENTAJAS = [
    ("camper", "Autocaravana full equip",
     "McLouis Glamys con la equipación más alta de la marca: cocina completa, baño con ducha independiente, "
     "agua caliente, aire acondicionado, calefacción, alarma y Smart TV."),
    ("casa", "Te la llevo a casa",
     "Tu autocaravana en la puerta de tu portal, incluida entrega y devolución en aeropuerto. "
     "Sin taxis, sin trenes y sin cargar maletas de un sitio a otro."),
    ("reloj", "Sin horarios",
     "De lunes a domingo, entrega y devolución cuando te encaje. El horario lo pones tú: "
     "de 9 a 21 h no cuesta nada más."),
    ("escudo", "Seguro a todo riesgo",
     "Póliza específica para autocaravanas de alquiler, con asistencia 24 h en toda Europa y "
     "países ribereños del Mediterráneo."),
    ("chispa", "Seguro de cancelación",
     "Cubre hasta 3.000 € o 34 días de viaje por un coste fijo más el 6 % de la reserva. "
     "Si algo se cruza, no lo pierdes todo."),
    ("auricular", "Hablas conmigo, no con un centro de llamadas",
     "Soporte telefónico los 365 días del año, antes y durante tu viaje. "
     "Siempre la misma persona al otro lado."),
    ("carrito", "Nevera llena al salir",
     "Haces la compra online en Bon Área, yo la recojo y te espera dentro de la autocaravana. "
     "Sin coste adicional."),
    ("mascota", "Tu perro también viene",
     "Hasta 3 mascotas. A la vuelta hago una limpieza a fondo del interior para evitar alergias y olores."),
    ("mapa", "Parking gratis para tu coche",
     "Si prefieres recogerla tú, dejas tu coche gratis en el Parking Terralta de Castellar del Vallès, "
     "videovigilado 24 h."),
]

def ventajas_grid(limite=None):
    v = VENTAJAS[:limite] if limite else VENTAJAS
    return "".join("""<article class="card card-hover" data-revelar="%d">
  <div class="icono-caja">%s</div><h3>%s</h3><p>%s</p>
</article>""" % (n, I[k], t, d) for n, (k, t, d) in enumerate(v))

TARIFAS_HTML = """<div class="tarifas">
  <article class="tarifa" data-t="baja" data-revelar="0">
    <div class="barra-t"></div>
    <p class="temp">Temporada baja</p>
    <p class="precio"><span>€</span><b>115</b><i>/día</i></p>
    <p class="cuando">Todo el año salvo las fechas señaladas. Laborables y fines de semana.</p>
    <ul><li>Mínimo 3 días</li><li>Km ilimitados desde 7 días</li><li>Desde 99 €/día en estancias largas</li></ul>
  </article>
  <article class="tarifa" data-t="media" data-destacada data-revelar="1">
    <div class="barra-t"></div>
    <p class="temp">Temporada media</p>
    <p class="precio"><span>€</span><b>159</b><i>/día</i></p>
    <p class="cuando">Puentes, festivos, junio, septiembre y Navidad.</p>
    <ul><li>Mínimo puente o 7 días</li><li>Km ilimitados desde 5 días</li><li>Desde 149 €/día a partir de 10 días</li></ul>
  </article>
  <article class="tarifa" data-t="alta" data-revelar="2">
    <div class="barra-t"></div>
    <p class="temp">Temporada alta</p>
    <p class="precio"><span>€</span><b>179</b><i>/día</i></p>
    <p class="cuando">Semana Santa y julio.</p>
    <ul><li>Mínimo 7 días</li><li>Km ilimitados incluidos</li><li>5 % de descuento reservando con 6 meses</li></ul>
  </article>
  <article class="tarifa" data-t="extra" data-revelar="3">
    <div class="barra-t"></div>
    <p class="temp">Temporada extra</p>
    <p class="precio"><span>€</span><b>235</b><i>/día</i></p>
    <p class="cuando">Agosto.</p>
    <ul><li>Mínimo 7 días</li><li>Km ilimitados incluidos</li><li>Reserva con antelación: se agota</li></ul>
  </article>
</div>
<p class="nota" style="margin-top:1.1rem">Reservas de menos de 5 días: +50 €. Reservas de menos de 7 días: 300 km/día
(0,35 €/km extra) y packs de kilometraje disponibles. Fianza aparte de 850 € con tarjeta de crédito.</p>"""

# ═══════════════════════════════════════════════════════════════════════════
# PORTADA
# ═══════════════════════════════════════════════════════════════════════════
INDEX = """
<section class="hero">
  <div class="hero-img"><img src="img/hero.webp" alt="Autocaravana Sí Camper aparcada en un paisaje del Vallès al atardecer" width="1800" height="844" fetchpriority="high"></div>
  <div class="env hero-contenido">
    <div class="hero-marcas">
      <span class="chip">%s Entrega a domicilio</span>
      <span class="chip">%s Sin horarios</span>
      <span class="chip">%s Pet friendly</span>
      <span class="chip">%s 5,0 en Google</span>
    </div>
    <h1>Tu autocaravana en la puerta de casa, <em>cuando tú digas</em></h1>
    <p class="entradilla">Alquiler de autocaravanas en Barcelona con una McLouis Glamys de 7 plazas, full equip
      y a todo riesgo. Te la llevo donde estés, a la hora que te encaje, los 365 días del año.</p>
    <form class="buscador" id="buscador-hero" style="margin-top:1.9rem;max-width:760px">
      <div class="campo"><label for="h-inicio">Salida</label><input type="date" id="h-inicio" name="inicio" required></div>
      <div class="campo"><label for="h-fin">Vuelta</label><input type="date" id="h-fin" name="fin" required></div>
      <button class="btn btn-primario btn-lg" type="submit">Ver precio</button>
    </form>
    <p class="nota" style="color:#B4C0D0;margin-top:.85rem">Presupuesto al instante, sin dar datos ni registrarte.</p>
  </div>
</section>

<section class="seccion-sm bg-alt">
  <div class="env datos">
    <div class="dato" data-revelar="0"><p class="n">7</p><p class="e">Plazas para viajar y dormir</p></div>
    <div class="dato" data-revelar="1"><p class="n">0<small> h</small></p><p class="e">Horarios de entrega fijos</p></div>
    <div class="dato" data-revelar="2"><p class="n">365</p><p class="e">Días con soporte al teléfono</p></div>
    <div class="dato" data-revelar="3"><p class="n">5,0</p><p class="e">Valoración media en Google</p></div>
    <div class="dato" data-revelar="4"><p class="n">115<small> €</small></p><p class="e">Por día en temporada baja</p></div>
  </div>
</section>

<section class="seccion">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Familiar, confortable y versátil</p>
      <h2>Una capuchina cambia el viaje</h2>
      <p class="entradilla">No es una furgoneta camperizada. Es una autocaravana capuchina: la cama va arriba,
        el salón se queda abajo y nadie tiene que desmontar la mesa para dormir.</p>
    </div>
    <div class="rejilla r-3">
      <article class="card card-hover" data-revelar="0">
        <div class="icono-caja">%s</div>
        <h3>Familiar</h3>
        <p>Siete plazas homologadas para viajar y para dormir, con sillitas y elevadores disponibles.
          Caben los niños, los abuelos y el perro.</p>
      </article>
      <article class="card card-hover" data-revelar="1">
        <div class="icono-caja oliva">%s</div>
        <h3>Confortable</h3>
        <p>Baño con ducha independiente, agua caliente, aire acondicionado y calefacción combi de 4.000 W.
          En agosto y en enero.</p>
      </article>
      <article class="card card-hover" data-revelar="2">
        <div class="icono-caja terra">%s</div>
        <h3>Versátil</h3>
        <p>Placa solar, doble bombona de gas, 120 litros de agua limpia y carné B. Autonomía real para
          desaparecer unos días.</p>
      </article>
    </div>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env dos-col">
    <div data-revelar>
      <p class="cejilla">La autocaravana</p>
      <h2>McLouis Glamys, tope de gama</h2>
      <p class="entradilla">La equipación más alta que ofrece la marca, con 7,00 × 3,20 × 2,40 m por fuera
        y sensación de piso por dentro. Mantenida al día y entregada limpia, con fundas y vajilla lavadas a 60 ºC.</p>
      <ul class="checks" style="margin-top:1.6rem">
        <li>Motor 160 cv diésel, caja manual de 6 velocidades y carné B</li>
        <li>Cocina completa con nevera grande, cafetera y menaje para todos</li>
        <li>Baño con WC y ducha separada, agua caliente y 120 l de depósito</li>
        <li>Smart TV, Bluetooth, control de crucero y cámara de marcha atrás</li>
        <li>Placa solar de 120 W: electricidad ilimitada sin enchufarte a nada</li>
      </ul>
      <div class="acciones" style="margin-top:1.9rem">
        <a class="btn btn-tinta" href="autocaravana.html">Ver la autocaravana por dentro</a>
        <a class="enlace-flecha" href="servicios.html">Qué va incluido</a>
      </div>
    </div>
    <div class="solapado" data-revelar>
      <div class="marco-foto ratio-3-4"><img src="img/int-5.webp" alt="Mesa del salón puesta, con los asientos alrededor" loading="lazy" width="600" height="800"></div>
      <div class="marco-foto ratio-1-1"><img src="img/int-3.webp" alt="Cocina: fogones de gas y fregadero" loading="lazy" width="600" height="800"></div>
      <div class="marco-foto ratio-1-1"><img src="img/int-1.webp" alt="Baño: lavabo con espejo, grifo y toallas" loading="lazy" width="600" height="800"></div>
    </div>
  </div>
</section>

<section class="seccion">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Ventajas de alquilar conmigo</p>
      <h2>Todo resuelto antes de que preguntes</h2>
      <p class="entradilla">Soy un apasionado del caravaning y entrego la autocaravana como me gustaría
        recibirla a mí: cuidada, limpia, al día y con todo en su sitio.</p>
    </div>
    <div class="rejilla r-3">%s</div>
  </div>
</section>

<section class="seccion bg-alt" id="precios">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Precios claros</p>
      <h2>Tarifas por temporada</h2>
      <p class="entradilla">Sin letra pequeña escondida: estas son las tarifas diarias. Pon tus fechas
        en la calculadora y verás el total exacto, la temporada que te toca y los kilómetros incluidos.</p>
    </div>
    %s
    <div class="acciones" style="margin-top:2rem" data-revelar>
      <a class="btn btn-primario" href="precios.html#calculadora">Calcular mi presupuesto</a>
      <a class="btn btn-linea" href="precios.html">Ver ofertas y descuentos</a>
    </div>
  </div>
</section>

<section class="seccion">
  <div class="env dos-col aside-izq">
    <div class="marco-foto ratio-4-3" data-revelar><img src="img/aerea.webp" alt="Vista aérea de la autocaravana en una carretera de montaña" loading="lazy" width="1400" height="619"></div>
    <div data-revelar>
      <p class="cejilla">Reservar es fácil</p>
      <h2>Cinco pasos y ya estás de viaje</h2>
      <ol class="pasos" style="margin-top:1.8rem">
        <li class="paso"><div><h3>Elige las fechas</h3><p>Marca la salida y la vuelta. Ves la disponibilidad y el precio antes de dar ningún dato.</p></div></li>
        <li class="paso"><div><h3>Añade servicios y extras</h3><p>Kit hotel, sillita, portabicis, mascota, kit camping… el presupuesto se actualiza solo.</p></div></li>
        <li class="paso"><div><h3>Di dónde y a qué hora</h3><p>En mi parking o en tu portal. De 9 a 21 h sin coste; fuera de esa franja, con un pequeño suplemento.</p></div></li>
        <li class="paso"><div><h3>Rellena la solicitud</h3><p>Te confirmo por escrito la disponibilidad y el precio final, sin sorpresas.</p></div></li>
        <li class="paso"><div><h3>Paga el adelanto</h3><p>Con más de 30 días de antelación, el 30 %%. A partir de ahí, el total. Tarjeta o PayPal.</p></div></li>
      </ol>
      <div class="acciones" style="margin-top:1.8rem"><a class="btn btn-primario" href="reservar.html">Empezar la reserva</a></div>
    </div>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env">
    <div class="cabecera-sec centro" data-revelar>
      <p class="cejilla">Servicios y extras</p>
      <h2>Casi todo va incluido</h2>
      <p class="entradilla">Menaje, kit de supervivencia, GPS con las medidas de la autocaravana, seguridad,
        limpieza a fondo y parking para tu coche. Sin coste adicional.</p>
    </div>
    <div class="rejilla r-4">
      <article class="card card-foto card-hover" data-revelar="0"><div class="marco"><img src="img/kit-cocina.webp" alt="Kit de cocina completo" loading="lazy" width="470" height="320"></div><div class="cuerpo"><span class="etiqueta gratis">Incluido</span><h3>Kit de cocina</h3><p class="pequeno">Vajilla, cubiertos, ollas, sartén, cafetera, tuppers, manteles y jabón.</p></div></article>
      <article class="card card-foto card-hover" data-revelar="1"><div class="marco"><img src="img/kit-supervivencia.webp" alt="Kit de supervivencia" loading="lazy" width="470" height="570"></div><div class="cuerpo"><span class="etiqueta gratis">Incluido</span><h3>Kit de supervivencia</h3><p class="pequeno">Manguera, calzos, adaptador eléctrico, antipinchazos, extintor y botiquín.</p></div></article>
      <article class="card card-foto card-hover" data-revelar="2"><div class="marco"><img src="img/kit-hotel.webp" alt="Kit hotel con sábanas y toallas" loading="lazy" width="470" height="310"></div><div class="cuerpo"><span class="etiqueta extra">Opcional</span><h3>Kit hotel</h3><p class="pequeno">Sábanas, almohadas, nórdico y toallas. Pack de verano o de invierno.</p></div></article>
      <article class="card card-foto card-hover" data-revelar="3"><div class="marco"><img src="img/portabicis.webp" alt="Portabicicletas homologado" loading="lazy" width="470" height="407"></div><div class="cuerpo"><span class="etiqueta extra">Opcional</span><h3>Portabicis</h3><p class="pequeno">Hasta 4 bicis (60 kg), funda impermeable y placa V20 homologada.</p></div></article>
    </div>
    <div class="acciones centro" style="margin-top:2.2rem;justify-content:center" data-revelar>
      <a class="btn btn-linea" href="servicios.html">Ver los 16 servicios y extras</a>
    </div>
  </div>
</section>

%s

<section class="seccion">
  <div class="env">
    <div class="banda" data-revelar>
      <div>
        <p class="cejilla" style="color:rgba(255,255,255,.8)">Zonas de entrega</p>
        <h2>Te la llevo a Sabadell, Terrassa, Granollers…</h2>
        <p>Servicio a domicilio en toda la provincia de Barcelona, Cataluña central, Costa Brava y Costa Daurada,
          con tarifa económica en exclusiva para el Vallès Occidental y Caldes de Montbui. También entrego y
          recojo en los aeropuertos de Barcelona, Girona y Reus.</p>
      </div>
      <div class="acciones"><a class="btn btn-claro btn-lg" href="localidades.html">Ver mi zona</a></div>
    </div>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Ideas para tu viaje</p>
      <h2>Rutas que funcionan</h2>
    </div>
    <div class="rejilla r-3">
      <a class="card card-foto card-hover" href="https://sicamper.com/blog/rutas-autocaravana-norte-espana/" data-revelar="0">
        <div class="marco"><img src="img/ruta-norte.webp" alt="Hondarribia, ruta por el norte de España" loading="lazy" width="1000" height="563"></div>
        <div class="cuerpo"><span class="etiqueta">Rutas</span><h3>El norte de España en autocaravana</h3><p class="pequeno">Paisajes verdes, pueblos con encanto y paradas gastronómicas que justifican el desvío.</p><span class="enlace-flecha">Leer la ruta</span></div>
      </a>
      <a class="card card-foto card-hover" href="https://sicamper.com/blog/rutas-autocaravana-andalucia/" data-revelar="1">
        <div class="marco"><img src="img/ruta-andalucia.webp" alt="Costa del Sol, ruta por Andalucía" loading="lazy" width="1000" height="563"></div>
        <div class="cuerpo"><span class="etiqueta">Rutas</span><h3>Andalucía a tu ritmo</h3><p class="pequeno">Siete itinerarios entre playas, sierras y pueblos blancos, con áreas donde pernoctar.</p><span class="enlace-flecha">Leer la ruta</span></div>
      </a>
      <a class="card card-foto card-hover" href="https://sicamper.com/blog/rutas-4-dias-autocaravana-espana/" data-revelar="2">
        <div class="marco"><img src="img/ruta-4dias.webp" alt="Ruta de cuatro días en autocaravana" loading="lazy" width="1000" height="563"></div>
        <div class="cuerpo"><span class="etiqueta">Rutas</span><h3>Escapadas de 4 días</h3><p class="pequeno">Para un puente: naturaleza, cultura y kilómetros justos para no vivir en la carretera.</p><span class="enlace-flecha">Leer la ruta</span></div>
      </a>
    </div>
  </div>
</section>

%s
""" % (I["casa"], I["reloj"], I["mascota"], I["estrella"],
       I["nino"], I["ducha"], I["sol"],
       ventajas_grid(), TARIFAS_HTML, opiniones_seccion(), cta_final())

registrar(archivo="index.html", ruta="", prio="1.0", sobre_hero=True, preload="hero", og="hero",
          titulo="Alquiler de autocaravanas en Barcelona · Sí Camper",
          desc="Alquila una autocaravana McLouis Glamys de 7 plazas en Barcelona con entrega a domicilio y sin horarios. "
               "Desde 115 €/día, todo riesgo, pet friendly y presupuesto al instante.",
          cuerpo=INDEX)

# ═══════════════════════════════════════════════════════════════════════════
# PRECIOS
# ═══════════════════════════════════════════════════════════════════════════
CALCULADORA = """<section class="seccion" id="calculadora">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Calculadora</p>
      <h2>Cuánto te costaría exactamente</h2>
      <p class="entradilla">Pon tus fechas y calcula el precio con las tarifas reales: la temporada se detecta
        sola (incluidas Semana Santa y los puentes), y se aplican los mínimos, suplementos y descuentos que toquen.</p>
    </div>

    <form class="calc" id="calc" autocomplete="off">
      <div class="calc-panel">
        <div>
          <h3 style="font-size:1.15rem;margin-bottom:.9rem">1 · Tus fechas</h3>
          <div class="calc-fechas">
            <div class="campo"><label for="f-inicio">Día de salida</label><input type="date" id="f-inicio" name="inicio"></div>
            <div class="campo"><label for="f-fin">Día de vuelta</label><input type="date" id="f-fin" name="fin"></div>
          </div>
        </div>

        <div>
          <h3 style="font-size:1.15rem;margin-bottom:.9rem">2 · Entrega y devolución</h3>
          <div class="opciones">
            <label class="opcion">
              <input type="checkbox" id="o-domicilio">
              <span class="txt"><b>Entrega y recogida a domicilio</b><span>En tu portal, en lugar de venir al parking de Castellar</span></span>
              <span class="val">desde 35 €</span>
            </label>
          </div>
          <div class="calc-fechas" style="margin-top:.7rem">
            <div class="campo">
              <label for="o-hora-entrega">Hora de entrega</label>
              <select id="o-hora-entrega">
                <option value="normal">De 9 a 21 h · sin coste</option>
                <option value="franja">De 8 a 10 h o de 21 a 23 h · 35 €</option>
                <option value="nocturno">Antes de 8 h o después de 23 h · 70 €</option>
              </select>
            </div>
            <div class="campo">
              <label for="o-hora-devolucion">Hora de devolución</label>
              <select id="o-hora-devolucion">
                <option value="normal">De 9 a 21 h · sin coste</option>
                <option value="franja">De 8 a 10 h o de 21 a 23 h · 35 €</option>
                <option value="nocturno">Antes de 8 h o después de 23 h · 70 €</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h3 style="font-size:1.15rem;margin-bottom:.9rem">3 · Extras</h3>
          <div class="opciones">
            <label class="opcion">
              <input type="checkbox" id="o-cancelacion">
              <span class="txt"><b>Seguro de cancelación</b><span>Hasta 3.000 € o 34 días de viaje</span></span>
              <span class="val">6 % + fijo</span>
            </label>
            <label class="opcion">
              <input type="checkbox" data-consultar="kit hotel">
              <span class="txt"><b>Kit hotel</b><span>Sábanas, almohadas, nórdico y toallas</span></span>
              <span class="val consultar">a confirmar</span>
            </label>
            <label class="opcion">
              <input type="checkbox" data-consultar="kit camping">
              <span class="txt"><b>Kit camping</b><span>Mesa y sillas plegables, toldo o cenador</span></span>
              <span class="val consultar">a confirmar</span>
            </label>
            <label class="opcion">
              <input type="checkbox" data-consultar="portabicis">
              <span class="txt"><b>Portabicis homologado</b><span>Hasta 4 bicis, 60 kg, con placa V20</span></span>
              <span class="val consultar">a confirmar</span>
            </label>
            <label class="opcion">
              <input type="checkbox" data-consultar="sillita infantil">
              <span class="txt"><b>Sillita o elevador</b><span>Grupos 0/1/2 y 2/3, homologados ECE R44/04</span></span>
              <span class="val consultar">a confirmar</span>
            </label>
            <label class="opcion">
              <input type="checkbox" data-consultar="mascota">
              <span class="txt"><b>Mascota</b><span>Hasta 3, con limpieza a fondo a la vuelta</span></span>
              <span class="val consultar">a confirmar</span>
            </label>
          </div>
          <p class="nota" style="margin-top:.9rem">Los extras marcados como «a confirmar» no tienen precio público:
            te los cierro por escrito al confirmar la reserva y no se suman al total estimado.</p>
        </div>
      </div>

      <aside class="resumen" id="resultado" aria-live="polite">
        <h3>Tu presupuesto</h3>
        <p class="vacio">Elige las fechas de salida y de vuelta y verás al instante el precio, la temporada y lo que se incluye.</p>
      </aside>
    </form>
  </div>
</section>"""


def armar(tpl, **kw):
    """Sustituye @@CLAVE@@ para no pelearnos con los % de los porcentajes."""
    for k, v in kw.items():
        tpl = tpl.replace("@@%s@@" % k.upper(), v)
    return tpl

PRECIOS = armar("""
@@HERO@@

<section class="seccion">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Tarifas</p>
      <h2>Cuatro temporadas, cuatro precios</h2>
      <p class="entradilla">La tarifa depende de cuándo viajas, no de cuánto insistas. Estas son las tarifas
        diarias oficiales; abajo tienes la calculadora para ver tu total exacto.</p>
    </div>
    @@TARIFAS@@
  </div>
</section>

@@CALC@@

<section class="seccion bg-alt">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Ofertas y descuentos</p>
      <h2>Cuanto más tiempo, más barato el día</h2>
      <p class="entradilla">Descuentos vigentes todo el año en temporada baja y media. No son combinables
        entre temporadas, pero la calculadora los aplica sola cuando te tocan.</p>
    </div>
    <div class="tabla-env" data-revelar>
      <table class="datos-t">
        <caption class="sr">Descuentos por estancia larga y otras ofertas</caption>
        <thead><tr><th>Oferta</th><th>Condición</th><th>Precio</th></tr></thead>
        <tbody>
          <tr><td>Estancia larga · temporada baja</td><td>Mínimo 15 días</td><td>110 €/día</td></tr>
          <tr><td>Estancia larga · temporada baja</td><td>Mínimo 22 días</td><td>105 €/día</td></tr>
          <tr><td>Estancia larga · temporada baja</td><td>Mínimo 29 días</td><td>99 €/día</td></tr>
          <tr><td>Pack puentes y festivos</td><td>Mínimo 10 días en temporada media</td><td>149 €/día</td></tr>
          <tr><td>Reserva anticipada</td><td>Con 6 meses de antelación, mínimo 5 días, todas las temporadas</td><td>hasta −5 %</td></tr>
          <tr><td>Servicio a domicilio</td><td>Vallès Occidental y Caldes de Montbui</td><td>desde 35 €</td></tr>
          <tr><td>Fin de semana</td><td>Con 900 km incluidos</td><td>desde 395 €</td></tr>
        </tbody>
      </table>
    </div>
    <p class="nota" style="margin-top:1rem">Los descuentos de estancia larga no son combinables con otras
      temporadas. El de reserva anticipada se aplica al confirmar la reserva.</p>
  </div>
</section>

<section class="seccion">
  <div class="env dos-col">
    <div data-revelar>
      <p class="cejilla">Qué entra en el precio</p>
      <h2>Lo que no vas a pagar aparte</h2>
      <ul class="checks oliva" style="margin-top:1.5rem">
        <li>Seguro a todo riesgo con asistencia 24 h en Europa y países ribereños del Mediterráneo</li>
        <li>Kit de cocina completo: vajilla, cubiertos, ollas, sartén, cafetera, tuppers y menaje</li>
        <li>Kit de supervivencia: manguera, calzos, adaptador, antipinchazos, extintor y botiquín</li>
        <li>GPS con las medidas de la autocaravana ya cargadas</li>
        <li>Alarma centralizada, cierres de seguridad, manta ignífuga y cubrecárter metálico</li>
        <li>Wifi, Smart TV y placa solar de 120 W</li>
        <li>Parking gratis y videovigilado para tu coche durante todo el alquiler</li>
        <li>Depósitos vaciados, agua limpia y diésel llenos al recogerla</li>
        <li>Recogida de tu compra online en Bon Área, sin coste</li>
        <li>Limpieza a fondo: fundas y vajilla lavadas a máquina a 60 ºC</li>
      </ul>
    </div>
    <div data-revelar>
      <p class="cejilla">Lo que se paga aparte</p>
      <h2>Todo por escrito, desde el principio</h2>
      <div class="tabla-env" style="margin-top:1.5rem">
        <table class="datos-t">
          <caption class="sr">Costes que no están incluidos en la tarifa diaria</caption>
          <tbody>
            <tr><td>Fianza (coincide con la franquicia)</td><td>850 €</td></tr>
            <tr><td>Reservas de menos de 5 días</td><td>+50 €</td></tr>
            <tr><td>Kilómetro extra en reservas de menos de 7 días</td><td>0,35 €/km</td></tr>
            <tr><td>Entrega o devolución de 8 a 10 h y de 21 a 23 h</td><td>35 €</td></tr>
            <tr><td>Entrega o devolución antes de 8 h o después de 23 h</td><td>70 €</td></tr>
            <tr><td>Seguro de cancelación</td><td>coste fijo + 6 %</td></tr>
            <tr><td>Combustible o AdBlue que falte al devolver</td><td>3 €/litro</td></tr>
            <tr><td>Devolución sin limpiar</td><td>100 €</td></tr>
            <tr><td>Devolución con el WC sin vaciar</td><td>150 €</td></tr>
            <tr><td>Gestión de multas</td><td>35 €</td></tr>
            <tr><td>Pérdida de llaves o de documentación</td><td>500 €</td></tr>
          </tbody>
        </table>
      </div>
      <p class="nota" style="margin-top:1rem">La fianza se abona con tarjeta de crédito antes de salir y se
        devuelve en unos 7 días si no hay daños ni incidencias.</p>
    </div>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env env-estrecho">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Pagos y cancelaciones</p>
      <h2>Cómo y cuándo se paga</h2>
    </div>
    <ol class="pasos" data-revelar>
      <li class="paso"><div><h3>Con más de 30 días de antelación</h3><p>Pagas el 30 % para bloquear las fechas. Cuando falten 30 días te aviso para el pago final. Se acepta tarjeta de crédito y PayPal.</p></div></li>
      <li class="paso"><div><h3>Con menos de 30 días</h3><p>Se abona el 100 % en el momento de reservar.</p></div></li>
      <li class="paso"><div><h3>Fianza</h3><p>850 € con tarjeta de crédito, siempre antes de salir de viaje. En caso de cancelación no tiene ninguna penalización.</p></div></li>
      <li class="paso"><div><h3>Si tienes que cancelar</h3><p>Antes de 30 días: no se devuelve el 30 % de la reserva. Entre 30 y 14 días: se devuelve el 25 % del total. A menos de 14 días: sin devolución. Con seguro de cancelación queda cubierto hasta 3.000 € por causas justificadas.</p></div></li>
    </ol>
    <div class="acciones" style="margin-top:2rem" data-revelar>
      <a class="btn btn-primario" href="reservar.html">Solicitar mis fechas</a>
      <a class="btn btn-linea" href="faq.html">Leer las condiciones completas</a>
    </div>
  </div>
</section>

@@CTA@@
""",
  hero=hero_int("Precios y tarifas", "Precios del alquiler, sin letra pequeña",
                "Tarifas por temporada, descuentos de estancia larga y una calculadora que te da el total "
                "exacto antes de dejar ningún dato.", "arboles",
                [("index.html", "Inicio"), (None, "Precios")],
                '<div class="acciones" style="margin-top:1.8rem"><a class="btn btn-primario btn-lg" href="#calculadora">Calcular mi presupuesto</a></div>'),
  tarifas=TARIFAS_HTML, calc=CALCULADORA, cta=cta_final("¿Te cuadran los números?"))

registrar(archivo="precios.html", ruta="precios.html", prio="0.9", og="arboles", preload="arboles",
          titulo="Precios y tarifas del alquiler de autocaravanas · Sí Camper",
          desc="Tarifas por temporada desde 115 €/día, descuentos de estancia larga hasta 99 €/día y "
               "calculadora de presupuesto al instante. Lo que incluye y lo que se paga aparte.",
          cuerpo=PRECIOS)

# ═══════════════════════════════════════════════════════════════════════════
# LA AUTOCARAVANA
# ═══════════════════════════════════════════════════════════════════════════
# (archivo, texto alternativo, ocupa dos columnas)
# Solo las fotos horizontales van a doble ancho: recortar una vertical a 3/2 la destroza.
FOTOS_GALERIA = [
    ("int-1", "Baño: lavabo con espejo, grifo y toallas", False),
    ("int-2", "Una de las camas, hecha y lista", False),
    ("int-3", "Cocina: fogones de gas y fregadero", False),
    ("int-4", "Interior desde la entrada, con la cocina y el baño a los lados", False),
    ("int-5", "Mesa del salón puesta, con los asientos alrededor", False),
    ("int-6", "Detalle de los fogones y la encimera", False),
    ("int-7", "Zona de estar con la Smart TV y la mesa", False),
    ("int-8", "Asientos y mesa preparada para comer", False),
    ("valles-4", "Exterior de la autocaravana en el Vallès", True),
    ("lago", "Autocaravana aparcada frente a un lago", True),
    ("carretera", "Autocaravana vista desde detrás en carretera", False),
    ("montanas", "Autocaravana en un paisaje de montaña", False),
]
def galeria():
    b = []
    for f, alt, ancha in FOTOS_GALERIA:
        b.append('<button type="button" class="%s" aria-label="Ampliar: %s">'
                 '<img src="img/%s.webp" alt="%s" loading="lazy"></button>'
                 % ("ancha" if ancha else "", alt, f, alt))
    return '<div class="galeria">%s</div>' % "".join(b)

AUTOCARAVANA = armar("""
@@HERO@@

<section class="seccion-sm bg-alt">
  <div class="env datos">
    <div class="dato" data-revelar="0"><p class="n">7</p><p class="e">Plazas para viajar y dormir</p></div>
    <div class="dato" data-revelar="1"><p class="n">160<small> cv</small></p><p class="e">Diésel, caja manual de 6 marchas</p></div>
    <div class="dato" data-revelar="2"><p class="n">B</p><p class="e">Carné necesario · MMA 3.500 kg</p></div>
    <div class="dato" data-revelar="3"><p class="n">120<small> W</small></p><p class="e">Placa solar fotovoltaica</p></div>
    <div class="dato" data-revelar="4"><p class="n">7,0<small> m</small></p><p class="e">De largo · 3,20 alto · 2,40 ancho</p></div>
  </div>
</section>

<section class="seccion">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Por dentro</p>
      <h2>Una casa de verdad, con ruedas</h2>
      <p class="entradilla">La capuchina tiene una ventaja difícil de explicar hasta que la vives: la cama grande
        va sobre la cabina, así que el salón se queda montado. Nadie desmonta la mesa para dormir.</p>
    </div>
    @@GALERIA@@
    <p class="nota" style="margin-top:1rem">Pulsa cualquier foto para ampliarla. Se navega con las flechas del teclado.</p>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env dos-col">
    <div data-revelar>
      <p class="cejilla">Distribución</p>
      <h2>Dónde duerme cada uno</h2>
      <p class="entradilla">Siete plazas homologadas para circular y siete para dormir, en cuatro zonas
        independientes. Se puede repartir la familia sin que nadie moleste a nadie.</p>
      <div class="tabla-env" style="margin-top:1.6rem">
        <table class="datos-t">
          <caption class="sr">Camas de la autocaravana</caption>
          <thead><tr><th>Cama</th><th>Medidas</th></tr></thead>
          <tbody>
            <tr><td>Capuchina sobre la cabina</td><td>160 × 220 cm</td></tr>
            <tr><td>Dos literas traseras (una abatible)</td><td>90 × 210 cm</td></tr>
            <tr><td>Doble en el salón</td><td>120 × 180 cm</td></tr>
            <tr><td>Individual</td><td>70 × 145 cm</td></tr>
          </tbody>
        </table>
      </div>
      <p class="nota" style="margin-top:1rem">La litera abatible se recoge para ganar espacio de carga: bicis,
        tablas de surf o el equipaje de un viaje largo.</p>
    </div>
    <div class="marco-foto ratio-3-4" data-revelar><img src="img/int-2.webp" alt="Una de las camas de la autocaravana, hecha y lista" loading="lazy" width="600" height="800"></div>
  </div>
</section>

<section class="seccion">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Equipamiento</p>
      <h2>Full equip de verdad, no de folleto</h2>
    </div>
    <div class="rejilla r-3">
      <article class="card" data-revelar="0">
        <div class="icono-caja">@@ICO_CAMPER@@</div>
        <h3>Conducción</h3>
        <ul class="checks" style="margin-top:1rem">
          <li>Motor 2.200 cc de 160 cv, diésel con AdBlue</li>
          <li>Caja manual de 6 velocidades</li>
          <li>Control de crucero y cámara de marcha atrás</li>
          <li>Pantalla multimedia con Bluetooth</li>
          <li>GPS con las medidas del vehículo cargadas</li>
          <li>Aire acondicionado en cabina y asientos giratorios</li>
          <li>Oscurecedores Remis en cabina y célula</li>
        </ul>
      </article>
      <article class="card" data-revelar="1">
        <div class="icono-caja oliva">@@ICO_COCINA@@</div>
        <h3>Vivienda</h3>
        <ul class="checks oliva" style="margin-top:1rem">
          <li>Cocina completa con nevera grande y almacenaje</li>
          <li>Baño con WC y ducha independiente</li>
          <li>Agua caliente y calefacción combi de gas 4.000 W</li>
          <li>Doble bombona de propano de 11 kg</li>
          <li>Smart TV con antena y wifi</li>
          <li>Placa solar de 120 W y dos baterías</li>
          <li>Enchufes de 220 V, 12 V y USB</li>
        </ul>
      </article>
      <article class="card" data-revelar="2">
        <div class="icono-caja terra">@@ICO_ESCUDO@@</div>
        <h3>Seguridad</h3>
        <ul class="checks" style="margin-top:1rem">
          <li>Alarma centralizada y cierres de seguridad IMC</li>
          <li>Cubrecárter metálico</li>
          <li>Extintor y manta ignífuga</li>
          <li>Kit antipinchazos y calzos</li>
          <li>Botiquín con apósitos</li>
          <li>Seguro a todo riesgo con asistencia 24 h</li>
          <li>Sillitas y elevadores homologados ECE R44/04</li>
        </ul>
      </article>
    </div>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Autonomía real</p>
      <h2>Cuántos días puedes desaparecer</h2>
      <p class="entradilla">Cifras con un uso razonable de los recursos y cuatro personas a bordo.
        Ni optimistas ni de catálogo.</p>
    </div>
    <div class="tabla-env" data-revelar>
      <table class="datos-t">
        <caption class="sr">Autonomía de los depósitos y baterías</caption>
        <thead><tr><th>Recurso</th><th>Capacidad</th><th>Duración estimada</th></tr></thead>
        <tbody>
          <tr><td>Agua limpia</td><td>120 litros</td><td>2 días para 4 personas</td></tr>
          <tr><td>Aguas grises</td><td>100 litros</td><td>2 días para 4 personas</td></tr>
          <tr><td>Gas propano</td><td>2 bombonas de 11 kg</td><td>8 semanas en verano · 2 en invierno</td></tr>
          <tr><td>Diésel</td><td>65 litros</td><td>10–13 l cada 100 km</td></tr>
          <tr><td>Electricidad sin sol ni 220 V</td><td>Batería auxiliar</td><td>3 días para 4 personas</td></tr>
          <tr><td>Electricidad con placa solar</td><td>120 W</td><td>Ilimitada</td></tr>
        </tbody>
      </table>
    </div>
    <p class="nota" style="margin-top:1rem">Para recargar las baterías basta con circular o enchufar la
      autocaravana a una toma doméstica de 220 V.</p>
  </div>
</section>

<section class="seccion">
  <div class="env dos-col aside-izq">
    <div class="marco-foto ratio-4-3" data-revelar><img src="img/valles-10.webp" alt="Autocaravana Sí Camper en una carretera del Vallès" loading="lazy" width="1200" height="562"></div>
    <div data-revelar>
      <p class="cejilla">Primera vez</p>
      <h2>Se conduce mejor de lo que crees</h2>
      <p class="entradilla">Con carné B y dos años de antigüedad ya puedes llevarla. Tiene consideración de
        turismo: 120 km/h en autopista y 90 en carretera. Aun así, la recomendación es no pasar de 100.</p>
      <ul class="checks" style="margin-top:1.5rem">
        <li>Sin prisas: ábrete en las curvas y frena antes de los baches</li>
        <li>Atento a los árboles bajos y, sobre todo, a las marquesinas de gasolineras y parkings</li>
        <li>Recuerda que llevas armarios, mampara y vajilla detrás: lo que no se sujeta, viaja</li>
        <li>Nada de control de crucero de noche: es cuando peor se ajusta la velocidad a la vía</li>
        <li>Antes de salir repasamos juntos todos los puntos del vehículo, sin reloj</li>
      </ul>
      <div class="acciones" style="margin-top:1.8rem">
        <a class="btn btn-tinta" href="faq.html">Todas las dudas resueltas</a>
        <a class="enlace-flecha" href="reservar.html">Comprobar fechas</a>
      </div>
    </div>
  </div>
</section>

@@CTA@@
""",
  hero=hero_int("La autocaravana", "McLouis Glamys: 7 plazas y ganas de carretera",
                "Capuchina tope de gama, mantenida al día y entregada limpia, con los depósitos vaciados, "
                "el agua y el diésel llenos y las baterías cargadas.", "valles-5",
                [("index.html", "Inicio"), (None, "La autocaravana")],
                '<div class="acciones" style="margin-top:1.8rem"><a class="btn btn-primario btn-lg" href="reservar.html">Comprobar fechas</a><a class="btn btn-fantasma btn-lg" href="precios.html#calculadora">Ver precios</a></div>'),
  galeria=galeria(), cta=cta_final("¿La quieres en tu puerta?"),
  ico_camper=I["camper"], ico_cocina=I["cocina"], ico_escudo=I["escudo"])

registrar(archivo="autocaravana.html", ruta="autocaravana.html", prio="0.8", og="valles-5", preload="valles-5",
          titulo="La autocaravana: McLouis Glamys de 7 plazas · Sí Camper",
          desc="Fotos, distribución de camas, equipamiento y autonomía real de la autocaravana McLouis Glamys "
               "de alquiler en Barcelona. 160 cv, carné B, baño con ducha independiente y placa solar.",
          cuerpo=AUTOCARAVANA)

# ═══════════════════════════════════════════════════════════════════════════
# SERVICIOS Y EXTRAS
# ═══════════════════════════════════════════════════════════════════════════
INCLUIDO = [
    ("full-equip", "Autocaravana full equip", "Incluido",
     "Cocina equipada, aire acondicionado, calefacción, doble bombona de gas, Smart TV, placa solar y alarma."),
    ("kit-supervivencia", "Kit de supervivencia", "Incluido",
     "Adaptador eléctrico con cable largo, manguera con boquillas, calzos, kit antipinchazos, extintor, botiquín y material de limpieza."),
    ("kit-cocina", "Kit de cocina completo", "Incluido",
     "Vajilla, vasos, cubiertos, ollas, sartén, cafetera, tablas, tuppers, manteles, jabón y estropajo."),
    ("gps", "Navegador GPS", "Incluido",
     "Con las medidas de la autocaravana cargadas, para que no te meta por un camino imposible."),
    ("seguridad", "Seguridad adicional", "Incluido",
     "Alarma centralizada, cierres de seguridad, extintor, manta ignífuga y cubrecárter metálico."),
    ("parking", "Parking para tu coche", "Incluido",
     "Plaza gratis en el Parking Terralta de Castellar del Vallès durante todo el alquiler, videovigilada 24 h."),
    ("nevera", "Nevera llena al salir", "Incluido",
     "Haces la compra online en Bon Área, la recojo yo y te espera dentro. Sin coste adicional."),
    ("limpieza", "Higiene y limpieza a fondo", "Incluido",
     "Fundas de cama y de asiento y vajilla lavadas a máquina a 60 ºC. Interior desinfectado, con foco en baño y cocina."),
]
EXTRAS = [
    ("kit-hotel", "Kit hotel", "Opcional",
     "Sábanas, almohada, fundas y relleno nórdico, más toalla de baño y de ducha. Pack de verano o de invierno."),
    ("sillitas", "Sillita y elevador", "Opcional",
     "Grupo 0/1/2 para 0–25 kg y grupo 2/3 para 15–36 kg, homologados ECE R44/04, con arnés de 5 puntos."),
    ("kit-camping", "Kit camping", "Opcional",
     "Mesa y sillas plegables, ligeras y fáciles de guardar, y toldo abatible o cenador plegable."),
    ("portabicis", "Portabicis homologado", "Opcional",
     "Hasta 4 bicis y 60 kg, plegable, con funda impermeable y la placa V20 de señalización obligatoria."),
    ("mascotas", "Mascotas", "Opcional",
     "Hasta 3 mascotas. A la vuelta se hace una limpieza exhaustiva del interior para evitar alergias y olores."),
]
def tarjetas_servicio(lista):
    out = []
    for n, (foto, titulo, etiqueta, texto) in enumerate(lista):
        clase = "gratis" if etiqueta == "Incluido" else "extra"
        out.append("""<article class="card card-foto card-hover" data-revelar="%d">
  <div class="marco"><img src="img/%s.webp" alt="%s" loading="lazy"></div>
  <div class="cuerpo"><span class="etiqueta %s">%s</span><h3>%s</h3><p class="pequeno">%s</p></div>
</article>""" % (n, foto, titulo, clase, etiqueta, titulo, texto))
    return "".join(out)

SERVICIOS = armar("""
@@HERO@@

<section class="seccion">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Incluido de serie</p>
      <h2>Ocho cosas que no te van a cobrar</h2>
      <p class="entradilla">La idea es que no tengas que pensar en nada. Todo esto va dentro del precio del
        alquiler, sin asteriscos.</p>
    </div>
    <div class="rejilla r-4">@@INCLUIDO@@</div>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Extras opcionales</p>
      <h2>Y cinco que puedes añadir</h2>
      <p class="entradilla">Se marcan al hacer la reserva. El precio te lo confirmo por escrito según lo que
        elijas y las fechas, porque depende de la disponibilidad de cada temporada.</p>
    </div>
    <div class="rejilla r-3">@@EXTRAS@@</div>
    <div class="acciones" style="margin-top:2rem" data-revelar>
      <a class="btn btn-primario" href="reservar.html">Pedir precio de los extras</a>
    </div>
  </div>
</section>

<section class="seccion">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Servicios</p>
      <h2>Lo que hace la diferencia</h2>
      <p class="entradilla">Aquí está lo que no encontrarás en una empresa grande: te la llevo, sin horarios,
        y hablas siempre con la misma persona.</p>
    </div>
    <div class="rejilla r-2">
      <article class="card" data-revelar="0">
        <div class="icono-caja">@@ICO_CASA@@</div>
        <h3>Servicio a domicilio <span class="etiqueta" style="vertical-align:middle">desde 35 €</span></h3>
        <p>Si no quieres desplazarte, te entrego la autocaravana donde tú digas. Tarifa económica en exclusiva
          para el Vallès Occidental y Caldes de Montbui.</p>
        <ul class="checks" style="margin-top:1.1rem">
          <li>Provincia de Barcelona</li><li>Cataluña central</li><li>Costa Brava y Costa Daurada</li>
        </ul>
      </article>
      <article class="card" data-revelar="1">
        <div class="icono-caja">@@ICO_AVION@@</div>
        <h3>Entrega y devolución en aeropuerto</h3>
        <p>Llegas en avión y te la encuentras allí. Sin taxis, sin trenes y sin arrastrar maletas de una
          terminal a otra. Más económico que en otras empresas de alquiler.</p>
        <ul class="checks" style="margin-top:1.1rem">
          <li>Barcelona-El Prat</li><li>Girona-Costa Brava</li><li>Reus (Tarragona)</li>
        </ul>
      </article>
      <article class="card" data-revelar="2">
        <div class="icono-caja">@@ICO_RELOJ@@</div>
        <h3>Entrega y devolución sin horarios</h3>
        <p>De lunes a domingo, 24 horas. El horario lo pones tú.</p>
        <div class="tabla-env" style="margin-top:1.1rem">
          <table class="datos-t">
            <tbody>
              <tr><td>De 9 a 21 h</td><td>gratis</td></tr>
              <tr><td>De 8 a 10 h y de 21 a 23 h</td><td>35 €</td></tr>
              <tr><td>Antes de 8 h o después de 23 h</td><td>70 €</td></tr>
            </tbody>
          </table>
        </div>
      </article>
      <article class="card" data-revelar="3">
        <div class="icono-caja terra">@@ICO_CHISPA@@</div>
        <h3>Seguro de cancelación <span class="etiqueta extra" style="vertical-align:middle">fijo + 6 %</span></h3>
        <p>Los niños, el trabajo, lo que sea. Con el seguro de cancelación proteges hasta 3.000 € o 34 días
          de viaje por causas justificadas.</p>
        <p class="nota" style="margin-top:.8rem">Se contrata durante la reserva y se abona por completo en ese
          momento, aportando el DNI de todos los viajeros.</p>
      </article>
      <article class="card" data-revelar="4">
        <div class="icono-caja oliva">@@ICO_ESCUDO@@</div>
        <h3>Seguro a todo riesgo <span class="etiqueta gratis" style="vertical-align:middle">Incluido</span></h3>
        <p>Póliza específica para autocaravanas de alquiler con franquicia de 850 € en daños propios exteriores,
          que es exactamente la fianza que dejas.</p>
        <ul class="checks oliva" style="margin-top:1.1rem">
          <li>Asistencia 24 h los 365 días</li>
          <li>Europa y países ribereños del Mediterráneo</li>
          <li>Repatriación de viajeros y gastos de hotel</li>
        </ul>
      </article>
      <article class="card" data-revelar="5">
        <div class="icono-caja">@@ICO_AURICULAR@@</div>
        <h3>Atención personalizada <span class="etiqueta gratis" style="vertical-align:middle">Incluido</span></h3>
        <p>Soporte telefónico los 365 días del año, antes y durante el viaje. Si surge algo por el camino y
          está en mi mano resolverlo, lo resuelvo.</p>
        <div class="acciones" style="margin-top:1.2rem">
          <a class="btn btn-linea btn-sm" href="tel:@@TEL_URL@@">@@ICO_TEL@@ @@TEL@@</a>
        </div>
      </article>
    </div>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env dos-col">
    <div data-revelar>
      <p class="cejilla">Nevera llena · incluido</p>
      <h2>Sales de viaje con la compra hecha</h2>
      <p class="entradilla">Qué pereza pasar por el súper el día de salida. Hazla online y yo la recojo por ti,
        sin coste adicional.</p>
      <ol class="pasos" style="margin-top:1.6rem">
        <li class="paso"><div><h3>Entra en la web de Bon Área</h3><p>Regístrate y haz tu compra como siempre.</p></div></li>
        <li class="paso"><div><h3>Elige «recogida en tienda»</h3><p>Provincia Barcelona, tienda de Castellar del Vallès.</p></div></li>
        <li class="paso"><div><h3>Escoge una fecha cercana a tu salida</h3><p>La compra tarda 2 días laborables en llegar a la tienda.</p></div></li>
        <li class="paso"><div><h3>Paga y mándame el tique</h3><p>Yo la recojo y te espera dentro de la autocaravana, lista para salir.</p></div></li>
      </ol>
    </div>
    <div class="marco-foto ratio-4-3" data-revelar><img src="img/nevera.webp" alt="Nevera de la autocaravana llena antes de salir de viaje" loading="lazy" width="470" height="320"></div>
  </div>
</section>

@@CTA@@
""",
  hero=hero_int("Servicios y complementos", "Casi todo va incluido. Lo demás, lo pones tú",
                "Menaje, kit de supervivencia, GPS, seguridad, limpieza a fondo y parking. Y una lista corta "
                "de extras opcionales para que el viaje te encaje al milímetro.", "puerta",
                [("index.html", "Inicio"), (None, "Servicios y extras")]),
  incluido=tarjetas_servicio(INCLUIDO), extras=tarjetas_servicio(EXTRAS),
  cta=cta_final("Dime qué necesitas y te lo preparo"),
  ico_casa=I["casa"], ico_avion=I["avion"], ico_reloj=I["reloj"], ico_chispa=I["chispa"],
  ico_escudo=I["escudo"], ico_auricular=I["auricular"], ico_tel=I["tel"],
  tel=TEL, tel_url=TEL_URL)

registrar(archivo="servicios.html", ruta="servicios.html", prio="0.8", og="puerta", preload="puerta",
          titulo="Servicios y extras del alquiler de autocaravanas · Sí Camper",
          desc="Qué va incluido en el alquiler (menaje, kit de supervivencia, GPS, parking, limpieza a fondo, "
               "nevera llena) y qué extras puedes añadir: kit hotel, portabicis, sillitas, kit camping y mascotas.",
          cuerpo=SERVICIOS)

# ═══════════════════════════════════════════════════════════════════════════
# PREGUNTAS FRECUENTES
# ═══════════════════════════════════════════════════════════════════════════
import json, re as _re

FAQ = [
 ("reservar", "Reservar y pagar", [
  ("¿Cómo hago la reserva?",
   "<p>Desde esta web: eliges fechas, ves el precio y mandas la solicitud. Yo te confirmo por escrito la "
   "disponibilidad y el importe final. Si prefieres hablarlo antes, llámame o escríbeme por WhatsApp.</p>"),
  ("¿Cómo se pagan las reservas?",
   "<p>Si reservas con <strong>más de 30 días</strong> de antelación, abonas el <strong>30 %</strong>. "
   "Pasado ese límite, el <strong>100 %</strong>. Si pagaste el 30 %, me pongo en contacto contigo para el pago final. "
   "Se acepta tarjeta de crédito y PayPal.</p>"),
  ("¿Existe posibilidad de cancelación?",
   "<p>Sí, con estas penalizaciones:</p><ul>"
   "<li>Cancelando <strong>antes de 30 días</strong> del inicio: no se devuelve la reserva del 30 %.</li>"
   "<li>Entre <strong>30 y 14 días</strong> (posterior al pago total): se devuelve el 25 % del total.</li>"
   "<li><strong>A menos de 14 días</strong>: no hay devolución.</li></ul>"
   "<p>Con el seguro de cancelación te ahorras el disgusto.</p>"),
  ("¿Cómo funciona el seguro de cancelación?",
   "<p>Se contrata durante la reserva. Cubre hasta <strong>3.000 €</strong> y/o hasta <strong>34 días</strong> de viaje, "
   "con un coste fijo más el <strong>6 %</strong> del valor total de la reserva. Solo cubre causas justificadas y se abona "
   "íntegro en la reserva, aportando el DNI de todos los viajeros, adultos y niños.</p>"),
  ("¿Cuántas personas pueden viajar?",
   "<p>La autocaravana está homologada para <strong>7 personas</strong> viajando y 7 plazas de cama, repartidas en "
   "capuchina, dos literas, doble de salón e individual.</p>"),
 ]),
 ("fianza", "Fianza y seguros", [
  ("¿Qué es la fianza y por qué la pago?",
   "<p>Es una previsión para posibles responsabilidades, daños, pérdidas o cargos, y para cubrir el valor de la "
   "franquicia que exige la póliza en caso de siniestro con culpa. La franquicia corresponde solo a un golpe o "
   "siniestro en el exterior del vehículo durante la circulación; no cubre el total del vehículo ni los daños "
   "derivados de un mal uso o una negligencia.</p>"
   "<p>La fianza no limita la responsabilidad del arrendatario: se penaliza tanto el mal uso como los distintos "
   "siniestros, en la misma o en diferentes zonas del vehículo.</p>"),
  ("¿Cuánto cuesta y cuándo se paga?",
   "<p><strong>850 €</strong>, que coincide con la franquicia. Se paga únicamente con tarjeta de "
   "<strong>crédito</strong> y siempre antes de emprender el viaje. Necesito el nombre del titular, número, "
   "caducidad y CVV, además de una copia del DNI, CIF o pasaporte del titular.</p>"),
  ("¿Cuándo me devuelven la fianza?",
   "<p>En un plazo aproximado de <strong>7 días</strong> si no se detectan daños ni incidencias. Si hay daños "
   "externos o internos, penalizaciones o cargos, se conserva hasta conocer el importe de cada uno y te paso "
   "un presupuesto lo antes posible.</p>"),
  ("Si cancelo, ¿afecta a la fianza?",
   "<p>No. Hayas contratado seguro de cancelación o no, la fianza no tiene ninguna penalización.</p>"),
  ("¿Qué seguro lleva la autocaravana?",
   "<p>Seguro a <strong>todo riesgo</strong> con asistencia 24 h/365 en toda Europa y países ribereños del "
   "Mediterráneo, específico para autocaravanas de alquiler, con una franquicia de igual valor a la fianza para "
   "daños propios exteriores.</p>"),
 ]),
 ("conducir", "Conducir", [
  ("¿Qué edad hay que tener?",
   "<p>El conductor que reserva debe ser <strong>mayor de 23 años</strong> y estar presente en la entrega y la "
   "devolución para firmar el contrato.</p>"),
  ("¿Qué carné necesito?",
   "<p>Carné <strong>B</strong> en vigor, válido para circular por España y Europa, con más de dos años de "
   "antigüedad. El carné B autoriza vehículos de hasta 3.500 kg de MMA, que es el límite de esta autocaravana.</p>"),
  ("¿Cómo se conduce una autocaravana?",
   "<p>Sin prisas: ábrete en las curvas, frena en los baches y atención a los árboles y, sobre todo, a las "
   "<strong>marquesinas de gasolineras y parkings</strong>. Recuerda que llevas una casa sobre ruedas de "
   "7,00 × 3,20 × 2,40 m, con armarios, mampara de baño, vajilla y cocina detrás.</p>"),
  ("¿A qué velocidad puedo circular?",
   "<p>Al conducirse con carné B tiene consideración de turismo: <strong>120 km/h</strong> en autopista y "
   "<strong>90 km/h</strong> en carretera; en poblado, según señalización. Por seguridad, comodidad, estabilidad "
   "y consumo, se recomienda no pasar de 100 km/h y no usar el control de crucero de noche.</p>"),
  ("¿Qué documentación tengo que presentar?",
   "<p>Foto delantera y trasera del DNI y del carné B de los conductores. Si contratas seguro de cancelación, "
   "también el DNI de todos los viajeros. Conductores de fuera de Europa: carné internacional y pasaporte. "
   "Todo por email a info@sicamper.com indicando el número de reserva y las fechas.</p>"),
 ]),
 ("entrega", "Recogida y entrega", [
  ("¿Dónde puedo recogerla y devolverla?",
   "<p>Hago entregas y devoluciones a domicilio en la provincia de Barcelona y la costa catalana, con servicio "
   "económico en exclusiva para el <strong>Vallès Occidental</strong> y Caldes de Montbui. También doy servicio en "
   "los aeropuertos de Barcelona, Girona y Reus. Y si lo prefieres, la recoges tú en el Parking Terralta de "
   "Castellar del Vallès.</p>"),
  ("¿Dónde dejo mi coche si voy a recogerla?",
   "<p>Puedes estacionarlo <strong>gratis</strong> durante todo el alquiler en el Parking Terralta de Castellar "
   "del Vallès, videovigilado 24 h. También te presto una funda impermeable para protegerlo.</p>"),
  ("¿Cuál es el horario de entrega y devolución?",
   "<p>No hay: lo eliges tú, de lunes a domingo. De 9 a 21 h no cuesta nada. De 8 a 10 h y de 21 a 23 h, 35 € por "
   "servicio. Antes de las 8 h o después de las 23 h, 70 € por servicio.</p>"),
  ("¿Me explicarás cómo funciona?",
   "<p>Claro. Repasamos juntos todos los puntos de la autocaravana para que salgas con la información completa, y "
   "puedes contactarme siempre que lo necesites durante el viaje.</p>"),
  ("¿En qué estado me la entregas?",
   "<p>Limpia, con las fundas de asientos y colchones lavadas, los depósitos residuales vacíos, los de agua limpia "
   "y diésel llenos y las baterías cargadas: se recargan solas con la placa solar y el motor.</p>"),
  ("¿En qué estado debo devolverla?",
   "<p>Exactamente igual. Si el depósito de diésel o de AdBlue no viene lleno, se aplica un recargo de 3 € por "
   "litro pendiente de cada uno. Sin limpiar, 100 €. Con el WC sin vaciar, 150 €.</p>"),
 ]),
 ("carretera", "En la carretera", [
  ("¿Cuál es la autonomía de los depósitos?",
   "<p>Con un uso responsable y cuatro personas: agua limpia (120 l) 2 días; aguas grises (100 l) 2 días; gas "
   "(2 bombonas de propano de 11 kg) 8 semanas en verano y 2 en invierno; diésel (65 l) con un consumo de 10 a 13 "
   "litros a los 100 km; electricidad sin sol ni 220 V, 3 días con la batería auxiliar; con placa solar, "
   "ilimitada.</p>"),
  ("¿Dónde puedo llenar y vaciar los depósitos?",
   "<p>En muchas áreas de servicio, gasolineras y campings, donde además puedes comprar bombonas de propano. "
   "El vaciado de aguas grises y del WC exige una señalización específica que lo habilite: hacerlo en la vía "
   "pública está terminantemente prohibido y muy castigado, con especial atención a zonas de interés paisajístico. "
   "Si no sabes dónde, te ayudo encantado.</p>"),
  ("¿Cuántos kilómetros puedo hacer?",
   "<p>Todas las temporadas incluyen <strong>kilómetros ilimitados</strong> a partir de 5 días de viaje (en "
   "temporada baja, a partir de 7). Para reservas inferiores, el límite es de 300 km/día con 0,35 €/km extra. "
   "También hay packs adicionales de kilometraje para estancias cortas.</p>"),
  ("¿A dónde puedo viajar?",
   "<p>A toda Europa y los países ribereños del Mediterráneo, siempre por zonas habilitadas y carreteras "
   "pavimentadas: están expresamente prohibidos los caminos de tierra, campo o montaña. Quedan excluidos los "
   "países con conflictos bélicos y los no incluidos en el listado de las condiciones de alquiler.</p>"),
  ("¿Y si me multan?",
   "<p>La multa te llega a ti, siempre. Si hay que gestionarla, se aplica un recargo de 35 €. Ojo: acampar donde "
   "no se debe en España puede costar hasta 6.000 €.</p>"),
 ]),
 ("normas", "Pernocta, mascotas y normas", [
  ("¿Dónde puedo pasar la noche?",
   "<p>Estacionar un turismo en la vía pública está permitido siguiendo las normas de circulación, pero una "
   "autocaravana no tiene esa consideración aunque se conduzca con carné B. Y que puedas estacionar no garantiza "
   "que puedas pernoctar. En general, en España se permite siempre que no causes impacto en el exterior, como si "
   "fuera una acampada. Para orientarte: <strong>Park4night</strong>, <strong>Caramaps</strong> y Google Maps.</p>"),
  ("¿Qué se considera acampar?",
   "<p>Ocupar con cualquier elemento un espacio mayor que la superficie en planta del vehículo: una silla, un "
   "toldo o incluso una ventana abierta. Para que no cuente como acampada, las únicas ventanas que pueden abrirse "
   "son las claraboyas del techo. Acampar en la vía pública está prohibido: solo en áreas privadas y campings.</p>"),
  ("¿Puedo llevar mascotas?",
   "<p>Por supuesto, hasta <strong>3</strong>, marcándolo en la reserva. A la vuelta hago una limpieza exhaustiva "
   "del interior para evitar alergias y olores.</p>"),
  ("¿Está permitido fumar?",
   "<p>No, ni en la cabina ni en el habitáculo, ni circulando ni estacionados, ni con cigarrillos convencionales "
   "ni electrónicos.</p>"),
  ("¿Y si pierdo las llaves o la documentación?",
   "<p>La pérdida de llaves y/o de documentación conlleva un recargo de 500 € por cada una.</p>"),
  ("¿Y el portabicis?",
   "<p>Siempre debe ir señalizado con la placa homologada <strong>V20</strong>, que te entrego si alquilas ese "
   "extra. Admite hasta 4 bicis y 60 kg.</p>"),
 ]),
]

def faq_html():
    bloques = []
    for cat, titulo, preguntas in FAQ:
        detalles = "".join(
            '<details><summary>%s</summary><div class="contenido">%s</div></details>' % (p, r)
            for p, r in preguntas)
        bloques.append('<div class="faq-grupo" data-cat="%s"><h2 style="font-size:1.5rem;margin:2.2rem 0 1rem">%s</h2>'
                       '<div class="acordeon">%s</div></div>' % (cat, titulo, detalles))
    return "".join(bloques)

def faq_ld():
    items = []
    for _, _, preguntas in FAQ:
        for p, r in preguntas:
            texto = _re.sub(r"<[^>]+>", " ", r)
            texto = _re.sub(r"\s+", " ", texto).strip()
            items.append({"@type": "Question", "name": p,
                          "acceptedAnswer": {"@type": "Answer", "text": texto}})
    return '<script type="application/ld+json">%s</script>' % json.dumps(
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": items},
        ensure_ascii=False, indent=1)

def tabs_faq():
    b = ['<button type="button" data-cat="todo" aria-pressed="true">Todas</button>']
    for cat, titulo, _ in FAQ:
        b.append('<button type="button" data-cat="%s" aria-pressed="false">%s</button>' % (cat, titulo))
    return '<div class="tabs-faq" role="group" aria-label="Filtrar las preguntas por tema">%s</div>' % "".join(b)

PAGINA_FAQ = armar("""
@@HERO@@

<section class="seccion">
  <div class="env env-estrecho">
    <div class="buscador-faq">
      @@ICO_LUPA@@
      <label class="sr" for="faq-buscar">Buscar en las preguntas frecuentes</label>
      <input type="search" id="faq-buscar" placeholder="Busca: fianza, mascotas, kilómetros, pernocta…">
    </div>
    @@TABS@@
    @@ACORDEON@@
    <p class="sin-resultados" hidden>No encuentro nada con esas palabras. Prueba con otro término o
      <a href="contacto.html">escríbeme directamente</a>.</p>

    <div class="card" id="condiciones" style="margin-top:3rem">
      <div class="icono-caja">@@ICO_ESCUDO@@</div>
      <h3>¿Sigues con dudas?</h3>
      <p>El condicionado general del alquiler te lo mando por email antes de firmar nada, y lo repasamos juntos
        si quieres. Nada de sorpresas en el último momento.</p>
      <div class="acciones" style="margin-top:1.3rem">
        <a class="btn btn-primario" href="contacto.html">Preguntarme lo que sea</a>
        <a class="btn btn-linea" href="@@WA@@" rel="noopener">WhatsApp</a>
      </div>
    </div>
  </div>
</section>

@@CTA@@
""",
  hero=hero_int("Preguntas frecuentes", "Todo lo que se suele preguntar, respondido",
                "Treinta y una preguntas reales sobre fianza, seguros, kilómetros, pernocta y mascotas. "
                "Busca por palabras o filtra por tema.", "carretera",
                [("index.html", "Inicio"), (None, "Preguntas frecuentes")]),
  ico_lupa=I["lupa"], tabs=tabs_faq(), acordeon=faq_html(), ico_escudo=I["escudo"], wa=WA,
  cta=cta_final("Sin dudas, a por las fechas"))

registrar(archivo="faq.html", ruta="faq.html", prio="0.7", og="carretera", preload="carretera",
          titulo="Preguntas frecuentes del alquiler de autocaravanas · Sí Camper",
          desc="Fianza, seguros, carné, kilómetros incluidos, horarios de entrega, pernocta, mascotas y "
               "cancelaciones. Las 31 dudas más habituales del alquiler de autocaravanas, respondidas.",
          ld=faq_ld(), cuerpo=PAGINA_FAQ)

# ═══════════════════════════════════════════════════════════════════════════
# RESERVAR
# ═══════════════════════════════════════════════════════════════════════════
RESERVAR = armar("""
@@HERO@@

@@CALC@@

<section class="seccion bg-alt" id="solicitud">
  <div class="env env-estrecho">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Solicitud de reserva</p>
      <h2>Mándame los datos y te confirmo</h2>
      <p class="entradilla">Esto no cobra nada ni bloquea nada todavía: es una solicitud. Reviso el calendario y
        te contesto el mismo día con la disponibilidad y el precio final por escrito.</p>
    </div>

    <form class="calc-panel" data-mailto="@@EMAIL@@" data-asunto="Solicitud de reserva desde sicamper.com" novalidate>
      <div>
        <h3 style="font-size:1.15rem;margin-bottom:.9rem">Tus fechas</h3>
        <div class="calc-fechas">
          <div class="campo"><label for="r-inicio">Salida</label><input type="text" id="r-inicio" name="salida" readonly placeholder="Elige arriba las fechas"></div>
          <div class="campo"><label for="r-fin">Vuelta</label><input type="text" id="r-fin" name="vuelta" readonly placeholder="Elige arriba las fechas"></div>
          <div class="campo"><label for="r-temporada">Temporada</label><input type="text" id="r-temporada" name="temporada" readonly></div>
          <div class="campo"><label for="r-noches">Noches</label><input type="text" id="r-noches" name="noches" readonly></div>
        </div>
        <div class="campo" style="margin-top:.8rem"><label for="r-total">Presupuesto estimado</label><input type="text" id="r-total" name="estimado" readonly></div>
        <p class="nota" style="margin-top:.6rem">Se rellenan solos con la calculadora de arriba.</p>
      </div>

      <div>
        <h3 style="font-size:1.15rem;margin-bottom:.9rem">Cómo te localizo</h3>
        <div class="calc-fechas">
          <div class="campo"><label for="r-nombre">Nombre y apellidos *</label><input type="text" id="r-nombre" name="nombre" required autocomplete="name"></div>
          <div class="campo"><label for="r-tel">Teléfono *</label><input type="tel" id="r-tel" name="telefono" required autocomplete="tel" placeholder="+34 …"></div>
          <div class="campo"><label for="r-email">Email *</label><input type="email" id="r-email" name="email" required autocomplete="email"></div>
          <div class="campo"><label for="r-personas">¿Cuántos viajáis?</label>
            <select id="r-personas" name="personas">
              <option>2 personas</option><option>3 personas</option><option>4 personas</option>
              <option>5 personas</option><option>6 personas</option><option>7 personas</option>
            </select>
          </div>
        </div>
        <div class="campo" style="margin-top:.8rem">
          <label for="r-lugar">¿Dónde quieres que te la lleve?</label>
          <input type="text" id="r-lugar" name="lugar" placeholder="Localidad, o «la recojo en Castellar»">
          <span class="ayuda">Provincia de Barcelona, Cataluña central, Costa Brava y Costa Daurada. También aeropuertos.</span>
        </div>
        <div class="campo" style="margin-top:.8rem">
          <label for="r-mensaje">Algo que deba saber</label>
          <textarea id="r-mensaje" name="mensaje" placeholder="Mascotas, niños y edades, extras que te interesan, dudas sobre el horario…"></textarea>
        </div>
      </div>

      <div>
        <label class="opcion" style="align-items:flex-start">
          <input type="checkbox" id="r-privacidad" name="privacidad" required>
          <span class="txt"><b>He leído y acepto la política de privacidad *</b>
            <span>Responsable: Ismael Lázaro Cifuentes. Finalidad: responder a tu solicitud. Tus datos no se ceden a terceros.
              Puedes ejercer tus derechos escribiendo a @@EMAIL@@. <a href="legal.html#privacidad">Más información</a>.</span></span>
        </label>
      </div>

      <div class="acciones">
        <button class="btn btn-primario btn-lg" type="submit">Enviar la solicitud</button>
        <a class="btn btn-linea btn-lg" href="@@WA@@" rel="noopener">@@ICO_WA@@ Mejor por WhatsApp</a>
      </div>
      <p class="nota enviado" hidden>Se ha abierto tu programa de correo con la solicitud preparada. Si no se abre,
        copia los datos y mándamelos a @@EMAIL@@ o por WhatsApp.</p>
      <p class="nota">Al enviar se abre tu cliente de correo con todo relleno: así el mensaje sale de tu buzón y
        tienes copia de lo que me has pedido.</p>
    </form>

    <div class="rejilla r-3" style="margin-top:2.5rem">
      <div class="sello" data-revelar="0">@@ICO_TEL@@<div><b>@@TEL@@</b><span>Los 365 días del año</span></div></div>
      <div class="sello" data-revelar="1">@@ICO_CORREO@@<div><b>@@EMAIL@@</b><span>Respuesta el mismo día</span></div></div>
      <div class="sello" data-revelar="2">@@ICO_ESCUDO@@<div><b>Sin pagar nada aún</b><span>Primero confirmo yo</span></div></div>
    </div>
  </div>
</section>

<section class="seccion">
  <div class="env env-estrecho">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Qué pasa después</p>
      <h2>De la solicitud a la carretera</h2>
    </div>
    <ol class="pasos" data-revelar>
      <li class="paso"><div><h3>Te contesto el mismo día</h3><p>Confirmo disponibilidad, precio final y extras por escrito, con el condicionado del alquiler adjunto.</p></div></li>
      <li class="paso"><div><h3>Bloqueamos las fechas</h3><p>Con el 30 % si faltan más de 30 días, o el total si faltan menos. Tarjeta o PayPal.</p></div></li>
      <li class="paso"><div><h3>Mándame la documentación</h3><p>DNI y carné B por delante y por detrás de los conductores. Si contratas el seguro de cancelación, DNI de todos los viajeros.</p></div></li>
      <li class="paso"><div><h3>Fianza antes de salir</h3><p>850 € con tarjeta de crédito. Se devuelve en unos 7 días si todo está en orden.</p></div></li>
      <li class="paso"><div><h3>Entrega y repaso juntos</h3><p>En tu portal o en el parking, a la hora que hayas dicho. Repasamos el funcionamiento sin reloj y te vas.</p></div></li>
    </ol>
  </div>
</section>

@@CTA@@
""",
  hero=hero_int("Reservar", "Comprueba tus fechas y mándame la solicitud",
                "Calcula el precio, marca los extras y envíame los datos. Te contesto el mismo día con la "
                "disponibilidad y el importe final por escrito.", "valles-11",
                [("index.html", "Inicio"), (None, "Reservar")]),
  calc=CALCULADORA.replace('id="calc"', 'id="calc" data-es-reserva="1"'),
  email=EMAIL, wa=WA, ico_wa=I["wa"], ico_tel=I["tel"], ico_correo=I["correo"],
  ico_escudo=I["escudo"], tel=TEL,
  cta=cta_final("¿Prefieres hablarlo por teléfono?",
                "Llámame al " + TEL + " y lo cerramos en cinco minutos. Estoy los 365 días del año, "
                "y al otro lado siempre estoy yo."))

registrar(archivo="reservar.html", ruta="reservar.html", prio="0.9", og="valles-11", preload="valles-11",
          titulo="Reservar una autocaravana en Barcelona · Sí Camper",
          desc="Comprueba tus fechas, calcula el presupuesto con extras incluidos y envía la solicitud de "
               "reserva. Respuesta el mismo día y precio final por escrito, sin pagar nada de entrada.",
          cuerpo=RESERVAR)

# ═══════════════════════════════════════════════════════════════════════════
# LOCALIDADES
# ═══════════════════════════════════════════════════════════════════════════
ZONAS = [
  ("Vallès Occidental", "Tarifa económica en exclusiva. Es mi comarca y la conozco de memoria.", [
    ("Castellar del Vallès", "castellar-del-valles", "Aquí está la base y el Parking Terralta. Entrega en el día, a la hora que digas."),
    ("Sabadell", "sabadell", "A 7 km. Entrega a domicilio en cualquier barrio, también en horario partido."),
    ("Terrassa", "terrassa", "A 12 km. Sin coste de desplazamiento añadido dentro de la tarifa del Vallès."),
    ("Barberà del Vallès", "barbera-del-valles", "A 12 km, con salida directa a la C-58 y la AP-7."),
    ("Cerdanyola del Vallès", "cerdanyola-del-valles", "A 18 km. Práctico si sales por la B-30 hacia Girona o Tarragona."),
    ("Caldes de Montbui", "caldes-de-montbui", "A 17 km. Incluida también en la tarifa económica del Vallès."),
  ]),
  ("Vallès Oriental", "Entrega a domicilio con tarifa de proximidad.", [
    ("Granollers", "granollers", "A 25 km. Entrega en tu portal y salida directa por la AP-7 o la C-17."),
    ("Mollet del Vallès", "mollet-del-valles", "A 22 km, con acceso rápido a la C-33 y a la C-17."),
    ("Parets del Vallès", "parets-del-valles", "A 24 km. Ideal para salir hacia el Montseny sin pasar por Barcelona."),
    ("La Roca del Vallès", "la-roca-del-valles", "A 32 km. Buena salida hacia la Costa Brava por la AP-7."),
  ]),
]
OTRAS = [
  ("Barcelona ciudad", "A 32 km. Entrega a domicilio, con la logística acordada según la zona y la hora."),
  ("Maresme", "Mataró, Premià, Arenys… entrega a domicilio en toda la costa del Maresme."),
  ("Costa Brava y Girona", "Entrega en la costa y en el aeropuerto de Girona-Costa Brava."),
  ("Costa Daurada y Tarragona", "Entrega en la costa sur y en el aeropuerto de Reus."),
  ("Cataluña central", "Manresa, Vic, Igualada y alrededores, con tarifa a consultar."),
  ("Aeropuertos", "Barcelona-El Prat, Girona-Costa Brava y Reus. Más económico que en otras empresas."),
]

def zonas_html():
    out = []
    for titulo, sub, pueblos in ZONAS:
        tarjetas = "".join(
            """<article class="card card-hover" id="%s" data-revelar="%d">
  <h3 style="font-size:1.2rem">%s</h3><p class="pequeno">%s</p>
  <a class="enlace-flecha" style="margin-top:.9rem" href="reservar.html">Pedir entrega aquí</a>
</article>""" % (slug, n, nombre, texto) for n, (nombre, slug, texto) in enumerate(pueblos))
        out.append("""<div style="margin-bottom:3.2rem">
  <div class="cabecera-sec" data-revelar style="margin-bottom:1.6rem">
    <h2 class="h2-sm">%s</h2><p class="tono">%s</p>
  </div>
  <div class="rejilla r-3">%s</div>
</div>""" % (titulo, sub, tarjetas))
    return "".join(out)

LOCALIDADES_PAG = armar("""
@@HERO@@

<section class="seccion">
  <div class="env">@@ZONAS@@</div>
</section>

<section class="seccion bg-alt">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Y más allá</p>
      <h2>Otras zonas donde llego</h2>
      <p class="entradilla">Fuera del Vallès la tarifa de domicilio se calcula según la distancia y la hora.
        Dime tu localidad y te digo el importe exacto antes de reservar.</p>
    </div>
    <div class="rejilla r-3">@@OTRAS@@</div>
  </div>
</section>

<section class="seccion">
  <div class="env dos-col">
    <div data-revelar>
      <p class="cejilla">La base</p>
      <h2>Parking Terralta, Castellar del Vallès</h2>
      <p class="entradilla">Si prefieres recogerla tú, aquí es donde vive la autocaravana. Dejas tu coche gratis
        todo el alquiler en un parking videovigilado 24 h, con iluminación y acceso a cualquier hora.</p>
      <ul class="checks" style="margin-top:1.5rem">
        <li>@@DIRECCION@@</li>
        <li>Plaza gratuita para tu vehículo durante todo el alquiler</li>
        <li>Punto de vaciado de aguas grises y negras, y llenado de agua limpia</li>
        <li>Funda impermeable prestada para proteger tu coche del sol y la lluvia</li>
      </ul>
      <div class="acciones" style="margin-top:1.8rem">
        <a class="btn btn-tinta" href="@@MAPS@@" rel="noopener">Abrir en Google Maps</a>
        <a class="enlace-flecha" href="contacto.html">Cómo llegar</a>
      </div>
    </div>
    <iframe class="mapa" title="Mapa de la base de Sí Camper en Castellar del Vallès" loading="lazy"
      src="https://www.openstreetmap.org/export/embed.html?bbox=2.0697%2C41.6069%2C2.1097%2C41.6269&amp;layer=mapnik&amp;marker=41.6169%2C2.0897"></iframe>
  </div>
</section>

@@CTA@@
""",
  hero=hero_int("Zonas de entrega", "Te la llevo hasta tu portal",
                "Servicio a domicilio en el Vallès con tarifa económica, y en toda la provincia de Barcelona, "
                "Cataluña central, Costa Brava y Costa Daurada. También en aeropuertos.", "valles-6",
                [("index.html", "Inicio"), (None, "Zonas de entrega")]),
  zonas=zonas_html(),
  otras="".join('<article class="card" data-revelar="%d"><div class="icono-caja">%s</div>'
                '<h3 style="font-size:1.15rem">%s</h3><p class="pequeno">%s</p></article>'
                % (n, I["mapa"], t, d) for n, (t, d) in enumerate(OTRAS)),
  direccion=DIRECCION, maps=MAPS, cta=cta_final("¿Te lo llevo a tu zona?"))

registrar(archivo="localidades.html", ruta="localidades.html", prio="0.7", og="valles-6", preload="valles-6",
          titulo="Alquiler de autocaravanas con entrega a domicilio en el Vallès y Barcelona · Sí Camper",
          desc="Entrega a domicilio de autocaravanas en Castellar del Vallès, Sabadell, Terrassa, Granollers, "
               "Mollet, Barcelona y aeropuertos. Tarifa económica en el Vallès Occidental desde 35 €.",
          cuerpo=LOCALIDADES_PAG)

# ═══════════════════════════════════════════════════════════════════════════
# VENTA DE OCASIÓN
# ═══════════════════════════════════════════════════════════════════════════
VENTA_LD = """<script type="application/ld+json">
{
 "@context": "https://schema.org",
 "@type": "Vehicle",
 "name": "McLouis Glamys 222",
 "vehicleConfiguration": "Autocaravana capuchina de 7 plazas",
 "bodyType": "Motorhome",
 "vehicleModelDate": "2022",
 "mileageFromOdometer": { "@type": "QuantitativeValue", "value": 120000, "unitCode": "KMT" },
 "vehicleEngine": { "@type": "EngineSpecification", "engineDisplacement": { "@type": "QuantitativeValue", "value": 2200, "unitCode": "CMQ" }, "fuelType": "Diesel" },
 "vehicleTransmission": "Manual de 6 velocidades",
 "numberOfDoors": 3,
 "seatingCapacity": 7,
 "offers": { "@type": "Offer", "price": "52499", "priceCurrency": "EUR", "availability": "https://schema.org/InStock", "itemCondition": "https://schema.org/UsedCondition" }
}
</script>"""

VENTA = armar("""
@@HERO@@

<section class="seccion">
  <div class="env dos-col">
    <div data-revelar>
      <p class="cejilla">En stock</p>
      <h2>McLouis Glamys 222</h2>
      <p class="entradilla">Capuchina de 2022 con 7 plazas para viajar y para dormir, mecánica Citroën Jumper y
        mantenimiento al día. Pintura nueva, batería y centralita de nevera cambiadas, e ITV hasta 2028.</p>
      <p class="precio-grande" style="margin-top:1.2rem">52.499 €</p>
      <p class="nota">IVA incluido y deducible al 100 %. Garantía mecánica de 1 año.</p>
      <div class="acciones" style="margin-top:1.8rem">
        <a class="btn btn-primario btn-lg" href="contacto.html">Concertar una visita</a>
        <a class="btn btn-linea btn-lg" href="@@WA@@" rel="noopener">@@ICO_WA@@ Preguntar por WhatsApp</a>
      </div>
      <div class="sello" style="margin-top:1.8rem">@@ICO_ESCUDO@@<div><b>Se puede ver y probar</b><span>Concertamos una visita y te lo explico todo sin prisa</span></div></div>
    </div>
    <div class="solapado" data-revelar>
      <div class="marco-foto ratio-3-4"><img src="img/int-4.webp" alt="Interior de la McLouis Glamys 222 desde la entrada" loading="lazy" width="600" height="800"></div>
      <div class="marco-foto ratio-1-1"><img src="img/int-6.webp" alt="Fogones y encimera de la McLouis Glamys 222" loading="lazy" width="600" height="800"></div>
      <div class="marco-foto ratio-1-1"><img src="img/int-8.webp" alt="Asientos y mesa de la McLouis Glamys 222" loading="lazy" width="600" height="800"></div>
    </div>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env">
    <div class="cabecera-sec" data-revelar>
      <p class="cejilla">Ficha técnica</p>
      <h2>Los números, sin adornos</h2>
    </div>
    <div class="rejilla r-2">
      <div class="tabla-env" data-revelar="0">
        <table class="datos-t">
          <caption class="sr">Datos generales</caption>
          <thead><tr><th colspan="2">General</th></tr></thead>
          <tbody>
            <tr><td>Modelo</td><td>McLouis Glamys 222</td></tr>
            <tr><td>Matriculación</td><td>Febrero de 2022</td></tr>
            <tr><td>Kilómetros</td><td>120.000</td></tr>
            <tr><td>Plazas</td><td>7 para viajar y 7 para dormir</td></tr>
            <tr><td>Medidas</td><td>6,99 × 3,20 × 2,30 m</td></tr>
            <tr><td>Etiqueta ambiental</td><td>C</td></tr>
            <tr><td>ITV</td><td>Hasta 2028</td></tr>
            <tr><td>Garantía mecánica</td><td>1 año</td></tr>
          </tbody>
        </table>
      </div>
      <div class="tabla-env" data-revelar="1">
        <table class="datos-t">
          <caption class="sr">Mecánica y equipamiento</caption>
          <thead><tr><th colspan="2">Mecánica y equipamiento</th></tr></thead>
          <tbody>
            <tr><td>Motor</td><td>Citroën 2.200 cc Blue HDi, 165 cv</td></tr>
            <tr><td>Combustible</td><td>Diésel con AdBlue</td></tr>
            <tr><td>Cambio</td><td>Manual de 6 velocidades</td></tr>
            <tr><td>Placa solar</td><td>120 W · 2 baterías</td></tr>
            <tr><td>Seguridad</td><td>Alarma y cierres IMC</td></tr>
            <tr><td>Multimedia</td><td>Pantalla táctil, Bluetooth, retrocámara, antena y Smart TV</td></tr>
            <tr><td>Confort</td><td>Aire acondicionado, calefacción, 220 V, 12 V y USB</td></tr>
            <tr><td>Cabina</td><td>Oscurecedores Remis, asientos giratorios, control de crucero</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>

<section class="seccion">
  <div class="env env-estrecho prosa" data-revelar>
    <h2>Por qué esta autocaravana</h2>
    <p>La Glamys 222 es la capuchina que sale a cuenta cuando viajáis muchos: siete asientos y siete camas
      reales, con el salón siempre montado porque la cama grande va sobre la cabina. Dentro hay cocina completa
      con nevera amplia, y baño con WC y ducha separada.</p>
    <p>Las camas se reparten así: dos individuales en literas de 90 × 210 cm (una abatible para ganar espacio de
      carga), la capuchina de 160 × 220 cm, una doble en el salón de 120 × 180 cm y una individual de 70 × 145 cm.</p>
    <p>Con 165 cv se conduce cómoda incluso cargada, y la retrocámara resuelve las maniobras. Lleva paneles
      solares, aire acondicionado en cabina, calefacción y enchufes de 220 V, 12 V y USB. Las mascotas, por
      supuesto, son bienvenidas.</p>
    <p>Si te interesa, lo mejor es verla y probarla: concertamos una visita, la abrimos entera y te explico cada
      detalle sin reloj.</p>
    <div class="acciones" style="margin-top:1.8rem">
      <a class="btn btn-primario" href="contacto.html">Quiero verla</a>
      <a class="btn btn-linea" href="tel:@@TEL_URL@@">@@ICO_TEL@@ @@TEL@@</a>
    </div>
  </div>
</section>

@@CTA@@
""",
  hero=hero_int("Venta de ocasión", "McLouis Glamys 222 de 2022, con garantía",
                "Capuchina de 7 plazas, 165 cv, 120.000 km, pintura nueva e ITV hasta 2028. "
                "52.499 € con IVA deducible al 100 %.", "montanas",
                [("index.html", "Inicio"), (None, "Venta de ocasión")]),
  wa=WA, ico_wa=I["wa"], ico_escudo=I["escudo"], ico_tel=I["tel"], tel=TEL, tel_url=TEL_URL,
  cta=cta_final("¿La quieres ver en persona?",
                "Escríbeme y quedamos en Castellar del Vallès. La abrimos entera, la pruebas y te cuento "
                "todo lo que tiene sin prisa."))

registrar(archivo="venta.html", ruta="venta.html", prio="0.6", og="montanas", preload="montanas",
          titulo="Autocaravana de ocasión: McLouis Glamys 222 de 2022 · Sí Camper",
          desc="McLouis Glamys 222 de 2022 en venta: 7 plazas, 165 cv, 120.000 km, placa solar, ITV hasta 2028 "
               "y garantía mecánica de 1 año. 52.499 € con IVA deducible al 100 %.",
          ld=VENTA_LD, cuerpo=VENTA)

# ═══════════════════════════════════════════════════════════════════════════
# CONTACTO
# ═══════════════════════════════════════════════════════════════════════════
CONTACTO = armar("""
@@HERO@@

<section class="seccion">
  <div class="env calc">
    <div class="calc-panel" data-revelar>
      <div>
        <h2 class="h2-sm">Escríbeme</h2>
        <p class="tono" style="margin-top:.6rem">Cuéntame qué necesitas y te contesto el mismo día. Si es urgente,
          el teléfono es más rápido.</p>
      </div>
      <form data-mailto="@@EMAIL@@" data-asunto="Consulta desde sicamper.com" novalidate>
        <div class="calc-fechas">
          <div class="campo"><label for="c-nombre">Nombre *</label><input type="text" id="c-nombre" name="nombre" required autocomplete="name"></div>
          <div class="campo"><label for="c-tel">Teléfono</label><input type="tel" id="c-tel" name="telefono" autocomplete="tel"></div>
        </div>
        <div class="campo" style="margin-top:.8rem"><label for="c-email">Email *</label><input type="email" id="c-email" name="email" required autocomplete="email"></div>
        <div class="campo" style="margin-top:.8rem">
          <label for="c-tema">Sobre qué</label>
          <select id="c-tema" name="tema">
            <option>Alquilar la autocaravana</option>
            <option>Precios y disponibilidad</option>
            <option>Servicio a domicilio en mi zona</option>
            <option>Extras y complementos</option>
            <option>La autocaravana en venta</option>
            <option>Otra cosa</option>
          </select>
        </div>
        <div class="campo" style="margin-top:.8rem"><label for="c-mensaje">Tu mensaje *</label>
          <textarea id="c-mensaje" name="mensaje" required placeholder="Fechas que te interesan, cuántos viajáis, desde dónde salís…"></textarea></div>
        <label class="opcion" style="align-items:flex-start;margin-top:1rem">
          <input type="checkbox" id="c-privacidad" name="privacidad" required>
          <span class="txt"><b>Acepto la política de privacidad *</b>
            <span>Responsable: Ismael Lázaro Cifuentes. Finalidad: resolver tu consulta. <a href="legal.html#privacidad">Más información</a>.</span></span>
        </label>
        <div class="acciones" style="margin-top:1.3rem">
          <button class="btn btn-primario btn-lg" type="submit">Enviar</button>
          <a class="btn btn-linea btn-lg" href="@@WA@@" rel="noopener">@@ICO_WA@@ WhatsApp</a>
        </div>
        <p class="nota enviado" hidden>Se ha abierto tu programa de correo con el mensaje preparado.</p>
      </form>
    </div>

    <aside data-revelar>
      <div class="card">
        <h3>Datos de contacto</h3>
        <div class="rejilla" style="gap:.7rem;margin-top:1.2rem">
          <a class="sello" href="tel:@@TEL_URL@@">@@ICO_TEL@@<div><b>@@TEL@@</b><span>Los 365 días del año</span></div></a>
          <a class="sello" href="@@WA@@" rel="noopener">@@ICO_WA@@<div><b>WhatsApp</b><span>Lo más rápido para dudas cortas</span></div></a>
          <a class="sello" href="mailto:@@EMAIL@@">@@ICO_CORREO@@<div><b>@@EMAIL@@</b><span>Respuesta el mismo día</span></div></a>
          <a class="sello" href="@@MAPS@@" rel="noopener">@@ICO_MAPA@@<div><b>Parking Terralta</b><span>@@DIRECCION@@</span></div></a>
        </div>
      </div>
      <div class="card" style="margin-top:1rem">
        <h3>Horarios</h3>
        <p class="tono" style="margin-top:.5rem">Para entrega y devolución no hay horario: lo eliges tú, de lunes a
          domingo. Para hablar conmigo, cualquier hora razonable del día.</p>
        <div class="tabla-env" style="margin-top:1.1rem">
          <table class="datos-t">
            <tbody>
              <tr><td>Entrega y devolución de 9 a 21 h</td><td>gratis</td></tr>
              <tr><td>De 8 a 10 h y de 21 a 23 h</td><td>35 €</td></tr>
              <tr><td>Antes de 8 h o después de 23 h</td><td>70 €</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <iframe class="mapa" style="margin-top:1rem" title="Mapa de Sí Camper en Castellar del Vallès" loading="lazy"
        src="https://www.openstreetmap.org/export/embed.html?bbox=2.0697%2C41.6069%2C2.1097%2C41.6269&amp;layer=mapnik&amp;marker=41.6169%2C2.0897"></iframe>
    </aside>
  </div>
</section>

<section class="seccion bg-alt">
  <div class="env env-estrecho dos-col">
    <div class="marco-foto ratio-3-4" data-revelar><img src="img/puerta.webp" alt="Puerta de la autocaravana abierta, lista para el viaje" loading="lazy" width="650" height="850"></div>
    <div data-revelar>
      <p class="cejilla">Sobre mí</p>
      <h2>Soy Ismael</h2>
      <p class="tono" style="margin-top:.9rem">Soy un apasionado del caravaning y entiendo lo que necesitas porque
        lo he necesitado yo. Entrego la autocaravana como me gustaría recibirla: cuidada, limpia, al día y con
        todo en su sitio.</p>
      <p class="tono" style="margin-top:.9rem">Trabajo todo el año, y por eso te recomiendo evitar el alquiler
        entre particulares: las condiciones no son claras y no hay cobertura en caso de accidente. Los seguros de
        auto no cubren la actividad de alquiler, y los seguros profesionales no aseguran vehículos particulares.</p>
      <p class="tono" style="margin-top:.9rem">Al alquilar conmigo tienes contrato, seguro a todo riesgo y una
        persona al teléfono. Que es, al final, lo que hace que un viaje salga bien.</p>
    </div>
  </div>
</section>

@@CTA@@
""",
  hero=hero_int("Contacto", "Hablamos y lo resolvemos",
                "Teléfono, WhatsApp o email. Al otro lado siempre estoy yo, los 365 días del año.", "lago",
                [("index.html", "Inicio"), (None, "Contacto")]),
  email=EMAIL, wa=WA, tel=TEL, tel_url=TEL_URL, maps=MAPS, direccion=DIRECCION,
  ico_wa=I["wa"], ico_tel=I["tel"], ico_correo=I["correo"], ico_mapa=I["mapa"],
  cta=cta_final("¿Miramos fechas?"))

registrar(archivo="contacto.html", ruta="contacto.html", prio="0.7", og="lago", preload="lago",
          titulo="Contacto · Autocaravanas Sí Camper, Castellar del Vallès",
          desc="Teléfono +34 670 64 08 76, WhatsApp e email para alquilar una autocaravana en Barcelona. "
               "Base en el Parking Terralta de Castellar del Vallès. Atención los 365 días del año.",
          cuerpo=CONTACTO)

# ═══════════════════════════════════════════════════════════════════════════
# LEGAL
# ═══════════════════════════════════════════════════════════════════════════
LEGAL = armar("""
@@HERO@@

<section class="seccion">
  <div class="env env-estrecho prosa">
    <div class="card" style="border-style:dashed">
      <h3 style="font-size:1.1rem">Nota para el titular de la web</h3>
      <p class="pequeno">Este texto es una base redactada a partir de la información pública del negocio.
        Antes de publicarlo hay que completar los datos marcados como <strong>[por completar]</strong> (NIF,
        registro mercantil si aplica, datos del hosting vigente) y darle un repaso legal. No sustituye al
        asesoramiento de un profesional.</p>
    </div>

    <h2 id="aviso">Aviso legal</h2>
    <p><strong>Titular:</strong> Ismael Lázaro Cifuentes (Autocaravanas Sí Camper).<br>
      <strong>NIF:</strong> [por completar].<br>
      <strong>Domicilio:</strong> @@DIRECCION@@.<br>
      <strong>Teléfono:</strong> @@TEL@@.<br>
      <strong>Email:</strong> @@EMAIL@@.<br>
      <strong>Actividad:</strong> alquiler y venta de autocaravanas.</p>
    <p>El acceso y el uso de este sitio implican la aceptación de las presentes condiciones. Los contenidos,
      textos, fotografías y elementos gráficos son titularidad del responsable o se utilizan con autorización,
      y no pueden reproducirse sin permiso previo por escrito.</p>
    <p>El titular no se responsabiliza del uso indebido de los contenidos ni de los daños derivados de
      interrupciones del servicio ajenas a su control. Los enlaces a sitios de terceros se ofrecen únicamente a
      título informativo.</p>

    <h2 id="privacidad">Política de privacidad</h2>
    <p><strong>Responsable del tratamiento:</strong> Ismael Lázaro Cifuentes. <strong>Finalidad:</strong> atender
      las consultas y solicitudes de reserva recibidas a través de la web, el teléfono o el correo electrónico, y
      gestionar la relación contractual del alquiler. <strong>Base jurídica:</strong> tu consentimiento y, cuando
      exista reserva, la ejecución del contrato.</p>
    <p><strong>Conservación:</strong> los datos se conservan el tiempo necesario para atender la consulta y, en
      caso de contrato, durante los plazos legales de conservación fiscal y contable.</p>
    <p><strong>Destinatarios:</strong> no se ceden datos a terceros salvo obligación legal o cuando sea
      imprescindible para prestar el servicio (por ejemplo, la aseguradora en caso de siniestro). Los datos se
      alojan en el proveedor de hosting contratado: [por completar].</p>
    <p><strong>Tus derechos:</strong> puedes solicitar el acceso, la rectificación, la supresión, la limitación,
      la portabilidad y la oposición al tratamiento escribiendo a <a href="mailto:@@EMAIL@@">@@EMAIL@@</a>, o
      presentar una reclamación ante la Agencia Española de Protección de Datos.</p>
    <p><strong>Formularios de la web:</strong> los formularios de contacto y de reserva de este sitio no envían
      los datos a ningún servidor: abren tu propio programa de correo con el mensaje ya redactado, de modo que el
      envío sale de tu buzón y tú conservas la copia.</p>

    <h2 id="cookies">Política de cookies</h2>
    <p>Este sitio utiliza únicamente almacenamiento local del navegador para recordar dos preferencias tuyas: el
      tema claro u oscuro y si ya has respondido al aviso de cookies. Esa información se queda en tu dispositivo y
      no se envía a ningún servidor.</p>
    <p>Si en el futuro se añade analítica, se cargará solo tras tu consentimiento expreso a través del aviso.
      Puedes borrar estas preferencias en cualquier momento desde los ajustes de tu navegador.</p>

    <h2 id="condiciones-alquiler">Condiciones de alquiler</h2>
    <p>El condicionado general del alquiler se entrega por escrito antes de la firma del contrato y recoge, entre
      otros puntos: requisitos del conductor (mayor de 23 años y carné B con más de dos años de antigüedad),
      fianza de 850 €, franquicia de daños propios exteriores, plazos y penalizaciones de cancelación, límites de
      kilometraje, países autorizados, estado de entrega y devolución del vehículo, prohibición de fumar y
      condiciones para viajar con mascotas.</p>
    <p>Los puntos principales están resumidos en las <a href="faq.html">preguntas frecuentes</a> y en la página de
      <a href="precios.html">precios</a>. Si algo no queda claro, pregúntalo antes de reservar: para eso estoy.</p>
  </div>
</section>
""",
  hero=hero_int("Información legal", "Aviso legal, privacidad y cookies",
                "Quién está detrás de esta web, qué se hace con tus datos y qué guarda tu navegador.",
                "arboles", [("index.html", "Inicio"), (None, "Legal")]),
  direccion=DIRECCION, tel=TEL, email=EMAIL)

registrar(archivo="legal.html", ruta="legal.html", prio="0.3", og="arboles",
          titulo="Aviso legal, privacidad y cookies · Sí Camper",
          desc="Aviso legal, política de privacidad, política de cookies y resumen de las condiciones de "
               "alquiler de Autocaravanas Sí Camper.",
          cuerpo=LEGAL)

# ── Construir ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generando el sitio de Sí Camper…")
    construir()
    print("Listo.")
