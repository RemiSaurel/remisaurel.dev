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
    class="group inline-flex pressable items-center gap-0.5 underline decoration-zinc-400 underline-offset-2 transition-colors duration-300 hover:text-blue-600 dark:decoration-zinc-500 hover:decoration-blue-500 dark:hover:text-blue-300"
  >
    <slot />
    <Icon
      name="uil:arrow-up-right"
      class="relative inline-block size-3.5"
    />
  </NuxtLink>
</template>
