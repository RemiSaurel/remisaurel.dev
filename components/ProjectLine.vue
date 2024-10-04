<script setup lang="ts">
defineProps<{
  to: string;
  title: string;
  description: string;
}>();
</script>

<template>
  <NuxtLink :to="to">
    <div class="w-full flex flex-col gap-1 group">
      <h3
        class="text-md my-0 font-extrabold dark:text-zinc-500 text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition duration-500"
      >
        {{ title }}
      </h3>
      <h4
        class="text-sm my-0 font-medium dark:text-zinc-600 text-zinc-400 group-hover:text-zinc-500 dark:group-hover:text-zinc-500 transition duration-500"
      >
        {{ description }}
      </h4>
    </div>
  </NuxtLink>
</template>
