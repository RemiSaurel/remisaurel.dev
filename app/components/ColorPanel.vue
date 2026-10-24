<script setup lang="ts">
import type { Hsv } from '~/art/color'
import { hexToRgb, hsvToRgb, normalizeHex, rgbToHex, rgbToHsv } from '~/art/color'

// A colour to pick, for a popover: a field for saturation and brightness, a strip for the hue, and a
// hex field. Both the field and the strip are sliders for assistive technology, and take the arrows
// (shift for bigger steps). The colour is a `#rrggbb` string, updated as the pointer moves.
//
// <ColorPanel v-model="color" />
const model = defineModel<string>({ required: true })

// HSV is kept here: read back from the hex, the hue would be lost on greys and whites
const hsv = ref<Hsv>(rgbToHsv(hexToRgb(model.value)))

watch(model, (value) => {
  if (value.toLowerCase() !== rgbToHex(hsvToRgb(hsv.value)))
    hsv.value = rgbToHsv(hexToRgb(value))
})

function setHsv(patch: Partial<Hsv>) {
  hsv.value = { ...hsv.value, ...patch }
  model.value = rgbToHex(hsvToRgb(hsv.value))
}

const hueColor = computed(() => rgbToHex(hsvToRgb({ h: hsv.value.h, s: 1, v: 1 })))

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

// --- Dragging: the field and the strip share one routine ---

let dragging: ((x: number, y: number) => void) | null = null

function track(e: PointerEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  dragging?.(clamp01((e.clientX - rect.left) / rect.width), clamp01((e.clientY - rect.top) / rect.height))
}

function startDrag(e: PointerEvent, apply: (x: number, y: number) => void) {
  if (e.button !== 0)
    return
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
  el.focus()
  dragging = apply
  track(e)
}

const stopDrag = () => dragging = null

const onFieldDown = (e: PointerEvent) => startDrag(e, (x, y) => setHsv({ s: x, v: 1 - y }))
const onHueDown = (e: PointerEvent) => startDrag(e, x => setHsv({ h: x * 360 }))

function step(e: KeyboardEvent): [number, number] | null {
  const direction = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] } as Record<string, [number, number]>)[e.key]
  if (!direction)
    return null
  e.preventDefault()
  const amount = e.shiftKey ? 0.1 : 0.01
  return [direction[0] * amount, direction[1] * amount]
}

function onFieldKey(e: KeyboardEvent) {
  const delta = step(e)
  if (delta)
    setHsv({ s: clamp01(hsv.value.s + delta[0]), v: clamp01(hsv.value.v + delta[1]) })
}

function onHueKey(e: KeyboardEvent) {
  const delta = step(e)
  if (delta)
    setHsv({ h: Math.min(360, Math.max(0, hsv.value.h + (delta[0] || delta[1]) * 360)) })
}

// --- Hex field: typed freely, applied on Enter or blur, put back when it is not a colour ---

const draft = ref('')
const typing = ref(false)

watch(model, value => !typing.value && (draft.value = value.slice(1)), { immediate: true })

function applyDraft() {
  typing.value = false
  const value = normalizeHex(draft.value)
  if (value && value !== model.value.toLowerCase())
    model.value = value
  draft.value = model.value.slice(1)
}

// A pasted `#rrggbb` is taken whole instead of cut to the length of the field
function onPaste(e: ClipboardEvent) {
  const value = normalizeHex(e.clipboardData?.getData('text') ?? '')
  if (!value)
    return
  e.preventDefault()
  draft.value = value.slice(1)
  applyDraft()
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      role="slider"
      tabindex="0"
      aria-label="Saturation and brightness"
      :aria-valuetext="`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`"
      class="field"
      :style="{ '--hue': hueColor }"
      @pointerdown="onFieldDown"
      @pointermove="track"
      @pointerup="stopDrag"
      @pointercancel="stopDrag"
      @keydown="onFieldKey"
    >
      <span class="thumb" :style="{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: model }" aria-hidden="true" />
    </div>

    <div
      role="slider"
      tabindex="0"
      aria-label="Hue"
      aria-valuemin="0"
      aria-valuemax="360"
      :aria-valuenow="Math.round(hsv.h)"
      class="hue"
      @pointerdown="onHueDown"
      @pointermove="track"
      @pointerup="stopDrag"
      @pointercancel="stopDrag"
      @keydown="onHueKey"
    >
      <span class="thumb" :style="{ left: `${hsv.h / 360 * 100}%`, top: '50%', background: hueColor }" aria-hidden="true" />
    </div>

    <label class="hex">
      <span class="chip" :style="{ background: model }" aria-hidden="true" />
      <span class="text-neutral-400 dark:text-neutral-500" aria-hidden="true">#</span>
      <input
        v-model="draft"
        type="text"
        aria-label="Hex colour"
        maxlength="7"
        spellcheck="false"
        autocomplete="off"
        class="uppercase min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] text-neutral-900 outline-none dark:text-neutral-100"
        @focus="typing = true"
        @blur="applyDraft"
        @keydown.enter.prevent="applyDraft"
        @paste="onPaste"
      >
    </label>
  </div>
</template>

<style scoped>
.field,
.hue {
  position: relative;
  touch-action: none;
  cursor: crosshair;
  outline: none;
}

.field {
  aspect-ratio: 16 / 10;
  border-radius: 8px;
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, var(--hue));
}

.hue {
  height: 12px;
  border-radius: 9999px;
  cursor: ew-resize;
  background: linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00);
}

/* A faint edge, so the white and black ends do not dissolve into the popover */
.field::after,
.hue::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.1);
}

.field:focus-visible::after,
.hue:focus-visible::after {
  box-shadow: inset 0 0 0 2px rgb(59 130 246);
}

/* Follows the pointer 1:1: any easing would make the picker feel like it lags */
.thumb {
  position: absolute;
  z-index: 1;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  box-shadow: 0 0 0 2px #fff, 0 0 0 3px rgb(0 0 0 / 0.2), 0 1px 3px 1px rgb(0 0 0 / 0.25);
}

.hex {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 10px 0 8px;
  border-radius: 8px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  background: rgb(163 163 163 / 0.14);
}

.hex:focus-within {
  outline: 2px solid rgb(59 130 246);
  outline-offset: 0;
}

.chip {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 9999px;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.15);
}
</style>
