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
  <div
    class="group h-full flex flex-col justify-between gap-3 bg-neutral-100/60 px-4 pb-2 pt-4 transition-all duration-300 ease-out dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800"
  >
    <div class="flex flex-col gap-2">
      <div class="flex items-start justify-between gap-3">
        <h2 class="m-0 text-base text-neutral-900 font-semibold leading-snug dark:text-neutral-100">
          {{ project.title }}
        </h2>
        <span v-if="project.icon" class="shrink-0 text-lg leading-none opacity-70">{{ project.icon }}</span>
      </div>

      <p class="m-0 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
        {{ project.description }}
      </p>
    </div>

    <div class="flex items-center justify-between">
      <div
        v-if="project.links && Object.keys(project.links).length"
        class="flex gap-3"
      >
        <a
          v-for="(link, key) in project.links"
          :key="key"
          :href="link"
          target="_blank"
          rel="noopener noreferrer"
          class="pressable text-neutral-400 transition-colors duration-200 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <Icon :name="getIconName(key)" class="size-4" />
        </a>
      </div>
      <div v-else />
      <span class="tabular-nums text-xs text-neutral-400 dark:text-neutral-500">{{ project.date }}</span>
    </div>
  </div>
</template>
