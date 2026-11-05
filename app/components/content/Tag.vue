<script setup lang="ts">
defineProps<{
  color: 'blue' | 'yellow' | 'red' | 'green' | 'purple' | 'gray' | 'cyan' | 'lime' | 'wine' | 'grass'
}>()

const c = {
  blue: 'bg-blue-600',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  green: 'bg-green-500',
  grass: 'bg-green-800',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
  gray: 'bg-gray-500',
  lime: 'bg-lime-400',
  wine: 'bg-pink-800',
}
</script>

<template>
  <!-- Spans, not divs: a tag sits inside a paragraph, and a div there breaks hydration -->
  <span
    class="inline-flex items-baseline border-1 border-zinc-2 rounded-lg border-solid px-2 text-sm font-400 dark:border-zinc-7"
    :class="color"
  >
    <span class="mr-2 size-2 rounded-full" :class="c[color]" />
    <slot mdc-unwrap="p" />
  </span>
</template>
