<script setup lang="ts">
import type { CompareEntry } from '~/utils/compare'
import { useMounted } from '@vueuse/core'
import { COMPARE_KEY } from '~/utils/compare'

// Two or more takes on the same problem, side by side, each with its verdict: what works and what
// does not. Columns in one frame on a wide screen. On a phone, a carousel the finger drives (native
// scroll with snapping, the next take peeking at the edge) over a pager in the verdicts' colours.
// The takes are CompareItems:
//
// ::compare{caption="Same answer, three graders"}
// :::compare-item{label="One judge" verdict="fails" note="Why it fails"}
// ...
// :::
// ::
interface CompareProps {
  caption?: string
}

defineProps<CompareProps>()

const { play } = useSound()
const { prefersReducedMotion } = usePrefersReducedMotion()

const entries = ref<CompareEntry[]>([])

// The takes register while they set up, after this component has rendered on the client but before
// it has on the server: the pager waits for the mount so both sides hydrate to the same markup
const mounted = useMounted()

provide(COMPARE_KEY, {
  register: entry => (entries.value = [...entries.value, entry]),
  unregister: id => (entries.value = entries.value.filter(entry => entry.id !== id)),
})

// --- Carousel: the take closest to the start edge is the current one ---

const scroller = ref<HTMLElement>()
const current = ref(0)

function takes() {
  return [...(scroller.value?.querySelectorAll<HTMLElement>(':scope > [data-compare-item]') ?? [])]
}

function startPadding(el: HTMLElement) {
  return Number.parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0
}

// Scroll events already come once per frame: no throttle needed for a few takes
function onScroll() {
  const el = scroller.value
  if (!el)
    return
  const start = el.scrollLeft + startPadding(el)
  const distances = takes().map(take => Math.abs(take.offsetLeft - start))
  current.value = distances.indexOf(Math.min(...distances))
}

function go(index: number) {
  const el = scroller.value
  const take = takes()[index]
  if (!el || !take)
    return
  el.scrollTo({ left: take.offsetLeft - startPadding(el), behavior: prefersReducedMotion.value ? 'auto' : 'smooth' })
  play('select', { emphasis: 'subtle' })
}
</script>

<template>
  <figure class="compare breakout my-8">
    <div
      ref="scroller"
      class="compare-items"
      :style="{ '--compare-cols': entries.length || 1 }"
      @scroll.passive="onScroll"
    >
      <slot />
    </div>

    <!-- Phones: where you are in the carousel, and a way to jump -->
    <div v-if="mounted && entries.length > 1" class="mt-3 flex items-center justify-center gap-2 md:hidden">
      <button
        v-for="(entry, index) in entries"
        :key="entry.id"
        type="button"
        class="pager-dot grid h-6 place-items-center px-0.5"
        :aria-label="`Show ${entry.label}`"
        :aria-current="index === current || undefined"
        @click="go(index)"
      >
        <span class="dot" :data-verdict="entry.verdict" />
      </button>
      <span class="tabular-nums ml-1 text-xs text-neutral-500 dark:text-neutral-400">{{ current + 1 }} / {{ entries.length }}</span>
    </div>

    <figcaption v-if="caption" class="mt-2 text-center text-[13px] text-neutral-500 md:mt-3 dark:text-neutral-400">
      {{ caption }}
    </figcaption>
  </figure>
</template>

<style scoped>
/* Three shared rows (label, content, note) that every take spans, so they line up across takes */
.compare-items {
  /* Positioned, so a take's offsetLeft is measured from the carousel */
  position: relative;
  display: grid;
  grid-template-rows: auto 1fr auto;
}

.compare-items > :deep([data-compare-item]) {
  background: white;
}

.dark .compare-items > :deep([data-compare-item]) {
  background: rgb(38 38 38 / 0.4);
}

/* Phones: each take is a card in a carousel that runs to the screen edges */
@media (max-width: 767px) {
  .compare-items {
    grid-auto-flow: column;
    grid-auto-columns: calc(100% - 28px);
    column-gap: 8px;
    margin: 0 -24px;
    padding: 0 24px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    scroll-padding: 0 24px;
    scrollbar-width: none;
  }

  .compare-items::-webkit-scrollbar {
    display: none;
  }

  .compare-items > :deep([data-compare-item]) {
    scroll-snap-align: start;
    overflow: hidden;
    border: 1px solid rgb(229 229 229);
    border-radius: 12px;
  }

  .dark .compare-items > :deep([data-compare-item]) {
    border-color: rgb(64 64 64 / 0.8);
  }
}

/* Wider: one frame, a column per take split by hairlines; past three they scroll sideways */
@media (min-width: 768px) {
  .compare-items {
    grid-template-columns: repeat(var(--compare-cols), minmax(0, 1fr));
    overflow: hidden;
    border: 1px solid rgb(229 229 229);
    border-radius: 12px;
  }

  .dark .compare-items {
    border-color: rgb(64 64 64 / 0.8);
  }

  .compare-items > :deep([data-compare-item] + [data-compare-item]) {
    border-left: 1px solid rgb(229 229 229);
  }

  .dark .compare-items > :deep([data-compare-item] + [data-compare-item]) {
    border-left-color: rgb(64 64 64 / 0.8);
  }

  .compare-items:has(> :nth-child(4)) {
    grid-template-columns: none;
    grid-auto-flow: column;
    grid-auto-columns: minmax(280px, 1fr);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
  }

  .compare-items:has(> :nth-child(4)) > :deep([data-compare-item]) {
    scroll-snap-align: start;
  }
}

/* The pager: a dot per take in its verdict's colour, the current one stretched into a pill */
.dot {
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: rgb(163 163 163);
  opacity: 0.45;
  transition:
    width 240ms var(--ease-out),
    opacity 240ms var(--ease-out);
}

.dot[data-verdict='works'] {
  background: rgb(16 185 129);
}

.dot[data-verdict='partial'] {
  background: rgb(245 158 11);
}

.dot[data-verdict='fails'] {
  background: rgb(244 63 94);
}

.pager-dot[aria-current] .dot {
  width: 18px;
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .dot {
    transition: none;
  }
}
</style>
