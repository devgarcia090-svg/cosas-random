"""Diseño sonoro y mezcla. Todos los efectos se sintetizan aquí (originales,
sin librerías de terceros). Si no hay audio/musica.wav se genera una base
provisional a 100 BPM para poder revisar la sincronía."""
import re
import subprocess
import wave

import numpy as np

import media
import scenes
from media import SR

RNG = np.random.default_rng(13)


def t_(d):
    return np.arange(int(d * SR)) / SR


def db(x):
    return 10 ** (x / 20)


def fft_band(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def norm(x, peak=1.0):
    m = np.abs(x).max()
    return x if m == 0 else x / m * peak


# ---------------------------------------------------------------- efectos

def collar(d=0.32):
    out = np.zeros(int(d * SR))
    for k, t0 in enumerate((0.0, 0.07, 0.15, 0.22)):
        n = int(0.14 * SR)
        t = t_(0.14)
        tone = sum(np.sin(2 * np.pi * f * t + RNG.random() * 6) * g
                   for f, g in ((3150 + 210 * k, 1), (4870 + 90 * k, .6), (6930, .4), (8800, .25)))
        env = np.exp(-t * 38)
        i = int(t0 * SR)
        out[i:i + n] += (tone * env)[:len(out) - i]
    return norm(out, 0.7)


def sub_hit(d=0.9, f0=118, f1=42, decay=5.5, click=0.5):
    t = t_(d)
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * decay)
    n = int(0.012 * SR)
    body[:n] += click * fft_band(RNG.standard_normal(n), 800, 6000) * np.linspace(1, 0, n)
    return norm(np.tanh(body * 1.4))


def skid(d=0.28):
    t = t_(d)
    x = fft_band(RNG.standard_normal(len(t)), 900, 4200) * np.sin(np.pi * t / d) ** 0.7
    return norm(x * (1 + 0.4 * np.sin(2 * np.pi * 37 * t)), 0.8)


def whoosh(d=0.35, lo=300, hi=3500, curve=1.5):
    t = t_(d)
    env = np.sin(np.pi * (t / d) ** curve) ** 2
    x = fft_band(RNG.standard_normal(len(t)), lo, hi) * env
    return norm(x, 0.8)


def click(f=2600, d=0.04):
    t = t_(d)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 140)
    n = int(0.002 * SR)
    x[:n] += RNG.standard_normal(n) * 0.6
    return norm(x, 0.8)


def tick(d=0.018):
    t = t_(d)
    return norm(fft_band(RNG.standard_normal(len(t)), 2500, 9000) * np.exp(-t * 300), 0.8)


def pop(f=520, d=0.08):
    t = t_(d)
    fr = f * (1 + 0.6 * np.exp(-t * 60))
    return norm(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 45), 0.7)


def acierto(d=0.75):
    """Dos notas ascendentes tipo campana (quinta justa)."""
    out = np.zeros(int(d * SR))
    for t0, f in ((0.0, 1046.5), (0.09, 1568.0)):
        t = t_(d - t0)
        tone = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 9)
                + 0.18 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t * 20))
        i = int(t0 * SR)
        out[i:] += tone * np.exp(-t * 6.5) * np.minimum(1, t * 400)
    return norm(out, 0.8)


def reverse_swell(d=0.45):
    t = t_(d)
    x = fft_band(RNG.standard_normal(len(t)), 2000, 12000) * np.exp(-t * 7)
    x += 0.3 * np.sin(2 * np.pi * 220 * t) * np.exp(-t * 5)
    return norm(x[::-1] * (t / d) ** 0.5, 0.8)


def shutter():
    out = np.zeros(int(0.05 * SR))
    a, b = tick(0.012), tick(0.015)
    out[:len(a)] += a
    i = int(0.03 * SR)
    out[i:i + len(b)] += 0.6 * b
    return norm(out, 0.7)


# ---------------------------------------------------------------- música provisional

def note(f, d, decay=7.0):
    t = t_(d)
    x = (np.sin(2 * np.pi * f * t) + 0.32 * np.sin(2 * np.pi * 4.0 * f * t) * np.exp(-t * 25)
         + 0.1 * np.sin(2 * np.pi * 9.9 * f * t) * np.exp(-t * 60))
    return x * np.exp(-t * decay) * np.minimum(1, t * 600)


def placeholder_music(dur=40.0, bpm=100):
    """Marimba, palmas y subgrave a 100 BPM; primer tiempo fuerte en t=0."""
    beat = 60 / bpm
    out = np.zeros(int(dur * SR))
    chords = [(261.6, 329.6, 392.0), (196.0, 246.9, 293.7), (220.0, 261.6, 329.6), (174.6, 220.0, 261.6)]
    roots = [65.4, 49.0, 55.0, 43.7]

    def add(sig, t, g):
        i = int(t * SR)
        if i >= len(out):
            return
        n = min(len(sig), len(out) - i)
        out[i:i + n] += sig[:n] * g

    kick = sub_hit(0.35, 110, 48, 9, 0.2)
    clap = norm(fft_band(RNG.standard_normal(int(0.12 * SR)), 900, 5000) * np.exp(-t_(0.12) * 30))
    shaker = norm(fft_band(RNG.standard_normal(int(0.05 * SR)), 6000, 14000) * np.exp(-t_(0.05) * 80))
    nb = int(dur / beat)
    for b in range(nb):
        t = b * beat
        bar = (b // 4) % 4
        if b % 2 == 0:
            add(kick, t, 0.9)
        else:
            add(clap, t, 0.35)
        for s in range(4):
            add(shaker, t + s * beat / 4, 0.06 if s % 2 else 0.1)
        ch = chords[bar]
        for e in range(2):
            f = ch[(b * 2 + e) % 3] * (2 if (b + e) % 4 == 3 else 1)
            add(note(f, beat), t + e * beat / 2, 0.28)
        if b % 4 == 0:
            tb = t_(4 * beat)
            add(np.sin(2 * np.pi * roots[bar] * tb) * np.minimum(1, tb * 30) * np.exp(-tb * 0.6), t, 0.32)
    return np.stack([out, out], axis=1)


# ---------------------------------------------------------------- mezcla

class Mix:
    def __init__(self, dur):
        self.n = int(np.ceil(dur * SR))
        self.sfx = np.zeros((self.n, 2))

    def add(self, sig, t, gain_db=0.0, pan=0.0):
        if sig.ndim == 1:
            l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
            sig = np.stack([sig * l * 1.414, sig * r * 1.414], axis=1)
        i = int(round(t * SR))
        if i < 0:
            sig, i = sig[-i:], 0
        n = min(len(sig), self.n - i)
        if n > 0:
            self.sfx[i:i + n] += sig[:n] * db(gain_db)


def envelope(points, n):
    """Envolvente de ganancia (dB) por puntos (t, dB) interpolados linealmente."""
    ts = np.array([p[0] for p in points])
    vs = np.array([p[1] for p in points])
    return np.interp(np.arange(n) / SR, ts, vs)


def activity(sig, attack=0.08, release=0.3, floor_db=-45):
    """0–1: presencia de señal (voz o sonido directo) suavizada."""
    mono = np.abs(sig.mean(axis=1) if sig.ndim == 2 else sig)
    hop = 480
    n = len(mono) // hop + 1
    pad = np.zeros(n * hop)
    pad[:len(mono)] = mono
    rms = np.sqrt((pad.reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    on = (20 * np.log10(rms) > floor_db).astype(float)
    out, a = np.zeros(n), 0.0
    ka, kr = np.exp(-hop / SR / attack), np.exp(-hop / SR / release)
    for i, v in enumerate(on):
        k = ka if v > a else kr
        a = v + (a - v) * k
        out[i] = a
    return np.repeat(out, hop)[:len(mono)]


def place_music(music, tl, n, bpm, beat0):
    """Corta la música para que un tiempo fuerte caiga en el frenazo, en la
    llegada a 24K y en el aterrizaje, manteniendo la fase de compás."""
    beat = 60 / bpm
    ev = tl.events()
    cuts = [ev["frenazo"], ev["cifra_24k"], ev["aterrizaje"]]
    out = np.zeros((n, 2))
    src_t = beat0
    starts = [(cuts[0], beat0)]
    for c in cuts[1:]:
        elapsed = c - cuts[0]
        starts.append((c, beat0 + round(elapsed / beat / 4) * beat * 4))
    ends = cuts[1:] + [n / SR]
    xf = int(0.01 * SR)
    for (t0, s0), t1 in zip(starts, ends):
        i0, i1 = int(t0 * SR), int(t1 * SR)
        j0 = int(s0 * SR)
        seg = music[j0:j0 + (i1 - i0) + xf]
        if len(seg) == 0:
            continue
        seg = seg.copy()
        seg[:xf] *= np.linspace(0, 1, min(xf, len(seg)))[:, None]
        m = min(len(seg), n - i0)
        out[i0:i0 + m] += seg[:m]
    return out


def build(R, out_wav, report):
    tl = R.tl
    s = tl.starts
    ev = tl.events()
    total = tl.total
    mx = Mix(total)

    # 01
    mx.add(collar(), 0.0, -8, 0.15)
    mx.add(whoosh(0.5, 200, 2500, 0.7), ev["frenazo"] - 0.48, -20)
    mx.add(skid(), ev["frenazo"] - 0.22, -17, -0.1)
    mx.add(sub_hit(1.1, 125, 40, 4.5, 0.7), ev["frenazo"], 0)
    mx.add(whoosh(0.6, 500, 6000, 1.0), ev["frenazo"] + 0.15, -24, -0.3)
    # 02
    for t in scenes.S02_ENTRADAS:
        mx.add(pop(560 + 80 * scenes.S02_ENTRADAS.index(t)), s[1] + t, -21)
    mx.add(whoosh(0.32, 700, 7000, 2.0), s[1] + scenes.S02_SALIDA + 0.05, -16, 0.5)
    for k, t in enumerate(scenes.S02_CONTACTOS):
        mx.add(click(2300 + 300 * k), s[1] + t, -15, -0.2 + 0.2 * k)
    mx.add(acierto(), s[1] + scenes.S02_ACIERTO, -11)
    mx.add(whoosh(0.4, 1500, 9000, 0.6), s[1] + 2.72, -23, 0.6)
    # 03
    for t in scenes.counter_changes(tl.dias, R.fps):
        mx.add(tick(), s[2] + t, -22 if t > scenes.S03_RAMPA[0] + 0.02 else -15)
    mx.add(shutter(), s[2] + scenes.S03_MATCH, -16)
    mx.add(whoosh(0.35, 800, 8000, 0.6), s[2] + 2.45, -24)
    # 04
    for k, t in enumerate(scenes.S04_LLEGADAS):
        mx.add(whoosh(0.5, 250 + 60 * k, 3000, 0.8), s[3] + t, -24, -0.4 + 0.2 * k)
    mx.add(sub_hit(1.2, 120, 40, 4.0, 0.6), ev["cifra_24k"], 0)
    mx.add(acierto(), ev["cifra_24k"], -12)
    mx.add(whoosh(0.5, 400, 5000, 1.0), s[3] + 2.55, -24)
    # 05 → 06
    mx.add(whoosh(0.45, 300, 6000, 1.2), s[5] - 0.42, -21)
    d6 = (s[6] - s[5]) / 4
    for k, (lo, hi, d, pan) in enumerate(((250, 2500, 0.28, -0.6), (500, 5000, 0.22, 0.6),
                                          (180, 1800, 0.34, -0.6))):
        mx.add(whoosh(d, lo, hi, 1.4), s[5] + (k + 1) * d6 - d / 2, -15, pan)
    # 07
    mx.add(whoosh(0.4, 150, 1500, 1.0), s[6], -22)
    mx.add(pop(300, 0.12), s[6] + scenes.S07_A + 0.12, -22)
    mx.add(pop(360, 0.12), s[6] + scenes.S07_B + 0.12, -22)
    # 08
    L = ev["aterrizaje"]
    swell = reverse_swell(max(0.25, L - s[7]))
    mx.add(swell, L - len(swell) / SR, -9)
    mx.add(sub_hit(1.6, 130, 36, 3.2, 0.8), L, 0)
    mx.add(whoosh(0.5, 500, 7000, 0.8), L + 0.1, -22, 0.4)

    # Música
    mc = R.cfg["musica"]
    mp = media.ROOT / mc["archivo"]
    if mp.exists():
        music = media.read_audio(mp)
        report.append("Música: audio/musica.wav (cortada a tiempos fuertes).")
    else:
        media.missing(mc["archivo"], "música con licencia (100 BPM); se usa base provisional sintetizada")
        music = placeholder_music(60, mc["bpm"])
        mc = dict(mc, primer_tiempo_fuerte=0.0)
    music = place_music(music, tl, mx.n, mc["bpm"], mc["primer_tiempo_fuerte"]) * db(-9)
    mg = envelope([(0, -120), (ev["frenazo"] - 0.01, -120), (ev["frenazo"], 0),
                   (s[4] - 0.1, 0), (s[4] + 0.2, -10), (s[5] - 0.1, -10), (s[5] + 0.05, 0),
                   (s[6], 0), (s[6] + 0.35, -22), (s[7] - 0.2001, -22), (s[7] - 0.2, -120),
                   (L - 0.001, -120), (L, 0), (s[8], 0), (s[8] + 0.05, -2),
                   (total - 0.05, -30), (total, -120)], mx.n)
    music *= db(mg)[:, None]

    # Sonido directo del clip 05 (manda en su escena).
    direct = np.zeros((mx.n, 2))
    if R.audio05 is not None:
        a = R.audio05
        i0 = int(s[4] * SR)
        m = min(len(a), int((s[5] - s[4]) * SR), mx.n - i0)
        fade = np.ones(m)
        k = min(int(0.03 * SR), m // 2)
        fade[:k] = np.linspace(0, 1, k)
        fade[-k:] = np.linspace(1, 0, k)
        direct[i0:i0 + m] = a[:m] * fade[:, None]
        music *= db(-6 * activity(direct))[:, None]

    # Locución con ducking (música ≥ 12 dB por debajo, ataque suave).
    voice = np.zeros((mx.n, 2))
    if tl.voice is not None:
        i0 = int(tl.voice_offset * SR)
        v = tl.voice[max(0, -i0):]
        i0 = max(0, i0)
        m = min(len(v), mx.n - i0)
        voice[i0:i0 + m] = v[:m]
        duck = activity(voice, attack=0.12, release=0.35)
        music *= db(-12 * duck)[:, None]
        report.append("Locución mezclada con ducking de −12 dB sobre la música.")

    mixbus = mx.sfx * db(-4) + music + direct + voice
    # Silencio de 0,2 s antes del cierre (escena 07 → 08).
    a, b = int((s[7] - 0.2) * SR), int(s[7] * SR)
    mixbus[a:b] = 0
    mixbus = mixbus.astype(np.float64)
    final = loudness(mixbus, R.cfg["render"]["lufs"], R.cfg["render"]["true_peak"], report)
    write_wav(out_wav, final)
    return final


# ---------------------------------------------------------------- sonoridad

def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        i = (x * (2 ** 23 - 1)).astype(np.int32)
        b = np.zeros((len(i), 2, 3), np.uint8)
        b[..., 0] = i & 0xFF
        b[..., 1] = (i >> 8) & 0xFF
        b[..., 2] = (i >> 16) & 0xFF
        w.writeframes(b.tobytes())


def measure(path):
    r = subprocess.run(["ffmpeg", "-nostats", "-hide_banner", "-i", str(path),
                        "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    summ = r[r.rfind("Summary:"):]
    I = float(re.search(r"I:\s+(-?[\d.]+|-inf) LUFS", summ).group(1))
    tp = re.search(r"Peak:\s+(-?[\d.]+|-inf) dBFS", summ)
    lra = re.search(r"LRA:\s+(-?[\d.]+) LU", summ)
    return {"I": I, "TP": float(tp.group(1)) if tp else None,
            "LRA": float(lra.group(1)) if lra else None}


def true_peak_limit(x, ceiling_db, look=0.0015, release=0.08):
    """Limitador con estimación de pico real (sobremuestreo 4x)."""
    ceil = db(ceiling_db)
    n = len(x)
    up = np.zeros((n, 4))
    for c in range(x.shape[1]):
        X = np.fft.rfft(x[:, c])
        Y = np.zeros(4 * n // 2 + 1, complex)
        Y[:len(X)] = X
        y = np.fft.irfft(Y, 4 * n) * 4
        up = np.maximum(up, np.abs(y).reshape(n, 4))
    pk = np.maximum(up.max(axis=1), np.abs(x).max(axis=1))
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    w = max(1, int(look * SR))
    from numpy.lib.stride_tricks import sliding_window_view
    padded = np.concatenate([need, np.ones(2 * w)])
    g = sliding_window_view(padded, 2 * w + 1).min(axis=1)[:n]
    g = np.convolve(np.concatenate([np.ones(w), g]), np.ones(w) / w, "valid")[:n]
    # liberación suave
    kr = np.exp(-1 / (release * SR))
    out = np.empty(n)
    acc = 1.0
    for i in range(n):
        v = g[i]
        acc = v if v < acc else v + (acc - v) * kr
        out[i] = acc
    return x * out[:, None]


def loudness(x, target, tp, report):
    tmp = media.ROOT / "build" / "_mix_tmp.wav"
    tmp.parent.mkdir(exist_ok=True)
    y = x / max(1e-9, np.abs(x).max()) * 0.5
    for it in range(4):
        write_wav(tmp, y)
        m = measure(tmp)
        if abs(m["I"] - target) < 0.2 and m["TP"] is not None and m["TP"] <= tp + 0.05:
            break
        y = y * db(target - m["I"])
        y = true_peak_limit(y, tp - 0.1)
    report.append(f"Mezcla normalizada: {m['I']:.1f} LUFS, pico real {m['TP']:.1f} dBTP "
                  f"(objetivo {target} LUFS / {tp} dBTP).")
    return y
