#!/usr/bin/env bash
#
# Despliega la web de AquaLadra en Cloudflare.
#
#   ./desplegar.sh                 vista previa (URL *.workers.dev, sin indexar)
#   ./desplegar.sh --produccion    para cuando ya tenga el dominio aqualadra.com
#   ./desplegar.sh --solo-preparar deja el paquete listo pero no despliega
#
# Hace falta estar autenticado, de una de estas dos formas:
#   wrangler login                        (abre el navegador)
#   export CLOUDFLARE_API_TOKEN="..."     (token con permiso Workers Scripts: Edit)
#
# Por qué copia a otra carpeta en vez de desplegar la carpeta directamente:
# todo lo que esté en el directorio de assets se publica, y aquí hay cosas que
# no deben publicarse (las pruebas y el README). Además, en la vista previa se
# añade un noindex que en producción no queremos.

set -euo pipefail

SITIO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODO="${1:-}"
DESTINO="$(mktemp -d)"
trap 'rm -rf "$DESTINO"' EXIT

echo "Preparando el paquete en $DESTINO"
cp -r "$SITIO" "$DESTINO/public"
rm -rf "$DESTINO/public/pruebas" "$DESTINO/public/README.md" "$DESTINO/public/desplegar.sh"

if [[ "$MODO" != "--produccion" ]]; then
  echo "Modo vista previa: se marca como noindex para que Google no la indexe."
  python3 - "$DESTINO/public" <<'PY'
import pathlib, sys
d = pathlib.Path(sys.argv[1])
p = d / "index.html"
s = p.read_text(encoding="utf-8")
m = '<meta name="theme-color" content="#2496B2">'
if "noindex" not in s:
    s = s.replace(m, m + '\n<meta name="robots" content="noindex, nofollow">')
    p.write_text(s, encoding="utf-8")
(d / "robots.txt").write_text("# Vista previa provisional: no indexar.\nUser-agent: *\nDisallow: /\n", encoding="utf-8")
PY
else
  echo "Modo producción: indexable."
fi

cat > "$DESTINO/wrangler.jsonc" <<'EOF'
{
  "name": "aqualadra",
  "compatibility_date": "2026-08-01",
  "assets": {
    "directory": "./public",
    "not_found_handling": "404-page"
  }
}
EOF

echo "$(find "$DESTINO/public" -type f | wc -l) ficheros listos."

if [[ "$MODO" == "--solo-preparar" ]]; then
  COPIA="${TMPDIR:-/tmp}/aqualadra-paquete"
  rm -rf "$COPIA" && cp -r "$DESTINO" "$COPIA"
  echo "Paquete dejado en $COPIA (no se ha desplegado)."
  exit 0
fi

cd "$DESTINO"
npx --yes wrangler@latest deploy
