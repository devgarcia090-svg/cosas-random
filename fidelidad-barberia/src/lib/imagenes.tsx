import { ImageResponse } from 'next/og';
import { NEGOCIO } from './config';

// Imágenes de la tarjeta, dibujadas en el servidor. Las usan Apple Wallet,
// Google Wallet y la página web, así que la tarjeta se ve igual en todas.

const { fondo, dorado } = NEGOCIO.colores;

function Sello({ d, puesto, ultimo }: { d: number; puesto: boolean; ultimo: boolean }) {
  return (
    <div
      style={{
        width: d,
        height: d,
        borderRadius: d,
        border: `${Math.max(2, d / 22)}px solid ${dorado}`,
        backgroundColor: puesto ? dorado : 'transparent',
        opacity: puesto || ultimo ? 1 : 0.45,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: dorado,
        fontSize: d * 0.3,
        fontWeight: 700,
      }}
    >
      {puesto ? (
        // El "tachado": un aspa oscura sobre el círculo dorado.
        <svg width={d * 0.5} height={d * 0.5} viewBox="0 0 10 10">
          <path d="M1.5 1.5 L8.5 8.5 M8.5 1.5 L1.5 8.5" stroke={fondo} strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      ) : ultimo ? (
        '50%'
      ) : null}
    </div>
  );
}

/** Tira con los 10 sellos en dos filas de 5. */
export function imagenSellos(sellos: number, ancho: number, alto: number): ImageResponse {
  const total = NEGOCIO.sellosPremio;
  const porFila = Math.ceil(total / 2);
  const d = Math.floor(Math.min(alto * 0.36, (ancho / porFila) * 0.66));
  const fila = (desde: number) => (
    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around' }}>
      {Array.from({ length: porFila }, (_, i) => desde + i).map((n) => (
        <Sello key={n} d={d} puesto={n < sellos} ultimo={n === total - 1} />
      ))}
    </div>
  );
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-around',
          backgroundColor: fondo,
        }}
      >
        {fila(0)}
        {fila(porFila)}
      </div>
    ),
    { width: ancho, height: alto },
  );
}

function Monograma({ d }: { d: number }) {
  return (
    <div
      style={{
        width: d,
        height: d,
        borderRadius: d,
        border: `${Math.max(1, d / 20)}px solid ${dorado}`,
        backgroundColor: fondo,
        color: dorado,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: d * 0.42,
        fontWeight: 700,
        letterSpacing: d * 0.02,
      }}
    >
      {NEGOCIO.iniciales}
    </div>
  );
}

/** Logo provisional (monograma). Ancho distinto del alto: queda a la izquierda. */
export function imagenLogo(ancho: number, alto: number, conFondo = false): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: ancho === alto ? 'center' : 'flex-start',
          backgroundColor: conFondo ? fondo : 'transparent',
        }}
      >
        <Monograma d={Math.min(ancho, alto)} />
      </div>
    ),
    { width: ancho, height: alto },
  );
}

export async function aBuffer(img: ImageResponse): Promise<Buffer> {
  return Buffer.from(await img.arrayBuffer());
}
