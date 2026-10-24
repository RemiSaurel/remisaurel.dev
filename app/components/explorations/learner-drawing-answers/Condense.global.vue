<script setup lang="ts">
import type { LogLine } from '~/utils/logLine'
import type { Step } from '~/utils/session'
import { CELL_PARTS } from '~/exercises/cell'
import { buildSession } from '~/utils/demoSession'
import { KIND_COLORS, kindOf, logLine } from '~/utils/logLine'
import { activeSpans, condense, within } from '~/utils/session'
import { mmss, summarize } from '~/utils/trace'

// The same acts, as a timeline and as lines of the log. The gap decides which acts are one movement of
// the learner: move it and see the lines merge or split. The session is written by hand, and the lines are
// the ones the real log draws.
// A circle of three strokes, a nucleus of two, its label, two strokes for a mitochondrion and two undos, a second
// label and its rename, one more stroke and a check: fourteen acts, few enough to read all the lines at once.
// The circle ends 2.1 s before the nucleus begins, so a gap of 2 s keeps them apart. Only acts of the same kind
// merge, so even a gap of 4 s leaves eight lines: the same stroke, label or undo never gathers across another act
const events = buildSession([
  { at: 3, stroke: 1.2 },
  { at: 4.6, stroke: 0.9 },
  { at: 5.9, stroke: 1.1 },
  { at: 9.5, stroke: 1.5 },
  { at: 11, stroke: 1.2 },
  { at: 14, label: 'nucleus' },
  { at: 16.5, stroke: 1 },
  { at: 18, stroke: 0.8 },
  { at: 19.5, undo: true },
  { at: 20.3, undo: true },
  { at: 22, label: 'cyto' },
  { at: 24, rename: ['cyto', 'cytoplasm'] },
  { at: 26, stroke: 1 },
  { at: 28, check: true },
], CELL_PARTS)

const summary = summarize(events)
const spans = activeSpans(events)
const end = events.at(-1)!.t

const at = (t: number) => t / end * 100

// Seconds, since that is how the learner's pauses are told
const gap = ref(2)

const steps = computed(() => condense(events, gap.value * 1000))

const lineOf = (step: Step) => logLine(events, step, summary, CELL_PARTS)

const lines = computed(() => steps.value.map(step => ({
  step,
  // The span of the timeline the line stands for
  from: at(spans[step.first]![0]),
  to: at(spans[step.last]![1]),
})))

// A line that gathers several acts can be unfolded into them, like a branch of the timeline
interface Row {
  key: string
  step: Step
  line: LogLine
  /** One of the acts of an unfolded line */
  child: boolean
  /** A line that gathers several acts, and can be unfolded */
  group: boolean
  open: boolean
}

const unfolded = reactive(new Set<number>())

// The chevron column exists only when some line can be unfolded: without one it would be an empty gutter
const foldable = computed(() => steps.value.some(step => step.last > step.first))

const rows = computed(() => steps.value.flatMap((step): Row[] => {
  const group = step.last > step.first
  const open = group && unfolded.has(step.first)
  const head: Row = { key: `${step.first}:${step.last}`, step, line: lineOf(step), child: false, group, open }
  if (!open)
    return [head]
  return [head, ...within(events, step).map((act): Row => ({ key: `${step.first}.${act.first}`, step: act, line: lineOf(act), child: true, group: false, open: false }))]
}))

// The acts of the line the pointer is on, or of the one clicked to stay
interface Range { first: number, last: number }

const hovered = ref<Range | null>(null)
const picked = ref<Range | null>(null)
const lit = computed(() => hovered.value ?? picked.value)

const same = (a: Range, b: Range | null) => a.first === b?.first && a.last === b.last
const hover = (step: Range | null) => hovered.value = step && { first: step.first, last: step.last }
const pick = (step: Range) => picked.value = same(step, picked.value) ? null : { first: step.first, last: step.last }
const stateOf = (step: Range) => same(step, lit.value) ? 'current' : 'past'

function toggle(step: Step) {
  // What was pointed at inside the line goes away with it
  hovered.value = null
  if (!unfolded.delete(step.first))
    unfolded.add(step.first)
  else if (picked.value && !same(picked.value, step))
    picked.value = null
}

// A line that no longer exists after the gap moved is not picked any more, nor unfolded
watch(steps, (next) => {
  for (const first of unfolded) {
    if (!next.some(step => step.first === first && step.last > step.first))
      unfolded.delete(first)
  }
  const range = picked.value
  if (range && !next.some(step => same(step, range) || (range.first === range.last && step.first <= range.first && range.first <= step.last && unfolded.has(step.first))))
    picked.value = null
})

const ticks = events.map((event, index) => ({
  key: index,
  color: KIND_COLORS[kindOf(event.type)],
  left: at(spans[index]![0]),
  width: at(spans[index]![1]) - at(spans[index]![0]),
}))

// A tick fades unless the line lit is made of it
const dimmed = (index: number) => lit.value !== null && (index < lit.value.first || index > lit.value.last)
</script>

<template>
  <figure class="my-8 flex flex-col gap-3">
    <div class="min-w-0 flex flex-col gap-2.5 border border-neutral-200 rounded-xl px-3 py-2.5 dark:border-neutral-700/80 dark:bg-neutral-800/40">
      <p class="m-0 flex items-baseline justify-between gap-2 text-[13px] font-medium">
        <span>The acts, on time</span>
        <span class="tabular-nums text-neutral-500 font-normal dark:text-neutral-400">{{ events.length }} acts in {{ mmss(end) }}</span>
      </p>

      <div class="relative mx-1 h-10" aria-hidden="true">
        <TransitionGroup name="bracket" tag="div" class="absolute inset-0">
          <span
            v-for="item in lines"
            :key="item.step.first"
            class="bracket absolute bottom-1.5 top-1.5 box-content border-[1.5px] border-transparent rounded-md px-[5px] -mx-[5px] data-[group=true]:border-neutral-400/55 data-[on=true]:border-neutral-900 data-[on=true]:bg-neutral-400/18 dark:data-[on=true]:border-neutral-100"
            :data-on="lit !== null && lit.first <= item.step.last && lit.last >= item.step.first"
            :data-group="item.step.last > item.step.first"
            :style="{ left: `${item.from}%`, width: `${item.to - item.from}%` }"
          />
        </TransitionGroup>
        <span
          v-for="tick in ticks"
          :key="tick.key"
          class="absolute top-3 h-4 rounded-[1.5px] transition-[opacity] duration-[140ms] ease-[var(--ease-out)] data-[dim=true]:opacity-25 [@media(prefers-reduced-motion:reduce)]:transition-none"
          :data-dim="dimmed(tick.key)"
          :style="{ left: `${tick.left}%`, width: `max(${tick.width}%, 3px)`, background: tick.color }"
        />
      </div>

      <label class="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[13px]">
        <span>Acts closer than</span>
        <input
          v-model.number="gap"
          class="[accent-color:rgb(115_115_115)] max-w-56 min-w-24 flex-[1_1_8rem] focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 focus-visible:outline-solid dark:focus-visible:outline-neutral-100"
          type="range" min="0"
          max="4"
          step="0.5"
          :aria-valuetext="`${gap.toFixed(1)} seconds`"
        >
        <output class="tabular-nums min-w-[2.2rem] font-medium">{{ gap.toFixed(1) }} s</output>
        <span>are one line</span>
      </label>
    </div>

    <div class="min-w-0 flex flex-col gap-2.5 border border-neutral-200 rounded-xl px-3 py-2.5 dark:border-neutral-700/80 dark:bg-neutral-800/40">
      <p class="m-0 flex items-baseline justify-between gap-2 text-[13px] font-medium">
        <span>The log</span>
        <span class="tabular-nums text-neutral-500 font-normal dark:text-neutral-400">{{ lines.length }} lines</span>
      </p>
      <TransitionGroup tag="ol" name="line" class="list-none relative m-0 p-0 [&>*]:w-full">
        <!-- The article styles every li (size, line height, a margin below): a row is its own -->
        <li
          v-for="row in rows"
          :key="row.key"
          class="row [font-size:inherit] [line-height:inherit] flex items-start"
          :class="row.child ? 'ml-[11px] mb-0 gap-0 border-l border-neutral-400/45 pl-[22px]' : 'mb-[2px] gap-1'"
          :data-child="row.child"
        >
          <button
            v-if="row.group"
            type="button"
            class="grid h-[30px] w-[22px] shrink-0 place-items-center rounded-[6px] text-neutral-500 hover:bg-neutral-400/18 dark:text-neutral-400 focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-solid dark:focus-visible:outline-neutral-100 focus-visible:-outline-offset-2"
            :aria-expanded="row.open"
            :aria-label="row.open ? 'Fold the acts' : 'Unfold the acts'"
            @click="toggle(row.step)"
          >
            <Icon name="lucide:chevron-right" class="[transition-property:rotate] size-3.5 duration-[160ms] ease-[var(--ease-out)] [@media(prefers-reduced-motion:reduce)]:transition-none" :class="row.open && '[rotate:90deg]'" aria-hidden="true" />
          </button>
          <span v-else-if="foldable && !row.child" class="grid h-[30px] w-[22px] shrink-0 place-items-center rounded-[6px] text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
          <ExplorationsLearnerDrawingAnswersLogEntry
            :line="row.line"
            :state="stateOf(row.step)"
            :open="row.open"
            :compact="row.child"
            :aria-pressed="same(row.step, picked)"
            @pointerenter="hover(row.step)"
            @pointerleave="hover(null)"
            @click="pick(row.step)"
          />
        </li>
      </TransitionGroup>
    </div>
  </figure>
</template>

<style scoped>
/* A bracket stretches over the acts it gathers, and shrinks back when the gap is cut */
.bracket {
  transition:
    left 260ms var(--ease-out),
    width 260ms var(--ease-out),
    opacity 200ms var(--ease-out),
    scale 200ms var(--ease-out),
    border-color 200ms var(--ease-out),
    background-color 140ms var(--ease-out);
}

.bracket-enter-from,
.bracket-leave-to {
  opacity: 0;
  scale: 0.9 1;
}

.line-enter-active,
.line-leave-active {
  transition:
    opacity 200ms var(--ease-out),
    translate 200ms var(--ease-out);
}

.line-enter-from,
.line-leave-to {
  opacity: 0;
  translate: 0 -4px;
}

/* The lines below slide to their new place instead of jumping */
.line-move {
  transition: transform 260ms var(--ease-out);
}

.line-leave-active {
  position: absolute;
}

/* The last act leaves some air before the next line */
.row[data-child='true']:has(+ .row:not([data-child='true'])) {
  margin-bottom: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .bracket,
  .line-enter-active,
  .line-leave-active,
  .line-move {
    transition: none;
  }
}
</style>
