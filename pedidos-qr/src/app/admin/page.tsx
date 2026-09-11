import { redirect } from 'next/navigation';
import { createClient, getStaffContext } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/env';
import { FaltaConfigurar } from '@/app/falta-configurar';
import type { Product, VenueTable } from '@/lib/types';
import { Gestion } from './gestion';

export const dynamic = 'force-dynamic';

type CategoriaAdmin = {
  id: string;
  name: string;
  position: number;
  products: Product[];
};

export default async function AdminPage() {
  if (!hasSupabaseEnv()) return <FaltaConfigurar />;

  const context = await getStaffContext();
  if (!context) redirect('/login');
  if (!context.venueId) redirect('/cocina');

  const supabase = await createClient();

  const [{ data: categorias }, { data: mesas }] = await Promise.all([
    supabase
      .from('categories')
      .select(
        'id, name, position, products (id, name, price_cents, available, position, category_id, venue_id, description, allergens)',
      )
      .eq('venue_id', context.venueId)
      .order('position'),
    supabase
      .from('venue_tables')
      .select('id, venue_id, name, zone, active')
      .eq('venue_id', context.venueId)
      .order('name'),
  ]);

  const conProductosOrdenados = ((categorias ?? []) as unknown as CategoriaAdmin[]).map(
    (categoria) => ({
      ...categoria,
      products: (categoria.products ?? []).sort(
        (a, b) => a.position - b.position,
      ),
    }),
  );

  return (
    <Gestion
      categorias={conProductosOrdenados}
      mesas={(mesas ?? []) as VenueTable[]}
    />
  );
}
