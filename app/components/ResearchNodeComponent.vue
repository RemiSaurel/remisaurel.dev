<script setup lang="ts">
import type { ResearchNode } from '~/research/research'
import { VIEW_H, VIEW_W } from '~/research/research'

defineProps<{
  node: ResearchNode
  position: { x: number, y: number }
  opacity: number
  /** Rank in the entrance cascade: hub first, then themes, topics, papers. */
  order: number
  dragging: boolean
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
    :class="{ 'z-20': dragging }"
    :style="{ left: pct(position.x, VIEW_W), top: pct(position.y, VIEW_H), transform: 'translate(-50%, -50%)' }"
  >
    <component
      :is="node.url ? 'a' : 'div'"
      :href="node.url"
      :target="node.url ? '_blank' : undefined"
      :rel="node.url ? 'noopener noreferrer' : undefined"
      :draggable="false"
      class="rl-node touch-none relative"
      :class="[
        node.url ? 'cursor-pointer' : 'cursor-grab',
        `rl-node-${node.kind}`,
        `rl-${node.clusters[0] || 'hub'}`,
        { 'is-dragging': dragging },
      ]"
      :style="{ 'opacity': opacity, 'maxWidth': node.maxW ? `${node.maxW}px` : undefined, '--i': order }"
      @click="$emit('click', $event)"
      @mouseenter="$emit('mouseenter')"
      @mouseleave="$emit('mouseleave')"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
    >
      <!-- Paper: venue row with one dot per cluster it bridges -->
      <span v-if="node.kind === 'paper'" class="rl-paper-meta">
        <span class="flex shrink-0 items-center gap-[3px]">
          <span v-for="cluster in node.clusters" :key="cluster" class="rl-dot" :class="`rl-${cluster}`" />
        </span>
        <span v-if="node.venue" class="rl-venue">{{ node.venue }}</span>
        <Icon v-if="node.url" name="uil:arrow-up-right" class="rl-paper-arrow" />
      </span>

      <span v-if="node.kind === 'topic' || node.kind === 'theme'" class="rl-dot mt-[0.42em]" />
      <span class="rl-label">{{ node.label }}</span>
    </component>
  </div>
</template>

<style scoped>
.rl-node {
  display: flex;
  font-size: 0.78rem;
  line-height: 1.35;
  color: var(--rl-text);
  /* Press, lift and focus dimming are the only transitions: color changes on hover stay instant. */
  transition:
    scale 160ms var(--ease-out),
    box-shadow 160ms var(--ease-out),
    opacity 120ms ease;
  animation: rl-node-in 380ms var(--ease-out) backwards;
  animation-delay: calc(120ms + var(--i) * 28ms);
}

.rl-node:active {
  scale: 0.97;
}

.rl-node.is-dragging {
  scale: 1.04;
  cursor: grabbing;
  box-shadow: var(--rl-shadow-lift);
}

.rl-node:focus-visible {
  outline: 2px solid rgb(var(--c) / 0.6);
  outline-offset: 2px;
}

/* Hub: the single filled anchor */
.rl-node-hub {
  padding: 0.5rem 0.8rem;
  justify-content: center;
  text-align: center;
  font-weight: 600;
  letter-spacing: -0.005em;
  background-color: var(--rl-hub-bg);
  color: var(--rl-hub-on);
  box-shadow: var(--rl-shadow);
}

/* Theme: tinted chip, the cluster's name tag */
.rl-node-theme {
  gap: 0.45rem;
  padding: 0.36rem 0.7rem 0.36rem 0.6rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: rgb(var(--c));
  background-color: color-mix(in srgb, rgb(var(--c)) 11%, var(--rl-surface));
  box-shadow: inset 0 0 0 1px rgb(var(--c) / 0.28);
}

/* Topic: quiet neutral chip, the dot carries the colour */
.rl-node-topic {
  gap: 0.45rem;
  padding: 0.3rem 0.62rem 0.3rem 0.52rem;
  background-color: var(--rl-surface);
  box-shadow: inset 0 0 0 1px var(--rl-hairline);
}

/* Paper: raised card, the only nodes that lead somewhere */
.rl-node-paper {
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.45rem 0.7rem 0.5rem;
  font-weight: 500;
  line-height: 1.3;
  background-color: var(--rl-surface);
  box-shadow: inset 0 0 0 1px var(--rl-hairline), var(--rl-shadow);
}

.rl-node-paper.is-dragging {
  box-shadow: inset 0 0 0 1px var(--rl-hairline), var(--rl-shadow-lift);
}

@media (hover: hover) and (pointer: fine) {
  .rl-node-topic:hover {
    box-shadow: inset 0 0 0 1px var(--rl-hairline-strong);
  }

  .rl-node-paper:hover {
    box-shadow: inset 0 0 0 1px rgb(var(--c) / 0.45), var(--rl-shadow);
  }

  .rl-node-paper:hover .rl-paper-arrow {
    color: rgb(var(--c));
    translate: 1px -1px;
  }
}

.rl-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background-color: rgb(var(--c));
}

.rl-paper-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.rl-venue {
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-variant-numeric: tabular-nums;
  color: var(--rl-muted);
}

.rl-paper-arrow {
  width: 0.75rem;
  height: 0.75rem;
  margin-left: auto;
  color: var(--rl-muted);
}

@keyframes rl-node-in {
  from {
    opacity: 0;
    scale: 0.96;
    translate: 0 4px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rl-node {
    animation-name: rl-node-fade;
    animation-duration: 200ms;
  }

  .rl-node:active,
  .rl-node.is-dragging {
    scale: 1;
  }
}

@keyframes rl-node-fade {
  from {
    opacity: 0;
  }
}
</style>
