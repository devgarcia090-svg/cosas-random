import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { appleConfigurado, googleConfigurado, NEGOCIO, textoPremio, urlTarjeta } from '@/lib/config';
import { buscarCliente } from '@/lib/db';
import { esPersonal } from '@/lib/personal';
import { formatearTelefono } from '@/lib/telefono';
import { Cabecera } from '../../cabecera';
import { BotonesPersonal } from './botones-personal';

export default async function Tarjeta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await buscarCliente(id);
  if (!c) notFound();
  const personal = await esPersonal();
  const qr = await QRCode.toString(urlTarjeta(c.id), { type: 'svg', margin: 1 });
  const lleno = c.sellos >= NEGOCIO.sellosPremio;

  return (
    <>
      <Cabecera />

      <article className="overflow-hidden rounded-2xl border border-dorado/40 bg-fondo shadow-2xl">
        <div className="flex items-baseline justify-between px-5 pt-4">
          <span className="text-xs uppercase tracking-widest text-dorado">Sellos</span>
          <span className="text-2xl font-semibold">
            {c.sellos}/{NEGOCIO.sellosPremio}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/img/sellos/${c.sellos}`}
          alt={`${c.sellos} de ${NEGOCIO.sellosPremio} sellos`}
          width={1032}
          height={336}
          className="w-full"
        />
        <div className="px-5 pb-5">
          <p className={lleno ? 'text-lg font-semibold text-dorado' : 'text-suave'}>
            {textoPremio(c.sellos)}
          </p>
          <p className="mt-1 text-sm">{c.nombre}</p>
        </div>
      </article>

      {personal ? (
        <BotonesPersonal
          id={c.id}
          sellos={c.sellos}
          detalle={`${formatearTelefono(c.telefono)} · ${c.premios_canjeados} premio${c.premios_canjeados === 1 ? '' : 's'} canjeado${c.premios_canjeados === 1 ? '' : 's'}`}
        />
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {appleConfigurado() && (
            <a href={`/api/apple/pase/${c.id}`} className="rounded-lg bg-black px-4 py-3 text-center font-semibold ring-1 ring-white/30">
              Añadir a Apple Wallet
            </a>
          )}
          {googleConfigurado() && (
            <a href={`/api/google/${c.id}`} className="rounded-lg bg-white px-4 py-3 text-center font-semibold text-black">
              Añadir a Google Wallet
            </a>
          )}
          {!appleConfigurado() && !googleConfigurado() && (
            <p className="text-center text-sm text-suave">
              Guarda esta página en favoritos: es tu tarjeta.
            </p>
          )}
        </div>
      )}

      <section className="mt-8 flex flex-col items-center gap-2">
        <div
          className="w-44 rounded-xl bg-white p-2"
          // SVG generado por nosotros a partir de una URL nuestra.
          dangerouslySetInnerHTML={{ __html: qr }}
        />
        <p className="text-xs text-suave">
          {personal ? 'Que el cliente escanee este código para tener su tarjeta.' : 'Enséñaselo al barbero en cada visita.'}
        </p>
      </section>
    </>
  );
}
