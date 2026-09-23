<script setup lang="ts">
import type { NewsCategory } from '~/news/news'
import type { FilterDefinition, FilterState } from '~/utils/filters'
import { motion } from 'motion-v'
import { useFirstVisit } from '~/composables/useFirstVisit'
import { news } from '~/news/news'
import { countBy, emptyFilterState, hasActiveFilters, matchesFilter } from '~/utils/filters'

interface Props {
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
})

const CATEGORIES: { value: NewsCategory, label: string, icon: string }[] = [
  { value: 'paper', label: 'Paper', icon: 'lucide:file-text' },
  { value: 'project', label: 'Project', icon: 'lucide:folder' },
  { value: 'conference', label: 'Conference', icon: 'lucide:presentation' },
  { value: 'misc', label: 'Misc', icon: 'lucide:sparkles' },
]

const sortedNews = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

const filterDefinitions = computed<FilterDefinition[]>(() => {
  const categoryCounts = countBy(sortedNews, item => item.categories)
  const yearCounts = countBy(sortedNews, item => item.date.getFullYear())
  const linkCounts = countBy(sortedNews, item => hasLink(item))

  return [
    {
      key: 'categories',
      label: 'Category',
      icon: 'lucide:tag',
      multiple: true,
      multiValued: true,
      plural: 'categories',
      options: CATEGORIES
        .filter(category => categoryCounts.has(category.value))
        .map(category => ({ ...category, count: categoryCounts.get(category.value) })),
    },
    {
      key: 'years',
      label: 'Year',
      icon: 'lucide:calendar',
      multiple: true,
      plural: 'years',
      options: [...yearCounts.keys()].map(year => ({ value: year, label: String(year), count: yearCounts.get(year) })),
    },
    {
      key: 'link',
      label: 'Link',
      icon: 'lucide:link',
      multiple: false,
      options: [
        { value: true, label: 'Has a link', count: linkCounts.get(true) ?? 0 },
        { value: false, label: 'No link', count: linkCounts.get(false) ?? 0 },
      ],
    },
  ]
})

const filters = ref<FilterState>(emptyFilterState(filterDefinitions.value))

const hasFilters = computed(() => hasActiveFilters(filters.value))

// Track how many items to show
const displayLimit = ref(props.limit)

const filteredNews = computed(() => {
  const { categories, years, link } = filters.value
  return sortedNews.filter(item =>
    matchesFilter(categories, item.categories)
    && matchesFilter(years, item.date.getFullYear())
    && matchesFilter(link, hasLink(item)),
  )
})

const displayedNews = computed(() => {
  return filteredNews.value.slice(0, displayLimit.value)
})

const hasMoreItems = computed(() => {
  return displayLimit.value < filteredNews.value.length
})

function loadMore() {
  displayLimit.value += 5
}

// Start again from the first page whenever the filters change
watch(filters, () => {
  displayLimit.value = props.limit
})

function clearFilters() {
  filters.value = emptyFilterState(filterDefinitions.value)
}

function hasLink(item: typeof news[0]) {
  return !!item.links?.length
}

function getFirstLink(item: typeof news[0]) {
  return item.links?.[0]?.url || '#'
}

const { prefersReducedMotion } = usePrefersReducedMotion()
const { isFirstVisit } = useFirstVisit()

function itemMotion(index: number) {
  if (prefersReducedMotion.value || !isFirstVisit.value)
    return { initial: { opacity: 1, y: 0 }, transition: { duration: 0 } }
  return { initial: { opacity: 0, y: 10 }, transition: { duration: 0.4, delay: Math.min(index, 7) * 0.04, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] } }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <FilterBar v-model="filters" class="mt-2" :definitions="filterDefinitions" />

    <!-- News list -->
    <div class="flex flex-col gap-1">
      <template v-for="(item, index) in displayedNews" :key="item.title + item.date.toString()">
        <motion.div
          :initial="itemMotion(index).initial"
          :animate="{ opacity: 1, y: 0 }"
          :transition="itemMotion(index).transition"
        >
          <component
            :is="hasLink(item) ? 'a' : 'div'"
            :href="hasLink(item) ? getFirstLink(item) : undefined"
            :target="hasLink(item) ? '_blank' : undefined"
            :rel="hasLink(item) ? 'noopener noreferrer' : undefined"
            class="block px-3 py-3 transition-all duration-300 ease-out"
            :class="{ 'pressable hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer group': hasLink(item) }"
          >
            <!-- Mobile: Stacked layout -->
            <div class="flex flex-col gap-2 md:hidden">
              <!-- Date + Categories row -->
              <div class="flex items-center justify-between">
                <span class="tabular-nums text-xs text-neutral-400 dark:text-neutral-500">{{ formatDate(item.date) }}</span>
                <div class="flex items-center gap-1.5">
                  <div class="flex items-center gap-1">
                    <span
                      v-for="cat in item.categories?.slice(0, 2)"
                      :key="cat"
                      class="whitespace-nowrap bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    >
                      {{ cat }}
                    </span>
                  </div>
                  <svg
                    class="h-2.5 w-2.5 transition-all duration-300"
                    :class="hasLink(item) ? 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : 'opacity-0'"
                    viewBox="0 0 11 11"
                    fill="none"
                  >
                    <path d="M8.4778 3.06917L1.23404 10.3129L0 9.0789L7.24376 1.83513L0.456622 1.71166L0.440628 0L10.1366 0.176392L10.313 9.87231L8.60128 9.85632L8.4778 3.06917Z" fill="currentColor" />
                  </svg>
                </div>
              </div>
              <!-- Title + Content -->
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium leading-snug">{{ item.title }}</span>
                <span v-if="item.content" class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.content }}</span>
              </div>
            </div>

            <!-- Desktop: Grid layout -->
            <div class="grid-cols-[70px_1fr_auto] hidden items-start gap-4 md:grid">
              <span class="tabular-nums text-xs text-neutral-400 dark:text-neutral-500">{{ formatDate(item.date) }}</span>

              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium leading-snug">{{ item.title }}</span>
                <span v-if="item.content" class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.content }}</span>
              </div>

              <div class="flex flex-nowrap items-center justify-end gap-1.5">
                <div class="flex items-center gap-1">
                  <span
                    v-for="cat in item.categories?.slice(0, 2)"
                    :key="cat"
                    class="whitespace-nowrap border border-neutral-300 px-1.5 py-0.5 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400"
                  >
                    {{ cat }}
                  </span>
                </div>
                <svg
                  class="h-2.5 w-2.5 transition-all duration-300"
                  :class="hasLink(item) ? 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : 'opacity-0'"
                  viewBox="0 0 11 11"
                  fill="none"
                >
                  <path d="M8.4778 3.06917L1.23404 10.3129L0 9.0789L7.24376 1.83513L0.456622 1.71166L0.440628 0L10.1366 0.176392L10.313 9.87231L8.60128 9.85632L8.4778 3.06917Z" fill="currentColor" />
                </svg>
              </div>
            </div>
          </component>
        </motion.div>
      </template>
    </div>

    <div v-if="hasFilters && !filteredNews.length" class="flex flex-col items-center gap-3 py-8 text-sm text-neutral-500 dark:text-neutral-400">
      No news matches these filters.
      <button
        type="button"
        class="pressable cursor-pointer text-xs text-neutral-900 underline decoration-neutral-300 underline-offset-4 dark:text-neutral-100 dark:decoration-neutral-600 hover:decoration-current"
        @click="clearFilters()"
      >
        Clear filters
      </button>
    </div>

    <!-- Load more button -->
    <button
      v-if="hasMoreItems"
      class="group mt-2 inline-flex pressable cursor-pointer items-center self-center gap-1 rounded-none bg-neutral-100 px-3 py-2 text-xs text-neutral-600 transition-colors duration-200 dark:bg-neutral-800 hover:bg-neutral-200 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-200"
      @click="loadMore"
    >
      <span>Show more</span>
      <Icon name="uil:angle-down" class="size-5" />
    </button>
  </div>
</template>
