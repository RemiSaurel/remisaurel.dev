export type FailureType = 'paper' | 'experiment' | 'project'

export interface Failure {
  /** Short stable slug */
  id: string
  type: FailureType
  date: Date
  title: string
  /** What it was / what happened */
  description: string
  /** What I learned, or what happened next — revealed on hover/tap */
  lesson: string
  /** Optional link, e.g. the eventually-accepted paper or the project repo */
  url?: string
}

export const TYPE_LABELS: Record<FailureType, string> = {
  paper: 'Rejected',
  experiment: 'Failed',
  project: 'Abandoned',
}

export const failures: Failure[] = [
  {
    id: 'first-experimentation',
    type: 'experiment',
    date: new Date('2026-03-01'),
    title: 'Protocol wasn\'t strict enough for our first experiment, forcing us to shrink our data sample',
    description: 'We weren\'t strict enough on the protocol, so we had to discard some student and teacher data.',
    lesson: 'Anticipate better, and be clearer about the protocol and what\'s expected, required, mandatory, or forbidden.',
  },
  {
    id: 'first-hci-submission',
    type: 'paper',
    date: new Date('2026-01-30'),
    title: 'Co-designing learning analytics dashboards with teachers',
    description: 'A first attempt at describing our co-design method with teachers, with an original method using a chatbot to have a dual approach.',
    lesson: 'Reviewer 2 hit. More seriously, we didn\'t know what it took to get accepted at this conference. Now we know a bit more.',
  },
  {
    id: 'risk-integration',
    type: 'paper',
    date: new Date('2025-03-01'),
    title: 'Risk Integration Paper',
    description: 'Article was not accepted despite the interesting idea around integrating risk management into the Design-Based Research method.',
    lesson: 'Be more targeted and specific about the actual contribution of a paper.',
  },
  {
    id: 'memoire-app',
    type: 'project',
    date: new Date('2024-08-01'),
    title: 'memoire, a spaced-repetition app',
    description: 'A side project to build a flashcards app based on spaced-repetition research.',
    lesson: 'Shipping and maintaining a web app on top of a PhD, doesn\'t scale. The spaced-repetition logic lives on in later research discussions instead.',
    url: 'https://github.com/memoire-app',
  },
]
