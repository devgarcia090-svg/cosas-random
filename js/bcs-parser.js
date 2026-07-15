/*
 * bcs-parser.js — Decodificación de los servicios Bluetooth ESTÁNDAR que usan
 * las básculas modernas (Beurer BF500 y compatibles):
 *   - Body Composition Service (0x181B) / Body Composition Measurement (0x2A9C)
 *   - Weight Scale Service     (0x181D) / Weight Scale Measurement    (0x2A9D)
 *
 * El formato está definido por el Bluetooth SIG, así que esta decodificación es
 * fiable (no es ingeniería inversa). Funciones puras → testeables en Node.
 */
(function (root) {
  'use strict';

  function round1(n) { return Math.round(n * 10) / 10; }

  // Masa: SI = 0.005 kg/unidad ; Imperial = 0.01 lb/unidad → siempre a kg
  function massToKg(raw, imperial) {
    return imperial ? raw * 0.01 * 0.45359237 : raw * 0.005;
  }

  // Body Composition Measurement (0x2A9C)
  function parseBodyComposition(dv) {
    let o = 0;
    const flags = dv.getUint16(o, true); o += 2;
    const imperial = !!(flags & 0x0001);
    const has = {
      timestamp: !!(flags & 0x0002),
      userId: !!(flags & 0x0004),
      bmr: !!(flags & 0x0008),
      musclePct: !!(flags & 0x0010),
      muscleMass: !!(flags & 0x0020),
      fatFreeMass: !!(flags & 0x0040),
      softLeanMass: !!(flags & 0x0080),
      bodyWaterMass: !!(flags & 0x0100),
      impedance: !!(flags & 0x0200),
      weight: !!(flags & 0x0400),
      height: !!(flags & 0x0800),
    };
    const out = { type: 'bcs', imperial };

    // Body Fat % siempre presente (uint16, 0.1%)
    out.bodyFatPct = round1(dv.getUint16(o, true) / 10); o += 2;

    if (has.timestamp) o += 7;
    if (has.userId) o += 1;
    if (has.bmr) { out.bmrKcal = Math.round(dv.getUint16(o, true) / 4.184); o += 2; }
    if (has.musclePct) { out.musclePct = round1(dv.getUint16(o, true) / 10); o += 2; }
    if (has.muscleMass) { out.muscleMassKg = round1(massToKg(dv.getUint16(o, true), imperial)); o += 2; }
    if (has.fatFreeMass) { out.fatFreeMassKg = round1(massToKg(dv.getUint16(o, true), imperial)); o += 2; }
    if (has.softLeanMass) { out.softLeanMassKg = round1(massToKg(dv.getUint16(o, true), imperial)); o += 2; }
    if (has.bodyWaterMass) { out.bodyWaterKg = round1(massToKg(dv.getUint16(o, true), imperial)); o += 2; }
    if (has.impedance) { out.impedance = round1(dv.getUint16(o, true) / 10); o += 2; }
    if (has.weight) { out.weightKg = round1(massToKg(dv.getUint16(o, true), imperial)); o += 2; }
    if (has.height) {
      const raw = dv.getUint16(o, true); o += 2;
      out.heightCm = imperial ? round1(raw / 10 * 2.54) : Math.round(raw / 10); // SI 0.001 m
    }

    // Agua corporal como % del peso (lo que muestra la app)
    if (out.bodyWaterKg != null && out.weightKg) {
      out.waterPct = round1(out.bodyWaterKg / out.weightKg * 100);
    }
    return out;
  }

  // Weight Scale Measurement (0x2A9D)
  function parseWeightMeasurement(dv) {
    let o = 0;
    const flags = dv.getUint8(o); o += 1;
    const imperial = !!(flags & 0x01);
    const out = { type: 'wss', imperial };
    out.weightKg = round1(massToKg(dv.getUint16(o, true), imperial)); o += 2;
    return out;
  }

  // Convierte lo leído al formato de medición de NutriTrack
  function toNutriMeasurement(bcs, wss, date) {
    const weightKg = (bcs && bcs.weightKg) || (wss && wss.weightKg) || null;
    return {
      date,
      weightKg: weightKg != null ? round1(weightKg) : null,
      bodyFatPct: bcs ? bcs.bodyFatPct ?? null : null,
      muscleMassKg: bcs ? bcs.muscleMassKg ?? bcs.fatFreeMassKg ?? null : null,
      waterPct: bcs ? bcs.waterPct ?? null : null,
      bmr: bcs ? bcs.bmrKcal ?? null : null,
    };
  }

  const api = { parseBodyComposition, parseWeightMeasurement, toNutriMeasurement, massToKg };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.BCSParser = api;
})(typeof window !== 'undefined' ? window : null);
