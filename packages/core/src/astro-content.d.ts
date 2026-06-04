declare module 'astro:content' {
  export type CollectionKey = string

  export interface RenderedContent {
    html: string
    metadata?: Record<string, unknown>
  }

  export type CollectionEntry<C extends CollectionKey = CollectionKey> = {
    id: string
    body?: string
    collection: C
    data: {
      title: string
      description?: string
      sidebarTitle?: string
      icon?: string
      badge?: string
      prose?: boolean
      sortOrder?: number
      [key: string]: unknown
    }
    rendered?: RenderedContent
    filePath?: string
  }

  export function getCollection<C extends CollectionKey>(name: C): Promise<CollectionEntry<C>[]>
}
