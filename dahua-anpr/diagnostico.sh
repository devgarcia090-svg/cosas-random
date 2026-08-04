#!/usr/bin/env bash
# Vuelca la configuracion ANPR de una camara Dahua via API CGI.
#
#   ./diagnostico.sh [IP] [USUARIO]
#
# La contrasena se pide por teclado; no se pasa por argumento para que no
# quede en el historial del shell ni en la lista de procesos.
#
# Salida -> ./salida/  (un fichero por seccion + una captura JPEG)

set -uo pipefail

CAM="${1:-172.18.74.16}"
USER="${2:-admin}"
OUT="$(dirname "$0")/salida"

read -rsp "Contrasena de ${USER}@${CAM}: " PASS
echo

mkdir -p "$OUT"

req() {
  curl -s --digest -u "${USER}:${PASS}" --connect-timeout 8 --max-time 20 "$@"
}

echo "==> Comprobando acceso a ${CAM}"
if ! req -o /dev/null -w '' "http://${CAM}/cgi-bin/magicBox.cgi?action=getSystemInfo"; then
  echo "ERROR: no hay respuesta de ${CAM}. Comprueba IP, red y credenciales." >&2
  exit 1
fi

# Secciones de configuracion relevantes para ANPR. Algunas no existen en
# todos los modelos: si una devuelve "Error", se anota y se sigue.
SECCIONES=(
  TrafficSnapshot      # parametros de captura/disparo de la regla ANPR
  TrafficLane          # geometria y sentido de cada carril
  TrafficGlobal        # region/pais de matricula
  VideoAnalyseRule     # reglas de analisis de video (lineas de deteccion)
  VideoAnalyseGlobal   # plan inteligente activo
  VideoInExposure      # obturador, ganancia, WDR
  VideoInDayNight      # perfil dia/noche
  Snap                 # calidad de instantanea
)

for s in "${SECCIONES[@]}"; do
  echo "==> ${s}"
  req "http://${CAM}/cgi-bin/configManager.cgi?action=getConfig&name=${s}" \
    > "${OUT}/${s}.txt"
  if grep -qi '^Error' "${OUT}/${s}.txt"; then
    echo "    (no soportada en este modelo)"
  fi
done

echo "==> Informacion del equipo"
{
  req "http://${CAM}/cgi-bin/magicBox.cgi?action=getSystemInfo"
  req "http://${CAM}/cgi-bin/magicBox.cgi?action=getDeviceType"
  req "http://${CAM}/cgi-bin/magicBox.cgi?action=getSoftwareVersion"
} > "${OUT}/equipo.txt"

# Un frame real es la unica forma de medir el ancho de matricula en pixeles,
# que es el criterio que decide si la lectura es viable.
echo "==> Captura de un frame"
req -o "${OUT}/frame.jpg" "http://${CAM}/cgi-bin/snapshot.cgi?channel=1"

echo
echo "Listo. Resultados en: ${OUT}"
echo "Revisa que no haya credenciales en los .txt antes de compartirlos."
