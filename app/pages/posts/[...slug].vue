<script setup lang="ts">
const route = useRoute()

const slug = computed(() => {
  const s = route.params.slug
  return Array.isArray(s) ? s.join('/') : s
})

const { data: page, status } = await useAsyncData(
  () => `post-${slug.value}`,
  () => queryCollection('posts').path(`/posts/${slug.value}`).first(),
)

const body = useTemplateRef<HTMLElement>('body')

const references = computed<Reference[]>(() => page.value?.references ?? [])
provide(REFERENCES_KEY, references)

usePageSeo({
  title: () => page.value?.title ?? 'Post not found',
  description: () => page.value?.description,
  type: 'article',
  publishedAt: () => page.value?.date ? new Date(page.value.date).toISOString() : undefined,
  ogPath: page.value ? undefined : '/',
  noindex: !page.value,
})
</script>

<template>
  <div>
    <article v-if="page" class="leading-6">
      <NuxtLink
        to="/posts"
        class="mb-4 w-fit inline-flex items-center gap-1 py-1 text-xs text-neutral-500 transition-colors duration-150 -my-1 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
      >
        <Icon name="lucide:arrow-left" class="size-3.5" />
        Posts
      </NuxtLink>
      <h1 class="font-display mb-4 text-4xl font-medium">
        {{ page.title }}      </h1>
      <div ref="body">
        <ContentRenderer :value="page" />
      </div>
      <PostHighlighter :root="body" :storage-key="`/posts/${slug}`" />
      <PostReferences v-if="references.length" :references="references" />
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
        class="mt-4 inline-flex pressable items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
      >
        <Icon name="uil:arrow-left" class="h-4 w-4" />
        Back to posts
      </NuxtLink>
    </div>
  </div>
</template>
