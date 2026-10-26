"""Línea de tiempo: escenas, eventos sincronizados y ajuste a la locución."""
import datetime as dt
import json

import numpy as np

import media

NOMBRES = ["01 El impacto", "02 Traduce esta frase", "03 La racha", "04 La liga",
           "05 El momento humano", "06 Cuatro universos", "07 La gran idea",
           "08 El cierre", "09 Firma"]


def load_config():
    with open(media.ROOT / "config.json", encoding="utf-8") as f:
        return json.load(f)


def detect_phrases(voice, min_sil=0.3):
    """Inicios de frase por energía: tramos de voz precedidos de ≥ min_sil s
    de silencio. Devuelve tiempos en s."""
    mono = voice.mean(axis=1) if voice.ndim == 2 else voice
    hop = int(media.SR * 0.01)
    n = len(mono) // hop
    if n == 0:
        return []
    rms = np.sqrt((mono[:n * hop].reshape(n, hop) ** 2).mean(axis=1) + 1e-12)
    db = 20 * np.log10(rms)
    floor = np.percentile(db, 10)
    thr = max(floor + 12, db.max() - 35)
    active = db > thr
    onsets, sil = [], min_sil
    for i, a in enumerate(active):
        if a:
            if sil >= min_sil:
                onsets.append(i * 0.01)
            sil = 0.0
        else:
            sil += 0.01
    return onsets


def match_anchors(onsets, anchors):
    """Asigna a cada ancla el inicio detectado más cercano, en orden."""
    out, j = [], 0
    for a in anchors:
        cands = [o for o in onsets[j:]]
        if not cands:
            out.append(None)
            continue
        best = min(range(len(cands)), key=lambda k: abs(cands[k] - a))
        out.append(cands[best])
        j += best + 1
    return out


class Timeline:
    def __init__(self, cfg, fps):
        self.cfg, self.fps = cfg, fps
        t = cfg["tiempos"]
        self.starts = list(t["escenas"])
        self.frenazo = t["frenazo"]
        self.respuesta = t["respuesta_05"]
        self.aterrizaje = t["aterrizaje_08"]
        self.voice = None
        self.voice_offset = 0.0
        self.notes = []
        self._fit_voice()
        self._days()

    # -------------------------------------------------------------- locución
    def _fit_voice(self):
        vc = self.cfg["locucion"]
        p = media.ROOT / vc["archivo"]
        if not p.exists():
            media.missing(vc["archivo"], "locución de Dani: se monta sin voz, con los rótulos como hilo")
            self.notes.append("Sin locución: tiempos de escena nominales del brief.")
            return
        self.voice = media.read_audio(p)
        onsets = detect_phrases(self.voice, vc.get("silencio_min", 0.3))
        anchors = vc["anclas"]
        det = match_anchors(onsets, anchors)
        self.notes.append(f"Inicios de frase detectados en la locución: {[round(o, 2) for o in onsets]}")
        if det[0] is None or None in det:
            self.voice_offset = vc.get("offset", 0.0)
            self.notes.append("No se encontraron las 6 frases; se usan tiempos nominales.")
            return
        # La primera frase se coloca en su ancla; el resto se mide respecto a ella.
        self.voice_offset = anchors[0] - det[0] + vc.get("offset", 0.0)
        real = [d + self.voice_offset for d in det]
        s = list(self.starts)
        s[1] = 2.0 + (real[1] - anchors[1])
        s[2] = 5.0 + (real[2] - anchors[2])
        s[3] = 8.0 + (real[3] - anchors[3])
        s[4] = s[3] + 3.0
        s[5] = s[4] + 2.0
        s[6] = 16.0 + (real[4] - anchors[4])
        s[7] = real[5] - self.aterrizaje - 0.1
        s[8] = s[7] + 2.0
        s[9] = s[8] + 2.0
        durs = np.diff(s)
        if durs.min() < 1.2 or s[6] - s[5] < 2.4:
            self.notes.append(f"Anclas reales incompatibles ({[round(x, 2) for x in real]}); "
                              "se mantienen tiempos nominales.")
            return
        self.starts = s
        self.notes.append("Escenas reajustadas a la locución: "
                          + ", ".join(f"{x:.2f}" for x in s))

    def _days(self):
        nac = dt.date.fromisoformat(self.cfg["fecha_nacimiento"])
        pub = self.cfg.get("fecha_publicacion")
        pub = dt.date.fromisoformat(pub) if pub else dt.date.today()
        self.fecha_publicacion = pub
        self.dias = (pub - nac).days

    # -------------------------------------------------------------- consulta
    @property
    def total(self):
        return self.starts[-1]

    def scene_at(self, t):
        for i in range(9):
            if t < self.starts[i + 1]:
                return i, t - self.starts[i], self.starts[i + 1] - self.starts[i]
        return 8, t - self.starts[8], self.starts[9] - self.starts[8]

    def events(self):
        s = self.starts
        return {
            "frenazo": s[0] + self.frenazo,
            "fichas": s[1] + 1.90,
            "acierto_02": s[1] + 2.30,
            "cifra_24k": s[3] + 2.0,
            "lema": s[6] + 1.80,
            "aterrizaje": s[7] + self.aterrizaje,
            "firma": s[8] + 1.0,
        }
