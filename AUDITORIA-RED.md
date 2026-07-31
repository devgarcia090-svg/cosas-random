# Auditoría de tu red WiFi

El escaneo hay que lanzarlo **desde un equipo conectado a la red que quieres revisar**.
Una sesión de Claude en la nube no puede hacerlo: está en un contenedor remoto, sin
interfaz inalámbrica y sin ruta hacia tu LAN (tu red está detrás de tu NAT).

## Cómo lanzarlo

```bash
./auditoria-wifi.sh            # auditoría completa
./auditoria-wifi.sh --rapido   # sin el barrido de dispositivos
```

macOS y Linux. No hace falta `sudo` (con `sudo` detecta algún dato más en macOS).
Es de solo lectura: mira la configuración y qué puertos de administración responden.
No prueba contraseñas, no captura handshakes y no desconecta a nadie.

Opcional, para un barrido más fino de la LAN:

```bash
# macOS
brew install nmap
# Debian/Ubuntu
sudo apt install nmap network-manager

sudo nmap -sn 192.168.1.0/24          # qué hay conectado
nmap -sV -p- 192.168.1.1              # servicios del router (lento)
```

## Qué revisa el script

| # | Comprobación | Por qué importa |
|---|---|---|
| 1 | Cifrado de la WiFi (WPA3/WPA2/WPA/TKIP/WEP/abierta) | WEP y WPA se rompen en minutos; TKIP está obsoleto |
| 2 | Redes cercanas y SSID duplicados | Un SSID clonado puede ser un *evil twin* |
| 3 | Puertos de administración del router | Telnet, FTP o TR-069 abiertos son la vía de entrada típica |
| 4 | Servidores DNS en uso | Un DNS que no configuraste tú puede ser secuestro |
| 5 | Dispositivos en la LAN | Detectar equipos que no reconoces |
| 6 | IP pública | Punto de partida para revisar la exposición externa |
| 7 | Checklist del panel del router | WPS, firmware, contraseñas, red de invitados |

## Cómo se arregla cada cosa

**WiFi abierta, WEP, WPA o TKIP** — Panel del router → Wireless / Seguridad →
`WPA3-Personal`, o `WPA2-PSK (AES)` si tienes equipos viejos. Nunca WEP ni TKIP.
Cambia también la clave: 20+ caracteres.

**WPS activado** — Desactívalo. El PIN de 8 dígitos se rompe por fuerza bruta en
horas, y da la clave WiFi entera independientemente de lo buena que sea.

**Telnet (23) o FTP (21) abiertos** — Desactiva ambos servicios. Van en texto claro
y son el vector de las botnets tipo Mirai. Si necesitas acceso, usa SSH o SFTP.

**Panel de administración solo por HTTP** — Activa HTTPS si el router lo soporta. Si
no, adminístralo solo por cable y nunca desde una red compartida.

**Contraseña de administración por defecto** — Cámbiala. La de la pegatina suele
derivarse del modelo o del BSSID, y está en listas públicas.

**Administración remota / WAN access activada** — Desactívala salvo que la necesites
de verdad. Expone el panel a todo Internet.

**UPnP activado** — Desactívalo si no lo necesitas. Permite que cualquier programa de
la LAN se abra puertos hacia fuera sin pedirte permiso.

**Firmware desactualizado** — Actualiza. La mayoría de los fallos graves de routers
domésticos están parcheados; el problema es que nadie aplica el parche.

**DNS desconocido** — Vuelve al DNS del router o a uno público de confianza
(`1.1.1.1`, `9.9.9.9`, `8.8.8.8`) y revisa que nadie haya tocado la config del router.

**Dispositivos que no reconoces** — Cruza la MAC con tus equipos. Si sobra algo,
cambia la clave WiFi (echa a todos) y vuelve a conectar solo lo tuyo.

**IoT en la red principal** — Cámaras, enchufes y televisores a la red de invitados,
con aislamiento de clientes activado. Son los equipos que menos se actualizan.

## Lo que este script no hace

- No comprueba la exposición **desde fuera**: eso requiere sondear tu IP pública desde
  otra red. Lo equivalente y más útil es revisar la tabla de reenvío de puertos del
  router y borrar lo que ya no uses.
- No audita la fuerza real de la contraseña WiFi (haría falta capturar el handshake).
- No revisa los dispositivos uno a uno: solo detecta que están ahí.
