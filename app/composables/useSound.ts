import type { PlayOptions, SoundDefinition } from '@web-kits/audio'
import { useLocalStorage } from '@vueuse/core'

// Module-scope singleton, same pattern as `useTetrisEasterEgg`: the mute toggle
// in the nav and every sound on the page share one on/off state.
let enabled: Ref<boolean> | undefined
const players = new WeakMap<SoundDefinition, (opts?: PlayOptions) => unknown>()

export function useSound() {
  enabled ??= useLocalStorage('sound-enabled', true)
  const isEnabled = enabled

  /**
   * Plays a sound definition. No-op on the server or when muted. The library is
   * loaded lazily so it never lands in the SSR bundle or blocks first paint, and
   * the AudioContext is only created on the first real user gesture.
   */
  async function play(definition: SoundDefinition, opts?: PlayOptions) {
    if (import.meta.server || !isEnabled.value)
      return
    let player = players.get(definition)
    if (!player) {
      const { defineSound } = await import('@web-kits/audio')
      player = defineSound(definition)
      players.set(definition, player)
    }
    try {
      player(opts)
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
