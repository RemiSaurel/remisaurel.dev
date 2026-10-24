import type { Label, Stroke } from './drawing'
import type { ExpectedPart } from './labelMatch'
import type { DrawingEvent } from './trace'
import { checkLabels } from './labelMatch'

// A session written by hand, as the log a real one would leave: for the pages that explain the teacher's
// side without asking the reader to draw first. Times are in seconds, and so are the lengths of strokes.

export type Act
  /** A stroke that ends at `at` and took `stroke` seconds */
  = | { at: number, stroke: number }
    | { at: number, label: string }
    | { at: number, rename: [from: string, to: string] }
    | { at: number, undo: true }
    | { at: number, check: true }

export function buildSession(acts: Act[], parts: ExpectedPart[]): DrawingEvent[] {
  let strokes: Stroke[] = []
  let labels: Label[] = []
  let id = 0

  return acts.map((act): DrawingEvent => {
    const t = Math.round(act.at * 1000)

    if ('stroke' in act) {
      const length = Math.round(act.stroke * 1000)
      const next = ++id
      const stroke: Stroke = {
        id: next,
        color: '#171717',
        size: 4,
        pen: false,
        start: t - length,
        points: [0, 1, 2, 3].map(i => [20 * i, 10 * i, 0.5, Math.round(length * i / 3)]),
      }
      strokes = [...strokes, stroke]
      return { t, type: 'stroke', strokes, labels }
    }

    if ('label' in act) {
      labels = [...labels, { id: ++id, x: 40, y: 40, color: '#171717', text: act.label, start: t }]
      return { t, type: 'label', strokes, labels }
    }

    if ('rename' in act) {
      const [from, to] = act.rename
      labels = labels.map(label => label.text === from ? { ...label, text: to } : label)
      return { t, type: 'relabel', detail: 'renamed', strokes, labels }
    }

    if ('undo' in act) {
      strokes = strokes.slice(0, -1)
      return { t, type: 'undo', strokes, labels }
    }

    const { covered } = checkLabels(labels.map(label => label.text), parts)
    return { t, type: 'help', detail: `counter ${covered.length}/${parts.length}`, strokes, labels }
  })
}
