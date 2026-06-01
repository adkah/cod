import type {
  CodConfig,
  CollectionGroupItem,
  DynamicCollectionEntry,
  GroupItem,
  PageItem,
  SidebarCategoryNode,
  SidebarNode,
  SidebarPageNode,
  SidebarTreeResult,
  TabItem,
} from './types.js'
import { getRouteSlugForEntry } from './content.js'
import { hrefForSlug, lastPathSegment, normalizeEntryId, normalizeSlug, slugifyLabel, titleFromSlug } from './utils.js'

type EntryLookup = Map<string, DynamicCollectionEntry>

export async function buildSidebarTree(
  config: CodConfig,
  entriesByCollection: Map<string, DynamicCollectionEntry[]>
): Promise<SidebarTreeResult> {
  const lookup = buildEntryLookup(config, entriesByCollection)
  const slugToTab: Record<string, string> = {}
  const trees: Record<string, SidebarNode[]> = {}
  const tabs = config.navigation.tabs.map((tab) => {
    const slug = slugifyLabel(tab.tab)
    const tree = buildTabTree(tab, config, entriesByCollection, lookup)
    trees[slug] = tree
    mapTreeToTab(tree, slug, slugToTab)

    return {
      slug,
      label: tab.tab,
      href: findFirstPageHref(tree) ?? '/',
    }
  })

  return {
    tabs,
    trees,
    defaultTree: tabs[0] ? (trees[tabs[0].slug] ?? []) : [],
    slugToTab,
  }
}

function buildEntryLookup(config: CodConfig, entriesByCollection: Map<string, DynamicCollectionEntry[]>): EntryLookup {
  const lookup: EntryLookup = new Map()

  for (const [collection, entries] of entriesByCollection) {
    for (const entry of entries) {
      const slug = collection === config.defaultCollection ? normalizeEntryId(entry.id) : entry.id
      lookup.set(`${collection}:${slug}`, entry)
    }
  }

  return lookup
}

function buildTabTree(
  tab: TabItem,
  config: CodConfig,
  entriesByCollection: Map<string, DynamicCollectionEntry[]>,
  lookup: EntryLookup
): SidebarNode[] {
  return tab.pages.map((item) => buildPageItem(item, config, entriesByCollection, lookup))
}

function buildPageItem(
  item: PageItem,
  config: CodConfig,
  entriesByCollection: Map<string, DynamicCollectionEntry[]>,
  lookup: EntryLookup
): SidebarNode {
  if (typeof item === 'string') return buildDefaultPage(item, config, lookup)
  if ('collection' in item) return buildCollectionGroup(item, config, entriesByCollection)
  return buildNormalGroup(item, config, entriesByCollection, lookup)
}

function buildDefaultPage(page: string, config: CodConfig, lookup: EntryLookup): SidebarPageNode {
  const slug = normalizeSlug(page)
  const entry = lookup.get(`${config.defaultCollection}:${slug}`)
  return pageFromEntry(slug, entry)
}

function buildNormalGroup(
  group: GroupItem,
  config: CodConfig,
  entriesByCollection: Map<string, DynamicCollectionEntry[]>,
  lookup: EntryLookup
): SidebarCategoryNode {
  const path = group.root ? normalizeSlug(group.root) : slugifyLabel(group.group)
  const node: SidebarCategoryNode = {
    type: 'category',
    label: group.group,
    slug: slugifyLabel(group.group),
    path,
    children: group.pages.map((item) => buildPageItem(item, config, entriesByCollection, lookup)),
  }
  if (group.root) node.href = hrefForSlug(path)
  if (group.icon) node.icon = group.icon
  return node
}

function buildCollectionGroup(
  group: CollectionGroupItem,
  config: CodConfig,
  entriesByCollection: Map<string, DynamicCollectionEntry[]>
): SidebarCategoryNode {
  const path = group.root ? normalizeSlug(group.root) : slugifyLabel(group.group)
  const entries = [...(entriesByCollection.get(group.collection) ?? [])].sort(compareEntries)
  const node: SidebarCategoryNode = {
    type: 'category',
    label: group.group,
    slug: slugifyLabel(group.group),
    path,
    children: entries.map((entry) => {
      const pagePath = getRouteSlugForEntry(config, group.collection, entry.id)
      return pageFromEntry(pagePath, entry)
    }),
  }
  if (group.root) node.href = hrefForSlug(path)
  if (group.icon) node.icon = group.icon
  return node
}

function compareEntries(a: DynamicCollectionEntry, b: DynamicCollectionEntry): number {
  const aOrder = typeof a.data.sortOrder === 'number' ? a.data.sortOrder : null
  const bOrder = typeof b.data.sortOrder === 'number' ? b.data.sortOrder : null
  if (aOrder !== null && bOrder === null) return -1
  if (aOrder === null && bOrder !== null) return 1
  if (aOrder !== null && bOrder !== null && aOrder !== bOrder) return aOrder - bOrder

  const titleComparison = a.data.title.localeCompare(b.data.title)
  return titleComparison === 0 ? a.id.localeCompare(b.id) : titleComparison
}

function pageFromEntry(path: string, entry: DynamicCollectionEntry | undefined): SidebarPageNode {
  const title = entry?.data.title ?? titleFromSlug(lastPathSegment(path))
  const node: SidebarPageNode = {
    type: 'page',
    title,
    href: hrefForSlug(path),
    path,
  }
  if (entry?.data.sidebarTitle) node.sidebarTitle = entry.data.sidebarTitle
  if (entry?.data.method) node.method = entry.data.method
  if (entry?.data.icon) node.icon = entry.data.icon
  return node
}

function findFirstPageHref(nodes: SidebarNode[]): string | null {
  for (const node of nodes) {
    if (node.type === 'page') return node.href
    const childHref = findFirstPageHref(node.children)
    if (childHref) return childHref
  }
  return null
}

function mapTreeToTab(nodes: SidebarNode[], tabSlug: string, slugToTab: Record<string, string>): void {
  for (const node of nodes) {
    if (node.type === 'page' || node.href) {
      slugToTab[node.path] ??= tabSlug
    }
    if (node.type === 'category') mapTreeToTab(node.children, tabSlug, slugToTab)
  }
}
