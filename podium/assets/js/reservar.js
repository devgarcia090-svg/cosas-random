// Formulario público de reservas.

iniciarPagina('reservar.html');

const P = globalThis.PODIUM;
const R = P.reservas;

const form = document.getElementById('formulario');
const campoFecha = document.getElementById('fecha');
const campoPersonas = document.getElementById('personas');
const contenedorTurnos = document.querySelector('[data-turnos]');
const mensajeTurnos = document.querySelector('[data-turnos-mensaje]');
const cajaError = document.querySelector('[data-error]');
const botonEnviar = document.querySelector('[data-enviar]');
const cajaExito = document.querySelector('[data-exito]');

// Sin base de datos conectada, la reserva se manda por WhatsApp.
let modoWhatsapp = false;
let horaElegida = null;

const enlaceTelefono = document.querySelector('[data-telefono]');
enlaceTelefono.href = `tel:${P.telefonoE164}`;
enlaceTelefono.textContent = P.telefono;

// --- Fecha y comensales ---

const hoy = new Date();
const maximo = new Date(hoy.getTime() + R.diasVistaMaximos * 86400000);
campoFecha.min = fechaISO(hoy);
campoFecha.max = fechaISO(maximo);

campoPersonas.innerHTML = Array.from({ length: R.maxComensales }, (_, i) => i + 1)
  .map((n) => `<option value="${n}"${n === 2 ? ' selected' : ''}>${n} ${n === 1 ? 'persona' : 'personas'}</option>`)
  .join('');

// Primer día disponible: hoy si aún quedan turnos, si no el siguiente que abra.
function primerDiaConTurnos() {
  for (let i = 0; i <= R.diasVistaMaximos; i++) {
    const iso = fechaISO(new Date(hoy.getTime() + i * 86400000));
    if (turnosDeFecha(iso).length) return iso;
  }
  return fechaISO(hoy);
}
campoFecha.value = primerDiaConTurnos();

// --- Errores ---

function mostrarError(texto) {
  cajaError.textContent = texto;
  cajaError.classList.toggle('oculto', !texto);
  if (texto) cajaError.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

// --- Turnos ---

function pintarTurnos(turnos, motivo) {
  horaElegida = null;
  contenedorTurnos.innerHTML = '';

  if (!turnos.length) {
    mensajeTurnos.textContent = motivo || 'Ese día no abrimos. Prueba con otra fecha.';
    return;
  }

  const personas = Number(campoPersonas.value);
  contenedorTurnos.innerHTML = turnos
    .map((t) => {
      const cabe = t.libres === null || t.libres >= personas;
      return `<button type="button" class="turno" data-hora="${t.hora}" aria-pressed="false"
                ${cabe ? '' : 'disabled title="Completo para ese número de personas"'}>${t.hora}</button>`;
    })
    .join('');

  const libres = contenedorTurnos.querySelectorAll('.turno:not(:disabled)').length;
  mensajeTurnos.textContent = libres
    ? 'Elige la hora que mejor te venga.'
    : 'No quedan turnos libres para ese día y número de personas.';
}

contenedorTurnos.addEventListener('click', (e) => {
  const boton = e.target.closest('.turno');
  if (!boton) return;

  horaElegida = boton.dataset.hora;
  for (const t of contenedorTurnos.querySelectorAll('.turno')) {
    t.setAttribute('aria-pressed', String(t === boton));
  }
  mostrarError('');
});

async function cargarTurnos({ avanzarSiVacio = false } = {}) {
  const fecha = campoFecha.value;
  if (!fecha) return;

  mensajeTurnos.textContent = 'Buscando huecos…';
  contenedorTurnos.innerHTML = '';

  try {
    const respuesta = await fetch(`api/disponibilidad?fecha=${encodeURIComponent(fecha)}`);
    if (!respuesta.ok) throw new Error('sin servicio');

    const datos = await respuesta.json();
    modoWhatsapp = false;
    botonEnviar.textContent = 'Confirmar reserva';

    // Al abrir la página no dejamos al cliente en un día sin huecos:
    // saltamos al siguiente que tenga.
    if (avanzarSiVacio && !datos.turnos.length) {
      const siguiente = fechaISO(new Date(aFecha(fecha).getTime() + 86400000));
      if (siguiente <= campoFecha.max) {
        campoFecha.value = siguiente;
        return cargarTurnos({ avanzarSiVacio: true });
      }
    }
    pintarTurnos(datos.turnos, datos.motivo);
  } catch {
    // La API todavía no está disponible: seguimos ofreciendo horas según el
    // horario del local y la reserva se envía por WhatsApp.
    modoWhatsapp = true;
    botonEnviar.textContent = 'Enviar reserva por WhatsApp';
    pintarTurnos(turnosDeFecha(fecha).map((hora) => ({ hora, libres: null })));
  }
}

campoFecha.addEventListener('change', () => cargarTurnos());
campoPersonas.addEventListener('change', () => cargarTurnos());
cargarTurnos({ avanzarSiVacio: true });

// --- Envío ---

function datosDelFormulario() {
  return {
    fecha: campoFecha.value,
    hora: horaElegida,
    personas: Number(campoPersonas.value),
    nombre: document.getElementById('nombre').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    email: document.getElementById('email').value.trim(),
    notas: document.getElementById('notas').value.trim()
  };
}

function enlaceCalendario({ fecha, hora, personas }) {
  const [y, m, d] = fecha.split('-').map(Number);
  const [hh, mm] = hora.split(':').map(Number);
  const inicio = new Date(y, m - 1, d, hh, mm);
  const fin = new Date(inicio.getTime() + 2 * 3600000);
  const utc = (f) => f.toISOString().replace(/[-:]|\.\d{3}/g, '');

  const parametros = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Mesa en ${P.nombre} (${personas} pers.)`,
    dates: `${utc(inicio)}/${utc(fin)}`,
    location: `${P.direccion}, ${P.ciudad}`
  });
  return 'https://calendar.google.com/calendar/render?' + parametros;
}

function mostrarExito(datos, codigo) {
  form.classList.add('oculto');
  cajaExito.classList.remove('oculto');
  cajaExito.innerHTML = `
    <div class="exito__marca">✓</div>
    <h2>Reserva recibida</h2>
    <p class="tenue">Te esperamos, ${datos.nombre.split(' ')[0]}. Si necesitamos cambiar algo, te llamamos.</p>
    <div class="exito__resumen">
      <div><b>Día</b><span>${fechaLarga(datos.fecha)}</span></div>
      <div><b>Hora</b><span>${datos.hora}</span></div>
      <div><b>Comensales</b><span>${datos.personas}</span></div>
      ${codigo ? `<div><b>Localizador</b><span>${codigo}</span></div>` : ''}
    </div>
    <p>
      <a class="boton" href="${enlaceCalendario(datos)}" target="_blank" rel="noopener">Añadir al calendario</a>
      <a class="boton boton--fantasma" href="carta.html">Ver la carta</a>
    </p>`;
  cajaExito.scrollIntoView({ block: 'center', behavior: 'smooth' });
}

function enviarPorWhatsapp(datos) {
  const texto = [
    `Hola, quiero reservar mesa en ${P.nombre}.`,
    ``,
    `Día: ${fechaLarga(datos.fecha)}`,
    `Hora: ${datos.hora}`,
    `Comensales: ${datos.personas}`,
    `Nombre: ${datos.nombre}`,
    `Teléfono: ${datos.telefono}`,
    datos.notas ? `Notas: ${datos.notas}` : ''
  ].filter(Boolean).join('\n');

  window.open(`https://wa.me/${P.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  mostrarError('');

  const datos = datosDelFormulario();

  if (!datos.fecha) return mostrarError('Elige un día.');
  if (!datos.hora) return mostrarError('Elige una hora.');
  if (datos.nombre.length < 2) return mostrarError('Escribe tu nombre.');
  if (datos.telefono.replace(/\D/g, '').length < 6) return mostrarError('Escribe un teléfono de contacto válido.');

  if (modoWhatsapp) {
    enviarPorWhatsapp(datos);
    mostrarExito(datos, null);
    return;
  }

  botonEnviar.disabled = true;
  botonEnviar.textContent = 'Enviando…';

  try {
    const respuesta = await fetch('api/reservas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const cuerpo = await respuesta.json();

    if (!respuesta.ok) {
      mostrarError(cuerpo.error || 'No hemos podido guardar la reserva.');
      await cargarTurnos();
      return;
    }
    mostrarExito(datos, cuerpo.codigo);
  } catch {
    mostrarError('No hemos podido conectar. Inténtalo de nuevo o llámanos al ' + P.telefono + '.');
  } finally {
    botonEnviar.disabled = false;
    botonEnviar.textContent = modoWhatsapp ? 'Enviar reserva por WhatsApp' : 'Confirmar reserva';
  }
});
