import type { ExpectedPart } from './labelMatch'
import type { Step, StepDetail } from './session'
import type { DrawingEvent, Tally, TraceSummary } from './trace'
import { namesPart } from './labelMatch'
import { detailOf } from './session'
import { tallyEntries } from './trace'

// A line of the teacher's log as the cells it is drawn in: when, what kind of act, what it was, which part
// it named, and for a check what came before it. The log and the pages that explain it draw the same line.

export type Kind = 'draw' | 'label' | 'undo' | 'check'

const KINDS: Record<DrawingEvent['type'], Kind> = {
  stroke: 'draw',
  label: 'label',
  relabel: 'label',
  unlabel: 'label',
  undo: 'undo',
  redo: 'undo',
  clear: 'undo',
  help: 'check',
}

/** The colour of each kind of act, on the log, the timeline and the pages that explain them */
export const KIND_COLORS: Record<Kind, string> = {
  draw: 'rgb(115 115 115)',
  label: 'rgb(59 130 246)',
  undo: 'rgb(244 63 94)',
  check: 'rgb(16 185 129)',
}

export const kindOf = (type: DrawingEvent['type']): Kind => KINDS[type]

const TALLY_KINDS: Record<keyof Tally, Kind> = {
  stroke: 'draw',
  label: 'label',
  renamed: 'label',
  moved: 'label',
  recolored: 'label',
  unlabel: 'label',
  undo: 'undo',
  redo: 'undo',
  clear: 'undo',
  help: 'check',
}

/** One kind of act done between two checks: "2 labels added" */
export interface Done {
  count: number
  noun: string
  kind: Kind
}

/** What a check says about the work between it and the check before */
export interface CheckNote {
  /** The change in the count since the check before. Null for the first one */
  delta: number | null
  onlyRenames: boolean
  /** What it counts from: "the start", or "check 1" */
  from: string
  /** What was done since, by kind of act. Empty when nothing was */
  done: Done[]
}

export interface LogLine {
  detail: StepDetail
  kind: Kind
  /** ms since the first act, when the step began */
  from: number
  /** The part the label of this act names: its name, null when it names none, undefined when the act names nothing */
  part?: string | null
  check?: CheckNote
}

export function logLine(events: DrawingEvent[], step: Step, summary: TraceSummary, parts: ExpectedPart[]): LogLine {
  const detail = detailOf(events, step)
  const rank = summary.checks.findIndex(check => check.index === step.first)
  const check = summary.checks[rank]

  return {
    detail,
    kind: kindOf(events[step.first]!.type),
    from: step.from,
    part: detail.naming ? (detail.name ? parts.find(part => namesPart(detail.name!, part))?.name ?? null : null) : undefined,
    check: check && {
      delta: check.delta,
      onlyRenames: check.onlyRenames,
      from: rank === 0 ? 'the start' : `check ${rank}`,
      done: tallyEntries(check.since).map(({ key, count, noun }) => ({ count, noun, kind: TALLY_KINDS[key] })),
    },
  }
}
