import postgres from 'postgres';

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  sellos: number;
  premios_canjeados: number;
  apple_token: string;
  actualizado: Date;
};

// Una sola conexión por proceso, también con la recarga en caliente de `next dev`.
const global = globalThis as unknown as { sql?: postgres.Sql };
export const sql = (global.sql ??= postgres(process.env.DATABASE_URL ?? '', { max: 5 }));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function buscarCliente(id: string): Promise<Cliente | null> {
  if (!UUID.test(id)) return null;
  const [c] = await sql<Cliente[]>`select * from fidelidad.clientes where id = ${id}`;
  return c ?? null;
}
