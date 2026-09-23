<script setup lang="ts">
import type { FilterOption, FilterValue } from '~/utils/filters'

interface Props {
  options: FilterOption[]
  selected: FilterValue[]
  /** Checkboxes when true, a single choice (radio) otherwise. */
  multiple?: boolean
  searchPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  multiple: false,
})

const emit = defineEmits<{
  toggle: [value: FilterValue]
}>()

const search = ref('')

const visibleOptions = computed(() => {
  const term = search.value.trim().toLowerCase()
  return term ? props.options.filter(option => option.label.toLowerCase().includes(term)) : props.options
})

const isSelected = (option: FilterOption) => props.selected.includes(option.value)
</script>

<template>
  <div class="flex flex-col">
    <input
      v-if="props.searchPlaceholder"
      v-model="search"
      type="text"
      :placeholder="props.searchPlaceholder"
      class="h-8 w-full shrink-0 border-0 border-b border-neutral-200 bg-transparent px-2.5 text-xs text-neutral-900 outline-none dark:border-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
    >
    <div
      role="group"
      class="max-h-64 min-h-0 flex flex-1 flex-col overflow-y-auto p-1"
    >
      <button
        v-for="option in visibleOptions"
        :key="String(option.value)"
        type="button"
        :role="props.multiple ? 'menuitemcheckbox' : 'menuitemradio'"
        :aria-checked="isSelected(option)"
        class="h-7 w-full flex shrink-0 cursor-pointer items-center gap-2 px-1.5 text-left text-xs text-neutral-700 outline-none focus-visible:bg-neutral-100 hover:bg-neutral-100 dark:text-neutral-300 dark:focus-visible:bg-neutral-800 dark:hover:bg-neutral-800"
        @click="emit('toggle', option.value)"
      >
        <span
          v-if="props.multiple"
          class="size-3.5 flex shrink-0 items-center justify-center border"
          :class="isSelected(option)
            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
            : 'border-neutral-300 dark:border-neutral-600'"
          aria-hidden="true"
        >
          <Icon v-if="isSelected(option)" name="lucide:check" class="size-2.5" />
        </span>
        <!-- Ring and dot in one SVG: a CSS border snaps to device pixels but its content does not,
             so a dot nested in a bordered box drifts off-center at fractional positions.
             overflow-visible: the ring touches the viewBox edge, and its anti-aliasing would be clipped. -->
        <svg
          v-else
          viewBox="0 0 14 14"
          class="size-3.5 shrink-0 overflow-visible"
          :class="isSelected(option) ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-300 dark:text-neutral-600'"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="6.5" :fill="isSelected(option) ? 'currentColor' : 'none'" stroke="currentColor" />
          <circle v-if="isSelected(option)" cx="7" cy="7" r="3" fill="currentColor" class="text-white dark:text-neutral-900" />
        </svg>
        <Icon
          v-if="option.icon"
          :name="option.icon"
          class="size-3.5 shrink-0"
          :style="option.iconColor ? { color: option.iconColor } : undefined"
          aria-hidden="true"
        />
        <span class="flex-1 truncate">{{ option.label }}</span>
        <span v-if="option.count !== undefined" class="tabular-nums text-[10px] text-neutral-400 dark:text-neutral-500">{{ option.count }}</span>
      </button>
      <span v-if="!visibleOptions.length" class="px-1.5 py-2 text-xs text-neutral-400">
        No match
      </span>
    </div>
  </div>
</template>
