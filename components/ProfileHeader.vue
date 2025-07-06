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
    <div class="flex flex-col items-center md:items-unset md:flex-row gap-4">
      <div class="flex flex-col gap-2">
        <NuxtImg src="/photo.png" class="rounded-lg w-42"></NuxtImg>
        <div class="flex flex-wrap gap-2 mt-1">
          <IconLink iconName="academicons:google-scholar" route="https://scholar.google.com/citations?user=r8AM0OIAAAAJ&hl=fr" external></IconLink>
          <IconLink iconName="i-simple-icons-x" route="https://twitter.com/remisaurel" external></IconLink>
          <IconLink iconName="uil:linkedin" route="https://www.linkedin.com/in/r%C3%A9mi-saurel/" external></IconLink>
          <IconLink iconName="uil:github-alt" route="https://github.com/remisaurel" external></IconLink>
        </div>
      </div>
      <div class="flex flex-col ml-2">
        <div class="flex flex-col gap-1 pb-4">
          <div class="text-2xl font-semibold">Rémi Saurel</div>
          <div class="text-zinc-4 text-sm -mt-1 font-light pb-2">remi.saurel [at] irit.fr</div>
        </div>
        <BioSection />
      </div>
    </div>
    
  </motion.div>
</template>
