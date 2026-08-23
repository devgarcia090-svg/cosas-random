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
      if (panel) panel.hidden = !activa;
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

  /* ---------- Calendario de reservas ----------
     Se incrusta la página de citas de Google Calendar, así la peluquera
     sigue gestionando su agenda desde su propio calendario y aquí se ve
     siempre la disponibilidad real. Se carga solo cuando el usuario se
     acerca a la sección, para no penalizar la carga inicial.          */
  var slot = $("#calendario-slot");

  function pintarCalendario() {
    if (!slot || slot.getAttribute("data-cargado") === "true") return;
    slot.setAttribute("data-cargado", "true");

    if (!CFG.reservasUrl) { pintarFallback(); return; }

    var marco = document.createElement("iframe");
    marco.src = CFG.reservasUrl;
    marco.title = "Calendario de reservas de la peluquería AquaLadra";
    marco.loading = "lazy";
    marco.style.height = (CFG.reservasAlto || 640) + "px";
    marco.setAttribute("frameborder", "0");

    /* Si Google no cargara, dejamos una salida a mano */
    var aviso = document.createElement("p");
    aviso.className = "calendar-card__fallback";
    aviso.style.paddingTop = "1rem";
    aviso.innerHTML = '¿No ves el calendario? ' +
      '<a href="' + CFG.reservasUrl + '" target="_blank" rel="noopener">Ábrelo en una pestaña nueva</a>' +
      ' o llámanos al <a href="tel:+' + CFG.telefono + '">684 79 72 36</a>.';

    slot.appendChild(marco);
    slot.appendChild(aviso);
  }

  function pintarFallback() {
    if (!slot) return;
    slot.innerHTML = '<p class="calendar-card__fallback">Ahora mismo no podemos mostrar el calendario. ' +
      'Llámanos al <a href="tel:+' + (CFG.telefono || "") + '">684 79 72 36</a> ' +
      'o escríbenos por <a href="https://wa.me/' + (CFG.telefono || "") + '" target="_blank" rel="noopener">WhatsApp</a> ' +
      'y te cogemos la cita.</p>';
  }

  if (slot) {
    if ("IntersectionObserver" in window) {
      var obsCal = new IntersectionObserver(function (entradas, obs) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          pintarCalendario();
          obs.disconnect();
        });
      }, { rootMargin: "500px 0px" });
      obsCal.observe(slot);
    } else {
      pintarCalendario();
    }

    /* Si alguien llega directo con #reservar, que no espere al scroll */
    if (window.location.hash === "#reservar") pintarCalendario();
    $$('a[href="#reservar"]').forEach(function (a) {
      a.addEventListener("click", pintarCalendario);
    });
  }
})();
