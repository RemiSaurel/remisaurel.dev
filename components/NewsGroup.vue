<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v';

defineProps<{
  group: GroupedNewsItem
}>();
</script>

<template>
  <div class="relative">
    <div class="my-1 text-zinc-400 font-semibold text-lg cursor-default tracking-tight">
      {{ group.monthYear }}
    </div>
    <div class="flex flex-col pl-2 gap-4">
      <AnimatePresence>
        <motion.div
          v-for="item in group.items" 
          :key="item.title"
          :initial="{ opacity: 0, x: -10 }"
          :animate="{ opacity: 1, x: 0 }"
          :exit="{ opacity: 0, x: 10 }"
          :transition="{ duration: 0.2, ease: 'easeOut' }"
          layout
        >
          <NewsItem :item="item" />
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
</template>
