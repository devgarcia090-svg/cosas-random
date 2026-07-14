/*
 * miscale.js — Lectura directa de la Xiaomi Mi Body Composition Scale 2
 * por Bluetooth, usando Web Bluetooth (Chrome en Android / PC).
 *
 * En iPhone NO funciona (Safari no soporta Web Bluetooth); usar Android/PC.
 *
 * La báscula expone el servicio "Body Composition" (0x181B) y notifica una
 * trama de 13 bytes con peso + impedancia. El % de grasa y la masa magra se
 * calculan a partir de la impedancia con una fórmula abierta (aproxima a la
 * app oficial; para SEGUIR TU TENDENCIA es más que suficiente).
 */

const BODY_COMPOSITION_SERVICE = 0x181b;
const BODY_COMPOSITION_MEASUREMENT = 0x2a9c;

function bluetoothAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth;
}

// --- Decodificación de la trama de 13 bytes ---
// Función pura y testeable.
function parseMeasurement(bytes) {
  if (!bytes || bytes.length < 13) return null;
  const ctrl0 = bytes[0];
  const ctrl1 = bytes[1];

  const weightRemoved = !!(ctrl1 & (1 << 7)); // el usuario se ha bajado
  const stabilized = !!(ctrl1 & (1 << 5));    // medición estable
  const isImperial = !!(ctrl0 & (1 << 0));     // libras
  const isCatty = !!(ctrl0 & (1 << 6));        // jin (catty)

  const impedance = bytes[9] | (bytes[10] << 8);
  let weight = bytes[11] | (bytes[12] << 8);
  weight = (isImperial || isCatty) ? weight / 100 : weight / 200; // kg

  return {
    weightKg: Math.round(weight * 10) / 10,
    impedance,
    stabilized,
    weightRemoved,
    hasImpedance: impedance > 0 && impedance < 3000,
  };
}

/*
 * Composición corporal a partir de peso + impedancia (fórmula abierta,
 * basada en la masa magra estimada). Devuelve grasa % y masa magra (kg).
 */
function bodyComposition({ weightKg, impedance, heightCm, age, sex }) {
  if (!weightKg || !impedance || !heightCm) return {};
  const a = age || 30;

  // Masa magra (Lean Body Mass) — fórmula usada por proyectos open-source
  // para las básculas Xiaomi.
  let lbm = (heightCm * 9.058 / 100) * (heightCm / 100);
  lbm += weightKg * 0.32 + 12.226;
  lbm -= impedance * 0.0068;
  lbm -= a * 0.0542;

  // Ajuste ligero por sexo (los hombres tienen algo más de masa magra)
  if (sex === 'female') lbm -= 0.8;

  // No dejar valores absurdos
  lbm = Math.max(weightKg * 0.4, Math.min(weightKg * 0.97, lbm));

  const fatMass = weightKg - lbm;
  let bodyFatPct = (fatMass / weightKg) * 100;
  bodyFatPct = Math.max(4, Math.min(65, bodyFatPct));

  return {
    bodyFatPct: Math.round(bodyFatPct * 10) / 10,
    // La "masa magra" es principalmente músculo+agua+hueso; la usamos como
    // proxy de masa muscular para seguir la evolución.
    muscleMassKg: Math.round(lbm * 10) / 10,
  };
}

/*
 * Conecta con la báscula y espera una medición estable.
 * context: { heightCm, age, sex } para calcular la composición.
 * Devuelve { weightKg, impedance, bodyFatPct, muscleMassKg }.
 */
async function readOnce(context, { timeoutMs = 30000 } = {}) {
  if (!bluetoothAvailable()) throw new Error('NO_BT');

  const device = await navigator.bluetooth.requestDevice({
    filters: [{ services: [BODY_COMPOSITION_SERVICE] }],
    optionalServices: [BODY_COMPOSITION_SERVICE],
  });

  const server = await device.gatt.connect();
  const service = await server.getPrimaryService(BODY_COMPOSITION_SERVICE);
  const char = await service.getCharacteristic(BODY_COMPOSITION_MEASUREMENT);

  return await new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('TIMEOUT'));
    }, timeoutMs);

    function cleanup() {
      try { char.stopNotifications(); } catch { /* ignore */ }
      try { if (device.gatt.connected) device.gatt.disconnect(); } catch { /* ignore */ }
      clearTimeout(timer);
    }

    function onValue(event) {
      const dv = event.target.value;
      const bytes = new Uint8Array(dv.buffer);
      const m = parseMeasurement(bytes);
      if (!m) return;
      // Esperamos a una lectura estable, con la persona encima y con impedancia
      if (m.stabilized && !m.weightRemoved && m.hasImpedance) {
        done = true;
        cleanup();
        const comp = bodyComposition({
          weightKg: m.weightKg,
          impedance: m.impedance,
          heightCm: context.heightCm,
          age: context.age,
          sex: context.sex,
        });
        resolve({ weightKg: m.weightKg, impedance: m.impedance, ...comp });
      }
    }

    char.startNotifications()
      .then(() => char.addEventListener('characteristicvaluechanged', onValue))
      .catch(err => { cleanup(); reject(err); });
  });
}

function errorMessage(err) {
  const map = {
    NO_BT: 'Tu navegador no soporta Bluetooth. Usa Chrome en Android o PC (en iPhone no es posible).',
    TIMEOUT: 'No se recibió una lectura estable. Súbete a la báscula y mantente quieto unos segundos.',
    NotFoundError: 'No se seleccionó ninguna báscula.',
  };
  return map[err.message] || map[err.name] || `Error de Bluetooth: ${err.message}`;
}

window.MiScale = {
  bluetoothAvailable,
  parseMeasurement,
  bodyComposition,
  readOnce,
  errorMessage,
};
