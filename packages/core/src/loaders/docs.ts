import type { Loader } from 'astro/loaders'
import { glob } from 'astro/loaders'

export interface DocsLoaderOptions {
  pattern: string
  base: string
}

export function docsLoader(options: DocsLoaderOptions): Loader {
  const baseLoader = glob(options)
  return {
    ...baseLoader,
    name: 'cod-docs-loader',
    async load(context) {
      await baseLoader.load(context)
      for (const [id, entry] of context.store.entries()) {
        const data = entry.data as { description?: unknown }
        if (typeof data.description !== 'string' || data.description.trim().length === 0) {
          context.logger.warn(`[Cod] Missing description: ${id}`)
        }
      }
    },
  }
}
