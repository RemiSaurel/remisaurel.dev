<script setup lang="ts">
import type { Publication } from '~/publications/publications'

defineProps<{ publication: Publication }>()

function formatAuthors(authors: string[]) {
  return authors.map(name => ({ name, isMe: name === 'Rémi Saurel' }))
}

const PUB_IMAGE = {
  width: 320,
  height: 160,
  fit: 'cover',
  format: 'webp',
  densities: 'x1 x2',
} as const
</script>

<template>
  <component
    :is="publication.url ? 'a' : 'div'"
    :href="publication.url"
    :target="publication.url ? '_blank' : undefined"
    :rel="publication.url ? 'noopener noreferrer' : undefined"
    class="group flex items-start gap-4 rounded-xl px-2 py-2.5 -mx-2"
  >
    <span
      v-if="publication.art || publication.image"
      class="relative mt-0.5 h-10 w-20 shrink-0 overflow-hidden bg-neutral-100 dark:bg-neutral-800"
    >
      <template v-if="publication.art">
        <img :src="publication.art.light" alt="" class="object-cover size-full dark:hidden">
        <img :src="publication.art.dark" alt="" class="object-cover hidden size-full dark:block">
      </template>
      <NuxtImg v-else :src="publication.image" v-bind="PUB_IMAGE" alt="" class="object-cover size-full" />
    </span>

    <span class="min-w-0 flex flex-col gap-1">
      <span class="line-clamp-2 text-neutral-800 font-medium leading-snug transition-colors duration-150 dark:text-neutral-200 group-hover:text-neutral-950 dark:group-hover:text-white">
        {{ publication.title }}
      </span>
      <span class="text-xs text-neutral-500 dark:text-neutral-400">
        <template v-for="(author, authorIndex) in formatAuthors(publication.authors)" :key="author.name">
          <span :class="author.isMe ? 'font-medium text-neutral-700 dark:text-neutral-300' : ''">{{ author.name }}</span><span v-if="authorIndex < publication.authors.length - 1">, </span>
        </template>
      </span>
      <span class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <span class="whitespace-nowrap border border-neutral-300 px-1.5 py-0.5 text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">{{ publication.venue }}</span>
        <span v-if="publication.award" class="text-amber-700 font-medium dark:text-amber-400">{{ publication.award }}</span>
      </span>
    </span>

    <LinkArrow
      v-if="publication.url"
      class="ml-auto mt-1.5 h-2.5 w-2.5 shrink-0 opacity-30 transition-[opacity,transform] duration-150 ease-out group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:-translate-y-0.5"
    />
  </component>
</template>
