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

# Dirección de la vista previa. Se puede cambiar con:
#   URL_VISTA_PREVIA=https://otra.workers.dev ./desplegar.sh
URL_VISTA_PREVIA="${URL_VISTA_PREVIA:-https://aqualadra.fate-forgery.workers.dev}"

if [[ "$MODO" != "--produccion" ]]; then
  echo "Modo vista previa: noindex y URLs apuntando a $URL_VISTA_PREVIA"
  python3 - "$DESTINO/public" "$URL_VISTA_PREVIA" <<'REESCRIBIR'
import pathlib, sys
d, previa = pathlib.Path(sys.argv[1]), sys.argv[2].rstrip("/")

for f in sorted(d.glob("*.html")):
    s = f.read_text(encoding="utf-8")
    # Solo se reescribe la cabecera. Las URLs absolutas de canonical y og:*
    # apuntan al dominio de produccion, y en una vista previa eso es un
    # problema de verdad: WhatsApp e Instagram usan og:url como destino real
    # del enlace, asi que al tocarlo te llevaban a la web VIEJA en vez de a
    # esta. Y og:image se buscaba en un dominio donde no existe, con lo que la
    # tarjeta de previsualizacion salia rota.
    #
    # El cuerpo se deja tal cual a proposito: en el aviso legal, el sitio web
    # del negocio es un dato legal y tiene que seguir siendo aqualadra.com.
    corte = s.find("</head>")
    if corte != -1:
        cabeza, cuerpo = s[:corte], s[corte:]
        cabeza = cabeza.replace("https://www.aqualadra.com", previa)
        if f.name == "index.html" and "noindex" not in cabeza:
            m = '<meta name="theme-color" content="#2496B2">'
            cabeza = cabeza.replace(m, m + '\n<meta name="robots" content="noindex, nofollow">')
        s = cabeza + cuerpo
    f.write_text(s, encoding="utf-8")

(d / "robots.txt").write_text("# Vista previa provisional: no indexar.\nUser-agent: *\nDisallow: /\n", encoding="utf-8")

sm = d / "sitemap.xml"
sm.write_text(sm.read_text(encoding="utf-8").replace("https://www.aqualadra.com", previa), encoding="utf-8")
print("  URLs reescritas en %d paginas" % len(list(d.glob("*.html"))))
REESCRIBIR
else
  echo "Modo produccion: indexable y con las URLs de aqualadra.com."
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
