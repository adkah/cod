import type { Loader } from 'astro/loaders'
import { extractApiEntries } from './openapi.js'
import type { ApiLoaderOptions } from './types.js'

export function apiLoader(options: ApiLoaderOptions): Loader {
  return {
    name: 'cod-openapi-loader',
    async load({ store, logger }) {
      store.clear()
      const entries = await extractApiEntries(options)
      for (const entry of entries) {
        store.set({
          id: entry.id,
          data: {
            title: entry.title,
            description: entry.description,
            method: entry.method,
            apiSlug: entry.apiSlug,
            apiLabel: entry.apiLabel,
            sortOrder: entry.sortOrder,
            endpoint: entry.endpoint,
          },
        })
      }
      if (entries.length === 0) logger.warn(`[Cod API] No operations found for ${options.slug}`)
    },
  }
}
