<script setup lang="ts">
import { MINIMAL } from '~/sounds/sounds'

const { isEnabled, play, toggle } = useSound()

function toggleSound() {
  toggle()
  // Only audible when turning sound on: confirms it works without startling anyone muting it.
  play(MINIMAL.toggleOn)
}
</script>

<template>
  <button
    type="button"
    class="relative h-8 w-8 flex pressable items-center justify-center bg-neutral-100 transition-colors duration-200 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
    :aria-label="isEnabled ? 'Mute sounds' : 'Unmute sounds'"
    :aria-pressed="isEnabled"
    @click="toggleSound"
  >
    <ClientOnly>
      <Icon
        name="uil:volume"
        class="sound-icon"
        :style="{ opacity: isEnabled ? 1 : 0 }"
      />
      <Icon
        name="uil:volume-mute"
        class="sound-icon text-neutral-500 dark:text-neutral-400"
        :style="{ opacity: isEnabled ? 0 : 1 }"
      />
    </ClientOnly>
  </button>
</template>

<style scoped>
.sound-icon {
  position: absolute;
  inset: 0;
  margin: auto;
  height: 1rem;
  width: 1rem;
  transition: opacity var(--duration-micro) var(--ease-out);
}
</style>
