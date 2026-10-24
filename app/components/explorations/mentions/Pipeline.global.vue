<script setup lang="ts">
import type { FlowGraph } from '~/utils/flow/types'

// One question through the chatbot, typed two ways. The agents are the ones of the backend: Clarification,
// SQL-gen (which also runs the query and debugs it), Explanation and Evaluator, all behind the Mistral API.
// Around them, the exploration adds a local step that swaps learner names for labels before any model
// sees them, and another that puts the names back. Nothing runs here: the two traces are written by hand
// to show where the difference can come from, they are not recorded runs. The app answers in French, so
// the texts are translated.
//
// Two rows: what happens on the school's side on top, what the agents do below.
const graph: FlowGraph = {
  nodes: [
    { id: 'anonymizer', x: 0, y: 0, kicker: 'Local · step 1', title: 'Anonymizer', icon: 'lucide:eye-off', detail: 'names to labels' },
    { id: 'table', x: 352, y: 0, kicker: 'Local', title: 'Name table', icon: 'lucide:table-2', detail: 'label to learner' },
    { id: 'reidentifier', x: 705, y: 0, kicker: 'Local · step 5', title: 'Re-identifier', icon: 'lucide:eye', detail: 'labels back to names' },
    { id: 'clarification', x: 0, y: 200, kicker: 'Mistral API · step 2', title: 'Clarification', icon: 'lucide:shield-check', detail: 'moderates, rewrites', think: true },
    { id: 'sql', x: 235, y: 200, kicker: 'Mistral API · step 3', title: 'SQL-gen', icon: 'lucide:database', detail: 'writes and runs SQL', think: true },
    { id: 'explanation', x: 470, y: 200, kicker: 'Mistral API · step 4', title: 'Explanation', icon: 'lucide:message-circle-more', detail: 'rows into a sentence', think: true },
    { id: 'evaluator', x: 705, y: 200, kicker: 'Mistral API · step 5', title: 'Evaluator', icon: 'lucide:scale', detail: 'relevant or not', think: true },
    { id: 'reply', x: 940, y: 100, kicker: 'Local · step 6', title: 'Reply', icon: 'lucide:send', detail: 'to the teacher' },
  ],
  edges: [
    { from: 'anonymizer', to: 'table' },
    { from: 'anonymizer', to: 'clarification', vertical: true },
    { from: 'clarification', to: 'sql' },
    { from: 'sql', to: 'explanation' },
    { from: 'explanation', to: 'evaluator' },
    { from: 'explanation', to: 'reidentifier' },
    { from: 'table', to: 'reidentifier' },
    { from: 'evaluator', to: 'reply' },
    { from: 'reidentifier', to: 'reply' },
  ],
}

type Version = 'free' | 'mention'

interface SqlLine {
  text: string
  /** The line that decides who the query is about */
  key?: boolean
}

interface Trace {
  /** What the teacher wrote, as the front sends it */
  prompt: string
  /** The question as it leaves the school: with mentions, the learners are labels */
  sent: string
  /** The question as the Clarification agent hands it to SQL-gen */
  rewritten: string
  sql: SqlLine[]
  rows: [string, string][]
  /** The sentence the Explanation agent writes, and the one the teacher reads once the names are back */
  written: string
  shown: string
  /** The learner the answer is about */
  answerAbout: string
  right: boolean
  /** What the agents get to know about a learner, and whether that is a name */
  sees: string
  leaks: boolean
  /** The name table: label and learner */
  table: [string, string][]
}

function head(column: string): SqlLine[] {
  return [
    { text: `SELECT ${column}, AVG(r.score) AS average` },
    { text: 'FROM response r' },
    { text: 'JOIN attempt a ON a.id = r.attempt_id' },
    { text: 'JOIN learner l ON l.id = r.learner_id' },
    { text: 'JOIN subject s ON s.id = a.subject_id' },
  ]
}

const TAIL: SqlLine[] = [
  { text: 'GROUP BY l.id' },
  { text: 'ORDER BY average ASC;' },
]

const TRACES: Record<Version, Trace> = {
  free: {
    prompt: 'Who did worst on Pythagoras between Jean, Marie and Pierre?',
    sent: 'Who did worst on Pythagoras between Jean, Marie and Pierre?',
    rewritten: 'Among the learners Jean, Marie and Pierre, which one has the lowest average score on the subject Pythagoras?',
    sql: [
      ...head('l.name'),
      { text: 'WHERE s.name LIKE \'%Pythagoras%\'', key: true },
      { text: '  AND (l.name LIKE \'Jean%\'', key: true },
      { text: '    OR l.name LIKE \'Marie%\'', key: true },
      { text: '    OR l.name LIKE \'Pierre%\')', key: true },
      ...TAIL,
    ],
    rows: [['Jean Moreau', '2.0'], ['Jean Martin', '5.5'], ['Pierre Roux', '6.0']],
    written: 'Jean Moreau did worst on Pythagoras, with an average of 2.0/10.',
    shown: 'Jean Moreau did worst on Pythagoras, with an average of 2.0/10.',
    answerAbout: 'Jean Moreau',
    right: false,
    sees: 'names',
    leaks: true,
    table: [],
  },
  mention: {
    prompt: 'Who did worst on <subject id="2">Pythagoras</subject> between <learner id="13">Jean Martin</learner>, <learner id="16">Marie Dupont</learner> and <learner id="17">Pierre Roux</learner>?',
    sent: 'Who did worst on <subject id="2">Pythagoras</subject> between <learner id="13">L13</learner>, <learner id="16">L16</learner> and <learner id="17">L17</learner>?',
    rewritten: 'Among the learners <learner id="13">L13</learner>, <learner id="16">L16</learner> and <learner id="17">L17</learner>, which one has the lowest average score on the subject <subject id="2">Pythagoras</subject>?',
    sql: [
      ...head('l.id'),
      { text: 'WHERE s.id = 2', key: true },
      { text: '  AND l.id IN (13, 16, 17)', key: true },
      ...TAIL,
    ],
    rows: [['L13', '5.5'], ['L17', '6.0']],
    written: 'L13 did worst on Pythagoras, with an average of 5.5/10.',
    shown: 'Jean Martin did worst on Pythagoras, with an average of 5.5/10.',
    answerAbout: 'Jean Martin',
    right: true,
    sees: 'ids only',
    leaks: false,
    table: [['L13', 'Jean Martin'], ['L16', 'Marie Dupont'], ['L17', 'Pierre Roux']],
  },
}

const VERSIONS: { id: Version, label: string, icon: string }[] = [
  { id: 'free', label: 'Free text', icon: 'lucide:text-cursor' },
  { id: 'mention', label: 'Mentions', icon: 'lucide:at-sign' },
]

const version = ref<Version>('free')
const trace = computed(() => TRACES[version.value])

const player = useFlowPlayer()
useFlowDemo(graph, player, { rows: 1, edgeSeconds: 0.8, thinkSeconds: 0.9, restSeconds: 3 })
const selected = ref<string | null>(null)
</script>

<template>
  <div class="pipeline my-8 flex flex-col gap-4">
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SegmentedControl v-model="version" label="How the question is typed" :options="VERSIONS" />
        <span class="text-[13px] text-neutral-500 dark:text-neutral-400">
          Two learners are called Jean: Jean Martin and Jean Moreau. The teacher means Jean Martin.
        </span>
      </div>

      <div class="flex flex-col gap-2">
        <!-- Said once the choice changes: the pills below swap their text without moving focus -->
        <div class="sr-only" role="status">
          {{ trace.leaks ? 'Free text: the names reach the model' : 'Mentions: no learner name reaches the model' }}.
          {{ trace.right ? 'The answer is about Jean Martin' : 'The answer is about Jean Moreau' }}.
        </div>
        <p class="[overflow-wrap:anywhere] m-0 rounded-lg bg-neutral-400/12 px-2.5 py-2 text-[12px] leading-[1.7]">
          <ExplorationsMentionsTagged :text="trace.prompt" triggers />
        </p>
        <div class="flex flex-wrap gap-2">
          <span class="inline-flex items-center gap-1.5 rounded-full py-[3px] pl-2 pr-2.5 text-[12px] font-medium transition-[background-color,color] duration-200 ease-[var(--ease-out)] data-[good=false]:bg-rose-500/14 data-[good=true]:bg-emerald-500/14 data-[good=false]:text-rose-700 data-[good=true]:text-emerald-700 [@media(prefers-reduced-motion:reduce)]:transition-none dark:data-[good=false]:text-rose-300 dark:data-[good=true]:text-emerald-300" :data-good="!trace.leaks">
            <FlowIconSwap :icons="['lucide:x', 'lucide:check']" :active="trace.leaks ? 0 : 1" />
            {{ trace.leaks ? 'The names of the learners reach the model' : 'No learner name reaches the model' }}
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-full py-[3px] pl-2 pr-2.5 text-[12px] font-medium transition-[background-color,color] duration-200 ease-[var(--ease-out)] data-[good=false]:bg-rose-500/14 data-[good=true]:bg-emerald-500/14 data-[good=false]:text-rose-700 data-[good=true]:text-emerald-700 [@media(prefers-reduced-motion:reduce)]:transition-none dark:data-[good=false]:text-rose-300 dark:data-[good=true]:text-emerald-300" :data-good="trace.right">
            <FlowIconSwap :icons="['lucide:x', 'lucide:check']" :active="trace.right ? 1 : 0" />
            {{ trace.right ? 'The answer is about Jean Martin' : 'The answer is about Jean Moreau' }}
          </span>
        </div>
      </div>
    </div>

    <FlowCanvas v-model:selected="selected" :movable="false" :graph="graph" :player="player" :node-width="200" label="One question through the chatbot, with its agents" :height="430">
      <template #footer="{ node, status }">
        <template v-if="node.id === 'anonymizer'">
          <span class="font-mono">names found</span>
          <span class="ml-auto text-neutral-800 font-mono transition-[color] duration-200 ease-[var(--ease-out)] dark:text-neutral-200 data-[bad=false]:text-emerald-700 data-[bad=true]:text-rose-700 dark:data-[bad=false]:text-emerald-300 dark:data-[bad=true]:text-rose-300">{{ status === 'done' ? trace.table.length : '...' }}</span>
        </template>
        <template v-else-if="node.id === 'table'">
          <span class="font-mono">entries</span>
          <span class="ml-auto text-neutral-800 font-mono transition-[color] duration-200 ease-[var(--ease-out)] dark:text-neutral-200 data-[bad=false]:text-emerald-700 data-[bad=true]:text-rose-700 dark:data-[bad=false]:text-emerald-300 dark:data-[bad=true]:text-rose-300">{{ status === 'done' ? trace.table.length : '...' }}</span>
        </template>
        <template v-else-if="node.id === 'reidentifier'">
          <span class="font-mono">puts back</span>
          <span class="ml-auto text-neutral-800 font-mono transition-[color] duration-200 ease-[var(--ease-out)] dark:text-neutral-200 data-[bad=false]:text-emerald-700 data-[bad=true]:text-rose-700 dark:data-[bad=false]:text-emerald-300 dark:data-[bad=true]:text-rose-300">{{ status === 'done' ? (trace.table.length ? `${trace.table.length} names` : 'nothing') : '...' }}</span>
        </template>
        <template v-else-if="node.id === 'reply'">
          <span class="font-mono">shows</span>
          <span class="ml-auto text-neutral-800 font-mono transition-[color] duration-200 ease-[var(--ease-out)] dark:text-neutral-200 data-[bad=false]:text-emerald-700 data-[bad=true]:text-rose-700 dark:data-[bad=false]:text-emerald-300 dark:data-[bad=true]:text-rose-300" :data-bad="status === 'idle' ? undefined : !trace.right">{{ status === 'done' ? trace.answerAbout : '...' }}</span>
        </template>
        <template v-else>
          <span class="font-mono">sees</span>
          <span class="ml-auto text-neutral-800 font-mono transition-[color] duration-200 ease-[var(--ease-out)] dark:text-neutral-200 data-[bad=false]:text-emerald-700 data-[bad=true]:text-rose-700 dark:data-[bad=false]:text-emerald-300 dark:data-[bad=true]:text-rose-300" :data-bad="status === 'idle' ? undefined : trace.leaks">{{ trace.sees }}</span>
        </template>
      </template>

      <template #inspector="{ node }">
        <div v-if="node.id === 'anonymizer'" class="flex flex-col gap-3">
          <div class="text-[13.5px] text-neutral-900 font-medium leading-[1.4] dark:text-neutral-100">
            {{ version === 'free' ? 'Names stay as typed.' : 'Learners become labels.' }}
          </div>
          <section class="flex flex-col gap-1.5">
            <div class="text-[11px] text-neutral-500 font-medium leading-none dark:text-neutral-400">
              Sends on
            </div>
            <div class="[overflow-wrap:anywhere] rounded-lg bg-neutral-400/12 px-2.5 py-2 text-[12px] leading-[1.7]">
              <ExplorationsMentionsTagged :text="trace.sent" />
            </div>
          </section>
          <div class="text-[12px] text-neutral-500 leading-normal dark:text-neutral-400">
            {{ version === 'free' ? 'Matching the roster by text fails on two Jeans.' : 'Subjects keep their name.' }}
          </div>
        </div>

        <div v-else-if="node.id === 'table'" class="flex flex-col gap-3">
          <div class="text-[13.5px] text-neutral-900 font-medium leading-[1.4] dark:text-neutral-100">
            {{ version === 'free' ? 'Empty.' : 'Never leaves the school.' }}
          </div>
          <section v-if="trace.table.length" class="flex flex-col gap-1.5">
            <div class="tabular-nums grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
              <template v-for="row in trace.table" :key="row[0]">
                <span class="font-mono">{{ row[0] }}</span>
                <span class="font-mono">{{ row[1] }}</span>
              </template>
            </div>
          </section>
        </div>

        <div v-else-if="node.id === 'clarification'" class="flex flex-col gap-3">
          <div class="text-[13.5px] text-neutral-900 font-medium leading-[1.4] dark:text-neutral-100">
            Rewrites the question.
          </div>
          <section class="flex flex-col gap-1.5">
            <div class="text-[11px] text-neutral-500 font-medium leading-none dark:text-neutral-400">
              Hands on
            </div>
            <div class="[overflow-wrap:anywhere] rounded-lg bg-neutral-400/12 px-2.5 py-2 text-[12px] leading-[1.7]">
              <ExplorationsMentionsTagged :text="trace.rewritten" />
            </div>
          </section>
          <div class="text-[12px] text-neutral-500 leading-normal dark:text-neutral-400">
            SQL-gen reads this version: the tags must survive it.
          </div>
        </div>

        <div v-else-if="node.id === 'sql'" class="flex flex-col gap-3">
          <div class="text-[13.5px] text-neutral-900 font-medium leading-[1.4] dark:text-neutral-100">
            Writes and runs the SQL.
          </div>
          <section class="flex flex-col gap-1.5">
            <pre class="m-0 rounded-lg bg-neutral-400/12 px-0 py-2 text-[11px] leading-[1.6]"><code><span v-for="(line, index) in trace.sql" :key="index" class="[overflow-wrap:anywhere] [text-indent:-2ch] block whitespace-pre-wrap pl-[calc(10px_+_2ch)] pr-2.5 data-[key=exact]:bg-emerald-500/18 data-[key=guess]:bg-rose-500/16" :data-key="line.key ? (trace.right ? 'exact' : 'guess') : undefined">{{ line.text }}</span></code></pre>
          </section>
          <div class="text-[12px] text-neutral-500 leading-normal dark:text-neutral-400">
            {{ version === 'free' ? 'The names are matched by guess.' : 'It filters on ids: nothing to guess.' }}
          </div>
        </div>

        <div v-else-if="node.id === 'explanation'" class="flex flex-col gap-3">
          <div class="text-[13.5px] text-neutral-900 font-medium leading-[1.4] dark:text-neutral-100">
            Turns the rows into a sentence.
          </div>
          <section class="flex flex-col gap-1.5">
            <div class="text-[11px] text-neutral-500 font-medium leading-none dark:text-neutral-400">
              Rows
            </div>
            <div class="tabular-nums grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
              <template v-for="row in trace.rows" :key="row[0]">
                <span class="font-mono">{{ row[0] }}</span>
                <span class="font-mono">{{ row[1] }}</span>
              </template>
            </div>
          </section>
          <section class="flex flex-col gap-1.5">
            <div class="text-[11px] text-neutral-500 font-medium leading-none dark:text-neutral-400">
              Writes
            </div>
            <div class="flex items-start gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-medium leading-[18px] transition-[background-color,color] duration-200 ease-[var(--ease-out)] data-[right=false]:bg-rose-500/14 data-[right=neutral]:bg-neutral-400/14 data-[right=true]:bg-emerald-500/14 data-[right=false]:text-rose-700 data-[right=true]:text-emerald-700 dark:data-[right=false]:text-rose-300 dark:data-[right=true]:text-emerald-300" :data-right="trace.right">
              <span class="grid h-[18px] place-items-center"><Icon :name="trace.right ? 'lucide:check' : 'lucide:x'" class="size-3.5" aria-hidden="true" /></span>
              <span>{{ trace.written }}</span>
            </div>
          </section>
        </div>

        <div v-else-if="node.id === 'evaluator'" class="flex flex-col gap-3">
          <div class="text-[13.5px] text-neutral-900 font-medium leading-[1.4] dark:text-neutral-100">
            Checks the answer is on topic.
          </div>
          <div class="flex items-start gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-medium leading-[18px] transition-[background-color,color] duration-200 ease-[var(--ease-out)] data-[right=false]:bg-rose-500/14 data-[right=neutral]:bg-neutral-400/14 data-[right=true]:bg-emerald-500/14 data-[right=false]:text-rose-700 data-[right=true]:text-emerald-700 dark:data-[right=false]:text-rose-300 dark:data-[right=true]:text-emerald-300" data-right="neutral">
            <span class="grid h-[18px] place-items-center"><Icon name="lucide:check" class="size-3.5" aria-hidden="true" /></span>
            <span>Relevant</span>
          </div>
          <div class="text-[12px] text-neutral-500 leading-normal dark:text-neutral-400">
            It does not check the data: a wrong Jean passes.
          </div>
        </div>

        <div v-else-if="node.id === 'reidentifier'" class="flex flex-col gap-3">
          <div class="text-[13.5px] text-neutral-900 font-medium leading-[1.4] dark:text-neutral-100">
            {{ version === 'free' ? 'Nothing to put back.' : 'Labels become names again.' }}
          </div>
          <section class="flex flex-col gap-1.5">
            <div class="text-[11px] text-neutral-500 font-medium leading-none dark:text-neutral-400">
              Hands on
            </div>
            <div class="[overflow-wrap:anywhere] rounded-lg bg-neutral-400/12 px-2.5 py-2 text-[12px] leading-[1.7]">
              {{ trace.shown }}
            </div>
          </section>
          <div v-if="version === 'mention'" class="text-[12px] text-neutral-500 leading-normal dark:text-neutral-400">
            The model must keep each label as given.
          </div>
        </div>

        <div v-else-if="node.id === 'reply'" class="flex flex-col gap-3">
          <div class="text-[13.5px] text-neutral-900 font-medium leading-[1.4] dark:text-neutral-100">
            Sent if the Evaluator accepts it.
          </div>
          <div class="flex items-start gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-medium leading-[18px] transition-[background-color,color] duration-200 ease-[var(--ease-out)] data-[right=false]:bg-rose-500/14 data-[right=neutral]:bg-neutral-400/14 data-[right=true]:bg-emerald-500/14 data-[right=false]:text-rose-700 data-[right=true]:text-emerald-700 dark:data-[right=false]:text-rose-300 dark:data-[right=true]:text-emerald-300" :data-right="trace.right">
            <span class="grid h-[18px] place-items-center"><Icon :name="trace.right ? 'lucide:check' : 'lucide:x'" class="size-3.5" aria-hidden="true" /></span>
            <span>{{ trace.shown }}</span>
          </div>
          <div class="text-[12px] text-neutral-500 leading-normal dark:text-neutral-400">
            {{ trace.right ? 'Otherwise: a fallback message.' : 'It passes, and nothing warns of the wrong Jean.' }}
          </div>
        </div>
      </template>
    </FlowCanvas>
  </div>
</template>
