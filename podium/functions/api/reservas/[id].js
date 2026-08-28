import { json, fallo, exigirSesion, exigirBase, limpiar } from '../../../lib/servidor.js';

const ESTADOS = ['pendiente', 'confirmada', 'cancelada'];

/** Cambiar el estado de una reserva (confirmar o cancelar) desde el panel. */
export async function onRequestPatch({ request, env, params }) {
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

  const estado = limpiar(datos.estado, 20);
  if (!ESTADOS.includes(estado)) return fallo('Estado no válido.');

  const resultado = await env.DB
    .prepare('UPDATE reservas SET estado = ? WHERE id = ?')
    .bind(estado, params.id)
    .run();

  if (!resultado.meta.changes) return fallo('No existe esa reserva.', 404);
  return json({ ok: true, estado });
}
