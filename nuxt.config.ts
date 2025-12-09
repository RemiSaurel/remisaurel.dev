// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      link: [{ rel: "icon", href: "/favicon.png" }],
      script: [
        {
          src: 'https://app.rybbit.io/api/script.js',
          defer: true,
          'data-site-id': process.env.RYBBIT_SITE_ID || '',
        },
      ],
    },
  },
  colorMode: {
    preference: "system",
    fallback: "dark",
    classPrefix: "",
    classSuffix: "",
    storageKey: "app-theme",
  },

  content: {
    highlight: {
      theme: {
        default: "catppuccin-latte",
        dark: "catppuccin-mocha",
      },
      langs: [
        "c",
        "cpp",
        "css",
        "java",
        "javascript",
        "html",
        "python",
        "sql",
        "typescript",
        "typst",
        "vue",
      ],
    },
  },

  css: ["~/assets/main.css"],
  devtools: { enabled: true },
  modules: [
    "@nuxt/content",
    "@unocss/nuxt",
    "@nuxtjs/color-mode",
    "@nuxt/icon",
    "@nuxt/image",
    "motion-v/nuxt",
  ],
  icon: {
    serverBundle: "remote",
  },

  routeRules: {
    "/": { prerender: true },
  },
  compatibilityDate: "2024-10-04",
});
