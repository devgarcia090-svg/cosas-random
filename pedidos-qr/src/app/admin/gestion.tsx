'use client';

import Link from 'next/link';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCents } from '@/lib/money';
import type { Product, VenueTable } from '@/lib/types';

type Categoria = {
  id: string;
  name: string;
  position: number;
  products: Product[];
};

export function Gestion({
  categorias,
  mesas,
}: {
  categorias: Categoria[];
  mesas: VenueTable[];
}) {
  const [vista, setVista] = useState<'carta' | 'mesas'>('carta');

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white px-4 py-3 print:hidden">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <h1 className="text-lg font-semibold">Gestión</h1>
          <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
            <button
              onClick={() => setVista('carta')}
              className={`rounded-md px-3 py-1 text-sm ${vista === 'carta' ? 'bg-white shadow-sm' : 'text-stone-500'}`}
            >
              Carta
            </button>
            <button
              onClick={() => setVista('mesas')}
              className={`rounded-md px-3 py-1 text-sm ${vista === 'mesas' ? 'bg-white shadow-sm' : 'text-stone-500'}`}
            >
              Mesas y QR
            </button>
          </div>
          <Link href="/cocina" className="ml-auto text-sm underline">
            Comandas
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 p-4">
        {vista === 'carta' ? (
          <CartaAdmin categorias={categorias} />
        ) : (
          <MesasAdmin mesas={mesas} />
        )}
      </main>
    </div>
  );
}

function CartaAdmin({ categorias }: { categorias: Categoria[] }) {
  const [estado, setEstado] = useState<Record<string, boolean>>(
    Object.fromEntries(
      categorias.flatMap((c) => c.products.map((p) => [p.id, p.available])),
    ),
  );
  const [error, setError] = useState<string | null>(null);

  async function alternar(productId: string) {
    const siguiente = !estado[productId];
    setEstado((current) => ({ ...current, [productId]: siguiente }));
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from('products')
      .update({ available: siguiente })
      .eq('id', productId);

    if (updateError) {
      // Revertir: lo que manda es lo que hay en la base de datos.
      setEstado((current) => ({ ...current, [productId]: !siguiente }));
      setError('No se ha podido guardar el cambio');
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-stone-500">
        Desactiva lo que se haya terminado: desaparece de la carta al instante,
        sin tocar el precio ni borrar nada.
      </p>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {categorias.map((categoria) => (
        <section key={categoria.id}>
          <h2 className="pb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
            {categoria.name}
          </h2>
          <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
            {categoria.products.map((product) => (
              <li
                key={product.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="flex-1">
                  <p
                    className={
                      estado[product.id] ? 'font-medium' : 'font-medium text-stone-400 line-through'
                    }
                  >
                    {product.name}
                  </p>
                  <p className="text-sm text-stone-500 tabular-nums">
                    {formatCents(product.price_cents)}
                  </p>
                </div>
                <button
                  onClick={() => alternar(product.id)}
                  aria-pressed={estado[product.id]}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    estado[product.id]
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-stone-200 text-stone-600'
                  }`}
                >
                  {estado[product.id] ? 'Disponible' : 'Agotado'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MesasAdmin({ mesas }: { mesas: VenueTable[] }) {
  const [qrs, setQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelado = false;

    async function generar() {
      const entradas = await Promise.all(
        mesas.map(async (mesa) => {
          const url = `${window.location.origin}/mesa/${mesa.id}`;
          const dataUrl = await QRCode.toDataURL(url, {
            margin: 1,
            width: 320,
            errorCorrectionLevel: 'M',
          });
          return [mesa.id, dataUrl] as const;
        }),
      );
      if (!cancelado) setQrs(Object.fromEntries(entradas));
    }

    void generar();
    return () => {
      cancelado = true;
    };
  }, [mesas]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <p className="text-sm text-stone-500">
          Un QR por mesa. Imprímelos y pégalos en el sitio.
        </p>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm"
        >
          Imprimir
        </button>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mesas.map((mesa) => (
          <li
            key={mesa.id}
            className="flex flex-col items-center gap-2 rounded-xl border border-stone-200 bg-white p-4 text-center break-inside-avoid"
          >
            <p className="text-lg font-semibold">{mesa.name}</p>
            {mesa.zone ? (
              <p className="-mt-1 text-sm text-stone-500">{mesa.zone}</p>
            ) : null}
            {qrs[mesa.id] ? (
              // El QR es un data URL generado en el navegador: next/image no aporta aquí.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrs[mesa.id]}
                alt={`Código QR de ${mesa.name}`}
                className="h-40 w-40"
              />
            ) : (
              <div className="h-40 w-40 animate-pulse rounded bg-stone-100" />
            )}
            <p className="text-xs text-stone-500">
              Escanea y pide desde tu móvil
            </p>
            <Link
              href={`/mesa/${mesa.id}`}
              className="text-xs underline print:hidden"
            >
              Abrir carta
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
