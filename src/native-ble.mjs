/*
 * native-ble.mjs — Lectura de la báscula por Bluetooth NATIVO (solo en la APK).
 *
 * Se empaqueta con esbuild a www/js/native-ble.js e importa el plugin
 * @capacitor-community/bluetooth-le. Usa los servicios Bluetooth ESTÁNDAR
 * (Weight Scale + Body Composition) y el parser de window.BCSParser.
 *
 * Expone window.ScaleBLE.readOnce(context) → medición en formato NutriTrack.
 *
 * ⚠️ Esta parte necesita validarse con la báscula física (el Bluetooth no se
 * puede simular). La lógica de parseo sí está verificada; el flujo de conexión
 * puede necesitar ajustes con capturas reales de tu BF500.
 */
import { BleClient } from '@capacitor-community/bluetooth-le';

const WSS_SERVICE = '0000181d-0000-1000-8000-00805f9b34fb'; // Weight Scale
const WSS_MEAS = '00002a9d-0000-1000-8000-00805f9b34fb';
const BCS_SERVICE = '0000181b-0000-1000-8000-00805f9b34fb'; // Body Composition
const BCS_MEAS = '00002a9c-0000-1000-8000-00805f9b34fb';
const UDS_SERVICE = '0000181c-0000-1000-8000-00805f9b34fb'; // User Data

function todayISO() { return new Date().toISOString().slice(0, 10); }

async function readOnce(context = {}, { timeoutMs = 45000 } = {}) {
  const P = window.BCSParser;
  if (!P) throw new Error('NO_PARSER');

  await BleClient.initialize({ androidNeverForLocation: true });

  const device = await BleClient.requestDevice({
    services: [BCS_SERVICE],
    optionalServices: [WSS_SERVICE, BCS_SERVICE, UDS_SERVICE],
  });

  let bcs = null;
  let wss = null;

  return await new Promise(async (resolve, reject) => {
    let finished = false;
    const timer = setTimeout(() => finish(null, new Error('TIMEOUT')), timeoutMs);

    async function finish(result, err) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try { await BleClient.stopNotifications(device.deviceId, BCS_SERVICE, BCS_MEAS); } catch {}
      try { await BleClient.stopNotifications(device.deviceId, WSS_SERVICE, WSS_MEAS); } catch {}
      try { await BleClient.disconnect(device.deviceId); } catch {}
      if (err) reject(err); else resolve(result);
    }

    function maybeDone() {
      // La composición corporal (grasa/músculo) es lo que buscamos; si llega,
      // ya tenemos también el peso. Damos un pequeño margen por si el peso
      // llega en una trama WSS separada.
      if (bcs && (bcs.weightKg || wss)) {
        finish(P.toNutriMeasurement(bcs, wss, todayISO()));
      }
    }

    try {
      await BleClient.connect(device.deviceId, () => { /* desconexión */ });

      // Notificaciones de composición corporal
      try {
        await BleClient.startNotifications(device.deviceId, BCS_SERVICE, BCS_MEAS, (value) => {
          try { bcs = P.parseBodyComposition(value); maybeDone(); } catch (e) { /* trama parcial */ }
        });
      } catch (e) { /* algunas básculas no exponen BCS hasta registrar usuario */ }

      // Notificaciones de peso (por si el peso viene por aquí)
      try {
        await BleClient.startNotifications(device.deviceId, WSS_SERVICE, WSS_MEAS, (value) => {
          try { wss = P.parseWeightMeasurement(value); maybeDone(); } catch (e) {}
        });
      } catch (e) { /* la báscula puede no tener WSS */ }
    } catch (e) {
      finish(null, e);
    }
  });
}

function errorMessage(err) {
  const map = {
    NO_PARSER: 'Error interno del lector.',
    TIMEOUT: 'No se recibió lectura. Súbete a la báscula y mantente quieto unos segundos.',
  };
  return map[err && err.message] || `Error de Bluetooth: ${err && (err.message || err)}`;
}

window.ScaleBLE = { readOnce, errorMessage, native: true };
