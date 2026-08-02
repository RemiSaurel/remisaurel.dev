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

const socialLinksBeforeCv = [
  { icon: 'academicons:google-scholar', url: 'https://scholar.google.com/citations?hl=fr&user=r8AM0OIAAAAJ', label: 'Google Scholar' },
]
const socialLinksAfterCv = [
  { icon: 'uil:github-alt', url: 'https://github.com/remisaurel', label: 'GitHub' },
  { icon: 'uil:linkedin', url: 'https://www.linkedin.com/in/r%C3%A9mi-saurel/', label: 'LinkedIn' },
  { icon: 'i-simple-icons-x', url: 'https://twitter.com/remisaurel', label: 'X' },
]

const socialHover = useMotionHover({ scale: 1.08, y: -2 })
const photoHover = useMotionHover({ scale: 1.02, rotate: -0.75 })

const isHoldingCv = ref(false)

function startCvHold() {
  isHoldingCv.value = true
}

function cancelCvHold() {
  isHoldingCv.value = false
}

function completeCvHold() {
  if (!isHoldingCv.value)
    return
  isHoldingCv.value = false
  navigateTo('/failures')
}

const transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94],
}

function computedTransition(delay: number) {
  if (prefersReducedMotion.value) {
    return { duration: 0 }
  }
  return props.animate ? { ...transition, delay } : { duration: 0 }
}

function computedInitial(y: number) {
  return props.animate && !prefersReducedMotion.value
    ? { opacity: 0, y, filter: 'blur(8px)' }
    : { opacity: 1, y: 0, filter: 'blur(0px)' }
}
</script>

<template>
  <aside class="relative lg:sticky lg:top-8">
    <!-- Mobile: Horizontal layout with large photo -->
    <motion.div
      :initial="computedInitial(15)"
      :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
      :transition="computedTransition(0.1)"
      class="lg:hidden"
    >
      <div class="flex items-start gap-4">
        <!-- Photo same size as desktop -->
        <motion.div
          class="relative shrink-0 cursor-pointer"
          :while-hover="photoHover"
          :transition="{ type: 'spring', stiffness: 300, damping: 20 }"
          @click="handlePhotoClick"
        >
          <NuxtImg
            src="/photo.png"
            alt="Rémi Saurel"
            class="w-32"
          />
          <span
            v-for="p in particles"
            :key="p.id"
            class="[animation:photo-particle_650ms_var(--ease-out)_forwards] absolute left-1/2 top-1/2 rounded-full"
            :class="p.accent ? 'bg-amber-500' : 'bg-neutral-700 dark:bg-neutral-200'"
            :style="{ 'width': `${p.size}px`, 'height': `${p.size}px`, '--sx': `${p.sx}px`, '--sy': `${p.sy}px`, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` }"
          />
        </motion.div>

        <!-- Info on right -->
        <div class="min-w-0 flex flex-col gap-1 pt-1">
          <h1 class="m-0 text-lg font-medium tracking-tight">
            Rémi Saurel
          </h1>
          <p class="m-0 text-sm text-neutral-500 dark:text-neutral-400">
            PhD Student
          </p>
          <p class="m-0 text-sm text-neutral-400 dark:text-neutral-500">
            IRIT Lab, Toulouse
          </p>
          <span class="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            remi.saurel [at] irit.fr
          </span>
        </div>
      </div>

      <!-- Social links below -->
      <div class="mt-4 flex items-center gap-2">
        <motion.a
          v-for="link in socialLinksBeforeCv"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          class="size-8 inline-flex pressable items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
          :while-hover="socialHover"
          :transition="{ type: 'spring', stiffness: 400, damping: 17 }"
        >
          <Icon :name="link.icon" class="size-4" />
        </motion.a>

        <div class="relative size-8 shrink-0">
          <button
            type="button"
            title="CV — coming soon"
            aria-label="CV — coming soon"
            class="[-webkit-touch-callout:none] relative size-8 inline-flex pressable select-none items-center justify-center overflow-hidden border border-neutral-300 border-dashed text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
            @pointerdown="startCvHold"
            @pointerup="cancelCvHold"
            @pointerleave="cancelCvHold"
            @pointercancel="cancelCvHold"
            @contextmenu.prevent
          >
            <Icon name="uil:padlock" class="pointer-events-none absolute inset-0 z-1 m-auto size-4" />
            <span
              class="pointer-events-none absolute inset-0 z-2 bg-[rgb(244_114_182)]"
              :class="isHoldingCv ? '[clip-path:inset(0_0_0_0)] [transition:clip-path_900ms_linear]' : '[clip-path:inset(0_100%_0_0)] [transition:clip-path_200ms_var(--ease-out)]'"
              @transitionend="completeCvHold"
            />
            <Icon
              name="uil:padlock"
              class="pointer-events-none absolute inset-0 z-3 m-auto size-4 text-white"
              :class="isHoldingCv ? '[clip-path:inset(0_0_0_0)] [transition:clip-path_900ms_linear]' : '[clip-path:inset(0_100%_0_0)] [transition:clip-path_200ms_var(--ease-out)]'"
            />
          </button>
          <span class="pointer-events-none absolute flex flex-col rotate-[-9deg] select-none items-center whitespace-nowrap text-[0.62rem] text-[rgb(244_114_182)] font-700 tracking-[0.02em] -right-[0.65rem] -top-[0.85rem]" aria-hidden="true">
            Soon
            <svg class="mt-[-3px] h-[8px] w-[28px]" viewBox="0 0 44 12" aria-hidden="true">
              <path d="M2 6c6-4 10-4 15-1.5s9 3 14-1 8-2 11 1" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </span>
        </div>

        <motion.a
          v-for="link in socialLinksAfterCv"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          class="size-8 inline-flex pressable items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
          :while-hover="socialHover"
          :transition="{ type: 'spring', stiffness: 400, damping: 17 }"
        >
          <Icon :name="link.icon" class="size-4" />
        </motion.a>
      </div>
    </motion.div>

    <!-- Desktop: Original vertical layout -->
    <div class="hidden flex-col gap-3 lg:flex">
      <!-- Photo -->
      <motion.div
        :initial="computedInitial(15)"
        :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :transition="computedTransition(0.1)"
      >
        <motion.div
          class="relative cursor-pointer"
          :while-hover="photoHover"
          :transition="{ type: 'spring', stiffness: 300, damping: 20 }"
          @click="handlePhotoClick"
        >
          <NuxtImg
            src="/photo.png"
            alt="Rémi Saurel"
            class="max-w-48 w-full transition-all duration-300"
          />
          <span
            v-for="p in particles"
            :key="p.id"
            class="[animation:photo-particle_650ms_var(--ease-out)_forwards] absolute left-1/2 top-1/2 rounded-full"
            :class="p.accent ? 'bg-amber-500' : 'bg-neutral-700 dark:bg-neutral-200'"
            :style="{ 'width': `${p.size}px`, 'height': `${p.size}px`, '--sx': `${p.sx}px`, '--sy': `${p.sy}px`, '--tx': `${p.tx}px`, '--ty': `${p.ty}px` }"
          />
        </motion.div>
      </motion.div>

      <!-- Name & Title -->
      <motion.div
        :initial="computedInitial(15)"
        :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :transition="computedTransition(0.2)"
        class="flex flex-col gap-0.5"
      >
        <h1 class="m-0 text-lg font-medium tracking-tight">
          Rémi Saurel
        </h1>
        <p class="m-0 text-sm text-neutral-500 dark:text-neutral-400">
          PhD Student at IRIT Lab, Toulouse
        </p>
      </motion.div>

      <!-- Contact -->
      <motion.div
        :initial="computedInitial(15)"
        :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :transition="computedTransition(0.25)"
        class="flex flex-col gap-1"
      >
        <span class="text-sm text-neutral-500 dark:text-neutral-400">
          remi.saurel [at] irit.fr
        </span>
      </motion.div>

      <!-- Social Links -->
      <motion.div
        :initial="computedInitial(15)"
        :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
        :transition="computedTransition(0.3)"
        class="flex gap-2"
      >
        <motion.a
          v-for="link in socialLinksBeforeCv"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          class="size-8 inline-flex pressable items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
          :while-hover="socialHover"
          :transition="{ type: 'spring', stiffness: 400, damping: 17 }"
        >
          <Icon :name="link.icon" class="size-4" />
        </motion.a>

        <div class="relative size-8 shrink-0">
          <button
            type="button"
            title="CV — coming soon"
            aria-label="CV — coming soon"
            class="[-webkit-touch-callout:none] relative size-8 inline-flex pressable select-none items-center justify-center overflow-hidden border border-neutral-300 border-dashed text-neutral-400 dark:border-neutral-700 dark:text-neutral-500"
            @pointerdown="startCvHold"
            @pointerup="cancelCvHold"
            @pointerleave="cancelCvHold"
            @pointercancel="cancelCvHold"
            @contextmenu.prevent
          >
            <Icon name="uil:padlock" class="pointer-events-none absolute inset-0 z-1 m-auto size-4" />
            <span
              class="pointer-events-none absolute inset-0 z-2 bg-[rgb(244_114_182)]"
              :class="isHoldingCv ? '[clip-path:inset(0_0_0_0)] [transition:clip-path_900ms_linear]' : '[clip-path:inset(0_100%_0_0)] [transition:clip-path_200ms_var(--ease-out)]'"
              @transitionend="completeCvHold"
            />
            <Icon
              name="uil:padlock"
              class="pointer-events-none absolute inset-0 z-3 m-auto size-4 text-white"
              :class="isHoldingCv ? '[clip-path:inset(0_0_0_0)] [transition:clip-path_900ms_linear]' : '[clip-path:inset(0_100%_0_0)] [transition:clip-path_200ms_var(--ease-out)]'"
            />
          </button>
          <span class="pointer-events-none absolute flex flex-col rotate-[-9deg] select-none items-center whitespace-nowrap text-[0.62rem] text-[rgb(244_114_182)] font-700 tracking-[0.02em] -right-[0.65rem] -top-[0.85rem]" aria-hidden="true">
            Soon
            <svg class="mt-[-3px] h-[8px] w-[28px]" viewBox="0 0 44 12" aria-hidden="true">
              <path d="M2 6c6-4 10-4 15-1.5s9 3 14-1 8-2 11 1" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" />
            </svg>
          </span>
        </div>

        <motion.a
          v-for="link in socialLinksAfterCv"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          class="size-8 inline-flex pressable items-center justify-center bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-900 hover:text-white dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
          :while-hover="socialHover"
          :transition="{ type: 'spring', stiffness: 400, damping: 17 }"
        >
          <Icon :name="link.icon" class="size-4" />
        </motion.a>
      </motion.div>
    </div>
  </aside>
</template>
