// A hand-drawn arrow between two points: a gentle curve with a two-stroke head. Pure functions, no DOM.

export interface Point {
  x: number
  y: number
}

export interface ArrowPaths {
  /** The curve, from the start to the tip */
  shaft: string
  /** The two strokes of the head, meeting at the tip */
  head: string
}

/** Shorter than this, in px, two points are too close for an arrow */
export const MIN_LENGTH = 14

const HEAD = 10
const HEAD_ANGLE = Math.PI / 6

const round = (n: number) => Math.round(n * 10) / 10

export interface ArrowOptions {
  /** How far the middle of the curve is from the straight line, as a share of the length. Negative bows the other way */
  bend?: number
  /** The most the middle may be from the straight line, in px */
  maxBend?: number
}

/**
 * The arrow from `from` to `to`. By default the curve bows to the left of the way it goes, so an arrow that runs
 * leftwards rises in the middle, the way a hand draws it. Null when the points are too close.
 */
export function arrowBetween(from: Point, to: Point, { bend: share = 0.15, maxBend = 36 }: ArrowOptions = {}): ArrowPaths | null {
  const length = Math.hypot(to.x - from.x, to.y - from.y)
  if (length < MIN_LENGTH)
    return null

  const ux = (to.x - from.x) / length
  const uy = (to.y - from.y) / length
  const bend = Math.max(-maxBend, Math.min(length * share, maxBend))
  const control = { x: (from.x + to.x) / 2 - uy * bend, y: (from.y + to.y) / 2 + ux * bend }

  // The head follows the curve where it arrives, not the straight line
  const reach = Math.hypot(to.x - control.x, to.y - control.y)
  const dx = (to.x - control.x) / reach
  const dy = (to.y - control.y) / reach
  const side = (angle: number) => ({
    x: to.x - (dx * Math.cos(angle) - dy * Math.sin(angle)) * HEAD,
    y: to.y - (dx * Math.sin(angle) + dy * Math.cos(angle)) * HEAD,
  })
  const [a, b] = [side(HEAD_ANGLE), side(-HEAD_ANGLE)]

  return {
    shaft: `M${round(from.x)},${round(from.y)}Q${round(control.x)},${round(control.y)} ${round(to.x)},${round(to.y)}`,
    head: `M${round(a.x)},${round(a.y)}L${round(to.x)},${round(to.y)}L${round(b.x)},${round(b.y)}`,
  }
}

/** The point of a box nearest to a point, pushed out of the box by `gap` towards that point. Null if the point is inside */
export function nearestOutside(box: { left: number, right: number, top: number, bottom: number }, point: Point, gap = 0): Point | null {
  const edge = { x: Math.min(Math.max(point.x, box.left), box.right), y: Math.min(Math.max(point.y, box.top), box.bottom) }
  const distance = Math.hypot(point.x - edge.x, point.y - edge.y)
  if (!distance)
    return null
  return { x: edge.x + (point.x - edge.x) / distance * gap, y: edge.y + (point.y - edge.y) / distance * gap }
}
