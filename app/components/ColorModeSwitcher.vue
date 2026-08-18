<script setup lang="ts">
const colorMode = useColorMode()

function applyPreference() {
  colorMode.preference = colorMode.preference === 'light' ? 'dark' : 'light'
}

function toggleColorMode(event: MouseEvent) {
  const supportsViewTransition = typeof document.startViewTransition === 'function'
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!supportsViewTransition || prefersReducedMotion) {
    applyPreference()
    return
  }

  const button = event.currentTarget as HTMLElement
  const { top, left, width, height } = button.getBoundingClientRect()
  const x = left + width / 2
  const y = top + height / 2
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  const rootStyles = getComputedStyle(document.documentElement)
  const duration = Number.parseFloat(rootStyles.getPropertyValue('--duration-theme')) || 500
  const easing = rootStyles.getPropertyValue('--ease-in-out').trim() || 'ease-in-out'

  const transition = document.startViewTransition(applyPreference)

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing,
        pseudoElement: '::view-transition-new(root)',
      },
    )
  })
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
