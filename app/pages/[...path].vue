<script setup lang="ts">
useSeoMeta({
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
})
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center gap-8">
    <div class="enter [--enter-y:20px] flex flex-col items-center gap-4">
      <span class="enter [--enter-delay:0.1s] [--enter-scale:0.8] [--enter-y:0] text-9xl text-neutral-300 font-light dark:text-neutral-700">
        404
      </span>

      <p class="text-lg text-neutral-600 dark:text-neutral-400">
        This page got lost in the void 👾
      </p>

      <NuxtLink
        to="/"
        class="group mt-2 inline-flex pressable items-center gap-2 text-sm text-neutral-500 transition-colors dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
      >
        <Icon name="uil:arrow-left" class="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
        Back to home
      </NuxtLink>
    </div>
  </div>
</template>
