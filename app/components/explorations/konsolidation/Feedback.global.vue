<script setup lang="ts">
import { parseFeedback } from '~/utils/feedbackTokens'

// The feedback message as the learner reads it, in its two versions. Nothing is generated here:
// the XP1 message is the one a learner received, the XP2 message is written by hand in the style
// the XP2 prompt asks for, on the question of the screenshot (MCQ on opposite numbers).
type Version = 'xp1' | 'xp2'

interface Analysis {
  // What the prompt asks of this sentence
  role: string
  verdict: { tone: 'works' | 'partial' | 'fails', text: string }
  // What the prompt asks for this sentence
  prompt: string
  // What the LLM writes, then what the backend stores (a reference to a question or a subject)
  raw?: [string, string]
}

interface Sentence {
  // A reference is written as the backend stores it: {{question:1|Question 1}}
  text: string
  analysis: Analysis
}

interface Message {
  caption: string
  sentences: Sentence[]
}

// The app is in French: the messages are translated here
const MESSAGES: Record<Version, Message> = {
  xp1: {
    caption: 'One message for a group of learners',
    sentences: [
      {
        text: 'You have trouble with multiple choice questions.',
        analysis: {
          role: 'Where I stand',
          verdict: { tone: 'partial', text: 'Names a pattern, but as a trait of the learner, with no goal.' },
          prompt: 'Where the learners stand relative to the goal, in simple words.',
        },
      },
      {
        text: 'Read the questions and the answers carefully before choosing.',
        analysis: {
          role: 'What to focus on',
          verdict: { tone: 'partial', text: 'A real strategy, but no example from the learner\'s own work.' },
          prompt: 'The concept or strategy to focus on, with a tiny example when it helps.',
        },
      },
      {
        text: 'Keep practicing, you will improve!',
        analysis: {
          role: 'Next step',
          verdict: { tone: 'fails', text: 'Starts with a verb, but gives nothing to do in 10 minutes.' },
          prompt: 'The ONE concrete next step, doable in under 10 minutes, starting with a verb.',
        },
      },
    ],
  },
  xp2: {
    caption: 'One message per learner, from their own answers',
    sentences: [
      {
        text: 'You are progressing on {{subject:4|Relative numbers}}, but your level is still partial.',
        analysis: {
          role: 'Where I stand',
          verdict: { tone: 'works', text: 'Names the goal with a subject, and says nothing about the person.' },
          prompt: 'Where the learner stands relative to the goal, in simple words.',
          raw: ['<subject id="4"/>', '{{subject:4|Relative numbers}}'],
        },
      },
      {
        text: 'For {{question:1|Question 1}}, you chose “3 and 0.3” instead of “the sum is 0”: opposites cancel out.',
        analysis: {
          role: 'What to focus on',
          verdict: { tone: 'works', text: 'Says what they answered and what was expected.' },
          prompt: 'The concept or strategy to focus on, with a tiny example from their own errors: what they answered and what was expected.',
          raw: ['<question id="1"/>', '{{question:1|Question 1}}'],
        },
      },
      {
        text: 'Redo it by testing each statement with an example, like −6 and 6.',
        analysis: {
          role: 'Next step',
          verdict: { tone: 'works', text: 'Same question, with a way to check the answer.' },
          prompt: 'The ONE concrete next step. When an error is given, it is about THAT question, with a precise way to check.',
        },
      },
    ],
  },
}

const VERSIONS: { id: Version, label: string }[] = [
  { id: 'xp1', label: 'XP1' },
  { id: 'xp2', label: 'XP2' },
]

const version = ref<Version>('xp1')
const active = ref(0)

const message = computed(() => MESSAGES[version.value])

const parsed = computed(() => message.value.sentences.map(sentence => parseFeedback(sentence.text)))

const VERDICT_ICONS = { works: 'lucide:check', partial: 'lucide:minus', fails: 'lucide:x' } as const

const REFERENCE_ICONS = { question: 'lucide:circle-help', subject: 'lucide:book-open' } as const

function onKey(event: KeyboardEvent, index: number) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    active.value = index
  }
}
</script>

<template>
  <div class="feedback my-8 flex flex-col gap-5">
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div role="tablist" aria-label="Version of the prompt" class="segmented">
        <button
          v-for="v in VERSIONS"
          :key="v.id"
          type="button"
          role="tab"
          class="segment"
          :aria-selected="version === v.id"
          @click="version = v.id"
        >
          {{ v.label }}
        </button>
      </div>
      <span class="text-[13px] text-neutral-500 dark:text-neutral-400">{{ message.caption }}</span>
    </div>

    <!-- What the learner gets -->
    <p :key="version" class="bubble m-0">
      <span
        v-for="(parts, index) in parsed"
        :key="index"
        role="button"
        tabindex="0"
        class="sentence"
        :data-i="index"
        :data-active="active === index"
        @click="active = index"
        @keydown="onKey($event, index)"
      >
        <template v-for="(part, partIndex) in parts" :key="partIndex">
          <span v-if="part.kind" class="chip" :data-kind="part.kind">
            <Icon :name="REFERENCE_ICONS[part.kind]" class="size-3.5 shrink-0" aria-hidden="true" />
            {{ part.text }}
          </span>
          <template v-else>{{ part.text }}</template>
        </template><sup class="num">{{ index + 1 }}</sup>
      </span>
    </p>

    <!-- The same message, one sentence at a time -->
    <ol class="list-none m-0 flex flex-col gap-1.5 p-0">
      <li
        v-for="(sentence, index) in message.sentences"
        :key="index"
        class="step"
        :data-i="index"
        :data-active="active === index"
      >
        <button
          type="button"
          class="step-head"
          :aria-expanded="active === index"
          @click="active = index"
        >
          <span class="badge">{{ index + 1 }}</span>
          <span class="font-medium">{{ sentence.analysis.role }}</span>
          <Icon name="lucide:chevron-down" class="chevron ml-auto size-4 shrink-0" aria-hidden="true" />
        </button>
        <div class="step-body">
          <div class="min-h-0 overflow-hidden">
            <div class="flex flex-col gap-3 px-3 pb-3 pt-1 text-[15px]">
              <p class="verdict m-0" :data-tone="sentence.analysis.verdict.tone">
                <span class="tone"><Icon :name="VERDICT_ICONS[sentence.analysis.verdict.tone]" class="size-3" aria-hidden="true" /></span>
                {{ sentence.analysis.verdict.text }}
              </p>
              <blockquote class="prompt m-0">
                <span class="prompt-label">Prompt</span>
                {{ sentence.analysis.prompt }}
              </blockquote>
              <div v-if="sentence.analysis.raw" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <code class="code">{{ sentence.analysis.raw[0] }}</code>
                <Icon name="lucide:arrow-right" class="size-3.5 text-neutral-400" aria-hidden="true" />
                <code class="code">{{ sentence.analysis.raw[1] }}</code>
                <Icon name="lucide:arrow-right" class="size-3.5 text-neutral-400" aria-hidden="true" />
                <span class="chip" :data-kind="parseFeedback(sentence.analysis.raw[1])[0]?.kind">
                  <Icon :name="REFERENCE_ICONS[parseFeedback(sentence.analysis.raw[1])[0]?.kind ?? 'question']" class="size-3.5" aria-hidden="true" />
                  {{ parseFeedback(sentence.analysis.raw[1])[0]?.text }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.feedback {
  /* The tint of each sentence and of its step */
  --tint-0: 59 130 246;
  --tint-1: 139 92 246;
  --tint-2: 16 185 129;
}

[data-i='0'] {
  --tint: var(--tint-0);
}

[data-i='1'] {
  --tint: var(--tint-1);
}

[data-i='2'] {
  --tint: var(--tint-2);
}

.segmented {
  display: inline-flex;
  padding: 2px;
  border-radius: 9px;
  background: rgb(163 163 163 / 0.16);
}

.segment {
  padding: 4px 14px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 500;
  color: rgb(115 115 115);
  transition:
    background-color 180ms var(--ease-out),
    color 180ms var(--ease-out);
}

.segment[aria-selected='true'] {
  background: white;
  color: rgb(23 23 23);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.08);
}

.dark .segment[aria-selected='true'] {
  background: rgb(64 64 64);
  color: rgb(245 245 245);
}

/* The grey bubble of the app */
.bubble {
  padding: 12px 16px;
  border-radius: 16px;
  background: rgb(245 245 245);
  line-height: 1.7;
  animation: swap 280ms var(--ease-out);
}

.dark .bubble {
  background: rgb(38 38 38 / 0.7);
}

@keyframes swap {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

.sentence {
  cursor: pointer;
  margin-right: 6px;
  padding: 3px 6px;
  border-radius: 6px;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transition: background-color 200ms var(--ease-out);
}

.sentence[data-active='true'] {
  background: rgb(var(--tint) / 0.16);
}

.sentence:focus-visible {
  outline: 2px solid rgb(var(--tint) / 0.7);
  outline-offset: 1px;
}

@media (hover: hover) and (pointer: fine) {
  .sentence:hover {
    background: rgb(var(--tint) / 0.1);
  }

  .sentence[data-active='true']:hover {
    background: rgb(var(--tint) / 0.16);
  }
}

.num {
  margin-left: 2px;
  font-size: 10px;
  font-weight: 600;
  color: rgb(var(--tint));
  font-variant-numeric: tabular-nums;
}

/* A reference to a question or a subject, as the learner sees it in the app */
.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 6px 0 4px;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 500;
  line-height: 1.2;
  /* Centers the chip in the highlight of its sentence, which is the height of the text */
  vertical-align: -0.09em;
  white-space: nowrap;
}

.chip[data-kind='question'] {
  background: rgb(59 130 246 / 0.14);
  color: rgb(29 78 216);
}

.chip[data-kind='subject'] {
  background: rgb(245 158 11 / 0.18);
  color: rgb(146 64 14);
}

.dark .chip[data-kind='question'] {
  color: rgb(147 197 253);
}

.dark .chip[data-kind='subject'] {
  color: rgb(252 211 77);
}

.step {
  border: 1px solid rgb(229 229 229);
  border-radius: 12px;
  background: white;
  transition: border-color 200ms var(--ease-out);
}

.dark .step {
  border-color: rgb(64 64 64 / 0.8);
  background: rgb(38 38 38 / 0.4);
}

.step[data-active='true'] {
  border-color: rgb(var(--tint) / 0.45);
}

.step-head {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  text-align: left;
  font-size: 15px;
}

.badge {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  border-radius: 9999px;
  background: rgb(var(--tint) / 0.16);
  color: rgb(var(--tint));
  font-size: 11px;
  font-weight: 600;
}

.chevron {
  color: rgb(163 163 163);
  transition: transform 240ms var(--ease-out);
}

.step[data-active='true'] .chevron {
  transform: rotate(180deg);
}

/* Opens by animating the row from 0fr to 1fr, so the height is never measured */
.step-body {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 260ms var(--ease-out);
}

.step[data-active='true'] .step-body {
  grid-template-rows: 1fr;
}

.verdict {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tone {
  display: grid;
  place-items: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border-radius: 9999px;
  color: white;
}

.verdict[data-tone='works'] .tone {
  background: rgb(16 185 129);
}

.verdict[data-tone='partial'] .tone {
  background: rgb(245 158 11);
}

.verdict[data-tone='fails'] .tone {
  background: rgb(244 63 94);
}

.prompt {
  padding: 2px 0 2px 12px;
  border-left: 2px solid rgb(var(--tint) / 0.5);
  font-size: 13px;
  line-height: 1.6;
  color: rgb(82 82 82);
}

.dark .prompt {
  color: rgb(163 163 163);
}

.prompt-label {
  margin-right: 6px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgb(var(--tint));
}

.code {
  padding: 2px 6px;
  border-radius: 5px;
  background: rgb(163 163 163 / 0.16);
  font-size: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .bubble {
    animation: none;
  }

  .step-body,
  .chevron,
  .sentence {
    transition: none;
  }
}
</style>
