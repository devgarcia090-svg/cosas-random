import Link from 'next/link';
import { sql, type Cliente } from '@/lib/db';
import { esPersonal } from '@/lib/personal';
import { formatearTelefono } from '@/lib/telefono';
import { NEGOCIO } from '@/lib/config';
import { salir } from '../acciones';
import { boton, Cabecera, campo } from '../cabecera';
import { FormPin } from './form-pin';

export default async function Panel({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!(await esPersonal())) {
    return (
      <>
        <Cabecera subtitulo="Panel del barbero" />
        <FormPin />
      </>
    );
  }

  const q = ((await searchParams).q ?? '').trim();
  const digitos = q.replace(/\D/g, '');
  const clientes = q
    ? await sql<Cliente[]>`
        select * from fidelidad.clientes
         where (${digitos.length >= 3} and telefono like ${'%' + digitos + '%'})
            or nombre ilike ${'%' + q + '%'}
         order by actualizado desc limit 20`
    : await sql<Cliente[]>`select * from fidelidad.clientes order by actualizado desc limit 10`;

  return (
    <>
      <Cabecera subtitulo="Panel del barbero" />
      <p className="mb-4 rounded-lg bg-panel p-3 text-sm text-suave">
        Para sellar, escanea el código de la tarjeta del cliente con la cámara del móvil.
        Si no puede enseñarlo, búscalo aquí.
      </p>
      <form className="mb-6 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Teléfono o nombre" inputMode="search" className={campo} />
        <button className={`${boton} w-auto`}>Buscar</button>
      </form>

      <h2 className="mb-2 text-xs uppercase tracking-widest text-dorado">
        {q ? 'Resultados' : 'Últimos movimientos'}
      </h2>
      {clientes.length === 0 && <p className="text-sm text-suave">Nadie con ese teléfono o nombre.</p>}
      <ul className="flex flex-col divide-y divide-white/10">
        {clientes.map((c) => (
          <li key={c.id}>
            <Link href={`/t/${c.id}`} className="flex items-center justify-between py-3">
              <span>
                {c.nombre}
                <span className="block text-xs text-suave">{formatearTelefono(c.telefono)}</span>
              </span>
              <span className={c.sellos >= NEGOCIO.sellosPremio ? 'font-semibold text-dorado' : ''}>
                {c.sellos}/{NEGOCIO.sellosPremio}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex justify-between text-sm text-suave">
        <Link href="/panel/cartel" className="underline">Cartel con el QR de alta</Link>
        <form action={salir}>
          <button className="underline">Salir</button>
        </form>
      </div>
    </>
  );
}
