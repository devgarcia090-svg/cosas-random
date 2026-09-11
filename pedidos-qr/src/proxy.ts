import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { hasSupabaseEnv } from '@/lib/env';

export async function proxy(request: NextRequest) {
  // Sin proyecto configurado no hay sesión que refrescar: que la página muestre
  // las instrucciones en vez de romper con un 500.
  if (!hasSupabaseEnv()) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Refresca el token si toca. No borrar: sin esto la sesión de sala caduca sola.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ['/cocina/:path*', '/admin/:path*', '/login'],
};
