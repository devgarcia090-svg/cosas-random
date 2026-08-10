/* Burger Bar Venecia — JS mínimo, sin dependencias.
   Todo lo importante (la carta) funciona sin JavaScript: esto solo añade
   buscador, categoría activa y el aviso de abierto/cerrado. */
(function () {
  'use strict';

  /* ------------------------------------------------ Abierto / cerrado ahora */
  var estado = document.querySelector('[data-estado]');
  if (estado) {
    var horario = JSON.parse(estado.getAttribute('data-horario') || '[]');
    var ahora = new Date();
    var hoy = horario[(ahora.getDay() + 6) % 7]; // el array empieza en lunes
    var mins = ahora.getHours() * 60 + ahora.getMinutes();
    var aMin = function (h) { var p = h.split(':'); return (+p[0]) * 60 + (+p[1]); };

    if (hoy && hoy.abre && mins >= aMin(hoy.abre) && mins < aMin(hoy.cierra)) {
      estado.dataset.abierto = 'si';
      estado.textContent = 'Abierto ahora · hasta las ' + hoy.cierra;
    } else {
      var i, d, prox = null;
      for (i = 1; i <= 7; i++) {
        d = horario[(((ahora.getDay() + 6) % 7) + i) % 7];
        if (d && d.abre) { prox = d; break; }
      }
      if (hoy && hoy.abre && mins < aMin(hoy.abre)) prox = hoy;
      estado.dataset.abierto = 'no';
      estado.textContent = prox
        ? 'Cerrado ahora · abrimos ' + (prox === hoy ? 'hoy' : 'el ' + prox.dia.toLowerCase()) + ' a las ' + prox.abre
        : 'Cerrado ahora';
    }
    estado.hidden = false;
  }

  /* ------------------------------------------------------------- Buscador */
  var input = document.querySelector('#buscar');
  if (input) {
    var limpiar = document.querySelector('.buscador__limpiar');
    var vacio = document.querySelector('#sin-resultados');
    var platos = [].slice.call(document.querySelectorAll('[data-buscable]'));
    var secciones = [].slice.call(document.querySelectorAll('.seccion'));

    var normaliza = function (t) {
      return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };
    platos.forEach(function (p) { p._txt = normaliza(p.getAttribute('data-buscable')); });

    var filtrar = function () {
      var q = normaliza(input.value.trim());
      var visibles = 0;
      platos.forEach(function (p) {
        var ok = !q || p._txt.indexOf(q) !== -1;
        p.hidden = !ok;
        if (ok) visibles++;
      });
      secciones.forEach(function (s) {
        s.hidden = !!q && !s.querySelector('[data-buscable]:not([hidden])');
      });
      if (vacio) vacio.hidden = visibles !== 0;
      if (limpiar) limpiar.hidden = !q;
      document.body.classList.toggle('filtrando', !!q);
    };

    input.addEventListener('input', filtrar);
    if (limpiar) {
      limpiar.addEventListener('click', function () {
        input.value = '';
        filtrar();
        input.focus();
      });
    }
    filtrar();
  }

  /* -------------------------------- Categoría activa según lo que se ve */
  var chips = [].slice.call(document.querySelectorAll('.chips a'));
  if (chips.length && 'IntersectionObserver' in window) {
    var mapa = {};
    chips.forEach(function (c) { mapa[c.getAttribute('href').slice(1)] = c; });

    var marcar = function (id) {
      chips.forEach(function (c) { c.classList.remove('activo'); });
      var a = mapa[id];
      if (!a) return;
      a.classList.add('activo');
      var cont = a.parentNode;
      var izq = a.offsetLeft - cont.offsetLeft - 16;
      if (Math.abs(cont.scrollLeft - izq) > 8) cont.scrollTo({ left: izq, behavior: 'smooth' });
    };

    var obs = new IntersectionObserver(function (entradas) {
      var visibles = entradas.filter(function (e) { return e.isIntersecting; });
      if (visibles.length) marcar(visibles[0].target.id);
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    document.querySelectorAll('.seccion').forEach(function (s) { obs.observe(s); });
  }

  /* --------------------------------------------------------- Volver arriba */
  var arriba = document.querySelector('.volver-arriba');
  if (arriba) {
    var alternar = function () {
      arriba.classList.toggle('visible', window.scrollY > 700);
    };
    window.addEventListener('scroll', alternar, { passive: true });
    alternar();
  }
})();
