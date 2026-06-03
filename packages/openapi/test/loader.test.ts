import { describe, expect, test } from 'bun:test'
import { apiLoader } from '../src/loader.js'
import { fixturePath } from './fixtures.js'

describe('apiLoader', () => {
  test('writes entries into the Astro content store shape', async () => {
    const stored = new Map<string, unknown>()
    const loader = apiLoader({ slug: 'api', label: 'API', source: fixturePath })

    await loader.load({
      store: {
        clear: () => stored.clear(),
        set: (entry: { id: string; data: unknown }) => stored.set(entry.id, entry.data),
      },
      logger: { warn: () => undefined },
    } as never)

    expect(stored.size).toBe(19)
    expect(stored.get('api/addpet')).toMatchObject({ title: 'Add a new pet to the store.', method: 'POST' })
  })
})
