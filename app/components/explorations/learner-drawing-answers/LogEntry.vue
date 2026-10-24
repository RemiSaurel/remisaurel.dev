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
    class="[transition-property:opacity,background-color] grid grid-cols-[2.25rem_3px_5.5rem_minmax(0,1fr)] min-w-0 flex-1 items-start gap-x-2 gap-y-0 rounded-[6px] p-[6px] text-left duration-[120ms] ease-[var(--ease-out)] focus-visible:outline-2 focus-visible:outline-neutral-900 focus-visible:outline-solid [@media(prefers-reduced-motion:reduce)]:transition-none dark:focus-visible:outline-neutral-100 focus-visible:-outline-offset-2"
    :class="[
      compact ? 'text-[12px] leading-[1.3]' : 'text-[13px] leading-[1.4]',
      state === 'future' && 'opacity-45',
      // An unfolded line leaves the highlight to the act inside it
      state === 'current' && !open && 'bg-neutral-400/18',
      !plain && 'hover:bg-neutral-400/14',
    ]"
    :data-state="state"
    :data-current="state === 'current'"
    :data-open="open"
    :data-compact="compact"
    :data-plain="plain"
  >
    <span class="tabular-nums text-neutral-500 dark:text-neutral-400" data-cell="time" :data-mark="mark('time')">{{ mmss(line.from) }}</span>
    <!-- The mark of the kind of act runs the height of the row, however many lines it takes -->
    <span class="key relative w-[3px] shrink-0 self-stretch rounded-[1px] bg-[var(--kind)]" :class="compact ? 'min-h-[11px]' : 'min-h-[14px]'" :data-kind="line.kind" data-cell="kind" :data-mark="mark('kind')" aria-hidden="true" />
    <!-- The act of this moment reads darker, in colour and not in weight: bold would move the words -->
    <span :class="state === 'current' ? 'text-neutral-900 dark:text-neutral-50' : 'text-neutral-600 dark:text-neutral-300'" data-cell="what" :data-mark="mark('what')">{{ line.detail.what }}</span>
    <!-- The name, the figure and the part: one line while they fit, then they wrap as whole pieces -->
    <span class="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0">
      <!-- A rename is two names: each wraps as a whole piece, and the arrow stays with the new one -->
      <span v-if="line.detail.name" class="max-w-full min-w-0 flex flex-wrap items-baseline gap-x-[6px] gap-y-0 break-words font-medium">
        <span v-if="line.detail.from" class="text-neutral-500 font-normal line-through decoration-neutral-400 dark:text-neutral-400" data-cell="from" :data-mark="mark('from')">{{ line.detail.from }}</span>
        <!-- The baseline of the pair is the new name's: the arrow has none, and would drag it to its own bottom edge -->
        <span class="min-w-0 inline-flex items-baseline gap-1">
          <Icon v-if="line.detail.from" name="lucide:arrow-right" class="mt-[0.28em] size-3 shrink-0 self-start" aria-hidden="true" />
          <span data-cell="name" :data-mark="mark('name')">{{ line.detail.name }}</span>
        </span>
      </span>
      <span v-if="line.detail.meta" class="tabular-nums text-neutral-500 dark:text-neutral-400" data-cell="figure" :data-mark="mark('figure')">{{ line.detail.meta }}</span>
      <!-- Which part a name gives its label to: the match is the matcher's, so a miss says so. Its icon has no text baseline: aligned on baselines it would push the name below the act -->
      <span
        v-if="line.part !== undefined"
        class="ml-auto inline-flex items-center self-center gap-1 text-[12px] font-normal"
        :class="line.part !== null ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'"
        :data-matched="line.part !== null"
        data-cell="part"
        :data-mark="mark('part')"
      >
        <template v-if="line.part !== null">
          <Icon name="lucide:circle-check" class="size-3.5 shrink-0" aria-hidden="true" />
          {{ line.part }}
        </template>
        <template v-else>No part</template>
      </span>
      <template v-if="line.check">
        <span
          v-if="line.check.delta !== null"
          class="tabular-nums text-[12px]"
          :class="line.check.delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'"
          :data-sign="Math.sign(line.check.delta)"
          data-cell="delta"
          :data-mark="mark('delta')"
        >{{ delta(line.check.delta) }}</span>
        <!-- Shorter than a line of text: a taller pill would stretch the row, and the bar of the kind with it -->
        <span v-if="line.check.onlyRenames" class="whitespace-nowrap rounded-full bg-amber-500/16 px-2 py-[1px] text-[12px] text-amber-800 leading-[1.25] dark:text-amber-300" data-cell="flag" :data-mark="mark('flag')" title="Nothing was drawn or added since the check before, only names changed. The count may have been guessed.">Only renames</span>
      </template>
    </span>
    <!-- A check has a second line, with what the learner did before asking -->
    <span v-if="line.check" class="col-[3/-1] mt-[3px] flex flex-wrap items-center gap-x-[6px] gap-y-1 text-[12px] text-neutral-500 font-normal dark:text-neutral-400" data-cell="since" :data-mark="mark('since')">
      <span>Since {{ line.check.from }}</span>
      <!-- One kind of act done since the check before, with the colour of its mark in the log -->
      <span v-for="item in line.check.done" :key="item.noun" class="done inline-flex items-center gap-1 rounded-full bg-neutral-400/14 py-[1px] pl-[6px] pr-2 text-neutral-700 dark:text-neutral-300" :data-kind="item.kind"><b class="tabular-nums font-medium">{{ item.count }}</b> {{ item.noun }}</span>
      <span v-if="!line.check.done.length" class="inline-flex items-center gap-1 rounded-full bg-neutral-400/14 px-2 py-[1px] text-neutral-500 dark:text-neutral-300">nothing</span>
    </span>
  </component>
</template>

<style scoped>
/* A bar of 3px is hard to point at: its target reaches into the gaps on both sides, and no further */
.key::before {
  content: '';
  position: absolute;
  inset: -4px -5px;
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

.done::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: var(--kind);
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
  [data-cell] {
    transition: none;
  }
}
</style>
