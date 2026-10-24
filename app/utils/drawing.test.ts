import type { Label, Stroke } from './drawing'
import { describe, expect, it } from 'vitest'
import { addLabel, clampToBoard, clearDrawing, commitStroke, DEFAULT_INK, editLabel, emptyDrawing, INK_PALETTE, inkOnDark, isZone, labelsAt, MAX_LABEL_LENGTH, MIN_ZONE, redo, removeLabel, strokeDuration, strokePath, strokesAt, timelineOf, undo, zoneOf } from './drawing'
import { isHexColor } from './highlights'

function stroke(id: number, start: number, ts: number[]): Stroke {
  return {
    id,
    color: DEFAULT_INK,
    size: 4,
    pen: false,
    start,
    points: ts.map((t, i) => [i * 10, i * 5, 0.5, t]),
  }
}

function label(id: number, start: number, text = 'nucleus'): Label {
  return { id, x: 10, y: 20, color: DEFAULT_INK, text, start }
}

describe('inks', () => {
  it('has only hex colours in the palette, and none twice', () => {
    expect(INK_PALETTE.every(ink => isHexColor(ink.value))).toBe(true)
    expect(new Set(INK_PALETTE.map(ink => ink.value)).size).toBe(INK_PALETTE.length)
  })

  it('starts with the first ink of the palette', () => {
    expect(DEFAULT_INK).toBe(INK_PALETTE[0]!.value)
  })

  it('shows the black ink light on a dark sheet, and every other ink as it is', () => {
    expect(inkOnDark(DEFAULT_INK)).toBe('#f5f5f5')
    expect(inkOnDark('#000')).toBe('#f5f5f5')
    expect(INK_PALETTE.slice(1).map(ink => inkOnDark(ink.value))).toEqual(INK_PALETTE.slice(1).map(ink => ink.value))
  })

  it('leaves what is not a hex colour alone', () => {
    expect(inkOnDark('red')).toBe('red')
  })
})

describe('history', () => {
  it('adds strokes in order', () => {
    const state = commitStroke(commitStroke(emptyDrawing(), stroke(1, 0, [0, 100])), stroke(2, 200, [0, 100]))
    expect(state.strokes.map(s => s.id)).toEqual([1, 2])
  })

  it('undoes then redoes, one stroke at a time', () => {
    const drawn = commitStroke(commitStroke(emptyDrawing(), stroke(1, 0, [0, 100])), stroke(2, 200, [0, 100]))
    const undone = undo(drawn)
    expect(undone.strokes.map(s => s.id)).toEqual([1])
    expect(redo(undone).strokes.map(s => s.id)).toEqual([1, 2])
  })

  it('forgets what was undone once something new is drawn', () => {
    const undone = undo(commitStroke(emptyDrawing(), stroke(1, 0, [0, 100])))
    const state = commitStroke(undone, stroke(2, 500, [0, 100]))
    expect(state.future).toEqual([])
    expect(redo(state)).toBe(state)
  })

  it('does nothing to undo or redo at the ends of the history', () => {
    const empty = emptyDrawing()
    expect(undo(empty)).toBe(empty)
    expect(redo(empty)).toBe(empty)
  })

  it('brings a cleared drawing back with undo', () => {
    const drawn = commitStroke(commitStroke(emptyDrawing(), stroke(1, 0, [0, 100])), stroke(2, 200, [0, 100]))
    const cleared = clearDrawing(drawn)
    expect(cleared.strokes).toEqual([])
    expect(undo(cleared).strokes.map(s => s.id)).toEqual([1, 2])
  })

  it('does not record clearing an empty drawing', () => {
    const empty = emptyDrawing()
    expect(clearDrawing(empty)).toBe(empty)
  })
})

describe('labels', () => {
  it('adds a label with its text trimmed and cut to length', () => {
    const state = addLabel(emptyDrawing(), label(1, 0, `  ${'x'.repeat(MAX_LABEL_LENGTH + 10)}  `))
    expect(state.labels[0]!.text).toBe('x'.repeat(MAX_LABEL_LENGTH))
  })

  it('ignores a label with no text', () => {
    const empty = emptyDrawing()
    expect(addLabel(empty, label(1, 0, '   '))).toBe(empty)
  })

  it('removes a label by id, and ignores an id it does not know', () => {
    const state = addLabel(addLabel(emptyDrawing(), label(1, 0, 'nucleus')), label(2, 10, 'membrane'))
    expect(removeLabel(state, 1).labels.map(l => l.id)).toEqual([2])
    expect(removeLabel(state, 9)).toBe(state)
  })

  it('undoes and redoes labels along with the strokes', () => {
    const drawn = addLabel(commitStroke(emptyDrawing(), stroke(1, 0, [0, 100])), label(1, 200))
    const undone = undo(drawn)
    expect(undone.labels).toEqual([])
    expect(undone.strokes).toHaveLength(1)
    expect(redo(undone).labels.map(l => l.id)).toEqual([1])
  })

  it('clears the labels with the strokes, and brings both back with undo', () => {
    const drawn = addLabel(commitStroke(emptyDrawing(), stroke(1, 0, [0, 100])), label(1, 200))
    const cleared = clearDrawing(drawn)
    expect([cleared.strokes.length, cleared.labels.length]).toEqual([0, 0])
    const back = undo(cleared)
    expect([back.strokes.length, back.labels.length]).toEqual([1, 1])
  })

  it('keeps a zone, and makes a zone too small a point', () => {
    const zone = addLabel(emptyDrawing(), { ...label(1, 0), w: 60, h: 40 }).labels[0]!
    expect([isZone(zone), zone.w, zone.h]).toEqual([true, 60, 40])
    const tiny = addLabel(emptyDrawing(), { ...label(2, 0), w: MIN_ZONE - 1, h: 40 }).labels[0]!
    expect([isZone(tiny), tiny.w, tiny.h]).toEqual([false, undefined, undefined])
  })

  it('replaces a colour that is not a hex colour', () => {
    expect(addLabel(emptyDrawing(), { ...label(1, 0), color: 'url(#x)' }).labels[0]!.color).toBe(DEFAULT_INK)
  })

  it('clears a sheet that only has labels', () => {
    const state = addLabel(emptyDrawing(), label(1, 0))
    expect(clearDrawing(state).labels).toEqual([])
  })
})

describe('editLabel', () => {
  const base = addLabel(emptyDrawing(), { ...label(1, 0), w: 60, h: 40 })

  it('moves a label and keeps its zone', () => {
    const moved = editLabel(base, 1, { x: 100, y: 120 }).labels[0]!
    expect([moved.x, moved.y, moved.w, moved.h]).toEqual([100, 120, 60, 40])
  })

  it('recolours and renames', () => {
    const edited = editLabel(editLabel(base, 1, { color: '#dc2626' }), 1, { text: ' Noyau ' }).labels[0]!
    expect([edited.color, edited.text]).toEqual(['#dc2626', 'Noyau'])
  })

  it('is one step of the history, which undo takes back', () => {
    const moved = editLabel(base, 1, { x: 100 })
    expect(undo(moved).labels[0]!.x).toBe(10)
  })

  it('keeps the old name when the new one is empty', () => {
    expect(editLabel(base, 1, { text: '   ' })).toBe(base)
  })

  it('records nothing when nothing changes, or for a label it does not know', () => {
    expect(editLabel(base, 1, { x: 10, y: 20 })).toBe(base)
    expect(editLabel(base, 9, { x: 50 })).toBe(base)
  })

  it('refuses a colour that is not a hex colour', () => {
    expect(editLabel(base, 1, { color: 'red' }).labels[0]!.color).toBe(DEFAULT_INK)
  })
})

describe('zones', () => {
  it('is the same whichever corner it was dragged from', () => {
    expect(zoneOf({ x: 50, y: 80 }, { x: 10, y: 20 })).toEqual({ x: 10, y: 20, w: 40, h: 60 })
  })

  it('keeps a box on the board by moving it, not by resizing it', () => {
    const board = { width: 640, height: 400 }
    expect(clampToBoard({ x: -20, y: 500, w: 100, h: 50 }, board)).toEqual({ x: 0, y: 350 })
    expect(clampToBoard({ x: 630, y: 10 }, board)).toEqual({ x: 630, y: 10 })
    expect(clampToBoard({ x: 630, y: 10, w: 100, h: 20 }, board)).toEqual({ x: 540, y: 10 })
  })
})

describe('timeline', () => {
  it('lasts as long as the strokes when they follow each other', () => {
    const { items, duration } = timelineOf([stroke(1, 0, [0, 100]), stroke(2, 100, [0, 50])])
    expect(items.map(i => [i.from, i.to])).toEqual([[0, 100], [100, 150]])
    expect(duration).toBe(150)
  })

  it('squeezes a long pause down to the maximum gap', () => {
    const { items, duration } = timelineOf([stroke(1, 0, [0, 100]), stroke(2, 5100, [0, 50])], [], 600)
    expect(items[1]!.from).toBe(700)
    expect(duration).toBe(750)
  })

  it('starts at zero even when the first stroke came late', () => {
    expect(timelineOf([stroke(1, 9000, [0, 100])]).items[0]!.from).toBe(0)
  })

  it('is empty for an empty drawing', () => {
    expect(timelineOf([])).toEqual({ items: [], labels: [], duration: 0 })
  })

  it('puts a label after the stroke that came before it, and squeezes the wait', () => {
    const { labels, duration } = timelineOf([stroke(1, 0, [0, 100])], [label(1, 5000)])
    expect(labels.map(l => l.at)).toEqual([700])
    expect(duration).toBe(700)
  })

  it('puts a label between two strokes where it was made', () => {
    const { items, labels } = timelineOf([stroke(1, 0, [0, 100]), stroke(2, 1000, [0, 50])], [label(1, 400)])
    expect(labels[0]!.at).toBe(400)
    expect(items[1]!.from).toBe(1000)
  })

  it('starts at zero when the first thing done is a label', () => {
    expect(timelineOf([], [label(1, 9000)]).labels[0]!.at).toBe(0)
  })
})

describe('strokesAt', () => {
  const timeline = timelineOf([stroke(1, 0, [0, 50, 100]), stroke(2, 100, [0, 50, 100])])

  it('starts with the first point of the first stroke', () => {
    expect(strokesAt(timeline, 0).map(s => s.points.length)).toEqual([1])
  })

  it('cuts the stroke being drawn where the pen was', () => {
    const [first] = strokesAt(timeline, 60)
    expect(first!.points.map(p => p[3])).toEqual([0, 50])
  })

  it('keeps finished strokes as the same objects, and adds the next when it starts', () => {
    const visible = strokesAt(timeline, 150)
    expect(visible).toHaveLength(2)
    expect(visible[0]).toBe(timeline.items[0]!.stroke)
    expect(visible[1]!.points).toHaveLength(2)
  })

  it('shows the whole drawing at the end', () => {
    expect(strokesAt(timeline, timeline.duration).map(s => s.points.length)).toEqual([3, 3])
  })
})

describe('labelsAt', () => {
  const timeline = timelineOf([stroke(1, 0, [0, 100])], [label(1, 100), label(2, 200, 'membrane')])

  it('shows a label once its time has come', () => {
    expect(labelsAt(timeline, 50)).toEqual([])
    expect(labelsAt(timeline, 100).map(l => l.id)).toEqual([1])
    expect(labelsAt(timeline, timeline.duration).map(l => l.id)).toEqual([1, 2])
  })
})

describe('strokePath', () => {
  it('draws a closed shape', () => {
    const d = strokePath(stroke(1, 0, [0, 10, 20, 30]))
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
  })

  it('draws a single tap as a dot', () => {
    expect(strokePath(stroke(1, 0, [0])).length).toBeGreaterThan(0)
  })

  it('reaches the last point once the stroke is finished, not while it is drawn', () => {
    const s = stroke(1, 0, [0, 10, 20])
    expect(strokePath(s, false)).not.toBe(strokePath(s, true))
  })

  it('follows a stroke that grows in place', () => {
    const live = stroke(1, 0, [0, 10])
    const before = strokePath(live)
    live.points.push([40, 30, 0.5, 20])
    expect(strokePath(live)).not.toBe(before)
  })

  it('measures a stroke by its last point', () => {
    expect(strokeDuration(stroke(1, 0, [0, 10, 25]))).toBe(25)
    expect(strokeDuration({ ...stroke(1, 0, []), points: [] })).toBe(0)
  })
})
