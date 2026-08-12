#!/usr/bin/env bash
#
# Prepara un Debian 12/13 recién instalado para el homelab.
# Idempotente: se puede volver a ejecutar sin romper nada.
#
#   sudo ./scripts/bootstrap-debian.sh
#
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Ejecútalo con sudo." >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
USUARIO="${SUDO_USER:-$(logname)}"

echo "══ 1/6  Paquetes base"
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg git \
  restic \
  unattended-upgrades \
  htop ncdu tmux \
  smartmontools

echo "══ 2/6  Docker desde el repositorio oficial"
# El docker.io de Debian va varias versiones por detrás y le falta el plugin
# compose v2, que es el que entiende 'compose.yaml' y '!override'.
if ! command -v docker >/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  cat >/etc/apt/sources.list.d/docker.list <<EOF
deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
https://download.docker.com/linux/debian $(. /etc/os-release && echo "$VERSION_CODENAME") stable
EOF
  apt-get update
  apt-get install -y docker-ce docker-ce-cli containerd.io \
    docker-buildx-plugin docker-compose-plugin
fi

# Poder usar docker sin sudo. Requiere cerrar y reabrir la sesión.
usermod -aG docker "$USUARIO"

echo "══ 3/6  Límite de logs de Docker"
# Sin esto, un contenedor que loguee mucho llena el disco y tumba la máquina
# entera. Es el fallo más común de un homelab de primer año.
mkdir -p /etc/docker
if [[ ! -f /etc/docker/daemon.json ]]; then
  cat >/etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "live-restore": true
}
EOF
  systemctl restart docker || true
fi

echo "══ 4/6  Árbol de directorios en /srv"
mkdir -p \
  /srv/data/{caddy/{data,config},adguard/{work,conf},immich/postgres,homeassistant} \
  /srv/data/{vaultwarden,jellyfin/{config,cache},paperless/{data,media,consume}} \
  /srv/data/backups \
  /srv/media/{immich,jellyfin}
chown -R "$USUARIO":"$USUARIO" /srv/media
# Los datos de aplicación los gestionan los contenedores con sus propios UID.
chmod 750 /srv/data

echo "══ 5/6  Red de Docker y enlaces al .env"
docker network inspect proxy >/dev/null 2>&1 || docker network create proxy

# Docker Compose solo lee el .env del directorio donde está el compose. En lugar
# de repetir el fichero (y sus secretos) siete veces, cada carpeta de servicio
# apunta con un enlace simbólico al .env único de la raíz.
for dir in "$REPO_DIR"/compose/*/; do
  ln -sfn ../../.env "${dir}.env"
done
echo "  enlaces .env creados en $(find "$REPO_DIR/compose" -maxdepth 2 -name .env | wc -l) servicios"

echo "══ 6/6  Actualizaciones de seguridad desatendidas"
# Solo parches de seguridad del SISTEMA. Los contenedores se actualizan a mano:
# una migración de esquema desatendida a las 3 de la mañana no es lo que quieres.
cat >/etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF
systemctl enable --now unattended-upgrades

cat <<EOF

══ Hecho.

Pendiente, en este orden:

  1. Cierra la sesión y vuelve a entrar (para que 'docker' funcione sin sudo).
  2. Instala Tailscale:
       curl -fsSL https://tailscale.com/install.sh | sh
       sudo tailscale up --advertise-routes=192.168.1.0/24 --accept-routes
  3. Copia tu clave SSH desde el portátil y desactiva el login por contraseña.
  4. cp .env.example .env && chmod 600 .env && \$EDITOR .env
  5. cd compose/caddy && docker compose up -d --build

Comprueba antes de seguir:
  - ¿Tiene Quick Sync?     ls -l /dev/dri
  - GID del grupo render:  getent group render
  - Discos y espacio:      lsblk && df -h
  - Salud del disco:       sudo smartctl -a /dev/nvme0n1 | head -30
EOF
