<script setup lang="ts">
import type { ArrowPaths } from '~/utils/arrow'
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { arrowBetween, nearestOutside } from '~/utils/arrow'

// A note written by hand next to a block of text, like a pencil mark on a printed page: a bracket beside the
// block and a few words that comment on it. On a wide screen the note sits in the margin, outside the reading
// column. On a narrow one there is no margin: the bracket stays against the text and the note goes under it.
// With `mark="arrow"` the bracket is replaced by a small arrow from the note to the last word of the block (the
// first word when the note is on the left). It is measured on the page, so it lands there whatever the width of
// the screen and the way the lines wrap.
//
// ::annotation{note="best-shotting?"}
// The paragraph the note is about.
// ::
//
// `mark` is `bracket` (the default) or `arrow`. `side` is `right` (the default) or `left`.
interface AnnotationProps {
  note: string
  mark?: 'bracket' | 'arrow'
  side?: 'left' | 'right'
}

const props = withDefaults(defineProps<AnnotationProps>(), {
  mark: 'bracket',
  side: 'right',
})

/** The arrow stops this far, in px, from the word and from the note */
const GAP = 6

const root = ref<HTMLElement>()
const body = ref<HTMLElement>()
const noteEl = ref<HTMLElement>()
const arrow = ref<ArrowPaths | null>(null)

// The lines of text of the block, in reading order: one box per line of each piece of text
function lines(el: HTMLElement): DOMRect[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const boxes: DOMRect[] = []
  while (walker.nextNode()) {
    const node = walker.currentNode
    if (!node.textContent?.trim())
      continue
    const range = document.createRange()
    range.selectNodeContents(node)
    boxes.push(...[...range.getClientRects()].filter(box => box.width > 0))
  }
  return boxes
}

function measure() {
  if (props.mark !== 'arrow' || !root.value || !body.value || !noteEl.value) {
    arrow.value = null
    return
  }
  const boxes = lines(body.value)
  const word = props.side === 'right' ? boxes.at(-1) : boxes[0]
  if (!word) {
    arrow.value = null
    return
  }

  // In the page of the window, then relative to the block the arrow is drawn in
  const tip = props.side === 'right'
    ? { x: word.right + GAP, y: word.top + word.height * 0.55 }
    : { x: word.left - GAP, y: word.top + word.height * 0.55 }
  // The arrow leaves the letters of the note, not the box around them: handwriting sits low in its line
  const letters = document.createRange()
  letters.selectNodeContents(noteEl.value)
  const line = letters.getClientRects()[0] ?? noteEl.value.getBoundingClientRect()
  const band = { left: line.left, right: line.right, top: line.top + line.height * 0.45, bottom: line.top + line.height * 0.75 }
  const start = nearestOutside(band, tip, GAP)
  const origin = root.value.getBoundingClientRect()
  const relative = (point: { x: number, y: number }) => ({ x: point.x - origin.left, y: point.y - origin.top })
  arrow.value = start ? arrowBetween(relative(start), relative(tip)) : null
}

// The text wraps, the note changes size and place, a font arrives: the arrow is drawn again
onMounted(() => {
  measure()
  document.fonts?.ready.then(measure)
})
useResizeObserver([root, body, noteEl], measure)
useEventListener(window, 'resize', measure, { passive: true })
watch(() => [props.mark, props.side, props.note], () => nextTick(measure))
</script>

<template>
  <div ref="root" class="annotated" :data-mark="mark" :data-side="side">
    <div ref="body" class="body">
      <!-- The strokes are decoration: the words of the note are what is read -->
      <span class="bracket" aria-hidden="true">
        <svg class="cap" viewBox="0 0 16 10" fill="none">
          <path d="M1.4 7.6C4.6 4.9 9.2 4 13.7 4.2L13.9 10" />
        </svg>
        <svg class="line" viewBox="0 0 16 100" preserveAspectRatio="none" fill="none">
          <path d="M13.9 0L13.3 100" vector-effect="non-scaling-stroke" />
        </svg>
        <svg class="cap" viewBox="0 0 16 10" fill="none">
          <path d="M13.3 0L13.5 5.9C9.3 6.1 4.7 5.2 1.5 2.4" />
        </svg>
      </span>

      <slot />
    </div>

    <aside ref="noteEl" class="note font-note" aria-label="Note in the margin">
      {{ note }}
    </aside>

    <!-- At the origin of the block: the arrow is drawn in px of the block -->
    <svg v-if="arrow" class="pointer" aria-hidden="true">
      <path class="shaft" :d="arrow.shaft" pathLength="1" />
      <path class="head" :d="arrow.head" />
    </svg>
  </div>
</template>

<style scoped>
.annotated {
  --ink: rgb(64 64 64);
  position: relative;
  display: flex;
  flex-direction: column;
  /* The block gives its own space, like the paragraphs around it */
  margin-block: 1.25rem;
}

.dark .annotated {
  --ink: rgb(212 212 212);
}

.body {
  position: relative;
}

/* The block ends with its text, not with the space the last paragraph leaves below it: the note and the bracket are level with the text */
.body > :deep(.bracket + *) {
  margin-top: 0;
}

.body > :deep(:last-child) {
  margin-bottom: 0;
}

.bracket,
.pointer {
  color: var(--ink);
  pointer-events: none;
}

.bracket path,
.pointer path {
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.bracket {
  position: absolute;
  top: 0;
  bottom: 0;
  display: none;
  width: 16px;
  flex-direction: column;
}

.bracket .cap {
  display: block;
  flex: none;
  width: 16px;
  height: 10px;
}

.bracket .line {
  display: block;
  flex: 1;
  width: 16px;
  min-height: 0;
}

.pointer {
  position: absolute;
  left: 0;
  top: 0;
  width: 1px;
  height: 1px;
  overflow: visible;
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

.note {
  margin: 0;
  width: fit-content;
  max-width: 100%;
  color: var(--ink);
  font-size: 1.35rem;
  line-height: 1.1;
  text-wrap: balance;
  rotate: -2deg;
}

/*
 * No margin to write in. With an arrow the note goes under the block, on its right, and the arrow rises to the
 * last word. On the left it goes above the block, and the arrow falls to the first word.
 */
.annotated[data-mark='arrow'][data-side='right'] .note {
  margin: 1.4rem 0 0 auto;
  text-align: right;
}

.annotated[data-mark='arrow'][data-side='left'] .note {
  order: -1;
  margin: 0 auto 1.4rem 0;
}

/* With a bracket it stays against the text, and the note goes under it */
.annotated[data-mark='bracket'] .bracket {
  display: flex;
}

.annotated[data-mark='bracket'] .pointer {
  display: none;
}

.annotated[data-mark='bracket'][data-side='right'] .body {
  padding-right: 24px;
}

.annotated[data-mark='bracket'][data-side='left'] .body {
  padding-left: 24px;
}

.annotated[data-mark='bracket'][data-side='right'] .bracket {
  right: 0;
}

.annotated[data-mark='bracket'][data-side='left'] .bracket {
  left: 0;
  scale: -1 1;
}

.annotated[data-mark='bracket'] .note {
  margin-top: -0.4rem;
}

.annotated[data-mark='bracket'][data-side='right'] .note {
  margin-right: 24px;
  margin-left: auto;
  text-align: right;
}

.annotated[data-mark='bracket'][data-side='left'] .note {
  margin-left: 24px;
}

/* A wide screen has margins: the note goes there. The arrow, drawn from where it ended up, crosses to the text */
@media (min-width: 1080px) {
  .annotated[data-mark][data-side] .note {
    position: absolute;
    width: min(10rem, calc(50vw - 340px - 3.5rem));
    order: 0;
    margin: 0;
    text-align: left;
  }

  .annotated[data-mark][data-side='right'] .note {
    left: calc(100% + 40px);
  }

  .annotated[data-mark][data-side='left'] .note {
    right: calc(100% + 40px);
    text-align: right;
  }

  /* Level with the last line, or with the first when it is on the left: handwriting sits low, so a little higher */
  .annotated[data-mark='arrow'][data-side='right'] .note {
    bottom: 0;
    translate: 0 -5px;
  }

  .annotated[data-mark='arrow'][data-side='left'] .note {
    top: 0;
    translate: 0 -5px;
  }

  .annotated[data-mark='bracket'] .note {
    top: 50%;
    translate: 0 -50%;
  }

  .annotated[data-mark='bracket'][data-side='right'] .bracket {
    left: calc(100% + 10px);
    right: auto;
  }

  .annotated[data-mark='bracket'][data-side='left'] .bracket {
    right: calc(100% + 10px);
    left: auto;
  }

  .annotated[data-mark='bracket'][data-side] .body {
    padding-inline: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pointer .shaft,
  .pointer .head {
    animation: none;
  }
}
</style>
