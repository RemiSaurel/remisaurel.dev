<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v';

defineProps<{
  transition: object
}>();

const { groupedNews, uniqueNewsCategories, toggleCategory, isCategoryActive, clearFilters, activeNewsCategories } = useNews();
</script>

<template>
  <motion.div 
    :initial="{ opacity: 0 }" 
    :animate="{ opacity: 1}" 
    :transition="transition"
    class="flex flex-col gap-2"
  >
  <div class="flex flex-col gap-1">
    <div class="text-xl font-semibold">Recent news</div>
    <div class="flex gap-2 items-center flex-wrap">
      <NewsCategoryTag
        v-for="category in uniqueNewsCategories"
        :key="category"
        :category="category"
        :is-active="isCategoryActive(category)"
        @click="toggleCategory"
      />
      <Icon 
        name="lucide:trash"
        class="ml-2  transition-colors"
        :class="[
          activeNewsCategories.length > 0 ? 'text-red-500 cursor-pointer' : 'text-zinc-400 cursor-not-allowed'
        ]"
        @click="clearFilters"
      />
    </div>
  </div>

    <div class="flex flex-col gap-2 relative">
      <AnimatePresence>
        <motion.div
          v-for="group in groupedNews" 
          :key="group.monthYear"
          :initial="{ opacity: 0, x: -10 }"
          :animate="{ opacity: 1, x: 0 }"
          :exit="{ opacity: 0, x: 10 }"
          :transition="{ duration: 0.2, ease: 'easeOut' }"
          layout
        >
          <NewsGroup :group="group" />
        </motion.div>
      </AnimatePresence>
    </div>
  </motion.div>
</template>
