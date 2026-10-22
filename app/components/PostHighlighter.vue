<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
import { DEFAULT_HIGHLIGHT_COLOR, isHexColor } from '~/utils/highlights'

interface PostHighlighterProps {
  // The element holding the prose that can be highlighted
  root: HTMLElement | null
  // Highlights are saved per key (the post's path)
  storageKey: string
}

const props = defineProps<PostHighlighterProps>()

const highlights = useHighlights(() => props.root, () => props.storageKey)
const { target, rect, dismiss } = useHighlightTarget(() => props.root, highlights)

// The colour used for the next highlight, shared by every post
const storedColor = useLocalStorage('highlight-color', DEFAULT_HIGHLIGHT_COLOR, { initOnMounted: true })
const color = computed(() => isHexColor(storedColor.value) ? storedColor.value : DEFAULT_HIGHLIGHT_COLOR)

const existingColor = computed(() => {
  const id = target.value?.id
  return highlights.quotes.value.find(quote => quote.id === id)?.color
})

function onPick(picked: string) {
  storedColor.value = picked
  if (target.value?.id)
    highlights.recolor(target.value.id, picked)
}

function onApply() {
  if (!target.value)
    return
  highlights.add(target.value.range, color.value)
  document.getSelection()?.removeAllRanges()
  dismiss()
}

function onRemove() {
  if (!target.value?.id)
    return
  highlights.remove(target.value.id)
  dismiss()
}
</script>

<template>
  <HighlightToolbar
    v-if="highlights.supported.value && target && rect"
    :key="target.id ?? 'selection'"
    :rect="rect"
    :color="existingColor ?? color"
    :existing="!!target.id"
    @apply="onApply"
    @pick="onPick"
    @remove="onRemove"
  />
</template>
