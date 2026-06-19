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
    class="pressable group inline-flex items-center gap-0.5 underline underline-offset-2 decoration-zinc-400 transition-colors duration-300 hover:text-blue-600 hover:decoration-blue-500 dark:decoration-zinc-500 dark:hover:text-blue-300"
  >
    <slot />
    <Icon
      name="uil:arrow-up-right"
      class="relative inline-block size-3.5"
    />
  </NuxtLink>
</template>
