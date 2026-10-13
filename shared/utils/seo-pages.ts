export interface SeoPage {
  /** Page title without the site name. The home page has none: it is the site name. */
  title?: string
  description: string
  /** Small tag on the OG image. */
  label?: string
}

/** What the static pages say about themselves, for their `<head>` and their OG image. Posts bring their own. */
export const SEO_PAGES: Record<string, SeoPage> = {
  '/': {
    description: 'PhD Student in AI and Learning Analytics at IRIT Lab, Toulouse.',
  },
  '/research': {
    title: 'Research',
    label: 'Research',
    description: 'Research landscape: learning analytics dashboards, generative AI in education, human-AI interaction and responsible AI.',
  },
  '/posts': {
    title: 'Posts',
    label: 'Blog',
    description: 'Yet another blog with projects, ideas, thoughts, and more.',
  },
  '/projects': {
    title: 'Projects',
    label: 'Projects',
    description: 'Side projects I\'ve been working on: web apps, datasets and tools, mostly built with Nuxt and Vue.',
  },
  '/failures': {
    title: 'Failures',
    label: 'Failures',
    description: 'The failure resume: rejected papers, failed experiments and abandoned projects, and what each one taught me.',
  },
  '/lab': {
    title: 'Lab',
    label: 'Lab',
    description: 'A workbench for composing the generative illustrations used across the site.',
  },
}

/** Where the OG image of a page lives: `/` is `/og/index.png`, `/posts/foo` is `/og/posts/foo.png`. */
export function ogImagePath(path: string) {
  const clean = path.replace(/\/$/, '')
  return `/og${clean || '/index'}.png`
}
