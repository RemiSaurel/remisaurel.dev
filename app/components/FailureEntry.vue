<script setup lang="ts">
import type { Failure } from '~/failures/failures'
import { motion } from 'motion-v'
import { TYPE_LABELS } from '~/failures/failures'

const props = defineProps<{
  failure: Failure
  index: number
}>()

const { prefersReducedMotion } = usePrefersReducedMotion()

const MONTH_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short' })

// Pressed by hand: every stamp and note lands at its own slight angle
const STAMP_ANGLES = [-4, 2.5, -2, 3.5, -3]
const NOTE_ANGLES = [-1.5, 1, -0.5, 1.5]

const stampAngle = computed(() => STAMP_ANGLES[props.index % STAMP_ANGLES.length])
const noteAngle = computed(() => NOTE_ANGLES[props.index % NOTE_ANGLES.length])

// The red pen goes over each entry in order: cross out, stamp, then scribble the lesson
const baseDelay = computed(() => 0.1 + props.index * 0.12)

function ink(from: Record<string, unknown>, to: Record<string, unknown>, delay: number, duration = 0.35) {
  if (prefersReducedMotion.value)
    return { initial: to, whileInView: to, transition: { duration: 0 } }
  return { initial: from, whileInView: to, transition: { duration, delay: baseDelay.value + delay, ease: EASE_OUT } }
}
</script>

<template>
  <motion.li
    class="grid grid-cols-1 gap-3 border-0 border-t border-neutral-200 border-solid py-7 md:grid-cols-[112px_minmax(0,1fr)_minmax(0,17rem)] md:gap-10 dark:border-neutral-800"
    v-bind="ink({ opacity: 0, y: 8 }, { opacity: 1, y: 0 }, 0, 0.4)"
    :viewport="{ once: true, margin: '-40px' }"
  >
    <div class="flex items-center justify-between md:flex-col md:items-start md:justify-start md:gap-5">
      <time
        :datetime="failure.date.toISOString().slice(0, 7)"
        class="tabular-nums whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400"
      >
        {{ MONTH_FORMAT.format(failure.date) }}
        <span class="text-neutral-600 font-medium dark:text-neutral-300">{{ failure.date.getFullYear() }}</span>
      </time>
      <span class="inline-block" :style="{ rotate: `${stampAngle}deg` }">
        <motion.span
          class="failure-stamp"
          v-bind="ink({ opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1 }, 0.55, 0.2)"
          :viewport="{ once: true }"
        >
          {{ TYPE_LABELS[failure.type] }}
        </motion.span>
      </span>
    </div>

    <div class="flex flex-col gap-1.5">
      <h3 class="m-0 text-base font-semibold leading-snug">
        <motion.span
          class="failure-strike"
          v-bind="ink({ backgroundSize: '0% 2px' }, { backgroundSize: '100% 2px' }, 0.2, 0.6)"
          :viewport="{ once: true }"
        >
          {{ failure.title }}
        </motion.span>
      </h3>
      <p class="m-0 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
        {{ failure.description }}
      </p>
      <a
        v-if="failure.url"
        :href="failure.url"
        target="_blank"
        rel="noopener noreferrer"
        class="intro-link mt-1 w-fit pressable text-xs text-neutral-500 dark:text-neutral-400"
      >
        {{ failure.url.replace(/^https?:\/\//, '') }}
      </a>
    </div>

    <motion.p
      class="font-note relative m-0 pl-6 text-[1.12rem] text-[rgb(var(--failure-ink))] leading-[1.45] md:pl-0 md:pt-1"
      :style="{ rotate: `${noteAngle}deg` }"
      v-bind="ink({ opacity: 0 }, { opacity: 1 }, 0.75, 0.4)"
      :viewport="{ once: true }"
    >
      <!-- Hand-drawn arrow pointing back at the entry it annotates -->
      <svg
        class="absolute left-0 top-1 size-5 md:top-2 md:size-6 md:-left-8"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M20 19c-6 0-12-3-14.5-13" />
        <path d="M2.5 9 5.5 5 9 8" />
      </svg>
      <span class="sr-only">What I learned: </span>{{ failure.lesson }}
    </motion.p>
  </motion.li>
</template>
