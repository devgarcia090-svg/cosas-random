# 💪 NutriTrack

App de **nutrición y seguimiento de composición corporal**, pensada para llevar el control con una báscula de bioimpedancia y conseguir la mejor versión de ti mismo. Enfoque actual: **ganar músculo**.

Funciona **sin servidor**: HTML/CSS/JavaScript puro. Tus datos se guardan en tu dispositivo (localStorage). Se puede usar como **web** o instalar como **app Android (APK)** con lectura de báscula por Bluetooth.

## 🚀 Cómo usarla

1. Abre `index.html` en el navegador **o** instala la APK (ver `BUILD_APK.md`).
2. En **Perfil**, rellena tus datos (altura, edad, sexo, actividad y objetivo).
3. En **Báscula**, registra tu peso y métricas (a mano o leyendo la báscula por Bluetooth en la APK).
4. La app calcula tus **objetivos de calorías y macros** automáticamente.
5. En **Hoy**, busca alimentos (los macros se rellenan solos) y registra tus comidas.
6. En **Progreso**, mira la evolución de peso, grasa vs. músculo y calorías.

## 🍽️ Buscador de alimentos (Open Food Facts)

En **Hoy → Añadir comida** tienes un buscador conectado a **Open Food Facts**, una base de datos abierta, **gratis y sin clave**, con millones de alimentos y productos (incluidos los de supermercados españoles):

- Escribe cualquier alimento o marca → se rellenan **calorías, proteína, carbos y grasa** automáticamente.
- Ajusta los **gramos** y los macros se recalculan solos.
- Sin internet, sigue funcionando una lista básica local integrada.

No necesitas saberte ningún valor: buscas, eliges y pones la cantidad.

## ⚖️ Báscula por Bluetooth (en la APK)

La app instalada como APK Android puede **leer la báscula por Bluetooth** y rellenar la medición sola. Usa los servicios Bluetooth estándar (Body Composition / Weight Scale), compatibles con básculas como la **Beurer BF500**. Ver `BUILD_APK.md` para generar e instalar el APK.

## 📱 Pantallas

- **Hoy** — objetivos diarios (anillos de calorías/proteína/carbos/grasa), buscador de alimentos y registro de comidas.
- **Báscula** — panel corporal con todas las métricas, deltas vs. la medición anterior, IMC y FFMI.
- **Progreso** — gráficas de peso, grasa vs. músculo (con análisis automático de recomposición) y calorías.
- **Perfil** — datos personales, objetivos calculados e import/export de datos.

## 🧮 Cómo calcula los objetivos

- **BMR** (metabolismo basal): Katch-McArdle si conoce tu % de grasa; si no, Mifflin-St Jeor.
- **TDEE** (gasto total): BMR × factor de actividad.
- **Objetivo de ganar músculo**: superávit del 12% (*lean bulk*), proteína ~2 g/kg de masa magra, grasa al 25% de las calorías y el resto en carbohidratos.

## 💾 Import / Export

- **CSV de mediciones**: exporta o importa tu historial (columnas: `fecha, peso_kg, grasa_pct, musculo_kg, agua_pct, hueso_kg, grasa_visceral, bmr`).
- **Copia de seguridad JSON**: guarda o restaura todos tus datos (perfil + mediciones + nutrición).

> ⚠️ Los datos viven en el dispositivo. Haz copias de seguridad de vez en cuando; borrar los datos de la app/navegador borra tu historial.

## 🗂️ Estructura

```
index.html          # Interfaz y estructura
css/styles.css      # Estilos (responsive, tema claro/oscuro)
js/calc.js          # Cálculos: BMR, TDEE, macros, IMC, FFMI
js/storage.js       # Persistencia local + import/export CSV/JSON
js/food-db.js       # Lista de alimentos local (fallback offline)
js/food-api.js      # Búsqueda de alimentos en Open Food Facts
js/charts.js        # Gráficas SVG sin librerías
js/miscale.js       # Lectura Web Bluetooth (Xiaomi Mi 2)
js/bcs-parser.js    # Parser de básculas Bluetooth estándar (BCS/WSS)
js/native-ble.js    # Lector Bluetooth nativo (se sustituye en la APK)
js/app.js           # Lógica de la interfaz

# APK (ver BUILD_APK.md)
capacitor.config.json · package.json · scripts/build-web.mjs · src/native-ble.mjs
.github/workflows/build-apk.yml
```
