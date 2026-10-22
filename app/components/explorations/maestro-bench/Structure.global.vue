<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'

// How a study is structured in MAESTRO-bench, drawn like the trace of a request: the study holds a
// batch, the batch holds experiments, an experiment is launched as executions. Bars are time. The
// batch runs two experiments at once and the others wait for a free slot, like a setting says.
// Running an experiment again adds an execution to it. Nothing is real here: the study is an
// example and every value is synthetic.
type Level = 'study' | 'batch' | 'experiment' | 'execution'

interface Execution {
  id: string
  // Start and end on the timeline, in time units
  start: number
  end: number
  // Just added by a click: it plays on its own, at once
  fresh: boolean
}

interface Experiment {
  id: string
  name: string
  model: 'mistral' | 'claude'
  prompt: string
  // When it leaves the queue of the batch
  start: number
  executions: Execution[]
}

interface Row {
  id: string
  level: Level
  depth: number
  name: string
  start: number
  end: number
  fresh?: boolean
  experiment?: Experiment
  // Position of an execution among those of its experiment
  index?: number
}

const LEVELS: Record<Level, { kind: string, icon: string, what: string }> = {
  study: {
    kind: 'Study',
    icon: 'lucide:notebook-pen',
    what: 'Groups what matters for one question: its batches, experiments and analyses, with an activity feed and signed notes. It has a status (active, concluded, archived), and deleting it deletes nothing inside.',
  },
  batch: {
    kind: 'Batch',
    icon: 'lucide:layout-grid',
    what: 'A series of variations, always. MB launches them together, and how many run in parallel is a setting. Here it is 2: the other experiments wait for a free slot. One that waits or runs can be cancelled alone.',
  },
  experiment: {
    kind: 'Experiment',
    icon: 'lucide:flask-conical',
    what: 'One configuration on the dataset: which rows (all, or a sample), and which agent, with its prompt and its model. Several agents can run one after the other. Each launch of it is an execution.',
  },
  execution: {
    kind: 'Execution',
    icon: 'lucide:camera',
    what: 'One launch of an experiment, kept as it was: the configuration used, the response of each row, the cost and the time. Editing the prompt later does not change it.',
  },
}

const MODELS = {
  mistral: { label: 'Mistral', icon: 'logos:mistral-ai-icon', full: 'mistral-large' },
  claude: { label: 'Claude', icon: 'logos:claude-icon', full: 'claude-sonnet' },
} as const

const execution = (id: string, start: number, end: number): Execution => ({ id, start, end, fresh: false })

const experiments = ref<Experiment[]>([
  { id: 'm2', name: 'Mistral · prompt v2', model: 'mistral', prompt: 'v2', start: 0, executions: [execution('m2-1', 0, 40)] },
  { id: 'c2', name: 'Claude · prompt v2', model: 'claude', prompt: 'v2', start: 0, executions: [execution('c2-1', 0, 55)] },
  { id: 'm3', name: 'Mistral · prompt v3', model: 'mistral', prompt: 'v3', start: 40, executions: [execution('m3-1', 40, 95)] },
  { id: 'c3', name: 'Claude · prompt v3', model: 'claude', prompt: 'v3', start: 55, executions: [execution('c3-1', 55, 100)] },
])

// The experiment whose executions are shown: one at a time, the others are folded
const open = ref('m2')

const MAX_EXECUTIONS = 3
const RERUN_LENGTH = 30
// Seconds of animation per time unit: slow enough to follow what waits and what runs
const UNIT = 0.06

const endOf = (experiment: Experiment) => experiment.executions.at(-1)!.end

// The timeline always fits its longest bar
const domain = computed(() => Math.max(100, ...experiments.value.map(endOf)))

// Rows in reading order, like the spans of a trace
const rows = computed<Row[]>(() => [
  { id: 'study', level: 'study', depth: 0, name: 'ASAG', start: 0, end: domain.value },
  { id: 'batch', level: 'batch', depth: 1, name: 'Prompt v2 vs v3', start: 0, end: domain.value },
  ...experiments.value.flatMap(experiment => [
    { id: experiment.id, level: 'experiment' as const, depth: 2, name: experiment.name, start: experiment.start, end: endOf(experiment), experiment },
    ...(open.value === experiment.id ? experiment.executions : []).map((run, index) => ({
      id: run.id,
      level: 'execution' as const,
      depth: 3,
      name: `Execution ${index + 1}`,
      start: run.start,
      end: run.end,
      fresh: run.fresh,
      experiment,
      index,
    })),
  ]),
])

// Each row draws its gutter: for every level above it, a line that goes on while the parent has
// siblings left, then an elbow (or a tee) into the row itself
type Guide = 'none' | 'pass' | 'tee' | 'elbow'

const guided = computed(() => {
  const list = rows.value
  const isLast = (at: number) => {
    const depth = list[at]!.depth
    for (let i = at + 1; i < list.length && list[i]!.depth >= depth; i++) {
      if (list[i]!.depth === depth)
        return false
    }
    return true
  }
  return list.map((row, index) => {
    const guides: Guide[] = []
    for (let depth = 1; depth <= row.depth; depth++) {
      // The row at this depth that is the ancestor of this one (or this one)
      let at = index
      while (list[at]!.depth > depth)
        at--
      const last = isLast(at)
      guides.push(depth === row.depth ? (last ? 'elbow' : 'tee') : (last ? 'none' : 'pass'))
    }
    return { row, guides }
  })
})

const selected = ref('study')
const current = computed(() => rows.value.find(row => row.id === selected.value) ?? rows.value[0]!)
const info = computed(() => LEVELS[current.value.level])

// The timeline plays when it comes into view, and again on demand. Once it has played, only what
// is added afterwards moves
const run = ref(0)
const settled = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function play() {
  clearTimeout(timer)
  for (const experiment of experiments.value) {
    for (const one of experiment.executions)
      one.fresh = false
  }
  settled.value = false
  run.value++
  timer = setTimeout(() => {
    settled.value = true
  }, domain.value * UNIT * 1000 + 300)
}

function toggle(experiment: Experiment) {
  open.value = open.value === experiment.id ? '' : experiment.id
  // A row that folds away takes the selection to its experiment
  if (open.value !== experiment.id && selected.value.startsWith(`${experiment.id}-`))
    selected.value = experiment.id
}

function runAgain(experiment: Experiment) {
  if (experiment.executions.length >= MAX_EXECUTIONS)
    return
  clearTimeout(timer)
  settled.value = true
  open.value = experiment.id
  const start = endOf(experiment)
  experiment.executions.push({ id: `${experiment.id}-${experiment.executions.length + 1}`, start, end: start + RERUN_LENGTH, fresh: true })
}

const trace = ref<HTMLElement>()
const { stop } = useIntersectionObserver(trace, ([entry]) => {
  if (entry?.isIntersecting) {
    play()
    stop()
  }
}, { threshold: 0.4 })

onBeforeUnmount(() => clearTimeout(timer))

const percent = (units: number) => `${(units / domain.value) * 100}%`
</script>

<template>
  <div class="structure my-8 flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3 text-[13px] text-neutral-500 dark:text-neutral-400">
      <span>Click a row to see what it holds</span>
      <button type="button" class="replay" @click="play">
        <Icon name="lucide:rotate-ccw" class="size-3.5" aria-hidden="true" />
        Replay
      </button>
    </div>

    <ul ref="trace" class="trace list-none m-0 p-0" :data-settled="settled" :style="{ '--span': `${domain * UNIT}s`, '--unit': `${UNIT}s` }">
      <li v-for="{ row, guides } in guided" :key="row.id" class="m-0 p-0">
        <div
          class="row"
          :data-level="row.level"
          :data-active="selected === row.id"
          @click="selected = row.id"
        >
          <span class="label">
            <span v-for="(guide, index) in guides" :key="index" class="guide" :data-guide="guide" aria-hidden="true" />
            <button type="button" class="pick" :aria-pressed="selected === row.id" @click.stop="selected = row.id">
              <span class="tile"><Icon :name="LEVELS[row.level].icon" class="size-3.5" aria-hidden="true" /></span>
              <span class="name">{{ row.name }}</span>
            </button>

            <!-- An experiment is run again from its own row, which adds an execution -->
            <span v-if="row.level === 'experiment'" class="actions">
              <button
                type="button"
                class="mini"
                :aria-expanded="open === row.experiment!.id"
                :aria-label="open === row.experiment!.id ? 'Fold the executions' : `Show the ${row.experiment!.executions.length} executions`"
                @click.stop="toggle(row.experiment!)"
              >
                <Icon name="lucide:chevron-right" class="chevron size-3.5" :data-open="open === row.experiment!.id" aria-hidden="true" />
                {{ row.experiment!.executions.length }}
              </button>
              <button
                type="button"
                class="mini"
                aria-label="Run again"
                :disabled="row.experiment!.executions.length >= MAX_EXECUTIONS"
                @click.stop="runAgain(row.experiment!)"
              >
                <Icon name="lucide:refresh-cw" class="size-3.5" aria-hidden="true" />
                <span class="hidden sm:inline">Run again</span>
              </button>
            </span>
          </span>

          <!-- The bar is replayed by changing the key: it waits dashed, then fills over its own time -->
          <span v-if="row.level !== 'study'" :key="run" class="lane" aria-hidden="true">
            <span v-if="row.level === 'experiment' && row.start > 0" class="wait" :style="{ 'width': percent(row.start), '--from': row.start }" />
            <span
              class="bar"
              :data-fresh="row.fresh"
              :style="{ 'left': percent(row.start), 'width': percent(row.end - row.start), '--from': row.fresh ? 0 : row.start, '--len': row.end - row.start }"
            />
          </span>
        </div>
      </li>

      <!-- The time cursor sweeps over the lanes -->
      <li :key="run" class="cursor" aria-hidden="true">
        <span class="line" />
      </li>
    </ul>

    <!-- A fixed height: every level fits, so choosing one never moves what is below -->
    <div :key="selected" class="detail" :data-level="current.level">
      <div class="flex items-center gap-2">
        <span class="kind"><Icon :name="info.icon" class="size-3.5" aria-hidden="true" />{{ info.kind }}</span>
        <span class="font-medium">{{ current.name }}</span>
      </div>
      <p class="m-0">
        {{ info.what }}
      </p>

      <div v-if="current.level === 'study'" class="flex flex-wrap gap-1.5">
        <span class="pill"><Icon name="lucide:layout-grid" class="size-3.5" aria-hidden="true" />Batches</span>
        <span class="pill"><Icon name="lucide:flask-conical" class="size-3.5" aria-hidden="true" />Experiments</span>
        <span class="pill"><Icon name="lucide:chart-no-axes-combined" class="size-3.5" aria-hidden="true" />Analyses</span>
        <span class="pill"><Icon name="lucide:message-square-text" class="size-3.5" aria-hidden="true" />Notes</span>
        <span class="pill"><Icon name="lucide:link" class="size-3.5" aria-hidden="true" />Public link</span>
      </div>

      <dl v-else-if="current.level === 'batch'" class="facts">
        <dt>Experiments</dt>
        <dd>4, from 2 models and 2 prompts</dd>
        <dt>In parallel</dt>
        <dd>2</dd>
      </dl>

      <template v-else-if="current.level === 'experiment'">
        <dl class="facts">
          <dt>Dataset</dt>
          <dd><code>responses.csv</code>, 200 rows</dd>
          <dt>Prompt</dt>
          <dd><code>{{ current.experiment!.prompt }}</code></dd>
          <dt>Model</dt>
          <dd class="flex items-center gap-1.5">
            <Icon :name="MODELS[current.experiment!.model].icon" class="size-3.5" aria-hidden="true" />{{ MODELS[current.experiment!.model].full }}
          </dd>
          <dt>Executions</dt>
          <dd>{{ current.experiment!.executions.length }}</dd>
        </dl>
      </template>

      <dl v-else class="facts">
        <dt>Prompt</dt>
        <dd><code>correcteur@{{ current.experiment!.prompt }}</code></dd>
        <dt>Model</dt>
        <dd class="flex items-center gap-1.5">
          <Icon :name="MODELS[current.experiment!.model].icon" class="size-3.5" aria-hidden="true" />{{ MODELS[current.experiment!.model].full }}
        </dd>
        <dt>Temperature</dt>
        <dd>0.2</dd>
        <dt>Row 12</dt>
        <dd><code>{"score": 3}</code></dd>
        <dt>Cost</dt>
        <dd>$0.003</dd>
        <dt>Time</dt>
        <dd>1.2 s</dd>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.structure {
  --line: 163 163 163 / 0.5;
}

.replay {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 7px;
  transition: background-color 180ms var(--ease-out);
}

.replay:active {
  transform: scale(0.97);
}

@media (hover: hover) and (pointer: fine) {
  .replay:hover {
    background: rgb(163 163 163 / 0.16);
  }
}

.trace {
  position: relative;
  border: 1px solid rgb(229 229 229);
  border-radius: 12px;
  background: white;
  overflow: hidden;
}

.dark .trace {
  border-color: rgb(64 64 64 / 0.8);
  background: rgb(38 38 38 / 0.4);
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  align-items: center;
  height: 40px;
  padding: 0 12px 0 8px;
  font-size: 14px;
  cursor: pointer;
}

.row[data-level='study'],
.detail[data-level='study'] {
  --tint: 115 115 115;
}

.row[data-level='batch'],
.detail[data-level='batch'] {
  --tint: 139 92 246;
}

.row[data-level='experiment'],
.detail[data-level='experiment'] {
  --tint: 59 130 246;
}

.row[data-level='execution'],
.detail[data-level='execution'] {
  --tint: 16 185 129;
}

.row[data-active='true'] {
  background: rgb(var(--tint) / 0.1);
}

.pick {
  display: flex;
  flex: 1;
  align-items: center;
  align-self: stretch;
  min-width: 0;
  text-align: left;
}

.pick:focus-visible,
.mini:focus-visible {
  outline: 2px solid rgb(var(--tint) / 0.7);
  outline-offset: 1px;
}

.actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
}

/* Small buttons on the row of an experiment */
.mini {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 6px;
  border: 1px solid rgb(163 163 163 / 0.4);
  border-radius: 6px;
  background: white;
  font-size: 12px;
  color: rgb(82 82 82);
}

.dark .mini {
  background: rgb(38 38 38);
  color: rgb(212 212 212);
}

.mini:active:not(:disabled) {
  transform: scale(0.96);
}

.mini:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (hover: hover) and (pointer: fine) {
  .mini:hover:not(:disabled) {
    border-color: rgb(var(--tint) / 0.6);
    color: rgb(var(--tint));
  }
}

.chevron[data-open='true'] {
  transform: rotate(90deg);
}

@media (hover: hover) and (pointer: fine) {
  .row:not([data-active='true']):hover {
    background: rgb(163 163 163 / 0.1);
  }
}

.label {
  display: flex;
  padding-right: 16px;
  align-items: center;
  min-width: 0;
  height: 100%;
}

/* One cell per level above the row: the lines that join a row to its parent and its siblings */
.guide {
  position: relative;
  flex-shrink: 0;
  align-self: stretch;
  width: 22px;
}

.guide[data-guide='pass']::before,
.guide[data-guide='tee']::before,
.guide[data-guide='elbow']::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  border-left: 1px solid rgb(var(--line));
}

.guide[data-guide='elbow']::before {
  bottom: 50%;
}

.guide[data-guide='tee']::after,
.guide[data-guide='elbow']::after {
  content: '';
  position: absolute;
  left: 10px;
  right: 2px;
  top: 50%;
  border-top: 1px solid rgb(var(--line));
}

.tile {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  margin-right: 8px;
  border-radius: 6px;
  background: rgb(var(--tint) / 0.16);
  color: rgb(var(--tint));
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row[data-level='study'] .name,
.row[data-level='batch'] .name {
  font-weight: 500;
}

.lane {
  position: relative;
  height: 14px;
}

/* Waiting for a free slot */
.wait {
  position: absolute;
  top: 50%;
  left: 0;
  height: 0;
  border-top: 1px dashed rgb(163 163 163);
  /* Grows with the cursor: it is the time spent waiting, up to the start of the bar */
  animation: reveal calc(var(--from) * var(--unit)) linear backwards;
}

.bar {
  position: absolute;
  top: 2px;
  bottom: 2px;
  border-radius: 4px;
  background: rgb(var(--tint) / 0.75);
  transform-origin: left;
  /* Starts when the cursor reaches it, and takes as long as its width */
  animation: fill calc(var(--len) * var(--unit)) linear calc(var(--from) * var(--unit)) backwards;
}

.row[data-level='batch'] .bar {
  background: rgb(var(--tint) / 0.6);
}

.trace[data-settled='true'] .bar:not([data-fresh='true']),
.trace[data-settled='true'] .wait {
  animation: none;
}

.trace[data-settled='true'] .cursor {
  display: none;
}

@keyframes fill {
  from {
    transform: scaleX(0);
  }
}

/* Both ends are insets: an inset cannot be animated to `none` */
@keyframes reveal {
  from {
    clip-path: inset(0 100% 0 0);
  }

  to {
    clip-path: inset(0 0 0 0);
  }
}

/* The cursor covers the lane column only: same split as the rows, minus their padding */
.cursor {
  position: absolute;
  /* A list item: the margin the prose gives it would shorten the line */
  margin: 0;
  top: 0;
  bottom: 0;
  left: calc(8px + (100% - 20px) * 1.25 / 2.25);
  right: 12px;
  pointer-events: none;
}

.line {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 1px;
  background: rgb(59 130 246 / 0.6);
  animation: sweep var(--span) linear forwards;
}

@keyframes sweep {
  to {
    left: 100%;
  }
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 23rem;
  padding: 2px;
  font-size: 15px;
}

@media (min-width: 640px) {
  .detail {
    min-height: 13rem;
  }
}

/* Tags: a tinted border and background, a darker text of the same hue */
.kind,
.pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px 3px 7px;
  border: 1px solid rgb(var(--tint) / 0.35);
  border-radius: 8px;
  background: rgb(var(--tint) / 0.1);
  box-shadow: 0 1px 1px rgb(var(--tint) / 0.12);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  color: color-mix(in srgb, rgb(var(--tint)) 65%, black);
}

.dark .kind,
.dark .pill {
  color: color-mix(in srgb, rgb(var(--tint)) 55%, white);
}

/* The tag of a level takes the tint of its row, the others stay neutral */
.pill {
  --tint: 115 115 115;
  font-size: 12px;
}

.facts {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 16px;
  margin: 0;
  font-size: 14px;
}

@media (min-width: 640px) {
  .facts {
    grid-template-columns: auto 1fr auto 1fr;
  }
}

.facts dt {
  color: rgb(115 115 115);
}

.dark .facts dt {
  color: rgb(163 163 163);
}

.facts dd {
  margin: 0;
}

.facts code {
  padding: 1px 5px;
  border-radius: 5px;
  background: rgb(163 163 163 / 0.16);
  font-size: 12.5px;
}

@media (prefers-reduced-motion: reduce) {
  .cursor {
    display: none;
  }

  .wait,
  .bar,
  .row,
  .replay {
    animation: none;
    transition: none;
  }
}
</style>
