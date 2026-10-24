<script setup lang="ts">
import type { LogLine } from '~/utils/logLine'
import { mmss } from '~/utils/trace'

// One line of the teacher's log. The log makes them buttons that move the recording; the pages that explain
// the log draw the same line as plain text, and can light one of its cells.
const props = withDefaults(defineProps<{
  line: LogLine
  /** Before, at or after the moment of the recording that is shown */
  state?: 'past' | 'current' | 'future'
  /** A line that gathers acts and is unfolded: the highlight goes to the act inside it */
  open?: boolean
  /** One of the acts of an unfolded line: a little tighter */
  compact?: boolean
  /** Text, not a button */
  plain?: boolean
  /** The cell to light, the others fade */
  lit?: string | null
}>(), { state: 'past' })

const delta = (n: number) => n > 0 ? `+${n}` : n < 0 ? `${n}` : '0'

const mark = (cell: string) => props.lit ? (props.lit === cell ? 'on' : 'off') : undefined
</script>

<template>
  <component
    :is="plain ? 'div' : 'button'"
    :type="plain ? undefined : 'button'"
    class="entry"
    :data-state="state"
    :data-current="state === 'current'"
    :data-open="open"
    :data-compact="compact"
    :data-plain="plain"
  >
    <span class="tabular-nums entry-time" data-cell="time" :data-mark="mark('time')">{{ mmss(line.from) }}</span>
    <span class="key" :data-kind="line.kind" data-cell="kind" :data-mark="mark('kind')" aria-hidden="true" />
    <span class="entry-what" data-cell="what" :data-mark="mark('what')">{{ line.detail.what }}</span>
    <span class="entry-body">
      <span v-if="line.detail.name" class="entry-name">
        <span v-if="line.detail.from" class="entry-from" data-cell="from" :data-mark="mark('from')">{{ line.detail.from }}</span>
        <span class="entry-to">
          <Icon v-if="line.detail.from" name="lucide:arrow-right" class="entry-arrow size-3 shrink-0" aria-hidden="true" />
          <span data-cell="name" :data-mark="mark('name')">{{ line.detail.name }}</span>
        </span>
      </span>
      <span v-if="line.detail.meta" class="entry-meta tabular-nums" data-cell="figure" :data-mark="mark('figure')">{{ line.detail.meta }}</span>
      <span v-if="line.part !== undefined" class="entry-part" :data-matched="line.part !== null" data-cell="part" :data-mark="mark('part')">
        <template v-if="line.part !== null">
          <Icon name="lucide:circle-check" class="size-3.5 shrink-0" aria-hidden="true" />
          {{ line.part }}
        </template>
        <template v-else>No part</template>
      </span>
      <template v-if="line.check">
        <span v-if="line.check.delta !== null" class="delta tabular-nums" :data-sign="Math.sign(line.check.delta)" data-cell="delta" :data-mark="mark('delta')">{{ delta(line.check.delta) }}</span>
        <span v-if="line.check.onlyRenames" class="flag" data-cell="flag" :data-mark="mark('flag')" title="Nothing was drawn or added since the check before, only names changed. The count may have been guessed.">Only renames</span>
      </template>
    </span>
    <span v-if="line.check" class="since" data-cell="since" :data-mark="mark('since')">
      <span>Since {{ line.check.from }}</span>
      <span v-for="item in line.check.done" :key="item.noun" class="done" :data-kind="item.kind"><b class="tabular-nums">{{ item.count }}</b> {{ item.noun }}</span>
      <span v-if="!line.check.done.length" class="done-none">nothing</span>
    </span>
  </component>
</template>

<style scoped>
.entry {
  display: grid;
  flex: 1;
  min-width: 0;
  grid-template-columns: 2.25rem 3px 5.5rem minmax(0, 1fr);
  align-items: start;
  gap: 0 8px;
  padding: 6px 6px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
  text-align: left;
  transition:
    opacity 120ms var(--ease-out),
    background-color 120ms var(--ease-out);
}

.entry[data-compact='true'] {
  font-size: 12px;
  line-height: 1.3;
}

.entry:focus-visible {
  outline: 2px solid rgb(23 23 23);
  outline-offset: -2px;
}

.dark .entry:focus-visible {
  outline-color: rgb(245 245 245);
}

/* The mark of the kind of act runs the height of the row, however many lines it takes */
.key {
  position: relative;
  align-self: stretch;
  width: 3px;
  min-height: 14px;
  flex-shrink: 0;
  border-radius: 1px;
  background: var(--kind);
}

/* A bar of 3px is hard to point at: its target reaches into the gaps on both sides, and no further */
.key::before {
  content: '';
  position: absolute;
  inset: -4px -5px;
}

.entry[data-compact='true'] .key {
  min-height: 11px;
}

[data-kind='draw'] {
  --kind: rgb(115 115 115);
}

[data-kind='label'] {
  --kind: rgb(59 130 246);
}

[data-kind='undo'] {
  --kind: rgb(244 63 94);
}

[data-kind='check'] {
  --kind: rgb(16 185 129);
}

.entry-what {
  color: rgb(82 82 82);
}

.dark .entry-what {
  color: rgb(212 212 212);
}

/* The name, the figure and the part: one line while they fit, then they wrap as whole pieces */
.entry-body {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 8px;
  min-width: 0;
}

/* A rename is two names: each wraps as a whole piece, and the arrow stays with the new one */
.entry-name {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 6px;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: break-word;
  font-weight: 500;
}

.entry-to {
  display: inline-flex;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.entry-arrow {
  margin-top: 0.28em;
}

.entry-from {
  font-weight: 400;
  text-decoration: line-through;
  text-decoration-color: rgb(163 163 163);
  color: rgb(115 115 115);
}

.dark .entry-from {
  color: rgb(163 163 163);
}

.entry-meta,
.entry-time,
.since {
  color: rgb(115 115 115);
}

.dark .entry-meta,
.dark .entry-time,
.dark .since {
  color: rgb(163 163 163);
}

/* Which part a name gives its label to: the match is the matcher's, so a miss says so */
.entry-part {
  display: inline-flex;
  align-items: center;
  /* Its icon has no text baseline: aligned on baselines it would push the name below the act */
  align-self: center;
  gap: 4px;
  margin-left: auto;
  font-size: 12px;
  font-weight: 400;
  color: rgb(115 115 115);
}

.entry-part[data-matched='true'] {
  color: rgb(5 150 105);
}

.dark .entry-part {
  color: rgb(163 163 163);
}

.dark .entry-part[data-matched='true'] {
  color: rgb(52 211 153);
}

.delta {
  font-size: 12px;
  color: rgb(115 115 115);
}

.delta[data-sign='1'] {
  color: rgb(5 150 105);
}

.dark .delta[data-sign='1'] {
  color: rgb(52 211 153);
}

/* Shorter than a line of text: a taller pill would stretch the row, and the bar of the kind with it */
.flag {
  padding: 1px 8px;
  line-height: 1.25;
  border-radius: 9999px;
  background: rgb(245 158 11 / 0.16);
  color: rgb(146 64 14);
  font-size: 12px;
  white-space: nowrap;
}

.dark .flag {
  color: rgb(252 211 77);
}

/* A check has a second line, with what the learner did before asking */
.since {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  grid-column: 3 / -1;
  gap: 4px 6px;
  margin-top: 3px;
  font-size: 12px;
  font-weight: 400;
}

/* One kind of act done since the check before, with the colour of its mark in the log */
.done,
.done-none {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 8px 1px 6px;
  border-radius: 9999px;
  background: rgb(163 163 163 / 0.14);
  color: rgb(64 64 64);
}

.dark .done,
.dark .done-none {
  color: rgb(212 212 212);
}

.done::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--kind);
}

.done b {
  font-weight: 500;
}

.done-none {
  padding-left: 8px;
  color: rgb(115 115 115);
}

.entry[data-state='future'] {
  opacity: 0.45;
}

.entry[data-state='current'] {
  background: rgb(163 163 163 / 0.18);
}

/* The act of this moment reads darker, in colour and not in weight: bold would move the words */
.entry[data-state='current'] .entry-what {
  color: rgb(23 23 23);
}

.dark .entry[data-state='current'] .entry-what {
  color: rgb(250 250 250);
}

/* An unfolded line leaves the highlight to the act inside it */
.entry[data-open='true'][data-state='current'] {
  background: none;
}

@media (hover: hover) and (pointer: fine) {
  .entry:not([data-plain='true']):hover {
    background: rgb(163 163 163 / 0.14);
  }
}

/* A cell that is explained: the others step back, it gets a ring */
[data-cell] {
  border-radius: 3px;
  transition:
    opacity 140ms var(--ease-out),
    outline-color 140ms var(--ease-out);
  outline: 1.5px solid transparent;
  outline-offset: 2px;
}

[data-mark='off'] {
  opacity: 0.3;
}

[data-mark='on'] {
  outline-color: rgb(23 23 23);
}

.dark [data-mark='on'] {
  outline-color: rgb(245 245 245);
}

@media (prefers-reduced-motion: reduce) {
  .entry,
  [data-cell] {
    transition: none;
  }
}
</style>
