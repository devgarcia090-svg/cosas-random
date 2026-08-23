import { chromium } from 'playwright';

// Ejecutar con el sitio servido en local:
//   npx http-server aqualadra -p 8899 -s &
//   BASE=http://127.0.0.1:8899 node aqualadra/pruebas/contraste.mjs
const BASE = process.env.BASE || 'http://127.0.0.1:8899';
// PAGE=cookies.html para revisar una página concreta; por defecto, todas.
const PAGINAS = process.env.PAGE ? [process.env.PAGE]
  : ['index.html', 'aviso-legal.html', 'privacidad.html', 'cookies.html', '404.html'];

const b = await chromium.launch();
let totalFallos = 0;
for (const PAGINA of PAGINAS) {
const p = await (await b.newContext({viewport:{width:1440,height:1000}})).newPage();
await p.goto(BASE + '/' + PAGINA, {waitUntil:'load'});
await p.evaluate(async () => {
  document.documentElement.style.scrollBehavior='auto';
  for (let y=0;y<document.body.scrollHeight;y+=300){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,60));}
  window.scrollTo({top:0,behavior:'instant'});
});
await p.waitForTimeout(600);

const out = await p.evaluate(() => {
  const parse = c => { const m=c.match(/[\d.]+/g); return m?{r:+m[0],g:+m[1],b:+m[2],a:m[3]!==undefined?+m[3]:1}:null; };
  const L = ({r,g,b}) => { const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;}; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
  const ratio = (a,b) => { const la=L(a),lb=L(b); return (Math.max(la,lb)+.05)/(Math.min(la,lb)+.05); };
  const over = (fg,bg) => ({ r:fg.r*fg.a+bg.r*(1-fg.a), g:fg.g*fg.a+bg.g*(1-fg.a), b:fg.b*fg.a+bg.b*(1-fg.a), a:1 });

  function fondo(el) {
    let n = el, grad = false;
    while (n && n !== document.documentElement) {
      const s = getComputedStyle(n);
      if (/gradient/.test(s.backgroundImage)) grad = true;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0.95) return { color:c, grad };
      n = n.parentElement;
    }
    return { color:{r:255,g:255,b:255,a:1}, grad };
  }

  const fallos = [], gradientes = [];
  const nodos = document.querySelectorAll('body *');
  for (const el of nodos) {
    // solo elementos con texto propio y visible
    const propio = Array.from(el.childNodes).filter(n=>n.nodeType===3 && n.textContent.trim()).map(n=>n.textContent.trim()).join(' ');
    if (!propio) continue;
    const s = getComputedStyle(el);
    if (s.display==='none' || s.visibility==='hidden' || +s.opacity===0) continue;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    if (el.closest('[hidden]')) continue;

    const px = parseFloat(s.fontSize);
    const peso = +s.fontWeight || 400;
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const min = grande ? 3 : 4.5;

    const f = parse(s.color); const bgInfo = fondo(el);
    if (!f) continue;
    const fgFinal = f.a < 1 ? over(f, bgInfo.color) : f;
    const cr = ratio(fgFinal, bgInfo.color);

    const info = { texto: propio.slice(0,42), sel: el.tagName.toLowerCase()+'.'+(el.className||'').toString().split(' ')[0],
                   px: Math.round(px), peso, ratio: +cr.toFixed(2), min };
    if (bgInfo.grad) { gradientes.push(info); continue; }   // el degradado se revisa aparte
    if (cr < min) fallos.push(info);
  }
  return { fallos, gradientes, total: nodos.length };
});

const fmt = x => `  ${String(x.ratio).padStart(5)} (mín ${x.min})  ${x.px}px/${x.peso}  ${x.sel.padEnd(28)} "${x.texto}"`;
console.log(`\n=== ${PAGINA} — ${out.total} elementos revisados ===`);
console.log(`FALLOS DE CONTRASTE: ${out.fallos.length}`);
out.fallos.forEach(x=>console.log(fmt(x)));
if (out.gradientes.length) console.log(`sobre degradado (se revisan a mano): ${out.gradientes.length}`);
totalFallos += out.fallos.length;
await p.close();
}
await b.close();
console.log(`\nTotal de fallos de contraste: ${totalFallos}`);
if (totalFallos) process.exitCode = 1;
