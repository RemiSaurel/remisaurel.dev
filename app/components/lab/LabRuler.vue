<script setup lang="ts">
interface Props {
  axis: 'x' | 'y'
  /** Ruler length, in screen pixels. */
  length: number
  /** Where frame 0 sits along the ruler, in screen pixels. */
  origin: number
  /** Screen pixels per frame unit. */
  ppu: number
  /** Frame size along this axis: the band the picture occupies. */
  extent: number
  selection?: [number, number] | null
  cursor?: number | null
}

const props = defineProps<Props>()

/** Screen pixels across the ruler. Shared with the canvas, which leaves room for it. */
const SIZE = 20
/** Labels need this much room to never touch, whatever the zoom. */
const LABEL_GAP_PX = 48
const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000]

const labelStep = computed(() => STEPS.find(step => step * props.ppu >= LABEL_GAP_PX) ?? STEPS.at(-1)!)

/** Fifths when they fit and land on whole units, halves otherwise, nothing when too dense. */
const tickStep = computed(() => {
  const step = labelStep.value
  for (const divisions of [5, 2]) {
    const minor = step / divisions
    if (Number.isInteger(minor) && minor * props.ppu >= 5)
      return minor
  }
  return step
})

function toPx(value: number) {
  // Whole pixels plus a half, so 1px ticks land on a pixel instead of straddling two
  return Math.round(props.origin + value * props.ppu) + 0.5
}

const visibleRange = computed(() => {
  const step = tickStep.value
  const from = Math.ceil(-props.origin / props.ppu / step) * step
  const to = (props.length - props.origin) / props.ppu
  return { from, to, step }
})

const ticks = computed(() => {
  const { from, to, step } = visibleRange.value
  let d = ''
  if (!Number.isFinite(from) || step <= 0)
    return d
  for (let value = from; value <= to; value += step) {
    const px = toPx(value)
    const major = Math.abs(value % labelStep.value) < 1e-6
    const length = major ? 7 : 3
    d += props.axis === 'x' ? `M${px} ${SIZE}v${-length}` : `M${SIZE} ${px}h${-length}`
  }
  return d
})

/** 9px tabular digits: close enough to keep labels apart without measuring text. */
const DIGIT_PX = 5.5
const LABEL_SPACING_PX = 4

function labelWidth(value: number) {
  return String(value).length * DIGIT_PX
}

type Span = [number, number]

function overlaps([a0, a1]: Span, [b0, b1]: Span) {
  return a0 < b1 + LABEL_SPACING_PX && b0 < a1 + LABEL_SPACING_PX
}

/**
 * Selection ends get their own labels, the start one before its edge and the end one after;
 * regular labels they would touch step aside. Along the ruler, a regular label runs after its
 * tick on the horizontal ruler and before it on the vertical one (it reads bottom to top).
 */
const labels = computed(() => {
  const step = labelStep.value
  const { to } = visibleRange.value
  const taken: Span[] = []
  if (props.selection) {
    const [min, max] = props.selection
    const start = toPx(min)
    const end = toPx(max)
    taken.push([start - 3 - labelWidth(Math.round(min)), start - 3], [end + 3, end + 3 + labelWidth(Math.round(max))])
  }
  const items: { value: number, px: number, inside: boolean }[] = []
  for (let value = Math.ceil(-props.origin / props.ppu / step) * step; value <= to; value += step) {
    const px = toPx(value)
    const width = labelWidth(value)
    const span: Span = props.axis === 'x' ? [px + 3, px + 3 + width] : [px - 3 - width, px - 3]
    if (taken.some(other => overlaps(span, other)))
      continue
    items.push({ value, px, inside: value >= 0 && value <= props.extent })
  }
  return items
})

const frameBand = computed(() => {
  const start = toPx(0)
  return { start, size: toPx(props.extent) - start }
})

const selectionBand = computed(() => {
  if (!props.selection)
    return null
  const [min, max] = props.selection
  return { start: toPx(min), end: toPx(max), min: format(min), max: format(max) }
})

function format(value: number) {
  return String(Math.round(value))
}
</script>

<template>
  <svg class="lab-ruler block" :class="`is-${props.axis}`" aria-hidden="true">
    <!-- The frame's span, so you always see where the picture starts and ends -->
    <rect
      v-if="props.axis === 'x'"
      class="lab-ruler-frame"
      :x="frameBand.start"
      :width="Math.max(0, frameBand.size)"
      :height="SIZE"
    />
    <rect
      v-else
      class="lab-ruler-frame"
      :y="frameBand.start"
      :height="Math.max(0, frameBand.size)"
      :width="SIZE"
    />

    <template v-if="selectionBand">
      <rect
        v-if="props.axis === 'x'"
        class="lab-ruler-selection"
        :x="selectionBand.start"
        :width="Math.max(1, selectionBand.end - selectionBand.start)"
        :height="SIZE"
      />
      <rect
        v-else
        class="lab-ruler-selection"
        :y="selectionBand.start"
        :height="Math.max(1, selectionBand.end - selectionBand.start)"
        :width="SIZE"
      />
    </template>

    <path :d="ticks" class="lab-ruler-ticks" fill="none" />

    <g class="lab-ruler-labels">
      <text
        v-for="label in labels"
        :key="label.value"
        :class="{ 'is-inside': label.inside }"
        :transform="props.axis === 'x' ? `translate(${label.px + 3} 9)` : `translate(9 ${label.px - 3}) rotate(-90)`"
      >
        {{ label.value }}
      </text>
    </g>

    <g v-if="selectionBand" class="lab-ruler-selection-labels">
      <!-- Outside the band on both ends; the vertical ruler reads bottom to top, so anchors swap -->
      <text
        :transform="props.axis === 'x' ? `translate(${selectionBand.start - 3} 9)` : `translate(9 ${selectionBand.start - 3}) rotate(-90)`"
        :text-anchor="props.axis === 'x' ? 'end' : 'start'"
      >
        {{ selectionBand.min }}
      </text>
      <text
        v-if="selectionBand.end - selectionBand.start > 0.5"
        :transform="props.axis === 'x' ? `translate(${selectionBand.end + 3} 9)` : `translate(9 ${selectionBand.end + 3}) rotate(-90)`"
        :text-anchor="props.axis === 'x' ? 'start' : 'end'"
      >
        {{ selectionBand.max }}
      </text>
    </g>

    <line
      v-if="props.cursor !== null && props.cursor !== undefined"
      class="lab-ruler-cursor"
      v-bind="props.axis === 'x'
        ? { x1: toPx(props.cursor), x2: toPx(props.cursor), y1: 0, y2: SIZE }
        : { y1: toPx(props.cursor), y2: toPx(props.cursor), x1: 0, x2: SIZE }"
    />
  </svg>
</template>

<style scoped>
.lab-ruler {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #fff;
  color: #d4d4d4;
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.01em;
}

.dark .lab-ruler {
  background: #171717;
  color: #404040;
}

.lab-ruler-frame {
  fill: #fafafa;
}

.dark .lab-ruler-frame {
  fill: #1f1f1f;
}

.lab-ruler-ticks {
  stroke: currentColor;
  stroke-width: 1;
}

.lab-ruler-labels text {
  fill: #c4c4c4;
}

.lab-ruler-labels text.is-inside {
  fill: #8a8a8a;
}

.dark .lab-ruler-labels text {
  fill: #525252;
}

.dark .lab-ruler-labels text.is-inside {
  fill: #8a8a8a;
}

.lab-ruler-selection {
  fill: #4f7cff;
  fill-opacity: 0.14;
}

.lab-ruler-selection-labels text {
  fill: #4f7cff;
  font-weight: 500;
}

.dark .lab-ruler-selection-labels text {
  fill: #7d9dff;
}

.lab-ruler-cursor {
  stroke: #737373;
  stroke-width: 1;
  shape-rendering: crispEdges;
}

.dark .lab-ruler-cursor {
  stroke: #a3a3a3;
}
</style>
