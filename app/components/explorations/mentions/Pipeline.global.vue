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
        <p class="quote m-0 text-[13px]">
          <ExplorationsMentionsTagged :text="trace.prompt" triggers />
        </p>
        <div class="flex flex-wrap gap-2">
          <span class="outcome" :data-good="!trace.leaks">
            <FlowIconSwap :icons="['lucide:x', 'lucide:check']" :active="trace.leaks ? 0 : 1" />
            {{ trace.leaks ? 'The names of the learners reach the model' : 'No learner name reaches the model' }}
          </span>
          <span class="outcome" :data-good="trace.right">
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
          <span class="value ml-auto font-mono">{{ status === 'done' ? trace.table.length : '...' }}</span>
        </template>
        <template v-else-if="node.id === 'table'">
          <span class="font-mono">entries</span>
          <span class="value ml-auto font-mono">{{ status === 'done' ? trace.table.length : '...' }}</span>
        </template>
        <template v-else-if="node.id === 'reidentifier'">
          <span class="font-mono">puts back</span>
          <span class="value ml-auto font-mono">{{ status === 'done' ? (trace.table.length ? `${trace.table.length} names` : 'nothing') : '...' }}</span>
        </template>
        <template v-else-if="node.id === 'reply'">
          <span class="font-mono">shows</span>
          <span class="value ml-auto font-mono" :data-bad="status === 'idle' ? undefined : !trace.right">{{ status === 'done' ? trace.answerAbout : '...' }}</span>
        </template>
        <template v-else>
          <span class="font-mono">sees</span>
          <span class="value ml-auto font-mono" :data-bad="status === 'idle' ? undefined : trace.leaks">{{ trace.sees }}</span>
        </template>
      </template>

      <template #inspector="{ node }">
        <div v-if="node.id === 'anonymizer'" class="inspect">
          <div class="lead">
            {{ version === 'free' ? 'Names stay as typed.' : 'Learners become labels.' }}
          </div>
          <section class="section">
            <div class="eyebrow">
              Sends on
            </div>
            <div class="quote">
              <ExplorationsMentionsTagged :text="trace.sent" />
            </div>
          </section>
          <div class="note">
            {{ version === 'free' ? 'Matching the roster by text fails on two Jeans.' : 'Subjects keep their name.' }}
          </div>
        </div>

        <div v-else-if="node.id === 'table'" class="inspect">
          <div class="lead">
            {{ version === 'free' ? 'Empty.' : 'Never leaves the school.' }}
          </div>
          <section v-if="trace.table.length" class="section">
            <div class="tabular-nums grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
              <template v-for="row in trace.table" :key="row[0]">
                <span class="font-mono">{{ row[0] }}</span>
                <span class="font-mono">{{ row[1] }}</span>
              </template>
            </div>
          </section>
        </div>

        <div v-else-if="node.id === 'clarification'" class="inspect">
          <div class="lead">
            Rewrites the question.
          </div>
          <section class="section">
            <div class="eyebrow">
              Hands on
            </div>
            <div class="quote">
              <ExplorationsMentionsTagged :text="trace.rewritten" />
            </div>
          </section>
          <div class="note">
            SQL-gen reads this version: the tags must survive it.
          </div>
        </div>

        <div v-else-if="node.id === 'sql'" class="inspect">
          <div class="lead">
            Writes and runs the SQL.
          </div>
          <section class="section">
            <pre class="sql m-0"><code><span v-for="(line, index) in trace.sql" :key="index" class="line" :data-key="line.key ? (trace.right ? 'exact' : 'guess') : undefined">{{ line.text }}</span></code></pre>
          </section>
          <div class="note">
            {{ version === 'free' ? 'The names are matched by guess.' : 'It filters on ids: nothing to guess.' }}
          </div>
        </div>

        <div v-else-if="node.id === 'explanation'" class="inspect">
          <div class="lead">
            Turns the rows into a sentence.
          </div>
          <section class="section">
            <div class="eyebrow">
              Rows
            </div>
            <div class="tabular-nums grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-xs">
              <template v-for="row in trace.rows" :key="row[0]">
                <span class="font-mono">{{ row[0] }}</span>
                <span class="font-mono">{{ row[1] }}</span>
              </template>
            </div>
          </section>
          <section class="section">
            <div class="eyebrow">
              Writes
            </div>
            <div class="answer" :data-right="trace.right">
              <span class="mark"><Icon :name="trace.right ? 'lucide:check' : 'lucide:x'" class="size-3.5" aria-hidden="true" /></span>
              <span>{{ trace.written }}</span>
            </div>
          </section>
        </div>

        <div v-else-if="node.id === 'evaluator'" class="inspect">
          <div class="lead">
            Checks the answer is on topic.
          </div>
          <div class="answer" data-right="neutral">
            <span class="mark"><Icon name="lucide:check" class="size-3.5" aria-hidden="true" /></span>
            <span>Relevant</span>
          </div>
          <div class="note">
            It does not check the data: a wrong Jean passes.
          </div>
        </div>

        <div v-else-if="node.id === 'reidentifier'" class="inspect">
          <div class="lead">
            {{ version === 'free' ? 'Nothing to put back.' : 'Labels become names again.' }}
          </div>
          <section class="section">
            <div class="eyebrow">
              Hands on
            </div>
            <div class="quote">
              {{ trace.shown }}
            </div>
          </section>
          <div v-if="version === 'mention'" class="note">
            The model must keep each label as given.
          </div>
        </div>

        <div v-else-if="node.id === 'reply'" class="inspect">
          <div class="lead">
            Sent if the Evaluator accepts it.
          </div>
          <div class="answer" :data-right="trace.right">
            <span class="mark"><Icon :name="trace.right ? 'lucide:check' : 'lucide:x'" class="size-3.5" aria-hidden="true" /></span>
            <span>{{ trace.shown }}</span>
          </div>
          <div class="note">
            {{ trace.right ? 'Otherwise: a fallback message.' : 'It passes, and nothing warns of the wrong Jean.' }}
          </div>
        </div>
      </template>
    </FlowCanvas>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .outcome {
    transition: none;
  }
}

.quote {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgb(163 163 163 / 0.12);
  font-size: 12px;
  line-height: 1.7;
  overflow-wrap: anywhere;
}

.outcome {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  transition:
    background-color 200ms var(--ease-out),
    color 200ms var(--ease-out);
}

.outcome[data-good='true'] {
  background: rgb(16 185 129 / 0.14);
  color: rgb(4 120 87);
}

.outcome[data-good='false'] {
  background: rgb(244 63 94 / 0.14);
  color: rgb(190 18 60);
}

.dark .outcome[data-good='true'] {
  color: rgb(110 231 183);
}

.dark .outcome[data-good='false'] {
  color: rgb(253 164 175);
}

/* What an agent sees, in the footer of its node: a name is a leak, an id is not */
.value {
  color: rgb(38 38 38);
  transition: color 200ms var(--ease-out);
}

.dark .value {
  color: rgb(229 229 229);
}

.value[data-bad='true'] {
  color: rgb(190 18 60);
}

.value[data-bad='false'] {
  color: rgb(4 120 87);
}

.dark .value[data-bad='true'] {
  color: rgb(253 164 175);
}

.dark .value[data-bad='false'] {
  color: rgb(110 231 183);
}

.sql {
  padding: 8px 0;
  border-radius: 8px;
  background: rgb(163 163 163 / 0.12);
  font-size: 11px;
  line-height: 1.6;
}

/* A long line wraps under its start instead of scrolling: the highlight then always covers the whole line */
.line {
  display: block;
  padding: 0 10px 0 calc(10px + 2ch);
  text-indent: -2ch;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

/* The lines that decide who the query is about: a guess from words, or the ids of the list */
.line[data-key='guess'] {
  background: rgb(244 63 94 / 0.16);
}

.line[data-key='exact'] {
  background: rgb(16 185 129 / 0.18);
}

.inspect {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.lead {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
  color: rgb(23 23 23);
}

.dark .lead {
  color: rgb(245 245 245);
}

.section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.eyebrow {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  color: rgb(115 115 115);
}

.dark .eyebrow {
  color: rgb(163 163 163);
}

.note {
  font-size: 12px;
  line-height: 1.5;
  color: rgb(115 115 115);
}

.dark .note {
  color: rgb(163 163 163);
}

.answer {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12.5px;
  line-height: 18px;
}

/* As tall as one line of text, so the icon centres on the first line, whatever the width */
.mark {
  display: grid;
  height: 18px;
  place-items: center;
}

.answer {
  font-weight: 500;
  transition:
    background-color 200ms var(--ease-out),
    color 200ms var(--ease-out);
}

.answer[data-right='true'] {
  background: rgb(16 185 129 / 0.14);
  color: rgb(4 120 87);
}

.answer[data-right='false'] {
  background: rgb(244 63 94 / 0.14);
  color: rgb(190 18 60);
}

.dark .answer[data-right='true'] {
  color: rgb(110 231 183);
}

.dark .answer[data-right='false'] {
  color: rgb(253 164 175);
}

.answer[data-right='neutral'] {
  background: rgb(163 163 163 / 0.14);
}
</style>
