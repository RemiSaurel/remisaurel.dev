import { ref } from 'vue'

const REQUIRED_CLICKS = 10
/** Clicks further apart than this don't count towards the streak. */
const RESET_WINDOW_MS = 1200

// Module-scope singleton, same pattern as `useCursorLogo` — the click streak and
// open state are shared across every place the profile photo is rendered.
const isOpen = ref(false)
const clickCount = ref(0)
let lastClickAt = 0

export interface ClickResult {
  /** 0..1, how close this streak is to opening the game. */
  progress: number
  triggered: boolean
}

export function useTetrisEasterEgg() {
  function registerClick(): ClickResult {
    const now = Date.now()
    clickCount.value = now - lastClickAt > RESET_WINDOW_MS ? 1 : clickCount.value + 1
    lastClickAt = now

    const triggered = clickCount.value >= REQUIRED_CLICKS
    if (triggered)
      clickCount.value = 0

    return { progress: Math.min(clickCount.value / REQUIRED_CLICKS, 1), triggered }
  }

  function open() {
    isOpen.value = true
  }

  function close() {
    isOpen.value = false
  }

  return {
    isOpen,
    registerClick,
    open,
    close,
  }
}
