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
```

### Notes

- No test framework is configured in this project
- No ESLint or Prettier configuration exists
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
│   └── pages/              # Page routes (index, posts, projects, teaching)
├── content/posts/          # Markdown blog posts
├── public/                 # Static assets
├── server/                 # Server-side code
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
  title: string;
  count?: number;
}

defineProps<MyProps>();

const { someValue } = useSomeComposable();
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
  date: Date;
  title: string;
  content?: string;
  categories?: NewsCategory[];
}
```

### Composables

- Name composables with `use` prefix (e.g., `useNews`, `useAnimations`)
- Return objects with reactive state and methods
- Use `ref()` for mutable state, `computed()` for derived values
- Place in `app/composables/` directory for auto-import

```typescript
export const useMyFeature = () => {
  const state = ref<string[]>([]);
  
  const derivedValue = computed(() => state.value.length);
  
  function doSomething() {
    // implementation
  }
  
  return {
    state,
    derivedValue,
    doSomething,
  };
};
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
import { motion } from 'motion-v';
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
- Code blocks use catppuccin themes (latte for light, mocha for dark)

### Data Files

- Static data stored in TypeScript files (e.g., `app/news/news.ts`)
- Export typed arrays with explicit interfaces
- Use `Date` objects for dates

## Nuxt-Specific Patterns

- Use `useSeoMeta()` for page SEO metadata
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
