<script setup lang="ts">
import type { Drawing } from '~/composables/useDrawing'
import type { Kind, LogLine } from '~/utils/logLine'
import type { Step } from '~/utils/session'
import { useRafFn } from '@vueuse/core'
import { CELL_PARTS } from '~/exercises/cell'
import { namesPart } from '~/utils/labelMatch'
import { kindOf, logLine } from '~/utils/logLine'
import { activeSpans, condense, describeEvent, frameAt, squeeze, within } from '~/utils/session'
import { describeTally, mmss, summarize } from '~/utils/trace'

// The same session, read by the person who will grade it. The teacher gets what the learner never gets:
// which parts were named, and where on the sheet (the counter says only how many), the log of what was
// done and when, and what each ask for help showed. The session plays like a recording: the sheet is the
// sheet as it was at the moment shown on the timeline, with the strokes that were undone and the labels
// as they were before a rename. All of it comes from the drawing the learner was working on.
const props = defineProps<{ drawing: Drawing }>()

const events = computed(() => props.drawing.events.value)
const summary = computed(() => summarize(events.value))
const worked = computed(() => events.value.length > 0)
const duration = computed(() => summary.value.duration)

// --- The session as a recording ---

// The time of the recording is real time, so a pause is a gap on the timeline. Playing it runs on a
// clock that spends at most a moment on each pause.
const clock = computed(() => squeeze(activeSpans(events.value)))

// Opens on the end of the session: the answer first, then how it came
const time = ref(duration.value)
const playing = ref(false)

const frame = computed(() => frameAt(events.value, time.value))
const descriptions = computed(() => events.value.map((_, index) => describeEvent(events.value, index)))

// --- The expected parts, and the labels that name them ---

// Read on the sheet of this moment, so the list follows the recording, and what it points at is on the board
const parts = computed(() => {
  const { labels } = frame.value
  return CELL_PARTS.map(part => ({
    id: part.id,
    name: part.name,
    named: labels.filter(label => namesPart(label.text, part)),
  }))
})

const namedCount = computed(() => parts.value.filter(part => part.named.length).length)

// What matches nothing is what a better matcher, or a longer list, could still catch
const unmatched = computed(() => frame.value.labels
  .filter(label => !CELL_PARTS.some(part => namesPart(label.text, part)))
  .map(label => label.text))

// Where a part sits: pointing at one, or picking it, lights its labels on the sheet and dims the rest
const hovered = ref<string | null>(null)
const picked = ref<string | null>(null)

const spotlight = computed(() => {
  const id = hovered.value ?? picked.value
  return parts.value.find(part => part.id === id)?.named.map(label => label.id) ?? []
})

const pick = (id: string) => picked.value = picked.value === id ? null : id

const { pause, resume } = useRafFn(({ delta }) => {
  const next = clock.value.clockAt(time.value) + delta
  if (next >= clock.value.duration) {
    time.value = duration.value
    stop()
    return
  }
  time.value = clock.value.timeAt(next)
}, { immediate: false })

function play() {
  if (time.value >= duration.value)
    time.value = 0
  playing.value = true
  resume()
}

function stop() {
  playing.value = false
  pause()
}

function seek(t: number) {
  stop()
  time.value = Math.min(duration.value, Math.max(0, t))
}

onBeforeUnmount(stop)

// What is happening at this moment: the last act, or the stroke the learner is in the middle of
const now = computed(() => {
  const { index, strokes } = frame.value
  if (strokes.length > (events.value[index]?.strokes?.length ?? 0))
    return { time: time.value, text: 'Drawing a stroke' }
  if (index < 0)
    return { time: 0, text: 'Before the first act' }
  return { time: events.value[index]!.t, text: descriptions.value[index]! }
})

const LEGEND: { kind: Kind, label: string }[] = [
  { kind: 'draw', label: 'Stroke' },
  { kind: 'label', label: 'Label' },
  { kind: 'undo', label: 'Undo, redo, clear' },
  { kind: 'check', label: 'Check' },
]

const at = (t: number) => duration.value ? t / duration.value * 100 : 0

const ticks = computed(() => events.value.map((event, index) => ({
  key: index,
  kind: kindOf(event.type),
  at: at(event.t),
  past: event.t <= time.value,
})))

// --- The timeline is also the scrubber: drag it, click a mark, or use the arrows ---

const track = ref<HTMLElement>()
let scrubbing = false

// A click near a mark lands on it, so the sheet shown is the one that act left
const SNAP = 6

function seekFromPointer(e: PointerEvent) {
  const rect = track.value!.getBoundingClientRect()
  const x = Math.min(rect.width, Math.max(0, e.clientX - rect.left))
  const near = events.value.find(event => Math.abs(at(event.t) / 100 * rect.width - x) <= SNAP)
  seek(near ? near.t : x / rect.width * duration.value)
}

function onScrubDown(e: PointerEvent) {
  if (e.button !== 0)
    return
  scrubbing = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  ;(e.currentTarget as HTMLElement).focus()
  seekFromPointer(e)
}

const onScrubMove = (e: PointerEvent) => scrubbing && seekFromPointer(e)
const onScrubUp = () => scrubbing = false

function onScrubKey(e: KeyboardEvent) {
  const { index } = frame.value
  const list = events.value
  if (e.key === 'ArrowRight')
    seek(list[index + 1]?.t ?? duration.value)
  else if (e.key === 'ArrowLeft')
    seek(list[index] && time.value > list[index].t ? list[index].t : (list[index - 1]?.t ?? 0))
  else if (e.key === 'Home')
    seek(0)
  else if (e.key === 'End')
    seek(duration.value)
  else
    return
  e.preventDefault()
}

// --- The log: every act, the ones before this moment in full and the ones after faded ---

// Acts that follow each other closely are one line: twenty strokes that make a circle are a circle
const steps = computed(() => condense(events.value))

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

function toggle(first: number) {
  if (!unfolded.delete(first))
    unfolded.add(first)
}

const lineOf = (step: Step) => logLine(events.value, step, summary.value, CELL_PARTS)

const rows = computed(() => steps.value.flatMap((step): Row[] => {
  const group = step.last > step.first
  const open = group && unfolded.has(step.first)
  const head: Row = { key: `${step.first}`, step, line: lineOf(step), child: false, group, open }
  if (!open)
    return [head]
  return [head, ...within(events.value, step).map((act): Row => ({ key: `${step.first}.${act.first}`, step: act, line: lineOf(act), child: true, group: false, open: false }))]
}))

function stateOf(step: { first: number, last: number }) {
  const { index } = frame.value
  return index > step.last ? 'past' : index >= step.first ? 'current' : 'future'
}

const log = ref<HTMLElement>()

// Keeps the act of this moment in view as the recording plays, without moving a list the reader is scrolling
watch(() => frame.value.index, async () => {
  await nextTick()
  const box = log.value
  // The deepest one, so an unfolded line keeps the act of this moment in view
  const item = [...box?.querySelectorAll<HTMLElement>('[data-current="true"]') ?? []].at(-1)
  if (!box || !item)
    return
  if (item.offsetTop < box.scrollTop || item.offsetTop + item.offsetHeight > box.scrollTop + box.clientHeight)
    box.scrollTop = item.offsetTop - box.clientHeight / 2
})

// --- Each ask for help, shown in the log where it was asked ---

const after = computed(() => describeTally(summary.value.after))

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`
</script>

<template>
  <div class="teacher flex flex-col gap-3">
    <DrawingBoard :drawing="drawing" label="The drawing of the learner, at the moment shown on the timeline" readonly :frame="frame" :spotlight="spotlight" />

    <p v-if="!worked" class="m-0 text-[13px] text-neutral-500 dark:text-neutral-400">
      Nothing to read yet. Draw on the learner side, then come back: the trace builds as the learner works.
    </p>

    <template v-else>
      <!-- The recording: play it, or move along the timeline to a moment -->
      <Panel as="section" class="min-w-0 flex flex-col gap-2" aria-label="The session">
        <div class="flex items-center gap-x-3">
          <PlayButton :playing="playing" play-label="Play the session" @click="playing ? stop() : play()" />

          <div
            class="[touch-action:none] min-w-0 flex-[1_1_180px] cursor-pointer select-none rounded-lg px-[7px] py-1 keyboard-focus"
            role="slider"
            tabindex="0"
            aria-label="Position in the session"
            aria-valuemin="0"
            :aria-valuemax="duration"
            :aria-valuenow="Math.round(time)"
            :aria-valuetext="`${mmss(time)}: ${now.text}`"
            title="Playing skips the pauses, the timeline shows them"
            @pointerdown="onScrubDown"
            @pointermove="onScrubMove"
            @pointerup="onScrubUp"
            @pointercancel="onScrubUp"
            @keydown="onScrubKey"
          >
            <div ref="track" class="relative h-6">
              <span class="absolute inset-x-0 top-1/2 h-px bg-neutral-400/40" />
              <span class="absolute inset-x-0 top-1/2 mt-[-0.5px] h-0.5 bg-neutral-500/70" :style="{ width: `${at(time)}%` }" />
              <span v-for="tick in ticks" :key="tick.key" class="tick [transition-property:opacity] [translate:0_-50%] absolute top-1/2 rounded-[1px] duration-[120ms] ease-[var(--ease-out)] -ml-px [@media(prefers-reduced-motion:reduce)]:transition-none" :class="[tick.kind === 'check' ? 'z-[1] h-5 w-[3px]' : 'h-3 w-0.5', tick.past ? 'opacity-100' : 'opacity-35']" :data-kind="tick.kind" :data-past="tick.past" :style="{ left: `${tick.at}%` }" />
              <span class="head pointer-events-none absolute inset-y-0 z-[2] w-0.5 rounded-[1px] bg-neutral-900 -ml-px dark:bg-neutral-100" :style="{ left: `${at(time)}%` }" />
            </div>
          </div>

          <span class="tabular-nums text-[13px] text-neutral-500 dark:text-neutral-400">{{ mmss(time) }} / {{ mmss(duration) }}</span>
        </div>

        <!-- What is happening where the timeline is, and what the marks mean -->
        <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p class="m-0 flex items-baseline gap-[10px] text-[14px]" aria-hidden="true">
            <span class="tabular-nums text-neutral-500 dark:text-neutral-400">{{ mmss(now.time) }}</span>
            <span>{{ now.text }}</span>
          </p>
          <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-neutral-500 dark:text-neutral-400">
            <span v-for="item in LEGEND" :key="item.kind" class="flex items-center gap-1.5">
              <span class="key h-3 w-[3px] shrink-0 rounded-[1px]" :data-kind="item.kind" />
              {{ item.label }}
            </span>
          </div>
        </div>
      </Panel>

      <!-- The parts, in one line: they are a checklist, the log is what there is to read -->
      <Panel as="section" class="min-w-0 flex flex-wrap items-center gap-x-1.5 gap-y-1" padding="sm" aria-label="Parts named">
        <p class="m-0 mr-1.5 flex items-baseline gap-2 text-[13px] font-medium">
          <span>Parts named</span>
          <span class="tabular-nums text-neutral-500 font-normal dark:text-neutral-400">{{ namedCount }} of {{ parts.length }}</span>
        </p>
        <!-- A named part can be pointed at: its labels light up on the sheet -->
        <button
          v-for="part in parts"
          :key="part.id"
          type="button"
          class="[transition-property:background-color] min-w-0 flex items-center gap-1.5 border border-neutral-200 rounded-full py-0.5 pl-1.5 pr-2.5 text-left text-[12px] keyboard-focus duration-[120ms] ease-[var(--ease-out)] disabled:cursor-default dark:border-neutral-700/80 aria-[pressed=true]:bg-neutral-400/18 [@media(prefers-reduced-motion:reduce)]:transition-none hover:enabled:bg-neutral-400/14"
          :data-named="part.named.length > 0"
          :aria-pressed="part.named.length ? picked === part.id : undefined"
          :disabled="!part.named.length"
          :title="part.named.length ? part.named.map(label => label.text).join(', ') : undefined"
          @pointerenter="hovered = part.id"
          @pointerleave="hovered = null"
          @click="pick(part.id)"
        >
          <Icon :name="part.named.length ? 'lucide:circle-check' : 'lucide:circle'" class="size-3.5 shrink-0" :class="part.named.length ? 'text-emerald-500' : 'text-neutral-400/70'" aria-hidden="true" />
          <span :class="!part.named.length && 'text-neutral-500 dark:text-neutral-400'">{{ part.name }}</span>
          <span v-if="part.named.length" class="max-w-32 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-neutral-500 dark:text-neutral-400">{{ part.named.map(label => label.text).join(', ') }}</span>
          <span v-else class="sr-only">not named</span>
        </button>
        <p v-if="unmatched.length" class="m-0 text-[12px] text-neutral-500 dark:text-neutral-400">
          Names no part: {{ unmatched.join(', ') }}
        </p>
      </Panel>

      <!-- Every act, and each ask for help with what led to it -->
      <Panel as="section" class="min-w-0 flex flex-col gap-2" aria-label="The log">
        <p class="m-0 flex items-baseline justify-between gap-2 text-[13px] font-medium">
          <span>The log</span>
          <span class="tabular-nums text-neutral-500 font-normal dark:text-neutral-400">{{ plural(events.length, 'act') }}<template v-if="summary.checks.length">, {{ plural(summary.checks.length, 'check') }}</template></span>
        </p>
        <ol ref="log" class="list-none [overscroll-behavior:contain] relative m-0 max-h-80 min-h-40 flex-[1_1_0] overflow-y-auto p-0">
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
              @click="toggle(row.step.first)"
            >
              <Icon name="lucide:chevron-right" class="[transition-property:rotate] size-3.5 duration-[160ms] ease-[var(--ease-out)] [@media(prefers-reduced-motion:reduce)]:transition-none" :class="row.open && '[rotate:90deg]'" aria-hidden="true" />
            </button>
            <span v-else-if="foldable && !row.child" class="grid h-[30px] w-[22px] shrink-0 place-items-center rounded-[6px] text-neutral-500 dark:text-neutral-400" aria-hidden="true" />
            <ExplorationsLearnerDrawingAnswersLogEntry :line="row.line" :state="stateOf(row.step)" :open="row.open" :compact="row.child" @click="seek(row.step.t)" />
          </li>
        </ol>
        <p v-if="summary.checks.length && after !== 'nothing'" class="m-0 text-[13px] text-neutral-500 dark:text-neutral-400">
          After the last check: {{ after }}
        </p>
      </Panel>
    </template>
  </div>
</template>

<style scoped>
/* The kind of an act, on the timeline and in its legend */
.tick[data-kind='draw'],
.key[data-kind='draw'] {
  background: rgb(115 115 115);
}

.tick[data-kind='label'],
.key[data-kind='label'] {
  background: rgb(59 130 246);
}

.tick[data-kind='undo'],
.key[data-kind='undo'] {
  background: rgb(244 63 94);
}

.tick[data-kind='check'],
.key[data-kind='check'] {
  background: rgb(16 185 129);
}

/* The dot on the head */
.head::before {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: inherit;
  translate: -50% 0;
}

/* The last act leaves some air before the next line */
.row[data-child='true']:has(+ .row:not([data-child='true'])) {
  margin-bottom: 4px;
}
</style>
