#!/usr/bin/env bash
#
# Descarga (mirror) una web ESTATICA publicada tal como la sirve el navegador.
# Ideal para recuperar la web de Maya si el codigo fuente se perdio pero el
# sitio sigue online en Cloudflare.
#
# Uso:
#     ./mirror-maya-site.sh https://TU-URL-DE-LA-WEB
#
# Los ficheros se guardan en ./sitio-recuperado/
#
# Que hace: baja HTML, CSS, JS e imagenes, reescribe los enlaces para que
# funcione en local, y sigue los enlaces internos del propio dominio.

set -euo pipefail

URL="${1:-}"
OUT="${OUT_DIR:-sitio-recuperado}"

if [[ -z "$URL" ]]; then
  echo "Uso: $0 https://TU-URL-DE-LA-WEB" >&2
  echo "     (la URL sale al pulsar 'Visit' en el dashboard del Worker)" >&2
  exit 1
fi

mkdir -p "$OUT"

wget \
  --recursive \
  --level=inf \
  --page-requisites \
  --convert-links \
  --adjust-extension \
  --no-parent \
  --no-host-directories \
  --restrict-file-names=windows \
  --directory-prefix="$OUT" \
  --user-agent="Mozilla/5.0 (recuperacion sitio propio)" \
  --execute robots=off \
  "$URL"

echo ""
echo "Listo. Sitio recuperado en la carpeta '$OUT/'."
echo "Abre el index.html con doble clic para comprobarlo."
