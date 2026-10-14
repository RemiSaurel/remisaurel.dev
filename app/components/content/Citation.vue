<script setup lang="ts">
interface CitationProps {
  // One id or several separated by commas: :citation{id="gasevic2015,siemens2012"}
  id: string
  // Narrative form: "Gašević et al. (2015)" instead of "(Gašević et al., 2015)"
  narrative?: boolean
}

const props = defineProps<CitationProps>()

const references = inject(REFERENCES_KEY, computed(() => []))

const cited = computed(() => props.id.split(',').map((id) => {
  const trimmed = id.trim()
  return { id: trimmed, ref: references.value.find(r => r.id === trimmed) }
}))
</script>

<template>
  <span class="whitespace-nowrap">
    <template v-if="!narrative">(</template>
    <template v-for="(c, i) in cited" :key="c.id">
      <template v-if="i > 0">; </template>
      <UTooltip v-if="c.ref" :text="c.ref.title">
        <a
          :href="`#ref-${c.id}`"
          class="text-zinc-500 underline decoration-zinc-300 decoration-dotted underline-offset-2 transition-colors duration-300 hover:text-blue-600 dark:text-zinc-400 dark:decoration-zinc-600 hover:decoration-blue-500 dark:hover:text-blue-300"
        >
          <template v-if="narrative">{{ citationAuthors(c.ref) }} ({{ c.ref.year }})</template>
          <template v-else>{{ citationAuthors(c.ref) }}, {{ c.ref.year }}</template>
        </a>
      </UTooltip>
      <span v-else class="text-red-500">?{{ c.id }}</span>
    </template>
    <template v-if="!narrative">)</template>
  </span>
</template>
