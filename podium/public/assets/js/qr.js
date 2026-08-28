// Generador del cartel con el código QR de la carta.

iniciarPagina('/qr');

const campoDestino = document.getElementById('destino');
const campoUrl = document.getElementById('url');
const campoTitulo = document.getElementById('titulo');
const contenedorCodigo = document.querySelector('[data-codigo]');
const textoTitulo = document.querySelector('[data-titulo]');
const piePlantilla = document.querySelector('[data-pie-tarjeta]');

const base = location.origin + '/';
const urlDestino = () => new URL(campoDestino.value, base).href;

/** Dibuja el QR como SVG: se imprime nítido a cualquier tamaño. */
function generarSvg(texto) {
  const qr = qrcode(0, 'M'); // corrección de errores media: aguanta manchas y roces
  qr.addData(texto);
  qr.make();

  const modulos = qr.getModuleCount();
  const margen = 2;
  const lado = modulos + margen * 2;

  let trazado = '';
  for (let fila = 0; fila < modulos; fila++) {
    for (let col = 0; col < modulos; col++) {
      if (qr.isDark(fila, col)) trazado += `M${col + margen} ${fila + margen}h1v1h-1z`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" shape-rendering="crispEdges" role="img" aria-label="Código QR de la carta">
  <rect width="${lado}" height="${lado}" fill="#ffffff"/>
  <path d="${trazado}" fill="#12100e"/>
</svg>`;
}

function actualizar() {
  contenedorCodigo.innerHTML = generarSvg(campoUrl.value.trim() || urlDestino());
  textoTitulo.textContent = campoTitulo.value.trim() || 'Escanea y mira la carta';
  piePlantilla.textContent = (campoUrl.value || urlDestino()).replace(/^https?:\/\//, '').replace(/\/$/, '');
}

campoDestino.addEventListener('change', () => {
  campoUrl.value = urlDestino();
  actualizar();
});
campoUrl.addEventListener('input', actualizar);
campoTitulo.addEventListener('input', actualizar);

document.querySelector('[data-descargar]').addEventListener('click', () => {
  const svg = generarSvg(campoUrl.value.trim() || urlDestino());
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  enlace.download = 'qr-carta-podium.svg';
  enlace.click();
  URL.revokeObjectURL(enlace.href);
});

campoUrl.value = urlDestino();
actualizar();
