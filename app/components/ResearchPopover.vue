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
  <Transition name="rl-pop">
    <div
      v-if="node && placement"
      class="rl-popover pointer-events-none absolute z-50 max-w-55 w-max border border-[rgb(var(--c)/0.3)] bg-[var(--rl-surface)] px-3 py-2.4 shadow-lg"
      :class="[`rl-${node.clusters[0] || 'hub'}`, `rl-pop-${placement.side}`, `rl-pop-${placement.align}`]"
      :style="placement.style"
      role="tooltip"
    >
      <p v-if="node.venue" class="rl-popover-venue uppercase m-0 text-[0.8rem] font-500 tracking-[0.08em]">
        {{ node.venue }}
      </p>
      <p class="m-0 mt-[0.15rem] text-[0.8rem] font-500">
        {{ node.label }}
      </p>
      <p v-if="node.description" class="m-0 mt-[0.3rem] text-[0.8rem] text-neutral-500 leading-[1.5] dark:text-neutral-400">
        {{ node.description }}
      </p>
      <p v-if="node.url" class="rl-popover-cta m-0 mt-[0.35rem] text-[0.68rem] font-500">
        Open paper ↗
      </p>
    </div>
  </Transition>
</template>

<style scoped>
.rl-popover-venue {
  color: rgb(var(--c));
}

.dark .rl-popover {
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
}

.rl-popover-cta {
  color: rgb(var(--c));
}

.rl-pop-right.rl-pop-middle { transform-origin: left center; }
.rl-pop-right.rl-pop-top { transform-origin: left top; }
.rl-pop-right.rl-pop-bottom { transform-origin: left bottom; }
.rl-pop-left.rl-pop-middle { transform-origin: right center; }
.rl-pop-left.rl-pop-top { transform-origin: right top; }
.rl-pop-left.rl-pop-bottom { transform-origin: right bottom; }

.rl-pop-enter-active,
.rl-pop-leave-active {
  transition: opacity var(--duration-micro) var(--ease-out), scale var(--duration-micro) var(--ease-out);
}

.rl-pop-leave-active {
  transition-duration: 100ms;
}

.rl-pop-enter-from,
.rl-pop-leave-to {
  opacity: 0;
  scale: 0.95;
}
</style>
