import { redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { NEGOCIO, urlPublica } from '@/lib/config';
import { esPersonal } from '@/lib/personal';

// Cartel para el mostrador: el cliente escanea y se da de alta. Pensado para imprimir.
export default async function Cartel() {
  if (!(await esPersonal())) redirect('/panel');
  const qr = await QRCode.toString(urlPublica(), { type: 'svg', margin: 1 });
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <h1 className="font-serif text-3xl">{NEGOCIO.nombre}</h1>
      <p className="text-xl">
        {NEGOCIO.sellosPremio} cortes = <strong>{NEGOCIO.premio}</strong>
      </p>
      <div className="w-72 rounded-xl bg-white p-3" dangerouslySetInnerHTML={{ __html: qr }} />
      <p className="text-lg">Escanea y guarda tu tarjeta en la Wallet del móvil</p>
      <p className="text-sm opacity-70">{urlPublica().replace(/^https?:\/\//, '')}</p>
      <button className="no-imprimir mt-4 rounded-lg bg-dorado px-6 py-3 font-semibold text-fondo" id="imprimir">
        Imprimir
      </button>
      <script dangerouslySetInnerHTML={{ __html: "document.getElementById('imprimir').onclick=()=>print()" }} />
    </div>
  );
}
