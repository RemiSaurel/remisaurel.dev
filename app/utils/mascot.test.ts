import { describe, expect, it } from 'vitest'
import { mascotStateAt, minutesOfDay } from './mascot'

describe('mascotStateAt', () => {
  it('sleeps at night', () => {
    expect(mascotStateAt(0)).toBe('sleep')
    expect(mascotStateAt(6 * 60 + 59)).toBe('sleep')
    expect(mascotStateAt(23 * 60)).toBe('sleep')
    expect(mascotStateAt(23 * 60 + 59)).toBe('sleep')
  })

  it('listens to music in the morning, at lunch and after work', () => {
    expect(mascotStateAt(7 * 60)).toBe('music')
    expect(mascotStateAt(12 * 60 + 30)).toBe('music')
    expect(mascotStateAt(19 * 60)).toBe('music')
  })

  it('codes the rest of the day', () => {
    expect(mascotStateAt(10 * 60)).toBe('code')
    expect(mascotStateAt(15 * 60)).toBe('code')
    expect(mascotStateAt(20 * 60)).toBe('code')
  })
})

describe('minutesOfDay', () => {
  it('reads the time of the requested zone', () => {
    // 12:00 UTC is 13:00 in Paris in winter
    expect(minutesOfDay(new Date('2026-01-15T12:00:00Z'), 'Europe/Paris')).toBe(13 * 60)
  })

  it('treats midnight as 0, not 24', () => {
    expect(minutesOfDay(new Date('2026-01-15T23:05:00Z'), 'Europe/Paris')).toBe(5)
  })
})
