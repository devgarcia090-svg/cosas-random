// Página de la carta: pintado, buscador y filtro de alérgenos.

iniciarPagina('/carta');

const ALERGENOS = window.ALERGENOS;

// Abreviaturas para las etiquetas de cada plato (se imprimen mejor que los emojis).
const SIGLAS = {
  gluten: 'GLU', trigo: 'TRI', leche: 'LÁC', huevo: 'HUE', pescado: 'PES',
  crustaceos: 'CRU', moluscos: 'MOL', soja: 'SOJ', sulfitos: 'SUL', apio: 'API',
  sesamo: 'SÉS', frutos: 'FRU', cacahuetes: 'CAC', mostaza: 'MOS', altramuces: 'ALT'
};

// Filtros rápidos: los que más se piden en sala.
const FILTROS = [
  { id: 'gluten', etiqueta: 'Sin gluten', incluye: ['gluten', 'trigo'] },
  { id: 'leche', etiqueta: 'Sin lácteos', incluye: ['leche'] },
  { id: 'huevo', etiqueta: 'Sin huevo', incluye: ['huevo'] },
  { id: 'marisco', etiqueta: 'Sin marisco', incluye: ['crustaceos', 'moluscos'] },
  { id: 'pescado', etiqueta: 'Sin pescado', incluye: ['pescado'] },
  { id: 'frutos', etiqueta: 'Sin frutos secos', incluye: ['frutos', 'cacahuetes'] },
  { id: 'soja', etiqueta: 'Sin soja', incluye: ['soja'] }
];

const contenedor = document.querySelector('[data-carta]');
const vacio = document.querySelector('[data-vacio]');
const avisoFiltro = document.querySelector('[data-aviso-filtro]');
const activos = new Set();

const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function etiquetasAlergenos(plato) {
  const partes = [];

  for (const a of plato.a || []) {
    const info = ALERGENOS[a];
    if (info) partes.push(`<span class="alergeno" title="Contiene ${info.nombre.toLowerCase()}">${SIGLAS[a] || a}</span>`);
  }
  for (const a of plato.sin || []) {
    const info = ALERGENOS[a];
    if (info) partes.push(`<span class="alergeno alergeno--libre" title="Sin ${info.nombre.toLowerCase()}">Sin ${info.nombre.toLowerCase()}</span>`);
  }
  for (const e of plato.esp || []) {
    partes.push(`<span class="alergeno alergeno--especial" title="Plato ${e}">${e}</span>`);
  }
  // Nunca damos a entender que un plato es inocuo si no está declarado.
  if (!partes.length) {
    partes.push('<span class="alergeno alergeno--sin-datos" title="Pregunta al personal">Alérgenos sin declarar</span>');
  }
  return `<div class="alergenos">${partes.join('')}</div>`;
}

function pintarPrecios(plato) {
  const precios = plato.p;
  if (precios.length === 1) {
    return {
      linea: `<span class="plato__puntos"></span><span class="plato__precio">${euros(precios[0].v)}</span>`,
      extra: ''
    };
  }
  return {
    linea: '',
    extra: `<div class="plato__variantes">${precios
      .map((p) => `<span class="plato__variante">${escapar(p.l)} <b>${euros(p.v)}</b></span>`)
      .join('')}</div>`
  };
}

contenedor.innerHTML = window.CARTA.map((cat) => `
  <section class="grupo" id="${cat.id}">
    <div class="grupo__titulo">
      <span aria-hidden="true">${cat.icono}</span>
      <h2>${escapar(cat.nombre)}</h2>
    </div>
    ${cat.nota ? `<p class="grupo__nota">${escapar(cat.nota)}</p>` : ''}
    <div class="platos">
      ${cat.platos.map((p) => {
        const { linea, extra } = pintarPrecios(p);
        const contiene = [...(p.a || [])].join(' ');
        return `
        <article class="plato" data-busqueda="${escapar((p.n + ' ' + (p.d || '')).toLowerCase())}"
                 data-contiene="${contiene}" data-declarado="${p.a || p.sin ? 'si' : 'no'}">
          <div class="plato__linea">
            <span class="plato__nombre">${escapar(p.n)}</span>${linea}
          </div>
          ${p.d ? `<p class="plato__desc">${escapar(p.d)}</p>` : ''}
          ${extra}
          ${etiquetasAlergenos(p)}
        </article>`;
      }).join('')}
    </div>
  </section>`).join('');

document.querySelector('[data-categorias]').innerHTML = window.CARTA
  .map((c) => `<a href="#${c.id}">${escapar(c.nombre)}</a>`).join('');

document.querySelector('[data-filtros]').innerHTML = FILTROS
  .map((f) => `<button class="filtro" type="button" data-filtro="${f.id}" aria-pressed="false">${f.etiqueta}</button>`)
  .join('');

document.querySelector('[data-leyenda]').innerHTML = Object.entries(ALERGENOS)
  .map(([clave, info]) => `
    <div class="leyenda__fila">
      <span class="alergeno">${SIGLAS[clave] || clave}</span>
      <span>${info.icono} ${info.nombre}</span>
    </div>`).join('');

const md = window.MENU_DIARIO;
document.querySelector('[data-menu-dia]').innerHTML = `
  <p class="antetitulo">De martes a viernes</p>
  <h2 style="margin-bottom:.2rem">Menú diario</h2>
  <p class="menu-dia__precio">${euros(md.precio)}</p>
  <p class="tenue">${md.incluye}</p>
  <div class="rejilla rejilla--3" style="margin-top:1.4rem">
    <div><h4>Primeros</h4><ul>${md.primeros.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    <div><h4>Segundos</h4><ul>${md.segundos.map((x) => `<li>${x}</li>`).join('')}</ul></div>
    <div><h4>Postre</h4><ul>${md.postres.map((x) => `<li>${x}</li>`).join('')}</ul></div>
  </div>`;

// --- Buscador y filtros ---

function aplicar() {
  const texto = document.getElementById('buscar').value.trim().toLowerCase();
  const excluidos = new Set([...activos].flatMap((id) => FILTROS.find((f) => f.id === id).incluye));

  let visibles = 0;
  let sinDeclarar = 0;

  for (const grupo of contenedor.querySelectorAll('.grupo')) {
    let enGrupo = 0;
    for (const plato of grupo.querySelectorAll('.plato')) {
      const contiene = plato.dataset.contiene ? plato.dataset.contiene.split(' ') : [];
      const chocaFiltro = contiene.some((a) => excluidos.has(a));
      const coincideTexto = !texto || plato.dataset.busqueda.includes(texto);
      const visible = coincideTexto && !chocaFiltro;

      plato.classList.toggle('plato--oculto-filtro', !visible);
      if (visible) {
        enGrupo++;
        if (excluidos.size && plato.dataset.declarado === 'no') sinDeclarar++;
      }
    }
    grupo.classList.toggle('oculto', enGrupo === 0);
    visibles += enGrupo;
  }

  vacio.classList.toggle('oculto', visibles > 0);

  if (excluidos.size && sinDeclarar) {
    avisoFiltro.hidden = false;
    avisoFiltro.innerHTML = `<strong>Atención:</strong> ${sinDeclarar} de los platos que ves no tienen
      los alérgenos declarados en la carta, así que no se han podido filtrar.
      Consúltanos antes de pedirlos.`;
  } else {
    avisoFiltro.hidden = true;
  }
}

document.getElementById('buscar').addEventListener('input', aplicar);

document.querySelector('[data-filtros]').addEventListener('click', (e) => {
  const boton = e.target.closest('[data-filtro]');
  if (!boton) return;

  const id = boton.dataset.filtro;
  activos.has(id) ? activos.delete(id) : activos.add(id);
  boton.setAttribute('aria-pressed', String(activos.has(id)));
  aplicar();
});

// Resalta en la barra la categoría que se está viendo
const enlaces = [...document.querySelectorAll('.categorias a')];
const observador = new IntersectionObserver((entradas) => {
  for (const e of entradas) {
    if (!e.isIntersecting) continue;
    const activo = enlaces.find((a) => a.getAttribute('href') === '#' + e.target.id);
    enlaces.forEach((a) => a.classList.toggle('activa', a === activo));
    activo?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }
}, { rootMargin: '-140px 0px -70% 0px' });

contenedor.querySelectorAll('.grupo').forEach((g) => observador.observe(g));
