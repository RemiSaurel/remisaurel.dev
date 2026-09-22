<script setup lang="ts">
import type { TechKey } from '~/projects/techs'
import { onClickOutside } from '@vueuse/core'
import { TECHS } from '~/projects/techs'

const props = defineProps<{
  stack: TechKey[]
}>()

const techs = computed(() => props.stack.map(key => ({ key, ...TECHS[key] })))

const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')

// Hover only opens for real mouse pointers; touch goes through click so a tap
// doesn't open-then-immediately-toggle-closed
function onPointerEnter(event: PointerEvent) {
  if (event.pointerType === 'mouse')
    open.value = true
}

function onPointerLeave(event: PointerEvent) {
  if (event.pointerType === 'mouse')
    open.value = false
}

function onClick(event: MouseEvent) {
  // Mouse users already opened it on hover, clicking shouldn't close it
  if ((event as PointerEvent).pointerType !== 'mouse')
    open.value = !open.value
}

// A tap also focuses the list, so only keyboard focus opens it here
function onFocus() {
  if (root.value?.matches(':focus-visible'))
    open.value = true
}

onClickOutside(root, () => {
  open.value = false
})
</script>

<template>
  <ul
    v-if="techs.length"
    ref="root"
    class="tech-stack list-none m-0 flex items-center gap-1 p-0"
    :data-open="open || undefined"
    :style="{ '--n': techs.length }"
    aria-label="Tech stack"
    tabindex="0"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @click="onClick"
    @focus="onFocus"
    @blur="open = false"
  >
    <UTooltip
      v-for="(tech, index) in techs"
      :key="tech.key"
      :text="tech.name"
      :delay-duration="150"
      :content="{ side: 'top', sideOffset: 6 }"
    >
      <li
        class="tech-stack-item relative size-[22px] flex shrink-0 items-center justify-center border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
        :style="{ '--i': index }"
      >
        <Icon
          :name="tech.icon"
          class="size-3"
          :style="tech.color ? { color: tech.color } : undefined"
          aria-hidden="true"
        />
        <span class="sr-only">{{ tech.name }}</span>
      </li>
    </UTooltip>
  </ul>
</template>

<style scoped>
/*
 * The list is laid out at its expanded width and each square is pushed right
 * with a transform to form the collapsed stack. Only `transform` animates, so
 * the fan-out never triggers layout and stays interruptible mid-way.
 */
.tech-stack {
  --size: 22px;
  --gap: 0.25rem;
  /* How much of each square peeks out from under the one before it */
  --peek: 13px;
  --shift: calc(var(--size) + var(--gap) - var(--peek));

  /* The reserved (empty) expanded area must not catch the hover, only the
     squares themselves do */
  pointer-events: none;
}

.tech-stack-item {
  pointer-events: auto;
  z-index: calc(var(--n) - var(--i));
  transform: translateX(calc((var(--n) - 1 - var(--i)) * var(--shift)));
  /* Closing is the system responding: snappier than opening */
  transition: transform 200ms var(--ease-out);
}

/* Bridge the gap between expanded squares so moving the cursor across them
   doesn't fire a pointerleave and collapse the stack mid-hover */
.tech-stack-item::after {
  content: '';
  position: absolute;
  inset: 0 calc(var(--gap) / -2 - 1px);
}

.tech-stack[data-open] .tech-stack-item {
  transform: none;
  transition-duration: 280ms;
}
</style>
