-- Sólo para probar contra un Postgres pelado (sin Supabase).
-- Crea lo mínimo que la plataforma da hecho: los roles, auth.uid() y la
-- publicación de realtime. En Supabase NO hay que ejecutar este fichero.
-- Es idempotente: los roles y la publicación son de todo el clúster.

create extension if not exists pgcrypto;

do $$ begin
  create role anon nologin;
exception when duplicate_object then null;
end $$;

do $$ begin
  create role authenticated nologin;
exception when duplicate_object then null;
end $$;

create schema if not exists auth;

create table if not exists auth.users (
  id    uuid primary key default gen_random_uuid(),
  email text
);

create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

do $$ begin
  create publication supabase_realtime;
exception when duplicate_object then null;
end $$;
