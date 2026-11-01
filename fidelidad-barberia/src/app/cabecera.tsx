import { NEGOCIO } from '@/lib/config';

export function Cabecera({ subtitulo }: { subtitulo?: string }) {
  return (
    <header className="mb-8 flex flex-col items-center text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/api/img/logo" alt="" width={72} height={72} className="mb-3 rounded-full" />
      <h1 className="font-serif text-2xl tracking-wide text-dorado">{NEGOCIO.nombre}</h1>
      {subtitulo && <p className="mt-1 text-sm text-suave">{subtitulo}</p>}
    </header>
  );
}

export const campo =
  'w-full rounded-lg border border-white/15 bg-panel px-4 py-3 text-base outline-none focus:border-dorado';
export const boton =
  'w-full rounded-lg bg-dorado px-4 py-3 font-semibold text-fondo active:opacity-80 disabled:opacity-50';
