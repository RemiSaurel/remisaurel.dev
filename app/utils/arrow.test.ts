import { describe, expect, it } from 'vitest'
import { arrowBetween, nearestOutside } from './arrow'

describe('arrowBetween', () => {
  it('is null when the points are too close', () => {
    expect(arrowBetween({ x: 0, y: 0 }, { x: 5, y: 5 })).toBeNull()
  })

  it('goes from the start to the tip, with a head that meets at the tip', () => {
    const arrow = arrowBetween({ x: 300, y: 100 }, { x: 100, y: 120 })!
    expect(arrow.shaft).toMatch(/^M300,100Q[\d.-]+,[\d.-]+ 100,120$/)
    expect(arrow.head).toMatch(/^M[\d.-]+,[\d.-]+L100,120L[\d.-]+,[\d.-]+$/)
  })

  it('rises in the middle when it runs leftwards', () => {
    const arrow = arrowBetween({ x: 300, y: 100 }, { x: 100, y: 100 })!
    const control = /Q[\d.-]+,([\d.-]+)/.exec(arrow.shaft)!
    expect(Number(control[1])).toBeLessThan(100)
  })

  it('bows the other way, and no further than asked', () => {
    const arrow = arrowBetween({ x: 300, y: 100 }, { x: 100, y: 100 }, { bend: -0.05, maxBend: 4 })!
    const control = /Q[\d.-]+,([\d.-]+)/.exec(arrow.shaft)!
    expect(Number(control[1])).toBe(104)
  })

  it('sinks in the middle when it runs rightwards', () => {
    const arrow = arrowBetween({ x: 100, y: 100 }, { x: 300, y: 100 })!
    const control = /Q[\d.-]+,([\d.-]+)/.exec(arrow.shaft)!
    expect(Number(control[1])).toBeGreaterThan(100)
  })
})

describe('nearestOutside', () => {
  const box = { left: 100, right: 200, top: 50, bottom: 80 }

  it('leaves the box by the side that faces the point', () => {
    expect(nearestOutside(box, { x: 20, y: 65 }, 6)).toEqual({ x: 94, y: 65 })
  })

  it('stays within the span of the box along the edge', () => {
    expect(nearestOutside(box, { x: 20, y: 10 }, 0)).toEqual({ x: 100, y: 50 })
  })

  it('is null when the point is inside the box', () => {
    expect(nearestOutside(box, { x: 150, y: 60 })).toBeNull()
  })
})
