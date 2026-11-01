import { imagenSellos } from '@/lib/imagenes';
import { NEGOCIO } from '@/lib/config';

// /api/img/sellos/4 → tira con 4 sellos. Tamaño de la cabecera de Google Wallet.
// El número va en la ruta para que cada estado tenga su propia URL (Google cachea).
export async function GET(_req: Request, { params }: { params: Promise<{ n: string }> }) {
  const n = Number((await params).n);
  if (!Number.isInteger(n) || n < 0 || n > NEGOCIO.sellosPremio) {
    return new Response('No encontrado', { status: 404 });
  }
  const img = imagenSellos(n, 1032, 336);
  img.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  return img;
}
