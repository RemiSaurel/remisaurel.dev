<script setup lang="ts">
const props = defineProps<{
  references: Reference[]
}>()

const sorted = computed(() => [...props.references].sort((a, b) =>
  (a.authors[0] ?? '').localeCompare(b.authors[0] ?? '') || a.year - b.year,
))
</script>

<template>
  <section class="mt-16 border-t border-zinc-200 pt-6 dark:border-zinc-800">
    <h2 id="references" class="mb-4 text-xl">
      References
    </h2>
    <ol class="flex flex-col gap-3 pl-0 text-sm text-zinc-600 dark:text-zinc-400">
      <li
        v-for="ref in sorted"
        :id="`ref-${ref.id}`"
        :key="ref.id"
        class="reference list-none rounded-md pl-6 -indent-6"
      >
        {{ fullAuthors(ref) }} ({{ ref.year }}). {{ ref.title }}.
        <em v-if="ref.venue">{{ ref.venue }}.</em>
        <a
          v-if="ref.url"
          :href="ref.url"
          target="_blank"
          class="break-all underline decoration-zinc-400 underline-offset-2 transition-colors duration-300 hover:text-blue-600 dark:decoration-zinc-500 dark:hover:text-blue-300"
        >{{ ref.url }}</a>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.reference {
  scroll-margin-top: 6rem;
  transition: background-color 0.6s ease;
}

/* Brief highlight when jumping to a reference from a citation */
.reference:target {
  background-color: rgb(59 130 246 / 0.1);
}
</style>
