<script setup lang="ts">
interface Props {
  date: Date
  /** Print the year: only the first row of each year does, the others keep its slot empty. */
  showYear?: boolean
}

const props = defineProps<Props>()

const year = computed(() => new Date(props.date).getFullYear())
const month = computed(() => String(new Date(props.date).getMonth() + 1).padStart(2, '0'))
</script>

<template>
  <!-- The hidden year still takes its width, so every month lines up in one column. -->
  <time :datetime="`${year}-${month}`" class="tabular-nums inline-flex gap-2 text-xs">
    <span
      class="text-neutral-600 font-medium dark:text-neutral-300"
      :class="{ invisible: !props.showYear }"
    >{{ year }}</span>
    <span class="text-neutral-400 dark:text-neutral-500">{{ month }}</span>
  </time>
</template>
