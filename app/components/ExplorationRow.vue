<script setup lang="ts">
interface ExplorationRowProps {
  to: string
  title: string
  description: string
  status?: 'draft' | 'wip' | 'published'
  icon?: string
  date?: Date | string
}

const props = defineProps<ExplorationRowProps>()

const isDraft = computed(() => props.status === 'draft')
// In production a draft is only a teaser: same row, but nothing to open
const isTeaser = computed(() => isDraft.value && !SHOW_DRAFTS)

const NuxtLink = resolveComponent('NuxtLink')

const { play } = useSound()
</script>

<template>
  <!-- No `group` on a teaser: the list's hover highlight skips it -->
  <component
    :is="isTeaser ? 'div' : NuxtLink"
    :to="isTeaser ? undefined : to"
    class="flex items-center gap-4 rounded-xl px-2 py-2 -mx-2"
    :class="{ draft: isDraft, teaser: isTeaser, group: !isTeaser }"
    :aria-disabled="isTeaser || undefined"
    @click="!isTeaser && play('navigate', { emphasis: 'subtle', volume: 0.5 })"
  >
    <!-- The tile is a small sheet: an icon when the exploration has one, a few lines of text otherwise -->
    <RowTile :dashed="isDraft" aria-hidden="true">
      <Icon v-if="icon" :name="icon" class="size-[18px]" />
      <span v-else class="w-[20px] flex flex-col gap-[4px]">
        <span class="h-[2px] w-full rounded-full bg-current" />
        <span class="h-[2px] w-full rounded-full bg-current" />
        <span class="h-[2px] w-full rounded-full bg-current" />
        <span class="h-[2px] w-3/5 rounded-full bg-current" />
      </span>
    </RowTile>

    <span class="min-w-0 flex flex-col">
      <span class="flex items-center gap-2">
        <span class="truncate text-base text-neutral-800 font-medium transition-colors duration-150 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white">
          {{ title }}
        </span>
        <!-- A draft is a promise: "Soon", in a light blue -->
        <Chip v-if="isDraft" tone="sky" size="badge" icon="lucide:clock" class="shrink-0">
          Soon
        </Chip>
        <Chip v-else-if="status === 'wip'" tone="outline" size="badge" class="shrink-0">
          WIP
        </Chip>
        <NewTag v-if="!isDraft && isNew(date)" />
      </span>
      <span class="truncate text-[13px] text-neutral-500 dark:text-neutral-400">
        {{ description }}
      </span>
    </span>
  </component>
</template>

<style scoped>
/* A draft sits back until you reach for it */
.draft > span:not(.tile) {
  opacity: 0.6;
  transition: opacity var(--duration-short) var(--ease-out);
}

.draft:not(.teaser):hover > span:not(.tile),
.draft:not(.teaser):focus-visible > span:not(.tile) {
  opacity: 1;
}

.teaser {
  cursor: default;
  user-select: none;
}
</style>
