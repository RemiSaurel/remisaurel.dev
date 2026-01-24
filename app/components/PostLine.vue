<script setup lang="ts">
interface Props {
  to: string;
  title: string;
  description: string;
  disabled?: boolean;
}
const nuxtLink = resolveComponent('NuxtLink');


const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

// Computed classes for better maintainability
const containerClasses = computed(() => [
  'w-full flex flex-col gap-1',
  props.disabled ? 'opacity-40' : 'group'
]);

const titleClasses = computed(() => [
  'text-md my-0 font-semibold transition duration-500',
  'dark:text-zinc-400 text-zinc-500',
  !props.disabled && 'group-hover:text-zinc-900 dark:group-hover:text-zinc-200'
].filter(Boolean));

const descriptionClasses = computed(() => [
  'text-sm my-0 font-medium transition duration-500',
  'dark:text-zinc-500 text-zinc-400',
  !props.disabled && 'group-hover:text-zinc-500 dark:group-hover:text-zinc-400'
].filter(Boolean));

const displayTitle = computed(() => 
  props.disabled ? `${props.title} 🔜` : props.title
);
</script>

<template>
  <component 
    :is="disabled ? 'div' : nuxtLink" 
    :to="disabled ? undefined : to"
    :class="containerClasses"
  >
    <h3 :class="titleClasses">
      {{ displayTitle }}
    </h3>
    <h4 :class="descriptionClasses">
      {{ description }}
    </h4>
  </component>
</template>
