<script setup lang="ts">
// A square button with one icon, or any content in the slot (the theme switcher puts two icons that cross-fade).
// The label is required: with no text on the button it is the only name it has.
//
// <IconButton label="Mute sounds" icon="uil:volume" variant="solid" @click="toggle" />
type IconButtonVariant = 'soft' | 'solid' | 'ghost'

interface IconButtonProps {
  /** Names the button for assistive technology */
  label: string
  icon?: string
  /** `soft`: a grey tile, for tools inside a block. `solid`: a plain tile, for the page's switchers. `ghost`: no tile until hovered */
  variant?: IconButtonVariant
  /** A circle instead of a rounded square */
  round?: boolean
  pressed?: boolean
}

const props = withDefaults(defineProps<IconButtonProps>(), { variant: 'soft' })

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  soft: 'bg-neutral-400/18 text-neutral-600 hover:bg-neutral-400/30 dark:bg-neutral-400/20 dark:text-neutral-300',
  solid: 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700',
  ghost: 'text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-700',
}
</script>

<template>
  <button
    type="button"
    class="[transition-property:scale,background-color] relative grid size-8 shrink-0 place-items-center keyboard-focus duration-[160ms] ease-[var(--ease-out)] [@media(prefers-reduced-motion:reduce)]:[transition-property:background-color] active:[scale:0.94]"
    :class="[VARIANT_CLASSES[props.variant], props.round ? 'rounded-full' : 'rounded-lg']"
    :aria-label="props.label"
    :aria-pressed="props.pressed"
  >
    <slot>
      <Icon v-if="props.icon" :name="props.icon" class="size-4" aria-hidden="true" />
    </slot>
  </button>
</template>
