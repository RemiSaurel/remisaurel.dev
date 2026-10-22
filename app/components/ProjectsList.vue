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
      class="project-row group rounded-xl px-3 py-2.5 transition-colors duration-150 ease-out hover:bg-neutral-100/70 dark:hover:bg-neutral-800/60"
      :class="{ 'year-start': index > 0 && isFirstOfYear(index) }"
    >
      <span
        class="tabular-nums [grid-area:date] text-xs text-neutral-500 dark:text-neutral-400"
        :class="{ 'hidden md:block md:invisible': !isFirstOfYear(index) }"
      >
        {{ project.date }}
      </span>

      <div class="[grid-area:body] min-w-0 flex items-center gap-3">
        <!-- Same sheet tile as the posts and explorations lists, holding the project's icon -->
        <span
          v-if="project.icon"
          class="project-tile sheet grid size-9 shrink-0 place-items-center rounded-[10px] text-neutral-600 dark:text-neutral-300"
          aria-hidden="true"
        >
          <Icon :name="project.icon" class="size-4.5" />
        </span>
        <div class="min-w-0 flex flex-col gap-0.5">
          <h2 class="m-0 text-sm text-neutral-900 font-medium dark:text-neutral-100">
            {{ project.title }}
          </h2>
          <span class="line-clamp-2 md:line-clamp-none text-sm text-neutral-500 leading-snug dark:text-neutral-400">{{ project.description }}</span>
        </div>
      </div>

      <div class="[grid-area:meta] flex items-center self-center justify-between gap-3 pl-12 md:justify-end md:pl-0">
        <TechStack v-if="project.stack?.length" :stack="project.stack" />
        <div class="order-first w-11 flex justify-start gap-3 md:order-none md:justify-end">
          <a
            v-for="(link, key) in project.links"
            :key="key"
            :href="link"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="`${project.title} ${key}`"
            class="flex pressable rounded-md p-1.5 text-neutral-500 transition-colors duration-200 -m-1.5 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
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
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas:
    'date'
    'body'
    'meta';
  gap: 0.5rem 1rem;
  align-items: start;
}

@media (min-width: 768px) {
  .project-row {
    grid-template-columns: 44px minmax(0, 1fr) auto;
    grid-template-areas: 'date body meta';
    align-items: center;
  }
}

/* A new year starts after a hairline, kept off the row so its rounded hover never touches it */
.project-row.year-start {
  margin-top: 0.75rem;
}

.project-row.year-start::before {
  content: '';
  position: absolute;
  top: -0.375rem;
  left: 0.75rem;
  right: 0.75rem;
  height: 1px;
  background-color: rgb(229 229 229 / 0.7);
}

.dark .project-row.year-start::before {
  background-color: rgb(38 38 38);
}

.dark .project-tile,
.dark .project-row :deep(.tech-stack-item) {
  background-color: rgb(10 10 10);
}

.project-tile {
  transition: transform var(--duration-short) var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .group:hover .project-tile {
    transform: translateY(-1px) rotate(-3deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .group:hover .project-tile {
    transform: none;
  }
}
</style>
