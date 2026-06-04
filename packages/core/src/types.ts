import type { CollectionEntry, CollectionKey } from 'astro:content'

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

declare global {
  interface CodEntryDataExtensions {}
}

export interface EntryDataExtensions extends CodEntryDataExtensions {}

export interface BaseEntryData extends EntryDataExtensions {
  title: string
  description?: string
  sidebarTitle?: string
  icon?: string
  method?: string
  prose?: boolean
  sortOrder?: number
}

export type DynamicCollectionEntry<TData extends BaseEntryData = BaseEntryData> = CollectionEntry<CollectionKey> & {
  data: TData
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

export interface BreadcrumbItem {
  label: string
  href?: string
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

export interface PageContext<TData extends BaseEntryData = BaseEntryData> extends SiteContext {
  entry: DynamicCollectionEntry<TData>
  title: string
  description: string | undefined
  activeTab: string | null
  sidebarTree: SidebarNode[]
  breadcrumbs: BreadcrumbItem[]
  prev: AdjacentPage | null
  next: AdjacentPage | null
}

export interface StaticPath<TData extends BaseEntryData = BaseEntryData> {
  params: { slug: string | undefined }
  props: {
    entry: DynamicCollectionEntry<TData>
    collectionName: string
  }
}

export interface CodIntegrationOptions {
  config?: CodConfig
}
