# Atajos de Apple → tus gastos

Tres montajes, de menos a más automático. Empieza por el 1 (funciona seguro),
y luego añade el 2 si tu banco lo permite.

Antes de nada, ten a mano:

- **La URL:** `https://TU-WORKER.workers.dev/api/gastos`
- **El token:** el que guardaste con `wrangler secret put API_TOKEN`

(En la web, abre *Ajustes → Datos para el Atajo de Apple* y ahí tienes los dos,
con un botón para copiar la URL con el token ya incluido.)

---

## 1. Atajo manual "Apuntar gasto" (2 minutos)

El que usarás para efectivo, para compras que quieras anotar con detalle y como
red de seguridad de todo lo demás.

1. App **Atajos** → **+** → nombre: `Apuntar gasto`.
2. Añade **Pedir entrada**:
   - Tipo: **Número**
   - Pregunta: `¿Cuánto?`
3. Añade otra **Pedir entrada**:
   - Tipo: **Texto**
   - Pregunta: `¿En qué?`
4. Añade **Obtener contenido de URL**:
   - URL: `https://TU-WORKER.workers.dev/api/gastos`
   - Despliega **Mostrar más**:
     - **Método:** `POST`
     - **Cabeceras:** añade `X-Token` con el valor de tu token
     - **Cuerpo de la solicitud:** `JSON`
       - `importe` → *Número* → la variable de la **primera** Pedir entrada
       - `comercio` → *Texto* → la variable de la **segunda** Pedir entrada
       - `metodo` → *Texto* → `movil`
5. Añade **Obtener valor del diccionario**:
   - Clave: `mensaje`
   - En: el resultado de *Obtener contenido de URL*
6. Añade **Mostrar notificación** con ese valor.

Listo. Ahora ponlo donde te resulte inmediato:

- **Pantalla de inicio:** en el atajo → compartir → *Añadir a pantalla de inicio*.
- **Botón de acción** (iPhone 15 Pro y posteriores): Ajustes → Botón de acción → Atajo.
- **Doble toque en la parte de atrás:** Ajustes → Accesibilidad → Tocar → Tocar
  la parte posterior → Doble toque → `Apuntar gasto`.
- **Siri:** "Oye Siri, apuntar gasto".
- **Widget** en la pantalla de bloqueo.

---

## 2. Automático al pagar con el móvil (Apple Pay)

Esto es lo que buscabas: pagas con el iPhone o el Watch y el gasto **se registra
solo**, sin tocar nada.

1. App **Atajos** → pestaña **Automatización** → **+**.
2. Elige el disparador **Transacción**.
3. Configura:
   - **Tarjeta:** la que uses para pagar (o *Cualquier tarjeta*).
   - Si te deja filtrar por categoría de comercio, déjalo en todas.
   - Marca **Ejecutar inmediatamente** y **desactiva** *Avisar antes de ejecutar*
     (si no, tendrás que confirmar cada vez).
4. **Nuevo atajo en blanco** y añade **Obtener contenido de URL**:
   - URL: `https://TU-WORKER.workers.dev/api/gastos`
   - **Método:** `POST`
   - **Cabeceras:** `X-Token` = tu token
   - **Cuerpo de la solicitud:** `JSON`
     - `importe` → toca el campo, elige la variable **Transacción** y cámbiale
       el detalle a **Importe**
     - `comercio` → variable **Transacción**, detalle **Comercio**
     - `metodo` → texto `movil`
5. (Opcional pero recomendable) **Obtener valor del diccionario** → clave
   `mensaje` → **Mostrar notificación**. Así ves el aviso de que ha quedado
   apuntado y con qué categoría.

A partir de aquí: pagas → aparece la notificación → el gasto ya está en la web.
La categoría la pone la API sola por el nombre del comercio; lo que no reconozca
te espera en **"Por revisar"** para clasificarlo de un toque cuando te apetezca.

> **Si no ves el disparador "Transacción":** depende del iPhone, de la versión de
> iOS y de que la tarjeta esté en Wallet (con algunos bancos no aparece). En ese
> caso, usa el montaje 3, que es casi igual de rápido.

---

## 3. Alternativa: un toque tras pagar

Si tu banco no soporta el disparador de transacción, lo más cómodo es un atajo
de **importe + un toque**, con la categoría en un menú:

1. Atajo nuevo: `Gasto rápido`.
2. **Pedir entrada** → Número → `¿Cuánto?`
3. **Elegir de un menú** con: `Súper`, `Café`, `Restaurante`, `Transporte`,
   `Caprichos`, `Otros`.
4. Dentro de cada opción, una **Obtener contenido de URL** igual que la del
   montaje 1, pero con `categoria` fijo (`super`, `cafe`, `restaurante`,
   `transporte`, `caprichos`, `otros`) y `comercio` con lo que quieras.
5. Asígnalo al **botón de acción** o al **doble toque trasero**.

Otra opción muy buena: una **etiqueta NFC** pegada donde sueles gastar (la
máquina de café de la oficina, por ejemplo) que dispare el atajo con el importe
ya fijo. Automatización → **NFC** → escanear la etiqueta.

---

## Trucos

**Marcar algo como hormiga a mano.** Añade `hormiga` = `1` al JSON. Si no lo
mandas, la API lo decide por el umbral (Ajustes en la web, 10 € por defecto).

**Anotar el porqué.** Añade un `Pedir entrada` con `¿Por qué lo has comprado?` y
mándalo en el campo `nota`. Releer eso a fin de mes es la parte que de verdad
frena los gastos hormiga.

**Registrar algo de ayer.** Manda `fecha` con formato `2026-08-17T20:30:00Z`.

**Si algo falla.** La API responde `{"ok": false, "error": "..."}`. Añade tras la
petición un **Obtener valor del diccionario** con clave `error` y una
**Mostrar notificación**, y sabrás qué ha pasado en vez de perder el gasto en
silencio.

**Cuidado con el token.** Va dentro del atajo; si compartes el atajo con
alguien, le estás dando acceso a tus gastos. Si pasa, genera otro token con
`wrangler secret put API_TOKEN` y vuelve a entrar en la web con el nuevo.
