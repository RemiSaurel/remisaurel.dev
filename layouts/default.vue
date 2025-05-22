<script setup lang="ts">
import { motion } from 'motion-v';

const navItems = [
  { route: '/', icon: 'lucide:house' },
  { route: '/posts', icon: 'uil:book-alt' },
  { route: '/projects', icon: 'lucide:laptop' },
  { route: '/teaching', icon: 'lucide:graduation-cap' },
];

// Animation config for nav buttons
const navButtonAnimation = {
  initial: { opacity: 0, y: 0, scale: 0 },
  animate: { opacity: 1, y: 0, scale: 1 },
transition: {
    type: 'spring',
    stiffness: 150,
    damping: 20,
    mass: 1,
    duration: 1
  }
};
</script>

<template>
  <div class="max-w-6xl m-auto pb-4">
    <nav class="flex items-center justify-end gap-3 p-2">
      <motion.div
        v-for="(item, index) in navItems" 
        :key="item.route"
        :initial="navButtonAnimation.initial"
        :animate="navButtonAnimation.animate"
        :transition="{
          ...navButtonAnimation.transition,
          delay: 0.2 + (index * 0.1)
        }"
      >
        <NavButton :route="item.route" :icon="item.icon" />
      </motion.div>
      
      <motion.div
        :initial="navButtonAnimation.initial"
        :animate="navButtonAnimation.animate"
        :transition="{
          ...navButtonAnimation.transition,
          delay: 0.2 + (navItems.length * 0.1)
        }"
      >
        <ColorModeSwitcher />
      </motion.div>
    </nav>

    <div class="px-3 md:px-0 max-w-3xl m-auto mt-12">
      <slot />
    </div>
  </div>
</template>