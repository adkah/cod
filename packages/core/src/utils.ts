export function stripMarkdownExtension(value: string): string {
  return value.replace(/\.(?:md|mdx)$/, '')
}

export function normalizeSlug(slug: string): string {
  return slug.replace(/\/index$/, '')
}

export function normalizeEntryId(id: string): string {
  return normalizeSlug(stripMarkdownExtension(id))
}

export function hrefForSlug(slug: string): string {
  return slug === 'index' ? '/' : `/${slug}`
}

export function slugifyLabel(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function lastPathSegment(path: string): string {
  return path.split('/').filter(Boolean).at(-1) ?? path
}

export function normalizePathname(pathname: string): string {
  const withoutHash = pathname.split('#', 1)[0] ?? ''
  const withoutQuery = withoutHash.split('?', 1)[0] ?? ''
  if (withoutQuery === '/') return '/'
  return withoutQuery.replace(/\/+$/, '') || '/'
}

export function pathnameToSlug(pathname: string): string {
  const normalized = normalizePathname(pathname)
  return normalized === '/' ? 'index' : normalized.replace(/^\//, '')
}

export function errorToString(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function getEntryBadge(entry: { data: { badge?: string; openapi?: unknown } } | undefined): string | undefined {
  return entry?.data.badge ?? getOpenApiEndpointMethod(entry?.data.openapi)
}

function getOpenApiEndpointMethod(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('endpoint' in value)) return undefined
  const endpoint = value.endpoint
  if (typeof endpoint !== 'object' || endpoint === null || !('method' in endpoint)) return undefined
  return typeof endpoint.method === 'string' ? endpoint.method : undefined
}
