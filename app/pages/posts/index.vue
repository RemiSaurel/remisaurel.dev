<script setup lang="ts">
useSeoMeta({
  title: 'RemiSaurel',
  ogTitle: 'RemiSaurel',
  description: 'Yet another blog with projects, ideas, thoughts, and more.',
  ogImage: '/blog.png',
  twitterCard: 'summary_large_image',
})

const { data } = await useAsyncData('posts', () =>
  queryCollection('posts').all())

// Create an array of projects grouped by MM/YY
const projects = computed(() => {
  if (!data.value)
    return []

  const sorted = [...data.value].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const groupedProjects = sorted.reduce((acc, post) => {
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

  return Object.entries(groupedProjects).map(([monthYear, projects]) => ({
    monthYear,
    projects,
  }))
})
</script>

<template>
  <div>
    <div class="mb-16">
      <h5 class="m-0 text-2xl font-semibold">
        Blog
      </h5>
      <p>
        You'll find here some blog posts I've written. <br>
        Posts can be technical-oriented, personal thoughts, or anything else.
      </p>
    </div>
    <div class="flex flex-col gap-12 pl-4">
      <div v-for="group in projects" :key="group.monthYear" class="relative">
        <h2
          class="absolute z-0 my-1 cursor-default text-lg text-zinc-400/70 tracking-tight -left-4 -top-8 dark:text-zinc-6"
        >
          {{ group.monthYear }}
        </h2>
        <div class="flex flex-col gap-2">
          <div v-for="p in group.projects" :key="p.path">
            <PostLine
              :to="p.path"
              :title="p.title"
              :description="p.description"
              :disabled="p.disabled"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
