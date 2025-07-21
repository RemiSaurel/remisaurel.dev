<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v';

const props = defineProps<{
  group: GroupedNewsItem,
  groupIndex?: number,
  isFirstVisit?: boolean
}>();

// Animation configurations
const itemAnimations = {
  initial: {
    initial: { opacity: 0, scale: 0.96, y: 20, rotateX: -5 },
    animate: { opacity: 1, scale: 1, y: 0, rotateX: 0 },
    transition: (itemIndex: number) => ({ 
      duration: 0.5, 
      delay: itemIndex * 0.08,
      ease: [0.23, 1, 0.32, 1], // easeOutQuart for smooth deceleration
      type: 'spring',
      stiffness: 300,
      damping: 30
    })
  },
  instant: {
    initial: { opacity: 1, scale: 1, y: 0, rotateX: 0 },
    animate: { opacity: 1, scale: 1, y: 0, rotateX: 0 },
    transition: () => ({ duration: 0 })
  },
  filtering: {
    initial: { opacity: 0, scale: 0.96, y: 20, rotateX: -5 },
    animate: { opacity: 1, scale: 1, y: 0, rotateX: 0 },
    transition: { 
      duration: 0.4, 
      ease: [0.23, 1, 0.32, 1],
      type: 'spring',
      stiffness: 400,
      damping: 25
    }
  }
};

const currentAnimations = computed(() => {
  if (props.isFirstVisit) {
    return itemAnimations.initial;
  } else {
    return {
      initial: itemAnimations.filtering.initial,
      animate: itemAnimations.filtering.animate,
      transition: () => itemAnimations.filtering.transition
    };
  }
});
</script>

<template>
  <div class="relative">
    <div class="my-1 text-zinc-400 font-semibold text-lg cursor-default tracking-tight">
      {{ group.monthYear }}
    </div>
    <div class="flex flex-col pl-2 gap-4">
      <AnimatePresence>
        <motion.div
          v-for="(item, itemIndex) in group.items" 
          :key="item.title"
          :initial="currentAnimations.initial"
          :animate="currentAnimations.animate"
          :transition="currentAnimations.transition ? currentAnimations.transition(itemIndex) : undefined"
          style="transform-style: preserve-3d;"
        >
          <NewsItem :item="item" />
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
</template>
