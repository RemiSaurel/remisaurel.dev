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

// One shared tooltip that slides between squares instead of one tooltip per
// square crossfading on top of each other (Linear-nav style)
const TOOLTIP_DELAY = 150
// Re-entering shortly after leaving skips the delay, like a toolbar
const TOOLTIP_GRACE = 300

const activeIndex = ref(0)
const tooltipVisible = ref(false)
const tooltipWidth = ref<number>()
const labels = useTemplateRef<HTMLElement[]>('labels')

let showTimer: ReturnType<typeof setTimeout> | undefined
let lastHiddenAt = 0

function measureLabel() {
  tooltipWidth.value = labels.value?.[activeIndex.value]?.offsetWidth
}

function onItemEnter(event: PointerEvent, index: number) {
  if (event.pointerType !== 'mouse')
    return

  activeIndex.value = index
  measureLabel()

  if (tooltipVisible.value)
    return

  clearTimeout(showTimer)
  const delay = Date.now() - lastHiddenAt < TOOLTIP_GRACE ? 0 : TOOLTIP_DELAY
  showTimer = setTimeout(() => {
    tooltipVisible.value = true
  }, delay)
}

function hideTooltip() {
  clearTimeout(showTimer)
  if (tooltipVisible.value)
    lastHiddenAt = Date.now()
  tooltipVisible.value = false
}

watch(open, (value) => {
  if (!value)
    hideTooltip()
})

onBeforeUnmount(() => clearTimeout(showTimer))
</script>

<template>
  <div v-if="techs.length" class="relative w-fit">
    <ul
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
      <li
        v-for="(tech, index) in techs"
        :key="tech.key"
        class="tech-stack-item relative size-[22px] flex shrink-0 items-center justify-center border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900"
        :style="{ '--i': index }"
        @pointerenter="onItemEnter($event, index)"
      >
        <Icon
          :name="tech.icon"
          class="size-3"
          :style="tech.color ? { color: tech.color } : undefined"
          aria-hidden="true"
        />
        <span class="sr-only">{{ tech.name }}</span>
      </li>
    </ul>

    <div
      class="tech-tooltip pointer-events-none absolute bottom-full left-0 mb-1.5 h-6 overflow-hidden rounded-sm bg-white text-xs text-neutral-900 shadow-sm ring-1 ring-neutral-200 dark:bg-neutral-900 dark:text-white dark:ring-neutral-800"
      :data-visible="tooltipVisible || undefined"
      :style="{ '--active': activeIndex, 'width': tooltipWidth ? `${tooltipWidth}px` : undefined }"
      aria-hidden="true"
    >
      <span
        v-for="(tech, index) in techs"
        ref="labels"
        :key="tech.key"
        class="tech-tooltip-label absolute left-1/2 top-1/2 whitespace-nowrap px-2"
        :data-active="index === activeIndex || undefined"
      >
        {{ tech.name }}
      </span>
    </div>
  </div>
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

/*
 * The tooltip sits above the expanded position of the active square. Width
 * follows the label and the -50% keeps it centered while it resizes, so moving
 * between squares reads as one surface sliding and morphing.
 */
.tech-tooltip {
  --size: 22px;
  --gap: 0.25rem;
  --x: calc(var(--active) * (var(--size) + var(--gap)) + var(--size) / 2);

  transform: translateX(calc(var(--x) - 50%)) translateY(2px) scale(0.97);
  transform-origin: bottom center;
  opacity: 0;
  /* Hidden: only fade, so it never slides in from the previous square */
  transition:
    opacity 120ms var(--ease-out),
    transform 120ms var(--ease-out);
}

.tech-tooltip[data-visible] {
  transform: translateX(calc(var(--x) - 50%));
  opacity: 1;
  transition:
    opacity 150ms var(--ease-out),
    transform 220ms var(--ease-out),
    width 220ms var(--ease-out);
}

.tech-tooltip-label {
  translate: -50% -50%;
  opacity: 0;
  filter: blur(2px);
  transition:
    opacity 150ms var(--ease-out),
    filter 150ms var(--ease-out);
}

.tech-tooltip-label[data-active] {
  opacity: 1;
  filter: none;
}

@media (prefers-reduced-motion: reduce) {
  .tech-tooltip,
  .tech-tooltip[data-visible] {
    transition: opacity 150ms ease;
  }

  .tech-tooltip-label {
    filter: none;
  }
}
</style>
