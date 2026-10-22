import { describe, expect, it } from 'vitest'
import { isNew } from './isNew'

const now = new Date('2026-10-22T12:00:00Z')

describe('isNew', () => {
  it('is true within the last 3 months', () => {
    expect(isNew('2026-10-01', now)).toBe(true)
    expect(isNew('2026-07-23', now)).toBe(true)
  })

  it('is false once older than 3 months', () => {
    expect(isNew('2026-07-01', now)).toBe(false)
    expect(isNew('2025-01-01', now)).toBe(false)
  })

  it('is false for future, missing or invalid dates', () => {
    expect(isNew('2027-01-01', now)).toBe(false)
    expect(isNew(undefined, now)).toBe(false)
    expect(isNew('nope', now)).toBe(false)
  })
})
