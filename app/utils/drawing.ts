// A drawing as data: a list of strokes, each a list of timed points, and the labels put on it.
// Everything else (the SVG, the replay, the history) is derived from them, so a drawing can be saved,
// replayed or handed to a teacher as it is. Pure functions, no DOM.
import { getStroke } from 'perfect-freehand'
import { isHexColor } from './highlights'

/** A colour as `#rrggbb`: the same on any theme, since the sheet is a sheet of white paper */
export type InkColor = string

export interface InkSwatch {
  value: InkColor
  label: string
}

/** The inks of the toolbar: enough to tell the parts of a cell apart, all readable on white */
export const INK_PALETTE: InkSwatch[] = [
  { value: '#171717', label: 'Black' },
  { value: '#dc2626', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#16a34a', label: 'Green' },
  { value: '#2563eb', label: 'Blue' },
  { value: '#9333ea', label: 'Purple' },
  { value: '#92400e', label: 'Brown' },
]

/** The ink that stands for a colour on a dark sheet: a colour too dark to be seen there is shown light */
export function inkOnDark(color: string): string {
  const hex = /^#([\da-f]{3}|[\da-f]{6})$/i.exec(color)?.[1]
  if (!hex)
    return color
  const full = hex.length === 3 ? [...hex].map(c => c + c).join('') : hex
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = Number.parseInt(full.slice(i, i + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.05 ? '#f5f5f5' : color
}

export const DEFAULT_INK: InkColor = INK_PALETTE[0]!.value

/** x and y in board units, pressure from 0 to 1, then the ms since the stroke started */
export type StrokePoint = [x: number, y: number, pressure: number, t: number]

export interface Stroke {
  id: number
  color: InkColor
  /** Width in board units */
  size: number
  /** Drawn with a pen, so the pressure is real. A mouse has none: it is simulated from the speed */
  pen: boolean
  /** ms since the session started, which is when the first stroke began */
  start: number
  points: StrokePoint[]
}

export interface DrawingBoardSize {
  width: number
  height: number
}

/**
 * A name put on the drawing: "nucleus", pinned where the learner says it is. On a point, or on a zone
 * dragged around the part, in which case x and y are its top left corner
 */
export interface Label {
  id: number
  x: number
  y: number
  /** The size of the zone. Both or none: a label without them is a point */
  w?: number
  h?: number
  color: InkColor
  text: string
  /** ms since the session started: when the text was entered */
  start: number
}

export const MAX_LABEL_LENGTH = 40

/** A drag smaller than this, in board units, is a click: the label is a point */
export const MIN_ZONE = 12

export const isZone = (label: Label): boolean => label.w !== undefined && label.h !== undefined

/** The zone between two corners, whichever way it was dragged */
export function zoneOf(a: { x: number, y: number }, b: { x: number, y: number }) {
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) }
}

/** Keeps a point, or a zone, inside the board. Only the position moves: the size stays */
export function clampToBoard(box: { x: number, y: number, w?: number, h?: number }, board: DrawingBoardSize) {
  return {
    x: Math.min(Math.max(0, box.x), Math.max(0, board.width - (box.w ?? 0))),
    y: Math.min(Math.max(0, box.y), Math.max(0, board.height - (box.h ?? 0))),
  }
}

// --- History: every change keeps what was there before, so undo also brings back a cleared board ---

interface Snapshot {
  strokes: Stroke[]
  labels: Label[]
}

export interface DrawingState extends Snapshot {
  past: Snapshot[]
  future: Snapshot[]
}

export function emptyDrawing(): DrawingState {
  return { strokes: [], labels: [], past: [], future: [] }
}

function change(state: DrawingState, patch: Partial<Snapshot>): DrawingState {
  const { strokes, labels } = state
  return { strokes, labels, ...patch, past: [...state.past, { strokes, labels }], future: [] }
}

export function commitStroke(state: DrawingState, stroke: Stroke): DrawingState {
  return change(state, { strokes: [...state.strokes, stroke] })
}

/** Text trimmed and cut to length, a colour that ends up in the page checked, a zone too small made a point */
function cleanLabel(label: Label): Label | null {
  const text = label.text.trim().slice(0, MAX_LABEL_LENGTH)
  if (!text)
    return null
  const { w, h, ...rest } = label
  const zone = w !== undefined && h !== undefined && w >= MIN_ZONE && h >= MIN_ZONE ? { w, h } : {}
  return { ...rest, ...zone, text, color: isHexColor(label.color) ? label.color : DEFAULT_INK }
}

/** A label with no text is not added */
export function addLabel(state: DrawingState, label: Label): DrawingState {
  const clean = cleanLabel(label)
  return clean ? change(state, { labels: [...state.labels, clean] }) : state
}

/** Moves, recolours or renames a label, as one step of the history. A name emptied keeps the old one */
export function editLabel(state: DrawingState, id: number, patch: Partial<Pick<Label, 'x' | 'y' | 'text' | 'color'>>): DrawingState {
  const current = state.labels.find(label => label.id === id)
  if (!current)
    return state
  const next = cleanLabel({ ...current, ...patch, text: patch.text?.trim() ? patch.text : current.text })
  if (!next || (next.x === current.x && next.y === current.y && next.text === current.text && next.color === current.color))
    return state
  return change(state, { labels: state.labels.map(label => label.id === id ? next : label) })
}

export function removeLabel(state: DrawingState, id: number): DrawingState {
  return state.labels.some(label => label.id === id) ? change(state, { labels: state.labels.filter(label => label.id !== id) }) : state
}

export function clearDrawing(state: DrawingState): DrawingState {
  return state.strokes.length || state.labels.length ? change(state, { strokes: [], labels: [] }) : state
}

export function undo(state: DrawingState): DrawingState {
  const previous = state.past.at(-1)
  if (!previous)
    return state
  const { strokes, labels } = state
  return { ...previous, past: state.past.slice(0, -1), future: [...state.future, { strokes, labels }] }
}

export function redo(state: DrawingState): DrawingState {
  const next = state.future.at(-1)
  if (!next)
    return state
  const { strokes, labels } = state
  return { ...next, past: [...state.past, { strokes, labels }], future: state.future.slice(0, -1) }
}

// --- Replay: the thinking time between two acts is squeezed, so a replay shows the drawing, not the pauses ---

export interface TimelineItem {
  stroke: Stroke
  /** When the stroke starts and ends on the squeezed clock, in ms */
  from: number
  to: number
}

export interface TimelineLabel {
  label: Label
  /** When the label appears on the squeezed clock, in ms */
  at: number
}

export interface Timeline {
  items: TimelineItem[]
  labels: TimelineLabel[]
  duration: number
}

export const MAX_GAP = 600

export const strokeDuration = (stroke: Stroke): number => stroke.points.at(-1)?.[3] ?? 0

/** Strokes and labels share one clock: a label appears after the strokes that came before it */
export function timelineOf(strokes: Stroke[], labels: Label[] = [], maxGap = MAX_GAP): Timeline {
  const acts = [
    ...strokes.map(stroke => ({ start: stroke.start, stroke })),
    ...labels.map(label => ({ start: label.start, label })),
  ].sort((a, b) => a.start - b.start)

  const items: TimelineItem[] = []
  const placed: TimelineLabel[] = []
  let cursor = 0
  let realEnd: number | null = null
  for (const act of acts) {
    const gap = realEnd === null ? 0 : Math.max(0, act.start - realEnd)
    cursor += Math.min(gap, maxGap)
    if ('stroke' in act) {
      const to = cursor + strokeDuration(act.stroke)
      items.push({ stroke: act.stroke, from: cursor, to })
      cursor = to
      realEnd = act.start + strokeDuration(act.stroke)
    }
    else {
      placed.push({ label: act.label, at: cursor })
      realEnd = act.start
    }
  }
  return { items, labels: placed, duration: cursor }
}

/** The drawing as it was at time `t` of the timeline: the stroke being drawn is cut where the pen was */
export function strokesAt(timeline: Timeline, t: number): Stroke[] {
  const visible: Stroke[] = []
  for (const { stroke, from, to } of timeline.items) {
    if (t < from)
      break
    if (t >= to) {
      visible.push(stroke)
      continue
    }
    const elapsed = t - from
    const points = stroke.points.filter(point => point[3] <= elapsed)
    visible.push({ ...stroke, points: points.length ? points : stroke.points.slice(0, 1) })
  }
  return visible
}

export function labelsAt(timeline: Timeline, t: number): Label[] {
  return timeline.labels.filter(item => item.at <= t).map(item => item.label)
}

// --- Shape: the outline of a stroke as an SVG path ---

/** The outline of a stroke is a polygon: curved through the midpoints of its sides */
export function outlineToPath(outline: number[][]): string {
  if (outline.length < 2)
    return ''
  const round = (n: number) => Math.round(n * 10) / 10
  const [first, ...rest] = outline as [number[], ...number[][]]
  let d = `M${round(first[0]!)},${round(first[1]!)}Q`
  for (let i = 0; i < rest.length; i++) {
    const [x0, y0] = i === 0 ? first : rest[i - 1]!
    const [x1, y1] = rest[i]!
    d += `${round(x0!)},${round(y0!)} ${round((x0! + x1!) / 2)},${round((y0! + y1!) / 2)} `
  }
  return `${d}Z`
}

// A finished stroke never changes, so its path is computed once. A stroke being drawn grows in place
// (same object, more points), hence the count of points in the key
const paths = new WeakMap<Stroke, { count: number, complete: boolean, d: string }>()

/**
 * The stroke is smoothed, which makes its end lag behind the pen. A stroke still being drawn is left
 * so (`complete` false); a finished one is pulled to its last point
 */
export function strokePath(stroke: Stroke, complete = true): string {
  const cached = paths.get(stroke)
  if (cached && cached.count === stroke.points.length && cached.complete === complete)
    return cached.d
  const outline = getStroke(stroke.points, {
    size: stroke.size,
    thinning: stroke.pen ? 0.6 : 0.5,
    smoothing: 0.5,
    streamline: 0.5,
    simulatePressure: !stroke.pen,
    last: complete,
  })
  const d = outlineToPath(outline)
  paths.set(stroke, { count: stroke.points.length, complete, d })
  return d
}
