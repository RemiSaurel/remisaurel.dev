<script setup lang="ts">
import { motion } from 'motion-v'

const { prefersReducedMotion } = usePrefersReducedMotion()

usePageSeo()

const { data: explorations } = await useExplorations()
</script>

<template>
  <div class="max-w-2xl">
    <div class="mb-12">
      <h1 class="m-0 text-2xl font-semibold">
        Explorations
      </h1>
      <p>
        Working pieces around AI and education: a question, the data it needs, and the workflow that answers it,
        built so you can run it and take it apart.
      </p>
    </div>

    <ul v-if="explorations.length" class="list-none m-0 flex flex-col gap-1 p-0">
      <motion.li
        v-for="(exploration, index) in explorations"
        :key="exploration.path"
        :initial="prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="prefersReducedMotion ? { duration: 0 } : { duration: 0.4, delay: Math.min(index, 6) * 0.04, ease: EASE_OUT }"
      >
        <ExplorationRow
          :to="exploration.path"
          :title="exploration.title"
          :description="exploration.description"
          :status="exploration.status"
          :icon="exploration.icon"
        />
      </motion.li>
    </ul>

    <p v-else class="text-sm text-neutral-500 dark:text-neutral-400">
      The first one is on its way.
    </p>
  </div>
</template>
