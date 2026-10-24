<script setup lang="ts">
import { MENTION_TRIGGERS, parsePrompt } from '~/utils/mentions'

// A prompt as the backend receives it, with its tagged names marked: as the tags themselves, or, as the
// teacher sees them in the input, behind their trigger (`@Jean Martin`)
defineProps<{
  text: string
  triggers?: boolean
}>()
</script>

<template>
  <span class="tagged">
    <template v-for="(part, index) in parsePrompt(text)" :key="index">
      <span
        v-if="part.kind"
        class="[box-decoration-break:clone] rounded-[4px] px-0.5 py-px transition-[background-color] duration-200 ease-[var(--ease-out)] data-[kind=learner]:bg-[rgb(var(--learner)/0.14)] data-[kind=subject]:bg-[rgb(var(--subject)/0.18)] [@media(prefers-reduced-motion:reduce)]:transition-none"
        :data-kind="part.kind"
      >
        <template v-if="triggers">{{ MENTION_TRIGGERS[part.kind] }}{{ part.text }}</template>
        <template v-else><span class="text-[#5a5a5a] dark:text-neutral-400">&lt;{{ part.kind }} id="{{ part.id }}"&gt;</span>{{ part.text }}<span class="text-[#5a5a5a] dark:text-neutral-400">&lt;/{{ part.kind }}&gt;</span></template>
      </span>
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<style scoped>
.tagged {
  --learner: 59 130 246;
  --subject: 245 158 11;
}
</style>
