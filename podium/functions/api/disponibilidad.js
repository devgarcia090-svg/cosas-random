import { json, fallo, esFechaISO, diasDesdeHoy, REGLAS, exigirBase, disponibilidadDe } from '../../lib/servidor.js';

/** Turnos libres de una fecha. Público: lo consulta el formulario de reserva. */
export async function onRequestGet({ request, env }) {
  const sinBase = exigirBase(env);
  if (sinBase) return sinBase;

  const fecha = new URL(request.url).searchParams.get('fecha');
  if (!esFechaISO(fecha)) return fallo('Indica una fecha válida.');

  const dias = diasDesdeHoy(fecha);
  if (dias < 0) return json({ cerrado: true, motivo: 'Esa fecha ya ha pasado.', turnos: [] });
  if (dias > REGLAS.diasVistaMaximos) {
    return json({
      cerrado: true,
      motivo: `Solo aceptamos reservas con ${REGLAS.diasVistaMaximos} días de antelación como máximo.`,
      turnos: []
    });
  }

  return json(await disponibilidadDe(env, fecha));
}
