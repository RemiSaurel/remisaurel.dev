<script setup lang="ts">
import type { Failure } from '~/failures/failures'
import { motion } from 'motion-v'
import { TYPE_LABELS } from '~/failures/failures'

defineProps<{
  failure: Failure
}>()

const { prefersReducedMotion } = usePrefersReducedMotion()

const flipped = ref(false)

function toggle() {
  flipped.value = !flipped.value
}

const targetRotateY = computed(() => flipped.value ? 180 : 0)

const flipTransition = computed(() => {
  if (prefersReducedMotion.value)
    return { duration: 0 }
  return { type: 'spring' as const, duration: 0.5, bounce: 0.2 }
})
</script>

<template>
  <div class="h-full min-h-[190px] perspective-[1600px]">
    <button
      type="button"
      class="group block h-full w-full pressable cursor-pointer text-left focus-visible:outline-[2px] focus-visible:outline-[rgb(var(--failure-ink))] focus-visible:outline-offset-[3px] focus-visible:outline-solid"
      :aria-pressed="flipped"
      :aria-label="`${failure.title} — ${flipped ? 'hide' : 'show'} what I learned`"
      @click="toggle"
    >
      <motion.div
        class="relative h-full preserve-3d"
        :animate="{ rotateY: targetRotateY }"
        :transition="flipTransition"
      >
        <div class="[-webkit-backface-visibility:hidden] backface-hidden h-full flex flex-col gap-2 border-[1.5px] border-transparent border-solid bg-neutral-100/60 px-4 pb-3 pt-4 transition-colors duration-200 ease-[ease] group-focus-visible:border-[rgb(var(--failure-ink)/0.35)] group-hover:border-[rgb(var(--failure-ink)/0.35)] dark:bg-neutral-800/60 group-focus-visible:bg-[rgb(var(--failure-ink)/0.06)] group-hover:bg-[rgb(var(--failure-ink)/0.06)]">
          <div class="flex items-start justify-between gap-3">
            <span class="uppercase inline-block whitespace-nowrap border-[1.5px] border-[rgb(var(--failure-ink))] border-solid px-[0.55rem] py-[0.2rem] text-[0.65rem] text-[rgb(var(--failure-ink))] font-600 tracking-[0.08em]">{{ TYPE_LABELS[failure.type] }}</span>
            <span class="tabular-nums text-xs text-neutral-400 dark:text-neutral-500">{{ formatDate(failure.date) }}</span>
          </div>
          <span class="font-semibold leading-snug">{{ failure.title }}</span>
          <p class="m-0 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
            {{ failure.description }}
          </p>
          <a
            v-if="failure.url"
            :href="failure.url"
            target="_blank"
            rel="noopener noreferrer"
            class="intro-link w-fit pressable text-xs text-neutral-500 dark:text-neutral-400"
            @click.stop
          >
            {{ failure.url.replace(/^https?:\/\//, '') }}
          </a>
          <span class="mt-auto flex items-center gap-1 pt-2 text-xs text-neutral-400 dark:text-neutral-500">
            Tap to see what I learned
            <Icon name="lucide:rotate-cw" class="size-3 transition-transform duration-200 ease-[var(--ease-in-out)] group-hover:rotate-[75deg]" />
          </span>
        </div>

        <div class="[-webkit-backface-visibility:hidden] backface-hidden absolute inset-0 h-full flex flex-col rotate-y-[180deg] gap-2 border-[1.5px] border-transparent border-solid bg-neutral-100/60 px-4 pb-3 pt-4 transition-colors duration-200 ease-[ease] group-focus-visible:border-[rgb(var(--failure-ink)/0.35)] group-hover:border-[rgb(var(--failure-ink)/0.35)] dark:bg-neutral-800/60 group-focus-visible:bg-[rgb(var(--failure-ink)/0.06)] group-hover:bg-[rgb(var(--failure-ink)/0.06)]">
          <div class="flex items-start justify-between gap-3">
            <span class="uppercase inline-block text-[0.68rem] text-[rgb(var(--failure-ink))] font-600 tracking-[0.1em]">Lesson</span>
            <span class="tabular-nums text-xs text-neutral-400 dark:text-neutral-500">{{ formatDate(failure.date) }}</span>
          </div>
          <span class="text-sm text-neutral-400 leading-snug dark:text-neutral-500">{{ failure.title }}</span>
          <p class="m-0 text-sm leading-relaxed">
            {{ failure.lesson }}
          </p>
          <span class="mt-auto flex items-center gap-1 pt-2 text-xs text-neutral-400 dark:text-neutral-500">
            <Icon name="lucide:rotate-ccw" class="size-3" />
            Back
          </span>
        </div>
      </motion.div>
    </button>
  </div>
</template>
