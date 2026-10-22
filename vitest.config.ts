import { defineConfig } from 'vitest/config'

// Only the pure helpers are tested (app/utils/**): they need no Nuxt runtime nor a browser
export default defineConfig({
  test: {
    include: ['app/utils/**/*.test.ts'],
  },
})
