<script setup lang="ts">
import type { ResearchNode } from '~/research/research'
import { VIEW_H, VIEW_W } from '~/research/research'

const props = defineProps<{
  node: ResearchNode | null
  position: { x: number, y: number } | null
  /** Half-size of the hovered node, in view units, so the popover clears it instead of covering it. */
  size?: { hw: number, hh: number } | null
}>()

const GAP = '10px'

/**
 * Hovering from node to node closes one popover and opens the next a few ms later.
 * Once a popover has just been shown, the next one opens instantly: the reader has
 * already said they want the details, fading in each one again only makes them wait.
 */
const WARM_MS = 300
const instant = ref(false)
let closedAt = 0

watch(() => props.node, (node, previous) => {
  if (node && !previous)
    instant.value = performance.now() - closedAt < WARM_MS
  else if (!node && previous)
    closedAt = performance.now()
})

function pct(value: number, total: number) {
  return `${((value / total) * 100).toFixed(3)}%`
}

/**
 * The popover sits to the left or right of the node (whichever side has more room) so the node
 * stays visible. Vertically it is centred on the node, except near the top or bottom edge where
 * it is aligned with the node instead, to stay inside the frame.
 */
const placement = computed(() => {
  const pos = props.position
  if (!pos)
    return null

  const box = props.size ?? { hw: 0, hh: 0 }
  const side = pos.x > VIEW_W * 0.5 ? 'left' : 'right'
  const align = pos.y < VIEW_H * 0.3 ? 'top' : pos.y > VIEW_H * 0.7 ? 'bottom' : 'middle'

  const style: Record<string, string> = side === 'right'
    ? { left: `calc(${pct(pos.x + box.hw, VIEW_W)} + ${GAP})` }
    : { right: `calc(${pct(VIEW_W - pos.x + box.hw, VIEW_W)} + ${GAP})` }

  if (align === 'top') {
    style.top = pct(pos.y - box.hh, VIEW_H)
  }
  else if (align === 'bottom') {
    style.bottom = pct(VIEW_H - pos.y - box.hh, VIEW_H)
  }
  else {
    style.top = pct(pos.y, VIEW_H)
    style.translate = '0 -50%'
  }

  return { side, align, style }
})
</script>

<template>
  <Transition
    name="rl-pop"
    :enter-active-class="instant ? 'rl-pop-instant' : 'rl-pop-enter-active'"
    :enter-from-class="instant ? 'rl-pop-instant' : 'rl-pop-enter-from'"
  >
    <div
      v-if="node && placement"
      class="rl-popover pointer-events-none absolute z-50 max-w-60 w-max px-3.5 py-3"
      :class="[`rl-${node.clusters[0] || 'hub'}`, `rl-pop-${placement.side}`, `rl-pop-${placement.align}`]"
      :style="placement.style"
      role="tooltip"
    >
      <p v-if="node.venue" class="rl-popover-venue m-0 flex items-center gap-1.5 text-[0.62rem] font-500 tracking-[0.08em] uppercase">
        <span class="rl-popover-dot" />
        {{ node.venue }}
      </p>
      <p class="m-0 text-[0.84rem] font-600 leading-[1.35] tracking-[-0.005em]" :class="{ 'mt-1': node.venue }">
        {{ node.label }}
      </p>
      <p v-if="node.description" class="m-0 mt-1 text-[0.78rem] text-neutral-500 leading-[1.5] dark:text-neutral-400">
        {{ node.description }}
      </p>
      <p v-if="node.url" class="rl-popover-cta m-0 mt-2.5 pt-2 text-[0.7rem] font-500">
        Open paper ↗
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.rl-popover {
  background-color: var(--rl-surface);
  box-shadow: inset 0 0 0 1px var(--rl-hairline), var(--rl-shadow-pop);
}

.rl-popover-venue {
  color: var(--rl-muted);
  font-variant-numeric: tabular-nums;
}

.rl-popover-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background-color: rgb(var(--c));
}

.rl-popover-cta {
  color: rgb(var(--c));
  border-top: 1px solid var(--rl-hairline);
}

.rl-pop-right.rl-pop-middle { transform-origin: left center; }
.rl-pop-right.rl-pop-top { transform-origin: left top; }
.rl-pop-right.rl-pop-bottom { transform-origin: left bottom; }
.rl-pop-left.rl-pop-middle { transform-origin: right center; }
.rl-pop-left.rl-pop-top { transform-origin: right top; }
.rl-pop-left.rl-pop-bottom { transform-origin: right bottom; }

.rl-pop-enter-active {
  transition: opacity var(--duration-micro) var(--ease-out), scale var(--duration-micro) var(--ease-out);
}

/* Exit is faster than entry: the system is responding, not presenting */
.rl-pop-leave-active {
  transition: opacity 100ms var(--ease-out), scale 100ms var(--ease-out);
}

.rl-pop-enter-from,
.rl-pop-leave-to {
  opacity: 0;
  scale: 0.96;
}

@media (prefers-reduced-motion: reduce) {
  .rl-pop-enter-from,
  .rl-pop-leave-to {
    scale: 1;
  }
}
</style>
