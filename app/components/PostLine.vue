<script setup lang="ts">
interface Props {
  to: string
  title: string
  description: string
  disabled?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const nuxtLink = resolveComponent('NuxtLink')

// Computed classes for better maintainability
const containerClasses = computed(() => [
  'pressable w-full flex flex-col gap-1',
  props.disabled ? 'opacity-40' : 'group',
])

const titleClasses = computed(() => [
  'text-md my-0 inline-flex items-center gap-2 font-semibold transition duration-500',
  'dark:text-zinc-400 text-zinc-500',
  !props.disabled && 'group-hover:text-zinc-900 dark:group-hover:text-zinc-200',
].filter(Boolean))

const descriptionClasses = computed(() => [
  'text-sm my-0 font-medium transition duration-500',
  'dark:text-zinc-500 text-zinc-400',
  !props.disabled && 'group-hover:text-zinc-500 dark:group-hover:text-zinc-400',
].filter(Boolean))

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
    <h3 :class="titleClasses">
      {{ displayTitle }}
      <Icon
        v-if="!disabled"
        name="uil:arrow-up-right"
        class="size-4 transition-all duration-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
      />
    </h3>
    <h4 :class="descriptionClasses">
      {{ description }}
    </h4>
  </component>
</template>
