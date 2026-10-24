<script setup lang="ts">
import type { ArrowPaths } from '~/utils/arrow'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { arrowBetween } from '~/utils/arrow'

// A note on a few words in the middle of a sentence, written by hand: the words are underlined, and an arrow
// runs from the note to the end of the underline (its start when the note is on the left). It is the inline
// form of Annotation, which is for a whole block. On a wide screen the note sits in the margin, level with the
// line, and the arrow runs in the space under the line, so it crosses no word. On a narrow one there is no
// margin: the note follows the words.
//
// A :annotate[few words]{note="rules, not a model"} in the middle of a sentence.
//
// `side` is `right` (the default) or `left`.
interface AnnotateProps {
  note: string
  side?: 'left' | 'right'
}

const props = withDefaults(defineProps<AnnotateProps>(), {
  side: 'right',
})

const WIDE = '(min-width: 1080px)'

/** The arrow stops this far, in px, from the note */
const GAP = 6

/** Where the middle of handwritten letters is in the height of their line, from the top */
const LETTERS = 0.62

const root = ref<HTMLElement>()
const target = ref<HTMLElement>()
const marginNote = ref<HTMLElement>()
const place = ref<{ left: string, top: string } | null>(null)
const arrow = ref<ArrowPaths | null>(null)

// An inline element has no size to watch: the paragraph it is in is what changes when the text wraps
const paragraph = computed(() => root.value?.parentElement)

async function measure() {
  const el = root.value
  const words = target.value
  const note = marginNote.value
  const column = el?.closest('article') ?? el?.parentElement
  if (!el || !words || !note || !column || !window.matchMedia(WIDE).matches) {
    place.value = null
    arrow.value = null
    return
  }

  // The first line of the words, and the first piece of the block they are in: what the note is placed against
  const range = document.createRange()
  range.selectNodeContents(words)
  const first = [...range.getClientRects()].find(box => box.width > 0)
  const base = el.getClientRects()[0]
  if (!first || !base) {
    place.value = null
    arrow.value = null
    return
  }

  // The arrow ends on the underline and runs level, in the space under the line, where it crosses no word
  const left = props.side === 'left'
  const tip = { x: left ? first.left - 3 : first.right + 3, y: first.bottom }
  const top = first.bottom + 3 - note.offsetHeight / 2 - base.top
  const edge = column.getBoundingClientRect()
  const x = left ? edge.left - 40 - note.offsetWidth : edge.right + 40
  place.value = { left: `${x - base.left}px`, top: `${top}px` }
  await nextTick()

  // The note is placed by its text, not by its box: handwriting sits low in its line, so the middle of the
  // letters is brought to the level of the arrow
  const lineOf = () => {
    const letters = document.createRange()
    letters.selectNodeContents(note)
    return letters.getClientRects()[0] ?? note.getBoundingClientRect()
  }
  const middle = (box: DOMRect) => box.top + box.height * LETTERS
  const level = tip.y - middle(lineOf())
  place.value = { left: place.value.left, top: `${top + level}px` }
  await nextTick()

  const letters = lineOf()
  const relative = (point: { x: number, y: number }) => ({ x: point.x - base.left, y: point.y - base.top })
  arrow.value = arrowBetween(relative({ x: left ? letters.right + GAP : letters.left - GAP, y: tip.y }), relative(tip), { bend: -0.03, maxBend: 4 })
}

// The text wraps, the window changes, a font arrives: the note and the arrow are placed again
onMounted(() => {
  measure()
  document.fonts?.ready.then(measure)
})
useResizeObserver([paragraph, marginNote], measure)
useEventListener(window, 'resize', measure, { passive: true })
watch(() => [props.note, props.side], () => nextTick(measure))
</script>

<template>
  <span ref="root" class="annotate">
    <span ref="target" class="target"><slot /></span>

    <!-- No margin: the note follows the words, with a small arrow back at them. Only one of the two notes is shown -->
    <span class="inline-note font-note">
      <svg class="mini" viewBox="0 0 22 14" fill="none" aria-hidden="true">
        <path d="M21 8C15 8.5 9 8 3 6.5M3 6.5L7 2M3 6.5L8.5 10.5" />
      </svg>
      {{ note }}
    </span>

    <span ref="marginNote" class="margin-note font-note" :data-ready="!!place" :data-side="side" :style="place ?? undefined">
      {{ note }}
    </span>

    <svg v-if="arrow" class="pointer" aria-hidden="true">
      <path class="shaft" :d="arrow.shaft" pathLength="1" />
      <path class="head" :d="arrow.head" />
    </svg>
  </span>
</template>

<style scoped>
.annotate {
  --ink: rgb(64 64 64);
  position: relative;
}

.dark .annotate {
  --ink: rgb(212 212 212);
}

.target {
  text-decoration: underline wavy var(--ink);
  text-decoration-thickness: 1px;
  text-decoration-skip-ink: none;
  text-underline-offset: 3px;
}

.inline-note,
.margin-note {
  color: var(--ink);
  font-size: 1.25rem;
  line-height: 1;
  rotate: -2deg;
}

.inline-note {
  display: inline-block;
  margin-inline: 0.3em;
  white-space: nowrap;
}

.mini {
  /* The reset of the site makes an svg a block */
  display: inline-block;
  width: 1.3em;
  height: 0.85em;
  margin-right: 0.15em;
  vertical-align: -0.05em;
}

.mini path,
.pointer path {
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.margin-note {
  display: none;
}

.pointer {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 1px;
  overflow: visible;
  color: var(--ink);
  pointer-events: none;
}

/* The arrow is drawn as the page shows it: the line first, then its head */
.pointer .shaft {
  stroke-dasharray: 1;
  animation: draw 450ms var(--ease-out) backwards;
}

.pointer .head {
  animation: appear 120ms var(--ease-out) 380ms backwards;
}

@keyframes draw {
  from {
    stroke-dashoffset: 1;
  }
}

@keyframes appear {
  from {
    opacity: 0;
  }
}

/* A wide screen has margins: the note goes there, once it has been placed against its line */
@media (min-width: 1080px) {
  .inline-note {
    display: none;
  }

  .margin-note {
    position: absolute;
    display: block;
    width: min(10rem, calc(50vw - 340px - 3.5rem));
    font-size: 1.35rem;
    line-height: 1.1;
    text-wrap: balance;
    visibility: hidden;
  }

  .margin-note[data-side='left'] {
    text-align: right;
  }

  .margin-note[data-ready='true'] {
    visibility: visible;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pointer .shaft,
  .pointer .head {
    animation: none;
  }
}
</style>
