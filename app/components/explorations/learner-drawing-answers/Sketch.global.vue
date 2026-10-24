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

// A scripted learner for the reader who would rather watch than draw: it fills the same drawing, so the
// counter and the teacher's side read it like a real one
const simulation = useSimulatedLearner(drawing, check)

function simulate() {
  count.value = null
  simulation.start()
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
      <p class="m-0 flex items-start gap-2 text-[15px] not-italic">
        <Icon name="lucide:microscope" class="mt-0.5 size-4 shrink-0 text-neutral-400" aria-hidden="true" />
        <span>{{ CELL_PROMPT }}</span>
      </p>
    </div>

    <ExplorationsLearnerDrawingAnswersTeacher v-if="view === 'teacher'" :drawing="drawing" />

    <DrawingBoard v-else :drawing="drawing" label="Your drawing of a living cell" :inert="simulation.running.value">
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
    <div v-if="view === 'learner'" class="flex flex-col gap-2 border border-neutral-200 rounded-xl p-3 dark:border-neutral-700/80 dark:bg-neutral-800/40">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          class="[transition-property:scale,background-color] h-8 inline-flex items-center gap-1.5 rounded-lg bg-neutral-400/16 px-3 text-[13px] text-neutral-800 font-medium duration-[160ms] ease-[var(--ease-out)] disabled:cursor-not-allowed dark:text-neutral-200 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 focus-visible:outline-solid [@media(prefers-reduced-motion:reduce)]:transition-none active:enabled:[scale:0.96] hover:enabled:bg-neutral-400/26 dark:focus-visible:outline-neutral-100"
          :disabled="!drawing.labels.value.length || simulation.running.value"
          @click="check"
        >
          <Icon name="lucide:list-checks" class="size-4" aria-hidden="true" />
          Check my labels
        </button>

        <div class="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1 data-[stale=true]:opacity-50" :data-stale="stale" aria-live="polite">
          <div class="flex gap-[3px]" aria-hidden="true">
            <span
              v-for="(part, index) in CELL_PARTS"
              :key="part.id"
              class="h-2 w-5 rounded-full bg-neutral-400/25 transition-[background-color] duration-[240ms] ease-[var(--ease-out)] data-[on=true]:bg-emerald-500 [@media(prefers-reduced-motion:reduce)]:transition-none"
              :data-on="!!count && index < count.named"
            />
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

        <button
          type="button"
          class="[transition-property:scale,background-color] ml-auto h-8 inline-flex items-center gap-1.5 rounded-lg px-3 text-[13px] text-neutral-600 font-medium duration-[160ms] ease-[var(--ease-out)] active:[scale:0.96] hover:bg-neutral-400/16 dark:text-neutral-300 focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 focus-visible:outline-solid [@media(prefers-reduced-motion:reduce)]:transition-none dark:focus-visible:outline-neutral-100"
          @click="simulation.running.value ? simulation.stop() : simulate()"
        >
          <Icon :name="simulation.running.value ? 'lucide:square' : 'lucide:play'" class="size-4" aria-hidden="true" />
          {{ simulation.running.value ? 'Stop' : 'Simulate a learner' }}
        </button>
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
