import { redirect } from 'next/navigation';
import { createClient, getStaffContext } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/env';
import { FaltaConfigurar } from '@/app/falta-configurar';
import type { OrderWithItems } from '@/lib/types';
import { Sala } from './sala';

export const dynamic = 'force-dynamic';

export default async function CocinaPage() {
  if (!hasSupabaseEnv()) return <FaltaConfigurar />;

  const context = await getStaffContext();
  if (!context) redirect('/login');

  if (!context.venueId) {
    return (
      <main className="mx-auto max-w-md flex-1 p-6">
        <h1 className="text-xl font-semibold">Sin local asignado</h1>
        <p className="pt-2 text-stone-600">
          Tu usuario existe pero no está dado de alta en ningún local. Añade una
          fila en la tabla <code>staff</code> con tu user_id y el venue_id.
        </p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items (*), venue_tables (name, zone)')
    .eq('venue_id', context.venueId)
    .order('created_at', { ascending: false })
    .limit(60);

  return (
    <Sala
      venueId={context.venueId}
      pedidosIniciales={(data ?? []) as OrderWithItems[]}
      email={context.user.email ?? ''}
    />
  );
}
