import type { AdjacentPages, SidebarNode, SidebarPageNode } from './types.js'
import { isPathActive } from './nav.js'

export function getAdjacentPages(tree: SidebarNode[], pathname: string): AdjacentPages {
  const pages = flattenPages(tree)
  const index = pages.findIndex((page) => isPathActive(pathname, page.href))
  if (index === -1) return { prev: null, next: null }

  const prev = pages[index - 1]
  const next = pages[index + 1]
  return {
    prev: prev ? { title: prev.sidebarTitle ?? prev.title, href: prev.href } : null,
    next: next ? { title: next.sidebarTitle ?? next.title, href: next.href } : null,
  }
}

function flattenPages(nodes: SidebarNode[]): SidebarPageNode[] {
  return nodes.flatMap((node) => (node.type === 'page' ? [node] : flattenPages(node.children)))
}
