import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    posts: defineCollection({
      type: 'page',
      source: 'posts/**',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        disabled: z.boolean().optional(),
        references: z.array(z.object({
          id: z.string(),
          // "Last, F." format: the part before the comma is used in citations
          authors: z.array(z.string()),
          year: z.number(),
          title: z.string(),
          venue: z.string().optional(),
          url: z.string().optional(),
        })).optional(),
      }),
    }),
  },
})
