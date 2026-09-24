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

/** translate(x y) rotate(r) scale(s), the transform every node carries. */
export function nodeMatrix({ x, y, rotation, scale }: { x: number, y: number, rotation: number, scale: number }): Matrix {
  const angle = rotation * Math.PI / 180
  const cos = Math.cos(angle) * scale
  const sin = Math.sin(angle) * scale
  return [cos, sin, -sin, cos, x, y]
}

/** Rotation of a matrix in degrees, for handles that follow nested rotations. */
export function matrixRotation([a, b]: Matrix) {
  return Math.atan2(b, a) * 180 / Math.PI
}
