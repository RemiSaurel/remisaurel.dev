import type { Label, Stroke } from './drawing'

// What the log of a drawing session says, for whoever reads it: how many of each act, and what happened
// between two asks for help. Pure functions of the log, so what a teacher is shown can be tested.

export interface DrawingEvent {
  /** ms since the first act */
  t: number
  type: 'stroke' | 'label' | 'relabel' | 'unlabel' | 'undo' | 'redo' | 'clear' | 'help'
  /** What the event is about, when the type does not say it: what a help showed */
  detail?: string
  /** The sheet right after this act: a reader who moves through the session sees it as it was */
  strokes?: Stroke[]
  labels?: Label[]
}

/** The acts of a session, counted. A `relabel` is told apart by what changed */
export interface Tally {
  stroke: number
  label: number
  renamed: number
  moved: number
  recolored: number
  unlabel: number
  undo: number
  redo: number
  clear: number
  help: number
}

export interface Check {
  /** Where the check is in the log */
  index: number
  /** ms since the first act */
  t: number
  /** How many expected parts the labels named, and how many there are */
  named: number
  of: number
  /** What was done since the check before, or since the start */
  since: Tally
  /** The change in the count since the check before. Null for the first one */
  delta: number | null
  /** Nothing drawn or added since the check before, only names changed: a guess more than a fix */
  onlyRenames: boolean
}

export interface TraceSummary {
  /** ms between the first act and the last */
  duration: number
  total: Tally
  checks: Check[]
  /** What was done after the last check, or since the start when there was none */
  after: Tally
}

export const emptyTally = (): Tally => ({ stroke: 0, label: 0, renamed: 0, moved: 0, recolored: 0, unlabel: 0, undo: 0, redo: 0, clear: 0, help: 0 })

function keyOf(event: DrawingEvent): keyof Tally {
  if (event.type !== 'relabel')
    return event.type
  return event.detail === 'recolored' ? 'recolored' : event.detail === 'renamed' ? 'renamed' : 'moved'
}

export function tallyOf(events: DrawingEvent[]): Tally {
  const tally = emptyTally()
  for (const event of events)
    tally[keyOf(event)]++
  return tally
}

/** The detail the counter logs, `counter 3/6`. Anything else is not a count */
export function parseCounter(detail?: string): { named: number, of: number } | null {
  const match = /^counter (\d+)\/(\d+)$/.exec(detail ?? '')
  return match ? { named: Number(match[1]), of: Number(match[2]) } : null
}

export function summarize(events: DrawingEvent[]): TraceSummary {
  const checks: Check[] = []
  let from = 0
  let previous: number | null = null

  events.forEach((event, index) => {
    const count = event.type === 'help' ? parseCounter(event.detail) : null
    if (!count)
      return
    const since = tallyOf(events.slice(from, index).filter(e => e.type !== 'help'))
    checks.push({
      index,
      t: event.t,
      ...count,
      since,
      delta: previous === null ? null : count.named - previous,
      onlyRenames: previous !== null && since.renamed > 0 && !since.stroke && !since.label,
    })
    from = index + 1
    previous = count.named
  })

  return {
    duration: events.at(-1)?.t ?? 0,
    total: tallyOf(events),
    checks,
    after: tallyOf(events.slice(from).filter(e => e.type !== 'help')),
  }
}

const NOUNS: [keyof Tally, string, string][] = [
  ['stroke', 'stroke', 'strokes'],
  ['label', 'label added', 'labels added'],
  ['renamed', 'label renamed', 'labels renamed'],
  ['moved', 'label moved', 'labels moved'],
  ['recolored', 'label recolored', 'labels recolored'],
  ['unlabel', 'label removed', 'labels removed'],
  ['undo', 'undo', 'undos'],
  ['redo', 'redo', 'redos'],
  ['clear', 'clear', 'clears'],
]

export interface TallyEntry {
  key: keyof Tally
  count: number
  /** "strokes", "label added": the noun that goes after the count */
  noun: string
}

/** What a tally counts, one entry for each kind of act that happened */
export function tallyEntries(tally: Tally): TallyEntry[] {
  return NOUNS
    .filter(([key]) => tally[key] > 0)
    .map(([key, one, many]) => ({ key, count: tally[key], noun: tally[key] === 1 ? one : many }))
}

/** "3 strokes, 1 label added", or "nothing" when no act is counted */
export function describeTally(tally: Tally): string {
  const parts = tallyEntries(tally).map(({ count, noun }) => `${count} ${noun}`)
  return parts.length ? parts.join(', ') : 'nothing'
}

/** 75000 -> "1:15" */
export function mmss(ms: number): string {
  const seconds = Math.round(ms / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
