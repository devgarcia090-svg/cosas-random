// Punto de entrada del Worker.
// Atiende /api/* con las funciones de reservas y deja el resto de rutas
// (HTML, CSS, imágenes) en manos de los assets estáticos de public/.

import * as reservas from './src/api/reservas.js';
import * as reservaId from './src/api/reserva-id.js';
import * as disponibilidad from './src/api/disponibilidad.js';
import * as sesion from './src/api/sesion.js';
import * as ajustes from './src/api/ajustes.js';
import { fallo } from './src/servidor.js';

const RUTAS = {
  '/api/reservas': reservas,
  '/api/disponibilidad': disponibilidad,
  '/api/sesion': sesion,
  '/api/ajustes': ajustes
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    // /api/reservas/<id>
    const conId = url.pathname.match(/^\/api\/reservas\/([^/]+)$/);
    const modulo = conId ? reservaId : RUTAS[url.pathname];
    if (!modulo) return fallo('Ruta no encontrada.', 404);

    const manejador = modulo['onRequest' + request.method[0] + request.method.slice(1).toLowerCase()];
    if (!manejador) return fallo('Método no permitido.', 405);

    const params = conId ? { id: decodeURIComponent(conId[1]) } : {};

    try {
      return await manejador({ request, env, ctx, params });
    } catch (error) {
      console.error('Error en', url.pathname, error);
      return fallo('Ha ocurrido un error en el servidor.', 500);
    }
  }
};
