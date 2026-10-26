<script setup lang="ts">
// A button with an icon and a word, no tile until hovered: the small actions of a block ("Replay", "Simulate").
//
// <TextButton icon="lucide:rotate-ccw" size="sm" @click="play">Replay</TextButton>
type TextButtonSize = 'sm' | 'md'

interface TextButtonProps {
  icon?: string
  /** `sm` takes the colour and size of the text around it, `md` is a full control of its own */
  size?: TextButtonSize
}

const props = withDefaults(defineProps<TextButtonProps>(), { size: 'md' })

const SIZE_CLASSES: Record<TextButtonSize, string> = {
  sm: 'gap-[5px] rounded-[7px] px-[8px] py-[3px]',
  md: 'h-8 gap-1.5 rounded-lg px-3 text-[13px] text-neutral-600 font-medium dark:text-neutral-300',
}
</script>

<template>
  <button
    type="button"
    class="[transition-property:scale,background-color] inline-flex items-center keyboard-focus duration-[160ms] ease-[var(--ease-out)] [@media(prefers-reduced-motion:reduce)]:[transition-property:background-color] active:[scale:0.96] hover:bg-neutral-400/16"
    :class="SIZE_CLASSES[props.size]"
  >
    <Icon v-if="props.icon" :name="props.icon" :class="props.size === 'sm' ? 'size-3.5' : 'size-4'" aria-hidden="true" />
    <slot />
  </button>
</template>
