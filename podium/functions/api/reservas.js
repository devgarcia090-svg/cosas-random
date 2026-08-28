import {
  json, fallo, REGLAS, esFechaISO, diasDesdeHoy, exigirSesion, exigirBase,
  disponibilidadDe, codigoReserva, limpiar
} from '../../lib/servidor.js';

const TELEFONO = /^[+\d][\d\s.\-()]{6,19}$/;
const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

/** Alta de reserva desde la web pública. */
export async function onRequestPost({ request, env }) {
  const sinBase = exigirBase(env);
  if (sinBase) return sinBase;

  let datos;
  try {
    datos = await request.json();
  } catch {
    return fallo('No hemos podido leer los datos del formulario.');
  }

  const nombre = limpiar(datos.nombre, 80);
  const telefono = limpiar(datos.telefono, 20);
  const email = limpiar(datos.email, 120);
  const notas = limpiar(datos.notas, 300);
  const fecha = limpiar(datos.fecha, 10);
  const hora = limpiar(datos.hora, 5);
  const personas = Number(datos.personas);

  if (nombre.length < 2) return fallo('Indícanos tu nombre.');
  if (!TELEFONO.test(telefono)) return fallo('El teléfono no parece válido.');
  if (email && !EMAIL.test(email)) return fallo('El correo no parece válido.');
  if (!Number.isInteger(personas) || personas < 1 || personas > REGLAS.maxComensales) {
    return fallo(`Para más de ${REGLAS.maxComensales} personas, llámanos y lo organizamos.`);
  }
  if (!esFechaISO(fecha)) return fallo('La fecha no es válida.');

  const dias = diasDesdeHoy(fecha);
  if (dias < 0) return fallo('Esa fecha ya ha pasado.');
  if (dias > REGLAS.diasVistaMaximos) {
    return fallo(`Solo aceptamos reservas con ${REGLAS.diasVistaMaximos} días de antelación como máximo.`);
  }

  const disponibilidad = await disponibilidadDe(env, fecha);
  if (disponibilidad.cerrado) return fallo(disponibilidad.motivo);

  const turno = disponibilidad.turnos.find((t) => t.hora === hora);
  if (!turno) return fallo('Ese turno ya no está disponible. Elige otra hora.');
  if (turno.libres < personas) {
    return fallo(`A las ${hora} solo nos quedan ${turno.libres} plazas. Prueba con otra hora.`);
  }

  const codigo = codigoReserva();
  await env.DB
    .prepare(`INSERT INTO reservas (id, fecha, hora, personas, nombre, telefono, email, notas, estado, codigo, creada_en)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?, ?)`)
    .bind(crypto.randomUUID(), fecha, hora, personas, nombre, telefono, email || null, notas || null, codigo, new Date().toISOString())
    .run();

  return json({ ok: true, codigo, fecha, hora, personas, nombre }, 201);
}

/** Listado para el panel: por defecto, de hoy en adelante. */
export async function onRequestGet({ request, env }) {
  const sinBase = exigirBase(env);
  if (sinBase) return sinBase;

  const sinSesion = await exigirSesion(request, env);
  if (sinSesion) return sinSesion;

  const url = new URL(request.url);
  const desde = url.searchParams.get('desde');
  const hasta = url.searchParams.get('hasta');

  if (desde && !esFechaISO(desde)) return fallo('Fecha "desde" no válida.');
  if (hasta && !esFechaISO(hasta)) return fallo('Fecha "hasta" no válida.');

  const condiciones = [];
  const valores = [];
  if (desde) { condiciones.push('fecha >= ?'); valores.push(desde); }
  if (hasta) { condiciones.push('fecha <= ?'); valores.push(hasta); }

  const donde = condiciones.length ? 'WHERE ' + condiciones.join(' AND ') : '';
  const { results } = await env.DB
    .prepare(`SELECT * FROM reservas ${donde} ORDER BY fecha, hora, creada_en LIMIT 500`)
    .bind(...valores)
    .all();

  return json({ reservas: results || [] });
}
