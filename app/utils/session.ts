import type { Label, Stroke } from './drawing'
import type { DrawingEvent } from './trace'
import { MAX_GAP, strokeDuration } from './drawing'
import { describeTally, parseCounter, tallyOf } from './trace'

// A session read like a recording: the sheet at any moment, what the act at that moment was, and a clock
// that skips the pauses so playing it does not wait for the learner to think. Pure functions of the log.

export interface Frame {
  strokes: Stroke[]
  labels: Label[]
  /** The last act done by this time, or -1 before the first */
  index: number
}

/** The sheet at time `t` (ms since the first act): the stroke being drawn is cut where the pen was */
export function frameAt(events: DrawingEvent[], t: number): Frame {
  let index = -1
  while (index + 1 < events.length && events[index + 1]!.t <= t)
    index++

  const done = events[index]
  let strokes = done?.strokes ?? []
  const labels = done?.labels ?? []

  // A stroke is logged when it ends, so one that is still being drawn is the last stroke of the next act
  const next = events[index + 1]
  const drawing = next?.type === 'stroke' ? next.strokes?.at(-1) : undefined
  if (drawing && drawing.start <= t) {
    const elapsed = t - drawing.start
    const points = drawing.points.filter(point => point[3] <= elapsed)
    strokes = [...strokes, { ...drawing, points: points.length ? points : drawing.points.slice(0, 1) }]
  }

  return { strokes, labels, index }
}

/** The stretches of time when the learner was at work: a stroke from its start to its end, any other act at a point */
export function activeSpans(events: DrawingEvent[]): [number, number][] {
  return events.map((event) => {
    const stroke = event.type === 'stroke' ? event.strokes?.at(-1) : undefined
    return [stroke ? Math.min(stroke.start, event.t) : event.t, event.t]
  })
}

export interface SessionClock {
  /** The length of the session once the pauses are squeezed */
  duration: number
  /** Real time to clock time */
  clockAt: (t: number) => number
  /** Clock time to real time */
  timeAt: (clock: number) => number
}

/**
 * A clock that runs on the time the learner worked, and spends at most `maxGap` on each pause. A pause
 * of five minutes passes in the time of a breath, but on the real axis it is still five minutes long.
 */
export function squeeze(spans: [number, number][], maxGap = MAX_GAP): SessionClock {
  // The points where real time and clock time are known, between which both run in a straight line
  const knots: { t: number, c: number }[] = [{ t: 0, c: 0 }]
  for (const [from, to] of [...spans].sort((a, b) => a[0] - b[0])) {
    const last = knots.at(-1)!
    if (to <= last.t)
      continue
    const start = Math.max(from, last.t)
    if (start > last.t)
      knots.push({ t: start, c: last.c + Math.min(start - last.t, maxGap) })
    const before = knots.at(-1)!
    knots.push({ t: to, c: before.c + (to - before.t) })
  }

  const find = (key: 't' | 'c', other: 't' | 'c', value: number): number => {
    if (value <= 0)
      return 0
    const end = knots.at(-1)!
    if (value >= end[key])
      return end[other]
    const i = knots.findIndex(knot => knot[key] >= value)
    const a = knots[i - 1]!
    const b = knots[i]!
    return b[key] === a[key] ? b[other] : a[other] + (value - a[key]) / (b[key] - a[key]) * (b[other] - a[other])
  }

  return {
    duration: knots.at(-1)!.c,
    clockAt: t => find('t', 'c', t),
    timeAt: clock => find('c', 't', clock),
  }
}

const quoted = (text: string) => `"${text}"`

/** What the act at `index` did to the labels: the one it added or removed, and the one it changed with how it was */
function labelChange(events: DrawingEvent[], index: number) {
  const labels = events[index]?.labels ?? []
  const was = events[index - 1]?.labels ?? []
  const changed = labels.find((label) => {
    const old = was.find(candidate => candidate.id === label.id)
    return old && (old.text !== label.text || old.x !== label.x || old.y !== label.y || old.color !== label.color)
  })
  return {
    was,
    added: labels.find(label => !was.some(old => old.id === label.id)),
    removed: was.find(old => !labels.some(label => label.id === old.id)),
    changed,
    old: changed && was.find(candidate => candidate.id === changed.id),
  }
}

/** What the act at `index` was, in words: "Label renamed: "membrane" to "cytoplasme"" */
export function describeEvent(events: DrawingEvent[], index: number): string {
  const event = events[index]
  if (!event)
    return ''
  const before = events[index - 1]
  const { was, added, removed, changed, old } = labelChange(events, index)

  switch (event.type) {
    case 'stroke': {
      const stroke = event.strokes?.at(-1)
      return stroke ? `Stroke of ${(strokeDuration(stroke) / 1000).toFixed(1)} s` : 'Stroke'
    }
    case 'label':
      return added ? `${added.w ? 'Zone' : 'Label'} added: ${quoted(added.text)}` : 'Label added'
    case 'relabel':
      if (!changed || !old)
        return 'Label edited'
      if (event.detail === 'renamed')
        return `Label renamed: ${quoted(old.text)} to ${quoted(changed.text)}`
      return `Label ${quoted(changed.text)} ${event.detail === 'recolored' ? 'recolored' : 'moved'}`
    case 'unlabel':
      return removed ? `Label removed: ${quoted(removed.text)}` : 'Label removed'
    case 'undo':
      return 'Undo'
    case 'redo':
      return 'Redo'
    case 'clear': {
      const count = (before?.strokes?.length ?? 0) + was.length
      return `Sheet cleared: ${count} ${count === 1 ? 'item' : 'items'}`
    }
    case 'help': {
      const count = parseCounter(event.detail)
      return count ? `Asked for the count: ${count.named} of ${count.of}` : 'Asked for help'
    }
  }
}

/** Acts closer than this, in ms, read as one movement of the learner */
export const GROUP_GAP = 2000

/** A run of acts the log shows as one line: a handful of strokes, a few undos in a row, a label dragged around */
export interface Step {
  /** The first and the last act of the step, as places in the log */
  first: number
  last: number
  /** When it began: the start of its first stroke, or its first act */
  from: number
  /** When it ended, which is the moment of the sheet it leaves */
  t: number
}

// What makes two acts the same kind of movement, or null for an act that stands alone
function runKey(events: DrawingEvent[], index: number): string | null {
  const event = events[index]!
  switch (event.type) {
    case 'stroke':
      return 'stroke'
    case 'undo':
    case 'redo':
      return 'undo'
    case 'relabel': {
      // A rename is a decision, not a movement. A label moved or recolored again and again is one gesture
      const id = labelChange(events, index).changed?.id
      return event.detail === 'renamed' || id === undefined ? null : `${event.detail}:${id}`
    }
    default:
      return null
  }
}

/**
 * The log in as few lines as keep its meaning: acts of one kind, with less than `gap` between them, are
 * one step. Twenty strokes that make a circle are a circle, not twenty lines. A check, a label, a rename
 * and a clear always stand alone, since each is something the teacher wants to find.
 */
export function condense(events: DrawingEvent[], gap = GROUP_GAP): Step[] {
  const spans = activeSpans(events)
  const steps: Step[] = []
  let key: string | null = null

  events.forEach((event, index) => {
    const next = runKey(events, index)
    const open = steps.at(-1)
    if (open && next && next === key && spans[index]![0] - open.t <= gap) {
      open.last = index
      open.t = event.t
      return
    }
    key = next
    steps.push({ first: index, last: index, from: spans[index]![0], t: event.t })
  })

  return steps
}

/** The acts a step is made of, each as a step of its own: what a reader sees when a line is unfolded */
export function within(events: DrawingEvent[], step: Step): Step[] {
  const spans = activeSpans(events)
  return events
    .map((event, index) => ({ first: index, last: index, from: spans[index]![0], t: event.t }))
    .slice(step.first, step.last + 1)
}

/** A step as the log shows it, in cells rather than a sentence */
export interface StepDetail {
  /** What kind of act: "Stroke", "Label added", "Renamed" */
  what: string
  /** The label the act is about, and for a rename the name it had before */
  name?: string
  from?: string
  /** A figure that goes with it: how long a stroke took, how many times a label moved, what a check counted */
  meta?: string
  /** The act gives a label its name: the moment to say which part it names */
  naming?: boolean
}

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)} s`

/** What a step was, cell by cell: `{ what: 'Renamed', from: 'cyto', name: 'cytoplasme', naming: true }` */
export function detailOf(events: DrawingEvent[], step: Step): StepDetail {
  const count = step.last - step.first + 1
  const run = events.slice(step.first, step.last + 1)
  const event = events[step.first]!
  const { added, removed, changed, old } = labelChange(events, step.last)

  switch (event.type) {
    case 'stroke': {
      const stroke = event.strokes?.at(-1)
      return count > 1
        ? { what: `${count} strokes`, meta: seconds(step.t - step.from) }
        : { what: 'Stroke', meta: stroke ? seconds(strokeDuration(stroke)) : undefined }
    }
    case 'label':
      return { what: added?.w ? 'Zone added' : 'Label added', name: added?.text, naming: true }
    case 'relabel':
      if (event.detail === 'renamed')
        return { what: 'Renamed', from: old?.text, name: changed?.text, naming: true }
      return { what: event.detail === 'recolored' ? 'Recolored' : 'Moved', name: changed?.text, meta: count > 1 ? `${count} times` : undefined }
    case 'unlabel':
      return { what: 'Removed', name: removed?.text }
    case 'undo':
    case 'redo': {
      const kinds = new Set(run.map(act => act.type))
      return { what: kinds.size > 1 ? 'Undo, redo' : event.type === 'undo' ? 'Undo' : 'Redo', meta: count > 1 ? describeTally(tallyOf(run)) : undefined }
    }
    case 'clear': {
      const items = (events[step.first - 1]?.strokes?.length ?? 0) + (events[step.first - 1]?.labels?.length ?? 0)
      return { what: 'Cleared', meta: `${items} ${items === 1 ? 'item' : 'items'}` }
    }
    case 'help': {
      const counter = parseCounter(event.detail)
      return { what: 'Check', meta: counter ? `${counter.named} of ${counter.of} named` : undefined }
    }
  }
}
