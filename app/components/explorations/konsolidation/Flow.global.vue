<script setup lang="ts">
import type { FlowGraph } from '~/utils/flow/types'

// The grading workflow of Konsolidation. Nothing is really graded here: the demo loop plays the
// workflow and the responses, grades and skills below are mocked.
const graph: FlowGraph = {
  nodes: [
    { id: 'response', x: 0, y: 112, kicker: 'Learner', title: 'Response', icon: 'lucide:graduation-cap', detail: 'written by the learner' },
    { id: 'mcq', x: 280, y: 0, kicker: 'Step 1', title: 'MCQ scores', icon: 'lucide:list-checks', detail: 'automatic, no AI' },
    { id: 'ai', x: 280, y: 224, kicker: 'Step 1', title: 'AI', icon: 'lucide:bot', detail: 'grades the response', think: true },
    { id: 'binary', x: 560, y: 0, kicker: 'Grade', title: '{0, 1}', icon: 'lucide:circle-check', detail: 'right or wrong' },
    { id: 'score', x: 560, y: 150, kicker: 'Grade', title: '[0, 1]', icon: 'lucide:gauge', detail: 'partial credit' },
    { id: 'skills', x: 560, y: 300, kicker: 'Grade', title: 'Skills', icon: 'lucide:sprout', detail: 'mastery level per skill' },
    { id: 'teacher', x: 840, y: 224, kicker: 'Review', title: 'Teacher', icon: 'lucide:user-pen', detail: 'edits and validates', think: true },
    { id: 'view', x: 1120, y: 112, kicker: 'Output', title: 'Learner view', icon: 'lucide:eye', detail: 'sees what is validated' },
  ],
  edges: [
    { from: 'response', to: 'mcq' },
    { from: 'response', to: 'ai' },
    { from: 'mcq', to: 'binary' },
    { from: 'ai', to: 'score' },
    { from: 'ai', to: 'skills' },
    { from: 'binary', to: 'view' },
    { from: 'score', to: 'teacher' },
    { from: 'skills', to: 'teacher' },
    { from: 'teacher', to: 'view' },
  ],
  loop: { from: 'view', to: 'response', label: 'For each response' },
}

interface Row {
  id: string
  response: string
  mcq: 0 | 1
  score: number
  skills: string[]
}

const ROWS: Row[] = [
  { id: 'r01', response: 'Photosynthesis turns light into chemical energy…', mcq: 1, score: 0.9, skills: ['Energy conversion', 'Vocabulary'] },
  { id: 'r02', response: 'Plants eat sunlight to grow bigger and…', mcq: 0, score: 0.4, skills: ['Energy conversion'] },
  { id: 'r03', response: 'Chlorophyll absorbs mostly red and blue light…', mcq: 1, score: 1, skills: ['Light absorption', 'Vocabulary'] },
  { id: 'r04', response: 'It happens in the mitochondria of the leaf…', mcq: 0, score: 0.2, skills: ['Cell organelles'] },
  { id: 'r05', response: 'CO2 and water become glucose and oxygen…', mcq: 1, score: 0.75, skills: ['Reactants and products'] },
]

const player = useFlowPlayer()
const { row, completed } = useFlowDemo(graph, player, { rows: ROWS.length, continuous: true })
const selected = ref<string | null>(null)

const current = computed(() => ROWS[Math.min(row.value, ROWS.length - 1)]!)

// The demo never stops: `completed` is a running total, the marks show the position in the cycle
const cycle = computed(() => completed.value % ROWS.length)

const seen = computed(() => ROWS.slice(0, cycle.value))

function dotState(index: number) {
  if (index < cycle.value)
    return 'done'
  return index === row.value && Object.values(player.status.value).includes('running') ? 'running' : 'pending'
}
</script>

<template>
  <FlowCanvas v-model:selected="selected" :movable="false" :graph="graph" :player="player" label="Konsolidation grading workflow" :height="480">
    <template #footer="{ node }">
      <template v-if="node.id === 'response'">
        <span class="flex items-center gap-1.5">
          <span
            v-for="(_, index) in ROWS"
            :key="index"
            class="size-2 border rounded-full border-solid transition-[background-color,border-color,transform] duration-300 ease-[var(--ease-out)]"
            :class="dotState(index) === 'running'
              ? 'scale-125 border-blue-500 bg-blue-400'
              : dotState(index) === 'done'
                ? 'border-neutral-900 bg-neutral-900 dark:border-neutral-100 dark:bg-neutral-100'
                : 'border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800'"
            :data-state="dotState(index)"
          />
        </span>
        <span class="tabular-nums ml-auto">{{ completed }} {{ completed === 1 ? 'response' : 'responses' }}</span>
      </template>
      <template v-else-if="node.id === 'mcq'">
        <span class="font-mono">auto</span>
      </template>
      <template v-else-if="node.id === 'ai'">
        <Icon name="logos:mistral-ai-icon" class="size-3.5" />
        <span class="font-mono">provisional</span>
      </template>
      <template v-else-if="node.id === 'binary'">
        <span class="text-neutral-800 font-mono dark:text-neutral-200">{{ current.mcq }}</span>
        <Icon name="lucide:lock" class="ml-auto size-3.5" />
      </template>
      <template v-else-if="node.id === 'score' || node.id === 'skills'">
        <span class="font-mono">editable</span>
        <Icon name="lucide:pencil" class="ml-auto size-3.5" />
      </template>
    </template>

    <template #inspector="{ node }">
      <div v-if="node.id === 'response'" class="flex flex-col gap-1.5">
        <p class="m-0 mb-1">
          Learners answer exercises. Each response goes through the workflow, one at a time.
        </p>
        <div
          v-for="(r, index) in ROWS"
          :key="r.id"
          class="flex items-baseline gap-2 rounded-md px-2 py-1.5 transition-[background-color] duration-200 ease-[var(--ease-out)] data-[state=running]:bg-blue-500/8 data-[state=done]:opacity-55"
          :data-state="dotState(index)"
        >
          <span class="text-[11px] text-neutral-400 font-mono">{{ r.id }}</span>
          <span class="truncate text-xs">{{ r.response }}</span>
        </div>
      </div>

      <div v-else-if="node.id === 'mcq'" class="flex flex-col gap-3">
        <p class="m-0">
          Multiple choice questions are scored by rule: a response is right or wrong. No AI is involved, so this grade can be trusted as it is.
        </p>
      </div>

      <div v-else-if="node.id === 'ai'" class="flex flex-col gap-3">
        <p class="m-0">
          An LLM reads the response and returns a score in [0, 1], plus a mastery level for each skill linked to the question. Both are provisional until a teacher looks at them.
        </p>
        <div class="flex items-center gap-2 text-xs">
          <Icon name="logos:mistral-ai-icon" class="size-4" />
          Mistral · prompt v1
        </div>
      </div>

      <div v-else-if="node.id === 'binary'" class="flex flex-col gap-3">
        <p class="m-0">
          The grade of the MCQ scores. It is computed by rule, so the learner gets it right away.
        </p>
      </div>

      <div v-else-if="node.id === 'view'" class="flex flex-col gap-3">
        <p class="m-0">
          The learner sees the {0, 1} grade from the MCQ scores. Once the teacher has validated or edited the AI evaluation, the score and the skills appear too.
        </p>
      </div>

      <div v-else-if="node.id === 'score' || node.id === 'skills' || node.id === 'teacher'" class="flex flex-col gap-3">
        <p class="m-0">
          The teacher reads the [0, 1] score and the skill levels proposed by the AI. They validate or edit them, and the learner gets access to the result.
        </p>
        <div class="tabular-nums grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-1 text-xs">
          <span class="text-neutral-400">id</span>
          <span class="text-neutral-400">score</span>
          <span class="text-neutral-400">skills</span>
          <template v-for="r in seen" :key="r.id">
            <span class="font-mono">{{ r.id }}</span>
            <span class="font-medium">{{ r.score }}</span>
            <span class="truncate">{{ r.skills.join(', ') }}</span>
          </template>
        </div>
      </div>
    </template>
  </FlowCanvas>
</template>
