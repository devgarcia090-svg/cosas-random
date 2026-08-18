/**
 * Gastos — API + web para registrar gastos desde Atajos de Apple.
 *
 * Endpoints (todos requieren token salvo los ficheros estáticos):
 *   POST   /api/gastos        crea un gasto  (lo que usa el Atajo)
 *   GET    /api/gastos        lista gastos   ?mes=YYYY-MM&categoria=&hormiga=1&limite=
 *   PATCH  /api/gastos/:id    edita campos
 *   DELETE /api/gastos/:id    borra
 *   GET    /api/resumen       totales del mes, por categoría, hormigas, proyección
 *   GET    /api/config        lee ajustes
 *   PUT    /api/config        guarda ajustes
 *   POST   /api/entrar        valida el token y deja una cookie de sesión (web)
 *   POST   /api/salir         borra la cookie
 *   GET    /api/ping          comprueba token (para el login de la web)
 *
 * El token va en la cabecera `X-Token`, en `Authorization: Bearer ...`
 * o en `?token=` (cómodo para Atajos). La web usa además una cookie de sesión
 * que pone el servidor al entrar, para no tener que pedir el token cada vez.
 */

const ZONA = 'Europe/Madrid';

const CATEGORIAS = [
  'super', 'restaurante', 'cafe', 'transporte', 'ocio', 'suscripciones',
  'salud', 'hogar', 'ropa', 'caprichos', 'regalos', 'otros', 'sin-categoria',
];

// Palabras del nombre del comercio -> categoría. Se usa cuando el Atajo solo
// nos da el comercio (la automatización de Wallet no pregunta nada).
const REGLAS = [
  ['super',        ['mercadona', 'carrefour', 'lidl', 'aldi', 'dia ', 'alcampo', 'eroski', 'consum', 'ahorramas', 'supercor', 'hipercor', 'condis', 'bonarea', 'super']],
  ['restaurante',  ['restaurante', 'bar ', 'taberna', 'pizz', 'burger', 'mcdonald', 'kfc', 'telepizza', 'domino', 'goiko', 'sushi', 'kebab', 'glovo', 'just eat', 'uber eats', 'deliveroo', 'tapas', 'asador', 'cerveceria']],
  ['cafe',         ['cafe', 'café', 'starbucks', 'costa coffee', 'panaderia', 'panadería', 'pasteleria', 'pastelería', 'churreria', 'dunkin', 'croissant']],
  ['transporte',   ['renfe', 'metro', 'emt', 'cabify', 'uber', 'bolt', 'free now', 'taxi', 'repsol', 'cepsa', 'galp', 'shell', 'bp ', 'gasolin', 'parking', 'aparcamiento', 'blablacar', 'alsa', 'iberia', 'ryanair', 'vueling', 'bicimad', 'peaje']],
  ['ocio',         ['cine', 'yelmo', 'cinesa', 'teatro', 'concierto', 'ticketmaster', 'fnac', 'steam', 'playstation', 'nintendo', 'xbox', 'museo', 'bolera', 'padel', 'pádel', 'gimnasio', 'basic-fit', 'altafit']],
  ['suscripciones',['netflix', 'spotify', 'hbo', 'max ', 'disney', 'prime video', 'amazon prime', 'apple.com/bill', 'icloud', 'youtube premium', 'dropbox', 'chatgpt', 'openai', 'claude', 'anthropic', 'movistar', 'vodafone', 'orange', 'yoigo', 'jazztel', 'digi']],
  ['salud',        ['farmacia', 'parafarmacia', 'clinica', 'clínica', 'dentista', 'optica', 'óptica', 'hospital', 'fisio', 'psico', 'sanitas', 'adeslas']],
  ['hogar',        ['ikea', 'leroy', 'bricomart', 'bricodepot', 'ferreteria', 'ferretería', 'iberdrola', 'endesa', 'naturgy', 'holaluz', 'canal isabel', 'aqualia', 'seguro hogar', 'alquiler']],
  ['ropa',         ['zara', 'h&m', 'hm ', 'primark', 'bershka', 'pull&bear', 'stradivarius', 'mango', 'decathlon', 'nike', 'adidas', 'jd sports', 'springfield', 'massimo dutti', 'oysho', 'shein']],
  ['caprichos',    ['amazon', 'aliexpress', 'temu', 'tabaco', 'estanco', 'loteria', 'lotería', 'apuesta', 'bet', 'vending', 'kiosco', 'chuche', 'wallapop']],
  ['regalos',      ['floristeria', 'floristería', 'juguet', 'regalo', 'joyeria', 'joyería']],
];

/* ------------------------------- utilidades ------------------------------- */

const json = (data, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'content-type, x-token, authorization',
      'access-control-allow-methods': 'GET, POST, PATCH, DELETE, PUT, OPTIONS',
    },
  });

const error = (mensaje, status = 400) => json({ ok: false, error: mensaje }, status);

/** Comparación en tiempo (casi) constante para no filtrar el token. */
function tokenValido(recibido, esperado) {
  if (!recibido || !esperado || recibido.length !== esperado.length) return false;
  let dif = 0;
  for (let i = 0; i < recibido.length; i++) dif |= recibido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return dif === 0;
}

const COOKIE = 'gastos_sesion';

function leerCookie(request, nombre) {
  const crudo = request.headers.get('cookie') || '';
  for (const trozo of crudo.split(';')) {
    const i = trozo.indexOf('=');
    if (i < 0) continue;
    if (trozo.slice(0, i).trim() === nombre) return decodeURIComponent(trozo.slice(i + 1).trim());
  }
  return null;
}

/** El token de la petición: cabecera, Bearer, ?token= o la cookie de sesión. */
function tokenDe(request, url) {
  const cabecera = request.headers.get('authorization') || '';
  return (
    request.headers.get('x-token') ||
    (cabecera.toLowerCase().startsWith('bearer ') ? cabecera.slice(7).trim() : '') ||
    url.searchParams.get('token') ||
    leerCookie(request, COOKIE) ||
    ''
  );
}

function autorizado(request, url, env) {
  return tokenValido(tokenDe(request, url), env.API_TOKEN);
}

/**
 * Cookie de sesión para la web. La pone el servidor (no el JavaScript) porque
 * Safari en iOS borra a los 7 días todo lo que guarda el JS —localStorage
 * incluido—, y por eso la web pedía el token una y otra vez. Va HttpOnly, así
 * que el JS de la página tampoco puede leerla, y SameSite=Lax evita que otra
 * web la use para escribir en tus gastos.
 */
function ponerCookie(respuesta, valor, url, borrar = false) {
  const seguro = url.protocol === 'https:' ? ' Secure;' : '';
  respuesta.headers.append(
    'set-cookie',
    `${COOKIE}=${borrar ? '' : encodeURIComponent(valor)}; Path=/; HttpOnly;${seguro}` +
      ` SameSite=Lax; Max-Age=${borrar ? 0 : 60 * 60 * 24 * 400}`,
  );
  return respuesta;
}

/** YYYY-MM-DD en la zona local configurada (no en UTC). */
function fechaLocal(ts, zona) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(ts));
  return partes; // en-CA ya da YYYY-MM-DD
}

function mesActual(zona) {
  return fechaLocal(Date.now(), zona).slice(0, 7);
}

/** Acepta "12,50 €", "€12.50", "12.50", 12.5 ... */
function parseImporte(valor) {
  if (typeof valor === 'number' && Number.isFinite(valor)) return Math.abs(valor);
  if (typeof valor !== 'string') return NaN;
  let s = valor.replace(/[^\d.,-]/g, '').trim();
  if (!s) return NaN;
  const coma = s.lastIndexOf(',');
  const punto = s.lastIndexOf('.');
  if (coma > -1 && punto > -1) {
    // el último separador es el decimal
    const dec = coma > punto ? ',' : '.';
    const mil = dec === ',' ? '.' : ',';
    s = s.split(mil).join('').replace(dec, '.');
  } else if (coma > -1) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? Math.abs(n) : NaN;
}

/** Fecha a partir de lo que mande el Atajo (ISO, epoch, o nada). */
function parseFecha(valor) {
  if (valor === undefined || valor === null || valor === '') return Date.now();
  if (typeof valor === 'number') return valor > 1e12 ? valor : valor * 1000;
  const n = Number(valor);
  if (Number.isFinite(n) && n > 1e9) return n > 1e12 ? n : n * 1000;
  const t = Date.parse(valor);
  return Number.isNaN(t) ? Date.now() : t;
}

function adivinaCategoria(texto) {
  const t = (texto || '').toLowerCase();
  if (!t) return 'sin-categoria';
  for (const [categoria, palabras] of REGLAS) {
    if (palabras.some((p) => t.includes(p))) return categoria;
  }
  return 'sin-categoria';
}

function normalizaCategoria(valor, comercio, descripcion) {
  const c = (valor || '').toString().trim().toLowerCase();
  if (CATEGORIAS.includes(c)) return c;
  if (c) return 'otros';
  return adivinaCategoria(`${comercio || ''} ${descripcion || ''}`);
}

function esVerdadero(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const s = valor.toString().trim().toLowerCase();
  if (['1', 'true', 'si', 'sí', 'yes', 'y', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(s)) return false;
  return null;
}

/** Lee el cuerpo sea JSON, formulario o texto "12,50 Mercadona". */
async function leerCuerpo(request, url) {
  const tipo = (request.headers.get('content-type') || '').toLowerCase();
  let datos = {};
  try {
    if (tipo.includes('multipart/form-data')) {
      datos = Object.fromEntries((await request.formData()).entries());
    } else {
      const texto = (await request.text()).trim();
      if (texto.startsWith('{')) {
        datos = JSON.parse(texto);
      } else if (texto.includes('=') && !texto.includes(' ')) {
        datos = Object.fromEntries(new URLSearchParams(texto).entries());
      } else if (texto) {
        // texto suelto tipo "12,50 Mercadona" -> importe + comercio
        const m = texto.match(/^([\d.,]+)\s*(?:€|eur|euros)?\s*(.*)$/is);
        if (m) datos = { importe: m[1], comercio: (m[2] || '').trim() };
      }
    }
  } catch {
    datos = {};
  }
  // los parámetros de la URL también valen (y no pisan al cuerpo)
  for (const [k, v] of url.searchParams.entries()) {
    if (k !== 'token' && datos[k] === undefined) datos[k] = v;
  }
  return datos;
}

/* --------------------------------- config -------------------------------- */

async function leerConfig(env) {
  const { results } = await env.DB.prepare('SELECT clave, valor FROM config').all();
  const config = Object.fromEntries((results || []).map((r) => [r.clave, r.valor]));
  return {
    umbral_hormiga: Number(config.umbral_hormiga ?? 10),
    presupuesto_mes: config.presupuesto_mes ? Number(config.presupuesto_mes) : null,
    zona: config.zona || ZONA,
  };
}

async function guardarConfig(env, datos) {
  const permitidas = ['umbral_hormiga', 'presupuesto_mes', 'zona'];
  const stmts = [];
  for (const clave of permitidas) {
    if (datos[clave] === undefined || datos[clave] === null || datos[clave] === '') continue;
    stmts.push(
      env.DB.prepare('INSERT INTO config (clave, valor) VALUES (?, ?) ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor')
        .bind(clave, String(datos[clave])),
    );
  }
  if (stmts.length) await env.DB.batch(stmts);
  return leerConfig(env);
}

/* ------------------------------- endpoints ------------------------------- */

async function crearGasto(request, url, env) {
  const datos = await leerCuerpo(request, url);
  const config = await leerConfig(env);

  const importe = parseImporte(datos.importe ?? datos.amount ?? datos.cantidad ?? datos.total);
  if (!Number.isFinite(importe) || importe <= 0) {
    return error('Falta el importe o no se entiende. Manda por ejemplo {"importe": 12.5}.');
  }

  const comercio = (datos.comercio ?? datos.merchant ?? datos.tienda ?? '').toString().trim().slice(0, 120) || null;
  const descripcion = (datos.descripcion ?? datos.description ?? datos.concepto ?? datos.nombre ?? '').toString().trim().slice(0, 200) || null;
  const nota = (datos.nota ?? datos.note ?? '').toString().trim().slice(0, 500) || null;
  const metodo = (datos.metodo ?? datos.method ?? datos.pago ?? '').toString().trim().slice(0, 40) || null;
  const origen = (datos.origen ?? datos.source ?? 'atajo').toString().trim().slice(0, 20);
  const categoria = normalizaCategoria(datos.categoria ?? datos.category, comercio, descripcion);

  const ts = parseFecha(datos.fecha ?? datos.date ?? datos.ts);
  const fecha = fechaLocal(ts, config.zona);

  const marcada = esVerdadero(datos.hormiga);
  const hormiga = marcada === null ? importe <= config.umbral_hormiga : marcada;

  // los gastos que llegan sin categoría desde el móvil quedan "por revisar"
  const revisadoManual = esVerdadero(datos.revisado);
  const revisado = revisadoManual === null
    ? (origen === 'web' || categoria !== 'sin-categoria')
    : revisadoManual;

  const res = await env.DB.prepare(
    `INSERT INTO gastos (importe, comercio, descripcion, categoria, metodo, hormiga, revisado, nota, ts, fecha, origen, creado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    Math.round(importe * 100) / 100, comercio, descripcion, categoria, metodo,
    hormiga ? 1 : 0, revisado ? 1 : 0, nota, ts, fecha, origen, Date.now(),
  ).run();

  const id = res.meta?.last_row_id ?? null;
  const gasto = {
    id, importe: Math.round(importe * 100) / 100, comercio, descripcion, categoria,
    metodo, hormiga, revisado, nota, ts, fecha, origen,
  };

  // `mensaje` está pensado para que el Atajo lo enseñe como notificación
  return json({
    ok: true,
    gasto,
    mensaje: `${gasto.importe.toFixed(2)} € · ${comercio || descripcion || 'gasto'}` +
      ` · ${categoria}${hormiga ? ' 🐜' : ''}`,
  }, 201);
}

async function listarGastos(url, env) {
  const config = await leerConfig(env);
  const mes = url.searchParams.get('mes');
  const categoria = url.searchParams.get('categoria');
  const hormiga = esVerdadero(url.searchParams.get('hormiga'));
  const revisado = esVerdadero(url.searchParams.get('revisado'));
  const limite = Math.min(Math.max(Number(url.searchParams.get('limite')) || 200, 1), 1000);

  const where = [];
  const args = [];
  if (mes && /^\d{4}-\d{2}$/.test(mes)) { where.push("substr(fecha, 1, 7) = ?"); args.push(mes); }
  if (categoria && CATEGORIAS.includes(categoria)) { where.push('categoria = ?'); args.push(categoria); }
  if (hormiga !== null) { where.push('hormiga = ?'); args.push(hormiga ? 1 : 0); }
  if (revisado !== null) { where.push('revisado = ?'); args.push(revisado ? 1 : 0); }

  const sql = `SELECT * FROM gastos ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY ts DESC LIMIT ?`;
  const { results } = await env.DB.prepare(sql).bind(...args, limite).all();

  return json({
    ok: true,
    mes: mes || null,
    config,
    gastos: (results || []).map((g) => ({ ...g, hormiga: !!g.hormiga, revisado: !!g.revisado })),
  });
}

async function editarGasto(id, request, url, env) {
  const datos = await leerCuerpo(request, url);
  const config = await leerConfig(env);
  const campos = [];
  const args = [];

  if (datos.importe !== undefined) {
    const importe = parseImporte(datos.importe);
    if (!Number.isFinite(importe) || importe <= 0) return error('Importe no válido.');
    campos.push('importe = ?'); args.push(Math.round(importe * 100) / 100);
  }
  if (datos.categoria !== undefined) {
    campos.push('categoria = ?'); args.push(normalizaCategoria(datos.categoria, '', ''));
  }
  for (const [clave, columna] of [['comercio', 'comercio'], ['descripcion', 'descripcion'], ['nota', 'nota'], ['metodo', 'metodo']]) {
    if (datos[clave] !== undefined) {
      campos.push(`${columna} = ?`);
      args.push(datos[clave] === '' ? null : String(datos[clave]).slice(0, 500));
    }
  }
  for (const clave of ['hormiga', 'revisado']) {
    const v = esVerdadero(datos[clave]);
    if (v !== null) { campos.push(`${clave} = ?`); args.push(v ? 1 : 0); }
  }
  if (datos.fecha !== undefined) {
    const ts = parseFecha(datos.fecha);
    campos.push('ts = ?', 'fecha = ?'); args.push(ts, fechaLocal(ts, config.zona));
  }
  if (!campos.length) return error('Nada que cambiar.');

  const res = await env.DB.prepare(`UPDATE gastos SET ${campos.join(', ')} WHERE id = ?`).bind(...args, id).run();
  if (!res.meta?.changes) return error('No existe ese gasto.', 404);

  const gasto = await env.DB.prepare('SELECT * FROM gastos WHERE id = ?').bind(id).first();
  return json({ ok: true, gasto: { ...gasto, hormiga: !!gasto.hormiga, revisado: !!gasto.revisado } });
}

async function borrarGasto(id, env) {
  const res = await env.DB.prepare('DELETE FROM gastos WHERE id = ?').bind(id).run();
  if (!res.meta?.changes) return error('No existe ese gasto.', 404);
  return json({ ok: true, id });
}

async function resumen(url, env) {
  const config = await leerConfig(env);
  const mes = /^\d{4}-\d{2}$/.test(url.searchParams.get('mes') || '')
    ? url.searchParams.get('mes')
    : mesActual(config.zona);

  const [totales, porCategoria, porDia, hormigasTop, meses, sinRevisar] = await env.DB.batch([
    env.DB.prepare(`SELECT COUNT(*) n, COALESCE(SUM(importe), 0) total,
                           COALESCE(SUM(CASE WHEN hormiga = 1 THEN importe END), 0) total_hormiga,
                           COALESCE(SUM(hormiga), 0) n_hormiga
                    FROM gastos WHERE substr(fecha, 1, 7) = ?`).bind(mes),
    env.DB.prepare(`SELECT categoria, COUNT(*) n, SUM(importe) total
                    FROM gastos WHERE substr(fecha, 1, 7) = ?
                    GROUP BY categoria ORDER BY total DESC`).bind(mes),
    env.DB.prepare(`SELECT fecha, SUM(importe) total FROM gastos
                    WHERE substr(fecha, 1, 7) = ? GROUP BY fecha ORDER BY fecha`).bind(mes),
    env.DB.prepare(`SELECT COALESCE(comercio, descripcion, 'sin nombre') nombre, COUNT(*) n, SUM(importe) total
                    FROM gastos WHERE substr(fecha, 1, 7) = ? AND hormiga = 1
                    GROUP BY LOWER(nombre) ORDER BY total DESC LIMIT 8`).bind(mes),
    env.DB.prepare(`SELECT substr(fecha, 1, 7) mes, SUM(importe) total,
                           COALESCE(SUM(CASE WHEN hormiga = 1 THEN importe END), 0) total_hormiga
                    FROM gastos GROUP BY mes ORDER BY mes DESC LIMIT 12`),
    env.DB.prepare(`SELECT COUNT(*) n FROM gastos WHERE revisado = 0`),
  ]);

  const t = totales.results[0] || { n: 0, total: 0, total_hormiga: 0, n_hormiga: 0 };
  const diasDelMes = new Date(Number(mes.slice(0, 4)), Number(mes.slice(5, 7)), 0).getDate();
  const hoy = fechaLocal(Date.now(), config.zona);
  const diasPasados = hoy.startsWith(mes) ? Number(hoy.slice(8, 10)) : diasDelMes;
  const mediaDia = diasPasados ? t.total / diasPasados : 0;

  return json({
    ok: true,
    mes,
    config,
    total: t.total,
    n: t.n,
    hormigas: {
      total: t.total_hormiga,
      n: t.n_hormiga,
      porcentaje: t.total ? (t.total_hormiga / t.total) * 100 : 0,
      proyeccion_anual: (t.total_hormiga / (diasPasados || 1)) * 365,
      top: hormigasTop.results || [],
    },
    media_dia: mediaDia,
    proyeccion_mes: mediaDia * diasDelMes,
    presupuesto: config.presupuesto_mes,
    por_categoria: porCategoria.results || [],
    por_dia: porDia.results || [],
    meses: meses.results || [],
    sin_revisar: sinRevisar.results[0]?.n || 0,
  });
}

/* --------------------------------- router -------------------------------- */

async function router(request, env) {
  const url = new URL(request.url);
  const ruta = url.pathname.replace(/\/+$/, '');
  const metodo = request.method;

  if (!env.API_TOKEN) {
    return error('Falta el secreto API_TOKEN en el Worker. Ver README.', 500);
  }

  // Entrar: valida el token y deja la sesión guardada en una cookie.
  if (ruta === '/api/entrar' && metodo === 'POST') {
    const datos = await leerCuerpo(request, url);
    const recibido = tokenDe(request, url) || (datos.token || '').toString().trim();
    if (!tokenValido(recibido, env.API_TOKEN)) return error('Token no válido.', 401);
    return ponerCookie(json({ ok: true, mes: mesActual((await leerConfig(env)).zona) }), recibido, url);
  }

  if (ruta === '/api/salir' && metodo === 'POST') {
    return ponerCookie(json({ ok: true }), '', url, true);
  }

  if (!autorizado(request, url, env)) return error('Token no válido.', 401);

  if (ruta === '/api/ping') return json({ ok: true, mes: mesActual((await leerConfig(env)).zona) });

  if (ruta === '/api/gastos') {
    if (metodo === 'POST') return crearGasto(request, url, env);
    if (metodo === 'GET') return listarGastos(url, env);
    return error('Método no permitido.', 405);
  }

  const m = ruta.match(/^\/api\/gastos\/(\d+)$/);
  if (m) {
    const id = Number(m[1]);
    if (metodo === 'PATCH' || metodo === 'POST') return editarGasto(id, request, url, env);
    if (metodo === 'DELETE') return borrarGasto(id, env);
    if (metodo === 'GET') {
      const gasto = await env.DB.prepare('SELECT * FROM gastos WHERE id = ?').bind(id).first();
      return gasto
        ? json({ ok: true, gasto: { ...gasto, hormiga: !!gasto.hormiga, revisado: !!gasto.revisado } })
        : error('No existe ese gasto.', 404);
    }
    return error('Método no permitido.', 405);
  }

  if (ruta === '/api/resumen' && metodo === 'GET') return resumen(url, env);

  if (ruta === '/api/config') {
    if (metodo === 'GET') return json({ ok: true, config: await leerConfig(env), categorias: CATEGORIAS });
    if (metodo === 'PUT' || metodo === 'POST') {
      return json({ ok: true, config: await guardarConfig(env, await leerCuerpo(request, url)) });
    }
    return error('Método no permitido.', 405);
  }

  return error('Ruta no encontrada.', 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return json({ ok: true });

    // lo que no sea /api/* lo sirven los ficheros estáticos (public/)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

    try {
      return await router(request, env);
    } catch (e) {
      return error(`Error del servidor: ${e.message}`, 500);
    }
  },
};
