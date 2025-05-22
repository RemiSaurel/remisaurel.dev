<script setup lang="ts">
import { motion } from 'motion-v';

defineProps<{
  transition: object
}>();
</script>

<template>
  <motion.div 
    :initial="{ opacity: 0 }" 
    :animate="{ opacity: 1}" 
    :transition="transition"
    class="inline-flex flex-wrap gap-1"
  >
    You can find blog<ProseA href="/posts"> posts</ProseA>, <ProseA href="/teaching"> teaching</ProseA> and some
    <ProseA href="/projects"> projects </ProseA> I've been working on.
  </motion.div>
</template>
