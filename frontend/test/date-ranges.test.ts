import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  presetRange,
  rangeError,
  formatReportDate,
} from '../src/utils/date-ranges.ts'
import { deferredLoad } from '../src/utils/deferred-load.ts'

const now = new Date(2026, 10, 9, 12)
test('default last month is a complete calendar month', () => {
  assert.deepEqual(presetRange('lastMonth', now), {
    startDate: '2026-10-01',
    endDate: '2026-10-31',
  })
  assert.deepEqual(presetRange('lastMonth', new Date(2026, 0, 2)), {
    startDate: '2025-12-01',
    endDate: '2025-12-31',
  })
  assert.deepEqual(presetRange('lastMonth', new Date(2024, 2, 4)), {
    startDate: '2024-02-01',
    endDate: '2024-02-29',
  })
})
test('today, yesterday and last seven days use calendar dates', () => {
  assert.deepEqual(presetRange('today', now), {
    startDate: '2026-11-09',
    endDate: '2026-11-09',
  })
  assert.deepEqual(presetRange('yesterday', now), {
    startDate: '2026-11-08',
    endDate: '2026-11-08',
  })
  assert.deepEqual(presetRange('last7Days', now), {
    startDate: '2026-11-03',
    endDate: '2026-11-09',
  })
})
test('last week means previous Monday to Sunday', () => {
  assert.deepEqual(presetRange('lastWeek', now), {
    startDate: '2026-11-02',
    endDate: '2026-11-08',
  })
  assert.deepEqual(presetRange('lastWeek', new Date(2026, 10, 15)), {
    startDate: '2026-11-02',
    endDate: '2026-11-08',
  })
  assert.deepEqual(presetRange('thisMonth', now), {
    startDate: '2026-11-01',
    endDate: '2026-11-09',
  })
})
test('date arithmetic crosses daylight saving changes without losing a day', () => {
  assert.deepEqual(presetRange('yesterday', new Date(2026, 2, 30)), {
    startDate: '2026-03-29',
    endDate: '2026-03-29',
  })
})
test('custom ranges validate both real dates and ordering', () => {
  assert.equal(
    rangeError({ startDate: '2024-02-29', endDate: '2024-02-29' }),
    null,
  )
  assert(rangeError({ startDate: '2026-02-29', endDate: '2026-03-01' }))
  assert(rangeError({ startDate: '2026-03-31', endDate: '2026-03-01' }))
  assert(rangeError({ startDate: '', endDate: '2026-03-01' }))
  assert.equal(formatReportDate('2026-03-31'), '31.03.2026')
})
test('Strict Mode setup/cleanup/setup sends only one initial read', async () => {
  let calls = 0
  const load = async () => {
    calls++
    return 42
  }
  const discarded = new AbortController()
  const first = deferredLoad(discarded.signal, load)
  discarded.abort()
  const active = deferredLoad(new AbortController().signal, load)
  await assert.rejects(first, { name: 'AbortError' })
  assert.equal(await active, 42)
  assert.equal(calls, 1)
})
test('real load failures still reach the caller', async () => {
  await assert.rejects(
    deferredLoad(new AbortController().signal, async () => {
      throw new Error('offline')
    }),
    /offline/,
  )
})
