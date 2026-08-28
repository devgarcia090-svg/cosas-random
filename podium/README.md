# Podium Café & Grill — web, carta y reservas

Web del restaurante con la carta completa, un sistema de reservas propio con
panel para el personal, y un generador de códigos QR para las mesas.

- `public/index.html` — portada: destacados, menú diario, fotos, horario y mapa.
- `public/carta.html` — carta completa, con buscador y botón de imprimir.
- `public/reservar.html` — formulario de reserva para el cliente.
- `public/admin.html` — panel del restaurante: ver, confirmar y cancelar reservas.
- `public/qr.html` — genera e imprime el cartel con el QR de la carta.
- `worker.js` + `src/` — la API de reservas.

Todo es HTML, CSS y JavaScript sin frameworks ni compilación: se edita y se sube.

---

## 1. Publicar la web

Es un **Worker con assets estáticos**: `worker.js` atiende `/api/*` (las reservas)
y todo lo demás (HTML, CSS, fotos) sale de `public/`.

En **Workers & Pages → tu proyecto `podium` → Settings → Build**:

- **Root directory:** `podium`  ← importante, si no no encuentra `wrangler.toml`
- **Build command:** *(vacío)*
- **Deploy command:** `npx wrangler deploy`

Con esto la web ya funciona y la carta se ve. Las reservas necesitan el paso 2.

Las direcciones quedan limpias: `/`, `/carta`, `/reservar`, `/qr`, `/admin`.

## 2. Activar las reservas

### 2.1 Crear la base de datos

```bash
cd podium
npx wrangler d1 create podium-reservas
```

Copia el `database_id` que te devuelve y pégalo en `wrangler.toml`, sustituyendo
`PON-AQUI-EL-ID-DE-TU-BASE-DE-DATOS`. Después crea las tablas:

```bash
npx wrangler d1 execute podium-reservas --remote --file=schema.sql
```

### 2.2 Conectar la base de datos al proyecto

En Cloudflare: **tu proyecto Pages → Settings → Bindings → Add → D1 database**

- **Variable name:** `DB`
- **D1 database:** `podium-reservas`

### 2.3 Poner la contraseña del panel

En **Settings → Variables and Secrets**, añade como *Secret*:

| Nombre | Valor |
|---|---|
| `ADMIN_PASSWORD` | la contraseña que useis para entrar en `/admin.html` |
| `SESSION_SECRET` | un texto largo cualquiera e inventado (firma las sesiones) |

Vuelve a desplegar para que cojan efecto.

> Mientras no exista la base de datos, el formulario de reservas sigue
> funcionando: envía la reserva por WhatsApp al teléfono del local.

## 3. El QR de las mesas

Abre `tudominio.com/qr.html`, comprueba que la dirección es la definitiva y pulsa
**Imprimir cartel** (o **Descargar SVG** para llevarlo a la imprenta). El QR apunta
a la carta online, así que **al cambiar un precio no hay que reimprimir nada**.

---

## Cambios del día a día

| Qué quieres cambiar | Dónde |
|---|---|
| Precios, platos, menú del día | `public/assets/js/carta-datos.js` |
| Horario, teléfono, dirección, aforo máximo | `public/assets/js/config.js` |
| Plazas por turno y días cerrados | Panel `admin.html`, sin tocar código |
| Fotos del local | `public/assets/img/fotos/` |

El horario de `public/assets/js/config.js` lo usan a la vez la web y el servidor de reservas, así
que cambiándolo en un sitio se actualiza todo.

---

## Probar en local

```bash
cd podium
npm install wrangler
npx wrangler d1 execute podium-reservas --local --file=schema.sql
npx wrangler dev
```

Para probar el panel en local, crea un fichero `.dev.vars` (no se sube a git):

```
ADMIN_PASSWORD=loquesea
SESSION_SECRET=otracosa
```

---

## Pendiente de confirmar

- **El horario** está tomado de Google y Restaurant Guru. Revísalo en
  `public/assets/js/config.js` y corrige lo que no cuadre.
- La carta viene del PDF `Carta Podium.pdf`; se han corregido erratas
  («Lecguga» → «Lechuga», «foa» → «foie»). Conviene repasar los precios.
