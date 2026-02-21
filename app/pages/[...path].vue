<script setup lang="ts">
import { motion } from 'motion-v'

useSeoMeta({
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
})

const transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94],
}
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center gap-8">
    <motion.div
      :initial="{ opacity: 0, y: 20 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="transition"
      class="flex flex-col items-center gap-4"
    >
      <motion.span
        :initial="{ opacity: 0, scale: 0.8 }"
        :animate="{ opacity: 1, scale: 1 }"
        :transition="{ ...transition, delay: 0.1 }"
        class="text-9xl text-neutral-300 font-light dark:text-neutral-700"
      >
        404
      </motion.span>

      <p class="text-lg text-neutral-600 dark:text-neutral-400">
        This page got lost in the void 👾
      </p>

      <NuxtLink
        to="/"
        class="mt-2 inline-flex items-center gap-2 text-sm text-neutral-500 transition-colors dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200"
      >
        <Icon name="uil:arrow-left" class="h-4 w-4" />
        Back to home
      </NuxtLink>
    </motion.div>
  </div>
</template>
