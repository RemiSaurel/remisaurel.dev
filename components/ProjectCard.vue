<script setup lang="ts">
import type { Project } from "~/pages/projects/index.vue";

defineProps<{
  project: Project;
}>();

const getIconName = (key: string) => {
  switch (key) {
    case "github":
      return "lucide:github";
    case "demo":
      return "lucide:globe";
    default:
      return "";
  }
};
</script>

<template>
  <div
    class="relative min-w-42 min-h-24 dark:bg-zinc-7 border-t-solid bg-zinc-1/60 border-zinc-1 dark:border-zinc-5 rounded-lg p-4 flex flex-col gap-2 group overflow-clip hover:bg-zinc-2/60 dark:hover:bg-zinc-6 transition-all duration-500"
  >
    <div
      class="absolute -top-3 opacity-40 -right-3 -rotate-30 group-hover:-rotate-10 group-hover:translate-x--3 group-hover:translate-y-2 group-hover:opacity-50 group-hover:scale-120 transition-all duration-400 text-5xl"
    >
      {{ project.icon }}
    </div>
    <div class="flex flex-col gap-8 justify-between h-full">
      <div
        class="flex flex-col gap-2 justify-between dark:text-zinc-3 text-zinc-5 group-hover:text-zinc-8 dark:group-hover:text-zinc-1 transition-all duration-500"
      >
        <h2 class="text-xl font-semibold m-0">
          {{ project.title }}
        </h2>

        <div class="flex opacity-70 text-sm leading-tight">
          {{ project.description }}
        </div>
      </div>

      <div class="flex justify-between text-zinc-500 dark:text-zinc-400">
        <div
          v-if="project.links && Object.keys(project.links).length"
          class="flex gap-4"
        >
          <a
            v-for="(link, key) in project.links"
            :key="key"
            :href="link"
            target="_blank"
            class="hover:text-zinc-700 dark:hover:text-zinc-2 transition"
          >
            <Icon :name="getIconName(key)" class="size-5" />
          </a>
        </div>
        <div class="ml-auto" v-else></div>
        <div>
          {{ project.date }}
        </div>
      </div>
    </div>
  </div>
</template>
