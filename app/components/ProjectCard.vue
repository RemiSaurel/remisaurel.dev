<script setup lang="ts">
import { motion } from 'motion-v'
import type { Project } from '~/pages/projects/index.vue'

defineProps<{
  project: Project
}>()

const cardHover = useMotionHover({ y: -4 })
const linkHover = useMotionHover({ scale: 1.15 })

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
  <motion.div
    class="group relative min-h-24 min-w-42 flex flex-col gap-2 overflow-clip border-zinc-1 border-t-solid bg-zinc-1/60 px-4 pb-2 pt-4 transition-all duration-500 dark:border-zinc-5 dark:bg-zinc-7 hover:bg-zinc-2/60 dark:hover:bg-zinc-6"
    :while-hover="cardHover"
    :transition="{ type: 'spring', stiffness: 300, damping: 20 }"
  >
    <div
      class="absolute text-5xl opacity-40 transition-all duration-400 -right-3 -top-3 group-hover:translate-x--3 group-hover:translate-y-2 -rotate-30 group-hover:scale-120 group-hover:opacity-50 group-hover:-rotate-10"
    >
      {{ project.icon }}
    </div>
    <div class="h-full flex flex-col justify-between gap-8">
      <div
        class="flex flex-col justify-between gap-2 text-zinc-5 transition-all duration-500 dark:text-zinc-3 group-hover:text-zinc-8 dark:group-hover:text-zinc-1"
      >
        <h2 class="m-0 text-xl font-semibold">
          {{ project.title }}
        </h2>

        <div class="flex text-sm leading-tight opacity-70">
          {{ project.description }}
        </div>
      </div>

      <div class="flex justify-between text-zinc-500 dark:text-zinc-400">
        <div
          v-if="project.links && Object.keys(project.links).length"
          class="flex gap-4"
        >
          <motion.a
            v-for="(link, key) in project.links"
            :key="key"
            :href="link"
            target="_blank"
            class="pressable transition hover:text-zinc-700 dark:hover:text-zinc-2"
            :while-hover="linkHover"
            :transition="{ type: 'spring', stiffness: 400, damping: 17 }"
          >
            <Icon :name="getIconName(key)" class="size-5" />
          </motion.a>
        </div>
        <div v-else class="ml-auto" />
        <div>
          {{ project.date }}
        </div>
      </div>
    </div>
  </motion.div>
</template>
