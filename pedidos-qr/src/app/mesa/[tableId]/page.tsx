import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/env';
import type { Category, Product } from '@/lib/types';
import { Carta } from './carta';
import { FaltaConfigurar } from '@/app/falta-configurar';

export const dynamic = 'force-dynamic';

const MENU_QUERY = `
  id, name, position, active,
  products (
    id, venue_id, category_id, name, description, price_cents,
    allergens, allergens_free, available, position,
    modifier_groups (
      id, product_id, name, min_select, max_select, position,
      modifiers (id, group_id, name, price_delta_cents, available, position)
    )
  )
`;

export default async function MesaPage({
  params,
}: {
  params: Promise<{ tableId: string }>;
}) {
  if (!hasSupabaseEnv()) return <FaltaConfigurar />;

  const { tableId } = await params;
  const supabase = await createClient();

  const { data: table } = await supabase
    .from('venue_tables')
    .select('id, name, zone, active, venue_id, venues (name)')
    .eq('id', tableId)
    .maybeSingle();

  if (!table || !table.active) notFound();

  const { data: rawCategories } = await supabase
    .from('categories')
    .select(MENU_QUERY)
    .eq('venue_id', table.venue_id)
    .eq('active', true);

  // Ordenar en JS: el anidado de PostgREST sólo ordena el primer nivel.
  const byPosition = <T extends { position: number }>(a: T, b: T) =>
    a.position - b.position;

  const categories: Category[] = ((rawCategories ?? []) as unknown as Category[])
    .map((category) => ({
      ...category,
      products: (category.products ?? [])
        .filter((product: Product) => product.available)
        .sort(byPosition)
        .map((product: Product) => ({
          ...product,
          modifier_groups: (product.modifier_groups ?? [])
            .sort(byPosition)
            .map((group) => ({
              ...group,
              modifiers: (group.modifiers ?? [])
                .filter((modifier) => modifier.available)
                .sort(byPosition),
            })),
        })),
    }))
    .filter((category) => category.products.length > 0)
    .sort(byPosition);

  const venueName =
    (table.venues as unknown as { name: string } | null)?.name ?? 'El local';

  return (
    <Carta
      tableId={table.id}
      tableName={table.name}
      zone={table.zone}
      venueName={venueName}
      categories={categories}
    />
  );
}
