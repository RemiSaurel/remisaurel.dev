<script setup lang="ts">
import type { FlowGraph } from '~/utils/flow/types'

// A workflow of several agents: two judges read the same answer, one for the content and one for the
// language, and an aggregator combines their grades. Nothing is really run here: the demo loop plays
// the flow once per row, and the answers, grades and scores below are synthetic.
const graph: FlowGraph = {
  nodes: [
    { id: 'dataset', x: 0, y: 95, kicker: 'Data', title: 'Dataset', icon: 'lucide:table-2', detail: 'responses.csv' },
    { id: 'content', x: 270, y: 0, kicker: 'Step 1', title: 'Content agent', icon: 'lucide:book-open-check', detail: 'grades the content', think: true },
    { id: 'language', x: 270, y: 190, kicker: 'Step 1', title: 'Language agent', icon: 'lucide:languages', detail: 'grades the language', think: true },
    { id: 'aggregator', x: 540, y: 95, kicker: 'Step 2', title: 'Aggregator', icon: 'lucide:git-merge', detail: 'combines the two grades' },
    { id: 'results', x: 810, y: 95, kicker: 'Output', title: 'Results', icon: 'lucide:braces', detail: 'results.json' },
  ],
  edges: [
    { from: 'dataset', to: 'content' },
    { from: 'dataset', to: 'language' },
    { from: 'content', to: 'aggregator' },
    { from: 'language', to: 'aggregator' },
    { from: 'aggregator', to: 'results' },
  ],
  loop: { from: 'aggregator', to: 'dataset', label: 'For each row of the dataset' },
}

interface Row {
  answer: string
  /** Grade of the content agent, and of the language agent, out of 5 */
  c: number
  l: number
  /** The reference grade of the dataset */
  ref: number
}

const ROWS: Row[] = [
  { answer: 'Photosynthesis turns light into sugar, and releases oxygen.', c: 4, l: 3, ref: 4 },
  { answer: 'its when the plant eat the sun and make air', c: 2, l: 4, ref: 2 },
  { answer: 'Chlorophyll absorbs light; the energy builds glucose from CO2 and water.', c: 5, l: 4, ref: 5 },
  { answer: 'Plants breathe in oxygen at night, that is photosynthesis.', c: 1, l: 3, ref: 1 },
  { answer: 'The process happens in the chloroplasts and needs light, water and carbon dioxide.', c: 3, l: 5, ref: 3 },
]

interface Formula {
  id: string
  label: string
  text: string
  run: (c: number, l: number) => number
}

const FORMULAS: Formula[] = [
  { id: 'mean', label: 'Mean', text: 'score = mean(l, c)', run: (c, l) => (c + l) / 2 },
  { id: 'weighted', label: 'Weighted', text: 'score = 0.7 * c + 0.3 * l', run: (c, l) => 0.7 * c + 0.3 * l },
  { id: 'min', label: 'Minimum', text: 'score = min(l, c)', run: (c, l) => Math.min(c, l) },
]

const MODEL_ICONS = { claude: 'logos:claude-icon', mistral: 'logos:mistral-ai-icon' } as const

const player = useFlowPlayer()
const { row, completed } = useFlowDemo(graph, player, { rows: ROWS.length, edgeSeconds: 0.8, restSeconds: 2 })
const selected = ref<string | null>(null)
const formulaId = ref('mean')

const formulaIndex = computed(() => FORMULAS.findIndex(f => f.id === formulaId.value))
const formula = computed(() => FORMULAS.find(f => f.id === formulaId.value)!)
const current = computed(() => ROWS[Math.min(row.value, ROWS.length - 1)]!)
const scoreOf = (r: Row) => formula.value.run(r.c, r.l)

// Rows through the whole flow so far in this pass: the table only shows what has been graded
const graded = computed(() => ROWS.slice(0, completed.value))

// RMSE of the aggregated score against the reference, per formula, over the five rows
const rmse = (f: Formula) => Math.sqrt(ROWS.reduce((sum, r) => sum + (f.run(r.c, r.l) - r.ref) ** 2, 0) / ROWS.length)
const RMSES = Object.fromEntries(FORMULAS.map(f => [f.id, rmse(f)])) as Record<string, number>
const bestId = FORMULAS.reduce((best, f) => (RMSES[f.id]! < RMSES[best.id]! ? f : best)).id
const MAX_RMSE = Math.max(...Object.values(RMSES))
</script>

<template>
  <FlowCanvas v-model:selected="selected" :movable="false" :graph="graph" :player="player" label="MAESTRO-bench multi-agent workflow" :height="440">
    <template #footer="{ node, status }">
      <template v-if="node.id === 'dataset'">
        <span class="tabular-nums font-mono">row {{ row + 1 }}/{{ ROWS.length }}</span>
        <span class="ml-auto flex items-center gap-1" aria-hidden="true">
          <span
            v-for="(_, index) in ROWS"
            :key="index"
            class="size-[6px] rounded-full bg-neutral-400/45 data-[state=done]:bg-blue-500 data-[state=running]:bg-blue-500/60"
            :data-state="index < completed ? 'done' : index === row && status !== 'idle' ? 'running' : 'pending'"
          />
        </span>
      </template>
      <template v-else-if="node.id === 'content'">
        <Icon :name="MODEL_ICONS.claude" class="size-3.5" />
        <span class="font-mono">claude · v1</span>
        <span class="tabular-nums ml-auto text-neutral-800 font-mono dark:text-neutral-200">{{ status === 'done' ? `${current.c}/5` : '...' }}</span>
      </template>
      <template v-else-if="node.id === 'language'">
        <Icon :name="MODEL_ICONS.mistral" class="size-3.5" />
        <span class="font-mono">mistral · v1</span>
        <span class="tabular-nums ml-auto text-neutral-800 font-mono dark:text-neutral-200">{{ status === 'done' ? `${current.l}/5` : '...' }}</span>
      </template>
      <template v-else-if="node.id === 'aggregator'">
        <span class="truncate font-mono">{{ formula.text }}</span>
        <span class="tabular-nums ml-auto text-neutral-800 font-mono dark:text-neutral-200">{{ status === 'done' ? scoreOf(current).toFixed(1) : '...' }}</span>
      </template>
      <template v-else-if="node.id === 'results'">
        <span class="tabular-nums font-mono">{{ completed }}/{{ ROWS.length }} rows</span>
      </template>
    </template>

    <template #inspector="{ node }">
      <div v-if="node.id === 'dataset'" class="flex flex-col gap-3">
        <p class="m-0">
          Each row goes through the whole workflow, one after the other. This one is the row being processed.
        </p>
        <p class="m-0 rounded-[8px] bg-neutral-400/12 px-[10px] py-[8px] text-[12px] leading-[1.5]">
          “{{ current.answer }}”
        </p>
        <p class="m-0 text-xs text-neutral-400">
          Reference grade: <span class="text-neutral-800 font-mono dark:text-neutral-200">{{ current.ref }}/5</span>
        </p>
      </div>

      <div v-else-if="node.id === 'content' || node.id === 'language'" class="flex flex-col gap-3">
        <p class="m-0">
          {{ node.id === 'content'
            ? 'Reads the answer for what it says: is the idea right and complete? It has its own prompt and its own model.'
            : 'Reads the same answer for how it is written: grammar, vocabulary, clarity. A different prompt, and here a different model.' }}
        </p>
        <p class="m-0 text-xs">
          Both agents work on the same row at the same time. The aggregator waits for the two.
        </p>
      </div>

      <div v-else-if="node.id === 'aggregator'" class="flex flex-col gap-3">
        <p class="m-0">
          A formula turns the grades of the agents into one score. Pick one: the table shows what each row would get.
        </p>
        <div class="relative flex rounded-[9px] bg-neutral-400/15 p-[3px]" role="radiogroup" aria-label="Aggregation formula">
          <span class="absolute inset-y-[3px] left-[3px] w-[calc((100%-6px)/3)] rounded-[6px] bg-white shadow-[0_1px_2px_rgb(0_0_0/0.12)] transition-transform duration-[250ms] ease-[var(--ease-out)] dark:bg-neutral-700 [@media(prefers-reduced-motion:reduce)]:transition-none" aria-hidden="true" :style="{ transform: `translateX(${formulaIndex * 100}%)` }" />
          <button
            v-for="f in FORMULAS"
            :key="f.id"
            type="button"
            role="radio"
            :aria-checked="f.id === formulaId"
            class="relative flex-1 rounded-[6px] px-[8px] py-[4px] text-[12px] text-neutral-500 font-medium transition-colors duration-200 ease-[var(--ease-out)] aria-[checked=true]:text-neutral-900 dark:text-neutral-400 [@media(prefers-reduced-motion:reduce)]:transition-none dark:aria-[checked=true]:text-neutral-100"
            @click="formulaId = f.id"
          >
            {{ f.label }}
          </button>
        </div>
        <div class="tabular-nums grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-3 gap-y-1 text-xs">
          <span class="text-neutral-400">row</span>
          <span class="text-neutral-400">c</span>
          <span class="text-neutral-400">l</span>
          <span class="text-neutral-400">score</span>
          <span class="text-neutral-400">ref</span>
          <template v-for="(r, index) in ROWS" :key="index">
            <span class="font-mono">{{ index + 1 }}</span>
            <span class="font-mono">{{ r.c }}</span>
            <span class="font-mono">{{ r.l }}</span>
            <span class="font-medium font-mono">{{ scoreOf(r).toFixed(1) }}</span>
            <span class="text-neutral-400 font-mono">{{ r.ref }}</span>
          </template>
        </div>
        <div class="tabular-nums grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-1.5 text-xs">
          <template v-for="f in FORMULAS" :key="f.id">
            <span>{{ f.label }}</span>
            <span class="h-[6px] rounded-full bg-neutral-400/45 data-[best=true]:bg-blue-500" :data-best="f.id === bestId" :style="{ width: `${Math.round((RMSES[f.id]! / MAX_RMSE) * 100)}%` }" />
            <span class="font-medium font-mono">{{ RMSES[f.id]!.toFixed(2) }}</span>
          </template>
        </div>
        <p class="m-0 text-xs text-neutral-400">
          RMSE against the reference grade, on these five rows. Lower is better.
        </p>
      </div>

      <div v-else-if="node.id === 'results'" class="flex flex-col gap-3">
        <p class="m-0">
          Every row keeps the grade of each agent and the final score, so the analysis can compare agents, formulas and baselines later.
        </p>
        <p v-if="graded.length" class="m-0 text-xs font-mono">
          {{ graded.length }} of {{ ROWS.length }} rows recorded
        </p>
      </div>
    </template>
  </FlowCanvas>
</template>
