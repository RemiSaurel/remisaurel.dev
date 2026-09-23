<script setup lang="ts">
import { motion } from 'motion-v'

const { prefersReducedMotion } = usePrefersReducedMotion()

useSeoMeta({
  description: 'Yet another blog with projects, ideas, thoughts, and more.',
  ogImage: '/blog.png',
  twitterCard: 'summary_large_image',
})

const { data } = await useAsyncData('posts', () =>
  queryCollection('posts').all())

// Posts grouped by MM/YY, newest first
const postGroups = computed(() => {
  if (!data.value)
    return []

  const sorted = [...data.value].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const grouped = sorted.reduce((acc, post) => {
    const date = new Date(post.date)
    const monthYear = `${String(date.getMonth() + 1).padStart(2, '0')}/${date
      .getFullYear()
      .toString()
      .slice(2)}`
    if (!acc[monthYear])
      acc[monthYear] = []
    acc[monthYear].push(post)
    return acc
  }, {} as Record<string, typeof sorted>)

  return Object.entries(grouped).map(([monthYear, posts]) => ({
    monthYear,
    posts,
  }))
})
</script>

<template>
  <div>
    <div class="mb-16">
      <h1 class="m-0 text-2xl font-semibold">
        Posts
      </h1>
      <p>
        You'll find here some blog posts I've written. <br>
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
        :transition="prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: groupIndex * 0.1, ease: EASE_OUT }"
      >
        <h2
          class="absolute z-0 my-1 cursor-default text-lg text-zinc-500 tracking-tight -left-4 -top-8 dark:text-zinc-400"
        >
          {{ group.monthYear }}
        </h2>
        <div class="flex flex-col gap-2">
          <div v-for="p in group.posts" :key="p.path">
            <PostLine
              :to="p.path"
              :title="p.title"
              :description="p.description"
              :disabled="p.disabled"
            />
          </div>
        </div>
      </motion.div>
    </div>
  </div>
</template>
