<script setup lang="ts">
// A note written by hand in the margin of a figure, that says something about what the pointer is on. With
// nothing to say it shows the `hint`, fainter, or nothing. On a wide screen it sits in the margin, outside the
// reading column, level with the middle of the figure (or at `top`). On a narrow one there is no margin: it goes
// under the figure, and keeps its place so that the page does not move when it changes. Its parent must be
// positioned (`relative`).
//
// <figure class="relative"> … <MarginNote :note="note" hint="point at a block" /> </figure>
interface MarginNoteProps {
  /** What to say now. Empty when the pointer is on nothing. A line break is kept */
  note?: string | null
  /** What to say when there is no note: it tells that there is something to point at */
  hint?: string
  /** Where its top edge is, in the height of the figure, on a wide screen. Centered when not given */
  top?: string
}

const props = defineProps<MarginNoteProps>()

const text = computed(() => props.note || props.hint || '')
</script>

<template>
  <div class="margin-note font-note" :data-idle="!note" :data-placed="!!top" :style="top ? { top } : undefined" aria-live="polite">
    <Transition name="note" mode="out-in">
      <p v-if="text" :key="text" class="text">
        <!-- The strokes are decoration: the words of the note are what is read -->
        <svg class="mini" viewBox="0 0 22 14" fill="none" aria-hidden="true">
          <path d="M21 8C15 8.5 9 8 3 6.5M3 6.5L7 2M3 6.5L8.5 10.5" />
        </svg>
        {{ text }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.margin-note {
  --ink: rgb(64 64 64);
  min-height: 2.6rem;
  margin-top: 0.25rem;
  color: var(--ink);
  font-size: 1.25rem;
  line-height: 1;
  pointer-events: none;
  user-select: none;
}

.dark .margin-note {
  --ink: rgb(212 212 212);
}

.margin-note[data-idle='true'] {
  opacity: 0.55;
}

.text {
  /* The paragraphs of the article set their own size and line height: the note keeps the ones of its box */
  margin: 0;
  font-size: inherit;
  line-height: inherit;
  width: fit-content;
  max-width: 100%;
  white-space: pre-line;
  text-wrap: balance;
  rotate: -2deg;
}

.mini {
  /* The reset of the site makes an svg a block */
  display: inline-block;
  width: 1.3em;
  height: 0.85em;
  margin-right: 0.15em;
  vertical-align: -0.05em;
  /* Under the figure it points up at it */
  rotate: 90deg;
}

.mini path {
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}

.note-enter-active {
  transition:
    opacity 160ms var(--ease-out),
    translate 160ms var(--ease-out);
}

.note-leave-active {
  transition: opacity 80ms var(--ease-out);
}

.note-enter-from {
  opacity: 0;
  translate: -4px 0;
}

.note-leave-to {
  opacity: 0;
}

/* A wide screen has margins: the note goes there, and the arrow points back at the figure */
@media (min-width: 1080px) {
  .margin-note {
    position: absolute;
    top: 50%;
    left: calc(100% + 40px);
    width: min(16rem, calc(50vw - 340px - 3.5rem));
    min-height: 0;
    margin: 0;
    translate: 0 -50%;
  }

  .margin-note[data-placed='true'] {
    translate: none;
  }

  .mini {
    rotate: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .note-enter-active,
  .note-leave-active {
    transition: none;
  }
}
</style>
