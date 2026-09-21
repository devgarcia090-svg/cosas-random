# Pedidos QR

Carta digital por QR con **servicio en mesa**: el cliente escanea el código de su
mesa, pide desde el navegador del móvil (sin instalar nada, sin registrarse) y la
comanda aparece al instante en la pantalla de la sala. El cobro se hace en la
mesa, como toda la vida.

MVP funcional, no un producto cerrado. Lo que hay está probado; lo que falta está
listado más abajo sin adornos.

## Qué hace

**Cliente** (`/mesa/<id-de-mesa>`)

- Carta por categorías con descripciones, precios y alérgenos.
- Tres estados de alérgenos, que no es lo mismo: lo que el plato **contiene**,
  lo que el local declara que **no lleva**, y *consulta al personal* cuando la
  carta original no declara nada. Nunca se presenta un plato como libre de
  alérgenos por el hecho de que falte el dato.
- Opciones por producto (formato media/entera, punto de la carne, extras…) con
  mínimos y máximos por grupo. Los platos con varios formatos llevan un grupo
  obligatorio: el precio base es el del formato más barato y cada opción suma
  su diferencia.
- Carrito con cantidades y notas para cocina.
- Varias rondas sobre la misma mesa: todas se agrupan en una sesión.
- Seguimiento del pedido en tiempo real: Recibido → Confirmado → En preparación →
  Servido.

**Sala** (`/cocina`)

- Comandas en vivo, ordenadas por antigüedad y marcadas en rojo a partir de 15
  minutos.
- Un botón para avanzar de estado y otro para anular.
- Aviso sonoro al entrar una comanda nueva (se puede silenciar).

**Gestión** (`/admin`)

- Marcar productos como agotados: desaparecen de la carta al instante.
- Un QR por mesa, listo para imprimir.

## Cómo está montado

- **Next.js 16** (App Router) + **Tailwind 4** + TypeScript.
- **Supabase**: Postgres, Auth y Realtime.
- Sin backend propio: el navegador habla con Supabase y las reglas viven en la
  base de datos.

Dos decisiones que sostienen todo lo demás:

1. **Los precios los pone el servidor.** El móvil no manda importes: manda qué
   productos y qué opciones quiere. La función `place_order()` valida que el
   producto esté disponible, que las opciones sean de ese producto y que se
   respeten mínimos y máximos, y calcula el total. El carrito del cliente no
   puede mentir aunque se manipule desde el propio navegador.
2. **El nombre y el precio se congelan en la línea del pedido.** Si mañana sube
   la carta, el ticket de ayer sigue diciendo lo que costó ayer.

## Puesta en marcha

1. Crea un proyecto en [supabase.com](https://supabase.com) (el plan gratuito
   sobra para probar).

2. En el **SQL Editor**, ejecuta las migraciones en orden:

   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls_and_rpc.sql`
   - `supabase/migrations/0003_orden_de_opciones.sql`
   - `supabase/migrations/0004_alergenos_declarados.sql`

   Y después **uno** de los dos juegos de datos:

   - `supabase/seed-podium.sql` — la carta real de Podium Café & Grill: 13
     categorías, 129 platos, 20 mesas. Generado desde el repositorio
     `devgarcia090-svg/podium`, que a su vez sale del PDF oficial del local.
   - `supabase/seed.sql` — un bar de demo con 6 mesas y 19 productos. Es el que
     usan las pruebas, porque sus identificadores son fijos y conocidos.

3. Copia las credenciales de *Project Settings → API*:

   ```bash
   cp .env.example .env.local
   # NEXT_PUBLIC_SUPABASE_URL=...
   # NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

4. Da de alta a un camarero. Con la cadena de conexión de *Project Settings →
   Database* (usa la pestaña **Session pooler**, que va por IPv4):

   ```bash
   psql "$DATABASE_URL" \
     -v email="'camarero@bar.test'" -v password="'tu-contraseña'" \
     -v venue="'00000000-0000-4000-8000-0000000000fe'" \
     -f supabase/crear_camarero.sql
   ```

   También se puede a mano: crear el usuario en *Authentication → Users* y
   añadir después una fila en `staff` con su `user_id` y el `venue_id`.

5. Arranca:

   ```bash
   npm install
   npm run dev
   ```

La portada lista las mesas de demo. Abre una en el móvil y `/cocina` en otra
pantalla: verás llegar la comanda sola.

## Pruebas

La lógica de pedidos y los permisos se prueban en SQL, que es donde viven:

```bash
psql "$DATABASE_URL" -f supabase/tests/01_pruebas.sql
```

Cubre 21 comprobaciones: cálculo de precios, opciones obligatorias, máximo de
extras, productos agotados, rondas y sesiones de mesa, y aislamiento entre
locales (un camarero de otro local no puede tocar estas comandas). Contra un
Postgres local sin Supabase, ejecuta antes
`supabase/tests/00_shim_postgres_local.sql`, que crea los roles y el
`auth.uid()` que la plataforma da hecho.

Las pruebas dan por hecho una base recién migrada y con `seed.sql` (el de
demo) puesto: los totales esperados se apoyan en esos datos. Contra una base
con la carta real no valen — usa un proyecto aparte o un Postgres local.

## Qué endurecer antes de producción

Está señalado aquí en vez de escondido en el código:

- **Lectura de pedidos.** Ahora mismo cualquiera con la clave anon puede leer las
  comandas de las últimas 12 horas, no sólo las de su mesa. Para un bar es
  información de poco valor, pero lo correcto es emitir un JWT de sesión por
  mesa (Edge Function) y filtrar la RLS por ese claim.
- **Límite de peticiones.** `place_order()` valida el contenido, pero nada impide
  que alguien llame mil veces. Rate limiting por IP o por sesión de mesa.
- **Fotos de producto.** El esquema tiene `image_url` pero la interfaz aún no las
  muestra.

## Qué no incluye

- **Pago con tarjeta.** Aquí se cobra en la mesa. Meter Stripe es un `payments`
  colgando de `table_sessions` y un Payment Intent por comensal para dividir
  cuenta.
- **Integración con TPV.** Es lo caro de verdad de un producto así: cada TPV
  (Glop, Hosteltáctil, Ágora…) tiene su API o su ausencia de API. Esto funciona
  por su cuenta.
- **Impresión en comandera.** Se resuelve con un agente local que hable ESC/POS
  con la impresora de cocina.
- **Multi-local en la interfaz.** El modelo de datos ya es multi-local; las
  pantallas asumen el primero del camarero.

## Despliegue

En producción: **https://pedidos-qr-phi.vercel.app** (Vercel, cuenta `dani-9465`,
proyecto `pedidos-qr`, directorio raíz `pedidos-qr/`).

Las dos variables `NEXT_PUBLIC_*` están configuradas en los tres entornos del
proyecto. Al ser `NEXT_PUBLIC_`, se incrustan **en tiempo de compilación**: si
cambias de proyecto de Supabase, hay que volver a desplegar, no basta con
editar la variable.

Dos cosas que hay que revisar en un despliegue nuevo:

- **Protección de despliegue.** Vercel activa *Vercel Authentication* por
  defecto, y entonces el QR pide iniciar sesión en la cuenta de Vercel: para un
  bar es inservible. En *Settings → Deployment Protection* hay que dejarla solo
  para previsualizaciones, no para producción.
- **El proyecto de Supabase despierto.** En el plan gratuito se pausa tras 7
  días sin uso y la carta aparece vacía hasta reactivarlo.

Los QR se generan a partir de la dirección donde esté servida la app, así que
apuntan solos a la URL correcta. Si más adelante pones un dominio propio,
reimprime los códigos.

El despliegue se hizo subiendo los ficheros con el CLI, sin conectar el
repositorio. Para que cada push despliegue solo: `vercel git connect`.
