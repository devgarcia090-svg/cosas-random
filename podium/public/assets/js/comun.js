// Cabecera y pie compartidos por todas las páginas.

// Llama del logotipo del local.
const LLAMA_SVG = `<svg viewBox="0 0 116 128" aria-hidden="true">
  <path transform="translate(-76 0)" fill="#e07b23"
    d="M130 8c-3 18-13 28-24 38-13 12-22 25-22 42 0 20 13 34 30 39-7-8-10-16-10-25 0-12 7-20 16-27-2 14 2 22 10 27-4-11-1-19 6-26 5 12 3 21-2 30 12-5 20-16 20-29 0-11-5-20-11-28 10 5 18 14 22 25 3 9 2 18-2 26 15-8 24-22 24-39 0-19-11-32-24-43-9-8-17-17-20-28-3 10-8 17-13 18z"/>
</svg>`;

const MARCA_HTML = `${LLAMA_SVG}<span class="marca__texto">Podium<small>Cafe &amp; Grill</small></span>`;

function pintarCabecera(paginaActual) {
  const enlaces = [
    ['/', 'Inicio'],
    ['/carta', 'Carta'],
    ['/reservar', 'Reservar'],
    ['/#contacto', 'Contacto']
  ];
  const marcada = (href) => (href.split('#')[0] === paginaActual ? " aria-current='page'" : '');

  document.querySelector('[data-cabecera]').innerHTML = `
    <div class="contenedor cabecera__fila">
      <a class="marca" href="/">${MARCA_HTML}</a>
      <button class="menu-btn" type="button" aria-expanded="false" aria-label="Abrir menú">☰</button>
      <nav class="nav">
        ${enlaces.map(([h, t]) => `<a href="${h}"${marcada(h)}>${t}</a>`).join('')}
        <a class="boton boton--pequeno" href="/reservar">Reservar mesa</a>
      </nav>
    </div>`;

  const boton = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  boton.addEventListener('click', () => {
    const abierto = nav.classList.toggle('abierto');
    boton.setAttribute('aria-expanded', String(abierto));
  });
}

function pintarPie() {
  const P = globalThis.PODIUM;
  const abierto = estaAbierto();
  const hoy = new Date().getDay();

  document.querySelector('[data-pie]').innerHTML = `
    <div class="contenedor">
      <div class="pie__rejilla">
        <div>
          <a class="marca" href="/">${MARCA_HTML}</a>
          <p class="tenue" style="margin-top:1rem">Brasa, tapeo y producto de la tierra en Puente Tocinos.</p>
          <span class="estado-abierto" data-abierto="${abierto ? 'si' : 'no'}">${abierto ? 'Abierto ahora' : 'Cerrado ahora'}</span>
        </div>
        <div>
          <h4>Horario</h4>
          <ul>
            ${P.horario.map((d) => `
              <li class="pie__horario"${d.dia === hoy ? ' style="color:var(--crema)"' : ''}>
                <span>${d.nombre}</span><span>${textoTramos(d)}</span>
              </li>`).join('')}
          </ul>
        </div>
        <div>
          <h4>Contacto</h4>
          <ul>
            <li><a href="tel:${P.telefonoE164}">${P.telefono}</a></li>
            <li>${P.direccion}</li>
            <li>${P.ciudad}</li>
            <li style="padding-top:.6rem">
              <a href="${P.instagram}" target="_blank" rel="noopener">Instagram</a> ·
              <a href="${P.facebook}" target="_blank" rel="noopener">Facebook</a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Web</h4>
          <ul>
            <li><a href="/carta">Ver la carta</a></li>
            <li><a href="/reservar">Reservar mesa</a></li>
            <li><a href="/qr">Código QR de la carta</a></li>
          </ul>
        </div>
      </div>
      <div class="pie__legal">
        <span>© ${new Date().getFullYear()} ${P.nombre}</span>
        <span>Precios con IVA incluido. Consulta alérgenos al personal.</span>
      </div>
    </div>`;
}

function iniciarPagina(pagina) {
  pintarCabecera(pagina);
  pintarPie();
}
