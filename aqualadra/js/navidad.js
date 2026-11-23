/* =====================================================================
   AquaLadra — capa de Navidad
   Guirnalda bajo el nav, adornos en las esquinas y nieve cayendo.

   Vive en un archivo aparte a propósito: cuando pase la Navidad se borra
   este fichero y se quita su <script> de index.html, y no hay que tocar
   nada más. Mientras tanto se apaga sola al pasar FIN, así que si nadie
   se acuerda tampoco se queda la web con luces en marzo.

   Para matarla antes de tiempo: APAGADA = true.
   ===================================================================== */
(function () {
  var APAGADA = false;
  var FIN = new Date("2027-01-07T23:59:59");
  if (APAGADA || new Date() > FIN) return;

  var quieto = window.matchMedia &&
               matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Los colores de siempre de la Navidad (rojo y verde) más los de la
     casa, para que la guirnalda no parezca pegada de otra web.        */
  var COLORES = ["#C1352B", "#1E7A4D", "#DFAE68", "#43B4D1", "#F2EDE6"];

  /* Las capas van por DEBAJO de todo lo fijo del sitio: el nav está en
     60, la barra del móvil en 58 y el menú lateral en 55. Si la
     decoración subiera por encima taparía el logo y el botón del menú,
     que es el fallo clásico de esto.                                  */
  var CSS = [
    /* ── Guirnalda ─────────────────────────────────────────────── */
    ".nv-g{position:fixed;left:0;right:0;top:var(--nav-h,74px);height:52px;",
      "z-index:39;pointer-events:none}",
    ".nv-g .cable{position:absolute;inset:0 0 auto 0;width:100%;height:30px;overflow:visible}",
    /* Bombilla: óvalo con el culo más ancho, brillo arriba a la
       izquierda y casquillo dorado. Gira desde el casquillo y no desde
       el centro, para que parezca colgada del cable.                  */
    ".nv-luz{position:absolute;top:var(--y);left:var(--x);width:13px;height:19px;",
      "margin-left:-6.5px;border-radius:50% 50% 50% 50% / 58% 58% 42% 42%;",
      "background:radial-gradient(circle at 34% 28%,rgba(255,255,255,.8),transparent 46%),var(--c);",
      "box-shadow:0 0 12px 3px var(--c);transform:rotate(var(--g));transform-origin:50% -5px}",
    ".nv-luz::before{content:'';position:absolute;left:3px;top:-5px;width:7px;height:6px;",
      "border-radius:2px;background:linear-gradient(#E9C46A,#A0761C)}",
    quieto ? "" :
      ".nv-luz{animation:nvLuz var(--dur) ease-in-out var(--r) infinite alternate}",
    /* El parpadeo va en la opacidad Y en el halo: solo con opacidad
       parece un interruptor, con el halo parece una bombilla.         */
    "@keyframes nvLuz{from{opacity:1;box-shadow:0 0 15px 4px var(--c)}",
      "to{opacity:.42;box-shadow:0 0 3px 0 var(--c)}}",

    /* ── Esquinas ──────────────────────────────────────────────── */
    /* Aquí NO hay adornos arriba, y es una diferencia con la web de la
       que viene esto. Su nav dejaba hueco en las esquinas superiores; el
       de AquaLadra es una barra sólida de lado a lado, así que un adorno
       ahí se esconde detrás y solo asoma un trozo cortado que parece un
       fallo. Arriba ya decora la guirnalda, que para eso cuelga.

       Abajo sí hay sitio libre, y además el follaje está dibujado justo
       para la esquina inferior izquierda: va tal cual, sin voltear, que
       es la forma de que no se vea ningún borde recto. El muñeco solo
       admite el volteo horizontal; en vertical quedaría cabeza abajo. */
    ".nv-esq{position:fixed;z-index:40;pointer-events:none;user-select:none;",
      "width:clamp(70px,9vw,165px);height:auto}",
    ".nv-ii{bottom:0;left:0}",
    ".nv-id{bottom:0;right:0;transform:scaleX(-1)}",
    /* En el móvil se quitan: abajo está la barra fija de Reservar /
       Cómo llegar / WhatsApp y no queda sitio libre.                  */
    "@media (max-width:700px){.nv-esq{display:none}}",

    /* ── Nieve ─────────────────────────────────────────────────── */
    ".nv-capa{position:fixed;inset:0;pointer-events:none;z-index:38;overflow:hidden}",
    ".nv-c{position:absolute;top:-30px;will-change:transform,opacity;opacity:0}",
    quieto ? ".nv-c{display:none}" : ".nv-c{animation:nvCae linear infinite}",
    "@keyframes nvCae{0%{transform:translate(0,0) rotate(0deg);opacity:0}",
      "8%{opacity:var(--op)}92%{opacity:var(--op)}",
      "100%{transform:translate(var(--deriva),104vh) rotate(260deg);opacity:0}}"
  ].join("");

  /* Copo dibujado: tres brazos girados 60° con sus ramitas. El borde va
     en tinta y no en blanco, porque esta web es de fondo claro y un copo
     blanco sobre crema no se ve.                                      */
  function copo(px) {
    var r = "";
    for (var a = 0; a < 180; a += 60) {
      r += '<g transform="rotate(' + a + ' 12 12)">' +
             '<line x1="12" y1="2" x2="12" y2="22"/>' +
             '<line x1="12" y1="6"  x2="8.5"  y2="9"/>' +
             '<line x1="12" y1="6"  x2="15.5" y2="9"/>' +
             '<line x1="12" y1="18" x2="8.5"  y2="15"/>' +
             '<line x1="12" y1="18" x2="15.5" y2="15"/></g>';
    }
    return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 24 24" fill="none" ' +
           'stroke="#6FCBE1" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">' +
           r + '</svg>';
  }

  function pintaGuirnalda(g) {
    var w = g.clientWidth || window.innerWidth;
    var paso = window.innerWidth < 900 ? 54 : 72;
    var curvas = Math.max(4, Math.round(w / paso));
    var ancho = w / curvas;
    var d = "M0 3";
    g.innerHTML = "";
    for (var i = 0; i < curvas; i++) {
      var x0 = i * ancho;
      /* Cada tramo baja y vuelve a subir: el cable no es una recta. */
      d += "Q" + (x0 + ancho / 2).toFixed(1) + " 27 " + (x0 + ancho).toFixed(1) + " 3";
      var b = document.createElement("span");
      b.className = "nv-luz";
      /* Cada bombilla con su retardo, su duración y su inclinación: si
         parpadean todas a la vez parece un cartel de neón averiado.   */
      b.style.cssText =
        "--x:" + (x0 + ancho / 2).toFixed(1) + "px;--y:19px;" +
        "--c:" + COLORES[i % COLORES.length] + ";" +
        "--r:" + (-(Math.random() * 2.2)).toFixed(2) + "s;" +
        "--dur:" + (1.1 + Math.random() * 1.1).toFixed(2) + "s;" +
        "--g:" + (Math.random() * 18 - 9).toFixed(0) + "deg";
      g.appendChild(b);
    }
    g.insertAdjacentHTML("afterbegin",
      '<svg class="cable" viewBox="0 0 ' + w + ' 30" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + '" fill="none" stroke="#1E5C3A" stroke-width="2.5" stroke-linecap="round"/></svg>');
  }

  function arranca() {
    var e = document.createElement("style");
    e.textContent = CSS;
    document.head.appendChild(e);

    /* ── Guirnalda ── */
    var g = document.createElement("div");
    g.className = "nv-g";
    g.setAttribute("aria-hidden", "true");
    document.body.appendChild(g);
    pintaGuirnalda(g);
    /* Al cambiar el ancho hay que recalcular las curvas, o el cable se
       estira y las bombillas dejan de caer en sus puntos bajos.       */
    var t;
    window.addEventListener("resize", function () {
      clearTimeout(t);
      t = setTimeout(function () { pintaGuirnalda(g); }, 200);
    });

    /* ── Esquinas ── (clase de posición, archivo) */
    [["nv-ii", "corner-13"], ["nv-id", "decoration-25"]]
      .forEach(function (par) {
        var img = document.createElement("img");
        img.className = "nv-esq " + par[0];
        img.src = "img/navidad/" + par[1] + ".svg";
        img.alt = "";
        img.setAttribute("aria-hidden", "true");
        document.body.appendChild(img);
      });

    /* ── Nieve ── */
    if (quieto) return;
    var capa = document.createElement("div");
    capa.className = "nv-capa";
    capa.setAttribute("aria-hidden", "true");
    var cuantos = window.innerWidth < 700 ? 18 : 34;
    for (var i = 0; i < cuantos; i++) {
      var c = document.createElement("div");
      c.className = "nv-c";
      c.innerHTML = copo((9 + Math.random() * 11).toFixed(0));   /* 9–20 px */
      c.style.left = (Math.random() * 100).toFixed(1) + "%";
      c.style.setProperty("--deriva", (Math.random() * 140 - 70).toFixed(0) + "px");
      c.style.setProperty("--op", (0.45 + Math.random() * 0.45).toFixed(2));
      c.style.animationDuration = (10 + Math.random() * 12).toFixed(1) + "s";
      /* Retardo negativo: al cargar ya hay copos a media caída, en vez
         de arrancar todos juntos desde arriba.                        */
      c.style.animationDelay = (-Math.random() * 22).toFixed(1) + "s";
      capa.appendChild(c);
    }
    document.body.appendChild(capa);
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", arranca);
  else arranca();
})();
