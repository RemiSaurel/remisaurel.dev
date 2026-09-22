<script setup lang="ts">
import type { FilterDefinition, FilterOption, FilterState, FilterValue } from '~/utils/filters'
import { AnimatePresence, motion } from 'motion-v'
import { MINIMAL } from '~/sounds/sounds'

interface Props {
  definitions: FilterDefinition[]
}

const props = defineProps<Props>()
const filters = defineModel<FilterState>({ required: true })

const { prefersReducedMotion } = usePrefersReducedMotion()
const { play } = useSound()

const selectedFor = (key: string) => filters.value[key] ?? []

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
  filters.value = { ...filters.value, [definition.key]: next }
  play(MINIMAL.tap)
}

function remove(definition: FilterDefinition) {
  filters.value = { ...filters.value, [definition.key]: [] }
  play(MINIMAL.pop)
}

const activeDefinitions = computed(() => props.definitions.filter(definition => selectedFor(definition.key).length))

// Column shown on the right of the "Filter" panel; switches on hover, with no delay.
const panelKey = ref(props.definitions[0]?.key)
const panelDefinition = computed(() => props.definitions.find(definition => definition.key === panelKey.value) ?? props.definitions[0]!)

function operator(definition: FilterDefinition) {
  return selectedFor(definition.key).length > 1 ? 'is any of' : 'is'
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

// Square corners, like the rest of the site.
const POPOVER_UI = { content: 'rounded-none overflow-hidden' }
// The "Filter" panel is two cascading boxes, so the popover itself is only a transparent wrapper.
const PANEL_POPOVER_UI = { content: 'rounded-none bg-transparent shadow-none ring-0' }
const PANEL_BOX = 'bg-white shadow-lg ring-1 ring-neutral-200 dark:bg-neutral-900 dark:ring-neutral-800'
const POPOVER_CONTENT = { align: 'start', sideOffset: 6, collisionPadding: 16 } as const

const CHIP_TRANSITION = { type: 'spring', duration: 0.3, bounce: 0 } as const
const chipTransition = computed(() => prefersReducedMotion.value ? { duration: 0 } : CHIP_TRANSITION)
const CHIP_HIDDEN = { opacity: 0, scale: 0.96, filter: 'blur(4px)' }
const CHIP_SHOWN = { opacity: 1, scale: 1, filter: 'blur(0px)' }
</script>

<template>
  <div class="relative flex flex-wrap items-center gap-1.5">
    <!-- First in the row, so adding a chip never moves the button its panel is anchored to -->
    <UPopover :content="POPOVER_CONTENT" :ui="PANEL_POPOVER_UI">
      <button
        type="button"
        class="h-8 inline-flex pressable cursor-pointer items-center gap-1.5 border border-neutral-200 bg-white px-2.5 text-xs text-neutral-600 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-colors duration-150 ease-out dark:border-neutral-700 hover:border-neutral-300 dark:bg-neutral-900 hover:bg-neutral-50 dark:text-neutral-300 hover:text-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      >
        <Icon name="lucide:list-filter" class="size-3.5" aria-hidden="true" />
        Filter
      </button>

      <template #content>
        <!-- Two boxes glued side by side, each with its own height: the filters fit their
             content, the values grow up to their max. They overlap by 1px to share one border. -->
        <div class="flex items-start">
          <div role="tablist" aria-orientation="vertical" class="relative z-1 w-32 flex shrink-0 flex-col p-1" :class="PANEL_BOX">
            <button
              v-for="definition in props.definitions"
              :key="definition.key"
              type="button"
              role="tab"
              :aria-selected="panelDefinition.key === definition.key"
              class="h-7 flex cursor-pointer items-center gap-2 px-1.5 text-left text-xs outline-none"
              :class="panelDefinition.key === definition.key
                ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100'
                : 'text-neutral-600 dark:text-neutral-400'"
              @pointerenter="panelKey = definition.key"
              @focus="panelKey = definition.key"
              @click="panelKey = definition.key"
            >
              <Icon :name="definition.icon" class="size-3.5 shrink-0" aria-hidden="true" />
              <span class="flex-1 truncate">{{ definition.label }}</span>
              <span v-if="selectedFor(definition.key).length" class="tabular-nums text-[10px] text-neutral-400">{{ selectedFor(definition.key).length }}</span>
            </button>
          </div>
          <FilterOptionList
            :key="panelDefinition.key"
            role="tabpanel"
            class="w-44 -ml-px"
            :class="PANEL_BOX"
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
        layout
        :initial="CHIP_HIDDEN"
        :animate="CHIP_SHOWN"
        :exit="CHIP_HIDDEN"
        :transition="chipTransition"
        class="h-8 inline-flex shrink-0 items-stretch whitespace-nowrap bg-neutral-100 p-1 text-xs dark:bg-neutral-800"
      >
        <!-- Segment 1: what is filtered -->
        <span class="inline-flex items-center gap-1.5 pl-1.5 pr-2 text-neutral-500 dark:text-neutral-400">
          <Icon :name="definition.icon" class="size-3.5" aria-hidden="true" />
          {{ definition.label }}
          <span class="text-neutral-400 font-semibold dark:text-neutral-500">{{ operator(definition) }}</span>
        </span>
        <span class="my-1 w-px bg-neutral-300 dark:bg-neutral-700" aria-hidden="true" />
        <UPopover :content="POPOVER_CONTENT" :ui="POPOVER_UI">
          <button
            type="button"
            class="mx-1 inline-flex cursor-pointer items-center gap-1.5 px-1.5 text-neutral-900 font-medium transition-colors duration-150 ease-out data-[state=open]:bg-neutral-200/70 hover:bg-neutral-200/70 dark:text-neutral-100 dark:data-[state=open]:bg-neutral-700/70 dark:hover:bg-neutral-700/70"
            :aria-label="`Change ${definition.label} filter`"
          >
            <!-- Each icon sits on top of the one to its left (plain DOM order) -->
            <span v-if="chipIcons(definition).length" class="-space-x-1.5 inline-flex items-center">
              <span
                v-for="option in chipIcons(definition)"
                :key="String(option.value)"
                class="relative size-4 inline-flex items-center justify-center border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
              >
                <Icon :name="option.icon!" class="size-2.5" :style="option.iconColor ? { color: option.iconColor } : undefined" aria-hidden="true" />
              </span>
              <span
                v-if="hasMoreIcons(definition)"
                class="relative size-4 inline-flex items-center justify-center border border-neutral-200 bg-white text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
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
          class="ml-1 inline-flex cursor-pointer items-center px-1.5 text-neutral-400 transition-colors duration-150 ease-out hover:bg-neutral-200/70 dark:text-neutral-500 hover:text-neutral-900 dark:hover:bg-neutral-700/70 dark:hover:text-neutral-100"
          :aria-label="`Remove ${definition.label} filter`"
          @click="remove(definition)"
        >
          <Icon name="lucide:x" class="size-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  </div>
</template>
