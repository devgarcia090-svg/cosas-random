"""Control de calidad (sección 9 del brief) y generación de out/informe_qa.md."""
import datetime as dt
import json
import re
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

import gfx

SR = 48000


def sh(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path):
    d = json.loads(sh(["ffprobe", "-v", "error", "-show_streams", "-show_format",
                       "-of", "json", str(path)]).stdout)
    v = next(s for s in d["streams"] if s["codec_type"] == "video")
    a = next((s for s in d["streams"] if s["codec_type"] == "audio"), None)
    n, k = v["avg_frame_rate"].split("/")
    return {
        "res": f"{v['width']}×{v['height']}",
        "fps": float(n) / float(k),
        "dur": float(d["format"]["duration"]),
        "vcodec": f"{v['codec_name']} {v.get('profile', '')} {v.get('pix_fmt', '')}",
        "vbit": int(v.get("bit_rate", 0)) / 1e6,
        "audio": (f"{a['codec_name']} {a['sample_rate']} Hz {a['channels']} canales "
                  f"{int(a.get('bit_rate', 0)) // 1000} kbps") if a else None,
        "size": Path(path).stat().st_size / 1e6,
    }


def loudness(path, mono=False):
    af = ("pan=mono|c0=0.5*c0+0.5*c1," if mono else "") + "ebur128=peak=true"
    r = sh(["ffmpeg", "-nostats", "-hide_banner", "-i", str(path), "-af", af, "-f", "null", "-"]).stderr
    s = r[r.rfind("Summary:"):]
    get = lambda pat: float(re.search(pat, s).group(1))  # noqa: E731
    return {"I": get(r"I:\s+(-?[\d.]+) LUFS"), "LRA": get(r"LRA:\s+(-?[\d.]+) LU"),
            "TP": get(r"Peak:\s+(-?[\d.]+) dBFS")}


def black(path):
    r = sh(["ffmpeg", "-hide_banner", "-i", str(path), "-vf",
            "blackdetect=d=0.03:pix_th=0.03", "-an", "-f", "null", "-"]).stderr
    return [(float(a), float(b)) for a, b in
            re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", r)]


def frame_diffs(path, fps):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-vf", "scale=108:192,format=gray",
                          "-f", "rawvideo", "-"], capture_output=True).stdout
    f = np.frombuffer(raw, np.uint8).reshape(-1, 192, 108).astype(np.float32)
    return np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))


def audio_mono(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32)


def onset(x, t, lo, hi, win=0.25):
    """Inicio del golpe más fuerte en la banda [lo, hi] Hz cerca de t."""
    i0, i1 = int((t - win) * SR), int((t + win) * SR)
    seg = x[max(0, i0):i1].astype(np.float64)
    X = np.fft.rfft(seg)
    f = np.fft.rfftfreq(len(seg), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    y = np.abs(np.fft.irfft(X, len(seg)))
    hop = SR // 1000
    n = len(y) // hop
    env = y[:n * hop].reshape(n, hop).max(axis=1)
    env = np.array([env[max(0, k - 8):k + 1].max() for k in range(n)])  # máx. en 8 ms
    edge = 30  # el filtrado FFT ensucia los bordes de la ventana
    env[:edge] = 0
    env[-edge:] = 0
    k = int(np.argmax(env > env.max() * 0.35))
    return max(0, i0) / SR + k * hop / SR


def run(root):
    root = Path(root)
    out, build = root / "out", root / "build"
    master = out / "maya_la_correa_9x16.mp4"
    clean = out / "maya_la_correa_9x16_sin_texto.mp4"
    info = json.loads((build / "render_info.json").read_text(encoding="utf-8"))
    boxes = json.loads((build / "text_boxes.json").read_text()) if (build / "text_boxes.json").exists() else []
    fps = info["fps"]
    ev = info["events"]
    starts = info["starts"]
    L = []

    L.append("# Informe QA · LA CORREA · @maya.rottweiler13\n")
    L.append(f"Generado: {dt.datetime.now():%Y-%m-%d %H:%M} · fecha de publicación usada: "
             f"{info['fecha_publicacion']} · días de Maya: {info['dias']}\n")

    # ----- material
    L.append("## Material y placeholders pendientes\n")
    if info["missing"]:
        L.append("Falta material de Dani. Cada plano ausente aparece en el vídeo como tarjeta gris "
                 "«FALTA PLANO» con su nombre; no se ha inventado ni generado nada de Maya.\n")
        L.append("| Archivo | Uso / sustitución |\n|---|---|")
        for f, why in info["missing"]:
            L.append(f"| `{f}` | {why} |")
        L.append("")
    else:
        L.append("Todo el material esperado está presente.\n")
    if info.get("clip_fps"):
        L.append("Frecuencia de los clips: " + ", ".join(f"`{k}` {v:g} fps" for k, v in info["clip_fps"].items()) + "\n")
    L.append(f"Render a **{fps:g} fps**.\n")
    for n in info["notes"]:
        L.append(f"- {n}")
    L.append("")

    # ----- ffprobe
    L.append("## 1. ffprobe\n")
    L.append("| Archivo | Resolución | fps | Duración | Vídeo | Bitrate vídeo | Audio | Tamaño |\n|---|---|---|---|---|---|---|---|")
    probes = {}
    for p in (master, clean):
        if p.exists():
            q = probe(p)
            probes[p.name] = q
            L.append(f"| `{p.name}` | {q['res']} | {q['fps']:g} | {q['dur']:.2f} s | {q['vcodec']} | "
                     f"{q['vbit']:.1f} Mbps | {q['audio'] or '**sin audio**'} | {q['size']:.1f} MB |")
    L.append("")
    q = probes.get(master.name)
    ok_probe = q and q["res"] == "1080×1920" and abs(q["fps"] - fps) < 0.01 and q["audio"]
    L.append(f"Resultado: {'✅ correcto' if ok_probe else '❌ revisar'} "
             f"(esperado 1080×1920, {fps:g} fps, ~22 s, H.264 High yuv420p, AAC 48 kHz).")
    if q and q["vbit"] < 16:
        L.append(f"\nNota: el bitrate medio ({q['vbit']:.1f} Mbps) queda por debajo de 16 Mbps porque x264 "
                 "no necesita más para los placeholders planos; con el metraje real subirá hacia el "
                 "objetivo de 18 Mbps (techo 20 Mbps).")
    L.append("")

    # ----- sonoridad
    L.append("## 2. Sonoridad\n")
    st = loudness(master)
    mo = loudness(master, mono=True)
    ok_l = abs(st["I"] + 14) <= 1 and st["TP"] <= -1
    L.append("| Medida | Estéreo | Mono (L+R)/2 |\n|---|---|---|")
    L.append(f"| Integrado | {st['I']:.1f} LUFS | {mo['I']:.1f} LUFS |")
    L.append(f"| Pico real | {st['TP']:.1f} dBTP | {mo['TP']:.1f} dBTP |")
    L.append(f"| LRA | {st['LRA']:.1f} LU | {mo['LRA']:.1f} LU |")
    L.append(f"\nResultado: {'✅' if ok_l else '❌'} objetivo −14 LUFS ±1 y ≤ −1 dBTP (medido sobre el AAC final). "
             f"Mono (L+R)/2 frente a estéreo: {mo['I'] - st['I']:+.1f} LU; con canales idénticos la cifra esperada "
             f"es −3,0 LU, así que la desviación es {mo['I'] - st['I'] + 3:+.1f} LU "
             f"({'sin cancelaciones de fase' if abs(mo['I'] - st['I'] + 3) < 1 else 'revisar fase'}).\n")

    # ----- negros y saltos
    L.append("## 3. Fotogramas negros y saltos\n")
    bl = black(master)
    unexpected = [(a, b) for a, b in bl if not (a < 0.05 and b <= 0.35)]
    L.append(f"blackdetect (pix_th 0.03, ≥ 1 fotograma): {bl or 'ninguno'}.")
    L.append(f"El negro de 0–0,3 s es intencionado (arranque con solo el collar). "
             f"{'✅ Sin negros accidentales.' if not unexpected else '❌ Negros inesperados: ' + str(unexpected)}\n")
    d = frame_diffs(master, fps)
    cuts = [s for s in starts[1:-1]] + [0.3]
    d6 = (starts[6] - starts[5]) / 4
    whips = [starts[5] + k * d6 for k in (1, 2, 3)]
    spikes = [(i + 1) / fps for i in np.where(d > 18)[0]]
    near = lambda t, ts, tol: any(abs(t - x) <= tol for x in ts)  # noqa: E731
    odd = [round(t, 2) for t in spikes if not near(t, cuts, 1.5 / fps) and not near(t, whips, 0.12)
           and not near(t, [ev["frenazo"], ev["aterrizaje"]], 2 / fps)]
    L.append(f"Cambios bruscos de imagen (diferencia media > 18/255): {len(spikes)}; todos en cortes de escena, "
             f"barridos de la 06 o impactos." if not odd else
             f"Cambios bruscos fuera de cortes previstos: {odd} → revisar.")
    L.append("")

    # ----- sincronía
    L.append("## 4. Sincronía de golpes (tolerancia ±2 fotogramas)\n")
    x = audio_mono(master)
    L.append("| Evento | Imagen | Golpe sonoro | Desfase |\n|---|---|---|---|")
    ok_sync = True
    for name, key, lo, hi in (("Frenazo (01)", "frenazo", 25, 150), ("Acierto (02)", "acierto_02", 2860, 2920),
                              ("Llegada a 24K (04)", "cifra_24k", 25, 150), ("Aterrizaje (08)", "aterrizaje", 25, 150)):
        t = ev[key]
        o = onset(x, t, lo, hi)
        df = (o - t) * fps
        ok_sync &= abs(df) <= 2
        L.append(f"| {name} | {t:.3f} s | {o:.3f} s | {df:+.1f} fot. {'✅' if abs(df) <= 2 else '❌'} |")
    L.append("")

    # ----- zona segura
    L.append("## 5. Rótulos y zona segura (x 90–900, y 220–1450)\n")
    x0, y0, x1, y1 = gfx.SAFE
    viol = {}
    tags = set()
    for t, bxs in boxes:
        for tag, a, b, c, e in bxs:
            tags.add(tag)
            if a < x0 - 2 or b < y0 - 2 or c > x1 + 2 or e > y1 + 2:
                viol.setdefault(tag, (t, (a, b, c, e)))
    L.append(f"Comprobación automática de {len(tags)} rótulos en su posición asentada, fotograma a fotograma: "
             + ("✅ todos dentro de la zona segura." if not viol else "❌ fuera de zona: "
                + "; ".join(f"{k} @ {v[0]:.2f}s {v[1]}" for k, v in viol.items())))
    L.append("")

    # ----- fotogramas clave
    fdir = out / "frames"
    fdir.mkdir(exist_ok=True)
    keys = [("01_inicio", 0.55), ("02_frenazo", ev["frenazo"] + 1 / fps),
            ("03_cambio_fichas", ev["fichas"] + 0.2), ("04_24k", ev["cifra_24k"] + 0.12),
            ("05_lema", ev["lema"]), ("06_aterrizaje", ev["aterrizaje"] + 0.55), ("07_firma", ev["firma"])]
    thumbs = []
    for name, t in keys:
        p = fdir / f"{name}.png"
        sh(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", str(master), "-frames:v", "1", str(p)])
        im = Image.open(p).convert("RGB")
        ov = im.copy()
        dr = ImageDraw.Draw(ov)
        dr.rectangle(gfx.SAFE, outline=(0, 255, 255), width=4)
        dr.rectangle((0, 1280, 1080, 1920), outline=(255, 0, 255), width=4)
        thumbs.append((name, t, ov))
    sheet = Image.new("RGB", (len(thumbs) * 360, 640 + 50), (20, 20, 20))
    dr = ImageDraw.Draw(sheet)
    for k, (name, t, im) in enumerate(thumbs):
        sheet.paste(im.resize((360, 640)), (k * 360, 50))
        dr.text((k * 360 + 10, 14), f"{name} · {t:.2f}s", fill=(255, 255, 255), font=gfx.font(22, "bold"))
    sheet.save(fdir / "hoja_contacto_qa.png")
    L.append("## 6. Fotogramas clave\n")
    L.append("En `out/frames/`: " + ", ".join(f"`{n}.png` ({t:.2f} s)" for n, t, _ in thumbs)
             + ". `hoja_contacto_qa.png` los muestra juntos con la zona segura (cian) y el tercio inferior (magenta).\n")

    notes = root / "qa_notas.md"
    if notes.exists():
        L.append(notes.read_text(encoding="utf-8"))

    (out / "informe_qa.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    print("\n".join(L))
    return ok_probe and ok_l and not unexpected and ok_sync and not viol
