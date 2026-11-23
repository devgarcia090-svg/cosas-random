/* ═══════════════════════════════════════════════════════════
   MAYA V2 — animación
   Patrón «Scroll-Triggered Storytelling» de ui-ux-pro-max:
   gancho → capítulos → clímax, con indicador de progreso.
   Los presets de movimiento son del dominio gsap de la skill,
   nivel Complex, con sus propias restricciones aplicadas:
     · dividir en caracteres solo titulares cortos
     · imán limitado a 0.3 y a un único elemento
     · todo lo no esencial fuera con prefers-reduced-motion
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var movil  = matchMedia('(max-width: 860px)').matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ── Scroll suave ─────────────────────────────────────────
     Lenis mueve el scroll; ScrollTrigger necesita enterarse. */
  var lenis = null;
  if (!quieto && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ── Partir un titular en caracteres ──────────────────────
     La skill avisa: solo titulares cortos, y hay que poder
     devolver el texto original para los lectores de pantalla.
     Por eso el <span> original guarda su texto en aria-label. */
  function partir(el) {
    var texto = el.textContent;
    el.setAttribute('aria-label', texto);
    el.textContent = '';
    return texto.split('').map(function (ch) {
      var s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.display = 'inline-block';
      s.style.willChange = 'transform,opacity';
      s.setAttribute('aria-hidden', 'true');
      el.appendChild(s);
      return s;
    });
  }

  /* ══ PRELOADER ══════════════════════════════════════════ */
  function arrancaSitio() {
    document.body.classList.remove('cargando');
    if (lenis) lenis.start();
    heroEntra();
    ScrollTrigger.refresh();
  }

  var pre = document.getElementById('pre');
  if (quieto) {
    pre.remove();
    arrancaSitio();
  } else {
    if (lenis) lenis.stop();
    var cuenta = { v: 0 };
    gsap.timeline()
      .to(cuenta, {
        v: 100, duration: 1.9, ease: 'power2.inOut',
        onUpdate: function () {
          document.getElementById('pre-num').textContent = Math.round(cuenta.v);
        }
      })
      .to('#pre-barra', { width: '100%', duration: 1.9, ease: 'power2.inOut' }, 0)
      .to('#pre-num', { y: -40, opacity: 0, duration: .45, ease: 'power3.in' })
      .to('.pre-txt', { opacity: 0, duration: .3 }, '<')
      // La cortina sube y descubre la página.
      .to(pre, {
        yPercent: -100, duration: 1, ease: 'expo.inOut',
        onComplete: function () { pre.remove(); }
      })
      .add(arrancaSitio, '-=0.55');
  }

  /* ══ HERO ═══════════════════════════════════════════════ */
  function heroEntra() {
    var tl = gsap.timeline();

    // La foto se descubre de abajo a arriba.
    tl.to('#hero-fondo', {
      clipPath: 'inset(0% 0 0 0)', duration: 1.3, ease: 'expo.out'
    }, 0);

    // Titular: cada línea sube, y dentro cada letra gira al entrar.
    gsap.utils.toArray('#h1 .ln > span').forEach(function (linea, i) {
      var chars = partir(linea);
      tl.from(chars, {
        yPercent: 115, rotateX: -55, opacity: 0,
        duration: .9, ease: 'expo.out', stagger: .022
      }, 0.15 + i * 0.12);
    });

    tl.from('.hero-pie > *', {
      y: 26, opacity: 0, duration: .7, ease: 'power3.out', stagger: .12
    }, 0.75);
    tl.from('.nav', { y: -30, opacity: 0, duration: .7, ease: 'power3.out' }, 0.5);

    // Parallax: la foto se mueve menos que el texto al bajar.
    if (!quieto) {
      gsap.to('#hero-fondo img', {
        yPercent: 16, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
      gsap.to('#h1', {
        yPercent: -26, opacity: .25, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .4 }
      });
    }
  }

  if (quieto) {
    // Sin animación, todo en su estado final.
    gsap.set('#hero-fondo', { clipPath: 'inset(0% 0 0 0)' });
  }

  /* ══ NAV SÓLIDO FUERA DEL HERO ══════════════════════════ */
  ScrollTrigger.create({
    trigger: '.hero', start: 'bottom top+=70',
    onEnter: function () { document.querySelector('.nav').classList.add('solido'); },
    onLeaveBack: function () { document.querySelector('.nav').classList.remove('solido'); }
  });

  /* ══ INDICADOR DE PROGRESO ══════════════════════════════ */
  gsap.to('#progreso', {
    scaleX: 1, ease: 'none',
    scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: .2 }
  });

  /* ══ MARQUESINA ═════════════════════════════════════════ */
  (function () {
    var pista = document.getElementById('marq');
    if (!pista || quieto) return;
    var mitad = pista.scrollWidth / 2;
    var bucle = gsap.to(pista, {
      x: -mitad, duration: 22, ease: 'none', repeat: -1,
      modifiers: { x: function (x) { return (parseFloat(x) % mitad) + 'px'; } }
    });
    // Al desplazarse rápido, la cinta acelera y cambia de sentido.
    ScrollTrigger.create({
      trigger: document.body, start: 'top top', end: 'bottom bottom',
      onUpdate: function (self) {
        var v = gsap.utils.clamp(-3, 3, self.getVelocity() / 420);
        bucle.timeScale(v === 0 ? 1 : (v < 0 ? Math.min(v, -0.4) : Math.max(v, 0.4)));
        gsap.to(bucle, { timeScale: 1, duration: 1.4, overwrite: true, delay: .25 });
      }
    });
  })();

  /* ══ CIFRAS ═════════════════════════════════════════════ */
  gsap.utils.toArray('.cifra b').forEach(function (el) {
    var fin = parseInt(el.dataset.n, 10);
    var fmt = el.dataset.fmt;
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: fin, duration: quieto ? 0 : 2, ease: 'power3.out',
          onUpdate: function () {
            var v = obj.v;
            el.textContent =
              fmt === 'M' ? (v / 1e6).toFixed(1).replace('.', ',') + ' M' :
              fmt === 'K' ? Math.round(v / 1000) + ' K' :
              Math.round(v).toLocaleString('es-ES');
          }
        });
      }
    });
  });

  /* ══ CAPÍTULOS EN HORIZONTAL ════════════════════════════
     En móvil se deja en vertical: la skill dice simplificar
     las animaciones ahí, y un scroll horizontal fijado en un
     teléfono pelea con el gesto de volver atrás. */
  (function () {
    var pista = document.getElementById('pista');
    if (!pista || quieto || movil) return;
    var recorrido = pista.scrollWidth - window.innerWidth;
    if (recorrido <= 0) return;
    gsap.to(pista, {
      x: -recorrido, ease: 'none',
      scrollTrigger: {
        trigger: '.estigma', start: 'top top',
        end: function () { return '+=' + recorrido; },
        pin: true, scrub: 1, invalidateOnRefresh: true
      }
    });
    // Cada panel entra girando un poco mientras pasa.
    gsap.utils.toArray('.panel').forEach(function (p) {
      gsap.from(p, {
        opacity: 0, scale: .92, rotate: 2, ease: 'power2.out',
        scrollTrigger: { trigger: p, containerAnimation: gsap.getTweensOf(pista)[0],
          start: 'left 92%', end: 'left 55%', scrub: true }
      });
    });
  })();

  /* ══ REVELADOS GENERALES ════════════════════════════════ */
  if (!quieto) {
    gsap.utils.toArray('.seccion .et, .seccion .tit').forEach(function (el) {
      gsap.from(el, {
        y: 34, opacity: 0, duration: .85, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });

    // Fichas apiladas: la de abajo se encoge y se oscurece al quedar tapada.
    // Nada de opacity: al bajarla, la ficha dejaba ver la de detrás.
    gsap.utils.toArray('.ficha').forEach(function (f, i, arr) {
      if (i === arr.length - 1) return;
      gsap.to(f, {
        scale: .93, ease: 'none',
        scrollTrigger: { trigger: arr[i + 1], start: 'top bottom', end: 'top top', scrub: true }
      });
    });

    // Galería: cada columna a distinta velocidad.
    gsap.utils.toArray('.gal-col').forEach(function (col) {
      gsap.to(col, {
        yPercent: parseFloat(col.dataset.vel || -6), ease: 'none',
        scrollTrigger: { trigger: '.galeria', start: 'top bottom', end: 'bottom top', scrub: .6 }
      });
    });
    gsap.utils.toArray('.gal-col img').forEach(function (img) {
      gsap.from(img, {
        clipPath: 'inset(100% 0 0 0)', duration: 1.1, ease: 'expo.out',
        scrollTrigger: { trigger: img, start: 'top 92%' }
      });
    });
  }

  /* ══ CURSOR ═════════════════════════════════════════════ */
  (function () {
    if (quieto || matchMedia('(hover: none)').matches) return;
    var punto = document.querySelector('.cursor');
    var aro   = document.querySelector('.cursor-anillo');
    var px = gsap.quickTo(punto, 'x', { duration: .12, ease: 'power3' });
    var py = gsap.quickTo(punto, 'y', { duration: .12, ease: 'power3' });
    var ax = gsap.quickTo(aro, 'x', { duration: .45, ease: 'power3' });
    var ay = gsap.quickTo(aro, 'y', { duration: .45, ease: 'power3' });
    window.addEventListener('pointermove', function (e) {
      px(e.clientX); py(e.clientY); ax(e.clientX); ay(e.clientY);
    });
    document.querySelectorAll('a, button').forEach(function (el) {
      el.addEventListener('pointerenter', function () {
        gsap.to(aro, { scale: 1.9, borderColor: '#FF4322', duration: .3 });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(aro, { scale: 1, borderColor: '#141319', duration: .3 });
      });
    });
  })();

  /* ══ BOTÓN MAGNÉTICO ════════════════════════════════════
     Solo uno: la skill avisa de que con más de dos la página
     se vuelve ruidosa. Y el tirón va limitado a 0.3 para que
     el botón nunca se salga de su propia zona pulsable. */
  (function () {
    var b = document.getElementById('boton');
    if (!b || quieto || matchMedia('(hover: none)').matches) return;
    var bx = gsap.quickTo(b, 'x', { duration: .4, ease: 'power3' });
    var by = gsap.quickTo(b, 'y', { duration: .4, ease: 'power3' });
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      bx((e.clientX - r.left - r.width / 2) * .3);
      by((e.clientY - r.top - r.height / 2) * .3);
    });
    b.addEventListener('pointerleave', function () { bx(0); by(0); });
  })();

  /* ══ ENLACES INTERNOS ═══════════════════════════════════ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var d = document.querySelector(a.getAttribute('href'));
      if (!d) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(d, { duration: 1.4 });
      else d.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth' });
    });
  });

  // Las fotos cambian la altura de la página: hay que recalcular.
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
