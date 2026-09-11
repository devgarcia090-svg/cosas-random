'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCents } from '@/lib/money';
import { STATUS_FLOW, STATUS_LABEL, type OrderWithItems } from '@/lib/types';

const storageKey = (tableId: string) => `pedidos-qr:mesa:${tableId}`;

// Pequeño store externo sobre localStorage: así el componente lo lee con
// useSyncExternalStore en vez de con un efecto que escribe estado al montar.
const listeners = new Set<() => void>();
const cache = new Map<string, string>();

function snapshot(tableId: string): string {
  const enCache = cache.get(tableId);
  if (enCache !== undefined) return enCache;

  let raw = '[]';
  try {
    raw = window.localStorage.getItem(storageKey(tableId)) ?? '[]';
  } catch {
    // Modo incógnito o almacenamiento bloqueado.
  }
  cache.set(tableId, raw);
  return raw;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Guarda el pedido en este móvil y avisa a quien esté escuchando. */
export function recordarPedido(tableId: string, orderId: string): void {
  const ids = [...(JSON.parse(snapshot(tableId)) as string[]), orderId];
  const raw = JSON.stringify(ids);

  cache.set(tableId, raw);
  try {
    window.localStorage.setItem(storageKey(tableId), raw);
  } catch {
    // El pedido ya está hecho: perder el histórico local no es grave.
  }
  for (const listener of listeners) listener();
}

/** Los pedidos hechos desde este móvil. En servidor siempre vacío. */
export function usePedidosGuardados(tableId: string): string[] {
  const raw = useSyncExternalStore(
    subscribe,
    () => snapshot(tableId),
    () => '[]',
  );
  return useMemo(() => JSON.parse(raw) as string[], [raw]);
}

export function MisPedidos({
  tableId,
  orderIds,
}: {
  tableId: string;
  orderIds: string[];
}) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [cargando, setCargando] = useState(orderIds.length > 0);
  // La sala cambia el estado desde su pantalla: cada evento sube esta versión
  // y dispara una recarga.
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (orderIds.length === 0) return;

    let cancelado = false;

    void (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('orders')
        .select('*, order_items (*)')
        .in('id', orderIds)
        .order('created_at', { ascending: false });

      if (cancelado) return;
      setOrders((data ?? []) as OrderWithItems[]);
      setCargando(false);
    })();

    return () => {
      cancelado = true;
    };
  }, [orderIds, version]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`mesa-${tableId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `table_id=eq.${tableId}`,
        },
        () => setVersion((n) => n + 1),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tableId]);

  if (cargando) {
    return <p className="p-6 text-stone-500">Cargando tus pedidos…</p>;
  }

  if (orders.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 text-center">
        <p className="text-stone-500">
          Todavía no has pedido nada desde este móvil.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-12 pt-4">
      <ul className="flex flex-col gap-3">
        {orders.map((order) => (
          <li
            key={order.id}
            className="overflow-hidden rounded-xl border border-stone-200 bg-white"
          >
            <div className="flex items-baseline justify-between border-b border-stone-200 px-4 py-3">
              <span className="font-medium">Ronda {order.round}</span>
              <span className="text-sm text-stone-500">
                {new Date(order.created_at).toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="px-4 py-3">
              {order.status === 'cancelled' ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  Pedido cancelado. Avisa a la sala si es un error.
                </p>
              ) : (
                <ol className="flex items-center gap-1">
                  {STATUS_FLOW.map((step) => {
                    const hecho =
                      STATUS_FLOW.indexOf(order.status) >=
                      STATUS_FLOW.indexOf(step);
                    return (
                      <li key={step} className="flex flex-1 flex-col gap-1.5">
                        <span
                          className={`h-1.5 rounded-full ${
                            hecho ? 'bg-amber-600' : 'bg-stone-200'
                          }`}
                        />
                        <span
                          className={`text-[11px] ${
                            hecho ? 'text-stone-700' : 'text-stone-400'
                          }`}
                        >
                          {STATUS_LABEL[step]}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <ul className="divide-y divide-stone-100 border-t border-stone-100">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex gap-3 px-4 py-2.5 text-sm">
                  <span className="tabular-nums text-stone-500">
                    {item.quantity}×
                  </span>
                  <span className="flex-1">
                    {item.product_name}
                    {item.modifiers.length ? (
                      <span className="block text-stone-500">
                        {item.modifiers.map((m) => m.name).join(' · ')}
                      </span>
                    ) : null}
                    {item.note ? (
                      <span className="block italic text-stone-500">
                        {item.note}
                      </span>
                    ) : null}
                  </span>
                  <span className="tabular-nums">
                    {formatCents(item.line_total_cents)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between border-t border-stone-200 px-4 py-3 font-medium">
              <span>Total ronda</span>
              <span className="tabular-nums">
                {formatCents(order.total_cents)}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="pt-6 text-center text-sm text-stone-500">
        El pago se hace en la mesa al terminar.
      </p>
    </main>
  );
}
