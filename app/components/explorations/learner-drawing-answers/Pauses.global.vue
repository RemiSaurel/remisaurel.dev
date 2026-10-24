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
  <figure class="panel my-8">
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
      <button type="button" class="play" :aria-label="playing ? 'Pause' : 'Play the session'" @click="playing ? stop() : play()">
        <Icon :name="playing ? 'lucide:pause' : 'lucide:play'" class="size-4" aria-hidden="true" />
      </button>
      <label class="cap">
        <span>A pause lasts at most</span>
        <input v-model.number="cap" type="range" min="0.2" max="10" step="0.2" :aria-valuetext="`${cap.toFixed(1)} seconds`">
        <output class="tabular-nums">{{ cap.toFixed(1) }} s</output>
      </label>
      <SegmentedControl v-model="speed" label="Speed of the recording" :options="SPEEDS" class="speed" />
    </div>

    <div class="row">
      <p class="caption">
        <span>The learner's time</span>
        <span class="tabular-nums">{{ mmss(real) }}</span>
      </p>
      <div class="bar" aria-hidden="true">
        <span v-for="item in upper" :key="item.key" class="block" :style="{ left: `${item.left}%`, width: `max(${item.width}%, 3px)`, background: item.color }" />
        <span
          v-for="item in pauses"
          :key="item.from"
          class="pause"
          :style="{ left: `${pct(item.from)}%`, width: `${pct(item.to - item.from)}%` }"
        >{{ seconds(item.to - item.from) }}</span>
        <span class="head" :style="{ left: `${headUpper}%` }" />
      </div>
    </div>

    <svg class="links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <polygon v-for="link in links" :key="link.key" :points="link.points" class="link" />
    </svg>

    <div class="row">
      <div class="bar" aria-hidden="true">
        <span v-for="item in lower" :key="item.key" class="block" :style="{ left: `${item.left}%`, width: `max(${item.width}%, 3px)`, background: item.color }" />
        <span class="head" :style="{ left: `${headLower}%` }" />
      </div>
      <p class="caption">
        <span>The recording's clock</span>
        <span class="tabular-nums">{{ mmss(played) }}</span>
      </p>
    </div>
  </figure>
</template>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid rgb(229 229 229);
  border-radius: 12px;
}

.dark .panel {
  border-color: rgb(64 64 64 / 0.8);
  background: rgb(38 38 38 / 0.4);
}

.row {
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.bar {
  position: relative;
  height: 28px;
}

.bar::before {
  content: '';
  position: absolute;
  inset: 50% 0 auto;
  height: 1px;
  background: rgb(163 163 163 / 0.4);
}

.block {
  position: absolute;
  top: 5px;
  bottom: 5px;
  border-radius: 2px;
}

/* How long a pause was, where it was */
.pause {
  position: absolute;
  top: 0;
  bottom: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  font-size: 12px;
  color: rgb(115 115 115);
  white-space: nowrap;
}

.dark .pause {
  color: rgb(163 163 163);
}

.pause::before {
  content: '';
  position: absolute;
  inset: 4px 0;
  border-inline: 1px dashed rgb(163 163 163 / 0.6);
}

/* Follows the clock 1:1: no easing */
.head {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  border-radius: 1px;
  background: rgb(23 23 23);
  pointer-events: none;
}

.dark .head {
  background: rgb(245 245 245);
}

.link {
  fill: rgb(163 163 163 / 0.2);
}

.links {
  display: block;
  width: 100%;
  height: 36px;
}

.play {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 8px;
  background: rgb(163 163 163 / 0.18);
  color: rgb(82 82 82);
  transition: scale 160ms var(--ease-out), background-color 160ms var(--ease-out);
}

.dark .play {
  background: rgb(163 163 163 / 0.2);
  color: rgb(212 212 212);
}

@media (hover: hover) {
  .play:hover {
    background: rgb(163 163 163 / 0.3);
  }
}

.play:active {
  scale: 0.94;
}

.cap {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 10px;
  min-width: 0;
  font-size: 13px;
}

.cap input {
  flex: 1 1 6rem;
  min-width: 5rem;
  max-width: 14rem;
  accent-color: rgb(115 115 115);
}

.cap output {
  min-width: 2.2rem;
  font-weight: 500;
}

.speed {
  flex-shrink: 0;
}

.play:focus-visible,
.cap input:focus-visible {
  outline: 2px solid rgb(23 23 23);
  outline-offset: 2px;
}

.dark .play:focus-visible,
.dark .cap input:focus-visible {
  outline-color: rgb(245 245 245);
}

@media (prefers-reduced-motion: reduce) {
  .play {
    transition: background-color 160ms var(--ease-out);
  }
}
</style>
