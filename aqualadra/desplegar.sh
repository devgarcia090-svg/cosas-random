#!/usr/bin/env bash
#
# Despliega la web de AquaLadra en Cloudflare.
#
#   ./desplegar.sh                 vista previa en https://aqualadra.pages.dev
#   ./desplegar.sh --produccion    para cuando ya tenga el dominio aqualadra.com
#   ./desplegar.sh --workers       al Worker antiguo (*.workers.dev)
#   ./desplegar.sh --solo-preparar deja el paquete listo pero no despliega
#
# Hace falta estar autenticado, de una de estas dos formas:
#   wrangler login                        (abre el navegador)
#   export CLOUDFLARE_API_TOKEN="..."     (token con permisos de Pages y Workers)
#
# Por qué copia a otra carpeta en vez de desplegar la carpeta directamente:
# todo lo que esté en el directorio que se sube se publica, y aquí hay cosas que
# no deben publicarse (las pruebas y el README). Además, en la vista previa hay
# que tocar la cabecera: ver más abajo.

set -euo pipefail

SITIO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Las opciones se leen todas, en cualquier orden. Antes solo se miraba $1, asi
# que "--produccion --solo-preparar" ignoraba el segundo flag y desplegaba
# produccion sin avisar. Una opcion desconocida corta la ejecucion en vez de
# pasar desapercibida.
PRODUCCION=0
SOLO_PREPARAR=0
A_WORKERS=0

ayuda() {
  sed -n '3,12p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

for arg in "$@"; do
  case "$arg" in
    --produccion)    PRODUCCION=1 ;;
    --solo-preparar) SOLO_PREPARAR=1 ;;
    --workers)       A_WORKERS=1 ;;
    -h|--help|--ayuda) ayuda; exit 0 ;;
    *) echo "Opcion desconocida: $arg" >&2; echo >&2; ayuda >&2; exit 1 ;;
  esac
done

DESTINO="$(mktemp -d)"
trap 'rm -rf "$DESTINO"' EXIT

# Direccion de la vista previa segun el destino. Se puede forzar con:
#   URL_VISTA_PREVIA=https://otra.dev ./desplegar.sh
if [[ "$A_WORKERS" == 1 ]]; then
  URL_VISTA_PREVIA="${URL_VISTA_PREVIA:-https://aqualadra.fate-forgery.workers.dev}"
else
  URL_VISTA_PREVIA="${URL_VISTA_PREVIA:-https://aqualadra.pages.dev}"
fi

echo "Preparando el paquete en $DESTINO"
cp -r "$SITIO" "$DESTINO/public"
rm -rf "$DESTINO/public/pruebas" "$DESTINO/public/README.md" "$DESTINO/public/desplegar.sh"

if [[ "$PRODUCCION" == 0 ]]; then
  echo "Modo vista previa: noindex y URLs apuntando a $URL_VISTA_PREVIA"
  python3 - "$DESTINO/public" "$URL_VISTA_PREVIA" <<'REESCRIBIR'
import pathlib, sys
d, previa = pathlib.Path(sys.argv[1]), sys.argv[2].rstrip("/")

for f in sorted(d.glob("*.html")):
    s = f.read_text(encoding="utf-8")
    # Solo se reescribe la cabecera. Las URLs absolutas de canonical y og:*
    # apuntan al dominio de produccion, y en una vista previa eso es un
    # problema de verdad: WhatsApp e Instagram usan og:url como destino real
    # del enlace, asi que al tocarlo te llevan a la web VIEJA en vez de a
    # esta. Y og:image se busca en un dominio donde no existe, con lo que la
    # tarjeta de previsualizacion sale rota.
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

for extra in ("sitemap.xml", "llms.txt"):
    f = d / extra
    if f.exists():
        f.write_text(f.read_text(encoding="utf-8").replace("https://www.aqualadra.com", previa), encoding="utf-8")
print("  URLs reescritas en %d paginas" % len(list(d.glob("*.html"))))
REESCRIBIR
else
  echo "Modo produccion: indexable y con las URLs de aqualadra.com."
fi

# ---------------------------------------------------------------------------
# Version en los enlaces al CSS y al JavaScript.
#
# Sin esto pasa algo que parece un fallo de diseño: el HTML se revalida en cada
# visita (max-age=0) pero el CSS se cachea, asi que quien ya habia entrado se
# queda con la hoja de estilos vieja y el HTML nuevo. El resultado es una pagina
# a medio maquetar. Añadiendo ?v=<hash del contenido>, cada cambio de CSS o de
# JS es una URL distinta y el navegador la pide de nuevo; y como la URL cambia
# sola cuando cambia el fichero, se puede cachear un año sin miedo.
#
# Se hace sobre la copia, no sobre el repositorio: en local interesa que las
# rutas sigan limpias.
python3 - "$DESTINO/public" <<'VERSIONAR'
import hashlib, pathlib, sys

d = pathlib.Path(sys.argv[1])
versiones = {}
for carpeta, extension in (("css", ".css"), ("js", ".js")):
    for f in sorted((d / carpeta).glob("*" + extension)):
        firma = hashlib.sha256(f.read_bytes()).hexdigest()[:10]
        versiones[carpeta + "/" + f.name] = firma

tocados = 0
for html in sorted(d.glob("*.html")):
    s = html.read_text(encoding="utf-8")
    original = s
    for ruta, firma in versiones.items():
        s = s.replace('"' + ruta + '"', '"' + ruta + "?v=" + firma + '"')
    if s != original:
        html.write_text(s, encoding="utf-8")
        tocados += 1

print("  %d ficheros versionados, en %d páginas" % (len(versiones), tocados))
for ruta, firma in versiones.items():
    print("    %s?v=%s" % (ruta, firma))
VERSIONAR

echo "$(find "$DESTINO/public" -type f | wc -l) ficheros listos."

if [[ "$SOLO_PREPARAR" == 1 ]]; then
  COPIA="${TMPDIR:-/tmp}/aqualadra-paquete"
  [[ "$PRODUCCION" == 1 ]] && COPIA="$COPIA-produccion"
  rm -rf "$COPIA" && cp -r "$DESTINO" "$COPIA"
  echo "Paquete dejado en $COPIA (no se ha desplegado)."
  exit 0
fi

if [[ "$A_WORKERS" == 1 ]]; then
  # Worker con assets estaticos. Se mantiene por si acaso, pero la URL que
  # genera Cloudflare para la cuenta (fate-forgery.workers.dev) no se puede
  # renombrar y no es presentable, asi que lo normal es usar Pages.
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
  cd "$DESTINO"
  npx --yes wrangler@latest deploy
else
  npx --yes wrangler@latest pages deploy "$DESTINO/public" \
    --project-name aqualadra --branch main --commit-dirty=true
fi
