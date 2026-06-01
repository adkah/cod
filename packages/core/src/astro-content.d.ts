declare module 'astro:content' {
  import type { DynamicCollectionEntry } from './types'

  export function getCollection(name: string): Promise<DynamicCollectionEntry[]>
}
