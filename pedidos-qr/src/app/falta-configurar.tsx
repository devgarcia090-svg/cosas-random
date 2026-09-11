export function FaltaConfigurar() {
  return (
    <main className="mx-auto flex max-w-lg flex-1 flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Falta conectar Supabase</h1>
      <p className="text-stone-600">
        Copia <code className="rounded bg-stone-200 px-1">.env.example</code> a{' '}
        <code className="rounded bg-stone-200 px-1">.env.local</code> y rellena
        la URL y la clave <em>anon</em> de tu proyecto de Supabase. Después
        ejecuta las migraciones y el seed de la carpeta{' '}
        <code className="rounded bg-stone-200 px-1">supabase/</code>.
      </p>
      <p className="text-sm text-stone-500">
        Las instrucciones completas están en el README del proyecto.
      </p>
    </main>
  );
}
