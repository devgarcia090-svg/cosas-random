# Pedidos QR

Carta digital por QR con **servicio en mesa**: el cliente escanea el código de su
mesa, pide desde el navegador del móvil (sin instalar nada, sin registrarse) y la
comanda aparece al instante en la pantalla de la sala. El cobro se hace en la
mesa, como toda la vida.

MVP funcional, no un producto cerrado. Lo que hay está probado; lo que falta está
listado más abajo sin adornos.

## Qué hace

**Cliente** (`/mesa/<id-de-mesa>`)

- Carta por categorías con descripciones, alérgenos y precios.
- Opciones por producto (punto de la carne, extras, tipo de pan…) con mínimos y
  máximos por grupo.
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

2. En el **SQL Editor**, ejecuta en este orden:

   - `supabase/migrations/0001_schema.sql`
   - `supabase/migrations/0002_rls_and_rpc.sql`
   - `supabase/seed.sql` (datos de demo: un bar con 6 mesas y 19 productos)

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

Las pruebas dan por hecho una base recién migrada y con el seed puesto: los
totales esperados se apoyan en los datos de demo.

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
