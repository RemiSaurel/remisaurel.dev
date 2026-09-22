<script setup lang="ts">
import type { ClusterId } from '~/research/research'

defineProps<{
  regions: Array<{ id: ClusterId, rect: { x: number, y: number, width: number, height: number } }>
  edges: Array<{ id: string, d: string, highlight: boolean, dimmed: boolean, cluster: ClusterId | null }>
  focusedClusters: Set<ClusterId> | null
  positions: Record<string, { x: number, y: number }>
}>()

defineEmits<{
  registerRegion: [clusterId: ClusterId, element: SVGRectElement | null]
}>()
</script>

<template>
  <svg
    class="absolute inset-0 h-full w-full overflow-visible"
    viewBox="0 0 1000 460"
    preserveAspectRatio="none"
  >
    <!-- Cluster regions -->
    <rect
      v-for="region in regions"
      :key="region.id"
      :ref="el => $emit('registerRegion', region.id, el as SVGRectElement)"
      :x="region.rect.x"
      :y="region.rect.y"
      :width="region.rect.width"
      :height="region.rect.height"
      class="rl-region touch-none cursor-grab active:cursor-grabbing"
      :class="[`rl-${region.id}`, { 'rl-region-dimmed': focusedClusters && !focusedClusters.has(region.id) }]"
    />

    <!-- Links -->
    <path
      v-for="(edge, index) in edges"
      :key="edge.id"
      :d="edge.d"
      pathLength="1"
      class="rl-edge pointer-events-none fill-none"
      :class="[
        edge.cluster ? `rl-${edge.cluster}` : 'rl-hub',
        { 'rl-edge-active': edge.highlight, 'rl-edge-dimmed': edge.dimmed },
      ]"
      :style="{ '--i': index }"
    />
  </svg>
</template>

<style scoped>
.rl-region {
  fill: rgb(var(--c) / var(--rl-region-fill));
  stroke: rgb(var(--c) / var(--rl-region-stroke));
  stroke-width: 1;
  stroke-dasharray: 3 4;
  transition: opacity 120ms ease;
  animation: rl-fade-in 500ms var(--ease-out) backwards;
}

.rl-region-dimmed {
  opacity: 0.35;
}

.rl-edge {
  stroke: var(--rl-edge);
  stroke-width: 1;
  stroke-linecap: round;
  /* Drawn in once on load, from each link's source. Hover then only changes colour. */
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
  transition: opacity 120ms ease, stroke 120ms ease;
  animation: rl-edge-draw 700ms var(--ease-in-out) backwards;
  animation-delay: calc(260ms + var(--i) * 10ms);
}

.rl-edge-active {
  stroke: rgb(var(--c) / 0.8);
  stroke-width: 1.5;
}

.rl-edge-dimmed {
  opacity: 0.25;
}

@keyframes rl-edge-draw {
  from {
    stroke-dashoffset: 1;
  }
}

@keyframes rl-fade-in {
  from {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rl-edge {
    animation: rl-fade-in 200ms ease backwards;
  }
}
</style>
