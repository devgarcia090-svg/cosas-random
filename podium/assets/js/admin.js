// Panel de reservas para el personal del restaurante.

const P = globalThis.PODIUM;

const seccionAcceso = document.querySelector('[data-acceso]');
const seccionPanel = document.querySelector('[data-panel]');
const botonSalir = document.querySelector('[data-salir]');
const campoDia = document.querySelector('[data-dia]');
const lista = document.querySelector('[data-lista]');
const metricas = document.querySelector('[data-metricas]');
const subtitulo = document.querySelector('[data-subtitulo]');
const errorPanel = document.querySelector('[data-panel-error]');

let rango = { desde: fechaISO(new Date()), hasta: fechaISO(new Date()) };

const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, {
    headers: { 'content-type': 'application/json' },
    ...opciones,
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || 'Algo ha fallado.');
  return datos;
}

function avisar(elemento, texto, ms = 4000) {
  elemento.textContent = texto;
  elemento.classList.toggle('oculto', !texto);
  if (texto && ms) setTimeout(() => elemento.classList.add('oculto'), ms);
}

// --- Acceso ---

document.querySelector('[data-login]').addEventListener('submit', async (e) => {
  e.preventDefault();
  const error = document.querySelector('[data-login-error]');
  try {
    await api('api/sesion', { method: 'POST', cuerpo: { password: document.getElementById('password').value } });
    entrar();
  } catch (err) {
    avisar(error, err.message, 0);
  }
});

botonSalir.addEventListener('click', async () => {
  await api('api/sesion', { method: 'DELETE' }).catch(() => {});
  location.reload();
});

function entrar() {
  seccionAcceso.classList.add('oculto');
  seccionPanel.classList.remove('oculto');
  botonSalir.classList.remove('oculto');
  campoDia.value = rango.desde;
  cargarReservas();
  cargarAjustes();
}

// --- Reservas ---

function pintarMetricas(reservas) {
  const activas = reservas.filter((r) => r.estado !== 'cancelada');
  const datos = [
    ['Reservas', activas.length],
    ['Comensales', activas.reduce((s, r) => s + r.personas, 0)],
    ['Sin confirmar', activas.filter((r) => r.estado === 'pendiente').length],
    ['Canceladas', reservas.length - activas.length]
  ];
  metricas.innerHTML = datos.map(([t, v]) => `<div class="metrica"><strong>${v}</strong><span>${t}</span></div>`).join('');
}

function tarjetaReserva(r) {
  const telefono = escapar(r.telefono);
  return `
    <article class="reserva" data-estado="${r.estado}" data-id="${r.id}">
      <div class="reserva__hora">${r.hora}<small>${fechaCorta(r.fecha)}</small></div>
      <div>
        <p class="reserva__nombre">${escapar(r.nombre)}
          <span class="etiqueta-estado" data-e="${r.estado}">${r.estado}</span>
        </p>
        <p class="reserva__datos">
          ${r.personas} ${r.personas === 1 ? 'persona' : 'personas'} ·
          <a href="tel:${telefono.replace(/\s/g, '')}">${telefono}</a>
          ${r.email ? ' · ' + escapar(r.email) : ''} · <span class="tenue">${escapar(r.codigo)}</span>
        </p>
        ${r.notas ? `<p class="reserva__nota">📝 ${escapar(r.notas)}</p>` : ''}
      </div>
      <div class="reserva__acciones">
        ${r.estado !== 'confirmada' ? '<button class="boton boton--pequeno" data-accion="confirmada" type="button">Confirmar</button>' : ''}
        ${r.estado !== 'cancelada'
          ? '<button class="boton boton--peligro boton--pequeno" data-accion="cancelada" type="button">Cancelar</button>'
          : '<button class="boton boton--fantasma boton--pequeno" data-accion="pendiente" type="button">Recuperar</button>'}
      </div>
    </article>`;
}

async function cargarReservas() {
  lista.innerHTML = '<p class="tenue">Cargando…</p>';
  try {
    const { reservas } = await api(`api/reservas?desde=${rango.desde}&hasta=${rango.hasta}`);
    pintarMetricas(reservas);

    subtitulo.textContent = rango.desde === rango.hasta
      ? fechaLarga(rango.desde)
      : `Del ${fechaCorta(rango.desde)} al ${fechaCorta(rango.hasta)}`;

    lista.innerHTML = reservas.length
      ? reservas.map(tarjetaReserva).join('')
      : '<p class="tenue" style="padding:2rem 0">No hay reservas en estas fechas.</p>';
  } catch (err) {
    lista.innerHTML = '';
    avisar(errorPanel, err.message, 0);
  }
}

lista.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-accion]');
  if (!boton) return;

  const tarjeta = boton.closest('.reserva');
  if (boton.dataset.accion === 'cancelada' && !confirm('¿Cancelar esta reserva?')) return;

  boton.disabled = true;
  try {
    await api(`api/reservas/${tarjeta.dataset.id}`, { method: 'PATCH', cuerpo: { estado: boton.dataset.accion } });
    await cargarReservas();
  } catch (err) {
    boton.disabled = false;
    avisar(errorPanel, err.message);
  }
});

campoDia.addEventListener('change', () => {
  rango = { desde: campoDia.value, hasta: campoDia.value };
  cargarReservas();
});

document.querySelector('[data-hoy]').addEventListener('click', () => {
  const hoy = fechaISO(new Date());
  campoDia.value = hoy;
  rango = { desde: hoy, hasta: hoy };
  cargarReservas();
});

document.querySelector('[data-semana]').addEventListener('click', () => {
  rango = { desde: fechaISO(new Date()), hasta: fechaISO(new Date(Date.now() + 6 * 86400000)) };
  campoDia.value = rango.desde;
  cargarReservas();
});

document.querySelector('[data-refrescar]').addEventListener('click', cargarReservas);

// --- Ajustes ---

const okAjustes = document.querySelector('[data-ajustes-ok]');
const campoPlazas = document.getElementById('plazas');
const contenedorCierres = document.querySelector('[data-cierres]');

async function cargarAjustes() {
  try {
    const datos = await api('api/ajustes');
    campoPlazas.value = datos.plazasPorTurno;

    contenedorCierres.innerHTML = datos.cierres.length
      ? datos.cierres.map((c) => `
          <div class="pie__horario" style="padding:.5rem 0;border-bottom:1px solid var(--linea)">
            <span>${fechaLarga(c.fecha)}${c.motivo ? ` — <span class="tenue">${escapar(c.motivo)}</span>` : ''}</span>
            <button class="boton boton--peligro boton--pequeno" data-quitar="${c.fecha}" type="button">Quitar</button>
          </div>`).join('')
      : '<p class="tenue">No hay días cerrados programados.</p>';
  } catch (err) {
    avisar(errorPanel, err.message);
  }
}

document.querySelector('[data-guardar-plazas]').addEventListener('click', async () => {
  try {
    await api('api/ajustes', { method: 'PUT', cuerpo: { plazasPorTurno: Number(campoPlazas.value) } });
    avisar(okAjustes, 'Aforo guardado.');
  } catch (err) {
    avisar(errorPanel, err.message);
  }
});

document.querySelector('[data-anadir-cierre]').addEventListener('click', async () => {
  const fecha = document.getElementById('cierre-fecha').value;
  if (!fecha) return avisar(errorPanel, 'Elige la fecha que quieres cerrar.');

  try {
    await api('api/ajustes', {
      method: 'POST',
      cuerpo: { fecha, motivo: document.getElementById('cierre-motivo').value }
    });
    document.getElementById('cierre-motivo').value = '';
    avisar(okAjustes, 'Día cerrado añadido.');
    cargarAjustes();
  } catch (err) {
    avisar(errorPanel, err.message);
  }
});

contenedorCierres.addEventListener('click', async (e) => {
  const boton = e.target.closest('[data-quitar]');
  if (!boton) return;
  try {
    await api(`api/ajustes?fecha=${boton.dataset.quitar}`, { method: 'DELETE' });
    cargarAjustes();
  } catch (err) {
    avisar(errorPanel, err.message);
  }
});

// --- Arranque ---

api('api/sesion')
  .then((datos) => {
    if (datos.autenticado) return entrar();
    seccionAcceso.classList.remove('oculto');
    if (!datos.configurado) {
      avisar(document.querySelector('[data-login-error]'),
        'Falta configurar la contraseña (variable ADMIN_PASSWORD en Cloudflare).', 0);
    }
  })
  .catch(() => {
    seccionAcceso.classList.remove('oculto');
    avisar(document.querySelector('[data-login-error]'),
      'El panel necesita estar desplegado en Cloudflare Pages con la base de datos conectada.', 0);
  });
