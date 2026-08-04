# Vuelca la configuracion ANPR de una camara Dahua via API CGI.
#
#   .\diagnostico.ps1 [-Cam 172.18.74.16] [-User admin]
#
# Usa curl.exe, incluido en Windows 10 (1803+) y Windows 11.
# La contrasena se pide por teclado y no queda en el historial.
#
# Salida -> .\salida\  (un fichero por seccion + una captura JPEG)

param(
  [string]$Cam  = "172.18.74.16",
  [string]$User = "admin"
)

$ErrorActionPreference = "Stop"

$secure = Read-Host -AsSecureString "Contrasena de $User@$Cam"
$pass   = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))

$out = Join-Path $PSScriptRoot "salida"
New-Item -ItemType Directory -Force -Path $out | Out-Null

function Req {
  param([string[]]$Args)
  & curl.exe -s --digest -u "${User}:${pass}" --connect-timeout 8 --max-time 20 @Args
}

Write-Host "==> Comprobando acceso a $Cam"
$probe = Req @("http://$Cam/cgi-bin/magicBox.cgi?action=getSystemInfo")
if (-not $probe) {
  Write-Error "No hay respuesta de $Cam. Comprueba IP, red y credenciales."
  exit 1
}

# Secciones relevantes para ANPR. Algunas no existen en todos los modelos:
# si una devuelve "Error", se anota y se sigue.
$secciones = @(
  "TrafficSnapshot",    # parametros de captura/disparo de la regla ANPR
  "TrafficLane",        # geometria y sentido de cada carril
  "TrafficGlobal",      # region/pais de matricula
  "VideoAnalyseRule",   # reglas de analisis de video (lineas de deteccion)
  "VideoAnalyseGlobal", # plan inteligente activo
  "VideoInExposure",    # obturador, ganancia, WDR
  "VideoInDayNight",    # perfil dia/noche
  "Snap"                # calidad de instantanea
)

foreach ($s in $secciones) {
  Write-Host "==> $s"
  $dest = Join-Path $out "$s.txt"
  Req @("http://$Cam/cgi-bin/configManager.cgi?action=getConfig&name=$s") |
    Set-Content -Path $dest -Encoding UTF8
  if ((Get-Content $dest -TotalCount 1) -match '^Error') {
    Write-Host "    (no soportada en este modelo)"
  }
}

Write-Host "==> Informacion del equipo"
$equipo = Join-Path $out "equipo.txt"
@(
  Req @("http://$Cam/cgi-bin/magicBox.cgi?action=getSystemInfo")
  Req @("http://$Cam/cgi-bin/magicBox.cgi?action=getDeviceType")
  Req @("http://$Cam/cgi-bin/magicBox.cgi?action=getSoftwareVersion")
) | Set-Content -Path $equipo -Encoding UTF8

# Un frame real es la unica forma de medir el ancho de matricula en pixeles,
# que es el criterio que decide si la lectura es viable.
Write-Host "==> Captura de un frame"
Req @("-o", (Join-Path $out "frame.jpg"), "http://$Cam/cgi-bin/snapshot.cgi?channel=1") | Out-Null

Write-Host ""
Write-Host "Listo. Resultados en: $out"
Write-Host "Revisa que no haya credenciales en los .txt antes de compartirlos."
