<script setup lang="ts">
import type { Kind } from '~/utils/logLine'
import { useRafFn } from '@vueuse/core'
import { CELL_PARTS } from '~/exercises/cell'
import { buildSession } from '~/utils/demoSession'
import { KIND_COLORS, kindOf } from '~/utils/logLine'
import { activeSpans, squeeze } from '~/utils/session'
import { mmss } from '~/utils/trace'

// The same session on two clocks. On top, the time of the learner, with its pauses. Below, the clock the
// recording plays on, where a pause lasts at most the time you set. Both bars use one scale, so the lower
// one is shorter by what was skipped. The session is written by hand, with two long pauses in it, and few
// acts so that each block can be seen.
const events = buildSession([
  { at: 3, stroke: 2 },
  { at: 6, stroke: 1.5 },
  { at: 8.5, label: 'nucleus' },
  { at: 27, stroke: 3 },
  { at: 30, label: 'membrane' },
  { at: 45, stroke: 2.5 },
  { at: 47, check: true },
], CELL_PARTS)

const real = events.at(-1)!.t
const spans = activeSpans(events)

// Seconds: the longest pause the recording spends time on
const cap = ref(0.6)
const clock = computed(() => squeeze(spans, cap.value * 1000))

const pct = (ms: number) => ms / real * 100

const seconds = (ms: number) => `${Math.round(ms / 1000)} s`
const secondsPrecise = (ms: number) => `${(ms / 1000).toFixed(1)} s`

const upper = spans.map(([from, to], index) => ({
  key: index,
  color: KIND_COLORS[kindOf(events[index]!.type)],
  left: pct(from),
  width: pct(to - from),
}))

const lower = computed(() => spans.map(([from, to], index) => ({
  ...upper[index]!,
  left: pct(clock.value.clockAt(from)),
  width: pct(clock.value.clockAt(to) - clock.value.clockAt(from)),
})))

// Acts with no real pause between them are one stretch of work. What lies between two stretches is a pause
const PAUSE = 8000

const stretches = spans.reduce<[number, number][]>((all, [from, to]) => {
  const last = all.at(-1)
  if (last && from - last[1] < PAUSE)
    last[1] = to
  else
    all.push([from, to])
  return all
}, [])

const pauses = stretches.slice(1).map(([to], index) => ({ from: stretches[index]![1], to }))

// The two bars are joined: where a stretch of work is above, it is below, and the pause between is squeezed
const links = computed(() => stretches.map(([from, to], index) => {
  const x = (n: number) => n.toFixed(3)
  const a = pct(clock.value.clockAt(from))
  const b = pct(clock.value.clockAt(to))
  return { key: index, points: `${x(pct(from))},0 ${x(pct(to))},0 ${x(b)},100 ${x(a)},100` }
}))

// --- Hovering: what is under the pointer is followed from one bar to the other ---

interface Focus {
  kind: 'act' | 'pause'
  index: number
}

const focus = ref<Focus | null>(null)

const isFocused = (kind: Focus['kind'], index: number) => focus.value?.kind === kind && focus.value.index === index

// With a focus, every act but the one followed fades back
const faded = (index: number) => focus.value !== null && !isFocused('act', index)

// The act, from where it was to where it is on the recording's clock
const matches = computed(() => spans.map(([from, to], index) => {
  const x = (n: number) => n.toFixed(3)
  const a = pct(clock.value.clockAt(from))
  const b = pct(clock.value.clockAt(to))
  return { key: index, color: upper[index]!.color, points: `${x(pct(from))},0 ${x(pct(to))},0 ${x(b)},100 ${x(a)},100` }
}))

// The pause, from its length to what the recording spends on it
const gaps = computed(() => pauses.map(({ from, to }, index) => {
  const x = (n: number) => n.toFixed(3)
  const a = pct(clock.value.clockAt(from))
  const b = pct(clock.value.clockAt(to))
  return {
    key: index,
    left: a,
    width: b - a,
    middle: (pct(from) + pct(to) + a + b) / 4,
    points: `${x(pct(from))},0 ${x(pct(to))},0 ${x(b)},100 ${x(a)},100`,
    spent: clock.value.clockAt(to) - clock.value.clockAt(from),
    length: to - from,
  }
}))

const hovered = computed(() => focus.value?.kind === 'pause' ? gaps.value[focus.value.index] : undefined)

const ACTS: Record<Kind, string> = {
  draw: 'a stroke',
  label: 'a label',
  undo: 'an undo',
  check: 'a check',
}

// In the margin: where the act or the pause is on each clock
const note = computed(() => {
  if (hovered.value)
    return `${seconds(hovered.value.length)} of silence\nplayed in ${secondsPrecise(hovered.value.spent)}`
  if (focus.value?.kind !== 'act')
    return null
  const { t, type } = events[focus.value.index]!
  return `${ACTS[kindOf(type)]} at ${mmss(t)}\nplays at ${mmss(clock.value.clockAt(t))}`
})

// --- Playing: the clock runs at one speed, and the learner's time jumps over the pauses ---

type Speed = '1' | '1.5' | '2'

const SPEEDS: { id: Speed, label: string }[] = [
  { id: '1', label: '1×' },
  { id: '1.5', label: '1.5×' },
  { id: '2', label: '2×' },
]

// Twice as fast by default: the clock of the recording is already short, and watching it is not the point
const speed = ref<Speed>('2')
const position = ref(0)
const playing = ref(false)

const { pause, resume } = useRafFn(({ delta }) => {
  position.value = Math.min(clock.value.duration, position.value + delta * Number(speed.value))
  if (position.value >= clock.value.duration)
    stop()
}, { immediate: false })

function play() {
  if (position.value >= clock.value.duration)
    position.value = 0
  playing.value = true
  resume()
}

function stop() {
  playing.value = false
  pause()
}

onBeforeUnmount(stop)

// A new cap keeps the recording where it was in the learner's time
watch(clock, (next, previous) => {
  position.value = next.clockAt(previous.timeAt(position.value))
})

const headUpper = computed(() => pct(clock.value.timeAt(position.value)))
const headLower = computed(() => pct(position.value))
const played = computed(() => clock.value.duration)
</script>

<template>
  <Panel as="figure" padding="lg" class="relative my-8 flex flex-col select-none gap-2">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <PlayButton :playing="playing" play-label="Play the session" @click="playing ? stop() : play()" />
      <RangeInput v-model="cap" :min="0.2" :max="10" :step="0.2" class="flex-1">
        A pause lasts at most
      </RangeInput>
      <SegmentedControl v-model="speed" label="Speed of the recording" :options="SPEEDS" class="shrink-0" />
    </div>

    <div class="flex flex-col gap-[6px]">
      <p class="m-0 flex items-baseline justify-between gap-2 text-[13px] font-medium">
        <span>The learner's time</span>
        <span class="tabular-nums text-neutral-500 font-normal dark:text-neutral-400">{{ mmss(real) }}</span>
      </p>
      <!-- The head follows the clock 1:1: no easing -->
      <div class="bar relative h-7" aria-hidden="true">
        <span
          v-for="item in upper"
          :key="item.key"
          class="act absolute inset-y-[5px] z-10 rounded-[2px] transition-opacity duration-150"
          :class="faded(item.key) ? 'opacity-25' : ''"
          :style="{ left: `${item.left}%`, width: `max(${item.width}%, 3px)`, background: item.color }"
          @pointerenter="focus = { kind: 'act', index: item.key }"
          @pointerleave="focus = null"
        />
        <span
          v-for="(item, index) in pauses"
          :key="item.from"
          class="pause absolute inset-y-0 grid place-items-center overflow-hidden whitespace-nowrap text-[12px] transition-colors duration-150"
          :class="isFocused('pause', index) ? 'bg-neutral-400/15 text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400'"
          :style="{ left: `${pct(item.from)}%`, width: `${pct(item.to - item.from)}%` }"
          @pointerenter="focus = { kind: 'pause', index }"
          @pointerleave="focus = null"
        >{{ seconds(item.to - item.from) }}</span>
        <span class="pointer-events-none absolute inset-y-0 z-20 w-0.5 rounded-[1px] bg-neutral-900 -ml-px dark:bg-neutral-100" :style="{ left: `${headUpper}%` }" />
      </div>
    </div>

    <div class="pointer-events-none relative">
      <svg class="block h-9 w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon v-for="link in links" :key="link.key" :points="link.points" class="fill-neutral-400/20" />
        <polygon v-if="hovered" :points="hovered.points" class="fill-neutral-400/30" />
        <polygon
          v-for="item in matches"
          :key="item.key"
          :points="item.points"
          class="transition-opacity duration-150"
          :class="isFocused('act', item.key) ? 'opacity-100' : 'opacity-0'"
          :style="{ fill: item.color, fillOpacity: 0.3, stroke: item.color, strokeWidth: 1, vectorEffect: 'non-scaling-stroke' }"
        />
      </svg>
      <span
        v-if="hovered"
        class="tabular-nums absolute top-1/2 whitespace-nowrap text-[12px] text-neutral-900 -translate-x-1/2 -translate-y-1/2 dark:text-neutral-100"
        :style="{ left: `${hovered.middle}%` }"
      >{{ seconds(hovered.length) }} → {{ secondsPrecise(hovered.spent) }}</span>
    </div>

    <div class="flex flex-col gap-[6px]">
      <div class="bar relative h-7" aria-hidden="true">
        <span
          v-if="hovered"
          class="absolute inset-y-0 rounded-[2px] bg-neutral-400/40"
          :style="{ left: `${hovered.left}%`, width: `max(${hovered.width}%, 3px)` }"
        />
        <span
          v-for="item in lower"
          :key="item.key"
          class="act absolute inset-y-[5px] z-10 rounded-[2px] transition-opacity duration-150"
          :class="faded(item.key) ? 'opacity-25' : ''"
          :style="{ left: `${item.left}%`, width: `max(${item.width}%, 3px)`, background: item.color }"
          @pointerenter="focus = { kind: 'act', index: item.key }"
          @pointerleave="focus = null"
        />
        <span class="pointer-events-none absolute inset-y-0 z-20 w-0.5 rounded-[1px] bg-neutral-900 -ml-px dark:bg-neutral-100" :style="{ left: `${headLower}%` }" />
      </div>
      <p class="m-0 flex items-baseline justify-between gap-2 text-[13px] font-medium">
        <span>The recording's clock</span>
        <span class="tabular-nums text-neutral-500 font-normal dark:text-neutral-400">{{ mmss(played) }}</span>
      </p>
    </div>

    <MarginNote :note="note" hint="point at a block or a pause" />
  </Panel>
</template>

<style scoped>
.bar::before {
  content: '';
  position: absolute;
  inset: 50% 0 auto;
  height: 1px;
  background: rgb(163 163 163 / 0.4);
}

/* A wider target than the block, since some are a few pixels wide */
.act::after {
  content: '';
  position: absolute;
  inset: -5px -4px;
}

/* How long a pause was, where it was */
.pause::before {
  content: '';
  position: absolute;
  inset: 4px 0;
  border-inline: 1px dashed rgb(163 163 163 / 0.6);
}
</style>
