-- Ordenar las opciones de cada línea por grupo y luego por posición.
--
-- Antes se ordenaban sólo por la posición del modificador, así que en la
-- comanda salía "Queso cheddar · Al punto · Bacon": el punto de la carne
-- aparecía entre los extras en vez de delante. Se ve en cocina de un vistazo
-- y confunde. El orden queda congelado en la línea al crear el pedido, así
-- que se arregla aquí, no al pintarlo.

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
           ) order by g.position, m.position), '[]'::jsonb)
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
