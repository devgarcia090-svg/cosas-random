// ── MAYA ROTTWEILER · TEMA JS v2 ──────────────────────────────
document.documentElement.classList.add('tjs');

// Nav: añade clase .scrolled al hacer scroll
(function () {
  var nav = document.querySelector('nav');
  if (!nav) return;
  var tick = false;
  window.addEventListener('scroll', function () {
    if (!tick) {
      requestAnimationFrame(function () {
        nav.classList.toggle('scrolled', window.scrollY > 60);
        tick = false;
      });
      tick = true;
    }
  }, { passive: true });
  nav.classList.toggle('scrolled', window.scrollY > 60);
})();

// Barra de progreso de lectura (solo si la página no la crea ya)
(function () {
  if (document.getElementById('scrollProgress')) return;
  var sp = document.createElement('div');
  sp.id = 'scrollProgress';
  document.body.appendChild(sp);
  window.addEventListener('scroll', function () {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    sp.style.width = (max > 0 ? (h.scrollTop / max * 100) : 0) + '%';
  }, { passive: true });
})();

// Reveal al hacer scroll: etiqueta elementos bajo el fold y los revela
(function () {
  if (!('IntersectionObserver' in window)) return;
  var SEL = [
    'article h2', 'article h3', 'article p', 'article ul', 'article ol',
    'article img', 'article table', '.etapa-card', '.info-box', '.warning-box',
    '.toxico', '.guide-card', '.related-link', '.highlight-box', '.quiz-banner',
    '.faq-item', '.why-card', '.stat-card', '.colaboracion-card', '.cta-section h2'
  ].join(',');
  var els = document.querySelectorAll(SEL);
  if (!els.length) return;

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('tv'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

  var fold = window.innerHeight * 0.92;
  var delayByParent = {};
  els.forEach(function (el) {
    // No tocar elementos que ya usan el sistema .fade-in de la página
    if (el.classList.contains('fade-in') || el.closest('.fade-in')) return;
    // Los que ya están a la vista al cargar se quedan visibles (sin flash)
    if (el.getBoundingClientRect().top < fold) return;
    el.setAttribute('data-tr', '');
    // Escalonado suave entre hermanos del mismo contenedor
    var p = el.parentElement;
    if (p) {
      var key = p.tagName + (p.className || '');
      delayByParent[key] = (delayByParent[key] || 0);
      el.style.transitionDelay = Math.min(delayByParent[key] * 70, 350) + 'ms';
      delayByParent[key]++;
    }
    io.observe(el);
  });
})();

// Brasas en canvas: usa #heroCanvas si existe, o lo crea en el hero interior
(function () {
  var cv = document.getElementById('heroCanvas');
  if (!cv) {
    var hero = document.querySelector('.hero-h');
    if (!hero) return;
    cv = document.createElement('canvas');
    cv.className = 'hero-canvas';
    cv.id = 'heroCanvas';
    hero.insertBefore(cv, hero.firstChild);
  }
  if (cv.dataset.ei) return;
  cv.dataset.ei = '1';

  var cx = cv.getContext('2d');

  function resize() {
    cv.width  = cv.parentElement.offsetWidth;
    cv.height = cv.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  function Ember(init) { this.reset(init); }
  Ember.prototype.reset = function (init) {
    this.x  = Math.random() * cv.width;
    this.y  = init ? Math.random() * cv.height : cv.height + 8;
    this.r  = Math.random() * 2.2 + 0.4;
    this.vy = -(Math.random() * 0.85 + 0.25);
    this.vx = (Math.random() - 0.5) * 0.35;
    this.a  = Math.random() * 0.5 + 0.08;
    this.da = Math.random() * 0.0018 + 0.0004;
    this.h  = Math.random() * 28 + 15;
    this.s  = 78 + Math.random() * 18;
    this.l  = 52 + Math.random() * 22;
  };
  Ember.prototype.step = function () {
    this.y += this.vy;
    this.x += this.vx;
    this.vx += (Math.random() - 0.5) * 0.055;
    this.a  -= this.da;
    if (this.a <= 0 || this.y < -12) this.reset(false);
  };
  Ember.prototype.draw = function () {
    cx.save();
    cx.globalAlpha  = Math.max(0, this.a);
    cx.shadowBlur   = this.r * 7;
    cx.shadowColor  = 'hsl(' + this.h + ',' + this.s + '%,' + this.l + '%)';
    cx.fillStyle    = 'hsl(' + this.h + ',' + this.s + '%,' + this.l + '%)';
    cx.beginPath();
    cx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    cx.fill();
    cx.restore();
  };

  var embers = [];
  for (var i = 0; i < 90; i++) embers.push(new Ember(true));

  function loop() {
    cx.clearRect(0, 0, cv.width, cv.height);
    for (var i = 0; i < embers.length; i++) { embers[i].step(); embers[i].draw(); }
    requestAnimationFrame(loop);
  }
  loop();
})();

// ── Banner de cookies + Google Consent Mode (RGPD / LSSI) ──────────
(function () {
  function gt() { if (window.gtag) window.gtag.apply(window, arguments); }
  function grant() {
    gt('consent', 'update', {
      'ad_storage': 'granted', 'ad_user_data': 'granted',
      'ad_personalization': 'granted', 'analytics_storage': 'granted'
    });
  }
  /* ══ PIXELES DE PUBLICIDAD ══════════════════════════════════════
     Pega aqui los identificadores cuando vayas a anunciarte. Si se
     quedan vacios no se carga nada: la web no pide a Meta ni a
     TikTok ningun script que no haga falta.

     Van en todas las paginas a proposito, no solo en la tienda:
     asi puedes volver a impactar a quien leyo una guia sobre
     bozales, que es tu publico mas numeroso.

     IMPORTANTE: solo se cargan si el visitante ACEPTA las cookies.
     Cargarlos antes seria incumplir el RGPD y dejaria el banner de
     adorno. No muevas esta llamada fuera de aqui.                */
  var PIXELES = {
    meta:   '',   // ID del pixel de Meta (solo numeros)
    tiktok: ''    // ID del pixel de TikTok
  };

  var pixelesPuestos = false;
  function cargarPixeles() {
    if (pixelesPuestos) return;
    pixelesPuestos = true;

    if (PIXELES.meta) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', PIXELES.meta);
      window.fbq('track', 'PageView');
    }

    if (PIXELES.tiktok) {
      !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
      ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];
      ttq.setAndDefer=function(e,n){e[n]=function(){e.push([n].concat(Array.prototype.slice.call(arguments,0)))}};
      for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
      ttq.instance=function(e){for(var n=ttq._i[e]||[],i=0;i<ttq.methods.length;i++)ttq.setAndDefer(n,ttq.methods[i]);return n};
      ttq.load=function(e,n){var r='https://analytics.tiktok.com/i18n/pixel/events.js';
      ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;
      ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement('script');o.type='text/javascript';
      o.async=!0;o.src=r+'?sdkid='+e+'&lib='+t;var a=d.getElementsByTagName('script')[0];
      a.parentNode.insertBefore(o,a)};
      ttq.load(PIXELES.tiktok);ttq.page()}(window,document,'ttq');
    }

    // Eventos que ocurrieron antes de aceptar: se reenvian ahora.
    while (window._colaMedicion && window._colaMedicion.length) {
      var ev = window._colaMedicion.shift();
      window.medir(ev[0], ev[1]);
    }
  }

  /* ══ MEDIR UN EVENTO ════════════════════════════════════════════
     Una sola llamada que reparte a Google, Meta y TikTok:
         medir('apuntado_lista', { metodo:'encuesta' })
     Si el visitante no ha aceptado cookies, el evento se guarda en
     una cola y se envia si acepta despues. Si rechaza, se descarta. */
  window._colaMedicion = window._colaMedicion || [];
  window.medir = function (nombre, datos) {
    datos = datos || {};
    var ok = false;
    try { ok = localStorage.getItem('cookieConsent') === 'accepted'; } catch (e) {}
    if (!ok) { window._colaMedicion.push([nombre, datos]); return; }

    if (window.gtag) window.gtag('event', nombre, datos);

    // Meta y TikTok usan nombres propios para los eventos estandar.
    var meta   = { ver_producto:'ViewContent', apuntado_lista:'Lead',
                   anadido_carrito:'AddToCart', compra_iniciada:'InitiateCheckout' };
    var tiktok = { ver_producto:'ViewContent', apuntado_lista:'SubmitForm',
                   anadido_carrito:'AddToCart', compra_iniciada:'InitiateCheckout' };
    if (window.fbq && meta[nombre])   window.fbq('track', meta[nombre], datos);
    if (window.ttq && tiktok[nombre]) window.ttq.track(tiktok[nombre], datos);
  };

  function hide() { var b = document.getElementById('cookie-banner'); if (b) b.parentNode.removeChild(b); }
  window.acceptCookies = function () { try { localStorage.setItem('cookieConsent', 'accepted'); } catch (e) {} grant(); cargarPixeles(); hide(); };
  window.rejectCookies = function () { try { localStorage.setItem('cookieConsent', 'rejected'); } catch (e) {} hide(); };

  var consent = null;
  try { consent = localStorage.getItem('cookieConsent'); } catch (e) {}
  if (consent === 'accepted') { grant(); cargarPixeles(); return; }
  if (consent === 'rejected') { return; }

  // Sin decisión previa: mostramos el banner (GA sigue "denegado" mientras tanto)
  var b = document.createElement('div');
  b.id = 'cookie-banner';
  b.setAttribute('style', 'position:fixed;bottom:0;left:0;width:100%;z-index:9999;background:#0D0B09;border-top:1px solid rgba(200,114,42,0.35);padding:1.2rem 2rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;box-shadow:0 -4px 20px rgba(0,0,0,0.5);');
  b.innerHTML = '<p style="margin:0;font-size:.82rem;color:rgba(242,237,230,.75);max-width:700px;line-height:1.6;font-family:inherit;">🍪 Usamos cookies propias y de terceros (Google Analytics) para analizar el tráfico y mejorar la web. Puedes aceptarlas o rechazarlas libremente. <a href="privacidad.html" style="color:#C8722A;font-weight:700;">Más información</a></p>' +
    '<div style="display:flex;gap:.8rem;flex-shrink:0;">' +
    '<button type="button" onclick="acceptCookies()" style="background:#C8722A;color:#0D0B09;border:none;padding:.6rem 1.4rem;border-radius:10px;font-family:inherit;font-weight:800;font-size:.72rem;cursor:pointer;letter-spacing:1px;text-transform:uppercase;">Aceptar</button>' +
    '<button type="button" onclick="rejectCookies()" style="background:transparent;color:rgba(242,237,230,.55);border:1px solid rgba(242,237,230,.18);padding:.6rem 1.4rem;border-radius:10px;font-family:inherit;font-weight:700;font-size:.72rem;cursor:pointer;letter-spacing:1px;text-transform:uppercase;">Rechazar</button>' +
    '</div>';
  if (document.body) document.body.appendChild(b);
})();

/* ══ CAPA DE NAVIDAD ══════════════════════════════════
   Guirnalda de luces colgando bajo el nav y nieve cayendo.
   Se apaga sola al pasar FIN. Para matarla antes: APAGADA = true.

   La guirnalda va FIJA pero por debajo del nav en z-index y sin
   tocarlo: el nav sigue siendo el mismo sticky de siempre, que es
   donde estaban todos los problemas en Safari de iPhone.       */
(function () {
  var APAGADA = false;
  var FIN = new Date('2027-01-07T23:59:59');
  if (APAGADA || new Date() > FIN) return;

  var quieto = window.matchMedia &&
               matchMedia('(prefers-reduced-motion: reduce)').matches;

  var CSS = [
    /* ── Guirnalda ── */
    '.nv-g{position:fixed;left:0;right:0;top:var(--alto-nav,76px);height:34px;',
      'z-index:899;pointer-events:none;display:flex;justify-content:space-between;',
      'align-items:flex-start;padding:0 14px}',
    '.nv-g::before{content:"";position:absolute;left:0;right:0;top:3px;height:2px;',
      'background:linear-gradient(90deg,#4A3A2A,#6B5540,#4A3A2A);opacity:.85}',
    '.nv-b{position:relative;width:11px;height:11px;border-radius:50%;',
      'background:var(--c);margin-top:var(--cuelga);flex:0 0 auto;',
      'box-shadow:0 0 10px 2px var(--c),0 0 22px 6px var(--c)}',
    /* cordoncito que une la bombilla con el cable */
    '.nv-b::before{content:"";position:absolute;left:50%;bottom:100%;',
      'width:2px;height:var(--cuelga);background:#6B5540;transform:translateX(-50%)}',
    quieto ? '' :
      '.nv-b{animation:nvLuz 3.4s ease-in-out infinite;animation-delay:var(--t)}',
    '@keyframes nvLuz{0%,100%{opacity:1}50%{opacity:.38}}',
    '@media (max-width:700px){.nv-g{height:26px;padding:0 8px}',
      '.nv-b{width:9px;height:9px}}',

    /* ── Nieve ── */
    '.nv-capa{position:fixed;inset:0;pointer-events:none;z-index:898;overflow:hidden}',
    '.nv-c{position:absolute;top:-30px;will-change:transform,opacity;opacity:0}',
    quieto ? '.nv-c{display:none}' :
      '.nv-c{animation:nvCae linear infinite}',
    '@keyframes nvCae{',
      '0%{transform:translate(0,0) rotate(0deg);opacity:0}',
      '8%{opacity:var(--op)}',
      '92%{opacity:var(--op)}',
      '100%{transform:translate(var(--deriva),104vh) rotate(260deg);opacity:0}}'
  ].join('');

  // Copo de nieve: tres ejes cruzados con sus ramitas. Geometria
  // simple a proposito, que es lo que me sale bien.
  function copo(px) {
    var r = '';
    for (var a = 0; a < 180; a += 60) {
      r += '<g transform="rotate(' + a + ' 12 12)">' +
             '<line x1="12" y1="2" x2="12" y2="22"/>' +
             '<line x1="12" y1="6"  x2="8.5"  y2="9"/>' +
             '<line x1="12" y1="6"  x2="15.5" y2="9"/>' +
             '<line x1="12" y1="18" x2="8.5"  y2="15"/>' +
             '<line x1="12" y1="18" x2="15.5" y2="15"/>' +
           '</g>';
    }
    return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 24 24" ' +
           'fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" ' +
           'aria-hidden="true">' + r + '</svg>';
  }

  var COLORES = ['#E8B04B', '#C0392B', '#F2EDE6', '#C8722A'];

  function arranca() {
    var e = document.createElement('style'); e.textContent = CSS;
    document.head.appendChild(e);

    // ── Guirnalda ──
    var g = document.createElement('div');
    g.className = 'nv-g';
    g.setAttribute('aria-hidden', 'true');
    var ancho = window.innerWidth;
    var cuantasLuces = Math.max(8, Math.round(ancho / 46));
    for (var j = 0; j < cuantasLuces; j++) {
      var b = document.createElement('span');
      b.className = 'nv-b';
      b.style.setProperty('--c', COLORES[j % COLORES.length]);
      // Las bombillas cuelgan a distinta altura: hace el efecto de
      // cable descolgado sin tener que dibujar una curva.
      b.style.setProperty('--cuelga', (j % 2 ? 15 : 7) + 'px');
      b.style.setProperty('--t', (j * 0.17).toFixed(2) + 's');
      g.appendChild(b);
    }
    document.body.appendChild(g);

    // ── Nieve ──
    if (quieto) return;
    var capa = document.createElement('div');
    capa.className = 'nv-capa';
    capa.setAttribute('aria-hidden', 'true');
    var cuantos = ancho < 700 ? 18 : 34;
    for (var i = 0; i < cuantos; i++) {
      var c = document.createElement('div');
      c.className = 'nv-c';
      var px = (9 + Math.random() * 11).toFixed(0);   // 9 a 20 px
      c.innerHTML = copo(px);
      c.style.left = (Math.random() * 100).toFixed(1) + '%';
      c.style.setProperty('--deriva', (Math.random() * 140 - 70).toFixed(0) + 'px');
      c.style.setProperty('--op', (0.45 + Math.random() * 0.45).toFixed(2));
      c.style.animationDuration = (10 + Math.random() * 12).toFixed(1) + 's';
      c.style.animationDelay = (-Math.random() * 22).toFixed(1) + 's';
      capa.appendChild(c);
    }
    document.body.appendChild(capa);
  }

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', arranca);
  else arranca();
})();
