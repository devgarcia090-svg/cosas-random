# LA CORREA · Reel 9:16 para @maya.rottweiler13

Pipeline reproducible para montar el Reel/TikTok del brief *LA CORREA*: montaje, motion graphics, tipografía, diseño sonoro y mezcla, todo por código.

## Pipeline elegido

**Python + Pillow + numpy + ffmpeg**, sin dependencias exóticas:

- **Pillow**: cada fotograma se compone en Python. Las formas vectoriales (la correa, tarjetas, fichas) se dibujan en máscaras a 2x y se reducen (antialiasing). Tipografía **Inter Black / Bold** (OFL), incluida en `src/fonts/`.
- **numpy**: barridos con desenfoque de movimiento, síntesis de todos los efectos de sonido (originales, sin librerías de terceros), mezcla, ducking y limitador de pico real.
- **ffmpeg**: decodifica los clips (recorte a 1080×1920), codifica H.264 High yuv420p + AAC 48 kHz y mide sonoridad (EBU R128).

Se descartó Remotion para no exigir Node + Chrome a quien re-renderice; Pillow basta para esta pieza y todo queda en un solo lenguaje.

## Uso

```bash
pip install pillow numpy      # y ffmpeg/ffprobe en el PATH
python3 render.py             # audio + máster + versión sin texto + QA (~2 min)
python3 render.py --rapido    # solo el máster, para iterar
python3 render.py --qa        # solo el control de calidad
```

Salidas en `out/`: `maya_la_correa_9x16.mp4`, `maya_la_correa_9x16_sin_texto.mp4`, `frames/` (fotogramas clave y hoja de contacto con la zona segura) e `informe_qa.md`.

## Material

Copiar el material de Dani con estos nombres (cualquier extensión de vídeo/foto habitual):

```
clips/01_gancho.mp4   clips/02_payasa.mp4   clips/03_cachorra.jpg   clips/03_adulta.jpg
clips/04_virales/     (capturas o clips; se usan hasta 5)
clips/05_humano.mp4   clips/06_humor.mp4    clips/06_aventura.mp4   clips/06_mitos.mp4   clips/06_furgo.mp4
clips/08_salto_furgo.mp4
audio/locucion.wav    audio/musica.wav
assets/logos/         (opcional, solo con permiso)   assets/fuente/ (opcional: .ttf/.otf que sustituye a Inter Black)
```

Lo que falte sale como tarjeta gris **FALTA PLANO** y se lista en el informe. Nunca se genera a Maya.

- **Frecuencia**: 60 fps si todos los clips son de 60; si no, 30 fps (forzable en `config.json → render.fps`).
- **Locución**: si existe, se detectan los inicios de frase por energía/silencio y las escenas se reajustan a las anclas del brief (`locucion.anclas`). Si no, tiempos nominales y sin voz.
- **Música**: se corta en compases para que un tiempo fuerte caiga en el frenazo, en la llegada a 24K y en el aterrizaje. Indicar `musica.primer_tiempo_fuerte` (s) y `bpm`. Sin archivo, se usa una base provisional sintetizada.

## Cambiar textos, datos o tiempos (`config.json`)

- `textos`: todos los rótulos (frase de la 01, fichas de la 02, etiquetas, pilares, lema).
- `usuario`, `seguidores`, `seguidores_final`.
- `fecha_nacimiento` / `fecha_publicacion` (`null` = hoy): el contador de días se calcula solo (26/10/2026 → 2.056).
- `clips.*.inicio`: segundo del clip desde el que se usa. En 01 y 08 basta con indicar `momento_frenazo` / `momento_aterrizaje` (segundo del clip donde ocurre) y el corte se calcula para que caiga en su golpe sonoro. `punto_frenazo` / `punto_aterrizaje`: dónde ocurre en el encuadre (centro del microzoom y nacimiento de la correa).
- `tiempos`: inicios de escena y momentos del frenazo, de la respuesta de la 05 y del aterrizaje.

## Código

| Archivo | Qué hace |
|---|---|
| `render.py` | Orquesta: inventario de material, audio, render en paralelo de las dos versiones, QA |
| `src/timeline.py` | Escenas, eventos sincronizados, ajuste a la locución, días de Maya |
| `src/scenes.py` | Las 9 escenas (una función por escena, tiempos locales) |
| `src/gfx.py` | Easing, muelles, capas vectoriales, texto, la correa, placeholders |
| `src/media.py` | Lectura de clips, fotos y audio; registro de lo que falta |
| `src/audio.py` | Efectos sintetizados, música provisional, mezcla, ducking, −14 LUFS / −1 dBTP |
| `src/qa.py` | ffprobe, sonoridad, negros, saltos, sincronía, zona segura, fotogramas → `out/informe_qa.md` |
| `qa_notas.md` | Notas de la revisión visual manual (se incluyen en el informe) |
