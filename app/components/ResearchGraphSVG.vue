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

function clusterClass(ids: ClusterId[]) {
  return ids.length ? `rl-${ids[0]}` : 'rl-hub'
}
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
      class="rl-region touch-none cursor-grab active:cursor-grabbing stroke-1 transition-opacity"
      :class="clusterClass([region.id])"
      :style="{ opacity: focusedClusters ? (focusedClusters.has(region.id) ? 1 : 0.3) : 1 }"
    />

    <!-- Links -->
    <template v-for="edge in edges" :key="edge.id">
      <path
        :d="edge.d"
        class="rl-edge pointer-events-none fill-none stroke-1 stroke-[var(--rl-edge)] transition-[opacity,stroke]"
        :class="[
          edge.cluster ? `rl-${edge.cluster}` : '',
          { 'rl-edge-active stroke-[rgb(var(--c)/0.7)]': edge.highlight, 'rl-edge-dimmed opacity-30': edge.dimmed },
        ]"
      />
      <path
        v-if="edge.highlight"
        :d="edge.d"
        class="rl-edge-flow pointer-events-none fill-none stroke-[rgb(var(--c)/0.8)]"
        :class="edge.cluster ? `rl-${edge.cluster}` : ''"
      />
    </template>
  </svg>
</template>

<style scoped>
.rl-region {
  fill: rgb(var(--c) / var(--rl-region-fill));
  stroke: rgb(var(--c) / var(--rl-region-stroke));
}

.rl-edge-flow {
  stroke-width: 1.4;
  stroke-linecap: round;
  stroke-dasharray: 4 26;
  animation: rl-edge-flow 1.1s linear infinite;
}

@keyframes rl-edge-flow {
  to {
    stroke-dashoffset: -30;
  }
}
</style>
