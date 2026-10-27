# dsh-deepseek-peakoffpeak

[![npm](https://img.shields.io/npm/v/@jamolpe88/dsh-deepseek-peakoffpeak?style=flat-square&logo=npm&label=npm)](https://www.npmjs.com/package/@jamolpe88/dsh-deepseek-peakoffpeak)
[![npm descargas](https://img.shields.io/npm/dm/@jamolpe88/dsh-deepseek-peakoffpeak?style=flat-square&logo=npm&label=descargas)](https://www.npmjs.com/package/@jamolpe88/dsh-deepseek-peakoffpeak)
[![GitHub release](https://img.shields.io/github/v/release/JaMoLpE88/dsh-deepseek-peakoffpeak?style=flat-square&logo=github&label=release)](https://github.com/JaMoLpE88/dsh-deepseek-peakoffpeak/releases)
[![licencia](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)
[![DSH](https://img.shields.io/badge/DSH-%3E%3D0.2.1--rc.3-4B8BBE?style=flat-square)](#compatibilidad)
[![plataforma](https://img.shields.io/badge/platform-Windows%2011-0078D6?style=flat-square)](#compatibilidad)
[![dsh-plugin.org](https://dsh-plugin.org/badges/listed.svg)](https://dsh-plugin.org/plugins/jamolpe88/dsh-deepseek-peakoffpeak)

**Reloj de tarifas peak/off-peak de DeepSeek en el composer de DeepSeek Harness.** Una barra viva de 24 horas vive en una píldora compacta entre los controles de permiso y modelo; al pulsarla se abre una ventana estilo DSH con la franja activa, la cuenta atrás al siguiente cambio, las ventanas del día y los precios oficiales por millón de tokens.

Cero configuración. El plugin se calcula en el navegador con el reloj del usuario y la tabla oficial de precios: sin API, sin clave y sin página de ajustes.

**English** → [README.md](README.md)

**Página del proyecto** → [jmolo.es/proyectos/dsh-deepseek-peakoffpeak](https://jmolo.es/proyectos/dsh-deepseek-peakoffpeak/)

![Ventana de detalles del reloj de tarifas DeepSeek](assets/panel.png)

*La ventana de detalles: la franja activa con su nota de mitad de precio / precio completo, la cuenta atrás al siguiente cambio, la hora local y la zona, la barra de 24 horas de hoy y los precios oficiales de V4.1 Flash y V4 Pro con la columna activa marcada.*

![Ventana de detalles del reloj de tarifas DeepSeek en peak](assets/panel-peak.png)

*Durante el peak la misma ventana se tiñe de cálido: la franja, la barra de 24 horas y la columna de precios activa siguen el color del peak.*

![Píldora del reloj de tarifas DeepSeek en el composer de DeepSeek Harness](assets/pill.png)

*La píldora compacta: la marca de DeepSeek con un pequeño reloj, la franja actual, el tiempo restante y una barra de 24 horas con los bloques peak / off-peak y la marca de la hora actual. Solo aparece con un modelo DeepSeek.*

## Qué hace

- Muestra una **barra viva de 24 horas** en el composer: bloques peak y off-peak del día local del usuario, más una marca para la hora actual.
- Etiqueta la franja activa (`Peak` / `Off-peak`) y el **tiempo restante** hasta el siguiente cambio, actualizado cada segundo.
- Abre al pulsar una ventana de detalles estilo DSH:
  - la franja activa con `Full price` / `Half price`;
  - una cuenta atrás `hh:mm:ss` hasta el siguiente cambio;
  - la hora local, la zona horaria y el desfase UTC actuales;
  - la barra de 24 horas de hoy con sus tramos, línea de progreso y marca de ahora;
  - el precio oficial en USD por 1M de tokens de **V4.1 Flash** y **V4 Pro** (entrada sin caché, entrada con caché y salida), con la columna activa teñida de verde en off-peak y cálida en peak;
  - el enlace a la fuente oficial, la fecha de los datos y la nota sobre los festivos chinos.
- Aparece con **modelos DeepSeek de cualquier proveedor**: `deepseek-official`, `deepseek-account`, `opencode-go` con un modelo DeepSeek, o un agregador cuyo proveedor, id de modelo o nombre de catálogo contenga `deepseek`.
- Aparece en una sesión nueva antes del primer mensaje, siguiendo el modelo que muestra el compositor.
- Se une al **grupo centrado de píldoras** compartido con los otros plugins de composer de JaMoLpE88: con más de una píldora visible quedan una al lado de otra, centradas y con un pequeño margen; se ocultan juntas cuando la fila se queda sin sitio.
- Se actualiza sola con el reloj real del usuario; sin servidor y sin polling.

## Qué no hace

- No llama a la API de DeepSeek ni lee credenciales.
- No pide una clave ni guarda una en el plugin.
- No excluye los festivos públicos chinos; la nota oficial del peak los excluye y este plugin no incluye un calendario de festivos.
- No actualiza los precios por sí solo: la tabla viaja con el plugin y la ventana muestra la fecha de los datos.
- No guarda historial, gráficas, telemetría ni datos en el almacenamiento local.
- No añade herramientas, comandos ni cambios al agente.
- No muestra nada si el modelo activo no es DeepSeek.

## Por qué no hay ajustes

Todo lo que necesita el plugin ya está en la máquina: el reloj del usuario y la tabla oficial de precios. No hay clave que introducir, endpoint que configurar, intervalo de refresco que elegir ni umbral que editar. El único estado visible es la franja, la cuenta atrás y los precios; cuando el modelo no es DeepSeek no hay nada útil que mostrar y el plugin no renderiza nada.

## Requisitos

- **DSH Desktop** `>= 0.2.1-rc.3`, perfil `desktop` (probado en `0.2.1-rc.3`, Windows 11).
- Un **modelo DeepSeek** seleccionado de cualquier proveedor: `deepseek-official`, `deepseek-account`, `opencode-go` con un modelo DeepSeek, o un agregador que sirva uno.
- Node 22+ (DSH trae su propio runtime).

Si no hay ningún modelo DeepSeek disponible, el plugin nunca aparece. Es intencionado.

## Instalación

Desde npm:

```bash
dsh plugin --profile desktop add @jamolpe88/dsh-deepseek-peakoffpeak
```

Desde el repositorio:

```bash
dsh plugin --profile desktop add github:JaMoLpE88/dsh-deepseek-peakoffpeak
```

Desde un checkout local, mientras desarrollas:

```bash
dsh plugin --profile desktop add C:\ruta\a\dsh-deepseek-peakoffpeak
```

Refresca la ventana de DSH después de instalar. La píldora aparece en el composer de cualquier sesión cuyo modelo activo sea DeepSeek.

## Uso

1. Selecciona un modelo DeepSeek, del proveedor que lo sirva.
2. La píldora aparece centrada en la fila del composer, entre el control de permiso y el selector de modelo.
3. Lee la franja y el tiempo restante de un vistazo; la barra pinta las ventanas peak y off-peak de hoy.
4. Pulsa la píldora para abrir la ventana con la cuenta atrás, la barra del día y las tablas de precios.
5. Haz clic fuera de la ventana, pulsa **Escape** o vuelve a pulsar la píldora para cerrarla.

La barra de 24 horas sigue el día local, incluidos los días con cambio de hora. Las horas se muestran en la zona horaria del navegador; las ventanas peak se definen en UTC.

## Cómo funciona

- **Ventanas peak:** `01:00–04:00` y `06:00–10:00` UTC, de lunes a viernes. Todo lo demás es off-peak, incluidos los fines de semana completos.
- El día local (`00:00 → 24:00`) se corta en cada frontera UTC, así que cada bloque tiene su duración real y la barra sigue siendo correcta con los cambios de hora.
- El instante actual se traduce a una posición en ese día local; la marca y la línea de progreso se mueven cada segundo.
- La cuenta atrás es la distancia a la siguiente frontera; `Peak` / `Off-peak` se evalúa con las mismas reglas UTC.
- La visibilidad combina la proyección viva `modelSelection` con el modelo que muestra el compositor, de modo que una sesión vacía sigue el modelo por defecto del catálogo en vez de esperar a la primera petición.
- La tabla de precios es estática, transcrita de la página oficial:

| Modelo | Concepto | Off-peak | Peak |
|---|---|---|---|
| **V4.1 Flash** (`deepseek-flash`) | Entrada sin caché | $0.15 | $0.30 |
| | Entrada con caché | $0.003 | $0.006 |
| | Salida | $0.60 | $1.20 |
| **V4 Pro** (`deepseek-v4-pro`) | Entrada sin caché | $0.66 | $1.32 |
| | Entrada con caché | $0.022 | $0.044 |
| | Salida | $1.98 | $3.96 |

Fuente: [api-docs.deepseek.com/quick_start/pricing](https://api-docs.deepseek.com/quick_start/pricing) (datos del 23/10/2026). Las tarifas off-peak son la mitad de las peak; este plugin no excluye los festivos públicos chinos.

## Compatibilidad

| | |
|---|---|
| DSH | `>= 0.2.1-rc.3` (única versión probada por el autor) |
| Node | `>= 22` |
| SO | Windows 11 (probado); macOS y Linux sin probar |
| Perfil | `desktop` |
| Modelos | Cualquier modelo DeepSeek, de cualquier proveedor |
| Catálogo | [publicado en dsh-plugin.org](https://dsh-plugin.org/plugins/jamolpe88/dsh-deepseek-peakoffpeak) |
| Página del proyecto | [jmolo.es/proyectos/dsh-deepseek-peakoffpeak](https://jmolo.es/proyectos/dsh-deepseek-peakoffpeak/) |

Estado de validación: **probado en Windows 11 con DSH Desktop 0.2.1-rc.3** (27/10/2026). La píldora aparece con un modelo DeepSeek, pinta los bloques peak/off-peak con la marca de la hora actual, muestra la cuenta atrás y abre la ventana con la columna de precios marcada. No validado: macOS, Linux, otras versiones de DSH y el perfil web.

## Límites

- **Los festivos públicos chinos no se excluyen.** La definición oficial del off-peak los excluye; este plugin no incluye ese calendario. La ventana de detalles lo indica.
- **Los precios son estáticos.** Si DeepSeek los cambia, hace falta una versión nueva del plugin; la ventana muestra siempre la fecha de los datos incluidos.
- **La detección del modelo es por nombre.** Un proveedor que sirva DeepSeek bajo un alias sin `deepseek` en el proveedor, el id de modelo o el nombre de catálogo no mostrará la píldora.
- **El grupo centrado se oculta si no cabe.** Con varias píldoras visibles en una ventana estrecha, el grupo entero desaparece en lugar de solaparse con el selector de modelo.
- **Windows 11 es la única plataforma probada.**
- **Sin ajustes.** No hay intervalo de refresco, umbral, calendario de festivos ni override de precios.

## Privacidad

- Sin peticiones de red: el plugin se calcula por completo en el navegador.
- Sin credenciales, cookies, datos de sesión ni workspace IDs.
- Sin archivo de configuración, almacenamiento local ni telemetría.
- Las capturas usan un fondo de chat simulado; no se muestra ninguna conversación real.

Consulta [SECURITY.md](SECURITY.md) para la política resumida.

## Problemas frecuentes

**La píldora no aparece.**
Comprueba que el modelo activo es DeepSeek, de cualquier proveedor. Un alias que no contenga `deepseek` en el proveedor, el id de modelo o el nombre de catálogo no se detecta.

**Los precios están desactualizados.**
La tabla viaja con el plugin. Instala la última versión; la ventana muestra la fecha de los datos junto al enlace a la fuente.

**Las cuentas no cuadran.**
Las ventanas se definen en UTC. Revisa el reloj del sistema y la zona horaria del navegador; la ventana muestra la hora local y el desfase UTC que está usando.

**Desaparecen varias píldoras a la vez.**
Comparten un grupo centrado y se ocultan juntas cuando el composer es demasiado estrecho. Ensancha la ventana para que vuelvan.

## Desarrollo

```bash
npm test        # node --test
npm run check   # comprobación de sintaxis del Host y el Client
```

Los tests cubren los bordes UTC del peak, la búsqueda del siguiente cambio, la segmentación del día (incluido un día con cambio de hora), la detección de DeepSeek y la tabla de precios. La mitad navegador es un `client.js` plano (sin build) y se verifica en el Harness en ejecución.

Instalación local:

```bash
dsh plugin --profile desktop add C:\ruta\a\dsh-deepseek-peakoffpeak
```

## Marcas de terceros

DeepSeek y el logo de DeepSeek son marcas de DeepSeek, Inc. La marca se usa solo para identificar el servicio DeepSeek y sus tarifas; no está cubierta por la licencia MIT que se aplica al código. Este plugin es independiente y no oficial. Ver [NOTICE](NOTICE).

## Licencia

[MIT](LICENSE) © 2026 JaMoLpE88
