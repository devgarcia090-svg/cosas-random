/**
 * Estudio Olfato · peticiones por rango para los vídeos.
 *
 * El servidor de assets de Workers responde 200 con el fichero entero a una
 * petición `Range`, en vez del 206 parcial. Chrome y Firefox lo toleran;
 * Safari, y en particular el de iOS, no: pide un rango antes de reproducir y
 * sin respuesta 206 no reproduce nada. Como una buena parte de quien entra a
 * esta web lo hace desde un iPhone, el vídeo se quedaba en el fotograma fijo.
 *
 * Este Worker solo se ejecuta para `/video/*` (ver run_worker_first en
 * wrangler.toml). Todo lo demás lo sigue sirviendo el asset server directo,
 * sin pasar por aquí.
 */

/** Interpreta una cabecera Range de un solo intervalo sobre `total` bytes. */
function interpretarRango(cabecera, total) {
  const m = /^bytes=(\d*)-(\d*)$/.exec((cabecera || '').trim());
  if (!m) return null;
  const [, desdeTxt, hastaTxt] = m;

  let desde, hasta;
  if (desdeTxt === '') {
    // Sufijo: "bytes=-500" son los últimos 500 bytes.
    if (hastaTxt === '') return null;
    const n = Number(hastaTxt);
    if (!n) return null;
    desde = Math.max(0, total - n);
    hasta = total - 1;
  } else {
    desde = Number(desdeTxt);
    hasta = hastaTxt === '' ? total - 1 : Number(hastaTxt);
  }

  if (!Number.isFinite(desde) || !Number.isFinite(hasta)) return null;
  if (desde > hasta || desde >= total) return null;
  return { desde, hasta: Math.min(hasta, total - 1) };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/video/')) {
      return env.ASSETS.fetch(request);
    }

    // Se pide siempre el fichero completo al asset server y se corta aquí:
    // no acepta rangos, así que reenviarle la cabecera no serviría de nada.
    const limpia = new Request(url.toString(), {
      method: request.method === 'HEAD' ? 'GET' : request.method,
      headers: (() => {
        const h = new Headers(request.headers);
        h.delete('range');
        return h;
      })(),
    });
    const origen = await env.ASSETS.fetch(limpia);

    if (!origen.ok || origen.status !== 200) return origen;

    const cabeceras = new Headers(origen.headers);
    cabeceras.set('Accept-Ranges', 'bytes');

    const rango = request.headers.get('Range');
    if (!rango) {
      if (request.method === 'HEAD') return new Response(null, { status: 200, headers: cabeceras });
      return new Response(origen.body, { status: 200, headers: cabeceras });
    }

    const datos = new Uint8Array(await origen.arrayBuffer());
    const total = datos.byteLength;
    const tramo = interpretarRango(rango, total);

    if (!tramo) {
      cabeceras.set('Content-Range', `bytes */${total}`);
      return new Response(null, { status: 416, headers: cabeceras });
    }

    const { desde, hasta } = tramo;
    cabeceras.set('Content-Range', `bytes ${desde}-${hasta}/${total}`);
    cabeceras.set('Content-Length', String(hasta - desde + 1));

    return new Response(
      request.method === 'HEAD' ? null : datos.subarray(desde, hasta + 1),
      { status: 206, headers: cabeceras }
    );
  },
};
