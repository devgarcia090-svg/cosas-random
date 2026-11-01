import { appleConfigurado, googleConfigurado } from './config';
import type { Cliente } from './db';
import { avisarApple } from './apple';
import { actualizarGoogle } from './google';

/** Lleva el cambio de sellos a las Wallets. Un fallo aquí no deshace el sello:
 *  queda en el log y la tarjeta se pone al día en el siguiente cambio. */
export async function avisarCambio(c: Cliente): Promise<void> {
  const tareas: Promise<void>[] = [];
  if (appleConfigurado()) tareas.push(avisarApple(c.id));
  if (googleConfigurado()) tareas.push(actualizarGoogle(c));
  for (const r of await Promise.allSettled(tareas)) {
    if (r.status === 'rejected') console.error('[wallet]', r.reason);
  }
}
