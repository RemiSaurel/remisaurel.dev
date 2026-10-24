<script setup lang="ts">
import type { Drawing } from '~/composables/useDrawing'
import type { DrawingBoardSize, Label, Stroke } from '~/utils/drawing'
import { useRafFn } from '@vueuse/core'
import { clampToBoard, INK_PALETTE, inkOnDark, isZone, labelsAt, MAX_LABEL_LENGTH, MIN_ZONE, strokePath, strokesAt, timelineOf, zoneOf } from '~/utils/drawing'
import { mmss } from '~/utils/trace'

// A sheet to draw on, with its tools: pen (ink, size) and label, undo and redo, clear. Under the sheet,
// a replay of how the drawing was made, and a slot for whatever the page wants to say about it. The
// state lives in a drawing (see useDrawing), owned by the parent, so the parent can read the strokes,
// the labels and the trace. The sheet is an SVG with a fixed board, so it scales with its container
// and what is drawn does not move. It is white paper on any theme: a drawing is an answer, and what
// the teacher sees must be what the learner drew, in the colours they chose.
//
// <DrawingBoard :drawing="drawing" label="Your drawing of a cell"><template #stats>…</template></DrawingBoard>
interface DrawingBoardProps {
  drawing: Drawing
  /** Names the drawing for assistive technology */
  label: string
  board?: DrawingBoardSize
  /** Shows the drawing and its replay, with no tools: what a teacher gets */
  readonly?: boolean
  /** The sheet as the parent shows it, in place of the drawing and its replay: a reader moving through a session */
  frame?: { strokes: Stroke[], labels: Label[] }
  /** The labels to point at, by id: they are lit, and the others dimmed. For a reader who looks for a part */
  spotlight?: number[]
}

const props = withDefaults(defineProps<DrawingBoardProps>(), {
  board: () => ({ width: 640, height: 400 }),
  spotlight: () => [],
})

defineSlots<{
  /** In the foot of the sheet, beside the replay */
  stats?: () => any
}>()

type Tool = 'pen' | 'label'

const TOOLS: { id: Tool, label: string, icon: string }[] = [
  { id: 'pen', label: 'Pen', icon: 'lucide:pencil' },
  { id: 'label', label: 'Label: click a part of the drawing, or drag around it, and name it', icon: 'lucide:tag' },
]

const SIZES = [
  { value: 3, label: 'Thin', dot: 4 },
  { value: 6, label: 'Medium', dot: 8 },
  { value: 12, label: 'Thick', dot: 13 },
]

const svg = ref<SVGSVGElement>()
const mode = ref<Tool>('pen')
// Whether the sheet shows the replay instead of the drawing, and the replay's clock
const replaying = ref(false)
const playing = ref(false)
// Where the replay is, in ms of the squeezed clock
const clock = ref(0)

const strokes = computed(() => props.drawing.strokes.value)
const labels = computed(() => props.drawing.labels.value)
const live = computed(() => props.drawing.live.value)
// The pen in hand, which the tools change
const { color, size } = props.drawing

// The colour picked in the panel, kept so a palette colour can be left and this one come back
const custom = ref<string | null>(null)
const inPalette = computed(() => INK_PALETTE.some(ink => ink.value === color.value))

const pickerOpen = ref(false)

// What the panel edits: the custom colour, or the one in hand until a new one is picked
const panelColor = computed({
  get: () => custom.value ?? color.value,
  set: (value: string) => {
    custom.value = value
    color.value = value
  },
})

// Opening the panel brings the custom colour back into hand
watch(pickerOpen, (open) => {
  if (open && custom.value)
    color.value = custom.value
})

const POPOVER_UI = { content: 'rounded-xl bg-white shadow-lg ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800' }
const PICKER_CONTENT = { side: 'bottom', align: 'start', sideOffset: 8, collisionPadding: 16 } as const
const INSPECTOR_CONTENT = { side: 'bottom', align: 'start', sideOffset: 6, collisionPadding: 16 } as const

// --- State of the labels ---

/** A press that moves less than this, in px, is a click */
const DRAG_THRESHOLD = 6

interface Draft {
  id: number
  x: number
  y: number
  w?: number
  h?: number
  color: string
  text: string
}

interface Marquee {
  x0: number
  y0: number
  x1: number
  y1: number
  /** Where the press began on the screen, to tell a drag from a click */
  cx: number
  cy: number
  dragged: boolean
}

// The zone being dragged out, the label being typed, and the label being moved. A label joins the
// drawing, and its history, only once it has text, and a move only once it is dropped
const marquee = ref<Marquee | null>(null)
const draft = ref<Draft | null>(null)
const draftInput = ref<HTMLInputElement>()
const moving = ref<{ id: number, x: number, y: number } | null>(null)
let draftId = 0

// The label whose inspector is open, and the name it hangs on
const inspecting = ref<number | null>(null)
const inspectorAnchor = shallowRef<HTMLElement>()

// --- Drawing and pointing ---

// The pointer that is drawing: a second finger, or a palm, must not draw too
let activePointer: number | null = null
// Once a pen has touched the sheet, fingers stop drawing: a resting hand is not a stroke
let penSeen = false
let rect: DOMRect | undefined

const clamp = (n: number, max: number) => Math.min(Math.max(0, n), max)

function toBoard(e: { clientX: number, clientY: number }): [number, number] {
  const r = rect!
  return [
    (e.clientX - r.left) * (props.board.width / r.width),
    (e.clientY - r.top) * (props.board.height / r.height),
  ]
}

const pressureOf = (e: PointerEvent) => (e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5)

function onDown(e: PointerEvent) {
  if (props.readonly || replaying.value || !e.isPrimary || e.button !== 0)
    return
  if (e.pointerType === 'pen')
    penSeen = true
  else if (e.pointerType === 'touch' && penSeen)
    return
  const el = svg.value!
  el.setPointerCapture(e.pointerId)
  // Keyboard shortcuts work once the sheet has been used
  el.focus({ preventScroll: true })
  activePointer = e.pointerId
  rect = el.getBoundingClientRect()
  inspecting.value = null
  const [x, y] = toBoard(e)
  if (mode.value === 'label') {
    marquee.value = { x0: clamp(x, props.board.width), y0: clamp(y, props.board.height), x1: x, y1: y, cx: e.clientX, cy: e.clientY, dragged: false }
    return
  }
  props.drawing.begin(x, y, pressureOf(e), e.pointerType === 'pen')
}

function onMove(e: PointerEvent) {
  if (e.pointerId !== activePointer)
    return
  const box = marquee.value
  if (box) {
    const [x, y] = toBoard(e)
    marquee.value = { ...box, x1: clamp(x, props.board.width), y1: clamp(y, props.board.height), dragged: Math.hypot(e.clientX - box.cx, e.clientY - box.cy) > DRAG_THRESHOLD }
    return
  }
  // A fast stroke moves many times between two events: the coalesced ones keep the curve smooth
  const moves = e.getCoalescedEvents?.() ?? []
  for (const move of moves.length ? moves : [e]) {
    const [x, y] = toBoard(move)
    props.drawing.extend(x, y, pressureOf(move))
  }
}

function onUp(e: PointerEvent) {
  if (e.pointerId !== activePointer)
    return
  activePointer = null
  const box = marquee.value
  if (!box) {
    props.drawing.finish()
    return
  }
  marquee.value = null
  // A click names a point, a drag names the zone around a part: too thin a drag is a click
  const zone = zoneOf({ x: box.x0, y: box.y0 }, { x: box.x1, y: box.y1 })
  startDraft(box.dragged && zone.w >= MIN_ZONE && zone.h >= MIN_ZONE ? zone : { x: box.x0, y: box.y0 })
}

function onCancel(e: PointerEvent) {
  if (e.pointerId !== activePointer)
    return
  activePointer = null
  marquee.value = null
  props.drawing.cancel()
}

function onKeydown(e: KeyboardEvent) {
  // Typing a label has its own undo
  if ((e.target as HTMLElement).tagName === 'INPUT' || props.readonly || replaying.value || !(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z')
    return
  e.preventDefault()
  if (e.shiftKey)
    props.drawing.redo()
  else
    props.drawing.undo()
}

// --- Labels ---

function startDraft(at: { x: number, y: number, w?: number, h?: number }) {
  commitDraft()
  draft.value = { id: ++draftId, ...at, color: color.value, text: '' }
  nextTick(() => draftInput.value?.focus())
}

// The id is the draft the event came from: a late blur must not commit the next draft
function commitDraft(id?: number) {
  const current = draft.value
  if (!current || (id !== undefined && current.id !== id))
    return
  draft.value = null
  // The label takes the colour in hand, which is the one its draft was drawn in
  props.drawing.addLabel(current.x, current.y, current.text, current.w !== undefined ? { w: current.w, h: current.h! } : undefined)
}

// The input says which draft it belongs to: removed from the page it blurs once more, when the draft
// is already another one (or none)
function onDraftBlur(e: FocusEvent) {
  commitDraft(Number((e.target as HTMLElement).dataset.draft))
}

const cancelDraft = () => draft.value = null

watch(mode, () => {
  commitDraft()
  inspecting.value = null
})

// Moving a label: a press on its name or its dot that goes further than a click carries it, and one
// that stays is a click, which opens its inspector
interface PinDrag {
  label: Label
  cx: number
  cy: number
  moved: boolean
  wasInspected: boolean
}

let pinDrag: PinDrag | null = null

function onPinDown(e: PointerEvent, label: Label) {
  if (mode.value !== 'label' || replaying.value || e.button !== 0)
    return
  commitDraft()
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  rect = svg.value!.getBoundingClientRect()
  pinDrag = { label, cx: e.clientX, cy: e.clientY, moved: false, wasInspected: inspecting.value === label.id }
}

function onPinMove(e: PointerEvent) {
  if (!pinDrag)
    return
  const dx = e.clientX - pinDrag.cx
  const dy = e.clientY - pinDrag.cy
  if (!pinDrag.moved && Math.hypot(dx, dy) <= DRAG_THRESHOLD)
    return
  pinDrag.moved = true
  inspecting.value = null
  const { label } = pinDrag
  const scale = props.board.width / rect!.width
  moving.value = { id: label.id, ...clampToBoard({ x: label.x + dx * scale, y: label.y + dy * scale, w: label.w, h: label.h }, props.board) }
}

function onPinUp(e: PointerEvent) {
  const drag = pinDrag
  pinDrag = null
  if (!drag)
    return
  if (drag.moved) {
    const to = moving.value
    moving.value = null
    if (to)
      props.drawing.editLabel(drag.label.id, { x: to.x, y: to.y })
    return
  }
  inspectorAnchor.value = e.currentTarget as HTMLElement
  inspecting.value = drag.wasInspected ? null : drag.label.id
}

function onPinCancel() {
  pinDrag = null
  moving.value = null
}

// The inspector of a label: its name, its colour, and deleting it. It hangs on the name it opened from
const inspected = computed(() => labels.value.find(label => label.id === inspecting.value) ?? null)
const rename = ref('')

watch(inspected, (label, before) => {
  if (label && label.id !== before?.id)
    rename.value = label.text
})

function commitRename() {
  if (inspected.value && rename.value.trim() && rename.value.trim() !== inspected.value.text)
    props.drawing.editLabel(inspected.value.id, { text: rename.value })
}

function recolor(value: string) {
  if (inspected.value)
    props.drawing.editLabel(inspected.value.id, { color: value })
}

function deleteInspected() {
  const id = inspecting.value
  inspecting.value = null
  if (id !== null)
    props.drawing.removeLabel(id)
}

function onInspectorOpen(open: boolean) {
  if (!open) {
    commitRename()
    inspecting.value = null
  }
}

// Where a label sits: a point or a zone, with the colour it was given
const percent = (n: number) => `${n * 100}%`

// An ink is stored once, as the learner chose it. On a dark sheet a colour too dark to be seen is shown light,
// which the stylesheet picks, so nothing depends on the theme being known when the page is rendered
const inkStyle = (color: string) => ({ '--ink': color, '--ink-dark': inkOnDark(color) })

function markStyle(label: Pick<Label, 'x' | 'y' | 'w' | 'h' | 'color'>) {
  const style: Record<string, string> = {
    ...inkStyle(label.color),
    left: percent(label.x / props.board.width),
    top: percent(label.y / props.board.height),
  }
  if (label.w !== undefined && label.h !== undefined) {
    style.width = percent(label.w / props.board.width)
    style.height = percent(label.h / props.board.height)
  }
  return style
}

// Which side of its point, or of its zone, a name hangs on: the right, or the left near the right edge,
// and above a zone, or inside it at the very top. A label dragged across the change keeps its side
// until it is well past it, so held right at the edge it does not flicker between the two
interface Placement {
  flip: boolean
  top: boolean
}

function placementOf(label: { x: number, y: number, w?: number }, was?: Placement): Placement {
  const centre = label.x + (label.w ?? 0) / 2
  const edge = props.board.width
  return {
    flip: was ? centre > edge * (was.flip ? 0.6 : 0.68) : centre > edge * 0.65,
    top: label.w !== undefined && (was ? label.y < (was.top ? 38 : 30) : label.y < 30),
  }
}

const marqueeStyle = computed(() => {
  const box = marquee.value
  if (!box?.dragged)
    return null
  return markStyle({ ...zoneOf({ x: box.x0, y: box.y0 }, { x: box.x1, y: box.y1 }), color: color.value })
})

// --- Replay ---

const timeline = computed(() => timelineOf(strokes.value, labels.value))
const shown = computed(() => props.frame ? props.frame.strokes : replaying.value ? strokesAt(timeline.value, clock.value) : strokes.value)
const shownLabels = computed<Label[]>(() => {
  const list = props.frame ? props.frame.labels : replaying.value ? labelsAt(timeline.value, clock.value) : labels.value
  const to = moving.value
  return to ? list.map(label => label.id === to.id ? { ...label, x: to.x, y: to.y } : label) : list
})

// The side of each name is kept as the labels change (see placementOf)
const placements = reactive<Record<number, Placement>>({})

watch(() => shownLabels.value, (list) => {
  for (const label of list)
    placements[label.id] = placementOf(label, placements[label.id])
}, { immediate: true })

const placed = (label: Label) => placements[label.id] ?? placementOf(label)

const { pause, resume } = useRafFn(({ delta }) => {
  clock.value = Math.min(timeline.value.duration, clock.value + delta)
  if (clock.value >= timeline.value.duration)
    stop()
}, { immediate: false })

function play() {
  if (clock.value >= timeline.value.duration)
    clock.value = 0
  playing.value = true
  resume()
}

function stop() {
  playing.value = false
  pause()
}

function toggleReplay() {
  if (replaying.value) {
    stop()
    replaying.value = false
    return
  }
  commitDraft()
  inspecting.value = null
  clock.value = 0
  replaying.value = true
  play()
}

const hint = computed(() => {
  if (props.readonly || replaying.value || live.value || draft.value || marquee.value)
    return null
  if (mode.value === 'pen')
    return strokes.value.length || labels.value.length ? null : { text: 'Draw here with a mouse, a finger or a pen', low: false }
  if (labels.value.length)
    return null
  return { text: strokes.value.length ? 'Click a part of your drawing, or drag around it, then type its name' : 'Nothing to name yet: draw first', low: true }
})

onBeforeUnmount(stop)
</script>

<template>
  <div class="board" @keydown="onKeydown">
    <!-- Out of reach, and dimmed, while the replay plays -->
    <div v-if="!readonly" class="toolbar" role="toolbar" aria-label="Drawing tools" :inert="replaying">
      <div class="group" role="radiogroup" aria-label="Tool">
        <button
          v-for="tool in TOOLS"
          :key="tool.id"
          type="button"
          role="radio"
          class="tool"
          :aria-checked="mode === tool.id"
          :aria-label="tool.label"
          :title="tool.label"
          @click="mode = tool.id"
        >
          <Icon :name="tool.icon" class="size-4" aria-hidden="true" />
        </button>
      </div>

      <div class="group" role="radiogroup" aria-label="Ink">
        <button
          v-for="ink in INK_PALETTE"
          :key="ink.value"
          type="button"
          role="radio"
          class="tool swatch"
          :style="inkStyle(ink.value)"
          :aria-checked="color === ink.value"
          :aria-label="ink.label"
          :title="ink.label"
          @click="color = ink.value"
        />
        <!-- Not a radio: it opens a panel. The ring says whether its colour is the one in hand -->
        <UPopover v-model:open="pickerOpen" :content="PICKER_CONTENT" :ui="POPOVER_UI">
          <button
            type="button"
            class="tool swatch custom"
            :data-set="custom !== null"
            :data-checked="!inPalette"
            :style="custom ? inkStyle(custom) : undefined"
            :aria-label="custom ? `Custom colour ${custom}` : 'Pick a custom colour'"
            title="Custom colour"
          />

          <template #content>
            <div class="w-56 p-3">
              <ColorPanel v-model="panelColor" />
            </div>
          </template>
        </UPopover>
      </div>

      <!-- The width of a stroke: of no use while labelling -->
      <div class="group" role="radiogroup" aria-label="Size" :inert="mode !== 'pen'">
        <button
          v-for="option in SIZES"
          :key="option.value"
          type="button"
          role="radio"
          class="tool size"
          :style="{ '--dot': `${option.dot}px` }"
          :aria-checked="size === option.value"
          :aria-label="option.label"
          :title="option.label"
          @click="size = option.value"
        />
      </div>

      <div class="group">
        <button type="button" class="tool" :disabled="!drawing.canUndo.value" aria-label="Undo" title="Undo (⌘Z)" @click="drawing.undo()">
          <Icon name="lucide:undo-2" class="size-4" aria-hidden="true" />
        </button>
        <button type="button" class="tool" :disabled="!drawing.canRedo.value" aria-label="Redo" title="Redo (⇧⌘Z)" @click="drawing.redo()">
          <Icon name="lucide:redo-2" class="size-4" aria-hidden="true" />
        </button>
        <button type="button" class="tool" :disabled="!strokes.length && !labels.length" aria-label="Clear the sheet" title="Clear (undo brings it back)" @click="drawing.clear()">
          <Icon name="lucide:trash-2" class="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="paper" :data-replaying="replaying">
      <svg
        ref="svg"
        class="board-surface"
        :viewBox="`0 0 ${board.width} ${board.height}`"
        role="img"
        :aria-label="label"
        tabindex="0"
        :data-mode="readonly ? 'view' : mode"
        @pointerdown="onDown"
        @pointermove="onMove"
        @pointerup="onUp"
        @pointercancel="onCancel"
        @lostpointercapture="onUp"
        @contextmenu.prevent
      >
        <path v-for="stroke in shown" :key="stroke.id" class="ink" :style="inkStyle(stroke.color)" :d="strokePath(stroke)" />
        <path v-if="live" class="ink" :style="inkStyle(live.color)" :d="strokePath(live, false)" />
      </svg>

      <!-- Labels sit over the sheet in HTML, so their text stays sharp at any size and can be typed -->
      <div class="pins" role="list" aria-label="Labels" :data-active="mode === 'label' && !replaying">
        <div
          v-for="item in shownLabels"
          :key="item.id"
          class="mark"
          role="listitem"
          :data-zone="isZone(item)"
          :data-flip="placed(item).flip"
          :data-top="placed(item).top"
          :data-moving="moving?.id === item.id"
          :data-spot="spotlight.length ? (spotlight.includes(item.id) ? 'on' : 'off') : undefined"
          :style="markStyle(item)"
        >
          <span v-if="isZone(item)" class="zone-box" aria-hidden="true" />
          <span
            v-else
            class="pin-dot"
            aria-hidden="true"
            @pointerdown="onPinDown($event, item)"
            @pointermove="onPinMove"
            @pointerup="onPinUp"
            @pointercancel="onPinCancel"
          />
          <span
            class="pin-pill"
            :title="readonly ? undefined : 'Drag to move, click to edit'"
            @pointerdown="onPinDown($event, item)"
            @pointermove="onPinMove"
            @pointerup="onPinUp"
            @pointercancel="onPinCancel"
          >
            <span class="pin-text">{{ item.text }}</span>
          </span>
        </div>

        <div
          v-if="draft"
          :key="draft.id"
          class="mark"
          :data-zone="draft.w !== undefined"
          :data-flip="placementOf(draft).flip"
          :data-top="placementOf(draft).top"
          :style="markStyle(draft)"
        >
          <span v-if="draft.w !== undefined" class="zone-box" aria-hidden="true" />
          <span v-else class="pin-dot" aria-hidden="true" />
          <span class="pin-pill is-draft">
            <input
              ref="draftInput"
              v-model="draft.text"
              type="text"
              class="pin-input"
              aria-label="Name of this part"
              placeholder="Name it"
              autocomplete="off"
              spellcheck="false"
              :data-draft="draft.id"
              :maxlength="MAX_LABEL_LENGTH"
              :size="Math.max(7, draft.text.length + 1)"
              @keydown.enter.prevent="commitDraft(draft.id)"
              @keydown.esc.prevent="cancelDraft"
              @blur="onDraftBlur"
            >
          </span>
        </div>

        <!-- The zone being dragged out -->
        <div v-if="marqueeStyle" class="mark" data-zone="true" :style="marqueeStyle">
          <span class="zone-box" aria-hidden="true" />
        </div>
      </div>

      <p v-if="hint" class="hint" :data-low="hint.low" aria-hidden="true">
        {{ hint.text }}
      </p>

      <!-- Edit a label: rename it, give it another colour, or delete it -->
      <UPopover
        :open="!!inspected"
        :reference="inspectorAnchor"
        :content="INSPECTOR_CONTENT"
        :ui="POPOVER_UI"
        @update:open="onInspectorOpen"
      >
        <template #content>
          <div v-if="inspected" class="inspector">
            <input
              v-model="rename"
              type="text"
              class="inspector-name"
              aria-label="Name of this label"
              autocomplete="off"
              spellcheck="false"
              :maxlength="MAX_LABEL_LENGTH"
              @keydown.enter.prevent="onInspectorOpen(false)"
            >
            <div class="inspector-inks" role="radiogroup" aria-label="Colour of this label">
              <button
                v-for="ink in INK_PALETTE"
                :key="ink.value"
                type="button"
                role="radio"
                class="inspector-ink"
                :style="inkStyle(ink.value)"
                :aria-checked="inspected.color === ink.value"
                :aria-label="ink.label"
                :title="ink.label"
                @click="recolor(ink.value)"
              />
            </div>
            <button type="button" class="inspector-delete" @click="deleteInspected">
              <Icon name="lucide:trash-2" class="size-3.5" aria-hidden="true" />
              Delete this label
            </button>
          </div>
        </template>
      </UPopover>
    </div>

    <!-- Under the sheet: what the page says about the drawing, and the replay of how it was made -->
    <div v-if="!frame" class="footer">
      <template v-if="!replaying">
        <div class="stats">
          <slot name="stats" />
        </div>
        <button type="button" class="replay" :disabled="!strokes.length && !labels.length" @click="toggleReplay">
          <Icon name="lucide:history" class="size-3.5" aria-hidden="true" />
          Replay
        </button>
      </template>

      <template v-else>
        <button type="button" class="tool" :aria-label="playing ? 'Pause' : 'Play'" @click="playing ? stop() : play()">
          <Icon :name="playing ? 'lucide:pause' : 'lucide:play'" class="size-4" aria-hidden="true" />
        </button>
        <input
          v-model.number="clock"
          type="range"
          class="scrubber"
          min="0"
          :max="timeline.duration"
          step="1"
          aria-label="Position in the replay"
          @input="stop()"
        >
        <span class="time" aria-hidden="true">{{ mmss(clock) }} / {{ mmss(timeline.duration) }}</span>
        <button type="button" class="replay is-on" aria-pressed="true" @click="toggleReplay">
          <Icon :name="readonly ? 'lucide:x' : 'lucide:pencil'" class="size-3.5" aria-hidden="true" />
          {{ readonly ? 'Close the replay' : 'Back to drawing' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.board {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: rgb(163 163 163 / 0.12);
  transition: opacity 200ms var(--ease-out);
}

.toolbar[inert] {
  opacity: 0.5;
}

/* A group wraps as a whole, so a narrow toolbar never splits undo from redo */
.group {
  position: relative;
  display: flex;
  align-items: center;
  transition: opacity 200ms var(--ease-out);
}

/* A hairline after each group but the last: at the end of its line when the toolbar wraps, never at the start of one */
.group:not(:last-child) {
  margin-right: 4px;
  padding-right: 5px;
}

.group:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 50%;
  right: 0;
  width: 1px;
  height: 18px;
  background: rgb(163 163 163 / 0.4);
  transform: translateY(-50%);
}

/* The pen's size is out of reach while labelling: dimmed, not gone, so the toolbar does not jump */
.group[inert] {
  opacity: 0.35;
}

.tool {
  position: relative;
  display: grid;
  place-items: center;
  /* A hit area of 36px, drawn lighter than it is */
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: rgb(82 82 82);
  transition:
    background-color 160ms var(--ease-out),
    color 160ms var(--ease-out),
    opacity 160ms var(--ease-out),
    scale 160ms var(--ease-out);
}

.dark .tool {
  color: rgb(163 163 163);
}

.tool:active:not(:disabled) {
  scale: 0.94;
}

.tool:disabled {
  opacity: 0.35;
  cursor: default;
}

.tool:focus-visible,
.replay:focus-visible,
.board-surface:focus-visible,
.scrubber:focus-visible,
.inspector-ink:focus-visible,
.inspector-delete:focus-visible {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 2px;
}

@media (hover: hover) and (pointer: fine) {
  .tool:hover:not(:disabled) {
    background: rgb(163 163 163 / 0.2);
  }
}

/* The colour or the size in hand: a ring around it */
.tool[role='radio']::after,
.custom::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 7px;
  box-shadow: 0 0 0 0 rgb(163 163 163 / 0);
  transition: box-shadow 160ms var(--ease-out);
}

.tool[role='radio'][aria-checked='true']::after,
.custom[data-checked='true']::after {
  box-shadow: 0 0 0 1.5px rgb(115 115 115);
}

.dark .tool[role='radio'][aria-checked='true']::after,
.dark .custom[data-checked='true']::after {
  box-shadow: 0 0 0 1.5px rgb(212 212 212);
}

/* The tool in hand reads darker than the other */
.tool[role='radio'][aria-checked='true'] {
  color: rgb(23 23 23);
}

.dark .tool[role='radio'][aria-checked='true'] {
  color: rgb(245 245 245);
}

/* The ink swatches show the ink as the sheet does: the black one is light on a dark theme */
.swatch,
.inspector-ink {
  --c: var(--ink);
}

.dark .swatch,
.dark .inspector-ink {
  --c: var(--ink-dark);
}

/* The dot is 14px: a square hit area of 32 is plenty (the ring that marks the one in hand follows it), and nine of them fit a row with the rest */
.swatch {
  width: 32px;
  height: 32px;
}

.swatch::before {
  content: '';
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: var(--c);
  /* A hairline, so black does not vanish on a dark toolbar */
  box-shadow: inset 0 0 0 1px rgb(163 163 163 / 0.4);
}

/*
 * The custom swatch always wears a ring of every hue, and the colour picked sits inside it: a palette
 * swatch is a plain dot, so the ring is what says this one opens the picker. Empty until a colour is picked.
 */
.custom::before {
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  border: 2px solid transparent;
  background:
    linear-gradient(var(--c, transparent), var(--c, transparent)) padding-box,
    conic-gradient(#ef4444, #eab308, #22c55e, #06b6d4, #6366f1, #d946ef, #ef4444) border-box;
  box-shadow: none;
}

.size::before {
  content: '';
  width: var(--dot);
  height: var(--dot);
  border-radius: 9999px;
  background: currentColor;
}

/*
 * The sheet is dotted paper, drawn by the page: the SVG on top paints nothing but ink. On a dark theme the
 * paper is dark too, and the black ink is shown light (see inkOnDark): the colours the learner picked are
 * the ones the teacher sees, apart from a black that would vanish
 */
.paper {
  position: relative;
  border: 1px solid rgb(229 229 229);
  border-radius: 12px;
  background-color: white;
  background-image: radial-gradient(circle, rgb(163 163 163 / 0.22) 1px, transparent 1.2px);
  background-size: 20px 20px;
  overflow: hidden;
}

.dark .paper {
  border-color: rgb(64 64 64 / 0.8);
  background-color: rgb(28 28 28);
  background-image: radial-gradient(circle, rgb(163 163 163 / 0.2) 1px, transparent 1.2px);
}

.ink {
  fill: var(--ink);
}

.dark .ink {
  fill: var(--ink-dark);
}

.board-surface {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 8 / 5;
  cursor: crosshair;
  /* A touch on the sheet draws instead of scrolling the page, and must not select anything */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  outline-offset: -2px;
}

.board-surface[data-mode='label'] {
  cursor: text;
}

.paper[data-replaying='true'] .board-surface,
.board-surface[data-mode='view'] {
  cursor: default;
}

/* Nothing to draw: a finger on the sheet scrolls the page */
.board-surface[data-mode='view'] {
  touch-action: auto;
}

/* The labels: in HTML over the sheet, so a label can be moved and its name typed */
.pins {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.mark {
  --c: var(--ink);
  position: absolute;
  animation: mark-in 200ms var(--ease-out);
  transition: opacity 160ms var(--ease-out);
}

.dark .mark {
  --c: var(--ink-dark);
}

/* A reader looking for a part: its labels stand out, with a halo on a point and a solid frame on a zone */
.mark[data-spot='off'] {
  opacity: 0.25;
}

.mark[data-spot='on'] {
  z-index: 1;
}

.mark[data-spot='on'] .pin-dot {
  box-shadow: 0 0 0 2px white, 0 0 0 10px color-mix(in srgb, var(--c) 30%, transparent);
}

.dark .mark[data-spot='on'] .pin-dot {
  box-shadow: 0 0 0 2px rgb(28 28 28), 0 0 0 10px color-mix(in srgb, var(--c) 30%, transparent);
}

.mark[data-spot='on'] .zone-box {
  border-style: solid;
  background: color-mix(in srgb, var(--c) 20%, transparent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 25%, transparent);
}

.mark[data-spot='on'] .pin-pill {
  box-shadow: 0 0 0 2px var(--c), 0 1px 3px rgb(0 0 0 / 0.15);
}

@keyframes mark-in {
  from {
    opacity: 0;
    scale: 0.96;
  }
}

/*
 * A point: the dot sits on it, and the name hangs on its right, or on its left near the edge. The name
 * slides from one side to the other, so a label dragged across the change does not jump
 */
.pin-dot {
  position: absolute;
  transition: box-shadow 160ms var(--ease-out);
  left: 0;
  top: 0;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--c);
  box-shadow: 0 0 0 2px white, 0 0 0 3px rgb(0 0 0 / 0.15);
  transform: translate(-50%, -50%);
}

.dark .pin-dot {
  box-shadow: 0 0 0 2px rgb(28 28 28), 0 0 0 3px rgb(255 255 255 / 0.2);
}

.mark[data-zone='false'] .pin-pill {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(10px, -50%);
}

.mark[data-zone='false'][data-flip='true'] .pin-pill {
  transform: translate(calc(-100% - 10px), -50%);
}

/* A zone: a dashed box around the part, in the colour of the label, with the name on its corner */
.zone-box {
  position: absolute;
  transition:
    background-color 160ms var(--ease-out),
    box-shadow 160ms var(--ease-out);
  inset: 0;
  border: 1.5px dashed var(--c);
  border-radius: 8px;
  background: color-mix(in srgb, var(--c) 8%, transparent);
  pointer-events: none;
}

.mark[data-zone='true'] .pin-pill {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(0, calc(-100% - 4px));
}

.mark[data-zone='true'][data-flip='true'] .pin-pill {
  left: 100%;
  transform: translate(-100%, calc(-100% - 4px));
}

.mark[data-zone='true'][data-top='true'] .pin-pill {
  transform: translate(4px, 4px);
}

.mark[data-zone='true'][data-top='true'][data-flip='true'] .pin-pill {
  left: 100%;
  transform: translate(calc(-100% - 4px), 4px);
}

.pin-pill {
  left: auto;
  right: 4px;
}

.pin-pill {
  display: inline-flex;
  align-items: center;
  /* Its own width, even where its containing block has none, like a name hung on a point */
  width: max-content;
  max-width: 220px;
  padding: 2px 8px;
  border-radius: 6px;
  background: white;
  /* The colour of the label, as a ring: the name stays readable whatever the colour */
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--c) 55%, transparent), 0 1px 3px rgb(0 0 0 / 0.1);
  font-size: 12px;
  font-weight: 500;
  line-height: 20px;
  color: rgb(23 23 23);
  white-space: nowrap;
  /* A name is dragged, not selected: selecting it would highlight the page */
  user-select: none;
  -webkit-user-select: none;
  transition:
    transform 220ms var(--ease-out),
    left 220ms var(--ease-out);
}

.dark .pin-pill {
  background: rgb(38 38 38);
  color: rgb(245 245 245);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--c) 55%, transparent), 0 1px 3px rgb(0 0 0 / 0.4);
}

.pin-pill:focus-within {
  box-shadow: 0 0 0 2px rgb(59 130 246), 0 1px 3px rgb(0 0 0 / 0.1);
}

.pin-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* While labelling, a name and a dot can be pressed: to move them, or to open their inspector */
.pins[data-active='true'] .pin-pill:not(.is-draft),
.pins[data-active='true'] .pin-dot {
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
}

.mark[data-moving='true'] .pin-pill,
.mark[data-moving='true'] .pin-dot {
  cursor: grabbing;
}

@media (hover: hover) and (pointer: fine) {
  .pins[data-active='true'] .pin-pill:not(.is-draft):hover {
    box-shadow: 0 0 0 1.5px var(--c), 0 1px 3px rgb(0 0 0 / 0.15);
  }
}

.pin-pill.is-draft {
  pointer-events: auto;
}

.pin-input {
  user-select: text;
  -webkit-user-select: text;
  min-width: 0;
  border: 0;
  padding: 0;
  outline: 0;
  background: transparent;
  font: inherit;
  color: inherit;
}

.pin-input::placeholder {
  color: rgb(163 163 163);
}

.hint {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 14px;
  color: rgb(163 163 163);
  pointer-events: none;
}

/* Over the drawing it explains, so it sits at the foot of the sheet */
.hint[data-low='true'] {
  place-items: end center;
  padding-bottom: 14px;
}

/* The inspector of a label */
.inspector {
  display: flex;
  width: 224px;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.inspector-name {
  height: 32px;
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  outline: 0;
  background: rgb(163 163 163 / 0.14);
  font-size: 13px;
  color: rgb(23 23 23);
}

.dark .inspector-name {
  color: rgb(245 245 245);
}

.inspector-name:focus {
  outline: 2px solid rgb(59 130 246);
}

.inspector-inks {
  display: flex;
  justify-content: space-between;
}

.inspector-ink {
  position: relative;
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background: var(--c);
  transition: scale 160ms var(--ease-out);
}

.inspector-ink:active {
  scale: 0.9;
}

/* The colour of the label: a ring around its dot */
.inspector-ink[aria-checked='true'] {
  box-shadow: 0 0 0 2px white, 0 0 0 3.5px var(--c);
}

.dark .inspector-ink[aria-checked='true'] {
  box-shadow: 0 0 0 2px rgb(23 23 23), 0 0 0 3.5px var(--c);
}

.inspector-delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: stretch;
  justify-content: center;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgb(185 28 28);
  transition:
    background-color 160ms var(--ease-out),
    scale 160ms var(--ease-out);
}

.inspector-delete:active {
  scale: 0.96;
}

@media (hover: hover) and (pointer: fine) {
  .inspector-delete:hover {
    background: rgb(220 38 38 / 0.1);
  }
}

/* The foot of the sheet: the page's own words on the left, the replay on the right */
.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-height: 32px;
}

.stats {
  flex: 1;
  min-width: 0;
}

.replay {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgb(82 82 82);
  transition:
    background-color 160ms var(--ease-out),
    opacity 160ms var(--ease-out),
    scale 160ms var(--ease-out);
}

.dark .replay {
  color: rgb(163 163 163);
}

.replay.is-on {
  background: rgb(163 163 163 / 0.16);
  color: rgb(23 23 23);
}

.dark .replay.is-on {
  color: rgb(245 245 245);
}

.replay:active:not(:disabled) {
  scale: 0.96;
}

.replay:disabled {
  opacity: 0.35;
  cursor: default;
}

@media (hover: hover) and (pointer: fine) {
  .replay:hover:not(:disabled) {
    background: rgb(163 163 163 / 0.2);
  }
}

.scrubber {
  flex: 1;
  min-width: 80px;
  accent-color: rgb(115 115 115);
}

.time {
  min-width: 70px;
  font-size: 12px;
  color: rgb(115 115 115);
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  .tool,
  .replay,
  .toolbar,
  .group,
  .inspector-ink,
  .inspector-delete,
  .tool[role='radio']::after,
  .custom::after {
    transition: none;
  }

  .mark {
    animation: none;
    transition: none;
  }

  .pin-dot,
  .zone-box {
    transition: none;
  }

  .pin-pill {
    transition: none;
  }
}
</style>
