#!/usr/bin/env bash
#
# Comprueba la configuración antes de aplicarla. Ejecútalo después de cada
# cambio en un compose o en el Caddyfile.
#
#   ./scripts/validate.sh
#
# No arranca ni reinicia nada: solo valida.
#
set -uo pipefail
cd "$(dirname "$0")/.."

fallos=0
ok()    { echo "  ✓ $*"; }
fallo() { echo "  ✗ $*"; fallos=$((fallos + 1)); }

echo "══ Scripts de shell"
for f in scripts/*.sh compose/immich/pull.sh; do
  bash -n "$f" && ok "$f" || fallo "$f"
done

echo
echo "══ Ficheros de Docker Compose"
if [[ ! -f .env ]]; then
  fallo "no existe .env — cópialo de .env.example"
else
  for d in compose/*/; do
    nombre=$(basename "$d")
    [[ "$nombre" == "immich" && ! -f "$d/docker-compose.yml" ]] && {
      echo "  — immich: falta docker-compose.yml, ejecuta compose/immich/pull.sh"
      continue
    }
    salida=$(cd "$d" && docker compose config -q 2>&1)
    [[ -z "$salida" ]] && ok "$nombre" || fallo "$nombre: $salida"
  done
fi

echo
echo "══ Caddyfile"
# Se valida con la imagen construida (la que lleva el plugin de Cloudflare).
# Sin el plugin, la directiva 'dns cloudflare' daría un falso error.
if docker image inspect homelab/caddy-cloudflare:2 >/dev/null 2>&1; then
  salida=$(docker run --rm \
    -e DOMAIN -e ACME_EMAIL -e CLOUDFLARE_API_TOKEN \
    --env-file .env \
    -v "$PWD/compose/caddy/Caddyfile":/etc/caddy/Caddyfile:ro \
    homelab/caddy-cloudflare:2 \
    caddy validate --config /etc/caddy/Caddyfile 2>&1)
  if [[ $? -eq 0 ]]; then
    ok "sintaxis y módulos correctos"
  else
    fallo "$(echo "$salida" | tail -5)"
  fi
else
  echo "  — imagen homelab/caddy-cloudflare:2 no construida todavía"
  echo "    (cd compose/caddy && docker compose build)"
fi

echo
echo "══ Entorno de la máquina"
[[ -e /dev/dri/renderD128 ]] \
  && ok "Quick Sync disponible (/dev/dri/renderD128)" \
  || echo "  — sin /dev/dri: quita el bloque 'devices' de compose/jellyfin"

gid_render=$(getent group render 2>/dev/null | cut -d: -f3)
gid_config=$(grep -oP '^\s+- "\K[0-9]+' compose/jellyfin/compose.yaml | head -1)
if [[ -n "$gid_render" ]]; then
  [[ "$gid_render" == "$gid_config" ]] \
    && ok "el GID de 'render' ($gid_render) coincide con compose/jellyfin" \
    || fallo "el GID de 'render' es $gid_render pero compose/jellyfin dice $gid_config — el transcode fallará con Permission denied"
fi

docker network inspect proxy >/dev/null 2>&1 \
  && ok "la red 'proxy' existe" \
  || fallo "falta la red 'proxy': docker network create proxy"

libre=$(df --output=pcent /srv 2>/dev/null | tail -1 | tr -dc '0-9')
if [[ -n "$libre" ]]; then
  [[ "$libre" -lt 85 ]] \
    && ok "/srv al ${libre}% de uso" \
    || fallo "/srv al ${libre}%: haz sitio antes de que se llene"
fi

echo
[[ "$fallos" -eq 0 ]] && echo "══ Todo correcto." \
  || { echo "══ $fallos problema(s)."; exit 1; }
