import http2 from 'node:http2';
import { PKPass } from 'passkit-generator';
import { NEGOCIO, textoPremio, urlPublica, urlTarjeta } from './config';
import { sql, type Cliente } from './db';
import { aBuffer, imagenLogo, imagenSellos } from './imagenes';

// Apple Wallet: la tarjeta es un fichero .pkpass firmado con el certificado
// del "Pass Type ID". Cuando cambia, se avisa al iPhone por APNs y el iPhone
// vuelve a pedir la tarjeta a /api/apple/v1/passes/... (ver SETUP.md).

/** Los certificados van en variables de entorno como PEM o como PEM en base64. */
function pem(nombre: string): string {
  const v = process.env[nombre] ?? '';
  return v.includes('-----BEGIN') ? v.replace(/\\n/g, '\n') : Buffer.from(v, 'base64').toString('utf8');
}

function rgb(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
}

export async function generarPase(c: Cliente): Promise<Buffer> {
  const { fondo, texto, dorado } = NEGOCIO.colores;
  const url = urlPublica();
  const total = NEGOCIO.sellosPremio;

  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: process.env.APPLE_PASS_TYPE_ID,
    teamIdentifier: process.env.APPLE_TEAM_ID,
    serialNumber: c.id,
    authenticationToken: c.apple_token,
    // Apple solo acepta HTTPS: en local (http) la tarjeta funciona pero no se actualiza sola.
    ...(url.startsWith('https://') ? { webServiceURL: `${url}/api/apple` } : {}),
    organizationName: NEGOCIO.nombre,
    description: `Tarjeta de fidelidad de ${NEGOCIO.nombre}`,
    logoText: NEGOCIO.nombre,
    backgroundColor: rgb(fondo),
    foregroundColor: rgb(texto),
    labelColor: rgb(dorado),
    sharingProhibited: true,
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: urlTarjeta(c.id),
        messageEncoding: 'iso-8859-1',
        altText: 'Enséñaselo al barbero',
      },
    ],
    storeCard: {
      headerFields: [{ key: 'sellos', label: 'SELLOS', value: `${c.sellos}/${total}` }],
      secondaryFields: [
        // El aviso en la pantalla de bloqueo sale de este campo al cambiar.
        { key: 'premio', label: 'PREMIO', value: textoPremio(c.sellos), changeMessage: '%@' },
      ],
      auxiliaryFields: [{ key: 'cliente', label: 'CLIENTE', value: c.nombre }],
      backFields: [
        {
          key: 'como',
          label: 'Cómo funciona',
          value: `Cada corte suma un sello. Con ${total} sellos, tu siguiente corte tiene un 50 % de descuento. Enseña el código al barbero al pagar.`,
        },
        { key: 'premios', label: 'Premios conseguidos', value: String(c.premios_canjeados) },
        { key: 'web', label: 'Tu tarjeta en la web', value: urlTarjeta(c.id) },
      ],
    },
  };

  const [icono, icono2, icono3, logo, logo2, tira, tira2, tira3] = await Promise.all(
    [
      imagenLogo(29, 29, true),
      imagenLogo(58, 58, true),
      imagenLogo(87, 87, true),
      imagenLogo(160, 50),
      imagenLogo(320, 100),
      imagenSellos(c.sellos, 375, 144),
      imagenSellos(c.sellos, 750, 288),
      imagenSellos(c.sellos, 1125, 432),
    ].map(aBuffer),
  );

  const pase = new PKPass(
    {
      'pass.json': Buffer.from(JSON.stringify(passJson)),
      'icon.png': icono,
      'icon@2x.png': icono2,
      'icon@3x.png': icono3,
      'logo.png': logo,
      'logo@2x.png': logo2,
      'strip.png': tira,
      'strip@2x.png': tira2,
      'strip@3x.png': tira3,
    },
    {
      wwdr: pem('APPLE_WWDR'),
      signerCert: pem('APPLE_CERT'),
      signerKey: pem('APPLE_KEY'),
      signerKeyPassphrase: process.env.APPLE_KEY_PASSPHRASE || undefined,
    },
  );
  return pase.getAsBuffer();
}

/** Comprueba la cabecera `Authorization: ApplePass <token>` de las llamadas del iPhone. */
export async function clienteAutorizado(
  req: Request,
  passTypeId: string,
  serial: string,
): Promise<Cliente | null> {
  if (passTypeId !== process.env.APPLE_PASS_TYPE_ID) return null;
  const token = req.headers.get('authorization')?.replace(/^ApplePass /, '');
  if (!token || !/^[0-9a-f-]{36}$/i.test(serial)) return null;
  const [c] = await sql<Cliente[]>`
    select * from fidelidad.clientes where id = ${serial} and apple_token = ${token}`;
  return c ?? null;
}

/** Avisa por APNs a los iPhones que tienen la tarjeta de que hay cambios. */
export async function avisarApple(clienteId: string): Promise<void> {
  const filas = await sql<{ push_token: string }[]>`
    select distinct push_token from fidelidad.apple_dispositivos where cliente_id = ${clienteId}`;
  if (filas.length === 0) return;

  const cliente = http2.connect('https://api.push.apple.com', {
    cert: pem('APPLE_CERT'),
    key: pem('APPLE_KEY'),
    passphrase: process.env.APPLE_KEY_PASSPHRASE || undefined,
  });
  try {
    await Promise.all(
      filas.map(
        ({ push_token }) =>
          new Promise<void>((resolve, reject) => {
            const req = cliente.request({
              ':method': 'POST',
              ':path': `/3/device/${push_token}`,
              'apns-topic': process.env.APPLE_PASS_TYPE_ID!,
            });
            req.on('response', (h) => {
              const estado = Number(h[':status']);
              // 410: el iPhone ya no tiene la tarjeta. Se borra el registro.
              if (estado === 410) {
                sql`delete from fidelidad.apple_dispositivos where push_token = ${push_token}`.then(() => resolve(), reject);
              } else if (estado === 200) resolve();
              else reject(new Error(`APNs respondió ${estado}`));
            });
            req.on('error', reject);
            req.end('{}');
          }),
      ),
    );
  } finally {
    cliente.close();
  }
}
