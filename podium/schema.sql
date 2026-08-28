-- Base de datos de reservas de Podium Café & Grill (Cloudflare D1)
-- Se aplica con:  npx wrangler d1 execute podium-reservas --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS reservas (
  id        TEXT PRIMARY KEY,
  fecha     TEXT NOT NULL,                      -- YYYY-MM-DD
  hora      TEXT NOT NULL,                      -- HH:MM
  personas  INTEGER NOT NULL,
  nombre    TEXT NOT NULL,
  telefono  TEXT NOT NULL,
  email     TEXT,
  notas     TEXT,
  estado    TEXT NOT NULL DEFAULT 'pendiente',  -- pendiente | confirmada | cancelada
  codigo    TEXT NOT NULL,                      -- código corto que se le da al cliente
  creada_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reservas_fecha ON reservas (fecha, hora);

-- Días cerrados de forma puntual: vacaciones, festivos o eventos privados.
CREATE TABLE IF NOT EXISTS cierres (
  fecha  TEXT PRIMARY KEY,
  motivo TEXT
);

CREATE TABLE IF NOT EXISTS ajustes (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT INTO ajustes (clave, valor) VALUES ('plazas_por_turno', '30')
  ON CONFLICT(clave) DO NOTHING;
