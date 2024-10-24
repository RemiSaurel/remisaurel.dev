<script setup lang="ts">
const colorMode = useColorMode();

const toggleColorMode = () => {
  colorMode.preference = colorMode.preference === "light" ? "dark" : "light";
};
</script>

<template>
  <button
    @click="toggleColorMode"
    class="size-8 rounded-lg border-0 hover:cursor-pointer flex items-center justify-center bg-white dark:bg-zinc-9 hover:bg-gray-100 dark:hover:bg-zinc-8 p-0"
  >
    <ClientOnly>
      <Icon
        name="uil:moon"
        class="size-5 text-zinc-2"
        v-if="colorMode.preference === 'dark'"
      />
      <Icon name="uil:sun" class="size-5" v-else />
    </ClientOnly>
  </button>
</template>
