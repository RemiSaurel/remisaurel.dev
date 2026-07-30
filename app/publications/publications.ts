export interface Publication {
  /** Short stable slug, used to reference this publication from elsewhere (e.g. the research graph). */
  id: string
  date: Date
  title: string
  authors: string[]
  award?: string
  subtitle?: string
  venue: string
  url?: string
  image?: string
}

const defaultAuthors = ['Rémi Saurel', 'Franck Silvestre', 'Jean-Baptiste Raclet', 'Emmanuel Lescure']

export const publications: Publication[] = [
    {
    id: 'ectel-2026',
    date: new Date('2026-09-16'),
    title: 'Spaced Testing in French Secondary Education: A Quantitative Analysis of Students’ Revision Practices Using an Interactive System',
    authors: ['Denis Ollivier', 'Rémi Saurel', 'Jean-Baptiste Raclet', 'Emmanuel Lescure', 'Julien Broisin', 'Franck Silvestre'],
    subtitle: 'A quantitative analysis during the experimentation of Denis\' PhD.',
    venue: 'ECTEL 2026',
    image: '/publications/ectel2026.avif',
  },
  {
    id: 'rjceiah-2026',
    date: new Date('2026-06-01'),
    title: 'Une double approche pour la co-conception de tableaux de bord d\'apprentissage : validation avec des prototypes, exploration avec un chatbot',
    authors: ['Rémi Saurel', 'Esther Félix', 'Franck Silvestre', 'Jean-Baptiste Raclet', 'Emmanuel Lescure'],
    award: '🏆 Best Paper Nominee',
    subtitle: 'An approach combining prototype validation and chatbot exploration to co-design Learning Analytics Dashboards with teachers.',
    venue: 'RJC EIAH 2026',
    url: 'https://hal.science/hal-05641999',
    image: '/publications/rjceiah2026.avif',
  },
  {
    id: 'lak-2026',
    date: new Date('2026-04-01'),
    title: 'Mind the Gap: Benchmarking AI vs. Human in Automatic Short Answer Grading',
    authors: defaultAuthors,
    subtitle: 'A benchmarking tool for AI systems to evaluate their performance on several configurations (model, prompts, architecture).',
    venue: 'LAK 2026',
    url: 'https://hal.science/hal-05481914',
    image: '/publications/lak2026.jpg',
  },
  {
    id: 'ectel-2025',
    date: new Date('2025-09-01'),
    title: 'MAESTRO: Multi-Agent Educational System for Tutoring and Recommendation Orchestration',
    authors: defaultAuthors,
    award: '🏆 Best Demo Nominee',
    subtitle: 'A multi-agent system to provide teachers with AI-powered recommendations based on learning analytics.',
    venue: 'ECTEL 2025',
    url: 'https://hal.science/hal-05141354',
    image: '/publications/ectel2025.jpg',
  },
  {
    id: 'eiah-2025',
    date: new Date('2025-06-01'),
    title: 'Intégration responsable de l\'IA Générative dans l\'Éducation : proposition d\'un plan d\'actions stratégiques dirigé par les risques liés aux questions éthiques',
    authors: defaultAuthors,
    subtitle: 'A strategic action plan for the responsible integration of generative AI in educational contexts, addressing ethical risks and challenges.',
    venue: 'EIAH 2025',
    url: 'https://hal.science/hal-05070808',
    image: '/publications/eiah2025.jpg',
  },
]
