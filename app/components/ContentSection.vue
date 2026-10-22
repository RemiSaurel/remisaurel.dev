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
    >
      <div class="flex items-center gap-2.5">
        <h2 class="m-0 text-xl text-neutral-700 font-medium tracking-tight dark:text-neutral-300">
          {{ title }}
        </h2>
        <LinkArrow v-if="link" class="section-arrow ml-1 h-2.5 w-2.5" />
      </div>
      <slot name="actions" />
    </component>

    <!-- Content slot -->
    <div>
      <slot />
    </div>
  </motion.section>
</template>

<style scoped>
/* Hidden until the header is hovered or focused; slides out from behind the label. */
@media (hover: hover) and (pointer: fine) {
  .section-arrow {
    opacity: 0;
    transform: translate(-12px, 6px) scale(0.9);
    filter: blur(2px);
    transition:
      transform 220ms cubic-bezier(0.23, 1, 0.32, 1),
      opacity 160ms ease-out,
      filter 160ms ease-out;
  }

  .group:hover .section-arrow,
  .group:focus-visible .section-arrow {
    opacity: 1;
    transform: none;
    filter: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .section-arrow {
    transform: none !important;
    filter: none !important;
  }
}
</style>
