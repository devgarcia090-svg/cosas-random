import { sql } from '@/lib/db';

// Servicio web de Apple Wallet: tras un aviso, el iPhone pregunta qué tarjetas
// suyas han cambiado desde la última vez (`passesUpdatedSince`).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ deviceId: string; passTypeId: string }> },
) {
  const { deviceId, passTypeId } = await params;
  if (passTypeId !== process.env.APPLE_PASS_TYPE_ID) return new Response(null, { status: 404 });
  const desde = Number(new URL(req.url).searchParams.get('passesUpdatedSince') ?? 0) || 0;

  const filas = await sql<{ id: string; marca: string }[]>`
    select c.id, extract(epoch from c.actualizado)::text as marca
      from fidelidad.apple_dispositivos d
      join fidelidad.clientes c on c.id = d.cliente_id
     where d.device_id = ${deviceId}
       and c.actualizado > to_timestamp(${desde})`;
  if (filas.length === 0) return new Response(null, { status: 204 });

  return Response.json({
    serialNumbers: filas.map((f) => f.id),
    lastUpdated: filas.map((f) => f.marca).sort((a, b) => Number(b) - Number(a))[0],
  });
}
