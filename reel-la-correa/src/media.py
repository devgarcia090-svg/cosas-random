"""Lectura del material de Dani (clips, fotos, audio) y placeholders."""
import json
import subprocess
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

import gfx

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
VIDEO_EXT = {".mp4", ".mov", ".m4v", ".mkv", ".webm"}
IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic"}

MISSING = []  # (archivo, motivo) para el informe


def missing(path, motivo):
    entry = (str(path), motivo)
    if entry not in MISSING:
        MISSING.append(entry)


def probe(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)],
        capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def video_fps(path):
    for s in probe(path)["streams"]:
        if s["codec_type"] == "video":
            n, d = s.get("avg_frame_rate", "0/1").split("/")
            if float(d):
                return float(n) / float(d)
    return None


def has_audio(path):
    return any(s["codec_type"] == "audio" for s in probe(path)["streams"])


class Still:
    def __init__(self, img):
        self.img = img

    def frame(self, i):
        return self.img


class Video:
    """Decodifica un tramo de clip a 1080x1920 (recorte «cover») y entrega
    fotogramas por índice, de forma secuencial."""

    def __init__(self, path, fps, start, dur):
        self.path, self.fps, self.start, self.dur = path, fps, max(0.0, start), dur
        self.proc = None
        self.buf = deque(maxlen=6)  # (índice, imagen)
        self.n = 0
        self.eof = False

    def _open(self):
        vf = (f"fps={self.fps},scale={gfx.W}:{gfx.H}:force_original_aspect_ratio=increase,"
              f"crop={gfx.W}:{gfx.H},setsar=1,format=rgb24")
        self.proc = subprocess.Popen(
            ["ffmpeg", "-v", "error", "-ss", f"{self.start:.3f}", "-i", str(self.path),
             "-t", f"{self.dur + 0.5:.3f}", "-vf", vf, "-f", "rawvideo", "-"],
            stdout=subprocess.PIPE)

    def frame(self, i):
        i = max(0, int(i))
        if self.proc is None:
            self._open()
        size = gfx.W * gfx.H * 3
        while self.n <= i and not self.eof:
            raw = self.proc.stdout.read(size)
            if len(raw) < size:
                self.eof = True
                break
            self.buf.append((self.n, Image.frombytes("RGB", (gfx.W, gfx.H), raw)))
            self.n += 1
        if not self.buf:
            return gfx.placeholder(Path(self.path).name, "no se pudo decodificar")
        for k, im in reversed(self.buf):
            if k <= i:
                return im
        return self.buf[0][1]


def find(stem, folder="clips", exts=VIDEO_EXT | IMAGE_EXT):
    d = ROOT / folder
    if not d.is_dir():
        return None
    for p in sorted(d.iterdir()):
        if p.stem == stem and p.suffix.lower() in exts:
            return p
    return None


def load_image(path):
    im = Image.open(path)
    try:
        from PIL import ImageOps
        im = ImageOps.exif_transpose(im)
    except Exception:
        pass
    return im.convert("RGB")


def source(stem, desc, fps, start=0.0, dur=3.0):
    """Clip o foto de clips/; si no existe, placeholder gris visible."""
    p = find(stem)
    if p is None:
        missing(f"clips/{stem}.*", desc)
        return Still(gfx.placeholder(f"clips/{stem}", desc)), False
    if p.suffix.lower() in IMAGE_EXT:
        return Still(gfx.cover(load_image(p))), True
    return Video(p, fps, start, dur), True


def still(stem, desc, w, h):
    """Foto (o primer fotograma de un clip) ajustada a w×h."""
    p = find(stem)
    if p is None:
        missing(f"clips/{stem}.*", desc)
        return gfx.placeholder(f"clips/{stem}", desc, w, h), False
    return gfx.cover(grab(p), w, h), True


def grab(path, t=None):
    if path.suffix.lower() in IMAGE_EXT:
        return load_image(path)
    if t is None:
        d = float(probe(path)["format"].get("duration", 1))
        t = d / 2
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", str(path),
                          "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"],
                         capture_output=True, check=True).stdout
    import io
    return Image.open(io.BytesIO(raw)).convert("RGB")


def virales(max_n=5):
    d = ROOT / "clips" / "04_virales"
    files = []
    if d.is_dir():
        files = [p for p in sorted(d.iterdir()) if p.suffix.lower() in VIDEO_EXT | IMAGE_EXT]
    if not files:
        missing("clips/04_virales/*", "capturas o clips de sus vídeos con más visitas")
    return files[:max_n]


def logos():
    d = ROOT / "assets" / "logos"
    if not d.is_dir():
        return []
    return [p for p in sorted(d.iterdir()) if p.suffix.lower() in IMAGE_EXT | {".svg"}]


def all_clip_fps():
    out = {}
    d = ROOT / "clips"
    if d.is_dir():
        for p in sorted(d.rglob("*")):
            if p.suffix.lower() in VIDEO_EXT:
                try:
                    out[str(p.relative_to(ROOT))] = video_fps(p)
                except Exception:
                    pass
    return out


def read_audio(path, start=0.0, dur=None, channels=2):
    """Audio a float32 [n, canales] a 48 kHz."""
    cmd = ["ffmpeg", "-v", "error"]
    if start:
        cmd += ["-ss", f"{start:.3f}"]
    cmd += ["-i", str(path)]
    if dur:
        cmd += ["-t", f"{dur:.3f}"]
    cmd += ["-vn", "-ac", str(channels), "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, channels).copy()
