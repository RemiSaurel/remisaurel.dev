export interface Publication {
  date: string
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
    date: 'Jun. 2026',
    title: 'Une double approche pour la co-conception de tableaux de bord d\'apprentissage : validation avec des prototypes, exploration avec un chatbot',
    authors: ['Rémi Saurel', 'Esther Félix', 'Franck Silvestre', 'Jean-Baptiste Raclet', 'Emmanuel Lescure'],
    award: '🏆 Best Paper Nominee',
    subtitle: 'An approach combining prototype validation and chatbot exploration to co-design Learning Analytics Dashboards with teachers.',
    venue: 'RJC EIAH 2026',
    url: "https://hal.science/hal-05641999",
    image: '/publications/rjceiah2026.avif',
  },
  {
    date: 'Apr. 2026',
    title: 'Mind the Gap: Benchmarking AI vs. Human in Automatic Short Answer Grading',
    authors: defaultAuthors,
    subtitle: 'A benchmarking tool for AI systems to evaluate their performance on several configurations (model, prompts, architecture).',
    venue: 'LAK 2026',
    url: 'https://hal.science/hal-05481914',
    image: '/publications/lak2026.jpg',
  },
  {
    date: 'Sep. 2025',
    title: 'MAESTRO: Multi-Agent Educational System for Tutoring and Recommendation Orchestration',
    authors: defaultAuthors,
    award: '🏆 Best Demo Nominee',
    subtitle: 'A multi-agent system to provide teachers with AI-powered recommendations based on learning analytics.',
    venue: 'ECTEL 2025',
    url: 'https://hal.science/hal-05141354',
    image: '/publications/ectel2025.jpg',
  },
  {
    date: 'Jun. 2025',
    title: 'Intégration responsable de l\'IA Générative dans l\'Éducation : proposition d\'un plan d\'actions stratégiques dirigé par les risques liés aux questions éthiques',
    authors: defaultAuthors,
    subtitle: 'A strategic action plan for the responsible integration of generative AI in educational contexts, addressing ethical risks and challenges.',
    venue: 'EIAH 2025',
    url: 'https://hal.science/hal-05070808',
    image: '/publications/eiah2025.jpg',
  },
]
