import { chromium } from 'playwright';

// Ejecutar con el sitio servido en local:
//   npx http-server aqualadra -p 8899 -s &
//   BASE=http://127.0.0.1:8899 node aqualadra/pruebas/comprobar.mjs
const BASE = process.env.BASE || 'http://127.0.0.1:8899';

const b = await chromium.launch();
const ok = [], bad = [];
const t = (cond, label) => (cond ? ok : bad).push(label);

// ---------- Escritorio: pestañas y galería ----------
let ctx = await b.newContext({viewport:{width:1440,height:1000}});
let p = await ctx.newPage();
await p.goto(BASE + '/index.html', {waitUntil:'load'});
await p.waitForTimeout(500);

// Pestañas de tarifas
t(await p.locator('#panel-p1').isVisible() && await p.locator('#panel-p2').isHidden(), 'estado inicial de pestañas');
await p.locator('#tab-p3').click();
await p.waitForTimeout(200);
t(await p.locator('#panel-p3').isVisible() && await p.locator('#panel-p1').isHidden(), 'clic en pestaña "> 20 kg" cambia el panel');
t(await p.locator('#panel-p3').innerText().then(x=>x.includes('21') && x.includes('32')), 'precios de > 20 kg correctos (21 y 32)');
await p.locator('#tab-p3').press('ArrowRight');
await p.waitForTimeout(200);
t(await p.locator('#panel-p4').isVisible(), 'flechas del teclado navegan entre pestañas');

// Galería y visor
await p.locator('#galeria').scrollIntoViewIfNeeded();
await p.waitForTimeout(300);
await p.locator('.gallery__item').first().click();
await p.waitForTimeout(400);
t(await p.locator('#lightbox').evaluate(d=>d.open), 'el visor de fotos se abre');
const src1 = await p.locator('#lb-img').getAttribute('src');
await p.locator('#lb-next').click(); await p.waitForTimeout(300);
const src2 = await p.locator('#lb-img').getAttribute('src');
t(src1 !== src2, 'la flecha "siguiente" cambia de foto');
await p.keyboard.press('Escape'); await p.waitForTimeout(300);
t(!(await p.locator('#lightbox').evaluate(d=>d.open)), 'Escape cierra el visor');

// Estructura y accesibilidad
const audit = await p.evaluate(() => {
  const res = {};
  res.imgSinAlt = Array.from(document.images).filter(i => !i.hasAttribute('alt')).map(i=>i.src.split('/').pop());
  const ids = Array.from(document.querySelectorAll('[id]')).map(e=>e.id);
  res.idsDuplicados = ids.filter((v,i)=>ids.indexOf(v)!==i);
  res.h1 = document.querySelectorAll('h1').length;
  res.enlacesSinTexto = Array.from(document.links).filter(a=>!a.textContent.trim() && !a.getAttribute('aria-label')).length;
  res.anclasRotas = Array.from(document.querySelectorAll('a[href^="#"]'))
    .map(a=>a.getAttribute('href')).filter(h=>h.length>1 && !document.querySelector(h));
  res.botonesSinNombre = Array.from(document.querySelectorAll('button'))
    .filter(x=>!x.textContent.trim() && !x.getAttribute('aria-label')).length;
  res.lang = document.documentElement.lang;
  res.titulo = document.title.length;
  res.meta = (document.querySelector('meta[name=description]')||{}).content?.length || 0;
  res.jsonld = (()=>{ try { const j=JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent); return j['@type']+'/'+j.name; } catch(e){ return 'INVÁLIDO: '+e.message; } })();
  return res;
});
t(audit.imgSinAlt.length===0, 'todas las imágenes tienen alt' + (audit.imgSinAlt.length?': falta en '+audit.imgSinAlt.join(','):''));
t(audit.idsDuplicados.length===0, 'sin ids duplicados' + (audit.idsDuplicados.length?': '+audit.idsDuplicados.join(','):''));
t(audit.h1===1, 'exactamente un h1 (hay '+audit.h1+')');
t(audit.enlacesSinTexto===0, 'todos los enlaces tienen nombre accesible');
t(audit.botonesSinNombre===0, 'todos los botones tienen nombre accesible');
t(audit.anclasRotas.length===0, 'sin anclas rotas' + (audit.anclasRotas.length?': '+audit.anclasRotas.join(','):''));
t(audit.lang==='es', 'lang="es"');
t(audit.titulo>20 && audit.titulo<75, 'longitud del <title> ('+audit.titulo+')');
t(audit.meta>80 && audit.meta<300, 'longitud de la meta descripción ('+audit.meta+')');
t(!String(audit.jsonld).startsWith('INVÁLIDO'), 'JSON-LD válido → '+audit.jsonld);
await ctx.close();

// ---------- Móvil: menú hamburguesa y barra inferior ----------
ctx = await b.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
p = await ctx.newPage();
await p.goto(BASE + '/index.html', {waitUntil:'load'});
await p.waitForTimeout(500);
t(await p.locator('.nav__brand span').isVisible(), 'el nombre de la marca se ve en móvil');
t(await p.locator('#drawer').evaluate(d=>getComputedStyle(d).transform !== 'none'), 'el menú arranca cerrado');
await p.locator('#burger').tap();
await p.waitForTimeout(400);
t(await p.locator('#drawer').getAttribute('data-open') === 'true', 'la hamburguesa abre el menú');
t(await p.locator('#burger').getAttribute('aria-expanded') === 'true', 'aria-expanded se actualiza');
await p.locator('#drawer a[href="#tarifas"]').tap();
await p.waitForTimeout(600);
t(await p.locator('#drawer').getAttribute('data-open') === 'false', 'al elegir una sección el menú se cierra');
await p.evaluate(()=>window.scrollTo({top:900,behavior:'instant'}));
await p.waitForTimeout(500);
t(await p.locator('#mobile-bar').evaluate(e=>e.classList.contains('is-visible')), 'la barra inferior aparece al bajar');
// Zona de toque mínima de los botones principales
const pequenyos = await p.evaluate(()=>Array.from(document.querySelectorAll('.mobile-bar .btn, .nav__burger'))
  .filter(e=>{const r=e.getBoundingClientRect(); return r.height<44;}).length);
t(pequenyos===0, 'los controles táctiles miden 44px o más');
await ctx.close();
await b.close();

console.log('CORRECTO ('+ok.length+'):');   ok.forEach(x=>console.log('  ✔ '+x));
if (bad.length) { console.log('\nFALLOS ('+bad.length+'):'); bad.forEach(x=>console.log('  ✘ '+x)); process.exitCode=1; }
else console.log('\nTodas las comprobaciones pasan.');
