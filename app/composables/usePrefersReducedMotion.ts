import { ref } from 'vue'

const prefersReducedMotion = ref(false)
let isListening = false

export function usePrefersReducedMotion() {
  if (import.meta.client && !isListening) {
    isListening = true
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
