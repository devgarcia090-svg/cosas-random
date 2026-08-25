/* ═══════════════════════════════════════════════════════════════
   SÍ CAMPER · Comportamiento
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ── Tema claro / oscuro ──────────────────────────────────── */
  const TEMA_KEY = 'sicamper-tema';
  try {
    const g = localStorage.getItem(TEMA_KEY);
    if (g) document.documentElement.dataset.tema = g;
  } catch (e) {}

  function initTema() {
    $$('.btn-tema').forEach(b => b.addEventListener('click', () => {
      const auto = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
      const actual = document.documentElement.dataset.tema || auto;
      const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro';
      document.documentElement.dataset.tema = nuevo;
      try { localStorage.setItem(TEMA_KEY, nuevo); } catch (e) {}
    }));
  }

  /* ── Cabecera al hacer scroll ─────────────────────────────── */
  function initCabecera() {
    const cab = $('.cabecera');
    if (!cab) return;
    const sobreHero = cab.classList.contains('sobre-hero');
    const barra = $('.barra-movil');
    let ultimo = 0;

    const actualizar = () => {
      const y = window.scrollY;
      if (y > 40) { cab.classList.add('fija'); if (sobreHero) cab.classList.remove('sobre-hero'); }
      else { cab.classList.remove('fija'); if (sobreHero) cab.classList.add('sobre-hero'); }
      if (barra) barra.classList.toggle('visible', y > 320);
      ultimo = y;
    };
    actualizar();
    window.addEventListener('scroll', () => window.requestAnimationFrame(actualizar), { passive: true });
  }

  /* ── Cajón móvil ──────────────────────────────────────────── */
  function initCajon() {
    const btn = $('.hamb'), cajon = $('.cajon');
    if (!btn || !cajon) return;

    const cerrar = () => {
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Abrir menú');
      cajon.classList.remove('abierto');
      document.body.classList.remove('sin-scroll', 'cajon-abierto');
    };
    btn.addEventListener('click', () => {
      const abierto = btn.getAttribute('aria-expanded') === 'true';
      if (abierto) return cerrar();
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Cerrar menú');
      cajon.classList.add('abierto');
      document.body.classList.add('sin-scroll', 'cajon-abierto');
    });
    $$('.cajon a').forEach(a => a.addEventListener('click', cerrar));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });

    // Reflejar el estado real de los submenús de escritorio
    $$('.menu > li:has(.submenu)').forEach(li => {
      const b = $('button.mp', li);
      if (!b) return;
      const set = v => b.setAttribute('aria-expanded', String(v));
      li.addEventListener('mouseenter', () => set(true));
      li.addEventListener('mouseleave', () => set(false));
      li.addEventListener('focusin', () => set(true));
      li.addEventListener('focusout', e => { if (!li.contains(e.relatedTarget)) set(false); });
    });

    $$('.cajon .grupo > button').forEach(b => b.addEventListener('click', () => {
      const g = b.parentElement;
      const abierto = g.hasAttribute('data-abierto');
      if (abierto) { g.removeAttribute('data-abierto'); b.setAttribute('aria-expanded', 'false'); }
      else { g.setAttribute('data-abierto', ''); b.setAttribute('aria-expanded', 'true'); }
    }));
  }

  /* ── ¿Quiere el visitante menos movimiento? ───────────────── */
  const menosMovimiento = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── La foto del hero se desplaza más despacio que el texto ─ */
  function initParalaje() {
    if (menosMovimiento()) return;
    const fotos = $$('.hero .hero-img img, .cta-final .hero-img img');
    if (!fotos.length) return;
    fotos.forEach(f => { f.style.transform = 'scale(1.12)'; });

    let pendiente = false;
    const mover = () => {
      pendiente = false;
      fotos.forEach(f => {
        const caja = f.parentElement.getBoundingClientRect();
        if (caja.bottom < -200 || caja.top > window.innerHeight + 200) return;  // fuera de pantalla
        const avance = (window.innerHeight - caja.top) / (window.innerHeight + caja.height);
        f.style.transform = 'translate3d(0,' + (avance * 40 - 20).toFixed(1) + 'px,0) scale(1.12)';
      });
    };
    mover();
    window.addEventListener('scroll', () => {
      if (!pendiente) { pendiente = true; window.requestAnimationFrame(mover); }
    }, { passive: true });
    window.addEventListener('resize', mover);
  }

  /* ── Revelado al hacer scroll ─────────────────────────────── */
  function initRevelar() {
    const els = $$('[data-revelar]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('visto')); return; }
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach(en => {
        if (!en.isIntersecting) return;
        const i = Number(en.target.dataset.revelar) || 0;
        en.target.style.transitionDelay = (i * 70) + 'ms';
        en.target.classList.add('visto');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(e => io.observe(e));
  }

  /* ── Visor de galería ─────────────────────────────────────── */
  function initGaleria() {
    const visor = $('.visor');
    if (!visor) return;
    const img = $('img', visor), cont = $('.contador', visor);
    let fuentes = [], idx = 0;

    const pintar = () => {
      img.src = fuentes[idx].src;
      img.alt = fuentes[idx].alt;
      if (cont) cont.textContent = (idx + 1) + ' / ' + fuentes.length;
    };
    let origen = null;   // botón que abrió el visor, para devolverle el foco

    const abrir = (lista, i, disparador) => {
      fuentes = lista; idx = i; origen = disparador || null; pintar();
      visor.classList.add('abierto');
      document.body.classList.add('sin-scroll');
      $('.cerrar', visor).focus();
    };
    const cerrar = () => {
      visor.classList.remove('abierto');
      document.body.classList.remove('sin-scroll');
      if (origen) { origen.focus(); origen = null; }
    };
    const mover = d => { idx = (idx + d + fuentes.length) % fuentes.length; pintar(); };

    $$('.galeria').forEach(g => {
      const botones = $$('button', g);
      const lista = botones.map(b => {
        const i = $('img', b);
        return { src: b.dataset.grande || i.src, alt: i.alt };
      });
      botones.forEach((b, i) => b.addEventListener('click', () => abrir(lista, i, b)));
    });

    $('.cerrar', visor).addEventListener('click', cerrar);
    $('.prev', visor).addEventListener('click', () => mover(-1));
    $('.next', visor).addEventListener('click', () => mover(1));
    visor.addEventListener('click', e => { if (e.target === visor) cerrar(); });
    document.addEventListener('keydown', e => {
      if (!visor.classList.contains('abierto')) return;
      if (e.key === 'Escape') return cerrar();
      if (e.key === 'ArrowLeft') return mover(-1);
      if (e.key === 'ArrowRight') return mover(1);
      // El visor se anuncia como modal: el foco no debe escaparse de él
      if (e.key === 'Tab') {
        const foco = $$('button', visor);
        const i = foco.indexOf(document.activeElement);
        const sig = e.shiftKey
          ? (i <= 0 ? foco.length - 1 : i - 1)
          : (i === foco.length - 1 ? 0 : i + 1);
        foco[sig].focus();
        e.preventDefault();
      }
    });
  }

  /* ── Carril con puntos ────────────────────────────────────── */
  function initCarriles() {
    $$('.carril').forEach(carril => {
      const puntos = carril.parentElement.querySelector('.puntos-carril');
      if (!puntos) return;
      const items = Array.from(carril.children);
      items.forEach((_, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', 'Ir a la opinión ' + (i + 1));
        b.addEventListener('click', () => items[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }));
        puntos.appendChild(b);
      });
      const marcar = () => {
        const i = Math.round(carril.scrollLeft / (carril.scrollWidth / items.length));
        Array.from(puntos.children).forEach((b, j) => b.setAttribute('aria-current', String(j === Math.min(i, items.length - 1))));
      };
      marcar();
      carril.addEventListener('scroll', () => window.requestAnimationFrame(marcar), { passive: true });
    });
  }

  /* ── Buscador y filtros de FAQ ────────────────────────────── */
  function initFaq() {
    const caja = $('#faq-buscar');
    const grupos = $$('.faq-grupo');
    const tabs = $$('.tabs-faq button');
    const vacio = $('.sin-resultados');
    if (!grupos.length) return;

    let categoria = 'todo', texto = '';

    const aplicar = () => {
      let visibles = 0;
      grupos.forEach(g => {
        const coincideCat = categoria === 'todo' || g.dataset.cat === categoria;
        let enGrupo = 0;
        $$('details', g).forEach(d => {
          const t = d.textContent.toLowerCase();
          const ok = coincideCat && (!texto || t.includes(texto));
          d.hidden = !ok;
          if (ok) enGrupo++;
          if (texto && ok) d.open = true;
          if (!texto) d.open = false;
        });
        g.hidden = enGrupo === 0;
        visibles += enGrupo;
      });
      if (vacio) vacio.hidden = visibles > 0;
    };

    if (caja) caja.addEventListener('input', () => { texto = caja.value.trim().toLowerCase(); aplicar(); });
    tabs.forEach(t => t.addEventListener('click', () => {
      tabs.forEach(o => o.setAttribute('aria-pressed', 'false'));
      t.setAttribute('aria-pressed', 'true');
      categoria = t.dataset.cat;
      aplicar();
    }));
  }

  /* ── Cookies ──────────────────────────────────────────────── */
  function initCookies() {
    const c = $('.cookies');
    if (!c) return;
    let estado = null;
    try { estado = localStorage.getItem('sicamper-cookies'); } catch (e) {}
    if (estado) return;
    setTimeout(() => c.classList.add('visible'), 1200);
    $$('[data-cookies]', c).forEach(b => b.addEventListener('click', () => {
      try { localStorage.setItem('sicamper-cookies', b.dataset.cookies); } catch (e) {}
      c.classList.remove('visible');
    }));
  }

  /* ═══════════════════════════════════════════════════════════
     CALCULADORA DE PRESUPUESTO
     Tarifas y condiciones publicadas por Sí Camper.
     ═══════════════════════════════════════════════════════════ */
  const TARIFAS = { baja: 115, media: 159, alta: 179, extra: 235 };
  const MINIMOS  = { baja: 3, media: 7, alta: 7, extra: 7 };
  const NOMBRES  = { baja: 'Temporada baja', media: 'Temporada media', alta: 'Temporada alta', extra: 'Temporada extra' };
  const LARGA    = [{ dias: 29, precio: 99 }, { dias: 22, precio: 105 }, { dias: 15, precio: 110 }, { dias: 10, precio: 149, soloMedia: true }];
  const RECARGO_CORTO = 50;   // reservas de menos de 5 días
  const KM_DIA = 300;         // límite en reservas de menos de 7 días
  const KM_EXTRA = 0.35;
  const FIANZA = 850;
  const HORARIOS = { normal: 0, franja: 35, nocturno: 70 };
  const DOMICILIO = 35;       // desde, Vallès Occidental
  const CANCELACION = 0.06;   // 6 % + coste fijo

  const eur = n => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const eur2 = n => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

  function pascua(y) { // algoritmo de Gauss / Meeus
    const a = y % 19, b = Math.floor(y / 100), c = y % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const mes = Math.floor((h + l - 7 * m + 114) / 31);
    const dia = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mes - 1, dia);
  }
  const dias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  // Fecha local en formato YYYY-MM-DD: toISOString() usa UTC y desplaza el día en España.
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  function festivos(y) {
    const p = pascua(y);
    return [
      new Date(y, 0, 1), new Date(y, 0, 6), dias(p, -2),
      new Date(y, 4, 1), new Date(y, 7, 15), new Date(y, 9, 12),
      new Date(y, 10, 1), new Date(y, 11, 6), new Date(y, 11, 8), new Date(y, 11, 25)
    ].map(iso);
  }
  const cacheFest = {};
  function esPuente(d) {
    const y = d.getFullYear();
    if (!cacheFest[y]) cacheFest[y] = new Set(festivos(y).concat(festivos(y - 1)).concat(festivos(y + 1)));
    for (let k = -1; k <= 1; k++) if (cacheFest[y].has(iso(dias(d, k)))) return true;
    return false;
  }

  function temporadaDia(d) {
    const m = d.getMonth() + 1, dd = d.getDate(), y = d.getFullYear();
    if (m === 8) return 'extra';                                  // agosto
    if (m === 7) return 'alta';                                   // julio
    const p = pascua(y), hoy = iso(d);                             // Semana Santa:
    if (hoy >= iso(dias(p, -7)) && hoy <= iso(dias(p, 1))) return 'alta';  // de Ramos a Lunes de Pascua
    if ((m === 12 && dd >= 20) || (m === 1 && dd <= 6)) return 'media';
    if (m === 6 || m === 9) return 'media';                       // junio y septiembre
    if (esPuente(d)) return 'media';                              // puentes y festivos
    return 'baja';
  }

  /** Cálculo del presupuesto. Devuelve un objeto con desglose. */
  function presupuestar(op) {
    const ini = new Date(op.inicio + 'T12:00:00'), fin = new Date(op.fin + 'T12:00:00');
    const noches = Math.round((fin - ini) / 86400000);
    if (!(noches > 0)) return { error: 'fechas' };

    // Reparto de noches por temporada
    const reparto = {}; let base = 0;
    for (let i = 0; i < noches; i++) {
      const t = temporadaDia(dias(ini, i));
      reparto[t] = (reparto[t] || 0) + 1;
      base += TARIFAS[t];
    }
    const presentes = Object.keys(reparto);
    const dominante = presentes.slice().sort((a, b) => reparto[b] - reparto[a])[0];
    // El mínimo de estancia lo marca la temporada más restrictiva del viaje
    const minimo = Math.max.apply(null, presentes.map(t => MINIMOS[t]));
    const tempMinimo = presentes.reduce((a, b) => (MINIMOS[b] > MINIMOS[a] ? b : a), presentes[0]);
    const orden = presentes.slice().sort((a, b) => TARIFAS[a] - TARIFAS[b]);
    const etiqueta = presentes.length === 1
      ? NOMBRES[presentes[0]]
      : 'Temporadas ' + orden.map(t => NOMBRES[t].replace('Temporada ', '')).join(' y ');

    const lineas = [];
    orden.forEach(t => {
      lineas.push({
        etiqueta: reparto[t] + (reparto[t] === 1 ? ' noche · ' : ' noches · ') + NOMBRES[t].toLowerCase(),
        detalle: eur(TARIFAS[t]) + '/día',
        importe: reparto[t] * TARIFAS[t]
      });
    });

    // Descuento de larga estancia (solo si todo el viaje es de la misma temporada)
    let descuento = 0, notaDescuento = null;
    if (presentes.length === 1) {
      const t = presentes[0];
      const tramo = LARGA.find(x => noches >= x.dias && ((x.soloMedia && t === 'media') || (!x.soloMedia && t === 'baja')));
      if (tramo) {
        const nuevo = noches * tramo.precio;
        if (nuevo < base) {
          descuento = base - nuevo;
          notaDescuento = 'Oferta larga estancia · ' + eur(tramo.precio) + '/día desde ' + tramo.dias + ' días';
        }
      }
    }

    let total = base - descuento;
    const cargos = [];

    if (noches < 5) { cargos.push({ etiqueta: 'Suplemento reserva de menos de 5 días', importe: RECARGO_CORTO }); total += RECARGO_CORTO; }

    if (op.domicilio) { cargos.push({ etiqueta: 'Entrega y recogida a domicilio', detalle: 'desde', importe: DOMICILIO }); total += DOMICILIO; }

    const hEnt = HORARIOS[op.horaEntrega] || 0;
    const hDev = HORARIOS[op.horaDevolucion] || 0;
    if (hEnt) { cargos.push({ etiqueta: 'Entrega fuera de horario', importe: hEnt }); total += hEnt; }
    if (hDev) { cargos.push({ etiqueta: 'Devolución fuera de horario', importe: hDev }); total += hDev; }

    let cancelacion = 0;
    if (op.cancelacion) { cancelacion = Math.round(total * CANCELACION); cargos.push({ etiqueta: 'Seguro de cancelación', detalle: '6 % + coste fijo', importe: cancelacion }); total += cancelacion; }

    // Anticipación
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const antelacion = Math.round((ini - hoy) / 86400000);

    return {
      noches, reparto, dominante, minimo, tempMinimo, etiqueta, lineas, cargos,
      base, descuento, notaDescuento, total, cancelacion, antelacion,
      cumpleMinimo: noches >= minimo,
      kmIlimitados: noches >= (presentes.indexOf('baja') !== -1 ? 7 : 5),
      kmIncluidos: noches * KM_DIA,
      pagoAhora: antelacion > 30 ? Math.round(total * 0.3) : total,
      porcentaje: antelacion > 30 ? 30 : 100,
      fianza: FIANZA,
      extrasConsultar: (op.consultar || [])
    };
  }

  /* ── Interfaz de la calculadora ───────────────────────────── */
  function initCalculadora() { $$('form.calc').forEach(montarCalculadora); }

  /** Todas las búsquedas van limitadas al formulario, así puede haber
   *  más de una calculadora en la misma página sin pisarse. */
  function montarCalculadora(form) {
    const iIni = $('#f-inicio', form), iFin = $('#f-fin', form);
    const salida = $('.resumen', form);
    if (!iIni || !iFin || !salida) return;
    const hoy = new Date();
    const min = iso(dias(hoy, 1));
    iIni.min = min; iFin.min = min;

    // Prefijar desde la URL
    const q = new URLSearchParams(location.search);
    if (q.get('inicio')) iIni.value = q.get('inicio');
    if (q.get('fin')) iFin.value = q.get('fin');
    if (q.get('domicilio') === '1') { const d = $('#o-domicilio', form); if (d) d.checked = true; }

    const svgAviso = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>';

    function render() {
      if (iIni.value && iFin.value && iFin.value <= iIni.value) {
        iFin.value = iso(dias(new Date(iIni.value + 'T12:00:00'), 3));
      }
      if (iIni.value) iFin.min = iso(dias(new Date(iIni.value + 'T12:00:00'), 1));

      if (!iIni.value || !iFin.value) {
        salida.innerHTML = '<h3>Tu presupuesto</h3><p class="vacio">Elige las fechas de salida y de vuelta y verás al instante el precio, la temporada y lo que se incluye.</p>';
        return;
      }

      const op = {
        inicio: iIni.value, fin: iFin.value,
        domicilio: !!($('#o-domicilio', form) || {}).checked,
        cancelacion: !!($('#o-cancelacion', form) || {}).checked,
        horaEntrega: ($('#o-hora-entrega', form) || {}).value || 'normal',
        horaDevolucion: ($('#o-hora-devolucion', form) || {}).value || 'normal',
        consultar: $$('.opcion input[data-consultar]:checked', form).map(i => i.dataset.consultar)
      };
      const r = presupuestar(op);
      if (r.error) { salida.innerHTML = '<h3>Tu presupuesto</h3><p class="vacio">Revisa las fechas: la vuelta tiene que ser posterior a la salida.</p>'; return; }

      let html = '<h3>Tu presupuesto</h3>';
      html += '<span class="temporada-badge"><i></i>' + r.etiqueta + ' · ' + r.noches + (r.noches === 1 ? ' noche' : ' noches') + '</span>';

      html += '<div class="desglose">';
      r.lineas.forEach(l => {
        html += '<div class="fila"><span>' + l.etiqueta + (l.detalle ? ' <em style="opacity:.7">(' + l.detalle + ')</em>' : '') + '</span><b>' + eur(l.importe) + '</b></div>';
      });
      if (r.descuento) html += '<div class="fila descuento"><span>' + r.notaDescuento + '</span><b>−' + eur(r.descuento) + '</b></div>';
      r.cargos.forEach(c => {
        html += '<div class="fila"><span>' + c.etiqueta + (c.detalle ? ' <em style="opacity:.7">(' + c.detalle + ')</em>' : '') + '</span><b>' + eur(c.importe) + '</b></div>';
      });
      html += '<div class="fila total"><span>Total estimado</span><b>' + eur(r.total) + '</b></div>';
      html += '</div>';

      if (!r.cumpleMinimo) {
        html += '<p class="aviso alerta">' + svgAviso + '<span>En ' + NOMBRES[r.tempMinimo].toLowerCase() + ' la estancia mínima es de <strong>' + r.minimo + ' días</strong>. Alarga el viaje o escríbeme y buscamos una alternativa.</span></p>';
      }

      html += '<p class="aviso">' + svgAviso + '<span>' +
        (r.kmIlimitados
          ? 'Kilómetros <strong>ilimitados</strong> incluidos.'
          : 'Incluye <strong>' + r.kmIncluidos.toLocaleString('es-ES') + ' km</strong> (300 km/día). Kilómetro extra: ' + eur2(KM_EXTRA) + '. Hay packs de kilometraje si los necesitas.') +
        '</span></p>';

      if (r.extrasConsultar.length) {
        html += '<p class="aviso">' + svgAviso + '<span>Has marcado <strong>' + r.extrasConsultar.join(', ') + '</strong>. Estos extras se confirman al reservar y no están sumados en el total.</span></p>';
      }

      html += '<div class="desglose"><div class="fila"><span>A pagar ahora (' + r.porcentaje + ' %)</span><b>' + eur(r.pagoAhora) + '</b></div></div>';
      html += '<p class="fianza">Fianza aparte de ' + eur(r.fianza) + ' con tarjeta de crédito, devuelta en unos 7 días si todo está correcto. Estimación orientativa: te confirmo el precio final por escrito.</p>';

      const url = 'reservar.html?inicio=' + iIni.value + '&fin=' + iFin.value + (op.domicilio ? '&domicilio=1' : '');
      if (!form.dataset.esReserva) {
        html += '<a class="btn btn-primario btn-bloque" href="' + url + '">Solicitar estas fechas</a>';
      }
      const totalAnterior = form._ultimoTotal;
      salida.innerHTML = html;
      animarTotal($('.fila.total b', salida), totalAnterior, r.total);
      form._ultimoTotal = r.total;

      // Sincronizar el formulario de solicitud: solo la calculadora de reservar
      if (!form.dataset.esReserva) return;
      const rNoches = $('#r-noches'), rTotal = $('#r-total'), rTemp = $('#r-temporada');
      const rIni = $('#r-inicio'), rFin = $('#r-fin');
      const bonito = v => new Date(v + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
      if (rIni) rIni.value = bonito(iIni.value);
      if (rFin) rFin.value = bonito(iFin.value);
      if (rNoches) rNoches.value = r.noches;
      if (rTotal) rTotal.value = eur(r.total);
      if (rTemp) rTemp.value = r.etiqueta;
    }

    // input y change llegan casi a la vez al tocar una fecha: si se pintara
    // dos veces, el segundo repintado se comería la animación del total.
    let espera;
    const repintar = () => { clearTimeout(espera); espera = setTimeout(render, 70); };
    form.addEventListener('input', repintar);
    form.addEventListener('change', repintar);
    render();
  }

  /** Recorre del importe anterior al nuevo, para que se vea que ha cambiado. */
  function animarTotal(el, desde, hasta) {
    if (!el || desde === hasta) return;
    if (typeof desde !== 'number' || menosMovimiento()) { el.textContent = eur(hasta); return; }
    el.classList.add('cambiando');
    const t0 = performance.now(), dur = 420;
    const paso = ahora => {
      const p = Math.min(1, (ahora - t0) / dur);
      const suave = 1 - Math.pow(1 - p, 3);
      el.textContent = eur(Math.round(desde + (hasta - desde) * suave));
      if (p < 1) window.requestAnimationFrame(paso);
      else { el.textContent = eur(hasta); el.classList.remove('cambiando'); }
    };
    window.requestAnimationFrame(paso);
  }

  /* ── Buscador del hero (fechas → reservar.html) ───────────── */
  function initBuscadorHero() {
    const f = $('#buscador-hero');
    if (!f) return;
    const i1 = $('#h-inicio', f), i2 = $('#h-fin', f);
    const min = iso(dias(new Date(), 1));
    i1.min = min; i2.min = min;
    i1.addEventListener('change', () => {
      if (i1.value) { i2.min = iso(dias(new Date(i1.value + 'T12:00:00'), 1)); if (i2.value && i2.value <= i1.value) i2.value = ''; }
    });
    f.addEventListener('submit', e => {
      e.preventDefault();
      const p = new URLSearchParams();
      if (i1.value) p.set('inicio', i1.value);
      if (i2.value) p.set('fin', i2.value);
      location.href = 'precios.html' + (p.toString() ? '?' + p : '') + '#calculadora';
    });
  }

  /* ── Formulario de contacto / reserva (mailto) ────────────── */
  function initFormularios() {
    $$('form[data-mailto]').forEach(f => {
      f.addEventListener('submit', e => {
        e.preventDefault();
        if (!f.reportValidity()) return;
        const d = new FormData(f);
        const lineas = [];
        f.querySelectorAll('[name]').forEach(el => {
          if (el.type === 'checkbox' && !el.checked) return;
          const v = el.type === 'checkbox' ? 'sí' : (d.get(el.name) || '');
          if (!v || el.name === 'privacidad') return;
          const et = f.querySelector('label[for="' + el.id + '"]');
          lineas.push((et ? et.textContent.replace(/\*$/, '').trim() : el.name) + ': ' + v);
        });
        const asunto = f.dataset.asunto || 'Consulta desde sicamper.com';
        location.href = 'mailto:' + f.dataset.mailto + '?subject=' + encodeURIComponent(asunto) +
          '&body=' + encodeURIComponent(lineas.join('\n'));
        const ok = f.querySelector('.enviado');
        if (ok) ok.hidden = false;
      });
    });
  }

  /* ── Año en el pie ────────────────────────────────────────── */
  function initAnio() { $$('[data-anio]').forEach(e => e.textContent = new Date().getFullYear()); }

  /* ── Arranque ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    initTema(); initCabecera(); initCajon(); initRevelar(); initParalaje(); initGaleria();
    initCarriles(); initFaq(); initCookies(); initCalculadora();
    initBuscadorHero(); initFormularios(); initAnio();
  });
})();
