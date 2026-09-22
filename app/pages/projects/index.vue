<script setup lang="ts">
import type { TechKey } from '~/projects/techs'

export interface Project {
  title: string
  description: string
  icon?: string
  links?: {
    github?: string
    demo?: string
  }
  date: number // YYYY
  stack?: TechKey[]
}

const PROJECTS: Project[] = [
  {
    title: 'lycees-france',
    description:
      'A dataset of all the high schools in France, with their location and some other information. The data is collected from the official website of the Ministry of Education.',
    icon: '🗺️',
    links: {
      github: 'https://github.com/RemiSaurel/french-schools-map',
      demo: 'https://remisaurel.github.io/lycees-france/',
    },
    date: 2026,
    stack: ['nuxt', 'typescript', 'tailwind'],
  },
  {
    title: 'colleges-france',
    description:
      'A dataset of all the middle schools in France, with their location and some other information. The data is collected from the official website of the Ministry of Education.',
    icon: '🏫',
    links: {
      github: 'https://github.com/RemiSaurel/french-schools-map',
      demo: 'https://remisaurel.github.io/colleges-france/',
    },
    date: 2026,
    stack: ['nuxt', 'typescript', 'tailwind'],
  },
  {
    title: 'paper-web',
    description:
      'A template to publish scientific papers on the web. Built with Nuxt Content.',
    icon: '📃',
    links: {
      github: 'https://github.com/RemiSaurel/paper-web',
      demo: 'https://remisaurel.github.io/paper-web/',
    },
    date: 2026,
    stack: ['nuxt', 'typescript', 'tailwind'],
  },
  {
    title: 'evalbuddy',
    description:
      'A tool to easily evaluate answers',
    icon: '🧑‍🏫',
    links: {
      github: 'https://github.com/RemiSaurel/evalbuddy',
      demo: 'https://evalbuddy.remisaurel.dev/',
    },
    date: 2025,
    stack: ['nuxt', 'typescript', 'tailwind'],
  },
  {
    title: 'littleman',
    description:
      'A simple Discord bot to fetch papers from arXiv. .',
    icon: '🤖',
    links: {
      github: 'https://github.com/RemiSaurel/littleman',
    },
    date: 2025,
    stack: ['typescript', 'discord'],
  },
  {
    title: 'memoire',
    description: 'Flashcards app. based on research recommendations.',
    icon: '🧠',
    links: {
      github: 'https://github.com/memoire-app',
    },
    date: 2024,
    stack: ['nuxt', 'adonisjs', 'docker'],
  },
  {
    title: 'elaasticatalog',
    description: 'A tool to reference elaastic subjects.',
    icon: '📚',
    links: {
      github: 'https://github.com/elaastic/elaasticatalog',
    },
    date: 2024,
    stack: ['nuxt', 'adonisjs', 'docker'],
  },
  {
    title: 'Golden Legends',
    description:
      '1st place on CGI Games on Web 2024 Challenge. BabylonJS olympic game.',
    icon: '🥇',
    links: {
      github: 'https://github.com/Golden-Legends/golden-legends',
      demo: 'https://golden-legends.github.io/golden-legends/',
    },
    date: 2024,
    stack: ['vue', 'babylonjs', 'typescript', 'vite'],
  },
  {
    title: 'MIAGE typst template',
    description:
      'Template for MIAGE students to create Practical Work reports easily.',
    icon: '📝',
    links: {
      github: 'https://github.com/RemiSaurel?page=1&tab=repositories',
      demo: 'https://www.youtube.com/watch?v=RQGjWUptxXM',
    },
    date: 2024,
    stack: ['typst'],
  },
  {
    title: 'Datastrike',
    description:
      'Esport and data. Feel free to check it out to discover the different analysis features',
    icon: '🎮',
    links: {
      github: 'https://github.com/datastrike',
    },
    date: 2024,
    stack: ['react', 'adonisjs', 'python'],
  },
  {
    title: 'Wasabi',
    description:
      'Data visualization university project based on a music API. Python data processing and Vue front-end with D3.',
    icon: '🎹',
    links: {
      github: 'https://github.com/wasabi-project',
      demo: 'https://wasabi-project.github.io/wasabi-dataviz/#/dataviz/',
    },
    date: 2023,
    stack: ['vue', 'd3', 'python'],
  },
  {
    title: 'Blockus',
    description:
      'Blockus is a game based on nodes and links. The goal is to reach 25 points. This is a multiplayer game, feel free to try it out!',
    icon: '🔫',
    links: {
      demo: 'https://blockus-prod-d75bc.web.app/',
    },
    date: 2023,
    stack: ['firebase'],
  },
  {
    title: 'Sorting Visualizer',
    description:
      'Web app to visualize sorting algorithms. Built with React to learn the basics of the library.',
    icon: '📊',
    links: {
      github: 'https://github.com/RemiSaurel/sorting-algorithms',
      demo: 'https://remisaurel.github.io/sorting-algorithms/',
    },
    date: 2023,
    stack: ['react', 'typescript'],
  },
  {
    title: 'Lockio',
    description:
      'M1 project. This PoC was designed to demonstrate our idea about an innovative solution to store your stuff...',
    icon: '📦',
    links: {
      github: 'https://github.com/Lockiio',
    },
    date: 2023,
    stack: ['vue', 'spring', 'python'],
  },
  {
    title: 'Spotidrone',
    description:
      'Python script that allows you to discover new artists based on your recommendations. I\'m using the Spotify API to get the recommendations and create the playlist.',
    icon: '🎧',
    links: {
      github: 'https://github.com/RemiSaurel/SpotiDrone',
    },
    date: 2023,
    stack: ['python', 'spotify'],
  },
]

const projectList = computed(() => {
  // Sort projects by date
  return PROJECTS.toSorted((a, b) => {
    return b.date - a.date
  })
})

const { definitions: filterDefinitions, filters, filtered, hasFilters, clear: clearFilters } = useProjectFilters(projectList)

const { view, isRestoring } = useListView('projects')
const PROJECT_VIEWS = [
  { value: 'list', label: 'List', icon: 'uil:list-ul' },
  { value: 'card', label: 'Cards', icon: 'uil:apps' },
]
</script>

<template>
  <div>
    <div class="mb-12">
      <h5 class="m-0 text-2xl font-semibold">
        Projects
      </h5>
      <p>
        Here are some projects I've been working on. Feel free to check them
        out!
      </p>
      <div class="mt-6 flex flex-col gap-1.5">
        <div class="flex flex-wrap items-center gap-2">
          <span class="font-semibold">Mainly programming</span> with
          <IconLink icon-name="i-logos-nuxt-icon" route="https://nuxt.com" external size="sm">
            Nuxt
          </IconLink>
          <IconLink icon-name="i-logos-vue" route="https://vuejs.org" external size="sm">
            Vue
          </IconLink>
          <IconLink icon-name="i-logos-typescript-icon" route="https://www.typescriptlang.org" external size="sm">
            TypeScript
          </IconLink>
          <IconLink icon-name="i-logos-docker-icon" route="https://www.docker.com" external size="sm">
            Docker
          </IconLink>
          <IconLink icon-name="i-logos-react" route="https://reactjs.org" external size="sm">
            React
          </IconLink>
          <IconLink icon-name="i-logos-spring-icon" route="https://www.spring.io" external size="sm">
            Spring Boot
          </IconLink>
          <IconLink icon-name="i-logos-adonisjs-icon" route="https://www.adonisjs.com" external size="sm">
            AdonisJS
          </IconLink>
          <IconLink icon-name="i-logos-python" route="https://www.python.org" external size="sm">
            Python
          </IconLink>
        </div>
      </div>
    </div>
    <div class="mb-3 flex items-start justify-between gap-3">
      <FilterBar v-model="filters" :definitions="filterDefinitions" />
      <ViewSwitcher id="projects" v-model="view" :options="PROJECT_VIEWS" class="shrink-0" />
    </div>
    <ProjectsList :projects="filtered" :view="view" :instant="isRestoring" />
    <div v-if="hasFilters && !filtered.length" class="flex flex-col items-center gap-3 py-12 text-sm text-neutral-500 dark:text-neutral-400">
      No project matches these filters.
      <button
        type="button"
        class="pressable cursor-pointer text-xs text-neutral-900 underline decoration-neutral-300 underline-offset-4 dark:text-neutral-100 dark:decoration-neutral-600 hover:decoration-current"
        @click="clearFilters()"
      >
        Clear filters
      </button>
    </div>
  </div>
</template>
