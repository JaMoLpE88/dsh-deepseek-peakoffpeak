/**
 * Tariff-window tests for the browser half.
 *
 * `client.js` is a module-loader artifact, so the test evaluates the file with
 * a stub `window.__ModuleLoader__` and a stub `require`, then reads the
 * `__test` exports. No DOM is touched by the factory itself.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8')

let definition
globalThis.window = {
  __ModuleLoader__: {
    load: (value) => {
      definition = value
    },
  },
}

const ReactStub = new Proxy({}, {
  get: (_target, key) => (key === 'createElement' ? () => null : () => {}),
})

const requireStub = (id) => (id === 'react' ? ReactStub : { createPortal: () => null })

new Function(source)()

const {
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
} = definition.factory(requireStub).__test

test('peak windows are the official UTC hours', () => {
  assert.deepEqual(PEAK_WINDOWS, [[1, 4], [6, 10]])
})

test('isPeak respects UTC weekday windows and their edges', () => {
  const at = (iso) => new Date(iso)
  assert.equal(isPeak(at('2026-10-26T00:59:00Z')), false)
  assert.equal(isPeak(at('2026-10-26T01:00:00Z')), true)
  assert.equal(isPeak(at('2026-10-26T03:59:00Z')), true)
  assert.equal(isPeak(at('2026-10-26T04:00:00Z')), false)
  assert.equal(isPeak(at('2026-10-26T05:59:00Z')), false)
  assert.equal(isPeak(at('2026-10-26T06:00:00Z')), true)
  assert.equal(isPeak(at('2026-10-26T09:59:00Z')), true)
  assert.equal(isPeak(at('2026-10-26T10:00:00Z')), false)
  assert.equal(isPeak(at('2026-10-31T02:00:00Z')), false)
  assert.equal(isPeak(at('2026-11-01T02:00:00Z')), false)
})

test('nextChange finds the next boundary, skipping weekends', () => {
  const at = (iso) => new Date(iso).toISOString()
  assert.equal(at(nextChange(new Date('2026-10-26T02:00:00Z'))), '2026-10-26T04:00:00.000Z')
  assert.equal(at(nextChange(new Date('2026-10-26T03:59:00Z'))), '2026-10-26T04:00:00.000Z')
  assert.equal(at(nextChange(new Date('2026-10-26T04:00:00Z'))), '2026-10-26T06:00:00.000Z')
  assert.equal(at(nextChange(new Date('2026-10-30T11:00:00Z'))), '2026-11-02T01:00:00.000Z')
  assert.equal(at(nextChange(new Date('2026-10-31T12:00:00Z'))), '2026-11-02T01:00:00.000Z')
})

test('segments cover the range without gaps and label each band', () => {
  const start = new Date('2026-10-27T00:00:00Z')
  const end = new Date('2026-10-28T00:00:00Z')
  const list = segments(start, end)
  assert.deepEqual(list.map((segment) => segment.band), ['off-peak', 'peak', 'off-peak', 'peak', 'off-peak'])
  assert.deepEqual(list.map((segment) => (segment.end - segment.start) / 3_600_000), [1, 3, 2, 4, 14])
  assert.equal(list[0].start.getTime(), start.getTime())
  assert.equal(list.at(-1).end.getTime(), end.getTime())
  for (let index = 1; index < list.length; index += 1) {
    assert.equal(list[index].start.getTime(), list[index - 1].end.getTime())
  }
})

test('segments on a weekend are all off-peak', () => {
  const start = new Date('2026-10-31T00:00:00Z')
  const list = segments(start, new Date('2026-11-01T00:00:00Z'))
  assert.equal(list.length, 1)
  assert.equal(list[0].band, 'off-peak')
})

test('segments handle a DST day without gaps', () => {
  const { start, end } = dayBounds(new Date('2026-03-29T12:00:00Z'))
  const list = segments(start, end)
  assert.equal(list[0].start.getTime(), start.getTime())
  assert.equal(list.at(-1).end.getTime(), end.getTime())
  for (let index = 1; index < list.length; index += 1) {
    assert.equal(list[index].start.getTime(), list[index - 1].end.getTime())
  }
  const span = (end - start) / 3_600_000
  assert.ok(span === 23 || span === 24, `unexpected day span ${span}`)
})

test('dayBounds starts at local midnight', () => {
  const { start, end } = dayBounds(new Date('2026-10-27T12:00:00Z'))
  assert.equal(start.getHours(), 0)
  assert.equal(start.getMinutes(), 0)
  assert.equal(end.getHours(), 0)
  assert.equal(end > start, true)
})

test('ratio maps the instant into 0..1', () => {
  const start = new Date('2026-10-27T00:00:00Z')
  const end = new Date('2026-10-28T00:00:00Z')
  assert.equal(ratio(new Date('2026-10-27T12:00:00Z'), start, end), 0.5)
  assert.equal(ratio(new Date('2026-10-26T23:00:00Z'), start, end), 0)
  assert.equal(ratio(new Date('2026-10-28T01:00:00Z'), start, end), 1)
})

test('isDeepSeekSelection matches any provider that serves DeepSeek', () => {
  assert.equal(isDeepSeekSelection({ provider: 'opencode-go', model: 'deepseek-v4.1-flash' }), true)
  assert.equal(isDeepSeekSelection({ provider: 'deepseek-official', model: 'deepseek-flash' }), true)
  assert.equal(isDeepSeekSelection({ provider: 'deepseek-account', model: 'deepseek-v4-pro' }), true)
  assert.equal(isDeepSeekSelection({ provider: 'openrouter', model: 'deepseek/deepseek-v4.1-flash' }), true)
  assert.equal(isDeepSeekSelection({ provider: 'openrouter', model: 'moonshotai/kimi-k2' }), false)
  assert.equal(isDeepSeekSelection({ provider: 'custom', model: 'my-alias' }), false)
  assert.equal(isDeepSeekSelection(
    { provider: 'custom', model: 'my-alias' },
    [{ id: 'custom', models: [{ id: 'my-alias', name: 'DeepSeek V4 Pro' }] }],
  ), true)
  assert.equal(isDeepSeekSelection(undefined), false)
})

test('formatShort renders the pill counter', () => {
  assert.equal(formatShort(45_000), '45s')
  assert.equal(formatShort(14 * 60_000), '14m')
  assert.equal(formatShort(2 * 3_600_000 + 14 * 60_000), '2h 14m')
  assert.equal(formatShort(26 * 3_600_000), '1d 2h')
})

test('formatDuration renders the panel countdown', () => {
  assert.equal(formatDuration(0), '00:00:00')
  assert.equal(formatDuration(3_723_000), '01:02:03')
  assert.equal(formatDuration(26 * 3_600_000), '1 d 02:00:00')
})

test('the price table matches the official values', () => {
  assert.deepEqual(PRICE_MODELS.map((model) => model.id), ['deepseek-flash', 'deepseek-v4-pro'])
  assert.deepEqual(PRICE_MODELS.map((model) => model.rows.map((row) => [row.off, row.peak])), [
    [[0.15, 0.3], [0.003, 0.006], [0.6, 1.2]],
    [[0.66, 1.32], [0.022, 0.044], [1.98, 3.96]],
  ])
})
