#!/usr/bin/env bash
# Descarga el docker-compose.yml oficial de Immich para la versión fijada en
# .env (IMMICH_VERSION).
#
# ¿Por qué no tener el compose de Immich escrito a mano en este repo? Porque
# cambia entre versiones de formas que no son solo la etiqueta de la imagen: han
# migrado de extensión vectorial de Postgres más de una vez, han renombrado
# servicios y han cambiado variables. Un compose copiado a mano se queda obsoleto
# en silencio y rompe una actualización meses después.
#
# Lo nuestro (rutas, red, puertos) vive en compose.override.yaml, que Docker
# Compose fusiona automáticamente encima del oficial.
set -euo pipefail
cd "$(dirname "$0")"

source ../../.env

: "${IMMICH_VERSION:?falta IMMICH_VERSION en .env}"

URL="https://github.com/immich-app/immich/releases/download/${IMMICH_VERSION}/docker-compose.yml"

echo "→ Descargando compose oficial de Immich ${IMMICH_VERSION}"
if [[ -f docker-compose.yml ]]; then
  cp docker-compose.yml "docker-compose.yml.anterior"
  echo "  (el anterior queda en docker-compose.yml.anterior para comparar)"
fi

curl -fsSL "$URL" -o docker-compose.yml

echo "→ Listo."
if [[ -f docker-compose.yml.anterior ]]; then
  echo
  echo "Diferencias respecto a la versión anterior — MÍRALAS antes de actualizar:"
  diff -u docker-compose.yml.anterior docker-compose.yml || true
fi
echo
echo "Siguiente paso: docker compose up -d"
