import { describe, expect, test } from 'bun:test'
import { apiLoader } from '../src/loader.js'
import { fixturePath } from './fixtures.js'

describe('apiLoader', () => {
  test('writes entries into the Astro content store shape', async () => {
    const stored = new Map<string, unknown>()
    const parsedIds: string[] = []
    const loader = apiLoader({ slug: 'api', label: 'API', source: fixturePath })

    await loader.load({
      store: {
        clear: () => stored.clear(),
        set: (entry: { id: string; data: unknown }) => stored.set(entry.id, entry.data),
      },
      parseData: ({ id, data }: { id: string; data: unknown }) => {
        parsedIds.push(id)
        return data
      },
      logger: { warn: () => undefined },
    } as never)

    expect(parsedIds).toContain('api/addpet')
    expect(parsedIds).toHaveLength(19)
    expect(stored.size).toBe(19)
    expect(stored.get('api/addpet')).toMatchObject({
      title: 'Add a new pet to the store.',
      openapi: {
        apiSlug: 'api',
        apiLabel: 'API',
        endpoint: {
          method: 'POST',
          path: '/pet',
        },
      },
    })
  })
})
