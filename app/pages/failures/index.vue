<script setup lang="ts">
import type { FailureType } from '~/failures/failures'
import { failures, TYPE_LABELS } from '~/failures/failures'

useSeoMeta({
  title: 'Failures',
  ogTitle: 'Failures · Rémi Saurel',
  description: 'The failure resume: rejected papers, failed experiments and abandoned projects, and what each one taught me.',
  ogImage: '/home.png',
  twitterCard: 'summary_large_image',
})

const sortedFailures = computed(() => {
  return failures.toSorted((a, b) => b.date.getTime() - a.date.getTime())
})

// Tally marks: four strokes, then a fifth one slashing through the group
const TALLY_GROUP_WIDTH = 34

const tally = computed(() => {
  return (Object.keys(TYPE_LABELS) as FailureType[]).map((type) => {
    const count = failures.filter(f => f.type === type).length
    const marks = Array.from({ length: count }, (_, i) => {
      const x = Math.floor(i / 5) * TALLY_GROUP_WIDTH
      if (i % 5 === 4)
        return `M${x - 1} 16 L${x + 26} 5`
      const mx = x + 3 + (i % 5) * 7
      return `M${mx} 2 Q${mx + 1.5} 10 ${mx - 0.5} 19`
    })
    // Fit the svg to the last drawn stroke: a full group ends with its slash
    const lastGroupSize = count % 5 || 5
    const width = lastGroupSize === 5
      ? Math.ceil(count / 5) * TALLY_GROUP_WIDTH - 6
      : Math.floor(count / 5) * TALLY_GROUP_WIDTH + lastGroupSize * 7 + 2
    return { type, label: TYPE_LABELS[type], count, marks, width: Math.max(width, 0) }
  })
})
</script>

<template>
  <div class="failures-root flex flex-col gap-8">
    <header class="enter">
      <h1 class="relative m-0 w-fit text-2xl font-semibold">
        Failures
        <span class="font-hand pointer-events-none absolute rotate-[-8deg] select-none whitespace-nowrap text-xl text-[rgb(var(--failure-ink))] font-700 leading-none -right-15 -top-3" aria-hidden="true">so far</span>
      </h1>
      <p class="mt-2 max-w-2xl text-neutral-500 dark:text-neutral-400">
        CVs only show what worked. This is the rest: papers that got rejected,
        experiments that went nowhere, projects I quietly shelved, each one
        marked up with what it taught me.
      </p>

      <ul class="list-none m-0 mt-6 flex flex-wrap gap-x-8 gap-y-3 p-0">
        <li v-for="t in tally" :key="t.type" class="flex items-center gap-3">
          <span class="section-title text-neutral-500 dark:text-neutral-400">{{ t.label }}</span>
          <svg
            :width="t.width"
            height="21"
            :viewBox="`0 0 ${t.width} 21`"
            fill="none"
            class="text-[rgb(var(--failure-ink))]"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path v-for="(d, i) in t.marks" :key="i" :d="d" />
          </svg>
          <span class="sr-only">{{ t.count }}</span>
        </li>
      </ul>
    </header>

    <ol class="list-none m-0 flex flex-col p-0">
      <FailureEntry
        v-for="(failure, index) in sortedFailures"
        :key="failure.id"
        :failure="failure"
        :index="index"
      />
    </ol>
  </div>
</template>
