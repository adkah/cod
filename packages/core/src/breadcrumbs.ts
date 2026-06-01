import type { SidebarNode, SidebarTreeResult } from './types.js'
import { isPathActive, resolveActiveSidebarTree } from './nav.js'

export async function buildBreadcrumbs(
  sidebar: SidebarTreeResult,
  pathname: string,
  title: string
): Promise<{ label: string; href?: string }[]> {
  const { sidebarTree } = resolveActiveSidebarTree(sidebar, pathname)
  const match = findBreadcrumbPath(sidebarTree, pathname, [])
  return match ?? [{ label: title }]
}

function findBreadcrumbPath(
  nodes: SidebarNode[],
  pathname: string,
  ancestors: { label: string; href?: string }[]
): { label: string; href?: string }[] | null {
  for (const node of nodes) {
    if (node.type === 'page') {
      if (isPathActive(pathname, node.href)) return [...ancestors, { label: node.title }]
      continue
    }

    const crumb = node.href ? { label: node.label, href: node.href } : { label: node.label }
    if (node.href && isPathActive(pathname, node.href)) return [...ancestors, { label: node.label }]
    const childMatch = findBreadcrumbPath(node.children, pathname, [...ancestors, crumb])
    if (childMatch) return childMatch
  }

  return null
}
