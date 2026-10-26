# Informe QA · LA CORREA · @maya.rottweiler13

Generado: 2026-10-26 17:46 · fecha de publicación usada: 2026-10-26 · días de Maya: 2056

## Material y placeholders pendientes

Falta material de Dani. Cada plano ausente aparece en el vídeo como tarjeta gris «FALTA PLANO» con su nombre; no se ha inventado ni generado nada de Maya.

| Archivo | Uso / sustitución |
|---|---|
| `audio/locucion.wav` | locución de Dani: se monta sin voz, con los rótulos como hilo |
| `clips/01_gancho.*` | Maya corre hacia la lente a ras de suelo, frena a centímetros y lame la cámara (60 fps) |
| `clips/02_payasa.*` | Maya en su momento más ridículo |
| `clips/05_humano.*` | Dani pregunta y Maya «contesta» con su ruidito (sonido directo) |
| `clips/06_humor.*` | plano corto · pilar HUMOR |
| `clips/06_aventura.*` | plano corto · pilar AVENTURA |
| `clips/06_mitos.*` | plano corto · pilar MITOS ROTOS |
| `clips/06_furgo.*` | plano corto · pilar VIDA EN FURGO |
| `clips/08_salto_furgo.*` | Maya salta a la Fiat Talento, aterriza, se sienta y mira a cámara (60 fps) |
| `clips/03_cachorra.*` | foto de cachorra (misma pose que la adulta) |
| `clips/03_adulta.*` | foto de adulta (misma pose que la cachorra) |
| `clips/04_virales/*` | capturas o clips de sus vídeos con más visitas |
| `audio/musica.wav` | música con licencia (100 BPM); se usa base provisional sintetizada |

Render a **30 fps**.

- Sin locución: tiempos de escena nominales del brief.
- Mezcla normalizada: -14.2 LUFS, pico real -1.6 dBTP (objetivo -14.0 LUFS / -1.5 dBTP).

## 1. ffprobe

| Archivo | Resolución | fps | Duración | Vídeo | Bitrate vídeo | Audio | Tamaño |
|---|---|---|---|---|---|---|---|
| `maya_la_correa_9x16.mp4` | 1080×1920 | 30 | 22.00 s | h264 High yuv420p | 4.8 Mbps | aac 48000 Hz 2 canales 237 kbps | 13.8 MB |
| `maya_la_correa_9x16_sin_texto.mp4` | 1080×1920 | 30 | 22.00 s | h264 High yuv420p | 3.9 Mbps | aac 48000 Hz 2 canales 237 kbps | 11.5 MB |

Resultado: ✅ correcto (esperado 1080×1920, 30 fps, ~22 s, H.264 High yuv420p, AAC 48 kHz).

Nota: el bitrate medio (4.8 Mbps) queda por debajo de 16 Mbps porque x264 no necesita más para los placeholders planos; con el metraje real subirá hacia el objetivo de 18 Mbps (techo 20 Mbps).

## 2. Sonoridad

| Medida | Estéreo | Mono (L+R)/2 |
|---|---|---|
| Integrado | -14.2 LUFS | -17.2 LUFS |
| Pico real | -1.5 dBTP | -1.5 dBTP |
| LRA | 4.7 LU | 4.7 LU |

Resultado: ✅ objetivo −14 LUFS ±1 y ≤ −1 dBTP (medido sobre el AAC final). Mono (L+R)/2 frente a estéreo: -3.0 LU; con canales idénticos la cifra esperada es −3,0 LU, así que la desviación es +0.0 LU (sin cancelaciones de fase).

## 3. Fotogramas negros y saltos

blackdetect (pix_th 0.03, ≥ 1 fotograma): [(0.0, 0.3)].
El negro de 0–0,3 s es intencionado (arranque con solo el collar). ✅ Sin negros accidentales.

Cambios bruscos de imagen (diferencia media > 18/255): 8; todos en cortes de escena, barridos de la 06 o impactos.

## 4. Sincronía de golpes (tolerancia ±2 fotogramas)

| Evento | Imagen | Golpe sonoro | Desfase |
|---|---|---|---|
| Frenazo (01) | 1.200 s | 1.200 s | +0.0 fot. ✅ |
| Acierto (02) | 4.300 s | 4.298 s | -0.1 fot. ✅ |
| Llegada a 24K (04) | 10.000 s | 10.000 s | +0.0 fot. ✅ |
| Aterrizaje (08) | 18.300 s | 18.300 s | +0.0 fot. ✅ |

## 5. Rótulos y zona segura (x 90–900, y 220–1450)

Comprobación automática de 22 rótulos en su posición asentada, fotograma a fotograma: ✅ todos dentro de la zona segura.

## 6. Fotogramas clave

En `out/frames/`: `01_inicio.png` (0.55 s), `02_frenazo.png` (1.23 s), `03_cambio_fichas.png` (4.10 s), `04_24k.png` (10.12 s), `05_lema.png` (17.80 s), `06_aterrizaje.png` (18.85 s), `07_firma.png` (21.00 s). `hoja_contacto_qa.png` los muestra juntos con la zona segura (cian) y el tercio inferior (magenta).

## 7. Revisión visual manual y defectos corregidos

Revisé los fotogramas clave y hojas de prueba de cada escena (no solo las métricas):

| Defecto encontrado | Corrección |
|---|---|
| 06: el rótulo saliente y el entrante se solapaban durante el barrido («HUMOAVENTURA») | El entrante aparece cuando el saliente ya ha salido; el muelle de entrada se amortiguó más (rebote de ~25 px en vez de ~80 px, que se salía de la zona segura) |
| 02: PELIGROSA seguía en su sitio cuando entraba PAYASA | El lanzamiento se aceleró (sale en 0,25 s) y los contactos magnéticos se retrasaron a 3,72 / 3,85 / 3,98 s |
| 02: el trozo de correa en reposo parecía un «gancho» suelto | En reposo queda como un punto caoba en el inicio de la barra de progreso |
| 01/08: el rebote del microzoom bajaba de 1× y el render fallaba (y habría mostrado bordes) | El rebote amortiguado solo acerca, nunca aleja |
| 05: la forma de onda chocaba con la etiqueta del placeholder | Etiquetas de placeholder bajadas al tercio inferior |
| QA: el detector de golpes daba +2,5 fot. en el frenazo y −2,9 en el acierto (falsos positivos: cruces por cero del subgrave y marimba de la música en la misma banda) | Envolvente con máximo de 8 ms y banda estrecha de 2,86–2,92 kHz (parcial propio del sonido de acierto); los cuatro golpes quedan en 0 fotogramas |

## 8. Prueba final (sección 10)

- **¿El primer segundo para el scroll?** Con placeholders, no se puede juzgar: depende del plano 01 real (Maya hacia la lente). La estructura sí está: negro + collar 0,3 s, rótulo palabra a palabra desde 0,4 s.
- **¿Se entiende sin sonido?** Sí: sin locución, los rótulos cuentan toda la historia (mito → payasa de 38 kg → 2.056 días → 24K+ → lema → usuario).
- **¿Se reconoce a Maya y la marca sin leer el usuario?** Pendiente del metraje real; la correa caoba y la paleta de pilares sí son constantes en todas las escenas.
- **¿Transiciones por movimiento?** Sí: la correa enlaza cada escena, barridos con desenfoque en la 06, ningún fundido genérico.
- **¿El aterrizaje cierra con sensación de final?** Golpe grave + sonido invertido + microimpacto + revelado del usuario están sincronizados al fotograma; la sensación final depende del clip 08 real.

## 9. Limitaciones

- **Todo el material de Dani falta**: este render es una maqueta animada completa (animatic) con placeholders. Al copiar los clips en `clips/` y `audio/` y relanzar `python3 render.py`, todo se recalcula.
- La música es una **base provisional** sintetizada (marimba, palmas y subgrave a 100 BPM) solo para validar la mezcla; se sustituye sola al existir `audio/musica.wav`. Para que los golpes caigan en el compás, indicar en `config.json → musica.primer_tiempo_fuerte` el segundo del primer tiempo fuerte del tema.
- Sin `05_humano`, la forma de onda reacciona a una envolvente de prueba; con el clip real, reacciona a su audio.
- Con clips reales hay que fijar en `config.json` `momento_frenazo` (01) y `momento_aterrizaje` (08), y `punto_frenazo`/`punto_aterrizaje` si Maya no frena en el centro.
- El encoder AAC nativo de ffmpeg da ~240 kbps reales aunque se piden 320 kbps (no gasta más con material tan limpio).
- Clips HDR de iPhone (HLG/Dolby Vision) no se tonemapean: exportarlos en SDR antes.
- Sin `assets/logos/` no se usan logos de marcas (alternativa: capturas de virales).

