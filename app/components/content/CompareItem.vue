<script setup lang="ts">
import type { CompareVerdict } from '~/utils/compare'
import { COMPARE_KEY, COMPARE_VERDICTS } from '~/utils/compare'

// One take inside a Compare: a label, a verdict, what it gives (the default slot: text, code, an
// image, a live component) and, under it, why it works or not (the `note` slot, or the `note` prop).
interface CompareItemProps {
  label: string
  verdict?: CompareVerdict
  note?: string
}

const props = defineProps<CompareItemProps>()

const compare = inject(COMPARE_KEY, null)
const id = useId()

compare?.register({ id, label: props.label, verdict: props.verdict })
onBeforeUnmount(() => compare?.unregister(id))

const verdict = computed(() => (props.verdict ? COMPARE_VERDICTS[props.verdict] : null))
</script>

<template>
  <section
    :id="id"
    data-compare-item
    :data-verdict="verdict ? props.verdict : undefined"
    role="group"
    :aria-labelledby="`${id}-label`"
    class="compare-item"
  >
    <header class="flex items-center justify-between gap-3 border-b border-neutral-200/70 px-3 py-2 dark:border-neutral-700/70">
      <h4 :id="`${id}-label`" class="m-0 truncate text-[13px] text-neutral-900 font-medium dark:text-neutral-100">
        {{ label }}
      </h4>
      <span v-if="verdict" class="badge flex shrink-0 items-center gap-1 rounded-full px-1.5 py-px text-[11px] font-medium">
        <Icon :name="verdict.icon" class="size-3" />
        {{ verdict.label }}
      </span>
    </header>

    <div class="compare-body px-3 py-2.5">
      <slot />
    </div>

    <footer
      v-if="$slots.note || note"
      class="compare-note border-t border-neutral-200/70 bg-neutral-50 px-3 py-2.5 text-[12.5px] text-neutral-600 leading-normal dark:border-neutral-700/70 dark:bg-neutral-900/40 dark:text-neutral-400"
    >
      <slot name="note">
        {{ note }}
      </slot>
    </footer>
  </section>
</template>

<style scoped>
/* Verdict colours: a soft tint and a readable ink, in both themes */
.compare-item {
  --verdict-bg: rgb(245 245 245);
  --verdict-ink: rgb(82 82 82);
}

.compare-item[data-verdict='works'] {
  --verdict-bg: rgb(16 185 129 / 0.12);
  --verdict-ink: rgb(4 120 87);
}

.compare-item[data-verdict='partial'] {
  --verdict-bg: rgb(245 158 11 / 0.14);
  --verdict-ink: rgb(180 83 9);
}

.compare-item[data-verdict='fails'] {
  --verdict-bg: rgb(244 63 94 / 0.12);
  --verdict-ink: rgb(190 18 60);
}

.dark .compare-item[data-verdict='works'] {
  --verdict-ink: rgb(52 211 153);
}

.dark .compare-item[data-verdict='partial'] {
  --verdict-ink: rgb(251 191 36);
}

.dark .compare-item[data-verdict='fails'] {
  --verdict-ink: rgb(251 113 133);
}

.badge {
  background: var(--verdict-bg);
  color: var(--verdict-ink);
}

/* Three rows shared with the other takes (label, content, note), so they line up across columns */
.compare-item {
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
}

/* Markdown inside a take keeps the frame's scale, not the article's */
.compare-body :deep(p),
.compare-body :deep(li) {
  margin: 0 0 0.5rem;
  font-size: 13.5px;
  line-height: 1.55;
}

.compare-note :deep(p) {
  font-size: inherit;
  line-height: inherit;
}

.compare-body > :deep(:first-child),
.compare-note > :deep(:first-child) {
  margin-top: 0;
}

.compare-body > :deep(:last-child),
.compare-note > :deep(:last-child) {
  margin-bottom: 0;
}

/* Code blocks come wrapped by ProsePre: a tight inset instead of the article's roomy one */
.compare-body :deep(div:has(> pre)) {
  margin: 0.5rem 0 0;
  padding: 6px 10px;
  border-radius: 6px;
}

.compare-body :deep(pre) {
  margin: 0;
  padding: 0;
  font-size: 12px;
  line-height: 1.5;
  background: none;
}
</style>
