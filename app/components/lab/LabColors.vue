<script setup lang="ts">
import type { ArtColor, ArtCustomColor, ArtNode, ArtNodeColor } from '~/art/art'
import { ART_COLOR_ORDER, ART_COLORS, ART_PALETTES, artColorValue, colorPair, isGroup, sameColor } from '~/art/art'

const { composition, selectedNodes, entry, canvasTheme, colorSelected, previewColor, commit } = injectLabEditor()

/** What each selected node is drawn in, and whether it picked that or got it from a group. */
const resolved = computed(() => selectedNodes.value.map((node) => {
  if (node.color)
    return { color: node.color, from: null }
  const source = entry(node.id)?.ancestors.findLast(ancestor => ancestor.color)
  return { color: source?.color ?? ('ink' as ArtNodeColor), from: source ?? null }
}))

/** The color to mark: only when every selected node agrees. */
const current = computed<ArtNodeColor | null>(() => {
  const first = resolved.value[0]?.color
  return first && resolved.value.every(item => sameColor(item.color, first)) ? first : null
})

const currentCustom = computed(() => current.value && typeof current.value === 'object' ? current.value : null)

const inheritedFrom = computed(() => {
  const sources = resolved.value.map(item => item.from)
  return sources.every(source => source && source === sources[0]) ? sources[0]! : null
})

const inGroup = computed(() => selectedNodes.value.some(node => !!entry(node.id)?.parent))
const canInherit = computed(() => inGroup.value && selectedNodes.value.some(node => node.color))

const caption = computed(() => {
  if (!current.value)
    return 'Mixed'
  const label = typeof current.value === 'string'
    ? ART_COLORS[current.value].label
    : current.value[canvasTheme.value].toUpperCase()
  return inheritedFrom.value ? `${label}, from ${inheritedFrom.value.name}` : label
})

function pick(color: ArtNodeColor) {
  // At the root, ink is the default: storing it would only add noise to the JSON
  colorSelected(color === 'ink' && !inGroup.value ? null : color)
}

// Arrow keys move through the palette like any radio group, and pick as they go
const swatches = useTemplateRef<HTMLButtonElement[]>('swatches')

function onKeydown(event: KeyboardEvent, index: number) {
  const offset = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!offset)
    return
  event.preventDefault()
  event.stopPropagation()
  const next = (index + offset + ART_COLOR_ORDER.length) % ART_COLOR_ORDER.length
  pick(ART_COLOR_ORDER[next]!)
  swatches.value?.[next]?.focus()
}

const focusIndex = computed(() => current.value && typeof current.value === 'string' ? ART_COLOR_ORDER.indexOf(current.value) : 0)

// Custom colors

const pickerOpen = ref(false)
/** What the picker edits: the selection's own custom color, or a copy of what it shows now. */
const draft = ref<ArtCustomColor>({ ...colorPair('ink') })

watch(pickerOpen, (open) => {
  if (open)
    draft.value = { ...colorPair(current.value ?? 'ink') }
  else
    commit()
})

const pickerModel = computed({
  get: () => draft.value,
  set: (value: ArtCustomColor) => {
    draft.value = value
    previewColor(value)
  },
})

/** Custom colors already in the composition, so a second layer can reuse the first one's. */
const documentColors = computed(() => {
  const found: ArtCustomColor[] = []
  const walk = (nodes: ArtNode[]) => {
    for (const node of nodes) {
      if (node.color && typeof node.color === 'object' && !found.some(color => sameColor(color, node.color)))
        found.push(node.color)
      if (isGroup(node))
        walk(node.children)
    }
  }
  walk(composition.value.layers)
  return found.slice(0, 10)
})

function reuse(color: ArtCustomColor) {
  draft.value = { ...color }
  colorSelected(color)
}

// Escape closes the popover itself and must not also clear the selection underneath
function onPickerKeydown(event: KeyboardEvent) {
  event.stopPropagation()
  if (event.key === 'Escape')
    pickerOpen.value = false
}

const POPOVER_CONTENT = { side: 'bottom', align: 'end', sideOffset: 6, collisionPadding: 16 } as const
const POPOVER_UI = { content: 'rounded-none bg-white shadow-lg ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800' }
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="h-5 flex items-center justify-between gap-2">
      <span class="text-xs text-neutral-500 dark:text-neutral-400">Color</span>
      <div class="min-w-0 flex items-center gap-2 text-[11px]">
        <span class="lab-caption truncate text-neutral-900 dark:text-neutral-100">{{ caption }}</span>
        <button
          v-if="canInherit"
          type="button"
          class="shrink-0 cursor-pointer text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          title="Use the group’s color again"
          @click="colorSelected(null)"
        >
          Inherit
        </button>
      </div>
    </div>

    <!-- Painted in the canvas background: a swatch reads true only on the ground it will sit on -->
    <div
      class="lab-swatches grid grid-cols-11 p-0.5"
      :style="{ '--swatch-ground': ART_PALETTES[canvasTheme].bg, '--swatch-ring': ART_PALETTES[canvasTheme].ink }"
    >
      <div role="radiogroup" aria-label="Palette" class="col-span-10 grid grid-cols-10">
        <button
          v-for="(color, index) in ART_COLOR_ORDER"
          ref="swatches"
          :key="color"
          type="button"
          role="radio"
          class="lab-swatch"
          :class="{ 'is-on': current === color, 'is-inherited': current === color && inheritedFrom }"
          :aria-checked="current === color"
          :aria-label="ART_COLORS[color].label"
          :title="ART_COLORS[color].label"
          :tabindex="index === focusIndex ? 0 : -1"
          :style="{ '--swatch': artColorValue(color, canvasTheme) }"
          @click="pick(color as ArtColor)"
          @keydown="onKeydown($event, index)"
        >
          <span class="lab-swatch-chip" aria-hidden="true" />
        </button>
      </div>

      <UPopover v-model:open="pickerOpen" :content="POPOVER_CONTENT" :ui="POPOVER_UI">
        <button
          type="button"
          class="lab-swatch is-custom"
          :class="{ 'is-on': currentCustom, 'is-inherited': currentCustom && inheritedFrom, 'is-open': pickerOpen }"
          :aria-label="currentCustom ? `Custom color ${currentCustom[canvasTheme]}` : 'Pick a custom color'"
          title="Custom color"
          :style="currentCustom ? { '--swatch': currentCustom[canvasTheme] } : undefined"
        >
          <span class="lab-swatch-chip" aria-hidden="true" />
        </button>

        <template #content>
          <div class="w-56 flex flex-col gap-3 p-3" @keydown="onPickerKeydown">
            <LabColorPicker v-model="pickerModel" :initial-theme="canvasTheme" />
            <div v-if="documentColors.length" class="flex flex-col gap-1.5">
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400">In this composition</span>
              <div class="lab-swatches flex flex-wrap p-0.5" :style="{ '--swatch-ground': ART_PALETTES[canvasTheme].bg, '--swatch-ring': ART_PALETTES[canvasTheme].ink }">
                <button
                  v-for="color in documentColors"
                  :key="`${color.light}-${color.dark}`"
                  type="button"
                  class="lab-swatch w-[calc(100%/8)]"
                  :class="{ 'is-on': sameColor(color, draft) }"
                  :aria-label="`Use ${color[canvasTheme]}`"
                  :title="color[canvasTheme].toUpperCase()"
                  :style="{ '--swatch': color[canvasTheme] }"
                  @click="reuse(color)"
                >
                  <span class="lab-swatch-chip" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </template>
      </UPopover>
    </div>
  </div>
</template>

<style scoped>
.lab-caption {
  font-variant-numeric: tabular-nums;
}

.lab-swatches {
  background: var(--swatch-ground);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.06);
}

.dark .lab-swatches {
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.06);
}

/* The whole cell is the hit area; the chip inside stays small so the ring has room */
.lab-swatch {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  min-height: 1.5rem;
  cursor: pointer;
  outline: none;
}

.lab-swatch-chip {
  width: 0.75rem;
  height: 0.75rem;
  background: var(--swatch);
  /* Picked over and over while composing: the ring snaps, only the press has motion */
  transition: transform 160ms var(--ease-out);
}

/* Nothing custom yet: the chip is the whole hue range, the one place a gradient says "any" */
.lab-swatch.is-custom:not(.is-on) .lab-swatch-chip {
  background: conic-gradient(from 90deg, #f87171, #facc15, #4ade80, #22d3ee, #60a5fa, #a78bfa, #f472b6, #f87171);
}

.lab-swatch:active .lab-swatch-chip {
  transform: scale(0.85);
}

.lab-swatch.is-on .lab-swatch-chip,
.lab-swatch.is-open .lab-swatch-chip {
  outline: 1px solid var(--swatch-ring);
  outline-offset: 2px;
}

/* Same color, but not this node's own choice: a dashed ring says it comes from above */
.lab-swatch.is-inherited .lab-swatch-chip {
  outline-style: dashed;
}

.lab-swatch:focus-visible {
  box-shadow: inset 0 0 0 1px #4f7cff;
}

@media (prefers-reduced-motion: reduce) {
  .lab-swatch-chip {
    transition: none;
  }
}
</style>
