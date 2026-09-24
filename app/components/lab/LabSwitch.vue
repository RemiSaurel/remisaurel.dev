<script setup lang="ts">
interface Props {
  label: string
}

const props = defineProps<Props>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    class="group h-7 flex cursor-pointer items-center justify-between gap-3 text-left text-xs outline-none"
    @click="model = !model"
  >
    <span class="text-neutral-500 transition-colors duration-150 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
      {{ props.label }}
    </span>
    <span
      class="lab-switch-track relative h-4 w-7 shrink-0 group-focus-visible:ring-1 group-focus-visible:ring-offset-1 group-focus-visible:ring-[#4f7cff] dark:group-focus-visible:ring-offset-neutral-900"
      :class="model ? 'bg-neutral-900 dark:bg-neutral-100' : 'bg-neutral-200 dark:bg-neutral-700'"
      aria-hidden="true"
    >
      <span
        class="lab-switch-thumb absolute left-0.5 top-0.5 size-3 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.2)]"
        :class="{ 'is-on dark:bg-neutral-900': model }"
      />
    </span>
  </button>
</template>

<style scoped>
.lab-switch-track {
  transition: background-color 150ms var(--ease-out);
}

.lab-switch-thumb {
  transition: transform 150ms var(--ease-out);
}

.lab-switch-thumb.is-on {
  transform: translateX(12px);
}

@media (prefers-reduced-motion: reduce) {
  .lab-switch-thumb {
    transition: none;
  }
}
</style>
