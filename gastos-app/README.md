# Mis gastos — web + Atajos de Apple

App web para registrar gastos desde el iPhone: cada vez que pagas con el móvil,
un **Atajo de Apple** manda el gasto a tu propia API y lo ves en la web, con el
detalle de los **gastos hormiga** (esos pequeños que no duelen de uno en uno
pero se comen el mes).

- **Backend + web:** un solo Cloudflare Worker (gratis para este uso).
- **Base de datos:** Cloudflare D1 (SQLite).
- **Sin build, sin frameworks, sin dependencias** en el navegador.
- **Privado:** solo tú, con un token que tú generas.

## Qué hace

- Registra gastos por API (`POST /api/gastos`) desde Atajos, o a mano desde la web.
- **Adivina la categoría** por el nombre del comercio (Mercadona → super,
  Cabify → transporte, Netflix → suscripciones…). Si no la adivina, el gasto
  entra en la cola **"Por revisar"** y lo clasificas de un toque en la web.
- **Gastos hormiga:** marca automáticamente todo lo que baja del umbral que
  elijas (10 € por defecto), y te dice cuánto suman al mes, qué porcentaje son
  y **cuánto serían al año** a ese ritmo.
- Resumen mensual: total, media al día, proyección de fin de mes, presupuesto,
  reparto por categoría, gráfico día a día e histórico de meses.

## Montarlo (10 minutos)

Necesitas una cuenta de Cloudflare y Node instalado.

```bash
cd gastos-app
npm install

# 1) Crea la base de datos
npx wrangler d1 create gastos
#    Copia el `database_id` que te imprime y pégalo en wrangler.toml

# 2) Crea las tablas (en la base de datos remota)
npx wrangler d1 execute gastos --remote --file=./schema.sql

# 3) Genera un token secreto y guárdalo en el Worker
openssl rand -hex 24          # copia el resultado
npx wrangler secret put API_TOKEN   # y pégalo aquí

# 4) Despliega
npx wrangler deploy
```

Te dará una URL tipo `https://gastos.TU-SUBDOMINIO.workers.dev`. Ábrela,
pega el token y ya estás dentro. En el iPhone: **Compartir → Añadir a pantalla
de inicio** y se comporta como una app.

> El token se guarda en el `localStorage` del navegador, así que solo lo metes
> una vez por dispositivo.

### Probarlo en local

```bash
npx wrangler d1 execute gastos --local --file=./schema.sql
echo 'API_TOKEN=prueba123' > .dev.vars
npx wrangler dev
```

## Configurar el Atajo

Está en **[ATAJOS-APPLE.md](ATAJOS-APPLE.md)**, paso a paso, incluida la
automatización que se dispara sola al pagar con Apple Pay.

## La API

Todas las rutas necesitan el token, en la cabecera `X-Token`, en
`Authorization: Bearer …` o en `?token=…` (esto último es lo cómodo para Atajos).

| Método | Ruta | Para qué |
|---|---|---|
| `POST` | `/api/gastos` | Registrar un gasto |
| `GET` | `/api/gastos?mes=YYYY-MM&categoria=&hormiga=1&revisado=0` | Listar |
| `PATCH` | `/api/gastos/:id` | Editar (categoría, importe, hormiga…) |
| `DELETE` | `/api/gastos/:id` | Borrar |
| `GET` | `/api/resumen?mes=YYYY-MM` | Totales, hormigas, categorías, días |
| `GET`/`PUT` | `/api/config` | Umbral hormiga, presupuesto, zona horaria |
| `GET` | `/api/ping` | Comprobar el token |

### Crear un gasto

Campos (todos opcionales menos `importe`):

| Campo | Ejemplo | Notas |
|---|---|---|
| `importe` | `12.5`, `"12,50"`, `"12,50 €"` | Obligatorio. Acepta coma o punto |
| `comercio` | `"Mercadona"` | De aquí sale la categoría automática |
| `descripcion` | `"Café con Ana"` | |
| `categoria` | `"cafe"` | Si no la mandas, se adivina |
| `metodo` | `"movil"` | |
| `hormiga` | `1` / `0` | Si no la mandas, se decide por el umbral |
| `fecha` | `"2026-08-18T19:04:00Z"` | Por defecto, ahora |
| `nota` | `"impulso, tenía hambre"` | |

```bash
curl -X POST "https://TU-WORKER.workers.dev/api/gastos?token=TU_TOKEN" \
  -H 'content-type: application/json' \
  -d '{"importe":"3,20","comercio":"Cafetería La Plaza","metodo":"movil"}'
```

Respuesta:

```json
{
  "ok": true,
  "gasto": { "id": 1, "importe": 3.2, "categoria": "cafe", "hormiga": true, "…": "…" },
  "mensaje": "3.20 € · Cafetería La Plaza · cafe 🐜"
}
```

El campo `mensaje` está pensado para que el Atajo lo enseñe como notificación:
confirmas de un vistazo que ha quedado registrado.

También acepta el cuerpo como formulario, como texto suelto (`"12,50 Mercadona"`)
o como parámetros en la URL, porque Atajos manda las cosas de formas distintas
según cómo montes la acción.

## Ajustar la categorización

Las reglas están en `src/index.js`, en la constante `REGLAS`: una lista de
`[categoría, [palabras que aparecen en el nombre del comercio]]`. Añade ahí los
sitios donde compras habitualmente y a partir de entonces entrarán ya
clasificados, sin pasar por "Por revisar". Las categorías disponibles están en
`CATEGORIAS`.
