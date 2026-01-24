<script setup lang="ts">
import { motion } from 'motion-v';

interface Props {
  title?: string;
  link?: string;
  animate?: boolean;
  delay?: number;
}

const props = withDefaults(defineProps<Props>(), {
  animate: true,
  delay: 0
});

const transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94]
};
</script>

<template>
  <motion.section
    :initial="animate ? { opacity: 0, y: 15 } : { opacity: 1, y: 0 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="animate ? { ...transition, delay: delay } : { duration: 0 }"
    class="flex flex-col"
  >
    <!-- Divider line -->
    <div class="divider bg-neutral-200 dark:bg-neutral-800 mb-4"></div>
    
    <!-- Section header (optional) -->
    <component 
      v-if="title"
      :is="link ? 'a' : 'div'" 
      :href="link"
      class="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-neutral-800 my-2 group"
    >
      <div class="text-xl font-medium uppercase tracking-wide text-neutral-600 dark:text-neutral-400">{{ title }}</div>
      <svg 
        v-if="link"
        class="w-2.5 h-2.5 group-hover:rotate-45" 
        viewBox="0 0 11 11" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M8.4778 3.06917L1.23404 10.3129L0 9.0789L7.24376 1.83513L0.456622 1.71166L0.440628 0L10.1366 0.176392L10.313 9.87231L8.60128 9.85632L8.4778 3.06917Z" 
          fill="currentColor"
        />
      </svg>
    </component>

    <!-- Content slot -->
    <div>
      <slot />
    </div>
  </motion.section>
</template>
