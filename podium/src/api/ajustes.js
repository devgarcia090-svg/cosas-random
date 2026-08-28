import { json, fallo, esFechaISO, exigirSesion, exigirBase, plazasPorTurno, limpiar } from '../servidor.js';

/** Aforo por turno y días de cierre puntual (vacaciones, festivos, privados). */
export async function onRequestGet({ request, env }) {
  const sinBase = exigirBase(env);
  if (sinBase) return sinBase;

  const sinSesion = await exigirSesion(request, env);
  if (sinSesion) return sinSesion;

  const { results } = await env.DB
    .prepare('SELECT fecha, motivo FROM cierres WHERE fecha >= date(?) ORDER BY fecha')
    .bind(new Date().toISOString().slice(0, 10))
    .all();

  return json({ plazasPorTurno: await plazasPorTurno(env), cierres: results || [] });
}

/** Guardar el aforo por turno. */
export async function onRequestPut({ request, env }) {
  const sinBase = exigirBase(env);
  if (sinBase) return sinBase;

  const sinSesion = await exigirSesion(request, env);
  if (sinSesion) return sinSesion;

  let datos;
  try {
    datos = await request.json();
  } catch {
    return fallo('Petición no válida.');
  }

  const plazas = Number(datos.plazasPorTurno);
  if (!Number.isInteger(plazas) || plazas < 1 || plazas > 999) {
    return fallo('El aforo por turno debe ser un número entre 1 y 999.');
  }

  await env.DB
    .prepare("INSERT INTO ajustes (clave, valor) VALUES ('plazas_por_turno', ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor")
    .bind(String(plazas))
    .run();

  return json({ ok: true, plazasPorTurno: plazas });
}

/** Añadir un día de cierre. */
export async function onRequestPost({ request, env }) {
  const sinBase = exigirBase(env);
  if (sinBase) return sinBase;

  const sinSesion = await exigirSesion(request, env);
  if (sinSesion) return sinSesion;

  let datos;
  try {
    datos = await request.json();
  } catch {
    return fallo('Petición no válida.');
  }

  if (!esFechaISO(datos.fecha)) return fallo('Indica una fecha válida.');

  await env.DB
    .prepare('INSERT INTO cierres (fecha, motivo) VALUES (?, ?) ON CONFLICT(fecha) DO UPDATE SET motivo = excluded.motivo')
    .bind(datos.fecha, limpiar(datos.motivo, 120) || null)
    .run();

  return json({ ok: true });
}

/** Quitar un día de cierre. */
export async function onRequestDelete({ request, env }) {
  const sinBase = exigirBase(env);
  if (sinBase) return sinBase;

  const sinSesion = await exigirSesion(request, env);
  if (sinSesion) return sinSesion;

  const fecha = new URL(request.url).searchParams.get('fecha');
  if (!esFechaISO(fecha)) return fallo('Indica una fecha válida.');

  await env.DB.prepare('DELETE FROM cierres WHERE fecha = ?').bind(fecha).run();
  return json({ ok: true });
}
