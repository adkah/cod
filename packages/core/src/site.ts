import { getAdjacentPages } from './adjacent.js'
import { buildBreadcrumbs } from './breadcrumbs.js'
import { validateCodConfig } from './config.js'
import { fetchCollectionEntries, getReferencedCollections, getRouteSlugForEntry, loadCollections } from './content.js'
import { resolveActiveSidebarTree } from './nav.js'
import { buildSidebarTree } from './tree.js'
import type { CodConfig, DynamicCollectionEntry, PageContext, PageEntry, SiteContext, StaticPath } from './types.js'
import { errorToString, normalizeEntryId } from './utils.js'

export class CodSite {
  #config: CodConfig
  #context: SiteContext | null = null

  constructor(config: CodConfig) {
    validateCodConfig(config)
    this.#config = config
  }

  async getContext(): Promise<SiteContext> {
    if (this.#context) return this.#context

    const entriesByCollection = await loadCollections(this.#config)
    const sidebar = await buildSidebarTree(this.#config, entriesByCollection)
    const defaultEntries = entriesByCollection.get(this.#config.defaultCollection) ?? []
    const defaultEntriesBySlug = new Map<string, DynamicCollectionEntry>()

    for (const entry of defaultEntries) {
      defaultEntriesBySlug.set(normalizeEntryId(entry.id), entry)
    }

    const pages = buildPages(this.#config, entriesByCollection)
    this.#context = {
      config: this.#config,
      defaultCollection: this.#config.defaultCollection,
      sidebar,
      pages,
      defaultEntriesBySlug,
    }
    return this.#context
  }

  async getPageContext<TEntry extends DynamicCollectionEntry>(
    pathname: string,
    entry: TEntry
  ): Promise<PageContext<TEntry['data']>> {
    const context = await this.getContext()
    const title = entry.data.title
    const description = entry.data.description
    const { activeTab, sidebarTree } = resolveActiveSidebarTree(context.sidebar, pathname)
    const breadcrumbs = await buildBreadcrumbs(context.sidebar, pathname, title)
    const { prev, next } = getAdjacentPages(sidebarTree, pathname)

    return {
      ...context,
      entry,
      title,
      description,
      activeTab,
      sidebarTree,
      breadcrumbs,
      prev,
      next,
    }
  }

  async getStaticPaths(options?: { collections?: string[]; includeIndex?: boolean }): Promise<StaticPath[]> {
    const collections = options?.collections ?? [...getReferencedCollections(this.#config)]
    const includeIndex = options?.includeIndex ?? false
    const paths: StaticPath[] = []

    for (const collection of collections) {
      let entries: DynamicCollectionEntry[]
      try {
        entries = await fetchCollectionEntries(collection)
      } catch (error) {
        console.warn(
          `[Cod] Skipping collection "${collection}" because it could not be loaded: ${errorToString(error)}`
        )
        continue
      }

      for (const entry of entries) {
        const slug = getRouteSlugForEntry(this.#config, collection, entry.id)
        if (slug === 'index' && !includeIndex) continue
        paths.push({
          params: { slug: slug === 'index' ? undefined : slug },
          props: { entry, collectionName: collection },
        })
      }
    }

    return paths
  }
}

function buildPages(config: CodConfig, entriesByCollection: Map<string, DynamicCollectionEntry[]>): PageEntry[] {
  const pages: PageEntry[] = []
  for (const [collection, entries] of entriesByCollection) {
    for (const entry of entries) {
      const page: PageEntry = {
        slug: getRouteSlugForEntry(config, collection, entry.id),
        title: entry.data.title,
      }
      if (entry.data.method) page.method = entry.data.method
      pages.push(page)
    }
  }
  return pages
}
