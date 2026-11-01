'use client';

import { useActionState } from 'react';
import { NEGOCIO } from '@/lib/config';
import { darDeAlta } from './acciones';
import { boton, campo } from './cabecera';

export function FormAlta() {
  const [estado, accion, enviando] = useActionState(darDeAlta, null);
  return (
    <form action={accion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input name="nombre" required maxLength={60} autoComplete="given-name" className={campo} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Teléfono
        <input name="telefono" required type="tel" inputMode="tel" autoComplete="tel" className={campo} />
      </label>
      <label className="flex items-start gap-3 text-xs text-suave">
        <input name="acepto" value="si" type="checkbox" required className="mt-0.5 size-4 accent-dorado" />
        <span>
          Acepto que {NEGOCIO.nombre} guarde mi nombre y teléfono solo para gestionar esta tarjeta.
          Puedo pedir que los borren cuando quiera en el local.
        </span>
      </label>
      {estado?.error && <p className="text-sm text-red-400">{estado.error}</p>}
      <button disabled={enviando} className={boton}>
        {enviando ? 'Creando…' : 'Quiero mi tarjeta'}
      </button>
    </form>
  );
}
