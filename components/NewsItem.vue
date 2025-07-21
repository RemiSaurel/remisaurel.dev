<script setup lang="ts">
import { motion, AnimatePresence } from 'motion-v';

defineProps<{
  item: NewsItem
}>();

const { toggleExpanded, isExpanded } = useNews();
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <div class="flex flex-wrap gap-1 items-baseline">
      <!-- For items with content, make title clickable -->
      <div class="font-medium pr-3">
        {{ item.title }}
        <span v-if="item.content" class="text-xs ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer select-none" 
        @click="toggleExpanded(item.title)">
          {{ isExpanded(item.title) ? 'See less' : 'See more' }}
        </span>
      </div>
      
      <div class="flex gap-2">
        <span v-for="link in item.links" :key="link.url" class="text-sm">
          <ProseA 
            :href="link.url" 
            target="_blank"
          >
            {{ link.text }}
          </ProseA>
        </span>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-1">
      <div v-for="(category, index) in item.categories" :key="index" class="text-xs text-neutral-7 bg-neutral-1 dark:bg-neutral-700 dark:text-neutral-400 rounded py-1 px-2">
          {{ category }}
      </div>
    </div>
    
    <!-- Collapsible content section with instant layout changes -->
    <div 
      v-if="item.content && isExpanded(item.title)"
      class="text-sm text-zinc-500 dark:text-zinc-400 mt-1 overflow-hidden"
      :class="{ 'animate-expand': isExpanded(item.title) }"
    >
      {{ item.content }}
    </div>
  </div>
</template>

<style scoped>
.animate-expand {
  animation: expandContent 0.3s ease-out;
}

@keyframes expandContent {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    max-height: 200px;
    transform: translateY(0);
  }
}
</style>

