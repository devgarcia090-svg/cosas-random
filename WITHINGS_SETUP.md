# ⚖️ Vincular NutriTrack con Withings

Guía para conectar tu báscula Withings (Body Comp / Body Smart / Body+) y que la app importe automáticamente peso, grasa, músculo, agua y hueso.

Como la app es estática (sin servidor) pero Withings usa OAuth2 con un `client_secret` que no puede vivir en el navegador, montamos un pequeño **Cloudflare Worker** (gratis) que hace de intermediario. Se hace una vez.

## Resumen del flujo

```
App (navegador)  ──►  Tu Worker  ──►  API de Withings
   guarda solo         guarda el
   el refresh_token    client_secret
```

---

## Paso 1 — Crear una app en Withings (5 min)

1. Entra en el portal de desarrolladores: **https://developer.withings.com/** y crea una cuenta (o inicia sesión).
2. Crea una nueva aplicación ("Public Health Data API").
3. Anota el **Client ID** y el **Client Secret**.
4. En **Callback URL / Registered URLs** pon (de momento un placeholder, lo ajustamos en el paso 3):
   ```
   https://TU-WORKER.workers.dev/callback
   ```

## Paso 2 — Desplegar el Worker (5 min)

Necesitas [Node.js](https://nodejs.org/) instalado y una cuenta gratuita de [Cloudflare](https://dash.cloudflare.com/sign-up).

```bash
cd backend

# 1) Edita wrangler.toml y pon tu Client ID y la URL de tu app (GitHub Pages):
#    WITHINGS_CLIENT_ID = "tu_client_id"
#    APP_URL = "https://devgarcia090-svg.github.io/cosas-random/"

# 2) Inicia sesión en Cloudflare (abre el navegador)
npx wrangler login

# 3) Guarda el Client Secret como secreto (no se sube al código)
npx wrangler secret put WITHINGS_CLIENT_SECRET
#    → pega tu Client Secret cuando lo pida

# 4) Despliega
npx wrangler deploy
```

Al terminar te dará la URL del Worker, algo como:
```
https://nutritrack-withings.tu-usuario.workers.dev
```

## Paso 3 — Enlazar todo

1. Copia la URL de tu Worker del paso anterior.
2. Vuelve a la app de Withings (paso 1) y pon como **Callback URL** exactamente:
   ```
   https://nutritrack-withings.tu-usuario.workers.dev/callback
   ```
3. Abre NutriTrack → pestaña **Perfil** → tarjeta **Vincular báscula Withings**:
   - Pega la URL del Worker y pulsa **Guardar URL**.
   - Pulsa **Conectar con Withings** → autoriza en la pantalla de Withings.
   - Al volver, la app importa tus mediciones automáticamente. Después puedes pulsar **Importar mediciones** cuando quieras actualizar.

---

## Qué se importa

| Dato de Withings | Campo en NutriTrack |
|---|---|
| Peso (tipo 1) | Peso (kg) |
| % grasa (tipo 6) | Grasa corporal (%) |
| Masa muscular (tipo 76) | Masa muscular (kg) |
| Masa ósea (tipo 88) | Masa ósea (kg) |
| Hidratación (tipo 77) | Agua corporal (%) — convertida desde kg |

La grasa visceral y el BMR de báscula no están en la API pública de Withings; esos los puedes seguir metiendo a mano si tu báscula los da.

## Seguridad

- El **Client Secret** vive solo en el Worker (como secreto de Cloudflare), nunca en el navegador.
- El **refresh_token** se guarda en el `localStorage` de tu navegador. Los refresh tokens de Withings **rotan** (cambian en cada importación), y el Worker devuelve el nuevo para que la app lo actualice.
- El Worker solo acepta el origen de tu app (CORS) según `APP_URL`.

## Notas

- Verifica los endpoints/tipos en la documentación actual de Withings al registrar la app; la API es estable pero conviene confirmarlo.
- Coste: el plan gratuito de Cloudflare Workers cubre de sobra el uso personal.
