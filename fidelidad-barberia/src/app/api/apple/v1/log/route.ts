// Servicio web de Apple Wallet: el iPhone manda aquí sus errores con la tarjeta.
export async function POST(req: Request) {
  console.warn('[apple wallet]', await req.text());
  return new Response(null, { status: 200 });
}
