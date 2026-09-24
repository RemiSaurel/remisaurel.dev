<script setup lang="ts">
import type { ArtNode } from '~/art/art'
import { drawLayer, isGroup, nodeTransform } from '~/art/art'

interface Props {
  node: ArtNode
  colors: { bg: string, ink: string }
  stroke: number
}

const props = defineProps<Props>()

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
      :colors="props.colors"
      :stroke="props.stroke"
    />
    <template v-for="(shape, index) in shapes" :key="index">
      <path
        v-if="shape.kind === 'path'"
        :d="shape.d"
        :fill="shape.filled ? props.colors.ink : 'none'"
        :stroke="props.colors.ink"
        :stroke-opacity="shape.opacity ?? 1"
        :fill-opacity="shape.filled ? (shape.opacity ?? 1) : undefined"
        :stroke-width="props.stroke"
        :stroke-dasharray="shape.dashed ? '3 3' : undefined"
        stroke-linecap="round"
        stroke-linejoin="round"
        vector-effect="non-scaling-stroke"
      />
      <circle
        v-else
        :cx="shape.x"
        :cy="shape.y"
        :r="shape.r"
        :fill="shape.filled ? props.colors.ink : props.colors.bg"
        :stroke="props.colors.ink"
        :opacity="shape.opacity ?? 1"
        :stroke-width="props.stroke"
        vector-effect="non-scaling-stroke"
      />
    </template>
  </g>
</template>
