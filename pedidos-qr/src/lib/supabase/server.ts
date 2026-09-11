import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Se llama desde un Server Component: el middleware ya refresca la sesión.
          }
        },
      },
    },
  );
}

/** Devuelve el usuario y los locales en los que trabaja, o null si no hay sesión. */
export async function getStaffContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: memberships } = await supabase
    .from('staff')
    .select('venue_id, role')
    .eq('user_id', user.id);

  if (!memberships?.length) return { user, memberships: [], venueId: null };

  return { user, memberships, venueId: memberships[0].venue_id as string };
}
