<template>
  <NuxtLink
    :href="props.href"
    :target="props.target"
    class="inline-flex items-center border-b-solid text-zinc-5 leading-none border-zinc-300 border-2 dark:border-zinc-700 dark:text-zinc-4 hover:text-blue-700 hover:border-blue-500 dark:hover:text-blue-2 transition duration-500 group"
  >
    <slot />
    <Icon
      name="uil:arrow-up-right"
      class="size-5 bg-zinc-4 relative -right-0.5 group-hover:bg-blue-6 dark:bg-zinc-4 dark:group-hover:bg-blue-2 transition duration-500"
    />
  </NuxtLink>
</template>

<script setup lang="ts">
import type { PropType } from "vue";

const props = defineProps({
  href: {
    type: String,
    default: "",
  },
  target: {
    type: String as PropType<
      | "_blank"
      | "_parent"
      | "_self"
      | "_top"
      | (string & object)
      | null
      | undefined
    >,
    default: undefined,
    required: false,
  },
});
</script>
