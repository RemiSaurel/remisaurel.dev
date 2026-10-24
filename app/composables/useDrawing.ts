import type { InkColor, Stroke } from '~/utils/drawing'
import type { DrawingEvent } from '~/utils/trace'
import { addLabel as addLabelState, clearDrawing, commitStroke, DEFAULT_INK, editLabel as editLabelState, emptyDrawing, redo as redoState, removeLabel as removeLabelState, undo as undoState } from '~/utils/drawing'
import { isHexColor } from '~/utils/highlights'

const round = (n: number, digits: number) => Math.round(n * 10 ** digits) / 10 ** digits

/**
 * The state of one drawing: its strokes, labels and history, the stroke being drawn, the pen in hand,
 * and a log of what the person did. The log is the start of a trace of the interaction: it keeps what the
 * strokes alone lose, like the strokes that were undone.
 */
export function useDrawing() {
  const state = shallowRef(emptyDrawing())
  const live = shallowRef<Stroke | null>(null)
  const events = shallowRef<DrawingEvent[]>([])

  const color = ref<InkColor>(DEFAULT_INK)
  const size = ref(4)

  // The session starts with the first stroke, so a drawing opened and left alone has no duration
  let origin: number | null = null
  let strokeOrigin = 0
  let nextId = 1

  const strokes = computed(() => state.value.strokes)
  const labels = computed(() => state.value.labels)
  const canUndo = computed(() => state.value.past.length > 0)
  const canRedo = computed(() => state.value.future.length > 0)

  // The session starts with the first act, whichever it is
  const sinceStart = () => {
    const now = performance.now()
    origin ??= now
    return Math.round(now - origin)
  }

  function log(type: DrawingEvent['type'], detail?: string) {
    // The arrays are never changed, only replaced: keeping them in the log costs a reference each
    const { strokes, labels } = state.value
    events.value = [...events.value, { t: origin === null ? 0 : sinceStart(), type, ...(detail ? { detail } : {}), strokes, labels }]
  }

  function begin(x: number, y: number, pressure: number, pen: boolean) {
    const now = performance.now()
    origin ??= now
    strokeOrigin = now
    live.value = {
      id: nextId++,
      // The colour ends up in the SVG: anything but a hex colour is left out
      color: isHexColor(color.value) ? color.value : DEFAULT_INK,
      size: size.value,
      pen,
      start: Math.round(now - origin),
      points: [[round(x, 1), round(y, 1), round(pressure, 2), 0]],
    }
  }

  function extend(x: number, y: number, pressure: number) {
    const stroke = live.value
    if (!stroke)
      return
    stroke.points.push([round(x, 1), round(y, 1), round(pressure, 2), Math.round(performance.now() - strokeOrigin)])
    // A new object each time, so what reads the stroke is told it changed
    live.value = { ...stroke }
  }

  function finish() {
    const stroke = live.value
    if (!stroke)
      return
    live.value = null
    state.value = commitStroke(state.value, stroke)
    log('stroke')
  }

  function cancel() {
    live.value = null
  }

  function undo() {
    if (!canUndo.value)
      return
    state.value = undoState(state.value)
    log('undo')
  }

  function redo() {
    if (!canRedo.value)
      return
    state.value = redoState(state.value)
    log('redo')
  }

  function clear() {
    if (!strokes.value.length && !labels.value.length)
      return
    state.value = clearDrawing(state.value)
    log('clear')
  }

  /** A point, or a zone when it has a size. It takes the colour of the pen in hand */
  function addLabel(x: number, y: number, text: string, size?: { w: number, h: number }) {
    const before = state.value
    state.value = addLabelState(before, {
      id: nextId++,
      x: round(x, 1),
      y: round(y, 1),
      ...(size ? { w: round(size.w, 1), h: round(size.h, 1) } : {}),
      color: color.value,
      text,
      start: sinceStart(),
    })
    if (state.value !== before)
      log('label')
  }

  /** The label stays where it appeared in the replay: only the final position and colour are kept */
  function editLabel(id: number, patch: { x?: number, y?: number, text?: string, color?: InkColor }) {
    const before = state.value
    state.value = editLabelState(before, id, {
      ...patch,
      ...(patch.x !== undefined ? { x: round(patch.x, 1) } : {}),
      ...(patch.y !== undefined ? { y: round(patch.y, 1) } : {}),
    })
    if (state.value === before)
      return
    log('relabel', patch.color !== undefined ? 'recolored' : patch.text !== undefined ? 'renamed' : 'moved')
  }

  function removeLabel(id: number) {
    const before = state.value
    state.value = removeLabelState(before, id)
    if (state.value !== before)
      log('unlabel')
  }

  return { strokes, labels, live, events, color, size, canUndo, canRedo, begin, extend, finish, cancel, undo, redo, clear, addLabel, editLabel, removeLabel, log }
}

export type Drawing = ReturnType<typeof useDrawing>
