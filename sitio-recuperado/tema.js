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
  function hide() { var b = document.getElementById('cookie-banner'); if (b) b.parentNode.removeChild(b); }
  window.acceptCookies = function () { try { localStorage.setItem('cookieConsent', 'accepted'); } catch (e) {} grant(); hide(); };
  window.rejectCookies = function () { try { localStorage.setItem('cookieConsent', 'rejected'); } catch (e) {} hide(); };

  var consent = null;
  try { consent = localStorage.getItem('cookieConsent'); } catch (e) {}
  if (consent === 'accepted') { grant(); return; }
  if (consent === 'rejected') { return; }

  // Sin decisión previa: mostramos el banner (GA sigue "denegado" mientras tanto)
  var b = document.createElement('div');
  b.id = 'cookie-banner';
  b.setAttribute('style', 'position:fixed;bottom:0;left:0;width:100%;z-index:9999;background:#0D0B09;border-top:1px solid rgba(200,114,42,0.35);padding:1.2rem 2rem;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;flex-wrap:wrap;box-shadow:0 -4px 20px rgba(0,0,0,0.5);');
  b.innerHTML = '<p style="margin:0;font-size:.82rem;color:rgba(242,237,230,.75);max-width:700px;line-height:1.6;font-family:inherit;">🍪 Usamos cookies propias y de terceros (Google Analytics) para analizar el tráfico y mejorar la web. Puedes aceptarlas o rechazarlas libremente. <a href="privacidad.html" style="color:#C8722A;font-weight:700;">Más información</a></p>' +
    '<div style="display:flex;gap:.8rem;flex-shrink:0;">' +
    '<button type="button" onclick="acceptCookies()" style="background:#C8722A;color:#0D0B09;border:none;padding:.6rem 1.4rem;border-radius:4px;font-family:inherit;font-weight:800;font-size:.72rem;cursor:pointer;letter-spacing:1px;text-transform:uppercase;">Aceptar</button>' +
    '<button type="button" onclick="rejectCookies()" style="background:transparent;color:rgba(242,237,230,.55);border:1px solid rgba(242,237,230,.18);padding:.6rem 1.4rem;border-radius:4px;font-family:inherit;font-weight:700;font-size:.72rem;cursor:pointer;letter-spacing:1px;text-transform:uppercase;">Rechazar</button>' +
    '</div>';
  if (document.body) document.body.appendChild(b);
})();
