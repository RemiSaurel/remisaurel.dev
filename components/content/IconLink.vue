<script setup lang="ts">
import { useRouter } from "vue-router";

const props = defineProps({
  iconName: {
    type: String,
    required: false,
  },
  image: {
    type: String,
    required: false,
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
  size: {
    type: String as PropType<"sm" | "md">,
    required: false,
    default: "md",
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
  <div
    class="inline-flex rounded items-center relative pr-1 gap-2 hover:cursor-pointer font-light w-fit text-zinc-5 dark:text-zinc-4 hover:text-zinc-700 bg-gray-400/10 hover:bg-gray-400/20 pl-1 pr-2 dark:hover:text-zinc-2 transition duration-500 group"
    :class="[size === 'sm' ? 'py-0.5 text-sm' : 'py-1']"
    @click="handleClick"
  >
    <ClientOnly>
      <Icon
        v-if="iconName"
        :name="iconName"
        class="transition duration-500"
        :class="[size === 'sm' ? 'w-4' : 'w-5']"
      />
    </ClientOnly>
    <img
      v-if="image"
      :src="image"
      class="transition duration-500"
      :class="[size === 'sm' ? 'w-4' : 'w-5']"
    />
    <slot />
  </div>
</template>
