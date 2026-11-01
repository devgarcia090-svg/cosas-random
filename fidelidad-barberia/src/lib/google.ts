import { createSign } from 'node:crypto';
import { NEGOCIO, textoPremio, urlPublica, urlTarjeta } from './config';
import type { Cliente } from './db';

// Google Wallet: la tarjeta vive en los servidores de Google. Se crea con su
// API y se actualiza con PATCH; el móvil del cliente la refresca solo.

const API = 'https://walletobjects.googleapis.com/walletobjects/v1';

type CuentaServicio = { client_email: string; private_key: string };

function cuenta(): CuentaServicio {
  const v = process.env.GOOGLE_SERVICE_ACCOUNT ?? '';
  return JSON.parse(v.trim().startsWith('{') ? v : Buffer.from(v, 'base64').toString('utf8'));
}

function base64url(datos: string | Buffer): string {
  return Buffer.from(datos).toString('base64url');
}

function jwt(payload: object, clave: string): string {
  const cuerpo = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(JSON.stringify(payload))}`;
  const firma = createSign('RSA-SHA256').update(cuerpo).sign(clave);
  return `${cuerpo}.${base64url(firma)}`;
}

let token: { valor: string; caduca: number } | null = null;

async function tokenAcceso(): Promise<string> {
  if (token && token.caduca > Date.now() + 60_000) return token.valor;
  const { client_email, private_key } = cuenta();
  const ahora = Math.floor(Date.now() / 1000);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt(
        {
          iss: client_email,
          scope: 'https://www.googleapis.com/auth/wallet_object.issuer',
          aud: 'https://oauth2.googleapis.com/token',
          iat: ahora,
          exp: ahora + 3600,
        },
        private_key,
      ),
    }),
  });
  if (!res.ok) throw new Error(`Google OAuth: ${res.status} ${await res.text()}`);
  const { access_token, expires_in } = await res.json();
  token = { valor: access_token, caduca: Date.now() + expires_in * 1000 };
  return access_token;
}

async function api(metodo: string, ruta: string, cuerpo?: object): Promise<Response> {
  return fetch(`${API}${ruta}`, {
    method: metodo,
    headers: { Authorization: `Bearer ${await tokenAcceso()}`, 'Content-Type': 'application/json' },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
}

const idClase = () => `${process.env.GOOGLE_ISSUER_ID}.oficina_barbero`;
const idObjeto = (c: Cliente) => `${process.env.GOOGLE_ISSUER_ID}.${c.id}`;

/** Los campos que cambian con cada sello. */
function camposVariables(c: Cliente) {
  return {
    loyaltyPoints: {
      label: 'Sellos',
      balance: { string: `${c.sellos}/${NEGOCIO.sellosPremio}` },
    },
    heroImage: {
      sourceUri: { uri: `${urlPublica()}/api/img/sellos/${c.sellos}` },
      contentDescription: {
        defaultValue: { language: 'es', value: `${c.sellos} de ${NEGOCIO.sellosPremio} sellos` },
      },
    },
    textModulesData: [{ id: 'premio', header: 'Premio', body: textoPremio(c.sellos) }],
  };
}

/** Crea la clase y la tarjeta si no existen (409 = ya existe) y devuelve el
 *  enlace "Añadir a Google Wallet". */
export async function enlaceGuardarGoogle(c: Cliente): Promise<string> {
  const clase = await api('POST', '/loyaltyClass', {
    id: idClase(),
    issuerName: NEGOCIO.nombre,
    programName: 'Tarjeta de fidelidad',
    programLogo: {
      sourceUri: { uri: `${urlPublica()}/api/img/logo` },
      contentDescription: { defaultValue: { language: 'es', value: NEGOCIO.nombre } },
    },
    hexBackgroundColor: NEGOCIO.colores.fondo,
    reviewStatus: 'UNDER_REVIEW',
  });
  if (!clase.ok && clase.status !== 409) {
    throw new Error(`Google loyaltyClass: ${clase.status} ${await clase.text()}`);
  }

  const objeto = await api('POST', '/loyaltyObject', {
    id: idObjeto(c),
    classId: idClase(),
    state: 'ACTIVE',
    accountId: c.id.slice(0, 8).toUpperCase(),
    accountName: c.nombre,
    barcode: { type: 'QR_CODE', value: urlTarjeta(c.id), alternateText: 'Enséñaselo al barbero' },
    ...camposVariables(c),
  });
  if (!objeto.ok && objeto.status !== 409) {
    throw new Error(`Google loyaltyObject: ${objeto.status} ${await objeto.text()}`);
  }

  const { client_email, private_key } = cuenta();
  const firmado = jwt(
    {
      iss: client_email,
      aud: 'google',
      typ: 'savetowallet',
      origins: [urlPublica()],
      payload: { loyaltyObjects: [{ id: idObjeto(c) }] },
    },
    private_key,
  );
  return `https://pay.google.com/gp/v/save/${firmado}`;
}

/** Actualiza la tarjeta en Google y manda un aviso al móvil. */
export async function actualizarGoogle(c: Cliente): Promise<void> {
  const res = await api('PATCH', `/loyaltyObject/${idObjeto(c)}`, {
    ...camposVariables(c),
    // Un único mensaje (se sustituye cada vez): Google lo muestra como notificación.
    messages: [
      {
        id: `aviso-${Date.now()}`,
        header: NEGOCIO.nombre,
        body: textoPremio(c.sellos),
        messageType: 'TEXT_AND_NOTIFY',
      },
    ],
  });
  // 404: el cliente nunca la añadió a Google Wallet. No es un error.
  if (!res.ok && res.status !== 404) {
    throw new Error(`Google PATCH: ${res.status} ${await res.text()}`);
  }
}
