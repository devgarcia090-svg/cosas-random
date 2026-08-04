# Cámara ANPR Dahua — no lee matrículas

Equipo: `172.18.74.16` · Vía de **doble sentido**, 2 carriles + carril bici a la derecha.

Diagnóstico hecho sobre capturas de la interfaz web. Falta contrastarlo con la
configuración real del equipo (ver `diagnostico.sh` / `diagnostico.ps1`).

---

## Hallazgos, por probabilidad

### 1. Fuente de activación con Radar marcado

En *Config. de IA → ANPR → Fuente activación* están marcados **Radar** y
**Análisis de vídeo**. La propia nota del panel avisa de que las fuentes se
priorizan en orden descendente, así que el radar va primero. Si el equipo no
lleva módulo radar, o lo lleva sin calibrar, la regla queda esperando un
disparo que no llega.

**Objetivo:** solo *Análisis de vídeo*. Desmarcar *Circ.* y *Radar*.

### 2. Las tres líneas de carril se cruzan

Es el error de geometría. Con 2 carriles la cámara pide 3 líneas azules que,
en el mundo real, son **paralelas** entre sí — en la imagen convergen hacia el
punto de fuga, pero **nunca se cruzan** y mantienen su orden de izquierda a
derecha.

| Línea | Qué delimita | Dónde va |
|---|---|---|
| `Carril1` | Borde izquierdo del carril 1 | Bordillo pintado azul/blanco de la izquierda |
| `Carril2` | Separación entre carriles | Línea discontinua blanca del centro |
| `Límite del carril` | Borde derecho del carril 2 | Línea continua antes del carril bici |

En la configuración actual `Carril1` y `Límite del carril` **arrancan del mismo
punto** (esquina superior izquierda) y salen en abanico; `Límite del carril`
termina a media altura del borde derecho, por encima del final de `Carril2`, así
que ambas se cortan. Con esa geometría no hay dos carriles definidos y los
vehículos no se asignan a ninguno.

**Objetivo:** borrar las tres y redibujarlas sobre las marcas viales reales.

### 3. Sentido de marcha mal asignado (doble sentido)

`Carril2` está en **Trasera vehículo**. Al ser doble sentido, los dos carriles
deben tener valores **opuestos** en *Direcc. Carril*, y también sentidos
distintos en *Dirección* (Sur a Norte / Norte a Sur).

El carril por el que los vehículos **se acercan** a la cámara va en
**Cabeza de vehíc.**; aquel por el que se **alejan**, en *Trasera vehículo*.

> Cuidado con el botón **"Copiar configuración a 1 / 2"**: clona el sentido en
> ambos carriles y es la causa habitual de que uno de los dos lea al revés.
> En doble sentido no debe usarse.

### 4. Exposición no apta para ANPR

Una ANPR no puede ir con la exposición de una cámara de vigilancia normal. La
escena tiene sol duro y sombras marcadas, condiciones en las que la matrícula
se quema o sale con arrastre aunque la imagen general parezca correcta.

| Parámetro | Objetivo |
|---|---|
| Obturador | Manual, 1/500 – 1/1000 s |
| Ganancia máxima | 30 – 50 (nunca automático sin límite) |
| WDR / BLC / HLC | Desactivados (HLC solo de noche si hace falta) |
| Modo escena | *Tráfico* / perfil ANPR si el modelo lo tiene |

### 5. Región de matrícula

En *Ajustes avanzados* (o *TrafficGlobal* por CGI), la región debe ser
**Europa / España**. De fábrica puede venir en China, en cuyo caso el OCR busca
un formato de matrícula inexistente aquí y no reconoce nada.

### 6. Plan inteligente

*Configuración → IA → Plan inteligente* debe tener **ANPR / Tráfico** activo y
aplicado. Si está en IVS o Metadatos de vídeo, la regla ANPR existe pero no se
ejecuta.

### 7. Ángulo y tamaño de matrícula

Requisitos de Dahua para ANPR:

| Parámetro | Recomendado | Máximo |
|---|---|---|
| Desviación horizontal | < 15° | 30° |
| Ángulo vertical (picado) | 15 – 25° | 30° |
| Inclinación (roll) | 0° | 5° |
| Ancho de matrícula | 130 – 160 px | mín. ~100 px |
| Altura de carácter | ≥ 20 px | — |

El encuadre actual es bastante lateral y la matrícula se ve pequeña. Si en el
punto donde cruza la línea de detección no llega a ~100 px de ancho, **ninguna
configuración lo arregla**: hay que hacer zoom o reorientar la cámara.

Para medirlo: `salida/frame.jpg` que genera el script, abierto en un editor de
imagen, con zoom sobre la matrícula.

---

## Orden de aplicación

1. Desmarcar Radar → solo Análisis de vídeo. **Guardar.**
2. Verificar plan inteligente = ANPR y región = Europa. **Guardar.**
3. Redibujar las tres líneas sobre las marcas viales. **Guardar.**
4. Asignar Cabeza / Trasera opuestos por carril, sin usar "Copiar configuración". **Guardar.**
5. Probar. Si no lee → obturador 1/500 y ganancia limitada.
6. Si sigue sin leer → medir píxeles de matrícula en `frame.jpg`.

El paso 1 cuesta diez segundos: conviene probarlo antes de redibujar nada,
porque si la regla espera al radar da igual lo bien que estén los carriles.

---

## Recoger la configuración real

Desde un equipo de la misma red:

```bash
./dahua-anpr/diagnostico.sh 172.18.74.16 admin      # Linux / macOS / Git Bash
```

```powershell
.\dahua-anpr\diagnostico.ps1 -Cam 172.18.74.16 -User admin
```

Deja en `dahua-anpr/salida/` un fichero por sección de configuración más un
frame en JPEG. Con eso se ven las coordenadas reales de las líneas, el
`TriggerSource`, la región de matrícula y los valores de exposición, en lugar de
deducirlos de capturas de pantalla.

`salida/` está en `.gitignore`: la configuración volcada puede incluir datos del
emplazamiento y el frame es una imagen de vía pública con matrículas legibles.
Conviene revisarla antes de compartirla y no subirla al repositorio.

---

## Nota sobre el acceso remoto

Este diagnóstico se hizo sin conexión al equipo. Las sesiones de Claude Code en
la nube corren en un contenedor aislado cuyo proxy de salida rechaza los rangos
privados (`10/8`, `172.16/12`, `192.168/16`) con
`403 x-deny-reason: private_dest_ip`, así que `172.18.74.16` es inalcanzable
desde ahí. Para trabajar contra la cámara hay que ejecutar Claude Code en un
equipo de esa misma red.

No conviene exponer la cámara a Internet mediante un túnel para salvar esa
limitación: es un panel de administración y, además, maneja matrículas, que son
datos personales.
