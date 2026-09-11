-- Distinguir "no lleva X" de "no lo sabemos".
--
-- En una carta real hay tres situaciones, y confundirlas es un problema de
-- verdad para quien tiene una alergia:
--
--   1. El plato declara los alérgenos que CONTIENE      -> allergens
--   2. El local declara que NO lleva ciertos alérgenos  -> allergens_free
--   3. La carta original no declara nada                -> ambas vacías
--
-- El caso 3 se muestra como "consulta al personal", nunca como libre de
-- alérgenos. Por eso hace falta la segunda columna: sin ella, un plato sin
-- declarar y un plato sin alérgenos se verían igual.

alter table products
  add column if not exists allergens_free text[] not null default '{}';

comment on column products.allergens is
  'Alérgenos que el plato contiene, según la carta del local.';
comment on column products.allergens_free is
  'Alérgenos que el local declara expresamente ausentes. Vacío junto con allergens significa "sin declarar", no "sin alérgenos".';
