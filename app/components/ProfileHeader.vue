<script setup lang="ts">
import type { MascotState } from '~/utils/mascot'
import { animate, motion } from 'motion-v'
import { MASCOT_LABELS, mascotStateAt, minutesOfDay } from '~/utils/mascot'
import { BAND_LABELS, temperatureBand, WEATHER_LABELS } from '~/utils/weather'

interface Props {
  animate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  animate: true,
})

const { registerClick, open: openTetris } = useTetrisEasterEgg()
const { prefersReducedMotion } = usePrefersReducedMotion()
const { play } = useSound()

interface Particle {
  id: number
  size: number
  sx: number
  sy: number
  tx: number
  ty: number
  accent: boolean
}

let particleSeq = 0
const particles = ref<Particle[]>([])

/**
 * A burst of little dots on every click — more of them, and bigger, as the streak
 * nears the threshold. They launch from just past the photo's edge (measured live,
 * since the mobile/desktop photos differ in size) so they're visible against the
 * page instead of getting lost over the portrait.
 */
function spawnParticles(progress: number, triggered: boolean, target: HTMLElement) {
  const edgeRadius = Math.max(target.offsetWidth, target.offsetHeight) / 2
  const count = triggered ? 14 : Math.round(3 + progress * 5)
  const spread = triggered ? 40 : 14 + progress * 16
  const created = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const dirX = Math.cos(angle)
    const dirY = Math.sin(angle)
    const distance = edgeRadius + spread * (0.5 + Math.random() * 0.7)
    return {
      id: particleSeq++,
      size: triggered ? 7 + Math.random() * 4 : 5 + Math.random() * 3,
      // Start right at the photo's edge (not its center) so the dot never has to
      // travel across the portrait before becoming visible.
      sx: dirX * edgeRadius,
      sy: dirY * edgeRadius,
      tx: dirX * distance,
      ty: dirY * distance,
      accent: triggered,
    }
  })
  particles.value.push(...created)
  const ids = new Set(created.map(p => p.id))
  setTimeout(() => {
    particles.value = particles.value.filter(p => !ids.has(p.id))
  }, 650)
}

/**
 * A small wobble on every click gives feedback that something is building up,
 * without giving the easter egg away — the wobble grows slightly as the click
 * streak approaches the threshold, then pops harder right before the game opens.
 */
function handlePhotoClick(event: MouseEvent) {
  const { progress, triggered } = registerClick()
  const target = event.currentTarget as HTMLElement

  // Each tap gets heavier as the streak builds, then an opening cue hints at
  // what's about to open.
  if (triggered)
    play('open', { emphasis: 'strong' })
  else
    play('tap', { emphasis: progress < 0.4 ? 'subtle' : progress < 0.8 ? 'normal' : 'strong' })

  if (!prefersReducedMotion.value) {
    const amplitude = 1.5 + progress * 2.5
    animate(target, {
      rotate: triggered
        ? [0, -amplitude, amplitude, -amplitude / 2, 0]
        : [0, -amplitude, amplitude, 0],
      scale: triggered ? [1, 0.98, 1.015, 1] : [1, 0.99, 1.005, 1],
    }, {
      duration: triggered ? 0.4 : 0.2,
      ease: [0.34, 1.56, 0.64, 1],
    })
    spawnParticles(progress, triggered, target)
  }

  if (triggered)
    setTimeout(openTetris, prefersReducedMotion.value ? 0 : 180)
}

const socialLinks = [
  { icon: 'academicons:google-scholar', url: 'https://scholar.google.com/citations?hl=fr&user=r8AM0OIAAAAJ', label: 'Google Scholar' },
  { icon: 'uil:github-alt', url: 'https://github.com/remisaurel', label: 'GitHub' },
  { icon: 'uil:linkedin', url: 'https://www.linkedin.com/in/r%C3%A9mi-saurel/', label: 'LinkedIn' },
  { icon: 'i-simple-icons-x', url: 'https://twitter.com/remisaurel', label: 'X' },
]

// Local time in Toulouse; set after mount so the static HTML never carries a stale time
const TIMEZONE = 'Europe/Paris'
const TIME_FORMAT = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' })
const localTime = ref('--:--')
const minutesNow = ref<number | null>(null)
let clockTimer: ReturnType<typeof setInterval> | undefined

// The mascot follows the hour in Toulouse. `?mascot=sleep|code|music` forces it while developing.
const route = useRoute()
const manualMascotState = ref<MascotState | null>(null)
const mascotState = computed<MascotState | null>(() => {
  if (manualMascotState.value)
    return manualMascotState.value
  const forced = import.meta.dev ? route.query.mascot : undefined
  if (forced === 'sleep' || forced === 'code' || forced === 'music')
    return forced
  return minutesNow.value === null ? null : mascotStateAt(minutesNow.value)
})

// A click moves on to the next state, looping, until the page is reloaded
const MASCOT_ORDER: MascotState[] = ['sleep', 'code', 'music']

function cycleMascot() {
  if (!mascotState.value)
    return
  manualMascotState.value = MASCOT_ORDER[(MASCOT_ORDER.indexOf(mascotState.value) + 1) % MASCOT_ORDER.length]!
  play('tap', { emphasis: 'subtle' })
}

// Weather in Toulouse: the glyph says the sky, the colour says cold, mild or hot
const { weather, settled: weatherSettled } = useToulouseWeather()
// The weather and the mascot appear together, once both are known, so nothing pops in after the rest
const tileReady = computed(() => mascotState.value !== null && weatherSettled.value)
const BAND_COLORS = {
  cold: 'text-sky-600 dark:text-sky-400',
  mild: 'text-neutral-500 dark:text-neutral-400',
  hot: 'text-orange-600 dark:text-orange-400',
} as const
const weatherBand = computed(() => weather.value ? temperatureBand(weather.value.temperature) : null)
const weatherLabel = computed(() => {
  if (!weather.value || !weatherBand.value)
    return ''
  return `${WEATHER_LABELS[weather.value.kind]}, ${Math.round(weather.value.temperature)}°C, ${BAND_LABELS[weatherBand.value]}`
})

onMounted(() => {
  const tick = () => {
    const now = new Date()
    localTime.value = TIME_FORMAT.format(now)
    minutesNow.value = minutesOfDay(now, TIMEZONE)
  }
  tick()
  clockTimer = setInterval(tick, 10_000)
})

onBeforeUnmount(() => clearInterval(clockTimer))

const photoHover = useMotionHover({ scale: 1.02, rotate: -0.75 })

// The hold is timed here, not on the fill's `transitionend`: under prefers-reduced-motion
// every transition is shortened to ~0ms, which would navigate on a plain press.
const CV_HOLD_MS = 900
const isHoldingCv = ref(false)
let cvHoldTimer: ReturnType<typeof setTimeout> | undefined

function startCvHold() {
  if (isHoldingCv.value)
    return
  isHoldingCv.value = true
  cvHoldTimer = setTimeout(completeCvHold, CV_HOLD_MS)
}

function cancelCvHold() {
  clearTimeout(cvHoldTimer)
  isHoldingCv.value = false
}

onBeforeUnmount(() => clearTimeout(cvHoldTimer))

function completeCvHold() {
  if (!isHoldingCv.value)
    return
  isHoldingCv.value = false
  play('success', { emphasis: 'strong' })
  navigateTo('/failures')
}

// Entrance runs as the CSS `.enter` reveal, so it starts before hydration.
function enter(delay: number) {
  return {
    class: [props.animate && 'enter', '[--enter-blur:8px]'],
    style: { '--enter-delay': `${delay}s` },
  }
}

const PHOTO = {
  src: '/photo.png',
  alt: 'Rémi Saurel',
  width: 192,
  height: 210,
  format: 'webp',
  densities: 'x1 x2',
} as const
</script>

<template>
  <header class="relative">
    <div v-bind="enter(0.1)" class="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:justify-between sm:gap-8">
      <div class="flex items-center gap-4 sm:items-stretch sm:gap-5">
        <motion.div
          class="relative shrink-0 cursor-pointer"
          :while-hover="photoHover"
          :transition="{ type: 'spring', stiffness: 300, damping: 20 }"
          @click="handlePhotoClick"
        >
          <NuxtImg
            v-bind="PHOTO"
            :preload="{ fetchPriority: 'high' }"
            fetchpriority="high"
            class="object-cover h-auto w-20 sm:h-full sm:w-24"
          />
          <span
            v-for="p in particles"
            :key="p.id"
            class="[animation:photo-particle_650ms_var(--ease-out)_forwards] absolute left-1/2 top-1/2 rounded-full"
            :class="p.accent ? 'bg-amber-500' : 'bg-neutral-700 dark:bg-neutral-200'"
            :style="{ 'width': `${p.size}px`, 'height': `${p.size}px`, '--sx': `${p.sx}px`, '--sy': `${p.sy}px`, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` }"
          />
        </motion.div>

        <div class="min-w-0 flex flex-col gap-1">
          <h1 class="m-0 text-lg font-medium tracking-tight sm:text-xl">
            Rémi Saurel
          </h1>
          <p class="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            PhD Student
          </p>
          <p class="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            IRIT Lab, Toulouse
          </p>
          <span class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            remi.saurel [at] irit.fr
          </span>
        </div>
      </div>

      <!-- Bento: the clock takes three cells, the CV one, each link takes one -->
      <div class="bento grid grid-cols-5 gap-1.5 sm:grid-rows-[1fr_auto] sm:grid-cols-4 sm:w-[12rem]">
        <!-- Two rows share a centre line: the place with the weather, the time with the mascot -->
        <div class="bento-tile grid col-span-5 grid-cols-[auto_1fr_auto_auto] content-center items-center gap-x-2.5 px-3 py-1.5 sm:col-span-3 sm:grid-cols-[1fr_auto] sm:gap-x-3 sm:gap-y-2 sm:py-2 sm:pl-3 sm:pr-3.5">
          <span class="col-start-1 row-start-1 h-4 flex items-center text-[11px] text-neutral-500 leading-none dark:text-neutral-400">Toulouse</span>
          <!-- Only after the fetch: the static page has no weather -->
          <span
            v-if="tileReady && weather && weatherBand"
            class="mascot-in col-start-3 row-start-1 h-4 flex items-center justify-self-end gap-1 sm:col-start-2"
            :class="BAND_COLORS[weatherBand]"
            :title="weatherLabel"
            role="img"
            :aria-label="weatherLabel"
          >
            <WeatherGlyph :kind="weather.kind" :night="!weather.isDay" class="size-4" />
            <span class="tabular-nums text-[11px] leading-none">{{ Math.round(weather.temperature) }}°</span>
          </span>
          <time class="tabular-nums col-start-2 row-start-1 h-6 flex items-center text-sm text-neutral-700 font-normal leading-none tracking-tight sm:col-start-1 sm:row-start-2 sm:text-base dark:text-neutral-300">{{ localTime }}</time>
          <!-- Only after mount: the hour decides what it does, and the static page has no hour -->
          <button
            v-if="tileReady && mascotState"
            type="button"
            class="col-start-4 row-start-1 flex pressable justify-self-end rounded-md sm:col-start-2 sm:row-start-2"
            :title="`${MASCOT_LABELS[mascotState]}. Click to change`"
            :aria-label="`${MASCOT_LABELS[mascotState]}. Click to change`"
            @click="cycleMascot"
          >
            <HomeMascot
              :key="mascotState"
              :state="mascotState"
              class="mascot-in size-5 text-neutral-400 sm:size-6 dark:text-neutral-500"
            />
          </button>
        </div>

        <div class="relative col-span-1 h-9 sm:h-auto">
          <button
            type="button"
            title="CV — coming soon"
            aria-label="CV — coming soon"
            class="bento-tile [-webkit-touch-callout:none] relative size-full flex select-none items-center justify-center overflow-hidden border-dashed text-left text-neutral-400 dark:text-neutral-500"
            @pointerdown="startCvHold"
            @pointerup="cancelCvHold"
            @pointerleave="cancelCvHold"
            @pointercancel="cancelCvHold"
            @keydown.enter.space.prevent="startCvHold"
            @keyup.enter.space="cancelCvHold"
            @blur="cancelCvHold"
            @contextmenu.prevent
          >
            <span
              class="pointer-events-none absolute inset-0 z-2 bg-[rgb(var(--annotation))]"
              :class="isHoldingCv ? '[clip-path:inset(0_0_0_0)] [transition:clip-path_900ms_linear]' : '[clip-path:inset(0_100%_0_0)] [transition:clip-path_200ms_var(--ease-out)]'"
            />
            <span class="pointer-events-none relative z-1 size-full flex flex-col items-center justify-center gap-0.5 px-1">
              <Icon name="uil:padlock" class="size-3.5" />
              <span class="text-xs font-medium tracking-tight sm:text-sm">CV</span>
            </span>
            <!-- White copy of the label, revealed by the same sweep as the fill, so the text turns white only once the fill reaches it -->
            <span
              class="pointer-events-none absolute inset-0 z-3 flex flex-col items-center justify-center gap-0.5 px-1 text-white"
              :class="isHoldingCv ? '[clip-path:inset(0_0_0_0)] [transition:clip-path_900ms_linear]' : '[clip-path:inset(0_100%_0_0)] [transition:clip-path_200ms_var(--ease-out)]'"
              aria-hidden="true"
            >
              <Icon name="uil:padlock" class="size-3.5" />
              <span class="text-sm font-medium tracking-tight">CV</span>
            </span>
          </button>
          <span class="font-hand pointer-events-none absolute z-4 flex flex-col rotate-[-9deg] select-none items-center whitespace-nowrap text-[0.95rem] text-[rgb(var(--annotation))] font-700 leading-none -right-[0.35rem] -top-[0.85rem]" aria-hidden="true">
            Soon
            <svg class="mt-[-1px] h-[8px] w-[28px]" viewBox="0 0 44 12" aria-hidden="true">
              <path d="M2 6c6-4 10-4 15-1.5s9 3 14-1 8-2 11 1" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </span>
        </div>

        <a
          v-for="link in socialLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          :title="link.label"
          class="bento-tile bento-link h-9 flex pressable items-center justify-center text-neutral-500 sm:aspect-square sm:h-auto dark:text-neutral-400"
        >
          <Icon :name="link.icon" class="size-3.5 sm:size-4" />
        </a>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* The same small sheet as the tiles of the posts and explorations lists */
.bento-tile {
  --mascot-bg: white;
  border: 1px solid rgb(229 229 229);
  border-radius: 0.75rem;
  background: white;
  transition:
    transform 160ms var(--ease-out),
    border-color 150ms var(--ease-out),
    box-shadow 160ms var(--ease-out),
    color 150ms var(--ease-out);
}

.dark .bento-tile {
  --mascot-bg: rgb(38 38 38);
  border-color: rgb(64 64 64 / 0.8);
  background: rgb(38 38 38);
  box-shadow:
    0 1px 2px rgb(0 0 0 / 0.04),
    0 2px 6px -2px rgb(0 0 0 / 0.06);
}

.mascot-in {
  animation: mascot-in 0.4s var(--ease-out) both;
}

@keyframes mascot-in {
  from { opacity: 0; transform: translateY(3px); }
}

@media (prefers-reduced-motion: reduce) {
  .mascot-in {
    animation: none;
  }
}

button.bento-tile {
  border-style: dashed;
}

@media (hover: hover) and (pointer: fine) {
  .bento-link:hover {
    border-color: rgb(163 163 163);
    color: rgb(23 23 23);
  }

  .dark .bento-link:hover {
    border-color: rgb(115 115 115);
    color: rgb(245 245 245);
    box-shadow:
      0 1px 2px rgb(0 0 0 / 0.06),
      0 3px 8px -3px rgb(0 0 0 / 0.1);
  }
}
</style>
