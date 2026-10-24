<script setup lang="ts">
import { CELL_PARTS } from '~/exercises/cell'
import { buildSession } from '~/utils/demoSession'
import { KIND_COLORS, kindOf, logLine } from '~/utils/logLine'
import { activeSpans, condense } from '~/utils/session'
import { mmss, summarize } from '~/utils/trace'

// The same acts, as a timeline and as lines of the log. The gap decides which acts are one movement of
// the learner: move it and see the lines merge or split. The session is written by hand, and the lines are
// the ones the real log draws.
// A circle of three strokes, a nucleus of two, its label, two undos and a check: nine acts, few enough to read
// all the lines at once. The circle ends 2.1 s before the nucleus begins, so a gap of 2 s keeps them apart
const events = buildSession([
  { at: 3, stroke: 1.2 },
  { at: 4.6, stroke: 0.9 },
  { at: 5.9, stroke: 1.1 },
  { at: 9.5, stroke: 1.5 },
  { at: 11, stroke: 1.2 },
  { at: 14, label: 'nucleus' },
  { at: 17, undo: true },
  { at: 17.8, undo: true },
  { at: 22, check: true },
], CELL_PARTS)

const summary = summarize(events)
const spans = activeSpans(events)
const end = events.at(-1)!.t

const at = (t: number) => t / end * 100

// Seconds, since that is how the learner's pauses are told
const gap = ref(2)

const steps = computed(() => condense(events, gap.value * 1000))

const lines = computed(() => steps.value.map(step => ({
  step,
  line: logLine(events, step, summary, CELL_PARTS),
  // The span of the timeline the line stands for
  from: at(spans[step.first]![0]),
  to: at(spans[step.last]![1]),
})))

// The line the pointer is on, or the one clicked to stay
const hovered = ref<number | null>(null)
const picked = ref<number | null>(null)
const lit = computed(() => hovered.value ?? picked.value)

const pick = (first: number) => picked.value = picked.value === first ? null : first

// A line that no longer exists after the gap moved is not picked any more
watch(steps, (next) => {
  if (picked.value !== null && !next.some(step => step.first === picked.value))
    picked.value = null
})

const ticks = events.map((event, index) => ({
  key: index,
  color: KIND_COLORS[kindOf(event.type)],
  left: at(spans[index]![0]),
  width: at(spans[index]![1]) - at(spans[index]![0]),
}))

const owner = computed(() => new Map(steps.value.flatMap(step => Array.from({ length: step.last - step.first + 1 }, (_, i) => [step.first + i, step.first] as const))))
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
            :data-on="lit === item.step.first"
            :data-group="item.step.last > item.step.first"
            :style="{ left: `${item.from}%`, width: `${item.to - item.from}%` }"
          />
        </TransitionGroup>
        <span
          v-for="tick in ticks"
          :key="tick.key"
          class="absolute top-3 h-4 rounded-[1.5px] transition-[opacity] duration-[140ms] ease-[var(--ease-out)] data-[dim=true]:opacity-25 [@media(prefers-reduced-motion:reduce)]:transition-none"
          :data-dim="lit !== null && owner.get(tick.key) !== lit"
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
      <TransitionGroup tag="div" name="line" class="relative [&>*]:mb-0.5 [&>*]:w-full">
        <ExplorationsLearnerDrawingAnswersLogEntry
          v-for="item in lines"
          :key="`${item.step.first}:${item.step.last}`"
          :line="item.line"
          :state="lit === item.step.first ? 'current' : 'past'"
          :aria-pressed="picked === item.step.first"
          @pointerenter="hovered = item.step.first"
          @pointerleave="hovered = null"
          @click="pick(item.step.first)"
        />
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

@media (prefers-reduced-motion: reduce) {
  .bracket,
  .line-enter-active,
  .line-leave-active,
  .line-move {
    transition: none;
  }
}
</style>
