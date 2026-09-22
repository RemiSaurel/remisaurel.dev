<script setup lang="ts">
import { motion } from 'motion-v'
import { MINIMAL } from '~/sounds/sounds'

export interface ViewOption<T extends string = string> {
  value: T
  label: string
  icon: string
}

interface Props {
  options: ViewOption[]
  /** Scopes the sliding pill's layoutId so two switchers on a page never share it. */
  id: string
}

const props = defineProps<Props>()
const model = defineModel<string>({ required: true })

const { prefersReducedMotion } = usePrefersReducedMotion()
const { play } = useSound()

const PILL_TRANSITION = { type: 'spring', duration: 0.3, bounce: 0 } as const

function select(value: string) {
  if (model.value === value)
    return
  model.value = value
  play(MINIMAL.tap)
}
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Display mode"
    class="inline-flex items-center gap-0.5 bg-neutral-100 p-0.5 dark:bg-neutral-800"
  >
    <button
      v-for="option in props.options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      :aria-label="option.label"
      class="relative h-7 inline-flex pressable cursor-pointer items-center gap-1.5 px-2 text-xs transition-colors duration-200 ease-out"
      :class="model === option.value
        ? 'text-neutral-900 dark:text-neutral-100'
        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'"
      @click="select(option.value)"
    >
      <motion.span
        v-if="model === option.value"
        :layout-id="`view-switcher-pill-${props.id}`"
        class="absolute inset-0 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)] dark:bg-neutral-700"
        :transition="prefersReducedMotion ? { duration: 0 } : PILL_TRANSITION"
      />
      <span class="relative inline-flex items-center gap-1.5">
        <Icon :name="option.icon" class="size-3.5" />
        <span class="hidden sm:inline">{{ option.label }}</span>
      </span>
    </button>
  </div>
</template>
