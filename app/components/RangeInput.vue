<script setup lang="ts">
// A native range slider with its value written next to it. The text before the slider is the label, the
// `after` slot reads on after the value.
//
// <RangeInput v-model="gap" :min="0" :max="4" :step="0.5">Acts closer than<template #after>are one line</template></RangeInput>
interface RangeInputProps {
  min: number
  max: number
  step: number
  /** Written after the value */
  unit?: string
  /** What a screen reader says for the unit */
  unitLabel?: string
  decimals?: number
}

const props = withDefaults(defineProps<RangeInputProps>(), {
  unit: 's',
  unitLabel: 'seconds',
  decimals: 1,
})

const model = defineModel<number>({ required: true })

const value = computed(() => model.value.toFixed(props.decimals))
</script>

<template>
  <label class="min-w-0 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
    <span><slot /></span>
    <input
      v-model.number="model"
      type="range"
      class="[accent-color:rgb(115_115_115)] max-w-56 min-w-20 flex-[1_1_6rem] keyboard-focus"
      :min="props.min"
      :max="props.max"
      :step="props.step"
      :aria-valuetext="`${value} ${props.unitLabel}`"
    >
    <output class="tabular-nums min-w-[2.2rem] font-medium">{{ value }} {{ props.unit }}</output>
    <span v-if="$slots.after"><slot name="after" /></span>
  </label>
</template>
