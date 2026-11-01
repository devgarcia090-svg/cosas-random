import { generarPase } from '@/lib/apple';
import { appleConfigurado } from '@/lib/config';
import { buscarCliente } from '@/lib/db';

// Botón "Añadir a Apple Wallet": descarga el .pkpass y el iPhone lo abre en Wallet.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!appleConfigurado()) return new Response('Apple Wallet sin configurar', { status: 503 });
  const c = await buscarCliente((await params).id);
  if (!c) return new Response('No encontrado', { status: 404 });
  return new Response(new Uint8Array(await generarPase(c)), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': 'attachment; filename="oficina-del-barbero.pkpass"',
      'Cache-Control': 'no-store',
    },
  });
}
