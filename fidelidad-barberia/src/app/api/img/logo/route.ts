import { imagenLogo } from '@/lib/imagenes';

// Logo cuadrado (lo pide Google Wallet como programLogo).
export async function GET() {
  const img = imagenLogo(660, 660, true);
  img.headers.set('Cache-Control', 'public, max-age=86400');
  return img;
}
