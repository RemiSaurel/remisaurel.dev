<script setup lang="ts">
import { useRouter } from "vue-router";
import { defineProps } from "vue";

const props = defineProps({
  iconName: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
  },
  text: {
    type: String,
    required: true,
  },
  route: {
    type: String,
    required: true,
  },
  external: {
    type: Boolean,
    required: false,
    default: false,
  },
});

const router = useRouter();

const handleClick = () => {
  if (props.external) {
    window.open(props.route, "_blank");
  } else {
    router.push(props.route);
  }
};
</script>

<template>
  <ClientOnly>
    <div
      class="inline-flex relative top-1 px-1 items-center gap-1 hover:cursor-pointer font-light w-fit border-b-solid text-zinc border-zinc-200 dark:border-zinc-700 hover:text-zinc-700 hover:border-zinc-500 dark:hover:text-zinc-2 transition duration-500 group"
      @click="handleClick"
    >
      <Icon
        v-if="iconName"
        :name="iconName"
        class="size-5 bg-zinc-4 group-hover:bg-zinc-6 dark:bg-zinc-4 dark:group-hover:bg-zinc-2 transition duration-500"
      />
      <img
        v-if="image"
        :src="image"
        class="w-6 -left-2 bg-zinc-4 group-hover:bg-zinc-6 dark:bg-zinc-4 dark:group-hover:bg-zinc-2 transition duration-500"
      />
      <span class="items-baseline flex text-base">{{ text }}</span>
    </div>
  </ClientOnly>
</template>
