<script setup lang="ts">
interface Props {
  label: string
  options: { value: string, label: string }[]
}

const props = defineProps<Props>()
const model = defineModel<string>({ required: true })

// Up to four options fit on one row; longer lists wrap into rows of three
const columns = computed(() => props.options.length <= 4 ? props.options.length : 3)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <span class="text-xs text-neutral-500 dark:text-neutral-400">{{ props.label }}</span>
    <div
      role="radiogroup"
      :aria-label="props.label"
      class="grid gap-0.5 bg-neutral-100 p-0.5 dark:bg-neutral-800/70"
      :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
    >
      <!-- Switches instantly: this is picked over and over while composing -->
      <button
        v-for="option in props.options"
        :key="option.value"
        type="button"
        role="radio"
        :aria-checked="model === option.value"
        class="h-6 cursor-pointer truncate px-1.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#4f7cff]"
        :class="model === option.value
          ? 'bg-white text-neutral-900 shadow-[0_1px_2px_rgb(0_0_0/0.08)] dark:bg-neutral-700 dark:text-neutral-100'
          : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'"
        @click="model = option.value"
      >
        {{ option.label }}
      </button>
    </div>
  </div>
</template>
