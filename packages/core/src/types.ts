export interface CodConfig {
  defaultCollection: string
  navigation: {
    tabs: TabItem[]
  }
}

export interface TabItem {
  tab: string
  pages: PageItem[]
}

export type PageItem = string | GroupItem | CollectionGroupItem

export interface GroupItem {
  group: string
  root?: string
  icon?: string
  pages: PageItem[]
}

export interface CollectionGroupItem {
  group: string
  root?: string
  icon?: string
  collection: string
}

export interface DynamicCollectionEntry {
  id: string
  body?: string
  data: {
    title: string
    description?: string
    sidebarTitle?: string
    icon?: string
    method?: string
    prose?: boolean
    sortOrder?: number
    [key: string]: unknown
  }
}

export interface TabInfo {
  slug: string
  label: string
  href: string
}

export interface SidebarTreeResult {
  tabs: TabInfo[]
  trees: Record<string, SidebarNode[]>
  defaultTree: SidebarNode[]
  slugToTab: Record<string, string>
}

export type SidebarNode = SidebarCategoryNode | SidebarPageNode

export interface SidebarCategoryNode {
  type: 'category'
  label: string
  slug: string
  path: string
  href?: string
  icon?: string
  children: SidebarNode[]
}

export interface SidebarPageNode {
  type: 'page'
  title: string
  sidebarTitle?: string
  href: string
  path: string
  method?: string
  icon?: string
}

export interface AdjacentPage {
  title: string
  href: string
}

export interface AdjacentPages {
  prev: AdjacentPage | null
  next: AdjacentPage | null
}

export interface PageEntry {
  slug: string
  title: string
  method?: string
}

export interface SiteContext {
  config: CodConfig
  defaultCollection: string
  sidebar: SidebarTreeResult
  pages: PageEntry[]
  defaultEntriesBySlug: Map<string, DynamicCollectionEntry>
}

export interface PageContext extends SiteContext {
  entry: DynamicCollectionEntry
  title: string
  description: string | undefined
  activeTab: string | null
  sidebarTree: SidebarNode[]
  breadcrumbs: { label: string; href?: string }[]
  prev: AdjacentPage | null
  next: AdjacentPage | null
}

export interface StaticPath {
  params: { slug: string | undefined }
  props: {
    entry: DynamicCollectionEntry
    collectionName: string
  }
}

export interface CodIntegrationOptions {
  config?: CodConfig
}
