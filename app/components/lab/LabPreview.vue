<script setup lang="ts">
import type { ArtTheme } from '~/art/art'

const { composition } = injectLabEditor()

// One tile per site theme: the illustration in the two places it ships, on the right page color
const THEMES: { theme: ArtTheme, label: string }[] = [
  { theme: 'light', label: 'Light site' },
  { theme: 'dark', label: 'Dark site' },
]

const tiles = useTemplateRef<HTMLElement[]>('tiles')

/** The card's svg, with literal colors baked in: what the exports are made from. */
function svgMarkup(theme: ArtTheme) {
  const index = THEMES.findIndex(item => item.theme === theme)
  return tiles.value?.[index]?.querySelector('[data-export] svg')?.outerHTML ?? null
}

defineExpose({ svgMarkup })
</script>

<template>
  <!-- One row: centered when it fits, scrolls sideways when it doesn't (never pushes the canvas) -->
  <div class="lab-tiles flex gap-3 overflow-x-auto">
    <div
      v-for="{ theme, label } in THEMES"
      ref="tiles"
      :key="theme"
      class="lab-tile flex shrink-0 flex-col gap-3 p-3"
      :class="`is-${theme}`"
    >
      <span class="lab-tile-label">{{ label }}</span>

      <div class="flex items-start gap-4">
        <!-- Publications list row, at its real size -->
        <figure class="m-0 flex flex-col gap-2">
          <div class="flex items-start gap-3">
            <div class="lab-thumb shrink-0">
              <PubArt :composition="composition" :theme="theme" class="h-14 w-28" />
            </div>
            <div class="w-16 flex flex-col gap-1.5 pt-0.5" aria-hidden="true">
              <span class="lab-bar is-strong w-full" />
              <span class="lab-bar w-3/4" />
              <span class="lab-bar w-1/2" />
            </div>
          </div>
          <figcaption class="lab-tile-caption">
            List
          </figcaption>
        </figure>

        <!-- Publications card, scaled down -->
        <figure class="m-0 w-36 flex flex-col gap-2">
          <div class="lab-thumb" data-export>
            <PubArt :composition="composition" :theme="theme" class="aspect-[2/1] w-full" />
          </div>
          <div class="flex flex-col gap-1.5" aria-hidden="true">
            <span class="lab-bar is-strong w-11/12" />
            <span class="lab-bar w-2/3" />
          </div>
          <figcaption class="lab-tile-caption">
            Card
          </figcaption>
        </figure>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* `safe` keeps the first tile reachable when the row overflows */
.lab-tiles {
  justify-content: safe center;
}

/* Each tile paints its own site background, whatever theme the lab itself is in */
.lab-tile {
  --tile-bg: #fff;
  --tile-border: #e5e5e5;
  --tile-muted: #737373;
  --tile-bar: #e5e5e5;
  --tile-bar-strong: #d4d4d4;
  --tile-edge: rgb(0 0 0 / 0.1);
  background: var(--tile-bg);
  box-shadow: inset 0 0 0 1px var(--tile-border);
}

.lab-tile.is-dark {
  --tile-bg: #171717;
  --tile-border: #262626;
  --tile-muted: #a3a3a3;
  --tile-bar: #262626;
  --tile-bar-strong: #404040;
  --tile-edge: rgb(255 255 255 / 0.1);
}

.lab-tile-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--tile-muted);
}

.lab-tile-caption {
  font-size: 11px;
  font-style: normal;
  /* The site centers figcaptions; here they label the left edge of what's above */
  text-align: left;
  color: var(--tile-muted);
}

/* Text stand-ins: the eye reads "title, authors" without real copy competing with the art */
.lab-bar {
  display: block;
  height: 5px;
  background: var(--tile-bar);
}

.lab-bar.is-strong {
  background: var(--tile-bar-strong);
}

/* Faint inner edge, so a light image doesn't dissolve into a light page (and vice versa) */
.lab-thumb {
  position: relative;
}

.lab-thumb::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  outline: 1px solid var(--tile-edge);
  outline-offset: -1px;
}
</style>
