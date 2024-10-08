<template>
  <NuxtLink
    :href="props.href"
    :target="props.target"
    class="inline-flex items-end border-b-solid text-zinc-5 border-zinc-300 dark:border-zinc-700 dark:text-zinc-4 hover:text-zinc-700 hover:border-zinc-500 dark:hover:text-zinc-2 transition duration-500 group"
  >
    <slot />
    <Icon
      name="uil:arrow-up-right"
      class="size-5 bg-zinc-4 relative -right-0.5 -top-0.5 group-hover:bg-zinc-6 dark:bg-zinc-4 dark:group-hover:bg-zinc-2 transition duration-500"
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
