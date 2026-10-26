<script setup lang="ts" generic="T extends string">
// A pill of exclusive choices: a thumb slides under the selected one. A radio group for assistive
// technology, so the arrows move between choices and only the selected one is in the tab order.
// The choices are equal columns, so one thumb width is the whole move.
//
// <SegmentedControl v-model="version" label="Version of the prompt" :options="[{ id: 'xp1', label: 'XP1' }]" />
interface SegmentedOption<V extends string> {
  id: V
  label: string
  icon?: string
}

interface SegmentedControlProps {
  options: SegmentedOption<T>[]
  /** Names the group for assistive technology */
  label: string
  /** `sm` is tighter and a size down, for a control inside a block. Give it a width (`class="w-full"`) to stretch the choices */
  size?: 'md' | 'sm'
}

const props = withDefaults(defineProps<SegmentedControlProps>(), { size: 'md' })

const model = defineModel<T>({ required: true })

const buttons = ref<HTMLElement[]>([])

const index = computed(() => Math.max(0, props.options.findIndex(option => option.id === model.value)))

function onKeydown(e: KeyboardEvent) {
  const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
  if (!step)
    return
  e.preventDefault()
  const next = (index.value + step + props.options.length) % props.options.length
  model.value = props.options[next]!.id
  buttons.value[next]?.focus()
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="segmented"
    :data-size="props.size"
    :style="{ '--count': options.length, '--index': index }"
    @keydown="onKeydown"
  >
    <span class="thumb" aria-hidden="true" />
    <button
      v-for="option in options"
      :key="option.id"
      ref="buttons"
      type="button"
      role="radio"
      class="segment"
      :aria-checked="model === option.id"
      :tabindex="model === option.id ? 0 : -1"
      @click="model = option.id"
    >
      <Icon v-if="option.icon" :name="option.icon" class="size-3.5" aria-hidden="true" />
      {{ option.label }}
    </button>
  </div>
</template>

<style scoped>
.segmented {
  position: relative;
  display: inline-grid;
  grid-template-columns: repeat(var(--count), 1fr);
  padding: 2px;
  border-radius: 9px;
  background: rgb(163 163 163 / 0.16);
}

.thumb {
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  width: calc((100% - 4px) / var(--count));
  border-radius: 7px;
  background: white;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
  transform: translateX(calc(var(--index) * 100%));
  transition: transform 260ms var(--ease-out);
}

.dark .thumb {
  background: rgb(64 64 64);
}

.segment {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 14px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  color: rgb(82 82 82);
  transition: color 200ms var(--ease-out);
}

.dark .segment {
  color: rgb(163 163 163);
}

.segmented[data-size='sm'] .segment {
  padding: 4px 8px;
  font-size: 12px;
}

.segment[aria-checked='true'] {
  color: rgb(23 23 23);
}

.dark .segment[aria-checked='true'] {
  color: rgb(245 245 245);
}

.segment:focus-visible {
  outline: 2px solid rgb(23 23 23);
  outline-offset: 2px;
}

.dark .segment:focus-visible {
  outline-color: rgb(245 245 245);
}

@media (prefers-reduced-motion: reduce) {
  .thumb,
  .segment {
    transition: none;
  }
}
</style>
