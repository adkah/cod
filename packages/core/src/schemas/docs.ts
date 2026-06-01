import { z } from 'astro/zod'

export const docsSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    sidebarTitle: z.string().optional(),
    icon: z.string().optional(),
    prose: z.boolean().default(true),
  })
  .passthrough()
