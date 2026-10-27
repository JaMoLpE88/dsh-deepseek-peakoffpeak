/**
 * dsh-deepseek-peakoffpeak browser half.
 *
 * Registers one compact pill in the composer tool row while the selected model
 * is a DeepSeek one, whatever provider serves it. The pill carries a live 24 h
 * tariff bar (peak / off-peak in the user's local day) and opens a DSH-style
 * panel with the local windows, the countdown, the next changes and the
 * official price table.
 *
 * The pill joins the shared centered group used by the other JaMoLpE88
 * composer pills: every participant marks its anchor with
 * `data-dsh-center-pill` and `data-dsh-center-pill-order`, and each one
 * computes the group's centered layout from those anchors. No plugin needs to
 * know the others, and any number of pills can join.
 *
 * @module dsh-deepseek-peakoffpeak/client
 */

window.__ModuleLoader__.load({
  id: '@jamolpe88/dsh-deepseek-peakoffpeak',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    let createPortal = null
    try {
      createPortal = require('react-dom').createPortal
    } catch {
      // A fixed-position panel still works without a portal in this shell.
    }

    // -----------------------------------------------------------------------
    // Copy
    // -----------------------------------------------------------------------

    const NS = 'deepseek-peakoffpeak'
    const PILL_ID = 'deepseek-peakoffpeak'
    const PILL_ORDER = 20

    const en = {
      'panelTitle': 'DeepSeek rate clock',
      'band.peak': 'Peak',
      'band.offpeak': 'Off-peak',
      'note.peak': 'Full price',
      'note.offpeak': 'Half price',
      'countdown.peak': 'Peak ends in',
      'countdown.offpeak': 'Off-peak ends in',
      'timeline.title': 'Today, 24 h',
      'timeline.range': '00:00 → 24:00',
      'prices.title': 'USD per 1M tokens',
      'price.flash': 'V4.1 Flash',
      'price.pro': 'V4 Pro',
      'price.inputMiss': 'Input, no cache',
      'price.inputHit': 'Input, cached',
      'price.output': 'Output',
      'footer.source': 'Official prices',
      'footer.data': 'Data as of {date}',
      'footer.holidays': 'Chinese public holidays are not excluded.',
      'zone': '{tz} · UTC{offset}',
      'pill.aria': 'DeepSeek tariffs: {band}, ends in {remaining}',
      'band.day': '{start}–{end} {band}',
    }

    const es = {
      'panelTitle': 'Reloj de tarifas DeepSeek',
      'band.peak': 'Peak',
      'band.offpeak': 'Off-peak',
      'note.peak': 'Precio completo',
      'note.offpeak': 'Mitad de precio',
      'countdown.peak': 'El peak termina en',
      'countdown.offpeak': 'El off-peak termina en',
      'timeline.title': '24 horas de hoy',
      'timeline.range': '00:00 → 24:00',
      'prices.title': 'USD por 1M de tokens',
      'price.flash': 'V4.1 Flash',
      'price.pro': 'V4 Pro',
      'price.inputMiss': 'Entrada sin caché',
      'price.inputHit': 'Entrada con caché',
      'price.output': 'Salida',
      'footer.source': 'Precios oficiales',
      'footer.data': 'Datos del {date}',
      'footer.holidays': 'Los festivos chinos no se descuentan.',
      'zone': '{tz} · UTC{offset}',
      'pill.aria': 'Tarifas DeepSeek: {band}, quedan {remaining}',
      'band.day': '{start}–{end} {band}',
    }

    /** @param {string} key @param {Record<string, unknown>} [vars] @returns {string} */
    function fallbackT(key, vars) {
      let text = en[key] ?? key
      if (vars !== undefined) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.split(`{${name}}`).join(String(value))
        }
      }
      return text
    }

    /** @param {{ t?: (key: string, vars?: Record<string, unknown>) => string }} props */
    function translate(props) {
      return typeof props.t === 'function' ? props.t : fallbackT
    }

    // -----------------------------------------------------------------------
    // Tariff data (official, https://api-docs.deepseek.com/quick_start/pricing)
    // -----------------------------------------------------------------------

    /** Peak windows in UTC hours, Monday through Friday. */
    const PEAK_WINDOWS = [[1, 4], [6, 10]]
    const DATA_AS_OF = '23 Oct 2026'
    const SOURCE_URL = 'https://api-docs.deepseek.com/quick_start/pricing'

    const PRICE_MODELS = [
      {
        id: 'deepseek-flash',
        nameKey: 'price.flash',
        rows: [
          { key: 'price.inputMiss', off: 0.15, peak: 0.3 },
          { key: 'price.inputHit', off: 0.003, peak: 0.006 },
          { key: 'price.output', off: 0.6, peak: 1.2 },
        ],
      },
      {
        id: 'deepseek-v4-pro',
        nameKey: 'price.pro',
        rows: [
          { key: 'price.inputMiss', off: 0.66, peak: 1.32 },
          { key: 'price.inputHit', off: 0.022, peak: 0.044 },
          { key: 'price.output', off: 1.98, peak: 3.96 },
        ],
      },
    ]

    /** @param {Date} date @returns {boolean} */
    function isPeak(date) {
      const weekday = date.getUTCDay()
      if (weekday === 0 || weekday === 6) return false
      const minutes = date.getUTCHours() * 60 + date.getUTCMinutes()
      return PEAK_WINDOWS.some(([start, end]) => minutes >= start * 60 && minutes < end * 60)
    }

    /** @param {Date} date @returns {Date} */
    function nextChange(date) {
      const from = date.getTime()
      const cursor = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
      cursor.setUTCDate(cursor.getUTCDate() - 1)
      let best
      for (let index = 0; index < 11; index += 1) {
        const weekday = cursor.getUTCDay()
        if (weekday >= 1 && weekday <= 5) {
          for (const [start, end] of PEAK_WINDOWS) {
            for (const hour of [start, end]) {
              const at = Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), hour)
              if (at > from && (best === undefined || at < best)) best = at
            }
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
      // The search window always contains one: peak repeats every weekday.
      return new Date(best)
    }

    /** Local day bounds for the bar: 00:00 today to 00:00 tomorrow. */
    function dayBounds(date) {
      return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      }
    }

    /** Split [start, end] at every peak boundary; width follows real duration. */
    function segments(start, end) {
      const from = start.getTime()
      const to = end.getTime()
      const cuts = [from, to]
      const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
      cursor.setUTCDate(cursor.getUTCDate() - 1)
      while (cursor.getTime() <= to) {
        const weekday = cursor.getUTCDay()
        if (weekday >= 1 && weekday <= 5) {
          for (const [windowStart, windowEnd] of PEAK_WINDOWS) {
            for (const hour of [windowStart, windowEnd]) {
              const at = Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), hour)
              if (at > from && at < to) cuts.push(at)
            }
          }
        }
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      }
      cuts.sort((left, right) => left - right)
      const unique = Array.from(new Set(cuts))
      const result = []
      for (let index = 0; index < unique.length - 1; index += 1) {
        const segmentStart = new Date(unique[index])
        result.push({
          start: segmentStart,
          end: new Date(unique[index + 1]),
          band: isPeak(segmentStart) ? 'peak' : 'off-peak',
        })
      }
      return result
    }

    /** @param {Date} date @param {Date} start @param {Date} end @returns {number} */
    function ratio(date, start, end) {
      const span = end.getTime() - start.getTime()
      if (span <= 0) return 0
      return Math.min(1, Math.max(0, (date.getTime() - start.getTime()) / span))
    }

    /**
     * Is the selected model a DeepSeek one, regardless of the provider?
     * @param {{ provider?: string, model?: string } | undefined} selection
     * @param {Array<{ id: string, models?: Array<{ id: string, name?: string }> }>} [groups]
     * @returns {boolean}
     */
    function isDeepSeekSelection(selection, groups) {
      if (selection === undefined || selection === null) return false
      const provider = typeof selection.provider === 'string' ? selection.provider : ''
      const model = typeof selection.model === 'string' ? selection.model : ''
      let name = ''
      for (const group of groups ?? []) {
        if (group.id !== selection.provider) continue
        const found = (group.models ?? []).find((entry) => entry.id === selection.model)
        if (found !== undefined) name = found.name ?? ''
      }
      return /deepseek/i.test(provider) || /deepseek/i.test(model) || /deepseek/i.test(name)
    }

    // -----------------------------------------------------------------------
    // Formatting
    // -----------------------------------------------------------------------

    const CLOCK = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    const CLOCK_SECONDS = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    const MONEY = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    })

    /** @param {number} ms @returns {string} */
    function formatDuration(ms) {
      const total = Math.max(0, Math.floor(ms / 1000))
      const days = Math.floor(total / 86_400)
      const hours = Math.floor((total % 86_400) / 3_600)
      const minutes = Math.floor((total % 3_600) / 60)
      const seconds = total % 60
      const clock = [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
      return days > 0 ? `${days} d ${clock}` : clock
    }

    /** @param {number} minutes @returns {string} */
    function formatOffset(minutes) {
      const sign = minutes >= 0 ? '+' : '−'
      const absolute = Math.abs(minutes)
      return `${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`
    }

    /** Compact remaining time for the pill: 1d 2h / 2h 14m / 14m / 45s. */
    function formatShort(ms) {
      const total = Math.max(0, Math.floor(ms / 1000))
      const days = Math.floor(total / 86_400)
      const hours = Math.floor((total % 86_400) / 3_600)
      const minutes = Math.floor((total % 3_600) / 60)
      if (days > 0) return `${days}d ${hours}h`
      if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
      if (minutes > 0) return `${minutes}m`
      return `${total}s`
    }

    /** @param {'peak' | 'off-peak'} band @param {(key: string) => string} t */
    function bandName(band, t) {
      return band === 'peak' ? t('band.peak') : t('band.offpeak')
    }

    // -----------------------------------------------------------------------
    // Selection hooks
    // -----------------------------------------------------------------------

    /** @param {{ useProjection?: Function }} props */
    function useProjectedSelection(props) {
      const read = (value) => value?.next ?? value?.lastUsed
      const provider = typeof props.useProjection === 'function'
        ? props.useProjection('modelSelection', (value) => read(value)?.provider)
        : undefined
      const model = typeof props.useProjection === 'function'
        ? props.useProjection('modelSelection', (value) => read(value)?.model)
        : undefined
      return React.useMemo(
        () => (provider === undefined && model === undefined ? undefined : { provider, model }),
        [provider, model],
      )
    }

    /**
     * The composer's displayed selection: the directory's current model (the
     * same one the model seat shows), including the catalog groups so the
     * DeepSeek match can use the display name.
     * @param {unknown} models the modelDirectories service, when present
     * @param {string | undefined} sessionId
     */
    function useCatalogSelection(models, sessionId) {
      const [state, setState] = React.useState({ selection: undefined, groups: [] })
      React.useEffect(() => {
        setState({ selection: undefined, groups: [] })
        if (models === undefined || sessionId === undefined) return undefined
        let store
        try {
          store = models.directoryFor(sessionId).store
        } catch {
          return undefined
        }
        const read = () => {
          const snapshot = store.getSnapshot?.()
          const current = snapshot?.current
          const selection = current === null || current === undefined
            ? undefined
            : { provider: current.provider, model: current.model }
          const groups = snapshot?.groups ?? []
          setState((previous) => (
            previous.selection?.provider === selection?.provider
            && previous.selection?.model === selection?.model
            && previous.groups === groups
              ? previous
              : { selection, groups }
          ))
        }
        read()
        return store.subscribe(read)
      }, [models, sessionId])
      return state
    }

    /** @param {{ models?: unknown, sessionId?: string, useProjection?: Function }} props */
    function useDeepSeekSelection(props) {
      const catalog = useCatalogSelection(props.models, props.sessionId)
      const projected = useProjectedSelection(props)
      const selection = catalog.selection ?? projected
      return {
        selection,
        active: isDeepSeekSelection(selection, catalog.groups),
      }
    }

    // -----------------------------------------------------------------------
    // Small hooks
    // -----------------------------------------------------------------------

    const MEASURE_STYLE = { position: 'fixed', left: 0, top: 0, visibility: 'hidden' }

    /** @param {boolean} open */
    function useAnchoredPanel(open) {
      const anchorRef = React.useRef(null)
      const panelRef = React.useRef(null)
      const [pos, setPos] = React.useState(null)

      React.useLayoutEffect(() => {
        if (!open) {
          setPos(null)
          return undefined
        }
        let frame = 0
        let observer = null
        const place = () => {
          const anchor = anchorRef.current
          const panel = panelRef.current
          if (anchor === null) return
          const rect = anchor.getBoundingClientRect()
          const panelRect = panel?.getBoundingClientRect()
          const width = panelRect?.width || 300
          const height = panelRect?.height || 0
          const margin = 12
          const gap = 8
          let left = rect.left + rect.width / 2 - width / 2
          left = Math.max(margin, Math.min(left, window.innerWidth - width - margin))
          let top = rect.top - height - gap
          if (top < margin) top = rect.bottom + gap
          top = Math.max(margin, Math.min(top, window.innerHeight - height - margin))
          setPos({ left, top })
        }
        frame = window.requestAnimationFrame(place)
        if (typeof ResizeObserver === 'function' && panelRef.current !== null) {
          observer = new ResizeObserver(place)
          observer.observe(panelRef.current)
        }
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)
        return () => {
          window.cancelAnimationFrame(frame)
          observer?.disconnect()
          window.removeEventListener('resize', place)
          window.removeEventListener('scroll', place, true)
        }
      }, [open])

      return { anchorRef, panelRef, pos }
    }

    /** Close on Escape or a pointer press outside both trigger and panel. */
    function useDismiss(open, setOpen, anchorRef, panelRef) {
      React.useEffect(() => {
        if (!open) return undefined
        const onPointerDown = (event) => {
          const target = event.target
          if (!(target instanceof Node)) return
          if (anchorRef.current?.contains(target) === true) return
          if (panelRef.current?.contains(target) === true) return
          setOpen(false)
        }
        const onKeyDown = (event) => {
          if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown, true)
        window.addEventListener('keydown', onKeyDown, true)
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true)
          window.removeEventListener('keydown', onKeyDown, true)
        }
      }, [open, setOpen, anchorRef, panelRef])
    }

    /** A one-second tick while the pill is visible. */
    function useNow(active) {
      const [now, setNow] = React.useState(() => Date.now())
      React.useEffect(() => {
        if (!active) return undefined
        setNow(Date.now())
        const id = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(id)
      }, [active])
      return now
    }

    // -----------------------------------------------------------------------
    // Centered pill group (shared convention between the JaMoLpE88 pills)
    // -----------------------------------------------------------------------

    const CENTER_ATTR = 'data-dsh-center-pill'
    const CENTER_ORDER_ATTR = 'data-dsh-center-pill-order'
    const CENTER_GAP = 6
    const CENTER_MARGIN = 24

    /**
     * Center every composer pill of the same host as one group. Each pill is
     * absolutely positioned at 50%; this hook measures the visible siblings,
     * sorts them by `data-dsh-center-pill-order`, and offsets its own anchor so
     * the group stays centered with a small gap. It hides the group when it no
     * longer fits, and re-runs when a pill mounts, unmounts or changes width.
     *
     * @param {{ current: HTMLElement | null }} ref
     */
    function useCenterPills(ref) {
      React.useLayoutEffect(() => {
        const self = ref.current
        if (self === null) return undefined
        const host = self.offsetParent
        if (host === null) return undefined
        let frame = 0
        let resize = null

        const collect = () => Array.from(host.querySelectorAll(`[${CENTER_ATTR}]`))
          .filter((element) => element.offsetWidth > 0)
          .sort((left, right) => {
            const delta = Number(left.getAttribute(CENTER_ORDER_ATTR) ?? 0)
              - Number(right.getAttribute(CENTER_ORDER_ATTR) ?? 0)
            if (delta !== 0) return delta
            return (left.getAttribute(CENTER_ATTR) ?? '').localeCompare(right.getAttribute(CENTER_ATTR) ?? '')
          })

        const place = () => {
          frame = 0
          const pills = collect()
          const index = pills.indexOf(self)
          if (index < 0) return
          const widths = pills.map((element) => element.offsetWidth)
          const total = widths.reduce((sum, width) => sum + width, 0) + CENTER_GAP * (pills.length - 1)
          let before = 0
          for (let cursor = 0; cursor < index; cursor += 1) before += widths[cursor] + CENTER_GAP
          self.style.setProperty('--dsh-pill-shift', `${-total / 2 + before + widths[index] / 2}px`)
          const hidden = total > host.clientWidth - CENTER_MARGIN
          for (const element of pills) {
            if (hidden) element.setAttribute('data-dsh-pill-hidden', '')
            else element.removeAttribute('data-dsh-pill-hidden')
          }
        }

        const schedule = () => {
          if (frame !== 0) return
          frame = window.requestAnimationFrame(place)
        }

        const watch = () => {
          resize?.disconnect()
          resize = new ResizeObserver(schedule)
          resize.observe(host)
          for (const element of collect()) resize.observe(element)
        }

        const mutations = new MutationObserver((records) => {
          let relevant = false
          for (const record of records) {
            for (const node of [...record.addedNodes, ...record.removedNodes]) {
              if (node.nodeType !== 1) continue
              if (node.matches(`[${CENTER_ATTR}]`) || node.querySelector(`[${CENTER_ATTR}]`) !== null) {
                relevant = true
                break
              }
            }
            if (relevant) break
          }
          if (!relevant) return
          watch()
          schedule()
        })

        mutations.observe(host, { childList: true, subtree: true })
        watch()
        place()
        window.addEventListener('resize', schedule)
        return () => {
          window.cancelAnimationFrame(frame)
          window.removeEventListener('resize', schedule)
          mutations.disconnect()
          resize?.disconnect()
          self.style.removeProperty('--dsh-pill-shift')
        }
      }, [ref])
    }

    // -----------------------------------------------------------------------
    // Icons
    // -----------------------------------------------------------------------

    // Official DeepSeek mark (viewBox "0.163 1.75 26.634 19.6").
    const DEEPSEEK_PATH = 'M26.5174 3.39471C26.235 3.2567 26.1137 3.52006 25.9487 3.65346C25.8923 3.69659 25.8446 3.75294 25.7969 3.80469C25.3846 4.24516 24.9027 4.53439 24.2737 4.49989C23.3536 4.44814 22.5682 4.73737 21.8735 5.44119C21.7258 4.57349 21.2353 4.0554 20.4889 3.72304C20.0985 3.55054 19.7034 3.37746 19.4297 3.00197C19.2388 2.73459 19.1865 2.43673 19.091 2.14289C19.0301 1.96579 18.9697 1.78466 18.7656 1.75418C18.5442 1.71968 18.4574 1.90541 18.3705 2.06067C18.0232 2.69549 17.8887 3.39471 17.9019 4.10313C17.9324 5.6965 18.6051 6.96556 19.9421 7.86834C20.0939 7.97184 20.133 8.07535 20.0852 8.22658C19.9938 8.53766 19.8857 8.83955 19.7903 9.15063C19.7293 9.34901 19.6384 9.39271 19.4257 9.30588C18.692 8.9994 18.0583 8.54571 17.4982 7.99772C16.5477 7.07827 15.6881 6.06336 14.6162 5.26869C14.3644 5.08296 14.1125 4.91045 13.8521 4.746C12.7584 3.68394 13.9952 2.81164 14.2816 2.70814C14.5812 2.60003 14.3857 2.22857 13.4179 2.23317C12.4502 2.2372 11.5646 2.56151 10.4359 2.99335C10.2708 3.05832 10.0972 3.10547 9.91951 3.14457C8.8954 2.95022 7.83162 2.90709 6.72069 3.03245C4.62877 3.26533 2.95777 4.25436 1.72954 5.94261C0.254043 7.97184 -0.0932678 10.2777 0.33167 12.6824C0.778458 15.2171 2.07225 17.3153 4.06008 18.9558C6.12152 20.6567 8.49577 21.4905 11.2047 21.3306C12.8498 21.2358 14.6812 21.0155 16.7473 19.2669C17.2682 19.5262 17.8151 19.6297 18.7219 19.7074C19.4205 19.7723 20.0933 19.6729 20.6143 19.5648C21.4302 19.3923 21.3739 18.6367 21.0789 18.4981C18.6874 17.3843 19.2124 17.8374 18.7351 17.4706C19.9501 16.033 21.8063 13.4776 22.379 9.99821C22.4353 9.61409 22.5072 9.073 22.4986 8.76192C22.494 8.57216 22.5377 8.49856 22.7545 8.47671C23.3536 8.40771 23.935 8.24383 24.4692 7.94999C26.0188 7.10357 26.6439 5.71318 26.7911 4.04678C26.8129 3.79204 26.7865 3.52869 26.5174 3.39471ZM13.0143 18.3946C10.6964 16.5724 9.5722 15.9726 9.10816 15.9985C8.67402 16.0244 8.75222 16.5212 8.84768 16.8449C8.94773 17.1646 9.07768 17.3849 9.25996 17.6655C9.38589 17.8512 9.47272 18.1272 9.13404 18.3348C8.38766 18.7965 7.08985 18.1796 7.0289 18.1491C5.51833 17.2595 4.25559 16.0853 3.36546 14.4793C2.50581 12.9337 2.0067 11.2753 1.92447 9.50542C1.90262 9.07818 2.02855 8.92695 2.45406 8.84932C3.01413 8.74582 3.59144 8.72397 4.15093 8.80619C6.51656 9.15178 8.53027 10.2092 10.2185 11.8848C11.1822 12.8388 11.9114 13.979 12.6623 15.0929C13.461 16.2757 14.3201 17.4027 15.4144 18.3268C15.8008 18.6505 16.109 18.8966 16.404 19.0783C15.5144 19.1778 14.0297 19.1991 13.0143 18.3958V18.3946ZM14.1252 11.2489C14.1252 11.0591 14.277 10.9079 14.4679 10.9079C14.511 10.9079 14.5501 10.9165 14.5852 10.9292C14.6329 10.9464 14.6766 10.9723 14.7111 11.0114C14.7721 11.0718 14.8066 11.158 14.8066 11.2489C14.8066 11.4386 14.6548 11.5899 14.4639 11.5899C14.273 11.5899 14.1252 11.4386 14.1252 11.2489ZM17.5759 13.0188C17.3545 13.1096 17.1331 13.1873 16.9203 13.1959C16.5903 13.2131 16.2303 13.0791 16.0348 12.9153C15.7312 12.6605 15.5139 12.5179 15.423 12.0734C15.3839 11.8837 15.4057 11.5899 15.4402 11.4214C15.5185 11.0585 15.4316 10.8257 15.1757 10.614C14.9676 10.4415 14.7025 10.3938 14.4115 10.3938C14.3029 10.3938 14.2034 10.3461 14.1292 10.3076C14.0079 10.2472 13.9078 10.096 14.0033 9.91023C14.0338 9.84985 14.1815 9.70322 14.216 9.67734C14.6111 9.45251 15.0665 9.52612 15.488 9.6946C15.8784 9.85445 16.174 10.1477 16.5989 10.5623C17.033 11.0631 17.1112 11.2011 17.3585 11.5772C17.554 11.871 17.7317 12.1729 17.8536 12.5185C17.9272 12.7341 17.8317 12.9107 17.5759 13.0188Z'

    function LogoBadge({ size = 16 }) {
      return h('svg', {
        className: 'dptp-logo',
        width: size,
        height: size,
        viewBox: '0 0 32 32',
        'aria-hidden': true,
        focusable: false,
      },
      h('g', { transform: 'translate(0.31 -1.04) scale(1.164)' },
        h('path', { d: DEEPSEEK_PATH, fill: 'var(--dsw-alias-label-primary)' })),
      h('circle', {
        cx: 24.5,
        cy: 24.5,
        r: 6.8,
        fill: '#14161B',
        stroke: 'var(--dptp-clock, #5B7CFF)',
        strokeWidth: 2.2,
      }),
      h('path', {
        d: 'M24.5 18.8V19.9M30.2 24.5H29.1M24.5 30.2V29.1M18.8 24.5H19.9',
        fill: 'none',
        stroke: '#F4F2EC',
        strokeWidth: 1,
        strokeLinecap: 'round',
      }),
      h('path', {
        d: 'M24.5 24.5 21.78 23.14M24.5 24.5 28.72 19.88',
        fill: 'none',
        stroke: '#F4F2EC',
        strokeWidth: 1.9,
        strokeLinecap: 'round',
      }),
      h('circle', {
        cx: 24.5,
        cy: 24.5,
        r: 0.9,
        fill: '#F4F2EC',
      }))
    }

    // -----------------------------------------------------------------------
    // Pieces
    // -----------------------------------------------------------------------

    function MiniBar({ segments, now, start, end }) {
      const position = ratio(now, start, end)
      return h('span', { className: 'dptp-mini-frame', 'aria-hidden': true },
        h('span', { className: 'dptp-mini' },
          segments.map((segment, index) => h('span', {
            key: index,
            className: `dptp-mini-seg is-${segment.band}`,
            style: { flexGrow: segment.end.getTime() - segment.start.getTime() },
          }))),
        h('span', { className: 'dptp-mini-now', style: { left: `${position * 100}%` } }))
    }

    function DayBar({ segments, now, start, end, t }) {
      const position = ratio(now, start, end)
      const aria = segments.map((segment) => t('band.day', {
        start: CLOCK.format(segment.start),
        end: segment.end.getTime() === end.getTime() ? '24:00' : CLOCK.format(segment.end),
        band: bandName(segment.band, t),
      })).join('; ')
      return h('div', { className: 'dptp-bar-frame' },
        h('div', { className: 'dptp-bar', role: 'img', 'aria-label': aria },
          segments.map((segment) => h('div', {
            key: segment.start.getTime(),
            className: `dptp-seg is-${segment.band}`,
            style: { flexGrow: segment.end.getTime() - segment.start.getTime() },
          }))),
        h('span', { className: 'dptp-progress', style: { width: `${position * 100}%` } }),
        h('span', { className: 'dptp-marker', style: { left: `${position * 100}%` } }))
    }

    function PriceTable({ model, band, t }) {
      return h('article', { className: 'dptp-price' },
        h('header', { className: 'dptp-price-head' },
          h('h3', null, t(model.nameKey)),
          h('p', null, model.id)),
        h('table', null,
          h('thead', null,
            h('tr', null,
              h('th', { scope: 'col' }, ''),
              h('th', {
                scope: 'col',
                className: band === 'off-peak' ? 'is-now' : undefined,
              }, t('band.offpeak')),
              h('th', {
                scope: 'col',
                className: band === 'peak' ? 'is-now' : undefined,
              }, t('band.peak')))),
          h('tbody', null,
            model.rows.map((row) => h('tr', { key: row.key },
              h('th', { scope: 'row' }, t(row.key)),
              h('td', { className: band === 'off-peak' ? 'is-now' : undefined }, MONEY.format(row.off)),
              h('td', { className: band === 'peak' ? 'is-now' : undefined }, MONEY.format(row.peak)))))))
    }

    function Pill({ band, now, start, end, segments, t, open, onToggle, anchorRef }) {
      const change = nextChange(now)
      const remaining = Math.max(0, change.getTime() - now.getTime())
      const aria = t('pill.aria', { band: bandName(band, t), remaining: formatShort(remaining) })
      return h('span', {
        ref: anchorRef,
        className: 'dptp-anchor',
        'data-dptp-anchor': '',
        'data-dsh-center-pill': PILL_ID,
        'data-dsh-center-pill-order': String(PILL_ORDER),
      },
      h('button', {
        type: 'button',
        className: 'dptp-pill',
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-label': aria,
        title: aria,
        onClick: onToggle,
      },
      h(LogoBadge, { size: 16 }),
      h('span', { className: 'dptp-pill-body' },
        h('span', { className: 'dptp-pill-line' },
          h('span', { className: `dptp-pill-band is-${band}` }, bandName(band, t)),
          h('span', { className: 'dptp-pill-remaining' }, `(${formatShort(remaining)})`)),
        h(MiniBar, { segments, now, start, end }))))
    }

    function Panel({ now, band, change, dayStart, dayEnd, daySegments, t, panelRef, pos }) {
      const remaining = Math.max(0, change.getTime() - now.getTime())
      const zone = t('zone', {
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'local',
        offset: formatOffset(-now.getTimezoneOffset()),
      })
      return h('div', {
        ref: panelRef,
        className: 'dptp-panel',
        role: 'dialog',
        'aria-label': t('panelTitle'),
        'data-band': band,
        style: pos === null ? MEASURE_STYLE : { position: 'fixed', left: pos.left, top: pos.top },
      },
      h('div', { className: 'dptp-panel-head' },
        h('span', { className: 'dptp-panel-title' },
          h(LogoBadge, { size: 16 }),
          t('panelTitle'))),
      h('div', { className: 'dptp-rule', 'aria-hidden': true }),
      h('div', { className: 'dptp-status' },
        h('div', { className: 'dptp-status-main' },
          h('span', { className: `dptp-band is-${band}` }, bandName(band, t)),
          h('span', { className: 'dptp-note' }, band === 'peak' ? t('note.peak') : t('note.offpeak'))),
        h('div', { className: 'dptp-count' },
          h('span', { className: 'dptp-count-label' }, band === 'peak' ? t('countdown.peak') : t('countdown.offpeak')),
          h('span', { className: 'dptp-count-value' }, formatDuration(remaining)))),
      h('div', { className: 'dptp-clock' },
        h('span', { className: 'dptp-clock-time' }, CLOCK_SECONDS.format(now)),
        h('span', { className: 'dptp-clock-zone' }, zone)),
      h('div', { className: 'dptp-rule', 'aria-hidden': true }),
      h('div', { className: 'dptp-timeline' },
        h('div', { className: 'dptp-timeline-head' },
          h('span', { className: 'dptp-label' }, t('timeline.title')),
          h('span', { className: 'dptp-muted' }, t('timeline.range'))),
        h(DayBar, { segments: daySegments, now, start: dayStart, end: dayEnd, t })),
      h('div', { className: 'dptp-rule', 'aria-hidden': true }),
      h('div', { className: 'dptp-prices' },
        h('div', { className: 'dptp-prices-head' },
          h('span', { className: 'dptp-label' }, t('prices.title'))),
        PRICE_MODELS.map((model) => h(PriceTable, { key: model.id, model, band, t }))),
      h('div', { className: 'dptp-rule', 'aria-hidden': true }),
      h('div', { className: 'dptp-footer' },
        h('div', { className: 'dptp-footer-copy' },
          h('p', null, t('footer.data', { date: DATA_AS_OF })),
          h('p', null, t('footer.holidays'))),
        h('a', {
          className: 'dptp-source',
          href: SOURCE_URL,
          target: '_blank',
          rel: 'noreferrer noopener',
        }, t('footer.source'))))
    }

    /** The composer pill plus its portaled details dialog. */
    function PeakPill(props) {
      const t = translate(props)
      const { active } = useDeepSeekSelection(props)
      const [open, setOpen] = React.useState(false)
      const { anchorRef, panelRef, pos } = useAnchoredPanel(open)
      useDismiss(open, setOpen, anchorRef, panelRef)
      useCenterPills(anchorRef)
      const nowMs = useNow(active)
      const now = new Date(nowMs)

      React.useEffect(() => {
        if (!active) setOpen(false)
      }, [active])

      if (!active) return null

      const { start, end } = dayBounds(now)
      const daySegments = segments(start, end)
      const band = isPeak(now) ? 'peak' : 'off-peak'
      const change = nextChange(now)

      const panel = open
        ? h(Panel, {
            now,
            band,
            change,
            dayStart: start,
            dayEnd: end,
            daySegments,
            t,
            panelRef,
            pos,
          })
        : null

      const pill = h(Pill, {
        band,
        now,
        start,
        end,
        segments: daySegments,
        t,
        open,
        anchorRef,
        onToggle: () => setOpen((value) => !value),
      })

      return h(React.Fragment, null,
        pill,
        panel !== null && createPortal !== null ? createPortal(panel, document.body) : panel)
    }

    // -----------------------------------------------------------------------
    // Styles
    // -----------------------------------------------------------------------

    const CSS = `
      [data-dptp-anchor],
      .dptp-panel {
        --dptp-peak: #FF7A59;
        --dptp-off: #3EE6A8;
        --dptp-clock: #5B7CFF;
      }

      [data-dptp-anchor] {
        position: absolute;
        left: 50%;
        bottom: 8px;
        transform: translateX(calc(-50% + var(--dsh-pill-shift, 0px)));
        transition: transform .18s ease;
        z-index: 20;
        display: inline-flex;
        pointer-events: auto;
      }
      [data-dptp-anchor][data-dsh-pill-hidden] { visibility: hidden; pointer-events: none; }

      .dptp-logo { display: block; flex: none; overflow: visible; }

      .dptp-pill {
        height: calc(28px + var(--dsh-content-font-delta, 0px));
        border: 0;
        border-radius: var(--dsw-radius-sm);
        background: transparent;
        color: var(--dsw-alias-label-tertiary);
        font-family: inherit;
        font-size: calc(var(--dsh-content-font-size-secondary, 13px) - 2px);
        font-variant-numeric: tabular-nums;
        line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));
        white-space: nowrap;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 1px 5px 1px 4px;
      }
      .dptp-pill:hover,
      .dptp-pill[aria-expanded="true"] {
        background: var(--dsw-alias-interactive-bg-hover);
        color: var(--dsw-alias-label-secondary);
      }
      .dptp-pill:focus-visible {
        outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
        outline-offset: 1px;
      }

      .dptp-pill-body { display: flex; flex-direction: column; align-items: center; gap: 3px; }
      .dptp-pill-line { display: flex; align-items: baseline; justify-content: center; gap: 4px; line-height: 12px; width: 100%; }
      .dptp-pill-band {
        font-size: calc(var(--dsh-content-font-size-secondary, 13px) - 2px);
        line-height: 12px;
        font-weight: 500;
      }
      .dptp-pill-band.is-peak { color: color-mix(in srgb, var(--dptp-peak) 80%, var(--dsw-alias-label-primary)); }
      .dptp-pill-band.is-off-peak { color: color-mix(in srgb, var(--dptp-off) 62%, var(--dsw-alias-label-primary)); }
      .dptp-pill-remaining {
        font-size: calc(var(--dsh-content-font-size-secondary, 13px) - 2px);
        line-height: 12px;
        color: var(--dsw-alias-label-tertiary);
      }

      .dptp-mini-frame { position: relative; display: flex; width: 115px; height: 4px; }
      .dptp-mini {
        position: relative;
        display: flex;
        flex: 1;
        height: 100%;
        border-radius: 999px;
        overflow: hidden;
        background: var(--dsw-alias-interactive-bg-hover);
      }
      .dptp-mini-seg { height: 100%; }
      .dptp-mini-seg.is-peak { background: var(--dptp-peak); }
      .dptp-mini-seg.is-off-peak { background: var(--dptp-off); }
      .dptp-mini-now {
        position: absolute;
        top: -2px;
        bottom: -2px;
        width: 1.5px;
        margin-left: -.75px;
        border-radius: 1px;
        background: var(--dsw-alias-label-primary);
        box-shadow: 0 0 4px color-mix(in srgb, var(--dsw-alias-label-primary) 50%, transparent);
      }

      .dptp-panel {
        position: fixed;
        z-index: 1100;
        box-sizing: border-box;
        width: min(264px, 100vw - 24px);
        max-height: min(84vh, 620px);
        overflow-y: auto;
        border: 0;
        border-radius: var(--dsw-radius-lg);
        background: var(--dsw-specific-menu);
        backdrop-filter: var(--dsw-menu-backdrop-filter);
        --dsw-elevation-stroke-color: var(--dsw-alias-border-l1);
        box-shadow: var(--dsw-elevation-prominent);
        color: var(--dsw-alias-label-secondary);
        cursor: default;
        padding: 12px;
        font-size: 12px;
        line-height: 20px;
      }
      .dptp-panel[data-band="peak"] { --dptp-active: var(--dptp-peak); }
      .dptp-panel[data-band="off-peak"] { --dptp-active: var(--dptp-off); }

      .dptp-panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 6px;
        margin-bottom: 8px;
        color: var(--dsw-alias-label-primary);
        font-weight: 500;
      }
      .dptp-panel-title { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
      .dptp-rule { border-top: .5px solid var(--dsw-alias-border-l2); margin-bottom: 10px; }

      .dptp-status { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; }
      .dptp-status-main { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
      .dptp-band {
        font-size: 20px;
        line-height: 24px;
        font-weight: 500;
        letter-spacing: -.02em;
        color: var(--dptp-active);
      }
      .dptp-note { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 14px; }
      .dptp-count { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex: none; }
      .dptp-count-label {
        color: var(--dsw-alias-label-tertiary);
        font-size: 10px;
        line-height: 14px;
        text-align: right;
      }
      .dptp-count-value {
        color: var(--dsw-alias-label-primary);
        font-size: 13px;
        line-height: 18px;
        font-variant-numeric: tabular-nums;
      }

      .dptp-clock {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-top: 6px;
        color: var(--dsw-alias-label-tertiary);
        font-variant-numeric: tabular-nums;
      }
      .dptp-clock-time { color: var(--dsw-alias-label-secondary); font-size: 13px; }
      .dptp-clock-zone { font-size: 10px; line-height: 14px; text-align: right; }

      .dptp-label { color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }
      .dptp-muted { color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; opacity: .9; }
      .dptp-timeline-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 5px;
      }
      .dptp-bar-frame { position: relative; }
      .dptp-bar {
        display: flex;
        gap: 2px;
        height: 28px;
        border-block: .5px solid var(--dsw-alias-border-l2);
        position: relative;
        overflow: hidden;
        border-radius: 3px;
      }
      .dptp-seg {
        position: relative;
        flex-basis: 0;
        min-width: 0;
        border-top: 2px solid transparent;
        overflow: hidden;
      }
      .dptp-seg.is-off-peak {
        background: linear-gradient(color-mix(in srgb, var(--dptp-off) 16%, transparent), color-mix(in srgb, var(--dptp-off) 3%, transparent));
        border-top-color: color-mix(in srgb, var(--dptp-off) 55%, transparent);
      }
      .dptp-seg.is-peak {
        background: linear-gradient(color-mix(in srgb, var(--dptp-peak) 44%, transparent), color-mix(in srgb, var(--dptp-peak) 14%, transparent));
        border-top-color: var(--dptp-peak);
      }
      .dptp-progress {
        position: absolute;
        left: 0;
        bottom: 0;
        height: 2px;
        background: linear-gradient(90deg, color-mix(in srgb, var(--dsw-alias-label-primary) 12%, transparent), color-mix(in srgb, var(--dsw-alias-label-primary) 70%, transparent));
        pointer-events: none;
        z-index: 3;
      }
      .dptp-marker {
        position: absolute;
        top: -4px;
        bottom: -4px;
        width: 2px;
        margin-left: -1px;
        border-radius: 1px;
        background: var(--dsw-alias-label-primary);
        box-shadow: 0 0 6px color-mix(in srgb, var(--dsw-alias-label-primary) 55%, transparent);
        pointer-events: none;
        z-index: 5;
      }
      .dptp-marker:before {
        content: "";
        position: absolute;
        top: -3px;
        left: 50%;
        width: 5px;
        height: 5px;
        translate: -50%;
        border-radius: 999px;
        background: var(--dsw-alias-label-primary);
        box-shadow: 0 0 0 1px var(--dsw-specific-menu);
      }

      .dptp-prices-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
      .dptp-price { margin-top: 8px; }
      .dptp-price-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
      .dptp-price-head h3 { margin: 0; font-size: 12px; line-height: 18px; font-weight: 500; color: var(--dsw-alias-label-primary); }
      .dptp-price-head p { margin: 0; font-size: 10px; line-height: 14px; color: var(--dsw-alias-label-tertiary); }
      .dptp-price table { width: 100%; border-collapse: collapse; margin-top: 3px; font-variant-numeric: tabular-nums; }
      .dptp-price th,
      .dptp-price td { padding: 2px 4px; text-align: right; font-weight: 400; font-size: 11px; line-height: 16px; }
      .dptp-price th:first-child { text-align: left; color: var(--dsw-alias-label-tertiary); }
      .dptp-price thead th { color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 14px; white-space: nowrap; border-bottom: .5px solid var(--dsw-alias-border-l2); }
      .dptp-price tbody tr + tr th,
      .dptp-price tbody tr + tr td { border-top: .5px solid var(--dsw-alias-border-l2); }
      .dptp-price tbody th { color: var(--dsw-alias-label-tertiary); }
      .dptp-price td { color: var(--dsw-alias-label-secondary); }
      .dptp-price th.is-now,
      .dptp-price td.is-now {
        background: color-mix(in srgb, var(--dptp-active) 14%, transparent);
        color: var(--dsw-alias-label-primary);
      }
      .dptp-price thead th.is-now { color: var(--dptp-active); }
      .dptp-price thead tr th:first-child { background: transparent; }

      .dptp-footer { display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; }
      .dptp-footer-copy p { margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 10px; line-height: 15px; }
      .dptp-source {
        flex: none;
        color: var(--dsw-alias-brand-primary);
        font-size: 10px;
        line-height: 15px;
        text-decoration: none;
        white-space: nowrap;
      }
      .dptp-source:hover { text-decoration: underline; }
      .dptp-source:focus-visible {
        outline: var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
        outline-offset: 1px;
      }

      @media (prefers-reduced-motion: reduce) {
        [data-dptp-anchor] { transition: none; }
      }
    `

    // -----------------------------------------------------------------------
    // Registration
    // -----------------------------------------------------------------------

    function apply(ctx) {
      ctx.effect(() => ctx.locale.register(NS, 'en', en), 'deepseek-peakoffpeak: en')
      ctx.effect(() => ctx.locale.register(NS, 'es', es), 'deepseek-peakoffpeak: es')

      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.plugin = 'dsh-deepseek-peakoffpeak'
        style.dataset.pluginCss = 'dsh-deepseek-peakoffpeak'
        style.textContent = CSS
        document.head.appendChild(style)
        return () => style.remove()
      }, 'deepseek-peakoffpeak: styles')

      ctx.effect(() => ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
        name: 'conversation.input.left',
        id: PILL_ID,
        order: 22,
        locale: NS,
        inject: () => ({ models: ctx.get('modelDirectories') }),
      }, PeakPill)), 'deepseek-peakoffpeak: composer pill')
    }

    return {
      inject: ['slots', 'locale'],
      apply,
      __test: {
        PEAK_WINDOWS,
        PRICE_MODELS,
        isPeak,
        nextChange,
        segments,
        dayBounds,
        ratio,
        isDeepSeekSelection,
        formatShort,
        formatDuration,
      },
    }
  },
})
