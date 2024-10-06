<script setup lang="ts">
defineProps<{
  iconName: string;
}>();
</script>

<template>
  <ClientOnly>
    <div class="inline-flex relative items-baseline">
      <Icon
        :name="iconName"
        class="size-4 mr-1 bg-zinc-4 relative top-0.5 group-hover:bg-zinc-6 dark:bg-zinc-4 dark:group-hover:bg-zinc-2 transition duration-500"
      />
      <span class="text-zinc-500 dark:text-zinc-400">
        <slot />
      </span>
    </div>
  </ClientOnly>
</template>
