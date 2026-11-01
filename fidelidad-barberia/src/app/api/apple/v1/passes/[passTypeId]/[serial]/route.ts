import { clienteAutorizado, generarPase } from '@/lib/apple';

// Servicio web de Apple Wallet: el iPhone descarga la versión nueva de la tarjeta.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ passTypeId: string; serial: string }> },
) {
  const { passTypeId, serial } = await params;
  const c = await clienteAutorizado(req, passTypeId, serial);
  if (!c) return new Response(null, { status: 401 });

  const modificado = new Date(Math.floor(c.actualizado.getTime() / 1000) * 1000);
  const desde = req.headers.get('if-modified-since');
  if (desde && new Date(desde) >= modificado) return new Response(null, { status: 304 });

  return new Response(new Uint8Array(await generarPase(c)), {
    headers: {
      'Content-Type': 'application/vnd.apple.pkpass',
      'Last-Modified': modificado.toUTCString(),
    },
  });
}
