import { shallowRef } from 'vue'

// Module-scope singleton: one media query listener for the whole app, however many
// components ask for it.
const prefersReducedMotion = shallowRef(false)
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
