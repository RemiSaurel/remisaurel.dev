<script setup lang="ts">
interface Publication {
  date: string;
  title: string;
  subtitle?: string;
  venue: string;
  url?: string;
}

// Publications data
const publications: Publication[] = [
  {
    date: 'Dec. 2025',
    title: 'Mind the Gap: Benchmarking AI vs. Human in Automatic Short Answer Grading',
    subtitle: 'A benchmarking tool for AI systems to evaluate their performance on several configurations (model, prompts, architecture).',
    venue: 'LAK 2026',
    url: undefined // No link yet
  },
  {
    date: 'Sep. 2025',
    title: 'MAESTRO: Multi-Agent Educational System for Tutoring and Recommendation Orchestration',
    subtitle: 'A multi-agent system to provide teachers with AI-powered recommendations based on learning analytics.',
    venue: 'ECTEL 2025',
    url: 'https://hal.science/hal-05141354'
  },
  {
    date: 'Jun. 2025',
    title: 'Responsible Integration of Generative AI in Education: Proposal for a Strategic Action Plan Guided by Ethical Risk Considerations',
    subtitle: 'A strategic action plan for the responsible integration of generative AI in educational contexts, addressing ethical risks and challenges.',
    venue: 'EIAH 2025',
    url: 'https://hal.science/hal-05070808'
  },
];

const hasLink = (pub: Publication) => !!pub.url;
</script>

<template>
  <div class="flex flex-col">
    <component
      v-for="pub in publications"
      :key="pub.title"
      :is="hasLink(pub) ? 'a' : 'div'"
      :href="hasLink(pub) ? pub.url : undefined"
      :target="hasLink(pub) ? '_blank' : undefined"
      :rel="hasLink(pub) ? 'noopener noreferrer' : undefined"
      class="py-3 px-3 border-b border-neutral-200 dark:border-neutral-800"
      :class="{ 'hover:bg-neutral-50 dark:hover:bg-neutral-900 cursor-pointer group': hasLink(pub) }"
    >
      <!-- Mobile: Stacked layout -->
      <div class="flex flex-col gap-2 md:hidden">
        <!-- Date + Venue row -->
        <div class="flex items-center justify-between">
          <span class="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">{{ pub.date }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs py-0.5 px-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">{{ pub.venue }}</span>
            <svg 
              class="w-2.5 h-2.5"
              :class="hasLink(pub) ? 'opacity-30 group-hover:opacity-100' : 'opacity-0'"
              viewBox="0 0 11 11" 
              fill="none"
            >
              <path 
                d="M8.4778 3.06917L1.23404 10.3129L0 9.0789L7.24376 1.83513L0.456622 1.71166L0.440628 0L10.1366 0.176392L10.313 9.87231L8.60128 9.85632L8.4778 3.06917Z" 
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
        <!-- Title + Subtitle -->
        <div class="flex flex-col gap-1">
          <span class="font-medium leading-snug">{{ pub.title }}</span>
          <span v-if="pub.subtitle" class="text-sm text-neutral-500 dark:text-neutral-400">{{ pub.subtitle }}</span>
        </div>
      </div>

      <!-- Desktop: Grid layout -->
      <div class="hidden md:grid grid-cols-[70px_1fr_auto] gap-4 items-baseline">
        <span class="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">{{ pub.date }}</span>
        
        <div class="flex flex-col gap-1">
          <div class="flex items-baseline gap-1 flex-wrap">
            <span class="font-medium leading-snug">{{ pub.title }}</span>
            <span v-if="pub.subtitle" class="text-sm text-neutral-500 dark:text-neutral-400">{{ pub.subtitle }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs py-0.5 px-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">{{ pub.venue }}</span>
          <svg 
            class="w-2.5 h-2.5"
            :class="hasLink(pub) ? 'opacity-30 group-hover:opacity-100' : 'opacity-0'"
            viewBox="0 0 11 11" 
            fill="none"
          >
            <path 
              d="M8.4778 3.06917L1.23404 10.3129L0 9.0789L7.24376 1.83513L0.456622 1.71166L0.440628 0L10.1366 0.176392L10.313 9.87231L8.60128 9.85632L8.4778 3.06917Z" 
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </component>
  </div>
</template>
