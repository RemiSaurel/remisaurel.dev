import { ref } from 'vue'

export function usePrefersReducedMotion() {
  const prefersReducedMotion = ref(false)

  if (import.meta.client) {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches

    mediaQuery.addEventListener('change', (event) => {
      prefersReducedMotion.value = event.matches
    })
  }

  return {
    prefersReducedMotion,
  }
}
