'use client';

import { useActionState } from 'react';
import { NEGOCIO } from '@/lib/config';
import { cambiarTarjeta } from '../../acciones';
import { boton } from '../../cabecera';

export function BotonesPersonal({ id, sellos, detalle }: { id: string; sellos: number; detalle: string }) {
  const [estado, accion, enviando] = useActionState(cambiarTarjeta.bind(null, id), null);
  const lleno = sellos >= NEGOCIO.sellosPremio;

  return (
    <section className="mt-6 flex flex-col gap-3 rounded-2xl bg-panel p-4">
      <p className="text-xs text-suave">Panel del barbero · {detalle}</p>
      {lleno ? (
        <form action={accion}>
          <button name="que" value="canjear" disabled={enviando} className={boton}>
            {enviando ? 'Canjeando…' : 'Aplicar 50 % y poner a cero'}
          </button>
        </form>
      ) : (
        <form action={accion}>
          <button name="que" value="sellar" disabled={enviando} className={`${boton} py-5 text-lg`}>
            {enviando ? 'Sellando…' : '✂️  Sellar visita'}
          </button>
        </form>
      )}
      {estado?.ok && <p className="text-center text-sm text-green-400">{estado.ok}</p>}
      {estado?.error && <p className="text-center text-sm text-red-400">{estado.error}</p>}
      <a href="/panel" className="text-center text-sm text-suave underline">Volver al panel</a>
    </section>
  );
}
