/* =====================================================================
   AquaLadra — comportamiento de la web
   Vanilla JS, sin dependencias. Todo degrada con elegancia: si algo
   falla, la web sigue siendo perfectamente usable.
   ===================================================================== */
(function () {
  "use strict";

  var CFG = window.AQUALADRA || {};
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Año del footer ---------- */
  var anyo = $("#anyo");
  if (anyo) anyo.textContent = new Date().getFullYear();

  /* ---------- Sombra de la barra al hacer scroll ---------- */
  var nav = $("#nav");
  var mobileBar = $("#mobile-bar");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("is-stuck", y > 12);
    if (mobileBar) mobileBar.classList.toggle("is-visible", y > 420);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menú desplegable en móvil ---------- */
  var burger = $("#burger");
  var drawer = $("#drawer");

  function cerrarMenu() {
    if (!burger || !drawer) return;
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menú");
    drawer.setAttribute("data-open", "false");
  }

  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var abierto = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", String(!abierto));
      burger.setAttribute("aria-label", abierto ? "Abrir menú" : "Cerrar menú");
      drawer.setAttribute("data-open", String(!abierto));
    });

    $$("a", drawer).forEach(function (a) { a.addEventListener("click", cerrarMenu); });

    document.addEventListener("click", function (e) {
      if (drawer.getAttribute("data-open") !== "true") return;
      if (drawer.contains(e.target) || burger.contains(e.target)) return;
      cerrarMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") cerrarMenu();
    });
  }

  /* ---------- Enlace activo según la sección visible ---------- */
  var enlaces = $$(".nav__links a");
  if (enlaces.length && "IntersectionObserver" in window) {
    var porId = {};
    enlaces.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      if (id) porId[id] = a;
    });

    var secciones = Object.keys(porId)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    var obsNav = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        enlaces.forEach(function (a) { a.classList.remove("is-active"); });
        var activo = porId[en.target.id];
        if (activo) activo.classList.add("is-active");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    secciones.forEach(function (s) { obsNav.observe(s); });
  }

  /* ---------- Aparición escalonada dentro de las rejillas ----------
     En vez de que una rejilla entera aparezca de golpe, cada tarjeta entra
     con un pequeño retraso. Se nota sobre todo en el móvil, donde se hace
     mucho scroll y casi todo son listas de una columna.                */
  $$("[data-escalonar]").forEach(function (rejilla) {
    rejilla.classList.remove("reveal");           // aparece cada hijo, no el conjunto
    Array.prototype.forEach.call(rejilla.children, function (hijo, i) {
      hijo.classList.add("reveal");
      hijo.style.transitionDelay = Math.min(i * 70, 420) + "ms";
    });
  });

  /* ---------- Pausar las animaciones infinitas fuera de pantalla ----------
     Las burbujas y el oleaje no paran nunca. Si su sección no se está
     viendo, no hay motivo para que el móvil gaste batería en moverlas.  */
  var infinitas = $$(".bubbles, .wave");
  if (infinitas.length && "IntersectionObserver" in window) {
    var obsPausa = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        en.target.classList.toggle("fuera-de-vista", !en.isIntersecting);
      });
    }, { rootMargin: "80px 0px" });
    infinitas.forEach(function (el) {
      el.classList.add("fuera-de-vista");
      obsPausa.observe(el);
    });
  }

  /* ---------- Aparición suave al hacer scroll ---------- */
  var aparecer = $$(".reveal");
  var sinMovimiento = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!aparecer.length) {
    /* nada que hacer */
  } else if (sinMovimiento || !("IntersectionObserver" in window)) {
    aparecer.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var obsRev = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        obs.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    aparecer.forEach(function (el) { obsRev.observe(el); });
  }

  /* ---------- Pestañas de tarifas ---------- */
  var pestanyas = $$(".tab");

  function activarPestanya(tab, mover) {
    pestanyas.forEach(function (t) {
      var activa = t === tab;
      t.setAttribute("aria-selected", String(activa));
      t.tabIndex = activa ? 0 : -1;
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel) {
        panel.hidden = !activa;
        // Un panel oculto nunca ha entrado en pantalla, así que sus
        // elementos con aparición seguirían invisibles al mostrarlo.
        if (activa) $$(".reveal", panel).forEach(function (r) { r.classList.add("is-in"); });
      }
    });
    if (mover) tab.focus();
  }

  if (pestanyas.length) {
    pestanyas.forEach(function (tab, i) {
      tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;

      tab.addEventListener("click", function () { activarPestanya(tab, false); });

      tab.addEventListener("keydown", function (e) {
        var salto = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (salto) {
          e.preventDefault();
          activarPestanya(pestanyas[(i + salto + pestanyas.length) % pestanyas.length], true);
        } else if (e.key === "Home") {
          e.preventDefault(); activarPestanya(pestanyas[0], true);
        } else if (e.key === "End") {
          e.preventDefault(); activarPestanya(pestanyas[pestanyas.length - 1], true);
        }
      });
    });
  }

  /* ---------- Galería con visor ---------- */
  var lb      = $("#lightbox");
  var lbImg   = $("#lb-img");
  var fotos   = $$(".gallery__item");
  var indice  = 0;

  function mostrar(i) {
    if (!fotos.length) return;
    indice = (i + fotos.length) % fotos.length;
    var fig = fotos[indice];
    var img = $("img", fig);
    lbImg.src = fig.getAttribute("data-full") || (img && img.currentSrc) || (img && img.src) || "";
    lbImg.alt = (img && img.alt) || "";
  }

  function abrir(i) {
    if (!lb || !lb.showModal) return false;
    mostrar(i);
    lb.showModal();
    return true;
  }

  if (lb && lbImg && fotos.length) {
    fotos.forEach(function (fig, i) {
      fig.addEventListener("click", function () { abrir(i); });
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abrir(i); }
      });
    });

    var cerrar = $("#lb-close");
    if (cerrar) cerrar.addEventListener("click", function () { lb.close(); });

    var prev = $("#lb-prev");
    var next = $("#lb-next");
    if (prev) prev.addEventListener("click", function () { mostrar(indice - 1); });
    if (next) next.addEventListener("click", function () { mostrar(indice + 1); });

    lb.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft")  { e.preventDefault(); mostrar(indice - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); mostrar(indice + 1); }
    });

    /* Clic en el fondo oscuro para cerrar */
    lb.addEventListener("click", function (e) {
      if (e.target === lb) lb.close();
    });
  }

  /* ---------- Contenidos de Google, solo si se piden ----------
     El calendario de reservas y el mapa vienen de Google y ponen cookies
     suyas en cuanto se cargan. Para no instalar nada sin permiso, en su
     sitio se muestra un aviso con un botón: hasta que no se pulsa, no se
     carga nada de Google. La decisión se recuerda en el almacenamiento
     local (no es una cookie y no viaja a ningún servidor).             */

  var CLAVE = "aqualadra:consiente-google";

  function consiente() {
    try { return localStorage.getItem(CLAVE) === "si"; } catch (e) { return false; }
  }

  function guardarConsentimiento() {
    try { localStorage.setItem(CLAVE, "si"); } catch (e) { /* modo privado: vale por esta visita */ }
  }

  var telHref = "tel:+" + (CFG.telefono || "");
  var telTexto = "658 28 40 18";
  var waHref = "https://wa.me/" + (CFG.telefono || "");

  /* Crea el marco de un contenido incrustado */
  function marco(src, titulo, alto) {
    var f = document.createElement("iframe");
    f.src = src;
    f.title = titulo;
    f.loading = "lazy";
    f.setAttribute("frameborder", "0");
    f.referrerPolicy = "no-referrer-when-downgrade";
    if (alto) f.style.height = alto + "px";
    return f;
  }

  /* Crea un enlace sin pasar por innerHTML: los valores de config.js entran
     siempre por .href y .textContent, nunca como HTML. config.js es el fichero
     que se espera que edite quien lleve el negocio, y un apóstrofo mal puesto
     no debería poder romper la página ni colar nada dentro de ella. */
  function enlace(href, texto, opciones) {
    opciones = opciones || {};
    var a = document.createElement("a");
    a.href = href;
    a.textContent = texto;
    if (opciones.clase) a.className = opciones.clase;
    if (opciones.fuera) { a.target = "_blank"; a.rel = "noopener"; }
    return a;
  }

  /* Junta trozos de texto y nodos en un párrafo, sin interpretar HTML */
  function parrafo(clase, trozos) {
    var p = document.createElement("p");
    if (clase) p.className = clase;
    trozos.forEach(function (t) {
      p.appendChild(typeof t === "string" ? document.createTextNode(t) : t);
    });
    return p;
  }

  /* Aviso con el botón para cargar el contenido */
  function aviso(opciones) {
    var caja = document.createElement("div");
    caja.className = "consent";
    /* Aquí solo va estructura fija: no se interpola ni un valor. */
    caja.innerHTML =
      '<span class="consent__icono"><svg aria-hidden="true"><use href="#i-shield"></use></svg></span>' +
      '<h3 class="consent__titulo"></h3>' +
      '<p class="consent__texto"></p>' +
      '<div class="consent__acciones"><button class="btn" type="button"></button></div>' +
      '<p class="consent__nota"><a href="cookies.html">Más detalles en la política de cookies</a></p>';

    caja.querySelector(".consent__titulo").textContent = opciones.titulo;
    caja.querySelector(".consent__texto").textContent = opciones.texto;

    var boton = caja.querySelector("button");
    boton.textContent = opciones.boton;
    boton.addEventListener("click", function () {
      guardarConsentimiento();
      pintarCalendario();
      pintarMapa();
    });

    if (opciones.alterno) caja.querySelector(".consent__acciones").appendChild(opciones.alterno);
    return caja;
  }

  /* ---------- Calendario de reservas ---------- */
  var slotCal = $("#calendario-slot");

  function pintarCalendario() {
    if (!slotCal) return;
    var estado = consiente() ? "cargado" : "aviso";
    if (slotCal.getAttribute("data-estado") === estado) return;
    slotCal.setAttribute("data-estado", estado);
    slotCal.innerHTML = "";

    if (!CFG.reservasUrl) {
      slotCal.appendChild(parrafo("calendar-card__fallback", [
        "Ahora mismo no podemos mostrar el calendario. Llámanos al ",
        enlace(telHref, telTexto),
        " o escríbenos por ",
        enlace(waHref, "WhatsApp", { fuera: true }),
        " y te cogemos la cita."
      ]));
      return;
    }

    if (!consiente()) {
      slotCal.appendChild(aviso({
        titulo: "El calendario lo pone Google",
        texto: "Para elegir día y hora cargamos la agenda de Google Calendar, que instala sus propias cookies. " +
               "Solo se carga si lo pides tú.",
        boton: "Ver los huecos disponibles",
        alterno: enlace(
          waHref + "?text=" + encodeURIComponent("¡Hola AquaLadra! Quería pedir cita para la peluquería."),
          "Pedir cita por WhatsApp", { clase: "btn btn--wa", fuera: true })
      }));
      return;
    }

    slotCal.appendChild(marco(CFG.reservasUrl, "Calendario de reservas de la peluquería AquaLadra", CFG.reservasAlto || 640));

    var salida = parrafo("calendar-card__fallback", [
      "¿No ves el calendario? ",
      enlace(CFG.reservasUrl, "Ábrelo en una pestaña nueva", { fuera: true }),
      " o llámanos al ",
      enlace(telHref, telTexto),
      "."
    ]);
    salida.style.paddingTop = "1rem";
    slotCal.appendChild(salida);
  }

  /* ---------- Mapa ---------- */
  var slotMapa = $("#mapa-slot");

  function pintarMapa() {
    if (!slotMapa || !CFG.mapaUrl) return;
    var estado = consiente() ? "cargado" : "aviso";
    if (slotMapa.getAttribute("data-estado") === estado) return;
    slotMapa.setAttribute("data-estado", estado);
    slotMapa.innerHTML = "";

    if (!consiente()) {
      slotMapa.appendChild(aviso({
        titulo: "El mapa lo pone Google",
        texto: "Cargar el mapa de Google Maps instala cookies suyas. Si prefieres no cargarlo, " +
               "puedes abrir la ubicación directamente en Google Maps.",
        boton: "Ver el mapa aquí",
        alterno: enlace(CFG.mapaEnlace || "#", "Abrir en Google Maps",
                        { clase: "btn btn--ghost", fuera: true })
      }));
      return;
    }

    slotMapa.appendChild(marco(CFG.mapaUrl, "Mapa con la ubicación de AquaLadra en Puente Tocinos"));
  }

  /* ---------- Cuándo se pintan ----------
     Se espera a que la sección esté cerca para no trabajar de más, pero el
     aviso se pinta igual: así nunca hay un hueco vacío.               */
  function alAcercarse(elemento, hacer) {
    if (!elemento) return;
    if (!("IntersectionObserver" in window)) { hacer(); return; }
    var obs = new IntersectionObserver(function (entradas, o) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        hacer();
        o.disconnect();
      });
    }, { rootMargin: "500px 0px" });
    obs.observe(elemento);
  }

  alAcercarse(slotCal, pintarCalendario);
  alAcercarse(slotMapa, pintarMapa);

  /* Si alguien llega directo con #reservar, que no espere al scroll */
  if (window.location.hash === "#reservar") pintarCalendario();
  $$('a[href="#reservar"]').forEach(function (a) {
    a.addEventListener("click", pintarCalendario);
  });

  /* ---------- 8. ¿Está abierto ahora mismo? ----------
     Al autolavado se viene sin cita, así que lo que decide la visita no es
     el horario en abstracto: es si ahora mismo se puede venir. Se calcula
     en la hora de Murcia y no en la del visitante, porque si no un cliente
     de vacaciones fuera de España vería un horario que no es el del local.
     Si el navegador no soporta zonas horarias, se deja el texto de siempre
     y no se inventa nada.                                              */

  var ABRE = 9, CIERRA = 21;

  function horaEnMurcia() {
    try {
      var partes = new Intl.DateTimeFormat("es-ES", {
        timeZone: "Europe/Madrid", hour: "numeric", minute: "numeric", hour12: false
      }).formatToParts(new Date());
      var h = null, m = null;
      partes.forEach(function (p) {
        if (p.type === "hour") h = parseInt(p.value, 10);
        if (p.type === "minute") m = parseInt(p.value, 10);
      });
      return (h === null || isNaN(h)) ? null : { h: h % 24, m: m || 0 };
    } catch (e) { return null; }
  }

  function pintarEstado() {
    var caja = document.getElementById("estado-horario");
    if (!caja) return;
    var texto = caja.querySelector("span");
    var ahora = horaEnMurcia();
    if (!texto || !ahora) return;          /* sin zona horaria fiable, se queda el horario a secas */

    var abierto = ahora.h >= ABRE && ahora.h < CIERRA;
    caja.classList.toggle("chip--abierto", abierto);
    caja.classList.toggle("chip--cerrado", !abierto);

    if (abierto) {
      texto.textContent = ahora.h === CIERRA - 1
        ? "Abierto · cierra en " + (60 - ahora.m) + " min"
        : "Abierto ahora · hasta las " + CIERRA + ":00";
    } else {
      texto.textContent = "Cerrado · abre a las " + ABRE + ":00";
    }
  }

  pintarEstado();
  setInterval(pintarEstado, 60000);        /* que no se quede obsoleto en una pestaña abierta */

})();
