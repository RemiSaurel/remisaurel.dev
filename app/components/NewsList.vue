<script setup lang="ts">
import { news, type NewsCategory } from '~/news/news';

interface Props {
  limit?: number;
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5
});

// Available categories for filtering
const categories: NewsCategory[] = ['paper', 'project', 'conference', 'misc'];

// Track selected filter
const selectedCategory = ref<NewsCategory | null>(null);

// Track how many items to show
const displayLimit = ref(props.limit);

// Get filtered and limited news items
const filteredNews = computed(() => {
  let items = [...news].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (selectedCategory.value) {
    items = items.filter(item => item.categories?.includes(selectedCategory.value!));
  }
  
  return items;
});

const displayedNews = computed(() => {
  return filteredNews.value.slice(0, displayLimit.value);
});

const hasMoreItems = computed(() => {
  return displayLimit.value < filteredNews.value.length;
});

const remainingCount = computed(() => {
  return filteredNews.value.length - displayLimit.value;
});

const loadMore = () => {
  displayLimit.value += 5;
};

const toggleFilter = (category: NewsCategory) => {
  if (selectedCategory.value === category) {
    selectedCategory.value = null;
  } else {
    selectedCategory.value = category;
  }
  // Reset display limit when filter changes
  displayLimit.value = props.limit;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', { 
    month: 'short', 
    year: 'numeric' 
  }).format(new Date(date));
};

const hasLink = (item: typeof news[0]) => {
  return item.links && item.links.length > 0;
};

const getFirstLink = (item: typeof news[0]) => {
  return item.links?.[0]?.url || '#';
};
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Tag filters -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="category in categories"
        :key="category"
        class="inline-block text-xs py-1 px-2 border-none cursor-pointer"
        :class="selectedCategory === category 
          ? ' bg-neutral-800 dark:bg-neutral-400 text-white dark:text-neutral-800' 
          : ' text-neutral-500 dark:bg-neutral-700 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'"
        @click="toggleFilter(category)"
      >
        {{ category }}
      </button>
    </div>

    <!-- News list -->
    <div class="flex flex-col">
      <component
        v-for="item in displayedNews"
        :key="item.title + item.date.toString()"
        :is="hasLink(item) ? 'a' : 'div'"
        :href="hasLink(item) ? getFirstLink(item) : undefined"
        :target="hasLink(item) ? '_blank' : undefined"
        :rel="hasLink(item) ? 'noopener noreferrer' : undefined"
        class="py-3 px-3 border-b border-neutral-200 dark:border-neutral-800 transition-all duration-300 ease-out"
        :class="{ 'hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer group': hasLink(item) }"
      >
        <!-- Mobile: Stacked layout -->
        <div class="flex flex-col gap-2 md:hidden">
          <!-- Date + Categories row -->
          <div class="flex items-center justify-between">
            <span class="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">{{ formatDate(item.date) }}</span>
            <div class="flex items-center gap-1">
              <span 
                v-for="cat in item.categories?.slice(0, 2)" 
                :key="cat" 
                class="text-xs py-0.5 px-1.5 border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 whitespace-nowrap"
              >
                {{ cat }}
              </span>
              <svg 
                class="w-2.5 h-2.5 shrink-0 ml-1 transition-all duration-300"
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
        <div class="hidden md:grid grid-cols-[70px_1fr_auto] gap-4 items-start">
          <span class="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">{{ formatDate(item.date) }}</span>
          
          <div class="flex flex-col gap-1">
            <span class="text-sm font-medium leading-snug">{{ item.title }}</span>
            <span v-if="item.content" class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.content }}</span>
          </div>

          <div class="flex items-center gap-1 justify-end flex-nowrap">
            <span 
              v-for="cat in item.categories?.slice(0, 2)" 
              :key="cat" 
              class="text-xs py-0.5 px-1.5 border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 whitespace-nowrap"
            >
              {{ cat }}
            </span>
            <svg 
              class="w-2.5 h-2.5 shrink-0 ml-1 transition-all duration-300"
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
      class="self-center mt-2 py-2 px-4 text-xs border border-neutral-300 dark:border-neutral-700 bg-transparent text-neutral-500 dark:text-neutral-400 cursor-pointer hover:border-neutral-900 dark:hover:border-neutral-100 hover:text-neutral-900 dark:hover:text-neutral-100"
      @click="loadMore"
    >
      Load more ({{ remainingCount }} remaining)
    </button>
  </div>
</template>
