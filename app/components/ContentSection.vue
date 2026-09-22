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

const transition = {
  duration: 0.6,
  ease: [0.25, 0.46, 0.45, 0.94],
}

const { prefersReducedMotion } = usePrefersReducedMotion()

const computedTransition = computed(() => {
  if (prefersReducedMotion.value) {
    return { duration: 0 }
  }
  const base = props.animate ? { ...transition, delay: props.delay } : { duration: 0 }
  // Layout moves follow the list/card morph, never the entrance delay.
  return { ...base, layout: VIEW_MORPH_TRANSITION }
})
</script>

<template>
  <motion.section
    :initial="props.animate && !prefersReducedMotion ? { opacity: 0, y: 15, filter: 'blur(8px)' } : { opacity: 1, y: 0, filter: 'blur(0px)' }"
    :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
    :transition="computedTransition"
    :layout="props.layout"
    class="flex flex-col"
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
      <svg
        v-if="link"
        class="h-2.5 w-2.5 group-hover:rotate-45"
        viewBox="0 0 11 11"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M8.4778 3.06917L1.23404 10.3129L0 9.0789L7.24376 1.83513L0.456622 1.71166L0.440628 0L10.1366 0.176392L10.313 9.87231L8.60128 9.85632L8.4778 3.06917Z"
          fill="currentColor"
        />
      </svg>
    </component>

    <!-- Content slot -->
    <div>
      <slot />
    </div>
  </motion.section>
</template>
