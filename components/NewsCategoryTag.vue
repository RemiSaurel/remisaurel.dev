<script setup lang="ts">
import { motion } from 'motion-v';

interface Props {
  category: string;
  isActive: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  click: [category: string];
}>();

function handleClick(category: string) {
  emit('click', category);
}
</script>

<template>
  <motion.div
    class="rounded-lg select-none text-sm border border-solid px-2 py-0.5 hover:cursor-pointer transition duration-500"
    :class="isActive 
      ? 'bg-blue-100 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200' 
      : 'border-neutral-200 dark:border-neutral-500 hover:bg-blue-50 dark:hover:bg-blue-900 hover:border-blue-200 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300'"
    @click="handleClick(category)"
  >
    {{ category }}
  </motion.div>
</template>
