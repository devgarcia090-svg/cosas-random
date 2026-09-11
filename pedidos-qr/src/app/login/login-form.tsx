'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setEnviando(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Usuario o contraseña incorrectos');
      setEnviando(false);
      return;
    }

    router.replace('/cocina');
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Acceso para el personal</h1>
        <p className="text-stone-500">Comandas y carta del local.</p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            className="rounded-lg border border-stone-300 px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Contraseña
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="rounded-lg border border-stone-300 px-3 py-2 font-normal"
          />
        </label>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-xl bg-stone-900 px-4 py-3 font-medium text-white disabled:bg-stone-400"
        >
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
