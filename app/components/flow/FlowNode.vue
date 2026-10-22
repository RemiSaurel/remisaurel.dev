<script setup lang="ts">
import type { VNode } from 'vue'
import type { FlowNodeSpec, FlowStatus } from '~/utils/flow/types'
import { Comment, Fragment } from 'vue'

// One step of a workflow: a kicker above, an icon tile and a title, an inset monospace panel, and an
// optional footer strip running edge to edge (progress, the model behind an agent, a formula).
interface FlowNodeProps {
  node: FlowNodeSpec
  status?: FlowStatus
  selected?: boolean
}

const props = withDefaults(defineProps<FlowNodeProps>(), { status: 'idle', selected: false })

const slots = useSlots()

// The canvas passes one footer slot for every node: a node it renders nothing for gets no strip
function rendersSomething(vnodes: VNode[]): boolean {
  return vnodes.some(vnode => vnode.type !== Comment
    && (vnode.type !== Fragment || rendersSomething((vnode.children ?? []) as VNode[])))
}

const hasFooter = () => rendersSomething(slots.footer?.({}) ?? [])

const thinking = computed(() => props.status === 'running' && props.node.think)
</script>

<template>
  <div class="flow-node relative" :data-status="status" :data-selected="selected || undefined">
    <div
      v-if="node.kicker"
      class="absolute bottom-full left-1.5 mb-[7px] whitespace-nowrap text-[11px] font-medium leading-none transition-colors duration-300"
      :class="status === 'running' ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
    >
      {{ node.kicker }}
    </div>
    <span
      class="think absolute bottom-full right-2 mb-[9px] flex items-center gap-[3px] text-neutral-900 transition-opacity duration-200 dark:text-neutral-100"
      :class="thinking ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
    ><i /><i /><i /></span>

    <div class="card border rounded-[14px] bg-white p-1 dark:bg-neutral-800/90">
      <div class="flex items-center gap-2.5 px-1.5 pb-2 pt-1.5">
        <span
          class="grid size-7 shrink-0 place-items-center border rounded-lg"
          :class="node.strong
            ? 'border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900'
            : 'border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400'"
        >
          <Icon :name="node.icon" class="size-[15px]" />
        </span>
        <span class="min-w-0 flex-1 truncate text-[13.5px] text-neutral-900 font-medium leading-tight dark:text-neutral-100">
          {{ node.title }}
        </span>
        <!-- A finished step ticks itself off -->
        <span class="check grid size-4 shrink-0 place-items-center rounded-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900" aria-hidden="true">
          <Icon name="lucide:check" class="size-2.5" />
        </span>
      </div>
      <div
        v-if="node.detail"
        class="whitespace-pre-line border border-neutral-200/70 rounded-[9px] bg-neutral-50 px-2.5 py-2 text-[11px] text-neutral-500 leading-snug font-mono dark:border-neutral-700/70 dark:bg-neutral-900/60 dark:text-neutral-400"
      >
        {{ node.detail }}
      </div>
      <div
        v-if="hasFooter()"
        class="mt-1 h-[30px] flex items-center gap-2 border-t border-neutral-200/70 rounded-b-[13px] bg-neutral-100 px-3 text-[11px] text-neutral-500 -mx-1 -mb-1 dark:border-neutral-700/70 dark:bg-neutral-900/80 dark:text-neutral-400"
      >
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  border-color: rgb(229 229 229);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
  transition:
    border-color 300ms var(--ease-out),
    box-shadow 300ms var(--ease-out);
}

.dark .card {
  border-color: rgb(64 64 64);
  box-shadow: none;
}

.flow-node[data-status='running'] .card {
  border-color: rgb(23 23 23);
  box-shadow: 0 0 0 3px rgb(23 23 23 / 0.08);
}

.dark .flow-node[data-status='running'] .card {
  border-color: rgb(245 245 245);
  box-shadow: 0 0 0 3px rgb(245 245 245 / 0.1);
}

.flow-node[data-status='error'] .card {
  border-color: rgb(220 38 38);
}

/* Selection is an outline, so it stays readable over a running node's ring */
.flow-node[data-selected] .card {
  outline: 2px solid rgb(23 23 23);
  outline-offset: 3px;
}

.dark .flow-node[data-selected] .card {
  outline-color: rgb(245 245 245);
}

.check {
  opacity: 0;
  transform: scale(0.5);
  transition:
    opacity 160ms var(--ease-out),
    transform 160ms var(--ease-out);
}

.flow-node[data-status='done'] .check {
  opacity: 1;
  transform: scale(1);
  transition-duration: 260ms;
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

.think i {
  width: 4px;
  height: 4px;
  border-radius: 9999px;
  background: currentColor;
  animation: think 0.9s ease-in-out infinite;
}

.think i:nth-child(2) {
  animation-delay: 0.15s;
}

.think i:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes think {
  0%,
  70%,
  100% {
    opacity: 0.25;
    transform: translateY(0);
  }
  35% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .think i {
    animation: none;
    opacity: 0.6;
  }

  .check {
    transition: opacity 160ms linear;
    transform: none !important;
  }
}
</style>
