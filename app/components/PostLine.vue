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
  'origin-left w-full flex flex-col gap-1',
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
        class="size-4 opacity-0 transition-[opacity,transform] duration-300 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100"
      />
    </h3>
    <p :class="descriptionClasses">
      {{ description }}
    </p>
  </component>
</template>
