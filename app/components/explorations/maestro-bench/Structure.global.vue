<script setup lang="ts">
import { useIntersectionObserver, useRafFn } from '@vueuse/core'

// How a study is structured in MAESTRO-bench, drawn like the trace of a request: the study holds a
// batch, the batch holds experiments, an experiment is launched as executions. Bars are time. The
// batch runs two experiments at once and the others wait for a free slot, like a setting says.
// Running an experiment again adds an execution to it. The timeline is a clock of its own, so it
// can be paused and sped up. Nothing is real here: the study is an example and every value is synthetic.
type Level = 'study' | 'batch' | 'experiment' | 'execution'

interface Execution {
  id: string
  // Start and end on the timeline, in time units
  start: number
  end: number
  // Just added by a click: it plays on its own, from the time it was added
  born?: number
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
  born?: number
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

const execution = (id: string, start: number, end: number): Execution => ({ id, start, end })

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
// Seconds per time unit at normal speed: slow enough to follow what waits and what runs
const UNIT = 0.06
const SPEEDS = [1, 1.5, 2]

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
      born: run.born,
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

// The timeline is a clock, in time units: CSS animations can't be paused or sped up mid-flight.
// The cursor sweeps the study's own timeline once (up to `sweepEnd`), and an execution added by a click
// runs on from the time it was born, after the clock has run out the rest.
const { prefersReducedMotion } = usePrefersReducedMotion()
const time = ref(0)
const sweepEnd = ref(0)
const playing = ref(false)
const speed = ref(1)

// Where the clock stops: the end of the study, or of the execution added last
const horizon = computed(() => Math.max(domain.value, ...experiments.value.flatMap(experiment => experiment.executions.map(one => (one.born === undefined ? 0 : one.born + one.end - one.start)))))

const { pause: stopClock, resume: startClock } = useRafFn(({ delta }) => {
  time.value = Math.min(time.value + (Math.min(delta, 100) / 1000) * speed.value / UNIT, horizon.value)
  if (time.value >= horizon.value)
    playing.value = false
}, { immediate: false })

watch(playing, on => (on ? startClock() : stopClock()))

// How much of a bar is drawn: it fills over its own length, from its start (or from when it was born)
const progress = (start: number, end: number, born = start) => Math.min(1, Math.max(0, (time.value - born) / (end - start)))

// The timeline plays when it comes into view, and again on demand. Once it has played, only what
// is added afterwards moves
function play() {
  for (const experiment of experiments.value) {
    for (const one of experiment.executions)
      one.born = undefined
  }
  time.value = 0
  sweepEnd.value = domain.value
  // Under reduced motion it is drawn at once, with no clock
  if (prefersReducedMotion.value)
    time.value = horizon.value
  else
    playing.value = true
}

function togglePlay() {
  if (playing.value)
    playing.value = false
  else if (time.value >= horizon.value)
    play()
  else
    playing.value = true
}

function cycleSpeed() {
  speed.value = SPEEDS[(SPEEDS.indexOf(speed.value) + 1) % SPEEDS.length]!
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
  // What was running is drawn at once, and only the new execution moves
  time.value = Math.max(time.value, horizon.value)
  sweepEnd.value = 0
  open.value = experiment.id
  const start = endOf(experiment)
  const born = prefersReducedMotion.value ? time.value - RERUN_LENGTH : time.value
  experiment.executions.push({ id: `${experiment.id}-${experiment.executions.length + 1}`, start, end: start + RERUN_LENGTH, born })
  playing.value = !prefersReducedMotion.value
}

const trace = ref<HTMLElement>()
const { stop } = useIntersectionObserver(trace, ([entry]) => {
  if (entry?.isIntersecting) {
    play()
    stop()
  }
}, { threshold: 0.4 })

const percent = (units: number) => `${(units / domain.value) * 100}%`
</script>

<template>
  <div class="structure my-8 flex flex-col gap-4">
    <div class="flex items-center justify-between gap-3 text-[13px] text-neutral-500 dark:text-neutral-400">
      <span>Click a row to see what it holds</span>
      <div class="flex items-center gap-1">
        <PlayButton :playing="playing" variant="ghost" @click="togglePlay" />
        <TextButton size="md" aria-label="Speed" @click="cycleSpeed">
          <span class="tabular-nums w-[2.5ch] text-center">{{ speed }}×</span>
        </TextButton>
        <TextButton icon="lucide:rotate-ccw" size="sm" @click="play">
          Replay
        </TextButton>
      </div>
    </div>

    <ul ref="trace" class="trace list-none relative m-0 overflow-hidden border border-neutral-200 rounded-[12px] border-solid bg-white p-0 dark:border-neutral-700/80 dark:bg-neutral-800/40">
      <li v-for="{ row, guides } in guided" :key="row.id" class="m-0 p-0">
        <div
          class="row grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] h-[40px] cursor-pointer items-center pl-[8px] pr-[12px] text-[14px]"
          :class="selected === row.id ? 'bg-[rgb(var(--tint)/0.1)]' : 'hover:bg-neutral-400/10'"
          :data-level="row.level"
          :data-active="selected === row.id"
          @click="selected = row.id"
        >
          <span class="h-full min-w-0 flex items-center pr-[16px]">
            <span v-for="(guide, index) in guides" :key="index" class="guide relative w-[22px] shrink-0 self-stretch" :data-guide="guide" aria-hidden="true" />
            <button type="button" class="pick min-w-0 flex flex-1 items-center self-stretch text-left" :aria-pressed="selected === row.id" @click.stop="selected = row.id">
              <span class="grid mr-[8px] size-[22px] shrink-0 place-items-center rounded-[6px] bg-[rgb(var(--tint)/0.16)] text-[rgb(var(--tint))]"><Icon :name="LEVELS[row.level].icon" class="size-3.5" aria-hidden="true" /></span>
              <span class="truncate" :class="row.level === 'study' || row.level === 'batch' ? 'font-medium' : ''">{{ row.name }}</span>
            </button>

            <!-- An experiment is run again from its own row, which adds an execution -->
            <span v-if="row.level === 'experiment'" class="ml-[4px] flex shrink-0 items-center gap-[4px]">
              <button
                type="button"
                class="mini h-[24px] inline-flex items-center gap-[4px] border border-neutral-400/40 rounded-[6px] border-solid bg-white px-[6px] text-[12px] text-neutral-600 disabled:cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-300 disabled:opacity-40 enabled:active:scale-[0.96] enabled:hover:border-[rgb(var(--tint)/0.6)] enabled:hover:text-[rgb(var(--tint))]"
                :aria-expanded="open === row.experiment!.id"
                :aria-label="open === row.experiment!.id ? 'Fold the executions' : `Show the ${row.experiment!.executions.length} executions`"
                @click.stop="toggle(row.experiment!)"
              >
                <Icon name="lucide:chevron-right" class="chevron size-3.5" :data-open="open === row.experiment!.id" aria-hidden="true" />
                {{ row.experiment!.executions.length }}
              </button>
              <button
                type="button"
                class="mini h-[24px] inline-flex items-center gap-[4px] border border-neutral-400/40 rounded-[6px] border-solid bg-white px-[6px] text-[12px] text-neutral-600 disabled:cursor-not-allowed dark:bg-neutral-800 dark:text-neutral-300 disabled:opacity-40 enabled:active:scale-[0.96] enabled:hover:border-[rgb(var(--tint)/0.6)] enabled:hover:text-[rgb(var(--tint))]"
                aria-label="Run again"
                :disabled="row.experiment!.executions.length >= MAX_EXECUTIONS"
                @click.stop="runAgain(row.experiment!)"
              >
                <Icon name="lucide:refresh-cw" class="size-3.5" aria-hidden="true" />
                <span class="hidden sm:inline">Run again</span>
              </button>
            </span>
          </span>

          <!-- The bar waits dashed, then fills over its own time, as the clock reaches it -->
          <span v-if="row.level !== 'study'" class="relative h-[14px]" aria-hidden="true">
            <span v-if="row.level === 'experiment' && row.start > 0" class="wait absolute left-0 top-1/2 h-0 border-t border-neutral-400 border-dashed" :style="{ width: percent(row.start), clipPath: `inset(0 ${(1 - progress(0, row.start)) * 100}% 0 0)` }" />
            <span
              class="bar absolute inset-y-[2px] origin-left rounded-[4px]"
              :class="row.level === 'batch' ? 'bg-[rgb(var(--tint)/0.6)]' : 'bg-[rgb(var(--tint)/0.75)]'"
              :style="{ left: percent(row.start), width: percent(row.end - row.start), transform: `scaleX(${progress(row.start, row.end, row.born)})` }"
            />
          </span>
        </div>
      </li>

      <!-- The time cursor sweeps over the lanes -->
      <li v-if="time < sweepEnd" class="cursor" aria-hidden="true">
        <span class="line" :style="{ left: percent(time) }" />
      </li>
    </ul>

    <!-- A fixed height: every level fits, so choosing one never moves what is below -->
    <div :key="selected" class="detail min-h-[23rem] flex flex-col gap-[10px] p-[2px] text-[15px] sm:min-h-[13rem]" :data-level="current.level">
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

      <dl v-else-if="current.level === 'batch'" class="facts grid grid-cols-[auto_1fr] m-0 gap-x-[16px] gap-y-[6px] text-[14px] sm:grid-cols-[auto_1fr_auto_1fr]">
        <dt>Experiments</dt>
        <dd>4, from 2 models and 2 prompts</dd>
        <dt>In parallel</dt>
        <dd>2</dd>
      </dl>

      <template v-else-if="current.level === 'experiment'">
        <dl class="facts grid grid-cols-[auto_1fr] m-0 gap-x-[16px] gap-y-[6px] text-[14px] sm:grid-cols-[auto_1fr_auto_1fr]">
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

      <dl v-else class="facts grid grid-cols-[auto_1fr] m-0 gap-x-[16px] gap-y-[6px] text-[14px] sm:grid-cols-[auto_1fr_auto_1fr]">
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

.pick:focus-visible,
.mini:focus-visible {
  outline: 2px solid rgb(var(--tint) / 0.7);
  outline-offset: 1px;
}

/* Not `rotate-90`: UnoCSS and Tailwind both generate it, and the two turns add up to a half turn */
.chevron {
  transition: rotate 160ms var(--ease-out);
}

.chevron[data-open='true'] {
  rotate: 90deg;
}

@media (prefers-reduced-motion: reduce) {
  .chevron {
    transition: none;
  }
}

/* One cell per level above the row: the lines that join a row to its parent and its siblings */
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
}
</style>
