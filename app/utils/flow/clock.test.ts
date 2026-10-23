import { describe, expect, it } from 'vitest'
import { landsAt, nextEventAt } from './clock'

describe('nextEventAt', () => {
  it('is null when nothing is waiting', () => {
    expect(nextEventAt([], [])).toBeNull()
  })

  it('picks the earliest timer', () => {
    expect(nextEventAt([{ due: 2 }, { due: 0.5 }], [])).toBe(0.5)
  })

  it('counts a ball by the moment it lands', () => {
    expect(nextEventAt([{ due: 3 }], [{ start: 1, duration: 0.9 }])).toBe(landsAt({ start: 1, duration: 0.9 }))
  })

  it('takes whichever of a timer and a ball comes first', () => {
    expect(nextEventAt([{ due: 1.2 }], [{ start: 0, duration: 2 }])).toBe(1.2)
    expect(nextEventAt([{ due: 5 }], [{ start: 0, duration: 2 }])).toBe(2)
  })
})

describe('landsAt', () => {
  it('lands exactly where a clock set to it counts as arrived', () => {
    const flight = { start: 0.3, duration: 0.9 }
    expect(landsAt(flight) >= flight.start + flight.duration).toBe(true)
  })
})
