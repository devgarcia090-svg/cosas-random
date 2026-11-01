import { clienteAutorizado } from '@/lib/apple';
import { sql } from '@/lib/db';

// Servicio web de Apple Wallet: el iPhone se apunta (POST) o se borra (DELETE)
// para recibir avisos de cambios de esta tarjeta.
type Ctx = { params: Promise<{ deviceId: string; passTypeId: string; serial: string }> };

export async function POST(req: Request, { params }: Ctx) {
  const { deviceId, passTypeId, serial } = await params;
  const c = await clienteAutorizado(req, passTypeId, serial);
  if (!c) return new Response(null, { status: 401 });
  const { pushToken } = await req.json();
  if (typeof pushToken !== 'string') return new Response(null, { status: 400 });
  const filas = await sql`
    insert into fidelidad.apple_dispositivos (device_id, cliente_id, push_token)
    values (${deviceId}, ${c.id}, ${pushToken})
    on conflict (device_id, cliente_id) do update set push_token = excluded.push_token
    returning (xmax = 0) as nuevo`;
  return new Response(null, { status: filas[0].nuevo ? 201 : 200 });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const { deviceId, passTypeId, serial } = await params;
  const c = await clienteAutorizado(req, passTypeId, serial);
  if (!c) return new Response(null, { status: 401 });
  await sql`delete from fidelidad.apple_dispositivos where device_id = ${deviceId} and cliente_id = ${c.id}`;
  return new Response(null, { status: 200 });
}
