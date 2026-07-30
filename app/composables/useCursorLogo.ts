import { computed, onMounted, ref } from 'vue'

export interface CursorLogo {
  src: string
  alt: string
}

export const ENTITY_LOGOS = {
  irit: { src: '/logos/irit.svg', alt: 'IRIT' },
  talent: { src: '/logos/talent.png', alt: 'TALENT' },
  kosmos: { src: '/logos/kosmos.svg', alt: 'Kosmos Education' },
} satisfies Record<string, CursorLogo>

const activeLogo = ref<CursorLogo | null>(null)
// Starts false on both server and the initial client render so hydration matches;
// the real value is only read once mounted (see `initHoverDetection` below).
const isHoverCapable = ref(false)
let hoverDetectionInitialized = false

function initHoverDetection() {
  if (hoverDetectionInitialized || !import.meta.client)
    return
  hoverDetectionInitialized = true

  const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
  isHoverCapable.value = mediaQuery.matches
  mediaQuery.addEventListener('change', (event) => {
    isHoverCapable.value = event.matches
  })
}

export function useCursorLogo() {
  const { prefersReducedMotion } = usePrefersReducedMotion()

  onMounted(initHoverDetection)

  const enabled = computed(() => isHoverCapable.value && !prefersReducedMotion.value)

  function setCursorLogo(logo: CursorLogo) {
    if (enabled.value)
      activeLogo.value = logo
  }

  function clearCursorLogo() {
    activeLogo.value = null
  }

  return {
    activeLogo,
    enabled,
    setCursorLogo,
    clearCursorLogo,
  }
}
