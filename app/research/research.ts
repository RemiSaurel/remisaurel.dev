import type { Publication } from '~/publications/publications'
import { publications } from '~/publications/publications'

export type ClusterId = 'la' | 'hai' | 'aied' | 'ethics'

export interface Cluster {
  id: ClusterId
  label: string
  description: string
}

/**
 * A node of the research landscape.
 *
 * - `theme` nodes are the filled anchors, one per cluster.
 * - `topic` nodes are the sub-themes orbiting them.
 * - `paper` nodes are cards resolved from `publications.ts`.
 * - `hub` is the single neutral node every cluster hangs off.
 *
 * `clusters` drives both the colour and the region(s) a node belongs to.
 * `x` / `y` are placed by `computeLayout` below, never by hand: to add or
 * remove a node, only touch `rawNodes` and `researchLinks`.
 */
export interface ResearchNode {
  id: string
  label: string
  kind: 'theme' | 'topic' | 'paper' | 'hub'
  clusters: ClusterId[]
  x: number
  y: number
  /** Max label width in px, forces the node to wrap on two lines. */
  maxW?: number
  description?: string
  /** Id of the matching entry in `publications.ts`, used to resolve venue/url. */
  publication?: string
  venue?: string
  url?: string
}

export interface ResearchLink {
  from: string
  to: string
}

/** Design space of the graph. Node coordinates live in this system. */
export const VIEW_W = 1000
export const VIEW_H = 460

export const clusters: Cluster[] = [
  {
    id: 'la',
    label: 'Learning Analytics',
    description: 'Turning traces of learning activity into indicators teachers can read, trust and act on.',
  },
  {
    id: 'hai',
    label: 'Human-AI Interaction',
    description: 'Designing with teachers and learners rather than for them, and studying what they do with AI.',
  },
  {
    id: 'aied',
    label: 'AI in Education',
    description: 'Assessing what generative models can and cannot do when they grade, tutor or recommend.',
  },
  {
    id: 'ethics',
    label: 'AI & Ethics',
    description: 'Naming the risks of generative AI in schools and turning them into actionable strategy.',
  },
]

interface RawNode {
  id: string
  label: string
  kind: ResearchNode['kind']
  clusters: ClusterId[]
  maxW?: number
  description?: string
  publication?: string
}

/** Everything to edit to add, remove or re-describe an item on the graph. */
const rawNodes: RawNode[] = [
  {
    id: 'tel',
    label: 'Technology-Enhanced Learning',
    kind: 'hub',
    clusters: [],
    maxW: 132,
    description: 'The field all of this sits in: K-12 education, and the tools that mediate it.',
  },

  // ── Learning Analytics ───────────────────────────────────────────────
  {
    id: 'la',
    label: 'Learning Analytics',
    kind: 'theme',
    clusters: ['la'],
    description: 'Collecting and modelling learning traces.',
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    kind: 'topic',
    clusters: ['la'],
    description: 'Teacher-facing dashboards for K-12, from indicator selection to visual grammar.',
  },
  {
    id: 'indicators',
    label: 'Indicators & Metrics',
    kind: 'topic',
    clusters: ['la'],
    maxW: 120,
    description: 'Which metrics actually inform a pedagogical decision, and which only look useful.',
  },
  {
    id: 'rjceiah',
    label: 'Co-designing Dashboards',
    kind: 'paper',
    clusters: ['la', 'hai'],
    maxW: 150,
    publication: 'rjceiah-2026',
  },

  // ── Human-AI Interaction ─────────────────────────────────────────────
  {
    id: 'hai',
    label: 'Human-AI Interaction',
    kind: 'theme',
    clusters: ['hai'],
    maxW: 130,
    description: 'What teachers and learners actually do with an AI system once it is in their hands.',
  },
  {
    id: 'co-design',
    label: 'Participatory Co-design',
    kind: 'topic',
    clusters: ['hai'],
    maxW: 106,
    description: 'Prototypes and chatbots as elicitation devices to surface teachers\' real needs.',
  },
  {
    id: 'decisions',
    label: 'Teacher Decisions',
    kind: 'topic',
    clusters: ['hai'],
    description: 'What teachers do with what a dashboard tells them, and what it takes to act on it.',
  },

  // ── AI in Education ──────────────────────────────────────────────────
  {
    id: 'aied',
    label: 'AI in Education',
    kind: 'theme',
    clusters: ['aied'],
    description: 'Generative models as a material for educational tools, with their failure modes.',
  },
  {
    id: 'llm',
    label: 'Large Language Models',
    kind: 'topic',
    clusters: ['aied'],
    maxW: 118,
    description: 'Prompting, architecture and evaluation choices, and how much each one really moves the needle.',
  },
  {
    id: 'multi-agent',
    label: 'Multi-Agent Systems',
    kind: 'topic',
    clusters: ['aied'],
    maxW: 112,
    description: 'Orchestrating specialised agents to answer to specific use cases.',
  },
  {
    id: 'asag',
    label: 'Automatic Short Answer Grading',
    kind: 'topic',
    clusters: ['aied'],
    maxW: 132,
    description: 'Grading open-ended answers automatically, and measuring the gap with human graders.',
  },
  {
    id: 'ectel',
    label: 'MAESTRO',
    kind: 'paper',
    clusters: ['aied'],
    publication: 'ectel-2025',
  },
  {
    id: 'lak',
    label: 'Mind the Gap',
    kind: 'paper',
    clusters: ['aied'],
    publication: 'lak-2026',
  },

  // ── AI & Ethics ──────────────────────────────────────────────────────
  {
    id: 'eiah',
    label: 'Responsible GenAI Integration',
    kind: 'paper',
    clusters: ['ethics', 'aied'],
    maxW: 150,
    publication: 'eiah-2025',
  },
  {
    id: 'ethics',
    label: 'AI & Ethics',
    kind: 'theme',
    clusters: ['ethics'],
    description: 'Making risk an explicit design input rather than an afterthought.',
  },
  {
    id: 'responsible-ai',
    label: 'Responsible AI',
    kind: 'topic',
    clusters: ['ethics'],
    description: 'Fairness, transparency and learner / teacher autonomy in the specific setting of a classroom.',
  },
  {
    id: 'governance',
    label: 'Policy & Governance',
    kind: 'topic',
    clusters: ['ethics'],
    maxW: 122,
    description: 'Translating ethical concerns into strategic action plans.',
  },
]

export const researchLinks: ResearchLink[] = [
  // Learning Analytics
  { from: 'la', to: 'dashboards' },
  { from: 'la', to: 'indicators' },
  { from: 'dashboards', to: 'indicators' },
  { from: 'la', to: 'rjceiah' },
  { from: 'dashboards', to: 'rjceiah' },
  { from: 'indicators', to: 'rjceiah' },
  { from: 'la', to: 'ectel' },
  { from: 'indicators', to: 'ectel' },

  // Human-AI Interaction
  { from: 'hai', to: 'co-design' },
  { from: 'hai', to: 'decisions' },
  { from: 'co-design', to: 'decisions' },
  { from: 'hai', to: 'rjceiah' },
  { from: 'co-design', to: 'rjceiah' },
  { from: 'decisions', to: 'dashboards' },

  // AI in Education
  { from: 'aied', to: 'llm' },
  { from: 'aied', to: 'multi-agent' },
  { from: 'aied', to: 'asag' },
  { from: 'llm', to: 'multi-agent' },
  { from: 'llm', to: 'asag' },
  { from: 'multi-agent', to: 'ectel' },
  { from: 'llm', to: 'ectel' },
  { from: 'asag', to: 'lak' },
  { from: 'llm', to: 'lak' },
  { from: 'aied', to: 'eiah' },

  // AI & Ethics
  { from: 'ethics', to: 'responsible-ai' },
  { from: 'ethics', to: 'governance' },
  { from: 'responsible-ai', to: 'governance' },
  { from: 'ethics', to: 'eiah' },
  { from: 'responsible-ai', to: 'eiah' },

  // Everything hangs off the hub
  { from: 'tel', to: 'la' },
  { from: 'tel', to: 'hai' },
  { from: 'tel', to: 'aied' },
  { from: 'tel', to: 'ethics' },
]

/* ── Layout ────────────────────────────────────────────────────────────
 * Hand-placed centres, in design units (`VIEW_W` × `VIEW_H`). Composed by
 * hand rather than force-directed: the arrangement carries meaning the
 * springs cannot know about (papers reading left-to-right within their
 * cluster, the hub bridging the four regions, room left for the popover
 * on either side). The client only nudges these apart when a narrow
 * viewport makes two boxes actually overlap, so what is written here is
 * what renders at desktop width.
 *
 * To move a node, edit its pair below. To add one, append it here too:
 * a node missing from this map throws at import time rather than landing
 * silently at the origin.
 */

interface Vec { x: number, y: number }

const LAYOUT: Record<string, Vec> = {
  tel: { x: 499, y: 297 },

  // Learning Analytics
  la: { x: 337, y: 92 },
  indicators: { x: 160, y: 35 },
  dashboards: { x: 54, y: 100 },
  rjceiah: { x: 185, y: 200 },

  // Human-AI Interaction
  hai: { x: 287, y: 380 },
  'co-design': { x: 163, y: 339 },
  decisions: { x: 94, y: 408 },

  // AI in Education
  aied: { x: 644, y: 148 },
  llm: { x: 746, y: 72 },
  'multi-agent': { x: 586, y: 101 },
  asag: { x: 905, y: 144 },
  ectel: { x: 551, y: 44 },
  lak: { x: 914, y: 43 },

  // AI & Ethics
  ethics: { x: 711, y: 357 },
  eiah: { x: 789, y: 227 },
  'responsible-ai': { x: 894, y: 357 },
  governance: { x: 841, y: 423 },
}

function findPublication(id: string): Publication | undefined {
  return publications.find(p => p.id === id)
}

/** Nodes placed by `LAYOUT`, with venue / url / description resolved from `publications.ts`. */
export const researchNodes: ResearchNode[] = rawNodes.map((node) => {
  const position = LAYOUT[node.id]
  if (!position)
    throw new Error(`[research] node "${node.id}" has no position in LAYOUT`)
  const { x, y } = position
  const pub = node.publication ? findPublication(node.publication) : undefined

  return {
    ...node,
    x,
    y,
    venue: pub?.venue,
    url: pub?.url,
    description: node.description ?? pub?.subtitle,
  }
})
