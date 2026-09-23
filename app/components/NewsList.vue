<script setup lang="ts">
import type { NewsCategory } from '~/news/news'
import type { FilterDefinition, FilterState } from '~/utils/filters'
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

const sortedNews = [...news].sort((a, b) => b.date.getTime() - a.date.getTime())

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

const filteredNews = computed(() => {
  const { categories, years, link } = filters.value
  return sortedNews.filter(item =>
    matchesFilter(categories, item.categories)
    && matchesFilter(years, item.date.getFullYear())
    && matchesFilter(link, hasLink(item)),
  )
})

interface NewsYear {
  year: number
  items: typeof news
}

// Already sorted by date, so years come out newest first
const newsByYear = computed<NewsYear[]>(() => {
  const groups: NewsYear[] = []
  for (const item of filteredNews.value) {
    const year = item.date.getFullYear()
    if (groups.at(-1)?.year !== year)
      groups.push({ year, items: [] })
    groups.at(-1)!.items.push(item)
  }
  return groups
})

/** Years opened by default: the newest ones, until at least `limit` news are visible. */
function defaultOpenYears() {
  const open = new Set<number>()
  let visible = 0
  for (const group of newsByYear.value) {
    if (visible >= props.limit)
      break
    open.add(group.year)
    visible += group.items.length
  }
  return open
}

const openYears = ref(defaultOpenYears())

function isOpen(year: number) {
  return openYears.value.has(year)
}

function toggleYear(year: number) {
  const next = new Set(openYears.value)
  if (!next.delete(year))
    next.add(year)
  openYears.value = next
}

// A filtered list is already short, so it opens every year; clearing the filters goes back to the default
watch(filters, () => {
  openYears.value = hasFilters.value ? new Set(newsByYear.value.map(group => group.year)) : defaultOpenYears()
}, { deep: true })

function clearFilters() {
  filters.value = emptyFilterState(filterDefinitions.value)
}

// The year divider above already names the year, so a row only carries its month,
// right-aligned under the year's last two digits (see .month-slot)
function monthLabel(date: Date) {
  return String(date.getMonth() + 1).padStart(2, '0')
}

function monthAttr(date: Date) {
  return `${date.getFullYear()}-${monthLabel(date)}`
}

function hasLink(item: typeof news[0]) {
  return !!item.links?.length
}

function getFirstLink(item: typeof news[0]) {
  return item.links?.[0]?.url || '#'
}

const { isFirstVisit } = useFirstVisit()

// CSS `.enter` stagger, so the rows show up before hydration instead of waiting on motion.
function itemEnter(index: number) {
  return {
    class: isFirstVisit.value && 'enter',
    style: { '--enter-delay': `${Math.min(index, 7) * 0.04}s` },
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Hydrated on first hover/focus/tap: keeps the popover code off the critical path -->
    <LazyFilterBar v-model="filters" hydrate-on-interaction class="mt-2" :definitions="filterDefinitions" />

    <!-- News list -->
    <div class="flex flex-col gap-1">
      <template v-for="group in newsByYear" :key="group.year">
        <!-- Year divider: always there, it folds and unfolds the year -->
        <button
          type="button"
          class="group flex cursor-pointer items-center gap-3 py-2 text-left"
          :class="{ 'mt-3': group.year !== newsByYear[0]?.year }"
          :aria-expanded="isOpen(group.year)"
          :aria-label="`${isOpen(group.year) ? 'Hide' : 'Show'} the ${group.items.length} news from ${group.year}`"
          @click="toggleYear(group.year)"
        >
          <span class="tabular-nums text-xs text-neutral-600 font-medium dark:text-neutral-300">{{ group.year }}</span>
          <span class="h-px flex-1 bg-neutral-200 transition-colors duration-200 dark:bg-neutral-800 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700" />
          <span class="tabular-nums text-xs text-neutral-500 transition-colors duration-200 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
            {{ group.items.length }} news
          </span>
          <!-- Not `rotate-180`: another stylesheet also defines it (`rotate: 180deg`), the two add up to 360deg -->
          <Icon
            name="uil:angle-down"
            class="size-4 text-neutral-500 transition-transform duration-200 dark:text-neutral-400"
            :style="{ transform: isOpen(group.year) ? 'rotate(180deg)' : 'none' }"
          />
        </button>

        <template v-if="isOpen(group.year)">
          <div
            v-for="(item, index) in group.items"
            :key="item.title + item.date.toString()"
            v-bind="itemEnter(index)"
            class="[--enter-duration:0.4s] [--enter-ease:var(--ease-out)] [--enter-y:10px]"
          >
            <component
              :is="hasLink(item) ? 'a' : 'div'"
              :href="hasLink(item) ? getFirstLink(item) : undefined"
              :target="hasLink(item) ? '_blank' : undefined"
              :rel="hasLink(item) ? 'noopener noreferrer' : undefined"
              class="block px-3 py-3 transition-colors duration-300 ease-out -mx-3"
              :class="{ 'pressable hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer group': hasLink(item) }"
            >
              <!-- Mobile: Stacked layout -->
              <div class="flex flex-col gap-2 md:hidden">
                <!-- Date + Categories row -->
                <div class="flex items-center justify-between">
                  <time :datetime="monthAttr(item.date)" class="month-slot tabular-nums text-xs">
                    <span aria-hidden="true" class="invisible font-medium">{{ item.date.getFullYear() }}</span>
                    <span class="text-right text-neutral-500 dark:text-neutral-400">{{ monthLabel(item.date) }}</span>
                  </time>
                  <div class="flex items-center gap-1.5">
                    <div class="flex items-center gap-1">
                      <span
                        v-for="cat in item.categories?.slice(0, 2)"
                        :key="cat"
                        class="whitespace-nowrap bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      >
                        {{ cat }}
                      </span>
                    </div>
                    <LinkArrow
                      class="h-2.5 w-2.5 transition-[opacity,transform] duration-300"
                      :class="hasLink(item) ? 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : 'opacity-0'"
                    />
                  </div>
                </div>
                <!-- Title + Content -->
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium leading-snug">{{ item.title }}</span>
                  <span v-if="item.content" class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.content }}</span>
                </div>
              </div>

              <!-- Desktop: Grid layout -->
              <div class="grid-cols-[auto_1fr_auto] hidden items-baseline gap-4 md:grid">
                <time :datetime="monthAttr(item.date)" class="month-slot tabular-nums text-xs">
                  <span aria-hidden="true" class="invisible font-medium">{{ item.date.getFullYear() }}</span>
                  <span class="text-right text-neutral-500 dark:text-neutral-400">{{ monthLabel(item.date) }}</span>
                </time>

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
                  <LinkArrow
                    class="h-2.5 w-2.5 transition-[opacity,transform] duration-300"
                    :class="hasLink(item) ? 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : 'opacity-0'"
                  />
                </div>
              </div>
            </component>
          </div>
        </template>
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
  </div>
</template>

<style scoped>
/* Stacks an invisible year behind the month: the slot takes the year's width and the month sits flush right in it */
.month-slot {
  display: inline-grid;
}

.month-slot > * {
  grid-area: 1 / 1;
}
</style>
