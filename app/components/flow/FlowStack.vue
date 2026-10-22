<script setup lang="ts">
import type { FlowPlayer } from '~/composables/useFlowPlayer'
import type { FlowGraph, FlowNodeSpec, FlowStatus } from '~/utils/flow/types'
import { useResizeObserver } from '@vueuse/core'
import { stageGroups } from '~/utils/flow/graph'
import { edgeId, LOOP_EDGE } from '~/utils/flow/types'

// The workflow of a FlowCanvas on a phone: no pan or zoom, the stages one under the other, parallel
// steps side by side. A tap on a step unfolds its details right under it. A loop runs back up the
// left gutter, from its label (right after the step that closes the loop) into the step it restarts.
interface FlowStackProps {
  graph: FlowGraph
  player?: FlowPlayer
}

const props = defineProps<FlowStackProps>()

defineSlots<{
  footer?: (props: { node: FlowNodeSpec, status: FlowStatus }) => any
  inspector?: (props: { node: FlowNodeSpec, status: FlowStatus }) => any
}>()

const selected = defineModel<string | null>('selected', { default: null })

const { play } = useSound()

const statusOf = (id: string): FlowStatus => props.player?.status.value[id] ?? 'idle'
const byId = computed(() => new Map(props.graph.nodes.map(node => [node.id, node])))
const stages = computed(() => stageGroups(props.graph.nodes.map(node => node.id), props.graph.edges)
  .map(ids => ids.map(id => byId.value.get(id)!)))

// The connector under a stage carries a ball while any edge leaving that stage does
const hot = computed(() => {
  const flying = new Set(props.player?.packets.value.map(packet => packet.edge) ?? [])
  return stages.value.map(stage => props.graph.edges.some(edge => flying.has(edgeId(edge)) && stage.some(node => node.id === edge.from)))
})
const looping = computed(() => props.player?.packets.value.some(packet => packet.edge === LOOP_EDGE) ?? false)

// --- Loop: its label sits after the stage it leaves; its path is measured, as cards change height ---

const loopStage = computed(() => {
  const from = props.graph.loop?.from
  return from ? stages.value.findIndex(stage => stage.some(node => node.id === from)) : -1
})

const list = ref<HTMLElement>()
const chip = ref<HTMLElement>()
const nodeEls = new Map<string, HTMLElement>()
const loopSpan = ref<{ top: number, height: number } | null>(null)

function bindNode(id: string, el: unknown) {
  if (el instanceof HTMLElement)
    nodeEls.set(id, el)
  else
    nodeEls.delete(id)
}

// A function ref: inside the stages' v-for, a string ref would collect an array
function bindChip(el: unknown) {
  chip.value = el instanceof HTMLElement ? el : undefined
}

function measureLoop() {
  const target = props.graph.loop && nodeEls.get(props.graph.loop.to)
  if (!target || !chip.value) {
    loopSpan.value = null
    return
  }
  const origin = list.value!.getBoundingClientRect().top
  const from = target.getBoundingClientRect()
  const to = chip.value.getBoundingClientRect()
  const top = from.top - origin + from.height / 2
  loopSpan.value = { top, height: Math.max(0, to.top - origin + to.height / 2 - top) }
}

onMounted(() => nextTick(measureLoop))
useResizeObserver(list, measureLoop)

// The path in the gutter: out of the label, back up, and into the left side of the restarted step
const GUTTER = 18
const RADIUS = 10
const loopPath = computed(() => {
  const h = loopSpan.value?.height ?? 0
  return `M${GUTTER} ${h}H${RADIUS}Q0 ${h} 0 ${h - RADIUS}V${RADIUS}Q0 0 ${RADIUS} 0H${GUTTER - 1}`
})

// The gap between two stages; the one the loop leaves from is taller, to hold its label beside the line
const GAP = 44
const LOOP_GAP = 88

function toggle(id: string) {
  play(selected.value === id ? 'close' : 'select', { emphasis: 'subtle' })
  selected.value = selected.value === id ? null : id
}
</script>

<template>
  <ol ref="list" class="list-none relative m-0 flex flex-col p-0" :class="{ 'pl-6': graph.loop }">
    <svg
      v-if="graph.loop && loopSpan"
      class="loop pointer-events-none absolute overflow-visible"
      :class="{ looping }"
      :style="{ left: '6px', top: `${loopSpan.top}px` }"
      :width="GUTTER"
      :height="loopSpan.height"
      fill="none"
      stroke-width="1.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path :d="loopPath" class="loop-line" />
      <path :d="`M${GUTTER - 5} -4L${GUTTER - 1} 0L${GUTTER - 5} 4`" />
    </svg>
    <li v-for="(stage, index) in stages" :key="index" class="m-0 flex flex-col">
      <div class="grid gap-2" :class="stage.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'">
        <div v-for="node in stage" :key="node.id" class="flex flex-col pt-5">
          <!-- A div, not a button: the node holds block content -->
          <div
            :ref="el => bindNode(node.id, el)"
            role="button"
            tabindex="0"
            class="pressable cursor-pointer rounded-[14px] outline-none focus-visible:outline-2 focus-visible:outline-blue-500 focus-visible:outline-offset-2 focus-visible:outline-solid"
            :aria-expanded="selected === node.id"
            @click="toggle(node.id)"
            @keydown.enter.space.prevent="toggle(node.id)"
          >
            <FlowNode :node="node" :status="statusOf(node.id)" :selected="selected === node.id">
              <template v-if="$slots.footer" #footer>
                <slot name="footer" :node="node" :status="statusOf(node.id)" />
              </template>
            </FlowNode>
          </div>
          <div class="unfold grid" :class="{ open: selected === node.id }">
            <div class="overflow-hidden">
              <div class="flow-prose px-1 pt-3 text-[13px] text-neutral-600 leading-relaxed dark:text-neutral-300">
                <slot name="inspector" :node="node" :status="statusOf(node.id)">
                  <div v-if="node.detail" class="whitespace-pre-line text-xs font-mono">
                    {{ node.detail }}
                  </div>
                </slot>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Runs from this stage's card to the next one's: the -mb-5 takes back the next kicker's room -->
      <div
        v-if="index < stages.length - 1 || index === loopStage"
        class="stage-gap relative -mb-5"
        :class="{ hot: hot[index] }"
        :style="{ '--gap': `${index === loopStage ? LOOP_GAP : GAP}px` }"
      >
        <template v-if="index < stages.length - 1">
          <span class="line" aria-hidden="true" />
          <svg class="arrow" width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
            <path d="M1 1L4.5 4.5L8 1" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="ball" aria-hidden="true" />
        </template>
        <span
          v-if="graph.loop && index === loopStage"
          :ref="bindChip"
          class="chip flex items-center gap-1.5 border border-neutral-300 rounded-[11px] border-dashed bg-white px-2.5 py-1 text-[11px] text-neutral-600 font-medium transition-colors duration-300 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
          :class="{ 'text-neutral-900! dark:text-neutral-100!': looping }"
        >
          <Icon name="lucide:repeat-2" class="size-3 shrink-0" :class="{ spin: looping }" />
          <span class="min-w-0 leading-snug">{{ graph.loop.label }}</span>
        </span>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.flow-prose :deep(p) {
  font-size: inherit;
  line-height: inherit;
}

.unfold {
  grid-template-rows: 0fr;
  transition: grid-template-rows 260ms var(--ease-out);
}

.unfold.open {
  grid-template-rows: 1fr;
}

.stage-gap {
  --edge: rgb(212 212 212);
  height: var(--gap);
  color: var(--edge);
  transition: color 300ms var(--ease-out);
}

.dark .stage-gap {
  --edge: rgb(82 82 82);
}

/* A ball on its way: the edge it travels is drawn in ink, like on the canvas */
.stage-gap.hot {
  --edge: rgb(23 23 23);
}

.dark .stage-gap.hot {
  --edge: rgb(245 245 245);
}

.line {
  position: absolute;
  top: 0;
  bottom: 4px;
  left: 50%;
  width: 1.25px;
  margin-left: -0.625px;
  background: currentColor;
}

.arrow {
  position: absolute;
  bottom: 1px;
  left: 50%;
  margin-left: -4.5px;
  stroke: currentColor;
}

.ball {
  position: absolute;
  top: -3.5px;
  left: 50%;
  width: 7px;
  height: 7px;
  margin-left: -3.5px;
  border-radius: 9999px;
  background: currentColor;
  box-shadow: 0 0 0 3px rgb(23 23 23 / 0.1);
  opacity: 0;
}

.dark .ball {
  box-shadow: 0 0 0 3px rgb(245 245 245 / 0.12);
}

/* Card edge to card edge, slow at both ends, like a ball on the canvas */
.hot .ball {
  animation: travel 0.9s var(--ease-in-out) infinite;
}

@keyframes travel {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  15%,
  85% {
    opacity: 1;
  }
  100% {
    transform: translateY(calc(var(--gap) - 8px));
    opacity: 0;
  }
}

/* The loop's label sits beside the line, centred in the room the next kicker leaves free */
.chip {
  position: absolute;
  top: calc((100% - 20px) / 2);
  left: 0;
  /* Never across the line: a long label wraps instead */
  max-width: calc(50% - 14px);
  transform: translateY(-50%);
}

.loop {
  stroke: rgb(163 163 163);
  transition: stroke 300ms var(--ease-out);
}

.dark .loop {
  stroke: rgb(115 115 115);
}

.loop.looping {
  stroke: rgb(23 23 23);
}

.dark .loop.looping {
  stroke: rgb(245 245 245);
}

.loop-line {
  stroke-dasharray: 4 4;
}

.looping .loop-line {
  animation: loop-flow 0.8s linear infinite;
}

/* The dashes travel the way the loop goes: up, back to the start */
@keyframes loop-flow {
  to {
    stroke-dashoffset: -8;
  }
}

.spin {
  animation: spin 1.2s var(--ease-in-out) infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .unfold {
    transition: none;
  }

  .hot .ball,
  .looping .loop-line,
  .spin {
    animation: none;
  }
}
</style>
