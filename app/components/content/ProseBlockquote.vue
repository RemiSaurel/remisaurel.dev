<script setup lang="ts">
withDefaults(defineProps<{
  type?: 'info' | 'warning' | 'danger' | 'note' | 'important'
}>(), {
  type: 'info',
})

const styles = {
  info: {
    border: 'border-blue-500',
    bg: 'bg-blue-50/60 dark:bg-blue-950/25',
    icon: 'uil:info-circle',
    color: 'text-blue-600 dark:text-blue-300',
  },
  warning: {
    border: 'border-yellow-500',
    bg: 'bg-yellow-50/60 dark:bg-yellow-950/25',
    icon: 'uil:exclamation-triangle',
    color: 'text-yellow-600 dark:text-yellow-300',
  },
  danger: {
    border: 'border-red-500',
    bg: 'bg-red-50/60 dark:bg-red-950/25',
    icon: 'uil:exclamation-octagon',
    color: 'text-red-600 dark:text-red-300',
  },
  note: {
    border: 'border-green-500',
    bg: 'bg-green-50/60 dark:bg-green-950/25',
    icon: 'uil:pen',
    color: 'text-green-600 dark:text-green-300',
  },
  important: {
    border: 'border-purple-500',
    bg: 'bg-purple-50/60 dark:bg-purple-950/25',
    icon: 'uil:star',
    color: 'text-purple-600 dark:text-purple-300',
  },
}

function formatTitle(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}
</script>

<template>
  <blockquote
    class="not-italic my-6 border-l-4 rounded-r-lg py-4 px-4 text-neutral-800 dark:text-neutral-200"
    :class="[styles[type].border, styles[type].bg]"
  >
    <div class="mb-2 flex items-center gap-2" :class="styles[type].color">
      <Icon :name="styles[type].icon" class="size-5" />
      <span class="text-sm font-semibold tracking-wide">
        {{ formatTitle(type) }}
      </span>
    </div>
    <div class="text-base leading-relaxed">
      <slot mdc-unwrap="p" />
    </div>
  </blockquote>
</template>
