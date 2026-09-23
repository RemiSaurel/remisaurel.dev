<script setup lang="ts">
import type { ListView } from '~/composables/useListView'
import type { Publication } from '~/publications/publications'
import { motion } from 'motion-v'
import { useFirstVisit } from '~/composables/useFirstVisit'
import { VIEW_MORPH_TRANSITION } from '~/composables/useListView'
import { publications } from '~/publications/publications'

interface Props {
  view?: ListView
  /** Swap layouts without morphing (used when restoring the saved view on load). */
  instant?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  view: 'list',
  instant: false,
})

const hasLink = (pub: Publication) => !!pub.url

function formatAuthors(authors: string[]) {
  return authors.map(name => ({ name, isMe: name === 'Rémi Saurel' }))
}

const { prefersReducedMotion } = usePrefersReducedMotion()
const { isFirstVisit } = useFirstVisit()

// Text only blurs in on view switches, never on the first render.
const hasEntered = ref(false)
onMounted(() => {
  hasEntered.value = true
})

// CSS `.enter` stagger, so the rows show up before hydration instead of waiting on motion.
// Switching views re-creates the rows, so the entrance is dropped before that re-render.
const playEntrance = ref(isFirstVisit.value)
watch(() => props.view, () => {
  playEntrance.value = false
})

function itemEnter(index: number) {
  return {
    class: playEntrance.value && 'enter',
    style: { '--enter-delay': `${Math.min(index, 7) * 0.04}s` },
  }
}

const isInstant = computed(() => props.instant || prefersReducedMotion.value)

/**
 * Only the image travels between views: it is the visual anchor, and it keeps the same
 * 2:1 ratio in both, so it never stretches. A tiny per-item offset makes the grid cascade.
 */
function morph(index: number) {
  if (isInstant.value)
    return { duration: 0 }
  return { ...VIEW_MORPH_TRANSITION, delay: Math.min(index, 5) * 0.025 }
}

/**
 * Text never travels: it would re-wrap to its new width mid-flight and cross other lines.
 * It appears already in place, un-blurring while the images land, so the eye reads one
 * continuous change instead of two layouts swapping.
 */
function reveal(index: number) {
  if (isInstant.value || !hasEntered.value)
    return { initial: false as const, transition: { duration: 0 } }
  return {
    initial: { opacity: 0, filter: 'blur(6px)' },
    transition: { duration: 0.35, delay: 0.1 + Math.min(index, 5) * 0.025, ease: EASE_OUT },
  }
}

const REVEALED = { opacity: 1, filter: 'blur(0px)' }

/**
 * One variant per paper, shared by both views: the card view is never prerendered (the
 * saved view is applied after mount), so it can only reuse URLs the list view generated.
 * Cropped to the 2:1 frame both views display, wide enough for a card on a 2x screen.
 */
const PUB_IMAGE = {
  width: 640,
  height: 320,
  fit: 'cover',
  format: 'webp',
  densities: 'x1',
} as const
</script>

<template>
  <!-- List view -->
  <div v-if="props.view === 'list'" class="flex flex-col gap-1">
    <div
      v-for="(pub, index) in publications"
      :key="pub.id"
      v-bind="itemEnter(index)"
      class="[--enter-duration:0.4s] [--enter-ease:var(--ease-out)] [--enter-y:10px]"
    >
      <component
        :is="hasLink(pub) ? 'a' : 'div'"
        :href="hasLink(pub) ? pub.url : undefined"
        :target="hasLink(pub) ? '_blank' : undefined"
        :rel="hasLink(pub) ? 'noopener noreferrer' : undefined"
        class="pub-row px-3 py-4 transition-colors duration-300 ease-out"
        :class="{ 'hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer group': hasLink(pub) }"
      >
        <motion.span
          :initial="reveal(index).initial"
          :animate="REVEALED"
          :transition="reveal(index).transition"
          class="[grid-area:date] w-fit md:pt-1"
        >
          <ListDate :date="pub.date" :show-year="isFirstOfYear(publications, index, item => item.date)" />
        </motion.span>

        <div class="[grid-area:body] flex gap-3 md:gap-4">
          <motion.div
            v-if="pub.image"
            :layout-id="`pub-image-${pub.id}`"
            :transition="morph(index)"
            class="relative z-1 h-10 w-20 shrink-0 overflow-hidden bg-neutral-100 md:h-14 md:w-28 dark:bg-neutral-800"
          >
            <NuxtImg :src="pub.image" v-bind="PUB_IMAGE" alt="" class="pub-image object-cover size-full" />
          </motion.div>
          <motion.div
            :initial="reveal(index).initial"
            :animate="REVEALED"
            :transition="reveal(index).transition"
            class="min-w-0 flex flex-col gap-1"
          >
            <span class="font-medium leading-snug">{{ pub.title }}</span>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              <template v-for="(author, authorIndex) in formatAuthors(pub.authors)" :key="author.name">
                <span :class="author.isMe ? 'font-medium text-neutral-700 dark:text-neutral-300' : ''">{{ author.name }}</span><span v-if="authorIndex < pub.authors.length - 1">, </span>
              </template>
            </span>
            <span v-if="pub.award" class="w-fit text-xs text-amber-700 font-medium dark:text-amber-400">{{ pub.award }}</span>
            <span v-if="pub.subtitle" class="text-sm text-neutral-500 dark:text-neutral-400">{{ pub.subtitle }}</span>
          </motion.div>
        </div>

        <motion.div
          :initial="reveal(index).initial"
          :animate="REVEALED"
          :transition="reveal(index).transition"
          class="[grid-area:venue] flex items-center justify-end gap-2"
        >
          <span class="whitespace-nowrap border border-neutral-300 px-1.5 py-0.5 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">{{ pub.venue }}</span>
          <LinkArrow
            class="h-2.5 w-2.5 transition-[opacity,transform] duration-300 ease-out"
            :class="hasLink(pub) ? 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : 'opacity-0'"
          />
        </motion.div>
      </component>
    </div>
  </div>

  <!-- Card view -->
  <div v-else class="grid grid-cols-1 gap-x-5 gap-y-8 pt-2 sm:grid-cols-2">
    <component
      :is="hasLink(pub) ? 'a' : 'div'"
      v-for="(pub, index) in publications"
      :key="pub.id"
      :href="hasLink(pub) ? pub.url : undefined"
      :target="hasLink(pub) ? '_blank' : undefined"
      :rel="hasLink(pub) ? 'noopener noreferrer' : undefined"
      class="flex flex-col gap-3"
      :class="{ 'cursor-pointer group pressable': hasLink(pub) }"
    >
      <motion.div
        v-if="pub.image"
        :layout-id="`pub-image-${pub.id}`"
        :transition="morph(index)"
        class="relative z-1 aspect-[2/1] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800"
      >
        <NuxtImg :src="pub.image" v-bind="PUB_IMAGE" alt="" class="pub-image object-cover size-full" />
        <!-- Link affordance sits inside the image, so it never pushes past the card edge -->
        <span
          v-if="hasLink(pub)"
          class="pub-link-badge absolute right-2 top-2 size-6 flex items-center justify-center bg-white/90 text-neutral-900 dark:bg-neutral-900/90 dark:text-neutral-100"
          aria-hidden="true"
        >
          <LinkArrow class="h-2.5 w-2.5" />
        </span>
      </motion.div>

      <motion.div
        :initial="reveal(index).initial"
        :animate="REVEALED"
        :transition="reveal(index).transition"
        class="flex flex-col gap-1.5"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="tabular-nums text-xs text-neutral-500 dark:text-neutral-400">{{ formatDate(pub.date) }}</span>
          <span class="whitespace-nowrap border border-neutral-300 px-1.5 py-0.5 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">{{ pub.venue }}</span>
        </div>
        <span class="line-clamp-3 font-medium leading-snug">{{ pub.title }}</span>
        <span v-if="pub.award" class="w-fit text-xs text-amber-700 font-medium dark:text-amber-400">{{ pub.award }}</span>
        <span v-if="pub.subtitle" class="line-clamp-3 text-sm text-neutral-500 dark:text-neutral-400">{{ pub.subtitle }}</span>
      </motion.div>
    </component>
  </div>
</template>

<style scoped>
/* One DOM for both breakpoints (shared layoutIds must be unique), laid out with areas. */
.pub-row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    'date venue'
    'body body';
  gap: 0.5rem 1rem;
}

@media (min-width: 768px) {
  .pub-row {
    grid-template-columns: 56px 1fr auto;
    grid-template-areas: 'date body venue';
    align-items: start;
  }
}

/* Hover zoom lives on the inner <img>: the wrapper's transform belongs to the layout morph. */
.pub-image {
  transition: transform 400ms var(--ease-out);
}

.pub-link-badge {
  transition:
    opacity 200ms var(--ease-out),
    transform 200ms var(--ease-out);
}

@media (hover: hover) and (pointer: fine) {
  .group:hover .pub-image {
    transform: scale(1.03);
  }

  /* Pointer users get the badge on hover; touch users keep it visible as the only link cue. */
  .pub-link-badge {
    opacity: 0;
    transform: translate(-2px, 2px);
  }

  .group:hover .pub-link-badge {
    opacity: 1;
    transform: translate(0, 0);
  }
}
</style>
