<script setup lang="ts">
import { animate, motion } from 'motion-v'

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

const photoHover = useMotionHover({ scale: 1.02, rotate: -0.75 })

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
    <div v-bind="enter(0.1)" class="flex items-center gap-4 sm:items-stretch sm:gap-5">
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
  </header>
</template>
