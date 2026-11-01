-- Tarjeta de fidelidad de La Oficina del Barbero.
--
-- Todo vive en el esquema `fidelidad`, que Supabase NO expone en su API pública
-- (solo expone `public`). Solo el servidor de la app entra, con DATABASE_URL.

create extension if not exists pgcrypto;

create schema if not exists fidelidad;

create table fidelidad.clientes (
  id                uuid primary key default gen_random_uuid(),
  nombre            text not null check (length(btrim(nombre)) between 1 and 60),
  -- Solo dígitos, con prefijo de país (34600111222).
  telefono          text not null unique check (telefono ~ '^[0-9]{9,15}$'),
  sellos            int  not null default 0 check (sellos between 0 and 10),
  premios_canjeados int  not null default 0,
  -- Secreto que Apple Wallet manda en cada llamada para esta tarjeta.
  apple_token       text not null default encode(gen_random_bytes(24), 'hex'),
  ultimo_sello      timestamptz,
  creado            timestamptz not null default now(),
  actualizado       timestamptz not null default now()
);

-- Historial: sirve para saber cuántas veces viene cada cliente.
create table fidelidad.visitas (
  id         bigint generated always as identity primary key,
  cliente_id uuid not null references fidelidad.clientes on delete cascade,
  tipo       text not null check (tipo in ('sello', 'canje')),
  creado     timestamptz not null default now()
);
create index on fidelidad.visitas (cliente_id, creado);

-- iPhones que tienen la tarjeta en Apple Wallet (para avisarles de cambios).
create table fidelidad.apple_dispositivos (
  device_id  text not null,
  cliente_id uuid not null references fidelidad.clientes on delete cascade,
  push_token text not null,
  creado     timestamptz not null default now(),
  primary key (device_id, cliente_id)
);
create index on fidelidad.apple_dispositivos (cliente_id);

-- Añade un sello. Se niega si ya tiene los 10 (toca canjear) o si se selló hace
-- menos de 10 minutos (doble escaneo por error).
create function fidelidad.sellar(p_cliente uuid)
returns fidelidad.clientes language plpgsql as $$
declare c fidelidad.clientes;
begin
  select * into c from fidelidad.clientes where id = p_cliente for update;
  if not found then raise exception 'cliente_no_existe'; end if;
  if c.sellos >= 10 then raise exception 'premio_pendiente'; end if;
  if c.ultimo_sello > now() - interval '10 minutes' then
    raise exception 'sellado_hace_poco';
  end if;

  update fidelidad.clientes
     set sellos = sellos + 1, ultimo_sello = now(), actualizado = now()
   where id = p_cliente
  returning * into c;
  insert into fidelidad.visitas (cliente_id, tipo) values (p_cliente, 'sello');
  return c;
end $$;

-- Aplica el 50 % y la tarjeta vuelve a cero.
create function fidelidad.canjear(p_cliente uuid)
returns fidelidad.clientes language plpgsql as $$
declare c fidelidad.clientes;
begin
  select * into c from fidelidad.clientes where id = p_cliente for update;
  if not found then raise exception 'cliente_no_existe'; end if;
  if c.sellos < 10 then raise exception 'sin_premio'; end if;

  update fidelidad.clientes
     set sellos = 0, premios_canjeados = premios_canjeados + 1, actualizado = now()
   where id = p_cliente
  returning * into c;
  insert into fidelidad.visitas (cliente_id, tipo) values (p_cliente, 'canje');
  return c;
end $$;
