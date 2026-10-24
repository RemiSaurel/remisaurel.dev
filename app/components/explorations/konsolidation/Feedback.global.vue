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
      <SegmentedControl v-model="version" label="Version of the prompt" :options="VERSIONS" />
      <span class="text-[13px] text-neutral-500 dark:text-neutral-400">{{ message.caption }}</span>
    </div>

    <!-- What the learner gets -->
    <p :key="version" class="bubble m-0 rounded-2xl bg-neutral-100 px-4 py-3 leading-[1.7] dark:bg-neutral-800/70">
      <span
        v-for="(parts, index) in parsed"
        :key="index"
        role="button"
        tabindex="0"
        class="sentence [-webkit-box-decoration-break:clone] [box-decoration-break:clone] mr-[6px] cursor-pointer rounded-[6px] px-[6px] py-[3px]"
        :data-i="index"
        :data-active="active === index"
        @click="active = index"
        @keydown="onKey($event, index)"
      >
        <template v-for="(part, partIndex) in parts" :key="partIndex">
          <span v-if="part.kind" class="inline-flex items-center gap-1 whitespace-nowrap rounded-[6px] pl-1 pr-[6px] align-[-0.09em] text-[0.9em] font-medium leading-[1.2] data-[kind=question]:bg-blue-500/14 data-[kind=subject]:bg-amber-500/18 data-[kind=question]:text-blue-700 data-[kind=subject]:text-amber-800 dark:data-[kind=question]:text-blue-300 dark:data-[kind=subject]:text-amber-300" :data-kind="part.kind">
            <Icon :name="REFERENCE_ICONS[part.kind]" class="size-3.5 shrink-0" aria-hidden="true" />
            {{ part.text }}
          </span>
          <template v-else>{{ part.text }}</template>
        </template><sup class="[font-variant-numeric:tabular-nums] ml-[2px] text-[10px] text-[rgb(var(--tint))] font-semibold">{{ index + 1 }}</sup>
      </span>
    </p>

    <!-- The same message, one sentence at a time -->
    <ol class="list-none m-0 flex flex-col gap-1.5 p-0">
      <li
        v-for="(sentence, index) in message.sentences"
        :key="index"
        class="step group border border-neutral-200 rounded-xl border-solid bg-white transition-[border-color] duration-200 ease-[var(--ease-out)] dark:border-neutral-700/80 dark:bg-neutral-800/40"
        :data-i="index"
        :data-active="active === index"
      >
        <button
          type="button"
          class="w-full flex items-center gap-[10px] px-3 py-[10px] text-left text-[15px]"
          :aria-expanded="active === index"
          @click="active = index"
        >
          <span class="grid size-5 shrink-0 place-items-center rounded-full bg-[rgb(var(--tint)/0.16)] text-[11px] text-[rgb(var(--tint))] font-semibold">{{ index + 1 }}</span>
          <span class="font-medium">{{ sentence.analysis.role }}</span>
          <Icon name="lucide:chevron-down" class="chevron ml-auto size-4 shrink-0 text-neutral-400 group-data-[active=true]:rotate-180" aria-hidden="true" />
        </button>
        <div class="step-body grid grid-rows-[0fr] group-data-[active=true]:grid-rows-[1fr]">
          <div class="min-h-0 overflow-hidden">
            <div class="flex flex-col gap-3 px-3 pb-3 pt-1 text-[15px]">
              <p class="m-0 flex items-center gap-2" :data-tone="sentence.analysis.verdict.tone">
                <span class="grid size-[18px] shrink-0 place-items-center rounded-full text-white" :class="sentence.analysis.verdict.tone === 'works' ? 'bg-emerald-500' : sentence.analysis.verdict.tone === 'partial' ? 'bg-amber-500' : 'bg-rose-500'"><Icon :name="VERDICT_ICONS[sentence.analysis.verdict.tone]" class="size-3" aria-hidden="true" /></span>
                {{ sentence.analysis.verdict.text }}
              </p>
              <blockquote class="m-0 border-l-2 border-l-[rgb(var(--tint)/0.5)] border-l-solid py-[2px] pl-3 text-[13px] text-neutral-600 leading-[1.6] dark:text-neutral-400">
                <span class="[font-family:ui-monospace,monospace] mr-[6px] text-[11px] text-[rgb(var(--tint))] tracking-[0.04em] case-upper">Prompt</span>
                {{ sentence.analysis.prompt }}
              </blockquote>
              <div v-if="sentence.analysis.raw" class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <code class="rounded-[5px] bg-neutral-400/16 px-[6px] py-[2px] text-[12px]">{{ sentence.analysis.raw[0] }}</code>
                <Icon name="lucide:arrow-right" class="size-3.5 text-neutral-400" aria-hidden="true" />
                <code class="rounded-[5px] bg-neutral-400/16 px-[6px] py-[2px] text-[12px]">{{ sentence.analysis.raw[1] }}</code>
                <Icon name="lucide:arrow-right" class="size-3.5 text-neutral-400" aria-hidden="true" />
                <span class="inline-flex items-center gap-1 whitespace-nowrap rounded-[6px] pl-1 pr-[6px] align-[-0.09em] text-[0.9em] font-medium leading-[1.2] data-[kind=question]:bg-blue-500/14 data-[kind=subject]:bg-amber-500/18 data-[kind=question]:text-blue-700 data-[kind=subject]:text-amber-800 dark:data-[kind=question]:text-blue-300 dark:data-[kind=subject]:text-amber-300" :data-kind="parseFeedback(sentence.analysis.raw[1])[0]?.kind">
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

.bubble {
  animation: swap 280ms var(--ease-out);
}

@keyframes swap {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
}

.sentence {
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

.chevron {
  transition: transform 240ms var(--ease-out);
}

/* Opens by animating the row from 0fr to 1fr, so the height is never measured */
.step-body {
  transition: grid-template-rows 260ms var(--ease-out);
}

/* Wins over the dark border of the step, whose utility has the same specificity */
.step[data-active='true'] {
  border-color: rgb(var(--tint) / 0.45);
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
