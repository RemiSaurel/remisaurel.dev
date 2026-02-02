<script setup lang="ts">
import { publications, type Publication } from '~/publications/publications';

const hasLink = (pub: Publication) => !!pub.url;

const formatAuthors = (authors: string[]) => {
  return authors.map((author, index) => {
    if (author === 'Rémi Saurel') {
      return { name: author, isMe: true };
    }
    return { name: author, isMe: false };
  });
};
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
      class="py-4 px-3 border-b border-neutral-200 dark:border-neutral-800 transition-all duration-300 ease-out"
      :class="{ 'hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer group': hasLink(pub) }"
    >
      <!-- Mobile: Stacked layout -->
      <div class="flex flex-col gap-2 md:hidden">
        <!-- Date + Venue row -->
        <div class="flex items-center justify-between">
          <span class="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums">{{ pub.date }}</span>
          <div class="flex items-center gap-2">
            <span class="text-xs py-0.5 px-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">{{ pub.venue }}</span>
            <svg 
              class="w-2.5 h-2.5 transition-all duration-300"
              :class="hasLink(pub) ? 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : 'opacity-0'"
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
        <!-- Title + Authors + Subtitle -->
        <div class="flex flex-col gap-1">
          <span class="font-medium leading-snug">{{ pub.title }}</span>
          <span class="text-xs text-neutral-500 dark:text-neutral-400">
            <template v-for="(author, index) in formatAuthors(pub.authors)" :key="author.name">
              <span :class="author.isMe ? 'font-medium text-neutral-700 dark:text-neutral-300' : ''">{{ author.name }}</span><span v-if="index < pub.authors.length - 1">, </span>
            </template>
          </span>
          <span v-if="pub.award" class="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
            {{ pub.award }}
          </span>
          <span v-if="pub.subtitle" class="text-sm text-neutral-500 dark:text-neutral-400">{{ pub.subtitle }}</span>
        </div>
      </div>

      <!-- Desktop: Grid layout -->
      <div class="hidden md:grid grid-cols-[60px_1fr_auto] gap-4 items-start">
        <span class="text-xs text-neutral-400 dark:text-neutral-500 tabular-nums pt-1">{{ pub.date }}</span>
        
        <div class="flex gap-4">
          <NuxtImg 
            v-if="pub.image" 
            :src="pub.image" 
            :alt="pub.title"
            class="w-28 h-18 object-cover rounded shrink-0 bg-neutral-100 dark:bg-neutral-800"
          />
          <div class="flex flex-col gap-1">
            <span class="font-medium leading-snug">{{ pub.title }}</span>
            <span class="text-xs text-neutral-500 dark:text-neutral-400">
              <template v-for="(author, index) in formatAuthors(pub.authors)" :key="author.name">
                <span :class="author.isMe ? 'font-medium text-neutral-700 dark:text-neutral-300' : ''">{{ author.name }}</span><span v-if="index < pub.authors.length - 1">, </span>
              </template>
            </span>
            <span v-if="pub.award" class="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              {{ pub.award }}
            </span>
            <span v-if="pub.subtitle" class="text-sm text-neutral-500 dark:text-neutral-400">{{ pub.subtitle }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <span class="text-xs py-0.5 px-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400">{{ pub.venue }}</span>
          <svg 
            class="w-2.5 h-2.5 transition-all duration-300"
            :class="hasLink(pub) ? 'opacity-30 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5' : 'opacity-0'"
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
