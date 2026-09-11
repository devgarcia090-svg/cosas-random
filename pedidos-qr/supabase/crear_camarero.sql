-- Da de alta un camarero y lo enlaza con el local.
--
--   psql "$DATABASE_URL" \
--     -v email="'camarero@bar.test'" -v password="'una-contraseña'" \
--     -v venue="'00000000-0000-4000-8000-0000000000fe'" \
--     -f supabase/crear_camarero.sql
--
-- Alternativa por interfaz: crear el usuario en Authentication > Users y luego
-- insertarlo a mano en la tabla `staff`. Esto hace las dos cosas de una vez.

\set ON_ERROR_STOP on

do $$
declare
  v_email    text := :email;
  v_password text := :password;
  v_venue    uuid := :venue;
  v_user_id  uuid;
begin
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    -- Los campos de token van a cadena vacía, no a NULL: GoTrue los lee como
    -- texto y con NULL responde "Database error querying schema" al hacer login.
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token,
      reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id,
      'authenticated', 'authenticated', v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      '', '', '', '', '', '', '', ''
    );

    -- Sin esta fila, GoTrue no reconoce el login por contraseña.
    insert into auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', v_email),
      'email', v_email, now(), now(), now()
    );

    raise notice 'Usuario creado: %', v_email;
  else
    raise notice 'El usuario ya existía: %', v_email;
  end if;

  insert into staff (user_id, venue_id, role)
  values (v_user_id, v_venue, 'manager')
  on conflict (user_id, venue_id) do nothing;

  raise notice 'Alta en el local % hecha', v_venue;
end $$;
