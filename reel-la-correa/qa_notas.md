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
