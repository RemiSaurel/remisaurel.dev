<script setup lang="ts">
import type { FilterDefinition, FilterEntry, FilterMode, FilterOption, FilterState, FilterValue } from '~/utils/filters'
import { AnimatePresence, motion } from 'motion-v'
import { effectiveMode, emptyFilterEntry, emptyFilterState, filterModes, modeLabel } from '~/utils/filters'

interface Props {
  definitions: FilterDefinition[]
}

const props = defineProps<Props>()
const filters = defineModel<FilterState>({ required: true })

const { prefersReducedMotion } = usePrefersReducedMotion()
const { play } = useSound()

const entryFor = (key: string): FilterEntry => filters.value[key] ?? emptyFilterEntry()
const selectedFor = (key: string) => entryFor(key).values

function selectedOptions(definition: FilterDefinition): FilterOption[] {
  const selected = selectedFor(definition.key)
  return definition.options.filter(option => selected.includes(option.value))
}

function toggle(definition: FilterDefinition, value: FilterValue) {
  const selected = selectedFor(definition.key)
  let next: FilterValue[]
  if (definition.multiple)
    next = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]
  else
    // Single choice: picking the selected value again clears it.
    next = selected.includes(value) ? [] : [value]
  // An emptied filter disappears, so it comes back as a plain "is" next time.
  const mode = next.length ? entryFor(definition.key).mode : 'include'
  filters.value = { ...filters.value, [definition.key]: { mode, values: next } }
  play('toggle', { direction: next.includes(value) ? 'forward' : 'back' })
}

function setMode(definition: FilterDefinition, mode: FilterMode) {
  filters.value = { ...filters.value, [definition.key]: { ...entryFor(definition.key), mode } }
  play('select', { emphasis: 'subtle' })
}

function remove(definition: FilterDefinition) {
  filters.value = { ...filters.value, [definition.key]: emptyFilterEntry() }
  play('close', { emphasis: 'subtle' })
}

function clearAll() {
  filters.value = emptyFilterState(props.definitions)
  play('close', { emphasis: 'subtle' })
}

const activeDefinitions = computed(() => props.definitions.filter(definition => selectedFor(definition.key).length))

// Column shown on the right of the "Filter" panel; switches on hover, with no delay.
const panelKey = ref(props.definitions[0]?.key)
const panelDefinition = computed(() => props.definitions.find(definition => definition.key === panelKey.value) ?? props.definitions[0]!)

function operator(definition: FilterDefinition) {
  const entry = entryFor(definition.key)
  return modeLabel(effectiveMode(entry), entry.values.length)
}

// "is all of" only differs from "is any of" once two values are picked, so it is offered from then on.
function modeOptions(definition: FilterDefinition): FilterOption[] {
  const count = selectedFor(definition.key).length
  return filterModes(definition)
    .filter(mode => mode !== 'all' || count > 1)
    .map(mode => ({ value: mode, label: modeLabel(mode, count) }))
}

// Two short labels read fine side by side ("2025, 2024"); past that, a count is clearer.
function valueLabel(definition: FilterDefinition) {
  const labels = selectedOptions(definition).map(option => option.label)
  if (labels.length === 1 || (labels.length === 2 && labels.join(', ').length <= 14))
    return labels.join(', ')
  return `${labels.length} ${definition.plural ?? 'values'}`
}

// Past three icons, the rest collapse into an ellipsis square.
const CHIP_ICON_LIMIT = 3
const iconOptions = (definition: FilterDefinition) => selectedOptions(definition).filter(option => option.icon)
const chipIcons = (definition: FilterDefinition) => iconOptions(definition).slice(0, CHIP_ICON_LIMIT)
const hasMoreIcons = (definition: FilterDefinition) => iconOptions(definition).length > CHIP_ICON_LIMIT

// Same sheet as the posts and explorations tiles, raised a little more. Rows inside sit 4px in, so their 8px corners stay concentric.
const PANEL_BOX = 'sheet rounded-xl shadow-lg'
const POPOVER_UI = { content: `rounded-xl overflow-hidden ring-0 ${PANEL_BOX}` }
const POPOVER_CONTENT = { align: 'start', sideOffset: 6, collisionPadding: 16 } as const

const CHIP_TRANSITION = { type: 'spring', duration: 0.3, bounce: 0 } as const
const chipTransition = computed(() => prefersReducedMotion.value ? { duration: 0 } : CHIP_TRANSITION)
const CHIP_HIDDEN = { opacity: 0, scale: 0.96, filter: 'blur(4px)' }
const CHIP_SHOWN = { opacity: 1, scale: 1, filter: 'blur(0px)' }
// "Clear filters" sits after the chips, so any slide or slow fade would run under a chip that is
// entering or leaving. It snaps to its place and leaves at once instead of overlapping them.
const CLEAR_EXIT = { opacity: 0, transition: { duration: 0 } }
// "is" to "is any of" resizes the chip instantly (layout="position": animating the size would
// scale the text), so the new operator blurs in to hide the snap.
const OPERATOR_HIDDEN = { opacity: 0, filter: 'blur(2px)' }
const OPERATOR_SHOWN = { opacity: 1, filter: 'blur(0px)' }
</script>

<template>
  <div class="relative flex flex-wrap items-center gap-1.5">
    <!-- First in the row, so adding a chip never moves the button its panel is anchored to -->
    <UPopover :content="POPOVER_CONTENT" :ui="POPOVER_UI">
      <button
        type="button"
        class="filter-trigger sheet h-8 inline-flex pressable cursor-pointer items-center gap-1.5 rounded-[10px] px-2.5 text-xs text-neutral-600 dark:text-neutral-300"
      >
        <Icon name="lucide:list-filter" class="size-3.5" aria-hidden="true" />
        Filter
      </button>

      <template #content>
        <!-- One sheet, two columns: the filters on the left, the values of the hovered one on the right -->
        <div class="flex items-stretch">
          <div role="group" aria-label="Filters" class="w-32 flex shrink-0 flex-col border-r border-neutral-200 p-1 dark:border-neutral-700/80">
            <button
              v-for="definition in props.definitions"
              :key="definition.key"
              type="button"
              :aria-current="panelDefinition.key === definition.key || undefined"
              class="h-7 flex cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left text-xs focus-visible:[outline-offset:-2px] focus-visible:bg-neutral-100 dark:focus-visible:bg-neutral-700/60"
              :class="panelDefinition.key === definition.key
                ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-700/60 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400'"
              @pointerenter="panelKey = definition.key"
              @focus="panelKey = definition.key"
              @click="panelKey = definition.key"
            >
              <Icon :name="definition.icon" class="size-3.5 shrink-0" aria-hidden="true" />
              <span class="flex-1 truncate">{{ definition.label }}</span>
              <span v-if="selectedFor(definition.key).length" class="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">{{ selectedFor(definition.key).length }}</span>
            </button>
          </div>
          <FilterOptionList
            :key="panelDefinition.key"
            class="w-44"
            :label="panelDefinition.label"
            :options="panelDefinition.options"
            :selected="selectedFor(panelDefinition.key)"
            :multiple="panelDefinition.multiple"
            :search-placeholder="panelDefinition.searchPlaceholder"
            @toggle="toggle(panelDefinition, $event)"
          />
        </div>
      </template>
    </UPopover>

    <AnimatePresence :initial="false" mode="popLayout">
      <motion.div
        v-for="definition in activeDefinitions"
        :key="definition.key"
        layout="position"
        :initial="CHIP_HIDDEN"
        :animate="CHIP_SHOWN"
        :exit="CHIP_HIDDEN"
        :transition="chipTransition"
        class="h-8 inline-flex shrink-0 items-stretch whitespace-nowrap rounded-[10px] bg-neutral-100 p-1 text-xs dark:bg-neutral-800"
      >
        <!-- Segment 1: what is filtered, and how -->
        <span class="inline-flex items-center gap-1.5 pl-1.5 text-neutral-500 dark:text-neutral-400">
          <Icon :name="definition.icon" class="size-3.5" aria-hidden="true" />
          {{ definition.label }}
        </span>
        <UPopover v-if="modeOptions(definition).length > 1" :content="POPOVER_CONTENT" :ui="POPOVER_UI">
          <button
            type="button"
            class="mx-1 inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 text-neutral-500 font-semibold transition-colors duration-150 ease-out data-[state=open]:bg-neutral-200/70 hover:bg-neutral-200/70 dark:text-neutral-400 data-[state=open]:text-neutral-900 hover:text-neutral-900 dark:data-[state=open]:bg-neutral-700/70 dark:hover:bg-neutral-700/70 dark:data-[state=open]:text-neutral-100 dark:hover:text-neutral-100"
            :aria-label="`Change ${definition.label} operator`"
          >
            <motion.span
              :key="operator(definition)"
              :initial="OPERATOR_HIDDEN"
              :animate="OPERATOR_SHOWN"
              :transition="chipTransition"
            >
              {{ operator(definition) }}
            </motion.span>
            <Icon name="lucide:chevron-down" class="size-3" aria-hidden="true" />
          </button>

          <template #content>
            <FilterOptionList
              class="w-36"
              :label="`${definition.label} operator`"
              :options="modeOptions(definition)"
              :selected="[effectiveMode(entryFor(definition.key))]"
              @toggle="setMode(definition, $event as FilterMode)"
            />
          </template>
        </UPopover>
        <span v-else class="mx-1 inline-flex items-center px-1.5 text-neutral-500 font-semibold dark:text-neutral-400">
          {{ operator(definition) }}
        </span>
        <span class="my-1 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden="true" />
        <UPopover :content="POPOVER_CONTENT" :ui="POPOVER_UI">
          <button
            type="button"
            class="mx-1 inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 text-neutral-900 font-medium transition-colors duration-150 ease-out data-[state=open]:bg-neutral-200/70 hover:bg-neutral-200/70 dark:text-neutral-100 dark:data-[state=open]:bg-neutral-700/70 dark:hover:bg-neutral-700/70"
            :aria-label="`Change ${definition.label} filter`"
          >
            <!-- Each icon sits on top of the one to its left (plain DOM order) -->
            <span v-if="chipIcons(definition).length" class="-space-x-1.5 inline-flex items-center">
              <span
                v-for="option in chipIcons(definition)"
                :key="String(option.value)"
                class="relative size-4 inline-flex items-center justify-center border border-neutral-200 rounded-full bg-white dark:border-neutral-700 dark:bg-neutral-900"
              >
                <Icon :name="option.icon!" class="size-2.5" :style="option.iconColor ? { color: option.iconColor } : undefined" aria-hidden="true" />
              </span>
              <span
                v-if="hasMoreIcons(definition)"
                class="relative size-4 inline-flex items-center justify-center border border-neutral-200 rounded-full bg-white text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
                aria-hidden="true"
              >
                <Icon name="lucide:ellipsis" class="size-2.5" />
              </span>
            </span>
            {{ valueLabel(definition) }}
            <Icon
              name="lucide:chevron-down"
              class="size-3 text-neutral-400 dark:text-neutral-500"
              aria-hidden="true"
            />
          </button>

          <template #content>
            <FilterOptionList
              class="w-48"
              :label="definition.label"
              :options="definition.options"
              :selected="selectedFor(definition.key)"
              :multiple="definition.multiple"
              :search-placeholder="definition.searchPlaceholder"
              @toggle="toggle(definition, $event)"
            />
          </template>
        </UPopover>
        <span class="my-1 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden="true" />
        <button
          type="button"
          class="ml-1 inline-flex cursor-pointer items-center rounded-md px-1.5 text-neutral-500 transition-colors duration-150 ease-out hover:bg-neutral-200/70 dark:text-neutral-400 hover:text-neutral-900 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-100"
          :aria-label="`Remove ${definition.label} filter`"
          @click="remove(definition)"
        >
          <Icon name="lucide:x" class="size-3.5" />
        </button>
      </motion.div>
      <motion.button
        v-if="activeDefinitions.length"
        key="clear-all"
        type="button"
        :initial="CHIP_HIDDEN"
        :animate="CHIP_SHOWN"
        :exit="CLEAR_EXIT"
        :transition="chipTransition"
        class="h-8 inline-flex shrink-0 pressable cursor-pointer items-center rounded-[10px] px-2 text-xs text-neutral-500 transition-colors duration-150 ease-out dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        @click="clearAll()"
      >
        Clear filters
      </motion.button>
    </AnimatePresence>
  </div>
</template>

<style scoped>
.filter-trigger {
  transition:
    transform 160ms var(--ease-out),
    border-color 150ms var(--ease-out),
    color 150ms var(--ease-out);
}

/* Hover state kept while its panel is open */
.filter-trigger[data-state='open'] {
  border-color: rgb(163 163 163);
  color: rgb(23 23 23);
}

.dark .filter-trigger[data-state='open'] {
  border-color: rgb(115 115 115);
  color: rgb(245 245 245);
}

@media (hover: hover) and (pointer: fine) {
  .filter-trigger:hover {
    border-color: rgb(163 163 163);
    color: rgb(23 23 23);
  }

  .dark .filter-trigger:hover {
    border-color: rgb(115 115 115);
    color: rgb(245 245 245);
  }
}
</style>
