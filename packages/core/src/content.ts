import type { CodConfig, DynamicCollectionEntry } from './types.js'
import { errorToString, normalizeEntryId, normalizeSlug } from './utils.js'
export type { DocsLoaderOptions } from './loaders/docs.js'
export { docsLoader } from './loaders/docs.js'
export { docsSchema } from './schemas/docs.js'

type CollectionModule = {
  getCollection: (name: string) => Promise<DynamicCollectionEntry[]>
}

export async function fetchCollectionEntries(name: string): Promise<DynamicCollectionEntry[]> {
  const content = (await import('astro:content')) as CollectionModule
  return content.getCollection(name)
}

export async function loadCollections(config: CodConfig): Promise<Map<string, DynamicCollectionEntry[]>> {
  const entriesByCollection = new Map<string, DynamicCollectionEntry[]>()

  for (const collection of getReferencedCollections(config)) {
    try {
      entriesByCollection.set(collection, await fetchCollectionEntries(collection))
    } catch (error) {
      console.warn(`[Cod] Collection "${collection}" could not be loaded: ${errorToString(error)}`)
      throw error
    }
  }

  return entriesByCollection
}

export function getReferencedCollections(config: CodConfig): Set<string> {
  const collections = new Set<string>([config.defaultCollection])

  for (const tab of config.navigation.tabs) {
    for (const item of tab.pages) collectReferencedCollections(item, collections)
  }

  return collections
}

export function getCollectionGroupRoot(config: CodConfig, collection: string): string | null {
  for (const tab of config.navigation.tabs) {
    for (const item of tab.pages) {
      const root = findCollectionGroupRoot(item, collection)
      if (root) return root
    }
  }

  return null
}

export function getRouteSlugForEntry(config: CodConfig, collection: string, entryId: string): string {
  if (collection === config.defaultCollection) return normalizeEntryId(entryId)

  const collectionRoot = getCollectionGroupRoot(config, collection)
  if (normalizeEntryId(entryId) === 'index' && collectionRoot) return normalizeSlug(collectionRoot)
  return entryId
}

function collectReferencedCollections(
  item: CodConfig['navigation']['tabs'][number]['pages'][number],
  collections: Set<string>
): void {
  if (typeof item === 'string') return
  if ('collection' in item) {
    collections.add(item.collection)
    return
  }
  for (const child of item.pages) collectReferencedCollections(child, collections)
}

function findCollectionGroupRoot(
  item: CodConfig['navigation']['tabs'][number]['pages'][number],
  collection: string
): string | null {
  if (typeof item === 'string') return null
  if ('collection' in item) return item.collection === collection && item.root ? item.root : null

  for (const child of item.pages) {
    const root = findCollectionGroupRoot(child, collection)
    if (root) return root
  }

  return null
}
