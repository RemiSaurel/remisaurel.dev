<script setup lang="ts">
import type { Label, Stroke } from '~/utils/drawing'
import { CELL_PARTS, CELL_PROMPT } from '~/exercises/cell'
import { checkLabels } from '~/utils/labelMatch'
import { summarize } from '~/utils/trace'

// The exercise as the learner sees it: a question, a sheet, and the counter under it. Above the counter, what the app
// already keeps of the way the drawing was made. Nothing is sent anywhere: the drawing stays in this page.
type View = 'learner' | 'teacher'

const VIEWS: { id: View, label: string, icon: string }[] = [
  { id: 'learner', label: 'Learner', icon: 'lucide:pencil' },
  { id: 'teacher', label: 'Teacher', icon: 'lucide:graduation-cap' },
]

// Both sides read the same drawing: what the learner does on one is what the teacher reads on the other
const view = ref<View>('learner')
const drawing = useDrawing()

// --- The counter: how many expected parts the labels name, and never which ---

interface Count {
  named: number
  /** Labels that name none of the parts: a typo, or a word the matcher does not know */
  unmatched: number
  /** What the drawing was when it was asked, to tell when the answer is out of date */
  strokes: Stroke[]
  labels: Label[]
}

// Shallow: the arrays are compared by identity, which a deep proxy of them would break
const count = shallowRef<Count | null>(null)

// Asking is an act, kept in the trace: help that is one click away is help that gets used.
// With no label there is nothing to count, so the button waits for the first one.
function check() {
  const { covered, unmatched } = checkLabels(drawing.labels.value.map(label => label.text), CELL_PARTS)
  count.value = {
    named: covered.length,
    unmatched: unmatched.length,
    strokes: drawing.strokes.value,
    labels: drawing.labels.value,
  }
  drawing.log('help', `counter ${covered.length}/${CELL_PARTS.length}`)
}

const stale = computed(() => !!count.value && (count.value.strokes !== drawing.strokes.value || count.value.labels !== drawing.labels.value))

const trace = computed(() => {
  const { total, duration } = summarize(drawing.events.value)
  return [
    { label: 'Strokes', value: `${total.stroke}` },
    { label: 'Labels', value: `${total.label}` },
    { label: 'Undone', value: `${total.undo}` },
    { label: 'Cleared', value: `${total.clear}` },
    { label: 'Checks', value: `${total.help}` },
    { label: 'Time', value: `${Math.round(duration / 1000)} s` },
  ]
})
</script>

<template>
  <figure class="sketch my-8 flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <SegmentedControl v-model="view" label="Whose side" :options="VIEWS" />
      <figcaption class="m-0 flex items-start gap-2 text-[15px] not-italic">
        <Icon name="lucide:microscope" class="mt-0.5 size-4 shrink-0 text-neutral-400" aria-hidden="true" />
        <span>{{ CELL_PROMPT }}</span>
      </figcaption>
    </div>

    <ExplorationsLearnerDrawingAnswersTeacher v-if="view === 'teacher'" :drawing="drawing" />

    <DrawingBoard v-else :drawing="drawing" label="Your drawing of a living cell">
      <template #stats>
        <dl class="m-0 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-neutral-500 dark:text-neutral-400">
          <div v-for="item in trace" :key="item.label" class="flex gap-1.5">
            <dt>{{ item.label }}</dt>
            <dd class="tabular-nums m-0 text-neutral-800 font-medium dark:text-neutral-200">
              {{ item.value }}
            </dd>
          </div>
        </dl>
      </template>
    </DrawingBoard>

    <!-- The counter: both rows are there before the first check, so asking changes their words and nothing else -->
    <div v-if="view === 'learner'" class="counter">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button type="button" class="check" :disabled="!drawing.labels.value.length" @click="check">
          <Icon name="lucide:list-checks" class="size-4" aria-hidden="true" />
          Check my labels
        </button>

        <div class="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1" :data-stale="stale" aria-live="polite">
          <div class="segments" aria-hidden="true">
            <span v-for="(part, index) in CELL_PARTS" :key="part.id" class="segment" :data-on="!!count && index < count.named" />
          </div>
          <span class="tabular-nums text-[14px] font-medium">
            <template v-if="count">
              {{ count.named }} of {{ CELL_PARTS.length }}
            </template>
            <template v-else>
              <span class="text-neutral-400 dark:text-neutral-500">?</span> of {{ CELL_PARTS.length }}
            </template>
            {{ ' ' }}<span class="text-neutral-500 font-normal dark:text-neutral-400">parts named</span>
          </span>
        </div>
      </div>

      <p class="m-0 text-[13px] text-neutral-500 dark:text-neutral-400">
        <template v-if="!count">
          Name the parts with the label tool, then check. You get a count, never which parts.
        </template>
        <template v-else-if="stale">
          You changed the drawing since this count. Check again.
        </template>
        <template v-else-if="count.unmatched">
          {{ count.unmatched === 1 ? '1 label names' : `${count.unmatched} labels name` }} none of the expected parts. Check the spelling, or the word.
        </template>
        <template v-else-if="count.named === CELL_PARTS.length">
          Every expected part is named.
        </template>
        <template v-else>
          Name more parts, then check again.
        </template>
      </p>
    </div>
  </figure>
</template>

<style scoped>
.counter {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgb(229 229 229);
  border-radius: 12px;
}

.dark .counter {
  border-color: rgb(64 64 64 / 0.8);
  background: rgb(38 38 38 / 0.4);
}

.check {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  background: rgb(163 163 163 / 0.16);
  color: rgb(38 38 38);
  font-size: 13px;
  font-weight: 500;
  transition:
    scale 160ms var(--ease-out),
    background-color 160ms var(--ease-out);
}

.dark .check {
  color: rgb(229 229 229);
}

.check:active:not(:disabled) {
  scale: 0.96;
}

.check:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.check:focus-visible {
  outline: 2px solid rgb(23 23 23);
  outline-offset: 2px;
}

.dark .check:focus-visible {
  outline-color: rgb(245 245 245);
}

@media (hover: hover) and (pointer: fine) {
  .check:hover:not(:disabled) {
    background: rgb(163 163 163 / 0.26);
  }
}

/* One segment per expected part, with no name on it: it only shows how far along the labels are */
.segments {
  display: flex;
  gap: 3px;
}

.segment {
  width: 20px;
  height: 8px;
  border-radius: 9999px;
  background: rgb(163 163 163 / 0.25);
  transition: background-color 240ms var(--ease-out);
}

.segment[data-on='true'] {
  background: rgb(16 185 129);
}

/* An answer about a drawing that has changed since: still there, but faded */
[data-stale='true'] {
  opacity: 0.5;
}

@media (prefers-reduced-motion: reduce) {
  .check,
  .segment {
    transition: none;
  }
}
</style>
