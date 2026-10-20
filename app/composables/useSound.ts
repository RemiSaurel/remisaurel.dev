import type { PlayOptions, SoundName } from 'cuelume'
import { useLocalStorage } from '@vueuse/core'

// Module-scope singleton, same pattern as `useTetrisEasterEgg`: the mute toggle
// in the nav and every sound on the page share one on/off state.
let enabled: Ref<boolean> | undefined
let cuelume: typeof import('cuelume') | undefined

/** Cuelume's default level is a bit loud next to the page, so everything is scaled down. */
const MASTER_VOLUME = 0.5

// Loaded as soon as the client boots (not on the first cue) so `play` can run
// synchronously inside the click, and the AudioContext is built on the first
// gesture instead of delaying the first sound.
if (import.meta.client) {
  import('cuelume').then((module) => {
    cuelume = module
    module.setVolume(MASTER_VOLUME)
    module.setTheme('bubble')
    const warmUp = () => module.unlock()
    window.addEventListener('pointerdown', warmUp, { once: true, capture: true })
    window.addEventListener('keydown', warmUp, { once: true, capture: true })
  })
}

export function useSound() {
  enabled ??= useLocalStorage('sound-enabled', true)
  const isEnabled = enabled

  /**
   * Plays a cuelume cue. No-op on the server or when muted. The library is
   * client-only, so it never lands in the SSR bundle or blocks first paint.
   */
  function play(name: SoundName, opts?: PlayOptions) {
    if (import.meta.server || !isEnabled.value || !cuelume)
      return
    try {
      cuelume.play(name, opts)
    }
    catch {
      // Audio is a nicety: a blocked or unsupported AudioContext must never break an interaction.
    }
  }

  function toggle() {
    isEnabled.value = !isEnabled.value
  }

  return {
    isEnabled,
    play,
    toggle,
  }
}
