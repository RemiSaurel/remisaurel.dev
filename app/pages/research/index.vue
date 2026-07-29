<script setup lang="ts">
import { motion } from 'motion-v'

useSeoMeta({
  title: 'Research',
  ogTitle: 'Research · Rémi Saurel',
  description: 'Research landscape: learning analytics dashboards, generative AI in education, human-AI interaction and responsible AI.',
  ogImage: '/home.png',
  twitterCard: 'summary_large_image',
})

const { prefersReducedMotion } = usePrefersReducedMotion()

const approach = [
  {
    title: 'Design-Based Research',
    body: 'Iterating between design, theory and deployment in ecological contexts, so each experiment feeds both the tool, scientific contributions and the model behind it.',
  },
  {
    title: 'Mixed methods',
    body: 'Interaction traces and benchmarks alongside focus groups: a mix of qualitative and quantitative methods.',
  },
  {
    title: 'Built, not only described',
    body: 'Prototypes are the research instrument: dashboards, multi-agent systems and grading benchmarks are deployed in the wild.',
  },
]

const transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94],
}

function reveal(delay: number) {
  if (prefersReducedMotion.value)
    return { initial: { opacity: 1, y: 0 }, transition: { duration: 0 } }
  return { initial: { opacity: 0, y: 15 }, transition: { ...transition, delay } }
}
</script>

<template>
  <div class="flex flex-col gap-16">
    <!-- Intro -->
    <motion.div
      :initial="reveal(0).initial"
      :animate="{ opacity: 1, y: 0 }"
      :transition="reveal(0).transition"
    >
      <h5 class="m-0 text-2xl font-semibold">
        Research
      </h5>
      <p class="mt-2 max-w-2xl text-neutral-500 dark:text-neutral-400">
        My PhD sits between computer science, AI and education: I build
        AI-powered learning analytics dashboards that help K-12 teachers support
        what their students do outside the classroom. That makes the work
        inherently pluridisciplinary and what makes it so interesting.
      </p>
    </motion.div>

    <!-- Research landscape graph -->
    <motion.section
      :initial="reveal(0.1).initial"
      :animate="{ opacity: 1, y: 0 }"
      :transition="reveal(0.1).transition"
      class="flex flex-col"
    >
      <div class="mb-3 mt-2 flex items-center justify-between">
        <h2 class="m-0 text-xl text-neutral-700 font-medium tracking-tight dark:text-neutral-300">
          Research Landscape
        </h2>
      </div>
      <p class="mb-2 text-sm text-neutral-500 dark:text-neutral-400">
        The four themes I work across, and how my papers connect them.
      </p>
      <ResearchLandscape />
    </motion.section>

    <!-- Approach -->
    <motion.section
      :initial="reveal(0.3).initial"
      :animate="{ opacity: 1, y: 0 }"
      :transition="reveal(0.3).transition"
      class="flex flex-col"
    >
      <div class="mb-3 mt-2 flex items-center justify-between">
        <h2 class="m-0 text-xl text-neutral-700 font-medium tracking-tight dark:text-neutral-300">
          Approach
        </h2>
      </div>
      <div class="grid mt-4 gap-6 md:grid-cols-3">
        <div v-for="item in approach" :key="item.title" class="flex flex-col gap-1.5">
          <h3 class="m-0 text-sm font-medium">
            {{ item.title }}
          </h3>
          <p class="m-0 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
            {{ item.body }}
          </p>
        </div>
      </div>
    </motion.section>

    <!-- Context -->
    <motion.section
      :initial="reveal(0.4).initial"
      :animate="{ opacity: 1, y: 0 }"
      :transition="reveal(0.4).transition"
      class="flex flex-col"
    >
      <div class="mb-3 mt-2 flex items-center justify-between">
        <h2 class="m-0 text-xl text-neutral-700 font-medium tracking-tight dark:text-neutral-300">
          Context
        </h2>
      </div>
      <p class="mt-4 max-w-2xl text-neutral-500 dark:text-neutral-400">
        PhD student at the
        <a href="https://www.irit.fr/" target="_blank" rel="noopener noreferrer" class="intro-link pressable text-neutral-900 dark:text-neutral-100">IRIT</a>
        lab in Toulouse, in the
        <a href="https://www.irit.fr/TALENT/site/" target="_blank" rel="noopener noreferrer" class="intro-link pressable text-neutral-900 dark:text-neutral-100">TALENT</a>
        team, in collaboration with
        <a href="https://www.kosmos-education.com/" target="_blank" rel="noopener noreferrer" class="intro-link pressable text-neutral-900 dark:text-neutral-100">Kosmos Education</a>.
        Field work happens in French K-12 schools, currently around
        <span class="text-neutral-900 dark:text-neutral-100">Konsolidation</span>, an
        out-of-class study app.
      </p>
      <div class="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <NuxtLink to="/" class="intro-link pressable">
          Publications
        </NuxtLink>
        <a
          href="https://scholar.google.com/citations?hl=fr&user=r8AM0OIAAAAJ"
          target="_blank"
          rel="noopener noreferrer"
          class="intro-link pressable"
        >
          Google Scholar ↗
        </a>
      </div>
    </motion.section>
  </div>
</template>
