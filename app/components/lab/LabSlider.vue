<script setup lang="ts">
interface Props {
  label: string
  min: number
  max: number
  step: number
  unit?: string
}

const props = defineProps<Props>()
const model = defineModel<number>({ required: true })

const track = useTemplateRef<HTMLElement>('track')
const input = useTemplateRef<HTMLInputElement>('input')
const dragging = ref(false)
const editing = ref(false)
const draft = ref('')

const decimals = computed(() => {
  const [, fraction] = String(props.step).split('.')
  return fraction?.length ?? 0
})

const display = computed(() => `${model.value.toFixed(decimals.value)}${props.unit ?? ''}`)
const fill = computed(() => Math.min(1, Math.max(0, (model.value - props.min) / (props.max - props.min))))

function clampToStep(value: number) {
  const stepped = Math.round((value - props.min) / props.step) * props.step + props.min
  return Number(Math.min(props.max, Math.max(props.min, stepped)).toFixed(decimals.value))
}

function setFromPointer(event: PointerEvent) {
  const rect = track.value!.getBoundingClientRect()
  const ratio = (event.clientX - rect.left) / rect.width
  model.value = clampToStep(props.min + ratio * (props.max - props.min))
}

function onPointerDown(event: PointerEvent) {
  if (editing.value || event.button !== 0)
    return
  // Capture so the drag keeps going when the pointer leaves the narrow track
  track.value!.setPointerCapture(event.pointerId)
  dragging.value = true
  setFromPointer(event)
}

function onPointerMove(event: PointerEvent) {
  if (dragging.value)
    setFromPointer(event)
}

function onPointerUp() {
  dragging.value = false
}

function onKeydown(event: KeyboardEvent) {
  const big = event.shiftKey ? 10 : 1
  const keys: Record<string, number> = {
    ArrowRight: props.step * big,
    ArrowUp: props.step * big,
    ArrowLeft: -props.step * big,
    ArrowDown: -props.step * big,
  }
  if (event.key in keys) {
    event.preventDefault()
    model.value = clampToStep(model.value + keys[event.key]!)
  }
  else if (event.key === 'Home') {
    event.preventDefault()
    model.value = props.min
  }
  else if (event.key === 'End') {
    event.preventDefault()
    model.value = props.max
  }
  else if (event.key === 'Enter') {
    event.preventDefault()
    startEditing()
  }
}

// Exact values: double-click (or Enter) turns the value into a text field
async function startEditing() {
  draft.value = model.value.toFixed(decimals.value)
  editing.value = true
  await nextTick()
  input.value?.select()
}

function finishEditing(apply: boolean) {
  if (!editing.value)
    return
  editing.value = false
  const value = Number.parseFloat(draft.value.replace(',', '.'))
  // Typed values may leave the slider range (a scale of 5, a count of 300), only the step applies
  if (apply && Number.isFinite(value))
    model.value = Number(value.toFixed(decimals.value))
  track.value?.focus()
}
</script>

<template>
  <div
    ref="track"
    role="slider"
    tabindex="0"
    :aria-label="props.label"
    :aria-valuemin="props.min"
    :aria-valuemax="props.max"
    :aria-valuenow="model"
    :aria-valuetext="display"
    class="lab-slider group relative h-7 flex select-none items-center overflow-hidden bg-neutral-100 text-xs outline-none dark:bg-neutral-800/70"
    :class="{ 'is-dragging': dragging }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
    @keydown="onKeydown"
    @dblclick="startEditing"
  >
    <!-- Fill is instant: it has to stay glued to the pointer -->
    <span
      class="absolute inset-y-0 left-0 origin-left bg-neutral-200 dark:bg-neutral-700/80"
      :style="{ width: '100%', transform: `scaleX(${fill})` }"
      aria-hidden="true"
    />
    <span class="relative flex-1 truncate px-2 text-neutral-500 dark:text-neutral-400">{{ props.label }}</span>
    <input
      v-if="editing"
      ref="input"
      v-model="draft"
      type="text"
      inputmode="decimal"
      class="tabular-nums relative mr-1 h-5 w-16 border-0 bg-white px-1 text-right text-xs outline-none ring-1 ring-neutral-300 dark:bg-neutral-900 dark:ring-neutral-600"
      @pointerdown.stop
      @keydown.stop.enter="finishEditing(true)"
      @keydown.stop.escape="finishEditing(false)"
      @blur="finishEditing(true)"
    >
    <span v-else class="tabular-nums relative px-2 text-neutral-900 dark:text-neutral-100">{{ display }}</span>
  </div>
</template>

<style scoped>
.lab-slider {
  cursor: ew-resize;
  touch-action: none;
}

.lab-slider:focus-visible {
  box-shadow: inset 0 0 0 1px #4f7cff;
}
</style>
