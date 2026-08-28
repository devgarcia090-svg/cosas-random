// Utilidades comunes de la API de reservas (Cloudflare Pages Functions).
// Importa la misma configuración de horarios que usa la web, para que el
// servidor y el navegador nunca se contradigan.

import '../public/assets/js/config.js';
import '../public/assets/js/horario.js';

export const CONFIG = globalThis.PODIUM;
export const REGLAS = CONFIG.reservas;

export const json = (datos, estado = 200, cabeceras = {}) =>
  new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...cabeceras }
  });

export const fallo = (mensaje, estado = 400) => json({ error: mensaje }, estado);

/**
 * Fecha con la hora de pared de Madrid. Los Workers corren en UTC, así que
 * sin esto el servidor creería que en España es dos horas antes.
 */
export function ahoraLocal() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(new Date());

  const v = (tipo) => Number(partes.find((p) => p.type === tipo).value);
  return new Date(v('year'), v('month') - 1, v('day'), v('hour') % 24, v('minute'), v('second'));
}

export const esFechaISO = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** Días de antelación entre hoy y una fecha ISO. */
export function diasDesdeHoy(iso) {
  const hoy = ahoraLocal();
  const dia = globalThis.aFecha(iso);
  return Math.round((dia - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86400000);
}

// ---------- Sesión de administración ----------

const codificador = new TextEncoder();

const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const secretoDe = (env) => env.SESSION_SECRET || env.ADMIN_PASSWORD;

const claveHmac = (secreto) =>
  crypto.subtle.importKey('raw', codificador.encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

async function firmar(secreto, carga) {
  const firma = await crypto.subtle.sign('HMAC', await claveHmac(secreto), codificador.encode(carga));
  return b64url(firma);
}

/** Comparación en tiempo constante para no filtrar la contraseña por el reloj. */
export function iguales(a, b) {
  const x = codificador.encode(String(a));
  const y = codificador.encode(String(b));
  let diferencia = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diferencia |= (x[i % x.length] || 0) ^ (y[i % y.length] || 0);
  }
  return diferencia === 0;
}

export const NOMBRE_COOKIE = 'podium_sesion';
const DURACION_SESION_MS = 12 * 60 * 60 * 1000;

export async function crearCookieSesion(env) {
  const caduca = Date.now() + DURACION_SESION_MS;
  const valor = `${caduca}.${await firmar(secretoDe(env), String(caduca))}`;
  const maxAge = Math.floor(DURACION_SESION_MS / 1000);
  return `${NOMBRE_COOKIE}=${valor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export const cookieBorrada = () =>
  `${NOMBRE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export async function haySesion(request, env) {
  if (!secretoDe(env)) return false;

  const cookies = request.headers.get('cookie') || '';
  const encontrada = cookies.split(';').map((c) => c.trim()).find((c) => c.startsWith(NOMBRE_COOKIE + '='));
  if (!encontrada) return false;

  const [caduca, firma] = decodeURIComponent(encontrada.slice(NOMBRE_COOKIE.length + 1)).split('.');
  if (!caduca || !firma || Number(caduca) < Date.now()) return false;

  return iguales(firma, await firmar(secretoDe(env), caduca));
}

/** Devuelve null si hay sesión, o la respuesta de error si no la hay. */
export async function exigirSesion(request, env) {
  if (!secretoDe(env)) {
    return fallo('El panel no está configurado: falta la variable ADMIN_PASSWORD.', 503);
  }
  return (await haySesion(request, env)) ? null : fallo('Necesitas iniciar sesión.', 401);
}

// ---------- Base de datos ----------

export function exigirBase(env) {
  if (!env.DB) {
    return fallo('La base de datos de reservas no está conectada (falta el binding DB).', 503);
  }
  return null;
}

export async function plazasPorTurno(env) {
  const fila = await env.DB.prepare("SELECT valor FROM ajustes WHERE clave = 'plazas_por_turno'").first();
  return Number(fila?.valor) || REGLAS.plazasPorTurnoPorDefecto;
}

export async function cierreDe(env, fecha) {
  return env.DB.prepare('SELECT fecha, motivo FROM cierres WHERE fecha = ?').bind(fecha).first();
}

/** Plazas ya ocupadas por turno en una fecha. */
export async function ocupacionDe(env, fecha) {
  const { results } = await env.DB
    .prepare("SELECT hora, SUM(personas) AS total FROM reservas WHERE fecha = ? AND estado <> 'cancelada' GROUP BY hora")
    .bind(fecha)
    .all();

  return Object.fromEntries((results || []).map((r) => [r.hora, Number(r.total)]));
}

/**
 * Turnos de una fecha con las plazas que quedan libres en cada uno.
 * Es la única fuente de verdad: la usan tanto el listado como el alta.
 */
export async function disponibilidadDe(env, fecha) {
  const cierre = await cierreDe(env, fecha);
  if (cierre) return { cerrado: true, motivo: cierre.motivo || 'Cerrado ese día', turnos: [] };

  const turnos = globalThis.turnosDeFecha(fecha, ahoraLocal());
  if (!turnos.length) {
    const dia = globalThis.diaDeHorario(globalThis.aFecha(fecha).getDay());
    const motivo = dia?.cerrado
      ? `Los ${dia.nombre.toLowerCase()} cerramos.`
      : 'Ya no quedan turnos para ese día. Prueba con el siguiente.';
    return { cerrado: true, motivo, turnos: [] };
  }

  const plazas = await plazasPorTurno(env);
  const ocupacion = await ocupacionDe(env, fecha);

  return {
    cerrado: false,
    turnos: turnos.map((hora) => ({ hora, libres: Math.max(0, plazas - (ocupacion[hora] || 0)) }))
  };
}

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin caracteres que se confundan al dictar

export function codigoReserva() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return [...bytes].map((b) => ALFABETO[b % ALFABETO.length]).join('');
}

export const limpiar = (v, max) => String(v ?? '').trim().slice(0, max);
