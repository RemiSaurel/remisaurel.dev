<script setup lang="ts">
const props = defineProps<{
  item: NewsItem
}>();

const { toggleExpanded, isExpanded } = useNews();
</script>

<template>
  <div class="flex flex-col gap-0.5">
    <div class="flex flex-wrap gap-0.5 items-baseline">
      <!-- For items with content, make title clickable -->
      <div 
        class="font-medium pr-3"
        :class="{ 'cursor-pointer': item.content }" 
        @click="item.content ? toggleExpanded(item.title) : null"
      >
        {{ item.title }}
        <span v-if="item.content" class="text-xs ml-1 text-zinc-600 dark:text-zinc-400">
          {{ isExpanded(item.title) ? '▼' : '►' }}
        </span>
      </div>
      
      <div class="flex gap-2">
        <span v-for="link in item.links" :key="link.url" class="text-sm">
          <ProseA 
            :href="link.url" 
            target="_blank"
            class="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            {{ link.text }}
          </ProseA>
        </span>
      </div>
    </div>
    
    <!-- Collapsible content section -->
    <Transition name="slide">
      <div 
        v-if="item.content && isExpanded(item.title)"
        class="text-sm text-zinc-500 dark:text-zinc-400 pl-4 mt-1"
      >
        {{ item.content }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
  max-height: 200px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
