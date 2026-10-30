/**
 * Portón de la tienda.
 *
 * Las páginas de la tienda no son públicas hasta que abra. Esto NO es
 * un overlay de JavaScript (ese se salta con ver-código, porque el HTML
 * ya ha viajado al navegador): aquí el servidor no entrega la página
 * sin credenciales correctas.
 *
 * La contraseña vive en un secreto del Worker (CLAVE_TIENDA), no en el
 * repositorio. Para cambiarla:
 *     echo -n "nueva" | npx wrangler secret put CLAVE_TIENDA
 *
 * Para abrir la tienda al público el día del lanzamiento, vacía
 * PROTEGIDAS y vuelve a desplegar.
 */

const PROTEGIDAS = [
  '/tienda',
  '/condiciones-venta',
  '/envios-devoluciones',
  '/transparencia',
];

const USUARIO = 'maya';

function pide(){
  return new Response('Esta parte de la web todavía no está abierta.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Tienda Maya", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
      // Que ni Cloudflare ni el navegador guarden la version protegida.
      'Cache-Control': 'no-store',
    },
  });
}

/** Comparación en tiempo constante, para no filtrar la clave por el reloj. */
function igual(a, b){
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ba.byteLength !== bb.byteLength) return false;
  let dif = 0;
  for (let i = 0; i < ba.byteLength; i++) dif |= ba[i] ^ bb[i];
  return dif === 0;
}

function autorizado(request, clave){
  const cab = request.headers.get('Authorization');
  if (!cab || !cab.startsWith('Basic ')) return false;
  let texto;
  try { texto = atob(cab.slice(6)); } catch { return false; }
  const corte = texto.indexOf(':');
  if (corte === -1) return false;
  return igual(texto.slice(0, corte), USUARIO) &&
         igual(texto.slice(corte + 1), clave);
}

export default {
  async fetch(request, env){
    const ruta = new URL(request.url).pathname.replace(/\/+$/, '') || '/';
    const protegida = PROTEGIDAS.some(p => ruta === p || ruta === p + '.html');

    if (protegida) {
      // Sin secreto configurado se deniega. Mejor una tienda
      // inaccesible que una tienda abierta por accidente.
      if (!env.CLAVE_TIENDA || !autorizado(request, env.CLAVE_TIENDA)) return pide();
      const r = await env.ASSETS.fetch(request);
      const resp = new Response(r.body, r);
      resp.headers.set('Cache-Control', 'no-store');
      resp.headers.set('X-Robots-Tag', 'noindex, nofollow');
      return resp;
    }

    // Todo lo demás, tal cual. Si algo fallara aquí, la web pública
    // no puede caerse por culpa del portón.
    return env.ASSETS.fetch(request);
  },
};
