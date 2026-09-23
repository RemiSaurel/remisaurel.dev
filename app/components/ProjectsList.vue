<script setup lang="ts">
import type { ListView } from '~/composables/useListView'
import type { Project } from '~/pages/projects/index.vue'
import { motion } from 'motion-v'

interface Props {
  projects: Project[]
  view?: ListView
  /** Swap layouts without animating (used when restoring the saved view on load). */
  instant?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  view: 'list',
  instant: false,
})

const { prefersReducedMotion } = usePrefersReducedMotion()

// Only the first render plays the scroll-in entrance; later view switches crossfade instead.
const hasSwitched = ref(false)
watch(() => props.view, () => {
  hasSwitched.value = true
})

const LINK_ICONS: Record<string, string> = {
  github: 'lucide:github',
  demo: 'lucide:globe',
}

// The year is only printed on the first row of each year, so rows read as a timeline.
function isFirstOfYear(index: number) {
  return index === 0 || props.projects[index - 1]!.date !== props.projects[index]!.date
}

// Only the items visible on load get a cascading stagger. Items revealed by scrolling
// enter as soon as they reach the viewport, otherwise lower ones wait on their index.
function entrance(index: number, columns: number) {
  if (prefersReducedMotion.value)
    return { initial: { opacity: 1, y: 0 }, whileInView: undefined, transition: { duration: 0 } }
  const delay = index < columns * 2 ? index * 0.05 : (index % columns) * 0.04
  return {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration: 0.35, delay, ease: EASE_OUT },
  }
}

/**
 * On a view switch, items appear already in place and un-blur with a tiny cascade,
 * the same way publications reveal their text.
 */
function reveal(index: number) {
  if (props.instant || prefersReducedMotion.value)
    return { initial: false as const, transition: { duration: 0 } }
  return {
    initial: { opacity: 0, filter: 'blur(6px)' },
    transition: { duration: 0.35, delay: Math.min(index, 8) * 0.025, ease: EASE_OUT },
  }
}

function itemMotion(index: number, columns: number) {
  if (!hasSwitched.value)
    return entrance(index, columns)
  const { initial, transition } = reveal(index)
  return { initial, whileInView: undefined, transition }
}

const REVEALED = { opacity: 1, y: 0, filter: 'blur(0px)' }
</script>

<template>
  <!-- List view -->
  <div v-if="props.view === 'list'" class="flex flex-col">
    <motion.div
      v-for="(project, index) in props.projects"
      :key="project.title"
      :initial="itemMotion(index, 1).initial"
      :animate="hasSwitched ? REVEALED : undefined"
      :while-in-view="itemMotion(index, 1).whileInView"
      :viewport="{ once: true, margin: '0px 0px 80px 0px' }"
      :transition="itemMotion(index, 1).transition"
      class="project-row px-3 py-2.5 transition-colors duration-300 ease-out hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
      :class="{ 'border-t border-neutral-200/70 dark:border-neutral-800': index > 0 && isFirstOfYear(index) }"
    >
      <span
        class="tabular-nums [grid-area:date] text-xs text-neutral-500 md:pt-0.5 dark:text-neutral-400"
        :class="{ 'hidden md:block md:invisible': !isFirstOfYear(index) }"
      >
        {{ project.date }}
      </span>

      <div class="[grid-area:body] min-w-0 flex items-baseline gap-2">
        <span v-if="project.icon" class="shrink-0 text-sm leading-none opacity-70" aria-hidden="true">{{ project.icon }}</span>
        <div class="min-w-0 flex flex-col gap-0.5">
          <span class="text-sm text-neutral-900 font-medium dark:text-neutral-100">{{ project.title }}</span>
          <span class="text-sm text-neutral-500 leading-snug dark:text-neutral-400">{{ project.description }}</span>
        </div>
      </div>

      <div class="[grid-area:meta] flex items-center justify-end gap-3">
        <TechStack v-if="project.stack?.length" :stack="project.stack" />
        <div class="w-11 flex justify-end gap-3">
          <a
            v-for="(link, key) in project.links"
            :key="key"
            :href="link"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${project.title} ${key}`"
            class="flex pressable text-neutral-500 transition-colors duration-200 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <Icon :name="LINK_ICONS[key] ?? ''" class="size-4" />
          </a>
        </div>
      </div>
    </motion.div>
  </div>

  <!-- Card view -->
  <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
    <motion.div
      v-for="(project, index) in props.projects"
      :key="project.title"
      :initial="itemMotion(index, 2).initial"
      :animate="hasSwitched ? REVEALED : undefined"
      :while-in-view="itemMotion(index, 2).whileInView"
      :viewport="{ once: true, margin: '0px 0px 80px 0px' }"
      :transition="itemMotion(index, 2).transition"
    >
      <ProjectCard :project="project" />
    </motion.div>
  </div>
</template>

<style scoped>
/* Mobile: the year heads its group, one project per row below. Desktop: one line per project. */
.project-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'date date'
    'body meta';
  gap: 0.25rem 1rem;
  align-items: start;
}

@media (min-width: 768px) {
  .project-row {
    grid-template-columns: 44px 1fr auto;
    grid-template-areas: 'date body meta';
  }
}
</style>
