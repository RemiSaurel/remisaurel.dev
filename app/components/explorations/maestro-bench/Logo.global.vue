<script setup lang="ts">
// The MAESTRO-bench lockup: the five-bar mark, drawn on currentColor so it follows the text, and
// the name. The bars rise once, left to right, when it shows.
const BARS = [
  { x: 2, height: 26 },
  { x: 8, height: 19 },
  { x: 14, height: 12 },
  { x: 20, height: 19 },
  { x: 26, height: 26 },
]
</script>

<template>
  <div class="logo my-8 flex items-center gap-3">
    <svg viewBox="0 0 32 32" fill="currentColor" class="size-9" aria-hidden="true">
      <rect
        v-for="(bar, index) in BARS"
        :key="bar.x"
        class="bar"
        :x="bar.x"
        y="3"
        width="4"
        :height="bar.height"
        rx="1"
        :style="{ animationDelay: `${0.15 + index * 0.08}s` }"
      />
    </svg>
    <span class="font-display text-3xl font-semibold tracking-tight">MAESTRO-bench</span>
  </div>
</template>

<style scoped>
.bar {
  transform-box: fill-box;
  transform-origin: top;
  animation: rise 700ms var(--ease-out) backwards;
}

@keyframes rise {
  from {
    transform: scaleY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar {
    animation: none;
  }
}
</style>
