-- Pedidos QR — esquema base
-- Ejecutar en el SQL Editor de Supabase (o con `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- catálogo --

create table if not exists venues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  currency    text not null default 'EUR',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Un empleado puede estar en varios locales.
create table if not exists staff (
  user_id   uuid not null references auth.users (id) on delete cascade,
  venue_id  uuid not null references venues (id) on delete cascade,
  role      text not null default 'staff' check (role in ('staff', 'manager')),
  primary key (user_id, venue_id)
);

create table if not exists venue_tables (
  id        uuid primary key default gen_random_uuid(),
  venue_id  uuid not null references venues (id) on delete cascade,
  name      text not null,
  zone      text,
  active    boolean not null default true,
  unique (venue_id, name)
);

create table if not exists categories (
  id        uuid primary key default gen_random_uuid(),
  venue_id  uuid not null references venues (id) on delete cascade,
  name      text not null,
  position  int not null default 0,
  active    boolean not null default true
);

create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  venue_id     uuid not null references venues (id) on delete cascade,
  category_id  uuid not null references categories (id) on delete cascade,
  name         text not null,
  description  text,
  price_cents  int not null check (price_cents >= 0),
  allergens    text[] not null default '{}',
  available    boolean not null default true,
  position     int not null default 0
);

-- Grupos de opciones: "Punto de la carne", "Extras"...
create table if not exists modifier_groups (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references products (id) on delete cascade,
  name        text not null,
  min_select  int not null default 0 check (min_select >= 0),
  max_select  int not null default 1 check (max_select >= 1),
  position    int not null default 0,
  check (max_select >= min_select)
);

create table if not exists modifiers (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid not null references modifier_groups (id) on delete cascade,
  name              text not null,
  price_delta_cents int not null default 0,
  available         boolean not null default true,
  position          int not null default 0
);

-- ----------------------------------------------------------------- pedidos --

do $$ begin
  create type order_status as enum ('pending', 'accepted', 'preparing', 'served', 'cancelled');
exception when duplicate_object then null;
end $$;

-- Una sesión = una mesa ocupada. Agrupa todas las rondas hasta que se cierra.
create table if not exists table_sessions (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references venues (id) on delete cascade,
  table_id   uuid not null references venue_tables (id) on delete cascade,
  opened_at  timestamptz not null default now(),
  closed_at  timestamptz
);

create unique index if not exists table_sessions_one_open
  on table_sessions (table_id) where closed_at is null;

create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid not null references venues (id) on delete cascade,
  table_id       uuid not null references venue_tables (id) on delete cascade,
  session_id     uuid not null references table_sessions (id) on delete cascade,
  round          int not null default 1,
  status         order_status not null default 'pending',
  customer_name  text,
  note           text,
  total_cents    int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists orders_venue_status_idx on orders (venue_id, status, created_at);
create index if not exists orders_session_idx on orders (session_id, created_at);

-- El nombre y el precio se congelan en la línea: si mañana sube la carta,
-- el ticket de ayer no cambia.
create table if not exists order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references orders (id) on delete cascade,
  product_id        uuid references products (id) on delete set null,
  product_name      text not null,
  unit_price_cents  int not null check (unit_price_cents >= 0),
  quantity          int not null check (quantity between 1 and 50),
  modifiers         jsonb not null default '[]'::jsonb,
  line_total_cents  int not null check (line_total_cents >= 0),
  note              text
);

create index if not exists order_items_order_idx on order_items (order_id);

create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists orders_touch_updated_at on orders;
create trigger orders_touch_updated_at
  before update on orders
  for each row execute function touch_updated_at();
