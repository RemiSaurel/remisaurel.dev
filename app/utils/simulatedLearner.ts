import type { InkColor, StrokePoint } from './drawing'

// A learner who answers the cell exercise, written as a script: what they draw, name, undo and check, and how
// long they hesitate between two acts. Played into a real drawing, it leaves the log a real session would leave.
// Pure data and geometry, no DOM and no clock: the composable that plays it owns the waiting.

export type SimulatedAct
  /** A stroke drawn along `path`, which takes `ms` */
  = | { type: 'stroke', color: InkColor, size: number, path: StrokePoint[] }
    /** A label on a point, or on a zone when it has a size */
    | { type: 'label', x: number, y: number, text: string, color: InkColor, size?: { w: number, h: number } }
    | { type: 'rename', from: string, to: string }
    | { type: 'undo' }
    | { type: 'check' }

export interface SimulatedStep {
  /** The pause before the act, in ms: the learner thinking */
  pause: number
  act: SimulatedAct
}

export interface Ellipse {
  cx: number
  cy: number
  rx: number
  ry: number
  /** In radians */
  tilt?: number
}

const POINT_EVERY = 16

/**
 * The points of a hand drawn ellipse: it does not close exactly, and the hand wobbles. The wobble is
 * a sum of sines, so the same script always draws the same cell. A pen is slower at the ends of the stroke
 */
export function ellipsePath({ cx, cy, rx, ry, tilt = 0 }: Ellipse, ms: number, wobble = 3): StrokePoint[] {
  const count = Math.max(8, Math.round(ms / POINT_EVERY))
  const turn = Math.PI * 2 * 1.04
  const cos = Math.cos(tilt)
  const sin = Math.sin(tilt)

  return Array.from({ length: count + 1 }, (_, i) => {
    const progress = i / count
    const angle = -Math.PI / 2 + progress * turn
    const noise = wobble * (Math.sin(angle * 3 + 1) * 0.6 + Math.sin(angle * 7) * 0.4)
    const x = (rx + noise) * Math.cos(angle)
    const y = (ry + noise) * Math.sin(angle)
    const pressure = 0.35 + 0.5 * Math.sin(Math.PI * progress)
    return [
      Math.round((cx + x * cos - y * sin) * 10) / 10,
      Math.round((cy + x * sin + y * cos) * 10) / 10,
      Math.round(pressure * 100) / 100,
      Math.round(ms * progress),
    ]
  })
}

const INK = {
  black: '#171717',
  blue: '#2563eb',
  orange: '#f97316',
  red: '#dc2626',
}

/**
 * The session: the outline, the nucleus, a scribble taken back, the mitochondria, then names. One name has
 * a typo that the first check shows, and the cytoplasm is never named, so the teacher has a gap to find
 */
export function simulatedCell(): SimulatedStep[] {
  const membrane: Ellipse = { cx: 320, cy: 200, rx: 235, ry: 150 }
  const nucleus: Ellipse = { cx: 275, cy: 185, rx: 62, ry: 56 }
  const mitochondria: Ellipse = { cx: 440, cy: 245, rx: 38, ry: 17, tilt: -0.5 }

  return [
    { pause: 500, act: { type: 'stroke', color: INK.black, size: 4, path: ellipsePath(membrane, 1500) } },
    { pause: 900, act: { type: 'stroke', color: INK.blue, size: 6, path: ellipsePath(nucleus, 900, 2) } },
    // A line through the cell that the learner does not like
    { pause: 1100, act: { type: 'stroke', color: INK.red, size: 4, path: ellipsePath({ cx: 380, cy: 120, rx: 60, ry: 6, tilt: 0.3 }, 500, 5) } },
    { pause: 700, act: { type: 'undo' } },
    { pause: 1200, act: { type: 'stroke', color: INK.orange, size: 6, path: ellipsePath(mitochondria, 700, 1.5) } },
    { pause: 1400, act: { type: 'label', x: 205, y: 125, text: 'nucleus', color: INK.blue, size: { w: 140, h: 120 } } },
    { pause: 800, act: { type: 'label', x: 405, y: 215, text: 'mitocondria', color: INK.orange, size: { w: 80, h: 60 } } },
    { pause: 900, act: { type: 'label', x: 90, y: 330, text: 'membrane', color: INK.black } },
    { pause: 1500, act: { type: 'check' } },
    { pause: 1600, act: { type: 'rename', from: 'mitocondria', to: 'mitochondria' } },
    { pause: 900, act: { type: 'check' } },
  ]
}
