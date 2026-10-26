<script setup lang="ts">
// The play and pause button of a recording or a replay. It only shows the state: the parent starts and stops
// on `click`, which falls through to the button.
//
// <PlayButton :playing="playing" play-label="Play the session" @click="playing ? stop() : play()" />
interface PlayButtonProps {
  playing: boolean
  playLabel?: string
  pauseLabel?: string
}

const props = withDefaults(defineProps<PlayButtonProps>(), {
  playLabel: 'Play',
  pauseLabel: 'Pause',
})
</script>

<template>
  <IconButton :label="props.playing ? props.pauseLabel : props.playLabel" :icon="props.playing ? 'lucide:pause' : 'lucide:play'" />
</template>
