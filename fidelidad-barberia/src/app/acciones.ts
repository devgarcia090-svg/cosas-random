'use server';

import { after } from 'next/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { avisarCambio } from '@/lib/avisar';
import { sql, type Cliente } from '@/lib/db';
import { abrirSesion, cerrarSesion, esPersonal } from '@/lib/personal';
import { normalizarTelefono } from '@/lib/telefono';

export type Estado = { error?: string; ok?: string } | null;

export async function darDeAlta(_prev: Estado, form: FormData): Promise<Estado> {
  const nombre = String(form.get('nombre') ?? '').trim().slice(0, 60);
  const telefono = normalizarTelefono(String(form.get('telefono') ?? ''));
  if (!nombre) return { error: 'Escribe tu nombre.' };
  if (!telefono) return { error: 'Ese teléfono no parece válido.' };
  if (form.get('acepto') !== 'si') return { error: 'Necesitamos tu permiso para guardar tus datos.' };

  let id: string;
  try {
    [{ id }] = await sql<{ id: string }[]>`
      insert into fidelidad.clientes (nombre, telefono) values (${nombre}, ${telefono}) returning id`;
  } catch (e) {
    if ((e as { code?: string }).code === '23505') {
      return { error: 'Ese teléfono ya tiene tarjeta. Pídela en el mostrador y te la volvemos a enviar.' };
    }
    throw e;
  }
  redirect(`/t/${id}`);
}

export async function entrar(_prev: Estado, form: FormData): Promise<Estado> {
  if (!(await abrirSesion(String(form.get('pin') ?? '')))) {
    // Frena a quien pruebe PINs a lo loco.
    await new Promise((r) => setTimeout(r, 1500));
    return { error: 'PIN incorrecto.' };
  }
  redirect('/panel');
}

export async function salir(): Promise<void> {
  await cerrarSesion();
  redirect('/panel');
}

const MENSAJES: Record<string, string> = {
  premio_pendiente: 'Ya tiene los 10 sellos: aplica el 50 % y canjea antes de sellar.',
  sellado_hace_poco: 'Ya se selló hace menos de 10 minutos.',
  sin_premio: 'Aún no tiene los 10 sellos.',
  cliente_no_existe: 'Esta tarjeta no existe.',
};

async function cambiar(funcion: 'sellar' | 'canjear', id: string): Promise<Estado> {
  if (!(await esPersonal())) return { error: 'La sesión ha caducado: vuelve a entrar en el panel.' };
  let c: Cliente;
  try {
    [c] =
      funcion === 'sellar'
        ? await sql<Cliente[]>`select * from fidelidad.sellar(${id}::uuid)`
        : await sql<Cliente[]>`select * from fidelidad.canjear(${id}::uuid)`;
  } catch (e) {
    const mensaje = MENSAJES[(e as Error).message];
    if (mensaje) return { error: mensaje };
    throw e;
  }
  after(() => avisarCambio(c));
  revalidatePath(`/t/${id}`);
  return { ok: funcion === 'sellar' ? `Sello puesto: ${c.sellos}/10.` : '50 % canjeado. Tarjeta a cero.' };
}

/** Botones del barbero en la tarjeta. El formulario dice qué hacer en `que`. */
export async function cambiarTarjeta(id: string, _prev: Estado, form: FormData): Promise<Estado> {
  return cambiar(form.get('que') === 'canjear' ? 'canjear' : 'sellar', id);
}
