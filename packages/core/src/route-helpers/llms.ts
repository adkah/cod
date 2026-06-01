import { serializeMarkdownEntry, toMarkdownHref } from './markdown.js'
import type { DynamicCollectionEntry, SidebarNode, SidebarTreeResult } from '../types.js'

export function collectOrderedSlugs(nodes: SidebarNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === 'page') return [node.path]
    const ownPath = node.href ? [node.path] : []
    return [...ownPath, ...collectOrderedSlugs(node.children)]
  })
}

export function renderLlmsTxt(options: {
  title: string
  description?: string
  siteUrl: string
  sidebar: SidebarTreeResult
}): string {
  const lines = [`# ${options.title}`]
  if (options.description?.trim()) lines.push('', options.description.trim())

  for (const tab of options.sidebar.tabs) {
    lines.push('', `## ${tab.label}`)
    renderSidebarLinks(options.sidebar.trees[tab.slug] ?? [], options.siteUrl, lines)
  }

  return `${lines.join('\n')}\n`
}

export function renderLlmsFullTxt(options: {
  siteUrl: string
  sidebar: SidebarTreeResult
  entriesBySlug: Map<string, DynamicCollectionEntry>
}): string {
  const orderedSlugs = new Set<string>()
  const pages: string[] = []

  for (const tab of options.sidebar.tabs) {
    for (const slug of collectOrderedSlugs(options.sidebar.trees[tab.slug] ?? [])) {
      orderedSlugs.add(slug)
      const entry = options.entriesBySlug.get(slug)
      if (entry) pages.push(serializeMarkdownEntry(entry).trim())
    }
  }

  for (const [slug, entry] of options.entriesBySlug) {
    if (!orderedSlugs.has(slug)) pages.push(serializeMarkdownEntry(entry).trim())
  }

  return `${pages.join('\n\n---\n\n')}\n`
}

function renderSidebarLinks(nodes: SidebarNode[], siteUrl: string, lines: string[], depth = 0): void {
  const indent = '  '.repeat(depth)
  for (const node of nodes) {
    if (node.type === 'page') {
      lines.push(`${indent}- [${node.sidebarTitle ?? node.title}](${absoluteUrl(siteUrl, toMarkdownHref(node.href))})`)
      continue
    }
    lines.push(`${indent}- ${node.label}`)
    renderSidebarLinks(node.children, siteUrl, lines, depth + 1)
  }
}

function absoluteUrl(siteUrl: string, href: string): string {
  return `${siteUrl.replace(/\/$/, '')}${href}`
}
