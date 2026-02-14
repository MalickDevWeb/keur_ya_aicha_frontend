import { describe, expect, it } from 'vitest'
import { safeJsonParse } from '../utils'

describe('settings utils', () => {
  it('safeJsonParse returns fallback on invalid json', () => {
    expect(safeJsonParse('not-json', { ok: true })).toEqual({ ok: true })
  })

  it('safeJsonParse returns parsed object', () => {
    expect(safeJsonParse('{"a":1}', { ok: true })).toEqual({ a: 1 })
  })
})
