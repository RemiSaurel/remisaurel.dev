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
          class="size-3.5 flex shrink-0 items-center justify-center border"
          :class="[
            props.multiple ? '' : 'rounded-full',
            isSelected(option)
              ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
              : 'border-neutral-300 dark:border-neutral-600',
          ]"
          aria-hidden="true"
        >
          <Icon v-if="isSelected(option) && props.multiple" name="lucide:check" class="size-2.5" />
          <span v-else-if="isSelected(option)" class="size-1.5 rounded-full bg-current" />
        </span>
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
