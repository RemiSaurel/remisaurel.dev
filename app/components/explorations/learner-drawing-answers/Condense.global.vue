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
    <div class="panel">
      <p class="caption">
        <span>The acts, on time</span>
        <span class="tabular-nums">{{ events.length }} acts in {{ mmss(end) }}</span>
      </p>

      <div class="axis" aria-hidden="true">
        <TransitionGroup name="bracket" tag="div" class="brackets">
          <span
            v-for="item in lines"
            :key="item.step.first"
            class="bracket"
            :data-on="lit === item.step.first"
            :data-group="item.step.last > item.step.first"
            :style="{ left: `${item.from}%`, width: `${item.to - item.from}%` }"
          />
        </TransitionGroup>
        <span
          v-for="tick in ticks"
          :key="tick.key"
          class="tick"
          :data-dim="lit !== null && owner.get(tick.key) !== lit"
          :style="{ left: `${tick.left}%`, width: `max(${tick.width}%, 3px)`, background: tick.color }"
        />
      </div>

      <label class="window">
        <span>Acts closer than</span>
        <input v-model.number="gap" type="range" min="0" max="4" step="0.5" :aria-valuetext="`${gap.toFixed(1)} seconds`">
        <output class="tabular-nums">{{ gap.toFixed(1) }} s</output>
        <span>are one line</span>
      </label>
    </div>

    <div class="panel">
      <p class="caption">
        <span>The log</span>
        <span class="tabular-nums">{{ lines.length }} lines</span>
      </p>
      <TransitionGroup tag="div" name="line" class="lines">
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
.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid rgb(229 229 229);
  border-radius: 12px;
}

.dark .panel {
  border-color: rgb(64 64 64 / 0.8);
  background: rgb(38 38 38 / 0.4);
}

.caption {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

.caption > :last-child {
  color: rgb(115 115 115);
  font-weight: 400;
}

.dark .caption > :last-child {
  color: rgb(163 163 163);
}

.axis {
  position: relative;
  height: 40px;
  margin-inline: 4px;
}

/* A tick is an act, as long as the act took. A bracket gathers the ticks that make one line */
.tick {
  position: absolute;
  top: 12px;
  height: 16px;
  border-radius: 1.5px;
  transition: opacity 140ms var(--ease-out);
}

.tick[data-dim='true'] {
  opacity: 0.25;
}

.brackets {
  position: absolute;
  inset: 0;
}

/* A bracket stretches over the acts it gathers, and shrinks back when the gap is cut */
.bracket {
  position: absolute;
  top: 6px;
  bottom: 6px;
  margin-inline: -5px;
  padding-inline: 5px;
  box-sizing: content-box;
  border: 1.5px solid transparent;
  border-radius: 6px;
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

.bracket[data-group='true'] {
  border-color: rgb(163 163 163 / 0.55);
}

.bracket[data-on='true'] {
  border-color: rgb(23 23 23);
  background: rgb(163 163 163 / 0.18);
}

.dark .bracket[data-on='true'] {
  border-color: rgb(245 245 245);
}

.window {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  font-size: 13px;
}

.window input {
  flex: 1 1 8rem;
  min-width: 6rem;
  max-width: 14rem;
  accent-color: rgb(115 115 115);
}

.window output {
  min-width: 2.2rem;
  font-weight: 500;
}

.window input:focus-visible {
  outline: 2px solid rgb(23 23 23);
  outline-offset: 2px;
}

.dark .window input:focus-visible {
  outline-color: rgb(245 245 245);
}

/* As tall as its lines: a gap that gathers acts leaves no empty space */
.lines {
  position: relative;
}

.lines > * {
  width: 100%;
  margin-bottom: 2px;
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
  .tick,
  .bracket,
  .line-enter-active,
  .line-leave-active,
  .line-move {
    transition: none;
  }
}
</style>
