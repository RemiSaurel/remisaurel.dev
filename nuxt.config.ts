import { readdirSync } from 'node:fs'
import { ogImagePath, SEO_PAGES } from './shared/utils/seo-pages'

// OG images are drawn by server/routes/og: one per page, one per post. Nothing links to them
// (they only appear in <meta> tags), so the crawler needs the list.
const postPaths = readdirSync('content/posts')
  .filter(file => file.endsWith('.md'))
  .map(file => `/posts/${file.replace(/\.md$/, '')}`)
const ogImageRoutes = [...Object.keys(SEO_PAGES), ...postPaths].map(ogImagePath)

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', href: '/favicon.png' }],
    },
  },
  runtimeConfig: {
    public: {
      // Absolute base for canonical and OG urls (override with NUXT_PUBLIC_SITE_URL)
      siteUrl: 'https://remisaurel.dev',
    },
  },
  $production: {
    app: {
      head: {
        script: [
          {
            'src': 'https://app.rybbit.io/api/script.js',
            'defer': true,
            'data-site-id': '5a7335eeadc5',
          },
        ],
      },
    },
  },
  colorMode: {
    preference: 'system',
    fallback: 'dark',
    classPrefix: '',
    classSuffix: '',
    storageKey: 'app-theme',
  },

  content: {
    build: {
      markdown: {
        highlight: {
          theme: {
            default: 'catppuccin-latte',
            dark: 'catppuccin-mocha',
          },
          langs: [
            'c',
            'cpp',
            'css',
            'java',
            'javascript',
            'html',
            'python',
            'sql',
            'typescript',
            'typst',
            'vue',
          ],
        },
      },
    },
    experimental: { sqliteConnector: 'native' },
  },

  css: ['~/assets/main.css'],
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxt/content',
    '@unocss/nuxt',
    '@nuxt/image',
    'motion-v/nuxt',
    '@nuxt/fonts',
  ],
  icon: {
    serverBundle: {
      collections: ['uil', 'lucide', 'logos', 'simple-icons', 'academicons'],
    },
    clientBundle: {
      scan: true,
    },
  },
  image: {
    quality: 80,
  },
  ui: {
    fonts: false,
    theme: {
      colors: ['primary'],
    },
    experimental: {
      componentDetection: true,
    },
  },
  fonts: {
    defaults: {
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
    },
    families: [
      { name: 'Instrument Sans', provider: 'google', weights: [400, 500, 600, 700] },
      { name: 'Caveat', provider: 'google', weights: [600, 700] },
      { name: 'Newsreader', provider: 'google', weights: [400, 500], styles: ['italic'] },
    ],
  },

  hooks: {
    // In dev, @nuxt/content already fills the local SQLite DB at startup and on HMR.
    // Its runtime integrity check drops the tables on checksum mismatch after a
    // hot restart, then fails to re-import the dump ("no such table: _content_posts").
    'nitro:config': function (nitroConfig) {
      if (nitroConfig.dev && nitroConfig.runtimeConfig?.content)
        (nitroConfig.runtimeConfig.content as { integrityCheck?: boolean }).integrityCheck = false
    },
  },

  nitro: {
    prerender: {
      routes: ogImageRoutes,
    },
    output: {
      dir: '{{ rootDir }}/.output/public',
      publicDir: '{{ output.dir }}',
    },
  },

  compatibilityDate: '2024-10-04',
})
