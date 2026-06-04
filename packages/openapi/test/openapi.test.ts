import { describe, expect, test } from 'bun:test'
import { extractApiEntries, getApiEntryIds } from '../src/openapi.js'
import type { OpenApiSpec } from '../src/types.js'
import { fixturePath, fixtureUrl, petstore } from './fixtures.js'

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
    const entries = await extractApiEntries({
      slug: 'api',
      label: 'API',
      source: () => petstore as unknown as OpenApiSpec,
    })

    expect(entries).toHaveLength(19)
  })

  test('dereferences source function results', async () => {
    const entries = await extractApiEntries({
      slug: 'api',
      label: 'API',
      source: () => petstore as unknown as OpenApiSpec,
    })

    expect(entries[0]?.endpoint.requestBody?.content?.['application/json']?.schema).toMatchObject({
      type: 'object',
      required: ['name', 'photoUrls'],
    })
  })

  test('operation parameters override path parameters by name and location', async () => {
    const entries = await extractApiEntries({
      slug: 'api',
      label: 'API',
      source: {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/pets/{petId}': {
            parameters: [
              { name: 'petId', in: 'path', required: true, description: 'Path-level ID' },
              { name: 'include', in: 'query', description: 'Path-level include' },
            ],
            get: {
              operationId: 'getPet',
              parameters: [{ name: 'petId', in: 'path', required: true, description: 'Operation-level ID' }],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      },
    })

    expect(entries[0]?.endpoint.parameters).toEqual([
      { name: 'petId', in: 'path', required: true, description: 'Operation-level ID' },
      { name: 'include', in: 'query', description: 'Path-level include' },
    ])
  })

  test('distinguishes fallback ids for path parameters and literal segments', async () => {
    const entries = await extractApiEntries({
      slug: 'api',
      label: 'API',
      source: {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/pets/{petId}': { get: { summary: 'Get pet by ID', responses: { '200': { description: 'OK' } } } },
          '/pets/petId': { get: { summary: 'Get literal petId', responses: { '200': { description: 'OK' } } } },
        },
      },
    })

    expect(entries.map((entry) => entry.id)).toEqual(['api/get-pets-by-petid', 'api/get-pets-petid'])
  })

  test('throws on duplicate generated entry ids', async () => {
    expect(
      extractApiEntries({
        slug: 'api',
        label: 'API',
        source: {
          openapi: '3.0.0',
          info: { title: 'Test API', version: '1.0.0' },
          paths: {
            '/pets': { get: { operationId: 'list_pets', responses: { '200': { description: 'OK' } } } },
            '/animals': { get: { operationId: 'list-pets', responses: { '200': { description: 'OK' } } } },
          },
        },
      })
    ).rejects.toThrow('Duplicate OpenAPI entry id "api/list-pets"')
  })

  test('returns generated API entry ids', async () => {
    expect(getApiEntryIds({ slug: 'api', label: 'API', source: fixtureUrl })).resolves.toEqual(petstoreEntryIds)
  })
})
