# Tarjeta de fidelidad · La Oficina del Barbero

Tarjeta de sellos que vive en la **Wallet del móvil** (Apple Wallet y Google
Wallet) y se tacha sola cada vez que el cliente viene.

**10 cortes = 50 % en el siguiente.** Al décimo sello, el siguiente corte sale a
mitad de precio y la tarjeta vuelve a cero.

## Cómo se usa

**Cliente**

1. Escanea el cartel del mostrador (`/panel/cartel`, listo para imprimir).
2. Pone su nombre y su teléfono, acepta la nota de privacidad y entra en su
   tarjeta (`/t/<id>`).
3. Pulsa «Añadir a Apple Wallet» o «Añadir a Google Wallet».
4. En cada visita enseña el código QR de la tarjeta.

**Barbero**

1. Entra una vez en `/panel` con el PIN desde el navegador de su móvil (la sesión
   dura 30 días).
2. Escanea el QR del cliente **con la cámara normal del móvil**. Se abre la
   tarjeta con el botón **Sellar visita**.
3. Si el cliente no lleva el móvil, lo busca en `/panel` por teléfono o nombre.
4. Cuando la tarjeta llega a 10, el botón pasa a **Aplicar 50 % y poner a cero**.

Al sellar, la tarjeta se actualiza sola en el móvil del cliente y le llega un
aviso («Te faltan 6 cortes para el 50 %»).

Reglas que pone la base de datos, no la pantalla:

- No se puede sellar dos veces en 10 minutos (para que un doble escaneo no cuente
  doble).
- Con 10 sellos no se puede sellar más: primero hay que canjear.
- Un teléfono, una tarjeta. Si alguien la pierde, el barbero la busca y el
  cliente escanea el QR que sale en la pantalla del barbero.

## Cómo está montado

- **Next.js 16** + **Tailwind 4** + TypeScript.
- **Supabase** solo como Postgres. El servidor de la app se conecta con
  `DATABASE_URL`. Las tablas están en el esquema `fidelidad`, que la API pública
  de Supabase no expone.
- **Apple Wallet**: el `.pkpass` se firma con `passkit-generator`. El servicio web
  que pide Apple está en `/api/apple/v1/...` y los avisos se mandan por APNs.
- **Google Wallet**: se usa la API REST de Google Wallet con una cuenta de
  servicio, sin SDK.
- Las imágenes de la tarjeta (tira de sellos, logo, icono) las dibuja el servidor
  con `next/og`, así que la tarjeta se ve igual en Apple, Google y la web.

| Ruta | Qué es |
|---|---|
| `/` | Alta del cliente |
| `/t/<id>` | La tarjeta. Si entra el barbero, con los botones de sellar y canjear |
| `/panel` | Panel del barbero (PIN): búsqueda y últimos movimientos |
| `/panel/cartel` | Cartel con el QR de alta para imprimir |
| `/api/apple/pase/<id>` | Descarga del `.pkpass` |
| `/api/google/<id>` | Crea la tarjeta en Google y redirige a «Guardar» |
| `/api/img/sellos/<n>`, `/api/img/logo` | Imágenes de la tarjeta |

## Puesta en marcha

Paso a paso, con las cuentas de Apple y Google, en **[SETUP.md](SETUP.md)**.

Sin cuentas de Wallet la app ya funciona: la tarjeta es la página web y el
barbero sella igual. Los botones de Wallet aparecen solos cuando se añaden las
claves.

```bash
cp .env.example .env.local   # y rellénalo
npm install
npm run dev
```

## Pruebas

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/01_pruebas.sql
```

Prueban la lógica de sellos: sumar, doble escaneo, tope de 10, canje y teléfono
repetido. Van en una transacción que se deshace al final.

## Qué está probado y qué no

Probado en local, con un navegador real y Postgres 16:

- El alta, el teléfono repetido, el PIN incorrecto, sellar, el doble escaneo,
  llegar a 10 y canjear.
- Que el `.pkpass` se genera, que el `manifest` cuadra y que la firma se verifica
  (con certificados de prueba).
- Todas las rutas del servicio web de Apple: registro, baja, consulta de cambios
  y descarga con `If-Modified-Since`.

**Sin probar todavía**, porque necesita las cuentas reales:

- Abrir la tarjeta en un iPhone de verdad y recibir el aviso por APNs.
- Las llamadas a la API de Google Wallet.

Están escritas según la documentación oficial, pero hay que comprobarlas en cuanto
estén las cuentas (ver la lista final de SETUP.md).

## Pendiente / ideas

- **Logo real**: ahora es un monograma «OB». Se cambia en `src/lib/imagenes.tsx`
  (`Monograma`).
- **Borrar datos de un cliente** (lo promete la nota de privacidad): de momento se
  hace desde Supabase → Table editor → `fidelidad.clientes`. Al borrar el cliente
  se borran también sus visitas y sus dispositivos.
- Varios barberos con PIN propio, si interesa saber quién selló cada visita.
- No hay límite de altas por minuto en `/`. Si alguien abusara del formulario,
  habría que añadirlo.
