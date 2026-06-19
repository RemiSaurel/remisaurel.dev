<script setup lang="ts">
import { withoutTrailingSlash } from 'ufo'

const route = useRoute()

const path = computed(() => withoutTrailingSlash(route.path))

const { data: page, status } = await useAsyncData(
  `post-${path.value}`,
  () => queryCollection('posts').path(path.value).first(),
  { watch: [path] },
)
</script>

<template>
  <div>
    <main>
      <article v-if="page" class="leading-6">
        <h1 class="mb-4 text-4xl">
          {{ page.title }}
        </h1>
        <ContentRenderer :value="page" />
      </article>

      <div v-else-if="status === 'pending'" class="py-12 text-center text-neutral-500 dark:text-neutral-400">
        Loading post…
      </div>

      <div v-else class="py-12 text-center">
        <p class="text-lg text-neutral-600 dark:text-neutral-400">
          Post not found.
        </p>
        <NuxtLink
          to="/posts"
          class="pressable mt-4 inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-neutral-500 dark:hover:text-neutral-200"
        >
          <Icon name="uil:arrow-left" class="h-4 w-4" />
          Back to posts
        </NuxtLink>
      </div>
    </main>
  </div>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}
</style>
