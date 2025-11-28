<script setup lang="ts">
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="flex flex-col gap-1 w-full">
    <div class="text-lg font-semibold m-0">
      {{ title }}
    </div>

    <div class="flex flex-wrap items-center justify-center gap-4 p-8 rounded-lg border-solid border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950">
      <slot />
    </div>
  </div>
</template>
