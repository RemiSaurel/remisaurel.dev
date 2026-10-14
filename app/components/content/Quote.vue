<script setup lang="ts">
const slots = defineSlots<{
  default: () => unknown
  source?: () => unknown
}>()
</script>

<template>
  <figure class="my-8">
    <blockquote class="font-quote border-l-2 border-zinc-300 pl-5 text-xl text-zinc-800 leading-relaxed dark:border-zinc-600 dark:text-zinc-200">
      <slot mdc-unwrap="p" />
    </blockquote>
    <figcaption v-if="slots.source" class="mt-2 pl-5.5 text-left text-sm not-italic text-zinc-500 dark:text-zinc-400">
      <slot name="source" mdc-unwrap="p" />
    </figcaption>
  </figure>
</template>
