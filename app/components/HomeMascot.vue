<script setup lang="ts">
import type { MascotState } from '~/utils/mascot'
import { MASCOT_LABELS } from '~/utils/mascot'

const props = defineProps<{ state: MascotState }>()

// Looking at the screen, the eyes narrow and drop a little
const eye = computed(() => props.state === 'code'
  ? { cy: 16.4, rx: 3, ry: 3.4 }
  : { cy: 15.4, rx: 3.7, ry: 4.2 })
</script>

<template>
  <!-- A round little frog: pale green, cream belly, pink cheeks. Big eyes, so it reads at 28px -->
  <svg
    class="mascot"
    :class="`mascot-${state}`"
    viewBox="3.5 5.5 33 28.5"
    role="img"
    :aria-label="MASCOT_LABELS[state]"
  >
    <title>{{ MASCOT_LABELS[state] }}</title>

    <g class="mascot-body" stroke-linecap="round" stroke-linejoin="round">
      <!-- Back feet, then the body and the belly -->
      <ellipse class="mascot-skin mascot-line" cx="8.5" cy="30" rx="4.5" ry="2.6" />
      <ellipse class="mascot-skin mascot-line" cx="31.5" cy="30" rx="4.5" ry="2.6" />
      <ellipse class="mascot-skin mascot-line" cx="20" cy="19" rx="16.5" ry="13" />
      <ellipse class="mascot-belly" cx="20" cy="26" rx="10.5" ry="5.6" />
      <path class="mascot-toe" d="M15.5 31.2q1.2-2.6 2.6 0M21.9 31.2q1.4-2.6 2.6 0" />

      <!-- Cheeks -->
      <ellipse class="mascot-cheek" cx="8" cy="20.5" rx="3.2" ry="2.1" />
      <ellipse class="mascot-cheek" cx="32" cy="20.5" rx="3.2" ry="2.1" />

      <!-- Eyes: big and shiny, or closed arcs when asleep, or happy arcs with music -->
      <path v-if="state === 'sleep'" class="mascot-toe" d="M9 16q3.2 3 6.4 0M24.6 16q3.2 3 6.4 0" />
      <path v-else-if="state === 'music'" class="mascot-toe" d="M9 16.4q3.2-3.6 6.4 0M24.6 16.4q3.2-3.6 6.4 0" />
      <template v-else>
        <g v-for="cx in [12.2, 27.8]" :key="cx" class="mascot-eye">
          <ellipse class="mascot-pupil" :cx="cx" :cy="eye.cy" :rx="eye.rx" :ry="eye.ry" />
          <circle class="mascot-shine" :cx="cx - eye.rx * 0.32" :cy="eye.cy - eye.ry * 0.38" :r="eye.rx * 0.36" />
          <circle class="mascot-shine" :cx="cx + eye.rx * 0.38" :cy="eye.cy + eye.ry * 0.38" :r="eye.rx * 0.19" />
        </g>
      </template>

      <!-- Nostrils and smile -->
      <circle class="mascot-nostril" cx="18.7" cy="18.6" r="0.4" />
      <circle class="mascot-nostril" cx="21.3" cy="18.6" r="0.4" />
      <path class="mascot-toe" d="M17.2 20.6q1.4 1.5 2.8 0q1.4 1.5 2.8 0" />

      <!-- Headphones -->
      <g v-if="state === 'music'">
        <path class="mascot-line mascot-band" d="M4.5 16C4.5 0.5 35.5 0.5 35.5 16" />
        <rect class="mascot-cup mascot-line" x="2" y="13.5" width="5" height="9" rx="2.3" />
        <rect class="mascot-cup mascot-line" x="33" y="13.5" width="5" height="9" rx="2.3" />
      </g>

      <!-- Laptop, seen from behind, with its logo glowing -->
      <g v-if="state === 'code'">
        <path class="mascot-laptop mascot-line" d="M8 33.4l2.4-8.2h19.2l2.4 8.2z" />
        <circle class="mascot-glow" cx="20" cy="29.4" r="1.1" />
      </g>
    </g>

    <!-- Notes drifting out -->
    <g v-if="state === 'music'" class="mascot-ink">
      <g transform="translate(37 7)">
        <g class="mascot-note">
          <ellipse cx="0" cy="0" rx="1.6" ry="1.2" />
          <path d="M1.4 0V-5.2l2.3 1.2" fill="none" />
        </g>
      </g>
      <g transform="translate(2.5 6)">
        <g class="mascot-note mascot-note-2">
          <ellipse cx="0" cy="0" rx="1.6" ry="1.2" />
          <path d="M1.4 0V-5.2l2.3 1.2" fill="none" />
        </g>
      </g>
    </g>

    <!-- Coding: code tokens drifting out -->
    <g v-if="state === 'code'" class="mascot-ink" stroke="none" font-size="5" font-weight="600" font-family="ui-monospace, monospace">
      <text class="mascot-token" x="33" y="14">{}</text>
      <text class="mascot-token mascot-token-2" x="0" y="12">&lt;/&gt;</text>
      <text class="mascot-token mascot-token-3" x="35" y="6">;</text>
    </g>

    <!-- Zzz -->
    <g v-if="state === 'sleep'" class="mascot-ink" stroke="none" font-size="6.5" font-weight="600">
      <text class="mascot-z" x="32" y="7">z</text>
      <text class="mascot-z mascot-z-2" x="35.5" y="2.5">z</text>
    </g>
  </svg>
</template>

<style scoped>
.mascot {
  overflow: visible;
  --mascot-outline: #3b4a3a;
  --mascot-skin: #b9dba0;
  --mascot-belly: #fdf2c4;
  --mascot-cheek: #f4a9a8;
  --mascot-pupil: #3a2718;
}

.mascot * {
  transform-box: fill-box;
  transform-origin: center;
}

.mascot-line {
  stroke: var(--mascot-outline);
  stroke-width: 1.2;
}

.mascot-skin {
  fill: var(--mascot-skin);
}

.mascot-belly {
  fill: var(--mascot-belly);
}

.mascot-cheek {
  fill: var(--mascot-cheek);
  opacity: 0.85;
}

.mascot-toe {
  fill: none;
  stroke: var(--mascot-outline);
  stroke-width: 1.1;
}

.mascot-pupil {
  fill: var(--mascot-pupil);
}

.mascot-shine {
  fill: white;
}

.mascot-nostril {
  fill: var(--mascot-outline);
}

.mascot-band {
  fill: none;
  stroke-width: 1.6;
}

.mascot-cup {
  fill: #8f9cf5;
}

.mascot-laptop {
  fill: #d9dce1;
}

.mascot-glow {
  fill: white;
  animation: mascot-glow 1.2s steps(1) infinite;
}

/* Notes, tokens and z's take the colour of the text around */
.mascot-ink {
  fill: currentColor;
  stroke: currentColor;
  stroke-width: 1.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mascot-ink text {
  stroke: none;
}

/* Awake: a slow blink, nothing else */
.mascot-eye {
  animation: mascot-blink 5s infinite;
}

@keyframes mascot-blink {
  0%, 94%, 100% { transform: scaleY(1); }
  97% { transform: scaleY(0.1); }
}

/* Asleep: the z's fade in and out */
.mascot-z {
  animation: mascot-z 4s ease-in-out infinite;
}

.mascot-z-2 {
  animation-delay: 1.5s;
}

@keyframes mascot-z {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 1; }
}

/* Listening: notes drift up and fade, one after the other */
.mascot-note {
  opacity: 0;
  animation: mascot-note 4s ease-in-out infinite;
}

.mascot-note-2 {
  animation-delay: 2s;
}

@keyframes mascot-note {
  0% { opacity: 0; transform: translateY(2px); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-4px); }
}

/* Coding: the logo blinks, tokens float up and fade, staggered */
@keyframes mascot-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.25; }
}

.mascot-token {
  opacity: 0;
  animation: mascot-token 4.5s ease-in-out infinite;
}

.mascot-token-2 {
  animation-delay: 1.5s;
}

.mascot-token-3 {
  animation-delay: 3s;
}

@keyframes mascot-token {
  0% { opacity: 0; transform: translateY(2px); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translateY(-5px); }
}

@media (prefers-reduced-motion: reduce) {
  .mascot,
  .mascot * {
    animation: none !important;
  }

  .mascot-note,
  .mascot-token {
    opacity: 1;
  }
}
</style>
