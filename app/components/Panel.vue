<script setup lang="ts">
// The framed block of the explorations: a thin border and a faint tint in dark mode.
// Layout (flex, gap, margins) stays with the caller, through `class`.
//
// <Panel as="section" aria-label="The log" class="flex flex-col gap-2">…</Panel>
type PanelPadding = 'none' | 'sm' | 'md' | 'lg'

interface PanelProps {
  /** The tag it renders as: a `figure`, a `section`… */
  as?: string
  padding?: PanelPadding
}

const props = withDefaults(defineProps<PanelProps>(), { as: 'div', padding: 'md' })

const PADDING_CLASSES: Record<PanelPadding, string> = {
  none: '',
  sm: 'px-3 py-1.5',
  md: 'px-3 py-2.5',
  lg: 'p-3',
}
</script>

<template>
  <component
    :is="props.as"
    class="border border-neutral-200 rounded-xl dark:border-neutral-700/80 dark:bg-neutral-800/40"
    :class="PADDING_CLASSES[props.padding]"
  >
    <slot />
  </component>
</template>
