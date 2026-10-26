#!/usr/bin/env python3
"""LA CORREA · Reel 9:16 para @maya.rottweiler13.

Uso:
    python3 render.py            # audio + máster + versión sin texto + QA
    python3 render.py --rapido   # solo el máster (sin QA), para iterar
    python3 render.py --qa       # solo QA sobre lo ya renderizado
"""
import argparse
import json
import multiprocessing as mp
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "src"))

import numpy as np  # noqa: E402

import audio  # noqa: E402
import gfx  # noqa: E402
import media  # noqa: E402
import scenes  # noqa: E402
from timeline import Timeline, load_config  # noqa: E402

OUT = ROOT / "out"
BUILD = ROOT / "build"
MASTER = OUT / "maya_la_correa_9x16.mp4"
SIN_TEXTO = OUT / "maya_la_correa_9x16_sin_texto.mp4"
MIX = BUILD / "mezcla.wav"

DESC = {
    "01_gancho": "Maya corre hacia la lente a ras de suelo, frena a centímetros y lame la cámara (60 fps)",
    "02_payasa": "Maya en su momento más ridículo",
    "03_cachorra": "foto de cachorra (misma pose que la adulta)",
    "03_adulta": "foto de adulta (misma pose que la cachorra)",
    "05_humano": "Dani pregunta y Maya «contesta» con su ruidito (sonido directo)",
    "06_humor": "plano corto · pilar HUMOR",
    "06_aventura": "plano corto · pilar AVENTURA",
    "06_mitos": "plano corto · pilar MITOS ROTOS",
    "06_furgo": "plano corto · pilar VIDA EN FURGO",
    "08_salto_furgo": "Maya salta a la Fiat Talento, aterriza, se sienta y mira a cámara (60 fps)",
}


def pick_fps(cfg):
    if cfg["render"].get("fps"):
        return float(cfg["render"]["fps"]), {}
    rates = media.all_clip_fps()
    vals = [round(v) for v in rates.values() if v]
    if vals and all(v >= 59 for v in vals):
        return 60.0, rates
    return 30.0, rates


class Ctx:
    def __init__(self, cfg, tl, fps, text):
        self.cfg, self.tl, self.fps, self.text = cfg, tl, fps, text
        self._cache = {}
        self.src = {}
        self.audio05 = None

    def cache(self, key, fn):
        if key not in self._cache:
            self._cache[key] = fn()
        return self._cache[key]


def prepare(cfg, fps, text):
    tl = Timeline(cfg, fps)
    R = Ctx(cfg, tl, fps, text)
    s, C = tl.starts, cfg["clips"]
    fb = Path(ROOT / "assets" / "fuente")
    if fb.is_dir():
        fonts = sorted(p for p in fb.iterdir() if p.suffix.lower() in {".ttf", ".otf"})
        if fonts:
            gfx.set_font_override(fonts[0])

    def src(stem, start, dur):
        return media.source(stem, DESC[stem], fps, start, dur)[0]

    c1 = C["01_gancho"]
    in01 = c1["inicio"] if c1.get("momento_frenazo") is None else c1["momento_frenazo"] - (tl.frenazo - 0.3)
    R.src["01"] = src("01_gancho", in01, s[1] - s[0])
    R.src["02"] = src("02_payasa", C["02_payasa"]["inicio"], s[2] - s[1])
    R.src["05"] = src("05_humano", C["05_humano"]["inicio"], s[5] - s[4])
    d6 = (s[6] - s[5]) / 4
    R.src["06"] = [src(k, C[k]["inicio"], d6 + 0.2)
                   for k in ("06_humor", "06_aventura", "06_mitos", "06_furgo")]
    c8 = C["08_salto_furgo"]
    in08 = c8["inicio"] if c8.get("momento_aterrizaje") is None else c8["momento_aterrizaje"] - tl.aterrizaje
    R.src["08"] = src("08_salto_furgo", in08, s[9] - s[7])
    R.photos = [media.still(k, DESC[k], 670, 670)[0] for k in ("03_cachorra", "03_adulta")]

    imgs = [gfx.cover(media.grab(p), scenes.CARD_W, scenes.CARD_H) for p in media.virales()]
    for p in media.logos():
        if len(imgs) >= 5:
            break
        try:
            logo = media.load_image(p)
            card = gfx.solid(gfx.CREMA).resize((scenes.CARD_W, scenes.CARD_H))
            logo.thumbnail((220, 220))
            card.paste(logo, ((scenes.CARD_W - logo.width) // 2, (scenes.CARD_H - logo.height) // 2))
            imgs.append(card)
        except Exception:
            pass
    if not imgs:
        imgs = [gfx.placeholder(f"04_virales #{k + 1}", "captura viral", scenes.CARD_W, scenes.CARD_H)
                for k in range(5)]
    R.cards = [scenes.card_image(im) for im in imgs]

    # Sonido directo y envolvente para la forma de onda de la escena 05.
    p5 = media.find("05_humano")
    if p5 is not None and p5.suffix.lower() in media.VIDEO_EXT and media.has_audio(p5):
        R.audio05 = media.read_audio(p5, C["05_humano"]["inicio"], s[5] - s[4])
        mono = np.abs(R.audio05.mean(axis=1))
        hop = media.SR // 100
        n = len(mono) // hop
        rms = np.sqrt((mono[:n * hop].reshape(n, hop) ** 2).mean(axis=1))
        rms = np.convolve(rms, np.ones(4) / 4, "same")
        env = np.clip(rms / max(1e-6, np.percentile(rms, 99)), 0, 1) ** 0.7
        R.env05 = lambda t, env=env: float(np.interp(t * 100, np.arange(len(env)), env, 0, 0))
    else:
        t0 = tl.respuesta
        R.env05 = lambda t: float(0.95 * np.exp(-((t - t0 - 0.08) / 0.09) ** 2)
                                  + 0.75 * np.exp(-((t - t0 - 0.38) / 0.11) ** 2))
    return R


def render_video(text, out_path, fps, frames=None):
    cfg = load_config()
    R = prepare(cfg, fps, text)
    total = R.tl.total
    nfr = int(round(total * fps))
    rc = cfg["render"]
    br = rc["video_bitrate"]
    maxr = f"{int(br.rstrip('M')) + 2}M"
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{gfx.W}x{gfx.H}", "-r", str(fps), "-i", "-", "-i", str(MIX),
           "-map", "0:v", "-map", "1:a",
           "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
           "-c:v", "libx264", "-profile:v", "high", "-preset", "slow",
           "-b:v", br, "-maxrate", maxr, "-bufsize", f"{2 * int(br.rstrip('M'))}M",
           "-x264-params", "nal-hrd=vbr", "-g", str(int(fps * 2)),
           "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
           "-c:a", "aac", "-b:a", rc["audio_bitrate"], "-ar", "48000",
           "-movflags", "+faststart", "-t", f"{total:.3f}", str(out_path)]
    enc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    for n in range(nfr):
        t = n / fps
        i, lt, dur = R.tl.scene_at(t)
        fr = scenes.SCENES[i](R, lt, dur)
        enc.stdin.write(fr.tobytes())
        if frames is not None and text:
            frames.append((t, list(gfx.TEXT_BOXES)))
        gfx.TEXT_BOXES.clear()
    enc.stdin.close()
    enc.wait()
    label = "máster" if text else "sin texto"
    print(f"  {label}: {nfr} fotogramas en {time.time() - t0:.0f} s → {out_path.name}")
    return R


def _render_job(args):
    text, out, fps = args
    boxes = [] if text else None
    render_video(text, out, fps, boxes)
    if text:
        with open(BUILD / "text_boxes.json", "w") as f:
            json.dump(boxes, f)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--rapido", action="store_true")
    ap.add_argument("--qa", action="store_true")
    a = ap.parse_args()
    OUT.mkdir(exist_ok=True)
    (OUT / "frames").mkdir(exist_ok=True)
    BUILD.mkdir(exist_ok=True)
    cfg = load_config()
    fps, rates = pick_fps(cfg)

    if not a.qa:
        print("Material encontrado:")
        for folder in ("clips", "audio", "assets"):
            d = ROOT / folder
            files = sorted(p.relative_to(ROOT) for p in d.rglob("*") if p.is_file()
                           and p.name != ".gitkeep") if d.is_dir() else []
            print(f"  {folder}/: " + (", ".join(map(str, files)) or "(vacío)"))
        print(f"Frecuencia de render: {fps:g} fps")
        R = prepare(cfg, fps, True)
        report = list(R.tl.notes)
        audio.build(R, MIX, report)
        with open(BUILD / "render_info.json", "w", encoding="utf-8") as f:
            json.dump({"fps": fps, "clip_fps": rates, "starts": R.tl.starts,
                       "events": R.tl.events(), "dias": R.tl.dias,
                       "fecha_publicacion": str(R.tl.fecha_publicacion),
                       "missing": media.MISSING, "notes": report}, f,
                      ensure_ascii=False, indent=2)
        for line in report:
            print("  " + line)
        jobs = [(True, MASTER, fps)] + ([] if a.rapido else [(False, SIN_TEXTO, fps)])
        with mp.get_context("fork").Pool(len(jobs)) as pool:
            pool.map(_render_job, jobs)
    if not a.rapido:
        import qa
        qa.run(ROOT)


if __name__ == "__main__":
    main()
