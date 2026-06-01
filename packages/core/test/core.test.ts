import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, test } from 'bun:test'
import { getAdjacentPages } from '../src/adjacent.js'
import { buildBreadcrumbs } from '../src/breadcrumbs.js'
import { defineCodConfig } from '../src/config.js'
import { getReferencedCollections, getRouteSlugForEntry } from '../src/content.js'
import { isPathActive, resolveActiveSidebarTree } from '../src/nav.js'
import { rewriteInternalLinksToMarkdown } from '../src/route-helpers/markdown.js'
import { buildSidebarTree } from '../src/tree.js'
import type { CodConfig, DynamicCollectionEntry } from '../src/types.js'
import {
  hrefForSlug,
  normalizeEntryId,
  normalizeSlug,
  slugifyLabel,
  stripMarkdownExtension,
  titleFromSlug,
} from '../src/utils.js'
import { generateConfigModule, missingConfigError, resolveConfigSource } from '../src/virtual-modules.js'

const tempDirs: string[] = []

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })))
})

describe('config', () => {
  test('defineCodConfig returns the same object reference', () => {
    const config = baseConfig()
    expect(defineCodConfig(config)).toBe(config)
  })

  test('discovers supported config files', async () => {
    for (const fileName of ['cod.config.ts', 'cod.config.mts', 'cod.config.js', 'cod.config.mjs']) {
      const root = await makeTempDir()
      await writeFile(join(root, fileName), 'export default {}')
      expect(resolveConfigSource(root).type).toBe('file')
    }
  })

  test('throws expected missing config error', async () => {
    const root = await makeTempDir()
    expect(() => resolveConfigSource(root)).toThrow(missingConfigError())
  })

  test('multiple config error lists files in search order', async () => {
    const root = await makeTempDir()
    await writeFile(join(root, 'cod.config.mjs'), 'export default {}')
    await writeFile(join(root, 'cod.config.ts'), 'export default {}')
    expect(() => resolveConfigSource(root)).toThrow(
      '[Cod] Found multiple Cod config files:\n- cod.config.ts\n- cod.config.mjs'
    )
  })

  test('inline config virtual module serializes plain config', () => {
    expect(generateConfigModule({ type: 'inline', config: baseConfig() })).toContain('"defaultCollection":"docs"')
  })

  test('inline config rejects non-serializable config', () => {
    const circular = baseConfig() as CodConfig & { self?: unknown }
    circular.self = circular
    expect(() => generateConfigModule({ type: 'inline', config: circular })).toThrow(
      '[Cod] Inline config must be serializable'
    )
  })
})

describe('slug utilities', () => {
  test('match spec examples', () => {
    expect(stripMarkdownExtension('index.md')).toBe('index')
    expect(stripMarkdownExtension('foo/bar.mdx')).toBe('foo/bar')
    expect(normalizeSlug('foo/bar/index')).toBe('foo/bar')
    expect(normalizeSlug('index')).toBe('index')
    expect(normalizeEntryId('foo/index.mdx')).toBe('foo')
    expect(hrefForSlug('index')).toBe('/')
    expect(hrefForSlug('foo/bar')).toBe('/foo/bar')
    expect(slugifyLabel('API Reference')).toBe('api-reference')
    expect(titleFromSlug('quick-start')).toBe('Quick Start')
  })
})

describe('navigation', () => {
  test('builds sidebar tree and maps tabs', async () => {
    const sidebar = await buildSidebarTree(navConfig(), entriesByCollection())
    expect(sidebar.tabs.map((tab) => tab.slug)).toEqual(['docs', 'api-reference'])
    expect(sidebar.tabs[0]?.href).toBe('/')
    expect(sidebar.slugToTab['guide']).toBe('docs')
    expect(sidebar.slugToTab['users/list']).toBe('api-reference')
  })

  test('missing page entries create fallback page nodes', async () => {
    const sidebar = await buildSidebarTree(baseConfig(['missing-page']), entriesByCollection())
    expect(sidebar.defaultTree[0]).toMatchObject({ type: 'page', title: 'Missing Page', href: '/missing-page' })
  })

  test('group root creates category href but not child page', async () => {
    const sidebar = await buildSidebarTree(navConfig(), entriesByCollection())
    const group = sidebar.defaultTree[1]
    expect(group?.type).toBe('category')
    expect(group).toMatchObject({ type: 'category', href: '/guide', path: 'guide' })
    expect(group?.type === 'category' ? group.children.map((child) => child.path) : []).toEqual(['guide/install'])
  })

  test('collection groups sort by sortOrder, title, id', async () => {
    const sidebar = await buildSidebarTree(navConfig(), entriesByCollection())
    const group = sidebar.trees['api-reference']?.[0]
    expect(group?.type).toBe('category')
    expect(group?.type === 'category' ? group.children.map((child) => child.path) : []).toEqual([
      'api',
      'users/get',
      'users/list',
      'users/create',
    ])
  })

  test('slugToTab first tab wins', async () => {
    const sidebar = await buildSidebarTree(
      {
        defaultCollection: 'docs',
        navigation: {
          tabs: [
            { tab: 'A', pages: ['guide'] },
            { tab: 'B', pages: ['guide'] },
          ],
        },
      },
      entriesByCollection()
    )
    expect(sidebar.slugToTab['guide']).toBe('a')
  })

  test('active matching handles root and trailing slashes', () => {
    expect(isPathActive('/', '/')).toBe(true)
    expect(isPathActive('/foo/', '/foo')).toBe(true)
    expect(isPathActive('/foo?x=1#y', '/foo')).toBe(true)
    expect(isPathActive('/foo', '/')).toBe(false)
  })

  test('resolves active sidebar tree', async () => {
    const sidebar = await buildSidebarTree(navConfig(), entriesByCollection())
    expect(resolveActiveSidebarTree(sidebar, '/users/list').activeTab).toBe('api-reference')
  })

  test('breadcrumbs include ancestors and omit current href', async () => {
    const sidebar = await buildSidebarTree(navConfig(), entriesByCollection())
    await expect(buildBreadcrumbs(sidebar, '/guide/install', 'Install')).resolves.toEqual([
      { label: 'Guide', href: '/guide' },
      { label: 'Install' },
    ])
  })

  test('previous and next ignore category hrefs', async () => {
    const sidebar = await buildSidebarTree(navConfig(), entriesByCollection())
    const adjacent = getAdjacentPages(sidebar.defaultTree, '/guide/install')
    expect(adjacent.prev).toEqual({ title: 'Home', href: '/' })
    expect(adjacent.next).toBeNull()
  })
})

describe('content helpers', () => {
  test('getReferencedCollections includes default and collection groups', () => {
    expect([...getReferencedCollections(navConfig())]).toEqual(['docs', 'api'])
  })

  test('non-default collection index uses collection group root when present', () => {
    expect(getRouteSlugForEntry(navConfig(), 'api', 'index.mdx')).toBe('api')
  })
})

describe('route helpers', () => {
  test('markdown helper does not rewrite external or image links', () => {
    expect(
      rewriteInternalLinksToMarkdown('[a](/foo?q=1#x) ![i](/image) [e](https://example.com) <a href="/bar">')
    ).toBe('[a](/foo.md?q=1#x) ![i](/image) [e](https://example.com) <a href="/bar.md">')
  })
})

function baseConfig(pages: CodConfig['navigation']['tabs'][number]['pages'] = ['index']): CodConfig {
  return { defaultCollection: 'docs', navigation: { tabs: [{ tab: 'Docs', pages }] } }
}

function navConfig(): CodConfig {
  return {
    defaultCollection: 'docs',
    navigation: {
      tabs: [
        { tab: 'Docs', pages: ['index', { group: 'Guide', root: 'guide', pages: ['guide/install'] }] },
        { tab: 'API Reference', pages: [{ group: 'Users', root: 'api', collection: 'api' }] },
      ],
    },
  }
}

function entriesByCollection(): Map<string, DynamicCollectionEntry[]> {
  return new Map([
    [
      'docs',
      [
        entry('index.md', 'Home', { sidebarTitle: 'Home' }),
        entry('guide.mdx', 'Guide'),
        entry('guide/install.mdx', 'Install'),
      ],
    ],
    [
      'api',
      [
        entry('index.mdx', 'API Overview', { sortOrder: 0 }),
        entry('users/list', 'List users', { sortOrder: 2 }),
        entry('users/create', 'Create users'),
        entry('users/get', 'Get user', { sortOrder: 1 }),
      ],
    ],
  ])
}

function entry(id: string, title: string, data: Record<string, unknown> = {}): DynamicCollectionEntry {
  return { id, body: '', data: { title, ...data } }
}

async function makeTempDir(): Promise<string> {
  const dir = join(tmpdir(), `cod-core-${crypto.randomUUID()}`)
  await mkdir(dir, { recursive: true })
  tempDirs.push(dir)
  return dir
}
