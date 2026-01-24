<script setup lang="ts">
import { motion } from 'motion-v';

interface Props {
  animate?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  animate: true
});

const socialLinks = [
  { icon: 'academicons:google-scholar', url: 'https://scholar.google.com/citations?user=r8AM0OIAAAAJ&hl=fr', label: 'Google Scholar' },
  { icon: 'uil:github-alt', url: 'https://github.com/remisaurel', label: 'GitHub' },
  { icon: 'uil:linkedin', url: 'https://www.linkedin.com/in/r%C3%A9mi-saurel/', label: 'LinkedIn' },
  { icon: 'i-simple-icons-x', url: 'https://twitter.com/remisaurel', label: 'X' },
];

const transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94]
};
</script>

<template>
  <aside class="relative lg:sticky lg:top-8">
    <!-- Mobile: Horizontal layout with large photo -->
    <motion.div
      :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="animate ? { ...transition, delay: 0.1 } : { duration: 0 }"
      class="lg:hidden"
    >
      <div class="flex gap-4 items-start">
        <!-- Photo same size as desktop -->
        <NuxtImg 
          src="/photo.png" 
          alt="Rémi Saurel"
          class="size-40 object-cover shrink-0"
        />
        
        <!-- Info on right -->
        <div class="flex flex-col gap-1 min-w-0 pt-1">
          <h1 class="text-lg font-medium tracking-tight m-0">Rémi Saurel</h1>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 m-0">PhD Student</p>
          <p class="text-sm text-neutral-400 dark:text-neutral-500 m-0">IRIT Lab, Toulouse</p>
          <span class="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            remi.saurel [at] irit.fr
          </span>
        </div>
      </div>
      
      <!-- Social links below -->
      <div class="flex gap-2 mt-4">
        <a
          v-for="link in socialLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          class="inline-flex items-center justify-center size-8 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 hover:bg-neutral-900 dark:hover:bg-neutral-100 hover:text-white dark:hover:text-neutral-900"
        >
          <Icon :name="link.icon" class="size-4" />
        </a>
      </div>
    </motion.div>

    <!-- Desktop: Original vertical layout -->
    <div class="hidden lg:flex flex-col gap-3">
      <!-- Photo -->
      <motion.div
        :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="animate ? { ...transition, delay: 0.1 } : { duration: 0 }"
      >
        <NuxtImg 
          src="/photo.png" 
          alt="Rémi Saurel"
          class="w-full max-w-64 aspect-square object-cover transition-filter duration-300 hover:grayscale"
        />
      </motion.div>

      <!-- Name & Title -->
      <motion.div
        :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="animate ? { ...transition, delay: 0.2 } : { duration: 0 }"
        class="flex flex-col gap-0.5"
      >
        <h1 class="text-lg font-medium tracking-tight m-0">Rémi Saurel</h1>
        <p class="text-sm text-neutral-500 dark:text-neutral-400 m-0">PhD Student</p>
        <p class="text-sm text-neutral-400 dark:text-neutral-500 m-0">IRIT Lab, Toulouse</p>
      </motion.div>

      <!-- Contact -->
      <motion.div
        :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="animate ? { ...transition, delay: 0.25 } : { duration: 0 }"
        class="flex flex-col gap-1"
      >
        <span class="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Contact</span>
        <span class="text-sm text-neutral-500 dark:text-neutral-400">
          remi.saurel [at] irit.fr
        </span>
      </motion.div>

      <!-- Social Links -->
      <motion.div
        :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="animate ? { ...transition, delay: 0.3 } : { duration: 0 }"
        class="flex gap-2"
      >
        <a
          v-for="link in socialLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="link.label"
          class="inline-flex items-center justify-center size-8 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 hover:bg-neutral-900 dark:hover:bg-neutral-100 hover:text-white dark:hover:text-neutral-900"
        >
          <Icon :name="link.icon" class="size-4" />
        </a>
      </motion.div>
    </div>
  </aside>
</template>
