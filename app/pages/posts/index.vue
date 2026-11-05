<script setup lang="ts">
import { motion } from 'motion-v'

const { prefersReducedMotion } = usePrefersReducedMotion()

usePageSeo()

// Only what the list shows: the bodies would otherwise ship in the page payload
const { data } = await useAsyncData('posts', () => queryCollection('posts')
  .select('path', 'title', 'description', 'date', 'disabled')
  .order('date', 'DESC')
  .all())

// Posts grouped by MM/YY, newest first
const postGroups = computed(() => {
  if (!data.value)
    return []

  const grouped = data.value.reduce((acc, post) => {
    const date = new Date(post.date)
    const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date
      .getFullYear()
      .toString()
      .slice(2)}`
    if (!acc[monthYear])
      acc[monthYear] = []
    acc[monthYear].push(post)
    return acc
  }, {} as Record<string, typeof data.value>)

  return Object.entries(grouped).map(([monthYear, posts]) => ({
    monthYear,
    posts,
  }))
})
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <div class="mb-16">
      <h1 class="m-0 text-2xl font-semibold">
        Posts
      </h1>
      <p class="max-w-2xl">
        You’ll find here some blog posts I’ve written. <br>
        Posts can be technical-oriented, personal thoughts, or anything else.
      </p>
    </div>
    <div class="flex flex-col gap-12 pl-4">
      <motion.div
        v-for="(group, groupIndex) in postGroups"
        :key="group.monthYear"
        class="relative"
        :initial="prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }"
        :while-in-view="prefersReducedMotion ? undefined : { opacity: 1, y: 0 }"
        :viewport="{ once: true, margin: '-50px' }"
        :transition="prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: Math.min(groupIndex, 2) * 0.1, ease: EASE_OUT }"
      >
        <h2
          class="absolute z-0 my-1 cursor-default text-lg text-zinc-500 tracking-tight -left-4 -top-8 dark:text-zinc-400"
        >
          {{ group.monthYear }}
        </h2>
        <HoverList class="flex flex-col gap-1">
          <div v-for="p in group.posts" :key="p.path">
            <PostLine
              :to="p.path"
              :title="p.title"
              :description="p.description"
              :disabled="p.disabled"
              :date="p.date"
            />
          </div>
        </HoverList>
      </motion.div>
    </div>
  </div>
</template>
