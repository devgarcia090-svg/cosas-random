import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

// Sesión del barbero: una cookie firmada con SESSION_SECRET que caduca a los 30 días.
const COOKIE = 'personal';
const DURACION_MS = 30 * 24 * 3600 * 1000;

function firmar(caduca: number): string {
  return createHmac('sha256', process.env.SESSION_SECRET ?? '')
    .update(`personal:${caduca}`)
    .digest('hex');
}

function iguales(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function esPersonal(): Promise<boolean> {
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!valor || !process.env.SESSION_SECRET) return false;
  const [caduca, firma] = valor.split('.');
  return Number(caduca) > Date.now() && iguales(firma ?? '', firmar(Number(caduca)));
}

/** true si el PIN es correcto (y deja abierta la sesión). */
export async function abrirSesion(pin: string): Promise<boolean> {
  const correcto = process.env.STAFF_PIN;
  if (!correcto || !process.env.SESSION_SECRET || !iguales(pin, correcto)) return false;
  const caduca = Date.now() + DURACION_MS;
  (await cookies()).set(COOKIE, `${caduca}.${firmar(caduca)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DURACION_MS / 1000,
    path: '/',
  });
  return true;
}

export async function cerrarSesion(): Promise<void> {
  (await cookies()).delete(COOKIE);
}
