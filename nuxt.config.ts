// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
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
    serverBundle: 'remote',
  },
  ui: {
    fonts: false,
  },
  fonts: {
    families: [
      { name: 'Geist Sans', provider: 'npm', weights: [400, 500, 600, 700] },
    ],
  },

  nitro: {
    output: {
      dir: '{{ rootDir }}/.output/public',
      publicDir: '{{ output.dir }}',
    },
  },

  compatibilityDate: '2024-10-04',
})
