<script setup lang="ts">
import type { FlowGraph } from '~/utils/flow/types'

// The loop of MAESTRO-bench: dataset, experiment, analysis, then the next iteration. Nothing is
// really run here: the demo loop plays the workflow and the iterations and scores below are
// synthetic. Each pass changes one element and lowers the RMSE, which the baseline sets at 1.31.
const graph: FlowGraph = {
  nodes: [
    { id: 'dataset', x: 0, y: 0, kicker: 'Step 1', title: 'Dataset', icon: 'lucide:table-2', detail: 'responses.csv' },
    { id: 'experiment', x: 300, y: 0, kicker: 'Step 2', title: 'Experiment', icon: 'lucide:flask-conical', detail: 'the agent on the rows', think: true },
    { id: 'analysis', x: 600, y: 0, kicker: 'Step 3', title: 'Analysis', icon: 'lucide:chart-no-axes-combined', detail: 'compared to a baseline', think: true },
  ],
  edges: [
    { from: 'dataset', to: 'experiment' },
    { from: 'experiment', to: 'analysis' },
  ],
  loop: { from: 'analysis', to: 'dataset', label: 'Change one thing, start again' },
}

interface Iteration {
  // The one element that changed since the previous pass
  change: string
  rows: number
  model: 'mistral' | 'claude'
  prompt: string
  rmse: number
}

const BASELINE = 1.31

const ITERATIONS: Iteration[] = [
  { change: 'First run', rows: 100, model: 'mistral', prompt: 'v1', rmse: 1.18 },
  { change: 'Prompt v2', rows: 100, model: 'mistral', prompt: 'v2', rmse: 1.09 },
  { change: 'More rows', rows: 200, model: 'mistral', prompt: 'v2', rmse: 1.07 },
  { change: 'Prompt v3', rows: 200, model: 'mistral', prompt: 'v3', rmse: 1.03 },
  { change: 'Another model', rows: 200, model: 'claude', prompt: 'v3', rmse: 0.97 },
]

const MODEL_ICONS = { mistral: 'logos:mistral-ai-icon', claude: 'logos:claude-icon' } as const

const player = useFlowPlayer()
const { row, completed } = useFlowDemo(graph, player, { rows: ITERATIONS.length, continuous: true })
const selected = ref<string | null>(null)

const current = computed(() => ITERATIONS[Math.min(row.value, ITERATIONS.length - 1)]!)

// The demo never stops: `completed` is a running total, the position in the cycle is what is shown
const cycle = computed(() => completed.value % ITERATIONS.length)

const seen = computed(() => ITERATIONS.slice(0, cycle.value))

const best = computed(() => (seen.value.length ? Math.min(...seen.value.map(it => it.rmse)) : null))

// An iteration is as long as the bar of its RMSE, on the scale of the baseline
const barWidth = (rmse: number) => `${Math.round((rmse / BASELINE) * 100)}%`
</script>

<template>
  <FlowCanvas v-model:selected="selected" :movable="false" :graph="graph" :player="player" label="MAESTRO-bench loop" :height="400">
    <template #footer="{ node, status }">
      <template v-if="node.id === 'dataset'">
        <span class="tabular-nums font-mono">{{ current.rows }} rows</span>
        <span class="tabular-nums ml-auto">pass {{ row + 1 }}/{{ ITERATIONS.length }}</span>
      </template>
      <template v-else-if="node.id === 'experiment'">
        <Icon :name="MODEL_ICONS[current.model]" class="size-3.5" />
        <span class="font-mono">{{ current.model }} · {{ current.prompt }}</span>
      </template>
      <template v-else-if="node.id === 'analysis'">
        <span class="font-mono">RMSE</span>
        <span class="tabular-nums ml-auto text-neutral-800 font-mono dark:text-neutral-200">{{ status === 'done' ? current.rmse.toFixed(2) : '...' }}</span>
      </template>
    </template>

    <template #inspector="{ node }">
      <div v-if="node.id === 'dataset'" class="flex flex-col gap-3">
        <p class="m-0">
          A table of rows, with a reference value to compare to. A pass can change it: more rows, another sample.
        </p>
      </div>

      <div v-else-if="node.id === 'experiment'" class="flex flex-col gap-3">
        <p class="m-0">
          The chosen rows go through the agent, one prompt and one model. Every launch is recorded: the configuration, each answer, the cost and the time.
        </p>
        <div class="flex items-center gap-2 text-xs">
          <Icon :name="MODEL_ICONS[current.model]" class="size-4" />
          {{ current.model }} · prompt {{ current.prompt }}
        </div>
      </div>

      <div v-else-if="node.id === 'analysis'" class="flex flex-col gap-3">
        <p class="m-0">
          The answers are compared to the baseline, and to the other experiments. Lower RMSE is better. Each pass changes one element, so the difference comes from that element.
        </p>
        <div class="tabular-nums grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5 text-xs">
          <span class="text-neutral-400">baseline</span>
          <span class="h-[6px] rounded-full bg-neutral-400/45" style="width: 100%" />
          <span class="font-mono">{{ BASELINE.toFixed(2) }}</span>
          <template v-for="(it, index) in seen" :key="index">
            <span class="truncate">{{ it.change }}</span>
            <span class="h-[6px] rounded-full bg-neutral-400/45 data-[best=true]:bg-blue-500" :data-best="it.rmse === best" :style="{ width: barWidth(it.rmse) }" />
            <span class="font-medium font-mono">{{ it.rmse.toFixed(2) }}</span>
          </template>
        </div>
      </div>
    </template>
  </FlowCanvas>
</template>
