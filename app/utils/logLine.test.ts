import { describe, expect, it } from 'vitest'
import { CELL_PARTS } from '../exercises/cell'
import { buildSession } from './demoSession'
import { kindOf, logLine } from './logLine'
import { condense } from './session'
import { summarize } from './trace'

const events = buildSession([
  { at: 3, stroke: 1 },
  { at: 6, label: 'nucleus' },
  { at: 9, label: 'cyto' },
  { at: 12, check: true },
  { at: 20, rename: ['cyto', 'cytoplasm'] },
  { at: 24, check: true },
], CELL_PARTS)

const summary = summarize(events)
const lines = condense(events).map(step => logLine(events, step, summary, CELL_PARTS))

describe('buildSession', () => {
  it('logs the counter the way the sheet does', () => {
    expect(events.filter(e => e.type === 'help').map(e => e.detail)).toEqual(['counter 1/6', 'counter 2/6'])
  })

  it('keeps the sheet after each act, and the start of a stroke', () => {
    expect(events[0]!.strokes![0]!.start).toBe(2000)
    expect(events[2]!.labels!.map(l => l.text)).toEqual(['nucleus', 'cyto'])
  })

  it('takes the last stroke back on an undo', () => {
    const undone = buildSession([{ at: 1, stroke: 0.5 }, { at: 2, undo: true }], CELL_PARTS)
    expect(undone[1]!.strokes).toEqual([])
  })
})

describe('logLine', () => {
  it('tells the kind of act', () => {
    expect(lines.map(line => line.kind)).toEqual(['draw', 'label', 'label', 'check', 'label', 'check'])
    expect(kindOf('clear')).toBe('undo')
  })

  it('says which part a label names, and none when a word is not known', () => {
    expect(lines[1]!.part).toBe('Nucleus')
    expect(lines[2]!.part).toBeNull()
    expect(lines[0]!.part).toBeUndefined()
  })

  it('gives a rename the part of its new name', () => {
    expect(lines[4]!.detail.from).toBe('cyto')
    expect(lines[4]!.part).toBe('Cytoplasm')
  })

  it('puts a note on a check: since the start, then since the check before', () => {
    expect(lines[3]!.check).toEqual({
      delta: null,
      onlyRenames: false,
      from: 'the start',
      done: [{ count: 1, noun: 'stroke', kind: 'draw' }, { count: 2, noun: 'labels added', kind: 'label' }],
    })
    expect(lines[5]!.check).toEqual({
      delta: 1,
      onlyRenames: true,
      from: 'check 1',
      done: [{ count: 1, noun: 'label renamed', kind: 'label' }],
    })
    expect(lines[1]!.check).toBeUndefined()
  })
})
