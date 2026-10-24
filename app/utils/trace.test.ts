import type { DrawingEvent } from './trace'
import { describe, expect, it } from 'vitest'
import { describeTally, emptyTally, mmss, parseCounter, summarize, tallyOf } from './trace'

const at = (t: number, type: DrawingEvent['type'], detail?: string): DrawingEvent => ({ t, type, ...(detail ? { detail } : {}) })

describe('tallyOf', () => {
  it('counts each act, and tells what a relabel changed', () => {
    const tally = tallyOf([at(0, 'stroke'), at(1, 'stroke'), at(2, 'label'), at(3, 'relabel', 'renamed'), at(4, 'relabel', 'moved'), at(5, 'relabel', 'recolored'), at(6, 'undo'), at(7, 'help', 'counter 1/6')])
    expect(tally).toEqual({ ...emptyTally(), stroke: 2, label: 1, renamed: 1, moved: 1, recolored: 1, undo: 1, help: 1 })
  })

  it('is empty for an empty log', () => {
    expect(tallyOf([])).toEqual(emptyTally())
  })
})

describe('parseCounter', () => {
  it('reads what the counter logs', () => {
    expect(parseCounter('counter 3/6')).toEqual({ named: 3, of: 6 })
  })

  it('ignores anything else', () => {
    for (const detail of [undefined, '', 'counter', 'counter 3', 'hint 3/6', 'counter 3/6 more'])
      expect(parseCounter(detail)).toBeNull()
  })
})

describe('summarize', () => {
  it('is empty for an empty log', () => {
    expect(summarize([])).toEqual({ duration: 0, total: emptyTally(), checks: [], after: emptyTally() })
  })

  it('lasts until the last act', () => {
    expect(summarize([at(0, 'stroke'), at(4200, 'stroke')]).duration).toBe(4200)
  })

  it('has no check when help was never asked', () => {
    const { checks, after } = summarize([at(0, 'stroke'), at(10, 'label')])
    expect(checks).toEqual([])
    expect(after.stroke).toBe(1)
  })

  it('tells what was done between two checks, and how the count moved', () => {
    const { checks, after } = summarize([
      at(0, 'stroke'),
      at(10, 'label'),
      at(20, 'help', 'counter 1/6'),
      at(30, 'stroke'),
      at(40, 'label'),
      at(50, 'label'),
      at(60, 'help', 'counter 3/6'),
      at(70, 'undo'),
    ])
    expect(checks.map(c => [c.t, c.named, c.of, c.delta])).toEqual([[20, 1, 6, null], [60, 3, 6, 2]])
    expect(checks.map(c => c.index)).toEqual([2, 6])
    expect(checks[0]!.since).toEqual({ ...emptyTally(), stroke: 1, label: 1 })
    expect(checks[1]!.since).toEqual({ ...emptyTally(), stroke: 1, label: 2 })
    expect(after).toEqual({ ...emptyTally(), undo: 1 })
  })

  it('flags a check that only follows renames', () => {
    const { checks } = summarize([
      at(0, 'stroke'),
      at(10, 'label'),
      at(20, 'help', 'counter 0/6'),
      at(30, 'relabel', 'renamed'),
      at(40, 'help', 'counter 1/6'),
      at(50, 'relabel', 'moved'),
      at(60, 'help', 'counter 1/6'),
    ])
    expect(checks.map(c => c.onlyRenames)).toEqual([false, true, false])
  })

  it('does not flag renames that come with new labels or strokes', () => {
    const { checks } = summarize([at(0, 'label'), at(5, 'help', 'counter 0/6'), at(10, 'relabel', 'renamed'), at(20, 'label'), at(30, 'help', 'counter 2/6')])
    expect(checks[1]!.onlyRenames).toBe(false)
  })

  it('does not count a help that is not a count as a check', () => {
    const { checks, total } = summarize([at(0, 'stroke'), at(10, 'help', 'question 1'), at(20, 'help')])
    expect(checks).toEqual([])
    expect(total.help).toBe(2)
  })
})

describe('describeTally', () => {
  it('says nothing when nothing was done', () => {
    expect(describeTally(emptyTally())).toBe('nothing')
  })

  it('counts in the order of the work, with one or many', () => {
    expect(describeTally({ ...emptyTally(), stroke: 1, label: 2, renamed: 1, undo: 3 })).toBe('1 stroke, 2 labels added, 1 label renamed, 3 undos')
  })

  it('leaves checks out: they are the ones that cut the log', () => {
    expect(describeTally({ ...emptyTally(), help: 4 })).toBe('nothing')
  })
})

describe('mmss', () => {
  it('writes minutes and padded seconds', () => {
    expect([mmss(0), mmss(9400), mmss(75000), mmss(600000)]).toEqual(['0:00', '0:09', '1:15', '10:00'])
  })
})
