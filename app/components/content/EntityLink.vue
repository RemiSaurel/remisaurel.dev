<script setup lang="ts">
// An institution named in running text: its logo, then its name as an underlined link (same look as the home intro).
import { ENTITY_LOGOS } from '~/composables/useCursorLogo'

const props = defineProps<{
  entity: keyof typeof ENTITY_LOGOS
  href: string
}>()

const logo = ENTITY_LOGOS[props.entity]
</script>

<template>
  <a :href="props.href" target="_blank" rel="noopener noreferrer" class="font-medium">
    <img
      :src="logo.src"
      alt=""
      class="my-0 mr-1.5 inline-block h-5.5 w-5.5 rounded-none object-contain outline-0 align-text-bottom"
      :class="{ 'dark:invert': props.entity === 'ut' }"
    >
    <span class="underline decoration-neutral-400 underline-offset-2 dark:decoration-neutral-500"><slot /></span>
  </a>
</template>
