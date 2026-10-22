<script setup lang="ts">
// A list whose hovered row gets a grey background that slides from row to row.
// Rows opt in with the `group` class (disabled rows simply don't have it).
withDefaults(defineProps<{ tag?: string }>(), { tag: 'div' })

const root = ref<HTMLElement>()
const box = reactive({ x: 0, y: 0, w: 0, h: 0, radius: '12px', visible: false, animate: false })

function onOver(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || !root.value)
    return
  const row = (event.target as HTMLElement).closest<HTMLElement>('.group')
  if (!row || !root.value.contains(row))
    return
  const parent = root.value.getBoundingClientRect()
  const rect = row.getBoundingClientRect()
  // Coming from outside the list: appear in place, only slide between rows
  box.animate = box.visible
  box.x = rect.left - parent.left
  box.y = rect.top - parent.top
  // Each row sets its own radius (inner radius + padding), the highlight copies it
  box.radius = getComputedStyle(row).borderRadius
  box.w = rect.width
  box.h = rect.height
  box.visible = true
}

function onLeave() {
  box.visible = false
}
</script>

<template>
  <component :is="tag" ref="root" class="hover-list relative" @pointerover="onOver" @pointerleave="onLeave">
    <span
      class="hover-bg pointer-events-none absolute left-0 top-0 bg-neutral-100 dark:bg-neutral-800"
      :class="{ 'is-visible': box.visible, 'is-animated': box.animate }"
      :style="{ width: `${box.w}px`, height: `${box.h}px`, borderRadius: box.radius, transform: `translate(${box.x}px, ${box.y}px)` }"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>

<style scoped>
.hover-bg {
  opacity: 0;
  z-index: 0;
  transition: opacity var(--duration-short) var(--ease-out);
}

.hover-bg.is-visible {
  opacity: 1;
}

.hover-bg.is-animated {
  transition:
    transform var(--duration-short) var(--ease-out),
    width var(--duration-short) var(--ease-out),
    height var(--duration-short) var(--ease-out),
    opacity var(--duration-short) var(--ease-out);
}

/* Rows paint above the highlight */
.hover-list > :deep(*:not(.hover-bg)) {
  position: relative;
  z-index: 1;
}

@media (hover: none), (prefers-reduced-motion: reduce) {
  .hover-bg.is-animated {
    transition: opacity var(--duration-short) var(--ease-out);
  }
}
</style>
