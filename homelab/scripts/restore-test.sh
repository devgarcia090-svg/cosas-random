#!/usr/bin/env bash
#
# Prueba de restauración. Ejecútalo cada tres meses.
#
#   sudo ./scripts/restore-test.sh
#
# Un backup que nunca se ha restaurado no es un backup: es una carpeta de
# ficheros que esperas que sirvan. Esto lo comprueba de verdad:
#   - Restaura el último snapshot en un directorio temporal.
#   - Verifica que el volcado de Postgres se descomprime y tiene contenido SQL.
#   - Verifica que la base de datos de Vaultwarden es un SQLite legible.
#   - Borra lo restaurado.
#
# No toca nada de producción. Es seguro ejecutarlo con los servicios corriendo.
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DESTINO="$(mktemp -d /tmp/restore-test.XXXXXX)"
trap 'rm -rf "$DESTINO"' EXIT

set -a
# shellcheck source=/dev/null
source "$REPO_DIR/.env"
set +a

: "${RESTIC_REPOSITORY:?falta RESTIC_REPOSITORY en .env}"

fallos=0
ok()    { echo "  ✓ $*"; }
fallo() { echo "  ✗ $*"; fallos=$((fallos + 1)); }

echo "══ Último snapshot"
restic snapshots --tag homelab --latest 1

echo
echo "══ Restaurando volcados en $DESTINO"
restic restore latest --target "$DESTINO" --include /srv/data/backups

echo
echo "══ Comprobaciones"

dump="$DESTINO/srv/data/backups/immich-postgres.sql.gz"
if [[ -f "$dump" ]]; then
  if gzip -t "$dump" 2>/dev/null; then
    ok "el volcado de Postgres se descomprime sin errores"
    lineas=$(zcat "$dump" | grep -c 'CREATE TABLE' || true)
    if [[ "$lineas" -gt 0 ]]; then
      ok "contiene $lineas sentencias CREATE TABLE"
    else
      fallo "no contiene ninguna CREATE TABLE: el volcado está vacío"
    fi
  else
    fallo "el gzip del volcado de Postgres está corrupto"
  fi
else
  fallo "no hay volcado de Postgres en el snapshot"
fi

vw="$DESTINO/srv/data/backups/vaultwarden.sqlite3"
if [[ -f "$vw" ]]; then
  if docker run --rm -v "$DESTINO/srv/data/backups":/b:ro alpine:3 sh -c \
      'apk add --no-cache sqlite >/dev/null && \
       sqlite3 /b/vaultwarden.sqlite3 "PRAGMA integrity_check;"' | grep -q '^ok$'; then
    ok "la base de datos de Vaultwarden pasa integrity_check"
  else
    fallo "la base de datos de Vaultwarden no pasa integrity_check"
  fi
else
  echo "  — no hay backup de Vaultwarden (normal si aún no lo has montado)"
fi

echo
echo "══ Antigüedad del último snapshot"
ultimo=$(restic snapshots --tag homelab --latest 1 --json | grep -o '"time":"[^"]*"' | head -1 | cut -d'"' -f4)
if [[ -n "$ultimo" ]]; then
  edad_h=$(( ($(date +%s) - $(date -d "$ultimo" +%s)) / 3600 ))
  if [[ "$edad_h" -lt 48 ]]; then
    ok "tiene $edad_h horas"
  else
    fallo "tiene $edad_h horas: el timer no está funcionando"
  fi
fi

echo
if [[ "$fallos" -eq 0 ]]; then
  echo "══ Todo correcto. Los backups sirven."
else
  echo "══ $fallos comprobación(es) fallida(s). ARRÉGLALO ANTES DE NECESITARLO."
  exit 1
fi
