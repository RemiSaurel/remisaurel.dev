<script setup lang="ts">
const route = useRoute()

const slug = computed(() => {
  const s = route.params.slug
  return Array.isArray(s) ? s.join('/') : s
})

const { data: found, status } = await useAsyncData(
  () => `exploration-${slug.value}`,
  () => queryCollection('explorations').path(`/explorations/${slug.value}`).first(),
)

// A draft does not exist outside of development
const page = computed(() => (found.value && (SHOW_DRAFTS || found.value.status !== 'draft') ? found.value : null))
const body = useTemplateRef<HTMLElement>('body')

const references = computed<Reference[]>(() => page.value?.references ?? [])
provide(REFERENCES_KEY, references)
const tags = computed(() => page.value?.tags ?? [])

// "In progress since October 2026, about AI, ASAG and Workflow." Built as parts, so no template
// formatting can slip a space before the comma. Parts with an icon are the values, set darker.
const STATUS_OPENING = {
  draft: { icon: 'lucide:pencil-line', text: 'Draft started in' },
  wip: { icon: 'dot', text: 'In progress since' },
  published: { icon: 'lucide:circle-check', text: 'Published in' },
} as const

const sentence = computed(() => {
  if (!page.value)
    return []
  const month = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(page.value.date))
  const parts: { text: string, icon?: string }[] = [
    STATUS_OPENING[page.value.status ?? 'draft'],
    { text: ' ' },
    { icon: 'lucide:calendar', text: month },
  ]
  if (tags.value.length)
    parts.push({ text: ', about ' }, { icon: 'lucide:tag', text: new Intl.ListFormat('en-US', { type: 'conjunction' }).format(tags.value) })
  parts.push({ text: '.' })
  return parts
})

usePageSeo({
  title: () => page.value?.title ?? 'Exploration not found',
  description: () => page.value?.description,
  type: 'article',
  publishedAt: () => page.value?.date ? new Date(page.value.date).toISOString() : undefined,
  ogPath: page.value ? undefined : '/',
  noindex: !page.value || page.value.status === 'draft',
})
</script>

<template>
  <div>
    <article v-if="page" class="leading-6">
      <header class="mb-10">
        <NuxtLink
          to="/explorations"
          class="mb-4 w-fit inline-flex items-center gap-1 py-1 text-xs text-neutral-500 transition-colors duration-150 -my-1 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <Icon name="lucide:arrow-left" class="size-3.5" />
          Explorations
        </NuxtLink>
        <p
          v-if="page.status === 'draft'"
          class="uppercase mb-3 ml-3 mt-0 w-fit inline-flex items-center gap-1.5 border border-neutral-400 rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-neutral-500 font-medium tracking-wide dark:border-neutral-500 dark:text-neutral-400"
        >
          <Icon name="lucide:pencil-line" class="size-3" />
          Draft · development only
        </p>
        <h1 class="font-display mb-3 text-balance text-4xl font-medium tracking-tight">
          {{ page.title }}
        </h1>
        <p class="m-0 text-pretty text-neutral-600 dark:text-neutral-400">
          {{ page.description }}
        </p>

        <!-- Front matter as one sentence, the way you would say it: no labels to read past -->
        <p class="meta mb-0 mt-6 border-t border-neutral-200 pt-4 text-[15px] text-neutral-500 leading-relaxed dark:border-neutral-800 dark:text-neutral-400">
          <template v-for="part in sentence" :key="part.text">
            <span v-if="part.icon" class="value"><span v-if="part.icon === 'dot'" class="status-dot" aria-hidden="true" /><Icon v-else :name="part.icon" class="icon" />{{ part.text }}</span>
            <template v-else>
              {{ part.text }}
            </template>
          </template>
        </p>
      </header>
      <div ref="body">
        <ContentRenderer :value="page" />
      </div>
      <PostHighlighter :root="body" :storage-key="`/explorations/${slug}`" />
      <PostReferences v-if="references.length" :references="references" />
    </article>

    <div v-else-if="status === 'pending'" class="py-12 text-center text-neutral-500 dark:text-neutral-400">
      Loading exploration…
    </div>

    <div v-else class="py-12 text-center">
      <p class="text-lg text-neutral-600 dark:text-neutral-400">
        Exploration not found.
      </p>
      <NuxtLink
        to="/explorations"
        class="mt-4 inline-flex pressable items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
      >
        <Icon name="uil:arrow-left" class="h-4 w-4" />
        Back to explorations
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
/* What the sentence says stands out from how it says it */
.meta .value {
  color: rgb(38 38 38);
  white-space: nowrap;
}

.dark .meta .value {
  color: rgb(229 229 229);
}

.meta .icon {
  width: 14px;
  height: 14px;
  margin-right: 4px;
  vertical-align: -2px;
  color: rgb(163 163 163);
}

.dark .meta .icon {
  color: rgb(115 115 115);
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin: 0 6px 0 4px;
  vertical-align: 2px;
  border-radius: 9999px;
  background: rgb(245 158 11);
  animation: breathe 2.4s var(--ease-in-out) infinite;
}

/* Work in progress breathes */
@keyframes breathe {
  50% {
    box-shadow: 0 0 0 4px rgb(245 158 11 / 0.18);
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-dot {
    animation: none;
  }
}
</style>
