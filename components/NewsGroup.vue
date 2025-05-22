<script setup lang="ts">
defineProps<{
  group: GroupedNewsItem
}>();
</script>

<template>
  <div class="relative">
    <div class="my-1 text-zinc-400 font-semibold text-lg cursor-default tracking-tight">
      {{ group.monthYear }}
    </div>
    <div class="flex flex-col pl-2 gap-2">
      <NewsItem 
        v-for="item in group.items" 
        :key="item.title"
        :item="item"
      />
    </div>
  </div>
</template>
