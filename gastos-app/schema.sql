-- Esquema de la base de datos (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS gastos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  importe     REAL    NOT NULL,
  comercio    TEXT,
  descripcion TEXT,
  categoria   TEXT    NOT NULL DEFAULT 'sin-categoria',
  metodo      TEXT,                                  -- movil, tarjeta, efectivo, bizum...
  hormiga     INTEGER NOT NULL DEFAULT 0,            -- 0/1
  revisado    INTEGER NOT NULL DEFAULT 0,            -- 0/1 (los del atajo entran sin revisar)
  nota        TEXT,
  ts          INTEGER NOT NULL,                      -- epoch ms del gasto
  fecha       TEXT    NOT NULL,                      -- YYYY-MM-DD en zona local
  origen      TEXT    NOT NULL DEFAULT 'web',        -- atajo, web
  creado      INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha     ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_ts        ON gastos(ts DESC);

CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT OR IGNORE INTO config (clave, valor) VALUES ('umbral_hormiga', '10');
