<script setup lang="ts">
import type { NewsCategory } from '~/news/news'
import { news } from '~/news/news'

interface Props {
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
})

// Available categories for filtering
const categories: NewsCategory[] = ['paper', 'project', 'conference', 'misc']

// Track selected filter
const selectedCategory = ref<NewsCategory | null>(null)

// Track how many items to show
const displayLimit = ref(props.limit)

// Get filtered and limited news items
const filteredNews = computed(() => {
  let items = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (selectedCategory.value) {
    items = items.filter(item => item.categories?.includes(selectedCategory.value!))
  }

  return items
})

const displayedNews = computed(() => {
  return filteredNews.value.slice(0, displayLimit.value)
})

const hasMoreItems = computed(() => {
  return displayLimit.value < filteredNews.value.length
})

const remainingCount = computed(() => {
  return filteredNews.value.length - displayLimit.value
})

function loadMore() {
  displayLimit.value += 5
}

function toggleFilter(category: NewsCategory) {
  if (selectedCategory.value === category) {
    selectedCategory.value = null
  }
  else {
    selectedCategory.value = category
  }
  // Reset display limit when filter changes
  displayLimit.value = props.limit
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function hasLink(item: typeof news[0]) {
  return item.links && item.links.length > 0
}

function getFirstLink(item: typeof news[0]) {
  return item.links?.[0]?.url || '#'
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Tag filters -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="category in categories"
        :key="category"
        class="inline-block cursor-pointer border-none px-2 py-1 text-xs"
        :class="selectedCategory === category
          ? ' bg-neutral-800 dark:bg-neutral-400 text-white dark:text-neutral-800'
          : ' text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'"
        @click="toggleFilter(category)"
      >
        {{ category }}
      </button>
    </div>

    <!-- News list -->
    <div class="flex flex-col">
      <component
        :is="hasLink(item) ? 'a' : 'div'"
        v-for="item in displayedNews"
        :key="item.title + item.date.toString()"
        :href="hasLink(item) ? getFirstLink(item) : undefined"
        :target="hasLink(item) ? '_blank' : undefined"
        :rel="hasLink(item) ? 'noopener noreferrer' : undefined"
        class="border-b border-neutral-200 px-3 py-3 transition-all duration-300 ease-out dark:border-neutral-800"
        :class="{ 'hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer group': hasLink(item) }"
      >
        <!-- Mobile: Stacked layout -->
        <div class="flex flex-col gap-2 md:hidden">
          <!-- Date + Categories row -->
          <div class="flex items-center justify-between">
            <span class="tabular-nums text-xs text-neutral-400 dark:text-neutral-500">{{ formatDate(item.date) }}</span>
            <div class="flex items-center gap-1">
              <span
                v-for="cat in item.categories?.slice(0, 2)"
                :key="cat"
                class="whitespace-nowrap border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              >
                {{ cat }}
              </span>
              <svg
                class="ml-1 h-2.5 w-2.5 shrink-0 transition-all duration-300"
                :class="hasLink(item) ? 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : 'opacity-0'"
                viewBox="0 0 11 11"
                fill="none"
              >
                <path
                  d="M8.4778 3.06917L1.23404 10.3129L0 9.0789L7.24376 1.83513L0.456622 1.71166L0.440628 0L10.1366 0.176392L10.313 9.87231L8.60128 9.85632L8.4778 3.06917Z"
                  fill="currentColor"
                />
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

          <div class="flex flex-nowrap items-center justify-end gap-1">
            <span
              v-for="cat in item.categories?.slice(0, 2)"
              :key="cat"
              class="whitespace-nowrap border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
            >
              {{ cat }}
            </span>
            <svg
              class="ml-1 h-2.5 w-2.5 shrink-0 transition-all duration-300"
              :class="hasLink(item) ? 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : 'opacity-0'"
              viewBox="0 0 11 11"
              fill="none"
            >
              <path
                d="M8.4778 3.06917L1.23404 10.3129L0 9.0789L7.24376 1.83513L0.456622 1.71166L0.440628 0L10.1366 0.176392L10.313 9.87231L8.60128 9.85632L8.4778 3.06917Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </component>
    </div>

    <!-- Load more button -->
    <button
      v-if="hasMoreItems"
      class="mt-2 cursor-pointer self-center border border-neutral-300 bg-transparent px-4 py-2 text-xs text-neutral-500 dark:border-neutral-700 hover:border-neutral-900 dark:text-neutral-400 hover:text-neutral-900 dark:hover:border-neutral-100 dark:hover:text-neutral-100"
      @click="loadMore"
    >
      Load more ({{ remainingCount }} remaining)
    </button>
  </div>
</template>
