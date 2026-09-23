<script setup lang="ts">
useSeoMeta({
  title: 'Research',
  ogTitle: 'Research · Rémi Saurel',
  description: 'Research landscape: learning analytics dashboards, generative AI in education, human-AI interaction and responsible AI.',
  ogImage: '/home.png',
  twitterCard: 'summary_large_image',
})

const { setCursorLogo, clearCursorLogo } = useCursorLogo()

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

// Entrance runs as the CSS `.enter` reveal, so it starts before hydration.
function reveal(delay: number) {
  return { class: 'enter', style: { '--enter-delay': `${delay}s` } }
}

function itemReveal(index: number) {
  return {
    class: 'enter [--enter-duration:0.4s] [--enter-ease:var(--ease-out)] [--enter-y:10px]',
    style: { '--enter-delay': `${Math.min(index, 7) * 0.04}s` },
  }
}
</script>

<template>
  <div class="flex flex-col gap-16">
    <!-- Intro -->
    <div v-bind="reveal(0)">
      <h1 class="m-0 text-2xl font-semibold">
        Research
      </h1>
      <p class="mt-2 max-w-2xl text-neutral-500 dark:text-neutral-400">
        My PhD sits between computer science, AI and education: I build
        AI-powered learning analytics dashboards that help K-12 teachers support
        what their students do outside the classroom. That makes the work
        inherently pluridisciplinary and what makes it so interesting.
      </p>
    </div>

    <!-- Research landscape graph -->
    <section
      v-bind="reveal(0.1)"
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
    </section>

    <!-- Approach -->
    <section
      v-bind="reveal(0.3)"
      class="flex flex-col"
    >
      <div class="mb-3 mt-2 flex items-center justify-between">
        <h2 class="m-0 text-xl text-neutral-700 font-medium tracking-tight dark:text-neutral-300">
          Approach
        </h2>
      </div>
      <div class="grid mt-4 gap-6 md:grid-cols-3">
        <div
          v-for="(item, index) in approach"
          :key="item.title"
          v-bind="itemReveal(index)"
          class="flex flex-col gap-1.5"
        >
          <h3 class="m-0 text-sm font-medium">
            {{ item.title }}
          </h3>
          <p class="m-0 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
            {{ item.body }}
          </p>
        </div>
      </div>
    </section>

    <!-- Context -->
    <section
      v-bind="reveal(0.4)"
      class="flex flex-col"
    >
      <div class="mb-3 mt-2 flex items-center justify-between">
        <h2 class="m-0 text-xl text-neutral-700 font-medium tracking-tight dark:text-neutral-300">
          Context
        </h2>
      </div>
      <p class="mt-4 max-w-2xl text-neutral-500 dark:text-neutral-400">
        PhD student at the
        <a
          href="https://www.irit.fr/" target="_blank" rel="noopener noreferrer"
          class="intro-link pressable text-neutral-900 dark:text-neutral-100"
          @mouseenter="setCursorLogo(ENTITY_LOGOS.irit)"
          @mouseleave="clearCursorLogo"
        >IRIT</a>
        lab in Toulouse, in the
        <a
          href="https://www.irit.fr/TALENT/site/" target="_blank" rel="noopener noreferrer"
          class="intro-link pressable text-neutral-900 dark:text-neutral-100"
          @mouseenter="setCursorLogo(ENTITY_LOGOS.talent)"
          @mouseleave="clearCursorLogo"
        >TALENT</a>
        team, in collaboration with
        <a
          href="https://www.kosmos-education.com/" target="_blank" rel="noopener noreferrer"
          class="intro-link pressable text-neutral-900 dark:text-neutral-100"
          @mouseenter="setCursorLogo(ENTITY_LOGOS.kosmos)"
          @mouseleave="clearCursorLogo"
        >Kosmos Education</a>.
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
    </section>
  </div>
</template>
