import type { DynamicCollectionEntry } from '../types.js'

export function stripMdxPreamble(source: string): string {
  const lines = source.split('\n')
  let index = 0
  while (index < lines.length && /^\s*import\s.+/.test(lines[index] ?? '')) index += 1
  return lines.slice(index).join('\n').replace(/^\n+/, '')
}

export function toMarkdownHref(href: string): string {
  if (href === '/') return '/index.md'
  if (isExternalHref(href) || href.startsWith('#') || !href.startsWith('/')) return href

  const match = /([?#].*)$/.exec(href)
  const suffix = match?.[0] ?? ''
  const path = suffix ? href.slice(0, -suffix.length) : href
  return `${path}.md${suffix}`
}

export function rewriteInternalLinksToMarkdown(source: string): string {
  return source
    .replace(
      /(?<!!)\[([^\]]*)\]\(([^)]+)\)/g,
      (_match, label: string, href: string) => `[${label}](${toMarkdownHref(href)})`
    )
    .replace(
      /href=(['"])([^'"]+)\1/g,
      (_match, quote: string, href: string) => `href=${quote}${toMarkdownHref(href)}${quote}`
    )
}

export function serializeMarkdownEntry(entry: DynamicCollectionEntry): string {
  const sections = [`# ${entry.data.title}`]
  if (entry.data.description?.trim()) sections.push(entry.data.description.trim())
  if (entry.body?.trim()) sections.push(rewriteInternalLinksToMarkdown(stripMdxPreamble(entry.body)).trim())
  return `${sections.join('\n\n')}\n`
}

function isExternalHref(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//')
}
