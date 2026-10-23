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
      <span v-if="part.kind" class="tag" :data-kind="part.kind">
        <template v-if="triggers">{{ MENTION_TRIGGERS[part.kind] }}{{ part.text }}</template>
        <template v-else><span class="angle">&lt;{{ part.kind }} id="{{ part.id }}"&gt;</span>{{ part.text }}<span class="angle">&lt;/{{ part.kind }}&gt;</span></template>
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

.angle {
  color: rgb(90 90 90);
}

:global(.dark) .angle {
  color: rgb(163 163 163);
}

.tag {
  padding: 1px 2px;
  border-radius: 4px;
  box-decoration-break: clone;
  transition: background-color 200ms var(--ease-out);
}

@media (prefers-reduced-motion: reduce) {
  .tag {
    transition: none;
  }
}

.tag[data-kind='learner'] {
  background: rgb(var(--learner) / 0.14);
}

.tag[data-kind='subject'] {
  background: rgb(var(--subject) / 0.18);
}
</style>
