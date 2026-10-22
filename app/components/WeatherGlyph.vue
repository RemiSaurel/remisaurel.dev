<script setup lang="ts">
import type { WeatherKind } from '~/utils/weather'

defineProps<{
  kind: WeatherKind
  night?: boolean
}>()

const CLOUD = 'M7.5 18.5h9.5a4 4 0 0 0 .5-7.97 5.5 5.5 0 0 0-10.6-1A4.5 4.5 0 0 0 7.5 18.5z'
const RAYS = ['M12 2.5v2', 'M12 19.5v2', 'M2.5 12h2', 'M19.5 12h2', 'M5.3 5.3l1.4 1.4', 'M17.3 17.3l1.4 1.4', 'M18.7 5.3l-1.4 1.4', 'M6.7 17.3l-1.4 1.4']
</script>

<template>
  <!-- Same line art as the frog. At 16px, a 1.575 stroke draws as thick as the frog's 1.4 at 24px -->
  <svg
    class="weather"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.575"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <g v-if="kind === 'clear'">
      <path v-if="night" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      <template v-else>
        <circle cx="12" cy="12" r="4" />
        <g class="weather-rays">
          <path v-for="ray in RAYS" :key="ray" :d="ray" />
        </g>
      </template>
    </g>

    <g v-else-if="kind === 'partly'">
      <path v-if="night" d="M12.5 8.2A4.6 4.6 0 0 1 7.7 3.4a4.6 4.6 0 1 0 4.8 4.8z" />
      <g v-else>
        <circle cx="9" cy="9" r="3.2" />
        <path d="M9 3v1.4M3 9h1.4M4.8 4.8l1 1M13.2 4.8l-1 1M4.8 13.2l1-1" />
      </g>
      <path class="weather-fill" :d="CLOUD" transform="translate(5 5) scale(.74)" />
    </g>

    <path v-else-if="kind === 'cloud'" :d="CLOUD" />

    <g v-else>
      <path class="weather-fill" :d="CLOUD" transform="translate(0 -3)" />
      <template v-if="kind === 'rain'">
        <path class="weather-drop" d="M8.5 17.5l-.8 2.5" />
        <path class="weather-drop weather-drop-2" d="M12 17.5l-.8 2.5" />
        <path class="weather-drop weather-drop-3" d="M15.5 17.5l-.8 2.5" />
      </template>
      <g v-else-if="kind === 'snow'" fill="currentColor" stroke="none">
        <circle class="weather-flake" cx="8.5" cy="19" r="1" />
        <circle class="weather-flake weather-drop-2" cx="12" cy="20.5" r="1" />
        <circle class="weather-flake weather-drop-3" cx="15.5" cy="19" r="1" />
      </g>
      <path v-else d="M12.8 14.5l-2.8 3.6h3.2l-1.7 3.9" />
    </g>
  </svg>
</template>

<style scoped>
.weather {
  overflow: visible;
}

.weather * {
  transform-box: fill-box;
  transform-origin: center;
}

.weather-fill {
  fill: var(--mascot-bg, white);
}

/* Sun: the rays turn slowly */
.weather-rays {
  animation: weather-spin 24s linear infinite;
}

@keyframes weather-spin {
  to { transform: rotate(360deg); }
}

/* Rain and snow: a few drops fall and fade, out of step */
.weather-drop,
.weather-flake {
  animation: weather-fall 1.4s ease-in infinite;
}

.weather-flake {
  animation-duration: 2.4s;
  animation-timing-function: ease-in-out;
}

.weather-drop-2 {
  animation-delay: 0.45s;
}

.weather-drop-3 {
  animation-delay: 0.9s;
}

@keyframes weather-fall {
  0% { opacity: 0; transform: translateY(-2px); }
  25% { opacity: 1; }
  100% { opacity: 0; transform: translateY(3px); }
}

@media (prefers-reduced-motion: reduce) {
  .weather,
  .weather * {
    animation: none !important;
  }
}
</style>
