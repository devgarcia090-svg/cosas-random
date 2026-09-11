'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCents } from '@/lib/money';
import {
  STATUS_LABEL,
  type OrderStatus,
  type OrderWithItems,
} from '@/lib/types';

const ACTIVOS: OrderStatus[] = ['pending', 'accepted', 'preparing'];

const SIGUIENTE: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'served',
};

const ACCION: Partial<Record<OrderStatus, string>> = {
  pending: 'Confirmar',
  accepted: 'A preparar',
  preparing: 'Marcar servido',
};

/** Dos pitidos cortos cuando entra una comanda. Sin dependencias ni ficheros. */
function pitido() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.18].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + offset + 0.14,
      );
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.15);
    });
  } catch {
    // El navegador aún no permite audio (hace falta una interacción previa).
  }
}

function minutosDesde(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export function Sala({
  venueId,
  pedidosIniciales,
  email,
}: {
  venueId: string;
  pedidosIniciales: OrderWithItems[];
  email: string;
}) {
  const [orders, setOrders] = useState(pedidosIniciales);
  const [sonido, setSonido] = useState(true);
  const [vista, setVista] = useState<'activos' | 'servidos'>('activos');
  const [, forzarRender] = useState(0);
  const conocidos = useRef(new Set(pedidosIniciales.map((o) => o.id)));
  // En una ref para no volver a suscribirse cada vez que se cambia el sonido.
  const sonidoRef = useRef(sonido);

  useEffect(() => {
    sonidoRef.current = sonido;
  }, [sonido]);

  const cargar = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('orders')
      .select('*, order_items (*), venue_tables (name, zone)')
      .eq('venue_id', venueId)
      .gt('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    setOrders((data ?? []) as OrderWithItems[]);
  }, [venueId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`sala-${venueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `venue_id=eq.${venueId}`,
        },
        (payload) => {
          const nuevo = payload.new as { id?: string } | null;
          if (
            payload.eventType === 'INSERT' &&
            nuevo?.id &&
            !conocidos.current.has(nuevo.id)
          ) {
            conocidos.current.add(nuevo.id);
            if (sonidoRef.current) pitido();
          }
          void cargar();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [venueId, cargar]);

  // Refresca los "hace X min" sin depender de que llegue un evento.
  useEffect(() => {
    const id = window.setInterval(() => forzarRender((n) => n + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  async function cambiarEstado(orderId: string, status: OrderStatus) {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) void cargar();
  }

  const visibles = orders
    .filter((order) =>
      vista === 'activos'
        ? ACTIVOS.includes(order.status)
        : order.status === 'served' || order.status === 'cancelled',
    )
    .sort((a, b) =>
      vista === 'activos'
        ? a.created_at.localeCompare(b.created_at)
        : b.created_at.localeCompare(a.created_at),
    );

  const activos = orders.filter((o) => ACTIVOS.includes(o.status)).length;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold">Comandas</h1>
          <div className="flex gap-1 rounded-lg bg-stone-100 p-1">
            <button
              onClick={() => setVista('activos')}
              className={`rounded-md px-3 py-1 text-sm ${vista === 'activos' ? 'bg-white shadow-sm' : 'text-stone-500'}`}
            >
              En curso ({activos})
            </button>
            <button
              onClick={() => setVista('servidos')}
              className={`rounded-md px-3 py-1 text-sm ${vista === 'servidos' ? 'bg-white shadow-sm' : 'text-stone-500'}`}
            >
              Cerrados
            </button>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm text-stone-500">
            <button
              onClick={() => {
                setSonido((on) => !on);
                if (!sonido) pitido();
              }}
              className="rounded-lg border border-stone-300 px-2.5 py-1"
            >
              Sonido: {sonido ? 'sí' : 'no'}
            </button>
            <Link href="/admin" className="underline">
              Carta
            </Link>
            <span className="hidden sm:inline">{email}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4">
        {visibles.length === 0 ? (
          <p className="py-16 text-center text-stone-500">
            {vista === 'activos'
              ? 'No hay comandas pendientes.'
              : 'Todavía no hay comandas cerradas hoy.'}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibles.map((order) => {
              const minutos = minutosDesde(order.created_at);
              const urgente = ACTIVOS.includes(order.status) && minutos >= 15;
              const siguiente = SIGUIENTE[order.status];

              return (
                <li
                  key={order.id}
                  className={`flex flex-col overflow-hidden rounded-xl border bg-white ${
                    urgente ? 'border-red-400' : 'border-stone-200'
                  }`}
                >
                  <div className="flex items-baseline justify-between border-b border-stone-200 px-4 py-3">
                    <div>
                      <p className="font-semibold">
                        {order.venue_tables?.name ?? 'Mesa'}
                        <span className="font-normal text-stone-500">
                          {' '}
                          · ronda {order.round}
                        </span>
                      </p>
                      {order.customer_name ? (
                        <p className="text-sm text-stone-500">
                          {order.customer_name}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`text-sm tabular-nums ${urgente ? 'font-medium text-red-600' : 'text-stone-500'}`}
                    >
                      {minutos} min
                    </span>
                  </div>

                  <ul className="flex-1 divide-y divide-stone-100 px-4">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex gap-2 py-2.5">
                        <span className="font-semibold tabular-nums">
                          {item.quantity}×
                        </span>
                        <span className="flex-1">
                          {item.product_name}
                          {item.modifiers.length ? (
                            <span className="block text-sm text-stone-600">
                              {item.modifiers.map((m) => m.name).join(' · ')}
                            </span>
                          ) : null}
                          {item.note ? (
                            <span className="mt-1 block rounded bg-amber-50 px-2 py-1 text-sm text-amber-900">
                              {item.note}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {order.note ? (
                    <p className="mx-4 mb-2 rounded bg-amber-50 px-2 py-1 text-sm text-amber-900">
                      Nota: {order.note}
                    </p>
                  ) : null}

                  <div className="flex items-center justify-between border-t border-stone-200 px-4 py-2 text-sm text-stone-500">
                    <span>{STATUS_LABEL[order.status]}</span>
                    <span className="tabular-nums">
                      {formatCents(order.total_cents)}
                    </span>
                  </div>

                  {siguiente ? (
                    <div className="flex gap-2 border-t border-stone-200 p-3">
                      <button
                        onClick={() => cambiarEstado(order.id, siguiente)}
                        className="flex-1 rounded-lg bg-stone-900 px-3 py-2.5 font-medium text-white"
                      >
                        {ACCION[order.status]}
                      </button>
                      <button
                        onClick={() => cambiarEstado(order.id, 'cancelled')}
                        className="rounded-lg border border-stone-300 px-3 py-2.5 text-stone-600"
                      >
                        Anular
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
