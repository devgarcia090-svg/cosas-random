'use client';

import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCents } from '@/lib/money';
import type { CartLine, Category, Modifier, Product } from '@/lib/types';
import { MisPedidos, recordarPedido, usePedidosGuardados } from './mis-pedidos';

type Props = {
  tableId: string;
  tableName: string;
  zone: string | null;
  venueName: string;
  categories: Category[];
};

/** Nunca decimos "sin alérgenos" por omisión: si la carta del local no declara
 *  nada, lo honesto es mandar a preguntar. */
function Alergenos({ product }: { product: Product }) {
  const partes: string[] = [];
  if (product.allergens.length) {
    partes.push(`Contiene: ${product.allergens.join(', ')}`);
  }
  if (product.allergens_free.length) {
    partes.push(`Sin: ${product.allergens_free.join(', ')}`);
  }
  if (!partes.length) {
    partes.push('Alérgenos: consulta al personal');
  }
  return <p className="mt-1 text-xs text-stone-400">{partes.join(' · ')}</p>;
}

/** Dos líneas se funden si son el mismo producto con las mismas opciones y nota. */
function lineKey(
  productId: string,
  modifiers: Modifier[] | CartLine['modifiers'],
  note: string,
) {
  const ids = modifiers.map((m) => m.id).sort();
  return `${productId}|${ids.join(',')}|${note}`;
}

export function Carta({
  tableId,
  tableName,
  zone,
  venueName,
  categories,
}: Props) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [tab, setTab] = useState<'carta' | 'pedidos'>('carta');
  const misPedidos = usePedidosGuardados(tableId);

  const totalCents = useMemo(
    () =>
      cart.reduce(
        (sum, line) =>
          sum +
          (line.unit_price_cents +
            line.modifiers.reduce((d, m) => d + m.price_delta_cents, 0)) *
            line.quantity,
        0,
      ),
    [cart],
  );
  const totalUnidades = cart.reduce((n, line) => n + line.quantity, 0);

  function addLine(
    product: Product,
    modifiers: CartLine['modifiers'],
    quantity: number,
    note: string,
  ) {
    const key = lineKey(product.id, modifiers, note);
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + quantity }
            : line,
        );
      }
      return [
        ...current,
        {
          key,
          product_id: product.id,
          product_name: product.name,
          unit_price_cents: product.price_cents,
          quantity,
          modifiers,
          note: note || undefined,
        },
      ];
    });
    setSheetProduct(null);
  }

  function cambiarCantidad(key: string, delta: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function enviarPedido(nombre: string, nota: string) {
    const supabase = createClient();
    const { data, error } = await supabase.rpc('place_order', {
      p_table_id: tableId,
      p_items: cart.map((line) => ({
        product_id: line.product_id,
        quantity: line.quantity,
        modifier_ids: line.modifiers.map((m) => m.id),
        note: line.note ?? null,
      })),
      p_customer_name: nombre || null,
      p_note: nota || null,
    });

    if (error) throw new Error(error.message);

    const orderId = (data as { order_id: string }).order_id;
    recordarPedido(tableId, orderId);
    setCart([]);
    setCartOpen(false);
    setTab('pedidos');
  }

  return (
    <div className="flex min-h-dvh flex-col bg-[#faf9f7]">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-baseline justify-between gap-3 px-4 pt-4">
          <div>
            <h1 className="text-lg font-semibold leading-tight">{venueName}</h1>
            <p className="text-sm text-stone-500">
              {tableName}
              {zone ? ` · ${zone}` : ''}
            </p>
          </div>
          <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900">
            Servicio en mesa
          </span>
        </div>
        <nav className="mx-auto flex max-w-2xl gap-1 px-3 pt-3">
          {(['carta', 'pedidos'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                tab === key
                  ? 'border-b-2 border-amber-600 text-stone-900'
                  : 'border-b-2 border-transparent text-stone-500'
              }`}
            >
              {key === 'carta'
                ? 'Carta'
                : `Mis pedidos${misPedidos.length ? ` (${misPedidos.length})` : ''}`}
            </button>
          ))}
        </nav>

        {tab === 'carta' ? (
          <div className="border-t border-stone-200 bg-[#faf9f7]/95">
            <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 py-2.5 [scrollbar-width:none]">
              {categories.map((category) => (
                <a
                  key={category.id}
                  href={`#cat-${category.id}`}
                  className="whitespace-nowrap rounded-full border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700"
                >
                  {category.name}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {tab === 'carta' ? (
        <>
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-32">
            {categories.map((category) => (
              <section
                key={category.id}
                id={`cat-${category.id}`}
                className="scroll-mt-44 pt-6"
              >
                <h2 className="pb-2 text-base font-semibold uppercase tracking-wide text-stone-500">
                  {category.name}
                </h2>
                <ul className="divide-y divide-stone-200 overflow-hidden rounded-xl border border-stone-200 bg-white">
                  {category.products.map((product) => (
                    <li key={product.id}>
                      <button
                        onClick={() =>
                          product.modifier_groups.length
                            ? setSheetProduct(product)
                            : addLine(product, [], 1, '')
                        }
                        className="flex w-full items-start gap-3 p-4 text-left active:bg-stone-50"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{product.name}</p>
                          {product.description ? (
                            <p className="mt-0.5 text-sm text-stone-500">
                              {product.description}
                            </p>
                          ) : null}
                          <Alergenos product={product} />
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="font-medium tabular-nums">
                            {formatCents(product.price_cents)}
                          </span>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-lg leading-none text-white">
                            +
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </main>
        </>
      ) : (
        <MisPedidos tableId={tableId} orderIds={misPedidos} />
      )}

      {totalUnidades > 0 && tab === 'carta' ? (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-stone-200 bg-white px-4 pt-3">
          <button
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-2xl items-center justify-between rounded-xl bg-amber-600 px-4 py-3 font-medium text-white"
          >
            <span>
              Ver pedido · {totalUnidades}{' '}
              {totalUnidades === 1 ? 'artículo' : 'artículos'}
            </span>
            <span className="tabular-nums">{formatCents(totalCents)}</span>
          </button>
        </div>
      ) : null}

      {sheetProduct ? (
        <ProductSheet
          product={sheetProduct}
          onClose={() => setSheetProduct(null)}
          onAdd={addLine}
        />
      ) : null}

      {cartOpen ? (
        <CartSheet
          cart={cart}
          totalCents={totalCents}
          onClose={() => setCartOpen(false)}
          onQuantity={cambiarCantidad}
          onSubmit={enviarPedido}
        />
      ) : null}
    </div>
  );
}

function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end">
      <button
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative mx-auto flex max-h-[88dvh] w-full max-w-2xl flex-col rounded-t-2xl bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm text-stone-500"
          >
            Cerrar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">{children}</div>
        <div className="safe-bottom border-t border-stone-200 px-4 pt-3">
          {footer}
        </div>
      </div>
    </div>
  );
}

function ProductSheet({
  product,
  onClose,
  onAdd,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (
    product: Product,
    modifiers: CartLine['modifiers'],
    quantity: number,
    note: string,
  ) => void;
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');

  const chosen = product.modifier_groups.flatMap((group) =>
    group.modifiers.filter((m) => (selected[group.id] ?? []).includes(m.id)),
  );

  const unitCents =
    product.price_cents + chosen.reduce((d, m) => d + m.price_delta_cents, 0);

  const faltan = product.modifier_groups.filter(
    (group) => (selected[group.id] ?? []).length < group.min_select,
  );

  function toggle(groupId: string, modifierId: string, maxSelect: number) {
    setSelected((current) => {
      const previous = current[groupId] ?? [];
      if (previous.includes(modifierId)) {
        return { ...current, [groupId]: previous.filter((id) => id !== modifierId) };
      }
      // Grupo de una sola opción: elegir sustituye en vez de acumular.
      if (maxSelect === 1) return { ...current, [groupId]: [modifierId] };
      if (previous.length >= maxSelect) return current;
      return { ...current, [groupId]: [...previous, modifierId] };
    });
  }

  return (
    <Sheet
      title={product.name}
      onClose={onClose}
      footer={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-stone-300 px-3 py-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="text-xl leading-none text-stone-600"
              aria-label="Quitar uno"
            >
              −
            </button>
            <span className="w-5 text-center tabular-nums">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              className="text-xl leading-none text-stone-600"
              aria-label="Añadir uno"
            >
              +
            </button>
          </div>
          <button
            disabled={faltan.length > 0}
            onClick={() =>
              onAdd(
                product,
                chosen.map((m) => ({
                  id: m.id,
                  name: m.name,
                  price_delta_cents: m.price_delta_cents,
                })),
                quantity,
                note.trim(),
              )
            }
            className="flex-1 rounded-xl bg-amber-600 px-4 py-3 font-medium text-white disabled:bg-stone-300"
          >
            {faltan.length
              ? `Elige ${faltan[0].name.toLowerCase()}`
              : `Añadir · ${formatCents(unitCents * quantity)}`}
          </button>
        </div>
      }
    >
      {product.description ? (
        <p className="pt-1 text-stone-600">{product.description}</p>
      ) : null}
      <div className="pb-3 pt-1">
        <Alergenos product={product} />
      </div>

      {product.modifier_groups.map((group) => (
        <fieldset key={group.id} className="border-t border-stone-200 py-3">
          <legend className="flex w-full items-baseline justify-between pb-1">
            <span className="font-medium">{group.name}</span>
            <span className="text-xs text-stone-500">
              {group.min_select > 0 ? 'Obligatorio' : 'Opcional'}
              {group.max_select > 1 ? ` · máx. ${group.max_select}` : ''}
            </span>
          </legend>
          <div className="flex flex-col">
            {group.modifiers.map((modifier) => {
              const isOn = (selected[group.id] ?? []).includes(modifier.id);
              return (
                <label
                  key={modifier.id}
                  className="flex items-center gap-3 py-2.5"
                >
                  <input
                    type={group.max_select === 1 ? 'radio' : 'checkbox'}
                    name={group.id}
                    checked={isOn}
                    onChange={() =>
                      toggle(group.id, modifier.id, group.max_select)
                    }
                    className="h-5 w-5 accent-amber-600"
                  />
                  <span className="flex-1">{modifier.name}</span>
                  {modifier.price_delta_cents !== 0 ? (
                    <span className="text-sm text-stone-500 tabular-nums">
                      +{formatCents(modifier.price_delta_cents)}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="border-t border-stone-200 pt-3">
        <label className="text-sm font-medium" htmlFor="nota-producto">
          Alguna indicación para cocina
        </label>
        <input
          id="nota-producto"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={140}
          placeholder="Sin cebolla, poco hecho..."
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
        />
      </div>
    </Sheet>
  );
}

function CartSheet({
  cart,
  totalCents,
  onClose,
  onQuantity,
  onSubmit,
}: {
  cart: CartLine[];
  totalCents: number;
  onClose: () => void;
  onQuantity: (key: string, delta: number) => void;
  onSubmit: (nombre: string, nota: string) => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [nota, setNota] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setEnviando(true);
    setError(null);
    try {
      await onSubmit(nombre.trim(), nota.trim());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'No hemos podido enviar el pedido',
      );
      setEnviando(false);
    }
  }

  return (
    <Sheet
      title="Tu pedido"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2">
          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <button
            onClick={submit}
            disabled={enviando || cart.length === 0}
            className="flex items-center justify-between rounded-xl bg-amber-600 px-4 py-3 font-medium text-white disabled:bg-stone-300"
          >
            <span>{enviando ? 'Enviando…' : 'Enviar a cocina'}</span>
            <span className="tabular-nums">{formatCents(totalCents)}</span>
          </button>
          <p className="pb-1 text-center text-xs text-stone-500">
            Se cobra al final, en la mesa.
          </p>
        </div>
      }
    >
      <ul className="divide-y divide-stone-200">
        {cart.map((line) => {
          const unit =
            line.unit_price_cents +
            line.modifiers.reduce((d, m) => d + m.price_delta_cents, 0);
          return (
            <li key={line.key} className="flex items-start gap-3 py-3">
              <div className="flex-1">
                <p className="font-medium">{line.product_name}</p>
                {line.modifiers.length ? (
                  <p className="text-sm text-stone-500">
                    {line.modifiers.map((m) => m.name).join(' · ')}
                  </p>
                ) : null}
                {line.note ? (
                  <p className="text-sm text-stone-500 italic">{line.note}</p>
                ) : null}
                <div className="mt-2 flex items-center gap-3">
                  <button
                    onClick={() => onQuantity(line.key, -1)}
                    className="h-7 w-7 rounded-full border border-stone-300 text-stone-600"
                    aria-label="Quitar uno"
                  >
                    −
                  </button>
                  <span className="tabular-nums">{line.quantity}</span>
                  <button
                    onClick={() => onQuantity(line.key, 1)}
                    className="h-7 w-7 rounded-full border border-stone-300 text-stone-600"
                    aria-label="Añadir uno"
                  >
                    +
                  </button>
                </div>
              </div>
              <span className="tabular-nums">
                {formatCents(unit * line.quantity)}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-col gap-3 border-t border-stone-200 pt-3">
        <div>
          <label className="text-sm font-medium" htmlFor="nombre">
            Tu nombre (opcional)
          </label>
          <input
            id="nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            maxLength={40}
            placeholder="Para saber de quién es cada cosa"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="nota-pedido">
            Nota para la sala (opcional)
          </label>
          <input
            id="nota-pedido"
            value={nota}
            onChange={(event) => setNota(event.target.value)}
            maxLength={200}
            placeholder="Traed las bebidas primero, por favor"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </div>
      </div>
    </Sheet>
  );
}
