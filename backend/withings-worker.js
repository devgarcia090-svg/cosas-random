/*
 * withings-worker.js — Cloudflare Worker que hace de backend para vincular
 * NutriTrack con Withings.
 *
 * Por qué hace falta: la app es estática (sin servidor), pero la API de
 * Withings usa OAuth2 con un client_secret que NO puede vivir en el navegador.
 * Este Worker lo guarda de forma segura y actúa de intermediario.
 *
 * Secrets / variables que hay que configurar (ver WITHINGS_SETUP.md):
 *   WITHINGS_CLIENT_ID      (var)     — Client ID de tu app en Withings
 *   WITHINGS_CLIENT_SECRET  (secret)  — Client Secret de tu app en Withings
 *   APP_URL                 (var)     — URL de tu app (GitHub Pages) para volver tras el login
 *
 * El redirect_uri que debes registrar en Withings es:  <URL-del-worker>/callback
 *
 * Endpoints:
 *   GET  /start     → redirige al login/consentimiento de Withings
 *   GET  /callback  → recibe el código, obtiene tokens, vuelve a la app con el refresh_token
 *   POST /measures  → { refresh_token } → devuelve { measurements, refresh_token }
 *
 * Nota de seguridad: los refresh tokens de Withings ROTAN (cambian en cada uso),
 * por eso /measures devuelve el nuevo refresh_token para que la app lo guarde.
 */

const AUTHORIZE_URL = 'https://account.withings.com/oauth2_user/authorize2';
const TOKEN_URL = 'https://wbsapi.withings.net/v2/oauth2';
const MEASURE_URL = 'https://wbsapi.withings.net/measure';
const SCOPE = 'user.metrics';

// Tipos de medición de Withings → campos de NutriTrack
const MEASTYPES = [1, 5, 6, 8, 76, 77, 88];

function cors(env) {
  return {
    'Access-Control-Allow-Origin': env.APP_URL || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(env) },
  });
}

function redirectUri(request) {
  const u = new URL(request.url);
  return `${u.origin}/callback`;
}

// --- OAuth: iniciar login ---
function handleStart(request, env) {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', env.WITHINGS_CLIENT_ID);
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('redirect_uri', redirectUri(request));
  url.searchParams.set('state', crypto.randomUUID());
  return Response.redirect(url.toString(), 302);
}

// --- OAuth: intercambiar código por tokens ---
async function exchangeCode(code, request, env) {
  const params = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'authorization_code',
    client_id: env.WITHINGS_CLIENT_ID,
    client_secret: env.WITHINGS_CLIENT_SECRET,
    code,
    redirect_uri: redirectUri(request),
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json();
  // Withings envuelve todo en { status, body }; status 0 = OK
  if (data.status !== 0) throw new Error(`Withings token error: status ${data.status}`);
  return data.body; // { access_token, refresh_token, expires_in, userid, ... }
}

async function handleCallback(request, env) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const back = new URL(env.APP_URL || '/');
  if (error || !code) {
    back.hash = `withings_error=${encodeURIComponent(error || 'no_code')}`;
    return Response.redirect(back.toString(), 302);
  }
  try {
    const tokens = await exchangeCode(code, request, env);
    // Volvemos a la app con el refresh_token en el fragmento (#) — no se envía
    // a ningún servidor, se queda en el navegador del usuario.
    back.hash = `withings_refresh=${encodeURIComponent(tokens.refresh_token)}`;
    return Response.redirect(back.toString(), 302);
  } catch (e) {
    back.hash = `withings_error=${encodeURIComponent(e.message)}`;
    return Response.redirect(back.toString(), 302);
  }
}

// --- Refrescar el access token usando el refresh token ---
async function refreshTokens(refreshToken, env) {
  const params = new URLSearchParams({
    action: 'requesttoken',
    grant_type: 'refresh_token',
    client_id: env.WITHINGS_CLIENT_ID,
    client_secret: env.WITHINGS_CLIENT_SECRET,
    refresh_token: refreshToken,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });
  const data = await res.json();
  if (data.status !== 0) throw new Error(`Withings refresh error: status ${data.status}`);
  return data.body; // access_token + NUEVO refresh_token (rotan)
}

// --- Descargar mediciones y traducirlas al formato de NutriTrack ---
async function fetchMeasurements(accessToken) {
  const params = new URLSearchParams({
    action: 'getmeas',
    meastypes: MEASTYPES.join(','),
    category: '1', // mediciones reales (no objetivos)
  });
  const res = await fetch(MEASURE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const data = await res.json();
  if (data.status !== 0) throw new Error(`Withings getmeas error: status ${data.status}`);

  const groups = data.body?.measuregrps || [];
  return groups.map(grp => {
    const byType = {};
    for (const m of grp.measures) {
      byType[m.type] = m.value * Math.pow(10, m.unit); // valor real
    }
    const weightKg = byType[1] != null ? round1(byType[1]) : null;
    const hydrationKg = byType[77]; // Withings da hidratación en kg
    const out = {
      date: new Date(grp.date * 1000).toISOString().slice(0, 10),
      weightKg,
      bodyFatPct: byType[6] != null ? round1(byType[6]) : null,
      muscleMassKg: byType[76] != null ? round1(byType[76]) : null,
      boneMassKg: byType[88] != null ? round1(byType[88]) : null,
      // Convertimos hidratación (kg) a % del peso, que es lo que muestra la app
      waterPct: (hydrationKg != null && weightKg) ? round1(hydrationKg / weightKg * 100) : null,
    };
    return out;
  }).filter(m => m.weightKg != null);
}

function round1(n) { return Math.round(n * 10) / 10; }

async function handleMeasures(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, env, 400);
  }
  const refreshToken = body?.refresh_token;
  if (!refreshToken) return json({ error: 'missing_refresh_token' }, env, 400);

  try {
    const tokens = await refreshTokens(refreshToken, env);
    const measurements = await fetchMeasurements(tokens.access_token);
    // Devolvemos el nuevo refresh_token para que la app lo guarde (rotan)
    return json({ measurements, refresh_token: tokens.refresh_token }, env);
  } catch (e) {
    return json({ error: e.message }, env, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors(env) });
    }
    if (url.pathname === '/start') return handleStart(request, env);
    if (url.pathname === '/callback') return handleCallback(request, env);
    if (url.pathname === '/measures' && request.method === 'POST') return handleMeasures(request, env);
    if (url.pathname === '/') {
      return new Response('NutriTrack ↔ Withings worker OK', { headers: cors(env) });
    }
    return new Response('Not found', { status: 404, headers: cors(env) });
  },
};
