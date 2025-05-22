<script setup lang="ts">
import { motion } from 'motion-v';

defineProps<{
  transition: object
}>();

const { groupedNews } = useNews();
</script>

<template>
  <motion.div 
    :initial="{ opacity: 0 }" 
    :animate="{ opacity: 1}" 
    :transition="transition"
    class="flex flex-col gap-2"
  >
    <div class="text-xl font-semibold">Recent news</div>
    <div class="flex flex-col gap-2">
      <NewsGroup 
        v-for="group in groupedNews" 
        :key="group.monthYear"
        :group="group" 
      />
    </div>
  </motion.div>
</template>
