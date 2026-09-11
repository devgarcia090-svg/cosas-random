import { redirect } from 'next/navigation';
import { getStaffContext } from '@/lib/supabase/server';
import { hasSupabaseEnv } from '@/lib/env';
import { FaltaConfigurar } from '@/app/falta-configurar';
import { LoginForm } from './login-form';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (!hasSupabaseEnv()) return <FaltaConfigurar />;

  const context = await getStaffContext();
  if (context?.venueId) redirect('/cocina');

  return <LoginForm />;
}
