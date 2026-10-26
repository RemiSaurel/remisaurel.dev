<script setup lang="ts">
import { useFirstVisit } from '~/composables/useFirstVisit'
import { news } from '~/news/news'

interface Props {
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  limit: 5,
})

const sortedNews = [...news].sort((a, b) => b.date.getTime() - a.date.getTime())

interface NewsYear {
  year: number
  items: typeof news
}

// Already sorted by date, so years come out newest first
const newsByYear = computed<NewsYear[]>(() => {
  const groups: NewsYear[] = []
  for (const item of sortedNews) {
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
  <div class="flex flex-col gap-1">
    <!-- News list -->
    <div class="flex flex-col gap-1">
      <template v-for="group in newsByYear" :key="group.year">
        <!-- Year divider: always there, it folds and unfolds the year -->
        <button
          type="button"
          class="group flex cursor-pointer items-center gap-3 py-1 text-left"
          :class="{ 'mt-3': group.year !== newsByYear[0]?.year }"
          :aria-expanded="isOpen(group.year)"
          :aria-label="`${isOpen(group.year) ? 'Hide' : 'Show'} the ${group.items.length} ${group.items.length === 1 ? 'update' : 'updates'} from ${group.year}`"
          @click="toggleYear(group.year)"
        >
          <span class="tabular-nums text-xs text-neutral-600 font-medium dark:text-neutral-300">{{ group.year }}</span>
          <span class="h-px flex-1 bg-neutral-200 transition-colors duration-200 dark:bg-neutral-800 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-700" />
          <span class="tabular-nums text-xs text-neutral-500 transition-colors duration-200 dark:text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-300">
            {{ group.items.length }} {{ group.items.length === 1 ? 'update' : 'updates' }}
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
              class="block rounded-xl px-3 py-3 transition-colors duration-150 ease-out -mx-3"
              :class="{ 'pressable hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer group': hasLink(item) }"
            >
              <!-- Mobile: tile + text, categories under the title -->
              <div class="flex items-start gap-3 md:hidden">
                <DateTile :date="item.date" />
                <div class="min-w-0 flex flex-1 flex-col gap-1.5">
                  <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium leading-snug">{{ item.title }}</span>
                    <span v-if="item.content" class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.content }}</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <Chip v-for="cat in item.categories?.slice(0, 2)" :key="cat">
                      {{ cat }}
                    </Chip>
                  </div>
                </div>
              </div>

              <!-- Desktop: Grid layout -->
              <div class="grid-cols-[auto_1fr_auto] hidden items-center gap-4 md:grid">
                <DateTile :date="item.date" />

                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium leading-snug">{{ item.title }}</span>
                  <span v-if="item.content" class="text-xs text-neutral-500 dark:text-neutral-400">{{ item.content }}</span>
                </div>

                <div class="flex flex-nowrap items-center justify-end gap-1.5">
                  <div class="flex items-center gap-1">
                    <Chip v-for="cat in item.categories?.slice(0, 2)" :key="cat" tone="outline">
                      {{ cat }}
                    </Chip>
                  </div>
                </div>
              </div>
            </component>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>
