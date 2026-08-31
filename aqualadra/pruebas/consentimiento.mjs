import { chromium } from 'playwright';

// Ejecutar con el sitio servido en local:
//   npx http-server aqualadra -p 8899 -s &
//   BASE=http://127.0.0.1:8899 node aqualadra/pruebas/consentimiento.mjs
const B = process.env.BASE || 'http://127.0.0.1:8899';
const b = await chromium.launch();
const ok=[], bad=[]; const t=(c,l)=>(c?ok:bad).push(l);

// ---------- Consentimiento: nada de Google antes de pedirlo ----------
let ctx = await b.newContext({viewport:{width:1440,height:1000}});
let p = await ctx.newPage();
const googleReqs = [];
p.on('request', r => { if (/google\.com|gstatic|googleapis/.test(r.url())) googleReqs.push(r.url().slice(0,60)); });
await p.goto(B+'/index.html', {waitUntil:'load'});
await p.evaluate(async()=>{document.documentElement.style.scrollBehavior='auto';
  for(let y=0;y<document.body.scrollHeight;y+=300){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,80));}});
await p.waitForTimeout(1500);
t(googleReqs.length===0, 'sin peticiones a Google antes de consentir'+(googleReqs.length?': '+googleReqs.join(', '):''));
t(await p.locator('#calendario-slot .consent').isVisible(), 'el calendario muestra el aviso de consentimiento');
t(await p.locator('#mapa-slot .consent').isVisible(), 'el mapa muestra el aviso de consentimiento');
t(await p.locator('#calendario-slot iframe').count()===0, 'no hay iframe del calendario todavía');
t(await p.locator('#mapa-slot iframe').count()===0, 'no hay iframe del mapa todavía');
// WhatsApp sigue disponible sin consentir
t(await p.locator('#calendario-slot a[href*="wa.me"]').isVisible(), 'alternativa de WhatsApp visible sin consentir');

// Al aceptar, se cargan los dos
await p.locator('#calendario-slot .consent button').click();
await p.waitForTimeout(900);
t(await p.locator('#calendario-slot iframe').count()===1, 'al aceptar aparece el iframe del calendario');
t(await p.locator('#mapa-slot iframe').count()===1, 'al aceptar aparece también el del mapa');
const guardado = await p.evaluate(()=>{try{return localStorage.getItem('aqualadra:consiente-google')}catch(e){return 'ERROR'}});
t(guardado==='si', 'el consentimiento queda guardado ('+guardado+')');

// Se recuerda al recargar
await p.reload({waitUntil:'load'});
await p.evaluate(()=>document.getElementById('reservar').scrollIntoView());
await p.waitForTimeout(900);
t(await p.locator('#calendario-slot iframe').count()===1, 'al recargar ya no vuelve a preguntar');

// La página de cookies permite retirarlo
await p.goto(B+'/cookies.html', {waitUntil:'load'});
await p.locator('#olvidar-consentimiento').click();
await p.waitForTimeout(300);
const tras = await p.evaluate(()=>{try{return localStorage.getItem('aqualadra:consiente-google')}catch(e){return 'ERROR'}});
t(tras===null, 'el botón de la política de cookies retira el consentimiento');

// ---------- Deslanadora ----------
await p.goto(B+'/index.html', {waitUntil:'load'});
const maq = await p.locator('.machine').innerText();
t(/Deslanadora/i.test(maq) && /3 €/.test(maq), 'la deslanadora aparece con su precio');
t(/Lavado de mascota/.test(maq) && /6 €/.test(maq), 'el lavado sigue a 6 €');
// El JSON-LD es un @graph con varias entidades: hay que buscar el negocio.
const ld = await p.evaluate(()=>JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent));
const negocio = (ld['@graph']||[]).find(x => [].concat(x['@type']).includes('LocalBusiness')) || {};
const catalogo = (negocio.hasOfferCatalog||{}).itemListElement || [];
t(catalogo.some(o => /Deslanadora/i.test(o.itemOffered.name) && o.priceSpecification.price === '3'),
  'la deslanadora está en el JSON-LD, a 3 €');

// ---------- Animaciones ----------
const anim = await p.evaluate(()=>{
  const burbuja = document.querySelector('.bubbles span');
  const onda = document.querySelector('.wave__g');
  return {
    burbujaAnim: getComputedStyle(burbuja).animationName,
    ondaAnim: getComputedStyle(onda).animationName,
    escalonados: document.querySelectorAll('[data-escalonar] > .reveal').length,
    conRetraso: Array.from(document.querySelectorAll('[data-escalonar] > .reveal')).filter(e=>e.style.transitionDelay && e.style.transitionDelay!=='0ms').length,
  };
});
t(anim.burbujaAnim==='subir', 'las burbujas usan la animación de subida');
// El oleaje perpetuo se retiró al pasar la web a un registro más sobrio:
// una animación que no para nunca y no comunica nada compite con el
// contenido. La onda tiene que quedarse quieta.
t(anim.ondaAnim==='none' || !anim.ondaAnim, 'los separadores NO tienen animación en bucle');
t(anim.escalonados>=20, 'hay '+anim.escalonados+' elementos con aparición escalonada');
t(anim.conRetraso>=15, anim.conRetraso+' de ellos con retraso propio');

// La pausa fuera de pantalla
await p.evaluate(()=>window.scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
await p.waitForTimeout(700);
const pausa = await p.evaluate(()=>{
  const b=document.querySelector('.hero .bubbles');
  return {fuera:b.classList.contains('fuera-de-vista'), estado:getComputedStyle(b.querySelector('span')).animationPlayState};
});
t(pausa.fuera && pausa.estado==='paused', 'las burbujas del hero se pausan al salir de pantalla');

// Pestañas: el panel que estaba oculto se ve al activarlo
await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
await p.locator('#tarifas').scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await p.locator('#tab-p4').click();
await p.waitForTimeout(700);
const opacidad = await p.evaluate(()=>{
  const c=document.querySelectorAll('#panel-p4 .reveal');
  if(!c.length) return 1;
  return Math.min(...Array.from(c).map(e=>+getComputedStyle(e).opacity));
});
t(opacidad>0.9, 'el contenido del panel de gatos se ve al cambiar de pestaña (opacidad '+opacidad+')');
await ctx.close();

// ---------- Reducir movimiento ----------
ctx = await b.newContext({viewport:{width:1440,height:1000}, reducedMotion:'reduce'});
p = await ctx.newPage();
await p.goto(B+'/index.html', {waitUntil:'load'});
await p.waitForTimeout(600);
const red = await p.evaluate(()=>{
  const ocultos = Array.from(document.querySelectorAll('.reveal')).filter(e=>+getComputedStyle(e).opacity<0.9).length;
  return {ocultos, dur:getComputedStyle(document.querySelector('.bubbles span')).animationDuration,
          foto:getComputedStyle(document.querySelector('.hero__photo')).animationName};
});
t(red.ocultos===0, 'con movimiento reducido no queda nada invisible');
t(parseFloat(red.dur)<0.01, 'las animaciones infinitas quedan neutralizadas ('+red.dur+')');
await ctx.close();

// ---------- Páginas legales ----------
ctx = await b.newContext({viewport:{width:1440,height:1000}});
p = await ctx.newPage();
for (const [f, titulo] of [['aviso-legal.html','Aviso legal'],['privacidad.html','Política de privacidad'],['cookies.html','Política de cookies']]) {
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(B+'/'+f, {waitUntil:'load'});
  const d = await p.evaluate(()=>({h1:document.querySelector('h1')?.innerText, rellenar:document.querySelectorAll('.rellenar').length,
    volver:!!document.querySelector('a[href="index.html"]'), h2:document.querySelectorAll('h2').length}));
  t(d.h1===titulo, f+': titular correcto');
  t(d.volver, f+': enlace de vuelta a la web');
  t(d.h2>=6, f+': '+d.h2+' apartados');
  t(errs.length===0, f+': sin errores de JS');
}
const rell = await p.goto(B+'/aviso-legal.html').then(()=>p.evaluate(()=>document.querySelectorAll('.rellenar').length));
t(rell>=4, 'el aviso legal marca '+rell+' datos por rellenar');
// Enlaces legales desde el pie de la portada
await p.goto(B+'/index.html', {waitUntil:'load'});
for (const f of ['aviso-legal.html','privacidad.html','cookies.html'])
  t(await p.locator(`.footer a[href="${f}"]`).count()===1, 'el pie enlaza a '+f);
await ctx.close();
await b.close();

console.log('CORRECTO ('+ok.length+'):'); ok.forEach(x=>console.log('  ✔ '+x));
if (bad.length){ console.log('\nFALLOS ('+bad.length+'):'); bad.forEach(x=>console.log('  ✘ '+x)); process.exitCode=1; }
else console.log('\nTodo pasa.');
