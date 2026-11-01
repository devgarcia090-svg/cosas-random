# Puesta en marcha paso a paso

Orden recomendado: **1 → 2 → 3** (ya funciona como tarjeta web) → **4** (Google,
gratis) → **5** (Apple, 99 €/año). Cada paso se puede hacer otro día: la app
funciona con lo que haya.

## 1. Base de datos (Supabase, gratis)

1. Crea un proyecto en [supabase.com](https://supabase.com). Región: Europa.
2. **SQL Editor** → pega el contenido de `supabase/migrations/0001_fidelidad.sql`
   → *Run*.
3. **Project Settings → Database → Connection string**: copia la de **Transaction
   pooler** (puerto 6543) y pon tu contraseña. Esa es `DATABASE_URL`.

## 2. Publicar la web (Vercel, gratis)

1. Importa el repo en [vercel.com](https://vercel.com) con **Root Directory** =
   `fidelidad-barberia`.
2. Variables de entorno (*Settings → Environment Variables*):

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | La del paso 1 |
   | `PUBLIC_URL` | La dirección final, con `https://` y sin barra al final |
   | `STAFF_PIN` | El PIN del panel. Mejor 6 cifras o más |
   | `SESSION_SECRET` | El resultado de `openssl rand -hex 32` (o 64 caracteres al azar) |

3. Si tienes dominio (p. ej. `tarjeta.laoficinadelbarbero.es`), añádelo en
   *Settings → Domains* y pon ese en `PUBLIC_URL`. **No lo cambies después**: va
   dentro del QR de cada tarjeta.

## 3. Probar sin Wallet

- Abre `PUBLIC_URL/panel`, entra con el PIN y abre **Cartel con el QR de alta**.
- Date de alta desde otro móvil, escanea su QR desde el móvil del barbero y pulsa
  **Sellar visita**.

## 4. Google Wallet (Android, gratis)

1. Entra en la [Google Pay & Wallet Console](https://pay.google.com/business/console)
   con la cuenta de Google del negocio → **Google Wallet API** → crea la cuenta de
   emisor. Apunta el **Issuer ID** (un número largo).
2. En [Google Cloud Console](https://console.cloud.google.com):
   1. Crea un proyecto.
   2. **APIs y servicios → Biblioteca** → activa **Google Wallet API**.
   3. **IAM → Cuentas de servicio** → crea una (sin roles) → **Claves → Agregar
      clave → JSON**. Se descarga un fichero `.json`. Guárdalo bien: es una
      contraseña.
3. De vuelta en la Wallet Console → **Users** → invita al email de la cuenta de
   servicio (`...@...iam.gserviceaccount.com`) con permiso **Developer**.
4. En Vercel:
   - `GOOGLE_ISSUER_ID` = el número del paso 1
   - `GOOGLE_SERVICE_ACCOUNT` = el resultado de `base64 -w0 clave.json` (en Mac,
     `base64 -i clave.json`)
5. Vuelve a desplegar. Aparece el botón «Añadir a Google Wallet».

**Modo demo:** al principio, solo pueden guardar la tarjeta las cuentas de Google
que añadas como *test users* en la Wallet Console. Cuando esté probada, pide
**publishing access** desde la misma consola. Google revisa la tarjeta (suele
tardar unos días) y después queda abierta a todo el mundo.

## 5. Apple Wallet (iPhone, 99 €/año)

### 5.1 Cuenta

Date de alta en el [Apple Developer Program](https://developer.apple.com/programs/enroll/).
Como persona física es inmediato. Como empresa, Apple pide el número D-U-N-S
(gratis, pero tarda unos días). Apunta el **Team ID** (*Membership details*).
Ese es `APPLE_TEAM_ID`.

### 5.2 Pass Type ID

[Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list/passTypeId)
→ **Identifiers → +** → **Pass Type IDs**:

- Description: `Tarjeta fidelidad`
- Identifier: `pass.es.laoficinadelbarbero.fidelidad`. Ese es
  `APPLE_PASS_TYPE_ID`.

### 5.3 Certificado (sin necesidad de Mac)

En un terminal (Mac, Linux o Git Bash en Windows):

```bash
# Clave privada + solicitud de certificado
openssl req -new -newkey rsa:2048 -nodes -keyout pass.key -out pass.csr \
  -subj "/CN=La Oficina del Barbero/C=ES"
```

En el Pass Type ID que acabas de crear → **Create Certificate** → sube `pass.csr`
→ descarga `pass.cer`. Después:

```bash
openssl x509 -inform DER -in pass.cer -out pass.pem

# Certificado intermedio de Apple (WWDR G4)
curl -O https://www.apple.com/certificateauthority/AppleWWDRCAG4.cer
openssl x509 -inform DER -in AppleWWDRCAG4.cer -out wwdr.pem
```

### 5.4 Variables en Vercel

| Variable | Valor |
|---|---|
| `APPLE_PASS_TYPE_ID` | `pass.es.laoficinadelbarbero.fidelidad` |
| `APPLE_TEAM_ID` | El de 5.1 |
| `APPLE_CERT` | `base64 -w0 pass.pem` |
| `APPLE_KEY` | `base64 -w0 pass.key` |
| `APPLE_WWDR` | `base64 -w0 wwdr.pem` |
| `APPLE_KEY_PASSPHRASE` | Vacío (solo si la clave tiene contraseña) |

En Mac, `base64 -i fichero` en lugar de `base64 -w0 fichero`.

`pass.key` es secreta. No la subas al repo (`*.pem` ya está en `.gitignore`;
`pass.key` guárdala fuera del proyecto). El certificado **caduca a los 12
meses**: renuévalo (pasos 5.3 y 5.4) antes de esa fecha, o las tarjetas dejarán
de actualizarse.

## 6. Comprobación final (con las cuentas puestas)

Con un iPhone y un Android de prueba:

- [ ] Alta → «Añadir a Apple Wallet» → la tarjeta entra en Wallet con 0/10.
- [ ] Sellar desde el panel → en unos segundos el iPhone muestra 1/10 y el aviso
      «Te faltan 9 cortes para el 50 %».
- [ ] Lo mismo en Android con «Añadir a Google Wallet».
- [ ] Llegar a 10 → la tarjeta dice «¡Tienes un 50 % en este corte!» → canjear →
      vuelve a 0/10.

Si algo falla, el log de Vercel (*Deployments → Functions*) muestra los errores
con la etiqueta `[wallet]`. Lo que el iPhone reporta aparece con la etiqueta
`[apple wallet]`.
