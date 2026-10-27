# Plan — Plugin «DeepSeek rate clock» (`dsh-deepseek-peakoffpeak`) para DeepSeek Harness

> Estado: **propuesta para validar**. No se implementa nada hasta tu OK.
> Fecha: 2026-10-27. Datos de precios/franjas: página oficial + web de referencia (`23/10/2026`).

## 1. Objetivo

Un plugin de pill en el composer, con el mismo lenguaje visual que
`@jamolpe88/dsh-opencodego-usage` y `@jamolpe88/dsh-deepseek-balance`:

- **Visible solo** cuando el modelo seleccionado es DeepSeek, **sea cual sea el provider**
  (`deepseek-official`, `deepseek-account`, `opencode-go` con V4.1 Flash, OpenRouter, etc.).
- Pill compacta: logo + barra de 24 h con peak/off-peak + marca de «ahora» + texto `Peak` / `Off-peak` encima.
- La barra y la marca se mueven solas con la hora real del usuario.
- Click → panel con: hora local y zona, hora actual, franjas en hora local, barra de progreso
  del día con marca, próximos cambios, cuenta atrás y **tabla de precios peak/off-peak**
  de V4.1 Flash y V4 Pro, con enlace a la fuente oficial.
- Coexistencia con las otras pills centradas del composer.

## 2. Lo que ya existe (investigado)

### 2.1 Anatomía del plugin de referencia (`dsh-opencodego-usage`)

| Pieza | Detalle |
|---|---|
| Host (`index.js`) | Rutas `/api/opencodego-usage` y `/refresh`; cache 55 s; la API key se resuelve con `ctx.get('credentials')`. |
| Cliente (`client.js`) | Un solo archivo: diccionario EN, `window.__ModuleLoader__.load({ id, factory })`, React desde `require('react')`, `react-dom` para portal. |
| Registro | `ctx.slots.inject('conversation.input.left', () => ctx.slots.register({ name, id, order, locale, inject }, UsagePill))`. |
| Posición | `<span data-ocgo-anchor>` con `position:absolute; left:50%; bottom:8px; transform:translateX(-50%)`, `z-index:20`, oculto en `@container (width <= 620px)`. |
| Pill | Alto `calc(28px + var(--dsh-content-font-delta, 0px))`, radius `--dsw-radius-sm`, texto 11 px tabular, logo 16 px, hover con `--dsw-alias-interactive-bg-hover`. |
| Panel | `position:fixed` + portal, ancho 264 px, `--dsw-specific-menu`, `--dsw-elevation-prominent`, `--dsw-radius-lg`, padding 12 px, 12/20 px; se coloca encima del ancla, se mide oculto y se ancla al viewport; cierra con Escape y click fuera. |
| Icono | `icon.png` 128×128, tile redondeado oscuro. |
| Metadatos | `locale/en.json` y `locale/es.json` con `meta.title` / `meta.description`; `./icon` exportado; sin configuración. |

El `order` de las tres pills en `conversation.input.left` es 20/21; las otras dos también se
centran con `left:50%`, así que **hoy se solapan** si dos están visibles a la vez.

### 2.2 Web de referencia (`jmolo.es/proyectos/reloj-tarifas-deepseek/`)

Algoritmo exacto (extraído del script):

- `PEAK = [{1,4},{6,10}]` horas **UTC**, lunes–viernes.
- `isPeak(t)`: día UTC 0/6 → off-peak; si no, minutos del día dentro de las ventanas.
- `nextChange(t)`: primera frontera de ventana > `t` en `[t−1d, t+9d]`.
- `segments(start,end)`: corta el rango por todas las fronteras y etiqueta cada tramo con
  `isPeak(segmentStart)`; ancho proporcional a la duración real (DST incluido).
- Barra de 24 h del **día local** (00:00 → 24:00), marca `now` por ratio tiempo/día,
  progreso con `width`, etiquetas de tramo ocultas si el tramo < 7,5 % del día.
- Paleta del sitio: peak `#FF7A59`, off-peak `#3EE6A8`, fondo `#080A0E`, texto `#F4F2EC`.

Precios (USD / 1M tokens, oficiales):

| Modelo | Concepto | Off-peak | Peak |
|---|---|---|---|
| V4.1 Flash (`deepseek-flash`) | entrada sin caché | 0.15 | 0.30 |
| | entrada con caché | 0.003 | 0.006 |
| | salida | 0.60 | 1.20 |
| V4 Pro (`deepseek-v4-pro`) | entrada sin caché | 0.66 | 1.32 |
| | entrada con caché | 0.022 | 0.044 |
| | salida | 1.98 | 3.96 |

Notas oficiales: peak lun–vie 01:00–04:00 y 06:00–10:00 UTC; festivos chinos enteros en off-peak
(el plugin **no** conoce el calendario chino, igual que la web: se indica en el pie).

### 2.3 APIs del Harness confirmadas

- Slot `conversation.input.left` (list, scope session): `id`, `order`, `label`; props estándar
  `useProjection`, `sessionId`, `t`, etc. Ocupantes actuales: `opencodego-usage` (20),
  `deepseek-balance` (21).
- Proyección `modelSelection` → `{ provider, model, reasoningEffort? }` en `next` / `lastUsed`.
  Confirmado en `ui-model-selection` (`selection.provider` + `selection.model`).
- `ctx.get('modelDirectories').directoryFor(sessionId).store` → snapshot con `current`
  (`{provider, model}`), `groups` (`[{ id, name, models: [{ id, name }] }]`) y `pending`.
- Tokens: `--dsw-alias-*`, `--dsw-specific-menu`, `--dsw-elevation-prominent`, `--dsw-radius-*`,
  `--dsw-focus-ring-*`. No hay token para verde/rojo de franja: el color de marca de la
  franja es artwork y se fija en el plugin (`#3EE6A8` / `#FF7A59`).
- Servicios cliente: patrón `class X extends Service { constructor(ctx){ super(ctx,'name') } }`
  + `ctx.plugin(X)` (igual que `ctx.modelDirectories` en `ui-model-selection`).

## 3. Decisiones propuestas (a confirmar)

1. **Colores (confirmado)**: peak `#FF7A59` (cálido) y off-peak `#3EE6A8` (verde), como la web.
2. **Coexistencia**: paquete compartido `@jamolpe88/dsh-composer-pills` (rail centrado) +
   migración de 15 líneas en `dsh-opencodego-usage` y `dsh-deepseek-balance`.
   Sin el rail no se puede centrar un grupo de pills independientes: cada plugin solo puede
   centrarse a sí mismo y se pisan.
3. **Idioma**: runtime EN (como la familia) + diccionario ES en el cliente; `meta` en `en.json`/`es.json`.
4. **Nombre (confirmado)**: `@jamolpe88/dsh-deepseek-peakoffpeak` (id `deepseek-peakoffpeak`,
   título «DeepSeek rate clock» / «Reloj de tarifas DeepSeek»).
5. **Sin configuración** (`Config` ausente), igual que las otras dos pills. Si algún agregador
   usa un alias sin «deepseek» en id/nombre/provider, se añadiría después una lista de extras.

## 4. Arquitectura

### 4.1 Paquete nuevo `@jamolpe88/dsh-deepseek-peakoffpeak`

```
package.json          # dsh.bundle.patch + dsh.client { platform: web, immediately, inject: [ui-conversation] }
cordis.patch.yml      # - insert: [{ id: deepseek-peakoffpeak, name: '@jamolpe88/dsh-deepseek-peakoffpeak' }]
index.js              # host half vacío: export function apply() {}
client.js             # TODO el cliente (datos, cálculo, pill, panel, CSS, logo inline)
icon.svg              # 128×128 tile + ballena + dial 24 h
locale/en.json        # meta.title / meta.description
locale/es.json
README.md / README.es.md / CHANGELOG.md / LICENSE / NOTICE
test/tariff.test.js   # node --test con stub de __ModuleLoader__
docs/plans/...
```

Sin rutas ni host: todo es cálculo local (hora del usuario + tabla estática), así que no hay
API, claves ni caché. El `index.js` existe solo porque el bundle necesita una fila de host.

### 4.2 Un solo `client.js` (restricción del module loader)

`client.js` no puede importar archivos locales: se carga con
`window.__ModuleLoader__.load({ id, factory })` y `require` solo resuelve la tabla del navegador
(`react`, `react-dom`, `@deepseek-ai/cordis`). Por eso toda la lógica va en `client.js`.

Para poder testear la lógica de tiempo/dinero sin duplicarla, el factory devuelve además
`__test: { isPeak, nextChange, segments, dayBounds, ratio, isDeepSeekSelection, PRICES }`.
El test carga el archivo en Node con `window.__ModuleLoader__` y `require` simulados.
Coste: un export extra con prefijo `__`; cero coste en runtime.

Funciones puras (dentro de `client.js`):

```js
const PEAK_WINDOWS = [[1, 4], [6, 10]]           // horas UTC, lun–vie
const PRICES = [/* flash y pro, 3 filas × off/peak */]
function isPeak(date: Date): boolean
function nextChange(date: Date): Date
function dayBounds(date: Date): { start: Date, end: Date }   // día local 00:00 → 24:00
function segments(start: Date, end: Date): Array<{ start, end, band: 'peak'|'off-peak' }>
function ratio(date: Date, start: Date, end: Date): number   // 0..1
function localWindowLabels(date: Date, locale: string): string  // "02:00–05:00 y 07:00–11:00 · lun–vie"
function isDeepSeekSelection(selection, groups): boolean
```

Detección DeepSeek (provider-agnóstico):

```js
// selection = { provider, model } de modelSelection o del directory store
// groups   = directory.store.getSnapshot().groups (para el nombre visible del modelo)
const name = groups.flatMap(g => g.models).find(m => m.id === selection.model)?.name
return /deepseek/i.test(selection.provider)
    || /deepseek/i.test(selection.model)
    || /deepseek/i.test(name ?? '')
```

Si no hay selección (sesión en blanco), se usa el `current` del directorio, como ya hace
`dsh-opencodego-usage`, para no parpadear.

### 4.3 Coexistencia: convención de grupo centrado (implementada)

Decisión validada: **sin paquete nuevo**. Las tres pills comparten una convención DOM mínima y
cada una calcula el grupo desde los marcadores, así que funciona con 1, 2, 3 o N pills y no hace
falta instalar nada extra.

- Cada ancla lleva `data-dsh-center-pill="<id>"` y `data-dsh-center-pill-order="<n>"`.
- Cada pill incluye el hook `useCenterPills(anchorRef)` (idéntico en los tres plugins). Mide los
  anclas visibles del mismo *host* (su `offsetParent`, la tarjeta del composer), las ordena, suma
  anchos + hueco de 6 px y escribe `--dsh-pill-shift` en su propio ancla.
- CSS de cada ancla:
  `transform: translateX(calc(-50% + var(--dsh-pill-shift, 0px)))`, con `transition` de 180 ms.
- Si el grupo no cabe (`total > host.clientWidth − 24`) todas se ocultan a la vez con
  `data-dsh-pill-hidden` (`visibility:hidden`); al volver a caber reaparecen.
- Reactividad: `ResizeObserver` sobre host + cada ancla (cambios de ancho, p. ej. `Peak` vs
  `Off-peak`), `MutationObserver` en el host (alta/baja de pills) y `resize` de ventana.
- Orden visual: `deepseek-peakoffpeak` (20) · `opencodego-usage` (21) · `deepseek-balance` (22).

Esto sustituye al rail con servicio: menos piezas, sin dependencias entre plugins y sin tocar el
sistema de slots. Cada plugin sigue siendo autónomo; si solo hay una pill, `--dsh-pill-shift` vale
`0px` y recupera el centro exacto.

Limitación: el umbral de ocultación usa el ancho de la tarjeta, no el hueco libre entre los
controles laterales; si a anchos intermedios el grupo se solapa con el selector de modelo, se
ajusta el umbral (constante `CENTER_MARGIN`) o se mide el hueco real.

## 5. Especificación UI

### 5.1 Pill (idéntica métrica a la referencia)

- Alto `calc(28px + var(--dsh-content-font-delta, 0px))`; padding `1px 4px`; radius
  `--dsw-radius-sm`; sin fondo; texto `--dsw-alias-label-tertiary`; hover
  `--dsw-alias-interactive-bg-hover`; focus ring del tema; visible solo con modelo DeepSeek.
- Contenido: logo 16×16 → columna de **112 px**:
  - línea superior centrada sobre la barra: `Peak` / `Off-peak` (11 px, peso 500, color de
    franja) + contador entre paréntesis `(2h 14m)` (11 px, tono terciario);
  - barra **115×4 px**, track `--dsw-alias-interactive-bg-hover`, tramos del día local y marca
    de ahora (línea de 1 px con glow).
- `aria-label="DeepSeek tariffs: off-peak, ends in 2h 14m"`, `title` con el mismo texto.
- Tick de 1 s solo mientras la pill está montada.

### 5.2 Panel (mismo material y medidas que la referencia)

- `position:fixed` + portal, ancho **`min(264px, 100vw − 24px)`** (el de `opencodego-usage`),
  `--dsw-specific-menu`, `--dsw-elevation-prominent`, `--dsw-radius-lg`, padding 12 px, 12/20 px,
  `cursor:default`; encima del ancla, clamp al viewport, fallback debajo; cierra con Escape/click
  fuera; tick de 1 s. Sin scroll en pantallas normales (`max-height` alto, sólo como red de
  seguridad).
- Orden del contenido (simplificado, sin secciones repetidas):
  1. **Cabecera**: logo 16 + «DeepSeek rate clock».
  2. **Ahora**: `Off-peak` grande con el color de la franja + nota `Half price` / `Full price`;
     cuenta atrás `02:14:08`; hora actual y zona (`Europe/Madrid · UTC+01:00`).
  3. **Barra 24 h**: 00:00 → 24:00, tramos con hora de inicio y etiqueta (ocultas si < 7,5 %),
     marca de ahora + línea de progreso, `aria-label` con el resumen del día.
  4. **Precios**: título «USD per 1M tokens»; dos bloques (V4.1 Flash / V4 Pro), cada uno con
     `<table>` de 3 filas (sin caché, con caché, salida) × 2 columnas (Off-peak, Peak).
     La columna activa se tiñe con el color de la franja (verde off-peak / cálido peak) y la
     cabecera toma ese color, como la web de referencia. Precios con 3 decimales si hace falta.
  5. **Pie**: enlace «Official prices» → `https://api-docs.deepseek.com/quick_start/pricing`,
     `Data as of 23 Oct 2026`, `Chinese public holidays are not excluded`.
- Tokens del tema para todo; los únicos literales son los colores de franja y el arte del logo.

### 5.3 Logo / icono

`icon.svg` 128×128 (misma composición que el logo inline a 16 px):

- **Ballena de DeepSeek** (path oficial, color primario del tema) arriba a la izquierda.
- **Reloj** superpuesto abajo a la derecha: esfera oscura de 6,8 px (a 16 px) con aro azul,
  4 marcas, agujas a las 10:10 y punto central en blanco.
- En el icono: tile redondeado (r≈28) `#0E1116` con borde sutil y la misma composición.
- `NOTICE`: marca de DeepSeek usada como referencia de producto; no se reclama titularidad.

## 6. Archivos y tareas

> Orden pensado para que cada tarea deje algo verificable. Commits pequeños.

### Tarea 1 — Esqueleto instalable
- Crear `package.json`, `cordis.patch.yml`, `index.js`, `locale/{en,es}.json`, `icon.svg` (v1),
  `client.js` mínimo que registra una pill de texto «Peak» con el logo y se oculta si el modelo
  no es DeepSeek.
- Test: `node --check index.js client.js`; instalar con `plugin_manager install_bundle`
  (target = carpeta del workspace); verificar fila + metadatos + icono en Plugins; comprobar con
  `cordis_inspect_query` (`Slots.listSubTree` root `conversation.input.left`) que el ocupante
  `deepseek-peakoffpeak` existe; refrescar la GUI y ver la pill solo con modelo DeepSeek.
- Commit: `feat: scaffold deepseek tariffs pill`.

### Tarea 2 — Núcleo de tarifas + tests
- Implementar `PEAK_WINDOWS`, `PRICES`, `isPeak`, `nextChange`, `dayBounds`, `segments`, `ratio`,
  `isDeepSeekSelection`, formateadores (`Intl`, locale del navegador) y `__test`.
- `test/tariff.test.js` con stub de `window.__ModuleLoader__` y `require`:
  - bordes UTC lun 00:59/01:00/03:59/04:00/05:59/06:00/09:59/10:00;
  - sábado/domingo en horas peak → off-peak; viernes 09:59 peak → 10:00 off-peak;
  - `nextChange` desde viernes 11:00 → lunes 01:00; desde 02:00 → 04:00;
  - `segments` de un día normal: suma de duraciones = 24 h y bandas correctas;
  - día DST (Europe/Madrid 2026-03-29 y 2026-10-25): suma = 23 h / 25 h, sin huecos;
  - `isDeepSeekSelection`: `deepseek-flash`/`deepseek-official`/`opencode-go`+`deepseek-v4-pro`/
    `openrouter`+`deepseek/deepseek-v4` → true; `glm-4.6`/`kimi-k2` → false;
  - `PRICES` coincide con la tabla oficial.
- `node --test`. Commit: `feat: tariff windows and prices with tests`.

### Tarea 3 — Pill animada
- Logo inline, etiqueta de franja, `MiniBar` con tramos + marca, tick 1 s, memo por día,
  aria/title, hover/focus, alta/baja al cambiar de modelo.
- Verificación: métricas (28 px de alto, 16 px logo, 64×4 barra) contra la pill de referencia;
  cambio de modelo en la GUI oculta/muestra; cambio de hora forzado en test (no en runtime).
- Commit: `feat: live 24h pill`.

### Tarea 4 — Panel
- `useAnchoredPanel` + `useDismiss` (adaptados de la referencia), portal, cabecera, estado,
  cuenta atrás, ventanas locales, barra 24 h con etiquetas, próximos cambios, tablas de precios,
  pie con fuente/fecha.
- Verificación: abrir/cerrar, Escape, click fuera, clamp en bordes y a 768 px de ancho,
  dark/light, sin salto de layout al abrir.
- Commit: `feat: details panel with prices`.

### Tarea 5 — Coexistencia (convención de grupo centrado)
- Hook `useCenterPills` idéntico en los tres plugins + atributos `data-dsh-center-pill` /
  `-order`; órdenes 20/21/22 (peakoffpeak, usage, balance); ocultación conjunta si no cabe.
- Verificación: tres pills visibles a la vez con un modelo DeepSeek vía `opencode-go` +
  provider DeepSeek; centradas y en orden; se ocultan al estrechar; cada panel sigue funcionando.

### Tarea 6 — Documentación y cierre
- README/README.es (qué hace, captura, fuente, límites: festivos chinos), CHANGELOG 0.1.0,
  NOTICE, `files` del `package.json`, `npm test` + `node --check`, revisión de `icon.svg` renderizado
  a 16/128 px.
- Verificación final en la GUI real (`http://127.0.0.1:49974`) y reporte de lo verificado vs. no verificable.

## 7. Verificación

- Unitarios: `node --test` (Tarea 2) — es el check que falla si la lógica de ventanas/precios rompe.
- Sintaxis: `node --check index.js client.js`.
- Instalación: `plugin_manager install_bundle` (aplicación en vivo), `Slots` occupant, metadatos/icono
  en Plugins, página refrescada.
- Visual: la pill con 28 px y la barra alineada a la referencia; panel sin desbordes; tres pills
  centradas tras la Tarea 5. Sin control de navegador, la comprobación visual final la confirmas tú;
  yo verifico estructura, ocupantes y recursos.
- Sin red en runtime: la fuente son constantes + enlace.

## 8. Riesgos / límites

- **Festivos chinos**: no se descuentan (igual que la web de referencia); se declara en el pie.
- **Precios estáticos**: si DeepSeek cambia tarifas, hay que publicar versión (fecha «Data as of» visible).
- **Alias de modelo**: un agregador con id sin «deepseek» y nombre sin «DeepSeek» no lo detectaría;
  se resuelve después con una lista de patrones si aparece.
- **Coexistencia** depende de instalar el rail y migrar las otras dos pills; sin eso, el plugin nuevo
  funciona solo pero se pisa con las existentes.
- **Logo a 16 px**: la ballena + anillo es el límite de legibilidad; si no convence, se simplifica a
  anillo + ballena sin ticks.

## 9. Preguntas abiertas

1. **Alcance de la coexistencia**: opción A (rail + migrar las dos), B (rail que adopta las viejas)
   o C (solo el plugin nuevo). Ver §4.3.
