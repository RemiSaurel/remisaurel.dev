<script setup lang="ts">
import { motion } from 'motion-v'
import { VIEW_MORPH_TRANSITION } from '~/composables/useListView'

interface Props {
  title?: string
  link?: string
  animate?: boolean
  delay?: number
  /** Opt into motion layout animations, so the section glides when content above it resizes. */
  layout?: boolean | 'position'
}

const props = withDefaults(defineProps<Props>(), {
  animate: true,
  delay: 0,
})

const { prefersReducedMotion } = usePrefersReducedMotion()

const layoutTransition = computed(() => prefersReducedMotion.value ? { duration: 0 } : { layout: VIEW_MORPH_TRANSITION })
</script>

<template>
  <motion.section
    :transition="layoutTransition"
    :layout="props.layout"
    class="[--enter-blur:8px] flex flex-col"
    :class="{ enter: props.animate }"
    :style="{ '--enter-delay': `${props.delay}s` }"
  >
    <!-- Section header (optional) -->
    <component
      :is="link ? 'a' : 'div'"
      v-if="title"
      :href="link"
      class="group mb-3 mt-2 flex items-center justify-between"
      :class="{ pressable: link }"
    >
      <div class="text-xl text-neutral-700 font-medium tracking-tight dark:text-neutral-300">
        {{ title }}
      </div>
      <slot name="actions" />
      <LinkArrow
        v-if="link"
        class="h-2.5 w-2.5 group-hover:rotate-45"
      />
    </component>

    <!-- Content slot -->
    <div>
      <slot />
    </div>
  </motion.section>
</template>
