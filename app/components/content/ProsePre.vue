<script setup lang="ts">
defineProps({
  code: {
    type: String,
    default: '',
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
})
</script>

<template>
  <span class="mb-1 text-sm text-gray-500 dark:text-gray-400">{{
    filename
  }}</span>
  <div class="mt-1 rounded bg-zinc-1 p-1 px-4 dark:bg-zinc-800">
    <pre :class="$props.class"><slot /></pre>
  </div>
</template>

<style>
pre code .line {
  display: block;
}
</style>
