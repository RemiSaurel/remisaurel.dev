<script setup lang="ts">
interface Props {
  date: Date | string
}

const props = defineProps<Props>()

// UTC, like the ISO dates of the data files: SSR and client print the same day whatever the timezone
const parsed = computed(() => new Date(props.date))
const month = computed(() => parsed.value.toLocaleString('en', { month: 'short', timeZone: 'UTC' }))
const day = computed(() => parsed.value.getUTCDate())
const full = computed(() => parsed.value.toISOString().slice(0, 10))
</script>

<template>
  <!-- Same tile as the post and exploration rows, read as a small tear-off calendar: month above, day below -->
  <RowTile as="time" :datetime="full">
    <span class="w-full flex flex-col items-center leading-none">
      <span class="uppercase text-[9px] text-neutral-400 font-semibold tracking-wider dark:text-neutral-500">{{ month }}</span>
      <span class="mt-[3px] h-px w-full bg-neutral-200 dark:bg-neutral-700" aria-hidden="true" />
      <span class="tabular-nums mt-[3px] text-[14px] text-neutral-700 font-semibold dark:text-neutral-200">{{ day }}</span>
    </span>
  </RowTile>
</template>
