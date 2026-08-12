# Homelab en casa

Montaje de servicios sobre un mini PC Intel (i3, 16 GB RAM) con Debian + Docker
Compose. Sin hipervisor: el objetivo es **tener servicios estables**, no aprender
virtualización.

---

## Supuestos que hay que confirmar

Estos cuatro puntos condicionan el resto. Si alguno no se cumple, se indica al
lado qué cambia.

| Supuesto | Cómo comprobarlo | Si no se cumple |
|---|---|---|
| El i3 es de 6ª generación o posterior (tiene Quick Sync) | `lscpu \| grep "Model name"` y `ls /dev/dri` | Quitar el bloque `devices` de `compose/jellyfin/compose.yaml`; el transcode irá por CPU y solo aguantará 1 stream |
| Un solo disco NVMe | `lsblk` | Ver [Disco de datos aparte](#disco-de-datos-aparte) |
| Dominio propio con el DNS gestionado en Cloudflare | — | Ver [Sin dominio propio](#sin-dominio-propio) |
| 16 GB de RAM | `free -h` | Con 8 GB hay que quitar Paperless o Immich-ML |

---

## Decisiones y por qué

**Debian + Docker Compose, no Proxmox.** Con una sola máquina de 16 GB, un
hipervisor cuesta ~1 GB de RAM y una capa de complejidad para dar aislamiento
que Docker ya da. Todo lo que queremos correr viene empaquetado en contenedores.
Si más adelante hacen falta VMs o snapshots, se instala `incus` sobre este mismo
Debian sin reinstalar nada.

**Nada expuesto a internet.** El acceso desde fuera va por Tailscale. No se abre
ni un puerto en el router. Esto elimina de golpe la mayor fuente de incidentes de
un homelab.

**Certificados TLS válidos vía DNS-01.** Aunque nada esté expuesto, tener
`https://immich.casa.tudominio.com` con candado verde y sin avisos hace que las
apps móviles funcionen sin pelearse. El reto ACME se resuelve por DNS, así que no
necesita que Let's Encrypt alcance la máquina.

**Todo declarado en git.** Los `compose.yaml` están versionados aquí. Los datos
viven fuera del repo, en `/srv`. Reinstalar desde cero = Debian + clonar + `.env`
+ restaurar backup.

**Sin actualizaciones automáticas de contenedores.** Nada de Watchtower: una
actualización desatendida de Immich o Paperless puede migrar un esquema de base de
datos y romper el servicio mientras nadie mira. Se actualiza a mano, leyendo el
changelog, con backup reciente.

---

## Presupuesto de RAM

| Servicio | RAM aproximada |
|---|---|
| Debian + Docker | ~1 GB |
| Caddy | 50 MB |
| AdGuard Home | 100 MB |
| Tailscale (en el host) | 50 MB |
| Immich (server + machine learning) | 2-4 GB |
| Home Assistant | 500 MB |
| Vaultwarden | 100 MB |
| Jellyfin | 500 MB (picos al transcodificar) |
| Paperless-ngx | 1 GB |
| **Total** | **~8-9 GB** |

Quedan 5-6 GB de margen. Suficiente para añadir cosas y para que el kernel use
el resto como caché de disco, que es lo que hace que todo vaya rápido.

Lo que **no** cabe: un LLM local. Un modelo de 7B necesita 8 GB solo de pesos y
sin GPU rinde a 2-3 tokens/s. No merece la pena en esta máquina.

---

## Estructura en disco

```
/srv/homelab/          → este repo (los compose y la config)
/srv/data/             → datos de aplicación: configs, bases de datos  [BACKUP]
  ├── caddy/
  ├── adguard/
  ├── immich/{postgres,model-cache}
  ├── homeassistant/
  ├── vaultwarden/
  ├── jellyfin/{config,cache}
  └── paperless/{data,media}
/srv/media/            → ficheros grandes
  ├── immich/           → biblioteca de fotos                          [BACKUP]
  └── jellyfin/         → vídeo (recuperable desde los originales)   [NO backup]
```

La separación importa para los backups: `/srv/data` y `/srv/media/immich` son
irreemplazables. `/srv/media/jellyfin` se puede volver a generar desde los discos
originales, así que no gasta cuota en la nube.

### Disco de datos aparte

Con un solo NVMe de 256/512 GB las fotos se lo comen en un año. Opciones, en
orden de preferencia:

1. **SATA interno** si el mini PC tiene bahía de 2,5" (muchos Intel NUC la
   tienen). Es la buena.
2. **HDD externo USB 3**: vale para `/srv/media` (fotos y vídeo, acceso
   secuencial). **No** pongas `/srv/data` ahí: las bases de datos sobre USB
   sufren con las desconexiones y corrompen.
3. **NAS por red** montado por NFS. Igual: media sí, bases de datos no.

Monta el disco por UUID en `/etc/fstab`, nunca por `/dev/sdX`:

```
UUID=xxxx-xxxx  /srv/media  ext4  defaults,nofail,x-systemd.device-timeout=10  0  2
```

El `nofail` es importante: sin él, si el disco no está, el arranque se queda
colgado esperando en una máquina que no tiene monitor conectado.

---

## Orden de montaje

Un paso por sesión. Deja una semana entre servicios: si algo se rompe, quieres
saber qué lo rompió.

### 0. Debian base

Debian 13 (trixie) o 12 (bookworm), instalación mínima sin entorno gráfico.
Durante la instalación desmarca todo excepto "SSH server" y "standard system
utilities".

```bash
# desde el propio mini PC, la primera y última vez que necesitas teclado
sudo apt install -y git
git clone <URL-DE-ESTE-REPO> /srv/homelab
cd /srv/homelab/homelab
sudo ./scripts/bootstrap-debian.sh
```

El script instala Docker desde el repositorio oficial, activa
`unattended-upgrades` (parches de seguridad del sistema sí, contenedores no),
crea el árbol de `/srv`, y endurece SSH.

Después, copia tu clave pública y **desactiva el login por contraseña**:

```bash
ssh-copy-id usuario@ip-del-mini   # desde tu portátil
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

### 1. Tailscale

Va instalado en el host, no en Docker: así puede anunciar la subred de casa y
hacer de salida DNS.

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up --advertise-routes=192.168.1.0/24 --accept-routes
```

Ajusta la subred a la de tu router. Luego, en la consola de Tailscale, aprueba
la ruta anunciada y desactiva la caducidad de clave de este nodo (si no, en 6
meses se desconecta solo y te quedas sin acceso remoto justo cuando lo
necesitas).

**Desde aquí ya administras por SSH desde el sofá o desde fuera de casa.** El
resto de los pasos no necesitan monitor.

### 2. Variables de entorno

```bash
cd /srv/homelab/homelab
cp .env.example .env
chmod 600 .env
$EDITOR .env
```

`.env` está en `.gitignore`. No lo commitees nunca: lleva el token de Cloudflare
y las contraseñas de las bases de datos.

Genera las contraseñas con `openssl rand -base64 32`, no a mano.

### 3. Caddy (reverse proxy + TLS)

```bash
docker network create proxy
cd compose/caddy
docker compose up -d --build
docker compose logs -f
```

La primera vez construye una imagen de Caddy con el plugin de DNS de Cloudflare
(la imagen oficial no lo trae). Tarda un par de minutos.

En los logs debes ver que obtiene el certificado. Si falla, casi siempre es el
token de Cloudflare: necesita permisos `Zone:Read` + `DNS:Edit` sobre la zona, y
se crea en *My Profile → API Tokens*, no en "Global API Key".

### 4. AdGuard Home

```bash
cd ../adguard
docker compose up -d
```

Abre `http://ip-del-mini:3000` y completa el asistente. **En el asistente,
configura la interfaz web en el puerto 8080**, no el 80: el 80 lo usa Caddy.

Después del setup:

1. Quita el mapeo del puerto `3000` de `compose.yaml` y haz `docker compose up -d`.
   Ya no hace falta, y el panel queda accesible solo por
   `https://adguard.casa.tudominio.com`.
2. En *Filtros → Listas de bloqueo*, añade **AdGuard DNS filter** y
   **OISD Basic**. Con eso sobra; apilar 20 listas solo genera falsos positivos.
3. En *Configuración de DNS → Reescrituras de DNS*, añade
   `*.casa.tudominio.com → 192.168.1.X` (la IP local del mini). Esto hace que
   dentro de casa los nombres resuelvan directos, sin salir a internet.
4. En la consola de Tailscale, *DNS → Nameservers*, añade la IP Tailscale del
   mini con "Restrict to domain" `casa.tudominio.com`. Así los nombres también
   funcionan desde fuera.

**Aviso importante antes de tocar el DHCP del router:** cuando pongas AdGuard
como DNS de toda la casa, cada `docker compose down` deja a todo el mundo sin
internet. Configura en el router un **DNS secundario** (1.1.1.1) y espera un par
de semanas de funcionamiento estable antes de dar el paso.

### 5. Immich (fotos)

El compose oficial de Immich cambia entre versiones (han migrado de extensión
vectorial de Postgres más de una vez), así que en lugar de copiarlo aquí y
dejarlo podrirse, se descarga el del release fijado:

```bash
cd ../immich
./pull.sh          # descarga docker-compose.yml del release de IMMICH_VERSION
docker compose up -d
```

`compose.override.yaml` es lo nuestro: engancha Immich a la red `proxy`, mueve
los datos a `/srv`, y quita los puertos publicados (entra por Caddy).

Primer arranque: tarda unos minutos en descargar los modelos de machine
learning. Crea la cuenta en `https://immich.casa.tudominio.com`, instala la app
móvil, y activa el backup automático.

**No borres las fotos del móvil hasta que el primer backup con restic haya
terminado y hayas probado una restauración.** Un único copia de los datos no es
un backup.

Para actualizar: leer las [notas de
release](https://github.com/immich-app/immich/releases) (a veces hay pasos
manuales), subir `IMMICH_VERSION` en `.env`, `./pull.sh`, `docker compose up -d`.

### 6. Backups

Este paso no es opcional y va antes que el resto de servicios. Sin él, todo lo
anterior es una forma elaborada de perder las fotos.

```bash
cd /srv/homelab/homelab
sudo ./scripts/backup.sh          # primera ejecución: inicializa el repositorio
sudo cp systemd/homelab-backup.* /etc/systemd/system/
sudo systemctl enable --now homelab-backup.timer
systemctl list-timers homelab-backup.timer
```

Usa [restic](https://restic.net/) contra Backblaze B2 (~6 $/TB/mes). El script
volca las bases de datos antes de copiar, para no respaldar ficheros de Postgres
en pleno vuelo.

Esto cubre dos de las tres patas del 3-2-1: el original en el mini y la copia
fuera de casa. La tercera (copia local en otro disco) es un segundo repositorio
restic en el disco USB; el script lo soporta si defines `RESTIC_REPOSITORY_LOCAL`.

**Prueba la restauración ahora, no cuando la necesites:**

```bash
sudo ./scripts/restore-test.sh
```

Restaura el último snapshot en un directorio temporal, comprueba que el volcado
de Postgres se puede leer, y borra lo restaurado. Ponlo en el calendario cada
tres meses. Un backup que nunca se ha restaurado no se sabe si es un backup.

### 7. El resto

Ya con la base montada, cada uno es `cd compose/<servicio> && docker compose up -d`:

- **`vaultwarden`** — gestor de contraseñas, clientes de Bitwarden. Tras crear tu
  cuenta, pon `SIGNUPS_ALLOWED=false` en `.env` y recrea el contenedor.
- **`homeassistant`** — domótica. Va en `network_mode: host` porque necesita
  broadcast en la red local para descubrir dispositivos. Si usas un adaptador
  Zigbee/Z-Wave USB, descomenta el bloque `devices`.
- **`jellyfin`** — media. Usa `/dev/dri` para transcodificar por hardware.
  Actívalo en *Panel de control → Reproducción → Aceleración por hardware:
  Intel QuickSync*.
- **`paperless`** — digitalizar papeleo (facturas, contratos, Hacienda). Hace OCR
  y lo indexa todo. Configurado con SQLite en lugar de Postgres para ahorrar RAM;
  para uso personal (miles de documentos, no millones) va perfecto.

---

## Operación

Después de cada cambio en un `compose.yaml` o en el `Caddyfile`, antes de
aplicarlo:

```bash
./scripts/validate.sh
```

Valida la sintaxis de los scripts y de los compose, comprueba el `Caddyfile`
contra la imagen construida (con el plugin de Cloudflare, para que `dns
cloudflare` no dé un falso error), y verifica el entorno: que existe
`/dev/dri`, que el GID del grupo `render` coincide con el de
`compose/jellyfin`, que la red `proxy` está creada y que a `/srv` le queda
espacio.

```bash
# ver qué está corriendo y cuánta RAM come
docker ps --format 'table {{.Names}}\t{{.Status}}'
docker stats --no-stream

# logs de un servicio
cd compose/<servicio> && docker compose logs -f --tail=100

# actualizar UN servicio (con backup reciente y changelog leído)
cd compose/<servicio> && docker compose pull && docker compose up -d

# limpiar imágenes viejas cuando el disco apriete
docker image prune -a
```

### Cuando algo va mal

| Síntoma | Primera cosa que mirar |
|---|---|
| Un servicio no arranca | `docker compose logs --tail=50` |
| No resuelve ningún nombre en casa | ¿Está AdGuard levantado? `dig @ip-del-mini google.com` |
| Certificado caducado o inválido | Logs de Caddy; suele ser el token de Cloudflare expirado |
| Todo lento de golpe | `df -h` (disco lleno) y `free -h` (swap a tope) |
| No entra nada por HTTPS | `docker network inspect proxy` — ¿está el contenedor en la red? |

### Reglas de convivencia

Se aprenden por las malas:

- **Nada en el camino crítico de la familia mientras lo estés tocando.** Si te
  pones a experimentar con el DNS un domingo por la tarde, te conviertes en el
  motivo de que no funcione la tele.
- **Un cambio a la vez.** Si tocas tres cosas y algo se rompe, no sabes cuál fue.
- **Consumo:** un mini PC i3 son unos 15-25 W en reposo, ~50 €/año de luz. Es
  barato, pero apaga lo que no uses.

---

## Sin dominio propio

Si no tienes dominio, tienes tres salidas:

1. **Comprar uno** (~10 €/año en Cloudflare o Porkbun) y seguir el plan tal cual.
   Es lo que recomiendo: 10 € resuelven el problema para siempre.
2. **Certificados de Tailscale**: `tailscale cert` da certificados válidos para
   nombres `*.ts.net`. Funciona sin dominio, pero solo desde la VPN.
3. **Sin TLS**: acceder por `http://ip-del-mini:puerto`. Funciona, pero algunas
   apps móviles (Immich entre ellas) se quejan y pierdes los nombres bonitos.

Si el DNS de tu dominio no está en Cloudflare, Caddy soporta [muchos otros
proveedores](https://github.com/caddy-dns): cambia el módulo en el `Dockerfile`
y el bloque `dns` del `Caddyfile`.

---

## Qué añadir después

Cuando esto lleve meses funcionando sin tocarlo:

- **Uptime Kuma** — avisa por Telegram cuando un servicio se cae. Lo primero que
  añadiría.
- **Dozzle** — ver logs de todos los contenedores desde el navegador.
- **Diun** — notifica cuando hay imágenes nuevas, sin actualizar nada solo.
- **Prometheus + Grafana** — métricas. Divertido, pero come 1,5 GB de RAM y no
  arregla nada por sí solo.
- **Forgejo + runner** — git propio y CI autoalojado, para los proyectos de este
  repo.
- **`incus`** — si acabas echando de menos las VMs y los snapshots, se instala
  sobre este mismo Debian sin reinstalar.
