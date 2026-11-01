// Datos del negocio. Para otra barbería basta con cambiar este fichero.
export const NEGOCIO = {
  nombre: 'La Oficina del Barbero',
  iniciales: 'OB',
  sellosPremio: 10, // Si cambias este número, cámbialo también en la migración.
  premio: '50 % en tu siguiente corte',
  colores: {
    fondo: '#111111',
    texto: '#f5efe3',
    dorado: '#c9a227',
  },
} as const;

export function urlPublica(): string {
  return (process.env.PUBLIC_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}

export function urlTarjeta(id: string): string {
  return `${urlPublica()}/t/${id}`;
}

export function textoPremio(sellos: number): string {
  const faltan = NEGOCIO.sellosPremio - sellos;
  if (faltan <= 0) return '¡Tienes un 50 % en este corte!';
  return `Te ${faltan === 1 ? 'falta 1 corte' : `faltan ${faltan} cortes`} para el 50 %`;
}

export function appleConfigurado(): boolean {
  const e = process.env;
  return Boolean(
    e.APPLE_PASS_TYPE_ID && e.APPLE_TEAM_ID && e.APPLE_CERT && e.APPLE_KEY && e.APPLE_WWDR,
  );
}

export function googleConfigurado(): boolean {
  return Boolean(process.env.GOOGLE_ISSUER_ID && process.env.GOOGLE_SERVICE_ACCOUNT);
}
