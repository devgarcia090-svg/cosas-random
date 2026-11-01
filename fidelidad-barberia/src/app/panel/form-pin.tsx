'use client';

import { useActionState } from 'react';
import { entrar } from '../acciones';
import { boton, campo } from '../cabecera';

export function FormPin() {
  const [estado, accion, enviando] = useActionState(entrar, null);
  return (
    <form action={accion} className="flex flex-col gap-4">
      <input
        name="pin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        placeholder="PIN"
        required
        className={`${campo} text-center text-2xl tracking-[0.5em]`}
      />
      {estado?.error && <p className="text-center text-sm text-red-400">{estado.error}</p>}
      <button disabled={enviando} className={boton}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
