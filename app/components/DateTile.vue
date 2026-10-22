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
  <time
    :datetime="full"
    class="tile grid size-11 shrink-0 place-items-center border border-neutral-200 rounded-xl bg-white dark:border-neutral-700/80 dark:bg-neutral-800"
  >
    <span class="w-full flex flex-col items-center leading-none">
      <span class="uppercase text-[9px] text-neutral-400 font-semibold tracking-wider dark:text-neutral-500">{{ month }}</span>
      <span class="mt-[3px] h-px w-full bg-neutral-200 dark:bg-neutral-700" aria-hidden="true" />
      <span class="tabular-nums mt-[3px] text-[14px] text-neutral-700 font-semibold dark:text-neutral-200">{{ day }}</span>
    </span>
  </time>
</template>

<style scoped>
.tile {
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.04),
    0 2px 6px -2px rgb(0 0 0 / 0.06);
  will-change: transform;
  transition:
    transform var(--duration-short) var(--ease-out),
    box-shadow var(--duration-short) var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .group:hover .tile {
    transform: translateY(-1px) rotate(-2deg);
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.04),
      0 6px 14px -4px rgb(0 0 0 / 0.12);
  }
}

@media (prefers-reduced-motion: reduce) {
  .group:hover .tile {
    transform: none;
  }
}
</style>
