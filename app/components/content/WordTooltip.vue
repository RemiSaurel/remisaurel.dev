<script setup lang="ts">
defineProps<{
  tooltip: string
}>()
</script>

<template>
  <!-- Reka's tooltip opens on hover and on keyboard focus, and is announced to screen readers -->
  <UTooltip :text="tooltip">
    <span
      tabindex="0"
      class="cursor-help text-zinc-500 underline decoration-zinc-300 underline-offset-4 decoration-dotted dark:text-zinc-400 dark:decoration-zinc-600"
    >
      <slot />
    </span>
  </UTooltip>
</template>
