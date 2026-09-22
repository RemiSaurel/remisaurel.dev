export interface Tech {
  name: string
  icon: string
  // Monochrome icons (simple-icons) need an explicit brand color
  color?: string
}

export const TECHS = {
  nuxt: { name: 'Nuxt', icon: 'i-logos-nuxt-icon' },
  vue: { name: 'Vue', icon: 'i-logos-vue' },
  react: { name: 'React', icon: 'i-logos-react' },
  typescript: { name: 'TypeScript', icon: 'i-logos-typescript-icon' },
  tailwind: { name: 'Tailwind CSS', icon: 'i-logos-tailwindcss-icon' },
  vite: { name: 'Vite', icon: 'i-logos-vitejs' },
  adonisjs: { name: 'AdonisJS', icon: 'i-logos-adonisjs-icon' },
  spring: { name: 'Spring Boot', icon: 'i-logos-spring-icon' },
  python: { name: 'Python', icon: 'i-logos-python' },
  docker: { name: 'Docker', icon: 'i-logos-docker-icon' },
  firebase: { name: 'Firebase', icon: 'i-logos-firebase-icon' },
  d3: { name: 'D3', icon: 'i-logos-d3' },
  discord: { name: 'discord.js', icon: 'i-logos-discord-icon' },
  spotify: { name: 'Spotify API', icon: 'i-logos-spotify-icon' },
  babylonjs: { name: 'Babylon.js', icon: 'simple-icons:babylondotjs', color: '#bb464b' },
  typst: { name: 'Typst', icon: 'simple-icons:typst', color: '#239dad' },
} satisfies Record<string, Tech>

export type TechKey = keyof typeof TECHS
