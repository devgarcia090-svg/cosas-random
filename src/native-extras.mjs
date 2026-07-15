/*
 * native-extras.mjs — Funciones nativas extra de la APK:
 *   - Escáner de código de barras (cámara) → devuelve el código.
 *   - Notificación diaria de recordatorio de proteína.
 *
 * Se empaqueta con esbuild a www/js/native-extras.js. En la web se usa el
 * stub js/native-extras.js (sin estas funciones).
 */
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { LocalNotifications } from '@capacitor/local-notifications';

const PROTEIN_NOTIF_ID = 7001;

// --- Escáner de código de barras ---
async function scanBarcode() {
  const perm = await BarcodeScanner.requestPermissions();
  if (perm.camera !== 'granted' && perm.camera !== 'limited') throw new Error('NO_CAM');

  // En algunos Android el módulo de escaneo de Google se instala bajo demanda
  try {
    const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
    if (!available) await BarcodeScanner.installGoogleBarcodeScannerModule();
  } catch { /* si no aplica, seguimos */ }

  const { barcodes } = await BarcodeScanner.scan();
  if (!barcodes || !barcodes.length) return null;
  return barcodes[0].rawValue || barcodes[0].displayValue || null;
}

// --- Recordatorio diario de proteína ---
async function scheduleProteinReminder(hour, minute, proteinTarget) {
  const perm = await LocalNotifications.requestPermissions();
  if (perm.display !== 'granted') throw new Error('NO_NOTIF');
  await LocalNotifications.cancel({ notifications: [{ id: PROTEIN_NOTIF_ID }] });
  await LocalNotifications.schedule({
    notifications: [{
      id: PROTEIN_NOTIF_ID,
      title: '💪 NutriTrack — Proteína',
      body: proteinTarget
        ? `Tu objetivo de hoy son ${proteinTarget} g de proteína. ¿Vas llegando?`
        : '¿Has llegado a tu proteína de hoy?',
      schedule: { on: { hour, minute }, repeats: true, allowWhileIdle: true },
    }],
  });
}

async function cancelProteinReminder() {
  try { await LocalNotifications.cancel({ notifications: [{ id: PROTEIN_NOTIF_ID }] }); } catch {}
}

window.NativeExtras = {
  available: true,
  scanBarcode,
  scheduleProteinReminder,
  cancelProteinReminder,
};
