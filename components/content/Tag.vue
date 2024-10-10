<script setup lang="ts">
defineProps<{
  color: "blue" | "yellow" | "red" | "green" | "purple" | "gray";
}>();

const c = {
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
  gray: "bg-gray-500",
};
</script>
<template>
  <ClientOnly>
    <div
      class="border-solid font-400 text-sm border-1 border-zinc-2 dark:border-zinc-7 px-2 inline-flex items-baseline rounded-lg"
      :class="color"
    >
      <div class="size-2 rounded-full mr-2" :class="c[color]"></div>
      <ContentSlot :use="$slots.default" unwrap="p" /></div
  ></ClientOnly>
</template>
