<script setup lang="ts">
import type { PropType } from 'vue'

const props = defineProps({
  href: {
    type: String,
    default: '',
  },
  target: {
    type: String as PropType<
      | '_blank'
      | '_parent'
      | '_self'
      | '_top'
      | (string & object)
      | null
      | undefined
    >,
    default: undefined,
    required: false,
  },
})
</script>

<template>
  <NuxtLink
    :href="props.href"
    :target="props.target"
    class="group inline-flex items-center border-2 border-zinc-300 border-b-solid text-zinc-5 leading-none transition duration-500 dark:border-zinc-700 hover:border-blue-500 dark:text-zinc-4 hover:text-blue-700 dark:hover:text-blue-2"
  >
    <slot />
    <Icon
      name="uil:arrow-up-right"
      class="relative size-5 bg-zinc-4 transition duration-500 -right-0.5 dark:bg-zinc-4 group-hover:bg-blue-6 dark:group-hover:bg-blue-2"
    />
  </NuxtLink>
</template>
