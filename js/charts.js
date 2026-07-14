/*
 * charts.js — Gráficas SVG ligeras, sin dependencias externas.
 * Funciona offline y se adapta al tema claro/oscuro vía variables CSS.
 */

function cssVar(name, fallback) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/*
 * Gráfica de líneas.
 * series: [{ label, color, points: [{x: 'YYYY-MM-DD', y: number}] }]
 */
function lineChart(container, series, opts = {}) {
  container.innerHTML = '';
  const width = container.clientWidth || 600;
  const height = opts.height || 260;
  const pad = { top: 16, right: 16, bottom: 28, left: 40 };

  const allPoints = series.flatMap(s => s.points);
  if (!allPoints.length) {
    container.innerHTML = '<p class="empty">Sin datos todavía. Registra alguna medición para ver la evolución.</p>';
    return;
  }

  const dates = [...new Set(allPoints.map(p => p.x))].sort();
  const xIndex = new Map(dates.map((d, i) => [d, i]));
  const nX = Math.max(1, dates.length - 1);

  let minY = Math.min(...allPoints.map(p => p.y));
  let maxY = Math.max(...allPoints.map(p => p.y));
  if (opts.minY != null) minY = Math.min(minY, opts.minY);
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const rangeY = maxY - minY;
  minY -= rangeY * 0.1;
  maxY += rangeY * 0.1;

  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const sx = i => pad.left + (nX === 0 ? plotW / 2 : (i / nX) * plotW);
  const sy = y => pad.top + plotH - ((y - minY) / (maxY - minY)) * plotH;

  const grid = cssVar('--border', '#2a2f3a');
  const text = cssVar('--text-muted', '#8b93a7');

  let svg = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" role="img">`;

  // Líneas horizontales de referencia
  const ticks = 4;
  for (let t = 0; t <= ticks; t++) {
    const yVal = minY + (t / ticks) * (maxY - minY);
    const yPix = sy(yVal);
    svg += `<line x1="${pad.left}" y1="${yPix}" x2="${width - pad.right}" y2="${yPix}" stroke="${grid}" stroke-width="1"/>`;
    svg += `<text x="${pad.left - 6}" y="${yPix + 4}" fill="${text}" font-size="10" text-anchor="end">${Math.round(yVal * 10) / 10}</text>`;
  }

  // Etiquetas de fecha (primera, media, última)
  const labelIdx = dates.length <= 3 ? dates.map((_, i) => i) : [0, Math.floor(nX / 2), nX];
  for (const i of labelIdx) {
    const d = dates[i];
    const short = d.slice(5); // MM-DD
    svg += `<text x="${sx(i)}" y="${height - 8}" fill="${text}" font-size="10" text-anchor="middle">${short}</text>`;
  }

  // Series
  for (const s of series) {
    const pts = [...s.points].sort((a, b) => a.x.localeCompare(b.x));
    if (!pts.length) continue;
    const coords = pts.map(p => [sx(xIndex.get(p.x)), sy(p.y)]);
    const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
    svg += `<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
    for (const c of coords) {
      svg += `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="3" fill="${s.color}"/>`;
    }
  }

  svg += '</svg>';
  container.innerHTML = svg;
}

/*
 * Anillo de progreso (para calorías / macros del día).
 */
function progressRing(value, target, color, label, sublabel) {
  const pct = target > 0 ? Math.min(1, value / target) : 0;
  const r = 42, c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const track = cssVar('--border', '#2a2f3a');
  const over = value > target;
  const strokeColor = over ? cssVar('--danger', '#ef4444') : color;

  return `
  <div class="ring">
    <svg viewBox="0 0 100 100" width="110" height="110">
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="${track}" stroke-width="8"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="${strokeColor}" stroke-width="8"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
        transform="rotate(-90 50 50)"/>
      <text x="50" y="46" text-anchor="middle" font-size="17" font-weight="700" fill="var(--text)">${Math.round(value)}</text>
      <text x="50" y="62" text-anchor="middle" font-size="9" fill="var(--text-muted)">/ ${Math.round(target)}</text>
    </svg>
    <div class="ring-label">${label}</div>
    <div class="ring-sub">${sublabel || ''}</div>
  </div>`;
}

window.Charts = { lineChart, progressRing };
