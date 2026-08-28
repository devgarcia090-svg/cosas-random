import { json, fallo, iguales, haySesion, crearCookieSesion, cookieBorrada } from '../../lib/servidor.js';

/** ¿Sigue viva la sesión del panel? */
export async function onRequestGet({ request, env }) {
  return json({
    autenticado: await haySesion(request, env),
    configurado: Boolean(env.ADMIN_PASSWORD)
  });
}

/** Entrar al panel. */
export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) {
    return fallo('El panel no está configurado: falta la variable ADMIN_PASSWORD.', 503);
  }

  let datos;
  try {
    datos = await request.json();
  } catch {
    return fallo('Petición no válida.');
  }

  if (!iguales(datos.password ?? '', env.ADMIN_PASSWORD)) {
    // Pequeña espera para que probar contraseñas a lo bruto salga caro.
    await new Promise((r) => setTimeout(r, 600));
    return fallo('Contraseña incorrecta.', 401);
  }

  return json({ ok: true }, 200, { 'set-cookie': await crearCookieSesion(env) });
}

/** Salir del panel. */
export async function onRequestDelete() {
  return json({ ok: true }, 200, { 'set-cookie': cookieBorrada() });
}
