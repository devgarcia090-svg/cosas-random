#!/usr/bin/env bash
#
# Backup cifrado a Backblaze B2 con restic.
#
#   sudo ./scripts/backup.sh
#
# Qué hace y por qué en este orden:
#   1. Volcar las bases de datos a fichero. Copiar los ficheros de Postgres
#      "en vivo" produce un backup que a veces restaura y a veces no. Un volcado
#      es un fichero consistente, punto.
#   2. Copiar /srv/data (configs y bases de datos) y /srv/media/immich (fotos).
#   3. Olvidar snapshots viejos según la política de retención y liberar espacio.
#   4. Verificar la integridad de una parte del repositorio.
#
# Lo que NO se copia: /srv/media/jellyfin (recuperable desde los discos
# originales) y las cachés (regenerables). Ahorra la mayor parte de la factura.
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DUMPS="/srv/data/backups"

set -a
# shellcheck source=/dev/null
source "$REPO_DIR/.env"
set +a

: "${RESTIC_REPOSITORY:?falta RESTIC_REPOSITORY en .env}"
: "${RESTIC_PASSWORD:?falta RESTIC_PASSWORD en .env}"

log() { echo "[$(date '+%F %T')] $*"; }

# ── 1. Volcado de bases de datos ─────────────────────────────────────────────
mkdir -p "$DUMPS"
chmod 700 "$DUMPS"

if docker ps --format '{{.Names}}' | grep -q '^immich_postgres$'; then
  log "Volcando Postgres de Immich"
  docker exec immich_postgres pg_dumpall --clean --if-exists -U postgres \
    | gzip -c > "$DUMPS/immich-postgres.sql.gz.tmp"
  mv "$DUMPS/immich-postgres.sql.gz.tmp" "$DUMPS/immich-postgres.sql.gz"
else
  log "AVISO: el contenedor immich_postgres no está corriendo; no hay volcado"
fi

# Vaultwarden y Paperless usan SQLite. Copiarlo con 'cp' mientras se escribe
# puede dar un fichero corrupto; '.backup' de sqlite3 es atómico y seguro.
if [[ -f /srv/data/vaultwarden/db.sqlite3 ]]; then
  log "Volcando SQLite de Vaultwarden"
  docker run --rm -v /srv/data/vaultwarden:/db:ro -v "$DUMPS":/out \
    alpine:3 sh -c \
    'apk add --no-cache sqlite >/dev/null && \
     sqlite3 /db/db.sqlite3 ".backup /out/vaultwarden.sqlite3"'
fi

# ── 2. Copia ─────────────────────────────────────────────────────────────────
# Inicializa el repositorio la primera vez.
restic cat config >/dev/null 2>&1 || { log "Inicializando repositorio restic"; restic init; }

hacer_backup() {
  local repo="$1" etiqueta="$2"
  log "Backup → $etiqueta"
  RESTIC_REPOSITORY="$repo" restic backup \
    --verbose \
    --tag homelab \
    --exclude-caches \
    --exclude '/srv/data/jellyfin/cache' \
    --exclude '/srv/data/paperless/redis' \
    --exclude '**/*.tmp' \
    /srv/data \
    /srv/media/immich \
    "$REPO_DIR"
}

hacer_backup "$RESTIC_REPOSITORY" "remoto (B2)"

# Tercera copia del 3-2-1, si hay un disco local configurado.
if [[ -n "${RESTIC_REPOSITORY_LOCAL:-}" ]] && [[ -d "$(dirname "$RESTIC_REPOSITORY_LOCAL")" ]]; then
  RESTIC_REPOSITORY="$RESTIC_REPOSITORY_LOCAL" restic cat config >/dev/null 2>&1 \
    || RESTIC_REPOSITORY="$RESTIC_REPOSITORY_LOCAL" restic init
  hacer_backup "$RESTIC_REPOSITORY_LOCAL" "local"
fi

# ── 3. Retención ─────────────────────────────────────────────────────────────
log "Aplicando retención y liberando espacio"
restic forget \
  --tag homelab \
  --keep-daily "${RESTIC_KEEP_DAILY:-7}" \
  --keep-weekly "${RESTIC_KEEP_WEEKLY:-4}" \
  --keep-monthly "${RESTIC_KEEP_MONTHLY:-12}" \
  --prune

# ── 4. Verificación ──────────────────────────────────────────────────────────
# Comprueba los metadatos siempre y un 2% de los datos reales en cada ejecución.
# En unas semanas habrá verificado el repositorio completo sin descargarlo entero
# de golpe (lo que en B2 costaría dinero).
log "Verificando integridad"
restic check --read-data-subset=2%

log "Terminado. Snapshots:"
restic snapshots --tag homelab --latest 3
