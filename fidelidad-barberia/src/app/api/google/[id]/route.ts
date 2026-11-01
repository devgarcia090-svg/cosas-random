import { redirect } from 'next/navigation';
import { googleConfigurado } from '@/lib/config';
import { buscarCliente } from '@/lib/db';
import { enlaceGuardarGoogle } from '@/lib/google';

// Botón "Añadir a Google Wallet": crea la tarjeta en Google y lleva al cliente allí.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!googleConfigurado()) return new Response('Google Wallet sin configurar', { status: 503 });
  const c = await buscarCliente((await params).id);
  if (!c) return new Response('No encontrado', { status: 404 });
  redirect(await enlaceGuardarGoogle(c));
}
