// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [{ rel: 'icon', href: '/favicon.png' }],
      script: [
        {
          'src': 'https://app.rybbit.io/api/script.js',
          'defer': true,
          'data-site-id': '5a7335eeadc5',
        },
      ],
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
      { name: 'Geist Sans', provider: 'npm', weights: [400, 500, 600, 700] },
      { name: 'Caveat', provider: 'google', weights: [600, 700] },
      { name: 'Patrick Hand', provider: 'google', weights: [400] },
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
    output: {
      dir: '{{ rootDir }}/.output/public',
      publicDir: '{{ output.dir }}',
    },
  },

  compatibilityDate: '2024-10-04',
})
