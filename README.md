# 💪 NutriTrack

App web de **nutrición y seguimiento de composición corporal**, pensada para llevar el control con una báscula de bioimpedancia y conseguir la mejor versión de ti mismo. Enfoque actual: **ganar músculo**.

Funciona **sin servidor**: es HTML/CSS/JavaScript puro, sin dependencias externas. Tus datos se guardan solo en tu navegador (localStorage). Incluye un **coach de IA** (Claude) que interpreta lo que comes en lenguaje natural.

## 🚀 Cómo usarla

1. Abre `index.html` en el navegador (doble clic) **o** publícala en GitHub Pages para usarla desde el móvil.
2. Ve a la pestaña **Perfil** y rellena tus datos (altura, edad, sexo, actividad y objetivo). Opcional: pega tu **API key de Anthropic** para activar el coach de IA.
3. En **Báscula**, registra tu peso y las métricas que te dé tu báscula (grasa, músculo, agua…).
4. La app calcula tus **objetivos de calorías y macros** automáticamente.
5. En **Hoy**, escribe lo que has comido y deja que el **Coach IA** lo analice, o registra tus comidas a mano con el buscador de alimentos.
6. En **Progreso**, mira la evolución de peso, grasa vs. músculo y calorías.

## 🤖 Coach IA

En la pestaña **Hoy** escribes con tus palabras lo que has comido (ej. *"dos huevos revueltos, 150g de arroz y una pechuga a la plancha"*) y el coach:

- Interpreta el texto y **estima los macros** de cada alimento.
- Los **añade automáticamente** a tu día.
- Da una **valoración** respecto a tu objetivo (veredicto, nivel de proteína y sugerencias accionables), teniendo en cuenta tus datos de báscula, tus objetivos y lo que ya llevas comido hoy.

Usa el modelo **Claude Opus 4.8** con salida estructurada. La llamada va directa desde tu navegador a la API de Anthropic con tu API key (se guarda solo en tu navegador, en localStorage). Necesitas una key de [console.anthropic.com](https://console.anthropic.com/); cada análisis cuesta unos céntimos.

> 🔒 **Sobre la key:** al ser una app sin servidor, la key vive en tu navegador. Es seguro para uso personal en tu propio dispositivo. Si en el futuro quieres compartir la app con más gente, conviene montar un pequeño backend que oculte la key.

### Publicar en GitHub Pages (para usarla desde el móvil)

En el repositorio: **Settings → Pages → Branch: main → /(root)**. En un par de minutos tendrás una URL pública que puedes añadir a la pantalla de inicio del móvil como si fuera una app.

## 📱 Pantallas

- **Hoy** — objetivos diarios (anillos de calorías/proteína/carbos/grasa), buscador de alimentos y registro de comidas.
- **Báscula** — panel corporal con todas las métricas, deltas vs. la medición anterior, IMC y FFMI (índice de masa magra).
- **Progreso** — gráficas de peso, grasa vs. músculo (con análisis automático de recomposición) y calorías.
- **Perfil** — datos personales, objetivos calculados e import/export de datos.

## 🧮 Cómo calcula los objetivos

- **BMR** (metabolismo basal): Katch-McArdle si conoce tu % de grasa (más preciso para gente entrenada); si no, Mifflin-St Jeor.
- **TDEE** (gasto total): BMR × factor de actividad.
- **Objetivo de ganar músculo**: superávit del 12% (*lean bulk*), proteína ~2 g/kg de masa magra, grasa al 25% de las calorías y el resto en carbohidratos.

## ⚖️ Básculas recomendadas

Como aún no tienes báscula, estas se integran bien con apps y/o exportan datos:

| Báscula | Ventaja | Integración |
|---|---|---|
| **Withings Body Comp / Body+** | Datos muy fiables, app excelente | Apple Health / Google Fit, exportación CSV |
| **Garmin Index S2** | Ideal si usas Garmin/reloj deportivo | Garmin Connect (exporta datos) |
| **Renpho / Eufy Smart Scale** | Económicas y precisas | App propia con exportación |
| **Xiaomi Mi Body Composition Scale 2** | La más barata | App Zepp Life (métricas completas) |

Con cualquiera de ellas el flujo es: te pesas → miras los números en su app → los apuntas aquí (o importas un CSV). Más adelante podemos añadir sincronización automática si tu báscula lo permite.

## 💾 Import / Export

- **CSV de mediciones**: exporta o importa tu historial (columnas: `fecha, peso_kg, grasa_pct, musculo_kg, agua_pct, hueso_kg, grasa_visceral, bmr`).
- **Copia de seguridad JSON**: guarda o restaura todos tus datos (perfil + mediciones + nutrición).

> ⚠️ Los datos viven en el navegador. Haz copias de seguridad de vez en cuando, y ten en cuenta que borrar los datos del navegador borra tu historial.

## 🗂️ Estructura

```
index.html          # Interfaz y estructura
css/styles.css      # Estilos (responsive, tema claro/oscuro)
js/calc.js          # Cálculos: BMR, TDEE, macros, IMC, FFMI
js/storage.js       # Persistencia local + import/export CSV/JSON
js/food-db.js       # Base de datos de alimentos (por 100 g)
js/charts.js        # Gráficas SVG sin librerías
js/ai-coach.js      # Coach IA: llamada a Claude + salida estructurada
js/app.js           # Lógica de la interfaz
```
