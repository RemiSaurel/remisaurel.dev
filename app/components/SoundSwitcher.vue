<script setup lang="ts">
const { isEnabled, play, toggle } = useSound()

function toggleSound() {
  toggle()
  // Only audible when turning sound on: confirms it works without startling anyone muting it.
  play('toggle')
}
</script>

<template>
  <button
    type="button"
    class="relative h-8 w-8 flex pressable items-center justify-center rounded-lg bg-neutral-100 transition-colors duration-200 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700"
    :aria-label="isEnabled ? 'Mute sounds' : 'Unmute sounds'"
    :aria-pressed="isEnabled"
    @click="toggleSound"
  >
    <ClientOnly>
      <Icon
        name="uil:volume"
        class="sound-icon"
        :style="{ opacity: isEnabled ? 1 : 0, scale: isEnabled ? 1 : 0.25, filter: isEnabled ? 'blur(0px)' : 'blur(4px)' }"
      />
      <Icon
        name="uil:volume-mute"
        class="sound-icon text-neutral-500 dark:text-neutral-400"
        :style="{ opacity: isEnabled ? 0 : 1, scale: isEnabled ? 0.25 : 1, filter: isEnabled ? 'blur(4px)' : 'blur(0px)' }"
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
  transition:
    opacity var(--duration-micro) cubic-bezier(0.2, 0, 0, 1),
    scale var(--duration-micro) cubic-bezier(0.2, 0, 0, 1),
    filter var(--duration-micro) cubic-bezier(0.2, 0, 0, 1);
}
</style>
