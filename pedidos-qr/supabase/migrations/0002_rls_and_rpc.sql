-- Pedidos QR — RLS, RPC de alta de pedido y realtime.

-- ------------------------------------------------------------------ helper --

-- SECURITY DEFINER para que las políticas puedan mirar `staff` sin recursión.
create or replace function public.is_staff(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from staff
    where staff.user_id = auth.uid() and staff.venue_id = p_venue_id
  );
$$;

-- ------------------------------------------------------------- alta pedido --

-- El cliente NO inserta pedidos directamente: manda la intención y el servidor
-- decide los precios. Así el carrito del móvil no puede mentir.
create or replace function public.place_order(
  p_table_id      uuid,
  p_items         jsonb,
  p_customer_name text default null,
  p_note          text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venue_id    uuid;
  v_session_id  uuid;
  v_order_id    uuid;
  v_round       int;
  v_total       int := 0;
  v_item        jsonb;
  v_product     products%rowtype;
  v_unit        int;
  v_qty         int;
  v_mods        jsonb;
  v_mod_total   int;
  v_group       record;
  v_chosen      uuid[];
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido está vacío' using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) > 50 then
    raise exception 'Demasiadas líneas en un mismo pedido' using errcode = '22023';
  end if;

  select venue_id into v_venue_id
  from venue_tables
  where id = p_table_id and active;

  if v_venue_id is null then
    raise exception 'Mesa no disponible' using errcode = '22023';
  end if;

  -- Reutiliza la sesión abierta de la mesa, o abre una nueva.
  select id into v_session_id
  from table_sessions
  where table_id = p_table_id and closed_at is null;

  if v_session_id is null then
    insert into table_sessions (venue_id, table_id)
    values (v_venue_id, p_table_id)
    returning id into v_session_id;
  end if;

  select count(*) + 1 into v_round
  from orders where session_id = v_session_id;

  insert into orders (venue_id, table_id, session_id, round, customer_name, note)
  values (v_venue_id, p_table_id, v_session_id, v_round,
          nullif(trim(coalesce(p_customer_name, '')), ''),
          nullif(trim(coalesce(p_note, '')), ''))
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := coalesce((v_item ->> 'quantity')::int, 1);
    if v_qty < 1 or v_qty > 50 then
      raise exception 'Cantidad no válida' using errcode = '22023';
    end if;

    select * into v_product
    from products
    where id = (v_item ->> 'product_id')::uuid
      and venue_id = v_venue_id
      and available;

    if v_product.id is null then
      raise exception 'Producto no disponible' using errcode = '22023';
    end if;

    v_chosen := coalesce(
      (select array_agg(value::text::uuid)
       from jsonb_array_elements_text(coalesce(v_item -> 'modifier_ids', '[]'::jsonb)) as value),
      '{}'::uuid[]
    );

    -- Las opciones elegidas tienen que ser de este producto y estar activas,
    -- y respetar el mínimo/máximo de cada grupo.
    for v_group in
      select g.id, g.name, g.min_select, g.max_select,
             (select count(*) from modifiers m
              where m.group_id = g.id and m.id = any (v_chosen) and m.available) as chosen
      from modifier_groups g
      where g.product_id = v_product.id
    loop
      if v_group.chosen < v_group.min_select or v_group.chosen > v_group.max_select then
        raise exception 'Opciones no válidas en "%"', v_group.name using errcode = '22023';
      end if;
    end loop;

    select coalesce(sum(m.price_delta_cents), 0),
           coalesce(jsonb_agg(jsonb_build_object(
             'id', m.id, 'name', m.name, 'price_delta_cents', m.price_delta_cents
           ) order by m.position), '[]'::jsonb)
      into v_mod_total, v_mods
    from modifiers m
    join modifier_groups g on g.id = m.group_id
    where g.product_id = v_product.id and m.id = any (v_chosen) and m.available;

    v_unit := v_product.price_cents + v_mod_total;
    v_total := v_total + v_unit * v_qty;

    insert into order_items (
      order_id, product_id, product_name, unit_price_cents,
      quantity, modifiers, line_total_cents, note
    ) values (
      v_order_id, v_product.id, v_product.name, v_unit,
      v_qty, v_mods, v_unit * v_qty,
      nullif(trim(coalesce(v_item ->> 'note', '')), '')
    );
  end loop;

  update orders set total_cents = v_total where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'round', v_round,
    'total_cents', v_total
  );
end $$;

grant execute on function public.place_order(uuid, jsonb, text, text) to anon, authenticated;

-- Cerrar mesa (la usa la sala cuando el cliente se va).
create or replace function public.close_table_session(p_table_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update table_sessions
  set closed_at = now()
  where table_id = p_table_id
    and closed_at is null
    and is_staff(venue_id);
end $$;

grant execute on function public.close_table_session(uuid) to authenticated;

-- -------------------------------------------------------------------- RLS --

alter table venues          enable row level security;
alter table staff           enable row level security;
alter table venue_tables    enable row level security;
alter table categories      enable row level security;
alter table products        enable row level security;
alter table modifier_groups enable row level security;
alter table modifiers       enable row level security;
alter table table_sessions  enable row level security;
alter table orders          enable row level security;
alter table order_items     enable row level security;

-- La carta es pública: cualquiera con el QR puede leerla.
do $$
declare t text;
begin
  foreach t in array array['venues','venue_tables','categories','products','modifier_groups','modifiers']
  loop
    execute format('drop policy if exists %I on %I', t || '_public_read', t);
    execute format('create policy %I on %I for select to anon, authenticated using (true)',
                   t || '_public_read', t);
  end loop;
end $$;

-- Escritura del catálogo: sólo personal del local.
drop policy if exists venues_staff_write on venues;
create policy venues_staff_write on venues for all to authenticated
  using (is_staff(id)) with check (is_staff(id));

do $$
declare t text;
begin
  foreach t in array array['venue_tables','categories','products']
  loop
    execute format('drop policy if exists %I on %I', t || '_staff_write', t);
    execute format($f$create policy %I on %I for all to authenticated
                     using (is_staff(venue_id)) with check (is_staff(venue_id))$f$,
                   t || '_staff_write', t);
  end loop;
end $$;

drop policy if exists staff_read_self on staff;
create policy staff_read_self on staff for select to authenticated
  using (user_id = auth.uid());

-- Pedidos: el cliente los ve (para seguir su estado) pero no los toca.
-- Ver nota sobre este permiso en el README ("Qué endurecer antes de producción").
drop policy if exists orders_public_read on orders;
create policy orders_public_read on orders for select to anon, authenticated
  using (created_at > now() - interval '12 hours');

drop policy if exists order_items_public_read on order_items;
create policy order_items_public_read on order_items for select to anon, authenticated
  using (true);

drop policy if exists table_sessions_public_read on table_sessions;
create policy table_sessions_public_read on table_sessions for select to anon, authenticated
  using (true);

drop policy if exists orders_staff_write on orders;
create policy orders_staff_write on orders for update to authenticated
  using (is_staff(venue_id)) with check (is_staff(venue_id));

drop policy if exists order_items_staff_write on order_items;
create policy order_items_staff_write on order_items for all to authenticated
  using (exists (select 1 from orders o where o.id = order_id and is_staff(o.venue_id)))
  with check (exists (select 1 from orders o where o.id = order_id and is_staff(o.venue_id)));

drop policy if exists table_sessions_staff_write on table_sessions;
create policy table_sessions_staff_write on table_sessions for all to authenticated
  using (is_staff(venue_id)) with check (is_staff(venue_id));

-- ----------------------------------------------------------------- grants --

-- Supabase suele conceder esto por defecto, pero dejarlo explícito hace que la
-- migración se pueda ejecutar en cualquier proyecto sin sorpresas. Quien manda
-- de verdad sigue siendo la RLS de arriba.
grant usage on schema public to anon, authenticated;

grant select on
  venues, venue_tables, categories, products, modifier_groups, modifiers,
  table_sessions, orders, order_items
to anon, authenticated;

grant select on staff to authenticated;

grant insert, update, delete on
  venues, venue_tables, categories, products, modifier_groups, modifiers,
  table_sessions, orders, order_items
to authenticated;

-- Nadie inserta pedidos a mano desde el móvil: se pasa por place_order().
revoke insert, update, delete on orders, order_items from anon;

-- --------------------------------------------------------------- realtime --

alter table orders replica identity full;

do $$ begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table order_items;
exception when duplicate_object then null;
end $$;
