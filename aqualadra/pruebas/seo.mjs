import { chromium } from 'playwright';

// Ejecutar con el sitio servido en local:
//   npx http-server aqualadra -p 8899 -s &
//   BASE=http://127.0.0.1:8899 node aqualadra/pruebas/seo.mjs
//
// Lo que más se rompe en SEO no es que falte una etiqueta, es que los datos
// estructurados y lo que ve la persona se separen con el tiempo: se cambia un
// precio en la tabla y el JSON-LD sigue diciendo el viejo. Google lo penaliza
// y las IA responden un precio que no existe. Esto lo comprueba.
const BASE = process.env.BASE || 'http://127.0.0.1:8899';

const b = await chromium.launch();
const p = await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto(BASE + '/index.html', {waitUntil:'load'});

const ok = [], bad = [];
const t = (cond, label) => (cond ? ok : bad).push(label);
const norm = s => (s || '').replace(/\s+/g, ' ').replace(/ /g, ' ').trim();

// ---------- El grafo de datos estructurados ----------
const grafo = await p.evaluate(() => {
  const el = document.querySelector('script[type="application/ld+json"]');
  try { return { ok: true, d: JSON.parse(el.textContent) }; }
  catch (e) { return { ok: false, err: e.message }; }
});
t(grafo.ok, 'el JSON-LD es JSON válido' + (grafo.ok ? '' : ': ' + grafo.err));
if (!grafo.ok) { console.log(bad.join('\n')); await b.close(); process.exit(1); }

const nodos = {};
for (const n of grafo.d['@graph'] || []) {
  for (const tipo of [].concat(n['@type'])) nodos[tipo] = n;
}
for (const tipo of ['LocalBusiness', 'WebSite', 'HowTo', 'FAQPage'])
  t(!!nodos[tipo], `el grafo incluye ${tipo}`);

// ---------- Ficha del negocio ----------
const n = nodos.LocalBusiness || {};
t(n.name === 'AquaLadra', 'nombre del negocio');
t(n.telephone === '+34658284018', 'teléfono en formato internacional');
t(n.address && n.address.postalCode === '30006', 'código postal');
t(n.address && n.address.addressLocality === 'Puente Tocinos', 'localidad');
t(Array.isArray(n.image) && n.image.length >= 2, `${(n.image||[]).length} imágenes declaradas`);
t(!!n.hasMap, 'enlace al mapa');
t(!!n.priceRange, 'rango de precios');
t(Array.isArray(n.areaServed) && n.areaServed.length > 0, 'zona de servicio');
const horario = (n.openingHoursSpecification || [])[0] || {};
t(horario.opens === '09:00' && horario.closes === '21:00', 'horario 9:00-21:00');
t((horario.dayOfWeek || []).length === 7, 'abierto los siete días');

// El teléfono del JSON-LD tiene que ser el que se puede pulsar en la página
const telPagina = await p.evaluate(() => {
  const a = document.querySelector('a[href^="tel:"]');
  return a ? a.getAttribute('href').replace('tel:', '') : null;
});
t(telPagina === n.telephone, `el teléfono del JSON-LD coincide con el de la página (${telPagina})`);

// ---------- Los precios del JSON-LD contra la tabla visible ----------
const visibles = await p.evaluate(() => {
  const res = {};
  for (const panel of document.querySelectorAll('.panel')) {
    const tab = document.getElementById(panel.getAttribute('aria-labelledby'));
    const lista = [];
    for (const tarjeta of panel.querySelectorAll('.price')) {
      const nombre = tarjeta.querySelector('.price__name');
      const valor = tarjeta.querySelector('.price__value');
      if (nombre && valor) lista.push([nombre.textContent.trim(), valor.textContent.replace(/\D/g, '')]);
    }
    res[tab.textContent.trim()] = lista;
  }
  // Precios de la máquina del autolavado
  res.maquina = Array.from(document.querySelectorAll('.machine__item')).map(i =>
    [i.querySelector('b').textContent.trim(), i.querySelector('.eur').textContent.replace(/\D/g, '')]);
  return res;
});

const preciosLD = new Set(
  ((n.hasOfferCatalog || {}).itemListElement || [])
    .map(o => o.priceSpecification.price ?? o.priceSpecification.minPrice));
const preciosVis = new Set();
for (const [grupo, lista] of Object.entries(visibles))
  for (const [, v] of lista) if (v) preciosVis.add(v);

const faltan = [...preciosVis].filter(v => !preciosLD.has(v));
t(faltan.length === 0, faltan.length
  ? `⚠ precios visibles que NO están en el JSON-LD: ${faltan.join(', ')}`
  : `los ${preciosVis.size} precios visibles están todos en el JSON-LD`);

const inventados = [...preciosLD].filter(v => !preciosVis.has(v));
t(inventados.length === 0, inventados.length
  ? `⚠ precios en el JSON-LD que no aparecen en la página: ${inventados.join(', ')}`
  : 'el JSON-LD no declara ningún precio que no esté en la página');

// ---------- Las preguntas frecuentes, palabra por palabra ----------
const faqPagina = await p.evaluate(() => Array.from(document.querySelectorAll('.faq details')).map(d => ({
  q: d.querySelector('summary').textContent,
  a: d.querySelector('.respuesta').textContent,
})));
const faqLD = (nodos.FAQPage.mainEntity || []).map(x => ({ q: x.name, a: x.acceptedAnswer.text }));
t(faqPagina.length >= 8, `${faqPagina.length} preguntas en la página`);
t(faqPagina.length === faqLD.length, `mismo número de preguntas en el JSON-LD (${faqLD.length})`);

let desajustes = 0;
for (let i = 0; i < Math.min(faqPagina.length, faqLD.length); i++) {
  if (norm(faqPagina[i].q) !== norm(faqLD[i].q)) { desajustes++; console.log(`    pregunta ${i+1} distinta:\n      página: ${norm(faqPagina[i].q)}\n      JSON-LD: ${norm(faqLD[i].q)}`); }
  if (norm(faqPagina[i].a) !== norm(faqLD[i].a)) { desajustes++; console.log(`    respuesta ${i+1} distinta:\n      página: ${norm(faqPagina[i].a).slice(0,90)}\n      JSON-LD: ${norm(faqLD[i].a).slice(0,90)}`); }
}
t(desajustes === 0, desajustes === 0
  ? 'cada pregunta y respuesta del JSON-LD coincide con la de la página'
  : `⚠ ${desajustes} desajustes entre la página y el JSON-LD`);

// Las respuestas tienen que estar en el HTML aunque el desplegable esté cerrado
const cerradasPeroLegibles = await p.evaluate(() =>
  Array.from(document.querySelectorAll('.faq details')).every(d =>
    !d.open && d.querySelector('.respuesta').textContent.trim().length > 20));
t(cerradasPeroLegibles, 'las respuestas están en el HTML con el desplegable cerrado');

// ---------- Los pasos del HowTo contra los de la página ----------
const pasosPagina = await p.evaluate(() =>
  Array.from(document.querySelectorAll('.steps .step h3')).map(h => h.textContent.trim()));
const pasosLD = (nodos.HowTo.step || []).map(s => s.name);
t(pasosPagina.length === pasosLD.length, `el HowTo tiene los mismos ${pasosLD.length} pasos que la página`);

// ---------- Etiquetas de la cabecera ----------
const cab = await p.evaluate(() => {
  const meta = n => (document.querySelector(`meta[name="${n}"]`) || {}).content || '';
  const og = n => (document.querySelector(`meta[property="og:${n}"]`) || {}).content || '';
  return {
    titulo: document.title, desc: meta('description'),
    canonical: (document.querySelector('link[rel=canonical]') || {}).href || '',
    ogTitulo: og('title'), ogDesc: og('description'), ogImg: og('image'),
    ogAlto: og('image:height'), ogAncho: og('image:width'),
    h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
    h2: document.querySelectorAll('h2').length,
    sinAlt: Array.from(document.images).filter(i => !i.hasAttribute('alt')).length,
    lang: document.documentElement.lang,
  };
});
t(cab.titulo.length >= 30 && cab.titulo.length <= 70, `longitud del título (${cab.titulo.length})`);
t(cab.desc.length >= 110 && cab.desc.length <= 165 || cab.desc.length <= 200, `longitud de la descripción (${cab.desc.length})`);
t(/Murcia/.test(cab.titulo) && /peluquer/i.test(cab.titulo), 'el título lleva servicio y ciudad');
t(cab.h1.length === 1, `un solo h1 (${cab.h1.length})`);
t(cab.h2 >= 8, `${cab.h2} apartados h2`);
t(cab.sinAlt === 0, 'ninguna imagen sin alt');
t(cab.lang === 'es', 'idioma declarado');
t(!!cab.canonical, 'canonical presente');
t(!!cab.ogImg && !!cab.ogAlto && !!cab.ogAncho, 'imagen de previsualización con medidas');

// ---------- Anclas internas ----------
const rotas = await p.evaluate(() => Array.from(document.querySelectorAll('a[href^="#"]'))
  .map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.querySelector(h)));
t(rotas.length === 0, rotas.length ? `⚠ anclas rotas: ${rotas.join(', ')}` : 'ninguna ancla interna rota');

// ---------- Ficheros para buscadores e IA ----------
for (const [ruta, comprobar] of [
  ['/robots.txt',  txt => /Sitemap:\s*https?:\/\//.test(txt) && /GPTBot/.test(txt) && /ClaudeBot/.test(txt)],
  ['/sitemap.xml', txt => /<urlset/.test(txt) && (txt.match(/<loc>/g) || []).length >= 4],
  ['/llms.txt',    txt => /^# AquaLadra/m.test(txt) && /684 79 72 36/.test(txt) && /6 €/.test(txt)],
]) {
  const r = await p.request.get(BASE + ruta);
  const cuerpo = r.ok() ? await r.text() : '';
  t(r.ok() && comprobar(cuerpo), `${ruta} presente y con el contenido esperado (${r.status()})`);
}

await b.close();
console.log('CORRECTO (' + ok.length + '):'); ok.forEach(x => console.log('  ✔ ' + x));
if (bad.length) { console.log('\nFALLOS (' + bad.length + '):'); bad.forEach(x => console.log('  ✘ ' + x)); process.exitCode = 1; }
else console.log('\nTodo pasa.');
