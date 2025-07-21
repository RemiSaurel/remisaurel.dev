<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v';

interface TransitionProps {
  duration?: number;
  delay?: number;
  ease?: number[] | string;
}

const props = defineProps<{
  transition?: TransitionProps
}>();

const { groupedNews, uniqueNewsCategories, toggleCategory, isCategoryActive, clearFilters, activeNewsCategories } = useNews();

const { isFirstVisit } = useFirstVisit();

const isInitialLoad = computed(() => isFirstVisit.value);

const animations = {
  // Initial load animations with delays and springs
  initial: {
    container: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { 
        duration: 0.8, 
        delay: props.transition?.delay || 0, 
        type: 'spring',
        stiffness: 300,
        damping: 30,
        ease: [0.25, 0.46, 0.45, 0.94] 
      }
    },
    header: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.6, delay: (props.transition?.delay || 0) + 0.2 }
    },
    title: {
      initial: { opacity: 0, scale: 0.9, y: 15 },
      animate: { opacity: 1, scale: 1, y: 0 },
      transition: { 
        duration: 0.6, 
        delay: (props.transition?.delay || 0) + 0.1, 
        type: 'spring',
        stiffness: 400,
        damping: 25,
        ease: [0.34, 1.56, 0.64, 1] // Bouncy spring for title
      }
    },
    tag: (index: number) => ({
      initial: { opacity: 0, scale: 0.8, y: 15 },
      animate: { opacity: 1, scale: 1, y: 0 },
      transition: { 
        duration: 0.5, 
        delay: (props.transition?.delay || 0) + 0.3 + index * 0.08, 
        type: 'spring',
        stiffness: 400,
        damping: 25,
        ease: [0.34, 1.56, 0.64, 1] // Bouncy easing for spring effect
      }
    }),
    trashIcon: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      transition: { 
        duration: 0.4, 
        delay: (props.transition?.delay || 0) + 0.3 + uniqueNewsCategories.value.length * 0.08 + 0.1,
        type: 'spring',
        stiffness: 350,
        damping: 20,
        ease: [0.34, 1.56, 0.64, 1]
      }
    },
    content: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: { duration: 0.4, delay: (props.transition?.delay || 0) + 0.8 }
    },
    group: (groupIndex: number) => ({
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { 
        duration: 0.5, 
        delay: (props.transition?.delay || 0) + 0.7 + groupIndex * 0.12,
        type: 'spring',
        stiffness: 320,
        damping: 28,
        ease: [0.23, 1, 0.32, 1]
      }
    })
  },
  
  // Instant animations for return visits
  instant: {
    container: {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 }
    },
    header: {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      transition: { duration: 0 }
    },
    title: {
      initial: { opacity: 1, scale: 1, y: 0 },
      animate: { opacity: 1, scale: 1, y: 0 },
      transition: { duration: 0 }
    },
    tag: () => ({
      initial: { opacity: 1, scale: 1, y: 0 },
      animate: { opacity: 1, scale: 1, y: 0 },
      transition: { duration: 0 }
    }),
    trashIcon: {
      initial: { opacity: 1, scale: 1 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0 }
    },
    content: {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      transition: { duration: 0 }
    },
    group: () => ({
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0 }
    })
  },
  
  // Smooth filtering animations - instant layout updates
  filtering: {
    group: {
      exit: { opacity: 0, y: -10 },
      transition: { 
        duration: 0.2, 
        ease: [0.23, 1, 0.32, 1]
      }
    }
  }
};

const currentAnimations = computed(() => {
  return isFirstVisit.value ? animations.initial : animations.instant;
});
</script>

<template>
  <motion.div 
    class="flex flex-col gap-2"
    :initial="currentAnimations.container.initial"
    :animate="currentAnimations.container.animate"
    :transition="currentAnimations.container.transition"
  >
    <motion.div 
      class="flex flex-col gap-1"
      :initial="currentAnimations.header.initial"
      :animate="currentAnimations.header.animate"
      :transition="currentAnimations.header.transition"
    >
      <motion.div 
        class="text-xl font-semibold"
        :initial="currentAnimations.title.initial"
        :animate="currentAnimations.title.animate"
        :transition="currentAnimations.title.transition"
      >
        Recent news
      </motion.div>
      
      <div class="flex gap-2 items-center flex-wrap">
        <motion.div
          v-for="(category, index) in uniqueNewsCategories"
          :key="category"
          v-bind="currentAnimations.tag(index)"
        >
          <NewsCategoryTag
            :category="category"
            :is-active="isCategoryActive(category)"
            @click="toggleCategory"
          />
        </motion.div>
        
        <motion.div
          :initial="currentAnimations.trashIcon.initial"
          :animate="currentAnimations.trashIcon.animate"
          :transition="currentAnimations.trashIcon.transition"
          class="flex items-center"
        >
          <Icon 
            name="lucide:trash"
            class="ml-2 transition-colors"
            :class="[
              activeNewsCategories.length > 0 ? 'text-red-500 cursor-pointer' : 'text-zinc-400 cursor-not-allowed'
            ]"
            @click="clearFilters"
          />
        </motion.div>
      </div>
    </motion.div>

    <motion.div 
      class="flex flex-col gap-2 relative"
      :initial="currentAnimations.content.initial"
      :animate="currentAnimations.content.animate"
      :transition="currentAnimations.content.transition"
    >
      <AnimatePresence>
        <motion.div
          v-for="(group, groupIndex) in groupedNews" 
          :key="group.monthYear"
          v-bind="currentAnimations.group(groupIndex)"
          :exit="animations.filtering.group.exit"
        >
          <NewsGroup 
            :group="group" 
            :group-index="groupIndex" 
            :is-first-visit="isInitialLoad" 
          />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  </motion.div>
</template>
