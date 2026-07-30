<script setup lang="ts">
const colorMode = useColorMode()

function toggleColorMode() {
  colorMode.preference = colorMode.preference === 'light' ? 'dark' : 'light'
}

// Use colorMode.value to get the actual current mode (resolves 'system' to actual value)
const isDark = computed(() => colorMode.preference === 'dark')
</script>

<template>
  <button
    class="relative h-8 w-8 flex pressable items-center justify-center bg-neutral-100 transition-colors duration-200 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
    aria-label="Toggle color mode"
    @click="toggleColorMode"
  >
    <ClientOnly>
      <Icon
        name="uil:sun"
        class="theme-icon text-white"
        :style="{ opacity: isDark ? 1 : 0 }"
      />
      <Icon
        name="uil:moon"
        class="theme-icon"
        :style="{ opacity: isDark ? 0 : 1 }"
      />
    </ClientOnly>
  </button>
</template>

<style scoped>
.theme-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  height: 1rem;
  width: 1rem;
  transition: opacity var(--duration-micro) var(--ease-out);
}
</style>
