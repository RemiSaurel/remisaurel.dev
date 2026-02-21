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
    class="h-8 w-8 flex items-center justify-center border border-neutral-300 bg-transparent transition-colors duration-200 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100"
    aria-label="Toggle color mode"
    @click="toggleColorMode"
  >
    <ClientOnly>
      <Icon
        v-if="isDark"
        name="uil:sun"
        class="h-4 w-4 text-white"
      />
      <Icon
        v-else
        name="uil:moon"
        class="h-4 w-4"
      />
    </ClientOnly>
  </button>
</template>
