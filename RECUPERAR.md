# Recuperar la web de Maya desde Cloudflare

El código fuente en local se perdió (el PC se rompió), pero el Worker sigue
desplegado en Cloudflare, así que se puede descargar el código tal como quedó
publicado.

- **Cuenta (account_id):** `c21d634c54dbb741978cf0efd1135bc8`
- **Worker:** `mayarottweiler` (entorno `production`)

## Opción A — Rápida, desde el navegador (sin instalar nada)

1. Entra en el Worker `mayarottweiler` en el dashboard de Cloudflare.
2. Pulsa **"Edit code"** / **"Quick edit"** (el editor `</>`).
3. Se abre el código desplegado con todos sus ficheros. Cópialos a mano.

Ideal si el Worker es pequeño.

## Opción B — Descargar todo con el script (API)

1. Crea un **API Token**:
   Dashboard → perfil (arriba dcha) → **My Profile** → **API Tokens**
   → **Create Token** → plantilla **"Edit Cloudflare Workers"**
   (o personalizada con `Account > Workers Scripts > Read`).

2. Ejecuta:

   ```bash
   export CF_API_TOKEN="pega_aqui_tu_token"
   python3 recover-maya-worker.py
   ```

3. El código aparece en la carpeta `recovered/`.

El script detecta solo si el Worker es de un fichero o de varios módulos.

## Volver a desplegar (cuando ya tengas el código)

Con [Wrangler](https://developers.cloudflare.com/workers/wrangler/):

```bash
npm install -g wrangler      # o: npx wrangler
wrangler login
# ...edita el código...
wrangler deploy
```

## Aviso sobre assets estáticos

Si la web sirve HTML/CSS/imágenes como **Static Assets** de Cloudflare, esos
ficheros **no** vienen en la descarga del script (que solo trae el código JS del
Worker). Si es el caso, se recupera de otra forma — avísame.

## Volver a una versión anterior sin descargar nada

En la pestaña **Deployments → Version History** puedes hacer *rollback* a
cualquiera de las últimas 100 versiones desde el menú `...` de cada versión.
Útil si solo quieres restaurar el sitio online, aunque no te devuelve los
ficheros al PC.
