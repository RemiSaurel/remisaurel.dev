<script setup lang="ts">
import { motion } from 'motion-v';

interface TransitionProps {
  duration?: number;
  delay?: number;
  ease?: number[] | string;
}

defineProps<{
  transition?: TransitionProps
}>();
</script>

<template>
  <div class="flex flex-col items-center md:items-unset md:flex-row gap-4">
    <motion.div 
      class="flex flex-col gap-2"
      :initial="(transition?.duration || 0) > 0 ? { opacity: 0, scale: 0.9 } : { opacity: 1, scale: 1 }" 
      :animate="{ opacity: 1, scale: 1 }"
      :transition="(transition?.duration || 0) > 0 ? (transition || { duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }) : { duration: 0 }"
    >
      <NuxtImg src="/photo.png" class="rounded-lg w-42"></NuxtImg>
      <motion.div 
        class="flex flex-wrap gap-2 mt-1"
        :initial="(transition?.duration || 0) > 0 ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="(transition?.duration || 0) > 0 ? { duration: 0.6, delay: (transition?.delay || 0) + 0.3, ease: [0.25, 0.46, 0.45, 0.94] } : { duration: 0 }"
      >
        <IconLink iconName="academicons:google-scholar" route="https://scholar.google.com/citations?user=r8AM0OIAAAAJ&hl=fr" external></IconLink>
        <IconLink iconName="i-simple-icons-x" route="https://twitter.com/remisaurel" external></IconLink>
        <IconLink iconName="uil:linkedin" route="https://www.linkedin.com/in/r%C3%A9mi-saurel/" external></IconLink>
        <IconLink iconName="uil:github-alt" route="https://github.com/remisaurel" external></IconLink>
      </motion.div>
    </motion.div>
    
    <div class="flex flex-col ml-2">
      <motion.div 
        class="flex flex-col gap-1 pb-4"
        :initial="(transition?.duration || 0) > 0 ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="(transition?.duration || 0) > 0 ? { duration: 0.6, delay: (transition?.delay || 0) + 0.1, ease: [0.25, 0.46, 0.45, 0.94] } : { duration: 0 }"
      >
        <div class="text-2xl font-semibold">Hi! I'm Rémi</div>
        <div class="text-zinc-4 text-sm -mt-1 font-light pb-2">remi.saurel [at] irit.fr</div>
      </motion.div>
      <motion.div
        :initial="(transition?.duration || 0) > 0 ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="(transition?.duration || 0) > 0 ? { duration: 0.8, delay: (transition?.delay || 0), ease: [0.25, 0.46, 0.45, 0.94] } : { duration: 0 }"
      >
        <BioSection />
      </motion.div>
    </div>
  </div>
</template>
