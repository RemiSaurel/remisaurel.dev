<script setup lang="ts">
import type { ArtNode, ArtTheme } from '~/art/art'
import { artColorValue, drawLayer, isGroup, nodeTransform } from '~/art/art'

interface Props {
  node: ArtNode
  /** `ink` is what the parent resolved to: this node keeps it unless it picks its own color. */
  colors: { bg: string, ink: string }
  theme: 'auto' | ArtTheme
  /** What the parent resolved to, like `colors`. */
  stroke: number
}

const props = defineProps<Props>()

const colors = computed(() => props.node.color
  ? { bg: props.colors.bg, ink: artColorValue(props.node.color, props.theme) }
  : props.colors)

const stroke = computed(() => props.node.stroke ?? props.stroke)
// Dashes grow with thick strokes, so round caps don't close the gaps
const dash = computed(() => {
  const length = 3 * Math.max(1, stroke.value)
  return `${length} ${length}`
})

// Per node, so editing one layer never redraws the others
const shapes = computed(() => isGroup(props.node) ? [] : drawLayer(props.node))
const visibleChildren = computed(() => isGroup(props.node) ? props.node.children.filter(child => child.visible) : [])
</script>

<template>
  <g
    :data-node-id="props.node.id"
    :transform="nodeTransform(props.node)"
    :opacity="props.node.opacity === 1 ? undefined : props.node.opacity"
  >
    <PubArtNode
      v-for="child in visibleChildren"
      :key="child.id"
      :node="child"
      :colors="colors"
      :theme="props.theme"
      :stroke="stroke"
    />
    <PubArtGlow v-if="!isGroup(props.node) && props.node.type === 'glow'" :layer="props.node" :shapes="shapes" :color="colors.ink" :theme="props.theme" />
    <template v-else>
      <template v-for="(shape, index) in shapes" :key="index">
        <path
          v-if="shape.kind === 'path'"
          :d="shape.d"
          :fill="shape.filled ? colors.ink : 'none'"
          :stroke="colors.ink"
          :stroke-opacity="shape.opacity ?? 1"
          :fill-opacity="shape.filled ? (shape.opacity ?? 1) : undefined"
          :stroke-width="stroke"
          :stroke-dasharray="shape.dashed ? dash : undefined"
          stroke-linecap="round"
          stroke-linejoin="round"
          vector-effect="non-scaling-stroke"
        />
        <circle
          v-else
          :cx="shape.x"
          :cy="shape.y"
          :r="shape.r"
          :fill="shape.filled ? colors.ink : colors.bg"
          :stroke="colors.ink"
          :opacity="shape.opacity ?? 1"
          :stroke-width="stroke"
          vector-effect="non-scaling-stroke"
        />
      </template>
    </template>
  </g>
</template>
