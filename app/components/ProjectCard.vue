<script setup lang="ts">
import type { Project } from '~/pages/projects/index.vue'

defineProps<{
  project: Project
}>()

function getIconName(key: string) {
  switch (key) {
    case 'github':
      return 'lucide:github'
    case 'demo':
      return 'lucide:globe'
    default:
      return ''
  }
}
</script>

<template>
  <!-- A bigger sheet of the same paper as the posts and explorations tiles -->
  <div class="project-card sheet group h-full flex flex-col justify-between gap-4 rounded-2xl p-4">
    <div class="flex flex-col gap-3">
      <div class="flex items-center gap-3">
        <span
          v-if="project.icon"
          class="project-tile grid size-9 shrink-0 place-items-center border border-neutral-200 rounded-[10px] bg-neutral-50 text-neutral-600 dark:border-neutral-700/80 dark:bg-neutral-900/60 dark:text-neutral-300"
          aria-hidden="true"
        >
          <Icon :name="project.icon" class="size-4.5" />
        </span>
        <h2 class="m-0 min-w-0 text-base text-neutral-900 font-semibold leading-snug dark:text-neutral-100">
          {{ project.title }}
        </h2>
      </div>

      <p class="m-0 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
        {{ project.description }}
      </p>
    </div>

    <div class="flex items-center justify-between">
      <div
        v-if="project.links && Object.keys(project.links).length"
        class="flex gap-1 -my-1.5 -ml-1.5"
      >
        <a
          v-for="(link, key) in project.links"
          :key="key"
          :href="link"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${project.title} ${key}`"
          class="inline-flex pressable rounded-lg p-1.5 text-neutral-500 transition-colors duration-200 hover:bg-neutral-100 dark:text-neutral-400 hover:text-neutral-900 dark:hover:bg-neutral-700/60 dark:hover:text-neutral-100"
        >
          <Icon :name="getIconName(key)" class="size-4" />
        </a>
      </div>
      <div v-else />
      <div class="flex items-center gap-3">
        <TechStack v-if="project.stack?.length" :stack="project.stack" />
        <span class="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">{{ project.date }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-card {
  transition:
    border-color 150ms var(--ease-out);
}

.project-tile {
  transition: transform var(--duration-short) var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .project-card:hover {
    border-color: rgb(212 212 212);
  }

  .dark .project-card:hover {
    border-color: rgb(82 82 82);
  }

  .project-card:hover .project-tile {
    transform: rotate(-3deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-card:hover .project-tile {
    transform: none;
  }
}
</style>
