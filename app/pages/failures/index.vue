<script setup lang="ts">
import { motion } from 'motion-v'
import { failures } from '~/failures/failures'

useSeoMeta({
  title: 'Failures',
  ogTitle: 'Failures · Rémi Saurel',
  description: 'The failure resume: rejected papers, failed experiments and abandoned projects, and what each one taught me.',
  ogImage: '/home.png',
  twitterCard: 'summary_large_image',
})

const { prefersReducedMotion } = usePrefersReducedMotion()

const transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94],
}

function reveal(delay: number) {
  if (prefersReducedMotion.value)
    return { initial: { opacity: 1, y: 0 }, transition: { duration: 0 } }
  return { initial: { opacity: 0, y: 15 }, transition: { ...transition, delay } }
}

const sortedFailures = computed(() => {
  return failures.toSorted((a, b) => b.date.getTime() - a.date.getTime())
})

const rejectionCount = computed(() => failures.filter(f => f.type === 'paper').length)
</script>

<template>
  <div class="failures-root flex flex-col gap-8">
    <motion.div
      :initial="reveal(0).initial"
      :animate="{ opacity: 1, y: 0 }"
      :transition="reveal(0).transition"
    >
      <h5 class="m-0 text-2xl font-semibold">
        Failures
      </h5>
      <p class="mt-2 max-w-2xl text-neutral-500 dark:text-neutral-400">
        CVs only show what worked. This is the rest: papers that got rejected,
        experiments that went nowhere, projects I quietly shelved. Tap a card
        to see what each one taught me.
      </p>
      <p class="section-title mt-6 text-neutral-400 dark:text-neutral-500">
        <span class="tabular-nums">{{ rejectionCount }}</span> rejections and counting
      </p>
    </motion.div>

    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
      <motion.div
        v-for="(failure, index) in sortedFailures"
        :key="failure.id"
        :initial="prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }"
        :while-in-view="prefersReducedMotion ? undefined : { opacity: 1, y: 0 }"
        :viewport="{ once: true, margin: '-50px' }"
        :transition="prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }"
      >
        <FailureCard :failure="failure" />
      </motion.div>
    </div>
  </div>
</template>
