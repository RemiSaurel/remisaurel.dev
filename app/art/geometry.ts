/**
 * Minimal 2D affine math for the editor: nodes nest (groups), so the canvas needs to go
 * from any node's local space to the frame and back. Same layout as SVG/DOMMatrix:
 * [a, b, c, d, e, f] maps (x, y) to (a·x + c·y + e, b·x + d·y + f).
 */

export type Matrix = [number, number, number, number, number, number]
export type Point = [number, number]

export const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0]

export function multiply([a1, b1, c1, d1, e1, f1]: Matrix, [a2, b2, c2, d2, e2, f2]: Matrix): Matrix {
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ]
}

export function invert([a, b, c, d, e, f]: Matrix): Matrix {
  const det = a * d - b * c || 1e-9
  return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]
}

export function apply([a, b, c, d, e, f]: Matrix, [x, y]: Point): Point {
  return [a * x + c * y + e, b * x + d * y + f]
}

/** Applies only the linear part: for deltas (drags), which must ignore translation. */
export function applyVector([a, b, c, d]: Matrix, [x, y]: Point): Point {
  return [a * x + c * y, b * x + d * y]
}

export interface NodeTransform {
  x: number
  y: number
  rotation: number
  scale: number
  flipX?: boolean
  flipY?: boolean
}

/** translate(x y) rotate(r) scale(±s ±s), the transform every node carries. */
export function nodeMatrix({ x, y, rotation, scale, flipX, flipY }: NodeTransform): Matrix {
  const angle = rotation * Math.PI / 180
  const sx = flipX ? -scale : scale
  const sy = flipY ? -scale : scale
  return [Math.cos(angle) * sx, Math.sin(angle) * sx, -Math.sin(angle) * sy, Math.cos(angle) * sy, x, y]
}

/**
 * Reads a matrix back as a node transform. A mirror can be written with either flip (plus a
 * half turn), so the flips of `prefer` are kept whenever they still explain the matrix, and
 * only the horizontal one is toggled when they don't: moving a flipped node keeps its flags.
 */
export function decompose([a, b, c, d, e, f]: Matrix, prefer: Pick<NodeTransform, 'flipX' | 'flipY'> = {}): NodeTransform {
  const mirrored = a * d - b * c < 0
  const flipY = !!prefer.flipY
  const flipX = !!prefer.flipX !== (mirrored !== (!!prefer.flipX !== flipY))
  // The first column is rotate(r)·(±s, 0): undo the horizontal sign to read r
  const sign = flipX ? -1 : 1
  return { x: e, y: f, rotation: Math.atan2(b * sign, a * sign) * 180 / Math.PI, scale: Math.hypot(a, b), flipX, flipY }
}

/** Whether a matrix mirrors what it draws, so angles measured on screen run backwards. */
export function isMirrored([a, b, c, d]: Matrix) {
  return a * d - b * c < 0
}

/** Rotation of a matrix in degrees, for handles that follow nested rotations. */
export function matrixRotation([a, b]: Matrix) {
  return Math.atan2(b, a) * 180 / Math.PI
}
