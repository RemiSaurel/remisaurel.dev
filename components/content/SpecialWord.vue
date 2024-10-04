<script setup lang="ts">
defineProps<{
  iconName: string;
}>();
</script>

<template>
  <ClientOnly
    ><div class="inline-flex relative top-1 px-1">
      <Icon
        :name="iconName"
        class="size-5 mr-1 bg-zinc-4 group-hover:bg-zinc-6 dark:bg-zinc-4 dark:group-hover:bg-zinc-2 transition duration-500"
      />
      <ContentSlot :use="$slots.default" unwrap="p" />
    </div>
  </ClientOnly>
</template>
