import { describe, expect, test } from 'bun:test'
import { extractApiEntries, getApiEntryIds, loadOpenApiSpec } from '../src/openapi.js'
import { fixturePath, fixtureUrl } from './fixtures.js'

const petstoreEntryIds = [
  'api/addpet',
  'api/updatepet',
  'api/findpetsbystatus',
  'api/findpetsbytags',
  'api/getpetbyid',
  'api/updatepetwithform',
  'api/deletepet',
  'api/uploadfile',
  'api/getinventory',
  'api/placeorder',
  'api/getorderbyid',
  'api/deleteorder',
  'api/createuser',
  'api/createuserswithlistinput',
  'api/loginuser',
  'api/logoutuser',
  'api/getuserbyname',
  'api/updateuser',
  'api/deleteuser',
]

describe('OpenAPI extraction', () => {
  test('loads string paths and extracts visible operations', async () => {
    const entries = await extractApiEntries({ slug: 'api', label: 'API', source: fixturePath })

    expect(entries).toHaveLength(19)
    expect(entries.map((entry) => entry.id)).toEqual(petstoreEntryIds)
    expect(entries[0]).toMatchObject({
      title: 'Add a new pet to the store.',
      method: 'POST',
      apiSlug: 'api',
      apiLabel: 'API',
      sortOrder: 0,
      endpoint: {
        method: 'POST',
        path: '/pet',
        baseUrl: '/api/v3',
        security: [{ petstore_auth: ['write:pets', 'read:pets'] }],
        securitySchemes: {
          api_key: { type: 'apiKey', name: 'api_key', in: 'header' },
          petstore_auth: { type: 'oauth2' },
        },
      },
    })
    expect(entries[0]?.description).toBe('Add a new pet to the store.')
    expect(entries[0]?.endpoint.requestBody).toBeDefined()
  })

  test('excludes tags explicitly', async () => {
    const entries = await extractApiEntries({
      slug: 'api',
      label: 'API',
      source: fixturePath,
      excludeTags: ['store', 'user'],
    })

    expect(entries.map((entry) => entry.id)).toEqual(petstoreEntryIds.slice(0, 8))
  })

  test('loads raw specs and source functions', async () => {
    const spec = await loadOpenApiSpec(fixturePath)
    const entries = await extractApiEntries({ slug: 'api', label: 'API', source: () => spec })

    expect(entries).toHaveLength(19)
  })

  test('returns generated API entry ids', async () => {
    await expect(getApiEntryIds({ slug: 'api', label: 'API', source: fixtureUrl })).resolves.toEqual(petstoreEntryIds)
  })
})
