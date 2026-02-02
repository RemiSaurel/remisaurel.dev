export interface Publication {
  date: string;
  title: string;
  authors: string[];
  award?: string;
  subtitle?: string;
  venue: string;
  url?: string;
  image?: string;
}

const defaultAuthors = ['Rémi Saurel', 'Franck Silvestre', 'Jean-Baptiste Raclet', 'Emmanuel Lescure'];

export const publications: Publication[] = [
  {
    date: 'Apr. 2026',
    title: 'Mind the Gap: Benchmarking AI vs. Human in Automatic Short Answer Grading',
    authors: defaultAuthors,
    subtitle: 'A benchmarking tool for AI systems to evaluate their performance on several configurations (model, prompts, architecture).',
    venue: 'LAK 2026',
    url: "https://hal.science/hal-05481914",
    image: '/publications/lak2026.jpg'
  },
  {
    date: 'Sep. 2025',
    title: 'MAESTRO: Multi-Agent Educational System for Tutoring and Recommendation Orchestration',
    authors: defaultAuthors,
    award: '🏆 Best Demo Nominee',
    subtitle: 'A multi-agent system to provide teachers with AI-powered recommendations based on learning analytics.',
    venue: 'ECTEL 2025',
    url: 'https://hal.science/hal-05141354',
    image: '/publications/ectel2025.jpg'
  },
  {
    date: 'Jun. 2025',
    title: 'Responsible Integration of Generative AI in Education: Proposal for a Strategic Action Plan Guided by Ethical Risk Considerations',
    authors: defaultAuthors,
    subtitle: 'A strategic action plan for the responsible integration of generative AI in educational contexts, addressing ethical risks and challenges.',
    venue: 'EIAH 2025',
    url: 'https://hal.science/hal-05070808',
    image: '/publications/eiah2025.jpg'
  },
];
