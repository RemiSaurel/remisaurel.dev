<script setup lang="ts">
interface ExplorationRowProps {
  to: string
  title: string
  description: string
  status?: 'draft' | 'wip' | 'published'
  icon?: string
}

defineProps<ExplorationRowProps>()

const { play } = useSound()
</script>

<template>
  <NuxtLink
    :to="to"
    class="group flex items-center gap-4 rounded-xl px-2 py-2 -mx-2"
    @click="play('navigate', { emphasis: 'subtle', volume: 0.5 })"
  >
    <!-- The tile is a small sheet: an icon when the exploration has one, a few lines of text otherwise -->
    <span
      class="tile grid size-11 shrink-0 place-items-center border border-neutral-200 rounded-xl bg-white text-neutral-400 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-500"
      aria-hidden="true"
    >
      <Icon v-if="icon" :name="icon" class="size-[18px]" />
      <span v-else class="w-[18px] flex flex-col gap-[3px]">
        <span class="h-[1.5px] w-full rounded-full bg-current" />
        <span class="h-[1.5px] w-full rounded-full bg-current" />
        <span class="h-[1.5px] w-full rounded-full bg-current" />
        <span class="h-[1.5px] w-3/5 rounded-full bg-current" />
      </span>
    </span>

    <span class="min-w-0 flex flex-col">
      <span class="flex items-center gap-2">
        <span class="truncate text-[15px] text-neutral-800 font-medium transition-colors duration-150 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white">
          {{ title }}
        </span>
        <span
          v-if="status === 'draft' || status === 'wip'"
          class="uppercase shrink-0 border border-neutral-200 rounded-full px-1.5 py-px text-[10px] text-neutral-500 font-medium tracking-wide dark:border-neutral-700 dark:text-neutral-400"
        >
          {{ status === 'draft' ? 'Draft' : 'WIP' }}
        </span>
      </span>
      <span class="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
        {{ description }}
      </span>
    </span>
  </NuxtLink>
</template>

<style scoped>
.tile {
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.04),
    0 2px 6px -2px rgb(0 0 0 / 0.06);
  /* Always on its own layer: otherwise the browser drops it when the transition ends and the tile
     snaps from its subpixel position back to the pixel grid, a visible 1px jump */
  will-change: transform;
  transition:
    transform var(--duration-short) var(--ease-out),
    box-shadow var(--duration-short) var(--ease-out),
    color var(--duration-short) var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .group:hover .tile {
    transform: translateY(-1px) rotate(-2deg);
    color: rgb(64 64 64);
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.04),
      0 6px 14px -4px rgb(0 0 0 / 0.12);
  }

  .dark .group:hover .tile {
    color: rgb(212 212 212);
  }
}

.group:active .tile {
  transform: scale(0.96);
}

@media (prefers-reduced-motion: reduce) {
  .group:hover .tile,
  .group:active .tile {
    transform: none;
  }
}
</style>
