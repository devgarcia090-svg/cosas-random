#!/usr/bin/env bash
#
# Auditoria de seguridad de TU PROPIA red WiFi/LAN.
#
# Uso:
#     ./auditoria-wifi.sh            # auditoria normal
#     ./auditoria-wifi.sh --rapido   # salta el barrido de dispositivos
#
# Ejecutalo en el portatil/PC ya conectado a la WiFi que quieres revisar.
# Funciona en macOS y en Linux. No necesita sudo (si lo tienes, detecta algo mas).
#
# Es de SOLO LECTURA: mira como esta configurada la red y que puertos de
# administracion tiene abiertos el router. No intenta adivinar contrasenas,
# no captura handshakes ni desconecta dispositivos.
#
# Solo sobre redes tuyas o con permiso explicito del propietario.

set -uo pipefail

RAPIDO=0
[[ "${1:-}" == "--rapido" ]] && RAPIDO=1

ROJO=$'\033[31m'; AMBAR=$'\033[33m'; VERDE=$'\033[32m'; GRIS=$'\033[90m'; NEG=$'\033[1m'; FIN=$'\033[0m'
[[ -t 1 ]] || { ROJO=""; AMBAR=""; VERDE=""; GRIS=""; NEG=""; FIN=""; }

HALLAZGOS=""
apuntar() { # apuntar <ALTA|MEDIA|BAJA> <mensaje> <como arreglarlo>
  HALLAZGOS="${HALLAZGOS}${1}|${2}|${3}"$'\n'
}
titulo() { printf '\n%s== %s ==%s\n' "$NEG" "$1" "$FIN"; }
dato()   { printf '   %-22s %s\n' "$1" "$2"; }
nota()   { printf '   %s%s%s\n' "$GRIS" "$1" "$FIN"; }

case "$(uname -s)" in
  Darwin) SO=mac ;;
  Linux)  SO=linux ;;
  *)      echo "Sistema no soportado: $(uname -s). Este script cubre macOS y Linux." >&2; exit 1 ;;
esac

hay() { command -v "$1" >/dev/null 2>&1; }

# Comprueba un puerto TCP. Devuelve 0 si esta abierto.
puerto_abierto() {
  local host=$1 puerto=$2
  if hay nc; then
    nc -z -w 2 "$host" "$puerto" >/dev/null 2>&1 && return 0 || return 1
  fi
  # Sin nc: /dev/tcp de bash con corte por temporizador en segundo plano.
  ( exec 3<>"/dev/tcp/$host/$puerto" ) >/dev/null 2>&1 &
  local pid=$!
  local i=0
  while [[ $i -lt 20 ]]; do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.1; i=$((i+1))
  done
  if kill -0 "$pid" 2>/dev/null; then kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; return 1; fi
  wait "$pid" 2>/dev/null && return 0 || return 1
}

printf '%s' "$NEG"
echo "Auditoria de red WiFi/LAN — $(date '+%Y-%m-%d %H:%M')"
printf '%s' "$FIN"
nota "Sistema: $SO — solo lectura, sin intentos de acceso."

# ---------------------------------------------------------------- 1. La red
titulo "1. Red conectada"

IFACE=""; SSID=""; SEGURIDAD=""; BANDA=""; CANAL=""
if [[ $SO == mac ]]; then
  IFACE=$(route -n get default 2>/dev/null | awk '/interface:/{print $2}')
  INFO=$(system_profiler SPAirPortDataType 2>/dev/null)
  if [[ -n "$INFO" ]]; then
    ACTUAL=$(printf '%s' "$INFO" | awk '/Current Network Information:/{f=1;next} /Other Local Wi-Fi Networks:/{f=0} f')
    SSID=$(printf '%s' "$ACTUAL" | awk 'NF && /:$/{gsub(/^[ \t]+|:$/,"");print;exit}')
    SEGURIDAD=$(printf '%s' "$ACTUAL" | awk -F': ' '/Security:/{print $2;exit}')
    CANAL=$(printf '%s' "$ACTUAL" | awk -F': ' '/Channel:/{print $2;exit}')
  fi
  if [[ -z "$SEGURIDAD" ]] && hay wdutil && [[ $EUID -eq 0 ]]; then
    W=$(wdutil info 2>/dev/null)
    SSID=${SSID:-$(printf '%s' "$W" | awk -F': ' '/^ *SSID/{print $2;exit}')}
    SEGURIDAD=$(printf '%s' "$W" | awk -F': ' '/^ *Security/{print $2;exit}')
  fi
else
  IFACE=$(ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($i=="dev") print $(i+1)}' | head -1)
  if hay nmcli; then
    LINEA=$(nmcli -t -f IN-USE,SSID,SECURITY,CHAN,FREQ dev wifi list 2>/dev/null | awk -F: '$1=="*"{print;exit}')
    if [[ -n "$LINEA" ]]; then
      SSID=$(printf '%s' "$LINEA" | cut -d: -f2)
      SEGURIDAD=$(printf '%s' "$LINEA" | cut -d: -f3)
      CANAL=$(printf '%s' "$LINEA" | cut -d: -f4)
      BANDA=$(printf '%s' "$LINEA" | cut -d: -f5)
    fi
  fi
  if [[ -z "$SSID" ]] && hay iw && [[ -n "$IFACE" ]]; then
    SSID=$(iw dev "$IFACE" link 2>/dev/null | awk -F'SSID: ' '/SSID:/{print $2;exit}')
  fi
fi

dato "Interfaz:" "${IFACE:-desconocida}"
dato "SSID:" "${SSID:-no detectado (¿estás por cable?)}"
dato "Seguridad:" "${SEGURIDAD:-no detectada}"
[[ -n "$CANAL" ]] && dato "Canal:" "$CANAL"
[[ -n "$BANDA" ]] && dato "Frecuencia:" "$BANDA"

SEG_MIN=$(printf '%s' "${SEGURIDAD:-}" | tr '[:upper:]' '[:lower:]')
if [[ -z "$SEG_MIN" ]]; then
  nota "No se pudo leer el cifrado: comprueba en el router que sea WPA2 o WPA3."
elif printf '%s' "$SEG_MIN" | grep -qE 'none|open|abierta'; then
  apuntar ALTA "La WiFi esta ABIERTA, sin cifrado ($SEGURIDAD)." \
    "Activa WPA3, o WPA2-AES si hay equipos antiguos, con una clave de 20+ caracteres."
elif printf '%s' "$SEG_MIN" | grep -q 'wep'; then
  apuntar ALTA "La WiFi usa WEP, roto desde 2001 (se descifra en minutos)." \
    "Cambia a WPA3 o WPA2-AES en el router y renueva la contrasena."
elif printf '%s' "$SEG_MIN" | grep -qE 'wpa3|sae'; then
  printf '   %s✓ Cifrado WPA3, lo mejor disponible.%s\n' "$VERDE" "$FIN"
elif printf '%s' "$SEG_MIN" | grep -q 'tkip'; then
  apuntar ALTA "La WiFi usa TKIP, cifrado obsoleto y atacable." \
    "En el router deja solo WPA2-AES (CCMP) o WPA3; desactiva TKIP."
elif printf '%s' "$SEG_MIN" | grep -qE 'wpa2|wpa 2'; then
  apuntar BAJA "Estas en WPA2. Es aceptable, pero WPA3 protege el handshake." \
    "Si el router y los dispositivos lo soportan, pasa a WPA3 o al modo mixto WPA2/WPA3."
elif printf '%s' "$SEG_MIN" | grep -qE '^wpa|wpa1'; then
  apuntar ALTA "La WiFi usa WPA original, obsoleto." \
    "Cambia a WPA3 o WPA2-AES."
fi

# --------------------------------------------------- 2. Redes cercanas (pasivo)
titulo "2. Redes cercanas (informativo)"
CERCANAS=""
if [[ $SO == linux ]] && hay nmcli; then
  CERCANAS=$(nmcli -t -f SSID,SECURITY,SIGNAL dev wifi list 2>/dev/null | head -15)
  printf '%s\n' "$CERCANAS" | awk -F: 'NF && $1!=""{printf "   %-28s %-16s %s%%\n", $1, ($2==""?"ABIERTA":$2), $3}'
elif [[ $SO == mac ]]; then
  CERCANAS=$(printf '%s' "${INFO:-}" | awk '/Other Local Wi-Fi Networks:/{f=1} f' | grep -E ':$|Security:' | head -30)
  printf '%s\n' "$CERCANAS" | sed 's/^[ \t]*/   /'
fi
if printf '%s' "$CERCANAS" | grep -qiE 'security: none|:none:|:开放'; then
  nota "Hay redes abiertas alrededor: no son tuyas, pero evita conectarte a ellas sin VPN."
fi
[[ -z "$CERCANAS" ]] && nota "No se pudo listar (falta nmcli/permisos). No es un problema de seguridad."

# Detectar SSID duplicado con seguridad distinta (posible gemelo malvado)
if [[ -n "$SSID" ]] && [[ -n "$CERCANAS" ]]; then
  REPES=$(printf '%s\n' "$CERCANAS" | grep -cF "$SSID" || true)
  if [[ "${REPES:-0}" -gt 0 ]]; then
    nota "Aparece otra emision con tu mismo SSID. Suele ser tu propio repetidor o la banda de 5 GHz;"
    nota "si no tienes repetidor, desconfia (evil twin) y revisa quien lo emite."
  fi
fi

# ------------------------------------------------------------- 3. El router
titulo "3. Router (puerta de enlace)"
if [[ $SO == mac ]]; then
  GW=$(route -n get default 2>/dev/null | awk '/gateway:/{print $2}')
else
  GW=$(ip route 2>/dev/null | awk '/^default/{print $3;exit}')
fi
dato "IP del router:" "${GW:-no detectada}"

if [[ -n "${GW:-}" ]]; then
  # Puertos de administracion habituales. Comentario = por que importa.
  PUERTOS="21:FTP 22:SSH 23:Telnet 53:DNS 80:HTTP-admin 443:HTTPS-admin 445:SMB 1900:UPnP 7547:TR-069 8080:HTTP-alt 8443:HTTPS-alt 9000:admin-alt"
  ABIERTOS=""
  for par in $PUERTOS; do
    P=${par%%:*}; NOM=${par##*:}
    if puerto_abierto "$GW" "$P"; then
      printf '   %s● %-5s abierto%s  (%s)\n' "$AMBAR" "$P" "$FIN" "$NOM"
      ABIERTOS="$ABIERTOS $P"
    fi
  done
  [[ -z "$ABIERTOS" ]] && nota "Ningun puerto de la lista responde (o el router filtra el sondeo)."

  case "$ABIERTOS" in
    *" 23"*) apuntar ALTA "Telnet (23) abierto en el router: credenciales en texto claro." \
      "Desactiva Telnet en el router. Es el vector de Mirai y familia." ;;
  esac
  case "$ABIERTOS" in
    *" 21"*) apuntar MEDIA "FTP (21) abierto en el router: sin cifrado." \
      "Desactiva el servidor FTP o sustituyelo por SFTP/SMB con clave." ;;
  esac
  case "$ABIERTOS" in
    *" 7547"*) apuntar MEDIA "Puerto 7547 (TR-069, gestion remota del ISP) abierto." \
      "Es normal en routers de operador, pero ha tenido fallos graves. Comprueba que el firmware este al dia y, si el router lo permite, limitalo al rango del ISP." ;;
  esac
  case "$ABIERTOS" in
    *" 445"*) apuntar MEDIA "SMB (445) expuesto en la puerta de enlace." \
      "Si es un disco compartido del router, protegelo con usuario y contrasena y desactiva SMBv1." ;;
  esac

  # ¿Panel de administracion solo por HTTP?
  if printf '%s' "$ABIERTOS" | grep -q ' 80' && ! printf '%s' "$ABIERTOS" | grep -q ' 443'; then
    apuntar MEDIA "El panel del router se sirve solo por HTTP (sin TLS)." \
      "Activa el acceso HTTPS si el router lo soporta; si no, administra solo por cable y nunca desde una WiFi que compartas."
  fi

  if hay curl && printf '%s' "$ABIERTOS" | grep -qE ' (80|8080)'; then
    PBASE=80; printf '%s' "$ABIERTOS" | grep -q ' 80' || PBASE=8080
    SRV=$(curl -sS -m 6 -o /dev/null -D - "http://$GW:$PBASE/" 2>/dev/null | awk -F': ' 'tolower($1)=="server"{print $2}' | tr -d '\r')
    [[ -n "$SRV" ]] && dato "Cabecera Server:" "$SRV" && \
      nota "Ese banner revela modelo/firmware. Busca si tiene CVEs conocidos y actualiza."
  fi
fi

# ----------------------------------------------------------------- 4. DNS
titulo "4. DNS"
DNSS=""
if [[ $SO == mac ]]; then
  DNSS=$(scutil --dns 2>/dev/null | awk '/nameserver\[/{print $3}' | sort -u)
else
  if hay resolvectl; then
    DNSS=$(resolvectl status 2>/dev/null | awk '/DNS Servers:/{for(i=3;i<=NF;i++)print $i}' | sort -u)
  fi
  [[ -z "$DNSS" ]] && DNSS=$(awk '/^nameserver/{print $2}' /etc/resolv.conf 2>/dev/null | sort -u)
fi
if [[ -z "$DNSS" ]]; then
  nota "No se pudieron leer los servidores DNS."
else
  for d in $DNSS; do dato "Servidor DNS:" "$d"; done
  for d in $DNSS; do
    case "$d" in
      127.*|::1|"${GW:-_}"|192.168.*|10.*|172.1[6-9].*|172.2[0-9].*|172.3[01].*) ;;
      1.1.1.1|1.0.0.1|8.8.8.8|8.8.4.4|9.9.9.9|149.112.112.112|208.67.222.222|208.67.220.220|94.140.14.14)
        nota "$d es un resolver publico conocido: correcto si lo pusiste tu." ;;
      *)
        apuntar MEDIA "DNS externo no reconocido en uso: $d" \
          "Si no lo configuraste tu, puede ser un secuestro de DNS. Vuelve al DNS del router o a uno publico de confianza y revisa la config del router." ;;
    esac
  done
fi

# ------------------------------------------------------- 5. Dispositivos LAN
titulo "5. Dispositivos en la red"
if [[ $RAPIDO -eq 1 ]]; then
  nota "Omitido (--rapido)."
else
  if [[ -n "${GW:-}" ]] && hay ping; then
    BASE=$(printf '%s' "$GW" | awk -F. '{print $1"."$2"."$3}')
    nota "Barriendo ${BASE}.1-254 (unos 10 s)..."
    for i in $(seq 1 254); do ping -c1 -W1 "${BASE}.$i" >/dev/null 2>&1 & done
    wait 2>/dev/null
  fi
  if hay arp; then
    VECINOS=$(arp -an 2>/dev/null | grep -vE 'incomplete|ff:ff:ff' | sed 's/^/   /')
  elif hay ip; then
    VECINOS=$(ip neigh 2>/dev/null | grep -v FAILED | sed 's/^/   /')
  else
    VECINOS=""
  fi
  if [[ -n "${VECINOS:-}" ]]; then
    printf '%s\n' "$VECINOS"
    N=$(printf '%s\n' "$VECINOS" | grep -c . || true)
    nota "$N entradas. Repasa la lista: si hay algo que no reconoces, investigalo."
  else
    nota "No se pudo leer la tabla ARP."
  fi
fi

# --------------------------------------------------- 6. Exposicion a Internet
titulo "6. Exposicion hacia Internet"
if hay curl; then
  IPPUB=$(curl -sS -m 8 https://api.ipify.org 2>/dev/null)
  [[ -n "${IPPUB:-}" ]] && dato "IP publica:" "$IPPUB"
fi
nota "Este script mira tu red desde dentro. Lo que se ve desde fuera depende del NAT"
nota "y de los reenvios de puertos que tengas configurados en el router."
apuntar BAJA "Revision manual pendiente: reenvio de puertos, UPnP y administracion remota." \
  "En el router: desactiva 'Administracion remota / WAN access' y UPnP si no lo necesitas, y borra los reenvios de puertos que ya no uses."

# ----------------------------------------------------------- 7. Comprobables
titulo "7. Comprobaciones que solo se ven en el router"
cat <<'EOF'
   Entra en el panel del router y verifica:
     - WPS: desactivado (el PIN es forzable por fuerza bruta).
     - Contrasena de administracion: cambiada, no la de la pegatina.
     - Firmware: actualizado a la ultima version.
     - WPA3 o WPA2-AES, sin TKIP y sin modo "WPA/WPA2 mixto" si no hace falta.
     - Red de invitados aislada del resto de la LAN, para visitas e IoT.
     - Contrasena WiFi de 20+ caracteres, distinta de la de administracion.
     - Administracion remota (WAN): desactivada.
     - UPnP: desactivado salvo necesidad concreta.
     - SSID: sin tu nombre, direccion ni modelo del router.
EOF

# ------------------------------------------------------------- 8. Resumen
titulo "8. Resumen de hallazgos"
if [[ -z "$HALLAZGOS" ]]; then
  printf '   %s✓ Sin hallazgos automaticos. Repasa igualmente la lista del punto 7.%s\n' "$VERDE" "$FIN"
else
  for NIVEL in ALTA MEDIA BAJA; do
    printf '%s' "$HALLAZGOS" | grep "^$NIVEL|" | while IFS='|' read -r n msg fix; do
      case $n in
        ALTA)  C=$ROJO ;;
        MEDIA) C=$AMBAR ;;
        *)     C=$GRIS ;;
      esac
      printf '\n   %s[%s]%s %s\n' "$C" "$n" "$FIN" "$msg"
      printf '      %s→ %s%s\n' "$GRIS" "$fix" "$FIN"
    done
  done
  echo
fi
