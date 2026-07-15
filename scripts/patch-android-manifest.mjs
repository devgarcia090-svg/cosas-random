/*
 * patch-android-manifest.mjs — Añade el permiso de CÁMARA al AndroidManifest.
 *
 * La carpeta android/ se genera en cada build (npx cap add android), así que
 * el manifiesto sale por defecto. El escáner de código de barras
 * (@capacitor-mlkit/barcode-scanning) necesita que declaremos a mano el
 * permiso android.permission.CAMERA; si no, Android no lo pide ni lo muestra
 * en Ajustes y el escáner siempre da "permiso denegado".
 *
 * Se ejecuta en CI justo después de "npx cap add android".
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const MANIFEST = 'android/app/src/main/AndroidManifest.xml';

if (!existsSync(MANIFEST)) {
  console.error(`No existe ${MANIFEST}. ¿Se ejecutó "npx cap add android"?`);
  process.exit(1);
}

let xml = readFileSync(MANIFEST, 'utf8');

const lines = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-feature android:name="android.hardware.camera" android:required="false" />',
];

let added = 0;
for (const line of lines) {
  const marker = line.match(/android:name="([^"]+)"/)[1];
  if (xml.includes(marker)) continue; // ya está
  // Insertamos justo antes del cierre </manifest>
  xml = xml.replace(/<\/manifest>/, `    ${line}\n</manifest>`);
  added++;
}

if (added > 0) {
  writeFileSync(MANIFEST, xml);
  console.log(`AndroidManifest.xml parcheado: ${added} línea(s) de permisos añadidas.`);
} else {
  console.log('AndroidManifest.xml ya tenía los permisos de cámara.');
}
