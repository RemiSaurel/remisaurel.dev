<script setup lang="ts">
import { useDebounceFn, useElementSize, useEventListener } from '@vueuse/core'
import { HIGHLIGHT_SWATCHES, hueToHex, isHexColor } from '~/utils/highlights'

type Mode = 'main' | 'palette' | 'custom'

interface HighlightToolbarProps {
  rect: DOMRect
  color: string
  // True for a click on a saved highlight (recolour or remove), false for a fresh selection
  existing: boolean
}

const props = defineProps<HighlightToolbarProps>()

const emit = defineEmits<{
  apply: []
  pick: [color: string]
  remove: []
}>()

// The pill is as wide as the mode it shows: the width follows the content, and the content
// swaps in a short crossfade. Nothing is scaled, so swatches stay round while it morphs
const measured = useElementSize(useTemplateRef<HTMLElement>('measure'))

// An even whole number of pixels: the pill is centred with translate(-50%), and an odd or
// fractional width lands it on a half pixel, which blurs everything inside
const pillWidth = computed(() => measured.width.value ? Math.ceil((measured.width.value + 6) / 2) * 2 : undefined)

const mode = ref<Mode>('main')
const hue = ref(50)
const hexDraft = ref(props.color.slice(1))

const SPECTRUM_STOPS = Array.from({ length: 13 }, (_, i) => `hsl(${i * 30} 90% 62%)`).join(', ')

const isCustomColor = computed(() => !HIGHLIGHT_SWATCHES.includes(props.color))

// The selection menu of a phone opens above the selection: stay out of its way
const isTouch = import.meta.client && window.matchMedia('(pointer: coarse)').matches

const visible = computed(() => props.rect.bottom > 0 && props.rect.top < window.innerHeight)

// The toolbar glides to its new spot when the selection changes, but must stay glued to the
// text while the page scrolls or resizes: a transition there would make it lag behind
const tracking = ref(false)
const stopTracking = useDebounceFn(() => tracking.value = false, 120)

function track() {
  tracking.value = true
  stopTracking()
}

useEventListener(() => window, 'scroll', track, { passive: true })
useEventListener(() => window, 'resize', track, { passive: true })

const placement = computed(() => {
  const below = isTouch || props.rect.top < 64
  const center = props.rect.left + props.rect.width / 2
  const x = Math.round(Math.min(Math.max(center, 160), window.innerWidth - 160))
  const y = Math.round(below ? props.rect.bottom + 10 : props.rect.top - 10)
  return {
    below,
    style: {
      transform: `translate(${x}px, ${y}px) translate(-50%, ${below ? '0' : '-100%'})`,
    },
  }
})

function onHue(event: Event) {
  hue.value = Number((event.target as HTMLInputElement).value)
  const color = hueToHex(hue.value)
  hexDraft.value = color.slice(1)
  emit('pick', color)
}

function onHex(event: Event) {
  const value = (event.target as HTMLInputElement).value.replace('#', '').trim()
  hexDraft.value = value
  if (isHexColor(`#${value}`))
    emit('pick', `#${value.toLowerCase()}`)
}

function pickSwatch(color: string) {
  hexDraft.value = color.slice(1)
  emit('pick', color)
  mode.value = 'main'
}
</script>

<template>
  <Teleport to="body">
    <div
      v-show="visible"
      data-highlight-toolbar
      class="anchor fixed left-0 top-0 z-50"
      :class="{ tracking }"
      :style="placement.style"
    >
      <div
        role="toolbar"
        aria-label="Highlight"
        class="pill"
        :class="placement.below ? 'origin-top' : 'origin-bottom'"
        :style="{ width: pillWidth && `${pillWidth}px` }"
      >
        <div ref="measure" class="w-max">
          <Transition name="mode" mode="out-in">
            <div :key="mode" class="flex items-center" :class="{ 'gap-0': mode === 'main', 'gap-1': mode !== 'main', 'pr-2': mode === 'palette' }">
              <template v-if="mode === 'main'">
                <button
                  type="button"
                  class="h-8 w-8 flex pressable items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  aria-label="Highlight colour"
                  @pointerdown.prevent
                  @click="mode = 'palette'"
                >
                  <span class="h-5 w-5 rounded-full ring-1 ring-black/15 dark:ring-white/20" :style="{ backgroundColor: color }" />
                </button>
                <button
                  v-if="existing"
                  type="button"
                  class="h-8 flex pressable items-center gap-1.5 rounded-full pl-2 pr-3 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  @pointerdown.prevent
                  @click="emit('remove')"
                >
                  <Icon name="uil:trash-alt" class="h-4 w-4" />
                  Remove
                </button>
                <button
                  v-else
                  type="button"
                  class="h-8 flex pressable items-center gap-1.5 rounded-full pl-2 pr-3 text-sm text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700"
                  @pointerdown.prevent
                  @click="emit('apply')"
                >
                  <Icon name="uil:pen" class="h-4 w-4" />
                  Highlight
                </button>
              </template>

              <template v-else-if="mode === 'palette'">
                <button
                  type="button"
                  class="h-8 w-8 flex pressable items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  aria-label="Back"
                  @pointerdown.prevent
                  @click="mode = 'main'"
                >
                  <Icon name="uil:angle-left" class="h-5 w-5" />
                </button>
                <button
                  v-for="(swatch, i) in HIGHLIGHT_SWATCHES"
                  :key="swatch"
                  type="button"
                  class="swatch h-6 w-6 flex shrink-0 pressable items-center justify-center rounded-full ring-1 ring-black/10 dark:ring-white/15"
                  :style="{ 'backgroundColor': swatch, '--i': i }"
                  :aria-label="swatch"
                  :aria-pressed="swatch === color"
                  @pointerdown.prevent
                  @click="pickSwatch(swatch)"
                >
                  <Icon v-if="swatch === color" name="uil:check" class="h-4 w-4 text-black/70" />
                </button>
                <button
                  type="button"
                  class="h-6 w-6 flex pressable items-center justify-center rounded-full ring-1 ring-black/10 dark:ring-white/15"
                  :style="{ background: `conic-gradient(${SPECTRUM_STOPS})` }"
                  aria-label="Custom colour"
                  @pointerdown.prevent
                  @click="mode = 'custom'"
                >
                  <Icon v-if="isCustomColor" name="uil:check" class="h-4 w-4 text-black/70" />
                </button>
              </template>

              <template v-else>
                <button
                  type="button"
                  class="h-8 w-8 flex pressable items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  aria-label="Back to colours"
                  @pointerdown.prevent
                  @click="mode = 'palette'"
                >
                  <Icon name="uil:angle-left" class="h-5 w-5" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="360"
                  :value="hue"
                  class="hue-slider h-4 w-40 cursor-pointer"
                  :style="{ background: `linear-gradient(to right, ${SPECTRUM_STOPS})` }"
                  aria-label="Hue"
                  @input="onHue"
                >
                <span class="h-6 w-6 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/15" :style="{ backgroundColor: color }" />
                <input
                  :value="hexDraft"
                  type="text"
                  maxlength="7"
                  spellcheck="false"
                  autocomplete="off"
                  aria-label="Hex colour"
                  class="h-8 w-20 rounded-full bg-neutral-100 px-3 text-sm text-neutral-700 font-mono outline-none dark:bg-neutral-700 dark:text-neutral-200"
                  @input="onHex"
                >
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.anchor {
  transition: transform 260ms var(--ease-out);
}

.anchor.tracking {
  transition: none;
}

/* Enter once, scaling from the edge facing the text; the pill never scales while it morphs */
.pill {
  display: flex;
  overflow: hidden;
  padding: 3px;
  box-sizing: border-box;
  border-radius: 9999px;
  background: white;
  box-shadow: 0 6px 24px -6px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(0 0 0 / 0.06);
  transition: width 240ms var(--ease-in-out);
  animation: pill-in 160ms var(--ease-out);
}

.dark .pill {
  background: rgb(38 38 38);
  box-shadow: 0 6px 24px -6px rgb(0 0 0 / 0.6), 0 0 0 1px rgb(255 255 255 / 0.08);
}

@keyframes pill-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
}

/* Modes swap fast out, a touch slower in; a little blur hides the two states overlapping */
.mode-leave-active {
  transition: opacity 90ms ease-out, filter 90ms ease-out;
}

.mode-enter-active {
  transition: opacity 160ms var(--ease-out), filter 160ms var(--ease-out);
}

.mode-leave-to,
.mode-enter-from {
  opacity: 0;
  filter: blur(2px);
}

.swatch {
  animation: swatch-in 220ms var(--ease-out) backwards;
  animation-delay: calc(var(--i) * 18ms + 40ms);
}

@keyframes swatch-in {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pill,
  .swatch {
    animation: none;
  }

  .pill,
  .anchor {
    transition: none;
  }

  .mode-enter-from,
  .mode-leave-to {
    filter: none;
  }
}

.hue-slider {
  appearance: none;
  border-radius: 9999px;
  outline: none;
}

.hue-slider::-webkit-slider-thumb {
  appearance: none;
  height: 1.25rem;
  width: 1.25rem;
  border-radius: 9999px;
  background: white;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.2), 0 1px 4px rgb(0 0 0 / 0.3);
}

.hue-slider::-moz-range-thumb {
  height: 1.25rem;
  width: 1.25rem;
  border: 0;
  border-radius: 9999px;
  background: white;
  box-shadow: 0 0 0 1px rgb(0 0 0 / 0.2), 0 1px 4px rgb(0 0 0 / 0.3);
}
</style>
