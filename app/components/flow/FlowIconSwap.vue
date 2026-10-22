<script setup lang="ts">
// Icons that take turns in one spot (play and pause, expand and collapse). All of them stay
// rendered on top of each other and cross-fade: the next one is already growing in while the last
// one shrinks out, so there is never a frame with no icon at all.
interface FlowIconSwapProps {
  icons: string[]
  /** Index of the icon showing */
  active: number
}

defineProps<FlowIconSwapProps>()
</script>

<template>
  <span class="swap grid place-items-center" aria-hidden="true">
    <Icon
      v-for="(icon, index) in icons"
      :key="icon"
      :name="icon"
      class="size-4"
      :class="{ on: index === active }"
    />
  </span>
</template>

<style scoped>
.swap > * {
  grid-area: 1 / 1;
  opacity: 0;
  transform: scale(0.4);
  filter: blur(2px);
  transition:
    opacity 180ms var(--ease-out),
    transform 180ms var(--ease-out),
    filter 180ms var(--ease-out);
}

.swap > .on {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

@media (prefers-reduced-motion: reduce) {
  .swap > * {
    transform: none;
    filter: none;
    transition: opacity 120ms linear;
  }
}
</style>
