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
        class="pressable border border-neutral-200 rounded-full bg-white px-2.5 py-1 text-[13px] text-neutral-600 transition-[border-color,background-color] duration-[180ms] ease-[var(--ease-out)] dark:border-neutral-700/80 hover:border-[rgb(var(--learner)/0.5)] dark:bg-neutral-800/40 dark:text-neutral-300 [@media(prefers-reduced-motion:reduce)]:transition-none"
        @click="start(starter)"
      >
        {{ starter }}
      </button>
    </div>

    <!-- The input and what it sends, in one card: the panel hangs under the input like a node footer -->
    <div class="border border-neutral-300 rounded-xl bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-[border-color,box-shadow] duration-[180ms] ease-[var(--ease-out)] dark:border-neutral-700 focus-within:border-blue-600 dark:bg-neutral-800/60 focus-within:outline-2 focus-within:outline-blue-600 focus-within:outline-offset-1 focus-within:outline-solid [@media(prefers-reduced-motion:reduce)]:transition-none dark:focus-within:border-blue-400 [@media(forced-colors:active)]:focus-within:outline-[Highlight] dark:focus-within:outline-blue-400">
      <div class="relative">
        <div class="flex items-start gap-1 py-1.5 pl-[14px] pr-2">
          <textarea
            ref="input"
            rows="1"
            role="combobox"
            autocomplete="off"
            spellcheck="false"
            class="[outline:0] block max-h-[128px] min-w-0 flex-1 resize-none overflow-y-auto border-0 bg-transparent px-0 py-2 text-[16px] text-inherit leading-6 placeholder:text-neutral-500 dark:placeholder:text-neutral-400"
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
            class="clear relative grid mt-1.5 size-7 shrink-0 pressable place-items-center rounded-lg text-neutral-500 hover:bg-neutral-400/18"
            aria-label="Clear the question"
            @click="clear"
          >
            <Icon name="lucide:x" class="size-4" aria-hidden="true" />
          </button>
        </div>

        <Transition name="pop">
          <div v-if="open && list" :id="`${id}-list`" class="absolute left-1.5 top-[calc(100%_+_4px)] z-20 w-[min(calc(100%_-_12px),16rem)] origin-top-left border border-neutral-200 rounded-[10px] bg-white shadow-[0_8px_24px_rgb(0_0_0/0.12)] dark:border-neutral-700 dark:bg-[#212121] dark:shadow-[0_8px_24px_rgb(0_0_0/0.5)]" role="listbox" :aria-label="list.title">
            <div
              ref="scroller"
              class="popup-scroll max-h-48 overflow-y-auto rounded-[9px] p-1"
              :data-above="more.above || undefined"
              :data-below="more.below || undefined"
              @scroll.passive="measure"
            >
              <div class="flex items-center gap-1.5 px-2 pb-1 pt-[3px] text-[12px] text-neutral-700 font-semibold dark:text-neutral-300" aria-hidden="true">
                <Icon :name="list.icon" class="size-3.5" aria-hidden="true" />
                {{ list.title }}
              </div>
              <div
                v-for="(item, index) in options"
                :id="optionId(index)"
                :key="item.id"
                role="option"
                class="flex cursor-pointer items-baseline justify-between gap-2 rounded-[5px] px-2 py-0.5 text-[13px] leading-5 aria-[selected=true]:bg-neutral-400/18"
                :aria-selected="index === active"
                @mousedown.prevent
                @click="pick(item)"
                @mousemove="active = index"
              >
                {{ item.name }}
                <span class="[font-family:ui-monospace,monospace] [font-variant-numeric:tabular-nums] text-[11px] font-normal opacity-75">{{ item.id }}</span>
              </div>
              <div v-if="!options.length" class="px-2 py-[5px] text-[13px] text-neutral-500" aria-hidden="true">
                Nothing matches “{{ found?.query }}”
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div class="flex flex-col gap-2 border-t border-neutral-200 rounded-b-[11px] bg-neutral-400/8 px-[14px] pb-3 pt-2.5 dark:border-neutral-700">
        <div class="sr-only" role="status">
          {{ announcement }}
        </div>
        <div class="grid grid-cols-[5.5rem_1fr] items-start gap-[10px] text-[14px] max-[480px]:grid-cols-[1fr] max-[480px]:gap-0.5">
          <span class="[font-family:ui-monospace,monospace] [text-transform:uppercase] h-6 flex items-center text-[11px] text-neutral-500 tracking-[0.04em]">Sent</span>
          <code v-if="text" class="[overflow-wrap:anywhere] whitespace-pre-wrap p-0 text-[13px] leading-6">
            <template v-for="(part, index) in parts" :key="index">
              <span
                v-if="part.kind"
                class="tag rounded-[4px] py-px transition-[opacity,background-color] duration-150 ease-[var(--ease-out)] data-[state=dim]:opacity-35 [@media(prefers-reduced-motion:reduce)]:transition-none"
                :data-kind="part.kind"
                :data-state="stateOf(part.rank!)"
                @pointerenter="light($event, part.rank!)"
                @pointerleave="hovered = null"
              >
                <span class="text-[#5a5a5a] dark:text-neutral-400">&lt;{{ part.kind }} id="{{ part.id }}"&gt;</span>{{ part.text }}<span class="text-[#5a5a5a] dark:text-neutral-400">&lt;/{{ part.kind }}&gt;</span>
              </span>
              <template v-else>{{ part.text }}</template>
            </template>
          </code>
          <span v-else class="text-neutral-500 leading-6 dark:text-neutral-400">Nothing typed yet</span>
        </div>

        <div class="grid grid-cols-[5.5rem_1fr] items-start gap-[10px] text-[14px] max-[480px]:grid-cols-[1fr] max-[480px]:gap-0.5">
          <span class="[font-family:ui-monospace,monospace] [text-transform:uppercase] h-6 flex items-center text-[11px] text-neutral-500 tracking-[0.04em]">Recognized</span>
          <span v-if="recognized.length" class="flex flex-wrap gap-1.5">
            <span
              v-for="part in recognized"
              :key="part.rank"
              class="chip h-6 inline-flex items-center gap-1 whitespace-nowrap rounded-md pl-[5px] pr-[7px] text-[13px] font-medium transition-[opacity,background-color] duration-150 ease-[var(--ease-out)] data-[state=dim]:opacity-35 [@media(prefers-reduced-motion:reduce)]:transition-none"
              :data-kind="part.kind"
              :data-state="stateOf(part.rank!)"
              @pointerenter="light($event, part.rank!)"
              @pointerleave="hovered = null"
            >
              <Icon :name="LISTS[part.kind!].icon" class="size-3.5 shrink-0" aria-hidden="true" />
              <span class="inline-flex items-baseline gap-1">
                {{ part.text }}
                <span class="[font-family:ui-monospace,monospace] [font-variant-numeric:tabular-nums] text-[11px] font-normal opacity-75">{{ part.id }}</span>
              </span>
            </span>
          </span>
          <span v-else class="text-neutral-500 leading-6 dark:text-neutral-400">No mention yet</span>
        </div>

        <p v-if="handTyped.length" class="m-0 flex gap-2 text-[13px] text-amber-800 leading-normal dark:text-amber-300">
          <Icon name="lucide:triangle-alert" class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <code class="text-[12px]">{{ handTyped.join(' ') }}</code>
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

/* The button stays 28px; its hit area reaches 40px */
.clear::after {
  content: '';
  position: absolute;
  inset: -6px;
}

/* The list scrolls inside the frame, so the fade never touches the border or the shadow */
.popup-scroll {
  --fade-above: 0px;
  --fade-below: 0px;
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
  .popup-scroll {
    transition: none;
  }
}

/* The colour of a mention follows its kind, and gets stronger while it is lit */
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
</style>
