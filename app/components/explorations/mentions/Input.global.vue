<script setup lang="ts">
import type { Mention, MentionKind } from '~/utils/mentions'
import { useEventListener } from '@vueuse/core'
import { findMentionQuery, insertMention, matchNames, parsePrompt, toPrompt } from '~/utils/mentions'

// The input of the teachers' chatbot, with the rules of the app: `@` opens the learners, `#` the
// subjects, a pick is kept apart, and what goes to the backend is the text with each pick in a tag.
// Nothing is sent anywhere. The roster is synthetic, and translated: the app is in French.
// What the app does not have, and this one does: arrow keys, matching that ignores accents, and the
// id of the item in the tag (the app tags the name only).
interface Item {
  id: number
  name: string
}

interface MentionList {
  title: string
  icon: string
  items: Item[]
}

const LISTS: Record<MentionKind, MentionList> = {
  subject: {
    title: 'Subjects',
    icon: 'lucide:layers',
    items: [
      { id: 1, name: 'Probability' },
      { id: 2, name: 'Pythagoras' },
      { id: 3, name: 'Algebra' },
      { id: 4, name: 'Geometry' },
      { id: 5, name: 'Statistics' },
      { id: 6, name: 'Calculus' },
    ],
  },
  learner: {
    title: 'Learners',
    icon: 'lucide:user',
    items: [
      { id: 11, name: 'Alex Lanier' },
      { id: 12, name: 'Claire Roux' },
      { id: 13, name: 'Jean Martin' },
      { id: 14, name: 'Jean Moreau' },
      { id: 15, name: 'Lucas Girard' },
      { id: 16, name: 'Marie Dupont' },
      { id: 17, name: 'Pierre Roux' },
      { id: 18, name: 'Sophie Leclerc' },
    ],
  },
}

const STARTERS = [
  'Who did worst on #',
  'How did @',
  'Which learners struggle with #',
]

const text = ref('')
const cursor = ref(0)
const mentions = ref<Mention[]>([])
const focused = ref(false)
const dismissed = ref(false)
const active = ref(0)
/** The mention under the pointer, by its rank among the mentions: lit in "Sent" and in "Recognized" */
const hovered = ref<number | null>(null)
const input = ref<HTMLTextAreaElement>()
const scroller = ref<HTMLElement>()
/** What the list hides above and below its visible part: each side fades while there is more to see */
const more = reactive({ above: false, below: false })
const id = useId()

const found = computed(() => findMentionQuery(text.value, cursor.value))
const list = computed(() => (found.value ? LISTS[found.value.kind] : null))
const options = computed(() => (found.value ? matchNames(LISTS[found.value.kind].items, found.value.query) : []))
const open = computed(() => focused.value && !dismissed.value && !!found.value)

const optionId = (index: number) => `${id}-option-${index}`

const prompt = computed(() => toPrompt(text.value, mentions.value))

// The parts of the sent text, each tag with its rank among the tags
const parts = computed(() => {
  let rank = 0
  return parsePrompt(prompt.value).map(part => (part.kind ? { ...part, rank: rank++ } : part))
})
const recognized = computed(() => parts.value.filter(part => part.kind))

// A trigger typed in full but never picked: the app leaves it as plain text. While the list is open
// the word is still being typed, so the hint waits
const handTyped = computed(() => (open.value
  ? []
  : parts.value.filter(part => !part.kind).flatMap(part => part.text.match(/[@#]\S+/g) ?? [])))

// Said by the status region, as nothing else tells a screen reader that the list or the panel changed
const announcement = computed(() => {
  if (open.value && list.value) {
    const count = options.value.length
    return count ? `${count} ${count === 1 ? 'match' : 'matches'} in ${list.value.title.toLowerCase()}` : 'No match'
  }
  if (handTyped.value.length)
    return `${handTyped.value.join(' ')} typed by hand, sent as plain text`
  if (recognized.value.length)
    return `${recognized.value.length} ${recognized.value.length === 1 ? 'mention' : 'mentions'} recognized`
  return ''
})

// A mouse lights the matching tag or chip. A touch fires pointerenter on a tap and never leaves, so it would stay lit
function light(event: PointerEvent, rank: number) {
  if (event.pointerType === 'mouse')
    hovered.value = rank
}

// What a mention looks like while another one is lit
const stateOf = (rank: number) => (hovered.value === null ? undefined : hovered.value === rank ? 'lit' : 'dim')

watch(options, () => (active.value = 0))

function measure() {
  const el = scroller.value
  more.above = !!el && el.scrollTop > 1
  more.below = !!el && el.scrollHeight - el.scrollTop - el.clientHeight > 1
}

// The list is rendered after `open` flips, and its height follows the matches
watch([open, options], () => nextTick(measure), { flush: 'post' })

watch(active, () => nextTick(() => document.getElementById(optionId(active.value))?.scrollIntoView({ block: 'nearest' })))

// The text changes under a lit mention: its rank may not exist anymore
watch(recognized, () => (hovered.value = null))

// The field grows with its text, up to the max height of the CSS, then scrolls
function fit() {
  const el = input.value
  if (!el)
    return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(text, () => nextTick(fit))
onMounted(fit)
useEventListener('resize', fit)

function sync() {
  const el = input.value
  if (!el)
    return
  text.value = el.value
  cursor.value = el.selectionStart ?? el.value.length
}

function onInput() {
  dismissed.value = false
  sync()
}

function pick(item: Item) {
  const el = input.value
  const query = found.value
  if (!el || !query)
    return
  const next = insertMention(text.value, cursor.value, query, item.name)
  mentions.value.push({ kind: query.kind, id: item.id, name: item.name })
  text.value = next.text
  cursor.value = next.cursor
  nextTick(() => {
    el.focus()
    el.setSelectionRange(next.cursor, next.cursor)
  })
}

// Enter never adds a line, as in the chat where it sends: Shift+Enter does. With the list open it picks
function onKeydown(event: KeyboardEvent) {
  const count = open.value ? options.value.length : 0
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    if (count)
      pick(options.value[active.value]!)
  }
  else if (open.value && event.key === 'ArrowDown' && count) {
    event.preventDefault()
    active.value = (active.value + 1) % count
  }
  else if (open.value && event.key === 'ArrowUp' && count) {
    event.preventDefault()
    active.value = (active.value - 1 + count) % count
  }
  else if (open.value && event.key === 'Tab' && count) {
    event.preventDefault()
    pick(options.value[active.value]!)
  }
  else if (open.value && event.key === 'Escape') {
    event.preventDefault()
    dismissed.value = true
  }
}

// A starter ends with a trigger, so the list is already open when the caret lands after it
function start(value: string) {
  text.value = value
  mentions.value = []
  dismissed.value = false
  nextTick(() => {
    input.value?.focus()
    input.value?.setSelectionRange(value.length, value.length)
    sync()
  })
}

function clear() {
  text.value = ''
  mentions.value = []
  dismissed.value = false
  cursor.value = 0
  // Focusing runs `sync`, which reads the field: it must be empty by then, not at the next render
  if (input.value) {
    input.value.value = ''
    input.value.focus()
  }
}
</script>

<template>
  <div class="mentions my-8 flex flex-col gap-3">
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-[13px] text-neutral-500 dark:text-neutral-400">Start from</span>
      <button
        v-for="starter in STARTERS"
        :key="starter"
        type="button"
        class="starter pressable"
        @click="start(starter)"
      >
        {{ starter }}
      </button>
    </div>

    <!-- The input and what it sends, in one card: the panel hangs under the input like a node footer -->
    <div class="card">
      <div class="relative">
        <div class="box">
          <textarea
            ref="input"
            rows="1"
            role="combobox"
            autocomplete="off"
            spellcheck="false"
            class="field"
            placeholder="Ask a question, type @ or # to point at something"
            aria-label="Question for the chatbot"
            aria-autocomplete="list"
            :aria-expanded="open"
            :aria-controls="`${id}-list`"
            :aria-activedescendant="open && options.length ? optionId(active) : undefined"
            :value="text"
            @input="onInput"
            @keydown="onKeydown"
            @keyup="sync"
            @click="sync"
            @focus="focused = true; sync()"
            @blur="focused = false"
          />
          <button
            v-if="text"
            type="button"
            class="clear pressable"
            aria-label="Clear the question"
            @click="clear"
          >
            <Icon name="lucide:x" class="size-4" aria-hidden="true" />
          </button>
        </div>

        <Transition name="pop">
          <div v-if="open && list" :id="`${id}-list`" class="popup" role="listbox" :aria-label="list.title">
            <div
              ref="scroller"
              class="popup-scroll"
              :data-above="more.above || undefined"
              :data-below="more.below || undefined"
              @scroll.passive="measure"
            >
              <div class="popup-title" aria-hidden="true">
                <Icon :name="list.icon" class="size-3.5" aria-hidden="true" />
                {{ list.title }}
              </div>
              <div
                v-for="(item, index) in options"
                :id="optionId(index)"
                :key="item.id"
                role="option"
                class="option"
                :aria-selected="index === active"
                @mousedown.prevent
                @click="pick(item)"
                @mousemove="active = index"
              >
                {{ item.name }}
                <span class="id">{{ item.id }}</span>
              </div>
              <div v-if="!options.length" class="empty" aria-hidden="true">
                Nothing matches “{{ found?.query }}”
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div class="panel">
        <div class="sr-only" role="status">
          {{ announcement }}
        </div>
        <div class="row">
          <span class="label">Sent</span>
          <code v-if="text" class="sent">
            <template v-for="(part, index) in parts" :key="index">
              <span
                v-if="part.kind"
                class="tag"
                :data-kind="part.kind"
                :data-state="stateOf(part.rank!)"
                @pointerenter="light($event, part.rank!)"
                @pointerleave="hovered = null"
              >
                <span class="angle">&lt;{{ part.kind }} id="{{ part.id }}"&gt;</span>{{ part.text }}<span class="angle">&lt;/{{ part.kind }}&gt;</span>
              </span>
              <template v-else>{{ part.text }}</template>
            </template>
          </code>
          <span v-else class="muted">Nothing typed yet</span>
        </div>

        <div class="row">
          <span class="label">Recognized</span>
          <span v-if="recognized.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="part in recognized"
              :key="part.rank"
              class="chip"
              :data-kind="part.kind"
              :data-state="stateOf(part.rank!)"
              @pointerenter="light($event, part.rank!)"
              @pointerleave="hovered = null"
            >
              <Icon :name="LISTS[part.kind!].icon" class="size-3.5 shrink-0" aria-hidden="true" />
              <span class="name">
                {{ part.text }}
                <span class="id">{{ part.id }}</span>
              </span>
            </span>
          </span>
          <span v-else class="muted">No mention yet</span>
        </div>

        <p v-if="handTyped.length" class="hint">
          <Icon name="lucide:triangle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <code>{{ handTyped.join(' ') }}</code>
            {{ handTyped.length > 1 ? 'were' : 'was' }} typed, not picked from the list, so the backend gets
            {{ handTyped.length > 1 ? 'them' : 'it' }} as plain text.
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@property --fade-above {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

@property --fade-below {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}

.mentions {
  --learner: 59 130 246;
  --subject: 245 158 11;
}

.starter {
  padding: 4px 10px;
  border: 1px solid rgb(229 229 229);
  border-radius: 9999px;
  background: white;
  font-size: 13px;
  color: rgb(82 82 82);
  transition:
    border-color 180ms var(--ease-out),
    background-color 180ms var(--ease-out);
}

.dark .starter {
  border-color: rgb(64 64 64 / 0.8);
  background: rgb(38 38 38 / 0.4);
  color: rgb(212 212 212);
}

@media (hover: hover) and (pointer: fine) {
  .starter:hover {
    border-color: rgb(var(--learner) / 0.5);
  }
}

/* The box of the app: white, a thin border, a small shadow. The panel under the input is part of it */
.card {
  border: 1px solid rgb(212 212 212);
  border-radius: 12px;
  background: white;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.06);
  transition:
    border-color 180ms var(--ease-out),
    box-shadow 180ms var(--ease-out);
}

.dark .card {
  border-color: rgb(64 64 64);
  background: rgb(38 38 38 / 0.6);
}

.card:focus-within {
  border-color: rgb(37 99 235);
  outline: 2px solid rgb(37 99 235);
  outline-offset: 1px;
}

.dark .card:focus-within {
  border-color: rgb(96 165 250);
  outline-color: rgb(96 165 250);
}

@media (forced-colors: active) {
  .card:focus-within {
    outline-color: Highlight;
  }
}

.box {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  padding: 6px 8px 6px 14px;
}

.field {
  flex: 1;
  min-width: 0;
  display: block;
  padding: 8px 0;
  border: 0;
  outline: 0;
  background: transparent;
  resize: none;
  /* Five lines, then it scrolls */
  max-height: 128px;
  overflow-y: auto;
  /* 16px: below it, iOS zooms the page when the input gets focus */
  font-size: 16px;
  line-height: 24px;
  color: inherit;
}

.field::placeholder {
  color: rgb(115 115 115);
}

.dark .field::placeholder {
  color: rgb(163 163 163);
}

.clear {
  position: relative;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  /* Centered on the first line: 8px of padding and 24px of line make 40px */
  margin-top: 6px;
  border-radius: 8px;
  color: rgb(115 115 115);
}

/* The button stays 28px; its hit area reaches 40px */
.clear::after {
  content: '';
  position: absolute;
  inset: -6px;
}

@media (hover: hover) and (pointer: fine) {
  .clear:hover {
    background: rgb(163 163 163 / 0.18);
  }
}

.popup {
  position: absolute;
  z-index: 20;
  top: calc(100% + 4px);
  left: 6px;
  width: min(calc(100% - 12px), 16rem);
  border: 1px solid rgb(229 229 229);
  border-radius: 10px;
  background: white;
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.12);
  transform-origin: top left;
}

/* The list scrolls inside the frame, so the fade never touches the border or the shadow */
.popup-scroll {
  --fade-above: 0px;
  --fade-below: 0px;
  max-height: 12rem;
  overflow-y: auto;
  padding: 4px;
  border-radius: 9px;
  mask-image: linear-gradient(
    to bottom,
    transparent,
    #000 var(--fade-above),
    #000 calc(100% - var(--fade-below)),
    transparent
  );
  transition:
    --fade-above 160ms var(--ease-out),
    --fade-below 160ms var(--ease-out);
}

.popup-scroll[data-above] {
  --fade-above: 28px;
}

.popup-scroll[data-below] {
  --fade-below: 28px;
}

.dark .popup {
  border-color: rgb(64 64 64);
  background: rgb(33 33 33);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.5);
}

.popup-title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 4px;
  font-size: 12px;
  font-weight: 600;
  color: rgb(64 64 64);
}

.dark .popup-title {
  color: rgb(212 212 212);
}

.option {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 8px;
  border-radius: 5px;
  font-size: 13px;
  line-height: 20px;
  cursor: pointer;
}

.option[aria-selected='true'] {
  background: rgb(163 163 163 / 0.18);
}

.empty {
  padding: 5px 8px;
  font-size: 13px;
  color: rgb(115 115 115);
}

.pop-enter-active,
.pop-leave-active {
  transition:
    opacity 140ms var(--ease-out),
    transform 140ms var(--ease-out);
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

@media (prefers-reduced-motion: reduce) {
  .pop-enter-active,
  .pop-leave-active,
  .popup-scroll,
  .starter,
  .card,
  .tag,
  .chip {
    transition: none;
  }
}

/* The footer of the card, like the footer of a node */
.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px 12px;
  border-top: 1px solid rgb(229 229 229);
  border-radius: 0 0 11px 11px;
  background: rgb(163 163 163 / 0.08);
}

.dark .panel {
  border-top-color: rgb(64 64 64);
}

.row {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  align-items: start;
  gap: 10px;
  font-size: 14px;
}

/* One line height for the label and what it names, so they sit on the same line */
.label {
  display: flex;
  align-items: center;
  height: 24px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(115 115 115);
}

.sent {
  /* The article gives inline code a padding: it would push the text under its label */
  padding: 0;
  font-size: 13px;
  line-height: 24px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.muted {
  line-height: 24px;
  color: rgb(115 115 115);
}

.angle {
  color: rgb(90 90 90);
}

.dark .muted,
.dark .angle {
  color: rgb(163 163 163);
}

.tag,
.chip {
  transition:
    opacity 150ms var(--ease-out),
    background-color 150ms var(--ease-out);
}

.tag[data-state='dim'],
.chip[data-state='dim'] {
  opacity: 0.35;
}

.tag {
  padding: 1px 0;
  border-radius: 4px;
}

.tag[data-kind='learner'] {
  background: rgb(var(--learner) / 0.14);
}

.tag[data-kind='subject'] {
  background: rgb(var(--subject) / 0.18);
}

.tag[data-kind='learner'][data-state='lit'] {
  background: rgb(var(--learner) / 0.3);
}

.tag[data-kind='subject'][data-state='lit'] {
  background: rgb(var(--subject) / 0.34);
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 24px;
  padding: 0 7px 0 5px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.chip[data-kind='learner'] {
  background: rgb(var(--learner) / 0.14);
  color: rgb(29 78 216);
}

.chip[data-kind='subject'] {
  background: rgb(var(--subject) / 0.18);
  color: rgb(146 64 14);
}

.chip[data-kind='learner'][data-state='lit'] {
  background: rgb(var(--learner) / 0.3);
}

.chip[data-kind='subject'][data-state='lit'] {
  background: rgb(var(--subject) / 0.34);
}

.dark .chip[data-kind='learner'] {
  color: rgb(147 197 253);
}

.dark .chip[data-kind='subject'] {
  color: rgb(252 211 77);
}

/* Name and id share a baseline: centred, the smaller id would sit higher than the name */
.name {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
}

/* The id of the item, small and quiet next to its name */
.id {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
}

.hint {
  display: flex;
  gap: 8px;
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: rgb(146 64 14);
}

.dark .hint {
  color: rgb(252 211 77);
}

.hint code {
  font-size: 12px;
}

@media (max-width: 480px) {
  .row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
