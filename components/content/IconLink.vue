<script setup lang="ts">
import { useRouter } from "vue-router";
import { defineProps } from "vue";

const props = defineProps({
  icon: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  route: {
    type: String,
    required: true,
  },
});

const router = useRouter();

const handleClick = () => {
  router.push(props.route);
};
</script>

<template>
  <div
    class="inline-flex mx-2 items-center gap-1 text-sm hover:cursor-pointer mt-4 font-light w-fit border-b-solid text-zinc border-zinc-200 dark:border-zinc-700 hover:text-zinc-700 hover:border-zinc-500 dark:hover:text-zinc-2 transition duration-500 group"
    @click="handleClick"
  >
    <Icon
      :name="icon"
      class="size-5 bg-zinc-4 group-hover:bg-zinc-6 dark:bg-zinc-4 dark:group-hover:bg-zinc-2 transition duration-500"
    />
    <span>{{ text }}</span>
  </div>
</template>
