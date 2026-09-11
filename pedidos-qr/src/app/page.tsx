import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/env';
import { FaltaConfigurar } from '@/app/falta-configurar';
import type { VenueTable } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!hasSupabaseEnv()) return <FaltaConfigurar />;

  const supabase = await createClient();
  const { data: mesas } = await supabase
    .from('venue_tables')
    .select('id, venue_id, name, zone, active')
    .eq('active', true)
    .order('name')
    .limit(12);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 p-6">
      <h1 className="text-2xl font-semibold">Pedidos QR</h1>
      <p className="pt-2 text-stone-600">
        Carta digital por QR con servicio en mesa: el cliente pide desde su
        móvil y la sala lo ve al instante.
      </p>

      <h2 className="pt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Mesas de demo
      </h2>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {((mesas ?? []) as VenueTable[]).map((mesa) => (
          <li key={mesa.id}>
            <Link
              href={`/mesa/${mesa.id}`}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3"
            >
              <span className="font-medium">{mesa.name}</span>
              <span className="text-sm text-stone-500">{mesa.zone}</span>
            </Link>
          </li>
        ))}
      </ul>

      {mesas?.length ? null : (
        <p className="mt-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-stone-500">
          No hay mesas todavía. Ejecuta <code>supabase/seed.sql</code>.
        </p>
      )}

      <h2 className="pt-8 text-sm font-semibold uppercase tracking-wide text-stone-500">
        Para el personal
      </h2>
      <ul className="mt-2 flex flex-col gap-2">
        <li>
          <Link href="/cocina" className="underline">
            Pantalla de comandas
          </Link>
        </li>
        <li>
          <Link href="/admin" className="underline">
            Carta, mesas y códigos QR
          </Link>
        </li>
      </ul>
    </main>
  );
}
