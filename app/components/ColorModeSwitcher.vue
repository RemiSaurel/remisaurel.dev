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
    class="h-8 w-8 flex pressable items-center justify-center bg-neutral-100 transition-colors duration-200 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
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
