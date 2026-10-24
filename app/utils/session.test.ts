import type { Label, Stroke } from './drawing'
import type { DrawingEvent } from './trace'
import { describe, expect, it } from 'vitest'
import { activeSpans, condense, describeEvent, detailOf, frameAt, squeeze, within } from './session'

function stroke(id: number, start: number, ts: number[]): Stroke {
  return { id, color: '#171717', size: 4, pen: false, start, points: ts.map((t, i) => [i * 10, i * 5, 0.5, t]) }
}

function label(id: number, text: string, patch: Partial<Label> = {}): Label {
  return { id, x: 10, y: 20, color: '#171717', text, start: 0, ...patch }
}

// A short session: a stroke from 0 to 100 ms, a label at 400, a rename at 900, an undo at 1000
const s1 = stroke(1, 0, [0, 50, 100])
const nucleus = label(2, 'nucleus')
const events: DrawingEvent[] = [
  { t: 100, type: 'stroke', strokes: [s1], labels: [] },
  { t: 400, type: 'label', strokes: [s1], labels: [nucleus] },
  { t: 900, type: 'relabel', detail: 'renamed', strokes: [s1], labels: [{ ...nucleus, text: 'noyau' }] },
  { t: 1000, type: 'undo', strokes: [s1], labels: [nucleus] },
]

describe('frameAt', () => {
  it('is an empty sheet before anything is done', () => {
    expect(frameAt([], 50)).toEqual({ strokes: [], labels: [], index: -1 })
    expect(frameAt([{ t: 500, type: 'label', strokes: [], labels: [nucleus] }], 100).labels).toEqual([])
  })

  it('cuts the stroke being drawn where the pen was', () => {
    const frame = frameAt(events, 60)
    expect(frame.index).toBe(-1)
    expect(frame.strokes[0]!.points.map(p => p[3])).toEqual([0, 50])
  })

  it('keeps the first point of a stroke that has just begun', () => {
    expect(frameAt(events, 0).strokes[0]!.points).toHaveLength(1)
  })

  it('shows the sheet right after the last act', () => {
    const frame = frameAt(events, 950)
    expect(frame.index).toBe(2)
    expect(frame.labels.map(l => l.text)).toEqual(['noyau'])
    expect(frame.strokes[0]).toBe(s1)
  })

  it('shows what an undo took back, and keeps the final sheet at the end', () => {
    expect(frameAt(events, 1000).labels.map(l => l.text)).toEqual(['nucleus'])
    expect(frameAt(events, 99999).index).toBe(3)
  })

  it('keeps a stroke that was undone at the time it was drawn', () => {
    const undone: DrawingEvent[] = [
      { t: 100, type: 'stroke', strokes: [s1], labels: [] },
      { t: 200, type: 'undo', strokes: [], labels: [] },
    ]
    expect(frameAt(undone, 150).strokes).toEqual([s1])
    expect(frameAt(undone, 200).strokes).toEqual([])
  })
})

describe('activeSpans', () => {
  it('spans a stroke from its start, and an act that is not a stroke at its time', () => {
    expect(activeSpans(events)).toEqual([[0, 100], [400, 400], [900, 900], [1000, 1000]])
  })
})

describe('squeeze', () => {
  it('is as long as the work when there is no pause', () => {
    const clock = squeeze([[0, 100], [100, 250]])
    expect(clock.duration).toBe(250)
    expect(clock.clockAt(175)).toBe(175)
  })

  it('spends at most the maximum on a pause', () => {
    const clock = squeeze([[0, 100], [5100, 5200]], 600)
    expect(clock.duration).toBe(800)
    expect(clock.clockAt(100)).toBe(100)
    expect(clock.clockAt(5100)).toBe(700)
    expect(clock.clockAt(5200)).toBe(800)
  })

  it('runs through a pause in a straight line, and back', () => {
    const clock = squeeze([[0, 100], [5100, 5200]], 600)
    expect(clock.clockAt(2600)).toBe(400)
    expect(clock.timeAt(400)).toBeCloseTo(2600)
    expect(clock.timeAt(clock.clockAt(5150))).toBeCloseTo(5150)
  })

  it('stays inside the session', () => {
    const clock = squeeze([[0, 100]])
    expect([clock.clockAt(-5), clock.clockAt(9999), clock.timeAt(-5), clock.timeAt(9999)]).toEqual([0, 100, 0, 100])
  })

  it('is empty without spans', () => {
    const clock = squeeze([])
    expect([clock.duration, clock.clockAt(10), clock.timeAt(10)]).toEqual([0, 0, 0])
  })

  it('does not count a pause twice when spans overlap', () => {
    expect(squeeze([[0, 300], [100, 200], [250, 400]]).duration).toBe(400)
  })
})

describe('describeEvent', () => {
  it('describes each act', () => {
    expect(events.map((_, i) => describeEvent(events, i))).toEqual([
      'Stroke of 0.1 s',
      'Label added: "nucleus"',
      'Label renamed: "nucleus" to "noyau"',
      'Undo',
    ])
  })

  it('tells a zone from a point', () => {
    const zone: DrawingEvent[] = [{ t: 0, type: 'label', strokes: [], labels: [label(1, 'noyau', { w: 40, h: 30 })] }]
    expect(describeEvent(zone, 0)).toBe('Zone added: "noyau"')
  })

  it('tells what was moved, recolored or removed', () => {
    const base = label(1, 'noyau')
    const log: DrawingEvent[] = [
      { t: 0, type: 'label', strokes: [], labels: [base] },
      { t: 1, type: 'relabel', detail: 'moved', strokes: [], labels: [{ ...base, x: 99 }] },
      { t: 2, type: 'relabel', detail: 'recolored', strokes: [], labels: [{ ...base, x: 99, color: '#dc2626' }] },
      { t: 3, type: 'unlabel', strokes: [], labels: [] },
    ]
    expect([1, 2, 3].map(i => describeEvent(log, i))).toEqual(['Label "noyau" moved', 'Label "noyau" recolored', 'Label removed: "noyau"'])
  })

  it('counts what a clear took away', () => {
    const log: DrawingEvent[] = [
      { t: 0, type: 'stroke', strokes: [s1], labels: [nucleus] },
      { t: 1, type: 'clear', strokes: [], labels: [] },
    ]
    expect(describeEvent(log, 1)).toBe('Sheet cleared: 2 items')
  })

  it('reads the count of a check', () => {
    expect(describeEvent([{ t: 0, type: 'help', detail: 'counter 3/6' }], 0)).toBe('Asked for the count: 3 of 6')
    expect(describeEvent([{ t: 0, type: 'help' }], 0)).toBe('Asked for help')
  })

  it('is empty for an act that does not exist', () => {
    expect(describeEvent([], 0)).toBe('')
  })
})

describe('condense', () => {
  // Three strokes a second apart, a pause, a fourth, then a label and a move of it
  const strokes = [stroke(1, 0, [0, 400]), stroke(2, 1000, [1000, 1400]), stroke(3, 2000, [2000, 2400]), stroke(4, 9000, [9000, 9400])]
  const log: DrawingEvent[] = [
    ...strokes.map((_, i) => ({ t: [400, 1400, 2400, 9400][i]!, type: 'stroke' as const, strokes: strokes.slice(0, i + 1), labels: [] })),
    { t: 9600, type: 'label', strokes, labels: [nucleus] },
    { t: 9800, type: 'relabel', detail: 'moved', strokes, labels: [{ ...nucleus, x: 50 }] },
    { t: 10000, type: 'relabel', detail: 'moved', strokes, labels: [{ ...nucleus, x: 80 }] },
  ]

  it('joins the strokes that follow each other closely, and cuts at a pause', () => {
    expect(condense(log).map(step => [step.first, step.last])).toEqual([[0, 2], [3, 3], [4, 4], [5, 6]])
  })

  it('begins a step where its first stroke began, and ends it where the sheet is left', () => {
    expect(condense(log)[0]).toEqual({ first: 0, last: 2, from: 0, t: 2400 })
  })

  it('keeps a label, a rename, a clear and a check on their own', () => {
    const alone: DrawingEvent[] = [
      { t: 0, type: 'label', strokes: [], labels: [nucleus] },
      { t: 100, type: 'relabel', detail: 'renamed', strokes: [], labels: [{ ...nucleus, text: 'noyau' }] },
      { t: 200, type: 'relabel', detail: 'renamed', strokes: [], labels: [{ ...nucleus, text: 'nucleus' }] },
      { t: 300, type: 'help', detail: 'counter 1/6' },
      { t: 400, type: 'help', detail: 'counter 1/6' },
      { t: 500, type: 'clear', strokes: [], labels: [] },
    ]
    expect(condense(alone)).toHaveLength(6)
  })

  it('does not join two different labels moved, nor a stroke and an undo', () => {
    const other = label(3, 'noyau')
    const mixed: DrawingEvent[] = [
      { t: 0, type: 'label', strokes: [], labels: [nucleus, other] },
      { t: 100, type: 'relabel', detail: 'moved', strokes: [], labels: [{ ...nucleus, x: 50 }, other] },
      { t: 200, type: 'relabel', detail: 'moved', strokes: [], labels: [{ ...nucleus, x: 50 }, { ...other, x: 60 }] },
      { t: 300, type: 'undo', strokes: [], labels: [{ ...nucleus, x: 50 }, other] },
    ]
    expect(condense(mixed)).toHaveLength(4)
  })

  it('is empty for an empty log', () => {
    expect(condense([])).toEqual([])
  })
})

describe('detailOf', () => {
  const log: DrawingEvent[] = [
    { t: 100, type: 'stroke', strokes: [s1], labels: [] },
    { t: 600, type: 'stroke', strokes: [s1], labels: [] },
    { t: 700, type: 'undo', strokes: [], labels: [] },
    { t: 800, type: 'undo', strokes: [], labels: [] },
    { t: 900, type: 'redo', strokes: [s1], labels: [] },
    { t: 1000, type: 'label', strokes: [s1], labels: [nucleus] },
    { t: 1100, type: 'relabel', detail: 'moved', strokes: [s1], labels: [{ ...nucleus, x: 40 }] },
    { t: 1200, type: 'relabel', detail: 'moved', strokes: [s1], labels: [{ ...nucleus, x: 90 }] },
    { t: 9000, type: 'relabel', detail: 'renamed', strokes: [s1], labels: [{ ...nucleus, x: 90, text: 'noyau' }] },
    { t: 9500, type: 'help', detail: 'counter 1/6', strokes: [s1], labels: [{ ...nucleus, x: 90, text: 'noyau' }] },
    { t: 9600, type: 'clear', strokes: [], labels: [] },
  ]
  const [strokes, undos, added, moved, renamed, check, cleared] = condense(log).map(step => detailOf(log, step))

  it('says how many strokes and for how long', () => {
    expect(strokes).toEqual({ what: '2 strokes', meta: '0.6 s' })
  })

  it('counts undos and redos', () => {
    expect(undos).toEqual({ what: 'Undo, redo', meta: '2 undos, 1 redo' })
  })

  it('names the label an act is about, and marks the acts that name it', () => {
    expect(added).toEqual({ what: 'Label added', name: 'nucleus', naming: true })
    expect(renamed).toEqual({ what: 'Renamed', from: 'nucleus', name: 'noyau', naming: true })
  })

  it('says what a label moved again and again ended up doing', () => {
    expect(moved).toEqual({ what: 'Moved', name: 'nucleus', meta: '2 times' })
  })

  it('reads a check and a clear', () => {
    expect(check).toEqual({ what: 'Check', meta: '1 of 6 named' })
    expect(cleared).toEqual({ what: 'Cleared', meta: '2 items' })
  })
})

describe('within', () => {
  it('gives back each act of a step, with its own start and end', () => {
    const strokes = [stroke(1, 0, [0, 400]), stroke(2, 1000, [1000, 1400])]
    const log: DrawingEvent[] = [
      { t: 400, type: 'stroke', strokes: [strokes[0]!], labels: [] },
      { t: 1400, type: 'stroke', strokes, labels: [] },
    ]
    const [step] = condense(log)
    expect(within(log, step!)).toEqual([
      { first: 0, last: 0, from: 0, t: 400 },
      { first: 1, last: 1, from: 1000, t: 1400 },
    ])
  })

  it('is one act for a step that stands alone', () => {
    expect(within(events, condense(events)[1]!)).toEqual([{ first: 1, last: 1, from: 400, t: 400 }])
  })
})
