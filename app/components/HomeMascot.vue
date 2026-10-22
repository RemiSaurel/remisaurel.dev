<script setup lang="ts">
import type { MascotState } from '~/utils/mascot'
import { MASCOT_LABELS } from '~/utils/mascot'

defineProps<{ state: MascotState }>()
</script>

<template>
  <!-- A small line-art frog, one stroke: the eyes sit on top, so it reads at 28px -->
  <svg
    class="mascot"
    :class="`mascot-${state}`"
    viewBox="0 0 32 30"
    fill="none"
    stroke="currentColor"
    stroke-width="1.4"
    stroke-linecap="round"
    stroke-linejoin="round"
    role="img"
    :aria-label="MASCOT_LABELS[state]"
  >
    <title>{{ MASCOT_LABELS[state] }}</title>

    <g class="mascot-body">
      <!-- Body, then the two eye bumps over it -->
      <ellipse class="mascot-fill" cx="16" cy="18" rx="12" ry="7" />
      <circle class="mascot-fill" cx="10.5" cy="10.8" r="3.9" />
      <circle class="mascot-fill" cx="21.5" cy="10.8" r="3.9" />

      <!-- Eyes: dots, or closed arcs when asleep -->
      <template v-if="state === 'sleep'">
        <path d="M8.5 11.3q2 1.8 4 0" stroke-width="1.2" />
        <path d="M19.5 11.3q2 1.8 4 0" stroke-width="1.2" />
      </template>
      <template v-else-if="state === 'music'">
        <path d="M8.5 12q2-2.2 4 0" stroke-width="1.2" />
        <path d="M19.5 12q2-2.2 4 0" stroke-width="1.2" />
      </template>
      <!-- Half-lidded: a lid line across each eye, so the stare stays calm -->
      <template v-else>
        <path d="M6.9 10.3h7.2M17.9 10.3h7.2" stroke-width="1.1" />
        <circle class="mascot-eye" cx="10.5" :cy="state === 'code' ? 12.4 : 11.7" r="1" fill="currentColor" stroke="none" />
        <circle class="mascot-eye" cx="21.5" :cy="state === 'code' ? 12.4 : 11.7" r="1" fill="currentColor" stroke="none" />
      </template>

      <!-- Nostrils and smile -->
      <circle cx="14.5" cy="16" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="16" r="0.5" fill="currentColor" stroke="none" />
      <path d="M9 19.500q7 4.5 14 0" stroke-width="1.2" />

      <!-- Headphones -->
      <g v-if="state === 'music'">
        <path d="M5 11C5 1.5 27 1.5 27 11" />
        <rect class="mascot-fill" x="2.8" y="10" width="3.4" height="6.5" rx="1.5" />
        <rect class="mascot-fill" x="25.8" y="10" width="3.4" height="6.5" rx="1.5" />
      </g>

      <!-- Laptop -->
      <path v-if="state === 'code'" class="mascot-fill" d="M7 29.500l1.5-5h15l1.5 5zM12 27h8" />
    </g>

    <!-- Notes drifting out -->
    <g v-if="state === 'music'" fill="currentColor" stroke-width="1.2">
      <g transform="translate(29 8)">
        <g class="mascot-note">
          <ellipse cx="0" cy="0" rx="1.5" ry="1.1" stroke="none" />
          <path d="M1.3 0V-5l2.2 1.2" fill="none" />
        </g>
      </g>
      <g transform="translate(1.5 7)">
        <g class="mascot-note mascot-note-2">
          <ellipse cx="0" cy="0" rx="1.5" ry="1.1" stroke="none" />
          <path d="M1.3 0V-5l2.2 1.2" fill="none" />
        </g>
      </g>
    </g>

    <!-- Coding: a cursor blinking on the laptop, code tokens drifting out -->
    <g v-if="state === 'code'" fill="currentColor" stroke="none" font-size="5" font-weight="600" font-family="ui-monospace, monospace">
      <rect class="mascot-cursor" x="19.2" y="25.4" width="0.9" height="1.4" />
      <text class="mascot-token" x="25.5" y="23">{}</text>
      <text class="mascot-token mascot-token-2" x="1.5" y="22">&lt;/&gt;</text>
      <text class="mascot-token mascot-token-3" x="27" y="19">;</text>
    </g>

    <!-- Zzz -->
    <g v-if="state === 'sleep'" fill="currentColor" stroke="none" font-size="6" font-weight="600">
      <text class="mascot-z" x="27.5" y="6.5">z</text>
      <text class="mascot-z mascot-z-2" x="30" y="3">z</text>
    </g>
  </svg>
</template>

<style scoped>
.mascot {
  overflow: visible;
}

.mascot-fill {
  fill: var(--mascot-bg, white);
}

.mascot * {
  transform-box: fill-box;
  transform-origin: center;
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

/* Coding: the cursor blinks, tokens float up and fade, staggered */
.mascot-cursor {
  animation: mascot-cursor 1s steps(1) infinite;
}

@keyframes mascot-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
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
