<script setup lang="ts">
export interface Project {
  title: string;
  description: string;
  icon?: string;
  links?: {
    github?: string;
    demo?: string;
  };
  date: number; // YYYY
}

const PROJECTS: Project[] = [
  {
    title: "littleman",
    description:
      "A simple Discord bot to fetch papers from arXiv. .",
    icon: "🤖",
    links: {
      github: "https://github.com/RemiSaurel/littleman",
    },
    date: 2025,
  },
  {
    title: "memoire",
    description: "Flashcards app. based on research recommendations.",
    icon: "🧠",
    links: {
      github: "https://github.com/memoire-app",
      demo: "https://memoire.cloud",
    },
    date: 2024,
  },
  {
    title: "elaasticatalog",
    description: "A tool to reference elaastic subjects.",
    icon: "📚",
    links: {
      github: "https://github.com/elaastic/elaasticatalog",
    },
    date: 2024,
  },
  {
    title: "Golden Legends",
    description:
      "1st place on CGI Games on Web 2024 Challenge. BabylonJS olympic game.",
    icon: "🥇",
    links: {
      github: "https://github.com/Golden-Legends/golden-legends",
      demo: "https://golden-legends.github.io/golden-legends/",
    },
    date: 2024,
  },
  {
    title: "MIAGE typst template",
    description:
      "Template for MIAGE students to create Practical Work reports easily.",
    icon: "📝",
    links: {
      github: "https://github.com/RemiSaurel?page=1&tab=repositories",
      demo: "https://www.youtube.com/watch?v=RQGjWUptxXM",
    },
    date: 2024,
  },
  {
    title: "Datastrike",
    description:
      "Esport and data. Feel free to check it out to discover the different analysis features",
    icon: "🎮",
    links: {
      github: "https://github.com/datastrike",
      demo: "https://datastrike.cloud/",
    },
    date: 2024,
  },
  {
    title: "Wasabi",
    description:
      "Data visualization university project based on a music API. Python data processing and Vue front-end with D3.",
    icon: "🎹",
    links: {
      github: "https://github.com/wasabi-project",
      demo: "https://wasabi-project.github.io/wasabi-dataviz/#/dataviz/",
    },
    date: 2023,
  },
  {
    title: "Blockus",
    description:
      "Blockus is a game based on nodes and links. The goal is to reach 25 points. This is a multiplayer game, feel free to try it out!",
    icon: "🔫",
    links: {
      demo: "https://blockus-prod-d75bc.web.app/",
    },
    date: 2023,
  },
  {
    title: "Sorting Visualizer",
    description:
      "Web app to visualize sorting algorithms. Built with React to learn the basics of the library.",
    icon: "📊",
    links: {
      github: "https://github.com/RemiSaurel/sorting-algorithms",
      demo: "https://remisaurel.github.io/sorting-algorithms/",
    },
    date: 2023,
  },
  {
    title: "Lockio",
    description:
      "M1 project. This PoC was designed to demonstrate our idea about an innovative solution to store your stuff...",
    icon: "📦",
    links: {
      github: "https://github.com/Lockiio",
    },
    date: 2023,
  },
  {
    title: "Spotidrone",
    description:
      "Python script that allows you to discover new artists based on your recommendations. I'm using the Spotify API to get the recommendations and create the playlist.",
    icon: "🎧",
    links: {
      github: "https://github.com/RemiSaurel/SpotiDrone",
    },
    date: 2023,
  },
];

const projectList = computed(() => {
  // Sort projects by date
  return PROJECTS.sort((a, b) => {
    return b.date - a.date;
  });
});
</script>

<template>
  <div>
    <div class="mb-12">
      <h5 class="text-2xl font-semibold m-0">Projects</h5>
      <p>
        Here are some projects I've been working on. Feel free to check them
        out!
      </p>
        <div class="mt-6 flex flex-col gap-1.5">
    <div class="flex flex-wrap items-center gap-2">
      <span class="font-semibold">Mainly programming</span> with
      <IconLink iconName="i-logos-nuxt-icon" route="https://nuxtjs.org" external size="sm">Nuxt
      </IconLink>
      <IconLink iconName="i-logos-vue" route="https://vuejs.org" external size="sm">Vue
      </IconLink>
      <IconLink iconName="i-logos-typescript-icon" route="https://www.typescriptlang.org" external size="sm">TypeScript
      </IconLink>
      <IconLink iconName="uil-docker" route="https://www.java.com" external size="sm">Docker
      </IconLink>
      <IconLink iconName="i-logos-react" route="https://reactjs.org" external size="sm">React
      </IconLink>
      <IconLink iconName="i-logos-spring-icon" route="https://www.spring.io" external size="sm">Spring Boot
      </IconLink>
      <IconLink iconName="i-logos-adonisjs-icon" route="https://www.adonisjs.com" external size="sm">AdonisJS
      </IconLink>
      <IconLink iconName="i-logos-python" route="https://www.python.org" external size="sm">Python
      </IconLink>

    </div>
  </div>
    </div>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      <ProjectCard v-for="project in projectList" :key="project.title" :project="project" />
    </div>
  </div>
</template>
