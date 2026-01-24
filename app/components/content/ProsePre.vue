<template>
  <span class="text-sm mb-1 text-gray-500 dark:text-gray-400">{{
    filename
  }}</span>
  <div class="p-1 px-4 mt-1 bg-zinc-1 dark:bg-zinc-800 rounded">
    <pre :class="$props.class"><slot /></pre>
  </div>
</template>

<script setup lang="ts">
defineProps({
  code: {
    type: String,
    default: "",
  },
  language: {
    type: String,
    default: null,
  },
  filename: {
    type: String,
    default: null,
  },
  highlights: {
    type: Array as () => number[],
    default: () => [],
  },
  meta: {
    type: String,
    default: null,
  },
  class: {
    type: String,
    default: null,
  },
  style: {
    type: Object,
    default: null,
  },
});
</script>

<style>
pre code .line {
  display: block;
}
</style>
