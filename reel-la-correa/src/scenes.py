"""Las nueve escenas. Cada `sNN(R, lt, dur)` devuelve el fotograma RGB del
instante local `lt` (s desde el inicio de la escena)."""
import math
from functools import lru_cache

import numpy as np
from PIL import Image, ImageDraw

import gfx
from gfx import (CORREA, CREMA, BLANCO, FONDO, PILARES, SS, W, H, Vec, Path,
                 clamp, prog, spring, lerp, ease_in_back, ease_in_cubic,
                 ease_in_out_cubic, ease_out_cubic, ease_out_quint, ease_out_expo)

PILAR_ORDEN = ["humor", "aventura", "mitos", "furgo"]
TXT_CX = 495  # centro horizontal de la zona segura (x 90–900)

# ---------------------------------------------------------------- tiempos internos
# (locales a cada escena; la mezcla de audio usa los mismos)

S02_ENTRADAS = [0.22, 0.32, 0.42]
S02_SALIDA = 1.40
S02_CONTACTOS = [1.72, 1.85, 1.98]
S02_ACIERTO = 2.30
S03_PASOS = [(0.62, 1), (0.86, 30), (1.10, 365), (1.34, 1000)]
S03_RAMPA = (1.34, 1.95)
S03_MATCH = 1.60
S04_LLEGADAS = [0.15, 0.42, 0.69, 0.96, 1.45]
S04_VIAJE = 0.55
S04_CIFRA = 2.0
S07_A, S07_B = 0.20, 0.95
S07_PARPADEO = 1.45


def counter_value(lt, dias):
    if lt < S03_PASOS[0][0]:
        return None
    v = None
    for t, val in S03_PASOS:
        if lt >= t:
            v = val
    if lt >= S03_RAMPA[0]:
        k = ease_out_cubic(prog(lt, *S03_RAMPA))
        v = int(round(lerp(1000, dias, k)))
    return min(v, dias)


def counter_changes(dias, fps):
    out, prev = [], None
    for i in range(int(3.0 * fps)):
        v = counter_value(i / fps, dias)
        if v is not None and v != prev:
            out.append(i / fps)
        prev = v
    return out


# ---------------------------------------------------------------- utilidades

def word_layout(text, size, max_w, cx, base0, lh):
    out = []
    for li, words in enumerate(gfx.wrap(text, size, max_w)):
        line = " ".join(words)
        x = cx - gfx.text_width(line, size) / 2
        space = gfx.text_width(" ", size)
        for w in words:
            out.append((w, x, base0 + li * lh))
            x += gfx.text_width(w, size) + space
    return out


def tabular(vec, s, cx, base, size, fill=255):
    f = gfx.font(size * SS)
    dw = max(f.getlength(d) for d in "0123456789") / SS
    adv = [dw if ch.isdigit() else f.getlength(ch) / SS for ch in s]
    x = cx - sum(adv) / 2
    for ch, a in zip(s, adv):
        vec.text((x + a / 2, base), ch, size, anchor="ms", fill=fill)
        x += a
    return sum(adv)


def bg_frame(src, lt, fps):
    return src.frame(int(round(lt * fps))).copy()


# ================================================================ 01 · El impacto

def s01(R, lt, dur):
    c = R.cfg["clips"]["01_gancho"]
    px, py = c["punto_frenazo"]
    tf = R.tl.frenazo
    if lt < 0.3:
        fr = gfx.solid("#000000")
    else:
        fr = R.src["01"].frame(int(round((lt - 0.3) * R.fps)))
        fr = gfx.zoom(fr, 1 + gfx.impact(lt - tf), (px, py)).copy()

    # La correa nace donde frena Maya y sale hacia arriba (hacia la escena 02).
    path = R.cache("s01_path", lambda: Path(
        [(px, py), (px, py - 240)]
        + gfx.bezier((px, py - 240), (px, py - 470), (140, py - 420), (140, py - 700))[1:]
        + [(140, -80)]))
    head = path.L * ease_in_out_cubic(prog(lt, tf + 0.05, 1.86))
    tail = path.L * ease_in_cubic(prog(lt, tf + 0.42, 2.0))
    gfx.correa(fr, path, tail, head, fade=140)

    if R.text and lt >= 0.3:
        gfx.scrim_top(fr, 0.55 * ease_out_cubic(prog(lt, 0.3, 0.6)))
        size, lh = 76, 88
        words = R.cache("s01_words", lambda: word_layout(
            R.cfg["textos"]["s01"], size, 640, 520, 330, lh))
        v = Vec()
        for i, (w, x, y) in enumerate(words):
            ti = 0.40 + 0.085 * i
            p = spring(lt - ti, 2.6, 9.0)
            a = clamp((lt - ti) / 0.10)
            te = 1.70 + 0.03 * i
            q = ease_in_back(prog(lt, te, te + 0.24))
            a *= 1 - prog(lt, te + 0.10, te + 0.24)
            dy = 48 * (1 - p) - 90 * q
            if a > 0:
                settled = abs(dy) < 1 and a > 0.99
                v.text((x, y + dy), w, size, fill=int(255 * a),
                       qa="s01 rótulo" if settled else None)
        gfx.drop_shadow_text(fr, v)
    return fr


# ================================================================ 02 · Traduce esta frase

CARD = (90, 300, 900, 680)
ROW_Y = (445, 565)
TRACK_Y = 650
LINE_X = 140


@lru_cache(maxsize=32)
def chip_masks(label, size=50, pad=26, h=88, r=20):
    wpx = gfx.text_width(label, size)
    w = wpx + 2 * pad
    bg = Image.new("L", (int(w * SS), int(h * SS)), 0)
    ImageDraw.Draw(bg).rounded_rectangle((0, 0, bg.width - 1, bg.height - 1),
                                         radius=r * SS, fill=255)
    tx = Image.new("L", bg.size, 0)
    f = gfx.font(size * SS)
    cap = -f.getbbox("H", anchor="ls")[1]
    ImageDraw.Draw(tx).text((pad * SS, (h * SS + cap) / 2), label, font=f,
                            fill=255, anchor="ls")
    return bg, tx, w, h


def row_centers(labels, x0=170, gap=16):
    out, x = [], x0
    for lb in labels:
        w = chip_masks(lb)[2] if lb != "=" else gfx.text_width("=", 50) + 8
        out.append(x + w / 2)
        x += w + gap
    return out


def s02(R, lt, dur):
    fr = bg_frame(R.src["02"], lt, R.fps)
    T = R.cfg["textos"]
    enter = spring(lt, 2.4, 9.0)
    dy_card = 70 * (1 - enter)

    if R.text:
        x0, y0, x1, y1 = CARD
        sc = lerp(0.94, 1.0, enter)
        cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
        box = (cx - (x1 - x0) / 2 * sc, cy - (y1 - y0) / 2 * sc + dy_card,
               cx + (x1 - x0) / 2 * sc, cy + (y1 - y0) / 2 * sc + dy_card)
        v = Vec()
        v.rrect(box, 34)
        v.commit(fr, "#000000", 0.42, blur=18, offset=(0, 14))
        v.commit(fr, FONDO, 0.85)

        hv = Vec()
        hv.text((170, 362 + dy_card), T["s02_cabecera"], 28, tracking=3,
                qa="s02 cabecera" if dy_card < 1 else None)
        hv.commit(fr, CREMA, 0.72)

        fila1 = T["s02_fila1"]
        falsa = T["s02_falsa"]
        buenas = T["s02_correcta"]
        c1 = row_centers(fila1)
        cf = row_centers([falsa])
        cb = row_centers(buenas)
        light, yellow, dark, eq = Vec(), Vec(), Vec(), Vec()

        def chip(label, cx, cy, sx=1.0, sy=1.0, rot=0.0, a=1.0, bgv=light):
            if a <= 0:
                return
            if label == "=":
                m = gfx.text_mask("=", 50)[0]
                gfx.stamp_centered(eq, m, cx, cy + 4, int(255 * a), sx, sy, rot)
                return
            bg, tx, w, h = chip_masks(label)
            gfx.stamp_centered(bgv, bg, cx, cy, int(255 * a), sx, sy, rot)
            gfx.stamp_centered(dark, tx, cx, cy, int(255 * a), sx, sy, rot)
            if a > 0.99 and abs(sx - 1) < 0.01 and abs(rot) < 0.1:
                gfx.qa_box(f"s02 ficha {label}", (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2))

        # Fila 1 y la ficha falsa entran con muelle.
        for i, (lb, cx) in enumerate(zip(fila1 + [falsa], c1 + cf)):
            ti = S02_ENTRADAS[min(i, 2)]
            p = spring(lt - ti, 2.8, 10.0)
            a = clamp((lt - ti) / 0.08)
            cy = (ROW_Y[0] if i < len(fila1) else ROW_Y[1]) + 46 * (1 - p) + dy_card
            s = lerp(0.7, 1.0, p)
            if lb != falsa:
                chip(lb, cx, cy, s, s, 0, a)
                continue
            # PELIGROSA: anticipación (se encoge) y sale despedida.
            ant = prog(lt, S02_SALIDA, S02_SALIDA + 0.07)
            u = prog(lt, S02_SALIDA + 0.07, S02_SALIDA + 0.32) ** 2
            sx = s * (1 - 0.06 * ant * (1 - u))
            sy = s * (1 - 0.10 * ant * (1 - u))
            chip(lb, cx - 10 * ant + 1100 * u, cy + 6 * ant - 380 * u + 160 * u * u,
                 sx, sy, -32 * u, a)

        # Fichas correctas: atracción magnética y compresión del 4 % al contacto.
        for lb, cx, tc in zip(buenas, cb, S02_CONTACTOS):
            t0 = tc - 0.24
            if lt < t0:
                continue
            u = ease_in_cubic(prog(lt, t0, tc))
            ox, oy = 150 * (1 - u), 190 * (1 - u)
            tau = lt - tc
            comp = 0.04 * math.exp(-22 * tau) * math.cos(2 * math.pi * 7 * tau) if tau >= 0 else 0
            s = lerp(0.82, 1.0, u)
            chip(lb, cx + ox, ROW_Y[1] + oy + dy_card, s * (1 + comp * 0.5), s * (1 - comp),
                 0, clamp((lt - t0) / 0.06), bgv=yellow)

        light.commit(fr, CREMA)
        yellow.commit(fr, PILARES["humor"])
        dark.commit(fr, FONDO)
        eq.commit(fr, CREMA)

        # Check de acierto.
        if lt >= S02_ACIERTO:
            p = spring(lt - S02_ACIERTO, 3.0, 9.0)
            r = 28 * p
            bx, by = 846, 350 + dy_card
            cv = Vec()
            cv.ellipse((bx - r, by - r, bx + r, by + r))
            cv.commit(fr, PILARES["aventura"])
            k = ease_out_cubic(prog(lt, S02_ACIERTO + 0.06, S02_ACIERTO + 0.24))
            ck = Path([(bx - 12, by + 1), (bx - 4, by + 10), (bx + 13, by - 9)])
            kv = Vec()
            kv.line(ck.sub(0, ck.L * k), 6)
            kv.commit(fr, BLANCO)

        # Pista de la barra de progreso.
        tv = Vec()
        tv.line([(170, TRACK_Y + dy_card), (860, TRACK_Y + dy_card)], 4)
        tv.commit(fr, CREMA, 0.16 * clamp(lt / 0.3))

    # La correa baja, espera como barra vacía, se llena con el acierto y escapa.
    path = R.cache("s02_path", lambda: Path(gfx.rounded_poly(
        [(LINE_X, -80), (LINE_X, TRACK_Y), (860, TRACK_Y), (1200, TRACK_Y)], r=28)))
    corner = path.L - (1200 - 860) - (860 - LINE_X) + 0  # ~ fin del descenso
    fill_end = path.L - (1200 - 860)
    if lt < 0.32:
        head = corner * ease_out_cubic(prog(lt, 0, 0.32))
        tail = max(0, head - 260)
    elif lt < S02_ACIERTO:
        head = corner
        tail = lerp(corner - 260, corner - 1, ease_out_cubic(prog(lt, 0.32, 0.6)))
    elif lt < 2.75:
        head = lerp(corner, fill_end, ease_in_out_cubic(prog(lt, S02_ACIERTO, 2.75)))
        tail = corner - 1
    else:
        head = lerp(fill_end, path.L, ease_in_cubic(prog(lt, 2.75, dur)))
        tail = lerp(corner - 1, path.L, ease_in_cubic(prog(lt, 2.78, dur)))
    gfx.correa(fr, path, tail, head, fade=60 if lt < 0.32 or lt > 2.75 else 0)
    return fr


# ================================================================ 03 · La racha

def s03_geom(n):
    cw, gap = 140, 18
    total = n * cw + (n - 1) * gap
    x0 = TXT_CX - total / 2
    cells = [(x0 + k * (cw + gap), x0 + k * (cw + gap) + cw) for k in range(n)]
    return cells, x0 - 14, x0 + total + 14, 328, 542


def s03(R, lt, dur):
    fr = gfx.solid(FONDO)
    dias = R.tl.dias
    n = len(str(dias))
    cells, X0, X1, Y0, Y1 = s03_geom(n)

    # Foto: entra con cortinilla vertical; match-cut cachorra → adulta.
    px0, py0, side = 160, 650, 670
    wipe = ease_out_cubic(prog(lt, 0.15, 0.55))
    if wipe > 0:
        adulta = lt >= S03_MATCH
        img = R.photos[1] if adulta else R.photos[0]
        s = 1 + (0.03 * math.exp(-9 * (lt - S03_MATCH)) if adulta else 0) + 0.03 * (1 - spring(lt - 0.15, 2.0, 8))
        if abs(s - 1) > 1e-3:
            big = img.resize((int(side * s), int(side * s)), Image.BICUBIC)
            o = (big.width - side) // 2
            img = big.crop((o, o, o + side, o + side))
        mask = R.cache(("s03_mask", int(wipe * 400)), lambda: _photo_mask(side, wipe))
        fr.paste(img, (px0, py0), mask)

    # La correa dibuja la caja del contador entrando por la derecha.
    path = R.cache("s03_path", lambda: Path(gfx.rounded_poly(
        [(1200, Y0), (X0, Y0), (X0, Y1), (X1, Y1), (X1, Y0)], r=24)))
    box_start = 1200 - X1
    head = path.L * ease_in_out_cubic(prog(lt, 0.0, 0.62))
    tail = box_start * ease_in_out_cubic(prog(lt, 0.22, 0.72))
    gfx.correa(fr, path, tail, head)
    sep = Vec()
    for k in range(1, n):
        sx = (cells[k - 1][1] + cells[k][0]) / 2
        tk = 0.40 + 0.06 * k
        e = ease_out_cubic(prog(lt, tk, tk + 0.2))
        if e > 0:
            sep.line([(sx, Y0 + 14), (sx, lerp(Y0 + 14, Y1 - 14, e))], 4)
    sep.commit(fr, CORREA, 0.85)

    # Salida: la línea sale del último dígito y sube.
    ex = Path([(X1, Y0), (X1, -80)])
    eh = ex.L * ease_in_out_cubic(prog(lt, 2.35, 2.72))
    et = ex.L * ease_in_cubic(prog(lt, 2.55, dur))
    gfx.correa(fr, ex, et, eh, fade=80)

    if R.text:
        T = R.cfg["textos"]
        pl = spring(lt - 0.30, 2.6, 9.5)
        lv = Vec()
        lv.text((TXT_CX, 300 + 30 * (1 - pl)), T["s03_etiqueta"], 40, anchor="ms",
                tracking=6, fill=int(255 * clamp((lt - 0.3) / 0.1)),
                qa="s03 etiqueta" if pl > 0.995 else None)
        lv.commit(fr, CREMA)

        val = counter_value(lt, dias)
        if val is not None:
            dv = Vec()
            new = str(val).rjust(n)
            old, roll = None, 0.0
            for (t, v), (t_prev, v_prev) in zip(S03_PASOS[1:], S03_PASOS[:-1]):
                if t <= lt < t + 0.12:
                    old, roll = str(v_prev).rjust(n), ease_out_cubic(prog(lt, t, t + 0.12))
            size = 150
            for k, (a, b) in enumerate(cells):
                cx, base = (a + b) / 2, (Y0 + Y1) / 2 + 0.365 * size
                if old is not None and old[k] != new[k]:
                    if old[k] != " ":
                        dv.text((cx, base - 70 * roll), old[k], size, anchor="ms")
                    if new[k] != " ":
                        dv.text((cx, base + 70 * (1 - roll)), new[k], size, anchor="ms")
                elif new[k] != " ":
                    dv.text((cx, base), new[k], size, anchor="ms",
                            qa="s03 cifra" if val == dias else None)
            clip = R.cache("s03_cellmask", lambda: _cell_mask(cells, Y0, Y1))
            dv.m.paste(0, (0, 0), clip)
            dv.commit(fr, BLANCO)

        ps = spring(lt - 2.0, 2.6, 9.5)
        if lt >= 2.0:
            sv = Vec()
            sv.text((TXT_CX, 606 + 26 * (1 - ps)), T["s03_sub"], 42, anchor="ms",
                    fill=int(255 * clamp((lt - 2.0) / 0.1)),
                    qa="s03 sub" if ps > 0.995 else None)
            sv.commit(fr, CREMA, 0.9)
    return fr


def _photo_mask(side, wipe):
    m = Image.new("L", (side * SS, side * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, m.width - 1, m.height - 1),
                                        radius=28 * SS, fill=255)
    h = int(m.height * wipe)
    m.paste(0, (0, h, m.width, m.height))
    return m.reduce(SS)


def _cell_mask(cells, Y0, Y1):
    """Máscara invertida (255 = fuera de las celdas) para recortar los dígitos."""
    m = Image.new("L", (W * SS, H * SS), 255)
    d = ImageDraw.Draw(m)
    for a, b in cells:
        d.rectangle((a * SS, (Y0 + 14) * SS, b * SS, (Y1 - 14) * SS), fill=0)
    return m


# ================================================================ 04 · La liga

CARD_W, CARD_H = 300, 533
SLOTS = [(250, 905, -7), (495, 862, 0), (740, 905, 7), (360, 1175, -3), (630, 1185, 4)]
FRAME = (70, 210, 1010, 1440)


def card_image(img):
    im = img.convert("RGBA")
    m = Image.new("L", (CARD_W * SS, CARD_H * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, m.width - 1, m.height - 1),
                                        radius=22 * SS, fill=255)
    im.putalpha(m.reduce(SS))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((1, 1, CARD_W - 2, CARD_H - 2), radius=22,
                        outline=(246, 239, 232, 60), width=2)
    return im


def card_corners(cx, cy, rot, tilt=0.94):
    hw, hh = CARD_W / 2, CARD_H / 2
    pts = [(-hw * tilt, -hh), (hw * tilt, -hh), (hw, hh), (-hw, hh)]
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return [(cx + x * c - y * s, cy + x * s + y * c) for x, y in pts]


def frame_paths():
    x0, y0, x1, y1 = FRAME
    mid = (x0 + x1) / 2
    left = Path(gfx.rounded_poly([(mid, y1), (x0, y1), (x0, y0), (mid, y0)], r=30))
    right = Path(gfx.rounded_poly([(mid, y1), (x1, y1), (x1, y0), (mid, y0)], r=30))
    return left, right


def s04(R, lt, dur):
    fr = gfx.solid(FONDO)
    cards = R.cards
    n = len(cards)
    order = list(range(n))
    landed = [S04_LLEGADAS[i] + S04_VIAJE for i in range(n)]

    # Tarjetas que ascienden (detrás del contador).
    for i in order:
        ta = S04_LLEGADAS[i]
        if lt < ta:
            continue
        cx, cy, rot = SLOTS[i]
        e = ease_out_quint(prog(lt, ta, landed[i]))
        dy = 1500 * (1 - e)
        dx = 0.0
        for j in range(n):  # cada llegada empuja levemente a las ya posadas
            if j == i or S04_LLEGADAS[j] < ta:
                continue
            tau = lt - (S04_LLEGADAS[j] + 0.30)
            if tau > 0 and lt > landed[i]:
                k = math.exp(-7 * tau) * math.sin(2 * math.pi * 2.2 * tau)
                dy -= 12 * k
                dx += 9 * k * (1 if cx > SLOTS[j][0] else -1)
        rank = sorted(range(n), key=lambda k: SLOTS[k][0]).index(i)
        ph = (lt - S04_CIFRA - 0.07 * rank) / 0.32
        wave = math.sin(math.pi * ph) if 0 <= ph <= 1 else 0.0
        dy -= 16 * wave
        corners = card_corners(cx + dx, cy + dy, rot)
        sv = Vec()
        sv.polygon(corners)
        sv.commit(fr, "#000000", 0.5, blur=16, offset=(0, 18))
        xs, ys = [p[0] for p in corners], [p[1] for p in corners]
        bx, by = int(math.floor(min(xs))), int(math.floor(min(ys)))
        bw, bh = int(math.ceil(max(xs))) - bx, int(math.ceil(max(ys))) - by
        if by < H and bh > 0:
            dst = [(x - bx, y - by) for x, y in corners]
            coeffs = gfx.perspective_coeffs(dst, [(0, 0), (CARD_W, 0), (CARD_W, CARD_H), (0, CARD_H)])
            warped = cards[i].transform((bw, bh), Image.PERSPECTIVE, coeffs, Image.BICUBIC)
            fr.paste(warped, (bx, by), warped)
        if wave > 0.01:
            ov = Vec()
            ov.polygon(corners, fill=None, outline=255, width=5)
            ov.commit(fr, CORREA, wave)

    # La onda baja y dibuja el marco del plano siguiente.
    left, right = R.cache("frame_paths", frame_paths)
    k = ease_in_out_cubic(prog(lt, 2.55, dur))
    if k > 0:
        for p in (left, right):
            gfx.correa(fr, p, 0, p.L * k, width=5)

    if R.text:
        T = R.cfg["textos"]
        p = spring(lt - 0.10, 2.6, 9.5)
        a = clamp((lt - 0.10) / 0.1)
        if a > 0:
            base = 440 + 40 * (1 - p)
            cv = Vec()
            if lt < S04_CIFRA:
                val = R.cfg["seguidores"] * ease_out_expo(prog(lt, 0.15, S04_CIFRA))
                if val < 1000:
                    s = f"{int(val)}"
                else:
                    s = f"{val / 1000:.1f}K".replace(".", ",")
                tabular(cv, s, TXT_CX, base, 170, fill=int(255 * a))
            else:
                m = gfx.text_mask(R.cfg["seguidores_final"], 170)
                punch = 1 + 0.10 * math.exp(-9 * (lt - S04_CIFRA)) * math.cos(
                    2 * math.pi * 2.6 * (lt - S04_CIFRA))
                mask, wpx, asc, pad = m
                cy = base - pad - asc + mask.height / SS / 2
                gfx.stamp_centered(cv, mask, TXT_CX, cy, 255, punch, punch)
                if lt - S04_CIFRA > 0.5:
                    gfx.qa_box("s04 cifra", (TXT_CX - wpx / 2, base - 124, TXT_CX + wpx / 2, base))
            gfx.drop_shadow_text(fr, cv)
        ps = spring(lt - 0.25, 2.6, 9.5)
        if lt >= 0.25:
            sv = Vec()
            sv.text((TXT_CX, 510 + 26 * (1 - ps)), T["s04_sub"], 42, anchor="ms",
                    fill=int(255 * clamp((lt - 0.25) / 0.1)),
                    qa="s04 sub" if ps > 0.995 else None)
            gfx.drop_shadow_text(fr, sv, CREMA)
    return fr


# ================================================================ 05 · El momento humano

SPLIT_Y = 470


def split_segments():
    seg, gap = 810 / 4, 8
    return [(90 + i * seg + (gap if i else 0), 90 + (i + 1) * seg - (gap if i < 3 else 0))
            for i in range(4)]


def s05(R, lt, dur):
    fr = bg_frame(R.src["05"], lt, R.fps)
    x0, y0, x1, y1 = FRAME
    te = dur - 0.5
    left, right = R.cache("frame_paths", frame_paths)
    wl, wr = 250, 830  # tramo inferior que se convierte en forma de onda

    k = ease_in_out_cubic(prog(lt, te, te + 0.25))  # retracción del marco
    for p in (left, right):
        s_start = (wr - (x0 + x1) / 2) if p is right else ((x0 + x1) / 2 - wl)
        gfx.correa(fr, p, s_start, lerp(p.L, s_start, k), width=5)

    u = ease_in_out_cubic(prog(lt, te + 0.25, dur))
    if u <= 0:
        # Forma de onda reactiva al audio del clip (o al placeholder).
        stretch = k
        a0, a1 = lerp(wl, -20, stretch), lerp(wr, W + 20, stretch)
        xs = np.linspace(a0, a1, 140)
        pts = []
        for x in xs:
            d = abs(x - (a0 + a1) / 2) / ((a1 - a0) / 2)
            taper = math.sin(math.pi * clamp((x - a0) / (a1 - a0))) ** 0.8
            amp = 120 * R.env05(lt - d * 0.25) * taper * (1 - stretch)
            pts.append((x, y1 - amp * math.sin(2 * math.pi * (x - 540) / 30 - lt * 22)))
        gfx.draw_correa(fr, [(pts, 255)], width=5)
    else:
        # Se estira, sube y se divide en cuatro: los pilares de la escena 06.
        y = lerp(y1, SPLIT_Y, u)
        q = 1120 / 4
        for i, (sa, sb) in enumerate(split_segments()):
            a = lerp(-20 + i * q, sa, u)
            b = lerp(-20 + (i + 1) * q, sb, u)
            col = gfx.mix(CORREA, PILARES[PILAR_ORDEN[i]], u)
            gfx.draw_correa(fr, [([(a, y), (b, y)], 255)], color=col, width=lerp(5, 7, u))
    return fr


# ================================================================ 06 · Cuatro universos

def strand_y(i):
    return 430 + 20 * i


def whip(prev, nxt, u, blur_px):
    """Barrido horizontal (whip pan) con desenfoque de movimiento."""
    a = np.concatenate([np.asarray(prev), np.asarray(nxt)], axis=1).astype(np.float32)
    acc = np.zeros((H, W, 3), np.float32)
    n = 6
    for j in range(n):
        off = int(clamp(u * W + (j / (n - 1) - 0.5) * blur_px, 0, W))
        acc += a[:, off:off + W]
    return Image.fromarray((acc / n).astype(np.uint8))


def s06(R, lt, dur):
    d = dur / 4
    i = min(3, int(lt // d))
    srcs = R.src["06"]
    wwin = 0.10
    fr = None
    for k in range(1, 4):
        b = k * d
        if b - wwin <= lt < b + wwin:
            u = ease_in_out_cubic(prog(lt, b - wwin, b + wwin))
            prev = srcs[k - 1].frame(int(round((lt - (k - 1) * d) * R.fps)))
            nxt = srcs[k].frame(int(round(max(0.0, lt - b) * R.fps)))
            blur = 260 * math.sin(math.pi * u)
            fr = whip(prev, nxt, u, blur)
            break
    if fr is None:
        fr = srcs[i].frame(int(round((lt - i * d) * R.fps))).copy()

    if R.text:
        gfx.scrim_top(fr, 0.5)

    # Las cuatro líneas: llegan desde la división de la escena 05 y se apilan.
    allk = ease_out_cubic(prog(lt, dur - 0.32, dur - 0.12))
    segs = split_segments()
    for j in range(4):
        p = spring(lt - 0.04 * j, 2.4, 9.0)
        ya = lerp(SPLIT_Y, strand_y(j), p)
        xa = lerp(segs[j][0], 90, p)
        xb = lerp(segs[j][1], 900, p)
        col = PILARES[PILAR_ORDEN[j]]
        active = j == i
        on = ease_out_cubic(prog(lt, j * d, j * d + 0.3))
        bright = max(allk, 1.0 if active else 0.0)
        gfx.draw_correa(fr, [([(xa, ya), (xb, ya)], 255)], color=col, width=4,
                        alpha=0.38, halo=False)
        if bright > 0:
            xe = lerp(xa, xb, on) if active and allk == 0 else xb
            if xe - xa > 1:
                gfx.draw_correa(fr, [([(xa, ya), (xe, ya)], 255)], color=col,
                                width=lerp(4, 8, bright), alpha=bright)

    if R.text:
        labels = R.cfg["textos"]["s06_pilares"]
        size = R.cache("s06_size", lambda: min(gfx.fit_size(l, 790, 108) for l in labels))
        v = Vec()
        for j in range(4):
            ti = j * d  # entra con el barrido, cuando el plano saliente ya se ha ido
            if lt < ti:
                continue
            pin = spring(lt - ti, 2.0, 12.0)
            x = 90 + 640 * (1 - pin)
            if j < 3:
                be = (j + 1) * d
                q = ease_in_back(prog(lt, be - wwin, be + 0.02), 1.4)
                x -= 1150 * q
                if q >= 1:
                    continue
            settled = abs(x - 90) < 1
            v.text((x, 390), labels[j], size, qa=f"s06 {labels[j]}" if settled else None)
        gfx.drop_shadow_text(fr, v)
    return fr


# ================================================================ 07 · La gran idea

LEMA_Y = 1010


def s07(R, lt, dur):
    d6 = R.tl.starts[6] - R.tl.starts[5]
    last = R.src["06"][3].frame(int(round(d6 / 4 * R.fps)) - 1)
    kdark = 0.10 + 0.25 * (1 - ease_out_cubic(prog(lt, 0, 0.35)))
    fr = gfx.darken(last, kdark)

    # Convergencia de las cuatro líneas en una sola caoba.
    flick = None
    if S07_PARPADEO <= lt < S07_PARPADEO + 8 / 30:
        flick = PILARES[PILAR_ORDEN[int((lt - S07_PARPADEO) * 30 / 2) % 4]]
    for j in range(4):
        p = spring(lt - 0.03 * j, 2.4, 9.0)
        y = lerp(strand_y(j), LEMA_Y, p)
        col = gfx.mix(PILARES[PILAR_ORDEN[j]], CORREA, clamp(p))
        if flick:
            col = flick
        gfx.draw_correa(fr, [([(90, y), (900, y)], 255)], color=col,
                        width=lerp(8, 9, clamp(p)), alpha=1.0 if j == 0 else 1 - clamp(p) * 0.999)

    if R.text:
        T = R.cfg["textos"]
        lines = T["s07_a"] + T["s07_b"]
        size = R.cache("s07_size", lambda: min(gfx.fit_size(l, 790, 124) for l in lines))
        lh = size * 1.0
        shift = (2 * lh + 36) * spring(lt - S07_B, 2.2, 9.0)
        v = Vec()
        for blk, (ta, base_lines) in enumerate(((S07_A, T["s07_a"]), (S07_B, T["s07_b"]))):
            if lt < ta:
                continue
            for li, s in enumerate(base_lines):
                p = spring(lt - ta - 0.05 * li, 2.2, 8.5)
                y = LEMA_Y - 34 - (1 - li) * lh + (1 - p) * 2.4 * lh
                if blk == 0:
                    y -= shift
                settled = abs(1 - p) < 0.003 and (blk == 1 or lt - S07_B > 0.8)
                v.text((TXT_CX, y), s, size, anchor="ms",
                       qa=f"s07 {s}" if settled else None)
        v.clear((0, LEMA_Y - 10, W, H))
        v.commit(fr, BLANCO)
    return fr


# ================================================================ 08 · El cierre

def s08(R, lt, dur):
    c = R.cfg["clips"]["08_salto_furgo"]
    L = R.tl.aterrizaje
    fr = R.src["08"].frame(int(round(lt * R.fps)))
    fr = gfx.zoom(fr, 1 + gfx.impact(lt - L), tuple(c["punto_aterrizaje"])).copy()
    user = R.cfg["usuario"]
    size = R.cache("s08_size", lambda: gfx.fit_size(user, 720, 72))
    tw = gfx.text_width(user, size)
    y_line = 372
    head = lerp(-40, 90 + tw, ease_in_out_cubic(prog(lt, L + 0.10, L + 0.55)))
    tail = lerp(-40, 90, ease_out_cubic(prog(lt, L + 0.42, L + 0.75)))
    if R.text and lt > L:
        gfx.scrim_top(fr, 0.45 * ease_out_cubic(prog(lt, L, L + 0.3)))
        v = Vec()
        v.text((90, 340), user, size, qa="s08 usuario" if head >= 90 + tw - 0.5 else None)
        v.clear((head - 4, 0, W, H))
        gfx.drop_shadow_text(fr, v)
    if head > -40:
        p = Path([(-40, y_line), (90 + tw, y_line)])
        gfx.correa(fr, p, tail + 40, head + 40, fade=0)
    return fr


# ================================================================ 09 · Firma

def s09(R, lt, dur):
    fr = gfx.solid(FONDO)
    user = R.cfg["usuario"]
    size = R.cache("s09_size", lambda: gfx.fit_size(user, 700, 74))
    tw = gfx.text_width(user, size)
    if R.text:
        v = Vec()
        v.text((540, 960), user, size, anchor="ms", qa="s09 usuario")
        v.commit(fr, BLANCO)
    gfx.draw_correa(fr, [([(540 - tw / 2, 1004), (540 + tw / 2, 1004)], 255)])
    return fr


SCENES = [s01, s02, s03, s04, s05, s06, s07, s08, s09]
