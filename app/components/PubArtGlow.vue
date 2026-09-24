<script setup lang="ts">
import type { ArtLayer, ArtShape, ArtTheme } from '~/art/art'
import { defaultParams } from '~/art/art'
import { glowFilter } from '~/art/glow'

interface Props {
  layer: ArtLayer
  shapes: ArtShape[]
  /** The resolved paint value, possibly a CSS expression when the theme is `auto`. */
  color: string
  theme: 'auto' | ArtTheme
}

const props = defineProps<Props>()

/** Grain cycles per frame unit: fine enough to read as film, not as texture. */
const GRAIN_FREQUENCY = 1.1

const filterId = `pub-art-glow-${useId()}`

const filter = computed(() => glowFilter({ ...defaultParams(props.layer.type), ...props.layer.params }))

// Grain lives in the layer's units, so it would coarsen as the layer scales up
const grainFrequency = computed(() => Math.round(GRAIN_FREQUENCY / Math.max(0.05, props.layer.scale) * 1000) / 1000)

/**
 * The core turns toward a neighbouring hue and, on a dark ground, gets brighter: red heats
 * to orange the way light does. Relative color syntax, so it follows inherited colors too.
 */
const coreColor = computed(() => {
  const lift = props.theme === 'light' ? '0' : props.theme === 'dark' ? '0.14' : 'calc(0.14 * var(--art-dark, 0))'
  return `oklch(from ${props.color} min(calc(l + ${lift}), 0.97) c calc(h + ${filter.value.coreHue}))`
})
</script>

<template>
  <filter
    :id="filterId"
    filterUnits="userSpaceOnUse"
    primitiveUnits="userSpaceOnUse"
    color-interpolation-filters="sRGB"
    :x="filter.region.x"
    :y="filter.region.y"
    :width="filter.region.width"
    :height="filter.region.height"
  >
    <!-- Warp: the shapes are pushed around by a slow noise field -->
    <template v-if="filter.warp > 0">
      <feTurbulence type="fractalNoise" :baseFrequency="filter.warpScale" numOctaves="2" :seed="props.layer.seed" result="field" />
      <feDisplacementMap in="SourceAlpha" in2="field" :scale="filter.warp" xChannelSelector="R" yChannelSelector="G" result="warped" />
    </template>
    <feGaussianBlur :in="filter.warp > 0 ? 'warped' : 'SourceAlpha'" :stdDeviation="`${filter.blur[0]} ${filter.blur[1]}`" edgeMode="none" result="soft" />
    <feComponentTransfer in="soft" result="bright">
      <feFuncA type="linear" :slope="filter.intensity" />
    </feComponentTransfer>

    <!-- Grain: the light itself is dithered, so it survives even where the glow saturates -->
    <template v-if="filter.grain > 0">
      <feTurbulence type="fractalNoise" :baseFrequency="grainFrequency" numOctaves="1" :seed="props.layer.seed + 1" result="noise" />
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.5 0 0 0 -0.75" result="speckle" />
      <feComposite in="bright" in2="speckle" operator="arithmetic" :k1="filter.grain" :k2="1 - filter.grain / 2" k3="0" k4="0" result="shaped" />
    </template>

    <feFlood :style="{ floodColor: props.color }" result="paint" />
    <feComposite in="paint" :in2="filter.grain > 0 ? 'shaped' : 'bright'" operator="in" result="glow" />

    <!-- Hot core: the densest light, recolored and laid on top. Read before the intensity
         boost, which saturates the whole body and would heat all of it -->
    <template v-if="filter.core > 0">
      <feComponentTransfer in="soft" result="dense">
        <feFuncA type="gamma" amplitude="1.15" exponent="4" offset="0" />
      </feComponentTransfer>
      <feComposite v-if="filter.grain > 0" in="dense" in2="speckle" operator="arithmetic" :k1="filter.grain" :k2="1 - filter.grain / 2" k3="0" k4="0" result="dense" />
      <feFlood :style="{ floodColor: coreColor }" :flood-opacity="filter.core" result="heat" />
      <feComposite in="heat" in2="dense" operator="in" result="core" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="core" />
      </feMerge>
    </template>
  </filter>

  <g :filter="`url(#${filterId})`">
    <path
      v-for="(shape, index) in props.shapes"
      :key="index"
      :d="shape.kind === 'path' ? shape.d : undefined"
      fill="#fff"
      :fill-opacity="shape.opacity ?? 1"
    />
  </g>
</template>
