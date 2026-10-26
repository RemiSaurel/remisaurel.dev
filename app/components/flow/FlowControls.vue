<script setup lang="ts">
import type { FlowPlayer } from '~/composables/useFlowPlayer'
import type { FlowTipPlacement } from '~/utils/flow/types'

// Play or pause, optionally one beat at a time, and the speed of a flow. On the canvas it floats at the
// bottom right; under the list of a phone it sits on its own line.
// `inviting` pulses the toolbar, for a flow that starts paused and has not been played yet.
const props = withDefaults(defineProps<{
  player: FlowPlayer
  tips?: FlowTipPlacement
  /** Whether a "Next step" button shows: the list of a phone has no beats to step through */
  step?: boolean
  inviting?: boolean
}>(), { tips: 'top-end', step: true })

const emit = defineEmits<{ step: [] }>()

const { play } = useSound()

const SPEEDS = [1, 1.5, 2]

function cycleSpeed() {
  const at = SPEEDS.indexOf(props.player.speed.value)
  props.player.setSpeed(SPEEDS[(at + 1) % SPEEDS.length]!)
  play('tap', { emphasis: 'subtle' })
}

function togglePlay() {
  props.player.toggle()
  play('toggle', { direction: props.player.playing.value ? 'forward' : 'back', emphasis: 'subtle' })
}

// One beat at a time: pauses, then runs to the next thing that resolves
function stepPlay() {
  props.player.step()
  emit('step')
  play('tap', { emphasis: 'subtle' })
}
</script>

<template>
  <FlowToolbar :tips="tips" :class="{ 'is-inviting': inviting }">
    <FlowButton :label="player.playing.value ? 'Pause' : 'Play'" :pressed="player.playing.value" @click="togglePlay">
      <FlowIconSwap :icons="['lucide:play', 'lucide:pause']" :active="player.playing.value ? 1 : 0" />
    </FlowButton>
    <FlowButton v-if="step" label="Next step" icon="lucide:step-forward" @click="stepPlay" />
    <FlowButton label="Speed" @click="cycleSpeed">
      <span class="tabular-nums w-7 text-center text-[11px] font-medium">{{ player.speed.value }}×</span>
    </FlowButton>
  </FlowToolbar>
</template>

<style scoped>
.is-inviting {
  animation: flow-invite 1.6s ease-out infinite;
}

@keyframes flow-invite {
  0% { box-shadow: 0 0 0 0 rgb(59 130 246 / 0.35); }
  70%, 100% { box-shadow: 0 0 0 8px rgb(59 130 246 / 0); }
}

@media (prefers-reduced-motion: reduce) {
  .is-inviting { animation: none; }
}
</style>
