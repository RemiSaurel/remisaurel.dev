/**
 * Alignment for the editor: what a dragged selection snaps to, what lines explain the snap,
 * and the distances ⌥ measures. Everything is in frame units and axis-aligned boxes.
 */

import type { Point } from './geometry'

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export type Axis = 'x' | 'y'

/** A value the moving box can land on, and the stretch of the other axis it comes from. */
export interface SnapTarget {
  value: number
  from: number
  to: number
  /** Set for ruler guides: they light up instead of drawing a line of their own. */
  guideId?: string
}

/** A drawn alignment: a line on `axis = value`, with a cross on every point that lines up. */
export interface SnapLine {
  axis: Axis
  value: number
  from: number
  to: number
  marks: number[]
}

export function boundsOf(points: Point[]): Bounds {
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

export function unionBounds(list: Bounds[]): Bounds | null {
  if (!list.length)
    return null
  return {
    minX: Math.min(...list.map(item => item.minX)),
    minY: Math.min(...list.map(item => item.minY)),
    maxX: Math.max(...list.map(item => item.maxX)),
    maxY: Math.max(...list.map(item => item.maxY)),
  }
}

export function offsetBounds(bounds: Bounds, dx: number, dy: number): Bounds {
  return { minX: bounds.minX + dx, minY: bounds.minY + dy, maxX: bounds.maxX + dx, maxY: bounds.maxY + dy }
}

/** Start, middle and end of a box along one axis: the three edges that can align. */
export function edges(bounds: Bounds, axis: Axis): [number, number, number] {
  const min = axis === 'x' ? bounds.minX : bounds.minY
  const max = axis === 'x' ? bounds.maxX : bounds.maxY
  return [min, (min + max) / 2, max]
}

/** The stretch a box covers on the axis across `axis`: where its alignment line runs. */
function across(bounds: Bounds, axis: Axis): [number, number] {
  return axis === 'x' ? [bounds.minY, bounds.maxY] : [bounds.minX, bounds.maxX]
}

/** The three edges of another box, each a target spanning that box. */
export function boxTargets(bounds: Bounds, axis: Axis): SnapTarget[] {
  const [from, to] = across(bounds, axis)
  return edges(bounds, axis).map(value => ({ value, from, to }))
}

/**
 * The smallest shift that puts one of the moving box's edges on a target, if any is within
 * `threshold`. Ties go to the first edge, so the start edge wins over the middle.
 */
export function snapOffset(bounds: Bounds, axis: Axis, targets: SnapTarget[], threshold: number) {
  let best: number | null = null
  for (const edge of edges(bounds, axis)) {
    for (const target of targets) {
      const offset = target.value - edge
      if (Math.abs(offset) <= threshold && (best === null || Math.abs(offset) < Math.abs(best)))
        best = offset
    }
  }
  return best
}

const ALIGNED = 0.01

/**
 * Every alignment the box has once placed, merged per value: aligning with two boxes on the
 * same line draws one line through all three. Guides are reported apart, to be lit up.
 */
export function alignments(bounds: Bounds, axis: Axis, targets: SnapTarget[]) {
  const lines = new Map<number, SnapLine>()
  const guideIds = new Set<string>()
  const [ownFrom, ownTo] = across(bounds, axis)
  for (const edge of edges(bounds, axis)) {
    for (const target of targets) {
      if (Math.abs(target.value - edge) > ALIGNED)
        continue
      if (target.guideId) {
        guideIds.add(target.guideId)
        continue
      }
      const key = Math.round(target.value * 100) / 100
      const line = lines.get(key) ?? { axis, value: target.value, from: ownFrom, to: ownTo, marks: [ownFrom, ownTo] }
      line.from = Math.min(line.from, target.from)
      line.to = Math.max(line.to, target.to)
      line.marks.push(target.from, target.to)
      lines.set(key, line)
    }
  }
  return { lines: [...lines.values()], guideIds }
}

/** A measured distance: a segment on one axis, drawn at `at` on the other. */
export interface Measure {
  axis: Axis
  from: number
  to: number
  at: number
  /** When `at` misses the target, a dashed line carries its edge over to the segment. */
  extension?: { value: number, from: number, to: number }
}

const MIN_DISTANCE = 0.5

function measureAxis(selection: Bounds, target: Bounds, axis: Axis): Measure[] {
  const [sMin, , sMax] = edges(selection, axis)
  const [tMin, , tMax] = edges(target, axis)
  const other: Axis = axis === 'x' ? 'y' : 'x'
  const [, at] = edges(selection, other)
  const [crossMin, , crossMax] = edges(target, other)

  const extendTo = (value: number) => at < crossMin || at > crossMax
    ? { value, from: at < crossMin ? at : crossMax, to: at < crossMin ? crossMin : at }
    : undefined

  // Apart on this axis: the gap between them
  if (sMax <= tMin)
    return tMin - sMax > MIN_DISTANCE ? [{ axis, from: sMax, to: tMin, at, extension: extendTo(tMin) }] : []
  if (tMax <= sMin)
    return sMin - tMax > MIN_DISTANCE ? [{ axis, from: tMax, to: sMin, at, extension: extendTo(tMax) }] : []

  // Overlapping (one inside the other, the frame around a layer): the offsets of both edges
  const result: Measure[] = []
  if (Math.abs(sMin - tMin) > MIN_DISTANCE)
    result.push({ axis, from: Math.min(sMin, tMin), to: Math.max(sMin, tMin), at })
  if (Math.abs(sMax - tMax) > MIN_DISTANCE)
    result.push({ axis, from: Math.min(sMax, tMax), to: Math.max(sMax, tMax), at })
  return result
}

function apart(a: Bounds, b: Bounds, axis: Axis) {
  const [aMin, , aMax] = edges(a, axis)
  const [bMin, , bMax] = edges(b, axis)
  return aMax <= bMin || bMax <= aMin
}

/**
 * Side by side, only the gaps matter: edge offsets on the other axis would float away from
 * the target. Overlapping (the frame around a layer), the offsets of all four edges.
 */
export function measure(selection: Bounds, target: Bounds): Measure[] {
  const axes = (['x', 'y'] as const).filter(axis => apart(selection, target, axis))
  return (axes.length ? axes : ['x', 'y'] as const).flatMap(axis => measureAxis(selection, target, axis))
}
