# 📲 NutriTrack como app Android (APK)

NutriTrack puede empaquetarse como app Android con **Capacitor**, lo que le da
**Bluetooth nativo** para leer básculas estándar (como la **Beurer BF500**) que
el navegador no puede manejar bien. Toda la app web (nutrición, Coach IA,
gráficas…) va incluida; se añade el lector de báscula por Bluetooth.

## Cómo se genera el APK (sin instalar nada)

Hay una **GitHub Action** que compila el APK por ti:

1. En el repo → pestaña **Actions** → workflow **"Build Android APK"**.
2. **Run workflow** (o se ejecuta solo al hacer push a la rama).
3. Cuando termine (unos minutos), entra en la ejecución y descarga el
   **artifact `nutritrack-apk`** → dentro está `app-debug.apk`.

## Instalarlo en tu Android

1. Pasa el `app-debug.apk` al móvil (o descárgalo desde el móvil).
2. Ábrelo; Android pedirá permitir "instalar apps de orígenes desconocidos"
   (es normal para un APK propio). Acepta e instala.
3. Abre NutriTrack, ve a **Báscula → Leer báscula por Bluetooth**.

## Compilar en local (alternativa, con Android Studio)

```bash
npm install
npm run build           # prepara www/ + empaqueta el lector BLE nativo
npx cap add android     # crea el proyecto Android (solo la 1ª vez)
npx cap sync android
npx cap open android    # abre Android Studio → Run/Build APK
```

## Sobre el lector de báscula (importante)

- El lector usa los **servicios Bluetooth estándar** (Weight Scale 0x181D y
  Body Composition 0x181B). La **decodificación está verificada** contra la
  especificación oficial (ver `js/bcs-parser.js`, con test en Node).
- El **flujo de conexión** (`src/native-ble.mjs`) hay que **validarlo con la
  báscula física** — el Bluetooth no se puede simular. Es normal que la Beurer
  BF500 necesite algún ajuste con capturas reales (p. ej. registrar el usuario
  vía User Data Service). Cuando tengas la báscula, lo afinamos juntos.
- Permisos BLE de Android: los aporta el plugin
  `@capacitor-community/bluetooth-le` al fusionar el manifiesto.

## Estructura añadida para la APK

```
package.json            # Capacitor + esbuild
capacitor.config.json   # config de la app (appId, nombre, webDir)
scripts/build-web.mjs   # copia la web a www/
src/native-ble.mjs      # lector BLE nativo (se empaqueta a www/js/native-ble.js)
js/bcs-parser.js        # parser estándar BCS/WSS (verificado)
js/native-ble.js        # stub para la versión web (sin Bluetooth nativo)
.github/workflows/build-apk.yml  # CI que genera el APK
```
