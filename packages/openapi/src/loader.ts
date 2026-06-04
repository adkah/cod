import type { Loader } from 'astro/loaders'
import { extractApiEntries } from './openapi.js'
import type { ApiLoaderOptions } from './types.js'

/**
 * Creates an Astro content loader that generates one entry per OpenAPI operation.
 *
 * The loader clears the target store on each run, dereferences the configured
 * OpenAPI 3.x source, parses each generated entry through Astro's `parseData`,
 * and stores entries with ids like `${slug}/${operation}`.
 */
export function apiLoader(options: ApiLoaderOptions): Loader {
  return {
    name: 'cod-openapi-loader',
    async load({ store, logger, parseData }) {
      store.clear()
      const entries = await extractApiEntries(options)
      for (const entry of entries) {
        const data = await parseData({
          id: entry.id,
          data: {
            title: entry.title,
            description: entry.description,
            sortOrder: entry.sortOrder,
            openapi: entry.openapi,
          },
        })

        store.set({
          id: entry.id,
          data,
        })
      }
      if (entries.length === 0) logger.warn(`[Cod API] No operations found for ${options.slug}`)
    },
  }
}
