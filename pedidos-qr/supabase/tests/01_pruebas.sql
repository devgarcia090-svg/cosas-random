-- Pruebas de la lógica de pedidos y de la RLS.
-- Requisito: base recién migrada y con el seed puesto (los totales esperados
-- se apoyan en los datos de demo).
--
--   psql "$DATABASE_URL" -f supabase/tests/01_pruebas.sql
--
-- Cada línea imprime el valor obtenido y, entre paréntesis, el esperado.

\pset tuples_only on
\set mesa '''00000000-0000-4000-8000-0000000000a4'''
\set bravas  '00000000-0000-4000-8000-000000000101'
\set burger  '00000000-0000-4000-8000-000000000121'
\set punto   '00000000-0000-4000-8000-000000000312'
\set cheddar '00000000-0000-4000-8000-000000000321'
\set bacon   '00000000-0000-4000-8000-000000000322'
\set panint  '00000000-0000-4000-8000-000000000302'

-- =========================================================== como cliente ==

set role anon;

-- Precio calculado en el servidor: 2 bravas (5,90) + hamburguesa 12,90
-- con cheddar (+1,00) y bacon (+1,20).
select 'T1  total_cents=' || (place_order(
  :mesa,
  format('[{"product_id":"%s","quantity":2},
           {"product_id":"%s","quantity":1,"modifier_ids":["%s","%s","%s"],"note":"sin pepinillo"}]',
         :'bravas', :'burger', :'punto', :'cheddar', :'bacon')::jsonb,
  'Dani', 'Bebidas primero')->>'total_cents') || '   (esperado 2690)';

-- Segunda comanda de la misma mesa: nueva ronda, misma sesión.
select 'T2  round=' || (place_order(
  :mesa, format('[{"product_id":"%s","quantity":1}]', :'bravas')::jsonb)->>'round')
  || '   (esperado 2)';

select 'T2b sesiones abiertas en la mesa=' || count(*) || '   (esperado 1)'
from table_sessions where table_id = :mesa and closed_at is null;

do $$ begin
  perform place_order('00000000-0000-4000-8000-0000000000a4',
    '[{"product_id":"00000000-0000-4000-8000-000000000121","quantity":1}]'::jsonb);
  raise notice 'T3  FALLO: aceptó una hamburguesa sin punto de la carne';
exception when others then raise notice 'T3  OK -> %', sqlerrm;
end $$;

do $$ begin
  perform place_order('00000000-0000-4000-8000-0000000000a4',
    ('[{"product_id":"00000000-0000-4000-8000-000000000121","quantity":1,"modifier_ids":'
     || '["00000000-0000-4000-8000-000000000312","00000000-0000-4000-8000-000000000321",'
     || '"00000000-0000-4000-8000-000000000322","00000000-0000-4000-8000-000000000323",'
     || '"00000000-0000-4000-8000-000000000324"]}]')::jsonb);
  raise notice 'T4  FALLO: aceptó 4 extras con el máximo en 3';
exception when others then raise notice 'T4  OK -> %', sqlerrm;
end $$;

-- Una opción de otro producto no se cobra: se ignora.
select 'T5  total_cents=' || (place_order(
  :mesa,
  format('[{"product_id":"%s","quantity":1,"modifier_ids":["%s","%s"]}]',
         :'burger', :'punto', :'panint')::jsonb)->>'total_cents')
  || '   (esperado 1290, sin el +0,30 del pan integral)';

do $$ begin
  perform place_order('00000000-0000-4000-8000-0000000000a4',
    '[{"product_id":"00000000-0000-4000-8000-000000000101","quantity":999}]'::jsonb);
  raise notice 'T6  FALLO: aceptó 999 unidades';
exception when others then raise notice 'T6  OK -> %', sqlerrm;
end $$;

reset role;
update products set available = false where id = '00000000-0000-4000-8000-000000000101';
set role anon;
do $$ begin
  perform place_order('00000000-0000-4000-8000-0000000000a4',
    '[{"product_id":"00000000-0000-4000-8000-000000000101","quantity":1}]'::jsonb);
  raise notice 'T7  FALLO: aceptó un producto agotado';
exception when others then raise notice 'T7  OK -> %', sqlerrm;
end $$;
reset role;
update products set available = true where id = '00000000-0000-4000-8000-000000000101';
set role anon;

do $$ begin
  perform place_order('00000000-0000-4000-8000-0000000000a4', '[]'::jsonb);
  raise notice 'T8  FALLO: aceptó un pedido vacío';
exception when others then raise notice 'T8  OK -> %', sqlerrm;
end $$;

do $$ begin
  perform place_order('00000000-0000-4000-8000-0000000000ff',
    '[{"product_id":"00000000-0000-4000-8000-000000000101","quantity":1}]'::jsonb);
  raise notice 'T9  FALLO: aceptó una mesa que no existe';
exception when others then raise notice 'T9  OK -> %', sqlerrm;
end $$;

do $$ begin
  insert into orders (venue_id, table_id, session_id, total_cents)
  values ('00000000-0000-4000-8000-0000000000fe','00000000-0000-4000-8000-0000000000a4',
          (select id from table_sessions limit 1), 1);
  raise notice 'T10 FALLO: el cliente ha podido insertar un pedido a mano';
exception when others then raise notice 'T10 OK -> %', sqlerrm;
end $$;

do $$ begin
  update orders set status = 'served';
  raise notice 'T11 FALLO: el cliente ha podido cambiar estados';
exception when others then raise notice 'T11 OK -> %', sqlerrm;
end $$;

select 'T12 pedidos con total descuadrado=' || count(*) || '   (esperado 0)'
from orders o
where o.total_cents <> (
  select coalesce(sum(i.line_total_cents), 0) from order_items i where i.order_id = o.id
);

-- ======================================================== como el personal ==

reset role;

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000e001', 'camarero@barlumen.test'),
  ('00000000-0000-4000-8000-00000000e002', 'camarero@otrolocal.test')
on conflict do nothing;

insert into venues (id, name, slug) values
  ('00000000-0000-4000-8000-0000000000ef', 'Otro local', 'otro-local')
on conflict do nothing;

insert into staff (user_id, venue_id, role) values
  ('00000000-0000-4000-8000-00000000e001', '00000000-0000-4000-8000-0000000000fe', 'manager'),
  ('00000000-0000-4000-8000-00000000e002', '00000000-0000-4000-8000-0000000000ef', 'staff')
on conflict do nothing;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000e001', false) as _;

select 'S1  comandas que ve el camarero=' || count(*) || '   (esperado 3)' from orders;

with cambio as (
  update orders set status = 'preparing'
  where id = (select id from orders order by created_at limit 1)
  returning 1
)
select 'S2  comandas actualizadas=' || count(*) || '   (esperado 1)' from cambio;

with editados as (update products set available = available returning 1)
select 'S3  productos que puede editar=' || count(*) || '   (esperado 19)' from editados;

-- Ahora el camarero del OTRO local: no debería poder tocar nada de aquí.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000e002', false) as _;

with intento as (update orders set status = 'cancelled' returning 1)
select 'S4  comandas ajenas modificadas=' || count(*) || '   (esperado 0)' from intento;

with intento as (update products set available = false returning 1)
select 'S5  productos ajenos modificados=' || count(*) || '   (esperado 0)' from intento;

select 'S6  filas de staff visibles=' || count(*) || '   (esperado 1: sólo la suya)' from staff;

-- Cerrar la mesa y volver a pedir: sesión nueva, ronda 1.
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-00000000e001', false) as _;
select close_table_session('00000000-0000-4000-8000-0000000000a4') as _;

select 'S7  sesiones abiertas tras cerrar=' || count(*) || '   (esperado 0)'
from table_sessions where closed_at is null;

set role anon;
select 'S8  ronda del pedido siguiente=' || (place_order(
  '00000000-0000-4000-8000-0000000000a4',
  '[{"product_id":"00000000-0000-4000-8000-000000000141","quantity":2}]'::jsonb)->>'round')
  || '   (esperado 1)';

reset role;
