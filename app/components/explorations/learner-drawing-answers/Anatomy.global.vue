<script setup lang="ts">
import { CELL_PARTS } from '~/exercises/cell'
import { buildSession } from '~/utils/demoSession'
import { logLine } from '~/utils/logLine'
import { condense } from '~/utils/session'
import { summarize } from '~/utils/trace'

// One line of the teacher's log taken out of the log, with the cells it is made of named. The lines are the
// last ones of three sessions written by hand, run through the same functions as the real log: they are not
// recorded sessions. Pointing at a cell, or at its note, lights both.
type CaseId = 'fixes' | 'renames' | 'rename'

const CASES: { id: CaseId, label: string, icon: string }[] = [
  { id: 'fixes', label: 'Fixes', icon: 'lucide:wrench' },
  { id: 'renames', label: 'Renames', icon: 'lucide:text-cursor-input' },
  { id: 'rename', label: 'One rename', icon: 'lucide:replace' },
]

// "cyto" names no part, so what the learner does next shows in the count
const START = [
  { at: 4, stroke: 1.2 },
  { at: 7, stroke: 0.9 },
  { at: 14, label: 'nucleus' },
  { at: 21, label: 'membrane' },
  { at: 26, label: 'cyto' },
  { at: 30, check: true },
]

const SESSIONS: Record<CaseId, ReturnType<typeof buildSession>> = {
  fixes: buildSession([
    ...START,
    { at: 55, label: 'mitochondria' },
    { at: 63, rename: ['cyto', 'cytoplasm'] },
    { at: 70, label: 'golgi' },
    { at: 75, check: true },
  ], CELL_PARTS),
  renames: buildSession([
    ...START,
    { at: 50, rename: ['cyto', 'cytoplasm'] },
    { at: 56, rename: ['membrane', 'cell membrane'] },
    { at: 60, check: true },
  ], CELL_PARTS),
  rename: buildSession([
    ...START,
    { at: 50, rename: ['cyto', 'cytoplasm'] },
  ], CELL_PARTS),
}

const NOTES: Record<string, { title: string, icon: string, text: string }> = {
  time: { title: 'Time', icon: 'lucide:clock', text: 'When the act began, counted from the first act of the session.' },
  kind: { title: 'Colour', icon: 'lucide:palette', text: 'The kind of act: grey for a stroke, blue for a label, red for undo and clear, green for a check.' },
  what: { title: 'Act', icon: 'lucide:mouse-pointer-click', text: 'What the learner did.' },
  from: { title: 'Old name', icon: 'lucide:history', text: 'The word before the rename, struck through.' },
  name: { title: 'Label', icon: 'lucide:tag', text: 'The word the learner wrote.' },
  figure: { title: 'Count', icon: 'lucide:hash', text: 'What the counter told the learner at that moment.' },
  part: { title: 'Part', icon: 'lucide:target', text: 'The expected part this word names. Only the teacher sees it.' },
  delta: { title: 'Change', icon: 'lucide:trending-up', text: 'The count now, minus the count at the check before.' },
  flag: { title: 'Only renames', icon: 'lucide:flag', text: 'No stroke and no label since the check before, only words changed. The count may be a guess.' },
  since: { title: 'Since', icon: 'lucide:list-restart', text: 'Everything done between the check before and this one, by kind of act.' },
}

// The flag comes last, not where it sits in the line: going from Fixes to Renames, the notes already there
// stay where they are and the new one is added after them
const CELLS: Record<CaseId, string[]> = {
  fixes: ['time', 'kind', 'what', 'figure', 'delta', 'since'],
  renames: ['time', 'kind', 'what', 'figure', 'delta', 'since', 'flag'],
  rename: ['time', 'kind', 'what', 'from', 'name', 'part'],
}

const current = ref<CaseId>('fixes')

const line = computed(() => {
  const events = SESSIONS[current.value]
  return logLine(events, condense(events).at(-1)!, summarize(events), CELL_PARTS)
})

const cells = computed(() => CELLS[current.value])

// What the pointer or the focus is on, and what was clicked to stay: a touch screen has no hover
const hovered = ref<string | null>(null)
const pinned = ref<string | null>(null)
const lit = computed(() => hovered.value ?? pinned.value)

watch(current, () => {
  hovered.value = null
  pinned.value = null
})

function onOver(e: PointerEvent) {
  const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-cell]')?.dataset.cell
  hovered.value = cell && cells.value.includes(cell) ? cell : null
}

const pin = (cell: string) => pinned.value = pinned.value === cell ? null : cell

// The hint that invites to point goes away once it has been understood
const touched = ref(false)
watch(lit, (cell) => {
  if (cell)
    touched.value = true
})
</script>

<template>
  <figure class="my-8 flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <SegmentedControl v-model="current" label="Which line" :options="CASES" />
      <p
        class="hint m-0 flex items-center gap-[5px] text-[12px] text-neutral-500 transition-[opacity] duration-200 ease-[var(--ease-out)] dark:text-neutral-400 data-[gone=true]:opacity-0 [@media(prefers-reduced-motion:reduce)]:transition-none"
        :data-gone="touched"
        aria-hidden="true"
      >
        <Icon name="lucide:mouse-pointer-click" class="hint-icon size-3.5" />
        Point at a cell
      </p>
    </div>

    <div class="[zoom:1.15] border border-neutral-200 rounded-xl bg-neutral-50 px-2.5 py-3.5 dark:border-neutral-700/80 dark:bg-neutral-800/40" @pointerover="onOver" @pointerleave="hovered = null">
      <ExplorationsLearnerDrawingAnswersLogEntry :line="line" plain :lit="lit" />
    </div>

    <div class="grid gap-1 sm:grid-cols-2" role="group" aria-label="The cells of the line">
      <button
        v-for="cell in cells"
        :key="cell"
        type="button"
        class="flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] leading-[1.4] transition-[background-color] duration-[140ms] ease-[var(--ease-out)] data-[on=true]:bg-neutral-400/18 focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 focus-visible:outline-solid [@media(prefers-reduced-motion:reduce)]:transition-none dark:focus-visible:outline-neutral-100"
        :data-on="lit === cell"
        :aria-pressed="pinned === cell"
        @pointerenter="hovered = cell"
        @pointerleave="hovered = null"
        @focus="hovered = cell"
        @blur="hovered = null"
        @click="pin(cell)"
      >
        <Icon
          :name="NOTES[cell]!.icon"
          class="mt-0.5 size-4 shrink-0 transition-[color] duration-[140ms] ease-[var(--ease-out)] [@media(prefers-reduced-motion:reduce)]:transition-none"
          :class="lit === cell ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
          aria-hidden="true"
        />
        <span class="flex flex-col gap-px">
          <span class="font-medium">{{ NOTES[cell]!.title }}</span>
          <span class="text-neutral-500 dark:text-neutral-400">{{ NOTES[cell]!.text }}</span>
        </span>
      </button>
    </div>
  </figure>
</template>

<style scoped>
.hint-icon {
  animation: nudge 1.8s var(--ease-out) infinite;
}

@keyframes nudge {
  0%,
  60%,
  100% {
    translate: 0 0;
  }

  80% {
    translate: 2px 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hint-icon {
    animation: none;
  }
}
</style>
