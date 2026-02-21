<script setup lang="ts">
import { motion } from 'motion-v'

interface Props {
  animate?: boolean
}

withDefaults(defineProps<Props>(), {
  animate: true,
})

const socialLinks = [
  { icon: 'academicons:google-scholar', url: 'https://scholar.google.com/citations?hl=fr&user=r8AM0OIAAAAJ', label: 'Google Scholar' },
  { icon: 'uil:github-alt', url: 'https://github.com/remisaurel', label: 'GitHub' },
  { icon: 'uil:linkedin', url: 'https://www.linkedin.com/in/r%C3%A9mi-saurel/', label: 'LinkedIn' },
  { icon: 'i-simple-icons-x', url: 'https://twitter.com/remisaurel', label: 'X' },
]

const transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94],
}
</script>

<template>
  <aside class="relative lg:sticky lg:top-8">
    <!-- Mobile: Horizontal layout with large photo -->
    <motion.div
      :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="animate ? { ...transition, delay: 0.1 } : { duration: 0 }"
      class="lg:hidden"
    >
      <div class="flex items-start gap-4">
        <!-- Photo same size as desktop -->
        <NuxtImg
          src="/photo.png"
          alt="Rémi Saurel"
          class="w-32 shrink-0"
        />

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
        <a
          v-for="link in socialLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          class="size-8 inline-flex items-center justify-center border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white dark:hover:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
        >
          <Icon :name="link.icon" class="size-4" />
        </a>
      </div>
    </motion.div>

    <!-- Desktop: Original vertical layout -->
    <div class="hidden flex-col gap-3 lg:flex">
      <!-- Photo -->
      <motion.div
        :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="animate ? { ...transition, delay: 0.1 } : { duration: 0 }"
      >
        <NuxtImg
          src="/photo.png"
          alt="Rémi Saurel"
          class="hover:grayscale max-w-48 w-full transition-filter duration-300"
        />
      </motion.div>

      <!-- Name & Title -->
      <motion.div
        :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="animate ? { ...transition, delay: 0.2 } : { duration: 0 }"
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
        :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="animate ? { ...transition, delay: 0.25 } : { duration: 0 }"
        class="flex flex-col gap-1"
      >
        <span class="text-sm text-neutral-500 dark:text-neutral-400">
          remi.saurel [at] irit.fr
        </span>
      </motion.div>

      <!-- Social Links -->
      <motion.div
        :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="animate ? { ...transition, delay: 0.3 } : { duration: 0 }"
        class="flex gap-2"
      >
        <a
          v-for="link in socialLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          class="size-8 inline-flex items-center justify-center border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white dark:hover:border-neutral-100 dark:hover:bg-neutral-100 dark:hover:text-neutral-900"
        >
          <Icon :name="link.icon" class="size-4" />
        </a>
      </motion.div>
    </div>
  </aside>
</template>
