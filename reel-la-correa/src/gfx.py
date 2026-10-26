"""Primitivas gráficas: easing, muelles, capas vectoriales con antialiasing,
texto y la línea «correa».

Todo se dibuja con Pillow sobre máscaras en escala de grises a 2x
(supersampling) que luego se reducen y se componen sobre el fotograma RGB.
"""
import math
from functools import lru_cache
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1080, 1920
SS = 2  # factor de supersampling de las capas vectoriales
SAFE = (90, 220, 900, 1450)  # x0, y0, x1, y1 de la zona segura de rótulos

# ---------------------------------------------------------------- colores

CORREA = "#C46A2B"
HALO = "#E08A4A"
FONDO = "#0E0B09"
BLANCO = "#FFFFFF"
CREMA = "#F6EFE8"
PILARES = {
    "humor": "#F2B705",
    "aventura": "#3FA34D",
    "mitos": "#C46A2B",
    "furgo": "#3A7BD5",
}


def rgb(c):
    if isinstance(c, tuple):
        return c
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, k):
    a, b = rgb(a), rgb(b)
    return tuple(int(round(a[i] + (b[i] - a[i]) * k)) for i in range(3))


# ---------------------------------------------------------------- easing

def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x


def prog(t, a, b):
    if b <= a:
        return 1.0 if t >= a else 0.0
    return clamp((t - a) / (b - a))


def ease_out_cubic(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_out_quint(x):
    x = clamp(x)
    return 1 - (1 - x) ** 5


def ease_in_cubic(x):
    x = clamp(x)
    return x ** 3


def ease_in_out_cubic(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_out_expo(x):
    x = clamp(x)
    return 1.0 if x >= 1 else 1 - 2 ** (-10 * x)


def ease_in_back(x, s=1.70158):
    """Anticipación: retrocede un poco antes de salir."""
    x = clamp(x)
    return (s + 1) * x ** 3 - s * x ** 2


def spring(t, freq=2.6, damp=9.0):
    """Muelle amortiguado 0→1 con sobreoscilación (t en segundos)."""
    if t <= 0:
        return 0.0
    return 1 - math.exp(-damp * t) * math.cos(2 * math.pi * freq * t)


def impact(t, amount=0.035, freq=3.4, damp=11.0):
    """Microzoom de impacto: salta a +amount y vuelve con rebote amortiguado
    (≈ 9 fotogramas a 30 fps)."""
    if t < 0:
        return 0.0
    return amount * math.exp(-damp * t) * abs(math.cos(math.pi * freq * t))


def lerp(a, b, k):
    return a + (b - a) * k


# ---------------------------------------------------------------- fuentes

FONT_DIR = Path(__file__).parent / "fonts"
_font_override = {}


def set_font_override(path_black=None, path_bold=None):
    if path_black:
        _font_override["black"] = str(path_black)
    if path_bold:
        _font_override["bold"] = str(path_bold)


@lru_cache(maxsize=None)
def font(px, weight="black"):
    path = _font_override.get(weight) or str(
        FONT_DIR / ("Inter-Black.otf" if weight == "black" else "Inter-Bold.otf"))
    return ImageFont.truetype(path, int(round(px)))


def text_width(s, size, weight="black", tracking=0.0):
    f = font(size * SS, weight)
    if not tracking:
        return f.getlength(s) / SS
    return sum(f.getlength(ch) for ch in s) / SS + tracking * (len(s) - 1)


def fit_size(s, max_w, max_size, weight="black", tracking=0.0):
    size = max_size
    while size > 10 and text_width(s, size, weight, tracking) > max_w:
        size -= 1
    return size


def wrap(s, size, max_w, weight="black"):
    words, lines, cur = s.split(), [], []
    for w in words:
        trial = " ".join(cur + [w])
        if cur and text_width(trial, size, weight) > max_w:
            lines.append(cur)
            cur = [w]
        else:
            cur.append(w)
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------- registro QA

TEXT_BOXES = []  # (etiqueta, x0, y0, x1, y1) de rótulos ya asentados


def qa_box(tag, box):
    TEXT_BOXES.append((tag,) + tuple(int(v) for v in box))


# ---------------------------------------------------------------- capa vectorial

_lut_cache = {}


def _alpha_lut(a):
    k = int(round(a * 255))
    if k not in _lut_cache:
        _lut_cache[k] = [int(round(v * k / 255)) for v in range(256)]
    return _lut_cache[k]


class Vec:
    """Máscara L a 2x en la que se dibuja; `commit` la reduce y pinta un color."""

    def __init__(self):
        self.m = Image.new("L", (W * SS, H * SS), 0)
        self.d = ImageDraw.Draw(self.m)

    @staticmethod
    def _p(pts):
        return [(x * SS, y * SS) for x, y in pts]

    def line(self, pts, width, fill=255, caps=True):
        if len(pts) < 2:
            return
        P = self._p(pts)
        w = max(1, int(round(width * SS)))
        self.d.line(P, fill=fill, width=w, joint="curve")
        if caps:
            r = w / 2
            for x, y in (P[0], P[-1]):
                self.d.ellipse((x - r, y - r, x + r, y + r), fill=fill)

    def rrect(self, box, r, fill=255, outline=None, width=0):
        b = [v * SS for v in box]
        self.d.rounded_rectangle(b, radius=r * SS, fill=fill, outline=outline,
                                 width=int(width * SS))

    def ellipse(self, box, fill=255, outline=None, width=0):
        self.d.ellipse([v * SS for v in box], fill=fill, outline=outline,
                       width=int(width * SS))

    def polygon(self, pts, fill=255, outline=None, width=0):
        self.d.polygon(self._p(pts), fill=fill, outline=outline,
                       width=int(width * SS))

    def text(self, xy, s, size, weight="black", anchor="ls", fill=255,
             tracking=0.0, qa=None):
        """Texto en coordenadas 1x. anchor: l/m/r + s (línea base)."""
        x, y = xy
        f = font(size * SS, weight)
        wpx = text_width(s, size, weight, tracking)
        if anchor[0] == "m":
            x -= wpx / 2
        elif anchor[0] == "r":
            x -= wpx
        if tracking:
            cx = x
            for ch in s:
                self.d.text((cx * SS, y * SS), ch, font=f, fill=fill, anchor="ls")
                cx += f.getlength(ch) / SS + tracking
        else:
            self.d.text((x * SS, y * SS), s, font=f, fill=fill, anchor="ls")
        if qa:
            asc, desc = f.getmetrics()
            cap = f.getbbox("H", anchor="ls")[1] / SS  # negativo
            qa_box(qa, (x, y + cap, x + wpx, y + desc / SS * 0.2))
        return wpx

    def stamp(self, mask_ss, x, y, value=255):
        """Pega una máscara ya a escala SS con su esquina en (x, y) 1x."""
        self.m.paste(value, (int(round(x * SS)), int(round(y * SS))), mask_ss)

    def clear(self, box):
        x0, y0, x1, y1 = box
        self.m.paste(0, (int(max(0, x0) * SS), int(max(0, y0) * SS),
                         int(min(W, x1) * SS), int(min(H, y1) * SS)))

    def commit(self, fr, color, alpha=1.0, blur=0, offset=(0, 0)):
        if alpha <= 0.002:
            return
        bb = self.m.getbbox()
        if not bb:
            return
        pad = int(math.ceil(blur * 3)) * SS
        x0 = max(0, (bb[0] // SS) * SS - pad)
        y0 = max(0, (bb[1] // SS) * SS - pad)
        x1 = min(W * SS, -(-bb[2] // SS) * SS + pad)
        y1 = min(H * SS, -(-bb[3] // SS) * SS + pad)
        crop = self.m.crop((x0, y0, x1, y1)).reduce(SS)
        if blur:
            crop = crop.filter(ImageFilter.GaussianBlur(blur))
        if alpha < 0.998:
            crop = crop.point(_alpha_lut(alpha))
        ox, oy = x0 // SS + int(offset[0]), y0 // SS + int(offset[1])
        fr.paste(rgb(color), (ox, oy, ox + crop.width, oy + crop.height), crop)


# ---------------------------------------------------------------- texto suelto

@lru_cache(maxsize=512)
def text_mask(s, size, weight="black", tracking=0.0):
    """Máscara SS de un texto, con su origen (x izq., línea base) en
    (pad, pad + ascent). Devuelve (mask, ancho_1x, ascent_1x, pad_1x)."""
    f = font(size * SS, weight)
    wpx = text_width(s, size, weight, tracking)
    asc, desc = f.getmetrics()
    pad = 8
    im = Image.new("L", (int((wpx + 2 * pad) * SS) + 2,
                         int(asc + desc + 2 * pad * SS)), 0)
    d = ImageDraw.Draw(im)
    if tracking:
        cx = pad * SS
        for ch in s:
            d.text((cx, pad * SS + asc), ch, font=f, fill=255, anchor="ls")
            cx += f.getlength(ch) + tracking * SS
    else:
        d.text((pad * SS, pad * SS + asc), s, font=f, fill=255, anchor="ls")
    return im, wpx, asc / SS, pad


def transformed(mask_ss, sx=1.0, sy=1.0, rot=0.0):
    """Escala/rota una máscara SS alrededor de su centro."""
    m = mask_ss
    if abs(sx - 1) > 1e-3 or abs(sy - 1) > 1e-3:
        m = m.resize((max(1, int(m.width * sx)), max(1, int(m.height * sy))),
                     Image.BICUBIC)
    if abs(rot) > 0.05:
        m = m.rotate(rot, resample=Image.BICUBIC, expand=True)
    return m


def stamp_centered(vec, mask_ss, cx, cy, value=255, sx=1.0, sy=1.0, rot=0.0):
    m = transformed(mask_ss, sx, sy, rot)
    vec.stamp(m, cx - m.width / SS / 2, cy - m.height / SS / 2, value)


# ---------------------------------------------------------------- trayectorias

def bezier(p0, p1, p2, p3, n=28):
    out = []
    for i in range(n + 1):
        t = i / n
        a = (1 - t) ** 3
        b = 3 * (1 - t) ** 2 * t
        c = 3 * (1 - t) * t ** 2
        d = t ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
                    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out


def rounded_poly(pts, r=36, n=10):
    """Polilínea con esquinas redondeadas (para recorridos de la correa)."""
    if len(pts) < 3:
        return list(pts)
    out = [pts[0]]
    for i in range(1, len(pts) - 1):
        p0, p1, p2 = np.array(pts[i - 1], float), np.array(pts[i], float), np.array(pts[i + 1], float)
        v0, v1 = p0 - p1, p2 - p1
        l0, l1 = np.linalg.norm(v0), np.linalg.norm(v1)
        rr = min(r, l0 / 2, l1 / 2)
        a, b = p1 + v0 / l0 * rr, p1 + v1 / l1 * rr
        for k in range(n + 1):
            t = k / n
            q = (1 - t) ** 2 * a + 2 * (1 - t) * t * p1 + t ** 2 * b
            out.append((float(q[0]), float(q[1])))
    out.append(pts[-1])
    return out


class Path:
    def __init__(self, pts):
        self.p = np.array(pts, dtype=float)
        seg = np.linalg.norm(np.diff(self.p, axis=0), axis=1)
        self.cum = np.concatenate([[0.0], np.cumsum(seg)])
        self.L = float(self.cum[-1])

    def at(self, s):
        s = clamp(s, 0, self.L)
        i = int(np.searchsorted(self.cum, s, side="right")) - 1
        i = min(max(i, 0), len(self.p) - 2)
        seg = self.cum[i + 1] - self.cum[i]
        k = 0 if seg == 0 else (s - self.cum[i]) / seg
        q = self.p[i] + (self.p[i + 1] - self.p[i]) * k
        return float(q[0]), float(q[1])

    def sub(self, s0, s1):
        s0, s1 = clamp(s0, 0, self.L), clamp(s1, 0, self.L)
        if s1 - s0 < 0.5:
            return []
        inner = [tuple(self.p[i]) for i in range(len(self.p))
                 if s0 < self.cum[i] < s1]
        return [self.at(s0)] + inner + [self.at(s1)]


# ---------------------------------------------------------------- la correa

def correa_pieces(path, s0, s1, fade=0.0, chunks=10):
    """Trozos (pts, fill) del tramo [s0, s1]; con fade>0 la cola se desvanece
    (estela corta)."""
    if s1 - s0 < 0.5:
        return []
    pieces = []
    if fade > 0:
        f_end = min(s0 + fade, s1)
        for i in range(chunks):
            a = lerp(s0, f_end, i / chunks)
            b = lerp(s0, f_end, (i + 1) / chunks)
            pts = path.sub(a, b + 1.0)
            if pts:
                pieces.append((pts, int(40 + 215 * (i + 1) / chunks)))
        s0 = f_end
    pts = path.sub(s0, s1)
    if pts:
        pieces.append((pts, 255))
    return pieces


def draw_correa(fr, pieces, color=CORREA, width=8, alpha=1.0, halo=True,
                halo_color=HALO):
    """Núcleo de color + halo suave (25–35 % en el centro, cae hacia fuera)."""
    if not pieces:
        return
    if halo:
        for wmul, a in ((3.4, 0.13), (2.1, 0.17)):
            v = Vec()
            for pts, fill in pieces:
                v.line(pts, width * wmul, fill)
            v.commit(fr, halo_color, a * alpha)
    v = Vec()
    for pts, fill in pieces:
        v.line(pts, width, fill)
    v.commit(fr, color, alpha)


def correa(fr, path, s0, s1, fade=0.0, **kw):
    draw_correa(fr, correa_pieces(path, s0, s1, fade), **kw)


# ---------------------------------------------------------------- fondos

def solid(color=FONDO):
    return Image.new("RGB", (W, H), rgb(color))


def cover(img, w=W, h=H):
    img = img.convert("RGB")
    k = max(w / img.width, h / img.height)
    nw, nh = int(math.ceil(img.width * k)), int(math.ceil(img.height * k))
    img = img.resize((nw, nh), Image.LANCZOS)
    x, y = (nw - w) // 2, (nh - h) // 2
    return img.crop((x, y, x + w, y + h))


def zoom(img, s, center=(W / 2, H / 2)):
    """Escala el fotograma s veces alrededor de `center`, mismo tamaño."""
    if s < 1 + 1e-4:  # nunca alejamos: aparecerían bordes
        return img
    cx, cy = center
    w, h = W / s, H / s
    x0 = clamp(cx - w * cx / W, 0, W - w)
    y0 = clamp(cy - h * cy / H, 0, H - h)
    return img.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + w, y0 + h))


def darken(img, k, color=FONDO):
    """Mezcla el fotograma con `color`: k=1 deja el original, k=0 color plano."""
    return Image.blend(solid(color), img, k)


@lru_cache(maxsize=4)
def _scrim_mask(h, strength):
    y = np.linspace(0, 1, h)
    a = (1 - y) ** 1.6 * strength * 255
    return Image.fromarray(np.repeat(a[:, None], W, axis=1).astype(np.uint8), "L")


def scrim_top(fr, strength=0.55, h=760):
    """Degradado oscuro superior para que los rótulos se lean sobre el vídeo."""
    if strength <= 0.01:
        return
    m = _scrim_mask(h, round(strength, 2))
    fr.paste(rgb("#000000"), (0, 0, W, h), m)


def drop_shadow_text(fr, vec, color=BLANCO, alpha=1.0, shadow=0.55):
    vec.commit(fr, "#000000", shadow * alpha, blur=9, offset=(0, 4))
    vec.commit(fr, color, alpha)


# ---------------------------------------------------------------- placeholder

@lru_cache(maxsize=32)
def placeholder(nombre, descripcion="", w=W, h=H):
    """Tarjeta gris visible para un plano que falta."""
    im = Image.new("RGB", (w, h), rgb("#5E5E5E"))
    d = ImageDraw.Draw(im)
    step = max(40, w // 14)
    for k in range(-h, w, step):
        d.line([(k, 0), (k + h, h)], fill=rgb("#666666"), width=step // 3)
    s = w / W
    big = font(max(18, 54 * s), "black")
    mid = font(max(14, 38 * s), "black")
    small = font(max(12, 30 * s), "bold")
    cy = h * 0.865 if h > 1000 else h * 0.5
    box_w = w * 0.84
    lines = []
    for ln in wrap(descripcion, 30 * s, box_w - 60 * s, "bold")[:4]:
        lines.append(" ".join(ln))
    bh = (60 + 52 + 40 * len(lines) + 40) * s
    x0, y0 = (w - box_w) / 2, cy - bh / 2
    d.rounded_rectangle((x0, y0, x0 + box_w, y0 + bh), radius=int(24 * s),
                        fill=rgb("#3C3C3C"))
    y = y0 + 64 * s
    d.text((w / 2, y), "FALTA PLANO", font=big, fill=rgb("#F2B705"), anchor="ms")
    y += 50 * s
    d.text((w / 2, y), nombre, font=mid, fill=rgb("#FFFFFF"), anchor="ms")
    y += 44 * s
    for ln in lines:
        d.text((w / 2, y), ln, font=small, fill=rgb("#D8D8D8"), anchor="ms")
        y += 38 * s
    return im


# ---------------------------------------------------------------- perspectiva

def perspective_coeffs(dst, src):
    """Coeficientes para Image.transform(PERSPECTIVE): mapean dst→src."""
    A, B = [], []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        B += [u, v]
    return np.linalg.solve(np.array(A, float), np.array(B, float)).tolist()
