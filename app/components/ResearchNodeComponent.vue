<script setup lang="ts">
import type { ResearchNode } from '~/research/research'
import { VIEW_H, VIEW_W } from '~/research/research'

defineProps<{
  node: ResearchNode
  position: { x: number, y: number }
  opacity: number
}>()

defineEmits<{
  click: [event: MouseEvent]
  mouseenter: []
  mouseleave: []
  focus: []
  blur: []
}>()

function pct(value: number, total: number) {
  return `${(value / total) * 100}%`
}
</script>

<template>
  <div
    class="absolute z-10 w-max"
    :style="{ left: pct(position.x, VIEW_W), top: pct(position.y, VIEW_H), transform: 'translate(-50%, -50%)' }"
  >
    <component
      :is="node.url ? 'a' : 'div'"
      :href="node.url"
      :target="node.url ? '_blank' : undefined"
      :rel="node.url ? 'noopener noreferrer' : undefined"
      :draggable="false"
      class="rl-node relative touch-none transition-opacity active:cursor-grabbing"
      :class="[
        node.url ? 'intro-link pressable cursor-pointer' : 'cursor-grab text-center',
        `rl-node-${node.kind}`,
        `rl-${node.clusters[0] || 'hub'}`,
      ]"
      :style="{ opacity, maxWidth: node.maxW ? `${node.maxW}px` : undefined }"
      @click="$emit('click', $event)"
      @mouseenter="$emit('mouseenter')"
      @mouseleave="$emit('mouseleave')"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
    >
      <span v-if="node.venue" class="rl-venue">{{ node.venue }}</span>
      <span class="rl-label" :class="{ 'font-500': node.kind === 'paper' }">{{ node.label }}</span>
    </component>
  </div>
</template>

<style scoped>
.rl-node-theme,
.rl-node-hub {
  background-color: rgb(var(--c));
  color: var(--rl-on);
}

.rl-node-topic {
  background-color: var(--rl-surface);
  border: 1px solid rgb(var(--c) / 0.4);
}

.rl-node-paper {
  background-color: color-mix(in srgb, rgb(var(--c)) 8%, var(--rl-surface));
  border: 1px solid rgb(var(--c) / 0.35);
}

.rl-node-paper:hover {
  border-color: rgb(var(--c) / 0.6);
  background-color: color-mix(in srgb, rgb(var(--c)) 14%, var(--rl-surface));
}

.rl-venue {
  color: rgb(var(--c));
}
</style>
