<script setup lang="ts">
import type { FlowTipPlacement } from '~/utils/flow/types'
import { FLOW_TIP_PLACEMENT } from '~/utils/flow/types'

// A floating group of FlowButtons. Hovering it long enough "warms" it: from then on, moving from one
// button to the next shows each label at once, until the pointer leaves the group.
// `tips` says where its labels open: away from the canvas edge the toolbar sits against.
const props = withDefaults(defineProps<{ tips?: FlowTipPlacement }>(), { tips: 'top' })

provide(FLOW_TIP_PLACEMENT, toRef(props, 'tips'))

const warm = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

function enter() {
  clearTimeout(timer)
  timer = setTimeout(() => (warm.value = true), 450)
}

function leave() {
  clearTimeout(timer)
  warm.value = false
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div
    data-flow-ui
    :data-warm="warm || undefined"
    class="backdrop-blur-sm flex items-center gap-0.5 border border-neutral-200 rounded-xl bg-white/90 p-0.5 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_12px_-4px_rgb(0_0_0/0.08)] dark:border-neutral-700 dark:bg-neutral-800/90 dark:shadow-none"
    @mouseenter="enter"
    @mouseleave="leave"
  >
    <slot />
  </div>
</template>
