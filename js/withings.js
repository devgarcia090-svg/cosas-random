/*
 * withings.js — Integración de la app con Withings (a través del Worker).
 *
 * La app nunca ve el client_secret: solo habla con tu Worker.
 * Guarda en localStorage: la URL del Worker y el refresh_token (que rota).
 */

const WORKER_KEY = 'nutritrack_withings_worker_v1';
const RT_KEY = 'nutritrack_withings_rt_v1';

function getWorkerUrl() {
  return (localStorage.getItem(WORKER_KEY) || '').replace(/\/+$/, '');
}
function setWorkerUrl(url) {
  if (url) localStorage.setItem(WORKER_KEY, url.trim().replace(/\/+$/, ''));
  else localStorage.removeItem(WORKER_KEY);
}
function getRefreshToken() {
  return localStorage.getItem(RT_KEY) || '';
}
function setRefreshToken(rt) {
  if (rt) localStorage.setItem(RT_KEY, rt);
  else localStorage.removeItem(RT_KEY);
}
function isConnected() {
  return !!getRefreshToken();
}
function isConfigured() {
  return !!getWorkerUrl();
}

// Al cargar la app, procesa el fragmento (#) que deja el Worker tras el login.
// Devuelve 'connected' | 'error:<msg>' | null
function consumeCallback() {
  const hash = window.location.hash || '';
  if (!hash) return null;
  const params = new URLSearchParams(hash.slice(1));
  const rt = params.get('withings_refresh');
  const err = params.get('withings_error');
  let result = null;
  if (rt) {
    setRefreshToken(rt);
    result = 'connected';
  } else if (err) {
    result = 'error:' + err;
  }
  if (result) {
    // Limpia el fragmento de la URL para no dejar el token a la vista
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  return result;
}

// Inicia el login: lleva al usuario al Worker, que redirige a Withings.
function connect() {
  const worker = getWorkerUrl();
  if (!worker) throw new Error('NO_WORKER');
  window.location.href = worker + '/start';
}

function disconnect() {
  setRefreshToken('');
}

/*
 * Importa las mediciones desde Withings.
 * Devuelve un array de mediciones en el formato de NutriTrack.
 * Guarda el nuevo refresh_token (rotan en cada uso).
 */
async function importMeasurements() {
  const worker = getWorkerUrl();
  if (!worker) throw new Error('NO_WORKER');
  const rt = getRefreshToken();
  if (!rt) throw new Error('NOT_CONNECTED');

  let res;
  try {
    res = await fetch(worker + '/measures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: rt }),
    });
  } catch {
    throw new Error('NETWORK');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Si el refresh token ya no vale, hay que reconectar
    if (/refresh|invalid|token/i.test(data.error || '')) {
      setRefreshToken('');
      throw new Error('RECONNECT');
    }
    throw new Error(data.error || `HTTP_${res.status}`);
  }
  // Guardar el refresh_token rotado
  if (data.refresh_token) setRefreshToken(data.refresh_token);
  return Array.isArray(data.measurements) ? data.measurements : [];
}

function errorMessage(err) {
  const map = {
    NO_WORKER: 'Configura la URL de tu Worker de Withings en Perfil.',
    NOT_CONNECTED: 'Conecta primero tu cuenta de Withings.',
    RECONNECT: 'La sesión de Withings caducó. Vuelve a conectar tu cuenta.',
    NETWORK: 'No se pudo conectar con el Worker. Revisa la URL y tu conexión.',
  };
  return map[err.message] || `Error importando de Withings: ${err.message}`;
}

window.Withings = {
  getWorkerUrl, setWorkerUrl,
  getRefreshToken,
  isConnected, isConfigured,
  consumeCallback,
  connect, disconnect,
  importMeasurements,
  errorMessage,
};
