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

const CELLS: Record<CaseId, string[]> = {
  fixes: ['time', 'kind', 'what', 'figure', 'delta', 'since'],
  renames: ['time', 'kind', 'what', 'figure', 'delta', 'flag', 'since'],
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
      <p class="hint" :data-gone="touched" aria-hidden="true">
        <Icon name="lucide:mouse-pointer-click" class="hint-icon size-3.5" />
        Point at a cell
      </p>
    </div>

    <div class="stage" @pointerover="onOver" @pointerleave="hovered = null">
      <ExplorationsLearnerDrawingAnswersLogEntry :line="line" plain :lit="lit" />
    </div>

    <div class="grid gap-1 sm:grid-cols-2" role="group" aria-label="The cells of the line">
      <button
        v-for="cell in cells"
        :key="cell"
        type="button"
        class="note"
        :data-on="lit === cell"
        :aria-pressed="pinned === cell"
        @pointerenter="hovered = cell"
        @pointerleave="hovered = null"
        @focus="hovered = cell"
        @blur="hovered = null"
        @click="pin(cell)"
      >
        <Icon :name="NOTES[cell]!.icon" class="note-icon size-4" aria-hidden="true" />
        <span class="note-body">
          <span class="note-title">{{ NOTES[cell]!.title }}</span>
          <span class="note-text">{{ NOTES[cell]!.text }}</span>
        </span>
      </button>
    </div>
  </figure>
</template>

<style scoped>
/* The line is shown larger than in the log, to be read cell by cell */
.stage {
  zoom: 1.15;
  padding: 14px 10px;
  border: 1px solid rgb(229 229 229);
  border-radius: 12px;
  background: rgb(250 250 250);
}

.dark .stage {
  border-color: rgb(64 64 64 / 0.8);
  background: rgb(38 38 38 / 0.4);
}

.note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.4;
  text-align: left;
  transition: background-color 140ms var(--ease-out);
}

.note-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.note-icon {
  margin-top: 2px;
  flex-shrink: 0;
  color: rgb(115 115 115);
  transition: color 140ms var(--ease-out);
}

.dark .note-icon {
  color: rgb(163 163 163);
}

.note[data-on='true'] .note-icon,
.dark .note[data-on='true'] .note-icon {
  color: rgb(23 23 23);
}

.dark .note[data-on='true'] .note-icon {
  color: rgb(245 245 245);
}

.note-title {
  font-weight: 500;
}

.note-text {
  color: rgb(115 115 115);
}

.dark .note-text {
  color: rgb(163 163 163);
}

.note[data-on='true'] {
  background: rgb(163 163 163 / 0.18);
}

/* An invitation beside the choice of line, until the first cell is pointed at */
.hint {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  font-size: 12px;
  color: rgb(115 115 115);
  transition: opacity 200ms var(--ease-out);
}

.dark .hint {
  color: rgb(163 163 163);
}

.hint[data-gone='true'] {
  opacity: 0;
}

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

.note:focus-visible {
  outline: 2px solid rgb(23 23 23);
  outline-offset: 2px;
}

.dark .note:focus-visible {
  outline-color: rgb(245 245 245);
}

@media (prefers-reduced-motion: reduce) {
  .note,
  .note-icon,
  .hint {
    transition: none;
  }

  .hint-icon {
    animation: none;
  }
}
</style>
