<script setup lang="ts">
interface Props {
  to: string
  title: string
  description: string
  disabled?: boolean
  date?: Date | string
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const nuxtLink = resolveComponent('NuxtLink')

// Computed classes for better maintainability
const containerClasses = computed(() => [
  'origin-left flex items-center gap-4 rounded-xl px-2 py-2 -mx-2',
  props.disabled ? 'opacity-40' : 'group',
])

const titleClasses = computed(() => [
  'text-md my-0 inline-flex items-center gap-2 font-semibold transition-colors duration-200',
  'dark:text-zinc-300 text-zinc-700',
  !props.disabled && 'group-hover:text-zinc-900 dark:group-hover:text-zinc-100',
].filter(Boolean))

const descriptionClasses = computed(() => [
  'text-sm my-0 font-medium transition-colors duration-200',
  'dark:text-zinc-400 text-zinc-500',
  !props.disabled && 'group-hover:text-zinc-600 dark:group-hover:text-zinc-300',
].filter(Boolean))

// Each post gets its own mix of strong and faint lines, stable from its path so SSR and client agree.
// The last line is the short one and never the strong one
const LINE_OPACITIES = [0.35, 0.5, 0.65]
const lineOpacities = computed(() => {
  let hash = 0
  for (const char of props.to)
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const strong = hash % 3
  return Array.from({ length: 4 }, (_, i) =>
    i === strong ? 1 : LINE_OPACITIES[(hash >>> (i * 2 + 2)) % LINE_OPACITIES.length])
})

const displayTitle = computed(() =>
  props.disabled ? `${props.title} 🔜` : props.title,
)
</script>

<template>
  <component
    :is="disabled ? 'div' : nuxtLink"
    :to="disabled ? undefined : to"
    :class="containerClasses"
  >
    <!-- Same sheet tile as the explorations list: a few lines of text -->
    <RowTile aria-hidden="true">
      <span class="w-[20px] flex flex-col gap-[4px]">
        <span
          v-for="(opacity, i) in lineOpacities"
          :key="i"
          class="h-[2px] rounded-full bg-current"
          :class="i === 3 ? 'w-3/5' : 'w-full'"
          :style="{ opacity }"
        />
      </span>
    </RowTile>

    <span class="min-w-0 flex flex-col gap-1">
      <h3 :class="titleClasses">
        {{ displayTitle }}
        <NewTag v-if="!disabled && isNew(date)" />
      </h3>
      <p :class="descriptionClasses">
        {{ description }}
      </p>
    </span>
  </component>
</template>
