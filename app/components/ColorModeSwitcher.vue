<script setup lang="ts">
const colorMode = useColorMode();

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === "light" ? "dark" : "light";
};

// Use colorMode.value to get the actual current mode (resolves 'system' to actual value)
const isDark = computed(() => colorMode.value === 'dark');
</script>

<template>
  <button
    @click="toggleColorMode"
    class="w-8 h-8 flex items-center justify-center border border-neutral-300 dark:border-neutral-700 bg-transparent hover:border-neutral-900 dark:hover:border-neutral-100 transition-colors duration-200"
    aria-label="Toggle color mode"
  >
    <ClientOnly>
      <Icon
        v-if="isDark"
        name="uil:sun"
        class="w-4 h-4 text-white"
      />
      <Icon 
        v-else 
        name="uil:moon" 
        class="w-4 h-4" 
      />
    </ClientOnly>
  </button>
</template>
