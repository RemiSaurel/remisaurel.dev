<script setup lang="ts">
// The small sheet at the start of a row (a post, an exploration, a news item). When the row around it has
// `group`, the tile lifts and tilts on hover and gives under a press.
//
// <RowTile as="time" :datetime="iso">…</RowTile>
interface RowTileProps {
  /** The tag it renders as */
  as?: string
  /** A promise of a sheet, not one yet: dashed and without a fill */
  dashed?: boolean
}

const props = withDefaults(defineProps<RowTileProps>(), { as: 'span', dashed: false })
</script>

<template>
  <component
    :is="props.as"
    class="tile grid size-11 shrink-0 place-items-center border rounded-xl text-neutral-400 dark:text-neutral-500"
    :class="props.dashed
      ? 'border-dashed border-neutral-300 bg-transparent dark:border-neutral-600'
      : 'border-neutral-200 bg-white dark:border-neutral-700/80 dark:bg-neutral-800'"
  >
    <slot />
  </component>
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
