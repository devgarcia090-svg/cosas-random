-- Pruebas de la lógica de sellos. Contra una base recién migrada:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/01_pruebas.sql
-- Todo va en una transacción que se deshace al final: no deja rastro.
begin;

do $$
declare
  v_id uuid;
  c fidelidad.clientes;
  fallo text;
begin
  insert into fidelidad.clientes (nombre, telefono) values ('Prueba', '34600000000')
  returning clientes.id into v_id;

  -- 1. Un sello suma uno y deja visita.
  c := fidelidad.sellar(v_id);
  assert c.sellos = 1, 'el primer sello deja 1';
  assert (select count(*) from fidelidad.visitas where cliente_id = v_id) = 1;

  -- 2. Doble escaneo seguido: rechazado.
  begin
    perform fidelidad.sellar(v_id);
    raise exception 'no debía dejar sellar dos veces seguidas';
  exception when others then
    assert sqlerrm = 'sellado_hace_poco', 'error inesperado: ' || sqlerrm;
  end;

  -- 3. Sin 10 sellos no se canjea.
  begin
    perform fidelidad.canjear(v_id);
    raise exception 'no debía dejar canjear con 1 sello';
  exception when others then
    assert sqlerrm = 'sin_premio', 'error inesperado: ' || sqlerrm;
  end;

  -- 4. Hasta 10 (simulando visitas en días distintos).
  for i in 2..10 loop
    update fidelidad.clientes set ultimo_sello = now() - interval '1 day' where clientes.id = v_id;
    c := fidelidad.sellar(v_id);
  end loop;
  assert c.sellos = 10, 'tras 10 visitas hay 10 sellos';

  -- 5. Con la tarjeta llena no se sella más.
  update fidelidad.clientes set ultimo_sello = now() - interval '1 day' where clientes.id = v_id;
  begin
    perform fidelidad.sellar(v_id);
    raise exception 'no debía pasar de 10';
  exception when others then
    assert sqlerrm = 'premio_pendiente', 'error inesperado: ' || sqlerrm;
  end;

  -- 6. Canjear vuelve a 0 y cuenta el premio.
  c := fidelidad.canjear(v_id);
  assert c.sellos = 0 and c.premios_canjeados = 1, 'canjear deja 0 sellos y 1 premio';

  -- 7. Teléfono repetido: rechazado.
  begin
    insert into fidelidad.clientes (nombre, telefono) values ('Otro', '34600000000');
    raise exception 'no debía aceptar teléfono repetido';
  exception when unique_violation then null;
  end;

  raise notice 'OK: todas las pruebas pasan';
end $$;

rollback;
