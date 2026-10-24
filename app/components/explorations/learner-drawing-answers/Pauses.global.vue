<script setup lang="ts">
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

const seconds = (ms: number) => `${Math.round(ms / 1000)} s`
</script>

<template>
  <figure class="my-8 flex flex-col gap-2 border border-neutral-200 rounded-xl p-3 dark:border-neutral-700/80 dark:bg-neutral-800/40">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <button type="button" class="[transition-property:scale,background-color] grid size-8 shrink-0 place-items-center rounded-lg bg-neutral-400/18 text-neutral-600 duration-[160ms] ease-[var(--ease-out)] [@media(prefers-reduced-motion:reduce)]:[transition-property:background-color] active:[scale:0.94] dark:bg-neutral-400/20 hover:bg-neutral-400/30 dark:text-neutral-300 focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 focus-visible:outline-solid dark:focus-visible:outline-neutral-100" :aria-label="playing ? 'Pause' : 'Play the session'" @click="playing ? stop() : play()">
        <Icon :name="playing ? 'lucide:pause' : 'lucide:play'" class="size-4" aria-hidden="true" />
      </button>
      <label class="min-w-0 flex flex-1 flex-wrap items-center gap-x-[10px] gap-y-1 text-[13px]">
        <span>A pause lasts at most</span>
        <input v-model.number="cap" type="range" class="[accent-color:rgb(115_115_115)] max-w-56 min-w-20 flex-[1_1_6rem] focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-offset-2 focus-visible:outline-solid dark:focus-visible:outline-neutral-100" min="0.2" max="10" step="0.2" :aria-valuetext="`${cap.toFixed(1)} seconds`">
        <output class="tabular-nums min-w-[2.2rem] font-medium">{{ cap.toFixed(1) }} s</output>
      </label>
      <SegmentedControl v-model="speed" label="Speed of the recording" :options="SPEEDS" class="shrink-0" />
    </div>

    <div class="flex flex-col gap-[6px]">
      <p class="m-0 flex items-baseline justify-between gap-2 text-[13px] font-medium">
        <span>The learner's time</span>
        <span class="tabular-nums text-neutral-500 font-normal dark:text-neutral-400">{{ mmss(real) }}</span>
      </p>
      <!-- The head follows the clock 1:1: no easing -->
      <div class="bar relative h-7" aria-hidden="true">
        <span v-for="item in upper" :key="item.key" class="absolute inset-y-[5px] rounded-[2px]" :style="{ left: `${item.left}%`, width: `max(${item.width}%, 3px)`, background: item.color }" />
        <span
          v-for="item in pauses"
          :key="item.from"
          class="pause absolute inset-y-0 grid place-items-center overflow-hidden whitespace-nowrap text-[12px] text-neutral-500 dark:text-neutral-400"
          :style="{ left: `${pct(item.from)}%`, width: `${pct(item.to - item.from)}%` }"
        >{{ seconds(item.to - item.from) }}</span>
        <span class="pointer-events-none absolute inset-y-0 w-0.5 rounded-[1px] bg-neutral-900 -ml-px dark:bg-neutral-100" :style="{ left: `${headUpper}%` }" />
      </div>
    </div>

    <svg class="block h-9 w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon v-for="link in links" :key="link.key" :points="link.points" class="fill-neutral-400/20" />
    </svg>

    <div class="flex flex-col gap-[6px]">
      <div class="bar relative h-7" aria-hidden="true">
        <span v-for="item in lower" :key="item.key" class="absolute inset-y-[5px] rounded-[2px]" :style="{ left: `${item.left}%`, width: `max(${item.width}%, 3px)`, background: item.color }" />
        <span class="pointer-events-none absolute inset-y-0 w-0.5 rounded-[1px] bg-neutral-900 -ml-px dark:bg-neutral-100" :style="{ left: `${headLower}%` }" />
      </div>
      <p class="m-0 flex items-baseline justify-between gap-2 text-[13px] font-medium">
        <span>The recording's clock</span>
        <span class="tabular-nums text-neutral-500 font-normal dark:text-neutral-400">{{ mmss(played) }}</span>
      </p>
    </div>
  </figure>
</template>

<style scoped>
.bar::before {
  content: '';
  position: absolute;
  inset: 50% 0 auto;
  height: 1px;
  background: rgb(163 163 163 / 0.4);
}

/* How long a pause was, where it was */
.pause::before {
  content: '';
  position: absolute;
  inset: 4px 0;
  border-inline: 1px dashed rgb(163 163 163 / 0.6);
}
</style>
