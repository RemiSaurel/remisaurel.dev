# AGENTS.md - AI Coding Agent Guidelines

This is a personal portfolio/blog website built with Nuxt 4, TypeScript, and UnoCSS.

## Project Overview

- **Framework**: Nuxt 4 (Vue 3 with Composition API)
- **Language**: TypeScript
- **Styling**: UnoCSS (Tailwind-like utility classes with `presetMini`)
- **Content**: @nuxt/content for Markdown blog posts
- **Animations**: motion-v library
- **Package Manager**: pnpm

## Build/Lint/Test Commands

```bash
# Development server (accessible on network)
pnpm dev

# Production build
pnpm build

# Static site generation
pnpm generate

# Preview production build
pnpm preview

# Unit tests (pure helpers in app/utils only)
pnpm test
```

### Notes

- Vitest only covers pure functions (`app/utils/**/*.test.ts`); components are checked in the browser
- ESLint uses `@antfu/eslint-config` with the UnoCSS plugin (`pnpm lint`)
- TypeScript checking is handled by Nuxt's built-in type system

## Project Structure

```
remisaurel.dev/
├── app/                    # Application source (Nuxt 4 structure)
│   ├── app.vue             # Root Vue component
│   ├── assets/main.css     # Global CSS styles
│   ├── components/         # Vue components
│   │   └── content/        # Content-specific components (ProseA, ProsePre, etc.)
│   ├── composables/        # Vue composables (useAnimations, useNews, useFirstVisit)
│   ├── layouts/default.vue # Default layout
│   ├── news/news.ts        # News data with typed interfaces
│   ├── components/flow/    # Workflow canvas kit (FlowCanvas, FlowNode, FlowStack...)
│   ├── components/explorations/<slug>/  # Components of one exploration (`*.global.vue`, used in MDC)
│   ├── utils/flow/         # Pure geometry and graph helpers of the canvas, with their tests
│   └── pages/              # Page routes (index, posts, projects, explorations, research...)
├── content/posts/          # Markdown blog posts
├── content/explorations/   # Explorations: Markdown + interactive components
├── public/                 # Static assets
├── server/                 # Server-side code
│   ├── routes/og/          # OG image route (/og/index.png, /og/posts/<slug>.png)
│   ├── utils/og/           # OG image drawing (SVG + resvg), illustrations, text wrapping
│   └── assets/fonts/       # Instrument Sans TTFs (resvg can't read woff2)
├── shared/utils/           # Code shared by app and server (SEO_PAGES, ogImagePath)
├── nuxt.config.ts          # Nuxt configuration
└── uno.config.ts           # UnoCSS configuration
```

## Code Style Guidelines

### Vue Components (SFC Pattern)

- Always use `<script setup lang="ts">` (Composition API with TypeScript)
- Script block comes before template block
- Props defined via `defineProps<{...}>()` with inline TypeScript interfaces
- Use Nuxt auto-imports for components, composables, and utilities

```vue
<script setup lang="ts">
interface MyProps {
  title: string
  count?: number
}

defineProps<MyProps>()

const { someValue } = useSomeComposable()
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- content -->
  </div>
</template>
```

### TypeScript

- Define interfaces inline in the script block or export from dedicated files
- Use explicit types for props, composable returns, and complex objects
- Prefer `interface` over `type` for object shapes
- Export types with `export type` or `export interface`

```typescript
// In composables or data files
export interface NewsItem {
  date: Date
  title: string
  content?: string
  categories?: NewsCategory[]
}
```

### Composables

- Name composables with `use` prefix (e.g., `useNews`, `useAnimations`)
- Return objects with reactive state and methods
- Use `ref()` for mutable state, `computed()` for derived values
- Place in `app/composables/` directory for auto-import

```typescript
export function useMyFeature() {
  const state = ref<string[]>([])

  const derivedValue = computed(() => state.value.length)

  function doSomething() {
    // implementation
  }

  return {
    state,
    derivedValue,
    doSomething,
  }
}
```

### Styling with UnoCSS

- Use utility classes directly in template (Tailwind-like syntax)
- Dark mode via `.dark` class prefix (managed by @nuxtjs/color-mode)
- Responsive prefixes: `md:`, `lg:`
- Common patterns:
  - Layout: `flex`, `flex-col`, `flex-row`, `gap-{n}`, `items-center`, `justify-between`
  - Spacing: `p-{n}`, `m-{n}`, `mt-{n}`, `px-{n}`
  - Typography: `text-{size}`, `font-{weight}`, `text-zinc-{shade}`
  - Dark mode: `dark:bg-neutral-700`, `dark:text-zinc-400`

```vue
<template>
  <div class="flex flex-col gap-2 p-4 dark:bg-neutral-700">
    <span class="text-sm text-zinc-500 dark:text-zinc-400">Content</span>
  </div>
</template>
```

### Animations with motion-v

- Import `motion` from `motion-v`
- Use `motion.div`, `motion.span` components
- Define animation configs as objects with `initial`, `animate`, `transition`
- Conditional animations based on first visit state

```vue
<script setup lang="ts">
import { motion } from 'motion-v'
</script>

<template>
  <motion.div
    :initial="{ opacity: 0, y: 10 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }"
  >
    Content
  </motion.div>
</template>
```

### Naming Conventions

- **Components**: PascalCase (e.g., `ProfileHeader.vue`, `NewsItem.vue`)
- **Composables**: camelCase with `use` prefix (e.g., `useNews.ts`)
- **Variables/Functions**: camelCase
- **Interfaces/Types**: PascalCase
- **Constants**: UPPER_SNAKE_CASE for animation configs, camelCase otherwise
- **CSS classes**: kebab-case for custom classes

### Content/Blog Posts

- Markdown files in `content/posts/` with YAML frontmatter
- Required frontmatter: `title`, `description`, `date`
- Custom components available: `:tag{color="green"}[text]`, `::blockquote{type="info"}`
- `::annotation{note="best-shotting?"}` around a block: a handwritten note in the margin with a bracket beside the block (`mark="arrow"` for a small arrow that ends on the last word instead, `side="left"` for the left margin). Below 1080px there is no margin: the bracket stays against the text and the note goes under it
- `:annotate[few words]{note="strokes are data"}` inside a sentence: the same handwritten note for a few words, which are underlined by hand. The arrow runs in the space under the line to the end of the underline (`side="left"` for the left margin, like `::annotation`). Below 1080px the note follows the words
- `::compare` with `:::compare-item{label="…" verdict="works|partial|fails" note="…"}` children: takes side by side (one frame of columns on desktop, a snapping carousel with a pager on phones). Use the `note` prop, not a `#note` slot: MDC drops the following items after a slot in a nested block
- Code blocks use catppuccin themes (latte for light, mocha for dark)

### Explorations

- One Markdown file per exploration in `content/explorations/` (frontmatter: `title`, `description`, `date`, `tags`, `status`, `icon`)
- `status`: `draft` (the default) is openable in dev only; in production it is listed on /explorations and the home as a non-clickable "Soon" teaser (title and description only), and its page is never generated; `wip` publishes it with a "Work in progress" mark; `published` publishes it. The nav shows "Explorations" once one is listed (a teaser counts)
- Interactive parts live in `app/components/explorations/<slug>/` as `*.global.vue`, embedded with MDC (`::explorations-<slug>-<name>`)
- Styling of exploration components: UnoCSS utilities in the template for layout, spacing, sizing, typography, colors, borders, shadows, simple transitions, hover/focus states and `dark:`. `<style scoped>` only for what `presetMini` can't say readably: `@keyframes` and their `animation`, pseudo-elements with `content`, selectors that combine several `data-*` states, and rules on elements you can't put a class on (`v-html`, slots, `:deep`). Write full literal class names (UnoCSS extracts them statically). `main.css` also imports Tailwind v4 (through `@nuxt/ui`), so classes missing from `presetMini` (`tabular-nums`, `sr-only`, `list-none`) may still work; prefer the ones UnoCSS generates, and check with the checker when in doubt
- Workflows use `FlowCanvas` with a `FlowGraph` (nodes with x/y, edges, optional loop). A player (`useFlowPlayer`) drives what happens: node statuses and balls along edges, all on its own clock (pause, speed, `step`: runs the clock to the next `wait` or ball landing, so a driver's beats are its awaits). `useFlowDemo` plays a graph on its own until there is real logic to drive it
- An edge with `vertical: true` leaves the bottom of its source and enters the top of its target, so a graph can wrap onto a second row. With the side panel open, the arrow keys carry it from node to node
- Node footers and the side panel come from the `footer` and `inspector` slots. Below `md`, the same graph renders as a vertical list (`FlowStack`)

### Data Files

- Static data stored in TypeScript files (e.g., `app/news/news.ts`)
- Export typed arrays with explicit interfaces
- Use `Date` objects for dates

## Nuxt-Specific Patterns

- Use `usePageSeo()` for page SEO metadata (title, description, canonical, OG/Twitter card). Static pages are described in `shared/utils/seo-pages.ts`; posts pass their own values
- OG images are generated at build time by `server/routes/og` (one per page and post, prerendered by `nuxt generate`). Their illustrations use the /lab layers (`server/utils/og/compositions.ts`)
- Use `NuxtImg` for optimized images
- Use `NuxtLink` for internal navigation
- Components are auto-imported from `app/components/`
- Composables are auto-imported from `app/composables/`

## Dark Mode

- Managed by `@nuxtjs/color-mode` module
- System preference with fallback to dark
- Storage key: `app-theme`
- Use `.dark` class for dark mode styles in CSS
- Use `dark:` prefix for UnoCSS utilities

## Important Notes

1. This is a static site (SSG) - uses `nuxt generate`
2. No backend API - content is static
3. Font: "Instrument Sans" from Google Fonts
4. Icons: @iconify-json/logos, @iconify-json/uil via @nuxt/icon
