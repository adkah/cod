import { describe, expect, test } from 'bun:test'
import { extractApiEntries } from '../src/openapi.js'
import { apiCollectionSchema } from '../src/schema.js'
import { fixturePath } from './fixtures.js'

describe('schemas and guards', () => {
  test('validates API collection entries', async () => {
    const [entry] = await extractApiEntries({ slug: 'api', label: 'API', source: fixturePath })

    expect(() => apiCollectionSchema.parse(entry)).not.toThrow()
  })
})
