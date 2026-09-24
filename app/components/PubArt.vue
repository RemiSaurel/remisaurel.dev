<script setup lang="ts">
import type { ArtComposition, ArtTheme } from '~/art/art'
import { ART_HEIGHT, ART_PALETTES, ART_STROKE, ART_WIDTH, GRID_STEP } from '~/art/art'

interface Props {
  composition: ArtComposition
  /** `auto` follows the site color mode; a forced theme bakes literal colors in (for export). */
  theme?: 'auto' | ArtTheme
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'auto',
})

/** Screen pixels, identical at every rendered size: the grid always uses it, nodes can override it. */
const STROKE = ART_STROKE.default

// Layers are clipped to the frame even when the svg lets editor chrome overflow it
const clipId = `pub-art-clip-${useId()}`
const grainId = `pub-art-grain-${useId()}`

const colors = computed(() => {
  if (props.theme === 'auto')
    return { bg: 'var(--art-bg)', ink: 'var(--art-ink)' }
  return ART_PALETTES[props.theme]
})

const nodes = computed(() => props.composition.layers.filter(node => node.visible))

const gridPath = computed(() => {
  let d = ''
  for (let x = GRID_STEP; x < ART_WIDTH; x += GRID_STEP)
    d += `M${x} 0V${ART_HEIGHT}`
  for (let y = GRID_STEP; y < ART_HEIGHT; y += GRID_STEP)
    d += `M0 ${y}H${ART_WIDTH}`
  return d
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :viewBox="`0 0 ${ART_WIDTH} ${ART_HEIGHT}`"
    preserveAspectRatio="xMidYMid slice"
    class="block"
    :class="{ 'pub-art-auto': props.theme === 'auto' }"
    aria-hidden="true"
  >
    <clipPath :id="clipId">
      <rect :width="ART_WIDTH" :height="ART_HEIGHT" />
    </clipPath>
    <rect :width="ART_WIDTH" :height="ART_HEIGHT" :fill="colors.bg" />
    <path
      v-if="props.composition.grid"
      :d="gridPath"
      fill="none"
      :stroke="colors.ink"
      stroke-opacity="0.06"
      :stroke-width="STROKE"
      vector-effect="non-scaling-stroke"
    />
    <g :clip-path="`url(#${clipId})`">
      <PubArtNode v-for="node in nodes" :key="node.id" :node="node" :colors="colors" :theme="props.theme" :stroke="STROKE" />
    </g>
    <template v-if="props.composition.grain">
      <!-- Film grain over everything, ground included: dark frames look printed rather than flat -->
      <filter :id="grainId" x="0" y="0" :width="ART_WIDTH" :height="ART_HEIGHT" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="7" stitchTiles="stitch" />
        <feColorMatrix type="matrix" values="3 0 0 0 -1  3 0 0 0 -1  3 0 0 0 -1  0 0 0 0 1" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0" :intercept="props.composition.grain * 0.09" />
        </feComponentTransfer>
      </filter>
      <rect :width="ART_WIDTH" :height="ART_HEIGHT" :filter="`url(#${grainId})`" pointer-events="none" />
    </template>
    <slot />
  </svg>
</template>

<style>
/* Unscoped so the site's `.dark` root class can reach it */
.pub-art-auto {
  --art-bg: #f5f5f5;
  --art-ink: #171717;
  /* Picks the variant of every palette color, see `artColorValue` */
  --art-dark: 0;
}

.dark .pub-art-auto {
  --art-bg: #0a0a0a;
  --art-ink: #fafafa;
  --art-dark: 1;
}
</style>
