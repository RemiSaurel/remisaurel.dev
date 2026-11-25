<script setup lang="ts">
import { motion } from 'motion-v'

const { prefersReducedMotion } = usePrefersReducedMotion()

usePageSeo()

const { data: explorations } = await useExplorations()

// Explorations grouped by MM/YY, newest first (the query already sorts them), like /posts.
// Drafts hide their date, so they all go in one "Soon" group on top instead of under a month
const explorationGroups = computed(() => {
  const groups: { heading: string | null, items: typeof explorations.value }[] = []
  const drafts = explorations.value.filter(exploration => exploration.status === 'draft')
  if (drafts.length)
    groups.push({ heading: 'Soon', items: drafts })
  for (const exploration of explorations.value) {
    if (exploration.status === 'draft')
      continue
    const date = exploration.date ? new Date(exploration.date) : null
    const heading = date ? `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear().toString().slice(2)}` : null
    const last = groups.at(-1)
    if (last && last.heading === heading && last.heading !== 'Soon')
      last.items.push(exploration)
    else
      groups.push({ heading, items: [exploration] })
  }
  return groups
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-16">
      <h1 class="m-0 text-2xl font-semibold">
        Explorations
      </h1>
      <p>
        Working pieces around AI and education: a question, the data it needs, and the workflow that answers it,
        built so you can run it and take it apart.
      </p>
    </div>

    <div v-if="explorations.length" class="flex flex-col gap-12 pl-4">
      <motion.div
        v-for="(group, groupIndex) in explorationGroups"
        :key="group.heading ?? 'undated'"
        class="relative"
        :initial="prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }"
        :while-in-view="prefersReducedMotion ? undefined : { opacity: 1, y: 0 }"
        :viewport="{ once: true, margin: '-50px' }"
        :transition="prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: Math.min(groupIndex, 2) * 0.1, ease: EASE_OUT }"
      >
        <h2
          v-if="group.heading"
          class="absolute z-0 my-1 cursor-default text-lg text-zinc-500 tracking-tight -left-4 -top-8 dark:text-zinc-400"
        >
          {{ group.heading }}
        </h2>
        <HoverList tag="ul" class="list-none m-0 flex flex-col gap-1 p-0">
          <li v-for="exploration in group.items" :key="exploration.path">
            <ExplorationRow
              :to="exploration.path"
              :title="exploration.title"
              :description="exploration.description"
              :status="exploration.status"
              :icon="exploration.icon"
              :date="exploration.date"
            />
          </li>
        </HoverList>
      </motion.div>
    </div>

    <p v-else class="text-sm text-neutral-500 dark:text-neutral-400">
      The first one is on its way.
    </p>
  </div>
</template>
