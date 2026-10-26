<script setup lang="ts">
// A small rounded label: a category, a venue, a status.
//
// <Chip tone="outline">CHI 2025</Chip>
// <Chip tone="sky" size="badge" icon="lucide:clock">Soon</Chip>
type ChipTone = 'soft' | 'outline' | 'sky'
type ChipSize = 'md' | 'badge'

interface ChipProps {
  /** `soft`: a grey fill. `outline`: a thin border. `sky`: the light blue of a promise */
  tone?: ChipTone
  /** `badge` is smaller and in capitals, for a status next to a title */
  size?: ChipSize
  icon?: string
}

const props = withDefaults(defineProps<ChipProps>(), { tone: 'soft', size: 'md' })

const TONE_CLASSES: Record<ChipTone, string> = {
  soft: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  outline: 'border border-neutral-300 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400',
  sky: 'border border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-400/30 dark:bg-sky-400/10 dark:text-sky-300',
}

const SIZE_CLASSES: Record<ChipSize, string> = {
  md: 'px-2 py-0.5 text-xs',
  badge: 'uppercase px-1.5 py-px text-[10px] font-medium tracking-wide',
}
</script>

<template>
  <span class="inline-flex items-center gap-1 whitespace-nowrap rounded-full" :class="[TONE_CLASSES[props.tone], SIZE_CLASSES[props.size]]">
    <Icon v-if="props.icon" :name="props.icon" class="size-2.5" aria-hidden="true" />
    <slot />
  </span>
</template>
