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
  >
    <Separator />
  </motion.div>
</template>
