<script setup lang="ts">
import { motion } from 'motion-v';

defineProps<{
  transition?: object
}>();
</script>

<template>
  <motion.div 
    :initial="{ opacity: 0 }" 
    :animate="{ opacity: 1}" 
    :transition="transition || { duration: 1 }"
  >
    <div class="flex items-center gap-2">
      <NuxtImg src="/photo.png" class="rounded-full size-24"></NuxtImg>
      <div class="flex flex-col ml-2">
        <div class="text-2xl font-semibold">Rémi Saurel</div>
        <div class="text-zinc-4 text-sm -mt-1 font-light">remi.saurel [at] irit.fr</div>
        <div class="flex flex-wrap gap-2 mt-1">
      <IconLink iconName="academicons:google-scholar" route="https://scholar.google.com/citations?user=r8AM0OIAAAAJ&hl=fr" size='sm' external>Scholar</IconLink>
      <IconLink iconName="i-simple-icons-x" route="https://twitter.com/remisaurel" size='sm' external>Twitter</IconLink>
      <IconLink iconName="uil:linkedin" route="https://www.linkedin.com/in/r%C3%A9mi-saurel/" size='sm' external>LinkedIn</IconLink>
      <IconLink iconName="uil:github-alt" route="https://github.com/remisaurel" size='sm' external>GitHub</IconLink>
    </div>
      </div>
    </div>
    
  </motion.div>
</template>
