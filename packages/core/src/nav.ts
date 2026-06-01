import type { SidebarCategoryNode, SidebarNode, SidebarTreeResult } from './types.js'
import { normalizePathname, pathnameToSlug } from './utils.js'

export function isPathActive(currentPath: string, href: string): boolean {
  const current = normalizePathname(currentPath)
  const target = normalizePathname(href)
  if (target === '/') return current === '/'
  return current === target
}

export function hasActiveChild(node: SidebarCategoryNode, currentPath: string): boolean {
  return node.children.some((child) => {
    if (child.type === 'page') return isPathActive(currentPath, child.href)
    return (child.href ? isPathActive(currentPath, child.href) : false) || hasActiveChild(child, currentPath)
  })
}

export function resolveActiveSidebarTree(
  sidebar: SidebarTreeResult,
  pathname: string
): { activeTab: string | null; sidebarTree: SidebarNode[] } {
  const slug = pathnameToSlug(pathname)
  const mappedTab = sidebar.slugToTab[slug]
  if (mappedTab) return { activeTab: mappedTab, sidebarTree: sidebar.trees[mappedTab] ?? sidebar.defaultTree }

  for (const tab of sidebar.tabs) {
    const tree = sidebar.trees[tab.slug] ?? []
    if (treeContainsActivePath(tree, pathname)) return { activeTab: tab.slug, sidebarTree: tree }
  }

  const firstTab = sidebar.tabs[0]
  if (!firstTab) return { activeTab: null, sidebarTree: sidebar.defaultTree }
  return { activeTab: firstTab.slug, sidebarTree: sidebar.trees[firstTab.slug] ?? sidebar.defaultTree }
}

function treeContainsActivePath(nodes: SidebarNode[], pathname: string): boolean {
  return nodes.some((node) => {
    if (node.type === 'page') return isPathActive(pathname, node.href)
    return (node.href ? isPathActive(pathname, node.href) : false) || treeContainsActivePath(node.children, pathname)
  })
}
