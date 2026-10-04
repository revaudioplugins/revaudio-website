import { defineCollection, z } from 'astro:content';

// Blog posts live in src/content/blog as .md or .mdx; the file name is the URL
// slug (/blog/<slug>/). `draft: true` keeps a post out of the build entirely.
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    /** Shorter <title> for search results (about 60 characters); falls back to title. */
    seoTitle: z.string().optional(),
    description: z.string(),
    kicker: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    readMinutes: z.number().int().positive(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
