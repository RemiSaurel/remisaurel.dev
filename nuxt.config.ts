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
  ],
  icon: {
    serverBundle: 'remote',
  },
  ui: {
    fonts: false,
  },

  compatibilityDate: '2024-10-04',
})
