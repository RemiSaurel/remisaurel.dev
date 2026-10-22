import { describe, expect, it } from 'vitest'
import { boundsOf, clampZoom, easeInOut, edgePath, fitViewport, FLOW_MAX_ZOOM, FLOW_MIN_ZOOM, loopPath, springSettled, springStep, zoomAt } from './geometry'

describe('zoomAt', () => {
  it('keeps the world point under the anchor in place', () => {
    const view = { x: 40, y: -20, k: 1 }
    const anchor = { x: 300, y: 200 }
    const before = { x: (anchor.x - view.x) / view.k, y: (anchor.y - view.y) / view.k }
    const next = zoomAt(view, 1.6, anchor)
    expect((anchor.x - next.x) / next.k).toBeCloseTo(before.x)
    expect((anchor.y - next.y) / next.k).toBeCloseTo(before.y)
  })

  it('clamps the zoom', () => {
    expect(zoomAt({ x: 0, y: 0, k: 1 }, 100, { x: 0, y: 0 }).k).toBe(FLOW_MAX_ZOOM)
    expect(clampZoom(0.01)).toBe(FLOW_MIN_ZOOM)
  })
})

describe('boundsOf', () => {
  it('is null without rects', () => {
    expect(boundsOf([])).toBeNull()
  })

  it('wraps every rect', () => {
    expect(boundsOf([
      { x: 0, y: 10, width: 100, height: 50 },
      { x: 200, y: -10, width: 40, height: 40 },
    ])).toEqual({ x: 0, y: -10, width: 240, height: 70 })
  })
})

describe('fitViewport', () => {
  it('centres the bounds in the area', () => {
    const bounds = { x: 100, y: 100, width: 200, height: 100 }
    const view = fitViewport(bounds, { width: 800, height: 400 })
    expect(view.k).toBe(1)
    expect(view.x + (bounds.x + bounds.width / 2) * view.k).toBe(400)
    expect(view.y + (bounds.y + bounds.height / 2) * view.k).toBe(200)
  })

  it('zooms out to fit a large graph, and never zooms in past maxZoom', () => {
    expect(fitViewport({ x: 0, y: 0, width: 1600, height: 200 }, { width: 800, height: 400 }, { padding: 0 }).k).toBe(0.5)
    expect(fitViewport({ x: 0, y: 0, width: 10, height: 10 }, { width: 800, height: 400 }).k).toBe(1)
  })

  it('centres in what the insets leave', () => {
    const view = fitViewport({ x: 0, y: 0, width: 100, height: 100 }, { width: 800, height: 400 }, { insets: { right: 200 } })
    expect(view.x + 50).toBe(300)
  })
})

describe('edgePath', () => {
  it('stops short of the target and points into it', () => {
    const { d, end } = edgePath({ x: 0, y: 0 }, { x: 200, y: 50 })
    expect(end.x).toBeLessThan(200)
    expect(d.startsWith('M0 0C')).toBe(true)
    expect(d.endsWith(`${end.x} ${end.y}`)).toBe(true)
  })

  it('never overshoots a target just in front, so a ball keeps moving forward', () => {
    const { d, end } = edgePath({ x: 0, y: 0 }, { x: 32, y: 120 })
    const [c1x, , c2x] = d.split('C')[1]!.split(' ').map(Number) as [number, number, number]
    expect(c1x).toBeLessThanOrEqual(c2x)
    expect(c2x).toBeLessThanOrEqual(end.x)
  })

  it('swings out when the target sits behind the source', () => {
    const { d } = edgePath({ x: 300, y: 0 }, { x: 100, y: 80 })
    const handle = Number(d.split('C')[1]!.split(' ')[0]) - 300
    expect(handle).toBeGreaterThanOrEqual(60)
  })
})

describe('loopPath', () => {
  it('runs along the floor and puts its label in the middle', () => {
    const { d, labelAt } = loopPath({ x: 600, y: 100 }, { x: 100, y: 120 }, 180)
    expect(d).toContain('H')
    expect(labelAt).toEqual({ x: 350, y: 180 })
  })
})

describe('easeInOut', () => {
  it('starts, crosses half-way and ends where expected', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(0.5)).toBeCloseTo(0.5)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(2)).toBe(1)
  })
})

describe('springStep', () => {
  it('settles on the target without overshooting', () => {
    const state = { x: 0, v: 0 }
    let max = 0
    for (let i = 0; i < 120; i++) {
      springStep(state, 100, 1 / 60)
      max = Math.max(max, state.x)
    }
    expect(max).toBeLessThanOrEqual(100.0001)
    expect(springSettled(state, 100)).toBe(true)
  })

  it('does not depend on the frame rate', () => {
    const a = { x: 0, v: 0 }
    const b = { x: 0, v: 0 }
    springStep(a, 50, 0.1)
    for (let i = 0; i < 10; i++)
      springStep(b, 50, 0.01)
    expect(a.x).toBeCloseTo(b.x, 6)
  })
})
