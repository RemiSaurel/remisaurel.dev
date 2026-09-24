<script setup lang="ts">
import type { ArtCustomColor, ArtTheme } from '~/art/art'
import type { Hsv } from '~/art/color'
import { ART_PALETTES } from '~/art/art'
import { counterpartColor, hexToRgb, hsvToRgb, normalizeHex, rgbToHex, rgbToHsv } from '~/art/color'

interface Props {
  /** The variant edited first: the one the canvas is showing. */
  initialTheme: ArtTheme
}

const props = defineProps<Props>()
const model = defineModel<ArtCustomColor>({ required: true })

const THEMES: { theme: ArtTheme, label: string }[] = [
  { theme: 'light', label: 'Light' },
  { theme: 'dark', label: 'Dark' },
]

const theme = ref<ArtTheme>(props.initialTheme)
/** While linked, the other theme's variant is derived from the one being edited. */
const linked = ref(true)

const hex = computed(() => model.value[theme.value])

function setHex(value: string) {
  const other: ArtTheme = theme.value === 'light' ? 'dark' : 'light'
  model.value = {
    ...model.value,
    [theme.value]: value,
    ...(linked.value ? { [other]: counterpartColor(value, other) } : {}),
  }
}

// HSV is kept locally: hue and saturation would be lost on grays if read back from the hex
const hsv = ref<Hsv>(rgbToHsv(hexToRgb(hex.value)))

watch(hex, (value) => {
  if (value !== rgbToHex(hsvToRgb(hsv.value)))
    hsv.value = rgbToHsv(hexToRgb(value))
})

function setHsv(patch: Partial<Hsv>) {
  hsv.value = { ...hsv.value, ...patch }
  setHex(rgbToHex(hsvToRgb(hsv.value)))
}

const hueColor = computed(() => rgbToHex(hsvToRgb({ h: hsv.value.h, s: 1, v: 1 })))

// Dragging: the field and the hue strip share one pointer routine

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function drag(event: PointerEvent, apply: (x: number, y: number) => void) {
  if (event.button !== 0)
    return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const update = (e: PointerEvent) => apply(clamp01((e.clientX - rect.left) / rect.width), clamp01((e.clientY - rect.top) / rect.height))
  target.setPointerCapture(event.pointerId)
  target.focus()
  update(event)
  const move = (e: PointerEvent) => update(e)
  const end = () => {
    target.removeEventListener('pointermove', move)
    target.removeEventListener('pointerup', end)
    target.removeEventListener('pointercancel', end)
  }
  target.addEventListener('pointermove', move)
  target.addEventListener('pointerup', end)
  target.addEventListener('pointercancel', end)
}

function onFieldDown(event: PointerEvent) {
  drag(event, (x, y) => setHsv({ s: x, v: 1 - y }))
}

function onHueDown(event: PointerEvent) {
  drag(event, x => setHsv({ h: x * 360 }))
}

function arrows(event: KeyboardEvent) {
  const amount = event.shiftKey ? 0.1 : 0.01
  const map: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }
  const direction = map[event.key]
  if (direction)
    event.preventDefault()
  return direction ? [direction[0] * amount, direction[1] * amount] as const : null
}

function onFieldKeydown(event: KeyboardEvent) {
  const delta = arrows(event)
  if (delta)
    setHsv({ s: clamp01(hsv.value.s + delta[0]), v: clamp01(hsv.value.v + delta[1]) })
}

function onHueKeydown(event: KeyboardEvent) {
  const delta = arrows(event)
  if (delta)
    setHsv({ h: Math.min(360, Math.max(0, hsv.value.h + (delta[0] || delta[1]) * 360)) })
}

// Hex field: typed freely, applied on Enter or blur, reverted when it isn't a color

const draft = ref('')
const editingHex = ref(false)

watch(hex, value => !editingHex.value && (draft.value = value.slice(1)), { immediate: true })

function applyDraft() {
  editingHex.value = false
  const value = normalizeHex(draft.value)
  if (value && value !== hex.value)
    setHex(value)
  draft.value = hex.value.slice(1)
}

function onPaste(event: ClipboardEvent) {
  // Pasting a full `#rrggbb` is the common case: take it whole instead of truncating it
  const text = event.clipboardData?.getData('text') ?? ''
  const value = normalizeHex(text)
  if (value) {
    event.preventDefault()
    draft.value = value.slice(1)
    applyDraft()
  }
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Which variant is being edited: each tab shows its color on its own ground -->
    <div role="tablist" aria-label="Theme variant" class="grid grid-cols-2 gap-0.5 bg-neutral-100 p-0.5 dark:bg-neutral-800/70">
      <button
        v-for="item in THEMES"
        :key="item.theme"
        type="button"
        role="tab"
        :aria-selected="theme === item.theme"
        class="h-6 flex cursor-pointer items-center gap-1.5 px-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#4f7cff]"
        :class="theme === item.theme
          ? 'bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08)] dark:bg-neutral-700 dark:text-neutral-100'
          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'"
        @click="theme = item.theme"
      >
        <span class="lab-chip-ground" :style="{ background: ART_PALETTES[item.theme].bg }" aria-hidden="true">
          <span class="size-2" :style="{ background: model[item.theme] }" />
        </span>
        {{ item.label }}
      </button>
    </div>

    <div
      role="slider"
      tabindex="0"
      aria-label="Saturation and brightness"
      :aria-valuetext="`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`"
      class="lab-field"
      :style="{ '--hue': hueColor }"
      @pointerdown="onFieldDown"
      @keydown="onFieldKeydown"
    >
      <span
        class="lab-thumb"
        :style="{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hex }"
        aria-hidden="true"
      />
    </div>

    <div
      role="slider"
      tabindex="0"
      aria-label="Hue"
      aria-valuemin="0"
      aria-valuemax="360"
      :aria-valuenow="Math.round(hsv.h)"
      class="lab-hue"
      @pointerdown="onHueDown"
      @keydown="onHueKeydown"
    >
      <span class="lab-thumb is-hue" :style="{ left: `${hsv.h / 360 * 100}%`, background: hueColor }" aria-hidden="true" />
    </div>

    <div class="flex items-center gap-1">
      <label class="h-7 flex flex-1 items-center gap-1 bg-neutral-100 px-2 text-xs dark:bg-neutral-800/70 focus-within:ring-1 focus-within:ring-[#4f7cff]">
        <span class="text-neutral-400 dark:text-neutral-500" aria-hidden="true">#</span>
        <input
          v-model="draft"
          type="text"
          aria-label="Hex color"
          maxlength="7"
          spellcheck="false"
          autocomplete="off"
          class="lab-hex min-w-0 flex-1 border-0 bg-transparent p-0 text-xs text-neutral-900 uppercase outline-none dark:text-neutral-100"
          @focus="editingHex = true"
          @blur="applyDraft"
          @keydown.enter.prevent="applyDraft"
          @paste="onPaste"
        >
      </label>
      <button
        type="button"
        class="lab-link"
        :class="{ 'is-on': linked }"
        :aria-pressed="linked"
        aria-label="Derive the other theme"
        :title="linked ? 'The other theme follows this color' : 'Each theme is set by hand'"
        @click="linked = !linked"
      >
        <Icon :name="linked ? 'lucide:link-2' : 'lucide:link-2-off'" class="size-3.5" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.lab-chip-ground {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.875rem;
  height: 0.875rem;
  box-shadow: inset 0 0 0 1px rgb(128 128 128 / 0.25);
}

.lab-field,
.lab-hue {
  position: relative;
  touch-action: none;
  cursor: crosshair;
  outline: none;
}

.lab-field {
  aspect-ratio: 16 / 10;
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, var(--hue));
}

.lab-hue {
  height: 0.625rem;
  cursor: ew-resize;
  background: linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00);
}

/* Faint inner edge so white and black ends don't dissolve into the popover */
.lab-field::after,
.lab-hue::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1);
}

.lab-field:focus-visible::after,
.lab-hue:focus-visible::after {
  box-shadow: inset 0 0 0 1px #4f7cff;
}

/* Follows the pointer 1:1: any easing here would make the picker feel like it lags */
.lab-thumb {
  position: absolute;
  z-index: 1;
  width: 0.75rem;
  height: 0.75rem;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgb(0 0 0 / 0.2), 0 1px 3px 1px rgb(0 0 0 / 0.2);
}

.lab-thumb.is-hue {
  top: 50%;
  width: 0.375rem;
  height: 0.875rem;
}

.lab-hex {
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}

.lab-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  cursor: pointer;
  color: #737373;
  transition: transform 160ms var(--ease-out);
}

.lab-link:hover,
.lab-link.is-on {
  color: #171717;
}

.lab-link.is-on {
  background: #f5f5f5;
}

.dark .lab-link:hover,
.dark .lab-link.is-on {
  color: #f5f5f5;
}

.dark .lab-link.is-on {
  background: rgb(38 38 38 / 0.7);
}

.lab-link:active {
  transform: scale(0.94);
}

.lab-link:focus-visible {
  outline: 1px solid #4f7cff;
  outline-offset: -1px;
}
</style>
