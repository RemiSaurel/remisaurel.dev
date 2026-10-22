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
    explorations: defineCollection({
      type: 'page',
      source: 'explorations/**',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        tags: z.array(z.string()).default([]),
        // draft: dev only, never listed nor generated in production · wip: public, marked as in progress
        status: z.enum(['draft', 'wip', 'published']).default('draft'),
        // Lucide icon of the row tile on /explorations; a sheet of lines when omitted
        icon: z.string().optional(),
      }),
    }),
  },
})
