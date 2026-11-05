<script setup lang="ts">
defineProps<{
  iconName: string
}>()
</script>

<template>
  <span class="relative inline-flex items-baseline">
    <Icon
      :name="iconName"
      class="relative top-0.5 mr-1 size-4 bg-zinc-4 transition duration-500 dark:bg-zinc-4 group-hover:bg-zinc-6 dark:group-hover:bg-zinc-2"
    />
    <span class="text-zinc-500 dark:text-zinc-400">
      <slot />
    </span>
  </span>
</template>
